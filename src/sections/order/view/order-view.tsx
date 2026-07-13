'use client';

import type { MenuItem } from '../menu-data';
import type { CartLine } from '../components/cart-sheet';
import type { MenuCategory } from 'src/lib/category-service';
import type { ShopSettings } from 'src/lib/shop-settings-service';

import { useMemo, useState, useLayoutEffect } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useSearchParams } from 'src/routes/hooks';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { placeOrder } from '../order-actions';
import { CartSheet } from '../components/cart-sheet';
import { MenuItemCard } from '../components/menu-item-card';
import { TableNameGate } from '../components/table-name-gate';
import { OrderConfirmed } from '../components/order-confirmed';
import { BestSellerStrip } from '../components/best-seller-strip';
import { TableOrdersPanel } from '../components/table-orders-panel';
import { OrderHistoryPanel } from '../components/order-history-panel';
import { getOrderHistory, addOrderToHistory } from '../order-history';
import { saveTableName, clearTableName, getSavedTableName } from '../table-session';

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

type Props = {
  items: MenuItem[];
  categories: MenuCategory[];
  bestSellers: MenuItem[];
  shop: ShopSettings;
};

export function OrderView({ items, categories, bestSellers, shop }: Props) {
  const searchParams = useSearchParams();
  const qrTable = searchParams.get('table')?.trim().slice(0, 20) || null;

  const [tableName, setTableName] = useState<string | null>(null);
  const [nameChecked, setNameChecked] = useState(false);
  const [view, setView] = useState<'menu' | 'orders'>('menu');
  const [showHistory, setShowHistory] = useState(false);

  const [activeCategory, setActiveCategory] = useState(categories[0]?.value ?? '');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerInfo>(EMPTY_CUSTOMER);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    if (qrTable) {
      setTableName(getSavedTableName(qrTable));
    }
    setNameChecked(true);
  }, [qrTable]);

  const cartLines: CartLine[] = useMemo(
    () =>
      items
        .filter((item) => quantities[item.id] > 0)
        .map((item) => ({ item, quantity: quantities[item.id] })),
    [items, quantities]
  );

  const totalQuantity = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const totalPrice = cartLines.reduce((sum, line) => sum + line.quantity * line.item.price, 0);

  const visibleItems = items.filter((item) => item.category === activeCategory);

  const effectiveCustomer: CustomerInfo = qrTable
    ? { ...customer, name: tableName ?? '', orderType: 'dine-in', tableNumber: qrTable }
    : customer;

  const handleAdd = (id: string) => {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const handleRemove = (id: string) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) - 1) }));
  };

  const handleChangeCustomer = (patch: Partial<CustomerInfo>) => {
    setCustomer((prev) => ({ ...prev, ...patch }));
  };

  const handleNameSubmit = (name: string) => {
    if (!qrTable) return;
    saveTableName(qrTable, name);
    setTableName(name);
  };

  const handleChangeName = () => {
    if (!qrTable) return;
    clearTableName(qrTable);
    setTableName(null);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const result = await placeOrder({
        customerName: effectiveCustomer.name,
        customerPhone: effectiveCustomer.phone,
        orderType: effectiveCustomer.orderType,
        tableNumber: effectiveCustomer.tableNumber,
        note: effectiveCustomer.note,
        lines: cartLines.map((line) => ({ menuItemId: line.item.id, quantity: line.quantity })),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setQuantities({});
      setCustomer((prev) => ({ ...prev, phone: qrTable ? '' : prev.phone, note: '' }));
      setCartOpen(false);

      if (qrTable) {
        toast.success(`สั่งอาหารสำเร็จ! ออเดอร์ ${result.order.orderNumber}`);
        setView('orders');
      } else {
        addOrderToHistory({
          orderNumber: result.order.orderNumber,
          orderTime: result.order.createdAt,
          orderType: result.order.orderType,
          tableNumber: result.order.tableNumber,
          total: result.order.total,
          items: cartLines.map((line) => ({
            name: line.item.name,
            emoji: line.item.emoji,
            price: line.item.price,
            quantity: line.quantity,
          })),
        });

        setConfirmedOrder({
          orderNumber: result.order.orderNumber,
          orderTime: new Date(result.order.createdAt),
          lines: cartLines,
          total: result.order.total,
          customer: effectiveCustomer,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewOrder = () => {
    setQuantities({});
    setCustomer(EMPTY_CUSTOMER);
    setConfirmedOrder(null);
    setActiveCategory(categories[0]?.value ?? '');
  };

  if (!nameChecked) {
    return null;
  }

  if (qrTable && !tableName) {
    return <TableNameGate table={qrTable} shopName={shop.name} onSubmit={handleNameSubmit} />;
  }

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

  if (showHistory) {
    return <OrderHistoryPanel orders={getOrderHistory()} onBack={() => setShowHistory(false)} />;
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
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Typography variant="h5">{shop.name}</Typography>
          {!qrTable && (
            <IconButton
              onClick={() => setShowHistory(true)}
              sx={{ color: 'common.white', mt: -0.5, mr: -1 }}
              aria-label="ประวัติการสั่งซื้อ"
            >
              <Iconify icon="solar:notebook-bold-duotone" width={22} />
            </IconButton>
          )}
        </Stack>
        {qrTable ? (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              โต๊ะ {qrTable} · สวัสดีคุณ {tableName}
            </Typography>
            <Typography
              variant="caption"
              onClick={handleChangeName}
              sx={{ opacity: 0.7, textDecoration: 'underline', cursor: 'pointer' }}
            >
              เปลี่ยนชื่อ
            </Typography>
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.8 }}>
            {shop.address} · สั่งอาหารได้เลย ไม่ต้องเข้าสู่ระบบ
          </Typography>
        )}

        {qrTable && (
          <Tabs
            value={view}
            onChange={(_, next) => setView(next)}
            textColor="inherit"
            sx={{
              mt: 2,
              minHeight: 36,
              '& .MuiTabs-indicator': { bgcolor: 'secondary.main' },
            }}
          >
            <Tab value="menu" label="เมนูอาหาร" sx={{ minHeight: 36, opacity: 1 }} />
            <Tab value="orders" label="รายการที่สั่ง" sx={{ minHeight: 36, opacity: 1 }} />
          </Tabs>
        )}
      </Box>

      {view === 'orders' && qrTable ? (
        <TableOrdersPanel table={qrTable} currentName={tableName ?? ''} />
      ) : (
        <>
          <BestSellerStrip items={bestSellers} quantities={quantities} onAdd={handleAdd} />

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
            {categories.map((category) => (
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
            {visibleItems.length === 0 ? (
              <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                ยังไม่มีเมนูในหมวดนี้
              </Typography>
            ) : (
              visibleItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={quantities[item.id] ?? 0}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                />
              ))
            )}
          </Stack>
        </>
      )}

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
        submitting={submitting}
        qrMode={!!qrTable}
        onAdd={handleAdd}
        onRemove={handleRemove}
        customer={effectiveCustomer}
        onChangeCustomer={handleChangeCustomer}
        onConfirm={handleConfirm}
      />
    </Box>
  );
}
