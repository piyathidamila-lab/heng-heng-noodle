'use client';

import type { DropResult } from '@hello-pangea/dnd';
import type { MenuItem } from 'src/sections/order/menu-data';

import { useMemo, useState, useCallback } from 'react';
import { Draggable, Droppable, DragDropContext } from '@hello-pangea/dnd';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { addBestSeller, removeBestSeller, reorderBestSellers } from './best-seller-actions';

// ----------------------------------------------------------------------

type Props = {
  initialBestSellers: MenuItem[];
  allItems: MenuItem[];
};

type SortableItemProps = {
  item: MenuItem;
  index: number;
  isBusy: boolean;
  dragDisabled: boolean;
  onRemove: (item: MenuItem) => void;
};

function SortableItem({ item, index, isBusy, dragDisabled, onRemove }: SortableItemProps) {
  return (
    <Draggable draggableId={item.id} index={index} isDragDisabled={dragDisabled}>
      {(provided, snapshot) => (
        <Stack
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={provided.draggableProps.style}
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'common.white',
            border: '1px solid',
            borderColor: snapshot.isDragging ? 'primary.main' : 'grey.200',
            boxShadow: snapshot.isDragging
              ? '0 14px 32px rgba(145, 33, 33, 0.2)'
              : '0 2px 8px rgba(17, 24, 39, 0.04)',
            transition: (theme) =>
              theme.transitions.create(['border-color', 'box-shadow'], {
                duration: theme.transitions.duration.shortest,
              }),
          }}
        >
          <IconButton
            {...provided.dragHandleProps}
            size="small"
            disabled={dragDisabled}
            aria-label={`ลากเพื่อจัดลำดับ ${item.name}`}
            sx={{ cursor: dragDisabled ? 'default' : 'grab', touchAction: 'none' }}
          >
            <Iconify icon="custom:drag-dots-fill" width={22} />
          </IconButton>

          <Box
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              fontSize: 22,
              bgcolor: 'grey.100',
              backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!item.imageUrl && item.emoji}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap>
              {item.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {item.price} บาท{!item.isAvailable && ' · ปิดขายอยู่'}
            </Typography>
          </Box>

          <IconButton
            size="small"
            color="error"
            onClick={() => onRemove(item)}
            disabled={isBusy}
            aria-label={`ลบ ${item.name} ออกจากเมนูขายดี`}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      )}
    </Draggable>
  );
}

export function AdminBestSellersView({ initialBestSellers, allItems }: Props) {
  const [bestSellers, setBestSellers] = useState(initialBestSellers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [pickedItem, setPickedItem] = useState<MenuItem | null>(null);

  const availableItems = useMemo(
    () => allItems.filter((item) => !bestSellers.some((b) => b.id === item.id)),
    [allItems, bestSellers]
  );

  const handleAdd = async () => {
    if (!pickedItem) return;

    setAdding(true);
    try {
      const updated = await addBestSeller(pickedItem.id);
      setBestSellers(updated);
      setPickedItem(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'เพิ่มเมนูขายดีไม่สำเร็จ');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (item: MenuItem) => {
    setBusyId(item.id);
    try {
      await removeBestSeller(item.id);
      setBestSellers((prev) => prev.filter((b) => b.id !== item.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ลบไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination || reordering) return;

      const sourceIndex = result.source.index;
      const targetIndex = result.destination.index;
      if (sourceIndex === targetIndex) return;

      const previous = bestSellers;
      const next = [...bestSellers];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);

      setBestSellers(next);
      setReordering(true);
      try {
        await reorderBestSellers(next.map((item) => item.id));
      } catch (error) {
        setBestSellers(previous);
        toast.error(error instanceof Error ? error.message : 'จัดลำดับไม่สำเร็จ');
      } finally {
        setReordering(false);
      }
    },
    [bestSellers, reordering]
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        เมนูขายดี
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        เลือกเมนูที่จะโชว์เป็นแถบ &quot;เมนูขายดี&quot; ด้านบนสุดของหน้าสั่งอาหาร —
        ลากไอคอนด้านซ้ายเพื่อจัดลำดับที่ลูกค้าจะเห็น
      </Typography>

      <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
        <Droppable droppableId="best-sellers">
          {(provided, snapshot) => (
            <Stack
              ref={provided.innerRef}
              {...provided.droppableProps}
              spacing={1.5}
              sx={{
                mb: 4,
                minHeight: bestSellers.length === 0 ? 64 : undefined,
                borderRadius: 2,
                bgcolor: 'transparent',
                transition: (theme) =>
                  theme.transitions.create('background-color', {
                    duration: theme.transitions.duration.shortest,
                  }),
              }}
            >
              {bestSellers.length === 0 ? (
                <Typography sx={{ color: 'text.secondary', py: 2 }}>
                  ยังไม่มีเมนูขายดี เพิ่มได้จากช่องด้านล่าง
                </Typography>
              ) : (
                bestSellers.map((item, index) => {
                  const isBusy = busyId === item.id;

                  return (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={index}
                      isBusy={isBusy}
                      dragDisabled={reordering || isBusy}
                      onRemove={handleRemove}
                    />
                  );
                })
              )}
              {provided.placeholder}
            </Stack>
          )}
        </Droppable>
      </DragDropContext>

      <Stack direction="row" spacing={1.5}>
        <Autocomplete
          fullWidth
          size="small"
          options={availableItems}
          value={pickedItem}
          onChange={(_, next) => setPickedItem(next)}
          getOptionLabel={(item) => item.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(params) => <TextField {...params} placeholder="ค้นหาเมนูที่จะเพิ่ม" />}
        />
        <IconButton
          color="primary"
          disabled={!pickedItem || adding}
          onClick={handleAdd}
          sx={{
            flexShrink: 0,
            color: 'common.white',
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'grey.200' },
          }}
        >
          <Iconify icon="mingcute:add-line" width={22} />
        </IconButton>
      </Stack>
    </Box>
  );
}
