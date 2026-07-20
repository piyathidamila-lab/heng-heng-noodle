'use client';

import type { IconifyName } from 'src/components/iconify';
import type { OrderStatus, OrderRecord, TableSessionSummary } from 'src/lib/order-service';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { fTime } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { useNewOrderAlert } from 'src/sections/admin/orders/use-new-order-alert';
import { useOrdersRealtime } from 'src/sections/admin/orders/use-orders-realtime';
import { listOpenTableSessions } from 'src/sections/admin/orders/table-session-actions';
import { listOrdersAdmin, updateOrderStatus } from 'src/sections/admin/orders/order-admin-actions';
import {
  NEXT_STATUS,
  STATUS_COLOR,
  STATUS_LABEL,
} from 'src/sections/admin/orders/order-status-config';

import { StaffManageOrdersDialog } from './staff-manage-orders-dialog';

// ----------------------------------------------------------------------

const STATUS_STYLE: Record<OrderStatus, { accent: string; soft: string; icon: IconifyName }> = {
  pending: { accent: '#B76E00', soft: '#FFF6DD', icon: 'solar:clock-circle-bold' },
  preparing: { accent: '#1976D2', soft: '#EAF4FF', icon: 'solar:cup-star-bold' },
  served: { accent: '#118D57', soft: '#E5F8ED', icon: 'solar:check-circle-bold' },
  completed: { accent: '#637381', soft: '#F4F6F8', icon: 'solar:check-circle-bold' },
  cancelled: { accent: '#B71D18', soft: '#FFE9E7', icon: 'solar:close-circle-bold' },
};

type Props = {
  mode: 'dine-in' | 'takeaway';
  initialOrders: OrderRecord[];
  initialSessions: TableSessionSummary[];
};

function formatBaht(value: number): string {
  return `฿${value.toLocaleString('th-TH')}`;
}

function getWaitLabel(createdAt: string, now: number | null): string {
  if (!now) return '';

  const minutes = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
  if (minutes < 1) return 'เพิ่งเข้ามา';
  if (minutes < 60) return `รอมา ${minutes} นาที`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `รอมา ${hours} ชม. ${remainingMinutes} นาที` : `รอมา ${hours} ชม.`;
}

