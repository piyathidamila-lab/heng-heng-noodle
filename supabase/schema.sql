-- Heng Heng Noodle — schema for menu management + order intake
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.

-- ----------------------------------------------------------------------
-- menu_items
-- ----------------------------------------------------------------------

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('noodle', 'side', 'drink')),
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  emoji text not null default '🍜',
  image_url text,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, name)
);

-- re-running on a database created before photos were added
alter table public.menu_items add column if not exists image_url text;

-- re-running on a database created before the "best seller" strip was added
alter table public.menu_items add column if not exists is_best_seller boolean not null default false;
alter table public.menu_items add column if not exists best_seller_sort_order integer not null default 0;

-- categories used to be a fixed ('noodle','side','drink') check constraint —
-- now managed by admins via the menu_categories table below, so relax it to
-- accept any value (existing rows keep working, no data migration needed).
alter table public.menu_items drop constraint if exists menu_items_category_check;

alter table public.menu_items enable row level security;

-- Anyone (customers browsing the menu) may read menu items with the anon key.
drop policy if exists "menu_items are publicly readable" on public.menu_items;
create policy "menu_items are publicly readable"
  on public.menu_items for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policies are defined for anon/authenticated on purpose:
-- all writes go through the server using the service-role key (see src/lib/supabase),
-- gated by the admin password check, so RLS denies writes from the browser entirely.

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row
  execute function public.set_updated_at();

-- ----------------------------------------------------------------------
-- menu_categories — admin-managed replacement for the old hardcoded
-- ('noodle' | 'side' | 'drink') list. menu_items.category stores this
-- table's `value` as plain text (no FK) so existing rows never needed
-- to be migrated.
-- ----------------------------------------------------------------------

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  value text not null unique,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.menu_categories enable row level security;

drop policy if exists "menu_categories are publicly readable" on public.menu_categories;
create policy "menu_categories are publicly readable"
  on public.menu_categories for select
  to anon, authenticated
  using (true);

-- Seed the 3 categories that already exist as menu_items.category text values.
insert into public.menu_categories (value, label, sort_order)
values
  ('noodle', 'ก๋วยเตี๋ยว', 1),
  ('side', 'ของทานเล่น', 2),
  ('drink', 'เครื่องดื่ม', 3)
on conflict (value) do nothing;

-- ----------------------------------------------------------------------
-- shop_settings — a single editable row of store info (name, address,
-- contact, PromptPay id, opening hours). The `id boolean` trick keeps it
-- to exactly one row: only `true` passes the check, and the primary key
-- stops a second row with the same id from ever being inserted.
-- ----------------------------------------------------------------------

