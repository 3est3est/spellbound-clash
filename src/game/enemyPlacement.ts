export interface PlacedEnemy {
  tx: number;
  ty: number;
}

// Only 3 enemies, each placed at a very different corner of the
// map so the player has to truly explore to find them all.
const PATH_SPOTS: [number, number][] = [
  [8, 4],    // West — near the player's start area
  [30, 8],   // North-east — deep in the eastern woods
  [10, 23],  // South — at the bottom of the map
];

export function getSpacedPathPoints(count: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    points.push(PATH_SPOTS[i % PATH_SPOTS.length]);
  }
  return points;
}
