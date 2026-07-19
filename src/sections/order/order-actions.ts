'use server';

import type {
  OrderStatus,
  OrderRecord,
  CreateOrderInput,
  TableOrderSummary,
  MemberOrderSummary,
} from 'src/lib/order-service';

import { getCurrentMember } from 'src/lib/member-session';
import {
  getOrdersByTable,
  createOrderRecord,
  getOrderStatusById,
  OrderValidationError,
  getMemberOrderHistory,
} from 'src/lib/order-service';

// ----------------------------------------------------------------------

export type PlaceOrderResult =
  | { ok: true; order: OrderRecord }
  | { ok: false; message: string };

export async function placeOrder(
  input: Omit<CreateOrderInput, 'customerId'>
): Promise<PlaceOrderResult> {
  try {
    const member = await getCurrentMember();
    const order = await createOrderRecord({ ...input, customerId: member?.id });
    return { ok: true, order };
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return { ok: false, message: error.message };
    }
    console.error(error);
    return { ok: false, message: 'ไม่สามารถสั่งอาหารได้ กรุณาลองใหม่อีกครั้ง' };
  }
}

/** Public — lets anyone who scanned this table's QR code see what the table has ordered. */
export async function getTableOrders(tableNumber: string): Promise<TableOrderSummary[]> {
  const trimmed = tableNumber.trim().slice(0, 20);
  if (!trimmed) return [];

  return getOrdersByTable(trimmed);
}

/** Public — lets a customer track their own takeaway order's status by its (unguessable) id. */
export async function getOrderStatus(orderId: string): Promise<OrderStatus | null> {
  if (!orderId) return null;

  return getOrderStatusById(orderId);
}

/** The logged-in member's own order history — derived from the session cookie, never a client-supplied id. */
export async function getMyOrderHistory(): Promise<MemberOrderSummary[]> {
  const member = await getCurrentMember();
  if (!member) return [];

  return getMemberOrderHistory(member.id);
}
