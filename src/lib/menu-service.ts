import type { MenuItem } from 'src/sections/order/menu-data';

import { getSupabaseAdmin } from './supabase-admin';
import { getSupabasePublic } from './supabase-public';

// ----------------------------------------------------------------------

const SELECT_COLUMNS =
  'id, category, name, description, price, emoji, image_url, is_available, sort_order';

type MenuItemRow = {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
};

function mapRow(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    emoji: row.emoji,
    imageUrl: row.image_url,
    isAvailable: row.is_available,
  };
}

/** Menu items visible to customers ordering food — available items only. */
export async function getPublicMenuItems(): Promise<MenuItem[]> {
  const supabase = getSupabasePublic();

  const { data, error } = await supabase
    .from('menu_items')
    .select(SELECT_COLUMNS)
    .eq('is_available', true)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapRow);
}

/** All menu items (including hidden ones) for the admin dashboard. */
export async function getAdminMenuItems(): Promise<MenuItem[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('menu_items')
    .select(SELECT_COLUMNS)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapRow);
}

export type MenuItemInput = {
  category: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  imageUrl: string | null;
  isAvailable: boolean;
};

export async function createMenuItemRecord(input: MenuItemInput): Promise<MenuItem> {
  const supabase = getSupabaseAdmin();

  const { data: lastItem, error: orderError } = await supabase
    .from('menu_items')
    .select('sort_order')
    .eq('category', input.category)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) throw orderError;

  const { data, error } = await supabase
    .from('menu_items')
    .insert({
      category: input.category,
      name: input.name,
      description: input.description,
      price: input.price,
      emoji: input.emoji,
      image_url: input.imageUrl,
      is_available: input.isAvailable,
      sort_order: (lastItem?.sort_order ?? 0) + 1,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return mapRow(data);
}

export async function updateMenuItemRecord(id: string, input: MenuItemInput): Promise<MenuItem> {
  const supabase = getSupabaseAdmin();

  const { data: currentItem, error: currentError } = await supabase
    .from('menu_items')
    .select('category')
    .eq('id', id)
    .single();

  if (currentError) throw currentError;

  let nextSortOrder: number | undefined;
  if (currentItem.category !== input.category) {
    const { data: lastItem, error: orderError } = await supabase
      .from('menu_items')
      .select('sort_order')
      .eq('category', input.category)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) throw orderError;
    nextSortOrder = (lastItem?.sort_order ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from('menu_items')
    .update({
      category: input.category,
      name: input.name,
      description: input.description,
      price: input.price,
      emoji: input.emoji,
      image_url: input.imageUrl,
      is_available: input.isAvailable,
      ...(nextSortOrder !== undefined && { sort_order: nextSortOrder }),
    })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return mapRow(data);
}

export async function deleteMenuItemRecord(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('menu_items').delete().eq('id', id);

  if (error) throw error;
}

/** Persists the display order for every menu item in one category. */
export async function reorderMenuItemRecords(
  category: string,
  orderedIds: string[]
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: currentItems, error: fetchError } = await supabase
    .from('menu_items')
    .select('id')
    .eq('category', category);

  if (fetchError) throw fetchError;

  const currentIds = new Set((currentItems ?? []).map((item) => item.id));
  if (
    orderedIds.length !== currentIds.size ||
    new Set(orderedIds).size !== orderedIds.length ||
    orderedIds.some((id) => !currentIds.has(id))
  ) {
    throw new Error('รายการเมนูมีการเปลี่ยนแปลง กรุณารีเฟรชแล้วลองใหม่');
  }

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('menu_items')
        .update({ sort_order: index + 1 })
        .eq('id', id)
        .eq('category', category)
    )
  );
  const failed = results.find((result) => result.error);

  if (failed?.error) throw failed.error;
}
