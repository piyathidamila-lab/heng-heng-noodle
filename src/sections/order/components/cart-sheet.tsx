import type { CustomerInfo } from '../view/order-view';
import type { IconifyName } from 'src/components/iconify';
import type { SessionMember } from 'src/lib/member-session';
import type { MenuItem as MenuItemType } from '../menu-data';
import type { CustomOrderSelection } from 'src/lib/shop-settings-service';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

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
  member: SessionMember | null;
  shopOpen: boolean;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  customer: CustomerInfo;
  onChangeCustomer: (patch: Partial<CustomerInfo>) => void;
  onScanTable: () => void;
  onConfirm: () => void;
};

export function CartSheet({
  open,
  onClose,
  lines,
  total,
  submitting,
  qrMode,
  member,
  shopOpen,
  onAdd,
  onRemove,
  customer,
  onChangeCustomer,
  onScanTable,
  onConfirm,
}: Props) {
  const canConfirm =
    shopOpen &&
    lines.length > 0 &&
    customer.name.trim().length > 0 &&
    (customer.orderType === 'takeaway' || customer.tableNumber.trim().length > 0);
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);

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
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '92dvh',
            bgcolor: '#FBF8F4',
            boxShadow: '0 -18px 60px rgba(68,24,18,0.18)',
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          px: 2.5,
          pt: 1.25,
          pb: 2.25,
          color: 'common.white',
          height: '150px',
          background: 'linear-gradient(135deg, #67100E 0%, #A51D17 62%, #D25125 100%)',
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 4,
            mx: 'auto',
            mb: 1.5,
            borderRadius: 1,
            bgcolor: 'rgba(255,255,255,0.40)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 130,
            height: 130,
            top: -70,
            right: -35,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.07)',
          }}
        />
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.14)',
              }}
            >
              <Iconify icon="solar:cart-3-bold" width={24} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: 'common.white' }}>
                ตะกร้าของฉัน
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.78 }}>
                ตรวจสอบรายการก่อนยืนยัน
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            {totalQuantity > 0 && (
              <Chip
                size="small"
                label={`${totalQuantity} รายการ`}
                sx={{ color: '#7A1010', fontWeight: 800, bgcolor: '#FFD976' }}
              />
            )}
            <IconButton
              onClick={onClose}
              aria-label="ปิดตะกร้า"
              sx={{
                mr: -1,
                color: 'common.white',
                bgcolor: 'rgba(255,255,255,0.12)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' },
              }}
            >
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      <Stack sx={{ flex: 1, px: 2, py: 2, overflowY: 'auto' }} spacing={2}>
        {lines.length === 0 ? (
          <Stack alignItems="center" spacing={1.25} sx={{ px: 2, py: 6 }}>
            <Box
              sx={{
                width: 82,
                height: 82,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                bgcolor: 'common.white',
                boxShadow: '0 8px 24px rgba(69,37,20,0.08)',
                fontSize: 40,
              }}
            >
              🍜
            </Box>
            <Typography variant="h6">ตะกร้ายังว่างอยู่</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              เลือกเมนูอร่อย ๆ แล้วกลับมาตรวจสอบรายการที่นี่
            </Typography>
            <Button variant="outlined" onClick={onClose} sx={{ mt: 1, borderRadius: 2 }}>
              กลับไปเลือกเมนู
            </Button>
          </Stack>
        ) : (
          <Stack spacing={1.25}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">รายการอาหาร</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {lines.length} เมนู · {totalQuantity} ชิ้น
              </Typography>
            </Stack>
            {lines.map(({ item, quantity, customization }) => (
              <Stack
                key={item.id}
                direction="row"
                spacing={1.25}
                alignItems="flex-start"
                sx={{
                  p: 1.25,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  bgcolor: 'common.white',
                  boxShadow: '0 5px 16px rgba(69,37,20,0.05)',
                }}
              >
                <Box
                  sx={{
                    width: 68,
                    height: 68,
                    display: 'grid',
                    flexShrink: 0,
                    placeItems: 'center',
                    borderRadius: 2,
                    bgcolor: '#F7F2EC',
                    fontSize: 30,
                    backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!item.imageUrl && item.emoji}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Typography
                      variant="subtitle2"
                      sx={{
                        flex: 1,
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        overflow: 'hidden',
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: 'primary.main', flexShrink: 0 }}>
                      ฿{(item.price * quantity).toLocaleString('th-TH')}
                    </Typography>
                  </Stack>
                  {customization && item.description && (
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 0.25,
                        color: 'text.secondary',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        overflow: 'hidden',
                      }}
                    >
                      {item.description}
                    </Typography>
                  )}

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mt: 1 }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      ฿{item.price.toLocaleString('th-TH')} / ชิ้น
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.25}
                      alignItems="center"
                      sx={{ p: 0.25, borderRadius: 2, bgcolor: '#F7F2EC' }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => onRemove(item.id)}
                        aria-label={`ลดจำนวน ${item.name}`}
                        sx={{ width: 30, height: 30, color: 'primary.main' }}
                      >
                        <Iconify icon="mingcute:minimize-line" width={18} />
                      </IconButton>
                      <Typography variant="subtitle2" sx={{ minWidth: 24, textAlign: 'center' }}>
                        {quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => onAdd(item.id)}
                        aria-label={`เพิ่มจำนวน ${item.name}`}
                        sx={{
                          width: 30,
                          height: 30,
                          color: 'common.white',
                          bgcolor: 'primary.main',
                          '&:hover': { bgcolor: 'primary.dark' },
                        }}
                      >
                        <Iconify icon="mingcute:add-line" width={18} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            ))}
          </Stack>
        )}

        {lines.length > 0 && (
          <>
            <Stack
              spacing={1.5}
              sx={{
                p: 1.75,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.200',
                bgcolor: 'common.white',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 1.75,
                    color: 'primary.main',
                    bgcolor: 'primary.lighter',
                  }}
                >
                  <Iconify icon="solar:user-id-bold" width={20} />
                </Box>
                <Box>
                  <Typography variant="subtitle1">ข้อมูลการสั่งซื้อ</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    ระบุข้อมูลให้ครบก่อนยืนยัน
                  </Typography>
                </Box>
              </Stack>

              {qrMode ? (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    color: '#087A4B',
                    bgcolor: '#E5F8ED',
                    border: '1px solid #B5E2C8',
                  }}
                >
                  <Iconify icon="solar:check-circle-bold" width={20} />
                  <Typography variant="body2">
                    สั่งโดย <strong>{customer.name}</strong> · โต๊ะ {customer.tableNumber}
                  </Typography>
                </Stack>
              ) : member ? (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    color: '#087A4B',
                    bgcolor: '#E5F8ED',
                    border: '1px solid #B5E2C8',
                  }}
                >
                  <Iconify icon="solar:check-circle-bold" width={20} />
                  <Typography variant="body2">
                    สั่งโดย <strong>{member.displayName}</strong>
                  </Typography>
                </Stack>
              ) : (
                <TextField
                  label="ชื่อผู้สั่ง *"
                  placeholder="กรอกชื่อของคุณ"
                  value={customer.name}
                  onChange={(e) => onChangeCustomer({ name: e.target.value })}
                  slotProps={{ input: { sx: { borderRadius: 2 } } }}
                  fullWidth
                />
              )}

              {!qrMode && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.25}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#FFF7E8',
                    border: '1px solid #F6E1AE',
                  }}
                >
                  <Iconify
                    icon={'solar:bag-smile-bold' as IconifyName}
                    width={20}
                    sx={{ color: '#B98900' }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">คำสั่งซื้อนี้เป็นแบบรับกลับบ้าน</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      ต้องการทานที่ร้าน? สแกน QR โค้ดที่โต๊ะของคุณ
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={onScanTable} sx={{ flexShrink: 0 }}>
                    สแกน QR
                  </Button>
                </Stack>
              )}

              <TextField
                label="หมายเหตุ (ถ้ามี)"
                placeholder="เช่น ไม่ใส่ผัก, เผ็ดน้อย"
                value={customer.note}
                onChange={(e) => onChangeCustomer({ note: e.target.value })}
                slotProps={{ input: { sx: { borderRadius: 2 } } }}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>

            {!shopOpen && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ p: 1.5, borderRadius: 2, color: 'error.main', bgcolor: 'error.lighter' }}
              >
                <Iconify icon="solar:close-circle-bold" width={20} />
                <Typography variant="body2">ร้านปิดอยู่ในขณะนี้ ไม่สามารถสั่งอาหารได้</Typography>
              </Stack>
            )}
          </>
        )}
      </Stack>

      {lines.length > 0 && (
        <Box
          sx={{
            px: 2,
            pt: 1.5,
            pb: 'max(16px, env(safe-area-inset-bottom))',
            borderTop: '1px solid',
            borderColor: 'grey.200',
            bgcolor: 'common.white',
            boxShadow: '0 -8px 24px rgba(69,37,20,0.07)',
          }}
        >
          <Stack
            direction="row"
            alignItems="flex-end"
            justifyContent="space-between"
            sx={{ mb: 1.25 }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                ยอดรวมสุทธิ
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                รวม {totalQuantity} ชิ้น
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'primary.main', lineHeight: 1 }}>
              ฿{total.toLocaleString('th-TH')}
            </Typography>
          </Stack>
          <Button
            fullWidth
            variant="contained"
            size="large"
            disabled={!canConfirm}
            loading={submitting}
            onClick={onConfirm}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            sx={{
              minHeight: 52,
              borderRadius: 2.5,
              background: canConfirm
                ? 'linear-gradient(135deg, #8B1111 0%, #C62828 100%)'
                : undefined,
              boxShadow: canConfirm ? '0 10px 22px rgba(113,17,17,0.24)' : 'none',
            }}
          >
            {shopOpen ? 'ยืนยันสั่งอาหาร' : 'ร้านปิดอยู่ขณะนี้'}
          </Button>
          {!canConfirm && shopOpen && (
            <Typography
              variant="caption"
              sx={{ mt: 0.75, display: 'block', color: 'text.secondary', textAlign: 'center' }}
            >
              กรุณากรอกชื่อและข้อมูลการรับอาหารให้ครบ
            </Typography>
          )}
        </Box>
      )}
    </Drawer>
  );
}
