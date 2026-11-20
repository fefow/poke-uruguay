// Overworld sprites of the creatures that wander on the map (their own small pixel art, not the battle sprite).
// They face right; walking left mirrors them. Species without one fall back to the battle sprite at 24 px.
import { OVERWORLD_CREATURES } from './overworld-creatures-data.ts';

const frames = new Map<string, HTMLCanvasElement[]>();

function load() {
  if (typeof document === 'undefined') return;
  for (const [key, srcs] of Object.entries(OVERWORLD_CREATURES)) {
    const list: HTMLCanvasElement[] = [];
    srcs.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        c.getContext('2d')!.drawImage(img, 0, 0);
        list[i] = c;
        if (list.filter(Boolean).length === srcs.length) frames.set(key, list);
      };
      img.src = src;
    });
  }
}
load();

export function hasOverworldCreature(key: string) {
  return key in OVERWORLD_CREATURES;
}

/** The sprite to draw: frame 0 standing, the second frame alternates with it while the creature moves. Null until loaded. */
export function overworldCreature(key: string, moving: boolean, t: number): HTMLCanvasElement | null {
  const list = frames.get(key);
  if (!list) return null;
  if (!moving || list.length < 2) return list[0];
  return list[Math.floor(t / 180) % 2];
}
