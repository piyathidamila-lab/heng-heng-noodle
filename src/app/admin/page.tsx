import { redirect } from 'next/navigation';

import { isAdminAuthenticated } from 'src/lib/admin-session';

// ----------------------------------------------------------------------

export default async function Page() {
  redirect((await isAdminAuthenticated()) ? '/admin/overview' : '/admin/login');
}
