'use client';

import type { DropResult } from '@hello-pangea/dnd';
import type { MenuItemInput } from 'src/lib/menu-service';
import type { MenuCategory } from 'src/lib/category-service';
import type { MenuItem } from 'src/sections/order/menu-data';

import { useMemo, useState, useCallback } from 'react';
import { Draggable, Droppable, DragDropContext } from '@hello-pangea/dnd';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { MenuItemFormDialog } from './menu-item-form-dialog';
import { createMenuItem, deleteMenuItem, updateMenuItem, reorderMenuItems } from './menu-actions';

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
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortingMode, setSortingMode] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const { confirm, dialog } = useConfirmDialog();

  const availableCount = items.filter((item) => item.isAvailable).length;
  const hiddenCount = items.length - availableCount;
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('th-TH');
  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
        const matchesQuery =
          !normalizedQuery ||
          item.name.toLocaleLowerCase('th-TH').includes(normalizedQuery) ||
          item.description.toLocaleLowerCase('th-TH').includes(normalizedQuery);

        return matchesCategory && matchesQuery;
      }),
    [activeCategory, items, normalizedQuery]
  );

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
        setItems((prev) =>
          editing.category === updated.category
            ? prev.map((item) => (item.id === updated.id ? updated : item))
            : [...prev.filter((item) => item.id !== updated.id), updated]
        );
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

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination || savingOrder || activeCategory === 'all') return;

      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      if (sourceIndex === destinationIndex) return;

      const previousItems = items;
      const reorderedCategoryItems = [...visibleItems];
      const [moved] = reorderedCategoryItems.splice(sourceIndex, 1);
      reorderedCategoryItems.splice(destinationIndex, 0, moved);

      let categoryIndex = 0;
      const nextItems = items.map((item) =>
        item.category === activeCategory ? reorderedCategoryItems[categoryIndex++] : item
      );

      setItems(nextItems);
      setSavingOrder(true);
      try {
        await reorderMenuItems(
          activeCategory,
          reorderedCategoryItems.map((item) => item.id)
        );
      } catch (error) {
        setItems(previousItems);
        toast.error(error instanceof Error ? error.message : 'บันทึกลำดับเมนูไม่สำเร็จ');
      } finally {
        setSavingOrder(false);
      }
    },
    [activeCategory, items, savingOrder, visibleItems]
  );

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, sm: 3.5 },
          overflow: 'hidden',
          position: 'relative',
          borderRadius: 3,
          color: 'common.white',
          background: 'linear-gradient(135deg, #7F1D1D 0%, #B91C1C 55%, #E85D36 100%)',

          '&::after': {
            content: '""',
            position: 'absolute',
            width: 240,
            height: 240,
            right: -70,
            top: -110,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2.5}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box>
            <Typography variant="h3" sx={{ mb: 0.75, color: 'inherit' }}>
              จัดการเมนู
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.78)' }}>
              ดูภาพรวม แก้ไขข้อมูล และควบคุมเมนูที่พร้อมขาย
            </Typography>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2.5 }}>
              <Chip
                label={`ทั้งหมด ${items.length} เมนู`}
                sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
              />
              <Chip
                label={`พร้อมขาย ${availableCount}`}
                sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
              />
              {hiddenCount > 0 && (
                <Chip
                  label={`ปิดขาย ${hiddenCount}`}
                  sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
                />
              )}
            </Stack>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<Iconify icon="mingcute:add-line" width={22} />}
            onClick={openCreate}
            sx={{
              flexShrink: 0,
              px: 3,
              py: 1.25,
              color: 'primary.darker',
              bgcolor: 'common.white',
              boxShadow: '0 10px 30px rgba(0,0,0,0.16)',
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            เพิ่มเมนูใหม่
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          mb: 3,
          px: { xs: 1.5, sm: 2 },
          py: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2.5,
          bgcolor: 'background.paper',
          boxShadow: '0 8px 24px rgba(17, 24, 39, 0.05)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={1.5}
        >
          <TextField
            size="small"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              if (event.target.value) setSortingMode(false);
            }}
            placeholder="ค้นหาชื่อหรือรายละเอียดเมนู..."
            sx={{ width: { xs: 1, md: 320 }, flexShrink: 0 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={20} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Tabs
            value={activeCategory}
            onChange={(_, value) => {
              setActiveCategory(value);
              setSortingMode(false);
            }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              flex: 1,
              minWidth: 0,
              '& .MuiTab-root': { minHeight: 48, px: 2 },
            }}
          >
            <Tab value="all" label={`ทั้งหมด (${items.length})`} />
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

          <Tooltip
            title={
              activeCategory === 'all'
                ? 'เลือกหมวดหมู่ก่อนจัดเรียง'
                : normalizedQuery
                  ? 'ล้างคำค้นก่อนจัดเรียง'
                  : sortingMode
                    ? 'กลับไปดูแบบการ์ด'
                    : 'ลากเพื่อเรียงเมนูในหมวดนี้'
            }
          >
            <span>
              <Button
                variant={sortingMode ? 'contained' : 'outlined'}
                color={sortingMode ? 'primary' : 'inherit'}
                disabled={activeCategory === 'all' || !!normalizedQuery || visibleItems.length < 2}
                loading={savingOrder}
                startIcon={<Iconify icon="custom:drag-dots-fill" width={20} />}
                onClick={() => setSortingMode((current) => !current)}
                sx={{ height: 40, whiteSpace: 'nowrap' }}
              >
                {sortingMode ? 'จัดเรียงอยู่' : 'จัดเรียงเมนู'}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {sortingMode && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          <Iconify icon="custom:drag-dots-fill" width={20} />
          <Typography variant="body2">
            ลากไอคอนบนการ์ดเพื่อจัดลำดับ ระบบจะบันทึกให้อัตโนมัติหลังวาง
          </Typography>
        </Stack>
      )}

      {visibleItems.length === 0 ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1.5}
          sx={{ minHeight: 320, borderRadius: 3, bgcolor: 'background.neutral' }}
        >
          <Box
            sx={{
              width: 76,
              height: 76,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              color: 'text.secondary',
              bgcolor: 'background.paper',
            }}
          >
            <Iconify icon="solar:gallery-wide-bold" width={36} />
          </Box>
          <Typography variant="h6">ไม่พบเมนูที่ค้นหา</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ลองเปลี่ยนคำค้นหรือเลือกหมวดหมู่อื่น
          </Typography>
        </Stack>
      ) : (
        <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
          <Droppable droppableId={`menu-${activeCategory}`} isDropDisabled={!sortingMode}>
            {(dropProvided, dropSnapshot) => (
              <Box
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                sx={{
                  display: 'grid',
                  gap: { xs: 2, sm: 2.5 },
                  p: sortingMode ? 1.5 : 0,
                  borderRadius: 3,
                  bgcolor: dropSnapshot.isDraggingOver ? 'action.hover' : 'transparent',
                  gridTemplateColumns: sortingMode
                    ? 'minmax(0, 1fr)'
                    : {
                        xs: '1fr',
                        sm: 'repeat(3, minmax(0, 1fr))',
                        xl: 'repeat(3, minmax(0, 1fr))',
                      },
                  transition: (theme) =>
                    theme.transitions.create('background-color', {
                      duration: theme.transitions.duration.shortest,
                    }),
                }}
              >
                {visibleItems.map((item, index) => {
                  const categoryLabel =
                    categories.find((category) => category.value === item.category)?.label ??
                    item.category;

                  return (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                      isDragDisabled={!sortingMode || savingOrder}
                    >
                      {(dragProvided, dragSnapshot) => (
                        <Box
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          style={dragProvided.draggableProps.style}
                          sx={{
                            width: 1,
                            maxWidth: sortingMode ? '100%' : 'none',
                            minWidth: 0,
                            mx: sortingMode ? 'auto' : 0,
                            overflow: 'hidden',
                            display: sortingMode ? { xs: 'block', sm: 'flex' } : 'block',
                            borderRadius: 3,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: dragSnapshot.isDragging
                              ? 'primary.main'
                              : item.isAvailable
                                ? 'divider'
                                : 'grey.300',
                            boxShadow: dragSnapshot.isDragging
                              ? '0 20px 45px rgba(145, 33, 33, 0.22)'
                              : '0 10px 30px rgba(17, 24, 39, 0.07)',
                            transition: (theme) =>
                              theme.transitions.create(['border-color', 'box-shadow'], {
                                duration: theme.transitions.duration.shorter,
                              }),
                          }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              aspectRatio: '4 / 3',
                              width: sortingMode ? { xs: 1, sm: 220 } : 1,
                              flexShrink: 0,
                              display: 'grid',
                              placeItems: 'center',
                              overflow: 'hidden',
                              fontSize: 72,
                              background: item.imageUrl
                                ? `url(${item.imageUrl}) center / cover no-repeat`
                                : 'linear-gradient(145deg, #FFF1E7 0%, #FDE2CF 100%)',
                              filter: item.isAvailable ? 'none' : 'grayscale(0.45)',
                            }}
                          >
                            {!item.imageUrl && item.emoji}

                            {sortingMode && (
                              <IconButton
                                {...dragProvided.dragHandleProps}
                                aria-label={`ลากเพื่อจัดลำดับ ${item.name}`}
                                sx={{
                                  position: 'absolute',
                                  top: 12,
                                  left: 12,
                                  zIndex: 2,
                                  color: 'primary.main',
                                  bgcolor: 'rgba(255,255,255,0.94)',
                                  boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
                                  cursor: savingOrder ? 'default' : 'grab',
                                  '&:hover': { bgcolor: 'common.white' },
                                }}
                              >
                                <Iconify icon="custom:drag-dots-fill" width={24} />
                              </IconButton>
                            )}

                            <Chip
                              size="small"
                              label={categoryLabel}
                              sx={{
                                position: 'absolute',
                                top: 14,
                                left: sortingMode ? 60 : 14,
                                fontWeight: 700,
                                bgcolor: 'rgba(255,255,255,0.9)',
                                backdropFilter: 'blur(8px)',
                              }}
                            />
                            <Chip
                              size="small"
                              label={item.isAvailable ? 'พร้อมขาย' : 'ปิดขาย'}
                              color={item.isAvailable ? 'success' : 'default'}
                              sx={{
                                position: 'absolute',
                                top: 14,
                                right: 14,
                                fontWeight: 700,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                              }}
                            />
                          </Box>

                          <Stack spacing={2} sx={{ p: 2.5, flex: 1, minWidth: 0 }}>
                            <Box>
                              <Stack
                                direction="row"
                                alignItems="flex-start"
                                justifyContent="space-between"
                              >
                                <Typography variant="h6" sx={{ pr: 1, fontWeight: 800 }}>
                                  {item.name}
                                </Typography>
                                <Typography
                                  variant="h6"
                                  sx={{ flexShrink: 0, color: 'primary.main', fontWeight: 800 }}
                                >
                                  ฿{item.price.toLocaleString('th-TH')}
                                </Typography>
                              </Stack>
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 0.75,
                                  minHeight: '2.8em',
                                  color: 'text.secondary',
                                  display: '-webkit-box',
                                  WebkitBoxOrient: 'vertical',
                                  WebkitLineClamp: 2,
                                  overflow: 'hidden',
                                }}
                              >
                                {item.description || 'ยังไม่มีรายละเอียดเมนู'}
                              </Typography>
                            </Box>

                            <Divider />

                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Switch
                                  size="small"
                                  checked={item.isAvailable}
                                  onChange={() => handleToggleAvailable(item)}
                                  inputProps={{ 'aria-label': `สถานะขาย ${item.name}` }}
                                />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {item.isAvailable ? 'เปิดขายอยู่' : 'ปิดขายอยู่'}
                                </Typography>
                              </Stack>

                              <Stack direction="row" spacing={0.5}>
                                <Tooltip title="แก้ไขเมนู">
                                  <IconButton
                                    size="small"
                                    onClick={() => openEdit(item)}
                                    aria-label={`แก้ไข ${item.name}`}
                                    sx={{ bgcolor: 'action.hover' }}
                                  >
                                    <Iconify icon="solar:notes-bold-duotone" width={20} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="ลบเมนู">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDelete(item)}
                                    aria-label={`ลบ ${item.name}`}
                                    sx={{ bgcolor: 'error.lighter' }}
                                  >
                                    <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Stack>
                          </Stack>
                        </Box>
                      )}
                    </Draggable>
                  );
                })}
                {dropProvided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      )}

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
