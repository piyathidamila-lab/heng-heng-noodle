import { getSupabaseAdmin } from './supabase-admin';

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
  customerPhone: string;
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
  customerPhone: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber: string;
  note: string;
  lines: { menuItemId: string; quantity: number }[];
};

export class OrderValidationError extends Error {}

function formatOrderNumber(seq: number): string {
  return `#${String(seq).padStart(4, '0')}`;
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
  if (!input.customerName.trim() || !input.customerPhone.trim()) {
    throw new OrderValidationError('กรุณากรอกชื่อและเบอร์โทรศัพท์');
  }
  if (input.orderType === 'dine-in' && !input.tableNumber.trim()) {
    throw new OrderValidationError('กรุณาระบุหมายเลขโต๊ะ');
  }

  const supabase = getSupabaseAdmin();

  const menuItemIds = input.lines.map((line) => line.menuItemId);

  const { data: menuItems, error: menuError } = await supabase
    .from('menu_items')
    .select('id, name, price, is_available')
    .in('id', menuItemIds);

  if (menuError) throw menuError;

  const menuById = new Map((menuItems ?? []).map((item) => [item.id, item]));

  const orderItems = input.lines.map((line) => {
    const menuItem = menuById.get(line.menuItemId);

    if (!menuItem || !menuItem.is_available) {
      throw new OrderValidationError('มีรายการอาหารที่ไม่พร้อมจำหน่ายในตะกร้า กรุณาลองใหม่');
    }
    if (line.quantity <= 0) {
      throw new OrderValidationError('จำนวนรายการไม่ถูกต้อง');
    }

    return {
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price),
      quantity: line.quantity,
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone.trim(),
      order_type: input.orderType,
      table_number: input.orderType === 'dine-in' ? input.tableNumber.trim() : '',
      note: input.note.trim(),
      total,
    })
    .select('id, seq, customer_name, customer_phone, order_type, table_number, note, status, total, created_at')
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
    customerPhone: order.customer_phone,
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

/** All orders for the admin dashboard, newest first. */
export async function getOrders(): Promise<OrderRecord[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, seq, customer_name, customer_phone, order_type, table_number, note, status, total, created_at, order_items (id, name, price, quantity)'
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((order) => ({
    id: order.id,
    orderNumber: formatOrderNumber(order.seq),
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    orderType: order.order_type,
    tableNumber: order.table_number,
    note: order.note,
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
 * Orders for a single dine-in table, newest first — used by the shared
 * "table view" so everyone who scanned the table's QR code can see what
 * the whole table has ordered so far. Deliberately omits customer_phone:
 * this is served to any customer at the table, not just the admin.
 */
export async function getOrdersByTable(tableNumber: string): Promise<TableOrderSummary[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, seq, customer_name, status, total, created_at, order_items (id, name, price, quantity)'
    )
    .eq('order_type', 'dine-in')
    .eq('table_number', tableNumber)
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
