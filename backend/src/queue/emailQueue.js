import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisConnection = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false
});

redisConnection.on('connect', () => {
  console.log(`[Redis] Connected successfully to ${redisHost}:${redisPort}`);
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

export const QUEUE_NAME = 'email-scheduler-queue';

export const emailQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection
});

/**
 * Schedule an email job in BullMQ
 */
export async function scheduleEmailJob(emailRecord) {
  const now = Date.now();
  const scheduledTime = new Date(emailRecord.scheduledAt).getTime();
  const delay = Math.max(0, scheduledTime - now);

  const job = await emailQueue.add(
    'send-email',
    { emailId: emailRecord.id },
    {
      jobId: emailRecord.id,
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 1000,
      removeOnFail: 1000
    }
  );

  console.log(`[Queue] Scheduled email ${emailRecord.id} to send in ${Math.round(delay / 1000)}s (JobId: ${job.id})`);
  return job;
}

/**
 * Cancel a scheduled email job from BullMQ queue
 */
export async function cancelEmailJob(jobId) {
  try {
    const job = await emailQueue.getJob(jobId);
    if (job) {
      await job.remove();
      console.log(`[Queue] Removed job ${jobId} from queue`);
      return true;
    }
  } catch (err) {
    console.error(`[Queue] Failed to remove job ${jobId}:`, err.message);
  }
  return false;
}

/**
 * Fetch detailed metrics about queue state
 */
export async function getQueueMetrics() {
  try {
    const [waiting, delayed, active, completed, failed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getDelayedCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount()
    ]);

    return {
      waiting,
      delayed,
      active,
      completed,
      failed,
      total: waiting + delayed + active
    };
  } catch (err) {
    console.error('[Queue] Error fetching metrics:', err.message);
    return { waiting: 0, delayed: 0, active: 0, completed: 0, failed: 0, total: 0 };
  }
}
