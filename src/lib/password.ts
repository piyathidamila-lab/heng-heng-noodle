import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

// ----------------------------------------------------------------------

const KEY_LENGTH = 64;

/** Returns `salt:hash`, both hex-encoded — safe to store in admin_users.password_hash. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, 'hex');
  const candidate = scryptSync(password, salt, KEY_LENGTH);

  return candidate.length === hashBuffer.length && timingSafeEqual(candidate, hashBuffer);
}