export function StaffOrdersView({ mode, initialOrders, initialSessions }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [sessions, setSessions] = useState(initialSessions);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [activeSession, setActiveSession] = useState<TableSessionSummary | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const orderIds = useMemo(
    () => orders.filter((order) => order.orderType === mode).map((order) => order.id),
    [mode, orders]
  );
  useNewOrderAlert(orderIds, {
    showSnackbar: true,
    showBrowserNotification: true,
    title: mode === 'dine-in' ? 'มีออเดอร์ในร้านใหม่!' : 'มีออเดอร์กลับบ้านใหม่!',
  });

  const refreshBoard = useCallback(async () => {
    try {
      const [nextOrders, nextSessions] = await Promise.all([
        listOrdersAdmin(),
        listOpenTableSessions(),
      ]);
      setOrders(nextOrders);
      setSessions(nextSessions);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useOrdersRealtime({ onChange: refreshBoard });

  // Ticks the "waited X minutes" labels independent of data refresh — realtime
  // events fire on order changes, not on a clock, so this keeps them live.
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  const takeawayOrders = useMemo(
    () => orders.filter((order) => order.orderType === 'takeaway'),
    [orders]
  );
  const activeTakeawayOrders = useMemo(
    () =>
      takeawayOrders.filter(
        (order) => order.status !== 'completed' && order.status !== 'cancelled'
      ),
    [takeawayOrders]
  );
  const visibleOrders = filter === 'active' ? activeTakeawayOrders : takeawayOrders;
  const pendingCount = activeTakeawayOrders.filter((order) => order.status === 'pending').length;
  const preparingCount = activeTakeawayOrders.filter(
    (order) => order.status === 'preparing'
  ).length;
  const dineInOrderCount = sessions.reduce((sum, session) => sum + session.orderCount, 0);
  const dineInPendingCount = sessions.reduce(
    (sum, session) => sum + (session.statusCounts.pending ?? 0),
    0
  );
  const dineInPreparingCount = sessions.reduce(
    (sum, session) => sum + (session.statusCounts.preparing ?? 0),
    0
  );

  const summaryStats =
    mode === 'dine-in'
      ? [
          {
            label: 'โต๊ะที่เปิด',
            value: sessions.length,
            unit: 'โต๊ะ',
            icon: 'solar:users-group-rounded-bold' as IconifyName,
            color: '#118D57',
            soft: '#E5F8ED',
          },
          {
            label: 'ออเดอร์ในร้าน',
            value: dineInOrderCount,
            unit: 'ออเดอร์',
            icon: 'solar:bill-list-bold-duotone' as IconifyName,
            color: '#8B1111',
            soft: '#FFF0ED',
          },
          {
            label: 'รอเริ่มทำ',
            value: dineInPendingCount,
            unit: 'ออเดอร์',
            icon: 'solar:clock-circle-bold' as IconifyName,
            color: '#B76E00',
            soft: '#FFF6DD',
          },
          {
            label: 'กำลังทำ',
            value: dineInPreparingCount,
            unit: 'ออเดอร์',
            icon: 'solar:cup-star-bold' as IconifyName,
            color: '#1976D2',
            soft: '#EAF4FF',
          },
        ]
      : [
          {
            label: 'กำลังดำเนินการ',
            value: activeTakeawayOrders.length,
            unit: 'ออเดอร์',
            icon: 'solar:bill-list-bold-duotone' as IconifyName,
            color: '#8B1111',
            soft: '#FFF0ED',
          },
          {
            label: 'ออเดอร์ทั้งหมด',
            value: takeawayOrders.length,
            unit: 'ออเดอร์',
            icon: 'solar:archive-down-minimlistic-bold' as IconifyName,
            color: '#637381',
            soft: '#F4F6F8',
          },
          {
            label: 'รอเริ่มทำ',
            value: pendingCount,
            unit: 'ออเดอร์',
            icon: 'solar:clock-circle-bold' as IconifyName,
            color: '#B76E00',
            soft: '#FFF6DD',
          },
          {
            label: 'กำลังทำ',
            value: preparingCount,
            unit: 'ออเดอร์',
            icon: 'solar:cup-star-bold' as IconifyName,
            color: '#1976D2',
            soft: '#EAF4FF',
          },
        ];

  const updateStatusOptimistically = async (order: OrderRecord, status: OrderStatus) => {
    const previousStatus = order.status;
    setOrders((current) =>
      current.map((item) => (item.id === order.id ? { ...item, status } : item))
    );

    try {
      await updateOrderStatus(order.id, status);
    } catch (error) {
      console.error(error);
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, status: previousStatus } : item))
      );
      toast.error('อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  const handleAdvance = async (order: OrderRecord) => {
    const next = NEXT_STATUS[order.status];
    if (next) await updateStatusOptimistically(order, next.status);
  };

  const handleCancel = async (order: OrderRecord) => {
    const confirmed = await confirm({
      title: 'ยืนยันยกเลิกออเดอร์',
      content: `ต้องการยกเลิกออเดอร์ ${order.orderNumber} ใช่หรือไม่?`,
      confirmLabel: 'ยกเลิกออเดอร์',
    });
    if (confirmed) await updateStatusOptimistically(order, 'cancelled');
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: 3,
          color: 'common.white',
          background: 'linear-gradient(135deg, #67100E 0%, #9E1B16 58%, #D25125 100%)',
          boxShadow: '0 14px 34px rgba(103,16,14,0.18)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 180,
            height: 180,
            top: -100,
            right: -40,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.08)',
          }}
        />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          gap={2}
          sx={{ position: 'relative' }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 50,
                height: 50,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2.25,
                bgcolor: 'rgba(255,255,255,0.14)',
              }}
            >
              <Iconify icon="solar:bill-list-bold-duotone" width={28} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: 'common.white' }}>
                {mode === 'dine-in' ? 'ออเดอร์ในร้าน' : 'ออเดอร์กลับบ้าน'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.25, opacity: 0.78 }}>
                ดูรายการและอัปเดตสถานะได้จากหน้านี้
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E' }} />}
            label="อัปเดตอัตโนมัติทุก 5 วินาที"
            sx={{
              color: 'common.white',
              bgcolor: 'rgba(255,255,255,0.14)',
              '& .MuiChip-icon': { ml: 1.25 },
            }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 4,
        }}
      >
        {summaryStats.map((stat) => (
          <Stack
            key={stat.label}
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              p: { xs: 1.5, sm: 2 },
              minHeight: 98,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'grey.200',
              bgcolor: 'common.white',
              boxShadow: '0 6px 18px rgba(33,43,54,0.05)',
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                display: 'grid',
                flexShrink: 0,
                placeItems: 'center',
                borderRadius: 2,
                color: stat.color,
                bgcolor: stat.soft,
              }}
            >
              <Iconify icon={stat.icon} width={23} />
            </Box>
            <Box>
              <Stack direction="row" spacing={0.5} alignItems="baseline">
                <Typography variant="h4">{stat.value}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {stat.unit}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {stat.label}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Box>

      {mode === 'dine-in' && (
        <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5">โต๊ะที่กำลังใช้งาน</Typography>
              <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
                แตะการ์ดเพื่อดูรายการอาหารและจัดการออเดอร์ของโต๊ะ
              </Typography>
            </Box>
            <Chip label={`${sessions.length} โต๊ะ`} color="success" />
          </Stack>

          {sessions.length === 0 ? (
            <Stack
              alignItems="center"
              spacing={1}
              sx={{ p: 4, mb: 4, borderRadius: 3, bgcolor: 'common.white' }}
            >
              <Box sx={{ fontSize: 38 }}>🪑</Box>
              <Typography variant="subtitle1">ยังไม่มีโต๊ะที่เปิดอยู่</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                เมื่อมีลูกค้าสั่งอาหารที่โต๊ะ รายการจะแสดงที่นี่
              </Typography>
            </Stack>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(3, minmax(0, 1fr))',
                },
                mb: 4,
              }}
            >
              {sessions.map((session) => (
                <ButtonBase
                  key={session.id}
                  onClick={() => setActiveSession(session)}
                  aria-label={`ดูออเดอร์โต๊ะ ${session.tableNumber}`}
                  sx={{ display: 'block', textAlign: 'left', borderRadius: 3 }}
                >
                  <Stack
                    spacing={1.5}
                    sx={{
                      height: 1,
                      p: 2,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      bgcolor: 'common.white',
                      boxShadow: '0 6px 20px rgba(33,43,54,0.05)',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 9px 24px rgba(33,43,54,0.09)',
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: 2,
                            bgcolor: '#FFF0ED',
                            fontSize: 25,
                          }}
                        >
                          🪑
                        </Box>
                        <Box>
                          <Typography variant="h5">โต๊ะ {session.tableNumber}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            เปิดเมื่อ {fTime(session.openedAt)} น.
                          </Typography>
                        </Box>
                      </Stack>
                      <Iconify icon="solar:double-alt-arrow-right-bold-duotone" width={22} />
                    </Stack>

                    <Stack direction="row" spacing={2}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          จำนวนออเดอร์
                        </Typography>
                        <Typography variant="subtitle1">{session.orderCount} รายการ</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          ยอดรวม
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: 'primary.main' }}>
                          {formatBaht(session.total)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {(Object.keys(session.statusCounts) as OrderStatus[]).map((status) => (
                        <Chip
                          key={status}
                          size="small"
                          color={STATUS_COLOR[status]}
                          label={`${STATUS_LABEL[status]} ${session.statusCounts[status]}`}
                        />
                      ))}
                    </Stack>
                  </Stack>
                </ButtonBase>
              ))}
            </Box>
          )}
        </>
      )}

      {mode === 'takeaway' && (
        <>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            gap={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h5">ออเดอร์รับกลับบ้าน</Typography>
              <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
                รายการใหม่อยู่ด้านบน อัปเดตสถานะตามลำดับการทำงาน
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`กำลังดำเนินการ ${activeTakeawayOrders.length}`}
                onClick={() => setFilter('active')}
                color={filter === 'active' ? 'primary' : 'default'}
                variant={filter === 'active' ? 'filled' : 'outlined'}
              />
              <Chip
                label={`ทั้งหมด ${takeawayOrders.length}`}
                onClick={() => setFilter('all')}
                color={filter === 'all' ? 'primary' : 'default'}
                variant={filter === 'all' ? 'filled' : 'outlined'}
              />
            </Stack>
          </Stack>

          {visibleOrders.length === 0 ? (
            <Stack
              alignItems="center"
              spacing={1.25}
              sx={{ p: { xs: 4, sm: 6 }, borderRadius: 3, bgcolor: 'common.white' }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  color: 'text.disabled',
                  bgcolor: 'grey.100',
                }}
              >
                <Iconify icon="solar:bill-list-bold-duotone" width={32} />
              </Box>
              <Typography variant="h6">ไม่มีออเดอร์ในรายการนี้</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                ออเดอร์รับกลับบ้านรายการใหม่จะแสดงขึ้นโดยอัตโนมัติ
              </Typography>
            </Stack>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, minmax(0, 1fr))',
                  xl: 'repeat(3, minmax(0, 1fr))',
                },
              }}
            >
              {visibleOrders.map((order) => {
                const next = NEXT_STATUS[order.status];
                const style = STATUS_STYLE[order.status];
                const waitLabel = getWaitLabel(order.createdAt, now);

                return (
                  <Stack
                    key={order.id}
                    sx={{
                      position: 'relative',
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
                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                            sx={{ mt: 0.5 }}
                          >
                            <Iconify
                              icon="solar:clock-circle-bold"
                              width={17}
                              sx={{ color: 'text.secondary' }}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {fTime(order.createdAt)} น.{waitLabel ? ` · ${waitLabel}` : ''}
                            </Typography>
                          </Stack>
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

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ p: 1.25, borderRadius: 2, bgcolor: 'grey.50' }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: '50%',
                            color: 'primary.main',
                            bgcolor: 'primary.lighter',
                          }}
                        >
                          <Iconify icon="solar:user-id-bold" width={19} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            ชื่อลูกค้า
                          </Typography>
                          <Typography variant="subtitle1">{order.customerName}</Typography>
                        </Box>
                      </Stack>

                      <Stack spacing={0.75}>
                        {order.items.map((item) => (
                          <Stack
                            key={item.id}
                            direction="row"
                            spacing={1}
                            alignItems="flex-start"
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
                            <Typography
                              variant="body2"
                              sx={{ flexShrink: 0, color: 'text.secondary' }}
                            >
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
                          <Iconify icon={'solar:danger-triangle-bold' as IconifyName} width={20} />
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
                        <Typography variant="subtitle1">ยอดรวม</Typography>
                        <Typography variant="h5" sx={{ color: 'primary.main' }}>
                          {formatBaht(order.total)}
                        </Typography>
                      </Stack>

                      {(next || order.status === 'pending' || order.status === 'preparing') && (
                        <Stack direction="row" spacing={1}>
                          {next && (
                            <Button
                              variant="contained"
                              fullWidth
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
                              onClick={() => handleCancel(order)}
                            >
                              ยกเลิก
                            </Button>
                          )}
                        </Stack>
                      )}
                    </Stack>
                  </Stack>
                );
              })}
            </Box>
          )}
        </>
      )}

      <StaffManageOrdersDialog
        session={activeSession}
        onClose={() => setActiveSession(null)}
        onMoved={(newTableNumber) => {
          setActiveSession((current) =>
            current ? { ...current, tableNumber: newTableNumber } : current
          );
          refreshBoard().catch((error) => console.error(error));
        }}
      />
      {dialog}
    </Box>
  );
}
