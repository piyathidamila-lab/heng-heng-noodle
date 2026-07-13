import type { Metadata } from 'next';

import { getTables } from 'src/lib/table-service';

import { AdminTablesView } from 'src/sections/admin/tables/admin-tables-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'QR โต๊ะ | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  const tables = await getTables();

  return <AdminTablesView initialTables={tables} />;
}
