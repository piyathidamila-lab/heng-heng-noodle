'use server';

import { revalidatePath } from 'next/cache';

import { requestRedemption } from 'src/lib/loyalty-service';
import { loginMember, logoutMember, requireMember, registerMember } from 'src/lib/member-session';

// ----------------------------------------------------------------------

export async function registerMemberAction(
  phone: string,
  pin: string,
  displayName: string
): Promise<void> {
  await registerMember(phone, pin, displayName);
  revalidatePath('/stars');
}

export async function loginMemberAction(phone: string, pin: string): Promise<boolean> {
  const member = await loginMember(phone, pin);
  if (!member) return false;
  revalidatePath('/stars');
  return true;
}

export async function logoutMemberAction(): Promise<void> {
  await logoutMember();
  revalidatePath('/stars');
}

export async function requestRedemptionAction(rewardId: string): Promise<void> {
  const member = await requireMember();
  await requestRedemption(member.id, rewardId);
  revalidatePath('/stars');
}
