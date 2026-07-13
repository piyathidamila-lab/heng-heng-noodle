import type { Metadata } from 'next';

import { getCategories } from 'src/lib/category-service';

import { AdminCategoriesView } from 'src/sections/admin/categories/admin-categories-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'จัดการหมวดหมู่ | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const categories = await getCategories();

  return <AdminCategoriesView initialCategories={categories} />;
}
