import type { Metadata } from 'next';

import { AdminTablesView } from 'src/sections/admin/tables/admin-tables-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'QR โต๊ะ | เฮงเฮง ก๋วยเตี๋ยว' };

export default function Page() {
  return <AdminTablesView />;
}
