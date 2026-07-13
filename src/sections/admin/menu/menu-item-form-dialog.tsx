'use client';

import type { MenuItemInput } from 'src/lib/menu-service';
import type { MenuItem as MenuItemType } from 'src/sections/order/menu-data';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { MENU_CATEGORIES } from 'src/sections/order/menu-data';

import { uploadMenuItemImage } from './menu-actions';

// ----------------------------------------------------------------------

const EMPTY_FORM: MenuItemInput = {
  category: 'noodle',
  name: '',
  description: '',
  price: 0,
  emoji: '🍜',
  imageUrl: null,
  isAvailable: true,
};

type Props = {
  open: boolean;
  editing: MenuItemType | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: MenuItemInput) => void;
};

export function MenuItemFormDialog({ open, editing, submitting, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<MenuItemInput>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          : EMPTY_FORM
      );
    }
  }, [open, editing]);

  const canSubmit = form.name.trim().length > 0 && form.price >= 0 && !uploading;

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{editing ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              onClick={handlePickFile}
              sx={{
                width: 96,
                height: 96,
                flexShrink: 0,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                fontSize: 44,
                bgcolor: 'grey.100',
                backgroundImage: form.imageUrl ? `url(${form.imageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                cursor: 'pointer',
                position: 'relative',
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              {uploading ? (
                <CircularProgress size={28} />
              ) : (
                !form.imageUrl && form.emoji
              )}

              {!uploading && form.imageUrl && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm((prev) => ({ ...prev, imageUrl: null }));
                  }}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'common.white',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  <Iconify icon="mingcute:close-line" width={16} />
                </IconButton>
              )}
            </Box>

            <Stack spacing={0.5}>
              <Button
                size="small"
                variant="outlined"
                onClick={handlePickFile}
                disabled={uploading}
                startIcon={<Iconify icon="solar:gallery-add-bold" width={18} />}
              >
                {form.imageUrl ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพ'}
              </Button>
              <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
                JPEG, PNG, WEBP, GIF ไม่เกิน 5MB
              </Box>
            </Stack>

            <Box
              component="input"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              sx={{ display: 'none' }}
            />
          </Stack>

          <TextField
            select
            label="หมวดหมู่"
            value={form.category}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                category: e.target.value as MenuItemInput['category'],
              }))
            }
            fullWidth
          >
            {MENU_CATEGORIES.map((category) => (
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
                onChange={(e) => setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
              />
            }
            label="พร้อมจำหน่าย"
          />
        </Stack>
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
