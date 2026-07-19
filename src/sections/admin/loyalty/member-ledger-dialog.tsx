'use client';

import type { MemberSummary, StarLedgerEntry } from 'src/lib/loyalty-service';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { fDateTime } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';

import { getMemberLedgerForAdmin } from './loyalty-actions';

// ----------------------------------------------------------------------

const REASON_LABEL: Record<string, string> = {
  order_earn: 'ได้ดาวจากออเดอร์กลับบ้าน',
  session_earn: 'ได้ดาวจากปิดบิลโต๊ะ',
  redeem_request: 'ขอแลกของรางวัล',
  redeem_refund: 'คืนดาวจากคำขอที่ถูกปฏิเสธ',
};

type Props = {
  member: MemberSummary | null;
  onClose: () => void;
};

export function MemberLedgerDialog({ member, onClose }: Props) {
  const [entries, setEntries] = useState<StarLedgerEntry[] | null>(null);

  useEffect(() => {
    if (!member) {
      setEntries(null);
      return;
    }
    getMemberLedgerForAdmin(member.id)
      .then(setEntries)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'โหลดประวัติไม่สำเร็จ');
        setEntries([]);
      });
  }, [member]);

  return (
    <Dialog open={!!member} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>ประวัติดาวของ {member?.displayName || member?.phone}</DialogTitle>

      <DialogContent>
        {entries === null ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : entries.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
            ยังไม่มีประวัติ
          </Typography>
        ) : (
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            {entries.map((entry) => (
              <Stack key={entry.id} direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2">{REASON_LABEL[entry.reason] ?? entry.reason}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {fDateTime(entry.createdAt)}
                  </Typography>
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{ color: entry.delta >= 0 ? 'success.main' : 'error.main' }}
                >
                  {entry.delta >= 0 ? '+' : ''}
                  {entry.delta}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>ปิด</Button>
      </DialogActions>
    </Dialog>
  );
}
