import type { SheetConfig, CharLayout } from './heroSprites';

export const ENEMY_SHEET_CONFIG: SheetConfig = {
  name: 'enemy',
  url: '/assets/gen/enemy/enemy_goblin.png',
  frameW: 32,
  frameH: 32,
  enabled: true,
  colorKey: null,
  singleFrame: true,
  walkUrl: '/assets/gen/enemy/goblin-walk.png',
  walkFrameW: 32,
  walkFrameH: 32,
  walkFrames: 4,
  battleUrl: '/assets/gen/enemy/goblin-battle.png',
  battleFrameW: 512,
  battleFrameH: 512,
  castBattleUrl: '/assets/gen/enemy/goblin-cast-battle.png',
  castBattleFrameW: 512,
  castBattleFrameH: 512,
  hurtBattleUrl: '/assets/gen/enemy/goblin-hurt-battle.png',
  hurtBattleFrameW: 512,
  hurtBattleFrameH: 512,
};

export const ENEMY_LAYOUT: CharLayout = {
  sheet: 'enemy',
  col: 0,
  row: 39,
  walkFrames: 6,
  dirRow: [0, 1, 2, 3],
};
