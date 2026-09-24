import { searchStudents } from '../services/searchService.js';
import { ok } from '../utils/response.js';

export async function searchStudentsHandler(req, res, next) {
  try {
    const { q, department, status, page, limit } = req.query;
    const result = await searchStudents({ q, department, status, page, limit });
    ok(res, result.data, result.meta);
  } catch (e) { next(e); }
}
