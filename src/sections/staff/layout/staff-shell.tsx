'use client';

import type { OrderRecord } from 'src/lib/order-service';
import type { IconifyName } from 'src/components/iconify';

import { usePathname } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Badge from '@mui/material/Badge';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { listOrdersAdmin } from 'src/sections/admin/orders/order-admin-actions';
import { useOrdersRealtime } from 'src/sections/admin/orders/use-orders-realtime';

import { setShopOpenStaff, staffLogoutAction } from './staff-actions';
import { StaffOrderNotifications } from './staff-order-notifications';

// ----------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'ออเดอร์ในร้าน', path: '/staff/orders', orderType: 'dine-in' as const },
  { label: 'ออเดอร์กลับบ้าน', path: '/staff/takeaway-orders', orderType: 'takeaway' as const },
  { label: 'ประวัติออเดอร์', path: '/staff/order-history' },
  { label: 'เช็คบิล', path: '/staff/bills' },
  { label: 'แลกของรางวัล', path: '/staff/redemptions' },
  { label: 'ยอดขายวันนี้', path: '/staff/sales' },
];

type Props = {
  shopName: string;
  displayName: string;
  initialIsOpen: boolean;
  initialOrders: OrderRecord[];
  children: React.ReactNode;
};

export function StaffShell({
  shopName,
  displayName,
  initialIsOpen,
  initialOrders,
  children,
}: Props) {
  const pathname = usePathname();
  const activeTab = NAV_ITEMS.find((item) => pathname.startsWith(item.path))?.path ?? false;

  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [toggling, setToggling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [orders, setOrders] = useState(initialOrders);
  const refreshOrders = useCallback(async () => {
    try {
      setOrders(await listOrdersAdmin());
    } catch (error) {
      console.error(error);
    }
  }, []);
  useOrdersRealtime({ onChange: refreshOrders });

  const pendingCountByType = useMemo(() => {
    const counts: Record<'dine-in' | 'takeaway', number> = { 'dine-in': 0, takeaway: 0 };
    orders.forEach((order) => {
      if (order.status === 'pending') counts[order.orderType] += 1;
    });
    return counts;
  }, [orders]);

  const applyToggle = async (next: boolean) => {
    setToggling(true);
    try {
      await setShopOpenStaff(next);
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

  const handleLogoutClick = async () => {
    const confirmed = await confirm({
      title: 'ยืนยันออกจากระบบ',
      content: 'คุณต้องการออกจากระบบใช่หรือไม่?',
      confirmLabel: 'ออกจากระบบ',
      confirmColor: 'error',
    });
    if (confirmed) await staffLogoutAction();
  };

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'grey.100' }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'common.white',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              py: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Logo />
              <Box>
                <Typography variant="subtitle1" sx={{ lineHeight: 1.2 }}>
                  {shopName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  หน้าร้าน
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {displayName && (
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
                >
                  {displayName}
                </Typography>
              )}
              <StaffOrderNotifications orders={orders} />
              <Button
                variant={isOpen ? 'soft' : 'contained'}
                color={isOpen ? 'success' : 'error'}
                loading={toggling}
                onClick={handleClickToggle}
                startIcon={
                  <Iconify
                    icon={
                      (isOpen ? 'solar:shop-bold' : 'solar:forbidden-circle-bold') as IconifyName
                    }
                    width={18}
                  />
                }
              >
                {isOpen ? 'ร้านเปิดอยู่' : 'ร้านปิดอยู่'}
              </Button>
              <Button
                size="large"
                color="inherit"
                onClick={handleLogoutClick}
                startIcon={<Iconify icon="mingcute:close-line" width={20} />}
              >
                ออกจากระบบ
              </Button>
            </Box>
          </Box>

          <Tabs
            value={activeTab}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="เมนูหน้าร้าน"
            sx={{
              minHeight: 48,
              '& .MuiTabs-flexContainer': { gap: { xs: 0, sm: 0.5 } },
            }}
          >
            {NAV_ITEMS.map((item) => {
              const pendingCount = item.orderType ? pendingCountByType[item.orderType] : 0;

              return (
                <Tab
                  key={item.path}
                  value={item.path}
                  label={
                    pendingCount > 0 ? (
                      <Badge badgeContent={pendingCount} color="error" max={99}>
                        <Box component="span" sx={{ pr: 1 }}>
                          {item.label}
                        </Box>
                      </Badge>
                    ) : (
                      item.label
                    )
                  }
                  component={RouterLink}
                  href={item.path}
                  sx={{ minHeight: 48, fontSize: 16, px: 2.5 }}
                />
              );
            })}
          </Tabs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {children}
      </Container>

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

      {confirmDialog}
    </Box>
  );
}
