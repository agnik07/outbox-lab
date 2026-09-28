import { Worker } from 'bullmq';
import { QUEUE_NAME, redisConnection, scheduleEmailJob } from './emailQueue.js';
import { getEmailById, updateEmailStatus, getScheduledEmails } from '../db/index.js';
import { sendMail } from '../services/mailer.js';

let worker = null;

export function initWorker() {
  const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);
  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '10', 10);
  const rateLimitDurationMs = parseInt(process.env.RATE_LIMIT_DURATION_MS || '1000', 10);

  console.log(`[Worker] Initializing worker with Concurrency=${concurrency}, RateLimiter=${rateLimitMax} jobs per ${rateLimitDurationMs}ms`);

  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { emailId } = job.data;
      console.log(`[Worker] Processing email job ID: ${job.id} (EmailId: ${emailId})`);

      const email = getEmailById(emailId);
      if (!email) {
        console.warn(`[Worker] Email record not found for ID: ${emailId}`);
        return;
      }

      if (email.status === 'CANCELLED') {
        console.log(`[Worker] Email ${emailId} was cancelled. Skipping.`);
        return;
      }

      try {
        const { testUrl } = await sendMail({
          to: email.recipient,
          subject: email.subject,
          body: email.body
        });

        await updateEmailStatus(emailId, {
          status: 'SENT',
          sentAt: new Date().toISOString(),
          etherealUrl: testUrl
        });

        console.log(`[Worker] Successfully sent email ${emailId}`);
      } catch (error) {
        console.error(`[Worker] Failed to send email ${emailId}:`, error.message);
        await updateEmailStatus(emailId, {
          status: 'FAILED',
          errorMessage: error.message
        });
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency,
      limiter: {
        max: rateLimitMax,
        duration: rateLimitDurationMs
      }
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Internal worker error:', err.message);
  });

  return worker;
}

/**
 * Server boot audit & recovery procedure:
 * Checks for any SCHEDULED emails in SQLite that are missing from BullMQ or were missed during server downtime,
 * and re-schedules them in BullMQ seamlessly.
 */
export async function recoverScheduledEmails() {
  try {
    const scheduledEmails = getScheduledEmails();
    if (scheduledEmails.length === 0) {
      console.log('[Recovery] No scheduled emails requiring recovery.');
      return;
    }

    console.log(`[Recovery] Auditing ${scheduledEmails.length} scheduled email(s) from persistent database...`);
    let recoveredCount = 0;

    for (const email of scheduledEmails) {
      // Re-schedule in queue (BullMQ idempotently handles delay / duplicate job IDs)
      await scheduleEmailJob(email);
      recoveredCount++;
    }

    console.log(`[Recovery] Successfully restored ${recoveredCount} scheduled email job(s) to queue.`);
  } catch (err) {
    console.error('[Recovery] Error during scheduled emails recovery:', err.message);
  }
}
