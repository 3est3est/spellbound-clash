import { COLORS, SCALE, TILE, type Dir } from '../constants';
import { type SpriteSheet, getSheet, PROC_SHEET, SPRITE_MAP } from '../sprites';

export function drawSheetFrame(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  col: number,
  row: number,
  screenX: number,
  screenY: number,
  scaleBoost = 1,
  flip = false
) {
  if (!sheet.image) return;
  const unit = TILE * SCALE;
  const cx = screenX + unit / 2;
  const ay = screenY + unit;
  ctx.save();
  ctx.translate(cx, ay);
  if (flip) ctx.scale(-1, 1);
  ctx.scale(scaleBoost, scaleBoost);
  ctx.translate(-cx, -ay);
  ctx.drawImage(
    sheet.image,
    col * sheet.frameW,
    row * sheet.frameH,
    sheet.frameW,
    sheet.frameH,
    Math.round(screenX),
    Math.round(screenY),
    unit,
    unit
  );
  ctx.restore();
}

function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  ref: { sheet: string; col: number; row: number },
  screenX: number,
  screenY: number,
  scaleBoost = 1,
  flip = false
): boolean {
  if (ref.sheet === PROC_SHEET) return false;
  const sheet = getSheet(ref.sheet);
  if (!sheet || !sheet.ready || !sheet.image) return false;
  drawSheetFrame(ctx, sheet, ref.col, ref.row, Math.round(screenX), Math.round(screenY), scaleBoost, flip);
  return true;
}

function shadow(ctx: CanvasRenderingContext2D, cx: number, baseY: number, w: number) {
  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, (w * SCALE) / 2, (w * SCALE) / 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawProceduralHero(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  dir: Dir,
  frame: number,
  moving: boolean
) {
  const s = SCALE;
  const bob = moving ? (frame % 2 === 0 ? 0 : -1) * s : 0;
  const x = Math.round(screenX);
  const y = Math.round(screenY + bob);

  shadow(ctx, x + (TILE * s) / 2, y + TILE * s, TILE * 0.8);

  ctx.fillStyle = COLORS.hero;
  ctx.fillRect(x + 3 * s, y + 7 * s, 10 * s, 8 * s);
  ctx.fillStyle = COLORS.heroDark;
  ctx.fillRect(x + 3 * s, y + 13 * s, 10 * s, 2 * s);

  ctx.fillStyle = COLORS.heroSkin;
  ctx.fillRect(x + 4 * s, y + 4 * s, 8 * s, 5 * s);

  ctx.fillStyle = '#1f2937';
  const eyeY = y + 6 * s;
  if (dir === 'down') {
    ctx.fillRect(x + 5 * s, eyeY, 1 * s, 2 * s);
    ctx.fillRect(x + 10 * s, eyeY, 1 * s, 2 * s);
  } else if (dir === 'left') {
    ctx.fillRect(x + 5 * s, eyeY, 1 * s, 2 * s);
  } else if (dir === 'right') {
    ctx.fillRect(x + 10 * s, eyeY, 1 * s, 2 * s);
  }

  ctx.fillStyle = COLORS.heroHat;
  ctx.fillRect(x + 2 * s, y + 3 * s, 12 * s, 1 * s);
  ctx.fillRect(x + 6 * s, y + 0 * s, 4 * s, 3 * s);

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + 7 * s, y + 1 * s, 2 * s, 1 * s);
}

