'use client';

import { usePathname } from 'next/navigation';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';

import { staffLogoutAction } from './staff-actions';

// ----------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'ออเดอร์', path: '/staff/orders' },
  { label: 'ประวัติออเดอร์', path: '/staff/order-history' },
  { label: 'เช็คบิล', path: '/staff/bills' },
  { label: 'แลกของรางวัล', path: '/staff/redemptions' },
];

type Props = {
  shopName: string;
  displayName: string;
  children: React.ReactNode;
};

export function StaffShell({ shopName, displayName, children }: Props) {
  const pathname = usePathname();
  const activeTab = NAV_ITEMS.find((item) => pathname.startsWith(item.path))?.path ?? false;

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'grey.100' }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'common.white',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              py: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Logo />
              <Box>
                <Typography variant="subtitle1" sx={{ lineHeight: 1.2 }}>
                  {shopName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  หน้าร้าน
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {displayName && (
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
                >
                  {displayName}
                </Typography>
              )}
              <Box component="form" action={staffLogoutAction}>
                <Button
                  type="submit"
                  size="large"
                  color="inherit"
                  startIcon={<Iconify icon="mingcute:close-line" width={20} />}
                >
                  ออกจากระบบ
                </Button>
              </Box>
            </Box>
          </Box>

          <Tabs
            value={activeTab}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="เมนูหน้าร้าน"
            sx={{
              minHeight: 48,
              '& .MuiTabs-flexContainer': { gap: { xs: 0, sm: 0.5 } },
            }}
          >
            {NAV_ITEMS.map((item) => (
              <Tab
                key={item.path}
                value={item.path}
                label={item.label}
                component={RouterLink}
                href={item.path}
                sx={{ minHeight: 48, fontSize: 16, px: 2.5 }}
              />
            ))}
          </Tabs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
}
