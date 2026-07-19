import type { Metadata } from 'next';

import { getBillHistory } from 'src/lib/order-service';

import { AdminBillsView } from 'src/sections/admin/bills/admin-bills-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'เช็คบิล | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const bills = await getBillHistory();

  return <AdminBillsView initialBills={bills} />;
}
