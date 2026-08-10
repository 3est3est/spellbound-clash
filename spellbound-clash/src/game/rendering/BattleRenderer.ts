import { SCALE } from '../constants';
import { natureBgs, getNatureBg } from '../assets/tileAssets';

export function drawBattleBackground(
  ctx: CanvasRenderingContext2D,
  vw: number,
  vh: number,
  now: number,
  zone: number
) {
  const bgIndex = getNatureBg(zone);
  if (bgIndex >= 0 && bgIndex < natureBgs.length) {
    const img = natureBgs[bgIndex];
    if (img.complete && img.naturalWidth > 0) {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.max(vw / iw, vh / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(img, (vw - dw) / 2, (vh - dh) / 2, dw, dh);
      const vig = ctx.createRadialGradient(vw / 2, vh * 0.5, vh * 0.3, vw / 2, vh * 0.5, vh * 0.8);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, vw, vh);
      return;
    }
  }

  // Fallback: procedural twilight arena if no image loaded yet
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
  ctx.arc(vw * 0.82, vh * 0.15, 7 * SCALE, 0, Math.PI * 2);
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
