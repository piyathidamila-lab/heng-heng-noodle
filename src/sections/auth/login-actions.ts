'use server';

import { redirect } from 'next/navigation';

import { login } from 'src/lib/auth-session';

// ----------------------------------------------------------------------

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const user = await login(username, password);

  if (!user) {
    return { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  }

  redirect(user.role === 'admin' ? '/admin/overview' : '/staff/orders');
  return {};
}
