import type { MenuItem } from 'src/sections/order/menu-data';

import { getSupabaseAdmin } from './supabase-admin';
import { getSupabasePublic } from './supabase-public';

// ----------------------------------------------------------------------

const SELECT_COLUMNS =
  'id, category, name, description, price, emoji, image_url, is_available, sort_order, best_seller_sort_order';

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
  best_seller_sort_order: number;
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

/** Best-seller items visible to customers — available items only, curated order. */
export async function getBestSellerItems(): Promise<MenuItem[]> {
  const supabase = getSupabasePublic();

  const { data, error } = await supabase
    .from('menu_items')
    .select(SELECT_COLUMNS)
    .eq('is_best_seller', true)
    .eq('is_available', true)
    .order('best_seller_sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapRow);
}

/** Curated best-seller list for the admin dashboard, including hidden items. */
export async function getBestSellerItemsAdmin(): Promise<MenuItem[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('menu_items')
    .select(SELECT_COLUMNS)
    .eq('is_best_seller', true)
    .order('best_seller_sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapRow);
}

export async function addBestSellerRecord(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: existing, error: countError } = await supabase
    .from('menu_items')
    .select('best_seller_sort_order')
    .eq('is_best_seller', true)
    .order('best_seller_sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (countError) throw countError;

  const { error } = await supabase
    .from('menu_items')
    .update({
      is_best_seller: true,
      best_seller_sort_order: (existing?.best_seller_sort_order ?? 0) + 1,
    })
    .eq('id', id);

  if (error) throw error;
}

export async function removeBestSellerRecord(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('menu_items')
    .update({ is_best_seller: false, best_seller_sort_order: 0 })
    .eq('id', id);

  if (error) throw error;
}

/** Swaps best_seller_sort_order with the neighboring item to move it up or down the list. */
export async function moveBestSellerRecord(id: string, direction: 'up' | 'down'): Promise<void> {
  const items = await getBestSellerItemsAdmin();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= items.length) return;

  const supabase = getSupabaseAdmin();

  const { data: rows, error: fetchError } = await supabase
    .from('menu_items')
    .select('id, best_seller_sort_order')
    .in('id', [items[index].id, items[swapIndex].id]);

  if (fetchError) throw fetchError;

  const current = rows?.find((row) => row.id === items[index].id);
  const neighbor = rows?.find((row) => row.id === items[swapIndex].id);
  if (!current || !neighbor) return;

  const [{ error: errorA }, { error: errorB }] = await Promise.all([
    supabase
      .from('menu_items')
      .update({ best_seller_sort_order: neighbor.best_seller_sort_order })
      .eq('id', current.id),
    supabase
      .from('menu_items')
      .update({ best_seller_sort_order: current.best_seller_sort_order })
      .eq('id', neighbor.id),
  ]);

  if (errorA) throw errorA;
  if (errorB) throw errorB;
}
