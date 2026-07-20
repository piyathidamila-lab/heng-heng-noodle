'use client';

import type { IconifyName } from 'src/components/iconify';
import type { TableSessionSummary } from 'src/lib/order-service';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { fTime, fToNow } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

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

  const total = useMemo(
    () => sessions.reduce((sum, session) => sum + session.total, 0),
    [sessions]
  );

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
    <Card
      sx={{
        mt: 3,
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
        '@media print': { display: 'none' },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 1.75,
              color: 'success.darker',
              bgcolor: 'success.lighter',
            }}
          >
            <Iconify icon={'solar:chair-2-bold' as IconifyName} width={24} />
          </Box>
          <Box>
            <Typography variant="h5">โต๊ะที่เปิดอยู่</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              กดที่โต๊ะเพื่อดูรายการและเช็กบิล
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Chip size="small" variant="soft" color="success" label={`${sessions.length} โต๊ะ`} />
          <Chip
            size="small"
            variant="outlined"
            label={`ยอดรวม ${total.toLocaleString('th-TH')} บาท`}
          />
        </Stack>
      </Stack>

      {sessions.length === 0 ? (
        <Stack
          alignItems="center"
          sx={{ py: 6, px: 2, borderRadius: 2.5, bgcolor: 'grey.50', textAlign: 'center' }}
        >
          <Iconify icon={'solar:chair-2-bold' as IconifyName} width={54} color="text.disabled" />
          <Typography variant="h6" sx={{ mt: 1.5 }}>
            ไม่มีโต๊ะที่เปิดอยู่
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            โต๊ะจะแสดงที่นี่เมื่อลูกค้าสแกน QR และเริ่มสั่งอาหาร
          </Typography>
        </Stack>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {sessions.map((session) => (
            <ButtonBase
              key={session.id}
              onClick={() => setActiveSession(session)}
              sx={{ display: 'block', overflow: 'hidden', textAlign: 'left', borderRadius: 2.5 }}
            >
              <Box
                sx={{
                  width: 1,
                  height: 1,
                  overflow: 'hidden',
                  borderRadius: 2.5,
                  bgcolor: 'common.white',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition:
                    'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 10px 24px rgba(103,16,14,0.10)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ p: 2 }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        minWidth: 46,
                        height: 46,
                        px: 1,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 1.75,
                        color: 'common.white',
                        bgcolor: 'primary.main',
                        typography: 'h6',
                      }}
                    >
                      {session.tableNumber}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1">โต๊ะ {session.tableNumber}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        เปิดเมื่อ {fTime(session.openedAt)} · {fToNow(session.openedAt)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Iconify icon="eva:arrow-ios-forward-fill" width={20} color="text.disabled" />
                </Stack>

                <Divider />

                <Stack direction="row" sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      จำนวนออเดอร์
                    </Typography>
                    <Typography variant="subtitle1">{session.orderCount} รายการ</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      ยอดรวม
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: 'primary.main' }}>
                      {session.total.toLocaleString('th-TH')} บาท
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ p: 2, pt: 1.5 }}>
                  {(Object.keys(session.statusCounts) as (keyof typeof session.statusCounts)[]).map(
                    (status) => (
                      <Chip
                        key={status}
                        size="small"
                        variant="soft"
                        color={STATUS_COLOR[status]}
                        label={`${STATUS_LABEL[status]} ${session.statusCounts[status]}`}
                      />
                    )
                  )}
                </Stack>
              </Box>
            </ButtonBase>
          ))}
        </Box>
      )}

      <BillDialog session={activeSession} variant="manage" onClose={() => setActiveSession(null)} />
    </Card>
  );
}
