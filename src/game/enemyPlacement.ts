// Enemy placement for the 2D map. Returns tile coordinates so enemies sit
// on walkable path tiles near the player's start. Kept separate from the
// tilemap so the store can place them without importing rendering code.

export interface PlacedEnemy {
  tx: number;
  ty: number;
}

// A few hand-picked spots along the S-path in tilemap.ts, ordered by distance
// from the player's start (3,3) so battles trigger in a natural sequence.
const PATH_SPOTS: [number, number][] = [
  [7, 7],
  [12, 10],
  [7, 15],
];

export function getSpacedPathPoints(count: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    points.push(PATH_SPOTS[i % PATH_SPOTS.length]);
  }
  return points;
}
