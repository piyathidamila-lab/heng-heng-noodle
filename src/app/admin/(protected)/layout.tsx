import { redirect } from 'next/navigation';

import { isAdminAuthenticated } from 'src/lib/admin-session';

import { AdminShell } from 'src/sections/admin/layout/admin-shell';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default async function Layout({ children }: Props) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  return <AdminShell>{children}</AdminShell>;
}
