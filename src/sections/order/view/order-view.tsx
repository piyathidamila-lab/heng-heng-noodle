'use client';

import type { MenuItem } from '../menu-data';
import type { CartLine } from '../components/cart-sheet';
import type { IconifyName } from 'src/components/iconify';
import type { SessionMember } from 'src/lib/member-session';
import type { MenuCategory } from 'src/lib/category-service';
import type { MemberOrderSummary } from 'src/lib/order-service';
import type { ShopSettings, CustomOrderSelection } from 'src/lib/shop-settings-service';

import { RiBookOpenLine } from '@remixicon/react';
import { useRef, useMemo, useState, useEffect, useLayoutEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useRouter, useSearchParams } from 'src/routes/hooks';

import { Logo } from 'src/components/logo';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { logoutMemberAction } from 'src/sections/loyalty/loyalty-actions';

import { CartSheet } from '../components/cart-sheet';
import { MenuItemCard } from '../components/menu-item-card';
import { TableNameGate } from '../components/table-name-gate';
import { OrderConfirmed } from '../components/order-confirmed';
import { QrScannerDialog } from '../components/qr-scanner-dialog';
import { BestSellerStrip } from '../components/best-seller-strip';
import { TableOrdersPanel } from '../components/table-orders-panel';
import { ActiveOrderStatus } from '../components/active-order-status';
import { CustomOrderDialog } from '../components/custom-order-dialog';
import { OrderHistoryPanel } from '../components/order-history-panel';
import { TableLockedNotice } from '../components/table-locked-notice';
import { listTableAvailability } from '../table-availability-actions';
import { placeOrder, getTableOrders, getMyOrderHistory } from '../order-actions';
import {
  saveTableName,
  setActiveTable,
  getActiveTable,
  clearTableName,
  clearActiveTable,
  getSavedTableName,
} from '../table-session';

// ----------------------------------------------------------------------

export type CustomerInfo = {
  name: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber: string;
  note: string;
};

const EMPTY_CUSTOMER: CustomerInfo = {
  name: '',
  orderType: 'takeaway',
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
  member: SessionMember | null;
};

