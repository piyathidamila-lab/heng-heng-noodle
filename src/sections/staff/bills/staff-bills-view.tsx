'use client';

import type { Dayjs } from 'dayjs';
import type { DateRangePresetKey } from 'src/utils/business-hours';
import type { OrderRecord, BillSummary } from 'src/lib/order-service';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { Box, Card } from '@mui/material';
import Collapse from '@mui/material/Collapse';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { fTime, fDateTime } from 'src/utils/format-time';
import { getDateRangePreset } from 'src/utils/business-hours';

import { Iconify } from 'src/components/iconify';

import { BillDialog } from 'src/sections/admin/orders/bill-dialog';
import {
  listBillHistoryAdmin,
  listTakeawayBillHistoryAdmin,
} from 'src/sections/admin/orders/table-session-actions';

import { TakeawayBillDialog } from './takeaway-bill-dialog';
import { StaffPageHero } from '../components/staff-page-hero';

// ----------------------------------------------------------------------

const DATE_FORMAT = 'YYYY-MM-DD';
type PresetKey = Exclude<DateRangePresetKey, 'lastMonth'>;

const PRESETS: { value: PresetKey; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'today', label: 'วันนี้' },
  { value: 'yesterday', label: 'เมื่อวาน' },
  { value: 'last7', label: '7 วันล่าสุด' },
  { value: 'thisMonth', label: 'เดือนนี้' },
];

type Props = {
  initialBills: BillSummary[];
  initialTakeawayBills: OrderRecord[];
};

