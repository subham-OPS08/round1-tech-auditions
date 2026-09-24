import { readAttendance, writeAttendance, attendanceLock } from '../repositories/attendanceRepo.js';
import { getStudentById } from '../repositories/studentRepo.js';
import { Errors } from '../utils/AppError.js';
import config from '../config.js';
import { randomUUID } from 'crypto';

const STUDENT_ID_PATTERN = /^STU\d{4,}$/;
const MAX_ID_LEN = 20;
const MAX_REQ_ID_LEN = 100;

function validateCheckIn(student_id, request_id) {
  if (!student_id || typeof student_id !== 'string') {
    throw Errors.validation('student_id is required.');
  }
  const id = student_id.trim().toUpperCase();
  if (!id) throw Errors.validation('student_id cannot be empty.');
  if (id.length > MAX_ID_LEN) throw Errors.validation('student_id is too long.');
  if (!STUDENT_ID_PATTERN.test(id)) throw Errors.validation('student_id format invalid (expected e.g. STU1024).');
  if (request_id !== undefined && request_id !== null) {
    if (typeof request_id !== 'string') throw Errors.validation('request_id must be a string.');
    if (request_id.length > MAX_REQ_ID_LEN) throw Errors.validation('request_id too long (max 100 chars).');
  }
  return { student_id: id, request_id: request_id || null };
}

export async function checkIn({ student_id: rawId, request_id: rawReqId, username }) {
  return attendanceLock(async () => {
    // 1. Validate
    const { student_id, request_id } = validateCheckIn(rawId, rawReqId);

    // 2. Lookup student in roster
    const student = getStudentById(student_id);
    if (!student) throw Errors.studentNotFound(student_id);

    // 3. Fresh read inside lock
    const records = await readAttendance();

    // 4. Idempotent replay
    if (request_id) {
      const byReqId = records.find(r => r.request_id === request_id);
      if (byReqId) {
        if (byReqId.student_id === student_id) {
          // Exact replay – return original
          return { record: { ...byReqId, ...student }, idempotent_replay: true, statusCode: 200 };
        } else {
          // Same request_id, different student
          throw Errors.idempotencyReused();
        }
      }
    }

    // 5. Duplicate student check
    const existing = records.find(r => r.student_id === student_id);
    if (existing) {
      const e = Errors.duplicate(existing.attendance_id, existing.checked_in_at);
      throw e;
    }

    // 6. Capacity check
    if (records.length >= config.CAPACITY) {
      throw Errors.capacityReached();
    }

    // 7. Create and persist
    const record = {
      attendance_id: 'ATT-' + randomUUID().substring(0, 8).toUpperCase(),
      student_id,
      request_id,
      checked_in_at: new Date().toISOString(),
      checked_in_by: username,
    };
    records.push(record);
    await writeAttendance(records);

    return { record: { ...record, name: student.name, department: student.department }, statusCode: 201 };
  });
}

export async function listAttendance() {
  const records = await readAttendance();
  const { getAllStudents } = await import('../repositories/studentRepo.js');
  const studentMap = new Map(getAllStudents().map(s => [s.student_id, s]));
  return records
    .map(r => {
      const s = studentMap.get(r.student_id) || {};
      return { ...r, name: s.name || null, department: s.department || null };
    })
    .sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at));
}

export async function getStats() {
  const records = await readAttendance();
  const { getAllStudents } = await import('../repositories/studentRepo.js');
  const total = getAllStudents().length;
  const checkedIn = records.length;
  const capacity = config.CAPACITY;
  const remaining = Math.max(0, capacity - checkedIn);
  const occupancy = capacity > 0 ? Math.round((checkedIn / capacity) * 100) : 0;
  return { total_students: total, checked_in: checkedIn, capacity, remaining, occupancy_percent: occupancy };
}
