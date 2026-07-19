import { useRef, useEffect } from 'react';

import { playNewOrderChime } from 'src/utils/play-notification-sound';

// ----------------------------------------------------------------------

/**
 * Plays a chime whenever a poll brings in an order id that wasn't there on
 * the previous check — used by the admin and staff order boards so someone
 * notices a new order without having to watch the screen. Never rings on the
 * very first render (that's just the page's initial order list, not "new").
 */
export function useNewOrderAlert(orderIds: string[]): void {
  const knownIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    const hasNewOrder =
      knownIds.current !== null && orderIds.some((id) => !knownIds.current!.has(id));

    knownIds.current = new Set(orderIds);

    if (hasNewOrder) {
      playNewOrderChime();
    }
  }, [orderIds]);
}
