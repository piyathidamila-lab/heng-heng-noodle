'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Logo } from 'src/components/logo';

// ----------------------------------------------------------------------

type Props = {
  table: string;
  shopName: string;
  onSubmit: (name: string) => void;
};

export function TableNameGate({ table, shopName, onSubmit }: Props) {
  const [name, setName] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: 6,
        bgcolor: 'primary.main',
        color: 'common.white',
        textAlign: 'center',
      }}
    >
      <Logo sx={{ width: 140, height: 140 }} />
      <Stack mt={2}>
        <Typography variant="h4">{shopName}</Typography>
        <Typography variant="subtitle1" sx={{ mt: 1, opacity: 0.8 }}>
          โต๊ะ {table}
        </Typography>
      </Stack>
      <Stack
        component="form"
        onSubmit={handleSubmit}
        spacing={2.5}
        sx={{ mt: 5, width: 1, maxWidth: 320 }}
      >
        <Typography variant="body1" sx={{ opacity: 0.85 }}>
          กรุณาใส่ชื่อของคุณก่อนเริ่มสั่งอาหาร
        </Typography>

        <TextField
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อของคุณ"
          autoFocus
          fullWidth
          slotProps={{
            input: {
              sx: { bgcolor: 'common.white', borderRadius: 1 },
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={!name.trim()}
        >
          เริ่มสั่งอาหาร
        </Button>
      </Stack>
    </Box>
  );
}
