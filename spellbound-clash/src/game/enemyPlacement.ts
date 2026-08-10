export interface ZoneEnemySpec {
  name: string;
  pos: [number, number];
  zone: 1 | 2 | 3 | 4;
}

export const ZONE_ENEMIES: ZoneEnemySpec[] = [
  // Zone 1: Emerald Forest
  { name: 'ก็อบลิน', pos: [8, 5], zone: 1 },
  { name: 'ก็อบลิน', pos: [18, 14], zone: 1 },
  { name: 'ก็อบลิน', pos: [8, 16], zone: 1 },

  // Zone 2: Golden Autumn & Desert
  { name: 'แมงป่องร้าย', pos: [40, 6], zone: 2 },
  { name: 'แมงป่องร้าย', pos: [49, 15], zone: 2 },
  { name: 'แมงป่องร้าย', pos: [42, 18], zone: 2 },

  // Zone 3: Frostbite Ridge
  { name: 'หมีขาวอ้วน', pos: [43, 33], zone: 3 },
  { name: 'หมีขาวอ้วน', pos: [49, 40], zone: 3 },
  { name: 'หมีขาวอ้วน', pos: [35, 41], zone: 3 },

  // Zone 4: Volcanic Wasteland
  { name: 'ผู้กุมความตาย', pos: [14, 31], zone: 4 },
  { name: 'ผู้กุมความตาย', pos: [5, 42], zone: 4 },
  { name: 'ผู้กุมความตาย', pos: [16, 42], zone: 4 },
];

export function getZoneEnemies(count: number): ZoneEnemySpec[] {
  return ZONE_ENEMIES.slice(0, count);
}
