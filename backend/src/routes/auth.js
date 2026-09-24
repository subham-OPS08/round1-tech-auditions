import { Router } from 'express';
import { loginHandler, meHandler } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.post('/login', loginLimiter, loginHandler);
router.get('/me', authenticate, meHandler);
export default router;
