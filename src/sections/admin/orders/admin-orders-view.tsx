'use client';

import type { OrderStatus, OrderRecord } from 'src/lib/order-service';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { fTime } from 'src/utils/format-time';

import { listOrdersAdmin, updateOrderStatus } from './order-admin-actions';

// ----------------------------------------------------------------------

const POLL_INTERVAL_MS = 5000;

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'รอดำเนินการ',
  preparing: 'กำลังทำ',
  served: 'เสิร์ฟแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
};

const STATUS_COLOR: Record<OrderStatus, 'warning' | 'info' | 'success' | 'default' | 'error'> = {
  pending: 'warning',
  preparing: 'info',
  served: 'success',
  completed: 'default',
  cancelled: 'error',
};

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: 'preparing', label: 'เริ่มทำอาหาร' },
  preparing: { status: 'served', label: 'เสิร์ฟแล้ว' },
  served: { status: 'completed', label: 'จบออเดอร์' },
};

const FILTERS: { value: 'active' | 'all'; label: string }[] = [
  { value: 'active', label: 'กำลังดำเนินการ' },
  { value: 'all', label: 'ทั้งหมด' },
];

type Props = {
  initialOrders: OrderRecord[];
};

export function AdminOrdersView({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  useEffect(() => {
    let active = true;

    const tick = async () => {
      try {
        const data = await listOrdersAdmin();
        if (active) setOrders(data);
      } catch (error) {
        console.error(error);
      }
    };

    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const visibleOrders = useMemo(
    () =>
      filter === 'active'
        ? orders.filter((order) => order.status !== 'completed' && order.status !== 'cancelled')
        : orders,
    [orders, filter]
  );

  const handleAdvance = async (order: OrderRecord) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: next.status } : o))
    );
    await updateOrderStatus(order.id, next.status);
  };

  const handleCancel = async (order: OrderRecord) => {
    if (!window.confirm(`ยกเลิกออเดอร์ ${order.orderNumber} ใช่หรือไม่?`)) return;

    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelled' } : o)));
    await updateOrderStatus(order.id, 'cancelled');
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4">ออเดอร์</Typography>

        <Stack direction="row" spacing={1}>
          {FILTERS.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              onClick={() => setFilter(item.value)}
              color={filter === item.value ? 'primary' : 'default'}
              variant={filter === item.value ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      </Stack>

      {visibleOrders.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 8 }}>
          ยังไม่มีออเดอร์
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {visibleOrders.map((order) => {
            const next = NEXT_STATUS[order.status];

            return (
              <Stack
                key={order.id}
                spacing={1.5}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: 'common.white',
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1">{order.orderNumber}</Typography>
                  <Chip
                    size="small"
                    label={STATUS_LABEL[order.status]}
                    color={STATUS_COLOR[order.status]}
                  />
                </Stack>

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {fTime(order.createdAt)} ·{' '}
                  {order.orderType === 'dine-in'
                    ? `ทานที่ร้าน (โต๊ะ ${order.tableNumber})`
                    : 'กลับบ้าน'}
                </Typography>

                <Typography variant="body2">
                  {order.customerName} · {order.customerPhone}
                </Typography>

                <Divider />

                <Stack spacing={0.5}>
                  {order.items.map((item) => (
                    <Stack key={item.id} direction="row" justifyContent="space-between">
                      <Typography variant="body2">
                        {item.name} × {item.quantity}
                      </Typography>
                      <Typography variant="body2">{item.price * item.quantity} บาท</Typography>
                    </Stack>
                  ))}
                </Stack>

                {order.note && (
                  <Typography variant="caption" sx={{ color: 'warning.dark' }}>
                    หมายเหตุ: {order.note}
                  </Typography>
                )}

                <Divider />

                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1">รวม {order.total} บาท</Typography>
                </Stack>

                {(next || order.status === 'pending' || order.status === 'preparing') && (
                  <Stack direction="row" spacing={1}>
                    {next && (
                      <Button variant="contained" fullWidth onClick={() => handleAdvance(order)}>
                        {next.label}
                      </Button>
                    )}
                    {(order.status === 'pending' || order.status === 'preparing') && (
                      <Button color="error" variant="outlined" onClick={() => handleCancel(order)}>
                        ยกเลิก
                      </Button>
                    )}
                  </Stack>
                )}
              </Stack>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
