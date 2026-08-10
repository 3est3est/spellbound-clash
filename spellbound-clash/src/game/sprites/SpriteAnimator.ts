import type { Dir } from '../constants';
import { HERO_SHEET_CONFIG, HERO_LAYOUT, type CharLayout, type SheetConfig } from './heroSprites';
import { ENEMY_SHEET_CONFIGS, ENEMY_LAYOUTS, type EnemyKey } from './enemySprites';
import { getSheet, sheetFrameHasContent, PROC_SHEET } from './SpriteSheet';

export type CharKey = 'hero' | EnemyKey;

export interface FrameRef {
  sheet: string;
  col: number;
  row: number;
}

export type AnimName = 'idle' | 'walk';

const LAYOUTS: Record<CharKey, CharLayout> = {
  hero: HERO_LAYOUT,
  ...ENEMY_LAYOUTS,
};

const SHEET_CONFIGS: Record<CharKey, SheetConfig> = {
  hero: HERO_SHEET_CONFIG,
  ...ENEMY_SHEET_CONFIGS,
};

export function isLayoutValid(char: CharKey): boolean {
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

const resolvedCache = new Map<CharKey, string>();

function resolveSheet(char: CharKey): string {
  const cached = resolvedCache.get(char);
  if (cached !== undefined) return cached;
  if (isLayoutValid(char)) {
    const sheet = LAYOUTS[char].sheet;
    resolvedCache.set(char, sheet);
    return sheet;
  }
  return PROC_SHEET;
}

const isSingleFrame = (char: CharKey): boolean =>
  !!SHEET_CONFIGS[char]?.singleFrame;

const walkCol = (char: CharKey, frame: number): number => {
  const frames = SHEET_CONFIGS[char]?.walkFrames ?? 1;
  return frames > 1 ? frame % frames : 0;
};

const singleRef = (char: CharKey): FrameRef => ({
  sheet: isLayoutValid(char) ? LAYOUTS[char].sheet : PROC_SHEET,
  col: 0,
  row: 0,
});

const castRef = (char: CharKey): FrameRef => {
  const cfg = SHEET_CONFIGS[char];
  if (!cfg?.castUrl && !cfg?.castBattleUrl) return singleRef(char);
  return {
    sheet: `${LAYOUTS[char].sheet}-cast`,
    col: 0,
    row: 0,
  };
};

const hurtRef = (char: CharKey): FrameRef => {
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

const walkRef = (char: CharKey, dir: Dir | null, frame: number): FrameRef => {
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
    idle: (key: EnemyKey): FrameRef => {
      if (isSingleFrame(key)) return singleRef(key);
      return {
        sheet: resolveSheet(key),
        col: 0,
        row: GEN_WALK.down,
      };
    },
    walk: (key: EnemyKey, frame: number): FrameRef => walkRef(key, null, frame),
    attack: (key: EnemyKey, frame: number): FrameRef => {
      if (isSingleFrame(key)) return castRef(key);
      return {
        sheet: resolveSheet(key),
        col: frame % GEN_ATTACK.frames,
        row: GEN_ATTACK.down,
      };
    },
    hurt: (key: EnemyKey): FrameRef => {
      if (isSingleFrame(key)) return hurtRef(key);
      return singleRef(key);
    },
  },
};