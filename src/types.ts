// Shared data model of the game (what gets saved, what the battle engine moves around).

export type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
export type StatusId = 'brn' | 'psn' | 'par' | 'slp';
export type Dir = 'up' | 'down' | 'left' | 'right';

export interface MoveSlot { id: string; pp: number }

export interface Creature {
  uid: number | string;
  species: string;
  nickname: string | null;
  level: number;
  exp: number;
  ivs: number[];
  hp: number;
  status: StatusId | null;
  moves: MoveSlot[];
  ot: string | null;
}

export interface Battler {
  c: Creature;
  stages: Record<string, number>;
  sleep: number;
  [extra: string]: any;
}

export interface Pos { map: string; x: number; y: number; dir?: Dir }

export interface GameState {
  version: number;
  slot?: number;
  player: { name: string; look: string; id: number; money: number };
  rivalName: string;
  pos: Pos;
  party: Creature[];
  box: Creature[];
  bag: Record<string, number>;
  flags: Record<string, any>;
  dex: { seen: string[]; caught: string[] };
  stats: { playtime: number; steps: number; battlesWon: number; moneyEarned: number; moneySpent: number; caught: number };
  lastHeal: Pos;
  repel: number;
  daycare: any;
  criadero: { uid: string; steps: number }[];
  safari: any;
  contest?: any;
  created: number;
  saveCount: number;
  [extra: string]: any;
}

export interface TrainerDef {
  id: string; name: string; cls?: string; look?: string;
  team: [string, number][]; prize: number; intro?: string[]; lose?: string; after?: string | string[];
  items?: string[]; ai?: string;
  [extra: string]: any;
}

export interface NpcDef {
  x: number; y: number; look?: string | null; dir?: Dir; text?: string | string[];
  wander?: boolean; script?: string; trainer?: TrainerDef; id?: string; cond?: (flags: Record<string, any>) => boolean;
  [extra: string]: any;
}

export interface MapDef {
  id?: string; name: string; w?: number; h?: number; tiles: string[];
  npcs?: NpcDef[]; items?: { x: number; y: number; item: string; id: string }[];
  exits?: Record<string, any>; doors?: any[]; signs?: string[]; indoor?: boolean; theme?: string | null;
  [extra: string]: any;
}

export interface Species {
  id: number; key: string; name: string; types: string[]; base: number[]; catchRate?: number;
  learn: [number, string][]; evo?: { to: string; lvl?: number; stone?: string } | null; legendary?: boolean;
  art?: any; [extra: string]: any;
}
export interface Move {
  name: string; type: string; cat: string; power: number; acc: number; pp: number; desc: string; fx: Record<string, any>;
  [extra: string]: any;
}
export interface Item { name: string; pocket: string; price?: number; desc?: string; [extra: string]: any }
export interface TypeInfo { name: string; [extra: string]: any }
