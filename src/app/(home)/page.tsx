import type { Metadata } from 'next';

import { Suspense } from 'react';

import { getCategories } from 'src/lib/category-service';
import { getPublicMenuItems } from 'src/lib/menu-service';
import { getShopSettings } from 'src/lib/shop-settings-service';
import { getBestSellerItems } from 'src/lib/best-seller-service';

import { OrderView } from 'src/sections/order/view';

// ----------------------------------------------------------------------

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getShopSettings();

  return {
    title: `สั่งอาหาร | ${settings.name}`,
    description: `สั่งอาหารออนไลน์จาก${settings.name} ${settings.address}`,
  };
}

export default async function Page() {
  const [items, categories, bestSellers, shop] = await Promise.all([
    getPublicMenuItems(),
    getCategories(),
    getBestSellerItems(),
    getShopSettings(),
  ]);

  return (
    <Suspense fallback={null}>
      <OrderView items={items} categories={categories} bestSellers={bestSellers} shop={shop} />
    </Suspense>
  );
}
