'use client';

import type { ShopSettings } from 'src/lib/shop-settings-service';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { updateShopSettings } from './settings-actions';

// ----------------------------------------------------------------------

type Props = {
  initialSettings: ShopSettings;
};

export function AdminSettingsView({ initialSettings }: Props) {
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const handleChange = (patch: Partial<ShopSettings>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await updateShopSettings(form);
      setForm(saved);
      toast.success('บันทึกข้อมูลร้านค้าแล้ว');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        ข้อมูลร้านค้า
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        ข้อมูลนี้จะแสดงในหน้าสั่งอาหารของลูกค้าและใช้สร้าง QR รับเงิน
      </Typography>

      <Stack spacing={2.5}>
        <TextField
          label="ชื่อร้าน"
          value={form.name}
          onChange={(e) => handleChange({ name: e.target.value })}
          fullWidth
        />
        <TextField
          label="ที่อยู่"
          value={form.address}
          onChange={(e) => handleChange({ address: e.target.value })}
          fullWidth
          multiline
          minRows={2}
        />
        <TextField
          label="เบอร์โทรติดต่อร้าน"
          value={form.phone}
          onChange={(e) => handleChange({ phone: e.target.value })}
          fullWidth
        />
        <TextField
          label="เลขพร้อมเพย์ของร้าน"
          value={form.promptPayId}
          onChange={(e) => handleChange({ promptPayId: e.target.value })}
          helperText="เบอร์โทรศัพท์หรือเลขบัตรประชาชนที่ผูกพร้อมเพย์ไว้ — ใช้สร้าง QR รับเงินตอนเช็คบิล"
          fullWidth
        />

        <Stack direction="row" spacing={2}>
          <TextField
            label="เวลาเปิดร้าน"
            placeholder="เช่น 08:00"
            value={form.openTime}
            onChange={(e) => handleChange({ openTime: e.target.value })}
            fullWidth
          />
          <TextField
            label="เวลาปิดร้าน"
            placeholder="เช่น 20:00"
            value={form.closeTime}
            onChange={(e) => handleChange({ closeTime: e.target.value })}
            fullWidth
          />
        </Stack>

        <Button
          variant="contained"
          size="large"
          loading={saving}
          onClick={handleSave}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
          sx={{ alignSelf: 'flex-start', px: 4 }}
        >
          บันทึก
        </Button>
      </Stack>
    </Box>
  );
}
