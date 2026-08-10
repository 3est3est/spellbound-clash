import { SCALE, TILE, T } from '../constants';
import { tileAt, getZoneAt } from '../tilemap';
import {
  zone1Trees, zone1Bushes, zone1Rocks, zone1Flowers, zone1Floor, zone1Path, zone1Water,
  zone2Trees, zone2Bushes, zone2Rocks, zone2Flowers, zone2Floor, zone2Path, zone2Water,
  zone3Trees, zone3Bushes, zone3Rocks, zone3Flowers, zone3Floor, zone3Path, zone3Water,
  zone4Trees, zone4Bushes, zone4Rocks, zone4Flowers, zone4Floor, zone4Path, zone4Water,
  gateBarrier, waterSparkles,
} from '../assets/tileAssets';

export function prepareCtx(ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = false;
}

// Cheap deterministic hash → 0..1
function seeded(tx: number, ty: number, salt = 0): number {
  let h = Math.imul(tx + 1, 374761393) ^ Math.imul(ty + 1, 668265263) ^ Math.imul(salt + 1, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Pick a loaded image from a list; returns null if none ready yet
function pickAsset(list: HTMLImageElement[], tx: number, ty: number, salt: number): HTMLImageElement | null {
  const loaded = list.filter(img => img.complete && img.naturalWidth > 0);
  if (!loaded.length) return null;
  return loaded[Math.floor(seeded(tx, ty, salt) * loaded.length)];
}

// Draw an asset centred on the tile, at natural 1:1 pixel scale (no stretching!)
// scaleFactor sizes the object: trees big (~1.6), rocks medium (~1.0), bushes/flowers small.
function drawAssetNatural(
  ctx: CanvasRenderingContext2D,
  asset: HTMLImageElement,
  tileX: number,      // top-left of tile in screen coords
  tileY: number,
  tilePx: number,     // TILE * SCALE
  salt: number,
  tx: number,
  ty: number,
  scaleFactor = 1,
) {
  // Keep a little per-tile variety (-15%..+15%) so objects don't all look identical
  const jitter = 0.85 + seeded(tx, ty, salt + 90) * 0.3;
  const size = scaleFactor * jitter;
  const w = Math.max(tilePx * 0.4, tilePx * size);
  const h = Math.max(tilePx * 0.4, tilePx * size * (asset.naturalHeight / asset.naturalWidth));
  // Centre horizontally; bottom-align so trees "grow" from tile bottom
  const dx = tileX + (tilePx - w) / 2 + (seeded(tx, ty, salt + 10) - 0.5) * tilePx * 0.18;
  const dy = tileY + tilePx - h;
  ctx.drawImage(asset, Math.round(dx), Math.round(dy), Math.round(w), Math.round(h));
}

// ─── Grass base ──────────────────────────────────────────────────────────────
function drawGrassBase(ctx: CanvasRenderingContext2D, x: number, y: number, full: number, tx: number, ty: number, zone: number) {
  const floors = zone === 1 ? zone1Floor : zone === 2 ? zone2Floor : zone === 3 ? zone3Floor : zone4Floor;
  if (floors.complete && floors.naturalWidth > 0) {
    ctx.drawImage(floors, x, y, full, full);
    return;
  }
  const t = seeded(tx, ty, 1);
  if (zone === 1) {
    ctx.fillStyle = t > 0.65 ? '#8ec85e' : t > 0.32 ? '#82bc52' : '#76b046';
  } else if (zone === 2) {
    ctx.fillStyle = t > 0.65 ? '#e0a850' : t > 0.32 ? '#d69e48' : '#c4903c';
  } else if (zone === 3) {
    ctx.fillStyle = t > 0.65 ? '#dff2ff' : t > 0.32 ? '#cceaff' : '#b8e0fc';
  } else {
    ctx.fillStyle = t > 0.65 ? '#503c34' : t > 0.32 ? '#44302a' : '#382820';
  }
  ctx.fillRect(x, y, full, full);

  // Subtle grass tuft marks
  ctx.fillStyle = zone === 3 ? 'rgba(255,255,255,0.1)' : zone === 4 ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.07)';
  for (let i = 0; i < 3; i++) {
    const px = Math.floor(seeded(tx, ty, 10 + i) * 13 + 1) * SCALE;
    const py = Math.floor(seeded(tx, ty, 20 + i) * 13 + 1) * SCALE;
    ctx.fillRect(x + px, y + py, SCALE, SCALE * 2);
  }
}

// ─── Dirt path ───────────────────────────────────────────────────────────────
function drawPath(ctx: CanvasRenderingContext2D, x: number, y: number, full: number, tx: number, ty: number, zone: number) {
  // Detect bridge-over-water situation
  const isBridge =
    (tileAt(tx - 1, ty) === T.WATER && tileAt(tx + 1, ty) === T.WATER) ||
    (tileAt(tx, ty - 1) === T.WATER && tileAt(tx, ty + 1) === T.WATER);

  if (isBridge) {
    ctx.fillStyle = zone === 4 ? '#4a2d18' : '#7b5430';
    ctx.fillRect(x, y, full, full);
    ctx.fillStyle = zone === 4 ? '#8a5b32' : '#c89b5c';
    for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * (full / 4) + SCALE, full, full / 4 - SCALE * 2);
    return;
  }

  const paths = zone === 1 ? zone1Path : zone === 2 ? zone2Path : zone === 3 ? zone3Path : zone4Path;
  if (paths.complete && paths.naturalWidth > 0) {
    ctx.drawImage(paths, x, y, full, full);
    return;
  }

  const t = seeded(tx, ty, 2);
  if (zone === 1) ctx.fillStyle = t > 0.5 ? '#d5bb80' : '#cbaf72';
  else if (zone === 2) ctx.fillStyle = t > 0.5 ? '#f0d3a0' : '#e4c48c';
  else if (zone === 3) ctx.fillStyle = t > 0.5 ? '#9dc6e6' : '#8bb4d4';
  else ctx.fillStyle = t > 0.5 ? '#685047' : '#573f37';
  ctx.fillRect(x, y, full, full);

  ctx.fillStyle = 'rgba(0,0,0,0.09)';
  for (let i = 0; i < 2; i++) {
    const px = Math.floor(seeded(tx, ty, 30 + i) * 13 + 1) * SCALE;
    const py = Math.floor(seeded(tx, ty, 40 + i) * 13 + 1) * SCALE;
    ctx.fillRect(x + px, y + py, SCALE * (i + 1), SCALE);
  }
}

