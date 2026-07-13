'use server';

import type { RestaurantTable } from 'src/lib/table-service';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from 'src/lib/admin-session';
import {
  getTables,
  moveTableRecord,
  createTableRecord,
  deleteTableRecord,
} from 'src/lib/table-service';

// ----------------------------------------------------------------------

export async function listTablesAdmin(): Promise<RestaurantTable[]> {
  await requireAdmin();
  return getTables();
}

export async function createTable(label: string): Promise<RestaurantTable> {
  await requireAdmin();
  const table = await createTableRecord(label);
  revalidatePath('/');
  return table;
}

export async function deleteTable(id: string): Promise<void> {
  await requireAdmin();
  await deleteTableRecord(id);
  revalidatePath('/');
}

export async function moveTable(id: string, direction: 'up' | 'down'): Promise<void> {
  await requireAdmin();
  await moveTableRecord(id, direction);
  revalidatePath('/');
}
