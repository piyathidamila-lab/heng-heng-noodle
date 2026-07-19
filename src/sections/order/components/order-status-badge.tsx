'use client';

import type { OrderStatus } from 'src/lib/order-service';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

const PREPARING_STEPS = [
  { emoji: '🍜', label: 'กำลังลวกเส้น' },
  { emoji: '🥢', label: 'กำลังใส่เครื่อง' },
  { emoji: '🍲', label: 'กำลังปรุงน้ำซุป' },
];

const ROTATE_INTERVAL_MS = 2200;

type Stage = { emoji: string; label: string; bg: string; color: string; pulse: boolean };

function getStage(status: OrderStatus, preparingStep: number): Stage {
  switch (status) {
    case 'pending':
      return { emoji: '📝', label: 'รับออเดอร์แล้ว', bg: '#FFF3D6', color: '#96650A', pulse: true };
    case 'preparing':
      return { ...PREPARING_STEPS[preparingStep], bg: '#FFE8DC', color: '#B4441C', pulse: true };
    case 'served':
      return { emoji: '🍽️', label: 'พร้อมเสิร์ฟแล้ว', bg: '#E5F8ED', color: '#0F7A46', pulse: false };
    case 'completed':
      return { emoji: '✅', label: 'เสร็จสิ้น', bg: '#EDEDED', color: '#5B5B5B', pulse: false };
    case 'cancelled':
      return { emoji: '❌', label: 'ยกเลิกออเดอร์', bg: '#FDEAEA', color: '#B3261E', pulse: false };
    default:
      return { emoji: '📝', label: 'รับออเดอร์แล้ว', bg: '#FFF3D6', color: '#96650A', pulse: true };
  }
}

/** Position on the 5-step visual journey: รับออเดอร์แล้ว → 3 ขั้นตอนทำอาหาร → พร้อมเสิร์ฟแล้ว */
function getJourneyIndex(status: OrderStatus, preparingStep: number): number {
  if (status === 'pending') return 0;
  if (status === 'preparing') return 1 + preparingStep;
  return 4;
}

type Props = {
  status: OrderStatus;
};

/**
 * Fun, visual stand-in for a plain "กำลังทำอาหาร" text status — cycles through
 * make-believe cooking steps while an order is "preparing" so the customer
 * sees something alive instead of a static label.
 */
export function OrderStatusBadge({ status }: Props) {
  const [preparingStep, setPreparingStep] = useState(0);

  useEffect(() => {
    if (status !== 'preparing') {
      setPreparingStep(0);
      return undefined;
    }

    const interval = setInterval(() => {
      setPreparingStep((prev) => (prev + 1) % PREPARING_STEPS.length);
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [status]);

  const stage = getStage(status, preparingStep);
  const journeyIndex = getJourneyIndex(status, preparingStep);
  const showJourney = status !== 'cancelled';

  return (
    <Stack spacing={0.75} alignItems="flex-end">
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ px: 1.25, py: 0.5, borderRadius: 5, bgcolor: stage.bg, color: stage.color }}
      >
        <Box
          component="span"
          sx={{
            fontSize: 16,
            lineHeight: 1,
            display: 'inline-block',
            animation: stage.pulse ? 'order-status-bounce 1.1s ease-in-out infinite' : 'none',
            '@keyframes order-status-bounce': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-3px)' },
            },
          }}
        >
          {stage.emoji}
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
          {stage.label}
        </Typography>
      </Stack>

      {showJourney && (
        <Stack direction="row" spacing={0.5}>
          {[0, 1, 2, 3, 4].map((index) => (
            <Box
              key={index}
              sx={{
                width: index === journeyIndex ? 14 : 6,
                height: 6,
                borderRadius: 3,
                bgcolor: index <= journeyIndex ? stage.color : 'grey.300',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
