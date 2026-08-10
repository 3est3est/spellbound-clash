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
  if (cfg.singleFrame) return true;
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

const isSingleFrame = (char: 'hero' | 'enemy'): boolean =>
  !!SHEET_CONFIGS[char]?.singleFrame;

const walkCol = (char: 'hero' | 'enemy', frame: number): number => {
  const frames = SHEET_CONFIGS[char]?.walkFrames ?? 1;
  return frames > 1 ? frame % frames : 0;
};

const singleRef = (char: 'hero' | 'enemy'): FrameRef => ({
  sheet: isLayoutValid(char) ? LAYOUTS[char].sheet : PROC_SHEET,
  col: 0,
  row: 0,
});

const castRef = (char: 'hero' | 'enemy'): FrameRef => {
  const cfg = SHEET_CONFIGS[char];
  if (!cfg?.castUrl && !cfg?.castBattleUrl) return singleRef(char);
  return {
    sheet: `${LAYOUTS[char].sheet}-cast`,
    col: 0,
    row: 0,
  };
};

const hurtRef = (char: 'hero' | 'enemy'): FrameRef => {
  const cfg = SHEET_CONFIGS[char];
  if (!cfg?.hurtBattleUrl) return singleRef(char);
  return {
    sheet: `${LAYOUTS[char].sheet}-hurt`,
    col: 0,
    row: 0,
  };
};

const GEN_WALK = { down: 40, up: 41, side: 39, frames: 6, sideFrames: 6 } as const;
const GEN_ATTACK = { down: 51, frames: 6 } as const;

function heroRow(dir: Dir): number {
  if (dir === 'up') return GEN_WALK.up;
  if (dir === 'down') return GEN_WALK.down;
  return GEN_WALK.side;
}

const walkRef = (char: 'hero' | 'enemy', dir: Dir | null, frame: number): FrameRef => {
  const cfg = SHEET_CONFIGS[char];
  if (cfg?.walkUrl) {
    return {
      sheet: `${LAYOUTS[char].sheet}-walk`,
      col: (cfg.walkFrames ?? 1) > 1 ? frame % (cfg.walkFrames ?? 1) : 0,
      row: 0,
    };
  }
  if (isSingleFrame(char)) {
    return { ...singleRef(char), col: walkCol(char, frame) };
  }
  const side = dir === 'left' || dir === 'right';
  return {
    sheet: resolveSheet(char),
    col: side ? frame % GEN_WALK.sideFrames : frame % GEN_WALK.frames,
    row: dir ? heroRow(dir) : GEN_WALK.down,
  };
};

export const SPRITE_MAP = {
  hero: {
    walk: (dir: Dir, frame: number): FrameRef => walkRef('hero', dir, frame),
    idle: (dir: Dir): FrameRef => {
      if (isSingleFrame('hero')) return singleRef('hero');
      return {
        sheet: resolveSheet('hero'),
        col: 0,
        row: heroRow(dir),
      };
    },
    attack: (_dir: Dir, frame: number): FrameRef => {
      if (isSingleFrame('hero')) return castRef('hero');
      return {
        sheet: resolveSheet('hero'),
        col: frame % GEN_ATTACK.frames,
        row: GEN_ATTACK.down,
      };
    },
    hurt: (): FrameRef => {
      if (isSingleFrame('hero')) return hurtRef('hero');
      return singleRef('hero');
    },
  },
  enemy: {
    idle: (): FrameRef => {
      if (isSingleFrame('enemy')) return singleRef('enemy');
      return {
        sheet: resolveSheet('enemy'),
        col: 0,
        row: GEN_WALK.down,
      };
    },
    walk: (frame: number): FrameRef => walkRef('enemy', null, frame),
    attack: (frame: number): FrameRef => {
      if (isSingleFrame('enemy')) return castRef('enemy');
      return {
        sheet: resolveSheet('enemy'),
        col: frame % GEN_ATTACK.frames,
        row: GEN_ATTACK.down,
      };
    },
    hurt: (): FrameRef => {
      if (isSingleFrame('enemy')) return hurtRef('enemy');
      return singleRef('enemy');
    },
  },
};
