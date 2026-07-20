import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { SHOP_TZ } from 'src/utils/business-hours';

import { getSupabaseAdmin } from './supabase-admin';

// ----------------------------------------------------------------------

dayjs.extend(utc);
dayjs.extend(timezone);

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

export type OverviewOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber: string;
  status: 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';
  total: number;
  createdAt: string;
};

export type OverviewOperations = {
  pending: number;
  preparing: number;
  served: number;
  recentOrders: OverviewOrder[];
};

export type TrafficPoint = {
  key: string;
  label: string;
  orderCount: number;
  revenue: number;
  observed?: boolean;
};

export type CategoryBestSellers = {
  category: string;
  label: string;
  items: BestSellerItem[];
};

export type DashboardPeriodAnalytics = {
  summary: SalesPeriodSummary;
  /** Same total, split by order type — both start back at 0 each period since summary itself does. */
  salesByType: Record<'dine-in' | 'takeaway', SalesPeriodSummary>;
  dishCount: number;
  bestSellers: BestSellerItem[];
  categoryBestSellers: CategoryBestSellers[];
  timeTraffic: TrafficPoint[];
  dayTraffic: TrafficPoint[];
};

export type DashboardAnalytics = Record<SalesPeriod, DashboardPeriodAnalytics>;

const TIME_BANDS = [
  { key: 'early', label: '00:00–05:59', from: 0, to: 5 },
  { key: 'morning', label: '06:00–10:59', from: 6, to: 10 },
  { key: 'lunch', label: '11:00–13:59', from: 11, to: 13 },
  { key: 'afternoon', label: '14:00–16:59', from: 14, to: 16 },
  { key: 'evening', label: '17:00–20:59', from: 17, to: 20 },
  { key: 'night', label: '21:00–23:59', from: 21, to: 23 },
];

const DAYS = [
  { key: 1, label: 'จันทร์' },
  { key: 2, label: 'อังคาร' },
  { key: 3, label: 'พุธ' },
  { key: 4, label: 'พฤหัสบดี' },
  { key: 5, label: 'ศุกร์' },
  { key: 6, label: 'เสาร์' },
  { key: 0, label: 'อาทิตย์' },
];

type DashboardOrderRow = {
  total: number;
  created_at: string;
  order_type: 'dine-in' | 'takeaway';
  order_items: {
    name: string;
    price: number;
    quantity: number;
    menu_items: { category: string } | { category: string }[] | null;
  }[];
};

function addBestSeller(
  tally: Map<string, BestSellerItem>,
  name: string,
  quantity: number,
  revenue: number
) {
  const current = tally.get(name) ?? { name, quantity: 0, revenue: 0 };
  current.quantity += quantity;
  current.revenue += revenue;
  tally.set(name, current);
}

function sortedBestSellers(tally: Map<string, BestSellerItem>, limit: number) {
  return Array.from(tally.values())
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, limit);
}

function observedWeekdays(start: dayjs.Dayjs, now: dayjs.Dayjs): Set<number> {
  const result = new Set<number>();
  let cursor = start.startOf('day');

  while (cursor.isBefore(now, 'day') || cursor.isSame(now, 'day')) {
    result.add(cursor.day());
    cursor = cursor.add(1, 'day');
  }

  return result;
}

function buildPeriodAnalytics(
  rows: DashboardOrderRow[],
  start: dayjs.Dayjs,
  now: dayjs.Dayjs,
  categoryLabels: Map<string, string>
): DashboardPeriodAnalytics {
  const periodRows = rows.filter((row) => {
    const createdAt = dayjs(row.created_at).tz(SHOP_TZ);
    return createdAt.isAfter(start) || createdAt.isSame(start);
  });
  const overallTally = new Map<string, BestSellerItem>();
  const categoryTallies = new Map<string, Map<string, BestSellerItem>>();
  const timeTraffic = TIME_BANDS.map((band) => ({
    key: band.key,
    label: band.label,
    orderCount: 0,
    revenue: 0,
  }));
  const observedDays = observedWeekdays(start, now);
  const dayTraffic = DAYS.map((day) => ({
    key: String(day.key),
    label: day.label,
    orderCount: 0,
    revenue: 0,
    observed: observedDays.has(day.key),
  }));
  let dishCount = 0;

  periodRows.forEach((order) => {
    const createdAt = dayjs(order.created_at).tz(SHOP_TZ);
    const total = Number(order.total);
    const bandIndex = TIME_BANDS.findIndex(
      (band) => createdAt.hour() >= band.from && createdAt.hour() <= band.to
    );
    if (bandIndex >= 0) {
      timeTraffic[bandIndex].orderCount += 1;
      timeTraffic[bandIndex].revenue += total;
    }
    const dayPoint = dayTraffic.find((day) => day.key === String(createdAt.day()));
    if (dayPoint) {
      dayPoint.orderCount += 1;
      dayPoint.revenue += total;
    }

    order.order_items.forEach((item) => {
      const quantity = Number(item.quantity);
      const revenue = Number(item.price) * quantity;
      const menuItem = Array.isArray(item.menu_items) ? item.menu_items[0] : item.menu_items;
      const category = menuItem?.category ?? 'custom';
      const categoryTally = categoryTallies.get(category) ?? new Map<string, BestSellerItem>();

      dishCount += quantity;
      addBestSeller(overallTally, item.name, quantity, revenue);
      addBestSeller(categoryTally, item.name, quantity, revenue);
      categoryTallies.set(category, categoryTally);
    });
  });

  const salesByType: Record<'dine-in' | 'takeaway', SalesPeriodSummary> = {
    'dine-in': { total: 0, orderCount: 0 },
    takeaway: { total: 0, orderCount: 0 },
  };
  periodRows.forEach((order) => {
    salesByType[order.order_type].total += Number(order.total);
    salesByType[order.order_type].orderCount += 1;
  });

  return {
    summary: {
      total: periodRows.reduce((sum, order) => sum + Number(order.total), 0),
      orderCount: periodRows.length,
    },
    salesByType,
    dishCount,
    bestSellers: sortedBestSellers(overallTally, 8),
    categoryBestSellers: Array.from(categoryTallies.entries())
      .map(([category, tally]) => ({
        category,
        label: categoryLabels.get(category) ?? (category === 'custom' ? 'เมนูเลือกเอง' : category),
        items: sortedBestSellers(tally, 3),
      }))
      .sort((a, b) => {
        const aQuantity = a.items.reduce((sum, item) => sum + item.quantity, 0);
        const bQuantity = b.items.reduce((sum, item) => sum + item.quantity, 0);
        return bQuantity - aQuantity;
      }),
    timeTraffic,
    dayTraffic,
  };
}

