import test from 'node:test';
import assert from 'node:assert';
import { initDb, createEmail, updateEmailStatus, getEmailById, getStats } from '../src/db/index.js';

test('Database Operations', async (t) => {
  await t.test('should initialize DB and create email', async () => {
    await initDb();
    const email = await createEmail({
      recipient: 'test@example.com',
      subject: 'Test Subject',
      body: 'Test Body',
      scheduledAt: new Date().toISOString(),
      status: 'SCHEDULED'
    });

    assert.ok(email.id);
    assert.strictEqual(email.recipient, 'test@example.com');
    assert.strictEqual(email.status, 'SCHEDULED');
  });

  await t.test('should update email status', async () => {
    const email = await createEmail({
      recipient: 'update@example.com',
      subject: 'Update Subject',
      body: 'Update Body',
      scheduledAt: new Date().toISOString(),
      status: 'SCHEDULED'
    });

    const updated = await updateEmailStatus(email.id, {
      status: 'SENT',
      sentAt: new Date().toISOString(),
      etherealUrl: 'https://ethereal.email/message/test'
    });

    assert.strictEqual(updated.status, 'SENT');
    assert.ok(updated.sentAt);
    assert.strictEqual(updated.etherealUrl, 'https://ethereal.email/message/test');
  });

  await t.test('should calculate stats correctly', async () => {
    const stats = getStats();
    assert.ok(stats.total >= 2);
    assert.ok(stats.sent >= 1);
  });
});
