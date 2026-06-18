import { tgQueue } from '../../queue/index.js';
import { pickAccount } from '../../telegram/accountRouter.js';
import { canDoProactive } from '../../antiban/adaptiveLimits.js';
import { logger } from '../../system/logger.js';
import { createSpan } from '../../system/tracer.js';

export async function dispatchMessage(data: any) {
  const span = createSpan('dispatch', data.span);
  data.span = span;

  // If no account is specified, use the router to pick one
  if (!data.accountId || data.accountId === 'farm') {
      const chatIdStr = String(data.chatId || '');
      const chatType = chatIdStr.startsWith('-') ? 'group' : 'private';

      const account = await pickAccount({
          isReply: !!data.isReply,
          previousAccountId: data.previousAccountId,
          isColdLead: data.isColdLead,
          chatType
      });

      if (!account && data.accountId !== 'farm') {
        // Fallback to main if we can't find a farm account and it's not strictly farm
        data.accountId = 'main';
      } else if (account) {
        if (data.isColdLead) {
          const allowed = await canDoProactive(String(account.id));
          if (!allowed) {
            logger.warn({ 
              type: 'dispatch_rejected',
              reason: 'PROACTIVE_LIMIT_REACHED',
              accountId: account.id,
              ...span
            });
            return; // Drop message
          }
        }
        
        data.accountId = account.id;
        // Apply behavior profile immediately or pass it to workers
        if (account.behavior_profile) {
           data.behaviorProfile = typeof account.behavior_profile === 'string' 
             ? JSON.parse(account.behavior_profile) : account.behavior_profile;
        }
      }
  }

  logger.info({
    type: 'dispatch',
    accountId: data.accountId,
    chatId: data.chatId,
    delay: data.delay,
    ...span
  });

  await tgQueue.add('sendMessage', data, {
    delay: data.delay || 0,
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    jobId: `${data.userId}-${Date.now()}` // Idempotency key
  });
}
