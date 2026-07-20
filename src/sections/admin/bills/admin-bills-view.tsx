'use client';

import type { Dayjs } from 'dayjs';
import type { BillSummary } from 'src/lib/order-service';
import type { DateRangePresetKey } from 'src/utils/business-hours';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { fTime, fDateTime } from 'src/utils/format-time';
import { getDateRangePreset } from 'src/utils/business-hours';

import { BillDialog } from '../orders/bill-dialog';
import { listBillHistoryAdmin } from '../orders/table-session-actions';

// ----------------------------------------------------------------------

const DATE_FORMAT = 'YYYY-MM-DD';

type PresetKey = DateRangePresetKey;

const PRESETS: { value: PresetKey; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'today', label: 'วันนี้' },
  { value: 'yesterday', label: 'เมื่อวานนี้' },
  { value: 'last7', label: '7 วันล่าสุด' },
  { value: 'thisMonth', label: 'เดือนนี้' },
  { value: 'lastMonth', label: 'เดือนที่แล้ว' },
];

type Props = {
  initialBills: BillSummary[];
};

export function AdminBillsView({ initialBills }: Props) {
  const [bills, setBills] = useState(initialBills);
  const [preset, setPreset] = useState<PresetKey>('all');
  const [from, setFrom] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeBill, setActiveBill] = useState<BillSummary | null>(null);
  const [statusTab, setStatusTab] = useState<'open' | 'closed'>('open');

  const fetchBills = useCallback(async (nextFrom: Dayjs | null, nextTo: Dayjs | null) => {
    setLoading(true);
    try {
      const data = await listBillHistoryAdmin({
        from: nextFrom ? nextFrom.format(DATE_FORMAT) : undefined,
        to: nextTo ? nextTo.format(DATE_FORMAT) : undefined,
      });
      setBills(data);
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

  const handlePreset = (value: PresetKey) => {
    setPreset(value);
    const range = getDateRangePreset(value);
    setFrom(range.from);
    setTo(range.to);
  };

  const handleFromChange = (value: Dayjs | null) => {
    setPreset('all');
    setFrom(value ? value.startOf('day') : null);
  };

  const handleToChange = (value: Dayjs | null) => {
    setPreset('all');
    setTo(value ? value.endOf('day') : null);
  };

  const handleTableClosed = (sessionId: string) => {
    setBills((prev) =>
      prev.map((bill) =>
        bill.id === sessionId
          ? { ...bill, status: 'closed', closedAt: new Date().toISOString() }
          : bill
      )
    );
  };

  const summary = useMemo(() => {
    const closedBills = bills.filter((bill) => bill.status === 'closed');
    const openCount = bills.length - closedBills.length;
    return {
      count: bills.length,
      openCount,
      closedCount: closedBills.length,
      total: closedBills.reduce((sum, bill) => sum + bill.total, 0),
    };
  }, [bills]);

  const visibleBills = useMemo(
    () => bills.filter((bill) => bill.status === statusTab),
    [bills, statusTab]
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        เช็คบิล
      </Typography>

      <Stack
        spacing={1.5}
        sx={{ mb: 2 }}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {PRESETS.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              onClick={() => handlePreset(item.value)}
              color={preset === item.value ? 'primary' : 'default'}
              variant={preset === item.value ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <DatePicker
            label="จากวันที่"
            value={from}
            onChange={handleFromChange}
            slotProps={{ textField: { size: 'small' } }}
            sx={{ maxWidth: 200 }}
          />
          <DatePicker
            label="ถึงวันที่"
            value={to}
            onChange={handleToChange}
            slotProps={{ textField: { size: 'small' } }}
            sx={{ maxWidth: 200 }}
          />
        </Stack>
      </Stack>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {loading
          ? 'กำลังโหลด...'
          : `${summary.count} บิล (เปิดอยู่ ${summary.openCount}) · ยอดขาย ${summary.total.toLocaleString('th-TH')} บาท`}
      </Typography>

      <Tabs
        value={statusTab}
        onChange={(_, value) => setStatusTab(value)}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab value="open" label={`เปิดอยู่ (${summary.openCount})`} />
        <Tab value="closed" label={`ปิดแล้ว (${summary.closedCount})`} />
      </Tabs>

      {visibleBills.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 8 }}>
          {statusTab === 'open' ? 'ไม่มีโต๊ะที่เปิดอยู่' : 'ไม่พบบิลที่ปิดแล้วในช่วงเวลาที่เลือก'}
        </Typography>
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
          {visibleBills.map((bill) => (
            <ButtonBase
              key={bill.id}
              onClick={() => setActiveBill(bill)}
              sx={{ display: 'block', textAlign: 'left', borderRadius: 2 }}
            >
              <Stack
                spacing={1}
                sx={{
                  p: 2.25,
                  borderRadius: 2,
                  bgcolor: 'common.white',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1">โต๊ะ {bill.tableNumber}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {bill.orderCount} ออเดอร์
                  </Typography>
                </Stack>

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {bill.status === 'open'
                    ? `เปิดเมื่อ ${fTime(bill.openedAt)}`
                    : `ปิดเมื่อ ${fDateTime(bill.closedAt)}`}
                </Typography>

                <Typography variant="h6" color="primary.main">
                  {bill.total.toLocaleString('th-TH')} บาท
                </Typography>
              </Stack>
            </ButtonBase>
          ))}
        </Box>
      )}

      <BillDialog
        session={activeBill}
        onClose={() => setActiveBill(null)}
        onTableClosed={handleTableClosed}
      />
    </Box>
  );
}
