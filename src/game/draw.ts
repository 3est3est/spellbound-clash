import { COLORS, SCALE, TILE, T, type Dir } from './constants';
import { tileAt } from './tilemap';
import { type SpriteSheet, SPRITE_MAP, getSheet, PROC_SHEET } from './sprites';

const TREE_ROOT = '/assets/craftpix-net-385863-free-top-down-trees-pixel-art/PNG/Assets_separately/Trees';
const BUSH_ROOT = '/assets/craftpix-net-141354-free-top-down-bushes-pixel-art/PNG/Assets';
const NATURE_ROOT = '/assets/craftpix-net-823949-free-nature-backgrounds-pixel-art';

function loadAssets(paths: string[]): HTMLImageElement[] {
  return paths.map((path) => {
    const image = new Image();
    image.src = path;
    return image;
  });
}

// ── Expanded asset pools ─────────────────────────────────────────────
// All natural-looking tree and undergrowth variants from the asset packs,
// so every forest area feels rich and varied.
const TREE_NAMES = [
  'Tree1', 'Tree2', 'Tree3',
  'Moss_tree1', 'Moss_tree2', 'Moss_tree3',
  'Fruit_tree1', 'Fruit_tree2', 'Fruit_tree3',
  'Flower_tree1', 'Flower_tree2', 'Flower_tree3',
  'Autumn_tree1', 'Autumn_tree2', 'Autumn_tree3',
  'Palm_tree1_1', 'Palm_tree1_2', 'Palm_tree1_3',
  'Palm_tree2_1', 'Palm_tree2_2', 'Palm_tree2_3',
];
const forestTrees = loadAssets(TREE_NAMES.map(n => `${TREE_ROOT}/${n}.png`));

const BUSH_NAMES = [
  'Bush_blue_flowers1', 'Bush_blue_flowers2', 'Bush_blue_flowers3',
  'Bush_pink_flowers1', 'Bush_pink_flowers2', 'Bush_pink_flowers3',
  'Bush_orange_flowers1', 'Bush_orange_flowers2', 'Bush_orange_flowers3',
  'Bush_red_flowers1', 'Bush_red_flowers2', 'Bush_red_flowers3',
  'Bush_simple1_1', 'Bush_simple1_2', 'Bush_simple1_3',
  'Bush_simple2_1', 'Bush_simple2_2', 'Bush_simple2_3',
  'Fern1_1', 'Fern1_2', 'Fern1_3',
  'Fern2_1', 'Fern2_2', 'Fern2_3',
  'Autumn_bush1', 'Autumn_bush2', 'Autumn_bush3',
  'Snow_bush1', 'Snow_bush2', 'Snow_bush3',
  'Cactus1_1', 'Cactus1_2', 'Cactus1_3',
];
const forestUndergrowth = loadAssets(BUSH_NAMES.map(n => `${BUSH_ROOT}/${n}.png`));

const waterSparkles = new Image();
waterSparkles.src = '/assets/mana seed seasonal forest sample (summer)/seasonal water animations/summer water sparkles B 16x16.png';

// All canvas drawing helpers. Everything is drawn with image smoothing OFF
// so the pixel art stays crisp no matter the scale.

export function prepareCtx(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = false;
}

// Draw a single sprite frame from a real sheet. `scaleBoost` enlarges the
// drawn frame around its tile anchor (used for the focused duel view).
// The source frame (any pixel size) is scaled to fill one world tile
// (TILE*SCALE) on screen, so a 64px LPC cell and a 16px tile map identically.
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

// ---- Smart draw wrappers ----
// These pick the real sprite sheet frame when one is registered & enabled,
// otherwise fall back to the procedural (code-drawn) shape. Call these from
// the canvas instead of the procedural helpers directly.

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

