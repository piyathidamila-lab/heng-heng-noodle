'use client';

import type { LoyaltyRedemption } from 'src/lib/loyalty-service';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';

import { decideRedemptionRequest } from './loyalty-actions';

// ----------------------------------------------------------------------

type Props = {
  initialRedemptions: LoyaltyRedemption[];
};

export function RedemptionQueue({ initialRedemptions }: Props) {
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const handleDecide = async (id: string, approve: boolean) => {
    setDecidingId(id);
    try {
      await decideRedemptionRequest(id, approve);
      setRedemptions((prev) => prev.filter((item) => item.id !== id));
      toast.success(approve ? 'อนุมัติการแลกของรางวัลแล้ว' : 'ปฏิเสธคำขอแล้ว คืนดาวให้ลูกค้าแล้ว');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      setDecidingId(null);
    }
  };

  if (redemptions.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          ไม่มีคำขอแลกของรางวัลที่รอดำเนินการ
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {redemptions.map((item) => (
        <Stack
          key={item.id}
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'common.white',
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1">{item.rewardName}</Typography>
              <Chip size="small" label={`${item.starsCost} ดาว`} color="warning" />
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {item.customerDisplayName || item.customerPhone} · {item.customerPhone} · ขอเมื่อ{' '}
              {fDateTime(item.requestedAt)}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              disabled={decidingId === item.id}
              onClick={() => handleDecide(item.id, false)}
            >
              ปฏิเสธ
            </Button>
            <Button
              variant="contained"
              size="small"
              loading={decidingId === item.id}
              onClick={() => handleDecide(item.id, true)}
            >
              อนุมัติ
            </Button>
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
