import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from './config.js';
import { globalLimiter } from './middleware/rateLimiters.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes       from './routes/auth.js';
import attendanceRoutes from './routes/attendance.js';
import studentRoutes    from './routes/students.js';
import dashboardRoutes  from './routes/dashboard.js';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_ORIGIN, credentials: true }));

// Body parsing – 10 kb limit, rejects bad JSON automatically
app.use(express.json({ limit: '10kb' }));

// Global rate limit
app.use(globalLimiter);

// Health
app.get('/api/v1/health', (req, res) => res.json({ success: true, data: { status: 'ok', ts: new Date().toISOString() } }));

// Routes
app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/students',   studentRoutes);
app.use('/api/v1/dashboard',  dashboardRoutes);

// 404 + error handler must be LAST
app.use(notFound);
app.use(errorHandler);

export default app;
