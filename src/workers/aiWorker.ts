import { Worker } from '../queue/bullmq.js';
import { connection } from '../queue/redis.js';

import { preprocess } from '../ai/pipeline/preprocess.js';
import { analyze } from '../ai/pipeline/analyze.js';
import { decide } from '../ai/pipeline/decide.js';
import { generate } from '../ai/pipeline/generate.js';
import { postprocess } from '../ai/pipeline/postprocess.js';

import { getState, updateState } from '../ai/state/stateManager.js';
import { dispatchMessage } from '../ai/services/dispatchService.js';
import { getFeatureFlags } from '../ai/services/featureFlags.js';
import { isRateLimited } from '../ai/services/rateLimiter.js';
import { logDecision } from '../ai/services/decisionLogger.js';
import { wantsHuman, markAsHumanNeeded, needsHuman } from '../ai/handoff.js';
import { saveTrainingMessage } from '../ai/memory/retrieval.js';
import { logMetric } from '../ai/services/metrics.js';
import { scheduleFollowUp } from '../ai/pipeline/followups.js';
import { getLeadByUserIdAndChatId } from '../../server.js';
import { db } from '../db.js';
import { shouldReply } from '../ai/behaviorAnalyzer.js';
import { updateConversationState } from '../ai/memory/engines.js';
import { logger } from '../system/logger.js';
import { createSpan } from '../system/tracer.js';

import { idempotency } from '../system/idempotency.js';
import { runWithContext, createContext } from '../system/context.js';

import { loadControl } from '../system/loadControl.js';
import { metrics } from '../system/metrics.js';

