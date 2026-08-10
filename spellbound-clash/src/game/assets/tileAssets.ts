import { loadAsset, loadAssets } from './AssetLoader';

// AI-generated assets live under /assets/gen/zones/. Zone decoration arrays are
// filled from generated sprites; painted floors sized to the tile (48px).

const z = (name: string) => `/assets/gen/zones/${name}.png`;

export const zone1Trees = loadAssets([z('z1-tree0-32'), z('z1-tree1-32')]);
export const zone1Bushes = loadAssets([z('z1-bush0-32')]);
export const zone1Rocks = loadAssets([z('z1-rock0-32')]);
export const zone1Flowers = loadAssets([z('z1-flower0-32')]);
export const zone1Floor = loadAsset(z('z1-floor-48'));

export const zone2Trees = loadAssets([z('z2-tree0-32'), z('z2-tree1-32')]);
export const zone2Bushes = loadAssets([z('z2-bush0-32')]);
export const zone2Rocks = loadAssets([z('z2-rock0-32')]);
export const zone2Flowers = loadAssets([z('z2-flower0-32')]);
export const zone2Floor = loadAsset(z('z2-floor-48'));

export const zone3Trees = loadAssets([z('z3-tree0-32'), z('z3-tree1-32')]);
export const zone3Bushes = loadAssets([z('z3-bush0-32')]);
export const zone3Rocks = loadAssets([z('z3-rock0-32')]);
export const zone3Flowers = loadAssets([z('z3-flower0-32')]);
export const zone3Floor = loadAsset(z('z3-floor-48'));

export const zone4Trees = loadAssets([z('z4-tree0-32'), z('z4-tree1-32')]);
export const zone4Bushes = loadAssets([z('z4-bush0-32')]);
export const zone4Rocks = loadAssets([z('z4-rock0-32')]);
export const zone4Flowers = loadAssets([z('z4-flower0-32')]);
export const zone4Floor = loadAsset(z('z4-floor-48'));

export const zone1Path = loadAsset(z('z1-path-48'));
export const zone2Path = loadAsset(z('z2-path-48'));
export const zone3Path = loadAsset(z('z3-path-48'));
export const zone4Path = loadAsset(z('z4-path-48'));

export const zone1Water = loadAsset(z('z1-water-48'));
export const zone2Water = loadAsset(z('z2-water-48'));
export const zone3Water = loadAsset(z('z3-water-48'));
export const zone4Water = loadAsset(z('z4-water-48'));

export const caveEntrance = loadAsset(z('z5-cave-48'));
export const gateBarrier = loadAsset(z('z6-barrier-96'));

// Legacy export compatibility
export const forestTrees = zone1Trees;
export const forestUndergrowth = zone1Bushes;

export const waterSparkles = loadAsset('');

export const natureBgs = loadAssets([z('z1-battle-bg'), z('z2-battle-bg'), z('z3-battle-bg'), z('z4-battle-bg')]);

export function getNatureBg(zone: number): number {
  const idx = zone - 1;
  if (idx >= 0 && idx < natureBgs.length) return idx;
  return -1;
}