// Choose where saves live. Switch `backend` to 'supabase' and fill in your
// VPS details once the self-hosted Supabase is running (see README.md and docs/SECURITY.md).
export const SAVE_CONFIG = Object.freeze({
  backend: 'local', // 'local' | 'supabase'
  slots: 3,
  supabase: Object.freeze({
    url: 'https://your-vps.example.com',
    anonKey: 'public-anon-key',
  }),
});

// Online bug reports: errors and notes are POSTed here automatically so you can
// read reports from every device in one place. Uses the same Supabase as saves.
// Only the public anon key is needed (the table is insert-only; see supabase/bug_reports.sql).
export const REPORT_CONFIG = Object.freeze({
  enabled: false, // set to true after running supabase/bug_reports.sql
  url: SAVE_CONFIG.supabase.url,
  anonKey: SAVE_CONFIG.supabase.anonKey,
});
