import { redirect } from 'next/navigation';

import { getOrders } from 'src/lib/order-service';
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

  const [settings, orders] = await Promise.all([getShopSettings(), getOrders()]);

  return (
    <StaffThemeProvider>
      <StaffShell
        shopName={settings.name}
        displayName={user.displayName}
        initialIsOpen={settings.manuallyOpen}
        initialOrders={orders}
      >
        {children}
      </StaffShell>
    </StaffThemeProvider>
  );
}