export function drawProceduralEnemy(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  frame: number,
  hit: boolean
) {
  const s = SCALE;
  const bob = frame % 2 === 0 ? 0 : -1 * s;
  const x = Math.round(screenX);
  const y = Math.round(screenY + bob);

  shadow(ctx, x + (TILE * s) / 2, y + TILE * s, TILE * 0.8);

  ctx.fillStyle = hit ? '#ffffff' : COLORS.enemy;
  ctx.fillRect(x + 3 * s, y + 5 * s, 10 * s, 9 * s);
  ctx.fillStyle = hit ? '#ffd2d2' : COLORS.enemyDark;
  ctx.fillRect(x + 3 * s, y + 11 * s, 10 * s, 3 * s);

  ctx.fillStyle = hit ? '#ffffff' : COLORS.enemy;
  ctx.fillRect(x + 4 * s, y + 2 * s, 8 * s, 5 * s);

  ctx.fillStyle = COLORS.enemyDark;
  ctx.fillRect(x + 3 * s, y + 1 * s, 2 * s, 2 * s);
  ctx.fillRect(x + 11 * s, y + 1 * s, 2 * s, 2 * s);

  ctx.fillStyle = COLORS.enemyEye;
  ctx.fillRect(x + 5 * s, y + 4 * s, 2 * s, 2 * s);
  ctx.fillRect(x + 9 * s, y + 4 * s, 2 * s, 2 * s);
}

export function drawProceduralEnemyScaled(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  frame: number,
  hit: boolean,
  scaleBoost: number
) {
  ctx.save();
  const anchorX = screenX + (TILE * SCALE) / 2;
  const anchorY = screenY + TILE * SCALE;
  ctx.translate(anchorX, anchorY);
  ctx.scale(scaleBoost, scaleBoost);
  ctx.translate(-anchorX, -anchorY);
  drawProceduralEnemy(ctx, screenX, screenY, frame, hit);
  ctx.restore();
}

export function drawProceduralHeroScaled(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  dir: Dir,
  frame: number,
  moving: boolean,
  scaleBoost: number
) {
  ctx.save();
  const anchorX = screenX + (TILE * SCALE) / 2;
  const anchorY = screenY + TILE * SCALE;
  ctx.translate(anchorX, anchorY);
  ctx.scale(scaleBoost, scaleBoost);
  ctx.translate(-anchorX, -anchorY);
  drawProceduralHero(ctx, screenX, screenY, dir, frame, moving);
  ctx.restore();
}

export function drawHero(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  dir: Dir,
  frame: number,
  moving: boolean,
  scaleBoost = 1,
  pose: 'idle' | 'walk' | 'attack' | 'auto' = 'auto'
) {
  const usePose = pose === 'auto' ? (moving ? 'walk' : 'idle') : pose;
  const ref =
    usePose === 'attack'
      ? SPRITE_MAP.hero.attack(dir, frame)
      : usePose === 'walk'
      ? SPRITE_MAP.hero.walk(dir, frame)
      : SPRITE_MAP.hero.idle(dir);
  const flip = dir === 'left';
  if (!drawSpriteFrame(ctx, ref, screenX, screenY, scaleBoost, flip)) {
    if (scaleBoost === 1) drawProceduralHero(ctx, screenX, screenY, dir, frame, moving);
    else drawProceduralHeroScaled(ctx, screenX, screenY, dir, frame, moving, scaleBoost);
  }
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  frame: number,
  hit: boolean,
  scaleBoost = 1,
  pose: 'idle' | 'walk' | 'attack' | 'auto' = 'auto',
  flip = false
) {
  const ref =
    pose === 'attack'
      ? SPRITE_MAP.enemy.attack(frame)
      : pose === 'walk'
      ? SPRITE_MAP.enemy.walk(frame)
      : SPRITE_MAP.enemy.idle();
  if (!drawSpriteFrame(ctx, ref, screenX, screenY, scaleBoost, flip)) {
    if (scaleBoost === 1) drawProceduralEnemy(ctx, screenX, screenY, frame, hit);
    else drawProceduralEnemyScaled(ctx, screenX, screenY, frame, hit, scaleBoost);
  }
}

export function drawNameTag(ctx: CanvasRenderingContext2D, cx: number, boxBottomY: number, name: string) {
  ctx.save();
  ctx.font = 'bold 12px "Press Start 2P", "Kanit", monospace';
  ctx.imageSmoothingEnabled = false;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const h = 16;
  const y = boxBottomY - h;

  ctx.fillStyle = '#000000';
  ctx.fillText(name, cx + 1, y + 1);
  ctx.fillText(name, cx + 2, y + 2);

  ctx.fillStyle = '#ff66aa';
  ctx.fillText(name, cx, y);

  ctx.restore();
}
