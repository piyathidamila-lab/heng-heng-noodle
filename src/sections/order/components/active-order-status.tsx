'use client';

import type { OrderStatus } from 'src/lib/order-service';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { OrderStatusBadge } from './order-status-badge';
import { getTableOrders, getOrderStatus, getMyOrderHistory } from '../order-actions';

// ----------------------------------------------------------------------

const POLL_INTERVAL_MS = 6000;
const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'preparing', 'served'];
const STATUS_RANK: Record<OrderStatus, number> = {
  pending: 0,
  preparing: 1,
  served: 2,
  completed: 3,
  cancelled: 4,
};

type ActiveOrder = {
  orderNumber: string;
  status: OrderStatus;
  extraCount: number;
};

type Props = {
  /** The scanned table number in dine-in mode, or null for a takeaway customer. */
  table: string | null;
  memberId: string | null;
  onViewOrders?: () => void;
};

/**
 * Compact "you already have an order going" banner for the menu (home) view —
 * so a customer doesn't have to switch tabs or reopen order history just to
 * see whether their food is on the way.
 */
export function ActiveOrderStatus({ table, memberId, onViewOrders }: Props) {
  const [active, setActive] = useState<ActiveOrder | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        if (table) {
          const orders = await getTableOrders(table);
          const inProgress = orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
          if (cancelled) return;

          if (inProgress.length === 0) {
            setActive(null);
            return;
          }

          const leader = inProgress.reduce((a, b) =>
            STATUS_RANK[a.status] <= STATUS_RANK[b.status] ? a : b
          );
          setActive({
            orderNumber: leader.orderNumber,
            status: leader.status,
            extraCount: inProgress.length - 1,
          });
        } else {
          if (!memberId) {
            setActive(null);
            return;
          }

          const history = await getMyOrderHistory();
          const lastTakeaway = history.find((order) => order.orderType === 'takeaway');
          if (!lastTakeaway) {
            setActive(null);
            return;
          }

          const status = await getOrderStatus(lastTakeaway.id);
          if (cancelled) return;

          if (!status || !ACTIVE_STATUSES.includes(status)) {
            setActive(null);
            return;
          }
          setActive({ orderNumber: lastTakeaway.orderNumber, status, extraCount: 0 });
        }
      } catch (error) {
        console.error(error);
      }
    };

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [memberId, table]);

  if (!active) return null;

  return (
    <ButtonBase
      onClick={onViewOrders}
      disabled={!onViewOrders}
      sx={{ display: 'block', textAlign: 'left', borderRadius: 3, mx: 2.5, mt: 2 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          p: 1.75,
          borderRadius: 3,
          bgcolor: 'common.white',
          border: '1px solid',
          borderColor: 'grey.200',
          boxShadow: '0 8px 20px rgba(69,37,20,0.06)',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            ออเดอร์ {active.orderNumber}
            {active.extraCount > 0 ? ` และอีก ${active.extraCount} รายการ` : ''}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {onViewOrders ? 'แตะเพื่อดูรายละเอียด' : 'กำลังติดตามสถานะออเดอร์ของคุณ'}
          </Typography>
        </Box>
        <OrderStatusBadge status={active.status} />
      </Stack>
    </ButtonBase>
  );
}
