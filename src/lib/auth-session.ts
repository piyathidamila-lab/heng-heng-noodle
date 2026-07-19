import { cookies } from 'next/headers';

import { getSupabaseAdmin } from './supabase-admin';
import { verifyUserCredentials } from './user-service';

// ----------------------------------------------------------------------

const SESSION_COOKIE_NAME = 'hh_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'staff';
};

/** Verifies username/password and, if valid, opens a new DB-backed session + cookie. */
export async function login(username: string, password: string): Promise<SessionUser | null> {
  const user = await verifyUserCredentials(username, password);
  if (!user) return null;

  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const { data, error } = await supabase
    .from('admin_sessions')
    .insert({ user_id: user.id, expires_at: expiresAt })
    .select('id')
    .single();

  if (error) throw error;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, data.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });

  return user;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const supabase = getSupabaseAdmin();
    await supabase.from('admin_sessions').delete().eq('id', token);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

type SessionRow = {
  id: string;
  expires_at: string;
  admin_users: {
    id: string;
    username: string;
    display_name: string;
    role: 'admin' | 'staff';
    is_active: boolean;
  } | null;
};

/** The logged-in admin/staff user for this request, or null — also clears an expired/invalid cookie. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('admin_sessions')
    .select('id, expires_at, admin_users (id, username, display_name, role, is_active)')
    .eq('id', token)
    .maybeSingle();

  if (error) throw error;

  const account = (data as SessionRow | null)?.admin_users;
  const isValid = !!data && !!account?.is_active && new Date(data.expires_at) > new Date();

  if (!isValid || !account) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    id: account.id,
    username: account.username,
    displayName: account.display_name,
    role: account.role,
  };
}

/** Throws unless the caller is a logged-in admin — guard for admin-only server actions. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw new Error('Unauthorized');
  return user;
}

/**
 * Order management (viewing/updating orders, table sessions, bills) is
 * shared between the admin dashboard and the front-of-house staff view —
 * guard those server actions with this instead of requireAdmin so either
 * role can call them.
 */
export async function requireOrderAccess(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}
