'use server';

import type {
  OrderRecord,
  BillSummary,
  BillHistoryFilter,
  TableSessionSummary,
} from 'src/lib/order-service';

import { requireOrderAccess } from 'src/lib/auth-session';
import { getShopSettings } from 'src/lib/shop-settings-service';
import { getPromptPayPayload, PromptPayNotConfiguredError } from 'src/lib/promptpay';
import {
  getBillHistory,
  getOrdersBySession,
  getOpenTableSessions,
  OrderValidationError,
  getTakeawayBillHistory,
  moveTableSessionRecord,
  closeTableSessionRecord,
  markTakeawayOrderPaidRecord,
} from 'src/lib/order-service';

// ----------------------------------------------------------------------

export async function listOpenTableSessions(): Promise<TableSessionSummary[]> {
  await requireOrderAccess();
  return getOpenTableSessions();
}

export async function listBillHistoryAdmin(filter: BillHistoryFilter = {}): Promise<BillSummary[]> {
  await requireOrderAccess();
  return getBillHistory(filter);
}

export async function listTakeawayBillHistoryAdmin(
  filter: BillHistoryFilter = {}
): Promise<OrderRecord[]> {
  await requireOrderAccess();
  return getTakeawayBillHistory(filter);
}

export async function markTakeawayOrderPaid(id: string): Promise<void> {
  await requireOrderAccess();
  await markTakeawayOrderPaidRecord(id);
}

export async function closeTableSession(id: string): Promise<void> {
  await requireOrderAccess();
  await closeTableSessionRecord(id);
}

export type MoveTableSessionResult = { ok: true } | { ok: false; message: string };

export async function moveTableSession(
  sessionId: string,
  newTableNumber: string
): Promise<MoveTableSessionResult> {
  await requireOrderAccess();

  try {
    await moveTableSessionRecord(sessionId, newTableNumber);
    return { ok: true };
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return { ok: false, message: error.message };
    }
    console.error(error);
    return { ok: false, message: 'ย้ายโต๊ะไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' };
  }
}

export type TableBill = {
  orders: OrderRecord[];
  total: number;
  promptPayPayload: string | null;
  promptPayQrUrl: string | null;
};

export async function getTableBill(sessionId: string): Promise<TableBill> {
  await requireOrderAccess();

  const [orders, settings] = await Promise.all([getOrdersBySession(sessionId), getShopSettings()]);
  const total = orders.reduce((sum, order) => sum + order.total, 0);

  let promptPayPayload: string | null = null;
  if (total > 0 && !settings.promptPayQrUrl) {
    try {
      promptPayPayload = await getPromptPayPayload(total);
    } catch (error) {
      if (!(error instanceof PromptPayNotConfiguredError)) throw error;
    }
  }

  return {
    orders,
    total,
    promptPayPayload,
    promptPayQrUrl: settings.promptPayQrUrl,
  };
}
