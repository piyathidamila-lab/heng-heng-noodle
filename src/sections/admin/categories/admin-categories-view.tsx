'use client';

import type { DropResult } from '@hello-pangea/dnd';
import type { MenuCategory } from 'src/lib/category-service';

import { useState, useCallback } from 'react';
import { Draggable, Droppable, DragDropContext } from '@hello-pangea/dnd';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
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

import {
  createCategory,
  deleteCategory,
  reorderCategories,
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
  const [savingOrder, setSavingOrder] = useState(false);
  const { confirm, dialog } = useConfirmDialog();

  const handleCreate = async () => {
    const label = newLabel.trim();
    if (!label || creating || savingOrder) return;

    setCreating(true);
    try {
      const category = await createCategory(label);
      setCategories((current) => [...current, category]);
      setNewLabel('');
      toast.success(`เพิ่มหมวดหมู่ “${category.label}” แล้ว`);
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
    const label = editingLabel.trim();
    if (!label || busyId) return;

    setBusyId(id);
    try {
      const updated = await updateCategoryLabel(id, label);
      setCategories((current) =>
        current.map((category) => (category.id === id ? updated : category))
      );
      cancelEdit();
      toast.success('บันทึกชื่อหมวดหมู่แล้ว');
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
      setCategories((current) => current.filter((item) => item.id !== category.id));
      if (editingId === category.id) cancelEdit();
      toast.success('ลบหมวดหมู่แล้ว');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ลบไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination || savingOrder || busyId || editingId) return;

      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      if (sourceIndex === destinationIndex) return;

      const previousCategories = categories;
      const reordered = [...categories];
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(destinationIndex, 0, moved);
      const nextCategories = reordered.map((category, index) => ({
        ...category,
        sortOrder: index + 1,
      }));

      setCategories(nextCategories);
      setSavingOrder(true);
      try {
        await reorderCategories(nextCategories.map((category) => category.id));
        toast.success('บันทึกลำดับหมวดหมู่แล้ว');
      } catch (error) {
        setCategories(previousCategories);
        toast.error(error instanceof Error ? error.message : 'บันทึกลำดับหมวดหมู่ไม่สำเร็จ');
      } finally {
        setSavingOrder(false);
      }
    },
    [busyId, categories, editingId, savingOrder]
  );

  const interactionsDisabled = creating || savingOrder || Boolean(busyId);

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
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 180,
            height: 180,
            right: 70,
            bottom: -135,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.07)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 230,
            height: 230,
            top: -130,
            right: -55,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.09)',
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
            <Typography variant="h3" sx={{ color: 'inherit' }}>
              จัดการหมวดหมู่
            </Typography>
            <Typography sx={{ mt: 0.75, color: 'rgba(255,255,255,0.78)' }}>
              จัดกลุ่มเมนูให้ลูกค้าค้นหาและเลือกอาหารได้ง่ายขึ้น
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              icon={<Iconify icon="solar:tag-horizontal-bold-duotone" width={18} />}
              label={`${categories.length} หมวดหมู่`}
              sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
            />
            <Chip
              icon={<Iconify icon="custom:drag-dots-fill" width={18} />}
              label={savingOrder ? 'กำลังบันทึกลำดับ...' : 'ลากเพื่อเรียงลำดับ'}
              sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
            />
          </Stack>
        </Stack>
      </Box>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
        <Card
          sx={{
            width: { xs: 1, lg: 360 },
            flexShrink: 0,
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                color: 'primary.main',
                bgcolor: 'primary.lighter',
              }}
            >
              <Iconify icon="mingcute:add-line" width={24} />
            </Box>
            <Box>
              <Typography variant="h6">เพิ่มหมวดหมู่ใหม่</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                หมวดใหม่จะแสดงต่อท้ายรายการ
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <TextField
            fullWidth
            label="ชื่อหมวดหมู่"
            placeholder="เช่น ก๋วยเตี๋ยว ของทานเล่น"
            value={newLabel}
            disabled={interactionsDisabled}
            onChange={(event) => setNewLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleCreate();
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:tag-horizontal-bold-duotone" width={20} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            fullWidth
            size="large"
            variant="contained"
            loading={creating}
            disabled={!newLabel.trim() || savingOrder || Boolean(busyId)}
            onClick={handleCreate}
            startIcon={<Iconify icon="mingcute:add-line" width={20} />}
            sx={{ mt: 1.5 }}
          >
            เพิ่มหมวดหมู่
          </Button>

          <Box
            sx={{
              mt: 2.5,
              p: 1.75,
              borderRadius: 2,
              color: 'info.darker',
              bgcolor: 'info.lighter',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Iconify icon="solar:info-circle-bold" width={20} sx={{ mt: 0.1, flexShrink: 0 }} />
              <Typography variant="caption">
                ลำดับหมวดหมู่ในหน้านี้คือลำดับแท็บเมนูที่ลูกค้าเห็นในหน้าสั่งอาหาร
              </Typography>
            </Stack>
          </Box>
        </Card>

        <Card
          sx={{
            width: 1,
            minWidth: 0,
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="h5">ลำดับหมวดหมู่</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                จับไอคอนด้านซ้ายแล้วลากขึ้นหรือลง ระบบจะบันทึกให้อัตโนมัติ
              </Typography>
            </Box>
            <Chip
              size="small"
              variant="outlined"
              color={savingOrder ? 'warning' : 'default'}
              icon={
                <Iconify
                  icon={savingOrder ? 'solar:clock-circle-bold' : 'solar:check-circle-bold'}
                  width={17}
                />
              }
              label={savingOrder ? 'กำลังบันทึก' : 'พร้อมจัดเรียง'}
            />
          </Stack>

          {categories.length === 0 ? (
            <Box
              sx={{
                py: 7,
                px: 2,
                textAlign: 'center',
                borderRadius: 2.5,
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: 'grey.50',
              }}
            >
              <Iconify icon="solar:tag-horizontal-bold-duotone" width={54} color="text.disabled" />
              <Typography variant="h6" sx={{ mt: 1.5 }}>
                ยังไม่มีหมวดหมู่
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                เริ่มสร้างหมวดแรกได้จากแบบฟอร์มด้านบน
              </Typography>
            </Box>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="menu-categories">
                {(provided) => (
                  <Stack ref={provided.innerRef} {...provided.droppableProps} spacing={1.25}>
                    {categories.map((category, index) => {
                      const isEditing = editingId === category.id;
                      const isBusy = busyId === category.id;

                      return (
                        <Draggable
                          key={category.id}
                          draggableId={category.id}
                          index={index}
                          isDragDisabled={interactionsDisabled || Boolean(editingId)}
                        >
                          {(dragProvided, snapshot) => (
                            <Box
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              sx={{
                                p: { xs: 1.25, sm: 1.5 },
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
                                bgcolor: snapshot.isDragging
                                  ? 'primary.lighter'
                                  : 'background.paper',
                                boxShadow: snapshot.isDragging
                                  ? '0 18px 40px rgba(103,16,14,0.20)'
                                  : '0 4px 14px rgba(33,43,54,0.04)',
                                transition: 'border-color 150ms ease, box-shadow 150ms ease',
                                ...dragProvided.draggableProps.style,
                              }}
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={{ xs: 0.75, sm: 1.25 }}
                              >
                                <Tooltip title="ลากเพื่อเปลี่ยนลำดับ">
                                  <IconButton
                                    size="small"
                                    aria-label={`ลากเพื่อจัดลำดับ ${category.label}`}
                                    disabled={interactionsDisabled || Boolean(editingId)}
                                    {...dragProvided.dragHandleProps}
                                    sx={{
                                      flexShrink: 0,
                                      cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                      color: 'text.secondary',
                                      bgcolor: 'grey.100',
                                      '&:hover': {
                                        color: 'primary.main',
                                        bgcolor: 'primary.lighter',
                                      },
                                    }}
                                  >
                                    <Iconify icon="custom:drag-dots-fill" width={21} />
                                  </IconButton>
                                </Tooltip>

                                <Box
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    display: { xs: 'none', sm: 'grid' },
                                    placeItems: 'center',
                                    flexShrink: 0,
                                    borderRadius: 1.5,
                                    color: 'primary.main',
                                    bgcolor: 'primary.lighter',
                                    typography: 'subtitle2',
                                  }}
                                >
                                  {index + 1}
                                </Box>

                                {isEditing ? (
                                  <TextField
                                    autoFocus
                                    fullWidth
                                    size="small"
                                    value={editingLabel}
                                    disabled={isBusy}
                                    onChange={(event) => setEditingLabel(event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') handleSaveEdit(category.id);
                                      if (event.key === 'Escape') cancelEdit();
                                    }}
                                    inputProps={{ 'aria-label': 'ชื่อหมวดหมู่' }}
                                  />
                                ) : (
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle1" noWrap>
                                      {category.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      ลำดับที่ {index + 1} ในหน้าสั่งอาหาร
                                    </Typography>
                                  </Box>
                                )}

                                {isEditing ? (
                                  <Stack direction="row" spacing={0.25} flexShrink={0}>
                                    <Tooltip title="บันทึก">
                                      <span>
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          disabled={isBusy || !editingLabel.trim()}
                                          onClick={() => handleSaveEdit(category.id)}
                                        >
                                          <Iconify
                                            icon={
                                              isBusy
                                                ? 'solar:clock-circle-bold'
                                                : 'solar:check-circle-bold'
                                            }
                                            width={21}
                                          />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title="ยกเลิก">
                                      <span>
                                        <IconButton
                                          size="small"
                                          onClick={cancelEdit}
                                          disabled={isBusy}
                                        >
                                          <Iconify icon="mingcute:close-line" width={21} />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Stack>
                                ) : (
                                  <Stack direction="row" spacing={0.25} flexShrink={0}>
                                    <Tooltip title="แก้ไขชื่อ">
                                      <span>
                                        <IconButton
                                          size="small"
                                          onClick={() => startEdit(category)}
                                          disabled={interactionsDisabled}
                                          sx={{ color: 'text.secondary' }}
                                        >
                                          <Iconify icon="solar:notes-bold-duotone" width={20} />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title="ลบหมวดหมู่">
                                      <span>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleDelete(category)}
                                          disabled={interactionsDisabled}
                                        >
                                          <Iconify
                                            icon={
                                              isBusy
                                                ? 'solar:clock-circle-bold'
                                                : 'solar:trash-bin-trash-bold'
                                            }
                                            width={20}
                                          />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Stack>
                                )}
                              </Stack>
                            </Box>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </Stack>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </Card>
      </Stack>

      {dialog}
    </Box>
  );
}
