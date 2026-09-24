import rateLimit from 'express-rate-limit';
import config from '../config.js';

function rateLimitHandler(req, res) {
  const retryAfter = res.getHeader('Retry-After') || 60;
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: `Too many requests. Please retry after ${retryAfter} seconds.`,
      retry_after: Number(retryAfter),
    },
  });
}

export const loginLimiter = rateLimit({
  windowMs: config.RATE_LIMITS.login.windowMs,
  max:      config.RATE_LIMITS.login.max,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: rateLimitHandler,
});

export const checkinLimiter = rateLimit({
  windowMs: config.RATE_LIMITS.checkin.windowMs,
  max:      config.RATE_LIMITS.checkin.max,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: rateLimitHandler,
});

export const searchLimiter = rateLimit({
  windowMs: config.RATE_LIMITS.search.windowMs,
  max:      config.RATE_LIMITS.search.max,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: rateLimitHandler,
});

export const globalLimiter = rateLimit({
  windowMs: config.RATE_LIMITS.global.windowMs,
  max:      config.RATE_LIMITS.global.max,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: rateLimitHandler,
});
