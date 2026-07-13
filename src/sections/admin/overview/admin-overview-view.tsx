'use client';

import type { IconifyName } from 'src/components/iconify';
import type { SalesPeriod, SalesSummary, BestSellerItem } from 'src/lib/analytics-service';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const PERIOD_TABS: SalesPeriod[] = ['today', 'week', 'month'];

const PERIOD_META: Record<
  SalesPeriod,
  { label: string; caption: string; icon: IconifyName; color: string; softColor: string }
> = {
  today: {
    label: 'วันนี้',
    caption: 'ตั้งแต่เปิดร้านวันนี้',
    icon: 'solar:clock-circle-bold',
    color: 'primary.main',
    softColor: 'primary.lighter',
  },
  week: {
    label: 'สัปดาห์นี้',
    caption: 'ตั้งแต่ต้นสัปดาห์',
    icon: 'solar:calendar-date-bold',
    color: 'info.main',
    softColor: 'info.lighter',
  },
  month: {
    label: 'เดือนนี้',
    caption: 'ตั้งแต่ต้นเดือน',
    icon: 'solar:calendar-bold' as IconifyName,
    color: 'warning.dark',
    softColor: 'warning.lighter',
  },
};

function formatBaht(value: number): string {
  return `${value.toLocaleString('th-TH')} บาท`;
}

function formatNumber(value: number): string {
  return value.toLocaleString('th-TH');
}

type Props = {
  summary: SalesSummary;
  bestSellers: Record<SalesPeriod, BestSellerItem[]>;
};

