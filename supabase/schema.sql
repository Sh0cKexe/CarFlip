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
  vytvoreno timestamptz not null default now()
);

create table if not exists public.videno (
  user_id uuid not null references auth.users (id) on delete cascade,
  ad_id text not null,
  kdy timestamptz not null default now(),
  primary key (user_id, ad_id)
);

alter table public.nastaveni enable row level security;
alter table public.videno enable row level security;

-- Uzivatel (anon klic + auth) vidi a upravuje JEN svuj radek.
create policy "nastaveni_select_own" on public.nastaveni
  for select using (auth.uid() = user_id);
create policy "nastaveni_update_own" on public.nastaveni
  for update using (auth.uid() = user_id);
create policy "nastaveni_insert_own" on public.nastaveni
  for insert with check (auth.uid() = user_id);

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
