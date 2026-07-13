import type { OrderStatus } from 'src/lib/order-service';

// ----------------------------------------------------------------------

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'รอดำเนินการ',
  preparing: 'กำลังทำ',
  served: 'เสิร์ฟแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
};

export const STATUS_COLOR: Record<
  OrderStatus,
  'warning' | 'info' | 'success' | 'default' | 'error'
> = {
  pending: 'warning',
  preparing: 'info',
  served: 'success',
  completed: 'default',
  cancelled: 'error',
};

export const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: 'preparing', label: 'เริ่มทำอาหาร' },
  preparing: { status: 'served', label: 'เสิร์ฟแล้ว' },
  served: { status: 'completed', label: 'จบออเดอร์' },
};
