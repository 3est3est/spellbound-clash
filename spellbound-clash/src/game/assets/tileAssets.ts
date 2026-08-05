import { loadAsset, loadAssets } from './AssetLoader';

const TREE_ROOT = '/assets/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees';
const BUSH_ROOT = '/assets/craftpix-net-141354-free-top-down-bushes-pixel-art/PNG/Assets';
const NATURE_ROOT = '/assets/craftpix-net-823949-free-nature-backgrounds-pixel-art';

// Zone 1: Green Forest
const ZONE1_TREE_NAMES = [
  'Tree1', 'Tree2', 'Tree3',
  'Moss_tree1', 'Moss_tree2', 'Moss_tree3',
  'Fruit_tree1', 'Fruit_tree2', 'Fruit_tree3',
  'Flower_tree1', 'Flower_tree2', 'Flower_tree3',
];
export const zone1Trees = loadAssets(ZONE1_TREE_NAMES.map((n) => `${TREE_ROOT}/${n}.png`));

const ZONE1_BUSH_NAMES = [
  'Bush_blue_flowers1', 'Bush_blue_flowers2', 'Bush_blue_flowers3',
  'Bush_pink_flowers1', 'Bush_pink_flowers2', 'Bush_pink_flowers3',
  'Bush_red_flowers1', 'Bush_red_flowers2', 'Bush_red_flowers3',
  'Bush_simple1_1', 'Bush_simple1_2', 'Bush_simple1_3',
  'Fern1_1', 'Fern1_2', 'Fern1_3',
];
export const zone1Bushes = loadAssets(ZONE1_BUSH_NAMES.map((n) => `${BUSH_ROOT}/${n}.png`));

// Zone 2: Autumn & Desert
const ZONE2_TREE_NAMES = [
  'Autumn_tree1', 'Autumn_tree2', 'Autumn_tree3',
  'Palm_tree1_1', 'Palm_tree1_2', 'Palm_tree1_3',
  'Palm_tree2_1', 'Palm_tree2_2', 'Palm_tree2_3',
];
export const zone2Trees = loadAssets(ZONE2_TREE_NAMES.map((n) => `${TREE_ROOT}/${n}.png`));

const ZONE2_BUSH_NAMES = [
  'Autumn_bush1', 'Autumn_bush2', 'Autumn_bush3',
  'Bush_orange_flowers1', 'Bush_orange_flowers2', 'Bush_orange_flowers3',
  'Cactus1_1', 'Cactus1_2', 'Cactus1_3',
  'Cactus2_1', 'Cactus2_2', 'Cactus2_3',
];
export const zone2Bushes = loadAssets(ZONE2_BUSH_NAMES.map((n) => `${BUSH_ROOT}/${n}.png`));

// Zone 3: Snowy Frostland
const ZONE3_TREE_NAMES = [
  'Snow_tree1', 'Snow_tree2', 'Snow_tree3',
  'Snow_christmass_tree1', 'Snow_christmass_tree2', 'Snow_christmass_tree3',
  'Christmas_tree1', 'Christmas_tree2', 'Christmas_tree3',
];
export const zone3Trees = loadAssets(ZONE3_TREE_NAMES.map((n) => `${TREE_ROOT}/${n}.png`));

const ZONE3_BUSH_NAMES = [
  'Snow_bush1', 'Snow_bush2', 'Snow_bush3',
  'Bush_simple2_1', 'Bush_simple2_2', 'Bush_simple2_3',
];
export const zone3Bushes = loadAssets(ZONE3_BUSH_NAMES.map((n) => `${BUSH_ROOT}/${n}.png`));

// Zone 4: Burned & Broken Wasteland
const ZONE4_TREE_NAMES = [
  'Burned_tree1', 'Burned_tree2', 'Burned_tree3',
  'Broken_tree1', 'Broken_tree2', 'Broken_tree3', 'Broken_tree4',
  'Broken_tree5', 'Broken_tree6', 'Broken_tree7',
];
export const zone4Trees = loadAssets(ZONE4_TREE_NAMES.map((n) => `${TREE_ROOT}/${n}.png`));

const ZONE4_BUSH_NAMES = [
  'Burned_tree1', 'Burned_tree2',
  'Broken_tree1', 'Broken_tree2',
  'Fern2_1', 'Fern2_2', 'Fern2_3',
];
export const zone4Bushes = loadAssets(ZONE4_BUSH_NAMES.map((n) => `${BUSH_ROOT}/${n}.png`));

// Legacy export compatibility
export const forestTrees = zone1Trees;
export const forestUndergrowth = zone1Bushes;

export const waterSparkles = loadAsset(
  '/assets/mana seed seasonal forest sample (summer)/seasonal water animations/summer water sparkles B 16x16.png'
);

export const natureBgs = loadAssets(
  Array.from({ length: 8 }, (_, i) => `${NATURE_ROOT}/nature_${i + 1}/orig.png`)
);

let currentNatureBg = -1;

export function setNatureBg(index: number) {
  currentNatureBg = index;
}

export function getNatureBg(): number {
  return currentNatureBg;
}

export function pickRandomNatureBg(): number {
  return Math.floor(Math.random() * natureBgs.length);
}
