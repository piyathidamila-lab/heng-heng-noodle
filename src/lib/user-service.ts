import { getSupabaseAdmin } from './supabase-admin';
import { hashPassword, verifyPassword } from './password';

// ----------------------------------------------------------------------

export type UserRole = 'admin' | 'staff';

export type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export class UserValidationError extends Error {}

const USER_SELECT_COLUMNS = 'id, username, display_name, role, is_active, created_at';

type UserRow = {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

function mapUserRow(row: UserRow): AdminUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

/** All accounts, newest first — for the admin "จัดการผู้ใช้งาน" page. */
export async function getUsers(): Promise<AdminUser[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('admin_users')
    .select(USER_SELECT_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapUserRow);
}

export type CreateUserInput = {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
};

export async function createUser(input: CreateUserInput): Promise<AdminUser> {
  const username = input.username.trim();

  if (!username) throw new UserValidationError('กรุณากรอกชื่อผู้ใช้');
  if (input.password.length < 6) throw new UserValidationError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      username,
      password_hash: hashPassword(input.password),
      display_name: input.displayName.trim(),
      role: input.role,
    })
    .select(USER_SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') throw new UserValidationError('ชื่อผู้ใช้นี้มีอยู่แล้ว');
    throw error;
  }

  return mapUserRow(data);
}

export type UpdateUserInput = {
  displayName?: string;
  role?: UserRole;
  isActive?: boolean;
};

export async function updateUser(id: string, input: UpdateUserInput): Promise<AdminUser> {
  const supabase = getSupabaseAdmin();

  if (input.role === 'staff' || input.isActive === false) {
    await assertNotLastActiveAdmin(id);
  }

  const patch: Record<string, unknown> = {};
  if (input.displayName !== undefined) patch.display_name = input.displayName.trim();
  if (input.role !== undefined) patch.role = input.role;
  if (input.isActive !== undefined) patch.is_active = input.isActive;

  const { data, error } = await supabase
    .from('admin_users')
    .update(patch)
    .eq('id', id)
    .select(USER_SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return mapUserRow(data);
}

export async function resetUserPassword(id: string, password: string): Promise<void> {
  if (password.length < 6) throw new UserValidationError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('admin_users')
    .update({ password_hash: hashPassword(password) })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteUser(id: string): Promise<void> {
  await assertNotLastActiveAdmin(id);

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('admin_users').delete().eq('id', id);

  if (error) throw error;
}

/** Blocks demoting/deactivating/deleting the only remaining active admin — that would lock everyone out. */
async function assertNotLastActiveAdmin(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: target, error: targetError } = await supabase
    .from('admin_users')
    .select('role, is_active')
    .eq('id', id)
    .single();

  if (targetError) throw targetError;
  if (target.role !== 'admin' || !target.is_active) return;

  const { count, error: countError } = await supabase
    .from('admin_users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
    .eq('is_active', true);

  if (countError) throw countError;
  if ((count ?? 0) <= 1) {
    throw new UserValidationError('ต้องมีแอดมินที่ใช้งานได้อย่างน้อย 1 คนเสมอ');
  }
}

export type VerifiedUser = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
};

/** Checks username/password against admin_users — null if no match or the account is deactivated. */
export async function verifyUserCredentials(
  username: string,
  password: string
): Promise<VerifiedUser | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, username, display_name, role, is_active, password_hash')
    .eq('username', username.trim())
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.is_active) return null;
  if (!verifyPassword(password, data.password_hash)) return null;

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    role: data.role,
  };
}
