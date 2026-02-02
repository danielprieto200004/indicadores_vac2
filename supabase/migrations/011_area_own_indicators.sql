-- Indicadores propios del área (no asociados a Retos Macro VAC)
-- Incluye seguimiento con semáforo, evidencias y observación.

-- 1) Tabla: indicadores propios
create table if not exists public.area_own_indicators (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas(id) on delete cascade,
  year int not null default extract(year from now())::int,
  ordinal int not null default 1,
  reto_area text not null,
  indicador_area text not null,
  meta_value numeric,
  meta_desc text,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint area_own_indicators_area_year_ordinal_key unique (area_id, year, ordinal)
);

create index if not exists idx_own_area_year on public.area_own_indicators(area_id, year);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'tr_own_indicators_updated_at') then
    create trigger tr_own_indicators_updated_at
      before update on public.area_own_indicators
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- 2) Tabla: avances de indicadores propios
create table if not exists public.area_own_updates (
  id uuid primary key default gen_random_uuid(),
  indicator_id uuid not null references public.area_own_indicators(id) on delete cascade,
  report_date date not null,
  percent numeric not null default 0 check (percent >= 0 and percent <= 100),
  current_value numeric,
  traffic_light public.traffic_light not null default 'verde',
  comment text not null,
  evidence_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_own_updates_indicator_created
  on public.area_own_updates(indicator_id, created_at desc);

-- 3) Vista: último avance por indicador propio
create or replace view public.vw_area_own_latest as
select distinct on (u.indicator_id)
  u.indicator_id,
  u.id as update_id,
  u.report_date,
  u.percent,
  u.current_value,
  u.traffic_light,
  u.comment,
  u.evidence_path,
  u.created_at
from public.area_own_updates u
order by u.indicator_id, u.created_at desc;

-- 4) Helper de seguridad: el usuario pertenece al indicador (por área) o es admin
create or replace function public.belongs_to_own_indicator(_indicator_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.area_own_indicators i
    join public.profile_areas pa on pa.area_id = i.area_id
    where i.id = _indicator_id
      and pa.profile_id = auth.uid()
  ) or public.is_admin();
$$;

-- 5) RLS + policies
alter table public.area_own_indicators enable row level security;
alter table public.area_own_updates enable row level security;

-- Indicadores: lectura por miembros del área o admin; escritura por miembros del área o admin
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='area_own_indicators' and policyname='own_indicators_select_area_member_or_admin') then
    create policy own_indicators_select_area_member_or_admin
      on public.area_own_indicators
      for select
      using (public.belongs_to_area(area_id));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='area_own_indicators' and policyname='own_indicators_insert_area_member_or_admin') then
    create policy own_indicators_insert_area_member_or_admin
      on public.area_own_indicators
      for insert
      with check (public.belongs_to_area(area_id));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='area_own_indicators' and policyname='own_indicators_update_area_member_or_admin') then
    create policy own_indicators_update_area_member_or_admin
      on public.area_own_indicators
      for update
      using (public.belongs_to_area(area_id))
      with check (public.belongs_to_area(area_id));
  end if;
end $$;

-- Avances: lectura/escritura por miembros del área (vía indicador) o admin
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='area_own_updates' and policyname='own_updates_select_member_or_admin') then
    create policy own_updates_select_member_or_admin
      on public.area_own_updates
      for select
      using (public.belongs_to_own_indicator(indicator_id));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='area_own_updates' and policyname='own_updates_insert_member_or_admin') then
    create policy own_updates_insert_member_or_admin
      on public.area_own_updates
      for insert
      with check (public.belongs_to_own_indicator(indicator_id));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='area_own_updates' and policyname='own_updates_update_member_or_admin') then
    create policy own_updates_update_member_or_admin
      on public.area_own_updates
      for update
      using (public.belongs_to_own_indicator(indicator_id))
      with check (public.belongs_to_own_indicator(indicator_id));
  end if;
end $$;

