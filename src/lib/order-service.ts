import type { RealtimeChannel } from '@supabase/supabase-js';
import type { OrdersRealtimeEventName } from './realtime-events';
import type { CustomOrderSelection } from './shop-settings-service';

import { getShopDateKey, getShopDayStartISO } from 'src/utils/business-hours';

import { getSupabaseAdmin } from './supabase-admin';
import { getShopSettings } from './shop-settings-service';
import { awardStarsForOrder, awardStarsForSession } from './loyalty-service';
import { ORDERS_REALTIME_EVENTS, ORDERS_REALTIME_CHANNEL } from './realtime-events';

// ----------------------------------------------------------------------

let ordersRealtimeChannel: RealtimeChannel | null = null;

/**
 * Wakes up any staff/admin board subscribed to ORDERS_REALTIME_CHANNEL —
 * sent over Realtime's REST broadcast endpoint (no persistent socket needed,
 * so this works fine from a serverless invocation). Reuses one channel
 * instance across calls instead of opening a new one per event. Never
 * throws — a lost realtime nudge shouldn't fail the order mutation that
 * triggered it; the client's fallback poll will still pick it up.
 */
async function broadcastOrdersEvent(
  event: OrdersRealtimeEventName,
  payload: Record<string, unknown> = {}
): Promise<void> {
  try {
    ordersRealtimeChannel ??= getSupabaseAdmin().channel(ORDERS_REALTIME_CHANNEL);
    await ordersRealtimeChannel.httpSend(event, payload);
  } catch (error) {
    console.error('Failed to broadcast orders realtime event', error);
  }
}

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';

export type OrderItemRecord = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber: string;
  note: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  total: number;
  createdAt: string;
  items: OrderItemRecord[];
};

export type CreateOrderInput = {
  customerName: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber: string;
  note: string;
  lines: {
    menuItemId?: string;
    quantity: number;
    customization?: CustomOrderSelection;
  }[];
  /** Resolved server-side from the member session cookie — never taken from client input. */
  customerId?: string;
};

export class OrderValidationError extends Error {}

function formatOrderNumber(seq: number): string {
  return `#${String(seq).padStart(4, '0')}`;
}

/**
 * Finds the currently open session for a table, or opens a new one. A
 * table only has at most one open session at a time (enforced by a
 * partial unique index) — this is what lets the QR table view show just
 * the current diners' orders instead of every order ever placed there.
 */
async function getOrCreateOpenSession(tableNumber: string, customerId?: string): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data: existing, error: selectError } = await supabase
    .from('table_sessions')
    .select('id, customer_id')
    .eq('table_number', tableNumber)
    .eq('status', 'open')
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) {
    // First logged-in member to order in this session "claims" it for star
    // awarding — later orders (guest or a different member) don't override it.
    if (customerId && !existing.customer_id) {
      await supabase
        .from('table_sessions')
        .update({ customer_id: customerId })
        .eq('id', existing.id);
    }
    return existing.id;
  }

  const { data: created, error: insertError } = await supabase
    .from('table_sessions')
    .insert({ table_number: tableNumber, customer_id: customerId ?? null })
    .select('id')
    .single();

  if (!insertError) return created.id;

  // Another request opened the session concurrently — the unique index
  // rejected our insert, so fall back to reading the one that won.
  const { data: retry, error: retryError } = await supabase
    .from('table_sessions')
    .select('id')
    .eq('table_number', tableNumber)
    .eq('status', 'open')
    .maybeSingle();

  if (retryError) throw retryError;
  if (retry) return retry.id;

  throw insertError;
}

/**
 * Creates an order after re-pricing every line from the current menu_items
 * table — the client only ever sends menu item ids + quantities, so a
 * tampered "price" in the request body can't change what gets charged.
 */
