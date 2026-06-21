-- CarFlip cloud multi-tenant schema.
-- Spustit jednou v Supabase projektu: SQL Editor -> New query -> vlozit cely tento soubor -> Run.

create table if not exists public.nastaveni (
  user_id uuid primary key references auth.users (id) on delete cascade,
  telegram_token text not null default '',
  telegram_chat_id text not null default '',
  dalsi_prijemci jsonb not null default '[]'::jsonb,
  filtry jsonb not null default '{
    "znacky": [],
    "palivo": "vse",
    "prevodovka": "vse",
    "oblasti": [],
    "min_rok": 2003,
    "max_najezd_nafta": 250000,
    "max_najezd_benzin": 200000,
    "max_cena_pln": 12501,
    "min_cena_pln": 0
  }'::jsonb,
  min_zisk_kc integer not null default 20000,
  naklady_dovoz_kc integer not null default 10000,
  min_srovnani integer not null default 3,
  aktivni boolean not null default true,
  vytvoreno timestamptz not null default now(),
  trh text not null default 'cz'
);

-- Pro existujici instalace (puvodni create table uz probehl bez "trh"):
alter table public.nastaveni add column if not exists trh text not null default 'cz';

create table if not exists public.videno (
  user_id uuid not null references auth.users (id) on delete cascade,
  ad_id text not null,
  kdy timestamptz not null default now(),
  primary key (user_id, ad_id)
);

alter table public.nastaveni enable row level security;
alter table public.videno enable row level security;

-- Uzivatel (anon klic + auth) vidi a upravuje JEN svuj radek.
drop policy if exists "nastaveni_select_own" on public.nastaveni;
create policy "nastaveni_select_own" on public.nastaveni
  for select using (auth.uid() = user_id);
drop policy if exists "nastaveni_update_own" on public.nastaveni;
create policy "nastaveni_update_own" on public.nastaveni
  for update using (auth.uid() = user_id);
drop policy if exists "nastaveni_insert_own" on public.nastaveni;
create policy "nastaveni_insert_own" on public.nastaveni
  for insert with check (auth.uid() = user_id);

drop policy if exists "videno_select_own" on public.videno;
create policy "videno_select_own" on public.videno
  for select using (auth.uid() = user_id);

-- Cloud bot pouziva service key, ktery RLS obchazi (Bypass RLS) -> nepotrebuje vlastni policy.

-- Pri registraci noveho uzivatele automaticky vytvor radek v nastaveni se vychozimi hodnotami.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.nastaveni (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- Ucetni modul: auta na flipu, naklady k nim, fotky (Storage).
-- Spustit znovu cely tento soubor v SQL editoru - prikazy jsou idempotentni.
-- ---------------------------------------------------------------------

create table if not exists public.auta (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulek text not null default '',
  otomoto_url text not null default '',
  stav text not null default 'koupeno',
  cena_koupeno_kc integer,
  cena_prodano_kc integer,
  poznamky text not null default '',
  fotky jsonb not null default '[]'::jsonb,
  vytvoreno timestamptz not null default now(),
  datum_koupeno date,
  datum_prodano date
);

-- Pro existujici instalace (puvodni create table uz probehl bez datumu):
alter table public.auta add column if not exists datum_koupeno date;
alter table public.auta add column if not exists datum_prodano date;

create table if not exists public.naklady (
  id uuid primary key default gen_random_uuid(),
  auto_id uuid not null references public.auta (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  popis text not null default '',
  castka_kc integer not null default 0,
  datum date not null default current_date
);

alter table public.auta enable row level security;
alter table public.naklady enable row level security;

drop policy if exists "auta_select_own" on public.auta;
create policy "auta_select_own" on public.auta
  for select using (auth.uid() = user_id);
drop policy if exists "auta_insert_own" on public.auta;
create policy "auta_insert_own" on public.auta
  for insert with check (auth.uid() = user_id);
drop policy if exists "auta_update_own" on public.auta;
create policy "auta_update_own" on public.auta
  for update using (auth.uid() = user_id);
drop policy if exists "auta_delete_own" on public.auta;
create policy "auta_delete_own" on public.auta
  for delete using (auth.uid() = user_id);

drop policy if exists "naklady_select_own" on public.naklady;
create policy "naklady_select_own" on public.naklady
  for select using (auth.uid() = user_id);
drop policy if exists "naklady_insert_own" on public.naklady;
create policy "naklady_insert_own" on public.naklady
  for insert with check (auth.uid() = user_id);
drop policy if exists "naklady_update_own" on public.naklady;
create policy "naklady_update_own" on public.naklady
  for update using (auth.uid() = user_id);
drop policy if exists "naklady_delete_own" on public.naklady;
create policy "naklady_delete_own" on public.naklady
  for delete using (auth.uid() = user_id);

-- Storage bucket pro fotky aut (privatni - pristup jen pres podepsane URL/RLS).
insert into storage.buckets (id, name, public)
values ('auta-fotky', 'auta-fotky', false)
on conflict (id) do nothing;

drop policy if exists "auta_fotky_select_own" on storage.objects;
create policy "auta_fotky_select_own" on storage.objects
  for select using (
    bucket_id = 'auta-fotky'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "auta_fotky_insert_own" on storage.objects;
create policy "auta_fotky_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'auta-fotky'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "auta_fotky_delete_own" on storage.objects;
create policy "auta_fotky_delete_own" on storage.objects
  for delete using (
    bucket_id = 'auta-fotky'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- AI rozbor inzeratu: historie predchozich rozboru (samostatna stranka,
-- neni vazana na konkretni auto v "auta").
-- ---------------------------------------------------------------------

create table if not exists public.ai_rozbory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null default '',
  vysledek text not null default '',
  vytvoreno timestamptz not null default now()
);

alter table public.ai_rozbory enable row level security;

drop policy if exists "ai_rozbory_select_own" on public.ai_rozbory;
create policy "ai_rozbory_select_own" on public.ai_rozbory
  for select using (auth.uid() = user_id);
drop policy if exists "ai_rozbory_insert_own" on public.ai_rozbory;
create policy "ai_rozbory_insert_own" on public.ai_rozbory
  for insert with check (auth.uid() = user_id);
drop policy if exists "ai_rozbory_delete_own" on public.ai_rozbory;
create policy "ai_rozbory_delete_own" on public.ai_rozbory
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Invite kody a prodluzitelny pristup (paywall gate).
-- invite_kody: zadne RLS policy -> nedostupne z webu (anon/auth klic),
-- jen service key (registracni route) a ty v Supabase Table Editoru.
-- pristup: jen "select vlastniho radku" policy - zapis/prodlouzeni jen
-- service key nebo ty v Table Editoru, NIKDY z webu (aby si uzivatel
-- nemohl sam prodlouzit pristup pres browser konzoli).
-- ---------------------------------------------------------------------

create table if not exists public.invite_kody (
  kod text primary key,
  dny_platnosti integer not null default 30,
  pouzil_user_id uuid references auth.users (id) on delete set null,
  pouzito_kdy timestamptz,
  vytvoreno timestamptz not null default now()
);

alter table public.invite_kody enable row level security;
-- Zamerne zadna policy - tabulka je nedostupna z webu, jen service key.

create table if not exists public.pristup (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  pristup_do timestamptz not null,
  vytvoreno timestamptz not null default now()
);

-- Pro existujici instalace (puvodni create table uz probehl bez emailu):
alter table public.pristup add column if not exists email text not null default '';

alter table public.pristup enable row level security;

drop policy if exists "pristup_select_own" on public.pristup;
create policy "pristup_select_own" on public.pristup
  for select using (auth.uid() = user_id);
