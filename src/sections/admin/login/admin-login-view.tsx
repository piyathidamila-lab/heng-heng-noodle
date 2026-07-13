'use client';

import { useActionState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { adminLoginAction } from './login-actions';

// ----------------------------------------------------------------------

type Props = {
  shopName: string;
};

export function AdminLoginView({ shopName }: Props) {
  const [state, formAction, pending] = useActionState(adminLoginAction, {});

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        px: 2,
      }}
    >
      <Card sx={{ width: 1, maxWidth: 380, p: 4 }}>
        <Stack spacing={0.5} sx={{ mb: 4, alignItems: 'center', textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'common.white',
              mb: 1.5,
              fontSize: 28,
            }}
          >
            🍜
          </Box>
          <Typography variant="h5">{shopName}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            เข้าสู่ระบบสำหรับแอดมิน
          </Typography>
        </Stack>

        <Stack component="form" action={formAction} spacing={2.5}>
          <TextField
            name="password"
            type="password"
            label="รหัสผ่านแอดมิน"
            autoFocus
            fullWidth
            error={!!state.error}
            helperText={state.error}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            loading={pending}
            startIcon={<Iconify icon="solar:user-rounded-bold" />}
          >
            เข้าสู่ระบบ
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
