import fs from 'fs/promises';
import fss from 'fs';
import path from 'path';
import config from '../config.js';
import { createMutex } from '../utils/mutex.js';
import { Errors } from '../utils/AppError.js';

const ATTENDANCE_FILE  = path.resolve(config.DATA_DIR, 'attendance.json');
const ATTENDANCE_TMP   = ATTENDANCE_FILE + '.tmp';

export const attendanceLock = createMutex();

export async function readAttendance() {
  let raw;
  try {
    raw = await fs.readFile(ATTENDANCE_FILE, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      // File doesn't exist yet – treat as empty
      await writeAttendance([]);
      return [];
    }
    throw Errors.dataUnreadable();
  }

  // Empty file – treat as []
  if (!raw.trim()) return [];

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    // Corrupt – back it up, refuse to overwrite
    const corruptPath = ATTENDANCE_FILE + '.corrupt-' + Date.now();
    try { await fs.copyFile(ATTENDANCE_FILE, corruptPath); } catch {}
    console.error('CORRUPT attendance.json – backed up to', corruptPath);
    throw Errors.dataUnreadable();
  }

  if (!Array.isArray(data) || !data.every(r => typeof r === 'object' && r !== null)) {
    const corruptPath = ATTENDANCE_FILE + '.corrupt-' + Date.now();
    try { await fs.copyFile(ATTENDANCE_FILE, corruptPath); } catch {}
    throw Errors.dataUnreadable();
  }

  return data;
}

export async function writeAttendance(records) {
  const json = JSON.stringify(records, null, 2);
  await fs.writeFile(ATTENDANCE_TMP, json, 'utf8');
  await fs.rename(ATTENDANCE_TMP, ATTENDANCE_FILE);
}

// Exposed for tests to override the file path
export function _getAttendancePath() { return ATTENDANCE_FILE; }
