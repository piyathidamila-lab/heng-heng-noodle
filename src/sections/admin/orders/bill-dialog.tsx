'use client';

import type { TableBill } from './table-session-actions';
import type { OrderRecord } from 'src/lib/order-service';

import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import { Grid } from '@mui/material';
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

import { fTime, fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { updateOrderStatus } from './order-admin-actions';
import { getTableBill, closeTableSession } from './table-session-actions';
import { NEXT_STATUS, STATUS_COLOR, STATUS_LABEL } from './order-status-config';

// ----------------------------------------------------------------------

/** Loose on purpose — satisfied by both TableSessionSummary (always open) and BillSummary (open or closed). */
type BillTarget = {
  id: string;
  tableNumber: string;
  status?: 'open' | 'closed';
  closedAt?: string | null;
};

type Props = {
  session: BillTarget | null;
  /** 'bill' (default) is the checkout flow — QR + ปิดโต๊ะ. 'manage' is order-status-only, for the live orders board. */
  variant?: 'bill' | 'manage';
  onClose: () => void;
  onTableClosed?: (sessionId: string) => void;
};

export function BillDialog({ session, variant = 'bill', onClose, onTableClosed }: Props) {
  const isManage = variant === 'manage';
  const isClosed = !isManage && session?.status === 'closed';
  const [bill, setBill] = useState<TableBill | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

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
    const confirmed = await confirm({
      content: `ยกเลิกออเดอร์ ${order.orderNumber} ใช่หรือไม่?`,
      confirmLabel: 'ยกเลิกออเดอร์',
    });
    if (!confirmed) return;

    await updateOrderStatus(order.id, 'cancelled');
    // cancelling changes the payable total, so re-fetch to get a QR that matches it
    await refetchBill();
  };

  const visibleOrders = bill
    ? isManage
      ? bill.orders.filter((order) => order.status !== 'completed' && order.status !== 'cancelled')
      : bill.orders
    : [];

  const handleCloseTable = async () => {
    if (!session) return;

    const confirmed = await confirm({
      title: 'ยืนยันปิดโต๊ะ',
      content: `ยืนยันปิดโต๊ะ ${session.tableNumber} (ชำระเงินแล้ว)?`,
      confirmLabel: 'ปิดโต๊ะ',
    });
    if (!confirmed) return;

    setClosing(true);
    try {
      await closeTableSession(session.id);
      onTableClosed?.(session.id);
      onClose();
    } finally {
      setClosing(false);
    }
  };

  return (
    <>
      <Dialog open={!!session} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {isManage ? 'จัดการออเดอร์' : isClosed ? 'รายละเอียดบิล' : 'เช็คบิล'} โต๊ะ{' '}
          {session?.tableNumber}
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
            <Grid container spacing={2.5}>
              <Grid size={{ xs: isManage ? 12 : 7 }}>
                {isManage && visibleOrders.length === 0 ? (
                  <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    ไม่มีรายการที่ยังไม่เสร็จสิ้น
                  </Typography>
                ) : (
                  <Stack spacing={1.5} divider={<Divider flexItem />}>
                    {visibleOrders.map((order) => {
                      const next = NEXT_STATUS[order.status];

                      return (
                        <Stack
                          key={order.id}
                          spacing={0.75}
                          sx={{ opacity: order.status === 'cancelled' ? 0.5 : 1 }}
                        >
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
                              <Typography variant="body2">
                                {item.price * item.quantity} บาท
                              </Typography>
                            </Stack>
                          ))}

                          {!isClosed &&
                            (next ||
                              order.status === 'pending' ||
                              order.status === 'preparing') && (
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
                )}

                <Divider />

                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6">ยอดรวม</Typography>
                  <Typography variant="h6" color="primary.main">
                    {bill.total} บาท
                  </Typography>
                </Stack>
              </Grid>

              {!isManage && (
                <Grid size={{ xs: 5 }}>
                  {isClosed ? (
                    <Stack alignItems="center" spacing={0.5} sx={{ py: 1 }}>
                      <Chip size="small" color="default" label="ปิดบิลแล้ว (ชำระเงินแล้ว)" />
                      {session?.closedAt && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          ปิดบิลเมื่อ {fDateTime(session.closedAt)}
                        </Typography>
                      )}
                    </Stack>
                  ) : (
                    <Stack alignItems="center" spacing={1.5}>
                      {bill.promptPayQrUrl ? (
                        <>
                          <Box
                            component="img"
                            src={bill.promptPayQrUrl}
                            alt="QR Code รับเงินของร้าน"
                            sx={{
                              width: 220,
                              height: 220,
                              p: 1,
                              objectFit: 'contain',
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'common.white',
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', textAlign: 'center' }}
                          >
                            สแกน QR ของร้านและตรวจสอบยอด {bill.total.toLocaleString('th-TH')} บาท
                          </Typography>
                        </>
                      ) : bill.promptPayPayload ? (
                        <>
                          <QRCodeSVG
                            value={bill.promptPayPayload}
                            size={200}
                            level="M"
                            marginSize={2}
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            สแกนด้วยแอปธนาคารเพื่อจ่ายผ่านพร้อมเพย์
                          </Typography>
                        </>
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{ color: 'warning.dark', textAlign: 'center' }}
                        >
                          ยังไม่ได้ตั้งค่าเลขพร้อมเพย์ของร้าน (PROMPTPAY_ID)
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {isManage || isClosed ? (
            <Button fullWidth variant="outlined" size="large" onClick={onClose}>
              ปิดหน้าต่าง
            </Button>
          ) : (
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
          )}
        </DialogActions>
      </Dialog>

      {confirmDialog}
    </>
  );
}
