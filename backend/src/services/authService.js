import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { Errors } from '../utils/AppError.js';

// Pre-hash passwords at startup so login is fast
const _users = {};
await (async () => {
  for (const [key, u] of Object.entries(config.USERS)) {
    _users[u.username] = {
      username: u.username,
      role: u.role,
      hash: await bcrypt.hash(u.password, config.BCRYPT_ROUNDS),
    };
  }
})();

export async function login(username, password) {
  if (!username || !password) throw Errors.invalidCreds();
  const user = _users[username.toLowerCase()] || _users[username];
  if (!user) throw Errors.invalidCreds();

  const valid = await bcrypt.compare(password, user.hash);
  if (!valid) throw Errors.invalidCreds();

  const token = jwt.sign(
    { username: user.username, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  return { token, user: { username: user.username, role: user.role } };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch {
    throw Errors.unauthorized();
  }
}
