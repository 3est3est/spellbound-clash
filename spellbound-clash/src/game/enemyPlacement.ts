export interface ZoneEnemySpec {
  name: string;
  pos: [number, number];
  zone: 1 | 2 | 3 | 4;
}

export const ZONE_ENEMIES: ZoneEnemySpec[] = [
  // Zone 1: Emerald Forest
  { name: 'ก็อบลินเงา', pos: [8, 5], zone: 1 },
  { name: 'วิญญาณแห่งป่า', pos: [18, 14], zone: 1 },
  { name: 'สไลม์พิษ', pos: [8, 16], zone: 1 },

  // Zone 2: Golden Autumn & Desert
  { name: 'โทรลล์ใบไม้ร่วง', pos: [40, 6], zone: 2 },
  { name: 'ปีศาจทะเลทราย', pos: [49, 15], zone: 2 },
  { name: 'แมงมุมถ้ำส้ม', pos: [42, 18], zone: 2 },

  // Zone 3: Frostbite Ridge
  { name: 'ค้างคาวน้ำแข็ง', pos: [43, 33], zone: 3 },
  { name: 'อสูรหิมะ', pos: [49, 40], zone: 3 },
  { name: 'หมาป่าเหมันต์', pos: [35, 41], zone: 3 },

  // Zone 4: Volcanic Wasteland
  { name: 'มังกรเพลิงเถ้า', pos: [14, 31], zone: 4 },
  { name: 'โกเลมลาวา', pos: [5, 42], zone: 4 },
  { name: 'จอมมารเงามืด', pos: [16, 42], zone: 4 },
];

export function getZoneEnemies(count: number): ZoneEnemySpec[] {
  return ZONE_ENEMIES.slice(0, count);
}
