'use client';

import type { CartLine } from '../components/cart-sheet';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { CartSheet } from '../components/cart-sheet';
import { MENU_ITEMS, MENU_CATEGORIES } from '../menu-data';
import { MenuItemCard } from '../components/menu-item-card';
import { OrderConfirmed } from '../components/order-confirmed';

// ----------------------------------------------------------------------

export type CustomerInfo = {
  name: string;
  phone: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber: string;
  note: string;
};

const EMPTY_CUSTOMER: CustomerInfo = {
  name: '',
  phone: '',
  orderType: 'dine-in',
  tableNumber: '',
  note: '',
};

type ConfirmedOrder = {
  orderNumber: string;
  orderTime: Date;
  lines: CartLine[];
  total: number;
  customer: CustomerInfo;
};

export function OrderView() {
  const [activeCategory, setActiveCategory] = useState(MENU_CATEGORIES[0].value);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerInfo>(EMPTY_CUSTOMER);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  const cartLines: CartLine[] = useMemo(
    () =>
      MENU_ITEMS.filter((item) => quantities[item.id] > 0).map((item) => ({
        item,
        quantity: quantities[item.id],
      })),
    [quantities]
  );

  const totalQuantity = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const totalPrice = cartLines.reduce((sum, line) => sum + line.quantity * line.item.price, 0);

  const visibleItems = MENU_ITEMS.filter((item) => item.category === activeCategory);

  const handleAdd = (id: string) => {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const handleRemove = (id: string) => {
    setQuantities((prev) => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] ?? 0) - 1) };
      return next;
    });
  };

  const handleChangeCustomer = (patch: Partial<CustomerInfo>) => {
    setCustomer((prev) => ({ ...prev, ...patch }));
  };

  const handleConfirm = () => {
    setConfirmedOrder({
      orderNumber: String(Math.floor(1000 + Math.random() * 9000)),
      orderTime: new Date(),
      lines: cartLines,
      total: totalPrice,
      customer,
    });
    setCartOpen(false);
  };

  const handleNewOrder = () => {
    setQuantities({});
    setCustomer(EMPTY_CUSTOMER);
    setConfirmedOrder(null);
    setActiveCategory(MENU_CATEGORIES[0].value);
  };

  if (confirmedOrder) {
    return (
      <OrderConfirmed
        orderNumber={confirmedOrder.orderNumber}
        orderTime={confirmedOrder.orderTime}
        lines={confirmedOrder.lines}
        total={confirmedOrder.total}
        customer={confirmedOrder.customer}
        onNewOrder={handleNewOrder}
      />
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pb: totalQuantity ? 11 : 3 }}>
      <Box
        sx={{
          px: 2.5,
          py: 3,
          color: 'common.white',
          bgcolor: 'primary.main',
        }}
      >
        <Typography variant="h5">เฮงเฮง ก๋วยเตี๋ยว</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.8 }}>
          บ้านขามเรียง มหาสารคาม · สั่งอาหารได้เลย ไม่ต้องเข้าสู่ระบบ
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          px: 2.5,
          py: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1,
          bgcolor: 'common.white',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        {MENU_CATEGORIES.map((category) => (
          <Chip
            key={category.value}
            label={category.label}
            onClick={() => setActiveCategory(category.value)}
            color={activeCategory === category.value ? 'primary' : 'default'}
            variant={activeCategory === category.value ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>

      <Stack spacing={1.5} sx={{ px: 2.5, py: 2 }}>
        {visibleItems.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            quantity={quantities[item.id] ?? 0}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        ))}
      </Stack>

      {totalQuantity > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            px: 2.5,
            pb: 2.5,
            pointerEvents: 'none',
          }}
        >
          <Button
            fullWidth
            size="large"
            variant="contained"
            onClick={() => setCartOpen(true)}
            sx={{
              maxWidth: 432,
              pointerEvents: 'auto',
              boxShadow: '0 12px 24px rgba(0,0,0,0.24)',
            }}
            startIcon={
              <Badge badgeContent={totalQuantity} color="secondary">
                <Iconify icon="solar:cart-3-bold" />
              </Badge>
            }
          >
            ดูตะกร้า · {totalPrice} บาท
          </Button>
        </Box>
      )}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={cartLines}
        total={totalPrice}
        onAdd={handleAdd}
        onRemove={handleRemove}
        customer={customer}
        onChangeCustomer={handleChangeCustomer}
        onConfirm={handleConfirm}
      />
    </Box>
  );
}
