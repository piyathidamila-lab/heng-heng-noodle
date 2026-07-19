import type { Metadata } from 'next';

import { getOrderHistory } from 'src/lib/order-service';

import { AdminOrderHistoryView } from 'src/sections/admin/order-history/admin-order-history-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'ประวัติออเดอร์ | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const orders = await getOrderHistory();

  return <AdminOrderHistoryView initialOrders={orders} />;
}