export async function createOrderRecord(input: CreateOrderInput): Promise<OrderRecord> {
  const settings = await getShopSettings();
  if (!settings.isOpen) {
    throw new OrderValidationError(
      settings.closureReason
        ? `วันนี้ร้านหยุดเนื่องจาก ${settings.closureReason}`
        : 'ร้านปิดอยู่ในขณะนี้ ไม่สามารถสั่งอาหารได้'
    );
  }

  if (input.lines.length === 0) {
    throw new OrderValidationError('ตะกร้าว่างเปล่า');
  }
  if (!input.customerName.trim()) {
    throw new OrderValidationError('กรุณากรอกชื่อผู้สั่ง');
  }
  if (input.orderType === 'dine-in' && !input.tableNumber.trim()) {
    throw new OrderValidationError('กรุณาระบุหมายเลขโต๊ะ');
  }

  const supabase = getSupabaseAdmin();

  const menuItemIds = input.lines
    .filter((line) => !line.customization && line.menuItemId)
    .map((line) => line.menuItemId as string);

  const { data: menuItems, error: menuError } = menuItemIds.length
    ? await supabase
        .from('menu_items')
        .select('id, name, price, is_available')
        .in('id', menuItemIds)
    : { data: [], error: null };

  if (menuError) throw menuError;

  const menuById = new Map((menuItems ?? []).map((item) => [item.id, item]));

  const orderItems = input.lines.map((line) => {
    if (line.quantity <= 0 || !Number.isInteger(line.quantity)) {
      throw new OrderValidationError('จำนวนรายการไม่ถูกต้อง');
    }

    if (line.customization) {
      const config = settings.customOrder;
      if (!config.enabled || config.steps.length === 0) {
        throw new OrderValidationError('เมนูความอร่อยเลือกเองปิดให้บริการแล้ว กรุณาลองใหม่');
      }

      const choiceByStep = new Map(
        line.customization.choices.map((choice) => [choice.stepId, choice.optionId])
      );
      if (
        choiceByStep.size !== config.steps.length ||
        line.customization.choices.length !== config.steps.length
      ) {
        throw new OrderValidationError('กรุณาเลือกตัวเลือกให้ครบทุกขั้นตอน');
      }

      const selectedOptions = config.steps.map((step) => {
        const optionId = choiceByStep.get(step.id);
        const option = step.options.find((item) => item.id === optionId);
        if (!option) {
          throw new OrderValidationError('ตัวเลือกมีการเปลี่ยนแปลง กรุณาเลือกใหม่อีกครั้ง');
        }
        return option;
      });

      return {
        menu_item_id: null,
        name: `${config.title} (${selectedOptions.map((option) => option.label).join(' · ')})`,
        price: selectedOptions.reduce((sum, option) => sum + option.price, 0),
        quantity: line.quantity,
      };
    }

    if (!line.menuItemId) {
      throw new OrderValidationError('รายการอาหารไม่ถูกต้อง');
    }

    const menuItem = menuById.get(line.menuItemId);

    if (!menuItem || !menuItem.is_available) {
      throw new OrderValidationError('มีรายการอาหารที่ไม่พร้อมจำหน่ายในตะกร้า กรุณาลองใหม่');
    }
    return {
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price),
      quantity: line.quantity,
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const tableNumber = input.orderType === 'dine-in' ? input.tableNumber.trim() : '';
  const sessionId =
    input.orderType === 'dine-in'
      ? await getOrCreateOpenSession(tableNumber, input.customerId)
      : null;

  // Order number shown to customers/staff resets daily — atomically claimed
  // via a DB function so two concurrent orders can never get the same number.
  const { data: dailySeq, error: dailySeqError } = await supabase.rpc('next_daily_order_seq', {
    p_order_date: getShopDateKey(),
  });

  if (dailySeqError) throw dailySeqError;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      session_id: sessionId,
      customer_name: input.customerName.trim(),
      order_type: input.orderType,
      table_number: tableNumber,
      note: input.note.trim(),
      total,
      daily_seq: dailySeq,
      customer_id: input.orderType === 'takeaway' ? (input.customerId ?? null) : null,
    })
    .select(
      'id, seq, daily_seq, customer_name, customer_phone, order_type, table_number, note, status, payment_status, paid_at, total, created_at'
    )
    .single();

  if (orderError) throw orderError;

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) throw itemsError;

  await broadcastOrdersEvent(ORDERS_REALTIME_EVENTS.newOrder, {
    orderId: order.id,
    orderType: order.order_type,
  });

  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.daily_seq ?? order.seq),
    customerName: order.customer_name,
    customerPhone: order.customer_phone ?? '',
    orderType: order.order_type,
    tableNumber: order.table_number,
    note: order.note,
    status: order.status,
    paymentStatus: order.payment_status as PaymentStatus,
    paidAt: order.paid_at,
    total: Number(order.total),
    createdAt: order.created_at,
    items: orderItems.map((item, index) => ({
      id: `${order.id}-${index}`,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  };
}

const ORDER_SELECT_COLUMNS =
  'id, seq, daily_seq, customer_name, customer_phone, order_type, table_number, note, status, payment_status, paid_at, total, created_at, order_items (id, name, price, quantity)';

type OrderRow = {
  id: string;
  seq: number;
  daily_seq: number | null;
  customer_name: string;
  customer_phone: string | null;
  order_type: 'dine-in' | 'takeaway';
  table_number: string;
  note: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  paid_at: string | null;
  total: number;
  created_at: string;
  order_items: { id: string; name: string; price: number; quantity: number }[] | null;
};

function mapOrderRow(order: OrderRow): OrderRecord {
  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.daily_seq ?? order.seq),
    customerName: order.customer_name,
    customerPhone: order.customer_phone ?? '',
    orderType: order.order_type,
    tableNumber: order.table_number,
    note: order.note,
    status: order.status,
    paymentStatus: order.payment_status,
    paidAt: order.paid_at,
    total: Number(order.total),
    createdAt: order.created_at,
    items: (order.order_items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
  };
}