export function StaffBillsView({ initialBills, initialTakeawayBills }: Props) {
  const [bills, setBills] = useState(initialBills);
  const [takeawayBills, setTakeawayBills] = useState(initialTakeawayBills);
  // Default to whichever type actually has something waiting to be paid, so a
  // takeaway order sitting unpaid isn't missed just because dine-in loads first
  // and looks empty — falls back to dine-in when both/neither have anything open.
  const [billType, setBillType] = useState<'dine-in' | 'takeaway'>(() => {
    const hasOpenDineIn = initialBills.some((bill) => bill.status === 'open');
    const hasOpenTakeaway = initialTakeawayBills.some((order) => order.paymentStatus === 'unpaid');
    return !hasOpenDineIn && hasOpenTakeaway ? 'takeaway' : 'dine-in';
  });
  const [preset, setPreset] = useState<PresetKey>('all');
  const [from, setFrom] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeBill, setActiveBill] = useState<BillSummary | null>(null);
  const [activeTakeawayOrder, setActiveTakeawayOrder] = useState<OrderRecord | null>(null);
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [showCustomRange, setShowCustomRange] = useState(false);

  const fetchBills = useCallback(async (nextFrom: Dayjs | null, nextTo: Dayjs | null) => {
    setLoading(true);
    try {
      const filter = {
        from: nextFrom?.format(DATE_FORMAT),
        to: nextTo?.format(DATE_FORMAT),
      };
      const [nextBills, nextTakeawayBills] = await Promise.all([
        listBillHistoryAdmin(filter),
        listTakeawayBillHistoryAdmin(filter),
      ]);
      setBills(nextBills);
      setTakeawayBills(nextTakeawayBills);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (preset === 'all' && !from && !to) return;
    fetchBills(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const tableSummary = useMemo(() => {
    const closed = bills.filter((bill) => bill.status === 'closed');
    return {
      open: bills.length - closed.length,
      closed: closed.length,
      total: closed.reduce((sum, bill) => sum + bill.total, 0),
    };
  }, [bills]);
  const visibleBills = bills.filter((bill) => bill.status === status);
  const takeawaySummary = useMemo(() => {
    const paid = takeawayBills.filter((order) => order.paymentStatus === 'paid');
    return {
      open: takeawayBills.length - paid.length,
      closed: paid.length,
      total: paid.reduce((sum, order) => sum + order.total, 0),
    };
  }, [takeawayBills]);
  const summary = billType === 'dine-in' ? tableSummary : takeawaySummary;
  const visibleTakeawayBills = takeawayBills.filter((order) =>
    status === 'open' ? order.paymentStatus === 'unpaid' : order.paymentStatus === 'paid'
  );

  const handlePreset = (value: PresetKey) => {
    const range = getDateRangePreset(value);
    setPreset(value);
    setFrom(range.from);
    setTo(range.to);
  };

  const handleTableClosed = (id: string) => {
    setBills((current) =>
      current.map((bill) =>
        bill.id === id ? { ...bill, status: 'closed', closedAt: new Date().toISOString() } : bill
      )
    );
  };

  const handleTakeawayPaid = (orderId: string, paidAt: string) => {
    setTakeawayBills((current) =>
      current.map((item) =>
        item.id === orderId ? { ...item, paymentStatus: 'paid', paidAt } : item
      )
    );
  };

  return (
    <Box sx={{ pb: 4 }}>
      <StaffPageHero
        title="เช็คบิล"
        subtitle="ตรวจยอดและรับชำระเงินทั้งออเดอร์ในร้านและกลับบ้าน"
        icon="solar:bill-list-bold-duotone"
        badge={summary.open > 0 ? `รอเช็คบิล ${summary.open} รายการ` : 'ไม่มีรายการค้างชำระ'}
      />
      <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.75} sx={{ mb: 1 }}>
          {PRESETS.map((item) => (
            <Chip
              key={item.value}
              size="small"
              label={item.label}
              onClick={() => {
                setShowCustomRange(false);
                handlePreset(item.value);
              }}
              color={preset === item.value ? 'primary' : 'default'}
              variant={preset === item.value ? 'filled' : 'outlined'}
            />
          ))}
          <Chip
            size="small"
            icon={<Iconify icon="solar:calendar-date-bold" width={15} />}
            label="กำหนดเอง"
            onClick={() => setShowCustomRange((current) => !current)}
            color={showCustomRange ? 'primary' : 'default'}
            variant={showCustomRange ? 'filled' : 'outlined'}
          />
          {loading && <Chip size="small" label="กำลังโหลด..." color="info" />}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            label={`ออเดอร์ในร้าน ${tableSummary.open}`}
            onClick={() => setBillType('dine-in')}
            color={billType === 'dine-in' ? 'primary' : 'default'}
            variant={billType === 'dine-in' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`ออเดอร์กลับบ้าน ${takeawaySummary.open}`}
            onClick={() => setBillType('takeaway')}
            color={billType === 'takeaway' ? 'primary' : 'default'}
            variant={billType === 'takeaway' ? 'filled' : 'outlined'}
          />
        </Stack>
      </Stack>
      <Collapse in={showCustomRange}>
        <Card sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1, pt: 0.5 }}>
            <DatePicker
              label="จากวันที่"
              value={from}
              onChange={(value) => {
                setPreset('all');
                setFrom(value?.startOf('day') ?? null);
              }}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
            <DatePicker
              label="ถึงวันที่"
              value={to}
              onChange={(value) => {
                setPreset('all');
                setTo(value?.endOf('day') ?? null);
              }}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Stack>
        </Card>
      </Collapse>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          my: 2,
        }}
      >
        {[
          [
            billType === 'dine-in' ? 'โต๊ะที่รอชำระ' : 'กลับบ้านที่รอชำระ',
            summary.open,
            billType === 'dine-in' ? 'โต๊ะ' : 'ออเดอร์',
            '🧾',
            '#FFF6DD',
          ],
          ['ชำระแล้ว', summary.closed, 'บิล', '✅', '#E5F8ED'],
          ['ยอดชำระแล้ว', `฿${summary.total.toLocaleString('th-TH')}`, '', '💰', '#EAF4FF'],
        ].map(([label, value, unit, emoji, color]) => (
          <Stack
            key={label}
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ p: 1.25, borderRadius: 2, bgcolor: 'common.white' }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 1.5,
                bgcolor: color,
                fontSize: 16,
              }}
            >
              {emoji}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', lineHeight: 1.2 }}
                noWrap
              >
                {label}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="baseline">
                <Typography variant="subtitle1" noWrap>
                  {value}
                </Typography>
                {unit && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {unit}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        ))}
      </Box>

      <Stack direction="row" spacing={1} sx={{ my: 2 }}>
        <Chip
          label={`รอชำระ ${summary.open}`}
          onClick={() => setStatus('open')}
          color={status === 'open' ? 'primary' : 'default'}
          variant={status === 'open' ? 'filled' : 'outlined'}
        />
        <Chip
          label={`ชำระแล้ว ${summary.closed}`}
          onClick={() => setStatus('closed')}
          color={status === 'closed' ? 'primary' : 'default'}
          variant={status === 'closed' ? 'filled' : 'outlined'}
        />
      </Stack>

      {billType === 'dine-in' ? (
        visibleBills.length === 0 ? (
          <Stack
            alignItems="center"
            spacing={1.25}
            sx={{ p: 6, borderRadius: 3, bgcolor: 'common.white' }}
          >
            <Box sx={{ fontSize: 42 }}>{status === 'open' ? '🎉' : '🧾'}</Box>
            <Typography variant="h6">
              {status === 'open' ? 'ไม่มีโต๊ะค้างชำระ' : 'ไม่พบบิลที่ชำระแล้ว'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {status === 'open' ? 'ทุกโต๊ะได้รับการจัดการเรียบร้อยแล้ว' : 'ลองเลือกช่วงเวลาอื่น'}
            </Typography>
          </Stack>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            }}
          >
            {visibleBills.map((bill) => {
              const isOpen = bill.status === 'open';
              return (
                <ButtonBase
                  key={bill.id}
                  onClick={() => setActiveBill(bill)}
                  aria-label={`${isOpen ? 'เช็คบิล' : 'ดูบิล'} โต๊ะ ${bill.tableNumber}`}
                  sx={{ display: 'block', textAlign: 'left', borderRadius: 3 }}
                >
                  <Stack
                    spacing={1.5}
                    sx={{
                      height: 1,
                      p: 2,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: isOpen ? '#F1CB79' : '#B5E2C8',
                      bgcolor: 'common.white',
                      boxShadow: '0 6px 20px rgba(33,43,54,0.05)',
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
                            bgcolor: isOpen ? '#FFF6DD' : '#E5F8ED',
                            fontSize: 25,
                          }}
                        >
                          {isOpen ? '🧾' : '✅'}
                        </Box>
                        <Box>
                          <Typography variant="h5">โต๊ะ {bill.tableNumber}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {bill.orderCount} ออเดอร์
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip
                        size="small"
                        label={isOpen ? 'รอชำระ' : 'ชำระแล้ว'}
                        color={isOpen ? 'warning' : 'success'}
                      />
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {isOpen
                        ? `เปิดเมื่อ ${fTime(bill.openedAt)} น.`
                        : `ปิดเมื่อ ${fDateTime(bill.closedAt)}`}
                    </Typography>
                    <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          ยอดสุทธิ
                        </Typography>
                        <Typography variant="h4" sx={{ color: 'primary.main' }}>
                          ฿{bill.total.toLocaleString('th-TH')}
                        </Typography>
                      </Box>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ color: 'primary.main' }}
                      >
                        <Typography variant="subtitle2">
                          {isOpen ? 'เช็คบิล' : 'ดูรายละเอียด'}
                        </Typography>
                        <Iconify icon="solar:double-alt-arrow-right-bold-duotone" width={18} />
                      </Stack>
                    </Stack>
                  </Stack>
                </ButtonBase>
              );
            })}
          </Box>
        )
      ) : visibleTakeawayBills.length === 0 ? (
        <Stack
          alignItems="center"
          spacing={1.25}
          sx={{ p: 6, borderRadius: 3, bgcolor: 'common.white' }}
        >
          <Box sx={{ fontSize: 42 }}>{status === 'open' ? '🥡' : '🧾'}</Box>
          <Typography variant="h6">
            {status === 'open' ? 'ไม่มีออเดอร์กลับบ้านค้างชำระ' : 'ไม่พบบิลกลับบ้านที่ชำระแล้ว'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {status === 'open' ? 'ออเดอร์ใหม่จะแสดงที่นี่อัตโนมัติ' : 'ลองเลือกช่วงเวลาอื่น'}
          </Typography>
        </Stack>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          }}
        >
          {visibleTakeawayBills.map((order) => {
            const isPaid = order.paymentStatus === 'paid';

            return (
              <ButtonBase
                key={order.id}
                onClick={() => setActiveTakeawayOrder(order)}
                aria-label={`${isPaid ? 'ดูบิล' : 'เช็คบิล'} ${order.orderNumber}`}
                sx={{ display: 'block', textAlign: 'left', borderRadius: 3 }}
              >
                <Stack
                  spacing={1.5}
                  sx={{
                    height: 1,
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: isPaid ? '#B5E2C8' : '#F1CB79',
                    bgcolor: 'common.white',
                    boxShadow: '0 6px 20px rgba(33,43,54,0.05)',
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Box>
                      <Typography variant="h5">{order.orderNumber}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {order.customerName} · {fTime(order.createdAt)} น.
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={isPaid ? 'ชำระแล้ว' : 'รอชำระ'}
                      color={isPaid ? 'success' : 'warning'}
                    />
                  </Stack>

                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {order.items.length} รายการ
                    {isPaid && order.paidAt ? ` · ชำระเมื่อ ${fDateTime(order.paidAt)}` : ''}
                  </Typography>

                  <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        ยอดสุทธิ
                      </Typography>
                      <Typography variant="h4" sx={{ color: 'primary.main' }}>
                        ฿{order.total.toLocaleString('th-TH')}
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{ color: 'primary.main' }}
                    >
                      <Typography variant="subtitle2">
                        {isPaid ? 'ดูรายละเอียด' : 'เช็คบิล'}
                      </Typography>
                      <Iconify icon="solar:double-alt-arrow-right-bold-duotone" width={18} />
                    </Stack>
                  </Stack>
                </Stack>
              </ButtonBase>
            );
          })}
        </Box>
      )}

      <BillDialog
        session={activeBill}
        onClose={() => setActiveBill(null)}
        onTableClosed={handleTableClosed}
      />
      <TakeawayBillDialog
        order={activeTakeawayOrder}
        onClose={() => setActiveTakeawayOrder(null)}
        onPaid={handleTakeawayPaid}
      />
    </Box>
  );
}
