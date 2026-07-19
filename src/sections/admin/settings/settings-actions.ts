'use server';

import type { ShopSettings, ShopSettingsInput } from 'src/lib/shop-settings-service';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from 'src/lib/auth-session';
import {
  getShopSettings,
  setShopOpenRecord,
  updateShopSettingsRecord,
} from 'src/lib/shop-settings-service';

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

export async function setShopOpenAdmin(isOpen: boolean): Promise<void> {
  await requireAdmin();
  await setShopOpenRecord(isOpen);
  revalidatePath('/');
}