// ─── Water ───────────────────────────────────────────────────────────────────
function drawWater(ctx: CanvasRenderingContext2D, x: number, y: number, full: number, tx: number, ty: number, zone: number, now: number) {
  const waters = zone === 1 ? zone1Water : zone === 2 ? zone2Water : zone === 3 ? zone3Water : zone4Water;
  if (waters.complete && waters.naturalWidth > 0) {
    ctx.drawImage(waters, x, y, full, full);
  } else {
    if (zone === 4) { ctx.fillStyle = '#5e1830'; }
    else if (zone === 3) { ctx.fillStyle = '#4aa8d4'; }
    else { ctx.fillStyle = '#48a8bc'; }
    ctx.fillRect(x, y, full, full);
  }

  const waveColor = zone === 4 ? '#f2a03c' : zone === 3 ? '#88d8ff' : '#80d8d8';
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = waveColor;
  const shift = Math.floor(now / 320) % 5;
  for (let i = 0; i < 2; i++) {
    const wy = y + (4 + i * 6) * SCALE;
    const wx = x + ((Math.floor(seeded(tx, ty, 50 + i) * 10) + shift) % 12) * SCALE;
    ctx.fillRect(wx, wy, (3 + (i % 2)) * SCALE, SCALE);
  }
  ctx.globalAlpha = 1;

  if (waterSparkles.complete && waterSparkles.naturalWidth > 0 && seeded(tx, ty, 61) > 0.55) {
    ctx.globalAlpha = 0.55;
    ctx.drawImage(waterSparkles, x, y, full, full);
    ctx.globalAlpha = 1;
  }
}

