import { getSupabaseAdmin } from './supabase-admin';
import { getSupabasePublic } from './supabase-public';

// ----------------------------------------------------------------------

export type RestaurantTable = {
  id: string;
  label: string;
  sortOrder: number;
};

export class TableValidationError extends Error {}

const SELECT_COLUMNS = 'id, label, sort_order';

type TableRow = { id: string; label: string; sort_order: number };

function mapRow(row: TableRow): RestaurantTable {
  return { id: row.id, label: row.label, sortOrder: row.sort_order };
}

/** Table labels in display order — safe to call from customer-facing pages. */
export async function getTables(): Promise<RestaurantTable[]> {
  const supabase = getSupabasePublic();

  const { data, error } = await supabase
    .from('restaurant_tables')
    .select(SELECT_COLUMNS)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapRow);
}

export async function createTableRecord(label: string): Promise<RestaurantTable> {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new TableValidationError('กรุณาระบุหมายเลขโต๊ะ');
  }

  const supabase = getSupabaseAdmin();

  const { data: existing, error: countError } = await supabase
    .from('restaurant_tables')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (countError) throw countError;

  const { data, error } = await supabase
    .from('restaurant_tables')
    .insert({ label: trimmed, sort_order: (existing?.sort_order ?? 0) + 1 })
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new TableValidationError(`มีโต๊ะ "${trimmed}" อยู่แล้ว`);
    }
    throw error;
  }

  return mapRow(data);
}

export async function deleteTableRecord(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('restaurant_tables').delete().eq('id', id);
  if (error) throw error;
}

/** Swaps sort_order with the neighboring table to move it up or down the list. */
export async function moveTableRecord(id: string, direction: 'up' | 'down'): Promise<void> {
  const tables = await getTables();
  const index = tables.findIndex((table) => table.id === id);
  if (index === -1) return;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= tables.length) return;

  const current = tables[index];
  const neighbor = tables[swapIndex];

  const supabase = getSupabaseAdmin();

  const [{ error: errorA }, { error: errorB }] = await Promise.all([
    supabase
      .from('restaurant_tables')
      .update({ sort_order: neighbor.sortOrder })
      .eq('id', current.id),
    supabase
      .from('restaurant_tables')
      .update({ sort_order: current.sortOrder })
      .eq('id', neighbor.id),
  ]);

  if (errorA) throw errorA;
  if (errorB) throw errorB;
}
