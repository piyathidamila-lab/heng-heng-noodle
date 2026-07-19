import type { Metadata } from 'next';

import { getCurrentMember } from 'src/lib/member-session';
import { getShopSettings } from 'src/lib/shop-settings-service';
import { listMyRedemptions, listActiveRewards } from 'src/lib/loyalty-service';

import { LoyaltyView } from 'src/sections/loyalty/loyalty-view';

// ----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'สะสมดาว | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const settings = await getShopSettings();

  if (!settings.loyalty.enabled) {
    return <LoyaltyView enabled={false} member={null} rewards={[]} myRedemptions={[]} />;
  }

  const member = await getCurrentMember();
  const [rewards, myRedemptions] = await Promise.all([
    listActiveRewards(),
    member ? listMyRedemptions(member.id) : Promise.resolve([]),
  ]);

  return (
    <LoyaltyView enabled member={member} rewards={rewards} myRedemptions={myRedemptions} />
  );
}