/**
 * Today's orders (shop-local calendar day) for the live staff/admin board —
 * resets to nothing at midnight instead of dragging yesterday's finished
 * orders along. For full history across days, use getOrderHistory() instead.
 */
export async function getOrders(): Promise<OrderRecord[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT_COLUMNS)
    .gte('created_at', getShopDayStartISO())
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map(mapOrderRow);
}

export type OrderHistoryFilter = {
  /** Inclusive, `YYYY-MM-DD` in the shop's local calendar day. */
  from?: string;
  /** Inclusive, `YYYY-MM-DD` in the shop's local calendar day. */
  to?: string;
};

/**
 * Full order history for the admin dashboard (all order types, every
 * status), optionally narrowed to a day/month range — unlike getOrders()
 * this isn't capped to the live board's most recent 100.
 */
export async function getOrderHistory(filter: OrderHistoryFilter = {}): Promise<OrderRecord[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('orders')
    .select(ORDER_SELECT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(500);

  if (filter.from) {
    query = query.gte('created_at', `${filter.from}T00:00:00`);
  }
  if (filter.to) {
    query = query.lte('created_at', `${filter.to}T23:59:59.999`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []).map(mapOrderRow);
}

/** Takeaway orders shown in the checkout screen, newest first. */
export async function getTakeawayBillHistory(
  filter: OrderHistoryFilter = {}
): Promise<OrderRecord[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('orders')
    .select(ORDER_SELECT_COLUMNS)
    .eq('order_type', 'takeaway')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(500);

  if (filter.from) query = query.gte('created_at', `${filter.from}T00:00:00`);
  if (filter.to) query = query.lte('created_at', `${filter.to}T23:59:59.999`);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(mapOrderRow);
}

/** Every order (with customer phone) placed within one table session — the admin's bill view. */
export async function getOrdersBySession(sessionId: string): Promise<OrderRecord[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT_COLUMNS)
    .eq('session_id', sessionId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapOrderRow);
}

export type TableOrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: OrderItemRecord[];
};

/**
 * Orders for a table's *current* session only, newest first — used by the
 * shared "table view" so everyone who scanned the table's QR code sees
 * this round's orders, not every order the table has ever had. Returns an
 * empty list once the table has been closed (paid) or was never opened.
 */
export async function getOrdersByTable(tableNumber: string): Promise<TableOrderSummary[]> {
  const supabase = getSupabaseAdmin();

  const { data: session, error: sessionError } = await supabase
    .from('table_sessions')
    .select('id')
    .eq('table_number', tableNumber)
    .eq('status', 'open')
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!session) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, seq, daily_seq, customer_name, status, total, created_at, order_items (id, name, price, quantity)'
    )
    .eq('session_id', session.id)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((order) => ({
    id: order.id,
    orderNumber: formatOrderNumber(order.daily_seq ?? order.seq),
    customerName: order.customer_name,
    status: order.status,
    total: Number(order.total),
    createdAt: order.created_at,
    items: (order.order_items ?? []).map((item: OrderItemRecord) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
  }));
}

