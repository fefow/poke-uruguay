// Choose where saves live. Switch `backend` to 'supabase' and fill in your
// VPS details once the self-hosted Supabase is running (see README.md and docs/SECURITY.md).
export const SAVE_CONFIG = Object.freeze({
  backend: 'supabase' as 'local' | 'supabase',
  slots: 3,
  supabase: Object.freeze({
    url: 'https://pokeuy.duckdns.org',
    // Public by design: it only identifies the project. Access is enforced by RLS.
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzk1MTA3NzEwLCJleHAiOjE5NTI3ODc3MTB9.kdlIFenafJ3QCH4wYhwecNJzgDFgW3KfEga4094lSPw',
  }),
});

// Online bug reports: errors and notes are POSTed here automatically so you can
// read reports from every device in one place. Uses the same Supabase as saves.
// Only the public anon key is needed (the table is insert-only; see supabase/bug_reports.sql).
export const REPORT_CONFIG = Object.freeze({
  enabled: true,
  url: SAVE_CONFIG.supabase.url,
  anonKey: SAVE_CONFIG.supabase.anonKey,
});
