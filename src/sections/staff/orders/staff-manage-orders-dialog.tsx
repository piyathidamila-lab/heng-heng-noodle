'use client';

import type { IconifyName } from 'src/components/iconify';
import type { RestaurantTableAvailability } from 'src/lib/table-service';
import type { TableBill } from 'src/sections/admin/orders/table-session-actions';
import type { OrderStatus, OrderRecord, TableSessionSummary } from 'src/lib/order-service';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { fTime } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { updateOrderStatus } from 'src/sections/admin/orders/order-admin-actions';
import { listTableAvailability } from 'src/sections/order/table-availability-actions';
import {
  NEXT_STATUS,
  STATUS_LABEL,
} from 'src/sections/admin/orders/order-status-config';
import { getTableBill, moveTableSession } from 'src/sections/admin/orders/table-session-actions';

// ----------------------------------------------------------------------

const POLL_INTERVAL_MS = 5000;
type FilterValue = 'all' | 'pending' | 'preparing' | 'served';

const STATUS_STYLE: Record<
  OrderStatus,
  { accent: string; soft: string; icon: IconifyName }
> = {
  pending: { accent: '#B76E00', soft: '#FFF6DD', icon: 'solar:clock-circle-bold' },
  preparing: { accent: '#1976D2', soft: '#EAF4FF', icon: 'solar:cup-star-bold' },
  served: { accent: '#118D57', soft: '#E5F8ED', icon: 'solar:check-circle-bold' },
  completed: { accent: '#637381', soft: '#F4F6F8', icon: 'solar:check-circle-bold' },
  cancelled: { accent: '#B71D18', soft: '#FFE9E7', icon: 'solar:close-circle-bold' },
};

type Props = {
  session: TableSessionSummary | null;
  onClose: () => void;
  onMoved?: (newTableNumber: string) => void;
};

function formatBaht(value: number): string {
  return `฿${value.toLocaleString('th-TH')}`;
}

