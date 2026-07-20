import type { Metadata } from 'next';

import { getTables } from 'src/lib/table-service';
import { getShopSettings } from 'src/lib/shop-settings-service';

import { AdminTablesView } from 'src/sections/admin/tables/admin-tables-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'QR โต๊ะ | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const [tables, settings] = await Promise.all([getTables(), getShopSettings()]);

  return <AdminTablesView initialTables={tables} shopName={settings.name} />;
}
