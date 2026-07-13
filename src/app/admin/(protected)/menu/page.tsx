import type { Metadata } from 'next';

import { getCategories } from 'src/lib/category-service';
import { getAdminMenuItems } from 'src/lib/menu-service';

import { AdminMenuView } from 'src/sections/admin/menu/admin-menu-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'จัดการเมนู | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const [items, categories] = await Promise.all([getAdminMenuItems(), getCategories()]);

  return <AdminMenuView initialItems={items} categories={categories} />;
}
