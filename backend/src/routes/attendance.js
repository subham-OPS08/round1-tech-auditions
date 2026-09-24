import { Router } from 'express';
import { checkInHandler, listAttendanceHandler, searchAttendanceHandler } from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { checkinLimiter, searchLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.post('/',        authenticate, requireRole('ADMIN','ORGANISER'), checkinLimiter, checkInHandler);
router.get('/',         authenticate, listAttendanceHandler);
router.get('/search',   authenticate, searchLimiter, searchAttendanceHandler);
export default router;
