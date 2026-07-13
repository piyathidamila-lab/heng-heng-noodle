'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { SettingsButton } from 'src/layouts/components/settings-button';

import { Iconify } from 'src/components/iconify';

import { adminLogoutAction } from './admin-actions';

// ----------------------------------------------------------------------

/**
 * Replaces DashboardLayout's default rightArea (search/notifications/contacts/
 * account-switcher) — those are template demo widgets with no real data behind
 * them here, and the account drawer's sign-out button clears the mock JWT auth
 * context, not our admin session cookie, so it wouldn't actually log anyone out.
 * Keeps SettingsButton (real, works) and adds a logout button that does.
 */
export function AdminHeaderActions() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <SettingsButton />
      <Box component="form" action={adminLogoutAction}>
        <Button
          type="submit"
          size="small"
          color="inherit"
          startIcon={<Iconify icon="mingcute:close-line" width={18} />}
        >
          ออกจากระบบ
        </Button>
      </Box>
    </Box>
  );
}
