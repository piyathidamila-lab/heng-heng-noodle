import type { Metadata } from 'next';

import { getTodaySales } from 'src/lib/analytics-service';

import { StaffSalesView } from 'src/sections/staff/sales/staff-sales-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'ยอดขายวันนี้ | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const sales = await getTodaySales();

  return <StaffSalesView initialSales={sales} />;
}
