-- Online bug reports from the in-game panel (🐞 / F2).
-- The public anon key can only INSERT; reading needs your service_role key
-- (or the Supabase Studio table editor), so players can't read each other's reports.
-- Idempotent: safe to re-run.
create table if not exists public.bug_reports (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  client_id  text not null check (char_length(client_id) <= 64),
  build      text check (char_length(build) <= 64),
  level      text not null check (level in ('error', 'warn', 'note')),
  msg        text not null check (char_length(msg) <= 2000),
  detail     text check (char_length(detail) <= 4000),
  location   text check (char_length(location) <= 200),
  ctx        jsonb check (pg_column_size(ctx) <= 4000),
  user_agent text check (char_length(user_agent) <= 400)
);
create index if not exists bug_reports_created_at on public.bug_reports (created_at desc);

alter table public.bug_reports enable row level security;

drop policy if exists bug_reports_insert on public.bug_reports;
create policy bug_reports_insert on public.bug_reports
  for insert to anon, authenticated with check (true);

revoke all on public.bug_reports from anon, authenticated;
grant insert on public.bug_reports to anon, authenticated;
-- no select/update/delete grants: only service_role can read.

-- The anon key is public, so cap the write rate to keep the disk from being flooded:
-- at most 120 reports per minute for the whole table. Real players never get close.
create or replace function public.bug_reports_throttle() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from bug_reports where created_at > now() - interval '1 minute') >= 120 then
    raise exception 'too many reports';
  end if;
  return new;
end;
$$;
drop trigger if exists bug_reports_throttle on public.bug_reports;
create trigger bug_reports_throttle before insert on public.bug_reports
  for each row execute function public.bug_reports_throttle();
