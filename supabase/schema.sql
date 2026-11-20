-- UruMon saves for a self-hosted Supabase (Postgres 15+).
-- Clients may READ and DELETE their own rows, but can only WRITE through
-- submit_save(), which re-checks the save before storing it. The browser's
-- HMAC signature is advisory here; the server decides.
--
-- Idempotent: safe to re-run after every change.

create table if not exists public.saves (
  user_id   uuid        not null default auth.uid() references auth.users on delete cascade,
  slot      smallint    not null check (slot between 1 and 10),
  envelope  jsonb       not null,
  summary   jsonb       not null,
  build     text        not null,
  saved_at  timestamptz not null default now(),
  primary key (user_id, slot)
);

-- 10 slots per account (was 3). Tables created before this change keep the old
-- check until it is replaced here.
alter table public.saves drop constraint if exists saves_slot_check;
alter table public.saves add constraint saves_slot_check check (slot between 1 and 10);

create table if not exists public.save_audit (
  id       bigserial primary key,
  user_id  uuid,
  slot     smallint,
  accepted boolean not null,
  reasons  text[]  not null default '{}',
  at       timestamptz not null default now()
);
create index if not exists save_audit_user_at on public.save_audit (user_id, at desc);

-- Accepted game builds (fingerprint printed by the game, see save/index.ts).
create table if not exists public.game_builds (
  build  text primary key,
  active boolean not null default true
);

alter table public.saves       enable row level security;
alter table public.save_audit  enable row level security;
alter table public.game_builds enable row level security;

drop policy if exists "saves: read own" on public.saves;
create policy "saves: read own" on public.saves for select to authenticated using (auth.uid() = user_id);
drop policy if exists "saves: delete own" on public.saves;
create policy "saves: delete own" on public.saves for delete to authenticated using (auth.uid() = user_id);
-- No insert/update policies on purpose: writes only via submit_save().
-- save_audit and game_builds have no policies: only the service role can use them.

-- Belt and braces: RLS already blocks these, but Supabase grants everything to
-- anon/authenticated by default, so take it away explicitly.
revoke all on public.saves, public.save_audit, public.game_builds from anon, authenticated;
grant select, delete on public.saves to authenticated;

