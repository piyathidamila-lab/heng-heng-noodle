import type { DayHours, BusinessHours } from 'src/utils/business-hours';

import {
  WEEKDAY_KEYS,
  getShopDateKey,
  DEFAULT_DAY_HOURS,
  DEFAULT_BUSINESS_HOURS,
} from 'src/utils/business-hours';

import { getSupabaseAdmin } from './supabase-admin';
import { getSupabasePublic } from './supabase-public';

// ----------------------------------------------------------------------

export type { DayHours, WeekdayKey, BusinessHours } from 'src/utils/business-hours';

export type ShopSettings = {
  name: string;
  logoUrl: string | null;
  address: string;
  phone: string;
  promptPayId: string;
  businessHours: BusinessHours;
  specialClosures: SpecialClosure[];
  customOrder: CustomOrderConfig;
  announcement: AnnouncementConfig;
  loyalty: LoyaltyConfig;
  isOpen: boolean;
  manuallyOpen: boolean;
  closureReason: string;
};

export type SpecialClosure = {
  id: string;
  date: string;
  label: string;
};

export type AnnouncementConfig = {
  enabled: boolean;
  message: string;
};

export type LoyaltyConfig = {
  enabled: boolean;
  bahtPerStar: number;
};

export type CustomOrderOption = {
  id: string;
  label: string;
  price: number;
};

export type CustomOrderStep = {
  id: string;
  title: string;
  options: CustomOrderOption[];
};

export type CustomOrderConfig = {
  enabled: boolean;
  title: string;
  steps: CustomOrderStep[];
};

export type CustomOrderSelection = {
  choices: { stepId: string; optionId: string }[];
};

export type ShopSettingsInput = ShopSettings;

const SELECT_COLUMNS =
  'name, logo_url, address, phone, promptpay_id, business_hours, special_closures, custom_order_enabled, custom_order_title, custom_order_steps, announcement_enabled, announcement_message, loyalty_enabled, loyalty_baht_per_star, is_open';

const WITHOUT_LOGO_SELECT_COLUMNS =
  'name, address, phone, promptpay_id, business_hours, special_closures, custom_order_enabled, custom_order_title, custom_order_steps, announcement_enabled, announcement_message, loyalty_enabled, loyalty_baht_per_star, is_open';

const LEGACY_SELECT_COLUMNS =
  'name, address, phone, promptpay_id, business_hours, custom_order_enabled, custom_order_title, custom_order_steps, announcement_enabled, announcement_message, loyalty_enabled, loyalty_baht_per_star, is_open';

type ShopSettingsRow = {
  name: string;
  logo_url?: string | null;
  address: string;
  phone: string;
  promptpay_id: string;
  business_hours: unknown;
  special_closures?: unknown;
  custom_order_enabled: boolean;
  custom_order_title: string;
  custom_order_steps: unknown;
  announcement_enabled: boolean;
  announcement_message: string;
  loyalty_enabled: boolean;
  loyalty_baht_per_star: number;
  is_open: boolean;
};

const DEFAULT_CUSTOM_ORDER_STEPS: CustomOrderStep[] = [
  {
    id: 'noodle',
    title: 'เลือกเส้น',
    options: ['เส้นเล็ก', 'เส้นใหญ่', 'เส้นหมี่', 'วุ้นเส้น', 'มาม่า', 'บะหมี่'].map(
      (label, index) => ({ id: `noodle-${index + 1}`, label, price: 0 })
    ),
  },
  {
    id: 'topping',
    title: 'เลือกเครื่อง',
    options: ['ลูกชิ้น', 'หมูสด', 'หมูเปื่อย', 'ตับ'].map((label, index) => ({
      id: `topping-${index + 1}`,
      label,
      price: 0,
    })),
  },
  {
    id: 'spicy',
    title: 'เลือกความเผ็ด',
    options: ['ไม่เผ็ด', 'เผ็ดน้อย', 'เผ็ดปานกลาง', 'เผ็ดมาก'].map((label, index) => ({
      id: `spicy-${index + 1}`,
      label,
      price: 0,
    })),
  },
  {
    id: 'size',
    title: 'เลือกความจุใจ',
    options: [
      { id: 'size-1', label: 'จุก', price: 40 },
      { id: 'size-2', label: 'แน่น', price: 50 },
      { id: 'size-3', label: 'แน่น...แน่น', price: 60 },
    ],
  },
];

function normalizeCustomOrderSteps(value: unknown): CustomOrderStep[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_CUSTOM_ORDER_STEPS;

  const steps = value
    .slice(0, 6)
    .map((step, stepIndex) => {
      if (!step || typeof step !== 'object') return null;
      const record = step as Record<string, unknown>;
      const options = Array.isArray(record.options)
        ? record.options
            .slice(0, 30)
            .map((option, optionIndex) => {
              if (!option || typeof option !== 'object') return null;
              const optionRecord = option as Record<string, unknown>;
              const label = String(optionRecord.label ?? '')
                .trim()
                .slice(0, 80);
              if (!label) return null;

              return {
                id: String(optionRecord.id ?? `option-${optionIndex + 1}`).slice(0, 80),
                label,
                price: Math.max(0, Number(optionRecord.price) || 0),
              };
            })
            .filter((option): option is CustomOrderOption => option !== null)
        : [];
      const title = String(record.title ?? '')
        .trim()
        .slice(0, 80);
      if (!title || options.length === 0) return null;

      return {
        id: String(record.id ?? `step-${stepIndex + 1}`).slice(0, 80),
        title,
        options,
      };
    })
    .filter((step): step is CustomOrderStep => step !== null);

  return steps.length > 0 ? steps : DEFAULT_CUSTOM_ORDER_STEPS;
}

