import { getSupabaseAdmin } from './supabase-admin';
import { getSupabasePublic } from './supabase-public';
import { getShopSettings } from './shop-settings-service';

// ----------------------------------------------------------------------

export class LoyaltyValidationError extends Error {}

export type LoyaltyReward = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  starsCost: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

type RewardRow = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  stars_cost: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

const REWARD_SELECT_COLUMNS =
  'id, name, description, image_url, stars_cost, is_active, sort_order, created_at';

function mapRewardRow(row: RewardRow): LoyaltyReward {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    starsCost: row.stars_cost,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

/** Active rewards for the customer-facing catalog — public client, anyone can read. */
export async function listActiveRewards(): Promise<LoyaltyReward[]> {
  const supabase = getSupabasePublic();

  const { data, error } = await supabase
    .from('loyalty_rewards')
    .select(REWARD_SELECT_COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapRewardRow);
}

/** All rewards (active or not), for the admin management page. */
export async function listRewardsAdmin(): Promise<LoyaltyReward[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('loyalty_rewards')
    .select(REWARD_SELECT_COLUMNS)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapRewardRow);
}

export type RewardInput = {
  name: string;
  description: string;
  imageUrl: string | null;
  starsCost: number;
  isActive: boolean;
  sortOrder: number;
};

function assertValidReward(input: RewardInput): void {
  if (!input.name.trim()) throw new LoyaltyValidationError('กรุณากรอกชื่อของรางวัล');
  if (!Number.isFinite(input.starsCost) || input.starsCost <= 0) {
    throw new LoyaltyValidationError('จำนวนดาวต้องมากกว่า 0');
  }
}

