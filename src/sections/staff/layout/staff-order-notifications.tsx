'use client';

import type { OrderRecord } from 'src/lib/order-service';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { STATUS_COLOR, STATUS_LABEL } from 'src/sections/admin/orders/order-status-config';

// ----------------------------------------------------------------------

const ORDER_TYPE_PATH: Record<OrderRecord['orderType'], string> = {
  'dine-in': '/staff/orders',
  takeaway: '/staff/takeaway-orders',
};

type Props = {
  orders: OrderRecord[];
};

/** Header bell — badge count + dropdown of orders still waiting to be started, live via useOrdersRealtime upstream. */
export function StaffOrderNotifications({ orders }: Props) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const pendingOrders = orders
    .filter((order) => order.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (order: OrderRecord) => {
    handleClose();
    router.push(ORDER_TYPE_PATH[order.orderType]);
  };

  return (
    <>
      <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
        <Badge badgeContent={pendingOrders.length} color="error" max={99}>
          <Iconify icon="solar:bell-bing-bold-duotone" width={24} />
        </Badge>
      </IconButton>

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 440 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1">ออเดอร์รอดำเนินการ</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {pendingOrders.length > 0 ? `${pendingOrders.length} รายการรอเริ่มทำ` : 'ไม่มีออเดอร์ที่รอดำเนินการ'}
          </Typography>
        </Box>
        <Divider />

        {pendingOrders.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 5 }}>
            <Box sx={{ fontSize: 32 }}>🎉</Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ไม่มีออเดอร์ใหม่ตอนนี้
            </Typography>
          </Stack>
        ) : (
          <Stack sx={{ maxHeight: 360, overflowY: 'auto' }}>
            {pendingOrders.slice(0, 15).map((order) => (
              <ButtonBase
                key={order.id}
                onClick={() => handleSelect(order)}
                sx={{ display: 'block', textAlign: 'left' }}
              >
                <Stack
                  spacing={0.5}
                  sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'grey.100' }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Typography variant="subtitle2" noWrap>
                      {order.orderNumber} ·{' '}
                      {order.orderType === 'dine-in' ? `โต๊ะ ${order.tableNumber}` : 'กลับบ้าน'}
                    </Typography>
                    <Chip
                      size="small"
                      label={STATUS_LABEL[order.status]}
                      color={STATUS_COLOR[order.status]}
                    />
                  </Stack>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                      {order.customerName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                      {fTime(order.createdAt)} น.
                    </Typography>
                  </Stack>
                </Stack>
              </ButtonBase>
            ))}
          </Stack>
        )}
      </Popover>
    </>
  );
}
