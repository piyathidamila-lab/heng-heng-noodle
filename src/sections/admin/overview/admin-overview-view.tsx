'use client';

import type { IconifyName } from 'src/components/iconify';
import type { SalesPeriod, TrafficPoint, DashboardAnalytics } from 'src/lib/analytics-service';

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

const PERIOD_META: Record<SalesPeriod, { label: string; caption: string; icon: IconifyName }> = {
  today: { label: 'รายวัน', caption: 'วันนี้ ตั้งแต่ 00:00 น.', icon: 'solar:clock-circle-bold' },
  week: {
    label: 'รายสัปดาห์',
    caption: 'ตั้งแต่ต้นสัปดาห์',
    icon: 'solar:calendar-date-bold',
  },
  month: {
    label: 'รายเดือน',
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

function maxCount(points: TrafficPoint[]): number {
  return Math.max(...points.map((point) => point.orderCount), 1);
}

type Props = {
  analytics: DashboardAnalytics;
};

export function AdminOverviewView({ analytics }: Props) {
  const [period, setPeriod] = useState<SalesPeriod>('today');
  const data = analytics[period];
  const periodMeta = PERIOD_META[period];
  const averageOrder = data.summary.orderCount
    ? Math.round(data.summary.total / data.summary.orderCount)
    : 0;
  const maxBestSeller = Math.max(data.bestSellers[0]?.quantity ?? 0, 1);
  const maxTimeOrders = maxCount(data.timeTraffic);
  const maxDayOrders = maxCount(data.dayTraffic);
  const observedDays = data.dayTraffic.filter((day) => day.observed);
  const busiestDay = observedDays.reduce<TrafficPoint | null>(
    (current, day) => (!current || day.orderCount > current.orderCount ? day : current),
    null
  );
  const quietestDay = observedDays.reduce<TrafficPoint | null>(
    (current, day) => (!current || day.orderCount < current.orderCount ? day : current),
    null
  );
  const busiestTime = data.timeTraffic.reduce<TrafficPoint | null>(
    (current, time) => (!current || time.orderCount > current.orderCount ? time : current),
    null
  );

  return (
    <Box sx={{ pb: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 50,
              height: 50,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2.25,
              color: 'primary.main',
              bgcolor: 'primary.lighter',
            }}
          >
            <Iconify icon={'solar:chart-2-bold-duotone' as IconifyName} width={28} />
          </Box>
          <Box>
            <Typography variant="h4">ภาพรวมยอดขาย</Typography>
            <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
              ดูยอดเงิน เมนูยอดนิยม และช่วงที่ลูกค้าสั่งอาหาร
            </Typography>
          </Box>
        </Stack>

        <Chip
          icon={<Iconify icon="solar:check-circle-bold" width={17} />}
          label="ไม่รวมออเดอร์ที่ยกเลิก"
          color="success"
          variant="outlined"
        />
      </Stack>

      <Box
        role="tablist"
        aria-label="เลือกช่วงเวลาของภาพรวมยอดขาย"
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
          const selected = period === itemPeriod;

          return (
            <ButtonBase
              key={itemPeriod}
              role="tab"
              aria-selected={selected}
              onClick={() => setPeriod(itemPeriod)}
              sx={{
                px: 1,
                py: 1.25,
                borderRadius: 2,
                color: selected ? 'common.white' : 'text.primary',
                bgcolor: selected ? 'primary.main' : 'transparent',
                '&:hover': { bgcolor: selected ? 'primary.dark' : 'grey.100' },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75}>
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
                      opacity: selected ? 0.76 : 0.58,
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
            minHeight: 205,
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
              width: 210,
              height: 210,
              top: -105,
              right: -50,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.08)',
            }}
          />
          <Stack sx={{ position: 'relative', height: 1 }} justifyContent="space-between">
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle1" sx={{ color: 'inherit' }}>
                  ยอดขาย{periodMeta.label}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {periodMeta.caption}
                </Typography>
              </Box>
              <Iconify icon="solar:wad-of-money-bold" width={34} />
            </Stack>
            <Box>
              <Typography
                sx={{
                  color: 'inherit',
                  fontSize: { xs: 38, sm: 48 },
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: -1,
                }}
              >
                {formatBaht(data.summary.total)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, opacity: 0.74 }}>
                จาก {formatNumber(data.summary.orderCount)} ออเดอร์
              </Typography>
            </Box>
          </Stack>
        </Box>

        {[
          {
            label: 'จำนวนออเดอร์',
            value: formatNumber(data.summary.orderCount),
            unit: 'ออเดอร์',
            icon: 'solar:bill-list-bold-duotone' as IconifyName,
            color: '#1976D2',
            background: '#EAF4FF',
          },
          {
            label: 'ยอดเฉลี่ยต่อออเดอร์',
            value: formatBaht(averageOrder),
            unit: '',
            icon: 'solar:cup-star-bold' as IconifyName,
            color: '#B76E00',
            background: '#FFF6DD',
          },
        ].map((metric) => (
          <Stack
            key={metric.label}
            justifyContent="space-between"
            sx={{
              minHeight: { xs: 160, sm: 205 },
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
                bgcolor: metric.background,
              }}
            >
              <Iconify icon={metric.icon} width={23} />
            </Box>
            <Box>
              <Stack direction="row" alignItems="baseline" spacing={0.5} flexWrap="wrap">
                <Typography variant="h4">{metric.value}</Typography>
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
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' },
          gap: 2,
          mb: 2,
        }}
      >
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
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ p: 2.5 }}>
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
                เรียงตามจำนวนที่ขายได้ · รวม {formatNumber(data.dishCount)} จาน
              </Typography>
            </Box>
          </Stack>
          <Divider />

          {data.bestSellers.length === 0 ? (
            <Stack alignItems="center" spacing={1} sx={{ py: 7 }}>
              <Iconify
                icon={'solar:inbox-line-bold-duotone' as IconifyName}
                width={38}
                sx={{ color: 'text.disabled' }}
              />
              <Typography variant="h6">ยังไม่มีข้อมูลการขาย</Typography>
            </Stack>
          ) : (
            <Stack divider={<Divider />} sx={{ px: 2.5, pb: 1 }}>
              {data.bestSellers.map((item, index) => {
                const percentage = (item.quantity / maxBestSeller) * 100;
                const winner = index === 0;

                return (
                  <Box
                    key={item.name}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '36px minmax(0, 1fr) auto',
                      columnGap: 1.5,
                      rowGap: 0.75,
                      alignItems: 'center',
                      py: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        gridRow: '1 / 3',
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 1.5,
                        color: winner ? 'warning.darker' : 'text.secondary',
                        bgcolor: winner ? 'warning.lighter' : 'grey.100',
                        fontWeight: 800,
                      }}
                    >
                      {winner ? (
                        <Iconify icon={'solar:crown-bold' as IconifyName} width={20} />
                      ) : (
                        index + 1
                      )}
                    </Box>
                    <Typography variant="subtitle2" noWrap title={item.name}>
                      {item.name}
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle2">{formatNumber(item.quantity)} จาน</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatBaht(item.revenue)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ height: 8, overflow: 'hidden', borderRadius: 1, bgcolor: 'grey.100' }}
                    >
                      <Box
                        sx={{
                          width: `${percentage}%`,
                          minWidth: 8,
                          height: 1,
                          bgcolor: winner ? 'warning.main' : 'primary.main',
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        <Box
          sx={{
            p: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            bgcolor: 'common.white',
            boxShadow: '0 8px 28px rgba(33,43,54,0.05)',
          }}
        >
          <Typography variant="h5">ช่วงเวลาที่ลูกค้าสั่ง</Typography>
          <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
            จำนวนออเดอร์แยกตามช่วงเวลา
          </Typography>

          {busiestTime && busiestTime.orderCount > 0 && (
            <Chip
              size="small"
              icon={<Iconify icon="solar:clock-circle-bold" width={16} />}
              label={`สั่งมากสุด ${busiestTime.label} · ${formatNumber(busiestTime.orderCount)} ออเดอร์`}
              color="primary"
              sx={{ mt: 1.5 }}
            />
          )}

          <Stack spacing={1.65} sx={{ mt: 2.5 }}>
            {data.timeTraffic.map((time) => (
              <Box key={time.key}>
                <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.6 }}>
                  <Typography variant="body2">{time.label}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {formatNumber(time.orderCount)} ออเดอร์ · {formatBaht(time.revenue)}
                  </Typography>
                </Stack>
                <Box sx={{ height: 9, overflow: 'hidden', borderRadius: 1, bgcolor: 'grey.100' }}>
                  <Box
                    sx={{
                      width: `${(time.orderCount / maxTimeOrders) * 100}%`,
                      minWidth: time.orderCount ? 9 : 0,
                      height: 1,
                      borderRadius: 1,
                      bgcolor: 'primary.main',
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          bgcolor: 'common.white',
          boxShadow: '0 8px 28px rgba(33,43,54,0.05)',
        }}
      >
        <Typography variant="h5">เมนูขายดีแยกตามหมวดหมู่</Typography>
        <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
          ดู 3 อันดับแรกของแต่ละหมวด เพื่อเข้าใจว่าแต่ละกลุ่มขายอะไรดี
        </Typography>

        {data.categoryBestSellers.length === 0 ? (
          <Typography variant="body2" sx={{ py: 5, color: 'text.secondary', textAlign: 'center' }}>
            ยังไม่มีข้อมูลเมนูแยกตามหมวดหมู่
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' },
              gap: 1.5,
              mt: 2.5,
            }}
          >
            {data.categoryBestSellers.map((category) => (
              <Box
                key={category.category}
                sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                  <Typography variant="h6">{category.label}</Typography>
                  <Chip size="small" label={`${category.items.length} อันดับ`} variant="outlined" />
                </Stack>
                <Stack spacing={1.25}>
                  {category.items.map((item, index) => (
                    <Stack key={item.name} direction="row" alignItems="center" spacing={1.25}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          borderRadius: 1,
                          color: index === 0 ? 'warning.darker' : 'text.secondary',
                          bgcolor: index === 0 ? 'warning.lighter' : 'grey.100',
                          typography: 'caption',
                          fontWeight: 800,
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant="body2" noWrap sx={{ flex: 1 }} title={item.name}>
                        {item.name}
                      </Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2">
                          {formatNumber(item.quantity)} จาน
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatBaht(item.revenue)}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
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
          spacing={1.5}
        >
          <Box>
            <Typography variant="h5">ออเดอร์มาก–น้อยตามวัน</Typography>
            <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
              จำนวนออเดอร์ในแต่ละวัน ใช้ดูแนวโน้มช่วงที่ลูกค้าเยอะ
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {busiestDay && (
              <Chip
                size="small"
                color="success"
                label={`มากสุด: ${busiestDay.label} ${formatNumber(busiestDay.orderCount)} ออเดอร์`}
              />
            )}
            {quietestDay && (
              <Chip
                size="small"
                variant="outlined"
                label={`น้อยสุด: ${quietestDay.label} ${formatNumber(quietestDay.orderCount)} ออเดอร์`}
              />
            )}
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(7, 1fr)' },
            gap: 1,
            alignItems: 'end',
            mt: 3,
          }}
        >
          {data.dayTraffic.map((day) => {
            const height = day.observed ? Math.max((day.orderCount / maxDayOrders) * 100, 5) : 0;
            const isBusiest = busiestDay?.key === day.key && day.orderCount > 0;

            return (
              <Stack
                key={day.key}
                alignItems="center"
                justifyContent="flex-end"
                sx={{ minHeight: 190, opacity: day.observed ? 1 : 0.42 }}
              >
                <Typography variant="subtitle2">{formatNumber(day.orderCount)}</Typography>
                <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary' }}>
                  ออเดอร์
                </Typography>
                <Box
                  sx={{
                    width: { xs: 42, sm: 1 },
                    maxWidth: 54,
                    height: 105,
                    display: 'flex',
                    alignItems: 'flex-end',
                    overflow: 'hidden',
                    borderRadius: 1.5,
                    bgcolor: 'grey.100',
                  }}
                >
                  <Box
                    sx={{
                      width: 1,
                      height: `${height}%`,
                      borderRadius: 1.5,
                      bgcolor: isBusiest ? 'success.main' : 'primary.main',
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ mt: 1, fontWeight: 700 }}>
                  {day.label}
                </Typography>
                {!day.observed && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    ไม่มีข้อมูล
                  </Typography>
                )}
              </Stack>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
