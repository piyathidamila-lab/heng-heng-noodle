'use client';

import type { Dayjs } from 'dayjs';
import type { OrderRecord } from 'src/lib/order-service';
import type { IconifyName } from 'src/components/iconify';

import dayjs from 'dayjs';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { Iconify } from 'src/components/iconify';

import { listOrderHistoryAdmin } from 'src/sections/admin/orders/order-admin-actions';
import { OrderHistoryTable } from 'src/sections/admin/order-history/order-history-table';

import { StaffPageHero } from '../components/staff-page-hero';

// ----------------------------------------------------------------------

const DATE_FORMAT = 'YYYY-MM-DD';
type PresetKey = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'all';

const PRESETS: { value: PresetKey; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'today', label: 'วันนี้' },
  { value: 'yesterday', label: 'เมื่อวาน' },
  { value: 'last7', label: '7 วันล่าสุด' },
  { value: 'thisMonth', label: 'เดือนนี้' },
];

function presetRange(preset: PresetKey): { from: Dayjs | null; to: Dayjs | null } {
  const now = dayjs();
  if (preset === 'today') return { from: now.startOf('day'), to: now.endOf('day') };
  if (preset === 'yesterday') {
    const yesterday = now.subtract(1, 'day');
    return { from: yesterday.startOf('day'), to: yesterday.endOf('day') };
  }
  if (preset === 'last7') {
    return { from: now.subtract(6, 'day').startOf('day'), to: now.endOf('day') };
  }
  if (preset === 'thisMonth') return { from: now.startOf('month'), to: now.endOf('month') };
  return { from: null, to: null };
}

type Props = { initialOrders: OrderRecord[] };

export function StaffOrderHistoryView({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [preset, setPreset] = useState<PresetKey>('all');
  const [from, setFrom] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async (nextFrom: Dayjs | null, nextTo: Dayjs | null) => {
    setLoading(true);
    try {
      setOrders(
        await listOrderHistoryAdmin({
          from: nextFrom?.format(DATE_FORMAT),
          to: nextTo?.format(DATE_FORMAT),
        })
      );
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
    const range = presetRange(value);
    setPreset(value);
    setFrom(range.from);
    setTo(range.to);
    if (value === 'all') void fetchOrders(null, null);
  };

  const summary = useMemo(() => {
    const validOrders = orders.filter((order) => order.status !== 'cancelled');
    return {
      total: validOrders.reduce((sum, order) => sum + order.total, 0),
      dineIn: orders.filter((order) => order.orderType === 'dine-in').length,
      takeaway: orders.filter((order) => order.orderType === 'takeaway').length,
    };
  }, [orders]);

  return (
    <Box sx={{ pb: 4 }}>
      <StaffPageHero
        title="ประวัติออเดอร์"
        subtitle="ค้นหาและตรวจสอบรายการย้อนหลัง"
        icon={'solar:history-bold' as IconifyName}
        badge={`${orders.length.toLocaleString('th-TH')} ออเดอร์`}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 3,
        }}
      >
        {[
          ['ออเดอร์ทั้งหมด', orders.length.toLocaleString('th-TH'), 'รายการ', '📋'],
          ['ยอดรวม', `฿${summary.total.toLocaleString('th-TH')}`, '', '💰'],
          ['ทานที่ร้าน', summary.dineIn.toLocaleString('th-TH'), 'รายการ', '🍽️'],
          ['รับกลับบ้าน', summary.takeaway.toLocaleString('th-TH'), 'รายการ', '🛍️'],
        ].map(([label, value, unit, emoji]) => (
          <Stack
            key={label}
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{ p: 1.75, minHeight: 94, borderRadius: 2.5, bgcolor: 'common.white' }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                display: 'grid',
                flexShrink: 0,
                placeItems: 'center',
                borderRadius: 2,
                bgcolor: '#F7F2EC',
                fontSize: 21,
              }}
            >
              {emoji}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {label}
              </Typography>
              <Stack direction="row" spacing={0.4} alignItems="baseline" flexWrap="wrap">
                <Typography variant="h5">{value}</Typography>
                {unit && <Typography variant="caption">{unit}</Typography>}
              </Stack>
            </Box>
          </Stack>
        ))}
      </Box>

      <Stack
        spacing={2}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'common.white',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="solar:calendar-date-bold" width={22} sx={{ color: 'primary.main' }} />
          <Typography variant="h6">เลือกช่วงเวลา</Typography>
          {loading && <Chip size="small" label="กำลังโหลด..." color="info" />}
        </Stack>
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <DatePicker
            label="จากวันที่"
            value={from}
            onChange={(value) => {
              setPreset('all');
              setFrom(value?.startOf('day') ?? null);
            }}
            slotProps={{ textField: { fullWidth: true } }}
          />
          <DatePicker
            label="ถึงวันที่"
            value={to}
            onChange={(value) => {
              setPreset('all');
              setTo(value?.endOf('day') ?? null);
            }}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Stack>
      </Stack>

      <OrderHistoryTable orders={orders} loading={loading} />
    </Box>
  );
}
