'use client';

import type { AdminUser } from 'src/lib/user-service';
import type { UserFormValues } from './user-form-dialog';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { UserFormDialog } from './user-form-dialog';
import {
  deleteUserAdmin,
  updateUserAdmin,
  createUserAdmin,
  resetUserPasswordAdmin,
} from './user-admin-actions';

// ----------------------------------------------------------------------

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  admin: 'แอดมิน',
  staff: 'พนักงานหน้าร้าน',
};

type Props = {
  initialUsers: AdminUser[];
  currentUserId: string;
};

export function AdminUsersView({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditing(user);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: UserFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        const updated = await updateUserAdmin(editing.id, {
          displayName: values.displayName,
          role: values.role,
        });
        if (values.password) {
          await resetUserPasswordAdmin(editing.id, values.password);
        }
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        const created = await createUserAdmin({
          username: values.username,
          password: values.password,
          displayName: values.displayName,
          role: values.role,
        });
        setUsers((prev) => [created, ...prev]);
      }
      setDialogOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      const updated = await updateUserAdmin(user.id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    }
  };

  const handleDelete = async (user: AdminUser) => {
    const confirmed = await confirm({
      content: `ลบผู้ใช้งาน "${user.username}" ใช่หรือไม่?`,
      confirmLabel: 'ลบ',
    });
    if (!confirmed) return;

    try {
      await deleteUserAdmin(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ลบไม่สำเร็จ');
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h4">จัดการผู้ใช้งาน</Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<Iconify icon="mingcute:add-line" width={22} />}
          onClick={openCreate}
        >
          เพิ่มผู้ใช้งาน
        </Button>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        บัญชีสำหรับเข้าสู่ระบบแอดมินและหน้าร้าน — แอดมินจัดการร้านได้ทั้งหมด พนักงานหน้าร้านดู/จัดการได้เฉพาะออเดอร์
      </Typography>

      <Stack spacing={1.5}>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;

          return (
            <Stack
              key={user.id}
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ sm: 'center' }}
              justifyContent="space-between"
              spacing={1.5}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'common.white',
                border: '1px solid',
                borderColor: 'grey.200',
                opacity: user.isActive ? 1 : 0.6,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle1">{user.displayName || user.username}</Typography>
                  <Chip
                    size="small"
                    label={ROLE_LABEL[user.role]}
                    color={user.role === 'admin' ? 'primary' : 'default'}
                  />
                  {!user.isActive && <Chip size="small" label="ปิดใช้งาน" color="error" variant="outlined" />}
                  {isSelf && <Chip size="small" label="คุณ" variant="outlined" />}
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  @{user.username} · สร้างเมื่อ {fDate(user.createdAt)}
                </Typography>
              </Box>

              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                <Switch
                  checked={user.isActive}
                  onChange={() => handleToggleActive(user)}
                  disabled={isSelf}
                  inputProps={{ 'aria-label': `เปิดหรือปิดใช้งาน ${user.username}` }}
                />
                <IconButton onClick={() => openEdit(user)} aria-label={`แก้ไข ${user.username}`}>
                  <Iconify icon="solar:notes-bold-duotone" width={20} />
                </IconButton>
                <IconButton
                  color="error"
                  disabled={isSelf}
                  onClick={() => handleDelete(user)}
                  aria-label={`ลบ ${user.username}`}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                </IconButton>
              </Stack>
            </Stack>
          );
        })}
      </Stack>

      <UserFormDialog
        open={dialogOpen}
        editing={editing}
        submitting={submitting}
        error={formError}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      {dialog}
    </Box>
  );
}
