import type { Metadata } from 'next';

import { getOrders, getOpenTableSessions } from 'src/lib/order-service';

import { AdminOrdersView } from 'src/sections/admin/orders/admin-orders-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'ออเดอร์ | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const [orders, sessions] = await Promise.all([getOrders(), getOpenTableSessions()]);

  return <AdminOrdersView initialOrders={orders} initialSessions={sessions} />;
}
