'use client';

import type { NewOrderRealtimePayload } from 'src/lib/realtime-events';

import { useRef, useEffect } from 'react';

import { getSupabaseBrowser } from 'src/lib/supabase-browser';
import { ORDERS_REALTIME_EVENTS, ORDERS_REALTIME_CHANNEL } from 'src/lib/realtime-events';

// ----------------------------------------------------------------------

const FALLBACK_POLL_INTERVAL_MS = 20000;

type Options = {
  /** Refetch the board — called on every realtime event and as a periodic fallback. */
  onChange: () => void | Promise<void>;
  /**
   * Fired only for brand-new orders, with the order id + type — the hook for a
   * future auto-print (kitchen ticket/receipt) once that order's full detail
   * is fetched. Not called for status/payment/session updates.
   */
  onNewOrder?: (payload: NewOrderRealtimePayload) => void;
};

/**
 * Keeps a staff/admin order board in sync in near-real-time: subscribes to the
 * Supabase Realtime broadcast channel that order-service.ts pushes to whenever
 * an order is created or its status/payment/table changes, and refetches the
 * moment an event arrives. A slow poll runs alongside it as a safety net for a
 * missed event or a dropped socket — realtime is an optimization here, not the
 * only path data ever refreshes through.
 */
export function useOrdersRealtime({ onChange, onNewOrder }: Options): void {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onNewOrderRef = useRef(onNewOrder);
  onNewOrderRef.current = onNewOrder;

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowser();

    const channel = supabase
      .channel(ORDERS_REALTIME_CHANNEL)
      .on(
        'broadcast',
        { event: ORDERS_REALTIME_EVENTS.newOrder },
        (message: { payload: NewOrderRealtimePayload }) => {
          if (!active) return;
          onNewOrderRef.current?.(message.payload);
          onChangeRef.current();
        }
      )
      .on('broadcast', { event: ORDERS_REALTIME_EVENTS.orderUpdated }, () => {
        if (active) onChangeRef.current();
      })
      .subscribe();

    const interval = setInterval(() => {
      if (active) onChangeRef.current();
    }, FALLBACK_POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);
}
