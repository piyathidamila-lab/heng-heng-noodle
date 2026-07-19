'use client';

import type { MenuCategory } from 'src/lib/category-service';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import {
  moveCategory,
  createCategory,
  deleteCategory,
  updateCategoryLabel,
} from './category-actions';

// ----------------------------------------------------------------------

type Props = {
  initialCategories: MenuCategory[];
};

export function AdminCategoriesView({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const handleCreate = async () => {
    if (!newLabel.trim()) return;

    setCreating(true);
    try {
      const category = await createCategory(newLabel);
      setCategories((prev) => [...prev, category]);
      setNewLabel('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'เพิ่มหมวดหมู่ไม่สำเร็จ');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (category: MenuCategory) => {
    setEditingId(category.id);
    setEditingLabel(category.label);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingLabel('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingLabel.trim()) return;

    setBusyId(id);
    try {
      const updated = await updateCategoryLabel(id, editingLabel);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      cancelEdit();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (category: MenuCategory) => {
    const confirmed = await confirm({
      content: `ลบหมวดหมู่ "${category.label}" ใช่หรือไม่?`,
      confirmLabel: 'ลบ',
    });
    if (!confirmed) return;

    setBusyId(category.id);
    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ลบไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (category: MenuCategory, direction: 'up' | 'down') => {
    const index = categories.findIndex((c) => c.id === category.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= categories.length) return;

    const next = [...categories];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setCategories(next);

    setBusyId(category.id);
    try {
      await moveCategory(category.id, direction);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ย้ายลำดับไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        จัดการหมวดหมู่
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        เพิ่ม ลบ หรือเรียงลำดับหมวดหมู่เมนู — ลำดับที่นี่คือลำดับแท็บที่ลูกค้าเห็น
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 4 }}>
        {categories.map((category, index) => {
          const isEditing = editingId === category.id;
          const isBusy = busyId === category.id;

          return (
            <Stack
              key={category.id}
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'common.white',
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Stack spacing={0}>
                <IconButton
                  size="small"
                  disabled={index === 0 || isBusy}
                  onClick={() => handleMove(category, 'up')}
                >
                  <Iconify icon="eva:arrow-upward-fill" width={16} />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={index === categories.length - 1 || isBusy}
                  onClick={() => handleMove(category, 'down')}
                >
                  <Iconify icon="eva:arrow-downward-fill" width={16} />
                </IconButton>
              </Stack>

              {isEditing ? (
                <TextField
                  size="small"
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  autoFocus
                  fullWidth
                />
              ) : (
                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                  {category.label}
                </Typography>
              )}

              {isEditing ? (
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    color="primary"
                    disabled={isBusy}
                    onClick={() => handleSaveEdit(category.id)}
                  >
                    <Iconify icon="solar:check-circle-bold" width={20} />
                  </IconButton>
                  <IconButton size="small" onClick={cancelEdit} disabled={isBusy}>
                    <Iconify icon="mingcute:close-line" width={20} />
                  </IconButton>
                </Stack>
              ) : (
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => startEdit(category)} disabled={isBusy}>
                    <Iconify icon="solar:notes-bold-duotone" width={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(category)}
                    disabled={isBusy}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                  </IconButton>
                </Stack>
              )}
            </Stack>
          );
        })}
      </Stack>

      <Stack direction="row" spacing={1.5}>
        <TextField
          size="small"
          placeholder="ชื่อหมวดหมู่ใหม่"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
          }}
          fullWidth
        />
        <Button
          variant="contained"
          loading={creating}
          disabled={!newLabel.trim()}
          onClick={handleCreate}
          startIcon={<Iconify icon="mingcute:add-line" width={20} />}
          sx={{ flexShrink: 0 }}
        >
          เพิ่มหมวดหมู่
        </Button>
      </Stack>

      {dialog}
    </Box>
  );
}
