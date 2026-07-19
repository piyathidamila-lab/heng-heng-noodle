import type { Metadata } from 'next';

import { listPendingRedemptionsAdmin } from 'src/lib/loyalty-service';

import { StaffRedemptionsView } from 'src/sections/staff/redemptions/staff-redemptions-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'แลกของรางวัล | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const redemptions = await listPendingRedemptionsAdmin();

  return <StaffRedemptionsView initialRedemptions={redemptions} />;
}
