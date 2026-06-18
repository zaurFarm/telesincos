import { logger } from './logger.js';
import { aiWorker } from '../workers/aiWorker.js';
import { tgWorker } from '../workers/tgWorker.js';

export const healthScore = {
  eventLoop: 100,
  queueLoad: 100,
  workerStability: 100,
  overall: 100
};

export const regulationState = {
  currentConcurrency: 10,
  dropRate: 0,
  status: 'stable' as 'stable' | 'degraded' | 'critical',
  isThrottled: false,
};

const DEGRADE_THRESHOLD = 80;
const CRITICAL_THRESHOLD = 50;
const RECOVER_STABLE_THRESHOLD = 90;
const RECOVER_DEGRADED_THRESHOLD = 60;

let lastAdjustmentTime = 0;
const MIN_ADJUST_INTERVAL = 30000;

export function calculateOverallHealth() {
  healthScore.overall = (healthScore.eventLoop + healthScore.queueLoad + healthScore.workerStability) / 3;
  return healthScore.overall;
}

export function evaluateThrottling() {
  const score = calculateOverallHealth();
  const now = Date.now();

  if (now - lastAdjustmentTime < MIN_ADJUST_INTERVAL) {
    return;
  }

  let stateChanged = false;

  if (regulationState.status === 'stable' && score < DEGRADE_THRESHOLD) {
    regulationState.status = 'degraded';
    stateChanged = true;
  } else if (regulationState.status === 'degraded' && score < CRITICAL_THRESHOLD) {
    regulationState.status = 'critical';
    stateChanged = true;
  } else if (regulationState.status === 'critical' && score > RECOVER_DEGRADED_THRESHOLD) {
    regulationState.status = 'degraded';
    stateChanged = true;
  } else if (regulationState.status === 'degraded' && score > RECOVER_STABLE_THRESHOLD) {
    regulationState.status = 'stable';
    stateChanged = true;
  }

  if (!stateChanged && Math.random() > 0.1) {
    return;
  }

  lastAdjustmentTime = now;

  if (regulationState.status === 'critical') {
    regulationState.currentConcurrency = Math.max(1, Math.floor(regulationState.currentConcurrency * 0.5));
    regulationState.dropRate = 0.3;
    regulationState.isThrottled = true;
    logger.warn({ type: 'auto_regulation', message: 'CRITICAL: Severe throttling applied', score });
    
    if ((globalThis as any).__triggerPreventiveRecovery) {
      (globalThis as any).__triggerPreventiveRecovery();
    }
  } else if (regulationState.status === 'degraded') {
    regulationState.currentConcurrency = Math.max(2, Math.floor(regulationState.currentConcurrency * 0.8));
    regulationState.dropRate = 0.05; 
    regulationState.isThrottled = true;
    logger.warn({ type: 'auto_regulation', message: 'DEGRADED: Mild throttling applied', score });
  } else {
    if (regulationState.currentConcurrency < 20) {
      regulationState.currentConcurrency = Math.min(20, regulationState.currentConcurrency + 1);
    }
    regulationState.dropRate = 0;
    regulationState.isThrottled = false;
    logger.info({ type: 'auto_regulation', message: 'STABLE: Recovering concurrency', score });
  }

  aiWorker.concurrency = Math.min(regulationState.currentConcurrency, 2); // Cap AI worker to 2 to prevent event loop blocking
  tgWorker.concurrency = regulationState.currentConcurrency;
}

// Predictors
let eventLoopSamples: number[] = [];
export function trackEventLoopLag(lag: number) {
  eventLoopSamples.push(lag);
  if (eventLoopSamples.length > 20) eventLoopSamples.shift();
  const avg = eventLoopSamples.reduce((a, b) => a + b, 0) / eventLoopSamples.length;
  if (avg > 200) healthScore.eventLoop = 40;
  else if (avg > 100) healthScore.eventLoop = 70;
  else healthScore.eventLoop = 100;
}

export function trackQueuePressure(pending: number, failed: number) {
  const pressure = pending + failed * 2;
  if (pressure > 500) healthScore.queueLoad = 30;
  else if (pressure > 200) healthScore.queueLoad = 60;
  else healthScore.queueLoad = 100;
}

let workerFailures = 0;
let workerRestarts = 0;
export function reportWorkerFailure() { workerFailures++; }
export function reportWorkerRestart() { workerRestarts++; }
export function evaluateWorkerHealth() {
  const ratio = workerFailures / (workerRestarts + 1);
  if (ratio > 2) healthScore.workerStability = 40;
  else if (ratio > 1) healthScore.workerStability = 70;
  else healthScore.workerStability = 100;
}

let lastTick = Date.now();
export function startAutoRegulation() {
  setInterval(() => {
    const now = Date.now();
    const lag = now - lastTick - 5000;
    lastTick = now;
    trackEventLoopLag(Math.max(0, lag));

    evaluateWorkerHealth();
    evaluateThrottling();
  }, 5000);
}

export function checkLoadShedding(): boolean {
  // Returns true if the request/task should be dropped based on dropRate
  if (!regulationState.isThrottled) return false;
  return Math.random() < regulationState.dropRate;
}
