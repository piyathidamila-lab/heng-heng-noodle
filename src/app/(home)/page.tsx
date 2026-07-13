import type { Metadata } from 'next';

import { Suspense } from 'react';

import { getTables } from 'src/lib/table-service';
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
  const [items, categories, bestSellers, tables, shop] = await Promise.all([
    getPublicMenuItems(),
    getCategories(),
    getBestSellerItems(),
    getTables(),
    getShopSettings(),
  ]);

  return (
    <Suspense fallback={null}>
      <OrderView
        items={items}
        categories={categories}
        bestSellers={bestSellers}
        tables={tables}
        shop={shop}
      />
    </Suspense>
  );
}
