import { SCALE, TILE } from '../constants';
import { registerSheet, getSheet } from '../sprites/SpriteSheet';
import type { EnemyKey } from '../sprites/enemySprites';

registerSheet('glyph-hero', '/assets/gen/effects/glyph-light.png', 512, 512);
registerSheet('glyph-enemy', '/assets/gen/effects/glyph-dark.png', 512, 512);
registerSheet('glyph-fire', '/assets/gen/effects/glyph-fire.png', 512, 512);
registerSheet('glyph-ice', '/assets/gen/effects/glyph-ice.png', 512, 512);
registerSheet('glyph-soul', '/assets/gen/effects/glyph-soul.png', 512, 512);

const ENEMY_GLYPH: Record<EnemyKey, { sheet: string; color: string }> = {
  enemy: { sheet: 'glyph-enemy', color: '#ef4444' },
  scorpion: { sheet: 'glyph-fire', color: '#f97316' },
  bear: { sheet: 'glyph-ice', color: '#60a5fa' },
  reaper: { sheet: 'glyph-soul', color: '#dc2626' },
};

export interface SpellState {
  active: boolean;
  t: number;
  from: 'hero' | 'enemy';
}

const glyphColor = (fromHero: boolean) => (fromHero ? '#7c3aed' : '#ef4444');

const GLYPH_BASE = 2.4;
const GLYPH_IMPACT = 3.4;

function drawImageCentered(
  ctx: CanvasRenderingContext2D,
  sheetName: string,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  alpha = 1
) {
  const sheet = getSheet(sheetName);
  if (!sheet || !sheet.ready || !sheet.image) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  const half = size / 2;
  ctx.drawImage(sheet.image, -half, -half, size, size);
  ctx.restore();
}

export function drawSpellEffect(
  ctx: CanvasRenderingContext2D,
  sp: SpellState,
  heroSX: number,
  heroSY: number,
  enemySX: number,
  enemySY: number,
  enemyKey: EnemyKey = 'enemy',
  battleScale = 1
) {
  const ah = sp.from === 'hero';
  const unit = TILE * SCALE;
  const scale = battleScale;
  // Both fighters are drawn at battleScale around their bottom-center anchor
  // (screenY + unit). Chest level = anchor - unit*scale/2, horizontal center = screenX + unit/2.
  const fromX = (ah ? heroSX : enemySX) + unit / 2;
  const fromY = (ah ? heroSY : enemySY) + unit - (unit * scale) / 2;
  const toX = (ah ? enemySX : heroSX) + unit / 2;
  const toY = (ah ? enemySY : heroSY) + unit - (unit * scale) / 2;
  const color = ah ? glyphColor(ah) : ENEMY_GLYPH[enemyKey].color;
  const glyphName = ah ? 'glyph-hero' : ENEMY_GLYPH[enemyKey].sheet;
  const travel = Math.min(1, sp.t / 0.6);

  // Charging aura around attacker — purple/red pulsing rune ring
  const charge = Math.sin(travel * Math.PI);
  const ar = unit * scale * (0.45 + charge * 0.55);
  ctx.save();
  ctx.globalAlpha = 0.35 * (1 - travel * 0.25);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3 * SCALE;
  ctx.beginPath();
  ctx.arc(fromX, fromY, ar, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(fromX, fromY, ar, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const bx = fromX + (toX - fromX) * travel;
  const by = fromY + (toY - fromY) * travel;

  if (travel < 1) {
    // Energy beam arcing from attacker toward the target while casting
    const beamLen = Math.max(0.12, travel);
    const ex = fromX + (toX - fromX) * beamLen;
    const ey = fromY + (toY - fromY) * beamLen;
    const beamGrad = ctx.createLinearGradient(fromX, fromY, ex, ey);
    beamGrad.addColorStop(0, color);
    beamGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.3 * charge;
    ctx.strokeStyle = beamGrad;
    ctx.lineWidth = 4 * SCALE * (0.6 + charge * 0.5);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.restore();

    // Rotating glyph projectile with particle trail
    const size = TILE * SCALE * (GLYPH_BASE + 1.1 * charge) * (ah ? 1 : 1.2);
    ctx.shadowColor = color;
    ctx.shadowBlur = 16 * SCALE;
    drawImageCentered(ctx, glyphName, bx, by, size, sp.t * 9);
    ctx.shadowBlur = 0;

    // Ember particles swirling behind the glyph
    for (let i = 0; i < 6; i++) {
      const tt = Math.max(0, travel - i * 0.06);
      const px = fromX + (toX - fromX) * tt + Math.cos(sp.t * 12 + i * 1.3) * 8 * SCALE;
      const py = fromY + (toY - fromY) * tt + Math.sin(sp.t * 12 + i * 1.3) * 8 * SCALE;
      ctx.globalAlpha = 0.5 * (1 - i / 7);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, (5 - i * 0.6) * SCALE, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    // Impact — glyph slams into target with expanding rune ring + shards
    const burst = (sp.t - 0.6) / 0.4;
    const fade = Math.max(0, 1 - burst);

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * SCALE;
    ctx.beginPath();
    ctx.arc(toX, toY, burst * 32 * SCALE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2 * SCALE;
    ctx.beginPath();
    ctx.arc(toX, toY, burst * 20 * SCALE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Impact glyph flash
    drawImageCentered(ctx, glyphName, toX, toY, TILE * SCALE * (GLYPH_IMPACT + burst * 1.4), sp.t * 6, fade);

    // Scattered rune shards
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + burst;
      const r = burst * 22 * SCALE;
      ctx.globalAlpha = fade;
      ctx.fillRect(
        toX + Math.cos(a) * r - SCALE,
        toY + Math.sin(a) * r - SCALE,
        2.4 * SCALE,
        2.4 * SCALE
      );
    }
    ctx.globalAlpha = 1;
  }
}