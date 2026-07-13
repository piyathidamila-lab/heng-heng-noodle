'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { usePathname } from 'src/routes/hooks';

import { MenuButton } from 'src/layouts/components/menu-button';

import { Iconify } from 'src/components/iconify';
import { NavSectionVertical } from 'src/components/nav-section';

import { adminNavData } from './admin-nav-config';
import { adminLogoutAction } from './admin-actions';

// ----------------------------------------------------------------------

const SIDEBAR_WIDTH = 280;
const LAYOUT_BREAKPOINT = 'md' as const;

function NavContent() {
  return (
    <Stack sx={{ height: 1 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2.5, py: 3 }}>
        <Box sx={{ fontSize: 32 }}>🍜</Box>
        <Box>
          <Typography variant="subtitle1" sx={{ lineHeight: 1.2 }}>
            เฮงเฮง ก๋วยเตี๋ยว
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            ระบบหลังร้าน
          </Typography>
        </Box>
      </Stack>

      <NavSectionVertical data={adminNavData} sx={{ px: 1.5, flex: 1 }} />

      <Divider sx={{ mx: 2.5 }} />

      <Box component="form" action={adminLogoutAction} sx={{ p: 2 }}>
        <Button
          type="submit"
          fullWidth
          startIcon={<Iconify icon="mingcute:close-line" width={22} />}
          sx={{ justifyContent: 'flex-start', px: 1.5, color: 'text.secondary' }}
        >
          ออกจากระบบ
        </Button>
      </Box>
    </Stack>
  );
}

type Props = {
  children: React.ReactNode;
};

export function AdminShell({ children }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', bgcolor: 'grey.100' }}>
      <Box
        component="nav"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          display: { xs: 'none', [LAYOUT_BREAKPOINT]: 'block' },
          minHeight: '100dvh',
          bgcolor: 'common.white',
          borderRight: '1px solid',
          borderColor: 'divider',
          '@media print': { display: 'none' },
        }}
      >
        <NavContent />
      </Box>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ [`& .MuiDrawer-paper`]: { width: SIDEBAR_WIDTH } }}
      >
        <NavContent />
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            px: 1.5,
            py: 1,
            display: { xs: 'flex', [LAYOUT_BREAKPOINT]: 'none' },
            bgcolor: 'common.white',
            borderBottom: '1px solid',
            borderColor: 'divider',
            '@media print': { display: 'none' },
          }}
        >
          <MenuButton onClick={() => setMobileOpen(true)} />
          <Typography variant="subtitle1">เฮงเฮง ก๋วยเตี๋ยว</Typography>
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
    </Box>
  );
}
