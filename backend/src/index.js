import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from './db/index.js';
import { initMailer } from './services/mailer.js';
import { initWorker, recoverScheduledEmails } from './queue/emailWorker.js';

import authRoutes from './routes/authRoutes.js';
import emailRoutes from './routes/emailRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Route registrations
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

async function startServer() {
  try {
    console.log('--------------------------------------------------');
    console.log('🚀 Starting Outbox Lab Email Scheduler Server...');
    console.log('--------------------------------------------------');

    // 1. Initialize persistent storage
    await initDb();
    console.log('[Init] Database initialized successfully.');

    // 2. Initialize Nodemailer / Ethereal Mailer
    await initMailer();

    // 3. Initialize BullMQ worker pool
    initWorker();

    // 4. Run recovery scan for any pending scheduled emails in DB
    await recoverScheduledEmails();

    // 5. Start listening
    const server = app.listen(PORT, () => {
      console.log(`[Server] Express API server listening on http://localhost:${PORT}`);
      console.log(`[Server] Healthcheck endpoint: http://localhost:${PORT}/health`);
      console.log('--------------------------------------------------');
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Server] Fatal error during startup:', error);
    process.exit(1);
  }
}

startServer();
