# Event Attendance Tracker

A robust, production-grade full-stack Event Attendance Tracking system built for an authenticated event team. The application registers pre-approved students (entry check-in only), dynamically updates `attendance.json` via atomic file operations, supports instant search/filtering across merged roster records, prevents duplicate entries and concurrency races, and protects endpoints with configurable rate limiters and role-based access control (RBAC).

---

## 1. Overview & Live Endpoints

- **Frontend Application:** `http://localhost:5173` (React + Vite)
- **Backend API:** `http://localhost:4000/api/v1` (Node.js + Express)
- **Health Check:** `http://localhost:4000/api/v1/health`

---

## 2. Technology Stack

- **Backend:** Node.js 18+ (ES modules), Express, `jsonwebtoken` (JWT auth), `bcryptjs` (password hashing), `express-rate-limit` (endpoint throttling), `helmet` (security headers), `cors`, `dotenv`.
- **Concurrency & Safety:** In-memory promise-chain async mutex (`utils/mutex.js`) guaranteeing atomic read-check-write file operations, atomic temporary-file writes (`attendance.json.tmp` -> `attendance.json`), and corrupt file preservation (`.corrupt-<timestamp>`).
- **Frontend:** React 18 + Vite (Vanilla CSS design system inspired by Linear and Stripe, system/Inter typography, accessible labels, focus rings, responsive down to mobile).
- **Storage:** JSON-file storage (`data/students.json`, `data/attendance.json`, `data/event.json`). No database dependency.

---

## 3. Demo Credentials

The backend seeds three demo accounts with bcrypt-hashed credentials at startup:

| Username | Password | Role | Permissions |
|---|---|---|---|
| `admin` | `Admin@123` | `ADMIN` | Full access: check-in, search, attendance lists, stats |
| `organiser` | `Organiser@123` | `ORGANISER` | Check-in, search, attendance lists, stats |
| `viewer` | `Viewer@123` | `VIEWER` | Read-only: search, stats, lists (POST `/attendance` yields `403 Forbidden`) |

> *Note: These accounts are demo credentials. In production, credentials should be managed via an identity provider or database with salted password hashes.*

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js 18+ and npm installed.

### Quick Start

1. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

3. **Start the Backend Server (Port 4000):**
   ```bash
   cd ../backend
   npm start
   # Server runs at http://localhost:4000
   ```

4. **Start the Frontend Dev Server (Port 5173):**
   ```bash
   cd ../frontend
   npm run dev
   # App runs at http://localhost:5173
   ```

5. **Run Integration Tests:**
   ```bash
   cd backend
   npm test
   ```

---

## 5. Environment Variables & Configuration

A template is committed at `backend/.env.example`:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | Port for Express backend server |
| `NODE_ENV` | `development` | Environment mode (`development` / `production`) |
| `JWT_SECRET` | `dev_secret_change_me` | Secret for signing JWTs (required in production) |
| `JWT_EXPIRES_IN` | `2h` | Expiration window for access tokens |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `EVENT_CAPACITY` | *(from `data/event.json` or `50`)* | Event attendance capacity limit override |
| `RATE_LIMIT_LOGIN` | `5` | Maximum login attempts per IP per 1 min |
| `RATE_LIMIT_CHECKIN` | `20` | Maximum check-in requests per IP per 1 min |
| `RATE_LIMIT_SEARCH` | `60` | Maximum search queries per IP per 1 min |
| `RATE_LIMIT_GLOBAL` | `200` | Maximum requests per IP per 15 min |

---

## 6. Repository Layout

```
round1-tech-auditions/
├── backend/
│   ├── src/
│   │   ├── app.js               # Express application & middleware wiring
│   │   ├── config.js            # Configuration & capacity resolution
│   │   ├── server.js            # Server boot & graceful shutdown
│   │   ├── controllers/         # Thin request handlers
│   │   │   ├── authController.js
│   │   │   ├── attendanceController.js
│   │   │   └── studentController.js
│   │   ├── middleware/          # Security, auth & error handling
│   │   │   ├── auth.js          # JWT verification & RBAC check
│   │   │   ├── errorHandler.js  # AppError mapping & central formatting
│   │   │   └── rateLimiters.js  # Configured express-rate-limit instances
│   │   ├── repositories/        # Safe file I/O layer
│   │   │   ├── studentRepo.js   # Read-only O(1) roster cache
│   │   │   └── attendanceRepo.js# Mutex-locked atomic file read/write
│   │   ├── routes/              # Express routers
│   │   │   ├── auth.js
│   │   │   ├── attendance.js
│   │   │   ├── dashboard.js
│   │   │   └── students.js
│   │   ├── services/            # Pure business logic
│   │   │   ├── attendanceService.js # Atomic check-in, capacity & idempotency
│   │   │   ├── authService.js       # Bcrypt comparison & JWT issuance
│   │   │   └── searchService.js     # Merged roster+attendance filter
│   │   └── utils/
│   │       ├── AppError.js      # Structured error hierarchy
│   │       ├── mutex.js         # Async Promise-chain queue mutex
│   │       └── response.js      # Consistent JSON response envelopes
│   ├── tests/
│   │   └── attendance.test.js   # Automated integration test suite
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api.js               # Fetch wrapper, token management, error normalizer
│   │   ├── App.jsx              # Session routing (Login vs. Dashboard)
│   │   ├── index.css            # Clean, modern design tokens & components
│   │   ├── main.jsx             # React entrypoint
│   │   └── components/
│   │       ├── AttendanceTable.jsx # Formatted table of attendees/roster
│   │       ├── CheckInForm.jsx     # Safe idempotent check-in gate
│   │       ├── Dashboard.jsx       # Main application view & live refresh
│   │       ├── Login.jsx           # Sign-in card with quick demo shortcuts
│   │       ├── SearchBar.jsx       # Debounced text & department/status filters
│   │       └── StatCards.jsx       # Occupancy progress & stat cards
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── data/
│   ├── students.json            # Pre-approved students roster
│   ├── attendance.json          # Persisted check-in records
│   └── event.json               # Event name & base capacity
├── .gitignore
└── README.md
```

