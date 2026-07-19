'use server';

import type { OrderStatus, OrderRecord, OrderHistoryFilter } from 'src/lib/order-service';

import { requireOrderAccess } from 'src/lib/auth-session';
import { getOrders, getOrderHistory, updateOrderStatusRecord } from 'src/lib/order-service';

// ----------------------------------------------------------------------

export async function listOrdersAdmin(): Promise<OrderRecord[]> {
  await requireOrderAccess();
  return getOrders();
}

export async function listOrderHistoryAdmin(filter: OrderHistoryFilter = {}): Promise<OrderRecord[]> {
  await requireOrderAccess();
  return getOrderHistory(filter);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await requireOrderAccess();
  await updateOrderStatusRecord(id, status);
}
