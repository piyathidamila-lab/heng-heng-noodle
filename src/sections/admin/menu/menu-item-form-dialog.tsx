'use client';

import type { MenuItemInput } from 'src/lib/menu-service';
import type { MenuCategory } from 'src/lib/category-service';
import type { MenuItem as MenuItemType } from 'src/sections/order/menu-data';

import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';

import { uploadMenuItemImage } from './menu-actions';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  editing: MenuItemType | null;
  categories: MenuCategory[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: MenuItemInput) => void;
};

export function MenuItemFormDialog({
  open,
  editing,
  categories,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const emptyForm: MenuItemInput = {
    category: categories[0]?.value ?? '',
    name: '',
    description: '',
    price: 0,
    emoji: '🍜',
    imageUrl: null,
    isAvailable: true,
  };

  const [form, setForm] = useState<MenuItemInput>(emptyForm);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              category: editing.category,
              name: editing.name,
              description: editing.description,
              price: editing.price,
              emoji: editing.emoji,
              imageUrl: editing.imageUrl,
              isAvailable: editing.isAvailable,
            }
          : emptyForm
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const canSubmit = form.name.trim().length > 0 && form.price >= 0 && !uploading;

  const handleDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadMenuItemImage(file);
      setForm((prev) => ({ ...prev, imageUrl }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'อัปโหลดรูปภาพไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editing ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</DialogTitle>

      <DialogContent>
        <Grid container spacing={2.5} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Upload
              value={form.imageUrl}
              loading={uploading}
              disabled={uploading}
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
              onDelete={() => setForm((prev) => ({ ...prev, imageUrl: null }))}
              helperText="รองรับ JPEG, PNG, WEBP และ GIF ขนาดไม่เกิน 5MB"
              sx={{ height: { xs: 260, md: 360 }, borderRadius: 2.5 }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={2}>
              <TextField
                select
                label="หมวดหมู่"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                fullWidth
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="ชื่อเมนู"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                fullWidth
                autoFocus
              />

              <TextField
                label="คำอธิบาย"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label="ราคา (บาท)"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  fullWidth
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                />
                <TextField
                  label="อีโมจิ (สำรองเมื่อไม่มีรูป)"
                  value={form.emoji}
                  onChange={(e) => setForm((prev) => ({ ...prev, emoji: e.target.value }))}
                  fullWidth
                />
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={form.isAvailable}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))
                    }
                  />
                }
                label="พร้อมจำหน่าย"
              />
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          disabled={!canSubmit}
          loading={submitting}
          onClick={() => onSubmit(form)}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
}
