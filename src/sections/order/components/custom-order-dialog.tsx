'use client';

import type { CustomOrderConfig, CustomOrderSelection } from 'src/lib/shop-settings-service';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  config: CustomOrderConfig;
  onClose: () => void;
  onAdd: (selection: CustomOrderSelection, labels: string[], price: number) => void;
};

export function CustomOrderDialog({ open, config, onClose, onAdd }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSelected({});
    }
  }, [open]);

  const step = config.steps[activeStep];
  const isLastStep = activeStep === config.steps.length - 1;
  const selectedOptionId = step ? selected[step.id] : undefined;

  const selectedOptions = config.steps.flatMap((currentStep) => {
    const option = currentStep.options.find((item) => item.id === selected[currentStep.id]);
    return option ? [option] : [];
  });
  const totalPrice = selectedOptions.reduce((sum, option) => sum + option.price, 0);

  const handleContinue = () => {
    if (!step || !selectedOptionId) return;

    if (!isLastStep) {
      setActiveStep((current) => current + 1);
      return;
    }

    onAdd(
      {
        choices: config.steps.map((currentStep) => ({
          stepId: currentStep.id,
          optionId: selected[currentStep.id]!,
        })),
      },
      selectedOptions.map((option) => option.label),
      totalPrice
    );
    onClose();
  };

  if (!step) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: { m: { xs: 2, sm: 4 }, width: { xs: 'calc(100% - 32px)', sm: 1 }, borderRadius: 3 },
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 2 }}
      >
        <Box>
          <Typography variant="h5">{config.title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            เลือกตามใจคุณให้ครบ {config.steps.length} ขั้นตอน
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ mt: -0.75, mr: -1 }} aria-label="ปิด">
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={0.75} sx={{ px: { xs: 2.5, sm: 3 }, pb: 2 }}>
        {config.steps.map((currentStep, index) => {
          const isComplete = Boolean(selected[currentStep.id]);
          const isActive = index === activeStep;

          return (
            <Box key={currentStep.id} sx={{ flex: 1 }}>
              <Box
                sx={{
                  height: 5,
                  borderRadius: 1,
                  bgcolor: index <= activeStep ? 'primary.main' : 'grey.200',
                }}
              />
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.75 }}>
                {isComplete && !isActive && (
                  <Iconify
                    icon="solar:check-circle-bold"
                    width={16}
                    sx={{ color: 'success.main' }}
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{ color: isActive ? 'text.primary' : 'text.secondary', fontWeight: 700 }}
                >
                  ขั้นที่ {index + 1}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <Divider />

      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
        <Stack spacing={0.5} sx={{ mb: 2.5 }}>
          <Typography variant="overline" sx={{ color: 'primary.main' }}>
            ขั้นตอนที่ {activeStep + 1}
          </Typography>
          <Typography variant="h5">{step.title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            เลือกได้ 1 รายการ
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 1.25,
          }}
        >
          {step.options.map((option) => {
            const isSelected = selectedOptionId === option.id;

            return (
              <ButtonBase
                key={option.id}
                onClick={() => setSelected((current) => ({ ...current, [step.id]: option.id }))}
                aria-pressed={isSelected}
                sx={{
                  minHeight: 82,
                  p: 1.5,
                  borderRadius: 2,
                  border: '1.5px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'primary.lighter' : 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.25,
                  position: 'relative',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                {isSelected && (
                  <Iconify
                    icon="solar:check-circle-bold"
                    width={19}
                    sx={{ position: 'absolute', top: 7, right: 7, color: 'primary.main' }}
                  />
                )}
                <Typography variant="subtitle1">{option.label}</Typography>
                {option.price > 0 && (
                  <Typography variant="body2" sx={{ color: 'primary.dark' }}>
                    {option.price.toLocaleString('th-TH')} บาท
                  </Typography>
                )}
              </ButtonBase>
            );
          })}
        </Box>

        {selectedOptions.length > 0 && (
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={0.75}
            sx={{ mt: 2.5, p: 1.5, borderRadius: 2, bgcolor: 'grey.100' }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', width: 1 }}>
              ที่เลือกแล้ว
            </Typography>
            {selectedOptions.map((option) => (
              <Typography key={option.id} variant="caption" sx={{ fontWeight: 700 }}>
                {option.label}
              </Typography>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, pb: 2.5, pt: 1 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0}
          onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
        >
          ย้อนกลับ
        </Button>
        <Box sx={{ flex: 1 }} />
        {isLastStep && totalPrice > 0 && (
          <Typography variant="subtitle1" sx={{ mr: 1 }}>
            {totalPrice.toLocaleString('th-TH')} บาท
          </Typography>
        )}
        <Button variant="contained" disabled={!selectedOptionId} onClick={handleContinue}>
          {isLastStep ? 'เพิ่มลงตะกร้า' : 'ขั้นตอนถัดไป'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
