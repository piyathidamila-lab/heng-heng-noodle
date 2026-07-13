import { redirect } from 'next/navigation';

import { isAdminAuthenticated } from 'src/lib/admin-session';
import { DashboardLayout, DashboardContent } from 'src/layouts/dashboard';

import { adminNavData } from 'src/sections/admin/layout/admin-nav-config';
import { AdminHeaderActions } from 'src/sections/admin/layout/admin-header-actions';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default async function Layout({ children }: Props) {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  return (
    <DashboardLayout
      layoutQuery="md"
      slotProps={{
        nav: { data: adminNavData },
        header: { slots: { rightArea: <AdminHeaderActions /> } },
      }}
    >
      {/*
       * MainSection pulls content up by a fixed 80px to sit under the
       * transparent sticky header (a deliberate template effect). The
       * default --layout-dashboard-content-pt (8px) doesn't fully cancel
       * that on its own, so admin pages' top-right buttons end up under
       * the header's hit area. Override pt to fully clear both the mobile
       * (64px) and desktop (72px) header heights with a bit of breathing room.
       */}
      <DashboardContent maxWidth={false} layoutQuery="md" sx={{ pt: '96px' }}>
        {children}
      </DashboardContent>
    </DashboardLayout>
  );
}
