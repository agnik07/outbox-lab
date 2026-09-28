import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'db.json');
const defaultData = { emails: [], settings: { rateLimitMax: 5, rateLimitDurationMs: 1000, concurrency: 5 } };

let db;

export async function initDb() {
  db = await JSONFilePreset(dbPath, defaultData);
  await db.read();
  db.data ||= defaultData;
  await db.write();
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export async function createEmail(emailData) {
  const database = getDb();
  const newEmail = {
    id: emailData.id || `email_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    recipient: emailData.recipient,
    subject: emailData.subject,
    body: emailData.body,
    scheduledAt: emailData.scheduledAt,
    delayMs: emailData.delayMs || 0,
    status: emailData.status || 'SCHEDULED',
    jobId: emailData.jobId || null,
    sentAt: null,
    etherealUrl: null,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  database.data.emails.push(newEmail);
  await database.write();
  return newEmail;
}

export async function updateEmailStatus(id, { status, sentAt, etherealUrl, errorMessage, jobId }) {
  const database = getDb();
  const email = database.data.emails.find((e) => e.id === id);
  if (!email) return null;

  if (status !== undefined) email.status = status;
  if (sentAt !== undefined) email.sentAt = sentAt;
  if (etherealUrl !== undefined) email.etherealUrl = etherealUrl;
  if (errorMessage !== undefined) email.errorMessage = errorMessage;
  if (jobId !== undefined) email.jobId = jobId;

  email.updatedAt = new Date().toISOString();
  await database.write();
  return email;
}

export function getEmailById(id) {
  const database = getDb();
  return database.data.emails.find((e) => e.id === id) || null;
}

export function getAllEmails({ status, search, limit = 100, offset = 0 } = {}) {
  const database = getDb();
  let list = [...database.data.emails];

  if (status) {
    list = list.filter((e) => e.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (e) => e.recipient.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q)
    );
  }

  // Sort descending by createdAt
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = list.length;
  const paginated = list.slice(offset, offset + limit);

  return { total, emails: paginated };
}

export function getStats() {
  const database = getDb();
  const emails = database.data.emails;

  const total = emails.length;
  const scheduled = emails.filter((e) => e.status === 'SCHEDULED').length;
  const sent = emails.filter((e) => e.status === 'SENT').length;
  const failed = emails.filter((e) => e.status === 'FAILED').length;
  const cancelled = emails.filter((e) => e.status === 'CANCELLED').length;

  return {
    total,
    scheduled,
    sent,
    failed,
    cancelled
  };
}

export function getScheduledEmails() {
  const database = getDb();
  return database.data.emails.filter((e) => e.status === 'SCHEDULED');
}
