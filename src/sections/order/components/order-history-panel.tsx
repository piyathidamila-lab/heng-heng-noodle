'use client';

import type { MemberOrderSummary } from 'src/lib/order-service';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  orders: MemberOrderSummary[];
  loading?: boolean;
  onBack: () => void;
};

type HistoryFilter = 'all' | 'dine-in' | 'takeaway';

function formatBaht(value: number): string {
  return `฿${value.toLocaleString('th-TH')}`;
}

function formatOrderDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function OrderHistoryPanel({ orders, loading, onBack }: Props) {
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const visibleOrders = useMemo(
    () => (filter === 'all' ? orders : orders.filter((order) => order.orderType === filter)),
    [filter, orders]
  );
  const total = visibleOrders.reduce((sum, order) => sum + order.total, 0);
  const totalItems = visibleOrders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const dineInCount = orders.filter((order) => order.orderType === 'dine-in').length;
  const takeawayCount = orders.length - dineInCount;

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        pb: 3,
        bgcolor: '#FBF8F4',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          px: 2.5,
          pt: 2.5,
          pb: 6,
          color: 'common.white',
          background: 'linear-gradient(145deg, #721111 0%, #A91D1D 55%, #C12C22 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 170,
            height: 170,
            top: -95,
            right: -50,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.07)',
          }}
        />
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ position: 'relative' }}
        >
          <IconButton
            onClick={onBack}
            aria-label="กลับหน้าสั่งอาหาร"
            sx={{
              ml: -0.75,
              color: 'common.white',
              bgcolor: 'rgba(255,255,255,0.12)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' },
            }}
          >
            <Iconify icon="solar:home-2-outline" width={25} />
          </IconButton>
          <Chip
            size="small"
            label={`${orders.length} ออเดอร์`}
            sx={{ color: '#7A1010', fontWeight: 800, bgcolor: '#FFD976' }}
          />
        </Stack>

        <Typography variant="h4" sx={{ mt: 3, position: 'relative' }}>
          ประวัติการสั่งซื้อ
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.75, position: 'relative', opacity: 0.8 }}>
          ดูรายการอาหารที่เคยสั่งด้วยบัญชีนี้
        </Typography>
      </Box>

      <Box sx={{ px: 2.5, mt: -3.5, position: 'relative', zIndex: 1 }}>
        <Stack
          direction="row"
          sx={{
            overflow: 'hidden',
            borderRadius: 3,
            bgcolor: 'common.white',
            border: '1px solid',
            borderColor: 'grey.200',
            boxShadow: '0 12px 30px rgba(69,37,20,0.12)',
          }}
        >
          <Stack alignItems="center" spacing={0.25} sx={{ flex: 1, py: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              รายการที่แสดง
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="baseline">
              <Typography variant="h4">{visibleOrders.length}</Typography>
              <Typography variant="caption">ออเดอร์</Typography>
            </Stack>
          </Stack>
          <Box sx={{ width: '1px', my: 1.75, bgcolor: 'grey.200' }} />
          <Stack alignItems="center" spacing={0.25} sx={{ flex: 1, py: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              ยอดรวม
            </Typography>
            <Typography variant="h4" sx={{ color: 'primary.main' }}>
              {formatBaht(total)}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2.5, pt: 2.5, pb: 2, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}
      >
        {(
          [
            ['all', `ทั้งหมด ${orders.length}`],
            ['dine-in', `ทานที่ร้าน ${dineInCount}`],
            ['takeaway', `กลับบ้าน ${takeawayCount}`],
          ] as const
        ).map(([value, label]) => (
          <Chip
            key={value}
            label={label}
            onClick={() => setFilter(value)}
            color={filter === value ? 'primary' : 'default'}
            variant={filter === value ? 'filled' : 'outlined'}
            sx={{ height: 38, flexShrink: 0, fontWeight: 600 }}
          />
        ))}
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        alignItems="flex-start"
        sx={{ mx: 2.5, mb: 2, p: 1.5, borderRadius: 2, color: 'info.darker', bgcolor: 'info.lighter' }}
      >
        <Iconify icon="solar:clock-circle-outline" width={19} />
        <Typography variant="caption">แสดงสูงสุด 20 ออเดอร์ล่าสุดของบัญชีนี้</Typography>
      </Stack>

      {loading ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      ) : orders.length === 0 ? (
        <Stack alignItems="center" spacing={1.25} sx={{ px: 2.5, py: 7 }}>
          <Box
            sx={{
              width: 86,
              height: 86,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              bgcolor: 'common.white',
              boxShadow: '0 8px 24px rgba(69,37,20,0.08)',
              fontSize: 42,
            }}
          >
            🍜
          </Box>
          <Typography variant="h6">ยังไม่มีประวัติการสั่งซื้อ</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            เมื่อสั่งอาหารสำเร็จ รายการของคุณจะแสดงอยู่ที่นี่
          </Typography>
          <Button variant="contained" onClick={onBack} sx={{ mt: 1, borderRadius: 2 }}>
            เลือกเมนูอาหาร
          </Button>
        </Stack>
      ) : visibleOrders.length === 0 ? (
        <Stack alignItems="center" spacing={1} sx={{ px: 2.5, py: 6 }}>
          <Box sx={{ fontSize: 40 }}>📭</Box>
          <Typography variant="h6">ไม่พบออเดอร์ประเภทนี้</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ลองเลือกดูประวัติประเภทอื่น
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={1.5} sx={{ px: 2.5 }}>
          {visibleOrders.map((order, orderIndex) => {
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const isDineIn = order.orderType === 'dine-in';

            return (
              <Stack
                key={order.id || `${order.orderNumber}-${order.orderTime}`}
                sx={{
                  overflow: 'hidden',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  bgcolor: 'common.white',
                  boxShadow: '0 6px 20px rgba(69,37,20,0.05)',
                }}
              >
                <Stack spacing={1.5} sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Box>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="h6">{order.orderNumber}</Typography>
                        {orderIndex === 0 && <Chip size="small" color="warning" label="ล่าสุด" />}
                      </Stack>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatOrderDate(order.orderTime)}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={isDineIn ? `🍽️ โต๊ะ ${order.tableNumber}` : '🛍️ กลับบ้าน'}
                    />
                  </Stack>

                  <Divider />

                  <Stack spacing={1}>
                    {order.items.map((item, index) => (
                      <Stack
                        key={`${item.name}-${index}`}
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            display: 'grid',
                            flexShrink: 0,
                            placeItems: 'center',
                            borderRadius: 1.5,
                            bgcolor: '#F7F2EC',
                            fontSize: 21,
                          }}
                        >
                          {item.emoji}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {formatBaht(item.price)} × {item.quantity}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2">
                          {formatBaht(item.price * item.quantity)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>

                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ px: 2, py: 1.5, bgcolor: '#FCF7F2', borderTop: '1px solid', borderColor: 'grey.200' }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    รวม {itemCount} ชิ้น
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'primary.main' }}>
                    {formatBaht(order.total)}
                  </Typography>
                </Stack>
              </Stack>
            );
          })}

          <Typography variant="caption" sx={{ pt: 0.5, color: 'text.secondary', textAlign: 'center' }}>
            รวมทั้งหมด {totalItems.toLocaleString('th-TH')} ชิ้นจากรายการที่แสดง
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
