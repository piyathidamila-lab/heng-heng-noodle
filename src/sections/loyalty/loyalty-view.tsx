'use client';

import type { IconifyName } from 'src/components/iconify';
import type { SessionMember } from 'src/lib/member-session';
import type { LoyaltyReward, LoyaltyRedemption } from 'src/lib/loyalty-service';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

import { MemberAuthForm } from './member-auth-form';
import { MemberDashboard } from './member-dashboard';

// ----------------------------------------------------------------------

type Props = {
  enabled: boolean;
  member: SessionMember | null;
  rewards: LoyaltyReward[];
  myRedemptions: LoyaltyRedemption[];
};

export function LoyaltyView({ enabled, member, rewards, myRedemptions }: Props) {
  const router = useRouter();

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#FBF8F4' }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          px: 2.5,
          pt: 2.5,
          pb: enabled && !member ? 7 : 3,
          color: 'common.white',
          background: 'linear-gradient(145deg, #721111 0%, #A91D1D 58%, #C12C22 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 180,
            height: 180,
            top: -90,
            right: -55,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.08)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 100,
            height: 100,
            bottom: -55,
            left: -35,
            borderRadius: '50%',
            bgcolor: 'rgba(255,194,74,0.14)',
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <IconButton
            onClick={() => router.back()}
            aria-label="กลับหน้าหลัก"
            sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.12)' }}
          >
            <Iconify icon={'solar:arrow-left-linear' as IconifyName} width={22} />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            สมาชิกเฮงเฮง
          </Typography>
        </Stack>

        {enabled && !member && (
          <Stack
            alignItems="center"
            sx={{ position: 'relative', zIndex: 1, pt: 3, textAlign: 'center' }}
          >
            <Box
              sx={{
                width: 66,
                height: 66,
                mb: 1.75,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                color: '#7A1010',
                bgcolor: '#FFD66B',
                boxShadow: '0 10px 24px rgba(65,0,0,0.24)',
              }}
            >
              <Iconify icon={'solar:star-bold' as IconifyName} width={34} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              ยิ่งอร่อย ยิ่งได้ดาว
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 1, maxWidth: 310, opacity: 0.82, lineHeight: 1.7 }}
            >
              เข้าสู่ระบบเพื่อดูดาวสะสม ประวัติการสั่งซื้อ และแลกของรางวัลที่ชอบ
            </Typography>
          </Stack>
        )}
      </Box>

      {!enabled ? (
        <Box sx={{ px: 2.5, py: 8, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            ฟีเจอร์สะสมดาวปิดใช้งานอยู่ในขณะนี้
          </Typography>
        </Box>
      ) : member ? (
        <MemberDashboard member={member} rewards={rewards} myRedemptions={myRedemptions} />
      ) : (
        <MemberAuthForm />
      )}
    </Box>
  );
}
