'use client';

import type { OrderStatus, TableOrderSummary } from 'src/lib/order-service';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { fTime } from 'src/utils/format-time';

import { getTableOrders } from '../order-actions';

// ----------------------------------------------------------------------

const POLL_INTERVAL_MS = 6000;

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

type Props = {
  table: string;
  currentName: string;
};

export function TableOrdersPanel({ table, currentName }: Props) {
  const [orders, setOrders] = useState<TableOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    let active = true;

    const tick = async () => {
      try {
        const data = await getTableOrders(table);
        if (active) setOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    };

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [table]);

  const visibleOrders = useMemo(
    () => (onlyMine ? orders.filter((order) => order.customerName === currentName) : orders),
    [orders, onlyMine, currentName]
  );

  const groups = useMemo(() => {
    const map = new Map<string, TableOrderSummary[]>();
    visibleOrders.forEach((order) => {
      const list = map.get(order.customerName) ?? [];
      list.push(order);
      map.set(order.customerName, list);
    });
    return Array.from(map.entries());
  }, [visibleOrders]);

  const grandTotal = visibleOrders.reduce((sum, order) => sum + order.total, 0);

  if (loading) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Stack spacing={3.5} sx={{ px: 2.5, py: 2.5 }}>
      <Stack direction="row" spacing={1}>
        <Chip
          label="ทั้งโต๊ะ"
          size="small"
          onClick={() => setOnlyMine(false)}
          color={onlyMine ? 'default' : 'primary'}
          variant={onlyMine ? 'outlined' : 'filled'}
        />
        <Chip
          label="เฉพาะของฉัน"
          size="small"
          onClick={() => setOnlyMine(true)}
          color={onlyMine ? 'primary' : 'default'}
          variant={onlyMine ? 'filled' : 'outlined'}
        />
      </Stack>

      {visibleOrders.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 6 }}>
          {onlyMine ? 'คุณยังไม่ได้สั่งอาหาร' : 'ยังไม่มีใครสั่งอาหารที่โต๊ะนี้'}
        </Typography>
      ) : (
        <>
          {groups.map(([name, list]) => {
            const subtotal = list.reduce((sum, order) => sum + order.total, 0);

            return (
              <Box key={name}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1.25 }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {name}
                  </Typography>
                  <Typography variant="subtitle2" color="primary.main">
                    {subtotal} บาท
                  </Typography>
                </Stack>

                <Stack spacing={1.25}>
                  {list.map((order) => (
                    <Stack
                      key={order.id}
                      spacing={0.75}
                      sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {order.orderNumber} · {fTime(order.createdAt)}
                        </Typography>
                        <Chip
                          size="small"
                          label={STATUS_LABEL[order.status]}
                          color={STATUS_COLOR[order.status]}
                        />
                      </Stack>

                      {order.items.map((item) => (
                        <Stack key={item.id} direction="row" justifyContent="space-between">
                          <Typography variant="body2">
                            {item.name} × {item.quantity}
                          </Typography>
                          <Typography variant="body2">{item.price * item.quantity} บาท</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  ))}
                </Stack>
              </Box>
            );
          })}

          <Divider />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{onlyMine ? 'รวมของฉัน' : 'รวมทั้งโต๊ะ'}</Typography>
            <Typography variant="h6" color="primary.main">
              {grandTotal} บาท
            </Typography>
          </Stack>
        </>
      )}
    </Stack>
  );
}
