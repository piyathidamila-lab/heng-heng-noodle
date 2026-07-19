'use client';

import type { RestaurantTableAvailability } from 'src/lib/table-service';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { Logo } from 'src/components/logo';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { listTableAvailability } from '../table-availability-actions';

// ----------------------------------------------------------------------

const POLL_INTERVAL_MS = 7000;
type TableFilter = 'all' | 'available' | 'occupied';

type Props = {
  shopName: string;
  initialUpdatedAt: string;
  initialTables: RestaurantTableAvailability[];
};

export function TableAvailabilityView({ shopName, initialUpdatedAt, initialTables }: Props) {
  const router = useRouter();
  const requestInFlight = useRef(false);
  const [tables, setTables] = useState(initialTables);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<TableFilter>('all');
  const [updatedAt, setUpdatedAt] = useState(() => new Date(initialUpdatedAt));

  const availableCount = useMemo(
    () => tables.filter((table) => table.status === 'available').length,
    [tables]
  );
  const occupiedCount = tables.length - availableCount;
  const visibleTables = useMemo(
    () => (filter === 'all' ? tables : tables.filter((table) => table.status === filter)),
    [filter, tables]
  );

  const refresh = useCallback(async (showLoading = false) => {
    if (requestInFlight.current) return;

    requestInFlight.current = true;
    if (showLoading) setRefreshing(true);

    try {
      const nextTables = await listTableAvailability();
      setTables(nextTables);
      setUpdatedAt(new Date());
    } catch (error) {
      console.error(error);
      if (showLoading) toast.error('อัปเดตสถานะโต๊ะไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      requestInFlight.current = false;
      if (showLoading) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

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
          pb: 7,
          color: 'common.white',
          background: 'linear-gradient(145deg, #721111 0%, #A91D1D 55%, #C12C22 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 190,
            height: 190,
            top: -110,
            right: -65,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.07)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 110,
            height: 110,
            bottom: -55,
            left: -40,
            borderRadius: '50%',
            bgcolor: 'rgba(255,213,79,0.10)',
          }}
        />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ position: 'relative' }}
        >
          <IconButton
            onClick={() => router.push('/')}
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

          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                p: 0.5,
                borderRadius: 1.5,
                bgcolor: 'common.white',
              }}
            >
              <Logo disabled sx={{ width: 1, height: 1 }} />
            </Box>
            <Typography variant="subtitle1">{shopName}</Typography>
          </Stack>
          <Box sx={{ width: 40 }} />
        </Stack>

        <Typography variant="h4" sx={{ mt: 3, position: 'relative' }}>
          เช็กโต๊ะก่อนเข้าร้าน
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.75, position: 'relative', opacity: 0.82 }}>
          ดูสถานะล่าสุดได้ทันที ไม่ต้องเสียเวลารอหน้าร้าน
        </Typography>
      </Box>

      <Box sx={{ px: 2.5, mt: -4, position: 'relative', zIndex: 1 }}>
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
          <Stack alignItems="center" spacing={0.25} sx={{ flex: 1, py: 2.25 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Iconify icon="solar:check-circle-bold" width={22} sx={{ color: 'success.main' }} />
              <Typography variant="h4" sx={{ color: 'success.dark', lineHeight: 1 }}>
                {availableCount}
              </Typography>
            </Stack>
            <Typography variant="subtitle2">โต๊ะว่าง</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              พร้อมให้บริการ
            </Typography>
          </Stack>

          <Box sx={{ width: '1px', my: 2, bgcolor: 'grey.200' }} />

          <Stack alignItems="center" spacing={0.25} sx={{ flex: 1, py: 2.25 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Iconify icon="solar:close-circle-bold" width={22} sx={{ color: 'error.main' }} />
              <Typography variant="h4" sx={{ color: 'error.main', lineHeight: 1 }}>
                {occupiedCount}
              </Typography>
            </Stack>
            <Typography variant="subtitle2">ไม่ว่าง</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              กำลังมีลูกค้า
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, pt: 2.25, pb: 1.5 }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: 'success.main',
              boxShadow: '0 0 0 4px rgba(34,197,94,0.12)',
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            อัปเดต {updatedAt.toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZone: 'Asia/Bangkok',
            })}{' '}
            น.
          </Typography>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          disabled={refreshing}
          onClick={() => refresh(true)}
          startIcon={
            refreshing ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Iconify icon="solar:restart-bold" width={18} />
            )
          }
          sx={{ minWidth: 96, borderRadius: 2 }}
        >
          อัปเดต
        </Button>
      </Stack>

      {tables.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 2.5, pb: 2, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}
        >
          {(
            [
              ['all', `ทั้งหมด ${tables.length}`],
              ['available', `ว่าง ${availableCount}`],
              ['occupied', `ไม่ว่าง ${occupiedCount}`],
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
      )}

      {tables.length === 0 ? (
        <Stack
          alignItems="center"
          spacing={1.25}
          sx={{ mx: 2.5, px: 2.5, py: 7, borderRadius: 3, bgcolor: 'common.white' }}
        >
          <Box component="span" sx={{ fontSize: 48, lineHeight: 1 }}>
            🪑
          </Box>
          <Typography variant="h6">ยังไม่มีข้อมูลโต๊ะ</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            ร้านยังไม่ได้เพิ่มข้อมูลโต๊ะ กรุณาติดต่อทางร้านโดยตรง
          </Typography>
        </Stack>
      ) : visibleTables.length === 0 ? (
        <Stack alignItems="center" spacing={1} sx={{ px: 2.5, py: 6 }}>
          <Iconify icon="solar:check-circle-bold" width={48} sx={{ color: 'success.main' }} />
          <Typography variant="h6">ไม่มีโต๊ะในสถานะนี้</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ลองเลือกดูสถานะอื่น
          </Typography>
        </Stack>
      ) : (
        <Box
          sx={{
            px: 2.5,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 1.5,
          }}
        >
          {visibleTables.map((table) => {
            const isAvailable = table.status === 'available';

            return (
              <Stack
                key={table.id}
                spacing={1}
                alignItems="center"
                role="status"
                aria-label={`โต๊ะ ${table.label} ${isAvailable ? 'ว่าง' : 'ไม่ว่าง'}`}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  p: 1.75,
                  minHeight: 168,
                  justifyContent: 'center',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: isAvailable ? '#B5E2C8' : '#F0C1C1',
                  bgcolor: 'common.white',
                  boxShadow: isAvailable
                    ? '0 7px 20px rgba(13,122,75,0.08)'
                    : '0 7px 20px rgba(198,40,40,0.06)',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    bgcolor: isAvailable ? 'success.main' : 'error.main',
                  }}
                />
                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 2.25,
                    color: isAvailable ? '#087A4B' : '#C62828',
                    bgcolor: isAvailable ? '#D9F8E8' : '#FFE0E0',
                  }}
                >
                  <Box component="span" sx={{ fontSize: 27, lineHeight: 1 }}>
                    🪑
                  </Box>
                </Box>

                <Typography variant="h6" sx={{ mt: 0.25 }}>
                  โต๊ะ {table.label}
                </Typography>
                <Chip
                  size="small"
                  icon={
                    <Iconify
                      icon={isAvailable ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                      width={16}
                    />
                  }
                  label={isAvailable ? 'ว่าง' : 'ไม่ว่าง'}
                  sx={{
                    height: 28,
                    color: isAvailable ? '#087A4B' : '#B42323',
                    fontWeight: 700,
                    bgcolor: isAvailable ? '#E5F8ED' : '#FFE8E8',
                    '& .MuiChip-icon': { color: 'inherit' },
                  }}
                />
              </Stack>
            );
          })}
        </Box>
      )}

      <Typography
        variant="caption"
        sx={{ px: 2.5, pt: 2.5, color: 'text.secondary', textAlign: 'center' }}
      >
        <Iconify icon="solar:clock-circle-outline" width={15} sx={{ mr: 0.5, mb: -0.3 }} />
        สถานะอัปเดตอัตโนมัติทุก 7 วินาที
      </Typography>
    </Box>
  );
}
