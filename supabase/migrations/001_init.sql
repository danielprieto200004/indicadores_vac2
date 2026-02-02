-- INDICADORES_VAC - Schema base + RLS + Views
-- Ejecutar en Supabase SQL editor (en este orden).
-- Nota: usa auth.users (schema auth) como fuente de usuarios.

-- -----------------------------
-- 1) Tipos (enums)
-- -----------------------------
do $$
begin
  create type public.area_type as enum ('direccion', 'escuela', 'decanatura');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.profile_role as enum ('pending', 'member', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.traffic_light as enum ('verde', 'amarillo', 'rojo');
exception when duplicate_object then null;
end $$;

-- -----------------------------
-- 2) Tablas
-- -----------------------------
create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.area_type not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role public.profile_role not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_areas (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  area_id uuid not null references public.areas(id) on delete restrict,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (profile_id, area_id)
);

create table if not exists public.macro_challenges (
  id uuid primary key default gen_random_uuid(),
  area_responsable_text text not null,
  reto text not null,
  indicador text not null,
  meta_anio_actual numeric,
  year int not null default extract(year from now())::int,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.area_contributions (
  id uuid primary key default gen_random_uuid(),
  macro_id uuid not null references public.macro_challenges(id) on delete cascade,
  area_id uuid not null references public.areas(id) on delete cascade,
  reto_area text not null,
  indicador_area text not null,
  meta_area numeric,
  year int not null default extract(year from now())::int,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (macro_id, area_id, year)
);

create table if not exists public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.area_contributions(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  percent numeric not null default 0 check (percent >= 0 and percent <= 100),
  current_value numeric,
  traffic_light public.traffic_light not null default 'verde',
  comment text,
  evidence_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- -----------------------------
-- 3) Índices útiles
-- -----------------------------
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profile_areas_area on public.profile_areas(area_id);
create index if not exists idx_macro_year on public.macro_challenges(year);
create index if not exists idx_contrib_area_year on public.area_contributions(area_id, year);
create index if not exists idx_updates_contrib_created on public.progress_updates(contribution_id, created_at desc);
create index if not exists idx_updates_period on public.progress_updates(period_start, period_end);

-- -----------------------------
-- 4) updated_at trigger (genérico)
-- -----------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'tr_profiles_updated_at'
  ) then
    create trigger tr_profiles_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'tr_macro_updated_at'
  ) then
    create trigger tr_macro_updated_at
    before update on public.macro_challenges
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'tr_contrib_updated_at'
  ) then
    create trigger tr_contrib_updated_at
    before update on public.area_contributions
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- -----------------------------
-- 5) Trigger: crear profile al registrarse
-- -----------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'pending'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
  end if;
end $$;

-- -----------------------------
-- 6) Helpers para RLS (admin / pertenencia)
-- -----------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('member','admin')
  );
$$;

create or replace function public.belongs_to_area(_area_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_areas pa
    where pa.profile_id = auth.uid()
      and pa.area_id = _area_id
  ) or public.is_admin();
$$;

create or replace function public.belongs_to_contribution(_contribution_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.area_contributions c
    join public.profile_areas pa on pa.area_id = c.area_id
    where c.id = _contribution_id
      and pa.profile_id = auth.uid()
  ) or public.is_admin();
$$;

-- -----------------------------
-- 7) RLS: habilitar + políticas
-- -----------------------------
alter table public.profiles enable row level security;
alter table public.areas enable row level security;
alter table public.profile_areas enable row level security;
alter table public.macro_challenges enable row level security;
alter table public.area_contributions enable row level security;
alter table public.progress_updates enable row level security;

