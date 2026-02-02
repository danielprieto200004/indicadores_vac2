-- Agrega el tipo de indicador del macro: porcentaje vs numérico
-- Usado para orientar la captura y lectura del indicador.

alter table public.macro_challenges
  add column if not exists indicator_kind text;

-- Backfill
update public.macro_challenges
set indicator_kind = 'numerico'
where indicator_kind is null;

-- Default + NOT NULL
alter table public.macro_challenges
  alter column indicator_kind set default 'numerico';

do $$
begin
  -- set NOT NULL sólo si aún permite nulls
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'macro_challenges'
      and column_name = 'indicator_kind'
      and is_nullable = 'YES'
  ) then
    alter table public.macro_challenges
      alter column indicator_kind set not null;
  end if;
end $$;

-- Constraint (idempotente)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'macro_indicator_kind_check'
  ) then
    alter table public.macro_challenges
      add constraint macro_indicator_kind_check
      check (indicator_kind in ('numerico', 'porcentaje'));
  end if;
end $$;

