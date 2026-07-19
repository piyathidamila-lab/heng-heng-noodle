'use server';

import type {
  OrderRecord,
  BillSummary,
  BillHistoryFilter,
  TableSessionSummary,
} from 'src/lib/order-service';

import { requireOrderAccess } from 'src/lib/auth-session';
import { getPromptPayPayload, PromptPayNotConfiguredError } from 'src/lib/promptpay';
import {
  getBillHistory,
  getOrdersBySession,
  getOpenTableSessions,
  closeTableSessionRecord,
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

export async function closeTableSession(id: string): Promise<void> {
  await requireOrderAccess();
  await closeTableSessionRecord(id);
}

export type TableBill = {
  orders: OrderRecord[];
  total: number;
  promptPayPayload: string | null;
};

export async function getTableBill(sessionId: string): Promise<TableBill> {
  await requireOrderAccess();

  const orders = await getOrdersBySession(sessionId);
  const total = orders.reduce((sum, order) => sum + order.total, 0);

  let promptPayPayload: string | null = null;
  if (total > 0) {
    try {
      promptPayPayload = await getPromptPayPayload(total);
    } catch (error) {
      if (!(error instanceof PromptPayNotConfiguredError)) throw error;
    }
  }

  return { orders, total, promptPayPayload };
}
