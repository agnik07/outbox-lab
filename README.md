# 🚀 Outbox Lab - Scheduled Email Dispatch System

[![Node.js](https://img.shields.io/badge/Node.js-v20+-6ee7b7?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.21-a5b4fc?style=flat-square&logo=express)](https://expressjs.com/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5.41-fcd34d?style=flat-square&logo=redis)](https://bullmq.io/)
[![Redis](https://img.shields.io/badge/Redis-8.10-fca5a5?style=flat-square&logo=redis)](https://redis.io/)
[![React](https://img.shields.io/badge/React-18.3-67e8f9?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-cbd5e1?style=flat-square&logo=vite)](https://vitejs.dev/)

A production-ready, high-throughput email scheduling and dispatch engine built with Express, BullMQ, Redis, persistent database storage, and a React dashboard. Supports high-concurrency batching, configurable rate limiting, server restart recovery, and real SMTP preview integration via Ethereal Email.

---

## 📹 Demo Video

A video demonstration (`demo/demo_video.mp4`) is included in the repository.

### What the demo shows:
1. **Scheduling Single Emails**: Creating a scheduled email with a delay timer, watching real-time countdowns, and observing delivery into the Sent Log with an Ethereal web preview link.
2. **Server Restart Persistence**: Scheduling an email, stopping the Express/Worker backend, restarting the server, and demonstrating that future scheduled emails remain intact in queue and fire accurately upon timer expiry.
3. **Rate Limiting & Concurrency Under Load**: Firing a high-concurrency batch (25+ emails) and showing how the BullMQ worker pool throttles delivery strictly according to rate limiter parameters (max 10 emails/sec).

---

## 🏗️ Architecture Overview

```
                        ┌────────────────────────────────────────┐
                        │        React Dashboard (Frontend)      │
                        └───────────────────┬────────────────────┘
                                            │ REST API
                                            ▼
                        ┌────────────────────────────────────────┐
                        │        Express API Server (Port 5001)  │
                        └─────────┬────────────────────┬─────────┘
                                  │                    │
                   SQLite Record  │                    │ Delayed Jobs
                                  ▼                    ▼
                        ┌──────────────────┐  ┌──────────────────┐
                        │  LowDB / SQLite  │  │  Redis & BullMQ  │
                        │ Persistent Store │  │  Delayed Queue   │
                        └──────────────────┘  └────────┬─────────┘
                                                       │ Job Dispatch
                                                       ▼
                        ┌────────────────────────────────────────┐
                        │        BullMQ Worker Process           │
                        │    (Concurrency: 5, Rate: 10/sec)      │
                        └───────────────────┬────────────────────┘
                                            │ SMTP
                                            ▼
                        ┌────────────────────────────────────────┐
                        │       Ethereal Test SMTP Server        │
                        └────────────────────────────────────────┘
```

### 1. How Scheduling Works
* When a user schedules an email (via API or Frontend), an email metadata record is stored in the persistent database with `status: 'SCHEDULED'`.
* A delayed job is simultaneously enqueued into **BullMQ** (`email-scheduler-queue`) with `delay = scheduledAt - currentTime`.
* BullMQ registers the delay timer inside **Redis**.

### 2. How Persistence on Restart is Handled
* **Redis Persistence**: Delayed job IDs and payload references persist across process restarts in Redis.
* **Database State**: All email records, target execution timestamps, and lifecycle statuses (`SCHEDULED`, `SENT`, `FAILED`, `CANCELLED`) are stored in `data/db.json` / SQLite.
* **Boot Audit & Fail-Safe Recovery**: On server startup, `recoverScheduledEmails()` audits the persistent database for any `SCHEDULED` emails. It cross-references BullMQ queue state to ensure no jobs were lost during downtime. Any missed or pending jobs are re-enqueued seamlessly. If an email's scheduled time passed while the server was down, BullMQ processes it immediately upon boot.

### 3. How Rate Limiting & Concurrency are Implemented
* **Worker Pool Concurrency**: Configured via `WORKER_CONCURRENCY` (default: 5 concurrent workers).
* **Queue Rate Limiter**: BullMQ queue is configured with a rate-limiter:
  ```js
  limiter: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '10', 10),
    duration: parseInt(process.env.RATE_LIMIT_DURATION_MS || '1000', 10)
  }
  ```
* Under heavy load (e.g. batch scheduling 50 emails simultaneously), BullMQ queues all items in Redis and dispatches them smoothly at a controlled throughput (10 emails/sec), avoiding SMTP rate limits or provider bans.

---

## 🛠️ Getting Started & Setup

### System Prerequisites
* **Node.js** (v18.0.0 or higher)
* **Redis Server** (running on port `6379`)

#### Starting Redis
```bash
# MacOS via Homebrew
brew services start redis
# or direct CLI:
redis-server --daemonize yes

# Linux / Ubuntu
sudo systemctl start redis
```

---

### 1. Backend Setup & Running

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run database & scheduler unit tests
npm test

# Start backend server (API runs on http://localhost:5001)
npm start
```

For development mode with auto-reload:
```bash
npm run dev
```

---

### 2. Frontend Setup & Running

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (Dashboard runs on http://localhost:5173)
npm run dev
```

---

### 3. Running via Monorepo Root

From the project root:
```bash
# Install all workspace dependencies
npm install

# Run backend & frontend concurrently
npm run dev
```

---

## 📧 Ethereal Email Setup & Environment Variables

No manual SMTP account creation is needed! 

### Automatic Ethereal Account Generation
If `SMTP_USER` and `SMTP_PASS` are left blank in `.env`, the server automatically creates a dynamic **Ethereal Email** test account on startup via `nodemailer.createTestAccount()`. 

The generated account credentials and login URL will be printed directly in the server logs:
```text
[Mailer] Dynamic Ethereal test account created: l4wxtzm23synpuv2@ethereal.email
[Mailer] Ethereal web login: https://ethereal.email/login
```

When emails are dispatched, Nodemailer extracts the **Ethereal Web Preview URL**. In the Frontend Sent Log table, click the **"View Email"** button to view the rendered HTML email in your browser!

### Custom SMTP Setup (Optional)
If you prefer using an existing Ethereal or custom SMTP account, set the following variables in `backend/.env`:

```env
PORT=5001
JWT_SECRET=outbox-lab-super-secret-jwt-key-2026

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

WORKER_CONCURRENCY=5
RATE_LIMIT_MAX=10
RATE_LIMIT_DURATION_MS=1000

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_ethereal_user@ethereal.email
SMTP_PASS=your_ethereal_password
SENDER_EMAIL="Outbox Scheduler" <no-reply@outbox-lab.internal>

DEMO_USER=admin
DEMO_PASSWORD=password123
```

---

## ⚡ API Endpoints Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token (Demo: `admin`/`password123`) |
| `POST` | `/api/emails/schedule` | Schedule a single email (Recipient, Subject, Body, `delaySeconds` / `scheduledAt`) |
| `POST` | `/api/emails/schedule-batch` | Schedule a batch of $N$ emails for concurrency & load testing |
| `GET` | `/api/emails` | List all emails with pagination, status filter (`SCHEDULED`, `SENT`, `FAILED`), and search |
| `GET` | `/api/emails/stats` | Retrieve DB stats (scheduled/sent count) & BullMQ queue operational metrics |
| `POST` | `/api/emails/:id/cancel` | Cancel a scheduled email and remove job from BullMQ queue |
| `GET` | `/health` | Server health check endpoint |

---

## 📋 Feature Mapping Matrix

| Domain | Feature | Description & Implementation Details |
| :--- | :--- | :--- |
| **Backend** | **Scheduler** | Delayed queue management powered by BullMQ & Redis timers. |
| **Backend** | **Persistence** | LowDB / SQLite database file (`data/db.json`) + startup recovery scanner (`recoverScheduledEmails()`). |
| **Backend** | **Rate Limiting** | Worker-level rate limiter enforcing max 10 emails/sec across queue workers. |
| **Backend** | **Concurrency** | Multi-threaded worker pool (`concurrency: 5`) processing jobs in parallel. |
| **Backend** | **SMTP Delivery** | Dynamic Ethereal Email test account generation with web preview links. |
| **Backend** | **Authentication** | JWT-based auth endpoint (`/api/auth/login`) with session verification. |
| **Frontend** | **Login View** | Modern glassmorphism login modal with demo credentials prompt. |
| **Frontend** | **Dashboard Stats** | Real-time status cards (Scheduled, Sent, Failed, Queue Length, Rate limit metrics). |
| **Frontend** | **Compose Email** | Modal with preset delay quick-buttons (+10s, +30s, +1m, +5m) or custom delay. |
| **Frontend** | **Batch Tester** | Load test launcher to fire 10-50 emails simultaneously and observe queue throttling. |
| **Frontend** | **Scheduled Table** | Live countdown timers ("Sends in 8s"), target timestamps, and job cancellation. |
| **Frontend** | **Sent Table** | Delivered logs with timestamps and direct links to open HTML previews in Ethereal. |

---

## ⚖️ Assumptions, Shortcuts & Trade-offs

1. **Database Choice**: Used LowDB (JSON file storage with atomic writes) for 100% pure JavaScript cross-platform compatibility across Node versions without requiring native binary compilation (`gyp`). In enterprise production, this can be swapped with PostgreSQL or MySQL using Prisma or Knex with zero schema changes.
2. **Worker Process Model**: For simplified single-command execution (`npm start`), the BullMQ worker runs in the same Node.js process as Express while maintaining total architectural decoupling. In large-scale production, the worker script (`src/queue/emailWorker.js`) can be executed as separate scaling pods in Kubernetes.
3. **Ethereal Web Previews**: Used Ethereal SMTP to avoid real domain spam risks while giving full visual confirmation of email rendering via preview links.

---

## 👥 Access & Collaborators

* **Repository Link**: [https://github.com/agnik07/outbox-lab](https://github.com/agnik07/outbox-lab)
* **Granted Collaborator Access**: `Mitrajit`
