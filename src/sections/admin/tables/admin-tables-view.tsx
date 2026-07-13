'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function AdminTablesView() {
  const [origin, setOrigin] = useState('');
  const [startTable, setStartTable] = useState(1);
  const [tableCount, setTableCount] = useState(10);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const tableNumbers = Array.from({ length: Math.max(0, tableCount) }, (_, i) => startTable + i);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="flex-end"
        justifyContent="space-between"
        flexWrap="wrap"
        spacing={2}
        sx={{ mb: 4, '@media print': { display: 'none' } }}
      >
        <Box>
          <Typography variant="h4">QR โต๊ะ</Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            สแกนแล้วลูกค้าจะเข้าสู่หน้าสั่งอาหารของโต๊ะนั้นโดยตรง
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="เริ่มจากโต๊ะที่"
            type="number"
            size="small"
            value={startTable}
            onChange={(e) => setStartTable(Math.max(1, Number(e.target.value)))}
            sx={{ width: 140 }}
            slotProps={{ htmlInput: { min: 1 } }}
          />
          <TextField
            label="จำนวนโต๊ะ"
            type="number"
            size="small"
            value={tableCount}
            onChange={(e) => setTableCount(Math.max(1, Number(e.target.value)))}
            sx={{ width: 140 }}
            slotProps={{ htmlInput: { min: 1, max: 200 } }}
          />
          <Button
            variant="contained"
            size="large"
            onClick={() => window.print()}
            startIcon={<Iconify icon="solar:notes-bold-duotone" width={20} />}
          >
            พิมพ์ QR ทั้งหมด
          </Button>
        </Stack>
      </Stack>

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
        {tableNumbers.map((table) => (
          <Stack
            key={table}
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
            <Typography variant="h6">โต๊ะ {table}</Typography>
            {origin && (
              <QRCodeSVG value={`${origin}/?table=${table}`} size={160} level="M" marginSize={2} />
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              สแกนเพื่อสั่งอาหาร
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}
