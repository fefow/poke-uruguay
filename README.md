# Poke Uruguay: La Leyenda del Pampero

A single-player, 2D creature-collecting RPG set in Uruguay. Explore from Colonia del Sacramento to the Quebrada de los Cuervos, catch 42 original creatures inspired by Uruguayan wildlife (carpincho, ñandú, hornero, tero, yacaré, lobo marino…), beat three gyms, stop Equipo Niebla, and become Champion at the Estadio Centenario. After the credits the game keeps going, with legendary creatures to find and a Champion rematch.

No Nintendo names or assets are used. All art is generated in code (canvas pixel art), all music is chiptune synthesized with Web Audio.

## Play

```bash
npm install        # only needed for the production build
npm run dev        # serves the folder at http://localhost:8080
```

Open `http://localhost:8080`. No build step is needed in development: the game is plain ES modules.

**Controls:** arrows / WASD move · hold Space to walk 1.5x faster · Z or Enter = A · X or Shift = B (hold to run) · Esc or M = menu. Gamepads work, and phones get on-screen touch controls.

## Build and deploy to a VPS

```bash
npm run build      # -> dist/ (static site) and dist/urumon.html (single file)
npm test           # unit tests + map checks
```

Copy `dist/` to any static host (nginx, Caddy…). Serve it over HTTPS so the offline service worker and Web Crypto work; it still runs on plain HTTP.

## What's inside

| Area | Where |
| --- | --- |
| Boot, loader, game loop | `src/main.js` |
| World maps, NPCs, trainers, story scripts | `src/data/maps.js`, `src/data/story.js` |
| Creatures, moves, items, type chart | `src/data/*.js` (deep-frozen at runtime) |
| Overworld engine (movement, warps, encounters, trainer sight) | `src/game/world.js` |
| Battle rules (pure, seeded, replayable) | `src/game/battle-engine.js` |
| Battle presentation | `src/game/battle-scene.js` |
| Menus: team, bag, UruDex, card, options, save, shop, PC | `src/game/menus.js` |
| Title, intro, hall of fame, credits | `src/game/scenes.js` |
| Pixel art generators | `src/gfx/` |
| Save system | `src/save/` (provider interface, signing, validation) |
| Supabase schema for the VPS phase | `supabase/schema.sql` |
| Security notes | `docs/SECURITY.md` |

### Content

- 8 regions: Colonia, Ruta 1, Montevideo (Rambla, Palacio Salvo, Estadio Centenario), Ruta Interbalnearia, Punta del Este (La Mano), Cabo Polonio, Ruta 8, Treinta y Tres / Quebrada de los Cuervos. 17 interiors.
- 42 creatures across 13 types, 3 starters (Ceibito, Tejuchispa, Carpinchito), evolutions, 60+ moves (Danza Candombe, Mate Amargo, Garra Charrúa, Rayo Pampero…).
- Items with local flavor: Té de Marcela, Mate, Dulce de Leche, Chivito, Alfajor, Torta Frita, Garrapiñada.
- Story: rival Facu, Profesora Arazá, three gym leaders, Equipo Niebla (Bruma, Brumario), Champion Obdulio, hall of fame, credits, post-game legendaries (Pamperón, Ballenaplata, Soldemayo).

### Modern web features used

ES modules, private class fields, HMAC save signing with Web Crypto (plus a pure-JS fallback), View Transitions, CSS nesting, `@property` animated HP bars, `oklch()` colors, container query units for a UI that scales with the screen, `@starting-style` entry animations, `dvh` units and safe-area insets, Gamepad API, Pointer Events touch controls with haptics, PWA manifest + service worker, Web Audio synthesis, and a real-clock day/night tint.

## Saves: localStorage now, Supabase later

Saves go through one interface (`list / load / save / remove`). `LocalStorageProvider` is active today. To move to your self-hosted Supabase:

1. Run `supabase/schema.sql` in your database and insert the game's build fingerprint into `game_builds` (shown by `getBuildHash()` in `src/save/index.js`).
2. Set `backend: 'supabase'` and your URL / anon key in `src/save/config.js`, and pass a `getAccessToken` that returns the signed-in user's JWT.
3. Add your Supabase origin to `connect-src` in the Content-Security-Policy in `index.html`.

See `docs/SECURITY.md` for what is protected today and the plan for server-authoritative validation.
