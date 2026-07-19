'use server';

import type { AdminUser, CreateUserInput, UpdateUserInput } from 'src/lib/user-service';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from 'src/lib/auth-session';
import { getUsers, createUser, deleteUser, updateUser, resetUserPassword } from 'src/lib/user-service';

// ----------------------------------------------------------------------

export async function listUsersAdmin(): Promise<AdminUser[]> {
  await requireAdmin();
  return getUsers();
}

export async function createUserAdmin(input: CreateUserInput): Promise<AdminUser> {
  await requireAdmin();
  const user = await createUser(input);
  revalidatePath('/admin/users');
  return user;
}

export async function updateUserAdmin(id: string, patch: UpdateUserInput): Promise<AdminUser> {
  await requireAdmin();
  const user = await updateUser(id, patch);
  revalidatePath('/admin/users');
  return user;
}

export async function resetUserPasswordAdmin(id: string, password: string): Promise<void> {
  await requireAdmin();
  await resetUserPassword(id, password);
}

export async function deleteUserAdmin(id: string): Promise<void> {
  const me = await requireAdmin();
  if (me.id === id) {
    throw new Error('ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้');
  }
  await deleteUser(id);
  revalidatePath('/admin/users');
}
