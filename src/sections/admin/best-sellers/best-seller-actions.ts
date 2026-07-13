'use server';

import type { MenuItem } from 'src/sections/order/menu-data';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from 'src/lib/admin-session';
import {
  addBestSellerRecord,
  moveBestSellerRecord,
  removeBestSellerRecord,
  getBestSellerItemsAdmin,
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

export async function moveBestSeller(id: string, direction: 'up' | 'down'): Promise<void> {
  await requireAdmin();
  await moveBestSellerRecord(id, direction);
  revalidatePath('/');
}
