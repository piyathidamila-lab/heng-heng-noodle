'use server';

import { redirect } from 'next/navigation';

import { clearSession } from 'src/lib/auth-session';

// ----------------------------------------------------------------------

export async function adminLogoutAction(): Promise<void> {
  await clearSession();
  redirect('/login');
}
