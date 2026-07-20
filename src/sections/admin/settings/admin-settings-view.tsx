'use client';

import type { FieldPath } from 'react-hook-form';
import type { ReactNode, ReactElement } from 'react';
import type { AdminSettingsSchemaType } from './settings-schema';
import type { DayHours, WeekdayKey, ShopSettings } from 'src/lib/shop-settings-service';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { WEEKDAY_LABELS } from 'src/utils/business-hours';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { SHOP_LOGO_API } from 'src/components/logo';
import { Form, Field } from 'src/components/hook-form';

import { AdminSettingsSchema } from './settings-schema';
import {
  setShopOpenAdmin,
  updateShopSettings,
  deleteShopLogoAdmin,
  uploadShopLogoAdmin,
  uploadPaymentQrAdmin,
  deletePaymentQrAdmin,
} from './settings-actions';

// ----------------------------------------------------------------------

const DISPLAY_ORDER: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

type Props = {
  initialSettings: ShopSettings;
};

type SectionTitleProps = {
  icon: ReactElement;
  title: string;
  description: string;
  action?: ReactNode;
};

function SectionTitle({ icon, title, description, action }: SectionTitleProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      spacing={1.5}
      sx={{ mb: 2.5 }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            borderRadius: 2,
            color: 'primary.main',
            bgcolor: 'primary.lighter',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
            {description}
          </Typography>
        </Box>
      </Stack>
      {action}
    </Stack>
  );
}

