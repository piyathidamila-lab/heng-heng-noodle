'use client';

import type { TableBill } from './table-session-actions';
import type { OrderRecord, TableSessionSummary } from 'src/lib/order-service';

import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { fTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { updateOrderStatus } from './order-admin-actions';
import { getTableBill, closeTableSession } from './table-session-actions';
import { NEXT_STATUS, STATUS_COLOR, STATUS_LABEL } from './order-status-config';

// ----------------------------------------------------------------------

type Props = {
  session: TableSessionSummary | null;
  onClose: () => void;
  onTableClosed: (sessionId: string) => void;
};

export function BillDialog({ session, onClose, onTableClosed }: Props) {
  const [bill, setBill] = useState<TableBill | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!session) {
      setBill(null);
      return undefined;
    }

    let active = true;
    setLoading(true);

    getTableBill(session.id)
      .then((data) => {
        if (active) setBill(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const refetchBill = async () => {
    if (!session) return;
    const data = await getTableBill(session.id);
    setBill(data);
  };

  const handleAdvance = async (order: OrderRecord) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;

    await updateOrderStatus(order.id, next.status);
    await refetchBill();
  };

  const handleCancelOrder = async (order: OrderRecord) => {
    if (!window.confirm(`ยกเลิกออเดอร์ ${order.orderNumber} ใช่หรือไม่?`)) return;

    await updateOrderStatus(order.id, 'cancelled');
    // cancelling changes the payable total, so re-fetch to get a QR that matches it
    await refetchBill();
  };

  const handleCloseTable = async () => {
    if (!session) return;
    if (!window.confirm(`ยืนยันปิดโต๊ะ ${session.tableNumber} (ชำระเงินแล้ว)?`)) return;

    setClosing(true);
    try {
      await closeTableSession(session.id);
      onTableClosed(session.id);
      onClose();
    } finally {
      setClosing(false);
    }
  };

  return (
    <Dialog open={!!session} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        เช็คบิล โต๊ะ {session?.tableNumber}
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading || !bill ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            <Stack spacing={1.5} divider={<Divider flexItem />}>
              {bill.orders.map((order) => {
                const next = NEXT_STATUS[order.status];

                return (
                  <Stack key={order.id} spacing={0.75} sx={{ opacity: order.status === 'cancelled' ? 0.5 : 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {order.orderNumber} · {order.customerName} · {fTime(order.createdAt)}
                      </Typography>
                      <Chip
                        size="small"
                        label={STATUS_LABEL[order.status]}
                        color={STATUS_COLOR[order.status]}
                      />
                    </Stack>

                    {order.items.map((item) => (
                      <Stack key={item.id} direction="row" justifyContent="space-between">
                        <Typography variant="body2">
                          {item.name} × {item.quantity}
                        </Typography>
                        <Typography variant="body2">{item.price * item.quantity} บาท</Typography>
                      </Stack>
                    ))}

                    {(next || order.status === 'pending' || order.status === 'preparing') && (
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        {next && (
                          <Button
                            size="small"
                            variant="outlined"
                            fullWidth
                            onClick={() => handleAdvance(order)}
                          >
                            {next.label}
                          </Button>
                        )}
                        {(order.status === 'pending' || order.status === 'preparing') && (
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            onClick={() => handleCancelOrder(order)}
                          >
                            ยกเลิก
                          </Button>
                        )}
                      </Stack>
                    )}
                  </Stack>
                );
              })}
            </Stack>

            <Divider />

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">ยอดรวม</Typography>
              <Typography variant="h6" color="primary.main">
                {bill.total} บาท
              </Typography>
            </Stack>

            <Stack alignItems="center" spacing={1.5}>
              {bill.promptPayPayload ? (
                <>
                  <QRCodeSVG value={bill.promptPayPayload} size={200} level="M" marginSize={2} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    สแกนด้วยแอปธนาคารเพื่อจ่ายผ่านพร้อมเพย์
                  </Typography>
                </>
              ) : (
                <Typography variant="caption" sx={{ color: 'warning.dark', textAlign: 'center' }}>
                  ยังไม่ได้ตั้งค่าเลขพร้อมเพย์ของร้าน (PROMPTPAY_ID)
                </Typography>
              )}
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          loading={closing}
          onClick={handleCloseTable}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          ปิดโต๊ะ (ชำระเงินแล้ว)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
