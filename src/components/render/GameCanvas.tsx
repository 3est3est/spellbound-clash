import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  TILE,
  SCALE,
  MAP_COLS,
  MAP_ROWS,
  type Dir,
} from '../../game/constants';
import { MAP } from '../../game/tilemap';
import {
  prepareCtx,
  drawProceduralTile,
  drawHero,
  drawEnemy,
  drawBattleBackground,
} from '../../game/draw';

const SPEED = 4.5; // tiles per second

interface EnemyView {
  id: string;
  tx: number;
  ty: number;
  defeated: boolean;
  name: string;
}

// The store now stores enemy positions as 2D tile coords [tx, y, ty],
// so we can use them directly.
function enemyToTile(pos: [number, number, number]): { tx: number; ty: number } {
  const tx = Math.round(pos[0]);
  const ty = Math.round(pos[2]);
  return { tx: Math.max(1, Math.min(MAP_COLS - 2, tx)), ty: Math.max(1, Math.min(MAP_ROWS - 2, ty)) };
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const player = useRef({ tx: 3, ty: 3, dir: 'down' as Dir, anim: 0, moving: false });
  const cam = useRef({ x: 0, y: 0 });
  const enemiesRef = useRef<EnemyView[]>([]);
  const lungeRef = useRef(0); // -1..1 offset applied to hero during battle

  const gameState = useGameStore((s) => s.gameState);
  const enemies = useGameStore((s) => s.enemies);
  const battleResult = useGameStore((s) => s.battleResult);
  const currentEnemy = useGameStore((s) => s.currentEnemy);

  // Sync enemies from the store into a local view model.
  useEffect(() => {
    enemiesRef.current = enemies.map((e) => {
      const { tx, ty } = enemyToTile(e.position);
      return { id: e.id, tx, ty, defeated: e.defeated, name: e.name };
    });
  }, [enemies]);

  // Battle lunge animation driver.
  const spellRef = useRef<{ active: boolean; t: number; from: 'hero' | 'enemy' }>({
    active: false,
    t: 0,
    from: 'hero',
  });

  useEffect(() => {
    if (!battleResult) {
      lungeRef.current = 0;
      spellRef.current = { active: false, t: 0, from: 'hero' };
      return;
    }
    const positive = battleResult === 'CORRECT';
    spellRef.current = { active: true, t: 0, from: positive ? 'hero' : 'enemy' };
    let raf = 0;
    const start = performance.now();
    const dur = 420;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      // ease out then back (lunge toward the opponent)
      const v = Math.sin(p * Math.PI) * (positive ? 1 : -1);
      lungeRef.current = v;
      spellRef.current.t = p;
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        lungeRef.current = 0;
        spellRef.current.active = false;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [battleResult]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const onUp = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    prepareCtx(ctx);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Tile-aligned viewport so the map fills the whole screen (no empty bars).
    const viewTilesX = Math.ceil(vw / (TILE * SCALE));
    const viewTilesY = Math.ceil(vh / (TILE * SCALE));
    canvas.width = vw;
    canvas.height = vh;

    const enterBattleTransition = useGameStore.getState().enterBattleTransition;
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const p = player.current;
      const inBattle = gameState === 'BATTLE' || gameState === 'BATTLE_TRANSITION';
      p.moving = false;

      // ---- Movement (locked during battle) ----
      if (gameState === 'EXPLORE') {
        let dx = 0;
        let dy = 0;
        if (keys.current['KeyW'] || keys.current['ArrowUp']) dy -= 1;
        if (keys.current['KeyS'] || keys.current['ArrowDown']) dy += 1;
        if (keys.current['KeyA'] || keys.current['ArrowLeft']) dx -= 1;
        if (keys.current['KeyD'] || keys.current['ArrowRight']) dx += 1;

        if (dx !== 0 || dy !== 0) {
          if (dx > 0) p.dir = 'right';
          else if (dx < 0) p.dir = 'left';
          else if (dy > 0) p.dir = 'down';
          else if (dy < 0) p.dir = 'up';

          // Move axis-by-axis so we slide along walls.
          const step = SPEED * dt;
          const tryX = p.tx + dx * step;
          const tryY = p.ty + dy * step;
          const tileX = Math.floor(tryX + 0.5);
          const tileY = Math.floor(p.ty + 0.5);
          if (canWalk(tileX, tileY)) p.tx = tryX;
          const tileX2 = Math.floor(p.tx + 0.5);
          const tileY2 = Math.floor(tryY + 0.5);
          if (canWalk(tileX2, tileY2)) p.ty = tryY;

          p.moving = true;
          p.anim += dt * 8;
        }

        // ---- Enemy collision ----
        for (const e of enemiesRef.current) {
          if (e.defeated) continue;
          // Skip the enemy we're already fighting so we don't re-trigger.
          if (currentEnemy && e.id === currentEnemy.id) continue;
          const ddx = p.tx - e.tx;
          const ddy = p.ty - e.ty;
          if (ddx * ddx + ddy * ddy < 0.8) {
            enterBattleTransition(e.id);
            break;
          }
        }
      }

      // ---- Camera (clamped 2D follow, centred if the world is smaller) ----
      const worldW = MAP_COLS * TILE * SCALE;
      const worldH = MAP_ROWS * TILE * SCALE;
      let targetCamX = p.tx * TILE * SCALE + (TILE * SCALE) / 2 - vw / 2;
      let targetCamY = p.ty * TILE * SCALE + (TILE * SCALE) / 2 - vh / 2;
      targetCamX = worldW <= vw ? (worldW - vw) / 2 : clamp(targetCamX, 0, worldW - vw);
      targetCamY = worldH <= vh ? (worldH - vh) / 2 : clamp(targetCamY, 0, worldH - vh);
      cam.current.x += (targetCamX - cam.current.x) * Math.min(1, dt * 8);
      cam.current.y += (targetCamY - cam.current.y) * Math.min(1, dt * 8);

      // ---- Render ----
      ctx.clearRect(0, 0, vw, vh);
      const camX = Math.round(cam.current.x);
      const camY = Math.round(cam.current.y);

      if (inBattle) {
        drawBattleBackground(ctx, vw, vh, now);
      } else {
        // Tiles — fill the whole viewport. Out-of-bounds cells draw as plain
        // grass so the map always reaches every screen edge (no empty bars).
        const startCol = Math.floor(camX / (TILE * SCALE));
        const startRow = Math.floor(camY / (TILE * SCALE));
        for (let row = startRow; row <= startRow + viewTilesY + 1; row++) {
          for (let col = startCol; col <= startCol + viewTilesX + 1; col++) {
            const code =
              row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS
                ? 0 // grass beyond the map edge
                : MAP[row][col];
            drawProceduralTile(
              ctx,
              code,
              col * TILE * SCALE - camX,
              row * TILE * SCALE - camY
            );
          }
        }
      }

      // Sprites sorted by tile-y so lower ones draw on top.
      type Drawable = { ty: number; tx: number; kind: 'hero' | 'enemy'; id?: string };
      const list: Drawable[] = [];
      list.push({ ty: p.ty, tx: p.tx, kind: 'hero' });
      for (const e of enemiesRef.current) {
        if (e.defeated) continue;
        list.push({ ty: e.ty, tx: e.tx, kind: 'enemy', id: e.id });
      }
      list.sort((a, b) => a.ty - b.ty);

      const frame = Math.floor(p.anim) % 2;
      // Track the on-screen positions of hero & active enemy for the spell FX.
      let heroSX = 0;
      let heroSY = 0;
      let enemySX = 0;
      let enemySY = 0;
      let hasEnemy = false;

      if (inBattle) {
        // ---- Battle arena: a dedicated full-screen duel stage. Combatants
        // are large and centered so the fight is the focus, not the map. ----
        const stageY = vh * 0.52;
        const heroX = vw * 0.28 - (TILE * SCALE) / 2;
        const enemyX = vw * 0.64 - (TILE * SCALE) / 2;
        heroSX = heroX;
        heroSY = stageY;
        enemySX = enemyX;
        enemySY = stageY - 10 * SCALE;
        hasEnemy = true;

        // Hero (big, facing right), lunges on a correct answer.
        const offX = lungeRef.current * 26 * SCALE;
        drawHero(ctx, heroX + offX, stageY, 'right', frame, false, 2.6);

        // Enemy even bigger, lunges on a wrong answer (negative lunge).
        const eOffX = lungeRef.current * -26 * SCALE;
        const hit = battleResult === 'WRONG';
        drawEnemy(ctx, enemyX + eOffX, enemySY, Math.floor(now / 400) % 2, hit, 2.8);
      } else {
        for (const d of list) {
          const sx = d.tx * TILE * SCALE - camX;
          const sy = d.ty * TILE * SCALE - camY;
          if (d.kind === 'hero') {
            heroSX = sx;
            heroSY = sy;
            const offX = p.dir === 'left' ? lungeRef.current * -18 * SCALE
              : p.dir === 'right' ? lungeRef.current * 18 * SCALE : 0;
            drawHero(ctx, sx + offX, sy, p.dir, frame, p.moving && !inBattle);
          } else {
            const isCurrent = currentEnemy && d.id === currentEnemy.id;
            if (isCurrent) {
              hasEnemy = true;
              enemySX = sx;
              enemySY = sy;
            }
            const scaleBoost = isCurrent ? 1.6 : 1;
            const hit = !!(isCurrent && battleResult === 'WRONG');
            drawEnemy(ctx, sx, sy, Math.floor(now / 400) % 2, hit, scaleBoost);
          }
        }
      }

      // ---- Spell / attack projectile FX (during a battle hit) ----
      if (inBattle && spellRef.current.active && hasEnemy) {
        const sp = spellRef.current;
        const fromX = sp.from === 'hero' ? heroSX + 8 * SCALE : enemySX + 8 * SCALE;
        const fromY = sp.from === 'hero' ? heroSY + 8 * SCALE : enemySY + 8 * SCALE;
        const toX = sp.from === 'hero' ? enemySX + 8 * SCALE : heroSX + 8 * SCALE;
        const toY = sp.from === 'hero' ? enemySY + 8 * SCALE : heroSY + 8 * SCALE;
        // projectile travels in first 60% of the animation, then bursts.
        const travel = Math.min(1, sp.t / 0.6);
        const bx = fromX + (toX - fromX) * travel;
        const by = fromY + (toY - fromY) * travel;
        const color = sp.from === 'hero' ? '#7fd4ff' : '#ff7a7a';

        if (travel < 1) {
          // glowing orb
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(bx, by, 4 * SCALE, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bx, by, 2 * SCALE, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // impact burst
          const burst = (sp.t - 0.6) / 0.4;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2 * SCALE;
          ctx.beginPath();
          ctx.arc(toX, toY, burst * 14 * SCALE, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const r = burst * 12 * SCALE;
            ctx.fillRect(toX + Math.cos(a) * r - SCALE, toY + Math.sin(a) * r - SCALE, 2 * SCALE, 2 * SCALE);
          }
        }
      }

      // ---- Battle vignette: very soft edge darkening to frame the duel ----
      if (inBattle) {
        const grad = ctx.createRadialGradient(
          vw / 2, vh * 0.5, vh * 0.35,
          vw / 2, vh * 0.5, vh * 0.75
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.28)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, vw, vh);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameState, currentEnemy, battleResult]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#7ec850]">
      <canvas
        ref={canvasRef}
        className="image-rendering-pixelated border-0 block"
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
}

function canWalk(tx: number, ty: number): boolean {
  if (ty < 0 || ty >= MAP_ROWS || tx < 0 || tx >= MAP_COLS) return false;
  const code = MAP[ty][tx];
  return code !== 2 && code !== 3 && code !== 4; // tree/rock/water
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
