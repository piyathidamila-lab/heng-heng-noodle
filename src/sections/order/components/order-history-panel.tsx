import type { StoredOrder } from '../order-history';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  orders: StoredOrder[];
  onBack: () => void;
};

export function OrderHistoryPanel({ orders, onBack }: Props) {
  const grandTotal = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 1.5, py: 2, borderBottom: '1px solid', borderColor: 'grey.200' }}
      >
        <IconButton onClick={onBack}>
          <Iconify icon="eva:diagonal-arrow-left-down-fill" width={20} />
        </IconButton>
        <Typography variant="h6">ประวัติการสั่งซื้อ</Typography>
      </Stack>

      {orders.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 8 }}>
          ยังไม่มีประวัติการสั่งอาหารบนเครื่องนี้
        </Typography>
      ) : (
        <Stack spacing={2} sx={{ px: 2.5, py: 2.5 }}>
          {orders.map((order) => (
            <Stack
              key={`${order.orderNumber}-${order.orderTime}`}
              spacing={1.25}
              sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1">{order.orderNumber}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {fDateTime(order.orderTime)}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                {order.items.map((item, index) => (
                  <Stack
                    key={`${item.name}-${index}`}
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2">
                      {item.emoji} {item.name} × {item.quantity}
                    </Typography>
                    <Typography variant="body2">{item.price * item.quantity} บาท</Typography>
                  </Stack>
                ))}
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle2">รวม</Typography>
                <Typography variant="subtitle2" color="primary.main">
                  {order.total} บาท
                </Typography>
              </Stack>
            </Stack>
          ))}

          <Divider />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">ยอดรวมทั้งหมด</Typography>
            <Typography variant="h6" color="primary.main">
              {grandTotal} บาท
            </Typography>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
