'use server';

import { redirect } from 'next/navigation';

import { checkAdminPassword, createAdminSession } from 'src/lib/admin-session';

// ----------------------------------------------------------------------

export type LoginState = { error?: string };

export async function adminLoginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');

  if (!checkAdminPassword(password)) {
    return { error: 'รหัสผ่านไม่ถูกต้อง' };
  }

  await createAdminSession();
  redirect('/admin/menu');
  return {};
}
