import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// ----------------------------------------------------------------------

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Every date/time in this app is anchored to shop-local Thai time — the sole
 * source of truth so the server (which may run in UTC, e.g. on Vercel) and a
 * staff/customer's browser (whatever timezone their device happens to be in)
 * never disagree on what "today" or "3pm" means.
 */
export const SHOP_TZ = 'Asia/Bangkok';

/** `dayjs()`, but always anchored to shop-local time regardless of server/browser timezone. */
export function nowInShopTz(): Dayjs {
  return dayjs().tz(SHOP_TZ);
}

export type WeekdayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export const WEEKDAY_KEYS: WeekdayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  mon: 'จันทร์',
  tue: 'อังคาร',
  wed: 'พุธ',
  thu: 'พฤหัสบดี',
  fri: 'ศุกร์',
  sat: 'เสาร์',
  sun: 'อาทิตย์',
};

export type DayHours = {
  closed: boolean;
  open: string;
  close: string;
};

export type BusinessHours = Record<WeekdayKey, DayHours>;

export const DEFAULT_DAY_HOURS: DayHours = { closed: false, open: '08:00', close: '20:00' };

export const DEFAULT_BUSINESS_HOURS: BusinessHours = WEEKDAY_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: { ...DEFAULT_DAY_HOURS } }),
  {} as BusinessHours
);

export function getShopDateKey(at: Date = new Date()): string {
  return dayjs(at).tz(SHOP_TZ).format('YYYY-MM-DD');
}

/** ISO timestamp for 00:00 today in shop-local time — the boundary "today" queries filter from. */
export function getShopDayStartISO(at: Date = new Date()): string {
  return dayjs(at).tz(SHOP_TZ).startOf('day').toISOString();
}

function toMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * Is the shop within its configured hours for the current weekday, right now
 * (always evaluated in shop-local Asia/Bangkok time regardless of the
 * caller's own timezone). Missing/unparseable hours fail open — a data
 * problem shouldn't silently block every order.
 */
export function isWithinBusinessHours(hours: BusinessHours, at: Date = new Date()): boolean {
  const now = dayjs(at).tz(SHOP_TZ);
  const today = hours[WEEKDAY_KEYS[now.day()]];
  if (!today) return true;
  if (today.closed) return false;

  const openMinutes = toMinutes(today.open);
  const closeMinutes = toMinutes(today.close);
  if (openMinutes === null || closeMinutes === null || openMinutes === closeMinutes) return true;

  const nowMinutes = now.hour() * 60 + now.minute();

  if (openMinutes < closeMinutes) {
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }

  // Overnight window, e.g. open 18:00, close 02:00 the next morning.
  return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
}

export type DateRangePresetKey =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'thisMonth'
  | 'lastMonth'
  | 'all';

export type DateRange = { from: Dayjs | null; to: Dayjs | null };

/**
 * Shared "today/yesterday/7 days/this month/last month" filter used by every
 * order/bill history view — always relative to shop-local Thai time, so the
 * same preset means the same actual date range everywhere in the app.
 */
export function getDateRangePreset(preset: DateRangePresetKey): DateRange {
  const now = nowInShopTz();

  switch (preset) {
    case 'today':
      return { from: now.startOf('day'), to: now.endOf('day') };
    case 'yesterday': {
      const yesterday = now.subtract(1, 'day');
      return { from: yesterday.startOf('day'), to: yesterday.endOf('day') };
    }
    case 'last7':
      return { from: now.subtract(6, 'day').startOf('day'), to: now.endOf('day') };
    case 'thisMonth':
      return { from: now.startOf('month'), to: now.endOf('month') };
    case 'lastMonth': {
      const lastMonth = now.subtract(1, 'month');
      return { from: lastMonth.startOf('month'), to: lastMonth.endOf('month') };
    }
    case 'all':
    default:
      return { from: null, to: null };
  }
}
