'use server';

import type { OrderRecord, CreateOrderInput, TableOrderSummary } from 'src/lib/order-service';

import { getOrdersByTable, createOrderRecord, OrderValidationError } from 'src/lib/order-service';

// ----------------------------------------------------------------------

export type PlaceOrderResult =
  | { ok: true; order: OrderRecord }
  | { ok: false; message: string };

export async function placeOrder(input: CreateOrderInput): Promise<PlaceOrderResult> {
  try {
    const order = await createOrderRecord(input);
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
