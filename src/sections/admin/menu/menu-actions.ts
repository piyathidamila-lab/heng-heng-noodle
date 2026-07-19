'use server';

import type { MenuItemInput } from 'src/lib/menu-service';
import type { MenuItem } from 'src/sections/order/menu-data';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from 'src/lib/auth-session';
import { uploadMenuImage, deleteMenuImage } from 'src/lib/storage-service';
import {
  getAdminMenuItems,
  createMenuItemRecord,
  deleteMenuItemRecord,
  updateMenuItemRecord,
} from 'src/lib/menu-service';

// ----------------------------------------------------------------------

export async function listMenuItemsAdmin(): Promise<MenuItem[]> {
  await requireAdmin();
  return getAdminMenuItems();
}

export async function uploadMenuItemImage(file: File): Promise<string> {
  await requireAdmin();
  return uploadMenuImage(file);
}

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
  await requireAdmin();
  const item = await createMenuItemRecord(input);
  revalidatePath('/');
  return item;
}

export async function updateMenuItem(
  id: string,
  input: MenuItemInput,
  previousImageUrl: string | null
): Promise<MenuItem> {
  await requireAdmin();
  const item = await updateMenuItemRecord(id, input);

  if (previousImageUrl && previousImageUrl !== input.imageUrl) {
    await deleteMenuImage(previousImageUrl).catch(() => {});
  }

  revalidatePath('/');
  return item;
}

export async function deleteMenuItem(id: string, imageUrl: string | null): Promise<void> {
  await requireAdmin();
  await deleteMenuItemRecord(id);

  if (imageUrl) {
    await deleteMenuImage(imageUrl).catch(() => {});
  }

  revalidatePath('/');
}
