const STORAGE_KEY = 'hh-order-history';
const MAX_ENTRIES = 20;

export type StoredOrderItem = {
  name: string;
  emoji: string;
  price: number;
  quantity: number;
};

export type StoredOrder = {
  orderNumber: string;
  orderTime: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber: string;
  total: number;
  items: StoredOrderItem[];
};

export function getOrderHistory(): StoredOrder[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addOrderToHistory(order: StoredOrder): void {
  const next = [order, ...getOrderHistory()].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
