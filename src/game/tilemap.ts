import { MAP_COLS, MAP_ROWS, T, type TileCode, isBlocked } from './constants';

// A hand-crafted 35×28 RPG world — open start area, winding paths,
// forest clusters, lakes, flower meadows, and rocky outcrops.
//
// Tile codes: 0=grass 1=path 2=tree 3=rock 4=water 5=flower
// Player starts at tile (3,4) — kept open with easy access in all 4 directions.

function buildMap(): TileCode[][] {
  const grid: TileCode[][] = [];

  // ── 1. All grass ───────────────────────────────────────────────────────
  for (let y = 0; y < MAP_ROWS; y++) {
    const row: TileCode[] = [];
    for (let x = 0; x < MAP_COLS; x++) row.push(T.GRASS);
    grid.push(row);
  }

  // Helper: safe set
  const set = (x: number, y: number, code: TileCode) => {
    if (y >= 0 && y < MAP_ROWS && x >= 0 && x < MAP_COLS) grid[y][x] = code;
  };

  // ── 2. Tree border ─────────────────────────────────────────────────────
  for (let y = 0; y < MAP_ROWS; y++)
    for (let x = 0; x < MAP_COLS; x++)
      if (x === 0 || y === 0 || x === MAP_COLS - 1 || y === MAP_ROWS - 1)
        grid[y][x] = T.TREE;

  // ── 3. Paths ───────────────────────────────────────────────────────────

  // Main horizontal entry path (west → centre, y=4)
  for (let x = 1; x <= 18; x++) set(x, 4, T.PATH);

  // North–south spine (x=18, y=4 → y=23)
  for (let y = 4; y <= 23; y++) set(18, y, T.PATH);

  // East corridor (x=18 → x=33, y=14)
  for (let x = 18; x <= 33; x++) set(x, 14, T.PATH);

  // Northern spur (x=10, y=4 → y=1)
  for (let y = 1; y <= 4; y++) set(10, y, T.PATH);

  // Far-north horizontal (y=2, x=10 → x=30)
  for (let x = 10; x <= 30; x++) set(x, 2, T.PATH);

  // North-east vertical (x=30, y=2 → y=14)
  for (let x = 30; x <= 33; x++) set(x, 8, T.PATH); // small east link
  for (let y = 2; y <= 8; y++) set(30, y, T.PATH);

  // South loop — bottom of map (y=23, x=5 → x=30)
  for (let x = 5; x <= 30; x++) set(x, 23, T.PATH);

  // South-west vertical link (x=5, y=14 → y=23)
  for (let y = 14; y <= 23; y++) set(5, y, T.PATH);

  // ── 4. Forest clusters (AWAY from start area) ─────────────────────────

  // Start area must stay open: keep y=1..6, x=1..15 mostly clear of trees.
  // Trees only appear at the outer edges and far areas.

  // Far-north forest strip (top edge, y=1 only, gap around path x=10)
  for (let x = 1; x <= 8; x++) set(x, 1, T.TREE);
  for (let x = 12; x <= 33; x++) set(x, 1, T.TREE);

  // North-east dense forest block (x=20–28, y=3–8) — away from start
  const neForest: [number, number][] = [
    [20,3],[21,3],[22,3],[23,3],[24,3],[25,3],[26,3],[27,3],[28,3],[29,3],
    [20,4],[21,4],[22,4],[23,4],[24,4],[25,4],[26,4],[27,4],[28,4],[29,4],
    [20,5],[21,5],[22,5],[23,5],[24,5],[25,5],[26,5],[27,5],[28,5],[29,5],
    [20,6],[21,6],[22,6],[23,6],[24,6],[25,6],[26,6],[27,6],[28,6],[29,6],
    [20,7],[21,7],[22,7],[23,7],[24,7],[25,7],[26,7],[27,7],[28,7],[29,7],
    [31,3],[32,3],[31,4],[32,4],[31,5],[32,5],[31,6],[32,6],[31,7],[32,7],
  ];
  for (const [x, y] of neForest) set(x, y, T.TREE);

  // Mid-west forest (x=1–4, y=7–16) — left side wall
  for (let y = 7; y <= 16; y++) {
    set(1, y, T.TREE);
    set(2, y, T.TREE);
    set(3, y, T.TREE);
  }
  // Thicker mid-west patch
  for (let y = 10; y <= 13; y++) set(4, y, T.TREE);

  // South-east mega forest (x=22–33, y=16–26)
  const seForest: [number, number][] = [];
  for (let y = 16; y <= 26; y++)
    for (let x = 22; x <= 33; x++)
      seForest.push([x, y]);
  // Carve a few clearings
  for (const [x, y] of seForest) set(x, y, T.TREE);

  // South-west forest (x=1–4, y=17–26)
  for (let y = 17; y <= 26; y++) {
    set(1, y, T.TREE);
    set(2, y, T.TREE);
    set(3, y, T.TREE);
    set(4, y, T.TREE);
  }

  // Mid-east forest block (x=22–29, y=9–13)
  const meForest: [number, number][] = [
    [22,9],[23,9],[24,9],[25,9],[26,9],[27,9],[28,9],[29,9],
    [22,10],[23,10],[24,10],[25,10],[26,10],[27,10],[28,10],[29,10],
    [22,11],[23,11],[24,11],[25,11],[26,11],[27,11],[28,11],[29,11],
    [22,12],[23,12],[24,12],[25,12],[26,12],[27,12],[28,12],[29,12],
    [22,13],[23,13],[24,13],[25,13],[26,13],[27,13],[28,13],[29,13],
  ];
  for (const [x, y] of meForest) set(x, y, T.TREE);

  // North-west corner forest (x=1–8, y=6–13, but keep path clear at x=10,y=4)
  const nwForest: [number, number][] = [
    [1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],
    [1,7], // 2,3,4 already handled above
    [5,7],[6,7],[7,7],[8,7],[9,7],
    [5,8],[6,8],[7,8],[8,8],[9,8],
    [5,9],[6,9],[7,9],[8,9],[9,9],
    [5,10],[6,10],[7,10],[8,10],[9,10],
    [5,11],[6,11],[7,11],[8,11],[9,11],
    [5,12],[6,12],[7,12],[8,12],[9,12],
    [5,13],[6,13],[7,13],[8,13],[9,13],
  ];
  for (const [x, y] of nwForest) set(x, y, T.TREE);

  // ── 5. Lakes ──────────────────────────────────────────────────────────

  // Centre-east lake (x=20–21, y=15–18 — within the big clearing east of path)
  const ceLake: [number, number][] = [
    [20,15],[21,15],
    [19,16],[20,16],[21,16],
    [19,17],[20,17],[21,17],
    [20,18],[21,18],
  ];
  for (const [x, y] of ceLake) set(x, y, T.WATER);

  // Small north lake (x=14–16, y=5–7 — tucked east of main path)
  const nLake: [number, number][] = [
    [14,5],[15,5],[16,5],[17,5],
    [14,6],[15,6],[16,6],[17,6],
    [14,7],[15,7],[16,7],[17,7],
    [15,8],[16,8],[17,8],
  ];
  for (const [x, y] of nLake) set(x, y, T.WATER);

  // South loop pond (x=8–10, y=16–18)
  const sLoop: [number, number][] = [
    [8,16],[9,16],[10,16],
    [8,17],[9,17],[10,17],
    [8,18],[9,18],
  ];
  for (const [x, y] of sLoop) set(x, y, T.WATER);

  // A winding north-to-south river turns the eastern wood into a real
  // destination. The east road crosses it at y=14, creating a natural bridge
  // landmark instead of another small rectangular pond.
  for (let y = 1; y < MAP_ROWS - 1; y++) {
    const riverX = 25 + Math.round(Math.sin(y * 0.58) * 1.4);
    for (let dx = -1; dx <= 1; dx++) set(riverX + dx, y, T.WATER);
    if (y === 14) {
      for (let dx = -1; dx <= 1; dx++) set(riverX + dx, y, T.PATH);
    }
  }

  // ── 6. Rocks ──────────────────────────────────────────────────────────
  const rocks: [number, number][] = [
    [12,5],[13,5],          // near north lake entry
    [11,10],[12,10],        // centre rocks
    [18,10],[19,10],        // centre-east rocks
    [6,16],[7,16],          // south entry rocks
    [13,19],[14,19],        // south rocks
    [16,20],[17,20],        // inner south rocks
    [33,10],[33,11],        // far-east rocks
    [11,6],[12,6],[13,6],   // mid-north rocks
    [11,7],[12,7],[13,7],
  ];
  for (const [x, y] of rocks) set(x, y, T.ROCK);

  // ── 7. Flowers (open areas only) ──────────────────────────────────────
  const flowers: [number, number][] = [
    // Along the main west entry path (south side)
    [4,5],[5,5],[6,5],[7,5],[8,5],[9,5],
    [4,6],[5,6],  // already tree — will be skipped
    // Open south zone around path
    [6,15],[7,15],[8,15],
    [6,19],[7,19],[8,19],[9,19],[10,19],[11,19],
    [6,20],[7,20],[8,20],[9,20],[10,20],[11,20],
    [6,21],[7,21],[8,21],[9,21],[10,21],[11,21],
    [6,22],[7,22],[8,22],[9,22],[10,22],[11,22],
    // East corridor clearings
    [19,9],[19,10],[19,11],[19,12],[19,13],
    [20,9],[20,10],[20,11],[20,12],[20,13],
    [21,9],[21,10],[21,11],[21,12],[21,13],
    // Along north path
    [12,3],[13,3],[14,3],[15,3],[16,3],[17,3],[18,3],[19,3],
    // Centre grass strip
    [11,8],[12,8],[13,8],
  ];
  for (const [x, y] of flowers) {
    if (grid[y] && grid[y][x] === T.GRASS) set(x, y, T.FLOWER);
  }

  return grid;
}

export const MAP: TileCode[][] = buildMap();

export function tileAt(tx: number, ty: number): TileCode {
  if (ty < 0 || ty >= MAP_ROWS || tx < 0 || tx >= MAP_COLS) return T.TREE;
  return MAP[ty][tx];
}

export function canWalkTile(tx: number, ty: number): boolean {
  return !isBlocked(tileAt(tx, ty));
}

export function canWalkAt(tileX: number, tileY: number): boolean {
  return canWalkTile(Math.floor(tileX), Math.floor(tileY));
}
