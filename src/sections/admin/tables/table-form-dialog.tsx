'use client';

import type { IconifyName } from 'src/components/iconify';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const TableFormSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, { error: 'กรุณาระบุหมายเลขโต๊ะ' })
    .max(30, { error: 'หมายเลขหรือชื่อโต๊ะต้องไม่เกิน 30 ตัวอักษร' })
    .regex(/^[\p{L}\p{N}._\- ]+$/u, {
      error: 'ใช้ได้เฉพาะตัวอักษร ตัวเลข จุด ขีดกลาง และขีดล่าง',
    }),
});

export type TableFormValues = z.infer<typeof TableFormSchema>;

type Props = {
  open: boolean;
  existingLabels: string[];
  onClose: () => void;
  onSubmit: (label: string) => Promise<void>;
};

export function TableFormDialog({ open, existingLabels, onClose, onSubmit }: Props) {
  const schema = useMemo(() => {
    const normalizedLabels = new Set(
      existingLabels.map((label) => label.trim().toLocaleLowerCase())
    );

    return TableFormSchema.refine(
      (values) => !normalizedLabels.has(values.label.trim().toLocaleLowerCase()),
      { path: ['label'], error: 'หมายเลขหรือชื่อโต๊ะนี้มีอยู่แล้ว' }
    );
  }, [existingLabels]);

  const methods = useForm<TableFormValues>({
    mode: 'onChange',
    resolver: zodResolver(schema),
    defaultValues: { label: '' },
  });

  const {
    reset,
    setError,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = methods;

  useEffect(() => {
    if (open) reset({ label: '' });
  }, [open, reset]);

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const submitForm = handleSubmit(async ({ label }) => {
    try {
      await onSubmit(label.trim());
      onClose();
    } catch (error) {
      setError('label', {
        type: 'server',
        message: error instanceof Error ? error.message : 'เพิ่มโต๊ะไม่สำเร็จ กรุณาลองใหม่',
      });
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            overflow: 'hidden',
            borderRadius: 3,
            backgroundImage: 'none',
          },
        },
      }}
    >
      <Form methods={methods} onSubmit={submitForm}>
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 2.5,
            color: 'common.white',
            background: 'linear-gradient(135deg, #67100E 0%, #A31F18 68%, #D65A2E 100%)',
          }}
        >
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.15)',
              }}
            >
              <Iconify icon={'solar:qr-code-bold' as IconifyName} width={26} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: 'inherit' }}>
                เพิ่มโต๊ะใหม่
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.76)' }}>
                ระบบจะสร้าง QR Code ประจำโต๊ะให้อัตโนมัติ
              </Typography>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
          <Field.Text
            name="label"
            label="หมายเลขหรือชื่อโต๊ะ"
            placeholder="เช่น 12 หรือ VIP1"
            autoFocus
            disabled={isSubmitting}
            helperText="ใช้สำหรับแสดงบน QR Code และรายการออเดอร์"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon={'solar:chair-2-bold' as IconifyName} width={21} />
                  </InputAdornment>
                ),
              },
              htmlInput: { maxLength: 30 },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pt: 2, pb: 3 }}>
          <Button color="inherit" variant="outlined" onClick={handleClose} disabled={isSubmitting}>
            ยกเลิก
          </Button>
          <Button
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
            startIcon={<Iconify icon="mingcute:add-line" width={20} />}
          >
            เพิ่มโต๊ะ
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
