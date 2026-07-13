'use server';

import { redirect } from 'next/navigation';

import { clearAdminSession } from 'src/lib/admin-session';

// ----------------------------------------------------------------------

export async function adminLogoutAction(): Promise<void> {
  await clearAdminSession();
  redirect('/admin/login');
}