// ─── Magic gate barrier between zones ───────────────────────────────────────
// The tile itself is a normal walking path; while the destination zone is still
// locked we draw a glowing magic ring on top that blocks passage (via canWalk).
function drawGateBarrier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  full: number,
  tx: number,
  ty: number,
  code: number,
  unlocked: boolean,
) {
  // Gates span 2 tiles — find the contiguous run this tile belongs to.
  const same = (cx: number, cy: number) => tileAt(cx, cy) === code;
  let h0 = tx, h1 = tx;
  while (same(h0 - 1, ty)) h0--;
  while (same(h1 + 1, ty)) h1++;
  let v0 = ty, v1 = ty;
  while (same(tx, v0 - 1)) v0--;
  while (same(tx, v1 + 1)) v1++;
  const horizontal = h1 - h0 >= 1;
  const vertical = v1 - v0 >= 1;
  const runX = horizontal ? h0 : tx;
  const runY = vertical ? v0 : ty;
  const runW = horizontal ? h1 - h0 + 1 : 1;
  const runH = vertical ? v1 - v0 + 1 : 1;

  // Anchor tile draws the whole area; siblings skip.
  const isAnchor = horizontal ? tx === h0 : ty === v0;
  if (!isAnchor) return;

  // Normal path floor (open passage)
  drawPath(ctx, x - (tx - runX) * full, y - (ty - runY) * full, full, tx, ty, 1);

  if (unlocked) return;

  const cavX = x - (tx - runX) * full;
  const cavY = y - (ty - runY) * full;
  const cavW = runW * full;
  const cavH = runH * full;

  // Magic barrier over the opening while locked
  if (gateBarrier.complete && gateBarrier.naturalWidth > 0) {
    ctx.drawImage(gateBarrier, cavX, cavY, cavW, cavH);
  } else {
    ctx.fillStyle = 'rgba(124,58,237,0.35)';
    ctx.fillRect(cavX, cavY, cavW, cavH);
  }

  // Soft purple aura glow
  const g = ctx.createRadialGradient(cavX + cavW / 2, cavY + cavH / 2, 1, cavX + cavW / 2, cavY + cavH / 2, cavW * 0.8);
  g.addColorStop(0, 'rgba(147,110,255,0.25)');
  g.addColorStop(0.7, 'rgba(124,58,237,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cavX, cavY, cavW, cavH);
}

// ─── Atmospheric fog overlay for locked zones (soft, gradients, not hard black) ─
export function drawZoneFogOverlay(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  tilePx: number,
  zone: number,
  unlockedZones: number[],
  _playerTileX: number,
  _playerTileY: number,
) {
  if (unlockedZones.includes(zone)) return;

  // Very dark semi-transparent fill
  ctx.fillStyle = 'rgba(8, 5, 20, 0.92)';
  ctx.fillRect(screenX, screenY, tilePx, tilePx);
}

// ─── Tall obstacles (drawn in depth order with entities, never on floors pass) ─
export function drawTallDecor(
  ctx: CanvasRenderingContext2D,
  code: number,
  tx: number,
  ty: number,
  screenX: number,
  screenY: number,
  unlockedZones: number[] = [1],
) {
  const x = Math.round(screenX);
  const y = Math.round(screenY);
  const full = TILE * SCALE;
  const zone = getZoneAt(tx, ty);
  if (!unlockedZones.includes(zone)) return;

  if (code === T.TREE) {
    const trees = zone === 1 ? zone1Trees : zone === 2 ? zone2Trees : zone === 3 ? zone3Trees : zone4Trees;
    const bushes = zone === 1 ? zone1Bushes : zone === 2 ? zone2Bushes : zone === 3 ? zone3Bushes : zone4Bushes;
    const useBush = seeded(tx, ty, 69) > 0.72; // 28% bushes, 72% trees
    const pool = useBush ? bushes : trees;
    const asset = pickAsset(pool, tx, ty, 70);
    if (asset) {
      drawAssetNatural(ctx, asset, x, y, full, 71, tx, ty, useBush ? 0.85 : 1.7);
    } else {
      // Fallback geometric tree
      ctx.fillStyle = zone === 3 ? '#99c8f0' : zone === 4 ? '#302825' : '#267026';
      ctx.fillRect(x + full * 0.1, y + full * 0.05, full * 0.8, full * 0.85);
      ctx.fillStyle = zone === 4 ? '#4a3028' : '#6b4020';
      ctx.fillRect(x + full * 0.38, y + full * 0.7, full * 0.24, full * 0.3);
    }
    return;
  }

  if (code === T.ROCK) {
    const rocks = zone === 1 ? zone1Rocks : zone === 2 ? zone2Rocks : zone === 3 ? zone3Rocks : zone4Rocks;
    const asset = pickAsset(rocks, tx, ty, 73);
    if (asset) {
      drawAssetNatural(ctx, asset, x, y, full, 74, tx, ty, 0.75);
    } else {
      const shade = seeded(tx, ty, 73);
      const rx = full * 0.15;
      ctx.fillStyle = zone === 3 ? '#8ab8e0' : zone === 4 ? '#2e2825' : (shade > 0.5 ? '#586050' : '#6a726a');
      ctx.fillRect(x + rx, y + full * 0.33, full - rx * 2, full * 0.52);
      ctx.fillStyle = zone === 3 ? '#b8d8f4' : zone === 4 ? '#4e3c38' : (shade > 0.5 ? '#88997a' : '#a8b098');
      ctx.fillRect(x + rx + 4, y + full * 0.25, full - rx * 2 - 8, full * 0.33);
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x + rx + 4, y + full * 0.25, (full - rx * 2 - 8) * 0.4, SCALE * 2);
    }
    return;
  }
}