create table if not exists public.shop_settings (
  id boolean primary key default true check (id),
  name text not null default 'เฮงเฮง ก๋วยเตี๋ยว',
  logo_url text,
  address text not null default 'บ้านขามเรียง มหาสารคาม',
  phone text not null default '',
  promptpay_id text not null default '',
  business_hours jsonb not null default '{"mon":{"closed":false,"open":"08:00","close":"20:00"},"tue":{"closed":false,"open":"08:00","close":"20:00"},"wed":{"closed":false,"open":"08:00","close":"20:00"},"thu":{"closed":false,"open":"08:00","close":"20:00"},"fri":{"closed":false,"open":"08:00","close":"20:00"},"sat":{"closed":false,"open":"08:00","close":"20:00"},"sun":{"closed":false,"open":"08:00","close":"20:00"}}'::jsonb,
  special_closures jsonb not null default '[]'::jsonb,
  custom_order_enabled boolean not null default true,
  custom_order_title text not null default 'ความอร่อยเลือกเองได้',
  custom_order_steps jsonb not null default '[{"id":"noodle","title":"เลือกเส้น","options":[{"id":"noodle-1","label":"เส้นเล็ก","price":0},{"id":"noodle-2","label":"เส้นใหญ่","price":0},{"id":"noodle-3","label":"เส้นหมี่","price":0},{"id":"noodle-4","label":"วุ้นเส้น","price":0},{"id":"noodle-5","label":"มาม่า","price":0},{"id":"noodle-6","label":"บะหมี่","price":0}]},{"id":"topping","title":"เลือกเครื่อง","options":[{"id":"topping-1","label":"ลูกชิ้น","price":0},{"id":"topping-2","label":"หมูสด","price":0},{"id":"topping-3","label":"หมูเปื่อย","price":0},{"id":"topping-4","label":"ตับ","price":0}]},{"id":"size","title":"เลือกความจุใจ","options":[{"id":"size-1","label":"จุก","price":40},{"id":"size-2","label":"แน่น","price":50},{"id":"size-3","label":"แน่น...แน่น","price":60}]}]'::jsonb,
  announcement_enabled boolean not null default false,
  announcement_message text not null default '',
  is_open boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Re-running this schema upgrades databases created before custom orders existed.
alter table public.shop_settings add column if not exists logo_url text;
alter table public.shop_settings add column if not exists custom_order_enabled boolean not null default true;
alter table public.shop_settings add column if not exists custom_order_title text not null default 'ความอร่อยเลือกเองได้';
alter table public.shop_settings add column if not exists custom_order_steps jsonb not null default '[{"id":"noodle","title":"เลือกเส้น","options":[{"id":"noodle-1","label":"เส้นเล็ก","price":0},{"id":"noodle-2","label":"เส้นใหญ่","price":0},{"id":"noodle-3","label":"เส้นหมี่","price":0},{"id":"noodle-4","label":"วุ้นเส้น","price":0},{"id":"noodle-5","label":"มาม่า","price":0},{"id":"noodle-6","label":"บะหมี่","price":0}]},{"id":"topping","title":"เลือกเครื่อง","options":[{"id":"topping-1","label":"ลูกชิ้น","price":0},{"id":"topping-2","label":"หมูสด","price":0},{"id":"topping-3","label":"หมูเปื่อย","price":0},{"id":"topping-4","label":"ตับ","price":0}]},{"id":"size","title":"เลือกความจุใจ","options":[{"id":"size-1","label":"จุก","price":40},{"id":"size-2","label":"แน่น","price":50},{"id":"size-3","label":"แน่น...แน่น","price":60}]}]'::jsonb;

-- Re-running this schema upgrades databases created before the shop-closed announcement banner existed.
alter table public.shop_settings add column if not exists announcement_enabled boolean not null default false;
alter table public.shop_settings add column if not exists announcement_message text not null default '';

-- Re-running this schema upgrades databases created before the เปิดร้าน/ปิดร้าน toggle existed.
alter table public.shop_settings add column if not exists is_open boolean not null default true;

-- Re-running this schema upgrades databases created before per-weekday business hours existed
-- (replaces the old single open_time/close_time text columns, left in place unused).
alter table public.shop_settings add column if not exists business_hours jsonb not null default '{"mon":{"closed":false,"open":"08:00","close":"20:00"},"tue":{"closed":false,"open":"08:00","close":"20:00"},"wed":{"closed":false,"open":"08:00","close":"20:00"},"thu":{"closed":false,"open":"08:00","close":"20:00"},"fri":{"closed":false,"open":"08:00","close":"20:00"},"sat":{"closed":false,"open":"08:00","close":"20:00"},"sun":{"closed":false,"open":"08:00","close":"20:00"}}'::jsonb;

-- Re-running this schema upgrades databases created before special closure dates existed.
alter table public.shop_settings add column if not exists special_closures jsonb not null default '[]'::jsonb;

insert into public.shop_settings (id) values (true) on conflict (id) do nothing;

alter table public.shop_settings enable row level security;

drop policy if exists "shop_settings are publicly readable" on public.shop_settings;
create policy "shop_settings are publicly readable"
  on public.shop_settings for select
  to anon, authenticated
  using (true);

drop trigger if exists shop_settings_set_updated_at on public.shop_settings;
create trigger shop_settings_set_updated_at
  before update on public.shop_settings
  for each row
  execute function public.set_updated_at();

-- ----------------------------------------------------------------------
-- restaurant_tables — admin-managed list of table labels, the single
-- source of truth for both the printable QR sheet and the table-number
-- dropdown customers who didn't scan a QR code pick from.
-- ----------------------------------------------------------------------

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.restaurant_tables enable row level security;

drop policy if exists "restaurant_tables are publicly readable" on public.restaurant_tables;
create policy "restaurant_tables are publicly readable"
  on public.restaurant_tables for select
  to anon, authenticated
  using (true);

-- ----------------------------------------------------------------------
-- table_sessions — one "open table" run from the first order until the
-- bill is paid and the admin closes it. Lets the QR table view show only
-- the current diners' orders instead of every order ever placed at that
-- table number, and lets the admin see which tables are occupied.
-- ----------------------------------------------------------------------

create table if not exists public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  table_number text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

-- Only one open session per table at a time.
create unique index if not exists table_sessions_one_open_per_table
  on public.table_sessions (table_number)
  where (status = 'open');

alter table public.table_sessions enable row level security;
-- No policies for anon/authenticated: sessions are only ever opened/closed
-- from the server (service-role key) — opened implicitly when an order is
-- placed, closed by the admin once the table has paid.

-- ----------------------------------------------------------------------
-- orders
-- ----------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  seq bigserial not null,
  session_id uuid references public.table_sessions (id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  order_type text not null check (order_type in ('dine-in', 'takeaway')),
  table_number text not null default '',
  note text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'preparing', 'served', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid')),
  paid_at timestamptz,
  total numeric(10, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

-- re-running on a database created before table sessions were added
alter table public.orders add column if not exists session_id uuid references public.table_sessions (id) on delete set null;
alter table public.orders add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'paid'));
alter table public.orders add column if not exists paid_at timestamptz;

-- Existing completed takeaway orders predate the separate payment status and
-- were treated as settled by the old workflow.
update public.orders
set payment_status = 'paid', paid_at = coalesce(paid_at, created_at)
where order_type = 'takeaway' and status = 'completed' and payment_status = 'unpaid';

-- the order form no longer collects a phone number — relax the old
-- requirement rather than dropping the column, so historical orders that
-- have one keep it.
alter table public.orders alter column customer_phone drop not null;

alter table public.orders enable row level security;
-- No policies for anon/authenticated: orders contain customer PII (name, phone) and
-- are only ever read/written from the server via the service-role key — placing an
-- order goes through a server action that recomputes the total from menu_items,
-- and the admin dashboard reads orders through a cookie-gated server action.

create index if not exists orders_session_id_idx on public.orders (session_id);

-- ----------------------------------------------------------------------
-- order_items
-- ----------------------------------------------------------------------

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  quantity integer not null check (quantity > 0)
);

