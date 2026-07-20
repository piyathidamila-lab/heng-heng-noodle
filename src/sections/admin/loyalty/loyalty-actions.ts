'use server';

import type { ShopSettings, LoyaltyConfig } from 'src/lib/shop-settings-service';
import type {
  RewardInput,
  MemberSummary,
  LoyaltyReward,
  StarLedgerEntry,
  LoyaltyRedemption,
} from 'src/lib/loyalty-service';

import { revalidatePath } from 'next/cache';

import { requireAdmin, requireOrderAccess } from 'src/lib/auth-session';
import { uploadRewardImage, deleteRewardImage } from 'src/lib/storage-service';
import { getShopSettings, updateShopSettingsRecord } from 'src/lib/shop-settings-service';
import {
  listMembersAdmin,
  listRewardsAdmin,
  decideRedemption,
  createRewardRecord,
  updateRewardRecord,
  deleteRewardRecord,
  getMemberLedgerAdmin,
  listPendingRedemptionsAdmin,
} from 'src/lib/loyalty-service';

// ----------------------------------------------------------------------

export async function getLoyaltyConfigAdmin(): Promise<LoyaltyConfig> {
  await requireAdmin();
  const settings = await getShopSettings();
  return settings.loyalty;
}

export async function updateLoyaltyConfigAdmin(loyalty: LoyaltyConfig): Promise<ShopSettings> {
  await requireAdmin();
  const settings = await getShopSettings();
  const updated = await updateShopSettingsRecord({ ...settings, loyalty });
  revalidatePath('/admin/loyalty');
  revalidatePath('/');
  return updated;
}

export async function listMembersForAdmin(): Promise<MemberSummary[]> {
  await requireAdmin();
  return listMembersAdmin();
}

export async function getMemberLedgerForAdmin(customerId: string): Promise<StarLedgerEntry[]> {
  await requireAdmin();
  return getMemberLedgerAdmin(customerId);
}

export async function listRewardsForAdmin(): Promise<LoyaltyReward[]> {
  await requireAdmin();
  return listRewardsAdmin();
}

export async function createRewardAdmin(input: RewardInput): Promise<LoyaltyReward> {
  await requireAdmin();
  const reward = await createRewardRecord(input);
  revalidatePath('/admin/loyalty');
  revalidatePath('/stars');
  return reward;
}

export async function uploadRewardImageAdmin(file: File): Promise<string> {
  await requireAdmin();
  return uploadRewardImage(file);
}

export async function updateRewardAdmin(
  id: string,
  input: RewardInput,
  previousImageUrl: string | null
): Promise<LoyaltyReward> {
  await requireAdmin();
  const reward = await updateRewardRecord(id, input);

  if (previousImageUrl && previousImageUrl !== input.imageUrl) {
    await deleteRewardImage(previousImageUrl).catch(() => {});
  }

  revalidatePath('/admin/loyalty');
  revalidatePath('/stars');
  return reward;
}

export async function deleteRewardAdmin(id: string, imageUrl: string | null): Promise<void> {
  await requireAdmin();
  await deleteRewardRecord(id);

  if (imageUrl) {
    await deleteRewardImage(imageUrl).catch(() => {});
  }

  revalidatePath('/admin/loyalty');
  revalidatePath('/stars');
}

/** Shared by both the admin dashboard and the staff front-of-house view. */
export async function listPendingRedemptions(): Promise<LoyaltyRedemption[]> {
  await requireOrderAccess();
  return listPendingRedemptionsAdmin();
}

/** Shared by both the admin dashboard and the staff front-of-house view. */
export async function decideRedemptionRequest(
  redemptionId: string,
  approve: boolean
): Promise<void> {
  await requireOrderAccess();
  await decideRedemption(redemptionId, approve);
  revalidatePath('/admin/loyalty');
  revalidatePath('/staff/redemptions');
}
