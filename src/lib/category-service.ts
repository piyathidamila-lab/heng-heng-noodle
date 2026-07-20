import { getSupabaseAdmin } from './supabase-admin';
import { getSupabasePublic } from './supabase-public';

// ----------------------------------------------------------------------

export type MenuCategory = {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
};

export class CategoryValidationError extends Error {}

const SELECT_COLUMNS = 'id, value, label, sort_order';

type CategoryRow = { id: string; value: string; label: string; sort_order: number };

function mapRow(row: CategoryRow): MenuCategory {
  return { id: row.id, value: row.value, label: row.label, sortOrder: row.sort_order };
}

/** Menu categories in display order — safe to call from customer-facing pages. */
export async function getCategories(): Promise<MenuCategory[]> {
  const supabase = getSupabasePublic();

  const { data, error } = await supabase
    .from('menu_categories')
    .select(SELECT_COLUMNS)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapRow);
}

export async function createCategoryRecord(label: string): Promise<MenuCategory> {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new CategoryValidationError('กรุณาระบุชื่อหมวดหมู่');
  }

  const supabase = getSupabaseAdmin();

  const { data: existing, error: countError } = await supabase
    .from('menu_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (countError) throw countError;

  const { data, error } = await supabase
    .from('menu_categories')
    .insert({
      value: crypto.randomUUID(),
      label: trimmed,
      sort_order: (existing?.sort_order ?? 0) + 1,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return mapRow(data);
}

export async function updateCategoryLabelRecord(id: string, label: string): Promise<MenuCategory> {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new CategoryValidationError('กรุณาระบุชื่อหมวดหมู่');
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('menu_categories')
    .update({ label: trimmed })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return mapRow(data);
}

export async function deleteCategoryRecord(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: category, error: fetchError } = await supabase
    .from('menu_categories')
    .select('value, label')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const { count, error: countError } = await supabase
    .from('menu_items')
    .select('id', { count: 'exact', head: true })
    .eq('category', category.value);

  if (countError) throw countError;

  if (count && count > 0) {
    throw new CategoryValidationError(
      `ยังมีเมนูอยู่ในหมวด "${category.label}" ${count} รายการ กรุณาย้ายหรือลบเมนูก่อน`
    );
  }

  const { error } = await supabase.from('menu_categories').delete().eq('id', id);
  if (error) throw error;
}

/** Swaps sort_order with the neighboring category to move it up or down the list. */
export async function moveCategoryRecord(id: string, direction: 'up' | 'down'): Promise<void> {
  const categories = await getCategories();
  const index = categories.findIndex((category) => category.id === id);
  if (index === -1) return;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= categories.length) return;

  const current = categories[index];
  const neighbor = categories[swapIndex];

  const supabase = getSupabaseAdmin();

  const [{ error: errorA }, { error: errorB }] = await Promise.all([
    supabase
      .from('menu_categories')
      .update({ sort_order: neighbor.sortOrder })
      .eq('id', current.id),
    supabase
      .from('menu_categories')
      .update({ sort_order: current.sortOrder })
      .eq('id', neighbor.id),
  ]);

  if (errorA) throw errorA;
  if (errorB) throw errorB;
}

/** Persists the complete customer-facing category order after drag and drop. */
export async function reorderCategoryRecords(orderedIds: string[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: currentCategories, error: fetchError } = await supabase
    .from('menu_categories')
    .select('id');

  if (fetchError) throw fetchError;

  const currentIds = new Set((currentCategories ?? []).map((category) => category.id));
  if (
    orderedIds.length !== currentIds.size ||
    new Set(orderedIds).size !== orderedIds.length ||
    orderedIds.some((id) => !currentIds.has(id))
  ) {
    throw new CategoryValidationError('รายการหมวดหมู่มีการเปลี่ยนแปลง กรุณารีเฟรชแล้วลองใหม่');
  }

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('menu_categories')
        .update({ sort_order: index + 1 })
        .eq('id', id)
    )
  );
  const failed = results.find((result) => result.error);

  if (failed?.error) throw failed.error;
}
