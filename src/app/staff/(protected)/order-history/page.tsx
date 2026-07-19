import type { Metadata } from 'next';

import { getOrderHistory } from 'src/lib/order-service';

import { StaffOrderHistoryView } from 'src/sections/staff/order-history/staff-order-history-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'ประวัติออเดอร์ | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const orders = await getOrderHistory();

  return <StaffOrderHistoryView initialOrders={orders} />;
}
