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
  // The project's original generated pixel sprites. They use the familiar
  // 6-frame walk rows and a dedicated spell-cast row in one sheet.
  {
    name: 'hero',
    url: '/sprites/player_new.png',
    frameW: 64,
    frameH: 64,
    enabled: false,
    colorKey: null,
  },
  {
    name: 'enemy',
    url: '/sprites/enemy_new.png',
    frameW: 64,
    frameH: 64,
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
    sheet: 'hero',
    col: 0,
    row: 39,
    walkFrames: 6,
    dirRow: [0, 1, 2, 3],
  },
  enemy: {
    sheet: 'enemy',
    col: 0,
    row: 39,
    walkFrames: 6,
    dirRow: [0, 1, 2, 3],
  },
};
