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
  total numeric(10, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

-- re-running on a database created before table sessions were added
alter table public.orders add column if not exists session_id uuid references public.table_sessions (id) on delete set null;

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
-- keep menu_items.updated_at current on edit
-- ----------------------------------------------------------------------

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
-- storage bucket for menu item photos
-- ----------------------------------------------------------------------
-- Public bucket: photo uploads/deletes only ever happen server-side with the
-- service-role key (bypasses storage RLS), but reads need to be public so the
-- customer-facing menu can load images directly from the returned URL.

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do update set public = true;
