import fs from 'fs';
import path from 'path';
import config from '../config.js';

const STUDENTS_FILE = path.resolve(config.DATA_DIR, 'students.json');

let _cache = null;

function loadStudents() {
  if (_cache) return _cache;
  try {
    const raw = fs.readFileSync(STUDENTS_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('students.json must be an array');
    // Build a Map for O(1) lookups
    _cache = new Map(data.map(s => [s.student_id.toUpperCase(), s]));
    return _cache;
  } catch (e) {
    console.error('FATAL: cannot read students.json:', e.message);
    process.exit(1);
  }
}

export function getStudentById(id) {
  return loadStudents().get(id.toUpperCase()) || null;
}

export function getAllStudents() {
  return Array.from(loadStudents().values());
}

export function studentExists(id) {
  return loadStudents().has(id.toUpperCase());
}
