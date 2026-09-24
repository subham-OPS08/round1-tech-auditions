export class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

export const Errors = {
  validation:      (msg) => new AppError(400,  'VALIDATION_ERROR',       msg || 'Validation failed.'),
  invalidCreds:    ()    => new AppError(401,  'INVALID_CREDENTIALS',    'Invalid credentials.'),
  unauthorized:    ()    => new AppError(401,  'UNAUTHORIZED',           'Authentication required.'),
  forbidden:       ()    => new AppError(403,  'FORBIDDEN',              'Insufficient permissions.'),
  notFound:        (msg) => new AppError(404,  'NOT_FOUND',              msg || 'Resource not found.'),
  studentNotFound: (id)  => new AppError(404,  'STUDENT_NOT_FOUND',      `Student ${id} not found in roster.`),
  duplicate:       (id, at) => new AppError(409, 'DUPLICATE_ATTENDANCE', `Student ${id} has already checked in.`, { attendance_id: id, checked_in_at: at }),
  capacityReached: ()    => new AppError(409,  'CAPACITY_REACHED',       'Event is at full capacity.'),
  idempotencyReused:()   => new AppError(422,  'IDEMPOTENCY_KEY_REUSED', 'request_id already used for a different student.'),
  dataUnreadable:  ()    => new AppError(503,  'DATA_UNREADABLE',        'Attendance data is temporarily unavailable.'),
  internal:        ()    => new AppError(500,  'INTERNAL_ERROR',         'An unexpected error occurred.'),
};

// Extend AppError to carry extra payload
const _origDuplicate = Errors.duplicate;
Errors.duplicate = (attendanceId, checkedInAt) => {
  const err = new AppError(409, 'DUPLICATE_ATTENDANCE', `Student has already checked in.`);
  err.extra = { attendance_id: attendanceId, checked_in_at: checkedInAt };
  return err;
};
