import { HERO_SHEET_CONFIG } from './heroSprites';
import { ENEMY_SHEET_CONFIG } from './enemySprites';

export interface SpriteSheet {
  name: string;
  image: HTMLImageElement | null;
  frameW: number;
  frameH: number;
  ready: boolean;
}

const sheets: Record<string, SpriteSheet> = {};
export const PROC_SHEET = '__proc';

function applyColorKey(img: HTMLImageElement, key: string): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const r = parseInt(key.slice(1, 3), 16);
  const g = parseInt(key.slice(3, 5), 16);
  const b = parseInt(key.slice(5, 7), 16);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    if (
      Math.abs(px[i] - r) < 40 &&
      Math.abs(px[i + 1] - g) < 40 &&
      Math.abs(px[i + 2] - b) < 40
    ) {
      px[i + 3] = 0;
    }
  }
  ctx.putImageData(data, 0, 0);
  const out = new Image();
  out.src = canvas.toDataURL();
  return out;
}

export function registerSheet(
  name: string,
  url: string,
  frameW = 16,
  frameH = 16,
  colorKey: string | null = null
): SpriteSheet {
  const sheet: SpriteSheet = {
    name,
    image: null,
    frameW,
    frameH,
    ready: false,
  };
  sheets[name] = sheet;

  const img = new Image();
  img.onload = () => {
    const finalImg = colorKey ? applyColorKey(img, colorKey) : img;
    finalImg.onload = () => {
      sheet.image = finalImg;
      sheet.ready = true;
    };
    if (!colorKey) {
      sheet.image = img;
      sheet.ready = true;
    }
  };
  img.src = url;
  return sheet;
}

export function getSheet(name: string): SpriteSheet | null {
  return sheets[name] ?? null;
}

const contentCache = new Map<string, boolean>();

export function sheetFrameHasContent(
  sheet: SpriteSheet,
  col: number,
  row: number,
  tolerance = 40,
  key = '#9ba0ab'
): boolean {
  if (!sheet.image) return false;
  const cacheKey = `${sheet.name}:${col}:${row}:${tolerance}:${key}`;
  const cached = contentCache.get(cacheKey);
  if (cached !== undefined) return cached;
  const img = sheet.image;
  const cw = sheet.frameW;
  const ch = sheet.frameH;
  const x0 = col * cw;
  const y0 = row * ch;
  if (x0 + cw > img.naturalWidth || y0 + ch > img.naturalHeight) {
    contentCache.set(cacheKey, false);
    return false;
  }
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, x0, y0, cw, ch, 0, 0, cw, ch);
  const d = ctx.getImageData(0, 0, cw, ch).data;
  const r = parseInt(key.slice(1, 3), 16);
  const g = parseInt(key.slice(3, 5), 16);
  const b = parseInt(key.slice(5, 7), 16);
  let content = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 10) continue;
    if (
      Math.abs(d[i] - r) >= tolerance ||
      Math.abs(d[i + 1] - g) >= tolerance ||
      Math.abs(d[i + 2] - b) >= tolerance
    ) {
      content++;
    }
  }
  const result = content > cw * ch * 0.05;
  contentCache.set(cacheKey, result);
  return result;
}

// Pre-register configured sprite sheets
const SHEETS = [HERO_SHEET_CONFIG, ENEMY_SHEET_CONFIG];
for (const s of SHEETS) {
  registerSheet(s.name, s.url, s.frameW, s.frameH, s.colorKey);
  if (s.enabled && s.walkUrl) {
    registerSheet(`${s.name}-walk`, s.walkUrl, s.walkFrameW ?? s.frameW, s.walkFrameH ?? s.frameH, s.colorKey);
  }
  if (s.enabled && s.battleUrl) {
    registerSheet(`${s.name}-battle`, s.battleUrl, s.battleFrameW ?? s.frameW, s.battleFrameH ?? s.frameH, s.colorKey);
  }
  if (s.enabled && s.castUrl) {
    registerSheet(`${s.name}-cast`, s.castUrl, s.castFrameW ?? s.frameW, s.castFrameH ?? s.frameH, s.colorKey);
  }
  if (s.enabled && s.castBattleUrl) {
    registerSheet(`${s.name}-cast-battle`, s.castBattleUrl, s.castBattleFrameW ?? s.castFrameW ?? s.frameW, s.castBattleFrameH ?? s.castFrameH ?? s.frameH, s.colorKey);
  }
  if (s.enabled && s.hurtBattleUrl) {
    registerSheet(`${s.name}-hurt-battle`, s.hurtBattleUrl, s.hurtBattleFrameW ?? s.frameW, s.hurtBattleFrameH ?? s.frameH, s.colorKey);
  }
}
