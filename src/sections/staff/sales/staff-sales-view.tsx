'use client';

import type { DashboardPeriodAnalytics } from 'src/lib/analytics-service';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { getTodaySalesStaff } from '../layout/staff-actions';
import { StaffPageHero } from '../components/staff-page-hero';

// ----------------------------------------------------------------------

function formatBaht(value: number): string {
  return `฿${value.toLocaleString('th-TH')}`;
}

type Props = {
  initialSales: DashboardPeriodAnalytics;
};

export function StaffSalesView({ initialSales }: Props) {
  const [sales, setSales] = useState(initialSales);
  const [refreshing, setRefreshing] = useState(false);

  const averageOrder = sales.summary.orderCount
    ? Math.round(sales.summary.total / sales.summary.orderCount)
    : 0;
  const maxBestSeller = Math.max(sales.bestSellers[0]?.quantity ?? 0, 1);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setSales(await getTodaySalesStaff());
    } catch (error) {
      console.error(error);
      toast.error('โหลดข้อมูลยอดขายไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <StaffPageHero
        title="ยอดขายวันนี้"
        subtitle="สรุปยอดขายและเมนูขายดีของวันนี้ ตั้งแต่ 00:00 น."
        icon="solar:chart-square-outline"
        badge={`${sales.summary.orderCount} ออเดอร์`}
      />

      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          size="small"
          color="inherit"
          loading={refreshing}
          onClick={handleRefresh}
          startIcon={<Iconify icon="solar:restart-bold" width={18} />}
        >
          รีเฟรช
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 3,
        }}
      >
        {(
          [
            ['ยอดขายรวม', formatBaht(sales.summary.total), '💰', '#EAF4FF'],
            ['จำนวนออเดอร์', sales.summary.orderCount.toLocaleString('th-TH'), '🧾', '#FFF6DD'],
            ['จำนวนจานที่ขาย', sales.dishCount.toLocaleString('th-TH'), '🍜', '#E5F8ED'],
            ['เฉลี่ยต่อออเดอร์', formatBaht(averageOrder), '📊', '#FDEAF0'],
          ] as const
        ).map(([label, value, emoji, color]) => (
          <Stack
            key={label}
            spacing={1}
            sx={{ p: 2, minHeight: 108, borderRadius: 2.5, bgcolor: 'common.white' }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                bgcolor: color,
                fontSize: 20,
              }}
            >
              {emoji}
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {label}
              </Typography>
              <Typography variant="h5">{value}</Typography>
            </Box>
          </Stack>
        ))}
      </Box>

      <Stack
        spacing={2}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'common.white',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="eva:award-fill" width={22} sx={{ color: 'primary.main' }} />
          <Typography variant="h6">เมนูขายดีวันนี้</Typography>
        </Stack>

        {sales.bestSellers.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
            <Box sx={{ fontSize: 36 }}>🍜</Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ยังไม่มีออเดอร์วันนี้
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1.75}>
            {sales.bestSellers.map((item, index) => (
              <Stack key={item.name} spacing={0.5}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">
                    {index + 1}. {item.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {item.quantity} จาน · {formatBaht(item.revenue)}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(item.quantity / maxBestSeller) * 100}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
