import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// __dirname is backend/src -> .. is backend -> ../.. is repo root (round1-tech-auditions)
const REPO_ROOT = path.resolve(__dirname, '..', '..');

function requireInProd(key) {
  if (process.env.NODE_ENV === 'production' && !process.env[key]) {
    console.error(`FATAL: ${key} env var is required in production`);
    process.exit(1);
  }
}

requireInProd('JWT_SECRET');

// Load capacity: ENV > event.json > default 50
function resolveCapacity() {
  if (process.env.EVENT_CAPACITY) return parseInt(process.env.EVENT_CAPACITY, 10);
  try {
    const eventPath = path.resolve(REPO_ROOT, 'data', 'event.json');
    const ev = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    if (typeof ev.capacity === 'number') return ev.capacity;
  } catch {}
  return 50;
}

export default {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2h',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  REPO_ROOT,
  DATA_DIR: path.resolve(REPO_ROOT, 'data'),
  CAPACITY: resolveCapacity(),
  USERS: {
    admin:     { username: 'admin',     password: process.env.ADMIN_PASSWORD     || 'Admin@123',     role: 'ADMIN' },
    organiser: { username: 'organiser', password: process.env.ORGANISER_PASSWORD || 'Organiser@123', role: 'ORGANISER' },
    viewer:    { username: 'viewer',    password: process.env.VIEWER_PASSWORD    || 'Viewer@123',    role: 'VIEWER' },
  },
  RATE_LIMITS: {
    login:   { max: parseInt(process.env.RATE_LIMIT_LOGIN   || '5',   10), windowMs: 60_000 },
    checkin: { max: parseInt(process.env.RATE_LIMIT_CHECKIN || '20',  10), windowMs: 60_000 },
    search:  { max: parseInt(process.env.RATE_LIMIT_SEARCH  || '60',  10), windowMs: 60_000 },
    global:  { max: parseInt(process.env.RATE_LIMIT_GLOBAL  || '200', 10), windowMs: 15 * 60_000 },
  },
};
