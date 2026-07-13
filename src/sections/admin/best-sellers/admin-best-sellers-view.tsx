'use client';

import type { MenuItem } from 'src/sections/order/menu-data';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { addBestSeller, moveBestSeller, removeBestSeller } from './best-seller-actions';

// ----------------------------------------------------------------------

type Props = {
  initialBestSellers: MenuItem[];
  allItems: MenuItem[];
};

export function AdminBestSellersView({ initialBestSellers, allItems }: Props) {
  const [bestSellers, setBestSellers] = useState(initialBestSellers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
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

  const handleMove = async (item: MenuItem, direction: 'up' | 'down') => {
    const index = bestSellers.findIndex((b) => b.id === item.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= bestSellers.length) return;

    const next = [...bestSellers];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setBestSellers(next);

    setBusyId(item.id);
    try {
      await moveBestSeller(item.id, direction);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ย้ายลำดับไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        เมนูขายดี
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        เลือกเมนูที่จะโชว์เป็นแถบ &quot;เมนูขายดี&quot; ด้านบนสุดของหน้าสั่งอาหาร —
        ลำดับที่นี่คือลำดับที่ลูกค้าจะเห็น
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 4 }}>
        {bestSellers.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', py: 2 }}>
            ยังไม่มีเมนูขายดี เพิ่มได้จากช่องด้านล่าง
          </Typography>
        ) : (
          bestSellers.map((item, index) => {
            const isBusy = busyId === item.id;

            return (
              <Stack
                key={item.id}
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
                    onClick={() => handleMove(item, 'up')}
                  >
                    <Iconify icon="eva:arrow-upward-fill" width={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={index === bestSellers.length - 1 || isBusy}
                    onClick={() => handleMove(item, 'down')}
                  >
                    <Iconify icon="eva:arrow-downward-fill" width={16} />
                  </IconButton>
                </Stack>

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
                  onClick={() => handleRemove(item)}
                  disabled={isBusy}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              </Stack>
            );
          })
        )}
      </Stack>

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
