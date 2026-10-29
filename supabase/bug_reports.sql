-- Online bug reports from the in-game panel (🐞 / F2).
-- The public anon key can only INSERT; reading needs your service_role key
-- (or the Supabase Studio table editor), so players can't read each other's reports.
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

alter table public.bug_reports enable row level security;

drop policy if exists bug_reports_insert on public.bug_reports;
create policy bug_reports_insert on public.bug_reports
  for insert to anon, authenticated with check (true);

revoke all on public.bug_reports from anon, authenticated;
grant insert on public.bug_reports to anon, authenticated;
-- no select/update/delete grants: only service_role can read.
