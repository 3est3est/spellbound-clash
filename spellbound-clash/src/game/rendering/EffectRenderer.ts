import { SCALE, TILE } from '../constants';

export interface SpellState {
  active: boolean;
  t: number;
  from: 'hero' | 'enemy';
}

export function drawSpellEffect(
  ctx: CanvasRenderingContext2D,
  sp: SpellState,
  heroSX: number,
  heroSY: number,
  enemySX: number,
  enemySY: number
) {
  const ah = sp.from === 'hero';
  const heroScale = 1;
  const enemyScale = 1.6;
  const scaleA = ah ? heroScale : enemyScale;
  const scaleB = ah ? enemyScale : heroScale;
  const fromX = (ah ? heroSX : enemySX) + (TILE * SCALE * scaleA) / 2;
  const fromY = (ah ? heroSY : enemySY) + TILE * SCALE * scaleA * 0.5;
  const toX = (ah ? enemySX : heroSX) + (TILE * SCALE * scaleB) / 2;
  const toY = (ah ? enemySY : heroSY) + TILE * SCALE * scaleB * 0.5;
  const color = ah ? '#7fd4ff' : '#ff7a7a';
  const travel = Math.min(1, sp.t / 0.6);

  // Charging aura around attacker
  const charge = Math.sin(travel * Math.PI);
  const ar = TILE * SCALE * scaleA * (0.45 + charge * 0.55);
  const aura = ctx.createRadialGradient(fromX, fromY, ar * 0.25, fromX, fromY, ar);
  aura.addColorStop(0, color);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = 0.55 * (1 - travel * 0.35);
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(fromX, fromY, ar, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const bx = fromX + (toX - fromX) * travel;
  const by = fromY + (toY - fromY) * travel;

  if (travel < 1) {
    // Glowing projectile with trail
    for (let i = 1; i <= 4; i++) {
      const tt = Math.max(0, travel - i * 0.07);
      const tx = fromX + (toX - fromX) * tt;
      const ty = fromY + (toY - fromY) * tt;
      ctx.globalAlpha = 0.22 * (1 - i / 5);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(tx, ty, (6 - i) * SCALE, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14 * SCALE;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx, by, 7 * SCALE, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx, by, 3 * SCALE, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Impact burst
    const burst = (sp.t - 0.6) / 0.4;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - burst);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * SCALE;
    ctx.beginPath();
    ctx.arc(toX, toY, burst * 24 * SCALE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2 * SCALE;
    ctx.beginPath();
    ctx.arc(toX, toY, burst * 14 * SCALE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + burst;
      const r = burst * 20 * SCALE;
      ctx.fillRect(toX + Math.cos(a) * r - SCALE, toY + Math.sin(a) * r - SCALE, 2.4 * SCALE, 2.4 * SCALE);
    }
  }
}
