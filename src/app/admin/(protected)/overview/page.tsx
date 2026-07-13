import type { Metadata } from 'next';

import { getBestSellers, getSalesSummary } from 'src/lib/analytics-service';

import { AdminOverviewView } from 'src/sections/admin/overview/admin-overview-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'ภาพรวม | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const [summary, bestToday, bestWeek, bestMonth] = await Promise.all([
    getSalesSummary(),
    getBestSellers('today'),
    getBestSellers('week'),
    getBestSellers('month'),
  ]);

  return (
    <AdminOverviewView
      summary={summary}
      bestSellers={{ today: bestToday, week: bestWeek, month: bestMonth }}
    />
  );
}
