import { Router } from 'express';
import { searchStudentsHandler } from '../controllers/studentController.js';
import { authenticate } from '../middleware/auth.js';
import { searchLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.get('/search', authenticate, searchLimiter, searchStudentsHandler);
export default router;
