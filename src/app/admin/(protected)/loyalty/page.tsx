import type { Metadata } from 'next';

import { getShopSettings } from 'src/lib/shop-settings-service';
import { listMembersAdmin, listRewardsAdmin, listPendingRedemptionsAdmin } from 'src/lib/loyalty-service';

import { AdminLoyaltyView } from 'src/sections/admin/loyalty/admin-loyalty-view';

export const metadata: Metadata = { title: 'สะสมดาว | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const [settings, members, rewards, pendingRedemptions] = await Promise.all([
    getShopSettings(),
    listMembersAdmin(),
    listRewardsAdmin(),
    listPendingRedemptionsAdmin(),
  ]);

  return (
    <AdminLoyaltyView
      initialLoyaltyConfig={settings.loyalty}
      initialMembers={members}
      initialRewards={rewards}
      initialPendingRedemptions={pendingRedemptions}
    />
  );
}
