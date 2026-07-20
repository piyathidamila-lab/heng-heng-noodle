import type { Metadata } from 'next';

import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { getCurrentUser } from 'src/lib/auth-session';
import { getCategories } from 'src/lib/category-service';
import { getCurrentMember } from 'src/lib/member-session';
import { getPublicMenuItems } from 'src/lib/menu-service';
import { getShopSettings } from 'src/lib/shop-settings-service';
import { getBestSellerItems } from 'src/lib/best-seller-service';

import { OrderView } from 'src/sections/order/view';

// ----------------------------------------------------------------------

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getShopSettings();

  return {
    title: `สั่งอาหาร | ${settings.name}`,
    description: settings.description || `สั่งอาหารออนไลน์จาก${settings.name} ${settings.address}`,
  };
}

export default async function Page() {
  const staffUser = await getCurrentUser();
  if (staffUser) {
    redirect(staffUser.role === 'admin' ? '/admin/overview' : '/staff/orders');
  }

  const [items, categories, bestSellers, shop, member] = await Promise.all([
    getPublicMenuItems(),
    getCategories(),
    getBestSellerItems(),
    getShopSettings(),
    getCurrentMember(),
  ]);

  return (
    <Suspense fallback={null}>
      <OrderView
        items={items}
        categories={categories}
        bestSellers={bestSellers}
        shop={shop}
        member={member}
      />
    </Suspense>
  );
}
