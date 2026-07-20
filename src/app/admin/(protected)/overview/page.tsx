import type { Metadata } from 'next';

import { getDashboardAnalytics } from 'src/lib/analytics-service';

import { AdminOverviewView } from 'src/sections/admin/overview/admin-overview-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'ภาพรวม | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const analytics = await getDashboardAnalytics();

  return <AdminOverviewView analytics={analytics} />;
}
