'use client';

import type { IconifyName } from 'src/components/iconify';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';

import { useRouter } from 'src/routes/hooks';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { loginMemberAction, registerMemberAction } from './loyalty-actions';

// ----------------------------------------------------------------------

type Mode = 'login' | 'register';

export function MemberAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    /^0\d{8,9}$/.test(phone.replace(/\D/g, '')) &&
    /^\d{4,6}$/.test(pin) &&
    (mode === 'login' || displayName.trim().length > 0) &&
    !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'register') {
        await registerMemberAction(phone, pin, displayName);
        toast.success('สมัครสมาชิกสำเร็จ');
      } else {
        const ok = await loginMemberAction(phone, pin);
        if (!ok) {
          setError('เบอร์โทรศัพท์หรือ PIN ไม่ถูกต้อง');
          return;
        }
        toast.success('เข้าสู่ระบบสำเร็จ');
      }
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'ทำรายการไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', zIndex: 2, px: 2.5, mt: -3.5, pb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.25, sm: 3 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'rgba(122,16,16,0.08)',
          boxShadow: '0 18px 45px rgba(81,39,20,0.12)',
        }}
      >
        <Tabs
          value={mode}
          variant="fullWidth"
          onChange={(_, next: Mode) => {
            setMode(next);
            setError(null);
          }}
          aria-label="เลือกเข้าสู่ระบบหรือสมัครสมาชิก"
          sx={{
            mb: 3,
            p: 0.5,
            minHeight: 48,
            borderRadius: 2.5,
            bgcolor: '#F5EFEA',
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': {
              minHeight: 40,
              borderRadius: 2,
              color: 'text.secondary',
              fontWeight: 700,
            },
            '& .Mui-selected': {
              color: '#8D1717 !important',
              bgcolor: 'common.white',
              boxShadow: '0 4px 12px rgba(81,39,20,0.10)',
            },
          }}
        >
          <Tab value="login" label="เข้าสู่ระบบ" disableRipple />
          <Tab value="register" label="สมัครสมาชิก" disableRipple />
        </Tabs>

        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {mode === 'login' ? 'ยินดีต้อนรับกลับมา' : 'เริ่มสะสมดาวกันเลย'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary', lineHeight: 1.6 }}>
            {mode === 'login'
              ? 'กรอกเบอร์โทรศัพท์และ PIN ที่ใช้สมัครสมาชิก'
              : 'สมัครง่าย ๆ ด้วยเบอร์โทรศัพท์ ใช้เวลาไม่ถึงหนึ่งนาที'}
          </Typography>
        </Box>

        <Stack
          component="form"
          noValidate
          spacing={2.25}
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) handleSubmit();
          }}
        >
          {mode === 'register' && (
            <TextField
              label="ชื่อของคุณ"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="เช่น คุณสมชาย"
              autoComplete="name"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon={'solar:user-rounded-linear' as IconifyName} width={22} />
                    </InputAdornment>
                  ),
                },
              }}
              fullWidth
            />
          )}

          <TextField
            label="เบอร์โทรศัพท์"
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="0812345678"
            autoComplete="tel"
            slotProps={{
              htmlInput: { inputMode: 'tel' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon={'solar:phone-linear' as IconifyName} width={22} />
                  </InputAdornment>
                ),
              },
            }}
            fullWidth
          />

          <TextField
            label="PIN 4–6 หลัก"
            type={showPin ? 'text' : 'password'}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            slotProps={{
              htmlInput: { inputMode: 'numeric' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon={'solar:lock-password-linear' as IconifyName} width={22} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setShowPin((current) => !current)}
                      aria-label={showPin ? 'ซ่อน PIN' : 'แสดง PIN'}
                    >
                      <Iconify
                        icon={
                          (showPin ? 'solar:eye-closed-linear' : 'solar:eye-linear') as IconifyName
                        }
                        width={21}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            fullWidth
          />

          {error && (
            <FormHelperText
              error
              sx={{ m: '0 !important', p: 1.25, borderRadius: 1.5, bgcolor: 'error.lighter' }}
            >
              {error}
            </FormHelperText>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!canSubmit}
            loading={submitting}
            endIcon={<Iconify icon={'solar:arrow-right-linear' as IconifyName} width={20} />}
            sx={{ minHeight: 50, borderRadius: 2, fontSize: 16, fontWeight: 700 }}
          >
            {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกฟรี'}
          </Button>
        </Stack>
      </Paper>

      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={0.75}
        sx={{ mt: 2.5 }}
      >
        <Iconify icon={'solar:shield-check-linear' as IconifyName} width={18} color="#8B756A" />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          ข้อมูลของคุณใช้สำหรับระบบสมาชิกของร้านเท่านั้น
        </Typography>
      </Stack>
    </Box>
  );
}
