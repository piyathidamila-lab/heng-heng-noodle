'use client';

import type { AdminUser } from 'src/lib/user-service';
import type { UserFormValues } from './user-form-dialog';
import type { IconifyName } from 'src/components/iconify';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

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

type UserFilter = 'all' | 'admin' | 'staff' | 'inactive';

const FILTER_OPTIONS: { value: UserFilter; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'admin', label: 'แอดมิน' },
  { value: 'staff', label: 'พนักงาน' },
  { value: 'inactive', label: 'ปิดใช้งาน' },
];

type Props = {
  initialUsers: AdminUser[];
  currentUserId: string;
};

function getInitials(user: AdminUser) {
  const label = user.displayName.trim() || user.username;
  return label.slice(0, 2).toUpperCase();
}

export function AdminUsersView({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const { confirm, dialog } = useConfirmDialog();

  const summary = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.isActive).length,
      admin: users.filter((user) => user.role === 'admin').length,
      staff: users.filter((user) => user.role === 'staff').length,
    }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !keyword ||
        user.username.toLocaleLowerCase().includes(keyword) ||
        user.displayName.toLocaleLowerCase().includes(keyword);
      const matchesFilter =
        filter === 'all' || (filter === 'inactive' ? !user.isActive : user.role === filter);

      return matchesSearch && matchesFilter;
    });
  }, [filter, search, users]);

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
        if (values.password) await resetUserPasswordAdmin(editing.id, values.password);
        setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
        toast.success(`อัปเดตบัญชี @${updated.username} แล้ว`);
      } else {
        const created = await createUserAdmin({
          username: values.username,
          password: values.password,
          displayName: values.displayName,
          role: values.role,
        });
        setUsers((current) => [created, ...current]);
        toast.success(`เพิ่มบัญชี @${created.username} แล้ว`);
      }
      setDialogOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    if (busyId) return;
    setBusyId(user.id);
    try {
      const updated = await updateUserAdmin(user.id, { isActive: !user.isActive });
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(updated.isActive ? 'เปิดใช้งานบัญชีแล้ว' : 'ปิดใช้งานบัญชีแล้ว');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    const confirmed = await confirm({
      content: `ลบบัญชี “${user.displayName || user.username}” (@${user.username}) ใช่หรือไม่? ผู้ใช้นี้จะไม่สามารถเข้าสู่ระบบได้อีก`,
      confirmLabel: 'ลบบัญชี',
    });
    if (!confirmed) return;

    setBusyId(user.id);
    try {
      await deleteUserAdmin(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      toast.success(`ลบบัญชี @${user.username} แล้ว`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ลบไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const renderRole = (user: AdminUser) => (
    <Chip
      size="small"
      variant="soft"
      color={user.role === 'admin' ? 'primary' : 'info'}
      icon={
        <Iconify
          icon={
            (user.role === 'admin' ? 'solar:shield-user-bold' : 'solar:user-id-bold') as IconifyName
          }
          width={16}
        />
      }
      label={ROLE_LABEL[user.role]}
    />
  );

  const renderActions = (user: AdminUser) => {
    const isSelf = user.id === currentUserId;
    const isBusy = busyId === user.id;

    return (
      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
        <Tooltip title={isSelf ? 'ไม่สามารถปิดบัญชีที่กำลังใช้งาน' : 'เปิด/ปิดบัญชี'}>
          <span>
            <Switch
              size="small"
              checked={user.isActive}
              onChange={() => void handleToggleActive(user)}
              disabled={isSelf || Boolean(busyId)}
              inputProps={{ 'aria-label': `เปิดหรือปิดใช้งาน ${user.username}` }}
            />
          </span>
        </Tooltip>
        <Tooltip title="แก้ไขบัญชี">
          <span>
            <IconButton
              size="small"
              onClick={() => openEdit(user)}
              disabled={Boolean(busyId)}
              aria-label={`แก้ไข ${user.username}`}
            >
              <Iconify icon="solar:pen-bold" width={19} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={isSelf ? 'ไม่สามารถลบบัญชีที่กำลังใช้งาน' : 'ลบบัญชี'}>
          <span>
            <IconButton
              size="small"
              color="error"
              disabled={isSelf || Boolean(busyId)}
              onClick={() => void handleDelete(user)}
              aria-label={`ลบ ${user.username}`}
            >
              <Iconify
                icon={isBusy ? 'solar:clock-circle-bold' : 'solar:trash-bin-trash-bold'}
                width={19}
              />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    );
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 3,
          color: 'common.white',
          background: 'linear-gradient(135deg, #67100E 0%, #A31F18 58%, #DA6435 100%)',
          boxShadow: '0 16px 38px rgba(103,16,14,0.18)',
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 230,
            height: 230,
            top: -135,
            right: -50,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.09)',
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2.5}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box>
            <Typography variant="h3" sx={{ color: 'inherit' }}>
              จัดการผู้ใช้งาน
            </Typography>
            <Typography sx={{ mt: 0.75, maxWidth: 650, color: 'rgba(255,255,255,0.78)' }}>
              จัดการบัญชี สิทธิ์ และสถานะการเข้าใช้งานของทีมงานภายในร้าน
            </Typography>
          </Box>
          <Button
            size="large"
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" width={22} />}
            onClick={openCreate}
            sx={{
              color: 'primary.darker',
              bgcolor: 'common.white',
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            เพิ่มผู้ใช้งาน
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, 1fr)' },
        }}
      >
        {[
          {
            label: 'ผู้ใช้ทั้งหมด',
            value: summary.total,
            icon: 'solar:users-group-rounded-bold',
            color: '#67100E',
            bg: '#FBE9E7',
          },
          {
            label: 'กำลังใช้งาน',
            value: summary.active,
            icon: 'solar:verified-check-bold',
            color: '#118D57',
            bg: '#D8FBDE',
          },
          {
            label: 'แอดมิน',
            value: summary.admin,
            icon: 'solar:shield-user-bold',
            color: '#B76E00',
            bg: '#FFF5CC',
          },
          {
            label: 'พนักงาน',
            value: summary.staff,
            icon: 'solar:user-id-bold',
            color: '#006C9C',
            bg: '#CAFDF5',
          },
        ].map((item) => (
          <Card
            key={item.label}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 24px rgba(33,43,54,0.05)',
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="h3">{item.value}</Typography>
                <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
                  {item.label}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  borderRadius: 2,
                  color: item.color,
                  bgcolor: item.bg,
                }}
              >
                <Iconify icon={item.icon as IconifyName} width={26} />
              </Box>
            </Stack>
          </Card>
        ))}
      </Box>

      <Card
        sx={{
          mt: 3,
          overflow: 'hidden',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาชื่อหรือชื่อผู้ใช้..."
            sx={{ width: { xs: 1, md: 320 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={20} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {FILTER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="small"
                variant={filter === option.value ? 'contained' : 'outlined'}
                color={filter === option.value ? 'primary' : 'inherit'}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </Stack>
        </Stack>

        {filteredUsers.length === 0 ? (
          <Stack alignItems="center" sx={{ px: 2, py: 8, textAlign: 'center' }}>
            <Iconify
              icon={'solar:user-block-rounded-bold-duotone' as IconifyName}
              width={58}
              color="text.disabled"
            />
            <Typography variant="h6" sx={{ mt: 1.5 }}>
              ไม่พบผู้ใช้งาน
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
              ลองเปลี่ยนคำค้นหาหรือตัวกรองอีกครั้ง
            </Typography>
          </Stack>
        ) : (
          <>
            <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
              <Table sx={{ minWidth: 820 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>ผู้ใช้งาน</TableCell>
                    <TableCell>สิทธิ์</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>วันที่สร้าง</TableCell>
                    <TableCell align="right">จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentUserId;

                    return (
                      <TableRow key={user.id} hover sx={{ opacity: user.isActive ? 1 : 0.62 }}>
                        <TableCell sx={{ width: '38%', py: 2 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{
                                width: 42,
                                height: 42,
                                color: user.role === 'admin' ? 'primary.darker' : 'info.darker',
                                bgcolor: user.role === 'admin' ? 'primary.lighter' : 'info.lighter',
                                fontSize: 15,
                                fontWeight: 800,
                              }}
                            >
                              {getInitials(user)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <Typography variant="subtitle2" noWrap>
                                  {user.displayName || user.username}
                                </Typography>
                                {isSelf && (
                                  <Chip size="small" label="บัญชีของคุณ" variant="outlined" />
                                )}
                              </Stack>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                @{user.username}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{renderRole(user)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            variant="soft"
                            color={user.isActive ? 'success' : 'error'}
                            label={user.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{fDate(user.createdAt)}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            วันที่สร้างบัญชี
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{renderActions(user)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' }, p: 2 }}>
              {filteredUsers.map((user) => {
                const isSelf = user.id === currentUserId;

                return (
                  <Box
                    key={user.id}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      opacity: user.isActive ? 1 : 0.65,
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="flex-start">
                      <Avatar
                        sx={{
                          width: 42,
                          height: 42,
                          color: 'primary.darker',
                          bgcolor: 'primary.lighter',
                          fontSize: 15,
                          fontWeight: 800,
                        }}
                      >
                        {getInitials(user)}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack
                          direction="row"
                          spacing={0.75}
                          useFlexGap
                          flexWrap="wrap"
                          alignItems="center"
                        >
                          <Typography variant="subtitle2">
                            {user.displayName || user.username}
                          </Typography>
                          {isSelf && <Chip size="small" label="คุณ" variant="outlined" />}
                        </Stack>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          @{user.username} · สร้างเมื่อ {fDate(user.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      useFlexGap
                      flexWrap="wrap"
                      sx={{ mt: 1.5 }}
                    >
                      {renderRole(user)}
                      <Chip
                        size="small"
                        variant="soft"
                        color={user.isActive ? 'success' : 'error'}
                        label={user.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                      />
                    </Stack>
                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                      {renderActions(user)}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </>
        )}
      </Card>

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
