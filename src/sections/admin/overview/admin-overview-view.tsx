'use client';

import type { IconifyName } from 'src/components/iconify';
import type { SalesPeriod, SalesSummary, BestSellerItem } from 'src/lib/analytics-service';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const PERIOD_TABS: SalesPeriod[] = ['today', 'week', 'month'];

const PERIOD_META: Record<
  SalesPeriod,
  { label: string; caption: string; icon: IconifyName }
> = {
  today: {
    label: 'วันนี้',
    caption: 'ตั้งแต่ 00:00 น.',
    icon: 'solar:clock-circle-bold',
  },
  week: {
    label: 'สัปดาห์นี้',
    caption: 'ตั้งแต่ต้นสัปดาห์',
    icon: 'solar:calendar-date-bold',
  },
  month: {
    label: 'เดือนนี้',
    caption: 'ตั้งแต่ต้นเดือน',
    icon: 'solar:calendar-bold' as IconifyName,
  },
};

function formatBaht(value: number): string {
  return `฿${value.toLocaleString('th-TH')}`;
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
  const periodMeta = PERIOD_META[period];
  const maxQuantity = items[0]?.quantity ?? 0;
  const totalDishes = items.reduce((sum, item) => sum + item.quantity, 0);
  const averageOrder =
    selectedSummary.orderCount > 0
      ? Math.round(selectedSummary.total / selectedSummary.orderCount)
      : 0;

  return (
    <Box sx={{ pb: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 48,
              height: 48,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2.25,
              color: 'primary.main',
              bgcolor: 'primary.lighter',
            }}
          >
            <Iconify icon={'solar:chart-2-bold-duotone' as IconifyName} width={27} />
          </Box>
          <Box>
            <Typography variant="h4">ภาพรวมร้าน</Typography>
            <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
              สรุปยอดขายและเมนูยอดนิยมในที่เดียว
            </Typography>
          </Box>
        </Stack>

        <Chip
          icon={<Iconify icon="solar:check-circle-bold" width={17} />}
          label="ไม่รวมออเดอร์ที่ยกเลิก"
          sx={{
            color: 'success.dark',
            fontWeight: 700,
            bgcolor: 'success.lighter',
            '& .MuiChip-icon': { color: 'inherit' },
          }}
        />
      </Stack>

      <Box
        role="tablist"
        aria-label="เลือกช่วงเวลาของข้อมูลภาพรวม"
        sx={{
          p: 0.75,
          mb: 2.5,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 0.75,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'common.white',
          boxShadow: '0 5px 18px rgba(33,43,54,0.05)',
        }}
      >
        {PERIOD_TABS.map((itemPeriod) => {
          const meta = PERIOD_META[itemPeriod];
          const isSelected = itemPeriod === period;

          return (
            <ButtonBase
              key={itemPeriod}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setPeriod(itemPeriod)}
              sx={{
                px: 1,
                py: 1.25,
                borderRadius: 2,
                color: isSelected ? 'common.white' : 'text.primary',
                bgcolor: isSelected ? 'primary.main' : 'transparent',
                transition: (theme) => theme.transitions.create(['color', 'background-color']),
                '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'grey.100' },
              }}
            >
              <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center">
                <Iconify icon={meta.icon} width={19} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2" sx={{ color: 'inherit' }}>
                    {meta.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: { xs: 'none', sm: 'block' },
                      color: 'inherit',
                      opacity: isSelected ? 0.78 : 0.6,
                    }}
                  >
                    {meta.caption}
                  </Typography>
                </Box>
              </Stack>
            </ButtonBase>
          );
        })}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, sm: 2 },
          mb: { xs: 3, sm: 4 },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            gridColumn: { xs: '1 / -1', lg: 'span 2' },
            minHeight: { xs: 190, sm: 210 },
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            color: 'common.white',
            background: 'linear-gradient(135deg, #67100E 0%, #9E1B16 58%, #D25125 100%)',
            boxShadow: '0 16px 38px rgba(103,16,14,0.20)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 190,
              height: 190,
              top: -100,
              right: -45,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.08)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 100,
              height: 100,
              bottom: -55,
              left: -25,
              borderRadius: '50%',
              bgcolor: 'rgba(255,213,79,0.10)',
            }}
          />

          <Stack sx={{ position: 'relative', height: 1 }} justifyContent="space-between">
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 1.75,
                    bgcolor: 'rgba(255,255,255,0.14)',
                  }}
                >
                  <Iconify icon="solar:wad-of-money-bold" width={22} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ color: 'common.white' }}>
                    ยอดขาย{periodMeta.label}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.72 }}>
                    {periodMeta.caption}
                  </Typography>
                </Box>
              </Stack>
              <Chip
                size="small"
                label="ยอดสุทธิ"
                sx={{ color: '#7A1010', fontWeight: 800, bgcolor: '#FFD976' }}
              />
            </Stack>

            <Box>
              <Typography
                sx={{
                  color: 'common.white',
                  fontSize: { xs: 36, sm: 46 },
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: -1,
                }}
              >
                {formatBaht(selectedSummary.total)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, opacity: 0.74 }}>
                จาก {formatNumber(selectedSummary.orderCount)} ออเดอร์ที่ไม่ถูกยกเลิก
              </Typography>
            </Box>
          </Stack>
        </Box>

        {[
          {
            label: 'จำนวนออเดอร์',
            caption: `ออเดอร์${periodMeta.label}`,
            value: formatNumber(selectedSummary.orderCount),
            unit: 'รายการ',
            icon: 'solar:bill-list-bold-duotone' as IconifyName,
            color: '#1976D2',
            softColor: '#EAF4FF',
          },
          {
            label: 'ยอดเฉลี่ย',
            caption: 'ต่อหนึ่งออเดอร์',
            value: formatBaht(averageOrder),
            unit: '',
            icon: 'solar:cup-star-bold' as IconifyName,
            color: '#B76E00',
            softColor: '#FFF6DD',
          },
        ].map((metric) => (
          <Stack
            key={metric.label}
            justifyContent="space-between"
            sx={{
              minHeight: { xs: 154, sm: 210 },
              p: { xs: 1.75, sm: 2.5 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'common.white',
              boxShadow: '0 8px 24px rgba(33,43,54,0.06)',
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                color: metric.color,
                bgcolor: metric.softColor,
              }}
            >
              <Iconify icon={metric.icon} width={23} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {metric.caption}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="baseline" flexWrap="wrap">
                <Typography variant="h4" sx={{ mt: 0.25 }}>
                  {metric.value}
                </Typography>
                {metric.unit && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {metric.unit}
                  </Typography>
                )}
              </Stack>
              <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
                {metric.label}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Box>

      <Box
        sx={{
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          bgcolor: 'common.white',
          boxShadow: '0 8px 28px rgba(33,43,54,0.05)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          gap={2}
          sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 44,
                height: 44,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                color: 'warning.dark',
                bgcolor: 'warning.lighter',
              }}
            >
              <Iconify icon="solar:cup-star-bold" width={25} />
            </Box>
            <Box>
              <Typography variant="h5">อันดับเมนูขายดี</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                เรียงตามจำนวนจานที่ขายได้ใน{periodMeta.label}
              </Typography>
            </Box>
          </Stack>

          {items[0] && (
            <Chip
              icon={<Iconify icon={'solar:crown-bold' as IconifyName} width={17} />}
              label={`อันดับ 1 · ${items[0].name}`}
              sx={{
                maxWidth: { xs: 1, sm: 280 },
                color: 'warning.darker',
                fontWeight: 700,
                bgcolor: 'warning.lighter',
                '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
          )}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
            mx: { xs: 2, sm: 3 },
            mb: 2.5,
            overflow: 'hidden',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          {[
            { label: 'ออเดอร์ทั้งหมด', value: `${formatNumber(selectedSummary.orderCount)} รายการ` },
            { label: 'ยอดเฉลี่ย/ออเดอร์', value: formatBaht(averageOrder) },
            { label: 'จานในอันดับ', value: `${formatNumber(totalDishes)} จาน` },
          ].map((stat, index) => (
            <Box
              key={stat.label}
              sx={{
                px: { xs: 1.5, sm: 2.5 },
                py: 1.5,
                borderLeft: { xs: index % 2 ? '1px solid' : 0, sm: index ? '1px solid' : 0 },
                borderTop: { xs: index === 2 ? '1px solid' : 0, sm: 0 },
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
                width: 68,
                height: 68,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                color: 'text.disabled',
                bgcolor: 'grey.100',
              }}
            >
              <Iconify icon={'solar:inbox-line-bold-duotone' as IconifyName} width={34} />
            </Box>
            <Typography variant="h6">ยังไม่มีข้อมูลการขาย</Typography>
            <Typography variant="body2" sx={{ maxWidth: 360, color: 'text.secondary', textAlign: 'center' }}>
              เมื่อมีออเดอร์ใน{periodMeta.label} อันดับเมนูและรายได้จะแสดงที่นี่
            </Typography>
          </Stack>
        ) : (
          <Stack divider={<Divider />} sx={{ px: { xs: 2, sm: 3 }, pb: 1 }}>
            {items.map((item, index) => {
              const isTop = index === 0;
              const percentage = maxQuantity ? (item.quantity / maxQuantity) * 100 : 0;

              return (
                <Box
                  key={item.name}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '38px minmax(0, 1fr) auto',
                      sm: '38px minmax(160px, 220px) 1fr 120px',
                    },
                    columnGap: { xs: 1.25, sm: 2 },
                    rowGap: 1,
                    alignItems: 'center',
                    px: isTop ? 1 : 0,
                    py: 1.75,
                    my: isTop ? 0.75 : 0,
                    borderRadius: isTop ? 2 : 0,
                    bgcolor: isTop ? '#FFFAE8' : 'transparent',
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      gridRow: { xs: '1 / 3', sm: 'auto' },
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 1.5,
                      color: isTop ? 'warning.darker' : 'text.secondary',
                      bgcolor: isTop ? 'warning.lighter' : 'grey.100',
                      typography: 'subtitle2',
                    }}
                  >
                    {isTop ? (
                      <Iconify icon={'solar:crown-bold' as IconifyName} width={20} />
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
                      height: 9,
                      overflow: 'hidden',
                      borderRadius: 1,
                      bgcolor: 'grey.100',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${percentage}%`,
                        minWidth: 9,
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
