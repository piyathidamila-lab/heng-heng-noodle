import type { CustomerInfo } from '../view/order-view';
import type { MenuItem as MenuItemType } from '../menu-data';
import type { RestaurantTable } from 'src/lib/table-service';
import type { CustomOrderSelection } from 'src/lib/shop-settings-service';

import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type CartLine = {
  item: MenuItemType;
  quantity: number;
  customization?: CustomOrderSelection;
};

type Props = {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  total: number;
  submitting: boolean;
  qrMode: boolean;
  tables: RestaurantTable[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  customer: CustomerInfo;
  onChangeCustomer: (patch: Partial<CustomerInfo>) => void;
  onConfirm: () => void;
};

export function CartSheet({
  open,
  onClose,
  lines,
  total,
  submitting,
  qrMode,
  tables,
  onAdd,
  onRemove,
  customer,
  onChangeCustomer,
  onConfirm,
}: Props) {
  const canConfirm =
    lines.length > 0 &&
    customer.name.trim().length > 0 &&
    (customer.orderType === 'takeaway' || customer.tableNumber.trim().length > 0);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            maxWidth: 480,
            mx: 'auto',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '88dvh',
          },
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, pt: 2, pb: 1 }}
      >
        <Typography variant="h6">ตะกร้าของฉัน</Typography>
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>

      <Stack sx={{ px: 2, pb: 3, overflowY: 'auto' }} spacing={2.5}>
        {lines.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
            ยังไม่มีรายการอาหารในตะกร้า
          </Typography>
        ) : (
          <Stack spacing={1.5} divider={<Divider flexItem />}>
            {lines.map(({ item, quantity, customization }) => (
              <Stack key={item.id} direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ fontSize: 24 }}>{item.emoji}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {item.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {item.price} บาท
                  </Typography>
                  {customization && (
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', display: 'block' }}
                    >
                      {item.description}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconButton size="small" color="primary" onClick={() => onRemove(item.id)}>
                    <Iconify icon="eva:minus-circle-fill" width={22} />
                  </IconButton>
                  <Typography variant="subtitle2" sx={{ minWidth: 18, textAlign: 'center' }}>
                    {quantity}
                  </Typography>
                  <IconButton size="small" color="primary" onClick={() => onAdd(item.id)}>
                    <Iconify icon="solar:add-circle-bold" width={22} />
                  </IconButton>
                </Stack>
                <Typography variant="subtitle2" sx={{ minWidth: 56, textAlign: 'right' }}>
                  {item.price * quantity} บาท
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {lines.length > 0 && (
          <>
            <Divider />

            <Stack spacing={1.5}>
              <Typography variant="subtitle1">ข้อมูลผู้สั่ง</Typography>

              {qrMode ? (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'grey.100' }}
                >
                  <Typography variant="body2">
                    สั่งโดย <strong>{customer.name}</strong> · โต๊ะ {customer.tableNumber}
                  </Typography>
                </Stack>
              ) : (
                <TextField
                  label="ชื่อผู้สั่ง"
                  size="small"
                  value={customer.name}
                  onChange={(e) => onChangeCustomer({ name: e.target.value })}
                  fullWidth
                />
              )}

              {!qrMode && (
                <RadioGroup
                  row
                  value={customer.orderType}
                  onChange={(e) =>
                    onChangeCustomer({ orderType: e.target.value as CustomerInfo['orderType'] })
                  }
                >
                  <FormControlLabel value="dine-in" control={<Radio />} label="ทานที่ร้าน" />
                  <FormControlLabel value="takeaway" control={<Radio />} label="กลับบ้าน" />
                </RadioGroup>
              )}

              {!qrMode && customer.orderType === 'dine-in' && (
                <TextField
                  select
                  label="หมายเลขโต๊ะ"
                  size="small"
                  value={customer.tableNumber}
                  onChange={(e) => onChangeCustomer({ tableNumber: e.target.value })}
                  helperText={
                    tables.length === 0 ? 'ยังไม่มีข้อมูลโต๊ะ กรุณาติดต่อพนักงาน' : undefined
                  }
                  disabled={tables.length === 0}
                  fullWidth
                >
                  {tables.map((table) => (
                    <MenuItem key={table.id} value={table.label}>
                      โต๊ะ {table.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                label="หมายเหตุ (ถ้ามี)"
                size="small"
                placeholder="เช่น ไม่ใส่ผัก, เผ็ดน้อย"
                value={customer.note}
                onChange={(e) => onChangeCustomer({ note: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>

            <Divider />

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle1">ยอดรวมทั้งหมด</Typography>
              <Typography variant="h6" color="primary.main">
                {total} บาท
              </Typography>
            </Stack>

            <Button
              variant="contained"
              size="large"
              disabled={!canConfirm}
              loading={submitting}
              onClick={onConfirm}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              ยืนยันสั่งอาหาร
            </Button>
          </>
        )}
      </Stack>
    </Drawer>
  );
}
