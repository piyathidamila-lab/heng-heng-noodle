'use client';

import type { IconifyName } from 'src/components/iconify';
import type { OrderRecord, TableSessionSummary } from 'src/lib/order-service';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { fTime } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { OpenTablesPanel } from './open-tables-panel';
import { useNewOrderAlert } from './use-new-order-alert';
import { useOrdersRealtime } from './use-orders-realtime';
import { listOrdersAdmin, updateOrderStatus } from './order-admin-actions';
import { NEXT_STATUS, STATUS_COLOR, STATUS_LABEL } from './order-status-config';

// ----------------------------------------------------------------------

const FILTERS: { value: 'active' | 'all'; label: string }[] = [
  { value: 'active', label: 'กำลังดำเนินการ' },
  { value: 'all', label: 'ทั้งหมด' },
];

type Props = {
  initialOrders: OrderRecord[];
  initialSessions: TableSessionSummary[];
};

function formatBaht(value: number) {
  return `${value.toLocaleString('th-TH')} บาท`;
}

export function AdminOrdersView({ initialOrders, initialSessions }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [busyId, setBusyId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const orderIds = useMemo(() => orders.map((order) => order.id), [orders]);
  useNewOrderAlert(orderIds);

  const refreshOrders = useCallback(async () => {
    try {
      const data = await listOrdersAdmin();
      setOrders(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useOrdersRealtime({ onChange: refreshOrders });

  const takeawayOrders = useMemo(
    () => orders.filter((order) => order.orderType === 'takeaway'),
    [orders]
  );

  const activeOrders = useMemo(
    () =>
      takeawayOrders.filter(
        (order) => order.status !== 'completed' && order.status !== 'cancelled'
      ),
    [takeawayOrders]
  );

  const visibleOrders = filter === 'active' ? activeOrders : takeawayOrders;

  const summary = useMemo(
    () => ({
      active: activeOrders.length,
      pending: takeawayOrders.filter((order) => order.status === 'pending').length,
      preparing: takeawayOrders.filter((order) => order.status === 'preparing').length,
      unpaid: activeOrders.filter((order) => order.paymentStatus === 'unpaid').length,
    }),
    [activeOrders, takeawayOrders]
  );

  const handleAdvance = async (order: OrderRecord) => {
    const next = NEXT_STATUS[order.status];
    if (!next || busyId) return;

    const previousStatus = order.status;
    setBusyId(order.id);
    setOrders((current) =>
      current.map((item) => (item.id === order.id ? { ...item, status: next.status } : item))
    );
    try {
      await updateOrderStatus(order.id, next.status);
      toast.success(`${order.orderNumber} เปลี่ยนเป็น “${STATUS_LABEL[next.status]}” แล้ว`);
    } catch (error) {
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, status: previousStatus } : item))
      );
      toast.error(error instanceof Error ? error.message : 'อัปเดตสถานะไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (order: OrderRecord) => {
    const confirmed = await confirm({
      content: `ยกเลิกออเดอร์ ${order.orderNumber} ของ “${order.customerName}” ใช่หรือไม่?`,
      confirmLabel: 'ยกเลิกออเดอร์',
    });
    if (!confirmed) return;

    setBusyId(order.id);
    try {
      await updateOrderStatus(order.id, 'cancelled');
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, status: 'cancelled' } : item))
      );
      toast.success(`ยกเลิก ${order.orderNumber} แล้ว`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ยกเลิกออเดอร์ไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
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
            width: 240,
            height: 240,
            top: -150,
            right: -45,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.09)',
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box>
            <Typography variant="h3" sx={{ color: 'inherit' }}>
              จัดการออเดอร์
            </Typography>
            <Typography sx={{ mt: 0.75, color: 'rgba(255,255,255,0.78)' }}>
              ดูโต๊ะที่กำลังให้บริการและติดตามออเดอร์กลับบ้านแบบเรียลไทม์
            </Typography>
          </Box>
          <Chip
            icon={<Iconify icon={'solar:refresh-circle-bold' as IconifyName} width={19} />}
            label="อัปเดตแบบเรียลไทม์"
            sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
          />
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
            label: 'กำลังดำเนินการ',
            value: summary.active,
            icon: 'solar:clipboard-list-bold',
            color: '#67100E',
            bg: '#FBE9E7',
          },
          {
            label: 'รอรับออเดอร์',
            value: summary.pending,
            icon: 'solar:clock-circle-bold',
            color: '#B76E00',
            bg: '#FFF5CC',
          },
          {
            label: 'กำลังทำอาหาร',
            value: summary.preparing,
            icon: 'solar:chef-hat-bold',
            color: '#006C9C',
            bg: '#CAFDF5',
          },
          {
            label: 'ยังไม่ชำระเงิน',
            value: summary.unpaid,
            icon: 'solar:wallet-money-bold',
            color: '#B71D18',
            bg: '#FFE9D5',
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

      <OpenTablesPanel initialSessions={initialSessions} />

      <Card
        sx={{
          mt: 3,
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 1.75,
                  color: 'primary.main',
                  bgcolor: 'primary.lighter',
                }}
              >
                <Iconify icon={'solar:bag-4-bold' as IconifyName} width={23} />
              </Box>
              <Box>
                <Typography variant="h5">ออเดอร์กลับบ้าน</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {activeOrders.length} รายการที่กำลังดำเนินการ
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1}>
            {FILTERS.map((item) => (
              <Button
                key={item.value}
                size="small"
                variant={filter === item.value ? 'contained' : 'outlined'}
                color={filter === item.value ? 'primary' : 'inherit'}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
                <Chip
                  size="small"
                  label={item.value === 'active' ? activeOrders.length : takeawayOrders.length}
                  sx={{ ml: 0.75, height: 20, bgcolor: 'rgba(255,255,255,0.18)' }}
                />
              </Button>
            ))}
          </Stack>
        </Stack>

        {visibleOrders.length === 0 ? (
          <Stack
            alignItems="center"
            sx={{ py: 7, px: 2, borderRadius: 2.5, bgcolor: 'grey.50', textAlign: 'center' }}
          >
            <Iconify
              icon={'solar:bag-check-bold-duotone' as IconifyName}
              width={58}
              color="text.disabled"
            />
            <Typography variant="h6" sx={{ mt: 1.5 }}>
              ไม่มีออเดอร์กลับบ้านในรายการนี้
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
              เมื่อมีออเดอร์ใหม่ ระบบจะแสดงที่นี่โดยอัตโนมัติ
            </Typography>
          </Stack>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            {visibleOrders.map((order) => {
              const next = NEXT_STATUS[order.status];
              const isBusy = busyId === order.id;

              return (
                <Box
                  key={order.id}
                  sx={{
                    overflow: 'hidden',
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: order.status === 'pending' ? 'warning.main' : 'divider',
                    bgcolor: 'background.paper',
                    boxShadow:
                      order.status === 'pending'
                        ? '0 8px 24px rgba(183,110,0,0.12)'
                        : '0 5px 18px rgba(33,43,54,0.05)',
                    opacity: order.status === 'cancelled' ? 0.62 : 1,
                  }}
                >
                  <Box sx={{ p: 2.25 }}>
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Box>
                        <Typography variant="h5">{order.orderNumber}</Typography>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                          <Iconify
                            icon="solar:clock-circle-outline"
                            width={16}
                            color="text.secondary"
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            รับออเดอร์เมื่อ {fTime(order.createdAt)}
                          </Typography>
                        </Stack>
                      </Box>
                      <Chip
                        size="small"
                        variant="soft"
                        label={STATUS_LABEL[order.status]}
                        color={STATUS_COLOR[order.status]}
                      />
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: '50%',
                          color: 'primary.main',
                          bgcolor: 'primary.lighter',
                        }}
                      >
                        <Iconify icon="solar:user-rounded-bold" width={19} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {order.customerName || 'ไม่ระบุชื่อ'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          รับกลับบ้าน
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Divider />

                  <Stack spacing={1} sx={{ p: 2.25, bgcolor: 'grey.50' }}>
                    {order.items.map((item) => (
                      <Stack
                        key={item.id}
                        direction="row"
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Typography variant="body2" sx={{ minWidth: 0 }}>
                          <Box
                            component="span"
                            sx={{ mr: 0.75, color: 'primary.main', fontWeight: 800 }}
                          >
                            {item.quantity}×
                          </Box>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ flexShrink: 0, fontWeight: 600 }}>
                          {formatBaht(item.price * item.quantity)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  {order.note && (
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        mx: 2.25,
                        mt: 2,
                        p: 1.25,
                        borderRadius: 1.5,
                        color: 'warning.darker',
                        bgcolor: 'warning.lighter',
                      }}
                    >
                      <Iconify icon="solar:notes-bold-duotone" width={19} sx={{ flexShrink: 0 }} />
                      <Typography variant="caption">หมายเหตุ: {order.note}</Typography>
                    </Stack>
                  )}

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ p: 2.25 }}
                  >
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        ยอดรวม
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'primary.main' }}>
                        {formatBaht(order.total)}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      variant="soft"
                      color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                      icon={
                        <Iconify
                          icon={
                            (order.paymentStatus === 'paid'
                              ? 'solar:check-circle-bold'
                              : 'solar:wallet-money-bold') as IconifyName
                          }
                          width={16}
                        />
                      }
                      label={order.paymentStatus === 'paid' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}
                    />
                  </Stack>

                  {(next || order.status === 'pending' || order.status === 'preparing') && (
                    <Stack direction="row" spacing={1} sx={{ px: 2.25, pb: 2.25 }}>
                      {next && (
                        <Button
                          variant="contained"
                          fullWidth
                          loading={isBusy}
                          disabled={Boolean(busyId)}
                          onClick={() => void handleAdvance(order)}
                        >
                          {next.label}
                        </Button>
                      )}
                      {(order.status === 'pending' || order.status === 'preparing') && (
                        <Button
                          color="error"
                          variant="outlined"
                          disabled={Boolean(busyId)}
                          onClick={() => void handleCancel(order)}
                        >
                          ยกเลิก
                        </Button>
                      )}
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Card>

      {dialog}
    </Box>
  );
}
