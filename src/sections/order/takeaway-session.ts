const ACTIVE_TAKEAWAY_KEY = 'hh-active-takeaway-order';
const MAX_ACTIVE_AGE_MS = 24 * 60 * 60 * 1000;

export type ActiveTakeawayOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  createdAt: string;
};

export function getActiveTakeawayOrder(): ActiveTakeawayOrder | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(ACTIVE_TAKEAWAY_KEY);
    if (!raw) return null;

    const order = JSON.parse(raw) as Partial<ActiveTakeawayOrder>;
    if (!order.id || !order.orderNumber || !order.createdAt) {
      window.localStorage.removeItem(ACTIVE_TAKEAWAY_KEY);
      return null;
    }

    const createdAt = new Date(order.createdAt).getTime();
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > MAX_ACTIVE_AGE_MS) {
      window.localStorage.removeItem(ACTIVE_TAKEAWAY_KEY);
      return null;
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName ?? '',
      createdAt: order.createdAt,
    };
  } catch {
    return null;
  }
}

export function saveActiveTakeawayOrder(order: ActiveTakeawayOrder): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(ACTIVE_TAKEAWAY_KEY, JSON.stringify(order));
  } catch {
    // The order still succeeds when storage is unavailable (for example in
    // strict private browsing); only refresh persistence is skipped.
  }
}

export function clearActiveTakeawayOrder(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(ACTIVE_TAKEAWAY_KEY);
  } catch {
    // Ignore unavailable browser storage.
  }
}
