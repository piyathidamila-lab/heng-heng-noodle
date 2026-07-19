'use client';

import type { RestaurantTable } from 'src/lib/table-service';

import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { moveTable, createTable, deleteTable } from './table-actions';

// ----------------------------------------------------------------------

type Props = {
  initialTables: RestaurantTable[];
};

export function AdminTablesView({ initialTables }: Props) {
  const [tables, setTables] = useState(initialTables);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const { confirm, dialog } = useConfirmDialog();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleCreate = async () => {
    if (!newLabel.trim()) return;

    setCreating(true);
    try {
      const table = await createTable(newLabel);
      setTables((prev) => [...prev, table]);
      setNewLabel('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'เพิ่มโต๊ะไม่สำเร็จ');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (table: RestaurantTable) => {
    const confirmed = await confirm({
      content: `ลบโต๊ะ "${table.label}" ใช่หรือไม่?`,
      confirmLabel: 'ลบ',
    });
    if (!confirmed) return;

    setBusyId(table.id);
    try {
      await deleteTable(table.id);
      setTables((prev) => prev.filter((t) => t.id !== table.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ลบไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (table: RestaurantTable, direction: 'up' | 'down') => {
    const index = tables.findIndex((t) => t.id === table.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= tables.length) return;

    const next = [...tables];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setTables(next);

    setBusyId(table.id);
    try {
      await moveTable(table.id, direction);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ย้ายลำดับไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        flexWrap="wrap"
        spacing={2}
        sx={{ mb: 4, '@media print': { display: 'none' } }}
      >
        <Box>
          <Typography variant="h4">QR โต๊ะ</Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            สแกนแล้วลูกค้าจะเข้าสู่หน้าสั่งอาหารของโต๊ะนั้นโดยตรง — รายการโต๊ะนี้ใช้ร่วมกับตัวเลือก
            &quot;หมายเลขโต๊ะ&quot; ในหน้าสั่งอาหารของลูกค้าที่ไม่ได้สแกน QR ด้วย
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          disabled={tables.length === 0}
          onClick={() => window.print()}
          startIcon={<Iconify icon="solar:notes-bold-duotone" width={20} />}
        >
          พิมพ์ QR ทั้งหมด
        </Button>
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{ mb: 4, maxWidth: 420, '@media print': { display: 'none' } }}
      >
        <TextField
          size="small"
          placeholder="หมายเลข/ชื่อโต๊ะใหม่ เช่น 12 หรือ VIP1"
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
          เพิ่มโต๊ะ
        </Button>
      </Stack>

      {tables.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', '@media print': { display: 'none' } }}>
          ยังไม่มีโต๊ะ เพิ่มได้จากช่องด้านบน
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(3, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
            '@media print': {
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            },
          }}
        >
          {tables.map((table, index) => {
            const isBusy = busyId === table.id;

            return (
              <Stack
                key={table.id}
                alignItems="center"
                spacing={1.5}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: 'common.white',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  breakInside: 'avoid',
                  '@media print': { border: '1px dashed', borderColor: 'grey.400' },
                }}
              >
                <Typography variant="h6">โต๊ะ {table.label}</Typography>
                {origin && (
                  <QRCodeSVG
                    value={`${origin}/?table=${table.label}`}
                    size={160}
                    level="M"
                    marginSize={2}
                  />
                )}
                <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                  สแกนเพื่อสั่งอาหาร
                </Typography>

                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ '@media print': { display: 'none' } }}
                >
                  <IconButton
                    size="small"
                    disabled={index === 0 || isBusy}
                    onClick={() => handleMove(table, 'up')}
                  >
                    <Iconify icon="eva:arrow-upward-fill" width={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={index === tables.length - 1 || isBusy}
                    onClick={() => handleMove(table, 'down')}
                  >
                    <Iconify icon="eva:arrow-downward-fill" width={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={isBusy}
                    onClick={() => handleDelete(table)}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                  </IconButton>
                </Stack>
              </Stack>
            );
          })}
        </Box>
      )}

      {dialog}
    </Box>
  );
}
