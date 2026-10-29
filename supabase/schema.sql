-- UruMon saves for a self-hosted Supabase (Postgres 15+).
-- Clients may READ and DELETE their own rows, but can only WRITE through
-- submit_save(), which re-checks the save before storing it. The browser's
-- HMAC signature is advisory here; the server decides.

create table if not exists public.saves (
  user_id   uuid        not null default auth.uid() references auth.users on delete cascade,
  slot      smallint    not null check (slot between 1 and 3),
  envelope  jsonb       not null,
  summary   jsonb       not null,
  build     text        not null,
  saved_at  timestamptz not null default now(),
  primary key (user_id, slot)
);

create table if not exists public.save_audit (
  id       bigserial primary key,
  user_id  uuid,
  slot     smallint,
  accepted boolean not null,
  reasons  text[]  not null default '{}',
  at       timestamptz not null default now()
);

alter table public.saves enable row level security;
alter table public.save_audit enable row level security;

drop policy if exists "saves: read own" on public.saves;
create policy "saves: read own" on public.saves for select using (auth.uid() = user_id);
drop policy if exists "saves: delete own" on public.saves;
create policy "saves: delete own" on public.saves for delete using (auth.uid() = user_id);
-- No insert/update policies on purpose: writes only via submit_save().
-- save_audit has no policies: only the service role can read it.

-- Accepted game builds (fingerprint printed by the game, see save/index.js).
create table if not exists public.game_builds (
  build  text primary key,
  active boolean not null default true
);

create or replace function public.submit_save(p_slot int, p_envelope jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid      uuid := auth.uid();
  d        jsonb := p_envelope -> 'data';
  prev     record;
  reasons  text[] := '{}';
  c        jsonb;
  m        jsonb;
  lvl      int;
  money    bigint;
  earned   numeric;
  spent    numeric;
  won      numeric;
begin
  if uid is null then raise exception 'auth required'; end if;
  if p_slot not between 1 and 3 then raise exception 'bad slot'; end if;
  if octet_length(p_envelope::text) > 1000000 then raise exception 'save too large'; end if;
  if p_envelope ->> 'format' <> 'urumon-save' or d is null then raise exception 'bad format'; end if;

  if not exists (select 1 from game_builds b where b.build = p_envelope ->> 'build' and b.active) then
    reasons := reasons || 'unknown or retired game build';
  end if;

  -- Money ledger (mirrors validate.js)
  money  := (d -> 'player' ->> 'money')::bigint;
  earned := (d -> 'stats' ->> 'moneyEarned')::numeric;
  spent  := (d -> 'stats' ->> 'moneySpent')::numeric;
  won    := (d -> 'stats' ->> 'battlesWon')::numeric;
  if money < 0 or money > 999999 then reasons := reasons || 'money out of range'; end if;
  if money > 3000 + earned - spent then reasons := reasons || 'money ledger mismatch'; end if;
  if earned > (won + 2) * 13000 then reasons := reasons || 'impossible earnings'; end if;

  -- Creatures: ranges only; full move/species legality runs in the edge function.
  if jsonb_array_length(coalesce(d -> 'party', '[]')) > 6 then reasons := reasons || 'party too big'; end if;
  for c in select * from jsonb_array_elements(coalesce(d -> 'party', '[]') || coalesce(d -> 'box', '[]')) loop
    lvl := (c ->> 'level')::int;
    if lvl is null or lvl < 1 or lvl > 100 then reasons := reasons || 'level out of range'; end if;
    if (c ->> 'exp')::bigint < (case when lvl <= 1 then 0 else lvl ^ 3 end)
       or (lvl < 100 and (c ->> 'exp')::bigint >= (lvl + 1) ^ 3) then
      reasons := reasons || 'exp does not match level';
    end if;
    if jsonb_array_length(c -> 'ivs') <> 6
       or exists (select 1 from jsonb_array_elements_text(c -> 'ivs') v where v::int not between 0 and 15) then
      reasons := reasons || 'bad IVs';
    end if;
    if jsonb_array_length(c -> 'moves') not between 1 and 4 then reasons := reasons || 'bad move count'; end if;
    for m in select * from jsonb_array_elements(c -> 'moves') loop
      if (m ->> 'pp')::int not between 0 and 40 then reasons := reasons || 'bad PP'; end if;
    end loop;
    if c ? 'atk' or c ? 'def' or c ? 'stats' then reasons := reasons || 'stored stats are not allowed'; end if;
  end loop;

  -- Progress can only move forward relative to the stored save.
  select * into prev from saves s where s.user_id = uid and s.slot = p_slot;
  if found then
    if (d -> 'stats' ->> 'playtime')::numeric + 5 < (prev.envelope -> 'data' -> 'stats' ->> 'playtime')::numeric then
      reasons := reasons || 'playtime went backwards';
    end if;
    -- Can't play more in-game time than real time passed (+ grace).
    if (d -> 'stats' ->> 'playtime')::numeric - (prev.envelope -> 'data' -> 'stats' ->> 'playtime')::numeric
       > extract(epoch from now() - prev.saved_at) + 120 then
      reasons := reasons || 'playtime faster than real time';
    end if;
    if (d -> 'stats' ->> 'battlesWon')::numeric < (prev.envelope -> 'data' -> 'stats' ->> 'battlesWon')::numeric then
      reasons := reasons || 'battle count went backwards';
    end if;
  end if;

  insert into save_audit (user_id, slot, accepted, reasons) values (uid, p_slot, cardinality(reasons) = 0, reasons);
  if cardinality(reasons) > 0 then
    raise exception 'save rejected: %', array_to_string(reasons, '; ');
  end if;

  insert into saves (user_id, slot, envelope, summary, build, saved_at)
  values (uid, p_slot, p_envelope, coalesce(p_envelope -> 'summary', '{}'), p_envelope ->> 'build', now())
  on conflict (user_id, slot) do update
    set envelope = excluded.envelope, summary = excluded.summary, build = excluded.build, saved_at = now();
end;
$$;

revoke all on function public.submit_save(int, jsonb) from public;
grant execute on function public.submit_save(int, jsonb) to authenticated;
