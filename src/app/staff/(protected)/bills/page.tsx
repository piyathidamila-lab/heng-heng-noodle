import type { Metadata } from 'next';

import { getBillHistory } from 'src/lib/order-service';

import { StaffBillsView } from 'src/sections/staff/bills/staff-bills-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'เช็คบิล | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const bills = await getBillHistory();

  return <StaffBillsView initialBills={bills} />;
}