export type MemberOrderItem = {
  name: string;
  emoji: string;
  price: number;
  quantity: number;
};

export type MemberOrderSummary = {
  id: string;
  orderNumber: string;
  orderTime: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber: string;
  total: number;
  items: MemberOrderItem[];
};

const MEMBER_ORDER_SELECT =
  'id, seq, daily_seq, order_type, table_number, total, created_at, order_items (name, price, quantity, menu_items (emoji))';

type MemberOrderRow = {
  id: string;
  seq: number;
  daily_seq: number | null;
  order_type: 'dine-in' | 'takeaway';
  table_number: string;
  total: number;
  created_at: string;
  order_items:
    | { name: string; price: number; quantity: number; menu_items: { emoji: string } | null }[]
    | null;
};

function mapMemberOrderRow(order: MemberOrderRow): MemberOrderSummary {
  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.daily_seq ?? order.seq),
    orderTime: order.created_at,
    orderType: order.order_type,
    tableNumber: order.table_number,
    total: Number(order.total),
    items: (order.order_items ?? []).map((item) => ({
      name: item.name,
      emoji: item.menu_items?.emoji ?? '🍜',
      price: Number(item.price),
      quantity: item.quantity,
    })),
  };
}

/**
 * A member's own past orders, newest first — takeaway orders are attributed
 * directly via orders.customer_id, dine-in orders via the table_sessions row
 * they claimed by being first to order in it (see getOrCreateOpenSession).
 */
export async function getMemberOrderHistory(
  customerId: string,
  limit = 20
): Promise<MemberOrderSummary[]> {
  const supabase = getSupabaseAdmin();

  const [takeaway, dineIn] = await Promise.all([
    supabase
      .from('orders')
      .select(MEMBER_ORDER_SELECT)
      .eq('customer_id', customerId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('orders')
      .select(`${MEMBER_ORDER_SELECT}, table_sessions!inner (customer_id)`)
      .eq('table_sessions.customer_id', customerId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  if (takeaway.error) throw takeaway.error;
  if (dineIn.error) throw dineIn.error;

  return [...(takeaway.data ?? []), ...(dineIn.data ?? [])]
    .map((row) => mapMemberOrderRow(row as unknown as MemberOrderRow))
    .sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime())
    .slice(0, limit);
}

/** Bare status lookup for a single order by id — used to let a customer track their own takeaway order. */
export async function getOrderStatusById(id: string): Promise<OrderStatus | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.from('orders').select('status').eq('id', id).maybeSingle();

  if (error) throw error;

  return data?.status ?? null;
}

export async function updateOrderStatusRecord(id: string, status: OrderStatus): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('orders').update({ status }).eq('id', id);

  if (error) throw error;

  await broadcastOrdersEvent(ORDERS_REALTIME_EVENTS.orderUpdated);
}

/** Marks a takeaway order as paid without conflating payment with kitchen progress. */
export async function markTakeawayOrderPaidRecord(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: order, error: selectError } = await supabase
    .from('orders')
    .select('id, order_type, status, payment_status')
    .eq('id', id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!order || order.order_type !== 'takeaway') {
    throw new OrderValidationError('ไม่พบออเดอร์กลับบ้าน');
  }
  if (order.status === 'cancelled') {
    throw new OrderValidationError('ไม่สามารถรับชำระออเดอร์ที่ยกเลิกแล้ว');
  }
  if (order.payment_status === 'paid') return;

  const { error } = await supabase
    .from('orders')
    .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)
    .eq('payment_status', 'unpaid');

  if (error) throw error;

  await awardStarsForOrder(id);
  await broadcastOrdersEvent(ORDERS_REALTIME_EVENTS.orderUpdated);
}

export type TableSessionSummary = {
  id: string;
  tableNumber: string;
  openedAt: string;
  orderCount: number;
  total: number;
  statusCounts: Partial<Record<OrderStatus, number>>;
};

