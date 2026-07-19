'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

type Props = {
  activeTable: string;
  onGoToActiveTable: () => void;
};

/**
 * Shown instead of the ordering UI when this device already has a different
 * table open — stops one customer from opening several tables at once by
 * scanning around. Clears itself automatically once staff closes the bill
 * for the table they're currently on.
 */
export function TableLockedNotice({ activeTable, onGoToActiveTable }: Props) {
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
      <Box sx={{ fontSize: 56, mb: 2 }}>🔒</Box>
      <Typography variant="h5">คุณมีโต๊ะที่ยังเปิดอยู่</Typography>

      <Stack spacing={2.5} sx={{ mt: 3, width: 1, maxWidth: 320 }}>
        <Typography variant="body1" sx={{ opacity: 0.85 }}>
          คุณกำลังใช้งานโต๊ะ {activeTable} อยู่ ไม่สามารถเปิดโต๊ะใหม่ได้จนกว่าพนักงานจะปิดบิลโต๊ะเดิมก่อน
        </Typography>

        <Button variant="contained" color="secondary" size="large" onClick={onGoToActiveTable}>
          กลับไปที่โต๊ะ {activeTable}
        </Button>
      </Stack>
    </Box>
  );
}
