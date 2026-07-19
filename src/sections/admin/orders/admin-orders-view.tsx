'use client';

import type { OrderRecord, TableSessionSummary } from 'src/lib/order-service';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { fTime } from 'src/utils/format-time';

import { useConfirmDialog } from 'src/components/custom-dialog';

import { OpenTablesPanel } from './open-tables-panel';
import { useNewOrderAlert } from './use-new-order-alert';
import { listOrdersAdmin, updateOrderStatus } from './order-admin-actions';
import { NEXT_STATUS, STATUS_COLOR, STATUS_LABEL } from './order-status-config';

// ----------------------------------------------------------------------

const POLL_INTERVAL_MS = 5000;

const FILTERS: { value: 'active' | 'all'; label: string }[] = [
  { value: 'active', label: 'กำลังดำเนินการ' },
  { value: 'all', label: 'ทั้งหมด' },
];

type Props = {
  initialOrders: OrderRecord[];
  initialSessions: TableSessionSummary[];
};

export function AdminOrdersView({ initialOrders, initialSessions }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const { confirm, dialog } = useConfirmDialog();

  const orderIds = useMemo(() => orders.map((order) => order.id), [orders]);
  useNewOrderAlert(orderIds);

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

  const takeawayOrders = useMemo(() => orders.filter((order) => order.orderType === 'takeaway'), [
    orders,
  ]);

  const visibleOrders = useMemo(
    () =>
      filter === 'active'
        ? takeawayOrders.filter((order) => order.status !== 'completed' && order.status !== 'cancelled')
        : takeawayOrders,
    [takeawayOrders, filter]
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
    const confirmed = await confirm({
      content: `ยกเลิกออเดอร์ ${order.orderNumber} ใช่หรือไม่?`,
      confirmLabel: 'ยกเลิกออเดอร์',
    });
    if (!confirmed) return;

    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelled' } : o)));
    await updateOrderStatus(order.id, 'cancelled');
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        ออเดอร์
      </Typography>

      <OpenTablesPanel initialSessions={initialSessions} />

      <Divider sx={{ mb: 4 }} />

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5">ออเดอร์กลับบ้าน</Typography>

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
          ยังไม่มีออเดอร์กลับบ้าน
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
                  {fTime(order.createdAt)} · กลับบ้าน
                </Typography>

                <Typography variant="body2">{order.customerName}</Typography>

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

      {dialog}
    </Box>
  );
}
