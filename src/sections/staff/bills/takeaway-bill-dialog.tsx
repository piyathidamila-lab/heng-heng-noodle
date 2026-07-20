'use client';

import type { OrderRecord } from 'src/lib/order-service';
import type { PaymentQr } from 'src/sections/admin/orders/table-session-actions';

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

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { getPaymentQr, markTakeawayOrderPaid } from 'src/sections/admin/orders/table-session-actions';

// ----------------------------------------------------------------------

type Props = {
  order: OrderRecord | null;
  onClose: () => void;
  onPaid: (orderId: string, paidAt: string) => void;
};

/**
 * Item list + payment QR for a single takeaway order — mirrors BillDialog's
 * dine-in checkout flow. Staff has to open this (see what's owed, show the
 * QR) before "รับชำระแล้ว" is even reachable, instead of marking paid
 * straight off the list card.
 */
export function TakeawayBillDialog({ order, onClose, onPaid }: Props) {
  const isPaid = order?.paymentStatus === 'paid';
  const [qr, setQr] = useState<PaymentQr | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [paying, setPaying] = useState(false);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  useEffect(() => {
    if (!order || isPaid) {
      setQr(null);
      return undefined;
    }

    let active = true;
    setLoadingQr(true);

    getPaymentQr(order.total)
      .then((data) => {
        if (active) setQr(data);
      })
      .finally(() => {
        if (active) setLoadingQr(false);
      });

    return () => {
      active = false;
    };
  }, [order, isPaid]);

  const handlePay = async () => {
    if (!order) return;

    const confirmed = await confirm({
      title: 'ยืนยันรับชำระเงิน',
      content: `ออเดอร์ ${order.orderNumber} ของ ${order.customerName} ยอด ฿${order.total.toLocaleString('th-TH')} ชำระเงินแล้วใช่หรือไม่?`,
      confirmLabel: 'ชำระแล้ว',
      confirmColor: 'success',
    });
    if (!confirmed) return;

    setPaying(true);
    try {
      await markTakeawayOrderPaid(order.id);
      const paidAt = new Date().toISOString();
      onPaid(order.id, paidAt);
      toast.success(`รับชำระออเดอร์ ${order.orderNumber} แล้ว`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('บันทึกการชำระเงินไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <Dialog open={!!order} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {isPaid ? 'รายละเอียดบิล' : 'เช็คบิล'} {order?.orderNumber}
          <IconButton onClick={onClose}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </DialogTitle>

        {order && (
          <>
            <DialogContent dividers>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: isPaid ? 12 : 7 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {order.customerName} · {fTime(order.createdAt)} น.
                  </Typography>

                  <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                    {order.items.map((item) => (
                      <Stack key={item.id} direction="row" justifyContent="space-between">
                        <Typography variant="body2">
                          {item.name} × {item.quantity}
                        </Typography>
                        <Typography variant="body2">
                          {(item.price * item.quantity).toLocaleString('th-TH')} บาท
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">ยอดรวม</Typography>
                    <Typography variant="h6" color="primary.main">
                      {order.total.toLocaleString('th-TH')} บาท
                    </Typography>
                  </Stack>
                </Grid>

                {!isPaid && (
                  <Grid size={{ xs: 5 }}>
                    <Stack alignItems="center" spacing={1.5}>
                      {loadingQr ? (
                        <Box sx={{ py: 6 }}>
                          <CircularProgress size={28} />
                        </Box>
                      ) : qr?.promptPayQrUrl ? (
                        <>
                          <Box
                            component="img"
                            src={qr.promptPayQrUrl}
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
                            สแกน QR ของร้านและตรวจสอบยอด {order.total.toLocaleString('th-TH')} บาท
                          </Typography>
                        </>
                      ) : qr?.promptPayPayload ? (
                        <>
                          <QRCodeSVG value={qr.promptPayPayload} size={200} level="M" marginSize={2} />
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
                  </Grid>
                )}
              </Grid>

              {isPaid && (
                <Stack alignItems="center" spacing={0.5} sx={{ pt: 2 }}>
                  <Chip size="small" color="success" label="ชำระเงินแล้ว" />
                  {order.paidAt && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      ชำระเมื่อ {fDateTime(order.paidAt)}
                    </Typography>
                  )}
                </Stack>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              {isPaid ? (
                <Button fullWidth variant="outlined" size="large" onClick={onClose}>
                  ปิดหน้าต่าง
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  size="large"
                  loading={paying}
                  onClick={handlePay}
                  startIcon={<Iconify icon="solar:check-circle-bold" />}
                >
                  รับชำระแล้ว
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {confirmDialog}
    </>
  );
}
