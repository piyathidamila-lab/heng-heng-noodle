'use client';

import { useActionState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';

import { loginAction } from './login-actions';

// ----------------------------------------------------------------------

type Props = {
  shopName: string;
};

export function LoginView({ shopName }: Props) {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        backgroundImage:
          "linear-gradient(135deg, rgba(50, 8, 7, 0.72), rgba(113, 17, 17, 0.48)), url('https://res.cloudinary.com/dkdbilwtj/image/upload/v1784440581/og-images_mkbszz.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Card
        sx={{
          width: 1,
          maxWidth: 420,
          p: { xs: 4, sm: 5 },
          bgcolor: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.45)',
          boxShadow: '0 24px 64px rgba(35,8,6,0.28)',
        }}
      >
        <Stack spacing={0.5} sx={{ mb: 4, alignItems: 'center', textAlign: 'center' }}>
          <Logo sx={{ height: 100, width: 100 }} />

          <Stack mt={2}>
            <Typography variant="h5">{shopName}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              เข้าสู่ระบบสำหรับแอดมิน / พนักงานหน้าร้าน
            </Typography>
          </Stack>
        </Stack>

        <Stack component="form" action={formAction} spacing={2.5}>
          <TextField name="username" label="ชื่อผู้ใช้" autoFocus fullWidth />

          <TextField
            name="password"
            type="password"
            label="รหัสผ่าน"
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
            sx={{ py: 1.5 }}
          >
            เข้าสู่ระบบ
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
