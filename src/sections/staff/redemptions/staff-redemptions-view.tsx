'use client';

import type { IconifyName } from 'src/components/iconify';
import type { LoyaltyRedemption } from 'src/lib/loyalty-service';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import {
  listPendingRedemptions,
  decideRedemptionRequest,
} from 'src/sections/admin/loyalty/loyalty-actions';

import { StaffPageHero } from '../components/staff-page-hero';

// ----------------------------------------------------------------------

const POLL_INTERVAL_MS = 7000;
type Props = { initialRedemptions: LoyaltyRedemption[] };

export function StaffRedemptionsView({ initialRedemptions }: Props) {
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  useEffect(() => {
    let active = true;

    const tick = async () => {
      try {
        const data = await listPendingRedemptions();
        if (active) setRedemptions(data);
      } catch (error) {
        console.error(error);
      }
    };

    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const summary = useMemo(
    () => ({
      stars: redemptions.reduce((sum, item) => sum + item.starsCost, 0),
      customers: new Set(redemptions.map((item) => item.customerId)).size,
    }),
    [redemptions]
  );

  const handleDecide = async (item: LoyaltyRedemption, approve: boolean) => {
    const confirmed = await confirm({
      title: approve ? 'ยืนยันมอบของรางวัล' : 'ยืนยันปฏิเสธคำขอ',
      content: approve
        ? `ยืนยันว่ามอบ “${item.rewardName}” ให้ ${item.customerDisplayName || item.customerPhone} แล้ว?`
        : `ปฏิเสธคำขอ “${item.rewardName}” และคืน ${item.starsCost} ดาวให้ลูกค้า?`,
      confirmLabel: approve ? 'ยืนยันมอบแล้ว' : 'ปฏิเสธและคืนดาว',
    });
    if (!confirmed) return;

    setDecidingId(item.id);
    try {
      await decideRedemptionRequest(item.id, approve);
      setRedemptions((current) => current.filter((redemption) => redemption.id !== item.id));
      toast.success(approve ? 'ยืนยันการมอบของรางวัลแล้ว' : 'ปฏิเสธคำขอและคืนดาวแล้ว');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <StaffPageHero
        title="แลกของรางวัล"
        subtitle="ตรวจสอบคำขอและยืนยันการมอบรางวัล"
        icon={'solar:cup-star-bold' as IconifyName}
        badge="อัปเดตอัตโนมัติทุก 7 วินาที"
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 1.5,
          mb: 3,
        }}
      >
        {[
          ['รอดำเนินการ', redemptions.length, 'คำขอ', '🎁', '#FFF0ED'],
          ['ลูกค้า', summary.customers, 'คน', '👤', '#EAF4FF'],
          ['ดาวที่ใช้', summary.stars, 'ดาว', '⭐', '#FFF6DD'],
        ].map(([label, value, unit, emoji, color]) => (
          <Stack
            key={label}
            alignItems="center"
            spacing={0.5}
            sx={{ p: { xs: 1.25, sm: 2 }, borderRadius: 2.5, bgcolor: 'common.white' }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                bgcolor: color,
                fontSize: 21,
              }}
            >
              {emoji}
            </Box>
            <Typography variant="h4">{Number(value).toLocaleString('th-TH')}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {label} · {unit}
            </Typography>
          </Stack>
        ))}
      </Box>

      <Stack
        direction="row"
        spacing={1}
        alignItems="flex-start"
        sx={{
          p: 1.75,
          mb: 3,
          borderRadius: 2.5,
          color: 'warning.darker',
          bgcolor: 'warning.lighter',
          border: '1px solid #F1CB79',
        }}
      >
        <Iconify icon={'solar:danger-triangle-bold' as IconifyName} width={22} />
        <Box>
          <Typography variant="subtitle2">ตรวจสอบก่อนกดยืนยัน</Typography>
          <Typography variant="body2">
            มอบของรางวัลให้ลูกค้าก่อน แล้วจึงกด “มอบแล้ว” เพราะไม่สามารถย้อนกลับได้
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5">คำขอที่รอดำเนินการ</Typography>
          <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
            คำขอเก่าแสดงอยู่ด้านบน
          </Typography>
        </Box>
        <Chip label={`${redemptions.length} คำขอ`} color="warning" />
      </Stack>

      {redemptions.length === 0 ? (
        <Stack alignItems="center" spacing={1.25} sx={{ p: 6, borderRadius: 3, bgcolor: 'common.white' }}>
          <Box
            sx={{
              width: 76,
              height: 76,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              bgcolor: '#E5F8ED',
              fontSize: 38,
            }}
          >
            ✅
          </Box>
          <Typography variant="h6">จัดการครบแล้ว</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            ยังไม่มีคำขอแลกของรางวัลใหม่
          </Typography>
        </Stack>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          {redemptions.map((item, index) => {
            const customerName = item.customerDisplayName || item.customerPhone;
            const isBusy = decidingId === item.id;

            return (
              <Stack
                key={item.id}
                sx={{
                  overflow: 'hidden',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: '#F1CB79',
                  bgcolor: 'common.white',
                  boxShadow: '0 7px 22px rgba(33,43,54,0.06)',
                }}
              >
                <Box sx={{ height: 5, bgcolor: 'warning.main' }} />
                <Stack spacing={1.5} sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: 2,
                          bgcolor: 'warning.lighter',
                          fontSize: 27,
                        }}
                      >
                        🎁
                      </Box>
                      <Box>
                        <Typography variant="h6">{item.rewardName}</Typography>
                        <Chip
                          size="small"
                          label={`${item.starsCost.toLocaleString('th-TH')} ดาว`}
                          color="warning"
                          sx={{ mt: 0.5, fontWeight: 800 }}
                        />
                      </Box>
                    </Stack>
                    <Chip size="small" variant="outlined" label={`คิว ${index + 1}`} />
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50' }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '50%',
                        color: 'primary.main',
                        bgcolor: 'primary.lighter',
                      }}
                    >
                      <Iconify icon="solar:user-id-bold" width={21} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1">{customerName}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {item.customerPhone}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    ขอแลกเมื่อ {fDateTime(item.requestedAt)}
                  </Typography>

                  <Stack direction="row" spacing={1}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      disabled={isBusy}
                      onClick={() => handleDecide(item, false)}
                    >
                      ปฏิเสธ
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      loading={isBusy}
                      onClick={() => handleDecide(item, true)}
                      startIcon={<Iconify icon="solar:check-circle-bold" width={21} />}
                    >
                      มอบแล้ว
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            );
          })}
        </Box>
      )}

      {dialog}
    </Box>
  );
}
