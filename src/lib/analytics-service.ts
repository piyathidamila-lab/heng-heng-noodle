import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { getSupabaseAdmin } from './supabase-admin';

// ----------------------------------------------------------------------

dayjs.extend(utc);
dayjs.extend(timezone);

const SHOP_TZ = 'Asia/Bangkok';

export type SalesPeriod = 'today' | 'week' | 'month';

export type SalesPeriodSummary = {
  total: number;
  orderCount: number;
};

export type SalesSummary = Record<SalesPeriod, SalesPeriodSummary>;

export type BestSellerItem = {
  name: string;
  quantity: number;
  revenue: number;
};

function periodStartISO(period: SalesPeriod): string {
  const now = dayjs().tz(SHOP_TZ);
  const unit = period === 'today' ? 'day' : period === 'week' ? 'week' : 'month';
  return now.startOf(unit).toISOString();
}

/** Total revenue + order count for each period, in shop-local (Bangkok) time. */
export async function getSalesSummary(): Promise<SalesSummary> {
  const supabase = getSupabaseAdmin();
  const periods: SalesPeriod[] = ['today', 'week', 'month'];

  const results = await Promise.all(
    periods.map(async (period) => {
      const { data, error } = await supabase
        .from('orders')
        .select('total')
        .neq('status', 'cancelled')
        .gte('created_at', periodStartISO(period));

      if (error) throw error;

      const rows = data ?? [];
      return [
        period,
        {
          total: rows.reduce((sum, row) => sum + Number(row.total), 0),
          orderCount: rows.length,
        },
      ] as const;
    })
  );

  return Object.fromEntries(results) as SalesSummary;
}

/** Menu items ranked by quantity sold within a period, highest first. */
export async function getBestSellers(period: SalesPeriod, limit = 8): Promise<BestSellerItem[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('orders')
    .select('order_items (name, price, quantity)')
    .neq('status', 'cancelled')
    .gte('created_at', periodStartISO(period));

  if (error) throw error;

  const tally = new Map<string, BestSellerItem>();

  (data ?? []).forEach((order) => {
    const items = (order.order_items ?? []) as { name: string; price: number; quantity: number }[];
    items.forEach((item) => {
      const entry = tally.get(item.name) ?? { name: item.name, quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue += Number(item.price) * item.quantity;
      tally.set(item.name, entry);
    });
  });

  return Array.from(tally.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}
