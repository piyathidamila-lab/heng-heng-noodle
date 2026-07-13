import { getSupabaseAdmin } from './supabase-admin';
import { getSupabasePublic } from './supabase-public';

// ----------------------------------------------------------------------

export type ShopSettings = {
  name: string;
  address: string;
  phone: string;
  promptPayId: string;
  openTime: string;
  closeTime: string;
  customOrder: CustomOrderConfig;
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
  'name, address, phone, promptpay_id, open_time, close_time, custom_order_enabled, custom_order_title, custom_order_steps';

type ShopSettingsRow = {
  name: string;
  address: string;
  phone: string;
  promptpay_id: string;
  open_time: string;
  close_time: string;
  custom_order_enabled: boolean;
  custom_order_title: string;
  custom_order_steps: unknown;
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

function mapRow(row: ShopSettingsRow): ShopSettings {
  return {
    name: row.name,
    address: row.address,
    phone: row.phone,
    promptPayId: row.promptpay_id,
    openTime: row.open_time,
    closeTime: row.close_time,
    customOrder: {
      enabled: row.custom_order_enabled,
      title: row.custom_order_title,
      steps: normalizeCustomOrderSteps(row.custom_order_steps),
    },
  };
}

const DEFAULT_SETTINGS: ShopSettings = {
  name: 'เฮงเฮง ก๋วยเตี๋ยว',
  address: 'บ้านขามเรียง มหาสารคาม',
  phone: '',
  promptPayId: '',
  openTime: '',
  closeTime: '',
  customOrder: {
    enabled: true,
    title: 'ความอร่อยเลือกเองได้',
    steps: DEFAULT_CUSTOM_ORDER_STEPS,
  },
};

/** Store info shown on the customer-facing site — safe to call from any page. */
export async function getShopSettings(): Promise<ShopSettings> {
  const supabase = getSupabasePublic();

  const { data, error } = await supabase.from('shop_settings').select(SELECT_COLUMNS).maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULT_SETTINGS;

  return mapRow(data);
}

export async function updateShopSettingsRecord(input: ShopSettingsInput): Promise<ShopSettings> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('shop_settings')
    .update({
      name: input.name.trim(),
      address: input.address.trim(),
      phone: input.phone.trim(),
      promptpay_id: input.promptPayId.trim(),
      open_time: input.openTime.trim(),
      close_time: input.closeTime.trim(),
      custom_order_enabled: input.customOrder.enabled,
      custom_order_title: input.customOrder.title.trim() || 'ความอร่อยเลือกเองได้',
      custom_order_steps: normalizeCustomOrderSteps(input.customOrder.steps),
    })
    .eq('id', true)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return mapRow(data);
}
