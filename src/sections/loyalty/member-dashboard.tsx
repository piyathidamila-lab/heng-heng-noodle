'use client';

import type { IconifyName } from 'src/components/iconify';
import type { SessionMember } from 'src/lib/member-session';
import type { LoyaltyReward, LoyaltyRedemption } from 'src/lib/loyalty-service';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { logoutMemberAction, requestRedemptionAction } from './loyalty-actions';

// ----------------------------------------------------------------------

const STATUS_LABEL: Record<
  LoyaltyRedemption['status'],
  { label: string; color: 'warning' | 'success' | 'error' }
> = {
  pending: { label: 'รอดำเนินการ', color: 'warning' },
  fulfilled: { label: 'สำเร็จ', color: 'success' },
  rejected: { label: 'ถูกปฏิเสธ', color: 'error' },
};

type Props = {
  member: SessionMember;
  rewards: LoyaltyReward[];
  myRedemptions: LoyaltyRedemption[];
};

export function MemberDashboard({ member, rewards, myRedemptions }: Props) {
  const [balance, setBalance] = useState(member.starsBalance);
  const [redemptions, setRedemptions] = useState(myRedemptions);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const handleRedeem = async (reward: LoyaltyReward) => {
    const confirmed = await confirm({
      title: 'ยืนยันการแลกของรางวัล',
      content: `แลก "${reward.name}" ด้วย ${reward.starsCost} ดาว ใช่หรือไม่? เมื่อขอแล้วดาวจะถูกหักทันที และรอพนักงานยืนยันการรับของ`,
      confirmLabel: 'ยืนยัน',
      confirmColor: 'primary',
    });
    if (!confirmed) return;

    setRequestingId(reward.id);
    try {
      await requestRedemptionAction(reward.id);
      setBalance((prev) => prev - reward.starsCost);
      setRedemptions((prev) => [
        {
          id: `pending-${Date.now()}`,
          customerId: member.id,
          customerPhone: member.phone,
          customerDisplayName: member.displayName,
          rewardName: reward.name,
          starsCost: reward.starsCost,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          decidedAt: null,
        },
        ...prev,
      ]);
      toast.success('ส่งคำขอแลกของรางวัลแล้ว รอพนักงานยืนยัน');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ');
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <Box sx={{ px: 2.5, pt: 4, pb: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5">สวัสดี {member.displayName || member.phone}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {member.phone}
          </Typography>
        </Box>
        <Button
          size="small"
          color="inherit"
          onClick={async () => {
            await logoutMemberAction();
            window.location.reload();
          }}
        >
          ออกจากระบบ
        </Button>
      </Stack>

      <Box
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          textAlign: 'center',
          color: 'common.white',
          background: 'linear-gradient(145deg, #721111 0%, #A91D1D 55%, #C12C22 100%)',
        }}
      >
        <Typography variant="body2" sx={{ opacity: 0.85, mb: 0.5 }}>
          ดาวสะสมของคุณ
        </Typography>
        <Typography variant="h2">{balance}</Typography>
      </Box>

      <Typography variant="h6" sx={{ mb: 1.5 }}>
        ของรางวัล
      </Typography>
      <Stack spacing={1.5} sx={{ mb: 4 }}>
        {rewards.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
            ยังไม่มีของรางวัลให้แลกในขณะนี้
          </Typography>
        )}
        {rewards.map((reward) => {
          const canRedeem = balance >= reward.starsCost;
          return (
            <Stack
              key={reward.id}
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'common.white',
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Box
                sx={{
                  width: 76,
                  height: 76,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                  borderRadius: 2,
                  bgcolor: 'grey.100',
                  backgroundImage: reward.imageUrl ? `url(${reward.imageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!reward.imageUrl && (
                  <Iconify
                    icon={'solar:gift-bold' as IconifyName}
                    width={34}
                    color="text.disabled"
                  />
                )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1">{reward.name}</Typography>
                {reward.description && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {reward.description}
                  </Typography>
                )}
                <Chip
                  size="small"
                  label={`${reward.starsCost} ดาว`}
                  color="warning"
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Button
                variant="contained"
                size="small"
                disabled={!canRedeem}
                loading={requestingId === reward.id}
                onClick={() => handleRedeem(reward)}
                startIcon={<Iconify icon={'solar:gift-bold' as IconifyName} width={18} />}
                sx={{ flexShrink: 0 }}
              >
                ขอแลก
              </Button>
            </Stack>
          );
        })}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="h6" sx={{ mb: 1.5 }}>
        ประวัติการแลกของรางวัล
      </Typography>
      <Stack spacing={1.25}>
        {redemptions.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
            ยังไม่มีประวัติการแลกของรางวัล
          </Typography>
        )}
        {redemptions.map((item) => (
          <Stack
            key={item.id}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              p: 1.75,
              borderRadius: 2,
              bgcolor: 'common.white',
              border: '1px solid',
              borderColor: 'grey.200',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2">{item.rewardName}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {item.starsCost} ดาว · {fDateTime(item.requestedAt)}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={STATUS_LABEL[item.status].label}
              color={STATUS_LABEL[item.status].color}
            />
          </Stack>
        ))}
      </Stack>

      {dialog}
    </Box>
  );
}
