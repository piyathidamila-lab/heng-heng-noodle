'use client';

import type { AdminUser } from 'src/lib/user-service';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type UserFormValues = {
  username: string;
  password: string;
  displayName: string;
  role: 'admin' | 'staff';
};

type Props = {
  open: boolean;
  editing: AdminUser | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
};

const EMPTY_FORM: UserFormValues = { username: '', password: '', displayName: '', role: 'staff' };

export function UserFormDialog({ open, editing, submitting, error, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<UserFormValues>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              username: editing.username,
              password: '',
              displayName: editing.displayName,
              role: editing.role,
            }
          : EMPTY_FORM
      );
    }
  }, [open, editing]);

  const canSubmit =
    form.username.trim().length > 0 && (editing || form.password.length >= 6) && !submitting;

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: { sx: { overflow: 'hidden', borderRadius: 3, backgroundImage: 'none' } },
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.75,
          color: 'common.white',
          background: 'linear-gradient(135deg, #67100E 0%, #A31F18 68%, #D65A2E 100%)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 46,
              height: 46,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.15)',
            }}
          >
            <Iconify icon={editing ? 'solar:pen-bold' : 'solar:user-plus-bold'} width={25} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'inherit' }}>
              {editing ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.76)' }}>
              {editing ? `กำลังแก้ไขบัญชี @${editing.username}` : 'สร้างบัญชีสำหรับทีมงานภายในร้าน'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ px: 3, pt: 3 }}>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            label="ชื่อผู้ใช้"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            disabled={!!editing}
            helperText={editing ? 'เปลี่ยนชื่อผู้ใช้ไม่ได้' : undefined}
            fullWidth
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:user-id-bold" width={20} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label={editing ? 'ตั้งรหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน'}
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            helperText="อย่างน้อย 6 ตัวอักษร"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:lock-password-outline" width={20} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="ชื่อที่แสดง"
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:user-rounded-bold" width={20} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            select
            label="สิทธิ์การใช้งาน"
            value={form.role}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, role: e.target.value as 'admin' | 'staff' }))
            }
            fullWidth
            helperText={
              form.role === 'admin'
                ? 'จัดการข้อมูลและตั้งค่าร้านได้ทั้งหมด'
                : 'เข้าถึงหน้าจัดการออเดอร์สำหรับหน้าร้าน'
            }
          >
            <MenuItem value="admin">แอดมิน (จัดการร้านได้ทั้งหมด)</MenuItem>
            <MenuItem value="staff">พนักงานหน้าร้าน (ดู/จัดการออเดอร์เท่านั้น)</MenuItem>
          </TextField>

          {error && (
            <FormHelperText
              error
              sx={{ m: 0, p: 1.5, borderRadius: 1.5, bgcolor: 'error.lighter' }}
            >
              {error}
            </FormHelperText>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pt: 2, pb: 3 }}>
        <Button onClick={onClose} color="inherit" variant="outlined" disabled={submitting}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          disabled={!canSubmit}
          loading={submitting}
          onClick={() => onSubmit(form)}
          startIcon={
            <Iconify icon={editing ? 'solar:pen-bold' : 'mingcute:add-line'} width={20} />
          }
        >
          {editing ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้งาน'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
