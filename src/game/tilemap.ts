import { MAP_COLS, MAP_ROWS, T, type TileCode, isBlocked } from './constants';

// The map is a flat grid of TileCode values. We hand-author a small,
// cheerful forest clearing with a winding path and a few obstacles.
// Border rows/cols are trees so the player can never leave the map.
function buildMap(): TileCode[][] {
  const grid: TileCode[][] = [];
  for (let y = 0; y < MAP_ROWS; y++) {
    const row: TileCode[] = [];
    for (let x = 0; x < MAP_COLS; x++) {
      // Solid tree border.
      if (x === 0 || y === 0 || x === MAP_COLS - 1 || y === MAP_ROWS - 1) {
        row.push(T.TREE);
      } else {
        row.push(T.GRASS);
      }
    }
    grid.push(row);
  }

  // A simple S-shaped dirt path the player walks along.
  const pathCells: [number, number][] = [
    [3, 3], [4, 3], [5, 3], [6, 3], [7, 3],
    [7, 4], [7, 5], [7, 6], [7, 7],
    [8, 7], [9, 7], [10, 7], [11, 7], [12, 7],
    [12, 8], [12, 9], [12, 10], [12, 11], [12, 12],
    [11, 12], [10, 12], [9, 12], [8, 12], [7, 12],
    [7, 13], [7, 14], [7, 15],
  ];
  for (const [x, y] of pathCells) {
    if (grid[y] && grid[y][x] !== undefined) grid[y][x] = T.PATH;
  }

  // Scatter a few decorative blockers / details (avoiding the path).
  const decos: [number, number, TileCode][] = [
    [3, 6, T.TREE], [4, 9, T.ROCK], [5, 11, T.FLOWER], [9, 4, T.TREE],
    [10, 5, T.FLOWER], [14, 4, T.TREE], [15, 9, T.ROCK], [16, 13, T.TREE],
    [17, 6, T.FLOWER], [18, 10, T.TREE], [19, 14, T.ROCK], [20, 5, T.TREE],
    [21, 11, T.FLOWER], [13, 14, T.TREE], [16, 3, T.ROCK], [10, 14, T.TREE],
  ];
  for (const [x, y, code] of decos) {
    if (grid[y] && grid[y][x] !== undefined) grid[y][x] = code;
  }

  // One small pond (water blocks movement too).
  grid[15][18] = T.WATER;
  grid[15][19] = T.WATER;
  grid[16][18] = T.WATER;
  grid[16][19] = T.WATER;

  return grid;
}

export const MAP: TileCode[][] = buildMap();

export function tileAt(tx: number, ty: number): TileCode {
  if (ty < 0 || ty >= MAP_ROWS || tx < 0 || tx >= MAP_COLS) return T.TREE;
  return MAP[ty][tx];
}

// True when a tile coordinate is walkable.
export function canWalkTile(tx: number, ty: number): boolean {
  return !isBlocked(tileAt(tx, ty));
}

// Convert pixel-ish float world position (in tiles) to walkable check.
export function canWalkAt(tileX: number, tileY: number): boolean {
  return canWalkTile(Math.floor(tileX), Math.floor(tileY));
}
