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
