'use client';

import type { MenuItemInput } from 'src/lib/menu-service';
import type { MenuCategory } from 'src/lib/category-service';
import type { MenuItem } from 'src/sections/order/menu-data';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { MenuItemFormDialog } from './menu-item-form-dialog';
import { createMenuItem, deleteMenuItem, updateMenuItem } from './menu-actions';

// ----------------------------------------------------------------------

type Props = {
  initialItems: MenuItem[];
  categories: MenuCategory[];
};

export function AdminMenuView({ initialItems, categories }: Props) {
  const [items, setItems] = useState(initialItems);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.value ?? '');
  const { confirm, dialog } = useConfirmDialog();

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: MenuItemInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        const updated = await updateMenuItem(editing.id, input, editing.imageUrl);
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await createMenuItem(input);
        setItems((prev) => [...prev, created]);
      }
      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    const updated = await updateMenuItem(
      item.id,
      {
        category: item.category,
        name: item.name,
        description: item.description,
        price: item.price,
        emoji: item.emoji,
        imageUrl: item.imageUrl,
        isAvailable: !item.isAvailable,
      },
      item.imageUrl
    );
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  };

  const handleDelete = async (item: MenuItem) => {
    const confirmed = await confirm({
      content: `ลบเมนู "${item.name}" ใช่หรือไม่?`,
      confirmLabel: 'ลบ',
    });
    if (!confirmed) return;

    await deleteMenuItem(item.id, item.imageUrl);
    setItems((prev) => prev.filter((it) => it.id !== item.id));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Typography variant="h4">จัดการเมนู</Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<Iconify icon="mingcute:add-line" width={22} />}
          onClick={openCreate}
          sx={{ px: 3, py: 1.25, fontSize: 16 }}
        >
          เพิ่มเมนู
        </Button>
      </Stack>

      <Tabs
        value={activeCategory}
        onChange={(_, value) => setActiveCategory(value)}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {categories.map((category) => {
          const count = items.filter((item) => item.category === category.value).length;
          return (
            <Tab
              key={category.value}
              value={category.value}
              label={`${category.label} (${count})`}
            />
          );
        })}
      </Tabs>

      {(() => {
        const categoryItems = items.filter((item) => item.category === activeCategory);

        if (categoryItems.length === 0) {
          return (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 8 }}>
              ยังไม่มีเมนูในหมวดนี้
            </Typography>
          );
        }

        return (
          <Box
            sx={{
              display: 'grid',
              gap: 2.5,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            {categoryItems.map((item) => (
              <Stack
                key={item.id}
                spacing={1.75}
                sx={{
                  p: 2.75,
                  borderRadius: 2.5,
                  bgcolor: 'common.white',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  opacity: item.isAvailable ? 1 : 0.6,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      flexShrink: 0,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 34,
                      bgcolor: 'grey.100',
                      backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {!item.imageUrl && item.emoji}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                        {item.name}
                      </Typography>
                      {!item.isAvailable && <Chip label="ปิดขาย" size="small" />}
                    </Stack>
                    <Typography variant="h6" color="primary.main" sx={{ mt: 0.25 }}>
                      {item.price} บาท
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    overflow: 'hidden',
                    minHeight: '2.6em',
                  }}
                >
                  {item.description}
                </Typography>

                <Divider />

                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Switch
                      checked={item.isAvailable}
                      onChange={() => handleToggleAvailable(item)}
                    />
                    <Typography variant="body2">
                      {item.isAvailable ? 'พร้อมขาย' : 'ปิดขาย'}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="medium" onClick={() => openEdit(item)}>
                      <Iconify icon="solar:notes-bold-duotone" width={22} />
                    </IconButton>
                    <IconButton size="medium" color="error" onClick={() => handleDelete(item)}>
                      <Iconify icon="solar:trash-bin-trash-bold" width={22} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Stack>
            ))}
          </Box>
        );
      })()}

      <MenuItemFormDialog
        open={dialogOpen}
        editing={editing}
        categories={categories}
        submitting={submitting}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      {dialog}
    </Box>
  );
}