export function drawHero(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  dir: Dir,
  frame: number,
  moving: boolean,
  scaleBoost = 1,
  pose: "idle" | "walk" | "attack" | "auto" = "auto"
) {
  const usePose = pose === "auto" ? (moving ? "walk" : "idle") : pose;
  const ref =
    usePose === "attack"
      ? SPRITE_MAP.hero.attack(dir, frame)
      : usePose === "walk"
      ? SPRITE_MAP.hero.walk(dir, frame)
      : SPRITE_MAP.hero.idle(dir);
  const flip = dir === "left";
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
  pose: "idle" | "walk" | "attack" | "auto" = "auto",
  flip = false
) {
  const ref =
    pose === "attack"
      ? SPRITE_MAP.enemy.attack(frame)
      : pose === "walk"
      ? SPRITE_MAP.enemy.walk(frame)
      : SPRITE_MAP.enemy.idle();
  if (!drawSpriteFrame(ctx, ref, screenX, screenY, scaleBoost, flip)) {
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

// ── Battle background: random nature scene ────────────────────────────
// One of 8 scenic nature backgrounds is picked randomly each session and
// drawn full-screen behind the duel arena so every fight has a unique
// natural backdrop.
const natureBgs = loadAssets(
  Array.from({ length: 8 }, (_, i) => `${NATURE_ROOT}/nature_${i + 1}/orig.png`)
);

let currentNatureBg = -1;

export function setNatureBg(index: number) {
  currentNatureBg = index;
}

export function pickRandomNatureBg(): number {
  return Math.floor(Math.random() * natureBgs.length);
}

export function drawBattleBackground(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  now: number
) {
  // Draw the selected nature backdrop full-screen if loaded.
  if (currentNatureBg >= 0 && currentNatureBg < natureBgs.length) {
    const img = natureBgs[currentNatureBg];
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, vw, vh);
      // Gentle dark vignette so UI pops.
      const vig = ctx.createRadialGradient(vw / 2, vh * 0.5, vh * 0.3, vw / 2, vh * 0.5, vh * 0.8);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, vw, vh);
      return;
    }
  }

  // Fallback: procedural twilight arena if no image loaded yet.
  const s = SCALE;
  const sky = ctx.createLinearGradient(0, 0, 0, vh * 0.6);
  sky.addColorStop(0, '#160d33');
  sky.addColorStop(0.5, '#2b1b5e');
  sky.addColorStop(1, '#3a2a7a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, vw, vh * 0.6);

  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 80; i++) {
    const sx = (i * 97.3) % vw;
    const sy = (i * 53.7) % (vh * 0.55);
    ctx.globalAlpha = (0.35 + 0.65 * Math.abs(Math.sin(now / 520 + i * 1.7))) * 0.85;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(255,245,210,0.9)';
  ctx.beginPath();
  ctx.arc(vw * 0.82, vh * 0.15, 7 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#211a47';
  ctx.beginPath();
  ctx.moveTo(0, vh * 0.6);
  for (let x = 0; x <= vw; x += 40)
    ctx.lineTo(x, vh * 0.6 - 40 * Math.abs(Math.sin(x / 180)) - 18);
  ctx.lineTo(vw, vh * 0.6);
  ctx.closePath();
  ctx.fill();

  const ground = ctx.createLinearGradient(0, vh * 0.55, 0, vh);
  ground.addColorStop(0, '#2a2150');
  ground.addColorStop(1, '#140e2c');
  ctx.fillStyle = ground;
  ctx.fillRect(0, vh * 0.55, vw, vh * 0.45);
}

function seeded(tx: number, ty: number, salt = 0): number {
  let h = Math.imul(tx + 1, 374761393) ^ Math.imul(ty + 1, 668265263) ^ Math.imul(salt + 1, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function readyAsset(list: HTMLImageElement[], tx: number, ty: number, salt: number): HTMLImageElement | null {
  const asset = list[Math.floor(seeded(tx, ty, salt) * list.length)];
  return asset?.complete && asset.naturalWidth > 0 ? asset : null;
}

function drawGrassBase(ctx: CanvasRenderingContext2D, x: number, y: number, full: number, tx: number, ty: number) {
  const tone = seeded(tx, ty, 1);
  ctx.fillStyle = tone > 0.7 ? '#91bc62' : tone > 0.34 ? '#84b85a' : '#78ac50';
  ctx.fillRect(x, y, full, full);

  for (let i = 0; i < 6; i++) {
    const px = Math.floor(seeded(tx, ty, 10 + i) * 14 + 1) * SCALE;
    const py = Math.floor(seeded(tx, ty, 20 + i) * 14 + 1) * SCALE;
    ctx.fillStyle = i % 2 ? '#639848' : '#acd178';
    ctx.fillRect(x + px, y + py, SCALE, SCALE * 2);
  }
}

function drawPath(ctx: CanvasRenderingContext2D, x: number, y: number, full: number, tx: number, ty: number) {
  const isBridge =
    (tileAt(tx - 1, ty) === T.WATER && tileAt(tx + 1, ty) === T.WATER) ||
    (tileAt(tx, ty - 1) === T.WATER && tileAt(tx, ty + 1) === T.WATER);
  if (isBridge) {
    ctx.fillStyle = '#7b5430';
    ctx.fillRect(x, y, full, full);
    ctx.fillStyle = '#c89b5c';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x, y + i * (full / 4) + SCALE, full, full / 4 - SCALE * 2);
    }
    ctx.fillStyle = '#e1bc76';
    ctx.fillRect(x, y + SCALE, full, SCALE);
    return;
  }
  ctx.fillStyle = seeded(tx, ty, 2) > 0.5 ? '#d7bd82' : '#cfb475';
  ctx.fillRect(x, y, full, full);
  ctx.fillStyle = '#b49862';
  for (let i = 0; i < 4; i++) {
    const px = Math.floor(seeded(tx, ty, 30 + i) * 13 + 1) * SCALE;
    const py = Math.floor(seeded(tx, ty, 40 + i) * 13 + 1) * SCALE;
    ctx.fillRect(x + px, y + py, SCALE * (i % 2 + 1), SCALE);
  }
  ctx.fillStyle = 'rgba(255,248,204,0.32)';
  ctx.fillRect(x, y, full, SCALE);
}

function drawWater(ctx: CanvasRenderingContext2D, x: number, y: number, full: number, tx: number, ty: number, now: number) {
  ctx.fillStyle = '#4baabd';
  ctx.fillRect(x, y, full, full);
  ctx.fillStyle = '#8de0de';
  const shift = Math.floor(now / 320) % 5;
  for (let i = 0; i < 3; i++) {
    const waveY = y + (3 + i * 5) * SCALE;
    const waveX = x + ((Math.floor(seeded(tx, ty, 50 + i) * 10) + shift) % 12) * SCALE;
    ctx.fillRect(waveX, waveY, (3 + (i % 2)) * SCALE, SCALE);
  }
  if (waterSparkles.complete && waterSparkles.naturalWidth > 0 && seeded(tx, ty, 61) > 0.56) {
    ctx.globalAlpha = 0.65;
    ctx.drawImage(waterSparkles, x, y, full, full);
    ctx.globalAlpha = 1;
  }
}

// Draw one stable forest tile using ground generated in code plus the user's
// supplied tree, bush, fern, flower, and water-sparkle assets.
export function drawForestTile(
  ctx: CanvasRenderingContext2D,
  code: number,
  tx: number,
  ty: number,
  screenX: number,
  screenY: number,
  now: number
) {
  const x = Math.round(screenX);
  const y = Math.round(screenY);
  const full = TILE * SCALE;

  if (code === 1) {
    drawPath(ctx, x, y, full, tx, ty);
    return;
  }
  if (code === 4) {
    drawWater(ctx, x, y, full, tx, ty, now);
    return;
  }

  drawGrassBase(ctx, x, y, full, tx, ty);

  if (code === 2) {
    const tree = readyAsset(forestTrees, tx, ty, 70);
    if (tree) {
      const size = full * (seeded(tx, ty, 71) > 0.72 ? 2.2 : 1.8);
      const offsetY = -SCALE * Math.floor(seeded(tx, ty, 72) * 4);
      ctx.drawImage(tree, x + (full - size) / 2, y + full - size + offsetY, size, size);
    }
    return;
  }

  if (code === 3) {
    const shade = seeded(tx, ty, 73);
    const rx = full * 0.18;
    ctx.fillStyle = shade > 0.5 ? '#5a6351' : '#6f786d';
    ctx.fillRect(x + rx, y + full * 0.35, full - rx * 2, full * 0.5);
    ctx.fillStyle = shade > 0.5 ? '#8a9b7a' : '#aeb59d';
    ctx.fillRect(x + rx + 4, y + full * 0.28, full - rx * 2 - 8, full * 0.35);
    ctx.fillStyle = '#4a5443';
    ctx.fillRect(x + rx, y + full * 0.78, full - rx * 2, 8);
    if (shade > 0.7) {
      ctx.fillStyle = '#7a8368';
      ctx.fillRect(x + rx - 4, y + full * 0.85, 8, 4);
      ctx.fillRect(x + full - rx - 4, y + full * 0.85, 8, 4);
    }
    return;
  }

  if (code === 5 || seeded(tx, ty, 80) > 0.88) {
    const plant = readyAsset(forestUndergrowth, tx, ty, 81);
    if (plant) {
      const size = code === 5 ? full * 1.2 : full * 0.8;
      ctx.drawImage(plant, x + (full - size) / 2, y + full - size, size, size);
    }
  }
}
