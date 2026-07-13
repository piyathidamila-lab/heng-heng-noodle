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
};

export type ShopSettingsInput = ShopSettings;

const SELECT_COLUMNS = 'name, address, phone, promptpay_id, open_time, close_time';

type ShopSettingsRow = {
  name: string;
  address: string;
  phone: string;
  promptpay_id: string;
  open_time: string;
  close_time: string;
};

function mapRow(row: ShopSettingsRow): ShopSettings {
  return {
    name: row.name,
    address: row.address,
    phone: row.phone,
    promptPayId: row.promptpay_id,
    openTime: row.open_time,
    closeTime: row.close_time,
  };
}

const DEFAULT_SETTINGS: ShopSettings = {
  name: 'เฮงเฮง ก๋วยเตี๋ยว',
  address: 'บ้านขามเรียง มหาสารคาม',
  phone: '',
  promptPayId: '',
  openTime: '',
  closeTime: '',
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
    })
    .eq('id', true)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return mapRow(data);
}
