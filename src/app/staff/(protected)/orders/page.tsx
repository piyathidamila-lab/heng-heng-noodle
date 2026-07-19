import type { Metadata } from 'next';

import { getOrders, getOpenTableSessions } from 'src/lib/order-service';

import { StaffOrdersView } from 'src/sections/staff/orders/staff-orders-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'ออเดอร์ | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const [orders, sessions] = await Promise.all([getOrders(), getOpenTableSessions()]);

  return <StaffOrdersView initialOrders={orders} initialSessions={sessions} />;
}
