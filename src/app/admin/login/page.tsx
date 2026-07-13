import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import { isAdminAuthenticated } from 'src/lib/admin-session';
import { getShopSettings } from 'src/lib/shop-settings-service';

import { AdminLoginView } from 'src/sections/admin/login/admin-login-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'เข้าสู่ระบบแอดมิน | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  if (await isAdminAuthenticated()) {
    redirect('/admin/overview');
  }

  const settings = await getShopSettings();

  return <AdminLoginView shopName={settings.name} />;
}
