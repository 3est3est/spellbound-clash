// Shared 2D game constants. Tile size is 16px to match the classic
// SNES / Pokémon-style sprite sheets we'll drop in later.
export const TILE = 16;

// Short, single-screen-ish forest map (in tiles). 35 x 28 gives a bigger
// world with room for multiple paths, lakes, and forest clearings.
export const MAP_COLS = 35;
export const MAP_ROWS = 28;

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
} as const;

export type TileCode = (typeof T)[keyof typeof T];

// A tile that blocks movement.
export function isBlocked(code: TileCode): boolean {
  return code === T.TREE || code === T.ROCK || code === T.WATER;
}

// Four-way facing for sprite animation rows.
export type Dir = 'down' | 'up' | 'left' | 'right';

export const DIR_ORDER: Dir[] = ['down', 'left', 'right', 'up'];

// A bright, cheerful SNES-style palette (no AI-slop grays).
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

// Pixel scale: render the tilemap at SCALE× so each 16px tile becomes
// 16*SCALE screen px. Keeps the chunky retro look without 3D.
export const SCALE = 3;
