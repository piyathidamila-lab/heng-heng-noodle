import { useRef, useEffect } from 'react';

import { playNewOrderChime } from 'src/utils/play-notification-sound';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type NewOrderAlertOptions = {
  showSnackbar?: boolean;
  showBrowserNotification?: boolean;
  title?: string;
};

/**
 * Plays a chime whenever a poll brings in an order id that wasn't there on
 * the previous check — used by the admin and staff order boards so someone
 * notices a new order without having to watch the screen. Never rings on the
 * very first render (that's just the page's initial order list, not "new").
 */
export function useNewOrderAlert(
  orderIds: string[],
  {
    showSnackbar = false,
    showBrowserNotification = false,
    title = 'มีออเดอร์ใหม่เข้ามา!',
  }: NewOrderAlertOptions = {}
): void {
  const knownIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    const newOrderIds =
      knownIds.current === null ? [] : orderIds.filter((id) => !knownIds.current!.has(id));

    knownIds.current = new Set(orderIds);

    if (newOrderIds.length === 0) return;

    playNewOrderChime();

    const description =
      newOrderIds.length === 1
        ? 'มีออเดอร์ใหม่ 1 รายการ กรุณาตรวจสอบและรับออเดอร์'
        : `มีออเดอร์ใหม่ ${newOrderIds.length} รายการ กรุณาตรวจสอบและรับออเดอร์`;

    if (showSnackbar) {
      toast.info(title, {
        id: 'staff-new-order-alert',
        description,
        duration: 8000,
      });
    }

    if (
      showBrowserNotification &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      window.Notification.permission === 'granted'
    ) {
      const notification = new window.Notification(title, {
        body: description,
        tag: 'staff-new-order-alert',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [orderIds, showBrowserNotification, showSnackbar, title]);
}