export function AdminOverviewView({ summary, bestSellers }: Props) {
  const [period, setPeriod] = useState<SalesPeriod>('today');

  const items = bestSellers[period];
  const selectedSummary = summary[period];
  const maxQuantity = items[0]?.quantity ?? 0;
  const totalDishes = items.reduce((sum, item) => sum + item.quantity, 0);
  const averageOrder =
    selectedSummary.orderCount > 0
      ? Math.round(selectedSummary.total / selectedSummary.orderCount)
      : 0;

  return (
    <Box>
      <Stack spacing={0.75} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 36,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 1.5,
              color: 'primary.main',
              bgcolor: 'primary.lighter',
            }}
          >
            <Iconify icon={'solar:chart-2-bold-duotone' as IconifyName} width={22} />
          </Box>
          <Typography variant="h4">ภาพรวมร้าน</Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary', pl: { sm: 5.5 } }}>
          ติดตามยอดขายและเมนูที่ลูกค้าสั่งมากที่สุด
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, sm: 2.5 },
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          mb: { xs: 3, sm: 4 },
        }}
      >
        {PERIOD_TABS.map((itemPeriod) => {
          const { total, orderCount } = summary[itemPeriod];
          const { label, caption, icon, color, softColor } = PERIOD_META[itemPeriod];
          const average = orderCount > 0 ? Math.round(total / orderCount) : 0;
          const isSelected = period === itemPeriod;

          return (
            <ButtonBase
              key={itemPeriod}
              component="button"
              onClick={() => setPeriod(itemPeriod)}
              aria-label={`ดูข้อมูล${label}`}
              aria-pressed={isSelected}
              sx={{
                p: 0,
                display: 'block',
                borderRadius: 3,
                textAlign: 'left',
                overflow: 'hidden',
                transition: (theme) => theme.transitions.create(['transform', 'box-shadow']),
                '&:hover': { transform: 'translateY(-2px)' },
                '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.light' },
              }}
            >
              <Stack
                spacing={2}
                sx={{
                  height: 1,
                  p: { xs: 2.25, sm: 2.5 },
                  bgcolor: 'common.white',
                  border: '1px solid',
                  borderColor: isSelected ? color : 'divider',
                  borderRadius: 3,
                  boxShadow: isSelected ? '0 12px 32px rgba(33, 43, 54, 0.10)' : 'none',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        flexShrink: 0,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: softColor,
                        color,
                      }}
                    >
                      <Iconify icon={icon} width={22} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">ยอดขาย{label}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {caption}
                      </Typography>
                    </Box>
                  </Stack>

                  {isSelected && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: color,
                        boxShadow: '0 0 0 4px rgba(84, 214, 44, 0.12)',
                      }}
                    />
                  )}
                </Stack>

                <Typography variant="h3" sx={{ color, fontSize: { xs: 28, lg: 32 } }}>
                  {formatBaht(total)}
                </Typography>

                <Divider sx={{ borderStyle: 'dashed' }} />

                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Iconify icon="solar:bill-list-bold-duotone" width={18} />
                    <Typography variant="body2">{formatNumber(orderCount)} ออเดอร์</Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    เฉลี่ย {formatBaht(average)}
                  </Typography>
                </Stack>
              </Stack>
            </ButtonBase>
          );
        })}
      </Box>

      <Box
        sx={{
          bgcolor: 'common.white',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          gap={2}
          sx={{ px: { xs: 2.25, sm: 3 }, pt: { xs: 2.5, sm: 3 }, pb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'warning.lighter',
                color: 'warning.dark',
              }}
            >
              <Iconify icon="solar:cup-star-bold" width={23} />
            </Box>
            <Box>
              <Typography variant="h5">เมนูขายดี</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                เรียงตามจำนวนจานที่ขายได้
              </Typography>
            </Box>
          </Stack>

          <Tabs
            value={period}
            onChange={(_, value: SalesPeriod) => setPeriod(value)}
            aria-label="เลือกช่วงเวลาของเมนูขายดี"
            variant="fullWidth"
            sx={{
              minHeight: 42,
              p: 0.5,
              borderRadius: 2,
              bgcolor: 'grey.100',
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 34,
                minWidth: { sm: 96 },
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                typography: 'subtitle2',
              },
              '& .Mui-selected': {
                bgcolor: 'common.white',
                boxShadow: '0 2px 8px rgba(33, 43, 54, 0.08)',
              },
            }}
          >
            {PERIOD_TABS.map((itemPeriod) => (
              <Tab key={itemPeriod} value={itemPeriod} label={PERIOD_META[itemPeriod].label} />
            ))}
          </Tabs>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
            mx: { xs: 2.25, sm: 3 },
            mb: 2.5,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'grey.50',
          }}
        >
          {[
            { label: 'จำนวนออเดอร์', value: `${formatNumber(selectedSummary.orderCount)} รายการ` },
            { label: 'ยอดเฉลี่ยต่อออเดอร์', value: formatBaht(averageOrder) },
            { label: 'จำนวนจานในอันดับ', value: `${formatNumber(totalDishes)} จาน` },
          ].map((stat, index) => (
            <Box
              key={stat.label}
              sx={{
                px: { xs: 1.5, sm: 2.5 },
                py: 1.75,
                borderLeft: { xs: index % 2 ? '1px dashed' : 0, sm: index ? '1px dashed' : 0 },
                borderTop: { xs: index === 2 ? '1px dashed' : 0, sm: 0 },
                borderColor: 'divider',
                gridColumn: { xs: index === 2 ? '1 / -1' : 'auto', sm: 'auto' },
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {stat.label}
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 0.25 }}>
                {stat.value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider />

        {items.length === 0 ? (
          <Stack alignItems="center" spacing={1.25} sx={{ px: 2, py: { xs: 6, sm: 8 } }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'grey.100',
                color: 'text.disabled',
              }}
            >
              <Iconify icon={'solar:inbox-line-bold-duotone' as IconifyName} width={32} />
            </Box>
            <Typography variant="subtitle1">ยังไม่มีข้อมูลการขาย</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              เมื่อมีออเดอร์ใน{PERIOD_META[period].label} อันดับเมนูจะแสดงที่นี่
            </Typography>
          </Stack>
        ) : (
          <Stack divider={<Divider />} sx={{ px: { xs: 2.25, sm: 3 }, pb: 1 }}>
            {items.map((item, index) => {
              const isTop = index === 0;
              const percentage = maxQuantity ? (item.quantity / maxQuantity) * 100 : 0;

              return (
                <Box
                  key={item.name}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '36px minmax(0, 1fr) auto',
                      sm: '36px 180px 1fr 110px',
                    },
                    columnGap: { xs: 1.25, sm: 2 },
                    rowGap: 1,
                    alignItems: 'center',
                    py: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      gridRow: { xs: '1 / 3', sm: 'auto' },
                      borderRadius: 1.5,
                      display: 'grid',
                      placeItems: 'center',
                      typography: 'subtitle2',
                      bgcolor: isTop ? 'warning.lighter' : 'grey.100',
                      color: isTop ? 'warning.darker' : 'text.secondary',
                    }}
                  >
                    {isTop ? (
                      <Iconify icon={'solar:crown-bold' as IconifyName} width={19} />
                    ) : (
                      index + 1
                    )}
                  </Box>

                  <Typography variant="subtitle2" noWrap title={item.name}>
                    {item.name}
                  </Typography>

                  <Box
                    sx={{
                      gridColumn: { xs: '2 / -1', sm: 'auto' },
                      gridRow: { xs: 2, sm: 'auto' },
                      height: 8,
                      borderRadius: 1,
                      bgcolor: 'grey.100',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${percentage}%`,
                        minWidth: 8,
                        height: 1,
                        borderRadius: 1,
                        bgcolor: isTop ? 'warning.main' : 'primary.main',
                      }}
                    />
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2">{formatNumber(item.quantity)} จาน</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formatBaht(item.revenue)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
