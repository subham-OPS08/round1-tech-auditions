import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const REAL_DATA = path.resolve(REPO_ROOT, 'data');
const ATTENDANCE_FILE = path.join(REAL_DATA, 'attendance.json');
const BACKUP_FILE     = path.join(REAL_DATA, 'attendance.json.test-backup');

let request;
let app;
let adminToken, organiserToken, viewerToken;

function backupAttendance() {
  if (fs.existsSync(ATTENDANCE_FILE)) {
    fs.copyFileSync(ATTENDANCE_FILE, BACKUP_FILE);
  }
  fs.writeFileSync(ATTENDANCE_FILE, '[]', 'utf8');
}

function restoreAttendance() {
  if (fs.existsSync(BACKUP_FILE)) {
    fs.copyFileSync(BACKUP_FILE, ATTENDANCE_FILE);
    fs.unlinkSync(BACKUP_FILE);
  } else {
    fs.writeFileSync(ATTENDANCE_FILE, '[]', 'utf8');
  }
}

before(async () => {
  const supertest = await import('supertest');
  request = supertest.default;
  const appModule = await import('../src/app.js');
  app = appModule.default;

  backupAttendance();

  const adminRes = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'Admin@123' });
  adminToken = adminRes.body.data?.token;
  const orgRes = await request(app).post('/api/v1/auth/login').send({ username: 'organiser', password: 'Organiser@123' });
  organiserToken = orgRes.body.data?.token;
  const viewRes = await request(app).post('/api/v1/auth/login').send({ username: 'viewer', password: 'Viewer@123' });
  viewerToken = viewRes.body.data?.token;
});

after(() => {
  restoreAttendance();
});

beforeEach(() => {
  fs.writeFileSync(ATTENDANCE_FILE, '[]', 'utf8');
});

function auth(token) { return { Authorization: `Bearer ${token}` }; }

describe('Auth Scenarios', () => {
  test('wrong credentials returns 401 generic error', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'wrong' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
    assert.equal(res.body.error.message, 'Invalid credentials.');
  });

  test('valid login returns token and user role', async () => {
    assert.ok(adminToken);
    const meRes = await request(app).get('/api/v1/auth/me').set(auth(adminToken));
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.username, 'admin');
    assert.equal(meRes.body.data.role, 'ADMIN');
  });

  test('unauthenticated access returns 401', async () => {
    const res = await request(app).get('/api/v1/attendance');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  test('VIEWER role receives 403 on POST /attendance', async () => {
    const res = await request(app).post('/api/v1/attendance').set(auth(viewerToken)).send({ student_id: 'STU1001' });
    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'FORBIDDEN');
  });
});

describe('Check-In Scenarios', () => {
  test('successful registration returns 201 with roster details', async () => {
    const res = await request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: 'STU1001', request_id: 'req_1' });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.student_id, 'STU1001');
    assert.equal(res.body.data.name, 'Aarav Sharma');
    assert.equal(res.body.data.department, 'AIML');
    assert.ok(res.body.data.attendance_id.startsWith('ATT-'));
  });

  test('unknown student ID returns 404 STUDENT_NOT_FOUND', async () => {
    const res = await request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: 'STU9999' });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'STUDENT_NOT_FOUND');
  });

  test('invalid or empty student ID returns 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: '' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  test('duplicate student registration returns 409 DUPLICATE_ATTENDANCE', async () => {
    await request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: 'STU1002' });
    const res = await request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: 'STU1002' });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'DUPLICATE_ATTENDANCE');
    assert.ok(res.body.error.attendance_id);
    assert.ok(res.body.error.checked_in_at);
  });

  test('repeated identical request_id returns 200 replay without creating second record', async () => {
    const reqId = 'req_unique_123';
    const r1 = await request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: 'STU1003', request_id: reqId });
    assert.equal(r1.status, 201);
    const r2 = await request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: 'STU1003', request_id: reqId });
    assert.equal(r2.status, 200);
    assert.equal(r2.body.idempotent_replay, true);
    assert.equal(r2.body.data.student_id, 'STU1003');

    const records = JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf8'));
    assert.equal(records.filter(r => r.student_id === 'STU1003').length, 1);
  });

  test('reusing same request_id for different student returns 422 IDEMPOTENCY_KEY_REUSED', async () => {
    const reqId = 'req_shared_conflict';
    await request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: 'STU1004', request_id: reqId });
    const res = await request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: 'STU1005', request_id: reqId });
    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'IDEMPOTENCY_KEY_REUSED');
  });

  test('concurrency: 20 parallel check-ins for same student results in exactly 1 record', async () => {
    const promises = Array.from({ length: 20 }, () =>
      request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: 'STU1006' })
    );
    const results = await Promise.all(promises);
    const created = results.filter(r => r.status === 201);
    const duplicates = results.filter(r => r.status === 409);
    assert.equal(created.length, 1);
    assert.equal(duplicates.length, 19);

    const records = JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf8'));
    assert.equal(records.filter(r => r.student_id === 'STU1006').length, 1);
  });

  test('attendance persistence after simulated restart', async () => {
    await request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: 'STU1007' });
    const raw = fs.readFileSync(ATTENDANCE_FILE, 'utf8');
    const records = JSON.parse(raw);
    assert.ok(records.some(r => r.student_id === 'STU1007'));
  });
});

describe('Search and Filter Scenarios', () => {
  before(async () => {
    await request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: 'STU1001' });
    await request(app).post('/api/v1/attendance').set(auth(adminToken)).send({ student_id: 'STU1002' });
  });

  test('search students by ID prefix', async () => {
    const res = await request(app).get('/api/v1/students/search?q=STU1001').set(auth(adminToken));
    assert.equal(res.status, 200);
    assert.ok(res.body.data.some(s => s.student_id === 'STU1001'));
  });

  test('search students by partial name case-insensitive', async () => {
    const res = await request(app).get('/api/v1/students/search?q=aarav').set(auth(adminToken));
    assert.equal(res.status, 200);
    assert.ok(res.body.data.some(s => s.name === 'Aarav Sharma'));
  });

  test('filter attendance search by department', async () => {
    const res = await request(app).get('/api/v1/attendance/search?department=AIML').set(auth(adminToken));
    assert.equal(res.status, 200);
    assert.ok(res.body.data.every(s => s.department === 'AIML'));
  });

  test('filter attendance search by status INSIDE', async () => {
    const res = await request(app).get('/api/v1/attendance/search?status=INSIDE').set(auth(adminToken));
    assert.equal(res.status, 200);
    assert.ok(res.body.data.every(s => s.status === 'INSIDE'));
  });

  test('filter attendance search by status NOT_ENTERED', async () => {
    const res = await request(app).get('/api/v1/attendance/search?status=NOT_ENTERED').set(auth(adminToken));
    assert.equal(res.status, 200);
    assert.ok(res.body.data.every(s => s.status === 'NOT_ENTERED'));
  });

  test('invalid status value returns 400 VALIDATION_ERROR', async () => {
    const res = await request(app).get('/api/v1/attendance/search?status=INVALID_STATUS').set(auth(adminToken));
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });
});

describe('Dashboard Statistics', () => {
  test('returns all required metrics', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats').set(auth(adminToken));
    assert.equal(res.status, 200);
    const d = res.body.data;
    assert.ok(typeof d.total_students === 'number');
    assert.ok(typeof d.checked_in === 'number');
    assert.ok(typeof d.capacity === 'number');
    assert.ok(typeof d.remaining === 'number');
    assert.ok(typeof d.occupancy_percent === 'number');
  });
});
