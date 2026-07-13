'use server';

import type { ShopSettings, ShopSettingsInput } from 'src/lib/shop-settings-service';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from 'src/lib/admin-session';
import { getShopSettings, updateShopSettingsRecord } from 'src/lib/shop-settings-service';

// ----------------------------------------------------------------------

export async function getShopSettingsAdmin(): Promise<ShopSettings> {
  await requireAdmin();
  return getShopSettings();
}

export async function updateShopSettings(input: ShopSettingsInput): Promise<ShopSettings> {
  await requireAdmin();
  const settings = await updateShopSettingsRecord(input);
  revalidatePath('/');
  return settings;
}
