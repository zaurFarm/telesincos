import os from 'os';
import { runBullMQLoadTest } from './load/loadBullMQ.js';
import { runFloodWaitSimulation } from './telegram/floodWaitSimulation.js';
import { runRedisChaosTest } from './chaos/redisChaos.js';
import { runPostgresChaosTest } from './chaos/postgresChaos.js';
import { runLeaderElectionTest } from './distributed/leaderElectionTest.js';
import { getMetrics, updateSystemMetricsSnapshot } from '../system/metricsExporter.js';

function getSystemStats() {
  const memUsage = process.memoryUsage();
  return {
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
    },
    cpu: os.loadavg()
  };
}

async function printReport() {
  console.log('\n📊 System Stats Report');
  const stats = getSystemStats();
  console.log(`Memory Usage:`, stats.memory);
  console.log(`CPU Load Average (1, 5, 15m):`, stats.cpu);
  
  try {
    await updateSystemMetricsSnapshot();
    const metrics = await getMetrics();
    console.log('\n📈 Prometheus Metrics Snapshot (truncated):');
    console.log(metrics.trim().split('\n').slice(0, 15).join('\n') + '\n...');
  } catch (e: any) {
    console.log('Failed to fetch Prometheus metrics:', e.message);
  }
}

async function main() {
  console.log('🔥 Initializing Enterprise Chaos & Load Testing Suite');
  
  await printReport();

  await runLeaderElectionTest();
  await printReport();

  await runBullMQLoadTest();
  await printReport();

  await runFloodWaitSimulation();
  await printReport();

  await runRedisChaosTest();
  await printReport();

  await runPostgresChaosTest();
  await printReport();

  console.log('\n🏁 All Chaos & Load Tests Completed Successfully.');
  process.exit(0);
}

main().catch(e => {
  console.error('Chaos test runner failed:', e);
  process.exit(1);
});
