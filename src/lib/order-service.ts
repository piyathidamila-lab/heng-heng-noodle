import type { CustomOrderSelection } from './shop-settings-service';

import { getSupabaseAdmin } from './supabase-admin';
import { getShopSettings } from './shop-settings-service';

// ----------------------------------------------------------------------

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'completed' | 'cancelled';

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
  orderType: 'dine-in' | 'takeaway';
  tableNumber: string;
  note: string;
  status: OrderStatus;
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
async function getOrCreateOpenSession(tableNumber: string): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data: existing, error: selectError } = await supabase
    .from('table_sessions')
    .select('id')
    .eq('table_number', tableNumber)
    .eq('status', 'open')
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from('table_sessions')
    .insert({ table_number: tableNumber })
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
  const settings = input.lines.some((line) => line.customization) ? await getShopSettings() : null;

  const orderItems = input.lines.map((line) => {
    if (line.quantity <= 0 || !Number.isInteger(line.quantity)) {
      throw new OrderValidationError('จำนวนรายการไม่ถูกต้อง');
    }

    if (line.customization) {
      const config = settings?.customOrder;
      if (!config?.enabled || config.steps.length === 0) {
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
    input.orderType === 'dine-in' ? await getOrCreateOpenSession(tableNumber) : null;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      session_id: sessionId,
      customer_name: input.customerName.trim(),
      order_type: input.orderType,
      table_number: tableNumber,
      note: input.note.trim(),
      total,
    })
    .select('id, seq, customer_name, order_type, table_number, note, status, total, created_at')
    .single();

  if (orderError) throw orderError;

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) throw itemsError;

  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.seq),
    customerName: order.customer_name,
    orderType: order.order_type,
    tableNumber: order.table_number,
    note: order.note,
    status: order.status,
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
  'id, seq, customer_name, order_type, table_number, note, status, total, created_at, order_items (id, name, price, quantity)';

type OrderRow = {
  id: string;
  seq: number;
  customer_name: string;
  order_type: 'dine-in' | 'takeaway';
  table_number: string;
  note: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  order_items: { id: string; name: string; price: number; quantity: number }[] | null;
};

function mapOrderRow(order: OrderRow): OrderRecord {
  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.seq),
    customerName: order.customer_name,
    orderType: order.order_type,
    tableNumber: order.table_number,
    note: order.note,
    status: order.status,
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

/** All orders for the admin dashboard, newest first. */
export async function getOrders(): Promise<OrderRecord[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(100);

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
      'id, seq, customer_name, status, total, created_at, order_items (id, name, price, quantity)'
    )
    .eq('session_id', session.id)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((order) => ({
    id: order.id,
    orderNumber: formatOrderNumber(order.seq),
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

export async function updateOrderStatusRecord(id: string, status: OrderStatus): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('orders').update({ status }).eq('id', id);

  if (error) throw error;
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
}
