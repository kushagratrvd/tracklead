# TrackLead — Modern Sales Lead Management Platform

**TrackLead** is a production-grade full-stack lead management platform designed for sales teams. It includes a public lead capture landing page, an authenticated dashboard with role-based permission controls (Admin and Member roles), lead lifecycle status tracking with state machine validation, timestamped notes threads, audit activity logging, a fully documented REST JSON API with pagination & deterministic filtering, automated Vitest test suite, and Vercel/Neon deployment readiness.

> **Live Build Credit**: Includes mandatory footer credit link reading **"Built for Digital Heroes Training Task"** linking to [digitalheroesco.com](https://digitalheroesco.com).

---

## 🌟 Key Features & Architecture

- **Public Lead Capture (`/`)**: Unauthenticated lead submission form built with `react-hook-form` + Zod schemas, featuring hidden honeypot anti-spam validation (`website_url_hp`) and IP sliding-window rate limiting.
- **Authenticated Dashboard (`/dashboard`)**: Sales pipeline table featuring case-insensitive search (`?q=`) across `name`, `email`, `company`, and `phone`, status filtering (`?status=`), assignee filtering (`?assignedTo=`), skeleton loading, and pagination controls (`hasNext`, `hasPrevious`).
- **Lead Detail & Lifecycle (`/dashboard/leads/[id]`)**: Full lead view with status transition dropdown (state machine enforced), role-aware assignee selector, internal notes thread, and a hand-rolled chronological audit activity timeline.
- **Terminal Reopen Dialog**: Confirmation modal for admins reopening terminal lead states (`won` or `lost` → `contacted`).
- **Role-Based Access Control**:
  - **Admin**: Full access to view all leads, assign/reassign any lead to any user, update status (including terminal state reopening), and post notes.
  - **Member**: Access to view all leads (read-only); full edit & status transition access for assigned leads; ability to self-assign unassigned leads.
- **Feature-Folder Modular Architecture (`/features`)**: Thin API route handlers (~15 lines) delegating all domain logic and atomic database transactions (`db.transaction`) to domain feature modules (`features/leads`, `features/auth`, `features/activity`).
- **Standardized API Envelopes**:
  - Success envelope: `{ data: T, meta?: { page, limit, total, totalPages, hasNext, hasPrevious } }`
  - Error envelope: `{ error: { message, code, details? } }`

---

## 🔐 Seeded Credentials for Testing

Run `pnpm db:seed` (or run seed against Neon) to populate default test accounts:

| Role | Email | Password | Permissions Summary |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@digitalheroes.com` | `Admin123!` | Full access across all leads, reassignments, and reopening terminal states. |
| **Member** | `member@digitalheroes.com` | `Member123!` | Full edit access on assigned leads; self-assignment on unassigned leads; read-only on unassigned/other leads. |

*Quick 1-click Demo Fill buttons are available directly on the `/login` screen.*

---

## 📋 RACI & Permission Matrix

| Role | Public Lead Capture | Lead Visibility & Search | Update Status (Allowed Transitions) | Reopen Terminal States (`won`/`lost` → `contacted`) | Assign / Reassign Leads | Add Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Public / Guest** | ✅ Yes (Honeypot + IP Rate Limited) | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Member** | N/A | ✅ View all leads (read-only); full edit access only for assigned leads | ✅ Valid forward transitions on assigned leads | ❌ Forbidden (403) | ✅ Self-assign unassigned leads | ✅ Yes (assigned leads) |
| **Admin** | N/A | ✅ Full Access (all leads) | ✅ Any forward transition | ✅ Allowed | ✅ Assign/reassign to anyone | ✅ Yes (any lead) |

---

## 🔄 Status Transition State Machine Map

Allowed transitions enforced server-side via `canTransition(currentStatus, nextStatus, userRole)`:

```
[new] ──► [contacted] ──► [qualified] ──► [won]  (Terminal)
  │            │               │
  └──► [lost]  └──► [lost]     └──► [lost] (Terminal)
         ▲                           ▲
         │ (Admin Reopen Only)      │ (Admin Reopen Only)
         └───────────────────────────┘
```

- **Forward Transitions**: `new` → `contacted` → `qualified` → `won` / `lost` (allowed for `admin` and `member`).
- **Terminal Reopen**: Reopening `won` or `lost` back to `contacted` is strictly restricted to `admin` role (returns `403 FORBIDDEN` for members).

---

## 🚀 Local Setup Instructions

### 1. Prerequisites
- Node.js 20+
- pnpm / npm
- PostgreSQL database (e.g., [Neon Serverless Postgres](https://neon.tech))

### 2. Environment Variables
Create `.env.local` based on `.env.example`:

```bash
DATABASE_URL="postgresql://user:password@ep-cool-db.us-east-2.aws.neon.tech/tracklead?sslmode=require"
JWT_SECRET="tracklead_super_secret_jwt_key_2026_digitalheroes"
```

### 3. Install Dependencies & Seed Database
```bash
pnpm install
pnpm db:seed
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🛡️ Anti-Abuse & Rate Limiter Disclosure Note

Public lead capture (`POST /api/public/leads`) implements two anti-abuse layers:
1. **Honeypot Field**: A hidden form input (`website_url_hp`). Submissions with filled honeypots are rejected immediately with `400 Bad Request`.
2. **Sliding-Window IP Rate Limiter (`lib/api/rate-limit.ts`)**: Limits submissions to 5 requests per 60-second window per IP. Exceeding requests return `429 Too Many Requests` with a `Retry-After` header.

> **Production Note**: Uses an in-memory sliding window rate limiter for simplicity. In production on Vercel serverless, this would be backed by Redis / Upstash KV to support distributed serverless instances.

---

## 🧪 Testing

The repository includes a Vitest automated test suite covering authentication rules, status transition state machine, public form submissions, rate limiting, and API pagination math.

```bash
# Run test suite once
pnpm test

# Run tests in watch mode
pnpm test:watch
```

CI is configured via GitHub Actions in `.github/workflows/test.yml`.

---

## 📡 REST API Documentation

All API responses follow standardized envelopes:
- **Success Envelope**: `{ "data": T, "meta": { "page": 1, "limit": 10, "total": 83, "totalPages": 9, "hasNext": true, "hasPrevious": false } }`
- **Error Envelope**: `{ "error": { "message": "Description", "code": "ERROR_CODE", "details": {} } }`

---

### 1. Public Lead Submission
- **Method**: `POST`
- **Path**: `/api/public/leads`
- **Auth**: None (Public)
- **Rate Limit**: 5 req/min per IP
- **Request Body**:
```json
{
  "name": "Alex Morgan",
  "email": "alex@company.com",
  "phone": "+1 (555) 019-2834",
  "company": "Acme Corp",
  "website_url_hp": ""
}
```
- **Response (201 Created)**:
```json
{
  "data": {
    "lead": {
      "id": "uuid",
      "name": "Alex Morgan",
      "email": "alex@company.com",
      "status": "new",
      "assignedTo": null,
      "createdAt": "2026-07-24T22:00:00.000Z"
    },
    "message": "Lead submitted successfully"
  }
}
```
- **Example cURL**:
```bash
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex Morgan","email":"alex@company.com","company":"Acme Corp"}'
```

---

### 2. User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth**: None
- **Request Body**:
```json
{
  "email": "admin@digitalheroes.com",
  "password": "Admin123!"
}
```
- **Response (200 OK)**:
```json
{
  "data": {
    "user": {
      "userId": "uuid",
      "name": "Sarah Jenkins (Admin)",
      "email": "admin@digitalheroes.com",
      "role": "admin"
    },
    "message": "Logged in successfully"
  }
}
```

---

### 3. List Leads (Paginated & Filtered)
- **Method**: `GET`
- **Path**: `/api/leads`
- **Auth**: Required (`admin` or `member`)
- **Query Parameters**:
  - `page` (number, default `1`)
  - `limit` (number, default `10`, max `100`)
  - `status` (`new` | `contacted` | `qualified` | `won` | `lost` | `all`, default `all`)
  - `assignedTo` (`me` | `unassigned` | `all` | `userId`, default `all`)
  - `q` (string search over `name`, `email`, `company`, `phone`)
- **Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Acme Corp Lead",
      "email": "contact@acme.com",
      "phone": "+1 (555) 019-2834",
      "company": "Acme Corporation",
      "status": "contacted",
      "assignedTo": "user-uuid",
      "assignee": {
        "id": "user-uuid",
        "name": "Alex Rivera (Member)",
        "role": "member"
      },
      "createdAt": "2026-07-24T20:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```
- **Example cURL**:
```bash
curl -X GET "http://localhost:3000/api/leads?page=1&limit=10&status=contacted&q=acme" \
  -H "Cookie: tracklead_session=<JWT_TOKEN>"
```

---

### 4. Get Lead Details
- **Method**: `GET`
- **Path**: `/api/leads/:id`
- **Auth**: Required (`admin` or `member`)
- **Response (200 OK)**: Returns lead record with `assignee`, timestamped `notes` thread, and `activities` timeline.

---

### 5. Update Lead Status / Assignee
- **Method**: `PATCH`
- **Path**: `/api/leads/:id`
- **Auth**: Required (Enforces role permissions and `allowedTransitions` state machine)
- **Request Body**:
```json
{
  "status": "qualified",
  "assignedTo": "user-uuid"
}
```
- **Response (200 OK)**: Returns updated lead object.
- **Error Codes**: `400 INVALID_TRANSITION`, `403 FORBIDDEN`.

---

### 6. Add Note to Lead
- **Method**: `POST`
- **Path**: `/api/leads/:id/notes`
- **Auth**: Required (Assigned member or admin)
- **Request Body**:
```json
{
  "body": "Customer requested enterprise security compliance documentation."
}
```
- **Response (201 Created)**: Returns created note object.

---

## 🤖 AI Usage Statement

In accordance with task submission instructions:
- **AI Tools Used**: Developed with assistance from Gemini 3.6 Flash agentic model.
- **Where AI Was Used**: Initial boilerplate configuration, Zod schema definitions, CSS styling polish, and generation of comprehensive Vitest unit test cases.
- **Human Guidance & Review**: Architecture design (feature-folder split, thin route handlers, transaction wrappers, role-gated state machine, pagination metadata structure) was explicitly planned, reviewed, and validated through empirical build testing and 100% test suite execution.

---

## 📄 License

Built for Digital Heroes Training Task.
