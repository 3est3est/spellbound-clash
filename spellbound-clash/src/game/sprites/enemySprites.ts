import type { SheetConfig, CharLayout } from './heroSprites';

export const ENEMY_SHEET_CONFIG: SheetConfig = {
  name: 'enemy',
  url: '/sprites/enemy_new.png',
  frameW: 64,
  frameH: 64,
  enabled: false,
  colorKey: null,
};

export const ENEMY_LAYOUT: CharLayout = {
  sheet: 'enemy',
  col: 0,
  row: 39,
  walkFrames: 6,
  dirRow: [0, 1, 2, 3],
};
