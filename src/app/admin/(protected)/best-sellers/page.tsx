import type { Metadata } from 'next';

import { getAdminMenuItems } from 'src/lib/menu-service';
import { getBestSellerItemsAdmin } from 'src/lib/best-seller-service';

import { AdminBestSellersView } from 'src/sections/admin/best-sellers/admin-best-sellers-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'เมนูขายดี | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const [bestSellers, allItems] = await Promise.all([
    getBestSellerItemsAdmin(),
    getAdminMenuItems(),
  ]);

  return <AdminBestSellersView initialBestSellers={bestSellers} allItems={allItems} />;
}
