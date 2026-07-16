import { COLORS, SCALE, TILE, type Dir } from './constants';
import { type SpriteSheet, SPRITE_MAP, getSheet, PROC_SHEET } from './sprites';

// All canvas drawing helpers. Everything is drawn with image smoothing OFF
// so the pixel art stays crisp no matter the scale.

export function prepareCtx(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = false;
}

// Draw a single sprite frame from a real sheet. `scaleBoost` enlarges the
// drawn frame around its tile anchor (used for the focused duel view).
export function drawSheetFrame(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  col: number,
  row: number,
  screenX: number,
  screenY: number,
  scaleBoost = 1
) {
  if (!sheet.image) return;
  const ax = screenX + (sheet.frameW * SCALE) / 2;
  const ay = screenY + sheet.frameH * SCALE;
  ctx.save();
  ctx.translate(ax, ay);
  ctx.scale(scaleBoost, scaleBoost);
  ctx.translate(-ax, -ay);
  ctx.drawImage(
    sheet.image,
    col * sheet.frameW,
    row * sheet.frameH,
    sheet.frameW,
    sheet.frameH,
    Math.round(screenX),
    Math.round(screenY),
    sheet.frameW * SCALE,
    sheet.frameH * SCALE
  );
  ctx.restore();
}

// ---- Smart draw wrappers ----
// These pick the real sprite sheet frame when one is registered & enabled,
// otherwise fall back to the procedural (code-drawn) shape. Call these from
// the canvas instead of the procedural helpers directly.

function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  ref: { sheet: string; col: number; row: number },
  screenX: number,
  screenY: number,
  scaleBoost = 1
): boolean {
  if (ref.sheet === PROC_SHEET) return false;
  const sheet = getSheet(ref.sheet);
  if (!sheet || !sheet.ready || !sheet.image) return false;
  drawSheetFrame(ctx, sheet, ref.col, ref.row, Math.round(screenX), Math.round(screenY), scaleBoost);
  return true;
}

export function drawHero(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  dir: Dir,
  frame: number,
  moving: boolean,
  scaleBoost = 1
) {
  const ref = moving
    ? SPRITE_MAP.hero.walk(dir, frame)
    : SPRITE_MAP.hero.idle(dir);
  if (!drawSpriteFrame(ctx, ref, screenX, screenY, scaleBoost)) {
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
  scaleBoost = 1
) {
  const ref = SPRITE_MAP.enemy.idle(frame);
  if (!drawSpriteFrame(ctx, ref, screenX, screenY, scaleBoost)) {
    if (scaleBoost === 1) drawProceduralEnemy(ctx, screenX, screenY, frame, hit);
    else drawProceduralEnemyScaled(ctx, screenX, screenY, frame, hit, scaleBoost);
  }
}

// ---- Procedural fallback sprites (code-drawn, no assets needed) ----

function shadow(ctx: CanvasRenderingContext2D, cx: number, baseY: number, w: number) {
  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, (w * SCALE) / 2, (w * SCALE) / 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

// A tiny wizard hero drawn from boxes. `frame` adds a 1px bob for walking.
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

  // Robe (body)
  ctx.fillStyle = COLORS.hero;
  ctx.fillRect(x + 3 * s, y + 7 * s, 10 * s, 8 * s);
  ctx.fillStyle = COLORS.heroDark;
  ctx.fillRect(x + 3 * s, y + 13 * s, 10 * s, 2 * s);

  // Head
  ctx.fillStyle = COLORS.heroSkin;
  ctx.fillRect(x + 4 * s, y + 4 * s, 8 * s, 5 * s);

  // Eyes (facing)
  ctx.fillStyle = '#1f2937';
  const eyeY = y + 6 * s;
  if (dir === 'down') {
    ctx.fillRect(x + 5 * s, eyeY, 1 * s, 2 * s);
    ctx.fillRect(x + 10 * s, eyeY, 1 * s, 2 * s);
  } else if (dir === 'left') {
    ctx.fillRect(x + 5 * s, eyeY, 1 * s, 2 * s);
  } else if (dir === 'right') {
    ctx.fillRect(x + 10 * s, eyeY, 1 * s, 2 * s);
  } else {
    // up: back of head, no eyes
  }

  // Wizard hat (wide brim + cone)
  ctx.fillStyle = COLORS.heroHat;
  ctx.fillRect(x + 2 * s, y + 3 * s, 12 * s, 1 * s);
  ctx.fillRect(x + 6 * s, y + 0 * s, 4 * s, 3 * s);

  // Gold star on hat
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + 7 * s, y + 1 * s, 2 * s, 1 * s);
}

// A small red imp-like enemy. `frame` makes it gently bob.
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

  // Body
  ctx.fillStyle = hit ? '#ffffff' : COLORS.enemy;
  ctx.fillRect(x + 3 * s, y + 5 * s, 10 * s, 9 * s);
  ctx.fillStyle = hit ? '#ffd2d2' : COLORS.enemyDark;
  ctx.fillRect(x + 3 * s, y + 11 * s, 10 * s, 3 * s);

  // Head
  ctx.fillStyle = hit ? '#ffffff' : COLORS.enemy;
  ctx.fillRect(x + 4 * s, y + 2 * s, 8 * s, 5 * s);

  // Horns
  ctx.fillStyle = COLORS.enemyDark;
  ctx.fillRect(x + 3 * s, y + 1 * s, 2 * s, 2 * s);
  ctx.fillRect(x + 11 * s, y + 1 * s, 2 * s, 2 * s);

  // Glowing eyes
  ctx.fillStyle = COLORS.enemyEye;
  ctx.fillRect(x + 5 * s, y + 4 * s, 2 * s, 2 * s);
  ctx.fillRect(x + 9 * s, y + 4 * s, 2 * s, 2 * s);
}

