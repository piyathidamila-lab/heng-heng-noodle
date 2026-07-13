'use client';

import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { usePathname } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

import { adminLogoutAction } from './admin-actions';

// ----------------------------------------------------------------------

const NAV_ITEMS: { href: string; label: string; icon: IconifyName }[] = [
  { href: '/admin/menu', label: 'จัดการเมนู', icon: 'custom:fast-food-fill' },
  { href: '/admin/orders', label: 'ออเดอร์', icon: 'solar:cart-3-bold' },
  { href: '/admin/tables', label: 'QR โต๊ะ', icon: 'solar:qr-code-bold' as IconifyName },
];

const SIDEBAR_WIDTH = 280;

type Props = {
  children: React.ReactNode;
};

export function AdminShell({ children }: Props) {
  const pathname = usePathname();

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', bgcolor: 'grey.100' }}>
      <Stack
        component="nav"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          minHeight: '100dvh',
          bgcolor: 'primary.main',
          color: 'common.white',
          px: 2.5,
          py: 3.5,
          '@media print': { display: 'none' },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 1, mb: 5 }}>
          <Box sx={{ fontSize: 34 }}>🍜</Box>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              เฮงเฮง ก๋วยเตี๋ยว
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.72 }}>
              ระบบหลังร้าน
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={1} sx={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Button
                key={item.href}
                href={item.href}
                startIcon={<Iconify icon={item.icon} width={26} />}
                sx={{
                  justifyContent: 'flex-start',
                  px: 2,
                  py: 1.75,
                  borderRadius: 2,
                  fontSize: 17,
                  fontWeight: active ? 700 : 500,
                  color: 'common.white',
                  bgcolor: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                  borderLeft: '4px solid',
                  borderColor: active ? 'secondary.main' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.16)', mb: 1 }} />

        <Box component="form" action={adminLogoutAction}>
          <Button
            type="submit"
            fullWidth
            startIcon={<Iconify icon="mingcute:close-line" width={24} />}
            sx={{
              justifyContent: 'flex-start',
              px: 2,
              py: 1.5,
              fontSize: 16,
              color: 'rgba(255,255,255,0.8)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            ออกจากระบบ
          </Button>
        </Box>
      </Stack>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          p: { xs: 2.5, sm: 4 },
          '@media print': { p: 0 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