-- PROFILES
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_own_or_admin') then
    create policy profiles_select_own_or_admin
      on public.profiles
      for select
      using (auth.uid() = id or public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_own_or_admin') then
    create policy profiles_update_own_or_admin
      on public.profiles
      for update
      using (auth.uid() = id or public.is_admin())
      with check (auth.uid() = id or public.is_admin());
  end if;
end $$;

-- AREAS
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='areas' and policyname='areas_select_member_or_admin') then
    create policy areas_select_member_or_admin
      on public.areas
      for select
      using (public.is_member());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='areas' and policyname='areas_admin_write') then
    create policy areas_admin_write
      on public.areas
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- PROFILE_AREAS (asignación por admin; lectura por miembro de sus áreas)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_areas' and policyname='profile_areas_select_own_or_admin') then
    create policy profile_areas_select_own_or_admin
      on public.profile_areas
      for select
      using (public.is_admin() or auth.uid() = profile_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_areas' and policyname='profile_areas_admin_write') then
    create policy profile_areas_admin_write
      on public.profile_areas
      for insert
      with check (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_areas' and policyname='profile_areas_admin_update') then
    create policy profile_areas_admin_update
      on public.profile_areas
      for update
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_areas' and policyname='profile_areas_admin_delete') then
    create policy profile_areas_admin_delete
      on public.profile_areas
      for delete
      using (public.is_admin());
  end if;
end $$;

-- MACRO_CHALLENGES
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='macro_challenges' and policyname='macro_select_member_or_admin') then
    create policy macro_select_member_or_admin
      on public.macro_challenges
      for select
      using (public.is_member());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='macro_challenges' and policyname='macro_admin_write') then
    create policy macro_admin_write
      on public.macro_challenges
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- AREA_CONTRIBUTIONS
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='area_contributions' and policyname='contrib_select_member_or_admin') then
    create policy contrib_select_member_or_admin
      on public.area_contributions
      for select
      using (public.is_admin() or public.belongs_to_area(area_id));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='area_contributions' and policyname='contrib_admin_write') then
    create policy contrib_admin_write
      on public.area_contributions
      for insert
      with check (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='area_contributions' and policyname='contrib_admin_update') then
    create policy contrib_admin_update
      on public.area_contributions
      for update
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='area_contributions' and policyname='contrib_admin_delete') then
    create policy contrib_admin_delete
      on public.area_contributions
      for delete
      using (public.is_admin());
  end if;
end $$;

-- PROGRESS_UPDATES
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='progress_updates' and policyname='updates_select_member_or_admin') then
    create policy updates_select_member_or_admin
      on public.progress_updates
      for select
      using (public.belongs_to_contribution(contribution_id));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='progress_updates' and policyname='updates_insert_member_or_admin') then
    create policy updates_insert_member_or_admin
      on public.progress_updates
      for insert
      with check (public.belongs_to_contribution(contribution_id));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='progress_updates' and policyname='updates_update_member_or_admin') then
    create policy updates_update_member_or_admin
      on public.progress_updates
      for update
      using (public.belongs_to_contribution(contribution_id))
      with check (public.belongs_to_contribution(contribution_id));
  end if;
end $$;

-- -----------------------------
-- 8) Vistas
-- -----------------------------
create or replace view public.vw_contribution_latest as
select distinct on (u.contribution_id)
  u.contribution_id,
  u.id as update_id,
  u.period_start,
  u.period_end,
  u.percent,
  u.current_value,
  u.traffic_light,
  u.comment,
  u.evidence_path,
  u.created_at
from public.progress_updates u
order by u.contribution_id, u.created_at desc;

create or replace view public.vw_macro_rollup as
select
  m.id as macro_id,
  m.year,
  m.reto,
  m.indicador,
  m.meta_anio_actual,
  count(c.id) filter (where c.active) as contributions_count,
  avg(l.percent) filter (where c.active) as macro_percent_avg,
  count(l.contribution_id) filter (where c.active and l.contribution_id is not null) as contributions_with_updates
from public.macro_challenges m
left join public.area_contributions c on c.macro_id = m.id and c.year = m.year
left join public.vw_contribution_latest l on l.contribution_id = c.id
group by m.id, m.year, m.reto, m.indicador, m.meta_anio_actual;

