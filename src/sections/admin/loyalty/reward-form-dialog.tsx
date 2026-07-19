'use client';

import type { RewardInput, LoyaltyReward } from 'src/lib/loyalty-service';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  editing: LoyaltyReward | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: RewardInput) => void;
};

const EMPTY_FORM: RewardInput = {
  name: '',
  description: '',
  starsCost: 10,
  isActive: true,
  sortOrder: 0,
};

export function RewardFormDialog({ open, editing, submitting, error, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<RewardInput>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              name: editing.name,
              description: editing.description,
              starsCost: editing.starsCost,
              isActive: editing.isActive,
              sortOrder: editing.sortOrder,
            }
          : EMPTY_FORM
      );
    }
  }, [open, editing]);

  const canSubmit = form.name.trim().length > 0 && form.starsCost > 0 && !submitting;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{editing ? 'แก้ไขของรางวัล' : 'เพิ่มของรางวัลใหม่'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            label="ชื่อของรางวัล"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            fullWidth
            autoFocus
          />

          <TextField
            label="รายละเอียด"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />

          <TextField
            label="จำนวนดาวที่ต้องใช้แลก"
            type="number"
            value={form.starsCost}
            onChange={(e) => setForm((prev) => ({ ...prev, starsCost: Number(e.target.value) }))}
            slotProps={{ htmlInput: { min: 1 } }}
            fullWidth
          />

          <TextField
            label="ลำดับการแสดงผล"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
            helperText="เลขน้อยแสดงก่อน"
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
            }
            label="เปิดให้แลกอยู่"
          />

          {error && <FormHelperText error>{error}</FormHelperText>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          ยกเลิก
        </Button>
        <Button variant="contained" disabled={!canSubmit} loading={submitting} onClick={() => onSubmit(form)}>
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
}
