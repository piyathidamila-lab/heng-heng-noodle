import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import { getCurrentUser } from 'src/lib/auth-session';
import { getShopSettings } from 'src/lib/shop-settings-service';

import { LoginView } from 'src/sections/auth/login-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'เข้าสู่ระบบ | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === 'admin' ? '/admin/overview' : '/staff/orders');
  }

  const settings = await getShopSettings();

  return <LoginView shopName={settings.name} />;
}