/** Tables currently occupied (an open session), for the admin tables view. */
export async function getOpenTableSessions(): Promise<TableSessionSummary[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('table_sessions')
    .select('id, table_number, opened_at, orders (total, status)')
    .eq('status', 'open')
    .order('opened_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((session) => {
    const orders = (session.orders ?? []) as { total: number; status: OrderStatus }[];
    const activeOrders = orders.filter((order) => order.status !== 'cancelled');

    const statusCounts: Partial<Record<OrderStatus, number>> = {};
    activeOrders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1;
    });

    return {
      id: session.id,
      tableNumber: session.table_number,
      openedAt: session.opened_at,
      orderCount: activeOrders.length,
      total: activeOrders.reduce((sum, order) => sum + Number(order.total), 0),
      statusCounts,
    };
  });
}

/** Marks a table's bill as paid and frees it up for the next diners. */
export async function closeTableSessionRecord(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('table_sessions')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'open');

  if (error) throw error;

  await awardStarsForSession(id);
  await broadcastOrdersEvent(ORDERS_REALTIME_EVENTS.orderUpdated);
}

/**
 * Moves an open table session (and every order in it) to a different table
 * label — for when diners physically move seats mid-meal. Both `orders`
 * and `table_sessions` carry a denormalized table_number, so both need
 * updating to keep bills and the customer-facing table view correct.
 */
export async function moveTableSessionRecord(
  sessionId: string,
  newTableNumber: string
): Promise<void> {
  const trimmed = newTableNumber.trim();
  if (!trimmed) {
    throw new OrderValidationError('กรุณาเลือกโต๊ะปลายทาง');
  }

  const supabase = getSupabaseAdmin();

  const { data: session, error: sessionError } = await supabase
    .from('table_sessions')
    .select('id, table_number, status')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!session || session.status !== 'open') {
    throw new OrderValidationError('ไม่พบโต๊ะที่ต้องการย้าย หรือโต๊ะถูกปิดไปแล้ว');
  }
  if (session.table_number === trimmed) {
    throw new OrderValidationError('โต๊ะปลายทางต้องไม่ใช่โต๊ะเดิม');
  }

  const { data: existing, error: existingError } = await supabase
    .from('table_sessions')
    .select('id')
    .eq('table_number', trimmed)
    .eq('status', 'open')
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    throw new OrderValidationError(`โต๊ะ ${trimmed} มีลูกค้าใช้งานอยู่ ไม่สามารถย้ายไปได้`);
  }

  const { error: updateSessionError } = await supabase
    .from('table_sessions')
    .update({ table_number: trimmed })
    .eq('id', sessionId);

  if (updateSessionError) throw updateSessionError;

  const { error: updateOrdersError } = await supabase
    .from('orders')
    .update({ table_number: trimmed })
    .eq('session_id', sessionId);

  if (updateOrdersError) throw updateOrdersError;

  await broadcastOrdersEvent(ORDERS_REALTIME_EVENTS.orderUpdated);
}

export type BillSummary = {
  id: string;
  tableNumber: string;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt: string | null;
  orderCount: number;
  total: number;
};

export type BillHistoryFilter = {
  /** Inclusive, `YYYY-MM-DD` in the shop's local calendar day — filters on when the table opened. */
  from?: string;
  /** Inclusive, `YYYY-MM-DD` in the shop's local calendar day. */
  to?: string;
};

/** Every bill (table session), open or closed, newest first — for the เช็คบิล page. */
export async function getBillHistory(filter: BillHistoryFilter = {}): Promise<BillSummary[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('table_sessions')
    .select('id, table_number, status, opened_at, closed_at, orders (total, status)')
    .order('opened_at', { ascending: false })
    .limit(300);

  if (filter.from) {
    query = query.gte('opened_at', `${filter.from}T00:00:00`);
  }
  if (filter.to) {
    query = query.lte('opened_at', `${filter.to}T23:59:59.999`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? [])
    .map((session) => {
      const orders = (session.orders ?? []) as { total: number; status: OrderStatus }[];
      const activeOrders = orders.filter((order) => order.status !== 'cancelled');

      return {
        id: session.id,
        tableNumber: session.table_number,
        status: session.status as 'open' | 'closed',
        openedAt: session.opened_at,
        closedAt: session.closed_at,
        orderCount: activeOrders.length,
        total: activeOrders.reduce((sum, order) => sum + Number(order.total), 0),
        allServed:
          activeOrders.length > 0 &&
          activeOrders.every((order) => order.status === 'served' || order.status === 'completed'),
      };
    })
    .filter((bill) => bill.status === 'closed' || bill.allServed)
    .map(({ allServed, ...bill }) => bill);
}
