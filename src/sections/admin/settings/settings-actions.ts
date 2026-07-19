'use server';

import type { ShopSettings, ShopSettingsInput } from 'src/lib/shop-settings-service';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from 'src/lib/auth-session';
import { uploadShopLogo, deleteShopLogo } from 'src/lib/storage-service';
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

export async function uploadShopLogoAdmin(file: File): Promise<string> {
  await requireAdmin();
  return uploadShopLogo(file);
}

export async function deleteShopLogoAdmin(logoUrl: string): Promise<void> {
  await requireAdmin();
  await deleteShopLogo(logoUrl);
}

export async function updateShopSettings(
  input: ShopSettingsInput,
  previousLogoUrl?: string | null
): Promise<ShopSettings> {
  await requireAdmin();
  const settings = await updateShopSettingsRecord(input);

  if (previousLogoUrl && previousLogoUrl !== settings.logoUrl) {
    await deleteShopLogo(previousLogoUrl).catch(() => {});
  }

  revalidatePath('/');
  return settings;
}

export async function setShopOpenAdmin(isOpen: boolean): Promise<void> {
  await requireAdmin();
  await setShopOpenRecord(isOpen);
  revalidatePath('/');
}
