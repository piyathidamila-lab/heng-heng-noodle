'use client';

import type { DropResult } from '@hello-pangea/dnd';
import type {
  ShopSettings,
  CustomOrderStep,
  CustomOrderOption,
} from 'src/lib/shop-settings-service';

import { useState } from 'react';
import { Draggable, Droppable, DragDropContext } from '@hello-pangea/dnd';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

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
    handleSteps((steps) =>
      steps.map((step, index) => (index === stepIndex ? { ...step, title } : step))
    );
  };

  const handleStepPriceChange = (stepIndex: number, hasPrice: boolean) => {
    handleSteps((steps) =>
      steps.map((step, index) => (index === stepIndex ? { ...step, hasPrice } : step))
    );
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
          ? {
              ...step,
              options: step.options.filter((_, currentIndex) => currentIndex !== optionIndex),
            }
          : step
      )
    );
  };

  const handleAddStep = () => {
    const step: CustomOrderStep = {
      id: `step-${Date.now()}`,
      title: '',
      hasPrice: false,
      options: [{ id: `option-${Date.now()}`, label: '', price: 0 }],
    };

    handleSteps((steps) => [...steps, step]);
  };

  const handleDeleteStep = (stepIndex: number) => {
    handleSteps((steps) => steps.filter((_, index) => index !== stepIndex));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;

    handleSteps((steps) => {
      const next = [...steps];
      const [moved] = next.splice(result.source.index, 1);
      next.splice(result.destination!.index, 0, moved);
      return next;
    });
  };

  const totalOptions = form.customOrder.steps.reduce((sum, step) => sum + step.options.length, 0);

  return (
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
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 220,
            height: 220,
            top: -120,
            right: -50,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.09)',
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box>
            <Typography variant="h3" sx={{ color: 'inherit' }}>
              ความอร่อยเลือกเอง
            </Typography>
            <Typography sx={{ mt: 0.75, color: 'rgba(255,255,255,0.76)' }}>
              ออกแบบขั้นตอนให้ลูกค้าประกอบเมนูได้ง่ายและเป็นลำดับ
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              label={form.customOrder.enabled ? 'เปิดใช้งานอยู่' : 'ปิดใช้งาน'}
              sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
            />
            <Chip
              label={`${form.customOrder.steps.length} ขั้นตอน · ${totalOptions} ตัวเลือก`}
              sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
            />
          </Stack>
        </Stack>
      </Box>

      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{
            p: { xs: 2, sm: 2.5 },
            border: '1px solid',
            borderColor: form.customOrder.enabled ? 'success.light' : 'divider',
            borderRadius: 3,
            bgcolor: 'common.white',
            boxShadow: '0 8px 24px rgba(33,43,54,0.05)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                borderRadius: 2,
                color: form.customOrder.enabled ? 'success.dark' : 'text.secondary',
                bgcolor: form.customOrder.enabled ? 'success.lighter' : 'grey.100',
              }}
            >
              <Iconify icon="solar:settings-bold" width={24} />
            </Box>
            <Box>
              <Typography variant="subtitle1">สถานะเมนูเลือกเอง</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {form.customOrder.enabled
                  ? 'ลูกค้าสามารถเลือกเมนูนี้ได้ในหน้าสั่งอาหาร'
                  : 'ลูกค้าจะไม่เห็นเมนูนี้ในหน้าสั่งอาหาร'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {form.customOrder.enabled ? 'เปิด' : 'ปิด'}
            </Typography>
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

        <Card sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3 }}>
          <Typography variant="h6">ชื่อเมนูบนหน้าลูกค้า</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            ใช้เป็นหัวข้อและปุ่มที่ลูกค้ากดเพื่อเริ่มเลือกส่วนประกอบ
          </Typography>
          <TextField
            label="ชื่อที่ลูกค้าเห็น"
            placeholder="เช่น ความอร่อยเลือกเองได้"
            value={form.customOrder.title}
            onChange={(event) =>
              handleChange({ customOrder: { ...form.customOrder, title: event.target.value } })
            }
            disabled={!form.customOrder.enabled}
            fullWidth
          />
        </Card>

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5">ขั้นตอนการเลือก</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ลูกค้าจะเลือกจากขั้นตอนที่ 1 ไปตามลำดับจนถึงขั้นตอนสุดท้าย
            </Typography>
          </Box>
          <Chip label={`${form.customOrder.steps.length}/6 ขั้นตอน`} variant="outlined" />
        </Stack>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="custom-order-steps" isDropDisabled={!form.customOrder.enabled}>
            {(dropProvided, dropSnapshot) => (
              <Box
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: 'minmax(0, 1fr)',
                  p: dropSnapshot.isDraggingOver ? 1.5 : 0,
                  borderRadius: 3,
                  bgcolor: dropSnapshot.isDraggingOver ? 'action.hover' : 'transparent',
                  opacity: form.customOrder.enabled ? 1 : 0.55,
                  pointerEvents: form.customOrder.enabled ? 'auto' : 'none',
                  transition: (theme) =>
                    theme.transitions.create(['padding', 'background-color'], {
                      duration: theme.transitions.duration.shortest,
                    }),
                }}
              >
                {form.customOrder.steps.map((step, stepIndex) => {
                  const isPriceStep = step.hasPrice;

                  return (
                    <Draggable key={step.id} draggableId={step.id} index={stepIndex}>
                      {(dragProvided, dragSnapshot) => (
                        <Stack
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          style={dragProvided.draggableProps.style}
                          spacing={1.5}
                          sx={{
                            overflow: 'hidden',
                            p: 2,
                            border: '1px solid',
                            borderColor: dragSnapshot.isDragging
                              ? 'primary.main'
                              : isPriceStep
                                ? 'warning.light'
                                : 'divider',
                            borderRadius: 3,
                            bgcolor: 'common.white',
                            boxShadow: dragSnapshot.isDragging
                              ? '0 20px 45px rgba(145,33,33,0.22)'
                              : '0 8px 24px rgba(33,43,54,0.05)',
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <IconButton
                              {...dragProvided.dragHandleProps}
                              size="small"
                              aria-label={`ลากเพื่อจัดลำดับขั้นตอนที่ ${stepIndex + 1}`}
                              sx={{ cursor: 'grab', touchAction: 'none', bgcolor: 'action.hover' }}
                            >
                              <Iconify icon="custom:drag-dots-fill" width={22} />
                            </IconButton>
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
                            <FormControlLabel
                              label="มีราคา"
                              sx={{
                                mr: 0,
                                '& .MuiFormControlLabel-label': { typography: 'caption' },
                              }}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={step.hasPrice}
                                  onChange={(event) =>
                                    handleStepPriceChange(stepIndex, event.target.checked)
                                  }
                                  inputProps={{
                                    'aria-label': `กำหนดราคาในขั้นตอนที่ ${stepIndex + 1}`,
                                  }}
                                />
                              }
                            />
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
                            onChange={(event) =>
                              handleStepTitleChange(stepIndex, event.target.value)
                            }
                            fullWidth
                          />

                          <Divider />

                          <Stack spacing={1} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'grey.50' }}>
                            {step.options.map((option, optionIndex) => (
                              <Stack
                                key={option.id}
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                              >
                                <Box
                                  sx={{
                                    width: 25,
                                    height: 25,
                                    display: 'grid',
                                    placeItems: 'center',
                                    flexShrink: 0,
                                    borderRadius: 1,
                                    typography: 'caption',
                                    fontWeight: 700,
                                    color: 'text.secondary',
                                    bgcolor: 'common.white',
                                  }}
                                >
                                  {optionIndex + 1}
                                </Box>
                                <TextField
                                  placeholder={`ชื่อตัวเลือก ${optionIndex + 1}`}
                                  size="small"
                                  value={option.label}
                                  onChange={(event) =>
                                    handleOptionChange(stepIndex, optionIndex, {
                                      label: event.target.value,
                                    })
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

                          {isPriceStep && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              ราคาของขั้นตอนนี้จะรวมกับขั้นตอนอื่นที่เปิดกำหนดราคา
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </Draggable>
                  );
                })}

                {dropProvided.placeholder}

                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    p: 2,
                    border: '1.5px dashed',
                    borderColor: 'divider',
                    borderRadius: 3,
                    minHeight: 120,
                    bgcolor: 'grey.50',
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
            )}
          </Droppable>
        </DragDropContext>

        <Card sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h5">ตัวอย่างที่ลูกค้าจะเห็น</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                ตรวจสอบชื่อและตัวเลือกก่อนกดบันทึก
              </Typography>
            </Box>
            <Chip
              label={form.customOrder.enabled ? 'กำลังแสดงบนหน้าลูกค้า' : 'ยังไม่เปิดใช้งาน'}
              color={form.customOrder.enabled ? 'success' : 'default'}
              variant="soft"
            />
          </Stack>

          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.neutral',
            }}
          >
            <Typography variant="h5" sx={{ mb: 2 }}>
              {form.customOrder.title.trim() || 'ความอร่อยเลือกเองได้'}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 1.5,
              }}
            >
              {form.customOrder.steps.map((step, stepIndex) => (
                <Box
                  key={step.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'common.white',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
                    <Box
                      sx={{
                        width: 25,
                        height: 25,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '50%',
                        color: 'common.white',
                        bgcolor: 'primary.main',
                        typography: 'caption',
                        fontWeight: 700,
                      }}
                    >
                      {stepIndex + 1}
                    </Box>
                    <Typography variant="subtitle2">
                      {step.title.trim() || `ขั้นตอนที่ ${stepIndex + 1}`}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                    {step.options.map((option) => (
                      <Chip
                        key={option.id}
                        size="small"
                        variant="outlined"
                        label={`${option.label.trim() || 'ยังไม่ระบุชื่อ'}${step.hasPrice && option.price > 0 ? ` · ฿${option.price.toLocaleString('th-TH')}` : ''}`}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Box>
          </Box>
        </Card>

        <Button
          variant="contained"
          size="large"
          loading={saving}
          onClick={handleSave}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
          sx={{ alignSelf: 'flex-end', px: 4, minWidth: 160 }}
        >
          บันทึก
        </Button>
      </Stack>
    </Box>
  );
}
