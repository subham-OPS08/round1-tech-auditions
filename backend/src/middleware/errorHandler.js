import { AppError } from '../utils/AppError.js';
import config from '../config.js';

export function errorHandler(err, req, res, next) {
  // Express body-parser JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body.' } });
  }

  if (err instanceof AppError && err.isOperational) {
    const body = { success: false, error: { code: err.code, message: err.message } };
    if (err.extra) Object.assign(body.error, err.extra);
    return res.status(err.statusCode).json(body);
  }

  // Unexpected errors
  if (config.NODE_ENV !== 'production') {
    console.error('[ERROR]', err);
  }
  return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
}

export function notFound(req, res) {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` } });
}