alter table public.order_items enable row level security;
-- Same access model as orders: server-only via the service-role key.

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ----------------------------------------------------------------------
-- seed data — starter noodle menu (safe to skip/edit before running)
-- ----------------------------------------------------------------------

insert into public.menu_items (category, name, description, price, emoji, sort_order)
values
  ('noodle', 'ก๋วยเตี๋ยวหมูน้ำใส', 'เส้นเลือกได้ ต้มน้ำซุปกระดูกหมู ใส่หมูสับและลูกชิ้น', 45, '🍜', 1),
  ('noodle', 'ก๋วยเตี๋ยวหมูน้ำตก', 'รสจัดจ้าน เปรี้ยวเผ็ดกำลังดี ใส่หมูและเครื่องในหมู', 50, '🍜', 2),
  ('noodle', 'ก๋วยเตี๋ยวหมูตุ๋น', 'หมูตุ๋นเปื่อยนุ่ม น้ำซุปตุ๋นสมุนไพรหอมกลมกล่อม', 55, '🍲', 3),
  ('noodle', 'เย็นตาโฟ', 'น้ำยำสูตรเข้มข้น ใส่ลูกชิ้นปลา เต้าหู้ยี้ ปลาหมึก', 50, '🍥', 4),
  ('noodle', 'ก๋วยเตี๋ยวคั่วไก่', 'เส้นใหญ่คั่วแห้งกับไก่และไข่ หอมกระเทียมเจียว', 50, '🍝', 5),
  ('noodle', 'บะหมี่หมูแดงหมูกรอบ', 'บะหมี่เหนียวนุ่ม เสิร์ฟพร้อมหมูแดงและหมูกรอบ', 50, '🍜', 6),
  ('side', 'เกี๊ยวซ่าทอด', 'เกี๊ยวซ่าทอดกรอบ เสิร์ฟพร้อมน้ำจิ้ม (5 ชิ้น)', 40, '🥟', 1),
  ('side', 'ปอเปี๊ยะทอด', 'ปอเปี๊ยะทอดกรอบไส้แน่น เสิร์ฟพร้อมน้ำจิ้มบ๊วย', 35, '🥠', 2),
  ('side', 'ลูกชิ้นปิ้ง', 'ลูกชิ้นหมูปิ้งเสียบไม้ 5 ไม้ เสิร์ฟพร้อมน้ำจิ้มแจ่ว', 30, '🍢', 3),
  ('drink', 'ชาไทย', 'ชาไทยหอมมัน เข้มข้น เสิร์ฟเย็นฉ่ำ', 25, '🧋', 1),
  ('drink', 'น้ำแข็งไส', 'น้ำแข็งไสเย็นชื่นใจ ราดน้ำหวานหลากรส', 20, '🍧', 2),
  ('drink', 'น้ำอัดลม', 'โค้ก / สไปรท์ / แฟนต้า เย็นสดชื่น', 15, '🥤', 3),
  ('drink', 'น้ำเปล่า', 'น้ำดื่มบรรจุขวด เย็นสดชื่น', 10, '💧', 4)
on conflict (category, name) do nothing;

