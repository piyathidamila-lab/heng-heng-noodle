import { redirect } from 'next/navigation';

import { getCurrentUser } from 'src/lib/auth-session';
import { getShopSettings } from 'src/lib/shop-settings-service';
import { DashboardLayout, DashboardContent } from 'src/layouts/dashboard';

import { AdminNavUser } from 'src/sections/admin/layout/admin-nav-user';
import { adminNavData } from 'src/sections/admin/layout/admin-nav-config';
import { AdminHeaderActions } from 'src/sections/admin/layout/admin-header-actions';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default async function Layout({ children }: Props) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const settings = await getShopSettings();

  return (
    <DashboardLayout
      layoutQuery="md"
      slotProps={{
        nav: {
          data: adminNavData,
          slots: {
            bottomArea: (
              <AdminNavUser
                displayName={user.displayName}
                username={user.username}
                role={user.role}
              />
            ),
          },
        },
        header: {
          slots: {
            rightArea: (
              <AdminHeaderActions
                displayName={user.displayName}
                initialIsOpen={settings.manuallyOpen}
              />
            ),
          },
        },
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
