-- Esquema base: las tablas que el resto de la app (y las dos migraciones
-- anteriores, checkout_order_rpc y expire_pending_sales) asumen que ya
-- existen. En el proyecto de Supabase original se habían creado a mano
-- desde el dashboard y nunca quedaron guardadas como código; este archivo
-- las reconstruye para poder levantar un proyecto nuevo desde cero.
--
-- Deploy: pegar en el SQL Editor de Supabase y correr (o `supabase db push`
-- si se corre desde un entorno con acceso a la API de Supabase).

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  stock integer not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent numeric(5,2) not null,
  max_uses integer,
  uses integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'vendedor' check (role in ('admin', 'vendedor', 'lectura')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text,
  customer_doc text,
  employee_id uuid references public.employees(id) on delete set null,
  total numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  payment_method text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'completada', 'cancelada')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null,
  unit_price numeric(12,2) not null,
  subtotal numeric(12,2) not null
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default 'Mi Tienda',
  primary_color text,
  secondary_color text,
  navbar_color text,
  price_color text,
  font_family text,
  heading_font_family text,
  hero_title text,
  hero_subtitle text,
  hero_btn_text text,
  hero_image_url text,
  logo_url text,
  card_radius integer default 4,
  product_columns integer default 3,
  address text,
  phone text,
  cuit text,
  ticket_show_email boolean default true,
  ticket_show_doc boolean default true,
  ticket_show_employee boolean default true,
  ticket_show_note boolean default true,
  ticket_show_discount boolean default true,
  ticket_footer text,
  ticket_header_color text,
  ticket_custom_fields jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Fila única de configuración con los mismos defaults que Estetica.jsx,
-- para que la tienda tenga algo que mostrar apenas se crea el proyecto.
insert into public.store_settings (
  store_name, primary_color, secondary_color, navbar_color, price_color,
  font_family, heading_font_family, hero_title, hero_subtitle, hero_btn_text,
  card_radius, product_columns, ticket_footer, ticket_header_color
)
select
  'Mi Tienda', '#B5652E', '#F6EEE1', '#2B2119', '#2B2119',
  'Manrope', 'Bricolage Grotesque', 'Todo lo que necesitás', 'Los mejores productos al mejor precio', 'Ver catálogo',
  4, 3, '¡Gracias por su compra!', '#2B2119'
where not exists (select 1 from public.store_settings);

-- Row Level Security: lectura pública de lo que ve la tienda, gestión
-- completa para empleados autenticados. Las ventas se insertan siempre a
-- través de checkout_order (security definer), nunca directo desde el
-- cliente.
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.coupons enable row level security;
alter table public.employees enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.store_settings enable row level security;

create policy "Lectura pública de categorías" on public.categories for select using (true);
create policy "Empleados gestionan categorías" on public.categories for all to authenticated using (true) with check (true);

create policy "Lectura pública de productos" on public.products for select using (true);
create policy "Empleados gestionan productos" on public.products for all to authenticated using (true) with check (true);

create policy "Lectura pública de cupones" on public.coupons for select using (true);
create policy "Empleados gestionan cupones" on public.coupons for all to authenticated using (true) with check (true);

create policy "Empleados gestionan empleados" on public.employees for all to authenticated using (true) with check (true);

create policy "Empleados leen y actualizan ventas" on public.sales for select to authenticated using (true);
create policy "Empleados actualizan ventas" on public.sales for update to authenticated using (true) with check (true);

create policy "Empleados leen items de venta" on public.sale_items for select to authenticated using (true);

create policy "Lectura pública de configuración" on public.store_settings for select using (true);
create policy "Empleados gestionan configuración" on public.store_settings for all to authenticated using (true) with check (true);

grant select on public.categories, public.products, public.coupons, public.store_settings to anon;
grant select, insert, update, delete on public.categories, public.products, public.coupons, public.employees, public.store_settings to authenticated;
grant select, update on public.sales to authenticated;
grant select on public.sale_items to authenticated;

-- Buckets de imágenes: logo/portada de la tienda y fotos de producto,
-- ambos públicos para lectura (así se pueden mostrar con <img src>).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

create policy "Lectura pública product-images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Empleados suben product-images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images');
create policy "Empleados actualizan product-images" on storage.objects for update to authenticated using (bucket_id = 'product-images');
create policy "Empleados borran product-images" on storage.objects for delete to authenticated using (bucket_id = 'product-images');

create policy "Lectura pública store-assets" on storage.objects for select using (bucket_id = 'store-assets');
create policy "Empleados suben store-assets" on storage.objects for insert to authenticated with check (bucket_id = 'store-assets');
create policy "Empleados actualizan store-assets" on storage.objects for update to authenticated using (bucket_id = 'store-assets');
create policy "Empleados borran store-assets" on storage.objects for delete to authenticated using (bucket_id = 'store-assets');
