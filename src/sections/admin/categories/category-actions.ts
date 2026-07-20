'use server';

import type { MenuCategory } from 'src/lib/category-service';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from 'src/lib/auth-session';
import {
  getCategories,
  moveCategoryRecord,
  createCategoryRecord,
  deleteCategoryRecord,
  reorderCategoryRecords,
  updateCategoryLabelRecord,
} from 'src/lib/category-service';

// ----------------------------------------------------------------------

export async function listCategoriesAdmin(): Promise<MenuCategory[]> {
  await requireAdmin();
  return getCategories();
}

export async function createCategory(label: string): Promise<MenuCategory> {
  await requireAdmin();
  const category = await createCategoryRecord(label);
  revalidatePath('/');
  return category;
}

export async function updateCategoryLabel(id: string, label: string): Promise<MenuCategory> {
  await requireAdmin();
  const category = await updateCategoryLabelRecord(id, label);
  revalidatePath('/');
  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();
  await deleteCategoryRecord(id);
  revalidatePath('/');
}

export async function moveCategory(id: string, direction: 'up' | 'down'): Promise<void> {
  await requireAdmin();
  await moveCategoryRecord(id, direction);
  revalidatePath('/');
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  await requireAdmin();
  await reorderCategoryRecords(orderedIds);
  revalidatePath('/');
}
