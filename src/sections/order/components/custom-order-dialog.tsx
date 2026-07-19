'use client';

import type { CustomOrderConfig, CustomOrderSelection } from 'src/lib/shop-settings-service';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';

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
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            m: { xs: 2, sm: 4 },
            width: { xs: 'calc(100% - 32px)', sm: 1 },
            maxHeight: 'calc(100dvh - 32px)',
            overflow: 'hidden',
            borderRadius: 4,
            bgcolor: '#FBF8F4',
            boxShadow: '0 24px 70px rgba(70,16,14,0.24)',
          },
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 2.5, sm: 3 },
          py: 2.5,
          color: 'common.white',
          background: 'linear-gradient(135deg, #67100E 0%, #A51D17 62%, #D25125 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 120,
            height: 120,
            top: -70,
            right: -20,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.08)',
          }}
        />
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ position: 'relative' }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.14)',
              fontSize: 26,
            }}
          >
            🍜
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'common.white' }}>
              {config.title}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.78 }}>
              จัดชามโปรดของคุณได้เลย
            </Typography>
          </Box>
        </Stack>
        <IconButton
          onClick={onClose}
          aria-label="ปิด"
          sx={{
            mr: -1,
            color: 'common.white',
            bgcolor: 'rgba(255,255,255,0.12)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' },
          }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>

      <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2, bgcolor: 'common.white' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle2">
            ขั้นตอน {activeStep + 1} จาก {config.steps.length}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {Math.round(((activeStep + 1) / config.steps.length) * 100)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={((activeStep + 1) / config.steps.length) * 100}
          sx={{ height: 7, borderRadius: 1, bgcolor: 'grey.200' }}
        />
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, overflowX: 'auto' }}>
          {config.steps.map((currentStep, index) => {
            const isComplete = index < activeStep || Boolean(selected[currentStep.id]);
            const isActive = index === activeStep;

            return (
              <Stack
                key={currentStep.id}
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{ flexShrink: 0, color: isActive ? 'primary.main' : 'text.secondary' }}
              >
                {isComplete && !isActive ? (
                  <Iconify icon="solar:check-circle-bold" width={16} sx={{ color: 'success.main' }} />
                ) : (
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '50%',
                      color: isActive ? 'common.white' : 'text.secondary',
                      bgcolor: isActive ? 'primary.main' : 'grey.200',
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {index + 1}
                  </Box>
                )}
                <Typography variant="caption" sx={{ fontWeight: isActive ? 800 : 600 }}>
                  {currentStep.title}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Box>

      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5, bgcolor: '#FBF8F4' }}>
        <Stack spacing={0.5} sx={{ mb: 2.5 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800 }}>
            เลือกได้ 1 รายการ
          </Typography>
          <Typography variant="h5">{step.title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            แตะตัวเลือกที่ต้องการ แล้วไปขั้นตอนถัดไป
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
                  minHeight: 96,
                  p: 1.25,
                  borderRadius: 2.5,
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? '#FFF0ED' : 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  position: 'relative',
                  boxShadow: isSelected ? '0 7px 18px rgba(139,17,17,0.10)' : 'none',
                  '&:hover': { borderColor: 'primary.main', bgcolor: '#FFF8F6' },
                }}
              >
                {isSelected && (
                  <Iconify
                    icon="solar:check-circle-bold"
                    width={21}
                    sx={{ position: 'absolute', top: 7, right: 7, color: 'primary.main' }}
                  />
                )}
                <Typography variant="subtitle1">{option.label}</Typography>
                <Typography
                  variant="caption"
                  sx={{ color: option.price > 0 ? 'primary.dark' : 'text.secondary' }}
                >
                  {option.price > 0
                    ? `${option.price.toLocaleString('th-TH')} บาท`
                    : 'ไม่เพิ่มราคา'}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>

        {selectedOptions.length > 0 && (
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={0.75}
            sx={{
              mt: 2.5,
              p: 1.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'grey.200',
              bgcolor: 'common.white',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', width: 1 }}>
              ที่เลือกแล้ว
            </Typography>
            {selectedOptions.map((option) => (
              <Stack key={option.id} direction="row" spacing={0.4} alignItems="center">
                <Iconify icon="solar:check-circle-bold" width={15} sx={{ color: 'success.main' }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {option.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2,
          borderTop: '1px solid',
          borderColor: 'grey.200',
          bgcolor: 'common.white',
        }}
      >
        <Button
          color="inherit"
          variant="outlined"
          disabled={activeStep === 0}
          onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
          sx={{ borderRadius: 2 }}
        >
          ย้อนกลับ
        </Button>
        <Box sx={{ flex: 1 }} />
        {isLastStep && totalPrice > 0 && (
          <Typography variant="subtitle1" sx={{ mr: 0.5, color: 'primary.main' }}>
            ฿{totalPrice.toLocaleString('th-TH')}
          </Typography>
        )}
        <Button
          variant="contained"
          disabled={!selectedOptionId}
          onClick={handleContinue}
          endIcon={!isLastStep && <Iconify icon="solar:double-alt-arrow-right-bold-duotone" />}
          sx={{ minHeight: 42, borderRadius: 2, px: 2 }}
        >
          {isLastStep ? 'เพิ่มลงตะกร้า' : 'ขั้นตอนถัดไป'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
