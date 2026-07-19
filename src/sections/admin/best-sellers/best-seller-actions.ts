'use server';

import type { MenuItem } from 'src/sections/order/menu-data';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from 'src/lib/auth-session';
import {
  addBestSellerRecord,
  removeBestSellerRecord,
  getBestSellerItemsAdmin,
  reorderBestSellerRecords,
} from 'src/lib/best-seller-service';

// ----------------------------------------------------------------------

export async function listBestSellersAdmin(): Promise<MenuItem[]> {
  await requireAdmin();
  return getBestSellerItemsAdmin();
}

export async function addBestSeller(id: string): Promise<MenuItem[]> {
  await requireAdmin();
  await addBestSellerRecord(id);
  revalidatePath('/');
  return getBestSellerItemsAdmin();
}

export async function removeBestSeller(id: string): Promise<void> {
  await requireAdmin();
  await removeBestSellerRecord(id);
  revalidatePath('/');
}

export async function reorderBestSellers(orderedIds: string[]): Promise<void> {
  await requireAdmin();
  await reorderBestSellerRecords(orderedIds);
  revalidatePath('/');
}
