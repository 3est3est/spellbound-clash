// Central asset configuration. Edit THIS file to wire real sprite sheets in
// — no game logic changes required elsewhere.
//
// How to use:
// 1. Drop your PNGs into `public/sprites/` (already done for all.png / player.png).
// 2. Fill in the layout numbers below once you know where each character lives
//    in the sheet (column/row of its first frame, frame size, direction rows).
// 3. Set `enabled: true` on a sheet to switch it from procedural fallback to
//    the real image.
//
// Until a sheet is `enabled`, the game keeps rendering procedural (code-drawn)
// shapes, so it stays fully playable.

export interface SheetConfig {
  /** Registered name used by SPRITE_MAP. */
  name: string;
  /** Path under public/ (served from site root). */
  url: string;
  /** Frame width in px. */
  frameW: number;
  /** Frame height in px. */
  frameH: number;
  /** When true, draw.ts uses this sheet instead of the procedural fallback. */
  enabled: boolean;
  /**
   * Optional color-key: a background color (hex) to treat as transparent.
   * Leave null if the PNG already has an alpha channel.
   */
  colorKey: string | null;
}

export const SHEETS: SheetConfig[] = [
  {
    name: 'player',
    url: '/sprites/player.png',
    frameW: 16,
    frameH: 16,
    enabled: false,
    colorKey: '#c2c6cf',
  },
  {
    name: 'all',
    url: '/sprites/all.png',
    frameW: 16,
    frameH: 16,
    enabled: false,
    colorKey: '#9ba0ab',
  },
  {
    name: 'hero',
    url: '/sprites/hero.png',
    frameW: 16,
    frameH: 16,
    enabled: false,
    colorKey: null,
  },
];

// Per-character layout within the enabled sheet. col/row are the TOP-LEFT
// frame of that character. dirRow maps a facing direction to a row offset.
// Edit these once you know the real positions.
export interface CharLayout {
  sheet: string;
  col: number;
  row: number;
  /** Number of walk frames per direction (excluding idle). */
  walkFrames: number;
  /** Row offset per direction: [down, left, right, up]. */
  dirRow: [number, number, number, number];
}

export const LAYOUT: Record<'hero' | 'enemy', CharLayout> = {
  hero: {
    sheet: 'all',
    col: 23,
    row: 28,
    walkFrames: 2,
    dirRow: [0, 1, 2, 3],
  },
  enemy: {
    sheet: 'all',
    col: 45,
    row: 29,
    walkFrames: 2,
    dirRow: [0, 1, 2, 3],
  },
};