function normalizeDayHours(value: unknown, fallback: DayHours): DayHours {
  if (!value || typeof value !== 'object') return fallback;
  const record = value as Record<string, unknown>;

  const open = String(record.open ?? fallback.open).slice(0, 5);
  const close = String(record.close ?? fallback.close).slice(0, 5);
  const closed = typeof record.closed === 'boolean' ? record.closed : fallback.closed;

  return { closed, open, close };
}

function normalizeBusinessHours(value: unknown): BusinessHours {
  if (!value || typeof value !== 'object') return DEFAULT_BUSINESS_HOURS;
  const record = value as Record<string, unknown>;

  return WEEKDAY_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: normalizeDayHours(record[key], DEFAULT_DAY_HOURS) }),
    {} as BusinessHours
  );
}

function normalizeSpecialClosures(value: unknown): SpecialClosure[] {
  if (!Array.isArray(value)) return [];

  const uniqueDates = new Set<string>();

  return value
    .slice(0, 100)
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const date = String(record.date ?? '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || uniqueDates.has(date)) return null;

      uniqueDates.add(date);
      return {
        id: String(record.id ?? `closure-${index + 1}`).slice(0, 80),
        date,
        label:
          String(record.label ?? 'วันหยุดพิเศษ')
            .trim()
            .slice(0, 120) || 'วันหยุดพิเศษ',
      };
    })
    .filter((item): item is SpecialClosure => item !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function mapRow(row: ShopSettingsRow): ShopSettings {
  const specialClosures = normalizeSpecialClosures(row.special_closures);
  const todayClosure = specialClosures.find((item) => item.date === getShopDateKey());

  return {
    name: row.name,
    logoUrl: row.logo_url ?? null,
    address: row.address,
    phone: row.phone,
    promptPayId: row.promptpay_id,
    businessHours: normalizeBusinessHours(row.business_hours),
    specialClosures,
    customOrder: {
      enabled: row.custom_order_enabled,
      title: row.custom_order_title,
      steps: normalizeCustomOrderSteps(row.custom_order_steps),
    },
    announcement: {
      enabled: row.announcement_enabled,
      message: row.announcement_message,
    },
    loyalty: {
      enabled: row.loyalty_enabled,
      bahtPerStar: Number(row.loyalty_baht_per_star),
    },
    isOpen: row.is_open && !todayClosure,
    manuallyOpen: row.is_open,
    closureReason: todayClosure?.label ?? '',
  };
}

const DEFAULT_SETTINGS: ShopSettings = {
  name: 'เฮงเฮง ก๋วยเตี๋ยว',
  logoUrl: null,
  address: 'บ้านขามเรียง มหาสารคาม',
  phone: '',
  promptPayId: '',
  businessHours: DEFAULT_BUSINESS_HOURS,
  specialClosures: [],
  customOrder: {
    enabled: true,
    title: 'ความอร่อยเลือกเองได้',
    steps: DEFAULT_CUSTOM_ORDER_STEPS,
  },
  announcement: {
    enabled: false,
    message: '',
  },
  loyalty: {
    enabled: false,
    bahtPerStar: 100,
  },
  isOpen: true,
  manuallyOpen: true,
  closureReason: '',
};

/** Store info shown on the customer-facing site — safe to call from any page. */
export async function getShopSettings(): Promise<ShopSettings> {
  const supabase = getSupabasePublic();
  const variants = [
    { columns: SELECT_COLUMNS, defaults: {} },
    { columns: WITHOUT_LOGO_SELECT_COLUMNS, defaults: { logo_url: null } },
    {
      columns: LEGACY_SELECT_COLUMNS,
      defaults: { logo_url: null, special_closures: [] },
    },
  ];

  for (const variant of variants) {
    const result = await supabase.from('shop_settings').select(variant.columns).maybeSingle();

    if (!result.error) {
      if (!result.data) return DEFAULT_SETTINGS;
      const row = result.data as unknown as ShopSettingsRow;
      return mapRow({ ...row, ...variant.defaults });
    }

    const isMissingColumn =
      result.error.code === '42703' || ['PGRST200', 'PGRST204'].includes(result.error.code ?? '');
    if (!isMissingColumn) throw result.error;
  }

  return DEFAULT_SETTINGS;
}

export async function updateShopSettingsRecord(input: ShopSettingsInput): Promise<ShopSettings> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('shop_settings')
    .update({
      name: input.name.trim(),
      logo_url: input.logoUrl,
      address: input.address.trim(),
      phone: input.phone.trim(),
      promptpay_id: input.promptPayId.trim(),
      business_hours: normalizeBusinessHours(input.businessHours),
      special_closures: normalizeSpecialClosures(input.specialClosures),
      custom_order_enabled: input.customOrder.enabled,
      custom_order_title: input.customOrder.title.trim() || 'ความอร่อยเลือกเองได้',
      custom_order_steps: normalizeCustomOrderSteps(input.customOrder.steps),
      announcement_enabled: input.announcement.enabled,
      announcement_message: input.announcement.message.trim().slice(0, 500),
      loyalty_enabled: input.loyalty.enabled,
      loyalty_baht_per_star: Math.max(1, Number(input.loyalty.bahtPerStar) || 1),
    })
    .eq('id', true)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return mapRow(data);
}

/** Quick เปิดร้าน/ปิดร้าน toggle — updates only is_open, independent of the full settings form. */
export async function setShopOpenRecord(isOpen: boolean): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('shop_settings').update({ is_open: isOpen }).eq('id', true);

  if (error) throw error;
}
