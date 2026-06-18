import { Queue, Worker, QueueEvents } from 'bullmq';
import { randomUUID } from 'crypto';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

async function runTest(jobCount: number) {
  const queueName = `load_test_${randomUUID()}`;
  console.log(`\n--- Starting BullMQ Load Test: ${jobCount} jobs ---`);
  console.log(`Queue: ${queueName}`);

  const queue = new Queue(queueName, { connection });
  const queueEvents = new QueueEvents(queueName, { connection });
  
  let processed = 0;
  let failed = 0;
  
  const worker = new Worker(queueName, async (job) => {
    // Process latency includes network overhead to fetch
    // simple job logic
    if (Math.random() < 0.01) {
      throw new Error('Simulated random failure (1%)');
    }
    return { success: true };
  }, { connection, concurrency: 100 });

  worker.on('completed', () => processed++);
  worker.on('failed', () => failed++);

  const enqueueStart = Date.now();
  const jobs = Array.from({ length: jobCount }).map((_, i) => ({
    name: 'testJob',
    data: { id: i, payload: 'x'.repeat(100) }
  }));
  
  await queue.addBulk(jobs);
  const enqueueLatency = Date.now() - enqueueStart;

  const processStart = Date.now();

  await new Promise<void>((resolve) => {
    const timer = setInterval(async () => {
      const counts = await queue.getJobCounts('completed', 'failed');
      const total = counts.completed + counts.failed;
      if (total >= jobCount) {
        clearInterval(timer);
        resolve();
      }
    }, 100);
  });

  const processLatency = Date.now() - processStart;
  const throughput = Math.round((jobCount / processLatency) * 1000);

  console.log(`✅ Enqueue Latency: ${enqueueLatency}ms`);
  console.log(`✅ Processing Latency: ${processLatency}ms`);
  console.log(`✅ Throughput: ${throughput} jobs/sec`);
  console.log(`✅ Processed: ${processed}`);
  console.log(`✅ Failed: ${failed}`);
  
  await worker.close();
  await queueEvents.close();
  await queue.close();
}

export async function runBullMQLoadTest() {
  await runTest(100);
  await runTest(1000);
  // remove 5000 and 10000 for faster runner
  connection.disconnect();
}
