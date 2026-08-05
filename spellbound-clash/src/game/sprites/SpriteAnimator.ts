import type { Dir } from '../constants';
import { HERO_SHEET_CONFIG, HERO_LAYOUT, type CharLayout } from './heroSprites';
import { ENEMY_SHEET_CONFIG, ENEMY_LAYOUT } from './enemySprites';
import { getSheet, sheetFrameHasContent, PROC_SHEET } from './SpriteSheet';

export interface FrameRef {
  sheet: string;
  col: number;
  row: number;
}

export type AnimName = 'idle' | 'walk';

const LAYOUTS: Record<'hero' | 'enemy', CharLayout> = {
  hero: HERO_LAYOUT,
  enemy: ENEMY_LAYOUT,
};

const SHEET_CONFIGS = {
  hero: HERO_SHEET_CONFIG,
  enemy: ENEMY_SHEET_CONFIG,
};

export function isLayoutValid(char: 'hero' | 'enemy'): boolean {
  const layout = LAYOUTS[char];
  const cfg = SHEET_CONFIGS[char];
  if (!cfg || !cfg.enabled) return false;
  const sheet = getSheet(layout.sheet);
  if (!sheet || !sheet.ready || !sheet.image) return false;
  const maxRow = Math.floor(sheet.image.naturalHeight / sheet.frameH) - 1;
  for (let d = 0; d < 3; d++) {
    const rr = layout.row + d;
    if (rr > maxRow) continue;
    if (!sheetFrameHasContent(sheet, layout.col, rr)) return false;
  }
  return true;
}

const resolvedCache = new Map<'hero' | 'enemy', string>();

function resolveSheet(char: 'hero' | 'enemy'): string {
  const cached = resolvedCache.get(char);
  if (cached !== undefined) return cached;
  if (isLayoutValid(char)) {
    const sheet = LAYOUTS[char].sheet;
    resolvedCache.set(char, sheet);
    return sheet;
  }
  return PROC_SHEET;
}

const GEN_WALK = { down: 40, up: 41, side: 39, frames: 6, sideFrames: 6 } as const;
const GEN_ATTACK = { down: 51, frames: 6 } as const;

function heroRow(dir: Dir): number {
  if (dir === 'up') return GEN_WALK.up;
  if (dir === 'down') return GEN_WALK.down;
  return GEN_WALK.side;
}

export const SPRITE_MAP = {
  hero: {
    walk: (dir: Dir, frame: number): FrameRef => {
      const side = dir === 'left' || dir === 'right';
      return {
        sheet: resolveSheet('hero'),
        col: side ? frame % GEN_WALK.sideFrames : frame % GEN_WALK.frames,
        row: heroRow(dir),
      };
    },
    idle: (dir: Dir): FrameRef => {
      return {
        sheet: resolveSheet('hero'),
        col: 0,
        row: heroRow(dir),
      };
    },
    attack: (_dir: Dir, frame: number): FrameRef => {
      return {
        sheet: resolveSheet('hero'),
        col: frame % GEN_ATTACK.frames,
        row: GEN_ATTACK.down,
      };
    },
  },
  enemy: {
    idle: (): FrameRef => {
      return {
        sheet: resolveSheet('enemy'),
        col: 0,
        row: GEN_WALK.down,
      };
    },
    walk: (frame: number): FrameRef => {
      return {
        sheet: resolveSheet('enemy'),
        col: frame % GEN_WALK.frames,
        row: GEN_WALK.down,
      };
    },
    attack: (frame: number): FrameRef => {
      return {
        sheet: resolveSheet('enemy'),
        col: frame % GEN_ATTACK.frames,
        row: GEN_ATTACK.down,
      };
    },
  },
};
