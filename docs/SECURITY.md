# Security and anti-cheat

UruMon runs entirely in the browser today, so the honest starting point is this: **anything that lives on the player's device can be changed by the player.** A determined person with DevTools, a debugger or a patched copy of the game can always cheat in their own local game. What the game does is make cheating hard, make tampered saves fail to load, and set up the server phase so the server, not the browser, decides what is true.

## What is protected now (localStorage phase)

| Threat | What happens |
| --- | --- |
| Editing the save in DevTools → Application → Local Storage (level, money, items, attack…) | The save is signed with HMAC-SHA256 over canonical JSON. Any edit breaks the signature and the game refuses to load it ("fue modificada fuera del juego"). |
| Re-signing an edited save | Every loaded save also goes through `src/save/validate.js`, which rejects anything the game could never produce, signed or not. |
| Changing attack, defense or damage numbers in the save | Stats are **never stored**. They are recomputed from the frozen species table + level + IVs on every use. Extra fields like `atk` are dropped on load. |
| Impossible creatures | Level must match EXP exactly; IVs 0–15; HP ≤ max; level ≥ evolution level; every move must be legal for that species at that level (including pre-evolutions); PP ≤ max; no duplicate creatures; at most one starter line and it must match the one you picked; legendaries only after becoming Champion, one each. |
| Money / item edits | Money must fit the ledger: `money ≤ 3000 + earned − spent`, and earnings are capped by battles won. Item counts 1–99, key items 0–1, unobtainable items rejected. |
| Story skipping | Only known flags are accepted; badges must be in order; "Champion" requires all badges, the villain defeated and the final rival beaten. |
| Changing damage/defense tables at runtime from the console | Game data (`SPECIES`, `MOVES`, `ITEMS`, type chart) is deep-frozen; writes throw or do nothing. Game modules are bundled and nothing is exposed on `window`. |
| Patched copies of the game | Each save records a **build fingerprint** (SHA-256 of the rules tables). The server will only accept builds it knows. |
| Script injection via names | Player and nickname text is sanitized (letters, digits, spaces, max 10) and always rendered with `textContent`, never `innerHTML`. The standalone `index.html` ships a strict Content-Security-Policy. |
| Plain-HTTP hosting (no `crypto.subtle`) | A pure-JS SHA-256/HMAC fallback keeps signing working on an HTTP-only VPS. |

### Known limits (by design, client-side)

- The signing key is on the device. Someone who reads the bundled code can re-sign a save. Validation still blocks impossible data, but "possible but undeserved" data (e.g. a legal level-40 creature you didn't train) can't be detected on the client.
- In-memory edits during a session (breakpoints in battle code) can't be prevented in the browser. They only matter if the result reaches a server that trusts it.

## What changes with Supabase (server phase)

The save layer is already behind an interface (`src/save/provider.js`). Switching `backend` to `'supabase'` in `src/save/config.js` routes saves to your VPS. The server side is in `supabase/schema.sql`:

1. **Writes only through `submit_save()`**. Row Level Security lets players read and delete their own saves, but there is no insert/update policy, so the only write path is the database function.
2. **Server-side rule checks**: money ledger, level/EXP consistency, IV and PP ranges, stored stats forbidden, party size, accepted build fingerprints.
3. **Progress can only move forward**: play time can't go backwards or run faster than real time between saves; battle count can't decrease.
4. **Audit log** of every accepted and rejected save (`save_audit`, service-role only), so you can spot cheaters instead of silently trusting them.

### Recommended next step: server-authoritative battles

Battles already run on a seeded RNG and every player action is recorded. The last 20 trainer battles are kept in the save as `{ id, seed, actions }`. Because the battle engine (`src/game/battle-engine.js`) is pure JavaScript with no DOM, a Supabase **Edge Function** (Deno) can import the very same module, replay each battle from seed + actions, and reject any save whose results (prize money, EXP, outcome) don't match. Running `validateSave()` from `src/save/validate.js` in that function also gives the server the full species/move legality checks. That turns the server into the source of truth for scores, damage and progress.

## Reporting

If you find a way to load an impossible save, add the case to `tests/unit.test.mjs` ("validation rejects…") and extend `validate.js` and `schema.sql` together so client and server stay in sync.