export function OrderView({ items, categories, bestSellers, shop, member }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrTable = searchParams.get('table')?.trim().slice(0, 20) || null;

  const [tableName, setTableName] = useState<string | null>(null);
  const [nameChecked, setNameChecked] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);
  const [blockedByTable, setBlockedByTable] = useState<string | null>(null);
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
  const [historyOrders, setHistoryOrders] = useState<MemberOrderSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tableHasOrders, setTableHasOrders] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    if (qrTable) {
      setTableName(getSavedTableName(qrTable));
    }
    setNameChecked(true);
  }, [qrTable]);

  // Stops a single device from having more than one table "open" at once: if
  // this device already claimed a different table, block scanning/opening a
  // new one until that other table's session is confirmed closed server-side.
  useEffect(() => {
    let cancelled = false;

    async function checkLock() {
      if (!qrTable) {
        setBlockedByTable(null);
        setLockChecked(true);
        return;
      }

      const active = getActiveTable();
      if (!active || active === qrTable) {
        setBlockedByTable(null);
        setLockChecked(true);
        return;
      }

      try {
        const availability = await listTableAvailability();
        if (cancelled) return;

        const stillOpen = availability.some(
          (table) => table.label === active && table.status === 'occupied'
        );
        if (stillOpen) {
          setBlockedByTable(active);
        } else {
          clearActiveTable();
          setBlockedByTable(null);
        }
      } catch (error) {
        console.error(error);
        setBlockedByTable(null);
      } finally {
        if (!cancelled) setLockChecked(true);
      }
    }

    setLockChecked(false);
    checkLock();

    return () => {
      cancelled = true;
    };
  }, [qrTable]);

  useEffect(() => {
    if (qrTable && !blockedByTable && (tableName || member)) {
      setActiveTable(qrTable);
    }
  }, [qrTable, blockedByTable, tableName, member]);

  // Once staff/admin close this table's bill, bounce the customer straight
  // back to the home page — the table is done, and they must scan again to
  // start a new one. Only arms once the table has actually been seen
  // "occupied" during this visit, so it never fires before the first order.
  const wasTableOccupiedRef = useRef(false);

  useEffect(() => {
    if (!qrTable) {
      wasTableOccupiedRef.current = false;
      return undefined;
    }

    let active = true;

    const checkClosed = async () => {
      try {
        const availability = await listTableAvailability();
        if (!active) return;

        const isOccupied = availability.some(
          (table) => table.label === qrTable && table.status === 'occupied'
        );

        if (isOccupied) {
          wasTableOccupiedRef.current = true;
        } else if (wasTableOccupiedRef.current) {
          wasTableOccupiedRef.current = false;
          clearTableName(qrTable);
          clearActiveTable();
          toast.info('โต๊ะนี้ปิดบิลแล้ว ขอบคุณที่ใช้บริการ — สแกน QR ใหม่เพื่อสั่งรอบถัดไป');
          router.replace('/');
        }
      } catch (error) {
        console.error(error);
      }
    };

    checkClosed();
    const interval = setInterval(checkClosed, 6000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [qrTable, router]);

  // Only lets the customer leave/reset their table session while nobody at
  // the table has ordered yet — once an order exists, leaving would abandon
  // it with no way to track it back.
  useEffect(() => {
    if (!qrTable) {
      setTableHasOrders(null);
      return undefined;
    }

    let active = true;

    const checkOrders = async () => {
      try {
        const orders = await getTableOrders(qrTable);
        if (active) setTableHasOrders(orders.length > 0);
      } catch (error) {
        console.error(error);
      }
    };

    checkOrders();
    const interval = setInterval(checkOrders, 6000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [qrTable]);

  // Lets a link/button (e.g. the "ดูรายการ" tile on the home view) land
  // straight on "รายการที่สั่ง" via `?table=X&view=orders` instead of the menu.
  useEffect(() => {
    if (qrTable && searchParams.get('view') === 'orders') {
      setView('orders');
    }
  }, [qrTable, searchParams]);

  // On the takeaway/home view, if this device already has a table open, the
  // "สแกน QR" tile should take them straight back to it instead of opening
  // the scanner (which would just get blocked by the lock above anyway).
  const [homeActiveTable, setHomeActiveTable] = useState<string | null>(null);

  useEffect(() => {
    if (!qrTable) {
      setHomeActiveTable(getActiveTable());
    }
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

  const canLeaveTable = !!qrTable && tableHasOrders === false;

  const effectiveCustomer: CustomerInfo = qrTable
    ? {
        ...customer,
        name: member?.displayName || tableName || '',
        orderType: 'dine-in',
        tableNumber: qrTable,
      }
    : {
        ...customer,
        name: member?.displayName || customer.name,
        orderType: 'takeaway',
        tableNumber: '',
      };

  const handleAdd = (id: string) => {
    if (!shop.isOpen) {
      toast.error(
        shop.closureReason
          ? `วันนี้ร้านหยุดเนื่องจาก ${shop.closureReason}`
          : 'ร้านปิดอยู่ขณะนี้ ไม่สามารถสั่งอาหารได้'
      );
      return;
    }
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
    if (!shop.isOpen) {
      toast.error(
        shop.closureReason
          ? `วันนี้ร้านหยุดเนื่องจาก ${shop.closureReason}`
          : 'ร้านปิดอยู่ขณะนี้ ไม่สามารถสั่งอาหารได้'
      );
      return;
    }
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

  const handleLeaveTable = () => {
    if (!qrTable) return;
    clearTableName(qrTable);
    clearActiveTable();
    setTableName(null);
    router.push('/');
  };

  const handleMemberLogout = async () => {
    await logoutMemberAction();
    window.location.reload();
  };

  const handleShowHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      setHistoryOrders(await getMyOrderHistory());
    } finally {
      setHistoryLoading(false);
    }
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

  if (!nameChecked || !lockChecked) {
    return null;
  }

  if (qrTable && blockedByTable) {
    return (
      <TableLockedNotice
        activeTable={blockedByTable}
        onGoToActiveTable={() => router.push(`/?table=${encodeURIComponent(blockedByTable)}`)}
      />
    );
  }

  if (qrTable && !tableName && !member) {
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

  if (showHistory && member) {
    return (
      <OrderHistoryPanel
        orders={historyOrders}
        loading={historyLoading}
        onBack={() => setShowHistory(false)}
      />
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        pb: totalQuantity ? 'calc(104px + env(safe-area-inset-bottom, 0px))' : 3,
        bgcolor: '#FBF8F4',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          px: 2.5,
          pt: 3,
          pb: qrTable ? 2.5 : 5,
          color: 'common.white',
          background: 'linear-gradient(145deg, #721111 0%, #A91D1D 55%, #C12C22 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 180,
            height: 180,
            top: -100,
            right: -70,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.07)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 100,
            height: 100,
            bottom: -60,
            left: -35,
            borderRadius: '50%',
            bgcolor: 'rgba(255,213,79,0.10)',
          }}
        />
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ position: 'relative' }}
        >
          <Stack spacing={1.5} direction="row" alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                p: 0.75,
                flexShrink: 0,
                borderRadius: 2.25,
                bgcolor: 'common.white',
                boxShadow: '0 8px 24px rgba(63,0,0,0.22)',
              }}
            >
              <Logo sx={{ width: 1, height: 1 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" noWrap>
                {shop.name}
              </Typography>
              <Chip
                size="small"
                label={shop.isOpen ? 'เปิดรับออเดอร์' : 'ร้านปิดอยู่'}
                sx={{
                  mt: 0.5,
                  height: 24,
                  color: 'common.white',
                  fontWeight: 700,
                  bgcolor: shop.isOpen ? 'rgba(20,155,93,0.92)' : 'rgba(40,40,40,0.45)',
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            {shop.loyalty.enabled && (
              <IconButton
                onClick={() => router.push('/stars')}
                sx={{
                  color: 'common.white',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' },
                }}
                aria-label="สะสมดาว"
              >
                <Iconify icon={'solar:star-bold' as IconifyName} width={22} />
              </IconButton>
            )}
            {!qrTable && member && (
              <IconButton
                onClick={handleShowHistory}
                sx={{
                  color: 'common.white',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' },
                }}
                aria-label="ประวัติการสั่งซื้อ"
              >
                <RiBookOpenLine />
              </IconButton>
            )}
          </Stack>
        </Stack>

        {member && !qrTable && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{
              mt: 1.5,
              p: 1,
              position: 'relative',
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.12)',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
              <Iconify icon={'solar:user-circle-bold' as IconifyName} width={18} />
              <Typography variant="caption" sx={{ fontWeight: 700 }} noWrap>
                {member.displayName}
              </Typography>
              <Chip
                size="small"
                label={`⭐ ${member.starsBalance} ดาว`}
                sx={{
                  height: 20,
                  color: 'common.white',
                  bgcolor: 'rgba(255,255,255,0.18)',
                  '& .MuiChip-label': { px: 0.75, fontSize: 11, fontWeight: 700 },
                }}
              />
            </Stack>
            <Button
              size="small"
              onClick={handleMemberLogout}
              sx={{ flexShrink: 0, minWidth: 0, px: 1, color: 'rgba(255,255,255,0.85)' }}
            >
              ออกจากระบบ
            </Button>
          </Stack>
        )}

        {qrTable && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ mt: 1.25, position: 'relative' }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: 'secondary.main',
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ opacity: 0.9 }} noWrap>
                โต๊ะ {qrTable} · สวัสดีคุณ {member?.displayName || tableName}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              {canLeaveTable && (
                <Button
                  size="small"
                  disableRipple
                  onClick={handleLeaveTable}
                  startIcon={
                    <Iconify icon={'ic:round-power-settings-new' as IconifyName} width={16} />
                  }
                  sx={{
                    color: 'rgba(255,255,255,0.85)',
                    bgcolor: 'rgba(255,255,255,0.10)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                  }}
                >
                  ออกจากโต๊ะ
                </Button>
              )}
              <Button
                size="small"
                disableRipple
                onClick={() => setView(view === 'orders' ? 'menu' : 'orders')}
                startIcon={
                  <Iconify
                    icon={
                      (view === 'orders'
                        ? 'custom:fast-food-fill'
                        : 'solar:bill-list-bold-duotone') as IconifyName
                    }
                    width={16}
                  />
                }
                sx={{
                  color: 'common.white',
                  bgcolor: 'rgba(255,255,255,0.14)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                }}
              >
                {view === 'orders' ? 'เมนูอาหาร' : 'รายการที่สั่ง'}
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>

      {!qrTable && (
        <Box sx={{ px: 2.5, mt: -2.5, position: 'relative', zIndex: 1 }}>
          <Stack
            direction="row"
            sx={{
              overflow: 'hidden',
              borderRadius: 3,
              bgcolor: 'common.white',
              border: '1px solid',
              borderColor: 'grey.200',
              boxShadow: '0 10px 28px rgba(69,37,20,0.10)',
            }}
          >
            <ButtonBase
              onClick={() => {
                if (homeActiveTable) {
                  router.push(`/?table=${encodeURIComponent(homeActiveTable)}&view=orders`);
                } else {
                  setScannerOpen(true);
                }
              }}
              sx={{ flex: 1, p: 1.75, textAlign: 'left', justifyContent: 'flex-start' }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'grid',
                    flexShrink: 0,
                    placeItems: 'center',
                    borderRadius: 2,
                    color: 'primary.main',
                    bgcolor: 'primary.lighter',
                  }}
                >
                  <Iconify
                    icon={
                      (homeActiveTable
                        ? 'solar:bill-list-bold-duotone'
                        : 'solar:qr-code-bold') as IconifyName
                    }
                    width={22}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2">
                    {homeActiveTable ? 'ดูรายการ' : 'สแกน QR'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {homeActiveTable ? `โต๊ะ ${homeActiveTable}` : 'สั่งที่โต๊ะ'}
                  </Typography>
                </Box>
              </Stack>
            </ButtonBase>

            <Box sx={{ width: '1px', my: 1.5, bgcolor: 'grey.200' }} />

            <ButtonBase
              onClick={() => router.push('/tables')}
              sx={{ flex: 1, p: 1.75, textAlign: 'left', justifyContent: 'flex-start' }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'grid',
                    flexShrink: 0,
                    placeItems: 'center',
                    borderRadius: 2,
                    bgcolor: '#FFF2D6',
                    fontSize: 21,
                  }}
                >
                  🪑
                </Box>
                <Box>
                  <Typography variant="subtitle2">ดูโต๊ะว่าง</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    เช็กสถานะ
                  </Typography>
                </Box>
              </Stack>
            </ButtonBase>
          </Stack>
        </Box>
      )}

      {!shop.isOpen && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mx: 2.5,
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'error.lighter',
            color: 'error.darker',
          }}
        >
          <Iconify
            icon={'solar:forbidden-circle-bold' as IconifyName}
            width={20}
            sx={{ flexShrink: 0, mt: 0.1 }}
          />
          <Typography variant="body2">
            {shop.closureReason
              ? `วันนี้ร้านหยุดเนื่องจาก ${shop.closureReason} ดูเมนูได้ตามปกติ แต่ยังไม่สามารถสั่งอาหารได้`
              : 'ร้านปิดอยู่ในขณะนี้ ดูเมนูได้ตามปกติ แต่ยังไม่สามารถสั่งอาหารได้'}
          </Typography>
        </Stack>
      )}

      {shop.announcement.enabled && shop.announcement.message.trim() && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mx: 2.5,
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'warning.lighter',
            color: 'warning.darker',
          }}
        >
          <Iconify
            icon={'solar:danger-triangle-bold' as IconifyName}
            width={20}
            sx={{ flexShrink: 0, mt: 0.1 }}
          />
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {shop.announcement.message}
          </Typography>
        </Stack>
      )}

      {view === 'orders' && qrTable ? (
        <TableOrdersPanel table={qrTable} currentName={tableName ?? ''} />
      ) : (
        <>
          <ActiveOrderStatus
            table={qrTable}
            memberId={member?.id ?? null}
            onViewOrders={qrTable ? () => setView('orders') : undefined}
          />

          <BestSellerStrip items={bestSellers} quantities={quantities} onAdd={handleAdd} />

          {shop.customOrder.enabled && shop.customOrder.steps.length > 0 && (
            <Box sx={{ px: 2.5, pb: 0.5 }}>
              <ButtonBase
                onClick={() => setCustomOrderOpen(true)}
                aria-label={`เริ่มสร้างเมนู ${shop.customOrder.title}`}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  width: 1,
                  p: 2.25,
                  display: 'block',
                  textAlign: 'left',
                  borderRadius: 3,
                  color: 'common.white',
                  background: 'linear-gradient(135deg, #67100E 0%, #9E1B16 55%, #D25125 100%)',
                  boxShadow: 'none',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    width: 150,
                    height: 150,
                    top: -80,
                    right: -40,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.08)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    width: 90,
                    height: 90,
                    bottom: -55,
                    left: -25,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,213,79,0.10)',
                  }}
                />

                <Stack direction="row" justifyContent="space-between" sx={{ position: 'relative' }}>
                  <Box>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>
                        ✨
                      </Box>
                      <Typography
                        variant="overline"
                        sx={{ color: '#FFD976', fontWeight: 800, letterSpacing: 0.8 }}
                      >
                        สร้างเมนูในแบบคุณ
                      </Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ mt: 0.5, color: 'common.white' }}>
                      {shop.customOrder.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, maxWidth: 260, opacity: 0.82 }}>
                      เลือกทุกอย่างได้ตามใจ อร่อยในแบบที่เป็นคุณ
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 58,
                      height: 58,
                      display: 'grid',
                      flexShrink: 0,
                      placeItems: 'center',
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.14)',
                      fontSize: 31,
                    }}
                  >
                    🍜
                  </Box>
                </Stack>

                {/* <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{ mt: 2, position: 'relative', overflow: 'hidden' }}
                >
                  {shop.customOrder.steps.slice(0, 3).map((step, index) => (
                    <Stack
                      key={step.id}
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{
                        minWidth: 0,
                        px: 0.9,
                        py: 0.55,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(255,255,255,0.12)',
                      }}
                    >
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          display: 'grid',
                          flexShrink: 0,
                          placeItems: 'center',
                          borderRadius: '50%',
                          color: '#7A1010',
                          bgcolor: '#FFD976',
                          fontSize: 10,
                          fontWeight: 800,
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant="caption" noWrap sx={{ fontWeight: 700 }}>
                        {step.title}
                      </Typography>
                    </Stack>
                  ))}
                </Stack> */}

                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mt: 2, position: 'relative' }}
                >
                  <Typography variant="caption" sx={{ opacity: 0.72 }}>
                    ทั้งหมด {shop.customOrder.steps.length} ขั้นตอน
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{
                      px: 1.25,
                      py: 0.7,
                      borderRadius: 2,
                      color: '#7A1010',
                      bgcolor: 'common.white',
                    }}
                  >
                    <Typography variant="subtitle2">เริ่มเลือกเลย</Typography>
                    <Iconify icon="solar:double-alt-arrow-right-bold-duotone" width={17} />
                  </Stack>
                </Stack>
              </ButtonBase>
            </Box>
          )}

          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 2,
              pt: 2,
              pb: 1.5,
              bgcolor: 'rgba(251,248,244,0.96)',
              borderBottom: '1px solid',
              borderColor: 'grey.200',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Typography variant="h6" sx={{ px: 2.5, mb: 1.25 }}>
              เมนูทั้งหมด
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                px: 2.5,
                overflowX: 'auto',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {categories.map((category) => (
                <Chip
                  key={category.value}
                  label={category.label}
                  onClick={() => setActiveCategory(category.value)}
                  color={activeCategory === category.value ? 'primary' : 'default'}
                  variant={activeCategory === category.value ? 'filled' : 'outlined'}
                  sx={{ height: 38, flexShrink: 0, fontWeight: 600 }}
                />
              ))}
            </Stack>
          </Box>

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
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
            px: 2.5,
            pb: 'calc(20px + env(safe-area-inset-bottom, 0px))',
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
              minHeight: 54,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #8B1111 0%, #C62828 100%)',
              boxShadow: '0 12px 28px rgba(113,17,17,0.30)',
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
        member={member}
        shopOpen={shop.isOpen}
        onAdd={handleAdd}
        onRemove={handleRemove}
        customer={effectiveCustomer}
        onChangeCustomer={handleChangeCustomer}
        onScanTable={() => {
          setCartOpen(false);
          setScannerOpen(true);
        }}
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
