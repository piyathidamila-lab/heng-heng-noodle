'use server';

import type { OrderRecord, TableSessionSummary } from 'src/lib/order-service';

import { requireAdmin } from 'src/lib/admin-session';
import { getPromptPayPayload, PromptPayNotConfiguredError } from 'src/lib/promptpay';
import {
  getOrdersBySession,
  getOpenTableSessions,
  closeTableSessionRecord,
} from 'src/lib/order-service';

// ----------------------------------------------------------------------

export async function listOpenTableSessions(): Promise<TableSessionSummary[]> {
  await requireAdmin();
  return getOpenTableSessions();
}

export async function closeTableSession(id: string): Promise<void> {
  await requireAdmin();
  await closeTableSessionRecord(id);
}

export type TableBill = {
  orders: OrderRecord[];
  total: number;
  promptPayPayload: string | null;
};

export async function getTableBill(sessionId: string): Promise<TableBill> {
  await requireAdmin();

  const orders = await getOrdersBySession(sessionId);
  const total = orders.reduce((sum, order) => sum + order.total, 0);

  let promptPayPayload: string | null = null;
  if (total > 0) {
    try {
      promptPayPayload = getPromptPayPayload(total);
    } catch (error) {
      if (!(error instanceof PromptPayNotConfiguredError)) throw error;
    }
  }

  return { orders, total, promptPayPayload };
}
