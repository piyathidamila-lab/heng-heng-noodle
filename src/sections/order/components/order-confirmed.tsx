import type { CartLine } from './cart-sheet';
import type { CustomerInfo } from '../view/order-view';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { fTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  orderNumber: string;
  orderTime: Date;
  lines: CartLine[];
  total: number;
  customer: CustomerInfo;
  onNewOrder: () => void;
};

export function OrderConfirmed({
  orderNumber,
  orderTime,
  lines,
  total,
  customer,
  onNewOrder,
}: Props) {
  return (
    <Stack sx={{ flex: 1, px: 2.5, py: 4 }} spacing={3}>
      <Stack alignItems="center" spacing={1.5} sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            bgcolor: 'success.lighter',
            color: 'success.main',
          }}
        >
          <Iconify icon="solar:check-circle-bold" width={44} />
        </Box>
        <Typography variant="h5">สั่งอาหารสำเร็จ!</Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          หมายเลขออเดอร์ {orderNumber} · {fTime(orderTime)}
        </Typography>
      </Stack>

      {customer.orderType === 'takeaway' && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            p: 1.75,
            borderRadius: 2.5,
            border: '1px solid #F1CB79',
            bgcolor: '#FFF9EA',
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2,
              bgcolor: '#FFE9AD',
              color: '#96650A',
            }}
          >
            <Iconify icon="solar:clock-circle-bold" width={25} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              กำลังรออาหาร
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ร้านรับออเดอร์แล้ว สามารถรอรับอาหารได้เลย
            </Typography>
          </Box>
        </Stack>
      )}

      <Stack
        spacing={2}
        sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}
      >
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={{ color: 'text.secondary' }}>ผู้สั่ง</Typography>
          <Typography variant="subtitle2">{customer.name}</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={{ color: 'text.secondary' }}>รูปแบบ</Typography>
          <Typography variant="subtitle2">
            {customer.orderType === 'dine-in'
              ? `ทานที่ร้าน (โต๊ะ ${customer.tableNumber})`
              : 'กลับบ้าน'}
          </Typography>
        </Stack>
        {customer.note && (
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ color: 'text.secondary' }}>หมายเหตุ</Typography>
            <Typography variant="subtitle2" sx={{ textAlign: 'right', maxWidth: '60%' }}>
              {customer.note}
            </Typography>
          </Stack>
        )}
      </Stack>

      <Stack
        spacing={1.5}
        divider={<Divider flexItem />}
        sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}
      >
        {lines.map(({ item, quantity, customization }) => (
          <Stack key={item.id} direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ fontSize: 22 }}>{item.emoji}</Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">
                {item.name} × {quantity}
              </Typography>
              {customization && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {item.description}
                </Typography>
              )}
            </Box>
            <Typography variant="subtitle2">{item.price * quantity} บาท</Typography>
          </Stack>
        ))}

        <Stack direction="row" justifyContent="space-between">
          <Typography variant="subtitle1">ยอดรวมทั้งหมด</Typography>
          <Typography variant="h6" color="primary.main">
            {total} บาท
          </Typography>
        </Stack>
      </Stack>

      <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
        กรุณาแจ้งหมายเลขออเดอร์กับพนักงานหน้าร้าน
      </Typography>

      <Button variant="outlined" size="large" onClick={onNewOrder}>
        สั่งอาหารรายการใหม่
      </Button>
    </Stack>
  );
}
