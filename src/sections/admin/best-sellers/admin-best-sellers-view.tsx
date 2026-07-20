'use client';

import type { DropResult } from '@hello-pangea/dnd';
import type { MenuItem } from 'src/sections/order/menu-data';

import { useMemo, useState, useCallback } from 'react';
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
import Autocomplete from '@mui/material/Autocomplete';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { addBestSeller, removeBestSeller, reorderBestSellers } from './best-seller-actions';

// ----------------------------------------------------------------------

type Props = {
  initialBestSellers: MenuItem[];
  allItems: MenuItem[];
};

type MenuThumbnailProps = {
  item: MenuItem;
  size?: number;
};

function MenuThumbnail({ item, size = 58 }: MenuThumbnailProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        borderRadius: 2,
        bgcolor: 'grey.100',
        fontSize: size * 0.42,
        backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!item.imageUrl && (item.emoji || '🍜')}
    </Box>
  );
}

export function AdminBestSellersView({ initialBestSellers, allItems }: Props) {
  const [bestSellers, setBestSellers] = useState(initialBestSellers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [pickedItem, setPickedItem] = useState<MenuItem | null>(null);

  const availableItems = useMemo(
    () => allItems.filter((item) => !bestSellers.some((bestSeller) => bestSeller.id === item.id)),
    [allItems, bestSellers]
  );
  const visibleCount = bestSellers.filter((item) => item.isAvailable).length;
  const hiddenCount = bestSellers.length - visibleCount;
  const interactionsDisabled = adding || reordering || Boolean(busyId);

  const handleAdd = async () => {
    if (!pickedItem || interactionsDisabled) return;

    setAdding(true);
    try {
      const updated = await addBestSeller(pickedItem.id);
      setBestSellers(updated);
      toast.success(`เพิ่ม “${pickedItem.name}” เป็นเมนูขายดีแล้ว`);
      setPickedItem(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'เพิ่มเมนูขายดีไม่สำเร็จ');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (item: MenuItem) => {
    if (interactionsDisabled) return;

    setBusyId(item.id);
    try {
      await removeBestSeller(item.id);
      setBestSellers((current) => current.filter((bestSeller) => bestSeller.id !== item.id));
      toast.success(`นำ “${item.name}” ออกจากเมนูขายดีแล้ว`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'นำออกไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination || reordering || busyId || adding) return;

      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      if (sourceIndex === destinationIndex) return;

      const previousItems = bestSellers;
      const reorderedItems = [...bestSellers];
      const [movedItem] = reorderedItems.splice(sourceIndex, 1);
      reorderedItems.splice(destinationIndex, 0, movedItem);

      setBestSellers(reorderedItems);
      setReordering(true);
      try {
        await reorderBestSellers(reorderedItems.map((item) => item.id));
        toast.success('บันทึกลำดับเมนูขายดีแล้ว');
      } catch (error) {
        setBestSellers(previousItems);
        toast.error(error instanceof Error ? error.message : 'บันทึกลำดับเมนูขายดีไม่สำเร็จ');
      } finally {
        setReordering(false);
      }
    },
    [adding, bestSellers, busyId, reordering]
  );

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
              เมนูขายดี
            </Typography>
            <Typography sx={{ mt: 0.75, color: 'rgba(255,255,255,0.78)' }}>
              เลือกและจัดอันดับเมนูเด่นที่จะแสดงให้ลูกค้าเห็นก่อน
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              icon={<Iconify icon="solar:cup-star-bold" width={18} />}
              label={`${bestSellers.length} เมนูขายดี`}
              sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
            />
            <Chip
              icon={<Iconify icon="custom:drag-dots-fill" width={18} />}
              label={reordering ? 'กำลังบันทึกลำดับ...' : 'ลากเพื่อจัดอันดับ'}
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
              <Typography variant="h6">เพิ่มเมนูขายดี</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                เมนูใหม่จะแสดงต่อท้ายรายการ
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Autocomplete
            fullWidth
            options={availableItems}
            value={pickedItem}
            disabled={interactionsDisabled}
            onChange={(_, nextItem) => setPickedItem(nextItem)}
            getOptionLabel={(item) => item.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="ไม่มีเมนูที่สามารถเพิ่มได้"
            renderInput={(params) => (
              <TextField {...params} label="เลือกเมนู" placeholder="ค้นหาชื่อเมนู" />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ width: 1 }}>
                  <MenuThumbnail item={option} size={42} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {option.price.toLocaleString('th-TH')} บาท
                      {!option.isAvailable && ' · ปิดขายอยู่'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
          />

          {pickedItem && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: 'grey.50' }}
            >
              <MenuThumbnail item={pickedItem} size={48} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {pickedItem.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {pickedItem.price.toLocaleString('th-TH')} บาท
                </Typography>
              </Box>
            </Stack>
          )}

          <Button
            fullWidth
            size="large"
            variant="contained"
            loading={adding}
            disabled={!pickedItem || reordering || Boolean(busyId)}
            onClick={handleAdd}
            startIcon={<Iconify icon="mingcute:add-line" width={20} />}
            sx={{ mt: 1.5 }}
          >
            เพิ่มเป็นเมนูขายดี
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
                เฉพาะเมนูที่เปิดขายเท่านั้นที่จะปรากฏในแถบเมนูขายดีของลูกค้า
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
            spacing={1.5}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="h5">อันดับที่ลูกค้าเห็น</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                จับไอคอนด้านซ้ายแล้วลากขึ้นหรือลง ระบบจะบันทึกให้อัตโนมัติ
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              <Chip size="small" color="success" variant="soft" label={`แสดง ${visibleCount}`} />
              {hiddenCount > 0 && (
                <Chip size="small" color="warning" variant="soft" label={`ปิดขาย ${hiddenCount}`} />
              )}
              <Chip
                size="small"
                variant="outlined"
                color={reordering ? 'warning' : 'default'}
                icon={
                  <Iconify
                    icon={reordering ? 'solar:clock-circle-bold' : 'solar:check-circle-bold'}
                    width={17}
                  />
                }
                label={reordering ? 'กำลังบันทึก' : 'พร้อมจัดอันดับ'}
              />
            </Stack>
          </Stack>

          {bestSellers.length === 0 ? (
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
              <Iconify icon="solar:cup-star-bold" width={54} color="text.disabled" />
              <Typography variant="h6" sx={{ mt: 1.5 }}>
                ยังไม่มีเมนูขายดี
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                เลือกเมนูจากแบบฟอร์มด้านบนเพื่อเริ่มจัดอันดับ
              </Typography>
            </Box>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="best-sellers">
                {(dropProvided) => (
                  <Stack
                    ref={dropProvided.innerRef}
                    {...dropProvided.droppableProps}
                    spacing={1.25}
                  >
                    {bestSellers.map((item, index) => {
                      const isBusy = busyId === item.id;

                      return (
                        <Draggable
                          key={item.id}
                          draggableId={item.id}
                          index={index}
                          isDragDisabled={interactionsDisabled}
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
                                <Tooltip title="ลากเพื่อเปลี่ยนอันดับ">
                                  <IconButton
                                    size="small"
                                    aria-label={`ลากเพื่อจัดอันดับ ${item.name}`}
                                    disabled={interactionsDisabled}
                                    {...dragProvided.dragHandleProps}
                                    sx={{
                                      flexShrink: 0,
                                      touchAction: 'none',
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
                                    color: index < 3 ? 'warning.darker' : 'text.secondary',
                                    bgcolor: index < 3 ? 'warning.lighter' : 'grey.100',
                                    typography: 'subtitle2',
                                  }}
                                >
                                  {index + 1}
                                </Box>

                                <MenuThumbnail item={item} />

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.75}
                                    useFlexGap
                                    flexWrap="wrap"
                                  >
                                    <Typography variant="subtitle1" noWrap>
                                      {item.name}
                                    </Typography>
                                    {index < 3 && (
                                      <Chip
                                        size="small"
                                        color="warning"
                                        variant="soft"
                                        label={`อันดับ ${index + 1}`}
                                      />
                                    )}
                                  </Stack>
                                  <Stack
                                    direction="row"
                                    spacing={0.75}
                                    useFlexGap
                                    flexWrap="wrap"
                                    sx={{ mt: 0.5 }}
                                  >
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {item.price.toLocaleString('th-TH')} บาท
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: item.isAvailable ? 'success.main' : 'warning.dark',
                                      }}
                                    >
                                      • {item.isAvailable ? 'พร้อมแสดง' : 'ปิดขายอยู่'}
                                    </Typography>
                                  </Stack>
                                </Box>

                                <Tooltip title="นำออกจากเมนูขายดี">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemove(item)}
                                      disabled={interactionsDisabled}
                                      aria-label={`นำ ${item.name} ออกจากเมนูขายดี`}
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
                            </Box>
                          )}
                        </Draggable>
                      );
                    })}
                    {dropProvided.placeholder}
                  </Stack>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </Card>
      </Stack>
    </Box>
  );
}