// ─── Main tile draw ───────────────────────────────────────────────────────────
export function drawForestTile(
  ctx: CanvasRenderingContext2D,
  code: number,
  tx: number,
  ty: number,
  screenX: number,
  screenY: number,
  now: number,
  unlockedZones: number[] = [1],
  skipTall = false,
) {
  const x = Math.round(screenX);
  const y = Math.round(screenY);
  const full = TILE * SCALE;
  const zone = getZoneAt(tx, ty);
  const unlocked = unlockedZones.includes(zone);

  // Locked zone — draw underlying tile dimly then heavy fog (so tunnel mouth still renders)
  if (!unlocked) {
    // Draw a muted version of base terrain so structure is barely perceptible under fog
    drawGrassBase(ctx, x, y, full, tx, ty, zone);
    ctx.fillStyle = 'rgba(8, 5, 20, 0.93)';
    ctx.fillRect(x, y, full, full);
    // Gates still render on top of fog so player can see the entrance
    if (code === T.GATE_1_2 || code === T.GATE_2_3 || code === T.GATE_3_4) {
      drawGateBarrier(ctx, x, y, full, tx, ty, code, false);
    }
    return;
  }

  // Gates → magic barrier archways
  if (code === T.GATE_1_2) { drawGateBarrier(ctx, x, y, full, tx, ty, code, unlockedZones.includes(2)); return; }
  if (code === T.GATE_2_3) { drawGateBarrier(ctx, x, y, full, tx, ty, code, unlockedZones.includes(3)); return; }
  if (code === T.GATE_3_4) { drawGateBarrier(ctx, x, y, full, tx, ty, code, unlockedZones.includes(4)); return; }

  // Path
  if (code === T.PATH) { drawPath(ctx, x, y, full, tx, ty, zone); return; }

  // Water
  if (code === T.WATER) { drawWater(ctx, x, y, full, tx, ty, zone, now); return; }

  // Grass base for GRASS / FLOWER / TREE / ROCK
  drawGrassBase(ctx, x, y, full, tx, ty, zone);

  // Solid obstacles — tree/rock assets drawn in the depth pass if requested
  if (code === T.TREE || code === T.ROCK) {
    if (!skipTall) drawTallDecor(ctx, code, tx, ty, x, y, unlockedZones);
    return;
  }

  // Floor flowers (decorative, walkable)
  if (code === T.FLOWER) {
    const flowers = zone === 1 ? zone1Flowers : zone === 2 ? zone2Flowers : zone === 3 ? zone3Flowers : zone4Flowers;
    const asset = pickAsset(flowers, tx, ty, 75);
    if (asset) {
      drawAssetNatural(ctx, asset, x, y, full, 76, tx, ty, 0.6);
    } else {
      const fc = zone === 2 ? '#ffaa44' : zone === 3 ? '#aaddff' : zone === 4 ? '#ff5577' : '#ff8ab3';
      ctx.fillStyle = fc;
      ctx.fillRect(x + full * 0.22, y + full * 0.3, SCALE * 3, SCALE * 3);
      ctx.fillRect(x + full * 0.55, y + full * 0.45, SCALE * 2, SCALE * 2);
      ctx.fillStyle = '#fff8';
      ctx.fillRect(x + full * 0.32, y + full * 0.38, SCALE, SCALE);
    }
  }
}

