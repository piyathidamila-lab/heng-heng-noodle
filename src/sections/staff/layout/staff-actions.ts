'use server';

import type { DashboardPeriodAnalytics } from 'src/lib/analytics-service';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { getTodaySales } from 'src/lib/analytics-service';
import { setShopOpenRecord } from 'src/lib/shop-settings-service';
import { clearSession, requireOrderAccess } from 'src/lib/auth-session';

// ----------------------------------------------------------------------

export async function staffLogoutAction(): Promise<void> {
  await clearSession();
  redirect('/login');
}

/** เปิดร้าน/ปิดร้าน toggle for the staff header — same effect as the admin one. */
export async function setShopOpenStaff(isOpen: boolean): Promise<void> {
  await requireOrderAccess();
  await setShopOpenRecord(isOpen);
  revalidatePath('/');
}

export async function getTodaySalesStaff(): Promise<DashboardPeriodAnalytics> {
  await requireOrderAccess();
  return getTodaySales();
}
