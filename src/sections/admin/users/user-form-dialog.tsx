'use client';

import type { AdminUser } from 'src/lib/user-service';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormHelperText from '@mui/material/FormHelperText';

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
          ? { username: editing.username, password: '', displayName: editing.displayName, role: editing.role }
          : EMPTY_FORM
      );
    }
  }, [open, editing]);

  const canSubmit =
    form.username.trim().length > 0 && (editing || form.password.length >= 6) && !submitting;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{editing ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            label="ชื่อผู้ใช้"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            disabled={!!editing}
            helperText={editing ? 'เปลี่ยนชื่อผู้ใช้ไม่ได้' : undefined}
            fullWidth
            autoFocus
          />

          <TextField
            label={editing ? 'ตั้งรหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน'}
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            helperText="อย่างน้อย 6 ตัวอักษร"
            fullWidth
          />

          <TextField
            label="ชื่อที่แสดง"
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            fullWidth
          />

          <TextField
            select
            label="สิทธิ์การใช้งาน"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as 'admin' | 'staff' }))}
            fullWidth
          >
            <MenuItem value="admin">แอดมิน (จัดการร้านได้ทั้งหมด)</MenuItem>
            <MenuItem value="staff">พนักงานหน้าร้าน (ดู/จัดการออเดอร์เท่านั้น)</MenuItem>
          </TextField>

          {error && <FormHelperText error>{error}</FormHelperText>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          ยกเลิก
        </Button>
        <Button variant="contained" disabled={!canSubmit} loading={submitting} onClick={() => onSubmit(form)}>
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
}
