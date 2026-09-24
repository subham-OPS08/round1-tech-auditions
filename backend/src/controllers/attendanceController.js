import { checkIn, listAttendance, getStats } from '../services/attendanceService.js';
import { searchAttendance } from '../services/searchService.js';
import { ok, created } from '../utils/response.js';

export async function checkInHandler(req, res, next) {
  try {
    const { student_id, request_id } = req.body || {};
    const result = await checkIn({ student_id, request_id, username: req.user.username });
    if (result.idempotent_replay) {
      return res.status(200).json({ success: true, data: result.record, idempotent_replay: true });
    }
    return created(res, result.record);
  } catch (e) { next(e); }
}

export async function listAttendanceHandler(req, res, next) {
  try {
    const records = await listAttendance();
    ok(res, records);
  } catch (e) { next(e); }
}

export async function searchAttendanceHandler(req, res, next) {
  try {
    const { q, department, status, page, limit } = req.query;
    const result = await searchAttendance({ q, department, status, page, limit });
    ok(res, result.data, result.meta);
  } catch (e) { next(e); }
}

export async function statsHandler(req, res, next) {
  try {
    const stats = await getStats();
    ok(res, stats);
  } catch (e) { next(e); }
}
