'use client';

import type { MenuItem } from '../menu-data';
import type { CartLine } from '../components/cart-sheet';
import type { IconifyName } from 'src/components/iconify';
import type { MenuCategory } from 'src/lib/category-service';
import type { RestaurantTable } from 'src/lib/table-service';
import type { ShopSettings, CustomOrderSelection } from 'src/lib/shop-settings-service';

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

import { useRouter, useSearchParams } from 'src/routes/hooks';

import { Logo } from 'src/components/logo';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { placeOrder } from '../order-actions';
import { CartSheet } from '../components/cart-sheet';
import { MenuItemCard } from '../components/menu-item-card';
import { TableNameGate } from '../components/table-name-gate';
import { OrderConfirmed } from '../components/order-confirmed';
import { QrScannerDialog } from '../components/qr-scanner-dialog';
import { BestSellerStrip } from '../components/best-seller-strip';
import { TableOrdersPanel } from '../components/table-orders-panel';
import { saveTableName, getSavedTableName } from '../table-session';
import { CustomOrderDialog } from '../components/custom-order-dialog';
import { OrderHistoryPanel } from '../components/order-history-panel';
import { getOrderHistory, addOrderToHistory } from '../order-history';

// ----------------------------------------------------------------------

export type CustomerInfo = {
  name: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber: string;
  note: string;
};

const EMPTY_CUSTOMER: CustomerInfo = {
  name: '',
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
  tables: RestaurantTable[];
  shop: ShopSettings;
};

export function OrderView({ items, categories, bestSellers, tables, shop }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrTable = searchParams.get('table')?.trim().slice(0, 20) || null;

  const [tableName, setTableName] = useState<string | null>(null);
  const [nameChecked, setNameChecked] = useState(false);
  const [view, setView] = useState<'menu' | 'orders'>('menu');
  const [showHistory, setShowHistory] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [customOrderOpen, setCustomOrderOpen] = useState(false);

  const [activeCategory, setActiveCategory] = useState(categories[0]?.value ?? '');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customLines, setCustomLines] = useState<CartLine[]>([]);
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
    () => [
      ...items
        .filter((item) => quantities[item.id] > 0)
        .map((item) => ({ item, quantity: quantities[item.id] })),
      ...customLines,
    ],
    [customLines, items, quantities]
  );

  const totalQuantity = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const totalPrice = cartLines.reduce((sum, line) => sum + line.quantity * line.item.price, 0);

  const visibleItems = items.filter((item) => item.category === activeCategory);

  const effectiveCustomer: CustomerInfo = qrTable
    ? { ...customer, name: tableName ?? '', orderType: 'dine-in', tableNumber: qrTable }
    : customer;

  const handleAdd = (id: string) => {
    if (id.startsWith('custom-')) {
      setCustomLines((prev) =>
        prev.map((line) => (line.item.id === id ? { ...line, quantity: line.quantity + 1 } : line))
      );
      return;
    }
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const handleRemove = (id: string) => {
    if (id.startsWith('custom-')) {
      setCustomLines((prev) =>
        prev.flatMap((line) => {
          if (line.item.id !== id) return [line];
          return line.quantity > 1 ? [{ ...line, quantity: line.quantity - 1 }] : [];
        })
      );
      return;
    }
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) - 1) }));
  };

  const handleAddCustomOrder = (
    customization: CustomOrderSelection,
    labels: string[],
    price: number
  ) => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCustomLines((prev) => [
      ...prev,
      {
        item: {
          id,
          category: 'custom',
          name: shop.customOrder.title,
          description: labels.join(' · '),
          price,
          emoji: '🍜',
          imageUrl: null,
          isAvailable: true,
        },
        quantity: 1,
        customization,
      },
    ]);
    toast.success('เพิ่มเมนูที่เลือกลงตะกร้าแล้ว');
  };

  const handleChangeCustomer = (patch: Partial<CustomerInfo>) => {
    setCustomer((prev) => ({ ...prev, ...patch }));
  };

  const handleNameSubmit = (name: string) => {
    if (!qrTable) return;
    saveTableName(qrTable, name);
    setTableName(name);
  };

  const handleScanTable = (label: string) => {
    setScannerOpen(false);
    router.push(`/?table=${encodeURIComponent(label)}`);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const result = await placeOrder({
        customerName: effectiveCustomer.name,
        orderType: effectiveCustomer.orderType,
        tableNumber: effectiveCustomer.tableNumber,
        note: effectiveCustomer.note,
        lines: cartLines.map((line) =>
          line.customization
            ? { quantity: line.quantity, customization: line.customization }
            : { menuItemId: line.item.id, quantity: line.quantity }
        ),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setQuantities({});
      setCustomLines([]);
      setCustomer((prev) => ({ ...prev, note: '' }));
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
            name: line.customization
              ? `${line.item.name} (${line.item.description})`
              : line.item.name,
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
    setCustomLines([]);
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
          <Stack spacing={2} direction="row" alignItems="flex-start">
            <Logo sx={{ width: 60, height: 60 }} />
            <Stack>
              <Typography variant="h5">{shop.name}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.8 }}>
                {shop.address} · สั่งอาหารได้เลย ไม่ต้องเข้าสู่ระบบ
              </Typography>
              {qrTable && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    โต๊ะ {qrTable} · สวัสดีคุณ {tableName}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>

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

        {!qrTable && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setScannerOpen(true)}
            startIcon={<Iconify icon={'solar:qr-code-bold' as IconifyName} width={18} />}
            sx={{
              mt: 1.5,
              color: 'common.white',
              borderColor: 'rgba(255,255,255,0.5)',
              '&:hover': { borderColor: 'common.white', bgcolor: 'rgba(255,255,255,0.08)' },
            }}
          >
            สแกน QR โต๊ะ
          </Button>
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

          {shop.customOrder.enabled && shop.customOrder.steps.length > 0 && (
            <Box sx={{ px: 2.5 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  color: 'common.white',
                  background: 'linear-gradient(135deg, #8B1111 0%, #C62828 100%)',
                  // boxShadow: '0 10px 24px rgba(139, 17, 17, 0.20)',
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.14)',
                    fontSize: 28,
                  }}
                >
                  🍜
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ color: '#FFD54F' }}>
                    {shop.customOrder.title}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.82 }}>
                    เลือกเส้น เครื่อง และขนาดได้ตามใจคุณ
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="inherit"
                  onClick={() => setCustomOrderOpen(true)}
                  endIcon={<Iconify icon="solar:double-alt-arrow-right-bold-duotone" width={18} />}
                  sx={{
                    flexShrink: 0,
                    color: '#7A1010',
                    bgcolor: 'common.white',
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  เลือกเลย
                </Button>
              </Stack>
            </Box>
          )}

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
        tables={tables}
        onAdd={handleAdd}
        onRemove={handleRemove}
        customer={effectiveCustomer}
        onChangeCustomer={handleChangeCustomer}
        onConfirm={handleConfirm}
      />

      <QrScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanTable}
      />

      <CustomOrderDialog
        open={customOrderOpen}
        config={shop.customOrder}
        onClose={() => setCustomOrderOpen(false)}
        onAdd={handleAddCustomOrder}
      />
    </Box>
  );
}