/** One-query analytics source for the daily, weekly and monthly dashboard. */
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const supabase = getSupabaseAdmin();
  const now = dayjs().tz(SHOP_TZ);
  const monthStart = now.startOf('month');
  const weekStart = now.startOf('day').subtract((now.day() + 6) % 7, 'day');
  const queryStart = weekStart.isBefore(monthStart) ? weekStart : monthStart;
  const [ordersResult, categoriesResult] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'total, created_at, order_type, order_items (name, price, quantity, menu_items (category))'
      )
      .neq('status', 'cancelled')
      .gte('created_at', queryStart.toISOString()),
    supabase.from('menu_categories').select('value, label'),
  ]);

  if (ordersResult.error) throw ordersResult.error;
  if (categoriesResult.error) throw categoriesResult.error;

  const rows = (ordersResult.data ?? []) as unknown as DashboardOrderRow[];
  const categoryLabels = new Map(
    (categoriesResult.data ?? []).map((category) => [category.value, category.label])
  );

  return {
    today: buildPeriodAnalytics(rows, now.startOf('day'), now, categoryLabels),
    week: buildPeriodAnalytics(rows, weekStart, now, categoryLabels),
    month: buildPeriodAnalytics(rows, monthStart, now, categoryLabels),
  };
}

/** Today's summary + best sellers only — lighter query used by the staff daily sales view. */
export async function getTodaySales(): Promise<DashboardPeriodAnalytics> {
  const supabase = getSupabaseAdmin();
  const now = dayjs().tz(SHOP_TZ);
  const todayStart = now.startOf('day');

  const [ordersResult, categoriesResult] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'total, created_at, order_type, order_items (name, price, quantity, menu_items (category))'
      )
      .neq('status', 'cancelled')
      .gte('created_at', todayStart.toISOString()),
    supabase.from('menu_categories').select('value, label'),
  ]);

  if (ordersResult.error) throw ordersResult.error;
  if (categoriesResult.error) throw categoriesResult.error;

  const rows = (ordersResult.data ?? []) as unknown as DashboardOrderRow[];
  const categoryLabels = new Map(
    (categoriesResult.data ?? []).map((category) => [category.value, category.label])
  );

  return buildPeriodAnalytics(rows, todayStart, now, categoryLabels);
}

function periodStartISO(period: SalesPeriod): string {
  const now = dayjs().tz(SHOP_TZ);
  if (period === 'week') {
    return now
      .startOf('day')
      .subtract((now.day() + 6) % 7, 'day')
      .toISOString();
  }

  return now.startOf(period === 'today' ? 'day' : 'month').toISOString();
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

/** Live workload and the latest orders used by the admin overview. */
export async function getOverviewOperations(): Promise<OverviewOperations> {
  const supabase = getSupabaseAdmin();
  const [activeResult, recentResult] = await Promise.all([
    supabase.from('orders').select('status').in('status', ['pending', 'preparing', 'served']),
    supabase
      .from('orders')
      .select('id, seq, customer_name, order_type, table_number, status, total, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (activeResult.error) throw activeResult.error;
  if (recentResult.error) throw recentResult.error;

  const active = activeResult.data ?? [];

  return {
    pending: active.filter((order) => order.status === 'pending').length,
    preparing: active.filter((order) => order.status === 'preparing').length,
    served: active.filter((order) => order.status === 'served').length,
    recentOrders: (recentResult.data ?? []).map((order) => ({
      id: order.id,
      orderNumber: `#${String(order.seq).padStart(4, '0')}`,
      customerName: order.customer_name,
      orderType: order.order_type,
      tableNumber: order.table_number,
      status: order.status,
      total: Number(order.total),
      createdAt: order.created_at,
    })),
  };
}
