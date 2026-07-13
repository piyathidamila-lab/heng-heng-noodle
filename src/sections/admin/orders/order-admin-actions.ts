'use server';

import type { OrderStatus, OrderRecord } from 'src/lib/order-service';

import { requireAdmin } from 'src/lib/admin-session';
import { getOrders, updateOrderStatusRecord } from 'src/lib/order-service';

// ----------------------------------------------------------------------

export async function listOrdersAdmin(): Promise<OrderRecord[]> {
  await requireAdmin();
  return getOrders();
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await requireAdmin();
  await updateOrderStatusRecord(id, status);
}
