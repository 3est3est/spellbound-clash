export interface SheetConfig {
  name: string;
  url: string;
  frameW: number;
  frameH: number;
  enabled: boolean;
  colorKey: string | null;
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
  url: '/sprites/player_new.png',
  frameW: 64,
  frameH: 64,
  enabled: false,
  colorKey: null,
};

export const HERO_LAYOUT: CharLayout = {
  sheet: 'hero',
  col: 0,
  row: 39,
  walkFrames: 6,
  dirRow: [0, 1, 2, 3],
};