export function drawGachaMachine(ctx: CanvasRenderingContext2D, x: number, y: number, _full: number, now: number) {
  // Base
  ctx.fillStyle = '#a31c5d';
  ctx.fillRect(x + 2 * SCALE, y + 8 * SCALE, 12 * SCALE, 8 * SCALE);
  ctx.fillStyle = '#ff3366';
  ctx.fillRect(x + 2 * SCALE, y + 8 * SCALE, 12 * SCALE, 2 * SCALE);
  ctx.fillStyle = '#5c1035';
  ctx.fillRect(x + 2 * SCALE, y + 14 * SCALE, 12 * SCALE, 2 * SCALE);

  // Glass Globe
  ctx.fillStyle = 'rgba(200, 240, 255, 0.6)';
  ctx.fillRect(x + 3 * SCALE, y + 2 * SCALE, 10 * SCALE, 6 * SCALE);

  // Capsule inventory colors
  const colors = ['#ff3366', '#ffd700', '#33ccff', '#99ff33', '#e066ff'];
  for (let i = 0; i < 6; i++) {
    const cx = x + (4 + (i % 3) * 2.8) * SCALE;
    const cy = y + (3 + Math.floor(i / 3) * 2.2) * SCALE;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(cx, cy, 2 * SCALE, 2 * SCALE);
  }

  // Dial
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(x + 7 * SCALE, y + 10 * SCALE, 2 * SCALE, 2 * SCALE);

  // Prize Opening
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 6 * SCALE, y + 13 * SCALE, 4 * SCALE, 2.5 * SCALE);

  // Floating Arrow indicator
  const angle = now / 180;
  const hoverOffset = Math.sin(angle) * 1.5 * SCALE;
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(x + 8 * SCALE, y - 3 * SCALE + hoverOffset);
  ctx.lineTo(x + 6 * SCALE, y - 6 * SCALE + hoverOffset);
  ctx.lineTo(x + 10 * SCALE, y - 6 * SCALE + hoverOffset);
  ctx.closePath();
  ctx.fill();
}

export function drawShopNPC(ctx: CanvasRenderingContext2D, x: number, y: number, _full: number, now: number) {
  const s = SCALE;
  const bob = Math.sin(now / 200) * 1.5;
  const sy = y + bob;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(x + 8 * s, y + 14 * s, 6 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shop counter table
  ctx.fillStyle = '#6b4020'; // wood
  ctx.fillRect(x + 1 * s, y + 10 * s, 14 * s, 5 * s);
  ctx.fillStyle = '#4a2c16';
  ctx.fillRect(x + 1 * s, y + 14 * s, 14 * s, 1 * s);

  // Table cloth / stripes
  ctx.fillStyle = '#d97706'; // gold/yellow Accent
  ctx.fillRect(x + 3 * s, y + 10 * s, 2 * s, 2 * s);
  ctx.fillRect(x + 11 * s, y + 10 * s, 2 * s, 2 * s);

  // Merchant Body
  ctx.fillStyle = '#4f46e5'; // Blue purple tunic
  ctx.fillRect(x + 5 * s, sy + 4 * s, 6 * s, 6 * s);

  // Merchant Skin (Face)
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(x + 6 * s, sy + 2 * s, 4 * s, 3 * s);

  // Eyes (cunning merchant eyes)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 6.5 * s, sy + 3 * s, 1 * s, 1 * s);
  ctx.fillRect(x + 8.5 * s, sy + 3 * s, 1 * s, 1 * s);

  // Red/Gold Merchant Turban or Tassle Hat
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x + 4 * s, sy + 0 * s, 8 * s, 2 * s);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x + 7 * s, sy - 1 * s, 2 * s, 1 * s);

  // Golden Floating Coin icon above NPC (indicates shop)
  const coinAngle = now / 150;
  const floatY = Math.sin(coinAngle) * 2.5 * s;
  ctx.fillStyle = '#f5c842';
  ctx.beginPath();
  ctx.arc(x + 8 * s, y - 5 * s + floatY, 3 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#b45309';
  ctx.font = `bold ${5 * s}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', x + 8.2 * s, y - 4.5 * s + floatY);
}

