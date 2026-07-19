'use client';

import type { TableSessionSummary } from 'src/lib/order-service';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { fTime, fToNow } from 'src/utils/format-time';

import { BillDialog } from './bill-dialog';
import { listOpenTableSessions } from './table-session-actions';
import { STATUS_COLOR, STATUS_LABEL } from './order-status-config';

// ----------------------------------------------------------------------

const POLL_INTERVAL_MS = 7000;

type Props = {
  initialSessions: TableSessionSummary[];
};

export function OpenTablesPanel({ initialSessions }: Props) {
  const [sessions, setSessions] = useState(initialSessions);
  const [activeSession, setActiveSession] = useState<TableSessionSummary | null>(null);

  useEffect(() => {
    let active = true;

    const tick = async () => {
      try {
        const data = await listOpenTableSessions();
        if (active) setSessions(data);
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

  return (
    <Box sx={{ mb: 5, '@media print': { display: 'none' } }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        โต๊ะที่เปิดอยู่ตอนนี้ ({sessions.length})
      </Typography>

      {sessions.length === 0 ? (
        <Typography sx={{ color: 'text.secondary' }}>ไม่มีโต๊ะที่เปิดอยู่ในขณะนี้</Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {sessions.map((session) => (
            <ButtonBase
              key={session.id}
              onClick={() => setActiveSession(session)}
              sx={{ display: 'block', textAlign: 'left', borderRadius: 2 }}
            >
              <Stack
                spacing={1.25}
                sx={{
                  width: 1,
                  p: 2.25,
                  borderRadius: 2,
                  bgcolor: 'common.white',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6">โต๊ะ {session.tableNumber}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right' }}>
                    มาตั้งแต่ {fTime(session.openedAt)} ({fToNow(session.openedAt)})
                  </Typography>
                </Stack>

                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {session.orderCount} ออเดอร์ · ยอดรวม {session.total} บาท
                </Typography>

                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  {(Object.keys(session.statusCounts) as (keyof typeof session.statusCounts)[]).map(
                    (status) => (
                      <Chip
                        key={status}
                        size="small"
                        color={STATUS_COLOR[status]}
                        label={`${STATUS_LABEL[status]} ${session.statusCounts[status]}`}
                      />
                    )
                  )}
                </Stack>
              </Stack>
            </ButtonBase>
          ))}
        </Box>
      )}

      <BillDialog
        session={activeSession}
        variant="manage"
        onClose={() => setActiveSession(null)}
      />
    </Box>
  );
}
