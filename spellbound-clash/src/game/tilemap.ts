import { MAP_COLS, MAP_ROWS, T, type TileCode, isBlocked } from './constants';

export function getZoneAt(tx: number, ty: number): 1 | 2 | 3 | 4 {
  if (tx < 28) {
    return ty < 24 ? 1 : 4;
  } else {
    return ty < 24 ? 2 : 3;
  }
}

// Seeded pseudorandom for deterministic placement
function rand(x: number, y: number, salt: number): number {
  let h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(salt + 1, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function buildMap(): TileCode[][] {
  const grid: TileCode[][] = [];
  for (let y = 0; y < MAP_ROWS; y++) {
    const row: TileCode[] = [];
    for (let x = 0; x < MAP_COLS; x++) row.push(T.TREE);
    grid.push(row);
  }

  const set = (x: number, y: number, code: TileCode) => {
    if (y >= 0 && y < MAP_ROWS && x >= 0 && x < MAP_COLS) grid[y][x] = code;
  };
  const get = (x: number, y: number): TileCode => {
    if (y < 0 || y >= MAP_ROWS || x < 0 || x >= MAP_COLS) return T.TREE;
    return grid[y][x];
  };

  // Carve a room — walls stay T.TREE, interior becomes T.GRASS
  const carveRoom = (x1: number, y1: number, x2: number, y2: number) => {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        set(x, y, (x === x1 || y === y1 || x === x2 || y === y2) ? T.TREE : T.GRASS);
      }
    }
  };

  // ── Zone rooms ──────────────────────────────────────────────────────────
  carveRoom(2, 2, 24, 20);    // Zone 1 (Top-Left)
  carveRoom(31, 2, 53, 20);   // Zone 2 (Top-Right)
  carveRoom(31, 27, 53, 45);  // Zone 3 (Bottom-Right)
  carveRoom(2, 27, 24, 45);   // Zone 4 (Bottom-Left)

  // ── Corridor 1↔2: Horizontal between x=24..31, rows 10-11 ──────────────
  for (let x = 24; x <= 31; x++) {
    set(x, 9, T.TREE);
    set(x, 10, T.PATH);
    set(x, 11, T.PATH);
    set(x, 12, T.TREE);
  }
  // Gate (passable only when zone 2 unlocked) at midpoint
  set(27, 10, T.GATE_1_2);
  set(27, 11, T.GATE_1_2);

  // ── Corridor 2↔3: Vertical between y=20..27, cols 42-43 ─────────────────
  for (let y = 20; y <= 27; y++) {
    set(41, y, T.TREE);
    set(42, y, T.PATH);
    set(43, y, T.PATH);
    set(44, y, T.TREE);
  }
  set(42, 23, T.GATE_2_3);
  set(43, 23, T.GATE_2_3);

  // ── Corridor 3↔4: Horizontal between x=24..31, rows 36-37 ──────────────
  for (let x = 24; x <= 31; x++) {
    set(x, 35, T.TREE);
    set(x, 36, T.PATH);
    set(x, 37, T.PATH);
    set(x, 38, T.TREE);
  }
  set(27, 36, T.GATE_3_4);
  set(27, 37, T.GATE_3_4);

  // ── Organic scatter helper: Only place on GRASS tiles, never blocking path ─
  const scatter = (x: number, y: number, code: TileCode) => {
    if (get(x, y) === T.GRASS) set(x, y, code);
  };

  // ════════════════════════════════════════════════════════════════════════
  //  ZONE 1: Emerald Forest — x:3..23, y:3..19
  // ════════════════════════════════════════════════════════════════════════

  // Winding dirt trail through the zone
  for (let x = 3; x <= 9; x++) scatter(x, 14, T.PATH);
  for (let y = 7; y <= 14; y++) scatter(9, y, T.PATH);
  for (let x = 9; x <= 24; x++) {
    scatter(x, 7, T.PATH);
    scatter(x, 8, T.PATH);
  }
  // Branch trail down-right
  for (let y = 8; y <= 17; y++) scatter(20, y, T.PATH);
  for (let x = 12; x <= 20; x++) scatter(x, 17, T.PATH);

  // Small pond (top-left area)
  for (const [px, py] of [
    [4, 3], [5, 3], [6, 3],
    [4, 4], [5, 4], [6, 4],
  ] as [number, number][]) scatter(px, py, T.WATER);

  // Scattered tree clusters (small 2×2 and 1×2 groves dotted across interior)
  const z1Trees: [number, number][] = [
    // Near pond edge
    [7, 3], [8, 3], [7, 4],
    // Center-left
    [6, 10], [7, 10], [6, 11],
    // Mid-center top
    [12, 4], [13, 4], [13, 5],
    // Mid-center bottom
    [12, 12], [13, 12], [12, 13],
    // Far right mid
    [17, 5], [18, 5], [17, 6],
    // Bottom-right cluster
    [21, 14], [22, 14], [22, 15], [21, 15],
    // Bottom-left
    [3, 16], [4, 16], [4, 17],
    // Center island
    [15, 10], [16, 10], [15, 11],
    // Top-right
    [20, 3], [21, 3], [21, 4],
    // Lone trees
    [10, 15], [14, 15], [8, 12], [18, 12], [10, 18], [17, 18],
  ];
  for (const [x, y] of z1Trees) scatter(x, y, T.TREE);

  // Scattered rocks
  const z1Rocks: [number, number][] = [
    [11, 5], [14, 13], [21, 11], [6, 16], [18, 15], [10, 10],
  ];
  for (const [x, y] of z1Rocks) scatter(x, y, T.ROCK);

  // Floor flowers near path
  for (const [fx, fy] of [
    [10, 7], [10, 8], [11, 14], [16, 6], [19, 10], [7, 15],
  ] as [number, number][]) scatter(fx, fy, T.FLOWER);

  // ════════════════════════════════════════════════════════════════════════
  //  ZONE 2: Autumn / Desert — x:32..52, y:3..19
  // ════════════════════════════════════════════════════════════════════════

  // Trail that winds from corridor entrance east then south
  for (let x = 31; x <= 39; x++) {
    scatter(x, 13, T.PATH);
    scatter(x, 14, T.PATH);
  }
  for (let y = 6; y <= 14; y++) scatter(39, y, T.PATH);
  for (let x = 39; x <= 50; x++) scatter(x, 6, T.PATH);
  for (let y = 6; y <= 18; y++) scatter(50, y, T.PATH);
  for (let x = 44; x <= 50; x++) scatter(x, 18, T.PATH);

  // Sandy lake / oasis
  for (const [px, py] of [
    [34, 3], [35, 3], [36, 3],
    [34, 4], [35, 4], [36, 4],
  ] as [number, number][]) scatter(px, py, T.WATER);

  const z2Trees: [number, number][] = [
    // Near oasis
    [37, 3], [37, 4], [38, 3],
    // Center cluster
    [41, 9], [42, 9], [41, 10],
    // Far mid cluster
    [46, 11], [47, 11], [47, 12],
    // Top-right
    [50, 3], [51, 3], [51, 4], [52, 4],
    // Bottom clusters
    [33, 16], [34, 16], [33, 17],
    [46, 16], [47, 16], [47, 17],
    // Scattered lone trees
    [40, 4], [35, 8], [43, 5], [52, 10], [36, 18], [48, 4],
  ];
  for (const [x, y] of z2Trees) scatter(x, y, T.TREE);

  const z2Rocks: [number, number][] = [
    [38, 8], [44, 14], [52, 7], [32, 10], [49, 16], [41, 18],
  ];
  for (const [x, y] of z2Rocks) scatter(x, y, T.ROCK);

  for (const [fx, fy] of [
    [33, 5], [40, 8], [45, 15], [51, 12], [36, 12],
  ] as [number, number][]) scatter(fx, fy, T.FLOWER);

  // ════════════════════════════════════════════════════════════════════════
  //  ZONE 3: Snowy Frostland — x:32..52, y:28..44
  // ════════════════════════════════════════════════════════════════════════

  // Trail from corridor entrance (top), winding east
  for (let x = 32; x <= 40; x++) {
    scatter(x, 28, T.PATH);
    scatter(x, 29, T.PATH);
  }
  for (let y = 29; y <= 36; y++) scatter(40, y, T.PATH);
  for (let x = 40; x <= 52; x++) scatter(x, 36, T.PATH);
  for (let y = 36; y <= 44; y++) scatter(52, y, T.PATH);
  for (let x = 35; x <= 52; x++) scatter(x, 44, T.PATH);

  // Frozen lake
  for (const [px, py] of [
    [33, 32], [34, 32], [35, 32],
    [33, 33], [34, 33], [35, 33],
  ] as [number, number][]) scatter(px, py, T.WATER);

  const z3Trees: [number, number][] = [
    // Near frozen lake
    [36, 32], [36, 33], [37, 32],
    // Center cluster
    [44, 30], [45, 30], [44, 31],
    // Far right cluster
    [50, 28], [51, 28], [51, 29],
    // Bottom clusters
    [33, 40], [34, 40], [33, 41],
    [47, 40], [48, 40], [47, 41],
    // Scattered lone trees
    [38, 35], [42, 33], [50, 37], [36, 44], [46, 43], [52, 40],
    [41, 39], [48, 30], [39, 43],
  ];
  for (const [x, y] of z3Trees) scatter(x, y, T.TREE);

  const z3Rocks: [number, number][] = [
    [38, 28], [45, 34], [51, 42], [32, 37], [43, 44], [49, 31],
  ];
  for (const [x, y] of z3Rocks) scatter(x, y, T.ROCK);

  for (const [fx, fy] of [
    [37, 30], [43, 37], [50, 29], [34, 43], [48, 38],
  ] as [number, number][]) scatter(fx, fy, T.FLOWER);

  // ════════════════════════════════════════════════════════════════════════
  //  ZONE 4: Volcanic Wasteland — x:3..23, y:28..44
  // ════════════════════════════════════════════════════════════════════════

  // Trail from corridor entrance (right side), winds west then south
  for (let x = 23; x >= 14; x--) {
    scatter(x, 32, T.PATH);
    scatter(x, 33, T.PATH);
  }
  for (let y = 33; y <= 40; y++) scatter(14, y, T.PATH);
  for (let x = 3; x <= 14; x++) scatter(x, 40, T.PATH);
  for (let y = 40; y <= 44; y++) scatter(3, y, T.PATH);

  // Lava pool
  for (const [px, py] of [
    [6, 29], [7, 29], [8, 29],
    [6, 30], [7, 30], [8, 30],
  ] as [number, number][]) scatter(px, py, T.WATER);

  const z4Trees: [number, number][] = [
    // Near lava pool
    [9, 29], [9, 30], [10, 29],
    // Center cluster
    [16, 31], [17, 31], [16, 32],
    // Far left cluster
    [3, 35], [4, 35], [4, 36],
    // Bottom clusters
    [11, 41], [12, 41], [11, 42],
    [19, 41], [20, 41], [20, 42],
    // Lone scattered
    [22, 29], [5, 38], [18, 37], [10, 44], [21, 43], [13, 36],
    [7, 34], [20, 34], [15, 43],
  ];
  for (const [x, y] of z4Trees) scatter(x, y, T.TREE);

  const z4Rocks: [number, number][] = [
    [5, 29], [11, 31], [22, 35], [15, 40], [4, 43], [20, 39],
  ];
  for (const [x, y] of z4Rocks) scatter(x, y, T.ROCK);

  for (const [fx, fy] of [
    [13, 29], [19, 33], [8, 37], [22, 41], [12, 44],
  ] as [number, number][]) scatter(fx, fy, T.FLOWER);

  // ── Final pass: light random scatter of lone trees/rocks ────────────────────
  // SAFE ZONES: player spawns & enemy positions that must stay clear
  const safeSet = new Set<string>();
  // Zone 1 spawn area
  for (let sy = 3; sy <= 8; sy++) for (let sx = 3; sx <= 8; sx++) safeSet.add(`${sx},${sy}`);
  // Zone 2 spawn area (player enters from left corridor y=10-11)
  for (let sy = 8; sy <= 14; sy++) for (let sx = 32; sx <= 38; sx++) safeSet.add(`${sx},${sy}`);
  // Zone 3 spawn area (enters from top corridor)
  for (let sy = 28; sy <= 33; sy++) for (let sx = 40; sx <= 46; sx++) safeSet.add(`${sx},${sy}`);
  // Zone 4 spawn area (enters from right corridor)
  for (let sy = 28; sy <= 36; sy++) for (let sx = 18; sx <= 24; sx++) safeSet.add(`${sx},${sy}`);

  // Enemy spawn positions that must stay GRASS
  const enemySpawns: [number, number][] = [
    [8, 5], [18, 14], [8, 16],          // Zone 1
    [40, 6], [49, 15], [42, 18],         // Zone 2
    [43, 33], [49, 40], [35, 41],        // Zone 3
    [14, 31], [5, 42], [16, 42],         // Zone 4
  ];
  for (const [ex, ey] of enemySpawns) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) safeSet.add(`${ex + dx},${ey + dy}`);
  }

  const isSafe = (x: number, y: number) => safeSet.has(`${x},${y}`);

  // Zone 1: x 3..23, y 3..19 — sparse scatter (only 8% chance of extra tree)
  for (let y = 3; y <= 19; y++) {
    for (let x = 3; x <= 23; x++) {
      if (isSafe(x, y)) continue;
      if (get(x, y) === T.GRASS && rand(x, y, 1) > 0.92) set(x, y, T.TREE);
      else if (get(x, y) === T.GRASS && rand(x, y, 2) > 0.96) set(x, y, T.ROCK);
    }
  }
  // Zone 2
  for (let y = 3; y <= 19; y++) {
    for (let x = 32; x <= 52; x++) {
      if (isSafe(x, y)) continue;
      if (get(x, y) === T.GRASS && rand(x, y, 4) > 0.92) set(x, y, T.TREE);
      else if (get(x, y) === T.GRASS && rand(x, y, 5) > 0.96) set(x, y, T.ROCK);
    }
  }
  // Zone 3
  for (let y = 28; y <= 44; y++) {
    for (let x = 32; x <= 52; x++) {
      if (isSafe(x, y)) continue;
      if (get(x, y) === T.GRASS && rand(x, y, 6) > 0.92) set(x, y, T.TREE);
      else if (get(x, y) === T.GRASS && rand(x, y, 7) > 0.96) set(x, y, T.ROCK);
    }
  }
  // Zone 4
  for (let y = 28; y <= 44; y++) {
    for (let x = 3; x <= 23; x++) {
      if (isSafe(x, y)) continue;
      if (get(x, y) === T.GRASS && rand(x, y, 8) > 0.92) set(x, y, T.TREE);
      else if (get(x, y) === T.GRASS && rand(x, y, 9) > 0.96) set(x, y, T.ROCK);
    }
  }

  // ── Guarantee player spawn in Zone 1 is always clear ─────────────────────
  set(3, 4, T.GRASS);
  set(4, 4, T.GRASS);
  set(3, 5, T.GRASS);
  set(4, 5, T.GRASS);

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
