'use client';

import type { IconifyName } from 'src/components/iconify';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { SettingsButton } from 'src/layouts/components/settings-button';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { setShopOpenAdmin } from '../settings/settings-actions';

// ----------------------------------------------------------------------

type Props = {
  displayName: string;
  initialIsOpen: boolean;
};

/**
 * Replaces DashboardLayout's default rightArea (search/notifications/contacts/
 * account-switcher) — those are template demo widgets with no real data behind
 * them here, and the account drawer's sign-out button clears the mock JWT auth
 * context, not our admin session cookie, so it wouldn't actually log anyone out.
 * Keeps SettingsButton (real, works) and adds a logout button that does, plus
 * a quick เปิดร้าน/ปิดร้าน toggle — closing blocks new orders on the customer site.
 */
export function AdminHeaderActions({ displayName, initialIsOpen }: Props) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [toggling, setToggling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const applyToggle = async (next: boolean) => {
    setToggling(true);
    try {
      await setShopOpenAdmin(next);
      setIsOpen(next);
      toast.success(
        next
          ? 'เปิดร้านแล้ว ลูกค้าสั่งอาหารได้ตามปกติ'
          : 'ปิดร้านแล้ว ลูกค้าสั่งอาหารไม่ได้ชั่วคราว'
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ');
    } finally {
      setToggling(false);
    }
  };

  const handleClickToggle = () => {
    if (isOpen) {
      setConfirmOpen(true);
      return;
    }
    applyToggle(true);
  };

  const handleConfirmClose = async () => {
    setConfirmOpen(false);
    await applyToggle(false);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {displayName && (
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
        >
          {displayName}
        </Typography>
      )}
      <Button
        variant={isOpen ? 'soft' : 'contained'}
        color={isOpen ? 'success' : 'error'}
        size="small"
        loading={toggling}
        onClick={handleClickToggle}
        startIcon={
          <Iconify
            icon={(isOpen ? 'solar:shop-bold' : 'solar:forbidden-circle-bold') as IconifyName}
            width={18}
          />
        }
      >
        {isOpen ? 'ร้านเปิดอยู่' : 'ร้านปิดอยู่'}
      </Button>
      <SettingsButton />
      {/* <Box component="form" action={adminLogoutAction}>
        <Button
          type="submit"
          size="small"
          color="inherit"
          startIcon={<Iconify icon="mingcute:close-line" width={18} />}
        >
          ออกจากระบบ
        </Button>
      </Box> */}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>ยืนยันปิดร้าน</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ลูกค้าจะสั่งอาหารผ่านหน้าเว็บไม่ได้จนกว่าจะเปิดร้านอีกครั้ง
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={() => setConfirmOpen(false)}>
            ยกเลิก
          </Button>
          <Button color="error" variant="contained" loading={toggling} onClick={handleConfirmClose}>
            ปิดร้าน
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
