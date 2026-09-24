import { Router } from 'express';
import { statsHandler } from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.get('/stats', authenticate, statsHandler);
export default router;