---

## 7. API Documentation (Base URL: `/api/v1`)

All API responses follow consistent JSON envelopes:
- **Success:** `{ "success": true, "data": ..., "meta"?: { "total": N, "page": 1, "limit": 50 } }`
- **Error:** `{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable message", ...extra } }`

### Endpoints Table

| Method | Endpoint | Auth | Allowed Roles | Description |
|---|---|---|---|---|
| `POST` | `/auth/login` | Public | Any | Returns JWT and user payload |
| `GET` | `/auth/me` | Bearer | Any | Returns authenticated session info |
| `POST` | `/attendance` | Bearer | `ADMIN`, `ORGANISER` | Check in a student (`student_id`, `request_id`) |
| `GET` | `/attendance` | Bearer | Any | Lists attendance records (newest first) |
| `GET` | `/attendance/search` | Bearer | Any | Merged view filtered by `q`, `department`, `status` |
| `GET` | `/students/search` | Bearer | Any | Roster search by ID or name substring |
| `GET` | `/dashboard/stats` | Bearer | Any | Total, checked-in, capacity, remaining, occupancy |
| `GET` | `/health` | Public | Any | Service health & timestamp |

### Detailed Endpoint Specifications

#### 1. POST `/auth/login`
- **Request Body:**
  ```json
  { "username": "admin", "password": "Admin@123" }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": { "username": "admin", "role": "ADMIN" }
    }
  }
  ```
- **Error (401 Unauthorized):**
  ```json
  {
    "success": false,
    "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid credentials." }
  }
  ```

#### 2. POST `/attendance` (Check-In)
- **Request Body:**
  ```json
  { "student_id": "STU1001", "request_id": "req_9f3b1a2c" }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "attendance_id": "ATT-9F3B1A2C",
      "student_id": "STU1001",
      "request_id": "req_9f3b1a2c",
      "checked_in_at": "2026-09-24T06:50:00.000Z",
      "checked_in_by": "admin",
      "name": "Aarav Sharma",
      "department": "AIML"
    }
  }
  ```
- **Idempotent Replay Response (200 OK):**
  ```json
  {
    "success": true,
    "idempotent_replay": true,
    "data": { ... }
  }
  ```
- **Error Codes:**
  - `400 VALIDATION_ERROR`: Missing or malformed `student_id`.
  - `403 FORBIDDEN`: Attempted check-in by `VIEWER` role.
  - `404 STUDENT_NOT_FOUND`: Student ID not present in `students.json`.
  - `409 DUPLICATE_ATTENDANCE`: Student has already checked in. Returns `{ attendance_id, checked_in_at }`.
  - `409 CAPACITY_REACHED`: Event is at full capacity.
  - `422 IDEMPOTENCY_KEY_REUSED`: Same `request_id` passed for a different student.

#### 3. GET `/dashboard/stats`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "total_students": 30,
      "checked_in": 12,
      "capacity": 25,
      "remaining": 13,
      "occupancy_percent": 48
    }
  }
  ```

#### 4. GET `/attendance/search?q=aarav&department=AIML&status=INSIDE`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "student_id": "STU1001",
        "name": "Aarav Sharma",
        "department": "AIML",
        "status": "INSIDE",
        "attendance_id": "ATT-9F3B1A2C",
        "checked_in_at": "2026-09-24T06:50:00.000Z"
      }
    ],
    "meta": { "total": 1, "page": 1, "limit": 50 }
  }
  ```

---

## 8. Duplicate Request Handling & Concurrency Control

Check-in uses a strict atomic sequence guarded by an asynchronous mutex:

