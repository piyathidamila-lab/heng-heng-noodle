/**
 * Shared between the server (broadcasting via the service-role client in
 * order-service.ts) and the browser (subscribing via supabase-browser.ts) —
 * kept free of any Supabase client import so it's safe in either bundle.
 */

export const ORDERS_REALTIME_CHANNEL = 'orders';

export const ORDERS_REALTIME_EVENTS = {
  /** A new dine-in or takeaway order was placed. */
  newOrder: 'new_order',
  /** An existing order's status/payment changed, or a table session moved/closed. */
  orderUpdated: 'order_updated',
} as const;

export type OrdersRealtimeEventName =
  (typeof ORDERS_REALTIME_EVENTS)[keyof typeof ORDERS_REALTIME_EVENTS];

/** Payload for `newOrder` — enough for a staff board to chime and, later, auto-print a kitchen ticket. */
export type NewOrderRealtimePayload = {
  orderId: string;
  orderType: 'dine-in' | 'takeaway';
};
