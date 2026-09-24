import app from './app.js';
import config from './config.js';

const PORT = config.PORT;

const httpServer = app.listen(PORT, () => {
  console.log(`[server] Event Attendance Tracker API running on http://localhost:${PORT}`);
  console.log(`[server] ENV=${config.NODE_ENV} | CAPACITY=${config.CAPACITY}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received, shutting down...');
  httpServer.close(() => { console.log('[server] Closed.'); process.exit(0); });
});
process.on('SIGINT', () => {
  console.log('[server] SIGINT received, shutting down...');
  httpServer.close(() => { console.log('[server] Closed.'); process.exit(0); });
});

// Catch uncaught async errors – log but don't leak
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});

export default httpServer;
