import express from 'express';
import {
  createEmail,
  getAllEmails,
  getEmailById,
  updateEmailStatus,
  getStats
} from '../db/index.js';
import { scheduleEmailJob, cancelEmailJob, getQueueMetrics } from '../queue/emailQueue.js';
import { getEtherealAccountInfo } from '../services/mailer.js';

const router = express.Router();

/**
 * Schedule a single email
 */
router.post('/schedule', async (req, res) => {
  try {
    const { recipient, subject, body, scheduledAt, delaySeconds } = req.body;

    if (!recipient || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, subject, and body are required fields.'
      });
    }

    let targetTime;
    if (scheduledAt) {
      targetTime = new Date(scheduledAt);
    } else if (delaySeconds !== undefined) {
      targetTime = new Date(Date.now() + Math.max(0, parseInt(delaySeconds, 10)) * 1000);
    } else {
      targetTime = new Date();
    }

    const emailRecord = await createEmail({
      recipient,
      subject,
      body,
      scheduledAt: targetTime.toISOString(),
      delayMs: Math.max(0, targetTime.getTime() - Date.now()),
      status: 'SCHEDULED'
    });

    // Enqueue job in BullMQ
    const job = await scheduleEmailJob(emailRecord);
    await updateEmailStatus(emailRecord.id, { jobId: job.id });

    return res.status(201).json({
      success: true,
      message: 'Email scheduled successfully',
      email: { ...emailRecord, jobId: job.id }
    });
  } catch (error) {
    console.error('[Route] Error scheduling email:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Schedule batch emails for load & rate limit testing
 */
router.post('/schedule-batch', async (req, res) => {
  try {
    const { items, count = 10, delaySeconds = 5, recipient = 'test@example.com' } = req.body;

    const scheduledList = [];

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const targetTime = item.scheduledAt
          ? new Date(item.scheduledAt)
          : new Date(Date.now() + Math.max(0, parseInt(item.delaySeconds || delaySeconds, 10)) * 1000);

        const record = await createEmail({
          recipient: item.recipient || recipient,
          subject: item.subject || `Batch Test Email`,
          body: item.body || `This is a batch test email payload.`,
          scheduledAt: targetTime.toISOString(),
          delayMs: Math.max(0, targetTime.getTime() - Date.now()),
          status: 'SCHEDULED'
        });

        const job = await scheduleEmailJob(record);
        await updateEmailStatus(record.id, { jobId: job.id });
        scheduledList.push({ ...record, jobId: job.id });
      }
    } else {
      // Auto-generate batch of size `count`
      for (let i = 1; i <= count; i++) {
        const targetTime = new Date(Date.now() + Math.max(0, parseInt(delaySeconds, 10)) * 1000);

        const record = await createEmail({
          recipient: `loadtest_${i}@example.com`,
          subject: `⚡ Load Test Email #${i}`,
          body: `Simulated high-concurrency email batch item #${i} generated at ${new Date().toISOString()}`,
          scheduledAt: targetTime.toISOString(),
          delayMs: Math.max(0, targetTime.getTime() - Date.now()),
          status: 'SCHEDULED'
        });

        const job = await scheduleEmailJob(record);
        await updateEmailStatus(record.id, { jobId: job.id });
        scheduledList.push({ ...record, jobId: job.id });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Successfully scheduled batch of ${scheduledList.length} emails`,
      count: scheduledList.length,
      emails: scheduledList
    });
  } catch (error) {
    console.error('[Route] Error scheduling batch emails:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * List all emails with filtering, pagination, and search
 */
router.get('/', (req, res) => {
  try {
    const { status, search, limit = 100, offset = 0 } = req.query;
    const result = getAllEmails({
      status,
      search,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get dashboard stats & queue operational metrics
 */
router.get('/stats', async (req, res) => {
  try {
    const dbStats = getStats();
    const queueMetrics = await getQueueMetrics();
    const etherealInfo = getEtherealAccountInfo();

    return res.json({
      success: true,
      stats: dbStats,
      queue: queueMetrics,
      config: {
        workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '10', 10),
        rateLimitDurationMs: parseInt(process.env.RATE_LIMIT_DURATION_MS || '1000', 10)
      },
      ethereal: etherealInfo ? { user: etherealInfo.user, webLogin: 'https://ethereal.email/login' } : null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Cancel a scheduled email
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const email = getEmailById(id);

    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    if (email.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel email with status '${email.status}'`
      });
    }

    if (email.jobId) {
      await cancelEmailJob(email.jobId);
    }

    const updated = await updateEmailStatus(id, { status: 'CANCELLED' });

    return res.json({
      success: true,
      message: 'Scheduled email cancelled successfully',
      email: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
