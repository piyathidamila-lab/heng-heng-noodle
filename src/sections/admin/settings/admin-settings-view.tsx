'use client';

import type {
  DayHours,
  WeekdayKey,
  ShopSettings,
  SpecialClosure,
} from 'src/lib/shop-settings-service';

import { useState } from 'react';
import { useSWRConfig } from 'swr';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { Box, Card } from '@mui/material';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { WEEKDAY_LABELS } from 'src/utils/business-hours';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { SHOP_LOGO_API } from 'src/components/logo';

import { updateShopSettings, deleteShopLogoAdmin, uploadShopLogoAdmin } from './settings-actions';

// ----------------------------------------------------------------------

const DISPLAY_ORDER: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

type Props = {
  initialSettings: ShopSettings;
};

export function AdminSettingsView({ initialSettings }: Props) {
  const { mutate } = useSWRConfig();
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savedLogoUrl, setSavedLogoUrl] = useState(initialSettings.logoUrl);

  const handleChange = (patch: Partial<ShopSettings>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleDayChange = (day: WeekdayKey, patch: Partial<DayHours>) => {
    setForm((prev) => ({
      ...prev,
      businessHours: { ...prev.businessHours, [day]: { ...prev.businessHours[day], ...patch } },
    }));
  };

  const handleAddSpecialClosure = () => {
    handleChange({
      specialClosures: [
        ...form.specialClosures,
        { id: `closure-${Date.now()}`, date: '', label: 'วันพระ' },
      ],
    });
  };

  const handleSpecialClosureChange = (id: string, patch: Partial<SpecialClosure>) => {
    handleChange({
      specialClosures: form.specialClosures.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });
  };

  const handleRemoveSpecialClosure = (id: string) => {
    handleChange({
      specialClosures: form.specialClosures.filter((item) => item.id !== id),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await updateShopSettings(form, savedLogoUrl);
      setForm(saved);
      setSavedLogoUrl(saved.logoUrl);
      await mutate(
        SHOP_LOGO_API,
        { name: saved.name, logoUrl: saved.logoUrl },
        { revalidate: false }
      );
      toast.success('บันทึกข้อมูลร้านค้าแล้ว');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const logoUrl = await uploadShopLogoAdmin(file);

      if (form.logoUrl && form.logoUrl !== savedLogoUrl) {
        await deleteShopLogoAdmin(form.logoUrl).catch(() => {});
      }

      handleChange({ logoUrl });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'อัปโหลดโลโก้ไม่สำเร็จ');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (form.logoUrl && form.logoUrl !== savedLogoUrl) {
      await deleteShopLogoAdmin(form.logoUrl).catch(() => {});
    }
    handleChange({ logoUrl: null });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        ข้อมูลร้านค้า
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        ข้อมูลนี้จะแสดงในหน้าสั่งอาหารของลูกค้าและใช้สร้าง QR รับเงิน
      </Typography>

      <Stack spacing={2.5}>
        <Card sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={1}>
                <Typography variant="subtitle1">โลโก้ร้าน</Typography>
                <Upload
                  value={form.logoUrl}
                  loading={uploadingLogo}
                  disabled={uploadingLogo}
                  multiple={false}
                  maxFiles={1}
                  maxSize={5 * 1024 * 1024}
                  accept={{
                    'image/jpeg': ['.jpg', '.jpeg'],
                    'image/png': ['.png'],
                    'image/webp': ['.webp'],
                    'image/gif': ['.gif'],
                  }}
                  onDrop={(acceptedFiles) => void handleLogoDrop(acceptedFiles)}
                  onDelete={() => void handleDeleteLogo()}
                  helperText="แนะนำภาพจัตุรัส รองรับ JPEG, PNG, WEBP และ GIF ไม่เกิน 5MB"
                  sx={{ height: 260, borderRadius: 2.5 }}
                />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={2}>
                <TextField
                  label="ชื่อร้าน"
                  value={form.name}
                  onChange={(e) => handleChange({ name: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="ที่อยู่"
                  value={form.address}
                  onChange={(e) => handleChange({ address: e.target.value })}
                  fullWidth
                  multiline
                  minRows={2}
                />
                <TextField
                  label="เบอร์โทรติดต่อร้าน"
                  value={form.phone}
                  onChange={(e) => handleChange({ phone: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="เลขพร้อมเพย์ของร้าน"
                  value={form.promptPayId}
                  onChange={(e) => handleChange({ promptPayId: e.target.value })}
                  helperText="เบอร์โทรศัพท์หรือเลขบัตรประชาชนที่ผูกพร้อมเพย์ไว้ — ใช้สร้าง QR รับเงินตอนเช็คบิล"
                  fullWidth
                />
              </Stack>
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6">เวลาทำการ</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            ลูกค้าจะสั่งอาหารไม่ได้นอกช่วงเวลาที่ตั้งไว้ของแต่ละวัน
          </Typography>

          <Grid container spacing={1.5}>
            {DISPLAY_ORDER.map((day) => {
              const dayHours = form.businessHours[day];

              return (
                <Grid size={{ xs: 6 }} key={day}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'grey.200',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ width: 88, flexShrink: 0 }}>
                      {WEEKDAY_LABELS[day]}
                    </Typography>

                    <FormControlLabel
                      sx={{ width: 96, flexShrink: 0, mr: 0 }}
                      control={
                        <Switch
                          size="small"
                          checked={!dayHours.closed}
                          onChange={(e) => handleDayChange(day, { closed: !e.target.checked })}
                          inputProps={{ 'aria-label': `เปิด-ปิดร้านวัน${WEEKDAY_LABELS[day]}` }}
                        />
                      }
                      label={dayHours.closed ? 'หยุด' : 'เปิด'}
                    />

                    <TextField
                      type="time"
                      size="small"
                      value={dayHours.open}
                      onChange={(e) => handleDayChange(day, { open: e.target.value })}
                      disabled={dayHours.closed}
                      sx={{ flex: 1 }}
                    />
                    <Typography sx={{ color: 'text.secondary' }}>–</Typography>
                    <TextField
                      type="time"
                      size="small"
                      value={dayHours.close}
                      onChange={(e) => handleDayChange(day, { close: e.target.value })}
                      disabled={dayHours.closed}
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                </Grid>
              );
            })}
          </Grid>
        </Card>

        <Card sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6">วันหยุดพิเศษ</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                เพิ่มวันที่ร้านหยุดนอกตารางประจำ เช่น วันพระ เทศกาล หรือวันหยุดส่วนตัว
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold" width={19} />}
              onClick={handleAddSpecialClosure}
              sx={{ flexShrink: 0 }}
            >
              เพิ่มวันหยุด
            </Button>
          </Stack>

          {form.specialClosures.length === 0 ? (
            <Stack
              alignItems="center"
              spacing={1}
              sx={{
                px: 2,
                py: 3.5,
                borderRadius: 2.5,
                border: '1px dashed',
                borderColor: 'grey.300',
                bgcolor: 'grey.50',
                textAlign: 'center',
              }}
            >
              <Iconify icon="solar:calendar-date-bold" width={30} sx={{ color: 'text.disabled' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ยังไม่มีวันหยุดพิเศษ กด “เพิ่มวันหยุด” เพื่อกำหนดล่วงหน้า
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.25}>
              {form.specialClosures.map((closure) => (
                <Stack
                  key={closure.id}
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  spacing={1.25}
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    bgcolor: 'common.white',
                  }}
                >
                  <TextField
                    type="date"
                    label="วันที่หยุด"
                    size="small"
                    value={closure.date}
                    onChange={(event) =>
                      handleSpecialClosureChange(closure.id, { date: event.target.value })
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: { xs: 1, sm: 190 }, flexShrink: 0 }}
                  />
                  <TextField
                    label="เหตุผล"
                    placeholder="เช่น วันพระ"
                    size="small"
                    value={closure.label}
                    onChange={(event) =>
                      handleSpecialClosureChange(closure.id, { label: event.target.value })
                    }
                    fullWidth
                  />
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveSpecialClosure(closure.id)}
                    aria-label={`ลบวันหยุด ${closure.label || closure.date}`}
                    sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}

          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 1.25, color: 'text.secondary' }}
          >
            เมื่อถึงวันที่กำหนด ระบบจะปิดรับออเดอร์อัตโนมัติ โดยไม่เปลี่ยนปุ่มเปิด–ปิดร้านหลัก
          </Typography>
        </Card>

        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6">ประกาศหน้าเว็บ</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  เช่น แจ้งวันหยุดร้าน — ข้อความจะแสดงเป็นแถบเด่นด้านบนหน้าสั่งอาหารของลูกค้า
                </Typography>
              </Box>
              <Switch
                checked={form.announcement.enabled}
                onChange={(event) =>
                  handleChange({
                    announcement: { ...form.announcement, enabled: event.target.checked },
                  })
                }
                inputProps={{ 'aria-label': 'เปิดหรือปิดประกาศหน้าเว็บ' }}
              />
            </Stack>

            <TextField
              label="ข้อความประกาศ"
              placeholder="เช่น ร้านหยุดวันที่ 1-2 มกราคม เนื่องในเทศกาลปีใหม่"
              value={form.announcement.message}
              onChange={(e) =>
                handleChange({ announcement: { ...form.announcement, message: e.target.value } })
              }
              disabled={!form.announcement.enabled}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </Card>

        <Button
          variant="contained"
          size="large"
          loading={saving}
          onClick={handleSave}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
          sx={{ alignSelf: 'flex-end', px: 4 }}
        >
          บันทึก
        </Button>
      </Stack>
    </Box>
  );
}