1. **Mutex Serialization (`utils/mutex.js`):** Check-in calls are enqueued onto a Promise chain. Read, validation, duplicate check, capacity verification, and atomic file write happen sequentially with no interleaved execution.
2. **Idempotent Replay Handling:**
   - When a client sends a `request_id` (generated via `crypto.randomUUID()`), the backend checks if a record with that `request_id` already exists.
   - If the same `request_id` matches the same `student_id`, it returns **200 OK** with the original record and `"idempotent_replay": true`.
   - If the same `request_id` is re-used for a different `student_id`, it rejects with **422 IDEMPOTENCY_KEY_REUSED**.
3. **Double-Click & Concurrent Replay Protection:**
   - If 20 parallel check-in requests are submitted simultaneously for the same student, the mutex serializes them: exactly 1 request completes with **201 Created**, and the remaining 19 requests return **409 DUPLICATE_ATTENDANCE**.
4. **Capacity Precedence:**
   - Idempotency and duplicate checks execute before the capacity check. An already-admitted student retrying their check-in will never receive an erroneous "Event Full" error.
5. **Atomic File Write:**
   - New records are written to a sibling temporary file (`attendance.json.tmp`) and then atomically renamed via `fs.rename` over `attendance.json`. This prevents file truncation on sudden process termination.

---

## 9. Rate Limiting Configuration

Configured via `express-rate-limit` using custom JSON handlers returning standard 429 envelopes:

| Limiter | Target | Limit | Window | Exceeded Response |
|---|---|---|---|---|
| `loginLimiter` | `POST /auth/login` | 5 | 1 min | 429 `RATE_LIMITED` + `Retry-After` header |
| `checkinLimiter` | `POST /attendance` | 20 | 1 min | 429 `RATE_LIMITED` + `Retry-After` header |
| `searchLimiter` | `GET .../search` | 60 | 1 min | 429 `RATE_LIMITED` + `Retry-After` header |
| `globalLimiter` | All routes | 200 | 15 min | 429 `RATE_LIMITED` + `Retry-After` header |

---

## 10. Data Model & Search Approach

### Data Structures
- **Student Roster (`data/students.json`):**
  `{ "student_id": "STU1001", "name": "Aarav Sharma", "department": "AIML" }`
- **Attendance Record (`data/attendance.json`):**
  `{ "attendance_id": "ATT-9F3B1A2C", "student_id": "STU1001", "request_id": "req_...", "checked_in_at": "ISO-8601", "checked_in_by": "admin" }`
- **Merged View (API search results):**
  Joined via hash map on `student_id` into:
  `{ student_id, name, department, status: "INSIDE" | "NOT_ENTERED", attendance_id, checked_in_at }`

### Search & Filtering Logic
- `q`: Matches exact or prefix student ID (e.g. `stu10`), or case-insensitive substring of student name with multiple consecutive spaces collapsed. Never compiles regex from user input.
- `department`: Case-insensitive exact match.
- `status`: Validated against `['INSIDE', 'NOT_ENTERED']`. Malformed values return 400.
- All filters compose with boolean `AND`.

---

## 11. Scaling Beyond JSON Files

To transition this architecture to high-volume production scale:

1. **Relational Database (PostgreSQL):**
   - Store roster in `students` table (`student_id` PRIMARY KEY).
   - Store check-ins in `attendance` table with `UNIQUE(student_id)` and `UNIQUE(request_id)`.
   - Use database transactions with row-level locks (`SELECT ... FOR UPDATE`) or atomic `INSERT INTO attendance ... ON CONFLICT DO NOTHING`.
2. **Distributed Rate Limiting & Idempotency Store (Redis):**
   - Replace in-memory rate limiting with Redis sliding-window limiters (`ioredis` + Redis token bucket).
   - Cache idempotency keys in Redis with a 24-hour TTL for ultra-fast replay responses before touching primary storage.
3. **High-Performance Search:**
   - Use PostgreSQL `pg_trgm` GIN indexes for fast fuzzy and partial name matching.
4. **Horizontal Scalability:**
   - Multiple stateless Express instances behind a load balancer (NGINX/AWS ALB).
   - Token authentication upgraded to JWTs with rotating keys or short-lived tokens with Redis refresh tokens.
5. **Audit Logging & Telemetry:**
   - Structured JSON audit logs recording operator username, IP address, user-agent, and check-in timestamp.

---

## 12. Running Tests

Execute the automated integration test suite:
```bash
cd backend
npm test
```

Tests verify:
- Successful check-in (201)
- Unknown student ID (404 `STUDENT_NOT_FOUND`)
- Invalid/empty ID input (400 `VALIDATION_ERROR`)
- Duplicate student registration (409 `DUPLICATE_ATTENDANCE`)
- Repeated identical `request_id` (200 replay without extra record)
- Shared `request_id` conflict (422 `IDEMPOTENCY_KEY_REUSED`)
- Concurrency race condition: 20 parallel check-ins for the same student yielding exactly 1 record
- Role enforcement: `VIEWER` blocked with 403 `FORBIDDEN`
- Search by ID, partial name, department, and status
- Persistence across server restarts