export const aiWorker = new Worker('ai', async (job) => {
  const { ctx: incomingCtx, payload: input } = job.data;
  
  // Use job.data.ctx or create a new one based on input
  const ctx = incomingCtx || createContext(input.workspaceId || 'tenant_1');
  if (job.id) ctx.jobId = job.id;

  return runWithContext(ctx, async () => {
    // 0. IDEMPOTENCY CHECK
    const idempotencyKey = `ai_job:${ctx.traceId}`;
    if (!(await idempotency.ensure(idempotencyKey))) {
        logger.info({ type: 'ai_worker_skip', reason: 'duplicate_job', key: idempotencyKey, ctx });
        return;
    }

    // 0.1 LOAD CONTROL & FAIRNESS
    const canRun = await loadControl.canExecute(ctx, 'ai_task', { ai_task: 15 });
    if (!canRun) {
        logger.warn({ type: 'ai_worker_delay', reason: 'load_control_throttle', ctx });
        throw new Error('THROTTLE: tenant_capacity_reached');
    }

    // Reconstruct span from input, or create a new trace if it's the beginning
    const span = createSpan('ai_generate', input.span);
    const start = Date.now();

    try {
      // Integration: Track attempts
      metrics.track(ctx, 'ai.generation_attempt', 1, { model: input.model || 'ollama' });
    // 0. CHECK HUMAN HANDOFF
    if (await needsHuman(input.userId)) {
        logger.info({ type: 'ai_worker_abort', reason: 'needs_human', userId: input.userId, ...span });
        return;
    }

    if (wantsHuman(input.text)) {
        await markAsHumanNeeded(input.userId);
        await dispatchMessage({
            chatId: input.chatId,
            userId: input.userId,
            text: 'Ок, передаю диалог живому менеджеру ⏳',
            delay: 1000,
            meta: { strategy: 'handoff' },
            span
        });
        return;
    }

    // Capture User Training Data (Background)
    saveTrainingMessage(String(input.chatId), String(input.userId), 'user', input.text).catch(e => logger.error({ type: 'training_save_error', error: e.message, ...span }));

    // 0.1 CHECK FEATURE FLAGS & RATE LIMITS
    const flags = await getFeatureFlags();
    if (flags.aiRepliesDisabled) return;
    if (input.isGroup && flags.proactiveDisabled) return;

    if (await isRateLimited(input.userId, 15000)) {
      logger.warn({ type: 'rate_limit', message: 'Dropped AI reply for user', userId: input.userId, ...span });
      return;
    }

    if (input.workspaceId) {
      const { getUsage, getUserPlan, PLANS } = await import('../ai/services/usage.js');
      const usage = await getUsage(input.workspaceId);
      const planName = await getUserPlan(input.workspaceId);
      const limits = PLANS[planName];

      if (usage.messages >= limits.messages) {
        logger.warn({ type: 'usage_limit', message: `Exceeded messages limit for workspace ${input.workspaceId}`, plan: planName, ...span });
        return;
      }
    }

    // 1. PREPROCESS
    const pre = await preprocess(input);
    if (pre.drop) return;

    // 2. LOAD STATE
    const state = await getState(input.userId, input.chatId);

    // Track variant reply performance
    if (state.messageCount > 0) {
      const { recordReplyToVariant } = await import('../ai/evolution.js');
      await recordReplyToVariant(input.userId);
      
      if (state.lastAccountId) {
         const { logAccountEvent } = await import('../farm/accountManager.js');
         await logAccountEvent(state.lastAccountId, 'reply');
      }
    }

    // 3. ANALYZE
    const analysis = await analyze(input, state);
    
    const { computeLeadScore } = await import('../ai/leadScoring.js');
    const hasReplied = state.messageCount > 0;
    const computedScore = computeLeadScore(input.text, state.contextArray || [], hasReplied);
    state.leadScore = computedScore; // pass forward

    if (analysis.stage === 'ready' || input.text.toLowerCase().includes('беру') || input.text.toLowerCase().includes('заберу')) {
        await logMetric({ userId: input.userId, chatId: input.chatId, event: 'lead_ready' });
    }

    // 4. DECIDE
    const decision = await decide({ input, state, analysis });
    
    // We log even if shouldReply is false to track decisions
    await logDecision({
      userId: input.userId,
      input: input.text,
      riskLevel: pre.risk?.risk || 'low',
      intent: analysis.intent,
      emotion: analysis.emotion,
      strategy: decision.strategy || 'ignore',
      replyText: decision.shouldReply ? '...' /* populated later */ : '(ignored)',
      delayMs: decision.delay || 0,
      leadScore: state.leadScore || 0
    });

    if (!decision.shouldReply) {
       logger.info({ type: 'ai_decision', action: 'ignore_message', strategy: decision.strategy, ...span, userId: input.userId });
       return;
    }
    
    if (!shouldReply(state.behavior)) {
      logger.info({ type: 'ai_decision', action: 'behavior_skip', message: 'Skipped reply due to human behavior probabilities', userId: input.userId, ...span });
      return;
    }

    // 5. GENERATE
    const reply = await generate({
      input,
      state,
      decision,
      analysis
    });

    if (!reply) return;

    // Update conversation state 
    await updateConversationState(String(input.chatId), String(analysis.stage || 'qualification'), String(analysis.intent || 'unknown'));

    // 6. POSTPROCESS
    const final = await postprocess(reply, state, decision);

    const { isMessageRisky } = await import('../system/globalBrain.js');
    if (await isMessageRisky(final.text)) {
        logger.warn({ type: 'system', message: `Generated risky message blocked`, text: final.text, ...span });
        return;
    }

    const { canSendGlobalMessage } = await import('../system/limiter.js');
    if (!(await canSendGlobalMessage())) {
        logger.warn({ type: 'system', message: `Global limit reached or system paused. Skipping message.`, ...span });
        return;
    }

    await logMetric({
      userId: input.userId,
      chatId: input.chatId,
      event: 'ai_reply',
      meta: {
        strategy: decision.strategy,
        trustScore: state.trustScore,
        price: decision.finalPrice,
        experimentId: decision.experimentId
      }
    });

    if (decision.experimentId) {
      const { logExperimentMetric } = await import('../ai/services/experiments.js');
      await logExperimentMetric({
        userId: input.userId,
        experimentId: decision.experimentId,
        strategy: decision.strategy,
        replied: true,
        converted: analysis.stage === 'ready' || final.text.includes('беру'),
        revenue: decision.finalPrice || 0
      });
    }

    // Update log with actual generated text and delay
    await logDecision({
      userId: input.userId,
      input: input.text,
      riskLevel: pre.risk?.risk || 'low',
      intent: analysis.intent,
      emotion: analysis.emotion,
      strategy: decision.strategy || 'ignore',
      replyText: final.text,
      delayMs: final.delay,
      leadScore: state.leadScore || 0
    });

    logger.info({
      type: 'ai_decision',
      action: 'scale_up', // Contextual example
      strategy: decision.strategy,
      confidence: 0.9,
      leadScore: state.leadScore,
      userId: input.userId,
      ...span
    });

    // Fire off async profile syncing
    const { syncUserProfiles } = await import('../ai/memory/engines.js');
    syncUserProfiles(String(input.userId), String(input.chatId)).catch(e => logger.error({ type: 'profile_sync_error', error: e.message, ...span }));

    // 7. DISPATCH
    let cumulativeDelay = final.delay;
    const dispatchOpts = {
      isColdLead: state.messageCount === 1,
      isReply: state.messageCount > 1,
      previousAccountId: state.lastAccountId,
      leadScore: state.leadScore || 0,
      span
    };

    if (final.isSplit && final.messages) {
       for (const msg of final.messages) {
          cumulativeDelay += msg.delay;
          await dispatchMessage({
            chatId: input.chatId,
            userId: input.userId,
            text: msg.text,
            delay: cumulativeDelay,
            meta: { ...final.meta, typingTime: msg.typingTime },
            ...dispatchOpts
          });
       }
    } else {
      await dispatchMessage({
        chatId: input.chatId,
        userId: input.userId,
        text: final.text,
        delay: final.delay,
        meta: final.meta,
        ...dispatchOpts
      });
    }

    // 8. UPDATE STATE
    await updateState({
      ...state,
      lastInteractionAt: Date.now()
    });

    const existingLead = await getLeadByUserIdAndChatId(String(input.userId), String(input.chatId));
    if (existingLead) {
      // ... same logic ...
    }

    const duration = Date.now() - start;
    metrics.track(ctx, 'ai.generation_success', 1, { duration });
    metrics.track(ctx, 'ai.latency', duration);

    } catch (err: any) {
      metrics.track(ctx, 'ai.generation_failure', 1, { error: err.message });
      logger.error({ type: 'ai_worker_failure', message: err.message, stack: err.stack, ...span });
      throw err;
    }
  });
}, {
  connection,
  concurrency: 2 // Reduced to 2 to isolate AI heavy loads and prevent event loop blocking
});
