-- Esquema de Import Cuyo. Se corre una sola vez en el SQL Editor de Supabase.

-- Quién puede entrar al panel. Sin políticas: nadie la lee ni la escribe por la API.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Textos, banners, contacto y colores: una sola fila.
create table public.site (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.products (
  id text primary key,
  position int not null default 0,
  visible boolean not null default true,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index products_position_idx on public.products (position);

alter table public.site enable row level security;
alter table public.products enable row level security;

grant select on public.site, public.products to anon, authenticated;
grant insert, update, delete on public.site, public.products to authenticated;

create policy "site: lectura publica" on public.site for select using (true);
create policy "site: alta admin" on public.site for insert to authenticated with check (public.is_admin());
create policy "site: edicion admin" on public.site for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "products: lectura de visibles" on public.products for select using (visible or public.is_admin());
create policy "products: alta admin" on public.products for insert to authenticated with check (public.is_admin());
create policy "products: edicion admin" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products: baja admin" on public.products for delete to authenticated using (public.is_admin());

-- Imágenes: bucket público de solo lectura; suben y borran únicamente los admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

create policy "media: subida admin" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "media: baja admin" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
-- Para poder borrar las imágenes sin uso, el panel necesita listarlas.
create policy "media: listado admin" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_admin());
