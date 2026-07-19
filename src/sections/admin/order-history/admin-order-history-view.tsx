'use client';

import type { Dayjs } from 'dayjs';
import type { OrderRecord } from 'src/lib/order-service';

import dayjs from 'dayjs';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { fDateTime } from 'src/utils/format-time';

import { listOrderHistoryAdmin } from '../orders/order-admin-actions';
import { STATUS_COLOR, STATUS_LABEL } from '../orders/order-status-config';

// ----------------------------------------------------------------------

const DATE_FORMAT = 'YYYY-MM-DD';

type PresetKey = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth' | 'all';

const PRESETS: { value: PresetKey; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'today', label: 'วันนี้' },
  { value: 'yesterday', label: 'เมื่อวานนี้' },
  { value: 'last7', label: '7 วันล่าสุด' },
  { value: 'thisMonth', label: 'เดือนนี้' },
  { value: 'lastMonth', label: 'เดือนที่แล้ว' },
];

function presetRange(preset: PresetKey): { from: Dayjs | null; to: Dayjs | null } {
  const now = dayjs();

  switch (preset) {
    case 'today':
      return { from: now.startOf('day'), to: now.endOf('day') };
    case 'yesterday': {
      const yesterday = now.subtract(1, 'day');
      return { from: yesterday.startOf('day'), to: yesterday.endOf('day') };
    }
    case 'last7':
      return { from: now.subtract(6, 'day').startOf('day'), to: now.endOf('day') };
    case 'thisMonth':
      return { from: now.startOf('month'), to: now.endOf('month') };
    case 'lastMonth': {
      const lastMonth = now.subtract(1, 'month');
      return { from: lastMonth.startOf('month'), to: lastMonth.endOf('month') };
    }
    case 'all':
    default:
      return { from: null, to: null };
  }
}

type Props = {
  initialOrders: OrderRecord[];
};

export function AdminOrderHistoryView({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [preset, setPreset] = useState<PresetKey>('all');
  const [from, setFrom] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async (nextFrom: Dayjs | null, nextTo: Dayjs | null) => {
    setLoading(true);
    try {
      const data = await listOrderHistoryAdmin({
        from: nextFrom ? nextFrom.format(DATE_FORMAT) : undefined,
        to: nextTo ? nextTo.format(DATE_FORMAT) : undefined,
      });
      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (preset === 'all' && !from && !to) return;
    fetchOrders(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const handlePreset = (value: PresetKey) => {
    setPreset(value);
    const range = presetRange(value);
    setFrom(range.from);
    setTo(range.to);
  };

  const handleFromChange = (value: Dayjs | null) => {
    setPreset('all');
    setFrom(value ? value.startOf('day') : null);
  };

  const handleToChange = (value: Dayjs | null) => {
    setPreset('all');
    setTo(value ? value.endOf('day') : null);
  };

  const summary = useMemo(() => {
    const active = orders.filter((order) => order.status !== 'cancelled');
    return {
      count: orders.length,
      total: active.reduce((sum, order) => sum + order.total, 0),
    };
  }, [orders]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        ประวัติออเดอร์
      </Typography>

      <Stack spacing={3} sx={{ mb: 2 }}>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {PRESETS.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              onClick={() => handlePreset(item.value)}
              color={preset === item.value ? 'primary' : 'default'}
              variant={preset === item.value ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <DatePicker
            label="จากวันที่"
            value={from}
            onChange={handleFromChange}
            slotProps={{ textField: { size: 'small' } }}
            sx={{ maxWidth: 200 }}
          />
          <DatePicker
            label="ถึงวันที่"
            value={to}
            onChange={handleToChange}
            slotProps={{ textField: { size: 'small' } }}
            sx={{ maxWidth: 200 }}
          />
        </Stack>
      </Stack>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        {loading
          ? 'กำลังโหลด...'
          : `${summary.count} ออเดอร์ · ยอดรวม ${summary.total.toLocaleString('th-TH')} บาท`}
      </Typography>

      {orders.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 8 }}>
          ไม่พบออเดอร์ในช่วงเวลาที่เลือก
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {orders.map((order) => (
            <Stack
              key={order.id}
              spacing={1}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'common.white',
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ sm: 'center' }}
                justifyContent="space-between"
                spacing={0.75}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle1">{order.orderNumber}</Typography>
                  <Chip
                    size="small"
                    label={STATUS_LABEL[order.status]}
                    color={STATUS_COLOR[order.status]}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={order.orderType === 'dine-in' ? `โต๊ะ ${order.tableNumber}` : 'กลับบ้าน'}
                  />
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {fDateTime(order.createdAt)}
                </Typography>
              </Stack>

              <Stack direction="row" flexWrap="wrap" columnGap={2} rowGap={0.25}>
                <Typography variant="body2">{order.customerName}</Typography>
                {order.customerPhone && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {order.customerPhone}
                  </Typography>
                )}
              </Stack>

              <Divider />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                spacing={2}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
                  {order.items.map((item) => `${item.name} ×${item.quantity}`).join(' · ')}
                </Typography>
                <Typography variant="subtitle2" sx={{ whiteSpace: 'nowrap' }}>
                  {order.total.toLocaleString('th-TH')} บาท
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}
