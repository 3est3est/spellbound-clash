// Shared 2D game constants.
export const TILE = 16;

// Compact 4-Zone Separated Map (56x48 total grid)
// Each zone room is 22x18 tiles, separated by an 8-tile buffer gap & connecting corridors.
export const ZONE_COLS = 22;
export const ZONE_ROWS = 18;
export const MAP_COLS = 56;
export const MAP_ROWS = 48;

export const VIEW_TILES_X = 22;
export const VIEW_TILES_Y = 16;

// Tile codes used by the tilemap grid.
export const T = {
  GRASS: 0,
  PATH: 1,
  TREE: 2,
  ROCK: 3,
  WATER: 4,
  FLOWER: 5,
  GATE_1_2: 6,
  GATE_2_3: 7,
  GATE_3_4: 8,
} as const;

export type TileCode = (typeof T)[keyof typeof T];

// A tile that blocks movement.
export function isBlocked(code: TileCode): boolean {
  return (
    code === T.TREE ||
    code === T.ROCK ||
    code === T.WATER ||
    code === T.GATE_1_2 ||
    code === T.GATE_2_3 ||
    code === T.GATE_3_4
  );
}

// Four-way facing for sprite animation rows.
export type Dir = 'down' | 'up' | 'left' | 'right';

export const DIR_ORDER: Dir[] = ['down', 'left', 'right', 'up'];

export const COLORS = {
  grass: '#7ec850',
  grassDark: '#6cb33f',
  path: '#d9b878',
  pathDark: '#c9a868',
  tree: '#2f7d32',
  treeDark: '#1f5e22',
  treeTrunk: '#6b4423',
  rock: '#9e9e9e',
  rockDark: '#7a7a7a',
  water: '#4fc3f7',
  waterDark: '#29b6f6',
  flower: '#ff8ab3',
  hero: '#3b6ef0',
  heroDark: '#2747c4',
  heroHat: '#1e3a8a',
  heroSkin: '#f1c27d',
  enemy: '#c0392b',
  enemyDark: '#922b21',
  enemyEye: '#ffe14d',
  shadow: 'rgba(0,0,0,0.22)',
} as const;

export const SCALE = 3;

// Admin code that enables god mode (free gate unlocks, coins, etc.)
export const ADMIN_CODE = "Admin-eiei";
