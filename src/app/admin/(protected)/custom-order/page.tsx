import type { Metadata } from 'next';

import { getShopSettings } from 'src/lib/shop-settings-service';

import { AdminCustomOrderView } from 'src/sections/admin/custom-order/admin-custom-order-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'เมนูความอร่อยเลือกเอง | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const settings = await getShopSettings();

  return <AdminCustomOrderView initialSettings={settings} />;
}
