'use client';

import type { RewardInput, LoyaltyReward } from 'src/lib/loyalty-service';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { uploadRewardImageAdmin } from './loyalty-actions';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  editing: LoyaltyReward | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: RewardInput) => void;
};

const EMPTY_FORM: RewardInput = {
  name: '',
  description: '',
  imageUrl: null,
  starsCost: 10,
  isActive: true,
  sortOrder: 0,
};

export function RewardFormDialog({ open, editing, submitting, error, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<RewardInput>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              name: editing.name,
              description: editing.description,
              imageUrl: editing.imageUrl,
              starsCost: editing.starsCost,
              isActive: editing.isActive,
              sortOrder: editing.sortOrder,
            }
          : EMPTY_FORM
      );
      setUploading(false);
    }
  }, [editing, open]);

  const canSubmit = form.name.trim().length > 0 && form.starsCost > 0 && !submitting && !uploading;

  const handleDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadRewardImageAdmin(file);
      setForm((current) => ({ ...current, imageUrl }));
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error ? uploadError.message : 'อัปโหลดรูปของรางวัลไม่สำเร็จ'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting || uploading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 42,
              height: 42,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2,
              color: 'warning.darker',
              bgcolor: 'warning.lighter',
            }}
          >
            <Iconify icon="solar:cup-star-bold" width={23} />
          </Box>
          <Box>
            <Typography variant="h6">
              {editing ? 'แก้ไขของรางวัล' : 'เพิ่มของรางวัลใหม่'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              เพิ่มรูปและรายละเอียดให้ลูกค้าตัดสินใจแลกได้ง่ายขึ้น
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2.5} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2">รูปของรางวัล</Typography>
              <Upload
                value={form.imageUrl}
                loading={uploading}
                disabled={uploading || submitting}
                multiple={false}
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                accept={{
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png'],
                  'image/webp': ['.webp'],
                  'image/gif': ['.gif'],
                }}
                onDrop={(acceptedFiles) => void handleDrop(acceptedFiles)}
                onDelete={() => setForm((current) => ({ ...current, imageUrl: null }))}
                helperText="แนะนำภาพจัตุรัส รองรับ JPEG, PNG, WEBP และ GIF ไม่เกิน 5MB"
                sx={{ height: { xs: 260, md: 350 }, borderRadius: 2.5 }}
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={2}>
              <TextField
                label="ชื่อของรางวัล"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                fullWidth
                autoFocus
              />

              <TextField
                label="รายละเอียด"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="อธิบายของรางวัลหรือเงื่อนไขการรับ"
                fullWidth
                multiline
                minRows={3}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="ดาวที่ใช้แลก"
                    type="number"
                    value={form.starsCost}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        starsCost: Number(event.target.value),
                      }))
                    }
                    slotProps={{
                      htmlInput: { min: 1 },
                      input: {
                        endAdornment: <InputAdornment position="end">ดาว</InputAdornment>,
                      },
                    }}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="ลำดับการแสดง"
                    type="number"
                    value={form.sortOrder}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sortOrder: Number(event.target.value),
                      }))
                    }
                    slotProps={{ htmlInput: { min: 0 } }}
                    helperText="เลขน้อยแสดงก่อน"
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  px: 2,
                  py: 1.25,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: form.isActive ? 'success.light' : 'divider',
                  bgcolor: form.isActive ? 'success.lighter' : 'grey.50',
                }}
              >
                <FormControlLabel
                  sx={{ m: 0, width: 1, justifyContent: 'space-between' }}
                  labelPlacement="start"
                  control={
                    <Switch
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, isActive: event.target.checked }))
                      }
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2">เปิดให้ลูกค้าแลก</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {form.isActive ? 'แสดงในหน้าของรางวัล' : 'ซ่อนของรางวัลนี้ชั่วคราว'}
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              {error && <FormHelperText error>{error}</FormHelperText>}
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting || uploading}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          disabled={!canSubmit}
          loading={submitting}
          onClick={() => onSubmit(form)}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          บันทึกของรางวัล
        </Button>
      </DialogActions>
    </Dialog>
  );
}
