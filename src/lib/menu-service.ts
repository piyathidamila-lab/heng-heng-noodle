import type { MenuItem, MenuCategoryValue } from 'src/sections/order/menu-data';

import { getSupabaseAdmin } from './supabase-admin';
import { getSupabasePublic } from './supabase-public';

// ----------------------------------------------------------------------

const SELECT_COLUMNS =
  'id, category, name, description, price, emoji, image_url, is_available, sort_order';

type MenuItemRow = {
  id: string;
  category: MenuCategoryValue;
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
  category: MenuCategoryValue;
  name: string;
  description: string;
  price: number;
  emoji: string;
  imageUrl: string | null;
  isAvailable: boolean;
};

export async function createMenuItemRecord(input: MenuItemInput): Promise<MenuItem> {
  const supabase = getSupabaseAdmin();

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
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return mapRow(data);
}

export async function updateMenuItemRecord(
  id: string,
  input: MenuItemInput
): Promise<MenuItem> {
  const supabase = getSupabaseAdmin();

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
