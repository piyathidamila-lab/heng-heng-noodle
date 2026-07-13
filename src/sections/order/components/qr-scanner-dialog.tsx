'use client';

import QrScanner from 'qr-scanner';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onScan: (tableLabel: string) => void;
};

/**
 * Table QR codes encode a full order-page URL (`/?table=5`) — pull the
 * table label out of that, but also accept a bare label in case someone
 * scans a differently-formatted code.
 */
function extractTableLabel(value: string): string | null {
  try {
    const url = new URL(value);
    const table = url.searchParams.get('table')?.trim();
    return table || null;
  } catch {
    return value.trim() || null;
  }
}

export function QrScannerDialog({ open, onClose, onScan }: Props) {
  // A state-backed callback ref (rather than useRef) so the effect below
  // re-runs once the <video> node actually mounts — MUI's Dialog portals
  // its content in a render pass after `open` flips true, so a plain ref
  // read from a `[open]`-keyed effect would still be null.
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    setVideoEl(node);
  }, []);

  useEffect(() => {
    if (!open || !videoEl) return undefined;

    setError(null);

    const scanner = new QrScanner(
      videoEl,
      (result) => {
        const table = extractTableLabel(result.data);
        if (table) {
          scanner.stop();
          onScan(table);
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: 'environment',
      }
    );

    scanner.start().catch(() => {
      setError('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้กล้องแล้วลองใหม่');
    });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, [open, videoEl, onScan]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      slotProps={{ paper: { sx: { bgcolor: 'common.black' } } }}
    >
      <Stack sx={{ height: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2 }}
        >
          <Typography variant="subtitle1" sx={{ color: 'common.white' }}>
            สแกน QR โต๊ะ
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'common.white' }}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Stack>

        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Box
            component="video"
            ref={videoRef}
            muted
            playsInline
            sx={{ width: 1, height: 1, objectFit: 'cover' }}
          />
        </Box>

        <Typography
          variant="body2"
          sx={{ color: 'common.white', textAlign: 'center', opacity: 0.8, p: 2.5 }}
        >
          {error || 'เล็งกล้องไปที่ QR โต๊ะบนโต๊ะอาหาร'}
        </Typography>
      </Stack>
    </Dialog>
  );
}
