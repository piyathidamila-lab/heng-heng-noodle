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

/** Persists the complete curated order after an admin drag-and-drop operation. */
export async function reorderBestSellerRecords(orderedIds: string[]): Promise<void> {
  const currentItems = await getBestSellerItemsAdmin();
  const currentIds = new Set(currentItems.map((item) => item.id));

  if (
    orderedIds.length !== currentIds.size ||
    new Set(orderedIds).size !== orderedIds.length ||
    orderedIds.some((id) => !currentIds.has(id))
  ) {
    throw new Error('รายการเมนูขายดีมีการเปลี่ยนแปลง กรุณารีเฟรชแล้วลองใหม่');
  }

  const supabase = getSupabaseAdmin();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('menu_items')
        .update({ best_seller_sort_order: index + 1 })
        .eq('id', id)
        .eq('is_best_seller', true)
    )
  );
  const failed = results.find((result) => result.error);

  if (failed?.error) throw failed.error;
}
