'use client';

import type { SalesPeriod, SalesSummary, BestSellerItem } from 'src/lib/analytics-service';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

const PERIOD_TABS: SalesPeriod[] = ['today', 'week', 'month'];

const PERIOD_LABEL: Record<SalesPeriod, string> = {
  today: 'วันนี้',
  week: 'สัปดาห์นี้',
  month: 'เดือนนี้',
};

type Props = {
  summary: SalesSummary;
  bestSellers: Record<SalesPeriod, BestSellerItem[]>;
};

export function AdminOverviewView({ summary, bestSellers }: Props) {
  const [period, setPeriod] = useState<SalesPeriod>('today');

  const items = bestSellers[period];
  const maxQuantity = items[0]?.quantity ?? 0;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        ภาพรวม
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          mb: 5,
        }}
      >
        {PERIOD_TABS.map((p) => (
          <Stack
            key={p}
            spacing={0.75}
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: 'common.white',
              border: '1px solid',
              borderColor: 'grey.200',
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ยอดขาย{PERIOD_LABEL[p]}
            </Typography>
            <Typography variant="h4" color="primary.main">
              {summary[p].total.toLocaleString('th-TH')} บาท
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {summary[p].orderCount} ออเดอร์
            </Typography>
          </Stack>
        ))}
      </Box>

      <Typography variant="h5" sx={{ mb: 2 }}>
        เมนูขายดี
      </Typography>

      <Tabs
        value={period}
        onChange={(_, value) => setPeriod(value)}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {PERIOD_TABS.map((p) => (
          <Tab key={p} value={p} label={PERIOD_LABEL[p]} />
        ))}
      </Tabs>

      {items.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 6 }}>
          ยังไม่มีข้อมูลการขายในช่วงนี้
        </Typography>
      ) : (
        <Stack spacing={2}>
          {items.map((item, index) => (
            <Stack key={item.name} direction="row" alignItems="center" spacing={2}>
              <Typography
                variant="subtitle2"
                sx={{ width: 20, color: 'text.secondary', textAlign: 'right' }}
              >
                {index + 1}
              </Typography>

              <Typography variant="body2" sx={{ flex: '0 0 160px', minWidth: 0 }} noWrap>
                {item.name}
              </Typography>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ height: 20, borderRadius: 0.5, bgcolor: 'grey.100' }}>
                  <Box
                    sx={{
                      height: 1,
                      width: `${maxQuantity ? (item.quantity / maxQuantity) * 100 : 0}%`,
                      minWidth: 6,
                      bgcolor: 'primary.main',
                      borderRadius: '0px 4px 4px 0px',
                    }}
                  />
                </Box>
              </Box>

              <Typography variant="subtitle2" sx={{ width: 56, textAlign: 'right' }}>
                {item.quantity} จาน
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}