export function AdminSettingsView({ initialSettings }: Props) {
  const { mutate } = useSWRConfig();
  const [updatingShopStatus, setUpdatingShopStatus] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPaymentQr, setUploadingPaymentQr] = useState(false);
  const [savedLogoUrl, setSavedLogoUrl] = useState(initialSettings.logoUrl);
  const [savedPaymentQrUrl, setSavedPaymentQrUrl] = useState(initialSettings.promptPayQrUrl);

  const methods = useForm<AdminSettingsSchemaType>({
    mode: 'onChange',
    resolver: zodResolver(AdminSettingsSchema),
    defaultValues: initialSettings,
  });
  const {
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting: saving },
  } = methods;
  const form = watch();

  const handleChange = (patch: Partial<ShopSettings>) => {
    Object.entries(patch).forEach(([key, value]) => {
      setValue(key as FieldPath<AdminSettingsSchemaType>, value as never, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  };

  const handleDayChange = (day: WeekdayKey, patch: Partial<DayHours>) => {
    setValue(
      `businessHours.${day}`,
      { ...form.businessHours[day], ...patch },
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const handleAddSpecialClosure = () => {
    handleChange({
      specialClosures: [
        ...form.specialClosures,
        { id: `closure-${Date.now()}`, date: '', label: 'วันพระ' },
      ],
    });
  };

  const handleRemoveSpecialClosure = (id: string) => {
    handleChange({
      specialClosures: form.specialClosures.filter((item) => item.id !== id),
    });
  };

  const handleShopStatusChange = async (manuallyOpen: boolean) => {
    const previousManuallyOpen = form.manuallyOpen;
    const previousIsOpen = form.isOpen;
    handleChange({ manuallyOpen, isOpen: manuallyOpen && !form.closureReason });
    setUpdatingShopStatus(true);

    try {
      await setShopOpenAdmin(manuallyOpen);
      toast.success(manuallyOpen ? 'เปิดรับออเดอร์แล้ว' : 'ปิดรับออเดอร์แล้ว');
    } catch (error) {
      handleChange({
        manuallyOpen: previousManuallyOpen,
        isOpen: previousIsOpen,
      });
      toast.error(error instanceof Error ? error.message : 'เปลี่ยนสถานะร้านไม่สำเร็จ');
    } finally {
      setUpdatingShopStatus(false);
    }
  };

  const handleSave = handleSubmit(
    async (values) => {
      try {
        const saved = await updateShopSettings(values, savedLogoUrl, savedPaymentQrUrl);
        reset(saved);
        setSavedLogoUrl(saved.logoUrl);
        setSavedPaymentQrUrl(saved.promptPayQrUrl);
        await mutate(
          SHOP_LOGO_API,
          { name: saved.name, logoUrl: saved.logoUrl },
          { revalidate: false }
        );
        toast.success('บันทึกข้อมูลร้านค้าแล้ว');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
      }
    },
    () => toast.error('กรุณาตรวจสอบข้อมูลที่กรอกให้ถูกต้อง')
  );

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

  const handlePaymentQrDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadingPaymentQr(true);
    try {
      const promptPayQrUrl = await uploadPaymentQrAdmin(file);

      if (form.promptPayQrUrl && form.promptPayQrUrl !== savedPaymentQrUrl) {
        await deletePaymentQrAdmin(form.promptPayQrUrl).catch(() => {});
      }

      handleChange({ promptPayQrUrl });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'อัปโหลด QR Code ไม่สำเร็จ');
    } finally {
      setUploadingPaymentQr(false);
    }
  };

  const handleDeletePaymentQr = async () => {
    if (form.promptPayQrUrl && form.promptPayQrUrl !== savedPaymentQrUrl) {
      await deletePaymentQrAdmin(form.promptPayQrUrl).catch(() => {});
    }
    handleChange({ promptPayQrUrl: null });
  };

  const regularOpenDays = DISPLAY_ORDER.filter((day) => !form.businessHours[day].closed).length;
  const manualStatusLabel = form.manuallyOpen ? 'เปิดรับออเดอร์' : 'ปิดรับออเดอร์';

  return (
    <Form methods={methods} onSubmit={handleSave}>
      <Box sx={{ pb: 4 }}>
        <Box
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 3,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 3,
            color: 'common.white',
            background: 'linear-gradient(135deg, #67100E 0%, #A31F18 58%, #DA6435 100%)',
            boxShadow: '0 16px 38px rgba(103,16,14,0.18)',
            '&::before': {
              content: '""',
              position: 'absolute',
              width: 180,
              height: 180,
              right: 70,
              bottom: -135,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.07)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              width: 230,
              height: 230,
              top: -130,
              right: -55,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.09)',
            },
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2.5}
            sx={{ position: 'relative', zIndex: 1 }}
          >
            <Box>
              <Typography variant="h3" sx={{ color: 'inherit' }}>
                ตั้งค่าร้านค้า
              </Typography>
              <Typography sx={{ mt: 0.75, color: 'rgba(255,255,255,0.78)' }}>
                จัดการข้อมูลร้าน เวลาเปิดบริการ วันหยุด และประกาศถึงลูกค้า
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                icon={
                  <Iconify
                    icon={form.manuallyOpen ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                    width={18}
                  />
                }
                label={manualStatusLabel}
                sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
              />
              <Chip
                icon={<Iconify icon="solar:calendar-date-bold" width={18} />}
                label={`เปิดประจำ ${regularOpenDays} วัน/สัปดาห์`}
                sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
              />
              {form.specialClosures.length > 0 && (
                <Chip
                  label={`${form.specialClosures.length} วันหยุดพิเศษ`}
                  sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
                />
              )}
            </Stack>
          </Stack>
        </Box>

        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              sx={{
                height: 1,
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: form.manuallyOpen ? 'success.light' : 'error.light',
                bgcolor: form.manuallyOpen ? 'success.lighter' : 'error.lighter',
                boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      borderRadius: 2.25,
                      color: form.manuallyOpen ? 'success.dark' : 'error.dark',
                      bgcolor: 'common.white',
                    }}
                  >
                    <Iconify icon="solar:home-angle-bold-duotone" width={27} />
                  </Box>
                  <Box>
                    <Typography variant="h5">สถานะรับออเดอร์</Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
                      {form.manuallyOpen
                        ? 'ร้านพร้อมรับออเดอร์ตามเวลาทำการที่กำหนด'
                        : 'ลูกค้าจะเห็นว่าร้านปิดและไม่สามารถส่งออเดอร์ได้'}
                    </Typography>
                  </Box>
                </Stack>

                <FormControlLabel
                  sx={{
                    m: 0,
                    px: 1.5,
                    py: 0.5,
                    flexShrink: 0,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.72)',
                    justifyContent: 'space-between',
                  }}
                  labelPlacement="start"
                  label={updatingShopStatus ? 'กำลังบันทึก...' : manualStatusLabel}
                  control={
                    <Switch
                      checked={form.manuallyOpen}
                      disabled={updatingShopStatus}
                      onChange={(event) => void handleShopStatusChange(event.target.checked)}
                      inputProps={{ 'aria-label': 'เปิดหรือปิดรับออเดอร์' }}
                    />
                  }
                />
              </Stack>

              {form.closureReason && form.manuallyOpen && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mt: 2, color: 'warning.darker' }}
                >
                  <Iconify icon="solar:danger-triangle-bold" width={20} />
                  <Typography variant="body2">
                    วันนี้ยังปิดตามวันหยุดพิเศษ: {form.closureReason}
                  </Typography>
                </Stack>
              )}
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{
                height: 1,
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: form.announcement.enabled ? 'info.light' : 'divider',
                boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 2,
                    color: 'info.dark',
                    bgcolor: 'info.lighter',
                  }}
                >
                  <Iconify icon="solar:bell-bing-bold-duotone" width={24} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1">ประกาศหน้าเว็บ</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {form.announcement.enabled ? 'กำลังแสดงให้ลูกค้าเห็น' : 'ยังไม่ได้เปิดประกาศ'}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  color={form.announcement.enabled ? 'info' : 'default'}
                  label={form.announcement.enabled ? 'เปิดอยู่' : 'ปิดอยู่'}
                />
              </Stack>
            </Card>
          </Grid>
        </Grid>

        <Stack spacing={2.5}>
          <Card
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
            }}
          >
            <SectionTitle
              icon={<Iconify icon="solar:home-angle-bold-duotone" width={24} />}
              title="ข้อมูลร้านค้า"
              description="ข้อมูลที่ลูกค้าเห็น และข้อมูลสำหรับสร้าง QR รับเงิน"
            />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">โลโก้ร้าน</Typography>
                  <Upload
                    value={form.logoUrl}
                    loading={uploadingLogo}
                    disabled={uploadingLogo || saving}
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
                    sx={{ height: 280, borderRadius: 2.5 }}
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 8 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Field.Text
                      name="name"
                      label="ชื่อร้าน"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Iconify icon="solar:home-angle-bold-duotone" width={19} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Field.Text
                      name="description"
                      label="รายละเอียดร้านค้า"
                      placeholder="เช่น ก๋วยเตี๋ยวสูตรดั้งเดิม น้ำซุปหอมเคี่ยวสดใหม่ทุกวัน"
                      helperText={`${form.description.length}/500 ตัวอักษร — ข้อความนี้จะแสดงในหน้าสั่งอาหาร`}
                      slotProps={{ htmlInput: { maxLength: 500 } }}
                      fullWidth
                      multiline
                      minRows={2}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Field.Text
                      name="address"
                      label="ที่อยู่ร้าน"
                      fullWidth
                      multiline
                      minRows={3}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Field.Text
                      name="phone"
                      label="เบอร์โทรติดต่อร้าน"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Iconify icon="solar:phone-bold" width={19} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Card>

          <Card
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: form.promptPayQrUrl || form.promptPayId ? 'success.light' : 'divider',
              boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
            }}
          >
            <SectionTitle
              icon={<Iconify icon="solar:wad-of-money-bold" width={24} />}
              title="การเงินและรับชำระ"
              description="ตั้งค่า QR Code หรือเลขพร้อมเพย์ที่จะแสดงให้ลูกค้าสแกนตอนเช็กบิล"
              action={
                <Chip
                  size="small"
                  color={form.promptPayQrUrl || form.promptPayId ? 'success' : 'warning'}
                  variant="soft"
                  icon={
                    <Iconify
                      icon={
                        form.promptPayQrUrl || form.promptPayId
                          ? 'solar:check-circle-bold'
                          : 'solar:danger-triangle-bold'
                      }
                      width={17}
                    />
                  }
                  label={
                    form.promptPayQrUrl
                      ? 'ใช้ QR ที่อัปโหลด'
                      : form.promptPayId
                        ? 'สร้าง QR จากพร้อมเพย์'
                        : 'ยังไม่ได้ตั้งค่ารับเงิน'
                  }
                />
              }
            />

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Box
                  sx={{
                    height: 1,
                    p: 2.5,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'grey.50',
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 1.75,
                        color: 'primary.main',
                        bgcolor: 'primary.lighter',
                      }}
                    >
                      <Iconify icon="solar:smartphone-2-bold" width={22} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1">เลขพร้อมเพย์</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        สำหรับสร้าง QR พร้อมยอดเงินอัตโนมัติ
                      </Typography>
                    </Box>
                  </Stack>

                  <Field.Text
                    name="promptPayId"
                    label="เบอร์โทรหรือเลขบัตรประชาชน"
                    placeholder="เช่น 0812345678"
                    helperText="ระบบจะใส่ยอดชำระลงใน QR ให้ลูกค้า"
                    fullWidth
                  />

                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 2 }}>
                    <Iconify
                      icon="solar:info-circle-bold"
                      width={18}
                      color="text.secondary"
                      sx={{ mt: 0.1, flexShrink: 0 }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      ใช้เป็นตัวสำรองอัตโนมัติเมื่อไม่ได้อัปโหลดรูป QR Code
                    </Typography>
                  </Stack>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <Box
                  sx={{
                    height: 1,
                    p: 2.5,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: form.promptPayQrUrl ? 'success.light' : 'divider',
                    bgcolor: form.promptPayQrUrl ? 'success.lighter' : 'grey.50',
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                    spacing={2.5}
                  >
                    <Box sx={{ width: { xs: 1, sm: 220 }, flexShrink: 0 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        QR Code รับเงิน
                      </Typography>
                      <Upload
                        value={form.promptPayQrUrl}
                        loading={uploadingPaymentQr}
                        disabled={uploadingPaymentQr || saving}
                        multiple={false}
                        maxFiles={1}
                        maxSize={5 * 1024 * 1024}
                        accept={{
                          'image/jpeg': ['.jpg', '.jpeg'],
                          'image/png': ['.png'],
                          'image/webp': ['.webp'],
                          'image/gif': ['.gif'],
                        }}
                        onDrop={(acceptedFiles) => void handlePaymentQrDrop(acceptedFiles)}
                        onDelete={() => void handleDeletePaymentQr()}
                        sx={{ height: 220, borderRadius: 2.5, bgcolor: 'common.white' }}
                      />
                    </Box>

                    <Stack spacing={1.25} sx={{ flex: 1, pt: { sm: 4 } }}>
                      <Chip
                        size="small"
                        color={form.promptPayQrUrl ? 'success' : 'default'}
                        variant="soft"
                        label={form.promptPayQrUrl ? 'พร้อมใช้งาน' : 'ยังไม่มีรูป QR'}
                        sx={{ alignSelf: 'flex-start' }}
                      />
                      <Typography variant="subtitle2">
                        {form.promptPayQrUrl
                          ? 'หน้าเช็กบิลจะแสดง QR รูปนี้'
                          : 'อัปโหลด QR Code จากแอปธนาคาร'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        เมื่อมีรูป QR ระบบจะเลือกใช้รูปนี้ก่อนเลขพร้อมเพย์
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        แนะนำภาพจัตุรัส รองรับ JPEG, PNG, WEBP และ GIF ไม่เกิน 5MB
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Card>

          <Card
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
            }}
          >
            <SectionTitle
              icon={<Iconify icon="solar:clock-circle-bold" width={24} />}
              title="เวลาทำการประจำสัปดาห์"
              description="นอกช่วงเวลาที่กำหนด ลูกค้าจะดูเมนูได้แต่ไม่สามารถส่งออเดอร์"
              action={
                <Chip size="small" variant="outlined" label={`เปิด ${regularOpenDays} วัน`} />
              }
            />

            <Grid container spacing={1.5}>
              {DISPLAY_ORDER.map((day) => {
                const dayHours = form.businessHours[day];

                return (
                  <Grid size={{ xs: 12, xl: 6 }} key={day}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                      spacing={1.5}
                      sx={{
                        p: 1.5,
                        height: 1,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: dayHours.closed ? 'divider' : 'success.light',
                        bgcolor: dayHours.closed ? 'grey.50' : 'success.lighter',
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ width: { sm: 165 }, flexShrink: 0 }}
                      >
                        <Typography variant="subtitle2">{WEEKDAY_LABELS[day]}</Typography>
                        <FormControlLabel
                          sx={{ m: 0 }}
                          control={
                            <Switch
                              size="small"
                              checked={!dayHours.closed}
                              onChange={(event) =>
                                handleDayChange(day, { closed: !event.target.checked })
                              }
                              inputProps={{ 'aria-label': `เปิด-ปิดร้านวัน${WEEKDAY_LABELS[day]}` }}
                            />
                          }
                          label={dayHours.closed ? 'หยุด' : 'เปิด'}
                        />
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                        <Field.Text
                          name={`businessHours.${day}.open`}
                          type="time"
                          size="small"
                          disabled={dayHours.closed}
                          inputProps={{ 'aria-label': `เวลาเปิดวัน${WEEKDAY_LABELS[day]}` }}
                          sx={{ flex: 1, minWidth: 0 }}
                        />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          ถึง
                        </Typography>
                        <Field.Text
                          name={`businessHours.${day}.close`}
                          type="time"
                          size="small"
                          disabled={dayHours.closed}
                          inputProps={{ 'aria-label': `เวลาปิดวัน${WEEKDAY_LABELS[day]}` }}
                          sx={{ flex: 1, minWidth: 0 }}
                        />
                      </Stack>
                    </Stack>
                  </Grid>
                );
              })}
            </Grid>
          </Card>

          <Card
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
            }}
          >
            <SectionTitle
              icon={<Iconify icon="solar:calendar-date-bold" width={24} />}
              title="วันหยุดพิเศษ"
              description="เพิ่มวันที่ร้านหยุดนอกตารางประจำ เช่น วันพระ เทศกาล หรือวันหยุดส่วนตัว"
              action={
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:add-circle-bold" width={19} />}
                  onClick={handleAddSpecialClosure}
                >
                  เพิ่มวันหยุด
                </Button>
              }
            />

            {form.specialClosures.length === 0 ? (
              <Stack
                alignItems="center"
                spacing={1}
                sx={{
                  px: 2,
                  py: 4.5,
                  borderRadius: 2.5,
                  border: '1px dashed',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  textAlign: 'center',
                }}
              >
                <Iconify icon="solar:calendar-date-bold" width={42} color="text.disabled" />
                <Typography variant="h6">ยังไม่มีวันหยุดพิเศษ</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  กด “เพิ่มวันหยุด” เพื่อกำหนดวันหยุดล่วงหน้า
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={1.25}>
                {form.specialClosures.map((closure, index) => (
                  <Stack
                    key={closure.id}
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    spacing={1.25}
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        display: { xs: 'none', sm: 'grid' },
                        placeItems: 'center',
                        flexShrink: 0,
                        borderRadius: 1.5,
                        color: 'primary.main',
                        bgcolor: 'primary.lighter',
                        typography: 'subtitle2',
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Field.Text
                      name={`specialClosures.${index}.date`}
                      type="date"
                      label="วันที่หยุด"
                      size="small"
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ width: { xs: 1, sm: 195 }, flexShrink: 0 }}
                    />
                    <Field.Text
                      name={`specialClosures.${index}.label`}
                      label="เหตุผล"
                      placeholder="เช่น วันพระ"
                      size="small"
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

            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1.5 }}>
              <Iconify icon="solar:info-circle-bold" width={18} color="text.secondary" />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                เมื่อถึงวันที่กำหนด ระบบจะปิดรับออเดอร์อัตโนมัติ โดยไม่เปลี่ยนสถานะเปิด–ปิดร้านหลัก
              </Typography>
            </Stack>
          </Card>

          <Card
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: form.announcement.enabled ? 'info.light' : 'divider',
              boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
            }}
          >
            <SectionTitle
              icon={<Iconify icon="solar:bell-bing-bold-duotone" width={24} />}
              title="ประกาศหน้าเว็บ"
              description="ข้อความสำคัญที่จะแสดงเป็นแถบเด่นด้านบนหน้าสั่งอาหาร"
              action={
                <FormControlLabel
                  sx={{ m: 0 }}
                  control={
                    <Switch
                      checked={form.announcement.enabled}
                      onChange={(event) =>
                        handleChange({
                          announcement: {
                            ...form.announcement,
                            enabled: event.target.checked,
                          },
                        })
                      }
                      inputProps={{ 'aria-label': 'เปิดหรือปิดประกาศหน้าเว็บ' }}
                    />
                  }
                  label={form.announcement.enabled ? 'เปิดประกาศ' : 'ปิดประกาศ'}
                />
              }
            />

            <Field.Text
              name="announcement.message"
              label="ข้อความประกาศ"
              placeholder="เช่น ร้านหยุดวันที่ 1-2 มกราคม เนื่องในเทศกาลปีใหม่"
              disabled={!form.announcement.enabled}
              fullWidth
              multiline
              minRows={3}
              helperText={`${form.announcement.message.length}/500 ตัวอักษร`}
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />

            {form.announcement.enabled && form.announcement.message.trim() && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2.5,
                  color: 'info.darker',
                  bgcolor: 'info.lighter',
                  border: '1px solid',
                  borderColor: 'info.light',
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <Iconify icon="solar:bell-bing-bold" width={21} sx={{ flexShrink: 0, mt: 0.1 }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      ตัวอย่างที่ลูกค้าจะเห็น
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25 }}>
                      {form.announcement.message}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
          </Card>

          <Card
            sx={{
              position: 'sticky',
              bottom: 16,
              zIndex: 5,
              p: 1.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 14px 36px rgba(33,43,54,0.16)',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
              spacing={1.5}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 0.5 }}>
                <Iconify icon="solar:info-circle-bold" width={19} color="text.secondary" />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  กดบันทึกเพื่ออัปเดตข้อมูล เวลา วันหยุด และประกาศทั้งหมด
                </Typography>
              </Stack>
              <Button
                type="submit"
                variant="contained"
                size="large"
                loading={saving}
                disabled={uploadingLogo || uploadingPaymentQr}
                startIcon={<Iconify icon="solar:check-circle-bold" />}
                sx={{ px: 4, minWidth: 180 }}
              >
                บันทึกการตั้งค่า
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Box>
    </Form>
  );
}
