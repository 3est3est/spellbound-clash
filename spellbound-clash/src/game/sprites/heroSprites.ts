export interface SheetConfig {
  name: string;
  url: string;
  frameW: number;
  frameH: number;
  enabled: boolean;
  colorKey: string | null;
  /** Image is a single frame, not a multi-frame grid sheet. Row/col ignored. */
  singleFrame?: boolean;
  /** Optional higher-res image used for battle/cutscene close-ups. */
  battleUrl?: string;
  battleFrameW?: number;
  battleFrameH?: number;
  /** Number of walk animation frames in a horizontal row (default 1). */
  walkFrames?: number;
  /** Optional horizontal walk-cycle frame strip used only while moving on the map (e.g. `player-walk.png` 128x32). When set, `walk` uses this sheet; `idle` keeps using `url`. */
  walkUrl?: string;
  walkFrameW?: number;
  walkFrameH?: number;
  /** Optional casting pose image used when the character attacks in battle. */
  castUrl?: string;
  castFrameW?: number;
  castFrameH?: number;
  castBattleUrl?: string;
  castBattleFrameW?: number;
  castBattleFrameH?: number;
  /** Optional hurt/damage pose used when the character gets hit in battle. */
  hurtBattleUrl?: string;
  hurtBattleFrameW?: number;
  hurtBattleFrameH?: number;
}

export interface CharLayout {
  sheet: string;
  col: number;
  row: number;
  walkFrames: number;
  dirRow: [number, number, number, number];
}

export const HERO_SHEET_CONFIG: SheetConfig = {
  name: 'hero',
  url: '/assets/gen/player/player.png',
  frameW: 32,
  frameH: 32,
  enabled: true,
  colorKey: null,
  singleFrame: true,
  walkUrl: '/assets/gen/player/player-walk.png',
  walkFrameW: 32,
  walkFrameH: 32,
  walkFrames: 4,
  battleUrl: '/assets/gen/player/player-battle.png',
  battleFrameW: 512,
  battleFrameH: 512,
  castBattleUrl: '/assets/gen/player/player-cast-battle.png',
  castBattleFrameW: 512,
  castBattleFrameH: 512,
  hurtBattleUrl: '/assets/gen/player/player-hurt-battle.png',
  hurtBattleFrameW: 512,
  hurtBattleFrameH: 512,
};

export const HERO_LAYOUT: CharLayout = {
  sheet: 'hero',
  col: 0,
  row: 39,
  walkFrames: 6,
  dirRow: [0, 1, 2, 3],
};
