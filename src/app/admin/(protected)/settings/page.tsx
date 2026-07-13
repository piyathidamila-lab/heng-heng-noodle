import type { Metadata } from 'next';

import { getShopSettings } from 'src/lib/shop-settings-service';

import { AdminSettingsView } from 'src/sections/admin/settings/admin-settings-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'ข้อมูลร้านค้า | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const settings = await getShopSettings();

  return <AdminSettingsView initialSettings={settings} />;
}