-- Returns {"ok": true} or {"ok": false, "reasons": [...]}. Rule violations are
-- RETURNED (not raised) so the audit row survives: a raise would roll it back.
-- Only auth / protocol errors raise.
create or replace function public.submit_save(p_slot int, p_envelope jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid      uuid := auth.uid();
  d        jsonb;
  prev     record;
  reasons  text[] := '{}';
  c        jsonb;
  m        jsonb;
  lvl      int;
  money    bigint;
  earned   numeric;
  spent    numeric;
  won      numeric;
  ptime    numeric;
begin
  if uid is null then raise exception 'auth required'; end if;
  if p_slot is null or p_slot not between 1 and 10 then raise exception 'bad slot'; end if;
  if p_envelope is null or jsonb_typeof(p_envelope) <> 'object' then raise exception 'bad format'; end if;
  if octet_length(p_envelope::text) > 1000000 then raise exception 'save too large'; end if;
  if p_envelope ->> 'format' is distinct from 'urumon-save' then raise exception 'bad format'; end if;
  d := p_envelope -> 'data';
  if d is null or jsonb_typeof(d) <> 'object' then raise exception 'bad format'; end if;

  -- Cheap throttle: at most one write per slot every 2 seconds.
  if exists (select 1 from saves s where s.user_id = uid and s.slot = p_slot and s.saved_at > now() - interval '2 seconds') then
    raise exception 'too many saves';
  end if;

  begin
    if not exists (select 1 from game_builds b where b.build = p_envelope ->> 'build' and b.active) then
      reasons := array_append(reasons, 'unknown or retired game build');
    end if;

    -- Money ledger (mirrors validate.ts)
    money  := (d -> 'player' ->> 'money')::bigint;
    earned := (d -> 'stats' ->> 'moneyEarned')::numeric;
    spent  := (d -> 'stats' ->> 'moneySpent')::numeric;
    won    := (d -> 'stats' ->> 'battlesWon')::numeric;
    ptime  := (d -> 'stats' ->> 'playtime')::numeric;
    if money is null or earned is null or spent is null or won is null or ptime is null then
      reasons := array_append(reasons, 'missing fields');
    else
      if money < 0 or money > 999999 then reasons := array_append(reasons, 'money out of range'); end if;
      if money > 3000 + earned - spent then reasons := array_append(reasons, 'money ledger mismatch'); end if;
      if earned > (won + 2) * 13000 then reasons := array_append(reasons, 'impossible earnings'); end if;
    end if;

    -- Creatures: ranges only; full move/species legality is checked by the client
    -- validator and, ideally, by an edge function replaying the same code.
    if jsonb_array_length(coalesce(d -> 'party', '[]')) > 6 then reasons := array_append(reasons, 'party too big'); end if;
    for c in select * from jsonb_array_elements(coalesce(d -> 'party', '[]') || coalesce(d -> 'box', '[]')) loop
      lvl := (c ->> 'level')::int;
      if lvl is null or lvl < 1 or lvl > 100 then
        reasons := array_append(reasons, 'level out of range');
        continue;
      end if;
      if (c ->> 'exp')::bigint < (case when lvl <= 1 then 0 else lvl ^ 3 end)
         or (lvl < 100 and (c ->> 'exp')::bigint >= (lvl + 1) ^ 3) then
        reasons := array_append(reasons, 'exp does not match level');
      end if;
      if jsonb_array_length(c -> 'ivs') <> 6
         or exists (select 1 from jsonb_array_elements_text(c -> 'ivs') v where v::int not between 0 and 15) then
        reasons := array_append(reasons, 'bad IVs');
      end if;
      if jsonb_array_length(c -> 'moves') not between 1 and 4 then reasons := array_append(reasons, 'bad move count'); end if;
      for m in select * from jsonb_array_elements(c -> 'moves') loop
        if (m ->> 'pp')::int not between 0 and 40 then reasons := array_append(reasons, 'bad PP'); end if;
      end loop;
      if c ? 'atk' or c ? 'def' or c ? 'stats' then reasons := array_append(reasons, 'stored stats are not allowed'); end if;
    end loop;

    -- Progress can only move forward relative to the stored save.
    select * into prev from saves s where s.user_id = uid and s.slot = p_slot;
    if found and ptime is not null then
      if ptime + 5 < (prev.envelope -> 'data' -> 'stats' ->> 'playtime')::numeric then
        reasons := array_append(reasons, 'playtime went backwards');
      end if;
      -- Can't play more in-game time than real time passed (+ grace).
      if ptime - (prev.envelope -> 'data' -> 'stats' ->> 'playtime')::numeric
         > extract(epoch from now() - prev.saved_at) + 120 then
        reasons := array_append(reasons, 'playtime faster than real time');
      end if;
      if won < (prev.envelope -> 'data' -> 'stats' ->> 'battlesWon')::numeric then
        reasons := array_append(reasons, 'battle count went backwards');
      end if;
    end if;
  exception when others then
    -- Wrong types / shapes (e.g. a string where a number belongs): reject, don't 500.
    reasons := array_append(reasons, 'malformed save');
  end;

  if cardinality(reasons) > 0 then
    -- Only rejections are audited: accepted autosaves would bloat the table.
    insert into save_audit (user_id, slot, accepted, reasons) values (uid, p_slot, false, reasons);
    return jsonb_build_object('ok', false, 'reasons', to_jsonb(reasons));
  end if;

  insert into saves (user_id, slot, envelope, summary, build, saved_at)
  values (uid, p_slot, p_envelope, coalesce(p_envelope -> 'summary', '{}'), p_envelope ->> 'build', now())
  on conflict (user_id, slot) do update
    set envelope = excluded.envelope, summary = excluded.summary, build = excluded.build, saved_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.submit_save(int, jsonb) from public, anon;
grant execute on function public.submit_save(int, jsonb) to authenticated;
