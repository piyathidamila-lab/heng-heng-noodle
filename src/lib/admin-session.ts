import { cookies } from 'next/headers';

// ----------------------------------------------------------------------

const ADMIN_COOKIE_NAME = 'hh_admin_session';

function getAdminSecret(): string {
  const secret = process.env.ADMIN_AUTH_SECRET;

  if (!secret) {
    throw new Error('Missing ADMIN_AUTH_SECRET environment variable.');
  }

  return secret;
}

export function checkAdminPassword(password: string): boolean {
  return password.length > 0 && password === getAdminSecret();
}

export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, getAdminSecret(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  return !!value && value === getAdminSecret();
}

/** Throws if called by a request without a valid admin session — guard for server actions. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Unauthorized');
  }
}
