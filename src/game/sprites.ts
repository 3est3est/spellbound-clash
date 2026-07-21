// Sprite sheet loader. Designed so real Pokémon-style asset packs can be
// dropped in later WITHOUT touching game logic: just register a sheet and
// reference it by name. Until a PNG is supplied (or a layout points at an
// empty cell), the game renders with procedural (code-drawn) shapes so it's
// fully playable.
//
// Real sheets are configured in assetConfig.ts (SHEETS / LAYOUT). Flip
// `enabled: true` there and the SPRITE_MAP below automatically points at the
// registered sheet instead of the procedural fallback. If a layout points at
// empty/background cells, the sheet auto-falls back to procedural so a wrong
// layout never shows a broken sprite.

import { SHEETS, LAYOUT, type CharLayout } from './assetConfig';
import type { Dir } from './constants';

export interface SpriteSheet {
  name: string;
  image: HTMLImageElement | null;
  frameW: number;
  frameH: number;
  ready: boolean;
}

const sheets: Record<string, SpriteSheet> = {};

// The '__proc' sheet is a virtual sheet that is never an image — it signals
// draw.ts to render procedural shapes instead.
export const PROC_SHEET = '__proc';

function applyColorKey(img: HTMLImageElement, key: string): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const r = parseInt(key.slice(1, 3), 16);
  const g = parseInt(key.slice(3, 5), 16);
  const b = parseInt(key.slice(5, 7), 16);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    if (
      Math.abs(px[i] - r) < 40 &&
      Math.abs(px[i + 1] - g) < 40 &&
      Math.abs(px[i + 2] - b) < 40
    ) {
      px[i + 3] = 0;
    }
  }
  ctx.putImageData(data, 0, 0);
  const out = new Image();
  out.src = canvas.toDataURL();
  return out;
}

export function registerSheet(
  name: string,
  url: string,
  frameW = 16,
  frameH = 16,
  colorKey: string | null = null
): SpriteSheet {
  const sheet: SpriteSheet = {
    name,
    image: null,
    frameW,
    frameH,
    ready: false,
  };
  sheets[name] = sheet;

  const img = new Image();
  img.onload = () => {
    const finalImg = colorKey ? applyColorKey(img, colorKey) : img;
    finalImg.onload = () => {
      sheet.image = finalImg;
      sheet.ready = true;
    };
    if (!colorKey) {
      sheet.image = img;
      sheet.ready = true;
    }
  };
  img.src = url;
  return sheet;
}

export function getSheet(name: string): SpriteSheet | null {
  return sheets[name] ?? null;
}

// Returns true if the given frame cell has real (non-background) content.
// Used to auto-fallback to procedural sprites if a layout points at an empty
// cell, so a wrong layout never renders a "broken" sheet.
// RESULTS ARE CACHED: getImageData + the pixel scan are expensive, so we must
// NOT run this every frame (the old code did, which caused heavy jank while
// walking). Each (sheet,col,row) cell is scanned at most once.
const contentCache = new Map<string, boolean>();
export function sheetFrameHasContent(
  sheet: SpriteSheet,
  col: number,
  row: number,
  tolerance = 40,
  key = '#9ba0ab'
): boolean {
  if (!sheet.image) return false;
  const cacheKey = `${sheet.name}:${col}:${row}:${tolerance}:${key}`;
  const cached = contentCache.get(cacheKey);
  if (cached !== undefined) return cached;
  const img = sheet.image;
  const cw = sheet.frameW;
  const ch = sheet.frameH;
  const x0 = col * cw;
  const y0 = row * ch;
  if (x0 + cw > img.naturalWidth || y0 + ch > img.naturalHeight) {
    contentCache.set(cacheKey, false);
    return false;
  }
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, x0, y0, cw, ch, 0, 0, cw, ch);
  const d = ctx.getImageData(0, 0, cw, ch).data;
  const r = parseInt(key.slice(1, 3), 16);
  const g = parseInt(key.slice(3, 5), 16);
  const b = parseInt(key.slice(5, 7), 16);
  let content = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 10) continue;
    if (
      Math.abs(d[i] - r) >= tolerance ||
      Math.abs(d[i + 1] - g) >= tolerance ||
      Math.abs(d[i + 2] - b) >= tolerance
    ) {
      content++;
    }
  }
  const result = content > cw * ch * 0.05;
  contentCache.set(cacheKey, result);
  return result;
}

export function isLayoutValid(char: 'hero' | 'enemy'): boolean {
  const layout: CharLayout = LAYOUT[char];
  const cfg = SHEETS.find((s) => s.name === layout.sheet);
  if (!cfg || !cfg.enabled) return false;
  const sheet = getSheet(layout.sheet);
  if (!sheet || !sheet.ready || !sheet.image) return false;
  const maxRow = Math.floor(sheet.image.naturalHeight / sheet.frameH) - 1;
  // Check 3 direction rows: side (row+0), down (row+1), up (row+2).
  // Custom sheets only need these 3 rows to be valid — the 4th was causing
  // fallback to procedural because row+3 is typically empty.
  for (let d = 0; d < 3; d++) {
    const rr = layout.row + d;
    if (rr > maxRow) continue;
    if (!sheetFrameHasContent(sheet, layout.col, rr)) return false;
  }
  return true;
}

// Register every configured sheet up front (disabled sheets still load so the
// switch is instant when flipped on).
for (const s of SHEETS) {
  registerSheet(s.name, s.url, s.frameW, s.frameH, s.colorKey);
}

// Frame layout descriptors. Each entry maps a logical animation to a
// (col,row) cell in the sheet. Rows typically encode facing direction.
export interface FrameRef {
  sheet: string;
  col: number;
  row: number;
}

export type AnimName = 'idle' | 'walk';

// Resolve which sheet a character should use: the configured real sheet if
// enabled AND its layout actually points at sprite content, otherwise the
// procedural fallback. The VALID result is cached so we don't re-run the
// (now-cached but still non-trivial) layout check on every frame.
const resolvedCache = new Map<'hero' | 'enemy', string>();
function resolveSheet(char: 'hero' | 'enemy'): string {
  const cached = resolvedCache.get(char);
  if (cached !== undefined) return cached;
  if (isLayoutValid(char)) {
    const sheet = LAYOUT[char].sheet;
    resolvedCache.set(char, sheet);
    return sheet;
  }
  return PROC_SHEET; // not cached — recomputed next frame (cheap until ready)
}

// Original generated sheets: rows 39/40/41 contain side/down/up walking;
// row 51 is the six-frame magic cast. The renderer mirrors the side row for
// left movement.
const GEN_WALK = { down: 40, up: 41, side: 39, frames: 6, sideFrames: 6 } as const;
const GEN_ATTACK = { down: 51, frames: 6 } as const;

function heroRow(dir: Dir): number {
  if (dir === 'up') return GEN_WALK.up;
  if (dir === 'down') return GEN_WALK.down;
  return GEN_WALK.side;
}

// Manifest: where each sprite lives in its sheet. Each character exposes
// idle / walk / attack poses so the game can support many sprite sheets —
// only the row numbers above need tweaking when the art changes.
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
