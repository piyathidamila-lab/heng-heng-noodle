import { redirect } from 'next/navigation';

import { getCurrentUser } from 'src/lib/auth-session';
import { getShopSettings } from 'src/lib/shop-settings-service';

import { StaffShell } from 'src/sections/staff/layout/staff-shell';
import { StaffThemeProvider } from 'src/sections/staff/layout/staff-theme-provider';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default async function Layout({ children }: Props) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'staff') {
    redirect('/login');
  }

  const settings = await getShopSettings();

  return (
    <StaffThemeProvider>
      <StaffShell shopName={settings.name} displayName={user.displayName}>
        {children}
      </StaffShell>
    </StaffThemeProvider>
  );
}