export async function createRewardRecord(input: RewardInput): Promise<LoyaltyReward> {
  assertValidReward(input);

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('loyalty_rewards')
    .insert({
      name: input.name.trim(),
      description: input.description.trim(),
      image_url: input.imageUrl,
      stars_cost: Math.round(input.starsCost),
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .select(REWARD_SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return mapRewardRow(data);
}

export async function updateRewardRecord(id: string, input: RewardInput): Promise<LoyaltyReward> {
  assertValidReward(input);

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('loyalty_rewards')
    .update({
      name: input.name.trim(),
      description: input.description.trim(),
      image_url: input.imageUrl,
      stars_cost: Math.round(input.starsCost),
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .eq('id', id)
    .select(REWARD_SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return mapRewardRow(data);
}

export async function deleteRewardRecord(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('loyalty_rewards').delete().eq('id', id);

  if (error) throw error;
}

// ----------------------------------------------------------------------
// Star awarding — called from order-service.ts when a takeaway order
// completes or a dine-in table session's bill is closed.
// ----------------------------------------------------------------------

async function awardStars(
  customerId: string,
  stars: number,
  reason: 'order_earn' | 'session_earn',
  referenceType: 'order' | 'session',
  referenceId: string
): Promise<void> {
  if (stars <= 0) return;

  const supabase = getSupabaseAdmin();

  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('stars_balance')
    .eq('id', customerId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!customer) return;

  const { error: updateError } = await supabase
    .from('customers')
    .update({ stars_balance: customer.stars_balance + stars })
    .eq('id', customerId);

  if (updateError) throw updateError;

  const { error: ledgerError } = await supabase.from('star_ledger').insert({
    customer_id: customerId,
    delta: stars,
    reason,
    reference_type: referenceType,
    reference_id: referenceId,
  });

  if (ledgerError) throw ledgerError;
}

/** Awards stars for a completed takeaway order, if it's linked to a member and hasn't been awarded yet. */
export async function awardStarsForOrder(orderId: string): Promise<void> {
  const settings = await getShopSettings();
  if (!settings.loyalty.enabled) return;

  const supabase = getSupabaseAdmin();

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, customer_id, total, order_type, stars_awarded')
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw error;
  if (!order || !order.customer_id || order.stars_awarded || order.order_type !== 'takeaway')
    return;

  const stars = Math.floor(Number(order.total) / settings.loyalty.bahtPerStar);

  await awardStars(order.customer_id, stars, 'order_earn', 'order', order.id);

  const { error: markError } = await supabase
    .from('orders')
    .update({ stars_awarded: true })
    .eq('id', order.id);

  if (markError) throw markError;
}

/** Awards stars for a closed table session's bill, if it's linked to a member and hasn't been awarded yet. */
export async function awardStarsForSession(sessionId: string): Promise<void> {
  const settings = await getShopSettings();
  if (!settings.loyalty.enabled) return;

  const supabase = getSupabaseAdmin();

  const { data: session, error } = await supabase
    .from('table_sessions')
    .select('id, customer_id, stars_awarded, orders (total, status)')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) throw error;
  if (!session || !session.customer_id || session.stars_awarded) return;

  const orders = (session.orders ?? []) as { total: number; status: string }[];
  const total = orders
    .filter((order) => order.status !== 'cancelled')
    .reduce((sum, order) => sum + Number(order.total), 0);

  const stars = Math.floor(total / settings.loyalty.bahtPerStar);

  await awardStars(session.customer_id, stars, 'session_earn', 'session', session.id);

  const { error: markError } = await supabase
    .from('table_sessions')
    .update({ stars_awarded: true })
    .eq('id', session.id);

  if (markError) throw markError;
}

// ----------------------------------------------------------------------
// Redemptions
// ----------------------------------------------------------------------

export type LoyaltyRedemption = {
  id: string;
  customerId: string;
  customerPhone: string;
  customerDisplayName: string;
  rewardName: string;
  starsCost: number;
  status: 'pending' | 'fulfilled' | 'rejected';
  requestedAt: string;
  decidedAt: string | null;
};

type RedemptionRow = {
  id: string;
  customer_id: string;
  reward_name: string;
  stars_cost: number;
  status: 'pending' | 'fulfilled' | 'rejected';
  requested_at: string;
  decided_at: string | null;
  customers: { phone: string; display_name: string } | null;
};

const REDEMPTION_SELECT_COLUMNS =
  'id, customer_id, reward_name, stars_cost, status, requested_at, decided_at, customers (phone, display_name)';

function mapRedemptionRow(row: RedemptionRow): LoyaltyRedemption {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerPhone: row.customers?.phone ?? '',
    customerDisplayName: row.customers?.display_name ?? '',
    rewardName: row.reward_name,
    starsCost: row.stars_cost,
    status: row.status,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
  };
}

/**
 * Requests a redemption on behalf of a logged-in member — stars are deducted
 * immediately (escrow) using an atomic guarded update so a customer can never
 * request more than their current balance, even under concurrent requests.
 * If staff/admin later reject the request, the stars are refunded.
 */
export async function requestRedemption(customerId: string, rewardId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: reward, error: rewardError } = await supabase
    .from('loyalty_rewards')
    .select('id, name, stars_cost, is_active')
    .eq('id', rewardId)
    .maybeSingle();

  if (rewardError) throw rewardError;
  if (!reward || !reward.is_active)
    throw new LoyaltyValidationError('ของรางวัลนี้ไม่พร้อมให้แลกแล้ว');

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('stars_balance')
    .eq('id', customerId)
    .maybeSingle();

  if (customerError) throw customerError;
  if (!customer || customer.stars_balance < reward.stars_cost) {
    throw new LoyaltyValidationError('ดาวสะสมไม่พอสำหรับแลกของรางวัลนี้');
  }

  // Guarded conditional update: the `gte` filter is re-checked against the live
  // row (under Postgres's row lock) at update time, not our stale in-memory
  // read above — so two concurrent requests can never both deduct past zero.
  const { data: updatedRows, error: updateError } = await supabase
    .from('customers')
    .update({ stars_balance: customer.stars_balance - reward.stars_cost })
    .eq('id', customerId)
    .gte('stars_balance', reward.stars_cost)
    .select('id');

  if (updateError) throw updateError;
  if (!updatedRows || updatedRows.length === 0) {
    throw new LoyaltyValidationError('ดาวสะสมไม่พอสำหรับแลกของรางวัลนี้');
  }

  const { error: redemptionError } = await supabase.from('loyalty_redemptions').insert({
    customer_id: customerId,
    reward_id: reward.id,
    reward_name: reward.name,
    stars_cost: reward.stars_cost,
    status: 'pending',
  });

  if (redemptionError) throw redemptionError;

  const { error: ledgerError } = await supabase.from('star_ledger').insert({
    customer_id: customerId,
    delta: -reward.stars_cost,
    reason: 'redeem_request',
    reference_type: 'reward',
    reference_id: reward.id,
  });

  if (ledgerError) throw ledgerError;
}

/** Approves or rejects a pending redemption request — rejecting refunds the stars. */
export async function decideRedemption(redemptionId: string, approve: boolean): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: redemption, error } = await supabase
    .from('loyalty_redemptions')
    .select('id, customer_id, stars_cost, status')
    .eq('id', redemptionId)
    .maybeSingle();

  if (error) throw error;
  if (!redemption || redemption.status !== 'pending') {
    throw new LoyaltyValidationError('คำขอนี้ถูกดำเนินการไปแล้ว');
  }

  const { error: updateError } = await supabase
    .from('loyalty_redemptions')
    .update({
      status: approve ? 'fulfilled' : 'rejected',
      decided_at: new Date().toISOString(),
    })
    .eq('id', redemptionId);

  if (updateError) throw updateError;

  if (!approve) {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('stars_balance')
      .eq('id', redemption.customer_id)
      .maybeSingle();

    if (customerError) throw customerError;
    if (customer) {
      const { error: refundError } = await supabase
        .from('customers')
        .update({ stars_balance: customer.stars_balance + redemption.stars_cost })
        .eq('id', redemption.customer_id);

      if (refundError) throw refundError;
    }

    const { error: ledgerError } = await supabase.from('star_ledger').insert({
      customer_id: redemption.customer_id,
      delta: redemption.stars_cost,
      reason: 'redeem_refund',
      reference_type: 'reward',
      reference_id: redemptionId,
    });

    if (ledgerError) throw ledgerError;
  }
}

/** A member's own redemption history, newest first. */
export async function listMyRedemptions(customerId: string): Promise<LoyaltyRedemption[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('loyalty_redemptions')
    .select(REDEMPTION_SELECT_COLUMNS)
    .eq('customer_id', customerId)
    .order('requested_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => mapRedemptionRow(row as unknown as RedemptionRow));
}

/** Pending redemption requests for the admin/staff approval queue, oldest first. */
export async function listPendingRedemptionsAdmin(): Promise<LoyaltyRedemption[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('loyalty_redemptions')
    .select(REDEMPTION_SELECT_COLUMNS)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => mapRedemptionRow(row as unknown as RedemptionRow));
}

// ----------------------------------------------------------------------
// Members (admin view)
// ----------------------------------------------------------------------

export type MemberSummary = {
  id: string;
  phone: string;
  displayName: string;
  starsBalance: number;
  createdAt: string;
};

export async function listMembersAdmin(): Promise<MemberSummary[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('customers')
    .select('id, phone, display_name, stars_balance, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    phone: row.phone,
    displayName: row.display_name,
    starsBalance: row.stars_balance,
    createdAt: row.created_at,
  }));
}

export type StarLedgerEntry = {
  id: string;
  delta: number;
  reason: string;
  createdAt: string;
};

/** A single member's earn/redeem history, newest first — for the admin member detail dialog. */
export async function getMemberLedgerAdmin(customerId: string): Promise<StarLedgerEntry[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('star_ledger')
    .select('id, delta, reason, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    delta: row.delta,
    reason: row.reason,
    createdAt: row.created_at,
  }));
}