// Same enemy but drawn at an arbitrary scale multiplier (e.g. 1.6× during a
// focused duel). Keeps it centered on the same tile anchor.
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

// Same hero drawn at an arbitrary scale multiplier.
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

// A dedicated, full-screen battle arena drawn behind the duel — bright,
// cheerful grassland with a soft horizon, so the fight reads as its own
// "screen" rather than the exploration map.
export function drawBattleBackground(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  now: number
) {
  const s = SCALE;
  // Sky gradient (top) → distant hills → bright grass floor.
  const sky = ctx.createLinearGradient(0, 0, 0, vh * 0.45);
  sky.addColorStop(0, '#bfe9ff');
  sky.addColorStop(1, '#e8f7ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, vw, vh * 0.45);

  // Rolling hills
  ctx.fillStyle = '#8fd06a';
  ctx.beginPath();
  ctx.moveTo(0, vh * 0.42);
  for (let x = 0; x <= vw; x += 16 * s) {
    const y = vh * 0.42 + Math.sin(x / (40 * s)) * 6 * s;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(vw, vh * 0.5);
  ctx.lineTo(0, vh * 0.5);
  ctx.closePath();
  ctx.fill();

  // Grass floor
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, vh * 0.45, vw, vh * 0.55);
  // Subtle grass speckles
  ctx.fillStyle = COLORS.grassDark;
  for (let i = 0; i < 60; i++) {
    const gx = (i * 53) % vw;
    const gy = vh * 0.48 + ((i * 37) % (vh * 0.5));
    ctx.fillRect(gx, gy, 2 * s, 2 * s);
  }

  // A couple of decorative clouds drifting slowly.
  const cloud = (cx: number, cy: number, sc: number) => {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(cx, cy, 10 * s * sc, 4 * s * sc);
    ctx.fillRect(cx + 3 * s * sc, cy - 3 * s * sc, 6 * s * sc, 4 * s * sc);
    ctx.fillRect(cx + 7 * s * sc, cy + 1 * s * sc, 5 * s * sc, 3 * s * sc);
  };
  const drift = (now / 60) % (vw + 80 * s);
  cloud(vw - drift, vh * 0.12, 1.2);
  cloud((vw * 0.5 - drift * 0.6 + vw) % (vw + 80 * s), vh * 0.22, 0.9);
}

// Draw a tile from the procedural palette (no sheet needed).
export function drawProceduralTile(
  ctx: CanvasRenderingContext2D,
  code: number,
  screenX: number,
  screenY: number
) {
  const s = SCALE;
  const x = Math.round(screenX);
  const y = Math.round(screenY);
  const full = TILE * s;

  switch (code) {
    case 0: // grass
      ctx.fillStyle = COLORS.grass;
      ctx.fillRect(x, y, full, full);
      ctx.fillStyle = COLORS.grassDark;
      ctx.fillRect(x + 3 * s, y + 4 * s, 2 * s, 2 * s);
      ctx.fillRect(x + 10 * s, y + 9 * s, 2 * s, 2 * s);
      break;
    case 1: // path
      ctx.fillStyle = COLORS.path;
      ctx.fillRect(x, y, full, full);
      ctx.fillStyle = COLORS.pathDark;
      ctx.fillRect(x + 4 * s, y + 6 * s, 3 * s, 3 * s);
      ctx.fillRect(x + 11 * s, y + 3 * s, 2 * s, 2 * s);
      break;
    case 2: // tree
      ctx.fillStyle = COLORS.grass;
      ctx.fillRect(x, y, full, full);
      ctx.fillStyle = COLORS.treeTrunk;
      ctx.fillRect(x + 6 * s, y + 10 * s, 4 * s, 6 * s);
      ctx.fillStyle = COLORS.tree;
      ctx.fillRect(x + 1 * s, y + 1 * s, 14 * s, 11 * s);
      ctx.fillStyle = COLORS.treeDark;
      ctx.fillRect(x + 1 * s, y + 9 * s, 14 * s, 3 * s);
      break;
    case 3: // rock
      ctx.fillStyle = COLORS.grass;
      ctx.fillRect(x, y, full, full);
      ctx.fillStyle = COLORS.rock;
      ctx.fillRect(x + 3 * s, y + 6 * s, 10 * s, 8 * s);
      ctx.fillStyle = COLORS.rockDark;
      ctx.fillRect(x + 3 * s, y + 11 * s, 10 * s, 3 * s);
      break;
    case 4: // water
      ctx.fillStyle = COLORS.water;
      ctx.fillRect(x, y, full, full);
      ctx.fillStyle = COLORS.waterDark;
      ctx.fillRect(x + 2 * s, y + 5 * s, 5 * s, 2 * s);
      ctx.fillRect(x + 9 * s, y + 10 * s, 5 * s, 2 * s);
      break;
    case 5: // flower
      ctx.fillStyle = COLORS.grass;
      ctx.fillRect(x, y, full, full);
      ctx.fillStyle = COLORS.flower;
      ctx.fillRect(x + 7 * s, y + 6 * s, 3 * s, 3 * s);
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(x + 8 * s, y + 7 * s, 1 * s, 1 * s);
      break;
    default:
      ctx.fillStyle = COLORS.grass;
      ctx.fillRect(x, y, full, full);
  }
}
