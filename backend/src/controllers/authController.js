import { login } from '../services/authService.js';
import { ok } from '../utils/response.js';

export async function loginHandler(req, res, next) {
  try {
    const { username, password } = req.body || {};
    const result = await login(username, password);
    ok(res, result);
  } catch (e) { next(e); }
}

export async function meHandler(req, res) {
  ok(res, req.user);
}