export function StaffManageOrdersDialog({ session, onClose, onMoved }: Props) {
  const [bill, setBill] = useState<TableBill | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [moveTargets, setMoveTargets] = useState<RestaurantTableAvailability[] | null>(null);
  const [movingTo, setMovingTo] = useState<string | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const fetchBill = useCallback(async () => {
    if (!session) return;
    const data = await getTableBill(session.id);
    setBill(data);
  }, [session]);

  useEffect(() => {
    if (!session) {
      setBill(null);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setFilter('all');

    const tick = async () => {
      try {
        const data = await getTableBill(session.id);
        if (active) setBill(data);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    };

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [session]);

  const activeOrders = useMemo(
    () =>
      (bill?.orders ?? []).filter(
        (order) => order.status !== 'completed' && order.status !== 'cancelled'
      ),
    [bill]
  );
  const counts = useMemo(
    () => ({
      pending: activeOrders.filter((order) => order.status === 'pending').length,
      preparing: activeOrders.filter((order) => order.status === 'preparing').length,
      served: activeOrders.filter((order) => order.status === 'served').length,
    }),
    [activeOrders]
  );
  const visibleOrders =
    filter === 'all' ? activeOrders : activeOrders.filter((order) => order.status === filter);

  const runOrderAction = async (order: OrderRecord, status: OrderStatus) => {
    setBusyId(order.id);
    try {
      await updateOrderStatus(order.id, status);
      await fetchBill();
      toast.success(`อัปเดต ${order.orderNumber} เป็น “${STATUS_LABEL[status]}” แล้ว`);
    } catch (error) {
      console.error(error);
      toast.error('อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyId(null);
    }
  };

  const handleAdvance = async (order: OrderRecord) => {
    const next = NEXT_STATUS[order.status];
    if (next) await runOrderAction(order, next.status);
  };

  const handleCancel = async (order: OrderRecord) => {
    const confirmed = await confirm({
      title: 'ยืนยันยกเลิกออเดอร์',
      content: `ต้องการยกเลิก ${order.orderNumber} ของคุณ ${order.customerName} ใช่หรือไม่?`,
      confirmLabel: 'ยกเลิกออเดอร์',
    });
    if (confirmed) await runOrderAction(order, 'cancelled');
  };

  const handleOpenMovePicker = async () => {
    setMovePickerOpen(true);
    setMoveTargets(null);
    try {
      const tables = await listTableAvailability();
      setMoveTargets(tables);
    } catch (error) {
      console.error(error);
      toast.error('โหลดรายการโต๊ะไม่สำเร็จ กรุณาลองใหม่');
      setMovePickerOpen(false);
    }
  };

  const handleSelectMoveTarget = async (table: RestaurantTableAvailability) => {
    if (!session) return;

    const confirmed = await confirm({
      title: 'ยืนยันย้ายโต๊ะ',
      content: `ย้ายออเดอร์ทั้งหมดจากโต๊ะ ${session.tableNumber} ไปยังโต๊ะ ${table.label} ใช่หรือไม่?`,
      confirmLabel: 'ย้ายโต๊ะ',
    });
    if (!confirmed) return;

    setMovingTo(table.id);
    try {
      const result = await moveTableSession(session.id, table.label);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`ย้ายโต๊ะไปยังโต๊ะ ${table.label} แล้ว`);
      setMovePickerOpen(false);
      onMoved?.(table.label);
      await fetchBill();
    } catch (error) {
      console.error(error);
      toast.error('ย้ายโต๊ะไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setMovingTo(null);
    }
  };

  return (
    <>
      <Dialog
        open={!!session}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              m: { xs: 1.5, sm: 3 },
              width: { xs: 'calc(100% - 24px)', sm: 1 },
              maxHeight: 'calc(100dvh - 24px)',
              overflow: 'hidden',
              borderRadius: 4,
              bgcolor: '#F7F5F2',
            },
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            px: { xs: 2, sm: 3 },
            py: 2.5,
            color: 'common.white',
            background: 'linear-gradient(135deg, #67100E 0%, #9E1B16 58%, #D25125 100%)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 150,
              height: 150,
              top: -85,
              right: -30,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.08)',
            }}
          />
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 2.25,
                  bgcolor: 'rgba(255,255,255,0.14)',
                  fontSize: 27,
                }}
              >
                🪑
              </Box>
              <Box>
                <Typography variant="h4" sx={{ color: 'common.white' }}>
                  จัดการออเดอร์ · โต๊ะ {session?.tableNumber}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.25, opacity: 0.78 }}>
                  อัปเดตอัตโนมัติทุก 5 วินาที
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                onClick={handleOpenMovePicker}
                startIcon={<Iconify icon="solar:transfer-horizontal-bold-duotone" width={20} />}
                sx={{
                  color: 'common.white',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' },
                }}
              >
                ย้ายโต๊ะ
              </Button>
              <IconButton
                onClick={onClose}
                aria-label="ปิดหน้าต่าง"
                sx={{
                  color: 'common.white',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' },
                }}
              >
                <Iconify icon="mingcute:close-line" />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2, bgcolor: 'common.white' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 1,
            }}
          >
            {[
              ['ทั้งหมด', activeOrders.length, 'all' as FilterValue, '#8B1111', '#FFF0ED'],
              ['รอทำ', counts.pending, 'pending' as FilterValue, '#B76E00', '#FFF6DD'],
              ['กำลังทำ', counts.preparing, 'preparing' as FilterValue, '#1976D2', '#EAF4FF'],
              ['เสิร์ฟแล้ว', counts.served, 'served' as FilterValue, '#118D57', '#E5F8ED'],
            ].map(([label, value, filterValue, accent, soft]) => {
              const selected = filter === filterValue;
              return (
                <Button
                  key={label}
                  variant={selected ? 'contained' : 'outlined'}
                  onClick={() => setFilter(filterValue as FilterValue)}
                  sx={{
                    minWidth: 0,
                    minHeight: { xs: 60, sm: 68 },
                    px: 0.5,
                    borderRadius: 2,
                    color: selected ? 'common.white' : accent,
                    borderColor: accent,
                    bgcolor: selected ? accent : soft,
                    '&:hover': { bgcolor: selected ? accent : soft, borderColor: accent },
                  }}
                >
                  <Stack alignItems="center" spacing={0.1}>
                    <Typography variant="h6" sx={{ color: 'inherit', lineHeight: 1 }}>
                      {value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'inherit' }}>
                      {label}
                    </Typography>
                  </Stack>
                </Button>
              );
            })}
          </Box>
        </Box>

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {loading || !bill ? (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 8 }}>
              <CircularProgress size={32} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                กำลังโหลดออเดอร์...
              </Typography>
            </Stack>
          ) : visibleOrders.length === 0 ? (
            <Stack alignItems="center" spacing={1.25} sx={{ py: 7 }}>
              <Box
                sx={{
                  width: 76,
                  height: 76,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  bgcolor: '#E5F8ED',
                  fontSize: 36,
                }}
              >
                ✅
              </Box>
              <Typography variant="h5">
                {activeOrders.length === 0 ? 'ออเดอร์เสร็จครบแล้ว' : 'ไม่มีออเดอร์ในสถานะนี้'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                {activeOrders.length === 0
                  ? 'รายการที่เสร็จสิ้นแล้วจะถูกซ่อนออกจากหน้านี้'
                  : 'เลือกดูสถานะอื่นได้จากตัวกรองด้านบน'}
              </Typography>
            </Stack>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              }}
            >
              {visibleOrders.map((order) => {
                const next = NEXT_STATUS[order.status];
                const style = STATUS_STYLE[order.status];
                const isBusy = busyId === order.id;

                return (
                  <Stack
                    key={order.id}
                    sx={{
                      overflow: 'hidden',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      bgcolor: 'common.white',
                      boxShadow: '0 7px 22px rgba(33,43,54,0.06)',
                    }}
                  >
                    <Box sx={{ height: 5, bgcolor: style.accent }} />
                    <Stack spacing={1.5} sx={{ p: 2 }}>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                        <Box>
                          <Typography variant="h5">{order.orderNumber}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {fTime(order.createdAt)} น. · คุณ {order.customerName}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          icon={<Iconify icon={style.icon} width={17} />}
                          label={STATUS_LABEL[order.status]}
                          sx={{
                            color: style.accent,
                            fontWeight: 800,
                            bgcolor: style.soft,
                            '& .MuiChip-icon': { color: 'inherit' },
                          }}
                        />
                      </Stack>

                      <Stack spacing={0.75} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50' }}>
                        {order.items.map((item) => (
                          <Stack
                            key={item.id}
                            direction="row"
                            spacing={1}
                            justifyContent="space-between"
                          >
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              <Box
                                component="span"
                                sx={{ mr: 0.75, color: 'primary.main', fontWeight: 800 }}
                              >
                                {item.quantity}×
                              </Box>
                              {item.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {formatBaht(item.price * item.quantity)}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>

                      {order.note && (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="flex-start"
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            color: 'warning.darker',
                            bgcolor: 'warning.lighter',
                          }}
                        >
                          <Iconify
                            icon={'solar:danger-triangle-bold' as IconifyName}
                            width={20}
                          />
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>
                              หมายเหตุ
                            </Typography>
                            <Typography variant="body2">{order.note}</Typography>
                          </Box>
                        </Stack>
                      )}

                      <Divider />
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle1">รวมออเดอร์นี้</Typography>
                        <Typography variant="h5" sx={{ color: 'primary.main' }}>
                          {formatBaht(order.total)}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        {next && (
                          <Button
                            fullWidth
                            variant="contained"
                            loading={isBusy}
                            onClick={() => handleAdvance(order)}
                            startIcon={<Iconify icon={style.icon} width={20} />}
                          >
                            {next.label}
                          </Button>
                        )}
                        {(order.status === 'pending' || order.status === 'preparing') && (
                          <Button
                            color="error"
                            variant="outlined"
                            disabled={isBusy}
                            onClick={() => handleCancel(order)}
                          >
                            ยกเลิก
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Stack>
                );
              })}
            </Box>
          )}
        </DialogContent>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderTop: '1px solid',
            borderColor: 'grey.200',
            bgcolor: 'common.white',
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              ยอดรวมทั้งโต๊ะ
            </Typography>
            <Typography variant="h5" sx={{ color: 'primary.main' }}>
              {formatBaht(bill?.total ?? 0)}
            </Typography>
          </Box>
          <Button variant="outlined" size="large" onClick={onClose} sx={{ minWidth: 140 }}>
            ปิดหน้าต่าง
          </Button>
        </Stack>
      </Dialog>

      <Dialog
        open={movePickerOpen}
        onClose={() => setMovePickerOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <DialogTitle>ย้ายโต๊ะ {session?.tableNumber} ไปที่...</DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          {!moveTargets ? (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 5 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 1.25,
              }}
            >
              {moveTargets.map((table) => {
                const isCurrent = table.label === session?.tableNumber;
                const isOccupied = table.status === 'occupied';
                const disabled = isCurrent || isOccupied || movingTo !== null;

                return (
                  <ButtonBase
                    key={table.id}
                    disabled={disabled}
                    onClick={() => handleSelectMoveTarget(table)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: isCurrent ? 'primary.main' : 'grey.200',
                      bgcolor: isCurrent ? 'primary.lighter' : 'common.white',
                      opacity: isOccupied && !isCurrent ? 0.5 : 1,
                    }}
                  >
                    <Stack alignItems="center" spacing={0.5} sx={{ width: 1 }}>
                      {movingTo === table.id ? (
                        <CircularProgress size={18} />
                      ) : (
                        <Typography variant="subtitle1">โต๊ะ {table.label}</Typography>
                      )}
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {isCurrent ? 'โต๊ะปัจจุบัน' : isOccupied ? 'ไม่ว่าง' : 'ว่าง'}
                      </Typography>
                    </Stack>
                  </ButtonBase>
                );
              })}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </>
  );
}
