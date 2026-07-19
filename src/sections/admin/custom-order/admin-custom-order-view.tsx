'use client';

import type { IconifyName } from 'src/components/iconify';
import type { ShopSettings, CustomOrderStep, CustomOrderOption } from 'src/lib/shop-settings-service';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { updateShopSettings } from '../settings/settings-actions';

// ----------------------------------------------------------------------

type Props = {
  initialSettings: ShopSettings;
};

export function AdminCustomOrderView({ initialSettings }: Props) {
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const handleChange = (patch: Partial<ShopSettings>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSteps = (updater: (steps: CustomOrderStep[]) => CustomOrderStep[]) => {
    handleChange({ customOrder: { ...form.customOrder, steps: updater(form.customOrder.steps) } });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await updateShopSettings(form);
      setForm(saved);
      toast.success('บันทึกขั้นตอนความอร่อยเลือกเองแล้ว');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleStepTitleChange = (stepIndex: number, title: string) => {
    handleSteps((steps) => steps.map((step, index) => (index === stepIndex ? { ...step, title } : step)));
  };

  const handleOptionChange = (
    stepIndex: number,
    optionIndex: number,
    patch: Partial<CustomOrderOption>
  ) => {
    handleSteps((steps) =>
      steps.map((step, index) =>
        index === stepIndex
          ? {
              ...step,
              options: step.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex ? { ...option, ...patch } : option
              ),
            }
          : step
      )
    );
  };

  const handleAddOption = (stepIndex: number) => {
    const option: CustomOrderOption = { id: `option-${Date.now()}`, label: '', price: 0 };

    handleSteps((steps) =>
      steps.map((step, index) =>
        index === stepIndex ? { ...step, options: [...step.options, option] } : step
      )
    );
  };

  const handleDeleteOption = (stepIndex: number, optionIndex: number) => {
    handleSteps((steps) =>
      steps.map((step, index) =>
        index === stepIndex
          ? { ...step, options: step.options.filter((_, currentIndex) => currentIndex !== optionIndex) }
          : step
      )
    );
  };

  const handleAddStep = () => {
    const step: CustomOrderStep = {
      id: `step-${Date.now()}`,
      title: '',
      options: [{ id: `option-${Date.now()}`, label: '', price: 0 }],
    };

    handleSteps((steps) => [...steps, step]);
  };

  const handleDeleteStep = (stepIndex: number) => {
    handleSteps((steps) => steps.filter((_, index) => index !== stepIndex));
  };

  const handleMoveStep = (stepIndex: number, direction: -1 | 1) => {
    handleSteps((steps) => {
      const targetIndex = stepIndex + direction;
      if (targetIndex < 0 || targetIndex >= steps.length) return steps;

      const next = [...steps];
      [next[stepIndex], next[targetIndex]] = [next[targetIndex], next[stepIndex]];
      return next;
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        เมนูความอร่อยเลือกเอง
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        ตั้งค่าตัวเลือกแบบทีละขั้นที่จะแสดงในหน้าสั่งอาหาร เพิ่ม ลบ หรือสลับลำดับขั้นตอนได้ตามต้องการ
      </Typography>

      <Stack spacing={2.5}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
          <Box>
            <Typography variant="subtitle1">เปิดใช้งานเมนูความอร่อยเลือกเอง</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              เมื่อปิด ลูกค้าจะไม่เห็นปุ่มนี้ในหน้าสั่งอาหาร
            </Typography>
          </Box>
          <Switch
            checked={form.customOrder.enabled}
            onChange={(event) =>
              handleChange({ customOrder: { ...form.customOrder, enabled: event.target.checked } })
            }
            inputProps={{ 'aria-label': 'เปิดหรือปิดเมนูความอร่อยเลือกเอง' }}
          />
        </Stack>

        <TextField
          label="ชื่อปุ่มที่ลูกค้าเห็น"
          value={form.customOrder.title}
          onChange={(event) =>
            handleChange({ customOrder: { ...form.customOrder, title: event.target.value } })
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
                      flexShrink: 0,
                    }}
                  >
                    {stepIndex + 1}
                  </Box>
                  <Typography variant="subtitle1" sx={{ flex: 1 }}>
                    ขั้นตอนที่ {stepIndex + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    disabled={stepIndex === 0}
                    onClick={() => handleMoveStep(stepIndex, -1)}
                    aria-label={`เลื่อนขั้นตอนที่ ${stepIndex + 1} ไปก่อนหน้า`}
                  >
                    <Iconify icon={'solar:alt-arrow-left-bold' as IconifyName} width={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={stepIndex === form.customOrder.steps.length - 1}
                    onClick={() => handleMoveStep(stepIndex, 1)}
                    aria-label={`เลื่อนขั้นตอนที่ ${stepIndex + 1} ไปถัดไป`}
                  >
                    <Iconify icon={'solar:alt-arrow-right-bold' as IconifyName} width={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={form.customOrder.steps.length <= 1}
                    onClick={() => handleDeleteStep(stepIndex)}
                    aria-label={`ลบขั้นตอนที่ ${stepIndex + 1}`}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                  </IconButton>
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

          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              p: 2,
              border: '1.5px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              minHeight: 120,
            }}
          >
            <Button
              variant="soft"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleAddStep}
              disabled={form.customOrder.steps.length >= 6}
            >
              เพิ่มขั้นตอน
            </Button>
            {form.customOrder.steps.length >= 6 && (
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
                เพิ่มได้สูงสุด 6 ขั้นตอน
              </Typography>
            )}
          </Stack>
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
