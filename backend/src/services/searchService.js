import { getAllStudents } from '../repositories/studentRepo.js';
import { readAttendance } from '../repositories/attendanceRepo.js';
import { Errors } from '../utils/AppError.js';

const VALID_STATUSES = new Set(['INSIDE', 'NOT_ENTERED']);
const MAX_Q = 100;

function collapseSpaces(s) { return s.replace(/\s+/g, ' ').trim(); }

/**
 * Build merged view: roster + attendance joined by student_id
 * Returns { student_id, name, department, status, attendance_id|null, checked_in_at|null }
 */
async function buildMergedView() {
  const students = getAllStudents();
  const records  = await readAttendance();
  const attMap   = new Map(records.map(r => [r.student_id, r]));

  return students.map(s => {
    const r = attMap.get(s.student_id);
    return {
      student_id:    s.student_id,
      name:          s.name,
      department:    s.department,
      status:        r ? 'INSIDE' : 'NOT_ENTERED',
      attendance_id: r ? r.attendance_id : null,
      checked_in_at: r ? r.checked_in_at : null,
    };
  });
}

/**
 * Search the roster (includes status). Used by GET /students/search
 */
export async function searchStudents({ q, department, status, page = 1, limit = 50 }) {
  return _search(await buildMergedView(), { q, department, status, page, limit }, false);
}

/**
 * Filter the merged attendance view. Used by GET /attendance/search
 */
export async function searchAttendance({ q, department, status, page = 1, limit = 50 }) {
  return _search(await buildMergedView(), { q, department, status, page, limit }, false);
}

function _search(rows, { q, department, status, page, limit }, attendanceOnly) {
  // Validate params
  if (q !== undefined && q !== null && q !== '') {
    if (typeof q !== 'string') throw Errors.validation('q must be a string.');
    if (q.length > MAX_Q) throw Errors.validation('q is too long (max 100 chars).');
  }
  if (status !== undefined && status !== null && status !== '') {
    if (!VALID_STATUSES.has(status.toUpperCase())) {
      throw Errors.validation('status must be INSIDE or NOT_ENTERED.');
    }
    status = status.toUpperCase();
  }

  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

  let results = rows;

  if (q) {
    const qLow = collapseSpaces(q).toLowerCase();
    results = results.filter(r => {
      // Exact/prefix student ID (case-insensitive)
      if (r.student_id.toLowerCase().startsWith(qLow)) return true;
      // Name substring (case-insensitive)
      if (r.name && collapseSpaces(r.name).toLowerCase().includes(qLow)) return true;
      return false;
    });
  }

  if (department) {
    const dLow = department.toLowerCase();
    results = results.filter(r => r.department && r.department.toLowerCase() === dLow);
  }

  if (status) {
    results = results.filter(r => r.status === status);
  }

  const total  = results.length;
  const offset = (pageNum - 1) * limitNum;
  const data   = results.slice(offset, offset + limitNum);

  return { data, meta: { total, page: pageNum, limit: limitNum } };
}
