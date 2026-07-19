import type { Metadata } from 'next';

import { getTableAvailability } from 'src/lib/table-service';
import { getShopSettings } from 'src/lib/shop-settings-service';

import { TableAvailabilityView } from 'src/sections/order/view/table-availability-view';

// ----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const shop = await getShopSettings();

  return {
    title: `สถานะโต๊ะ | ${shop.name}`,
    description: `ดูโต๊ะว่างและโต๊ะไม่ว่างของ${shop.name}`,
  };
}

export default async function TablesPage() {
  const [tables, shop] = await Promise.all([getTableAvailability(), getShopSettings()]);

  return (
    <TableAvailabilityView
      shopName={shop.name}
      initialTables={tables}
      initialUpdatedAt={new Date().toISOString()}
    />
  );
}
