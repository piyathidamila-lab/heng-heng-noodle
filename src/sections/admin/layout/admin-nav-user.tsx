import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';

import { adminLogoutAction } from './admin-actions';

// ----------------------------------------------------------------------

type Props = {
  displayName: string;
  username: string;
  role: 'admin' | 'staff';
};

const ROLE_LABEL: Record<Props['role'], string> = {
  admin: 'แอดมิน',
  staff: 'พนักงานหน้าร้าน',
};

/** Real logged-in admin's info at the bottom of the sidebar — replaces the template's mocked NavUpgrade block. */
export function AdminNavUser({ displayName, username, role }: Props) {
  const name = displayName || username;

  return (
    <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
      <Stack alignItems="center">
        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
          {name.charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ mb: 2, mt: 1.5, width: 1 }}>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{ color: 'var(--layout-nav-text-primary-color)' }}
          >
            {name}
          </Typography>

          <Stack direction="row" spacing={0.75} justifyContent="center" alignItems="center" sx={{ mt: 0.5 }}>
            <Typography variant="caption" noWrap sx={{ color: 'var(--layout-nav-text-disabled-color)' }}>
              @{username}
            </Typography>
            <Label color={role === 'admin' ? 'info' : 'success'} variant="soft" sx={{ height: 18 }}>
              {ROLE_LABEL[role]}
            </Label>
          </Stack>
        </Box>

        <Box component="form" action={adminLogoutAction} sx={{ width: 1 }}>
          <Button type="submit" variant="outlined" color="inherit" fullWidth>
            ออกจากระบบ
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
