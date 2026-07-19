import { cookies } from 'next/headers';

import { getSupabaseAdmin } from './supabase-admin';
import { hashPassword, verifyPassword } from './password';

// ----------------------------------------------------------------------

const SESSION_COOKIE_NAME = 'hh_member_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type SessionMember = {
  id: string;
  phone: string;
  displayName: string;
  starsBalance: number;
};

export class MemberValidationError extends Error {}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function assertValidPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!/^0\d{8,9}$/.test(normalized)) {
    throw new MemberValidationError('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง');
  }
  return normalized;
}

function assertValidPin(pin: string): void {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new MemberValidationError('PIN ต้องเป็นตัวเลข 4-6 หลัก');
  }
}

async function createSessionCookie(customerId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const { data, error } = await supabase
    .from('customer_sessions')
    .insert({ customer_id: customerId, expires_at: expiresAt })
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
}

type CustomerRow = {
  id: string;
  phone: string;
  display_name: string;
  stars_balance: number;
  pin_hash: string;
};

function mapCustomerRow(row: CustomerRow): SessionMember {
  return {
    id: row.id,
    phone: row.phone,
    displayName: row.display_name,
    starsBalance: row.stars_balance,
  };
}

/** Creates a new member account and signs them in — throws if the phone is already registered. */
export async function registerMember(
  phone: string,
  pin: string,
  displayName: string
): Promise<SessionMember> {
  const normalizedPhone = assertValidPhone(phone);
  assertValidPin(pin);

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('customers')
    .insert({
      phone: normalizedPhone,
      pin_hash: hashPassword(pin),
      display_name: displayName.trim(),
    })
    .select('id, phone, display_name, stars_balance, pin_hash')
    .single();

  if (error) {
    if (error.code === '23505') throw new MemberValidationError('เบอร์โทรศัพท์นี้เป็นสมาชิกอยู่แล้ว');
    throw error;
  }

  await createSessionCookie(data.id);

  return mapCustomerRow(data);
}

/** Verifies phone/PIN and signs the member in — null if no match. */
export async function loginMember(phone: string, pin: string): Promise<SessionMember | null> {
  const normalizedPhone = normalizePhone(phone);

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('customers')
    .select('id, phone, display_name, stars_balance, pin_hash')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (error) throw error;
  if (!data || !verifyPassword(pin, data.pin_hash)) return null;

  await createSessionCookie(data.id);

  return mapCustomerRow(data);
}

export async function logoutMember(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const supabase = getSupabaseAdmin();
    await supabase.from('customer_sessions').delete().eq('id', token);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

type SessionRow = {
  id: string;
  expires_at: string;
  customers: CustomerRow | null;
};

/** The logged-in member for this request, or null — also clears an expired/invalid cookie. */
export async function getCurrentMember(): Promise<SessionMember | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('customer_sessions')
    .select('id, expires_at, customers (id, phone, display_name, stars_balance, pin_hash)')
    .eq('id', token)
    .maybeSingle();

  if (error) throw error;

  const account = (data as SessionRow | null)?.customers;
  const isValid = !!data && !!account && new Date(data.expires_at) > new Date();

  if (!isValid || !account) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return mapCustomerRow(account);
}

/** Throws unless the caller is a logged-in member — guard for member-only server actions. */
export async function requireMember(): Promise<SessionMember> {
  const member = await getCurrentMember();
  if (!member) throw new Error('กรุณาเข้าสู่ระบบสมาชิกก่อน');
  return member;
}
