import { verifyToken } from '../services/authService.js';
import { err } from '../utils/response.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return err(res, 401, 'UNAUTHORIZED', 'Authentication required.');
  }
  const token = authHeader.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return err(res, 401, 'UNAUTHORIZED', 'Invalid or expired token.');
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return err(res, 401, 'UNAUTHORIZED', 'Authentication required.');
    if (!roles.includes(req.user.role)) {
      return err(res, 403, 'FORBIDDEN', 'Insufficient permissions.');
    }
    next();
  };
}