-- ----------------------------------------------------------------------
-- admin_users — accounts for the admin dashboard and staff (front-of-house)
-- login, replacing the old single shared-password ADMIN_AUTH_SECRET /
-- STAFF_AUTH_SECRET env vars. Passwords are hashed application-side
-- (scrypt, see src/lib/password.ts) before being stored here — this table
-- never sees a plaintext password.
-- ----------------------------------------------------------------------

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  display_name text not null default '',
  role text not null check (role in ('admin', 'staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- No policies for anon/authenticated: accounts contain password hashes and
-- are only ever read/written from the server via the service-role key.

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row
  execute function public.set_updated_at();

-- Seed one default admin account so the dashboard is reachable right after
-- this migration runs. Password is "changeme123" — sign in and change it
-- (or create your own admin account and delete this one) from
-- จัดการผู้ใช้งาน immediately.
insert into public.admin_users (username, password_hash, display_name, role)
values (
  'admin',
  '7e18998609794a0fcb1ce0125ac285e1:2d70b18c495cd2f694f326b1fbc2870fc851d2277e95e913f3b971bac4bc6ffd5fe6a6b88d858bef3f3c0a3fb96ac84fdb0080fdddfc3f1353f0189fc120013e',
  'ผู้ดูแลระบบ',
  'admin'
)
on conflict (username) do nothing;

-- ----------------------------------------------------------------------
-- admin_sessions — bearer tokens for logged-in admin_users. The session
-- cookie holds this row's id; deleting the row (logout, or an admin
-- deactivating/deleting the account) invalidates it immediately.
-- ----------------------------------------------------------------------

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.admin_users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.admin_sessions enable row level security;
-- No policies for anon/authenticated: server-only via the service-role key.

create index if not exists admin_sessions_user_id_idx on public.admin_sessions (user_id);

-- ----------------------------------------------------------------------
-- storage bucket for menu item photos
-- ----------------------------------------------------------------------
-- Public bucket: photo uploads/deletes only ever happen server-side with the
-- service-role key (bypasses storage RLS), but reads need to be public so the
-- customer-facing menu can load images directly from the returned URL.

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do update set public = true;

-- ----------------------------------------------------------------------
-- Star loyalty program — customers register with phone + PIN, earn stars
-- when a bill is paid (dine-in) or a takeaway order is completed, and can
-- request to redeem rewards (subject to staff/admin approval).
-- ----------------------------------------------------------------------

alter table public.shop_settings add column if not exists loyalty_enabled boolean not null default false;
alter table public.shop_settings add column if not exists loyalty_baht_per_star numeric(10, 2) not null default 100;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  pin_hash text not null,
  display_name text not null default '',
  stars_balance integer not null default 0 check (stars_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;
-- No policies for anon/authenticated: PIN hashes and star balances are only
-- ever read/written from the server via the service-role key.

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
  before update on public.customers
  for each row
  execute function public.set_updated_at();

create table if not exists public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.customer_sessions enable row level security;
-- No policies for anon/authenticated: server-only via the service-role key.

create index if not exists customer_sessions_customer_id_idx on public.customer_sessions (customer_id);

create table if not exists public.star_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  delta integer not null,
  reason text not null check (reason in ('order_earn', 'session_earn', 'redeem_request', 'redeem_refund')),
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

alter table public.star_ledger enable row level security;
-- No policies for anon/authenticated: server-only via the service-role key.

create index if not exists star_ledger_customer_id_idx on public.star_ledger (customer_id);

create table if not exists public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  stars_cost integer not null check (stars_cost > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.loyalty_rewards enable row level security;

-- Customers browse the reward catalog with the anon key, same as menu_items.
drop policy if exists "loyalty_rewards are publicly readable" on public.loyalty_rewards;
create policy "loyalty_rewards are publicly readable"
  on public.loyalty_rewards for select
  to anon, authenticated
  using (true);

drop trigger if exists loyalty_rewards_set_updated_at on public.loyalty_rewards;
create trigger loyalty_rewards_set_updated_at
  before update on public.loyalty_rewards
  for each row
  execute function public.set_updated_at();

create table if not exists public.loyalty_redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  reward_id uuid references public.loyalty_rewards (id) on delete set null,
  reward_name text not null,
  stars_cost integer not null,
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.admin_users (id) on delete set null
);

alter table public.loyalty_redemptions enable row level security;
-- No policies for anon/authenticated: server-only via the service-role key.

create index if not exists loyalty_redemptions_customer_id_idx on public.loyalty_redemptions (customer_id);
create index if not exists loyalty_redemptions_status_idx on public.loyalty_redemptions (status);

-- Links an order/table session to the member who placed it, so stars can be
-- awarded to the right account when the bill is paid / order completed.
alter table public.orders add column if not exists customer_id uuid references public.customers (id) on delete set null;
alter table public.orders add column if not exists stars_awarded boolean not null default false;
alter table public.table_sessions add column if not exists customer_id uuid references public.customers (id) on delete set null;
alter table public.table_sessions add column if not exists stars_awarded boolean not null default false;
