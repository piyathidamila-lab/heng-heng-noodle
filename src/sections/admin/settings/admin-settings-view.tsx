'use client';

import type { ShopSettings, CustomOrderOption } from 'src/lib/shop-settings-service';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { updateShopSettings } from './settings-actions';

// ----------------------------------------------------------------------

type Props = {
  initialSettings: ShopSettings;
};

export function AdminSettingsView({ initialSettings }: Props) {
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const handleChange = (patch: Partial<ShopSettings>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await updateShopSettings(form);
      setForm(saved);
      toast.success('บันทึกข้อมูลร้านค้าแล้ว');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleStepTitleChange = (stepIndex: number, title: string) => {
    handleChange({
      customOrder: {
        ...form.customOrder,
        steps: form.customOrder.steps.map((step, index) =>
          index === stepIndex ? { ...step, title } : step
        ),
      },
    });
  };

  const handleOptionChange = (
    stepIndex: number,
    optionIndex: number,
    patch: Partial<CustomOrderOption>
  ) => {
    handleChange({
      customOrder: {
        ...form.customOrder,
        steps: form.customOrder.steps.map((step, index) =>
          index === stepIndex
            ? {
                ...step,
                options: step.options.map((option, currentOptionIndex) =>
                  currentOptionIndex === optionIndex ? { ...option, ...patch } : option
                ),
              }
            : step
        ),
      },
    });
  };

  const handleAddOption = (stepIndex: number) => {
    const option: CustomOrderOption = {
      id: `option-${Date.now()}`,
      label: '',
      price: 0,
    };

    handleChange({
      customOrder: {
        ...form.customOrder,
        steps: form.customOrder.steps.map((step, index) =>
          index === stepIndex ? { ...step, options: [...step.options, option] } : step
        ),
      },
    });
  };

  const handleDeleteOption = (stepIndex: number, optionIndex: number) => {
    handleChange({
      customOrder: {
        ...form.customOrder,
        steps: form.customOrder.steps.map((step, index) =>
          index === stepIndex
            ? {
                ...step,
                options: step.options.filter((_, currentIndex) => currentIndex !== optionIndex),
              }
            : step
        ),
      },
    });
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

        <Stack direction="row" spacing={2}>
          <TextField
            label="เวลาเปิดร้าน"
            placeholder="เช่น 08:00"
            value={form.openTime}
            onChange={(e) => handleChange({ openTime: e.target.value })}
            fullWidth
          />
          <TextField
            label="เวลาปิดร้าน"
            placeholder="เช่น 20:00"
            value={form.closeTime}
            onChange={(e) => handleChange({ closeTime: e.target.value })}
            fullWidth
          />
        </Stack>

        <Divider sx={{ my: 1 }} />

        <Stack spacing={0.75}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">เมนูความอร่อยเลือกเอง</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ตั้งค่าตัวเลือกแบบทีละขั้นที่จะแสดงในหน้าสั่งอาหาร
              </Typography>
            </Box>
            <Switch
              checked={form.customOrder.enabled}
              onChange={(event) =>
                handleChange({
                  customOrder: { ...form.customOrder, enabled: event.target.checked },
                })
              }
              inputProps={{ 'aria-label': 'เปิดหรือปิดเมนูความอร่อยเลือกเอง' }}
            />
          </Stack>
        </Stack>

        <TextField
          label="ชื่อปุ่มที่ลูกค้าเห็น"
          value={form.customOrder.title}
          onChange={(event) =>
            handleChange({
              customOrder: { ...form.customOrder, title: event.target.value },
            })
          }
          disabled={!form.customOrder.enabled}
          fullWidth
        />

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
            opacity: form.customOrder.enabled ? 1 : 0.55,
            pointerEvents: form.customOrder.enabled ? 'auto' : 'none',
          }}
        >
          {form.customOrder.steps.map((step, stepIndex) => {
            const isPriceStep = stepIndex === form.customOrder.steps.length - 1;

            return (
              <Stack
                key={step.id}
                spacing={1.5}
                sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      typography: 'subtitle2',
                      bgcolor: 'primary.main',
                      color: 'common.white',
                    }}
                  >
                    {stepIndex + 1}
                  </Box>
                  <Typography variant="subtitle1">ขั้นตอนที่ {stepIndex + 1}</Typography>
                </Stack>

                <TextField
                  label="ชื่อขั้นตอน"
                  size="small"
                  value={step.title}
                  onChange={(event) => handleStepTitleChange(stepIndex, event.target.value)}
                  fullWidth
                />

                <Stack spacing={1}>
                  {step.options.map((option, optionIndex) => (
                    <Stack key={option.id} direction="row" spacing={0.75} alignItems="center">
                      <TextField
                        label={`ตัวเลือก ${optionIndex + 1}`}
                        size="small"
                        value={option.label}
                        onChange={(event) =>
                          handleOptionChange(stepIndex, optionIndex, { label: event.target.value })
                        }
                        fullWidth
                      />
                      {isPriceStep && (
                        <TextField
                          label="ราคา"
                          type="number"
                          size="small"
                          value={option.price}
                          onChange={(event) =>
                            handleOptionChange(stepIndex, optionIndex, {
                              price: Math.max(0, Number(event.target.value)),
                            })
                          }
                          slotProps={{ htmlInput: { min: 0, step: 1 } }}
                          sx={{ width: 100, flexShrink: 0 }}
                        />
                      )}
                      <IconButton
                        color="error"
                        size="small"
                        disabled={step.options.length <= 1}
                        onClick={() => handleDeleteOption(stepIndex, optionIndex)}
                        aria-label={`ลบ ${option.label || `ตัวเลือก ${optionIndex + 1}`}`}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={19} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>

                <Button
                  variant="soft"
                  size="small"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={() => handleAddOption(stepIndex)}
                >
                  เพิ่มตัวเลือก
                </Button>
              </Stack>
            );
          })}
        </Box>

        <Button
          variant="contained"
          size="large"
          loading={saving}
          onClick={handleSave}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
          sx={{ alignSelf: 'flex-start', px: 4 }}
        >
          บันทึก
        </Button>
      </Stack>
    </Box>
  );
}
