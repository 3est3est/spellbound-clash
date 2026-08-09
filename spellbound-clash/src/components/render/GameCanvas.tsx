import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../../store/useGameStore";
import { TILE, SCALE, MAP_COLS, MAP_ROWS, T, type Dir } from "../../game/constants";
import { MAP } from "../../game/tilemap";
import { pickRandomNatureBg, setNatureBg } from "../../game/assets";
import {
  prepareCtx,
  drawForestTile,
  drawHero,
  drawEnemy,
  drawNameTag,
  drawBattleBackground,
  drawMagicCircle,
  drawSpellEffect,
  drawGachaMachine,
  drawPet,
  drawShopNPC,
} from "../../game/rendering";

const SPEED = 4.5; // tiles per second

interface EnemyView {
  id: string;
  tx: number;
  ty: number;
  defeated: boolean;
  name: string;
  fx: number;
  fy: number;
  wdx: number;
  wdy: number;
  wanderTimer: number;
  ox: number;
  oy: number;
}

function enemyToTile(pos: [number, number, number]): { tx: number; ty: number } {
  const tx = Math.round(pos[0]);
  const ty = Math.round(pos[2]);
  return { tx: Math.max(1, Math.min(MAP_COLS - 2, tx)), ty: Math.max(1, Math.min(MAP_ROWS - 2, ty)) };
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const player = useRef({ tx: 3, ty: 4, dir: "down" as Dir, anim: 0, moving: false });
  const playerHistory = useRef<{ tx: number; ty: number; dir: Dir }[]>([]);
  const cam = useRef({ x: 0, y: 0 });
  const enemiesRef = useRef<EnemyView[]>([]);
  const lungeRef = useRef(0);
  const wasPausedRef = useRef(false);
  // Zone fog reveal: tracks alpha (0=fully revealed, 1=black) per zone unlock sequence
  const zoneRevealRef = useRef<Map<number, number>>(new Map());
  const lastZoneRef = useRef<number>(1);
  const [isNearGacha, setIsNearGacha] = useState(false);
  const isNearGachaRef = useRef(false);
  const [isNearShop, setIsNearShop] = useState(false);
  const isNearShopRef = useRef(false);
  const respawnTickTimer = useRef(0);

  const gameState = useGameStore((s) => s.gameState);
  const enemies = useGameStore((s) => s.enemies);
  const battleResult = useGameStore((s) => s.battleResult);
  const currentEnemy = useGameStore((s) => s.currentEnemy);
  const playerName = useGameStore((s) => s.playerName);
  const zoneBanner = useGameStore((s) => s.zoneBanner);
  const clearZoneBanner = useGameStore((s) => s.clearZoneBanner);

  useEffect(() => {
    const idx = pickRandomNatureBg();
    setNatureBg(idx);
  }, []);

  useEffect(() => {
    if (gameState === "EXPLORE") {
      const pos = useGameStore.getState().playerPos;
      player.current.tx = pos.tx;
      player.current.ty = pos.ty;
      playerHistory.current = [];
    }
  }, [gameState]);

  useEffect(() => {
    if (!zoneBanner) return;
    const timer = setTimeout(() => clearZoneBanner(), 4500);
    return () => clearTimeout(timer);
  }, [zoneBanner, clearZoneBanner]);

  useEffect(() => {
    enemiesRef.current = enemies.map((e) => {
      const { tx, ty } = enemyToTile(e.position);
      const existing = enemiesRef.current.find((v) => v.id === e.id);
      return {
        id: e.id,
        tx,
        ty,
        defeated: e.defeated,
        name: e.name,
        fx: existing?.fx ?? tx,
        fy: existing?.fy ?? ty,
        wdx: existing?.wdx ?? 0,
        wdy: existing?.wdy ?? 0,
        wanderTimer: existing?.wanderTimer ?? 0,
        ox: existing?.ox ?? tx,
        oy: existing?.oy ?? ty,
      };
    });
  }, [enemies]);

  const spellRef = useRef<{ active: boolean; t: number; from: "hero" | "enemy" }>({
    active: false,
    t: 0,
    from: "hero",
  });

  useEffect(() => {
    if (!battleResult) {
      lungeRef.current = 0;
      spellRef.current = { active: false, t: 0, from: "hero" };
      return;
    }
    const positive = battleResult === "CORRECT";
    spellRef.current = { active: true, t: 0, from: positive ? "hero" : "enemy" };
    let raf = 0;
    const start = performance.now();
    const dur = 420;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
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
    const onDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "KeyE" || e.code === "Space") {
        const sp = player.current;
        const dist = Math.hypot(sp.tx - 36, sp.ty - 12);
        if (dist < 1.6 && useGameStore.getState().gameState === "EXPLORE") {
          useGameStore.getState().setGachaOpen(true);
          return;
        }
        const distShop = Math.hypot(sp.tx - 43, sp.ty - 12);
        if (distShop < 1.6 && useGameStore.getState().gameState === "EXPLORE") {
          useGameStore.getState().setShopOpen(true);
          return;
        }
      }
    };
    const onUp = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    prepareCtx(ctx);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
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

      const paused = useGameStore.getState().isPaused;
      if (paused) {
        if (!wasPausedRef.current) {
          const sp = player.current;
          useGameStore.getState().saveCheckpoint(sp.tx, sp.ty);
        }
        wasPausedRef.current = true;
        raf = requestAnimationFrame(loop);
        return;
      }
      wasPausedRef.current = false;

      const p = player.current;
      const inBattle = gameState === "BATTLE" || gameState === "BATTLE_TRANSITION";
      p.moving = false;

      const currentUnlocked = useGameStore.getState().unlockedZones;

      if (gameState === "EXPLORE") {
        respawnTickTimer.current += dt;
        if (respawnTickTimer.current >= 1.0) {
          respawnTickTimer.current = 0;
          useGameStore.getState().tickRespawns();
        }

        const dist = Math.hypot(p.tx - 36, p.ty - 12);
        const near = dist < 1.6;
        if (near !== isNearGachaRef.current) {
          isNearGachaRef.current = near;
          setIsNearGacha(near);
        }

        const distShop = Math.hypot(p.tx - 43, p.ty - 12);
        const nearShop = distShop < 1.6;
        if (nearShop !== isNearShopRef.current) {
          isNearShopRef.current = nearShop;
          setIsNearShop(nearShop);
        }

        let dx = 0;
        let dy = 0;
        if (keys.current["KeyW"] || keys.current["ArrowUp"]) dy -= 1;
        if (keys.current["KeyS"] || keys.current["ArrowDown"]) dy += 1;
        if (keys.current["KeyA"] || keys.current["ArrowLeft"]) dx -= 1;
        if (keys.current["KeyD"] || keys.current["ArrowRight"]) dx += 1;

        if (dx !== 0 || dy !== 0) {
          if (dx > 0) p.dir = "right";
          else if (dx < 0) p.dir = "left";
          else if (dy > 0) p.dir = "down";
          else if (dy < 0) p.dir = "up";

          const hasShoes = useGameStore.getState().equippedShoes === "shoes";
          const currentSpeed = SPEED * (hasShoes ? 1.35 : 1.0);
          const step = currentSpeed * dt;
          const tryX = p.tx + dx * step;
          const tryY = p.ty + dy * step;
          const tileX = Math.floor(tryX + 0.5);
          const tileY = Math.floor(p.ty + 0.5);
          if (canWalk(tileX, tileY, currentUnlocked)) p.tx = tryX;
          const tileX2 = Math.floor(p.tx + 0.5);
          const tileY2 = Math.floor(tryY + 0.5);
          if (canWalk(tileX2, tileY2, currentUnlocked)) p.ty = tryY;

          p.moving = true;
          p.anim += dt * 8;

          playerHistory.current.push({ tx: p.tx, ty: p.ty, dir: p.dir });
          if (playerHistory.current.length > 50) {
            playerHistory.current.shift();
          }
        }

        const eStep = SPEED * 0.28 * dt;
        for (const e of enemiesRef.current) {
          if (e.defeated) continue;
          if (currentEnemy && e.id === currentEnemy.id) continue;

          e.wanderTimer -= dt;
          if (e.wanderTimer <= 0) {
            const r = Math.random();
            if (r < 0.25) {
              e.wdx = 0;
              e.wdy = 0;
            } else {
              const ang = Math.random() * Math.PI * 2;
              e.wdx = Math.cos(ang);
              e.wdy = Math.sin(ang);
            }
            e.wanderTimer = 0.6 + Math.random() * 1.6;
          }

          if (e.wdx === 0 && e.wdy === 0) {
            e.tx = Math.round(e.fx);
            e.ty = Math.round(e.fy);
            continue;
          }

          const tryEX = e.fx + e.wdx * eStep;
          const tryEY = e.fy + e.wdy * eStep;
          const eTileX = Math.floor(tryEX + 0.5);
          const eTileY = Math.floor(tryEY + 0.5);
          let moved = false;
          if (canWalk(eTileX, eTileY, currentUnlocked)) {
            e.fx = tryEX;
            e.fy = tryEY;
            moved = true;
          } else if (canWalk(Math.floor(tryEX + 0.5), Math.floor(e.fy + 0.5), currentUnlocked)) {
            e.fx = tryEX;
            moved = true;
          } else if (canWalk(Math.floor(e.fx + 0.5), Math.floor(tryEY + 0.5), currentUnlocked)) {
            e.fy = tryEY;
            moved = true;
          }
          if (!moved) {
            e.wanderTimer = 0;
          }

          const dxo = e.ox - e.fx;
          const dyo = e.oy - e.fy;
          const distO = Math.hypot(dxo, dyo);
          const maxRoam = 5;
          if (distO > maxRoam && (e.wdx !== 0 || e.wdy !== 0)) {
            const len = Math.hypot(e.wdx, e.wdy) || 1;
            e.wdx = (dxo / distO) * len;
            e.wdy = (dyo / distO) * len;
          }

          e.tx = Math.round(e.fx);
          e.ty = Math.round(e.fy);
        }

        for (const e of enemiesRef.current) {
          if (e.defeated) continue;
          if (currentEnemy && e.id === currentEnemy.id) continue;
          const ddx = p.tx - e.tx;
          const ddy = p.ty - e.ty;
          if (ddx * ddx + ddy * ddy < 0.8) {
            enterBattleTransition(e.id, { tx: p.tx, ty: p.ty });
            break;
          }
        }
      }

      const worldW = MAP_COLS * TILE * SCALE;
      const worldH = MAP_ROWS * TILE * SCALE;
      let targetCamX = p.tx * TILE * SCALE + (TILE * SCALE) / 2 - vw / 2;
      let targetCamY = p.ty * TILE * SCALE + (TILE * SCALE) / 2 - vh / 2;
      targetCamX = worldW <= vw ? (worldW - vw) / 2 : clamp(targetCamX, 0, worldW - vw);
      targetCamY = worldH <= vh ? (worldH - vh) / 2 : clamp(targetCamY, 0, worldH - vh);
      cam.current.x += (targetCamX - cam.current.x) * Math.min(1, dt * 8);
      cam.current.y += (targetCamY - cam.current.y) * Math.min(1, dt * 8);

      ctx.clearRect(0, 0, vw, vh);
      const camX = Math.round(cam.current.x);
      const camY = Math.round(cam.current.y);

      // Track player zone — trigger fade-in when entering a newly unlocked zone
      const pZone = p.tx < 28 ? (p.ty < 24 ? 1 : 4) : p.ty < 24 ? 2 : 3;
      if (pZone !== lastZoneRef.current) {
        lastZoneRef.current = pZone;
        // Start a fade-in for this zone if not already fully revealed
        if (!zoneRevealRef.current.has(pZone)) {
          zoneRevealRef.current.set(pZone, 1.0); // start dark
        }
      }
      // Tick zone reveal alpha toward 0 (revealed) at ~0.5/s
      for (const [z, alpha] of zoneRevealRef.current) {
        const next = Math.max(0, alpha - dt * 0.5);
        zoneRevealRef.current.set(z, next);
      }

      if (inBattle) {
        drawBattleBackground(ctx, vw, vh, now);
      } else {
        const startCol = Math.floor(camX / (TILE * SCALE));
        const startRow = Math.floor(camY / (TILE * SCALE));
        for (let row = startRow; row <= startRow + viewTilesY + 1; row++) {
          for (let col = startCol; col <= startCol + viewTilesX + 1; col++) {
            const code =
              row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS
                ? 0
                : MAP[row][col];
            drawForestTile(ctx, code, col, row, col * TILE * SCALE - camX, row * TILE * SCALE - camY, now, currentUnlocked);
            if (col === 36 && row === 12) {
              drawGachaMachine(ctx, col * TILE * SCALE - camX, row * TILE * SCALE - camY, TILE * SCALE, now);
            }
            if (col === 43 && row === 12) {
              drawShopNPC(ctx, col * TILE * SCALE - camX, row * TILE * SCALE - camY, TILE * SCALE, now);
            }
          }
        }

        // ── Soft atmospheric fog pass: darken locked zones with a per-zone overlay ──
        // We draw a screen-space gradient fog that fades hard at the zone boundary.
        // This creates a moody "focus" look where only your zone is fully lit.
        const fogZones: { zone: number; revealAlpha: number }[] = [];
        for (let z = 1; z <= 4; z++) {
          if (!currentUnlocked.includes(z)) {
            fogZones.push({ zone: z, revealAlpha: 0 });
          } else {
            const ra = zoneRevealRef.current.get(z);
            if (ra !== undefined && ra > 0) {
              fogZones.push({ zone: z, revealAlpha: ra });
            }
          }
        }
        for (const { zone, revealAlpha } of fogZones) {
          // Determine screen rect of this zone
          let zx1: number, zy1: number, zx2: number, zy2: number;
          if (zone === 1) { zx1 = 2; zy1 = 2; zx2 = 24; zy2 = 20; }
          else if (zone === 2) { zx1 = 31; zy1 = 2; zx2 = 53; zy2 = 20; }
          else if (zone === 3) { zx1 = 31; zy1 = 27; zx2 = 53; zy2 = 45; }
          else { zx1 = 2; zy1 = 27; zx2 = 24; zy2 = 45; }
          const sx = zx1 * TILE * SCALE - camX;
          const sy = zy1 * TILE * SCALE - camY;
          const sw = (zx2 - zx1) * TILE * SCALE;
          const sh = (zy2 - zy1) * TILE * SCALE;
          const alpha = currentUnlocked.includes(zone) ? revealAlpha : 0.93;
          ctx.fillStyle = `rgba(8,5,20,${alpha.toFixed(2)})`;
          ctx.fillRect(sx, sy, sw, sh);
        }
      }

      type Drawable = {
        ty: number;
        tx: number;
        fx: number;
        fy: number;
        kind: "hero" | "enemy" | "pet";
        id?: string;
        petKind?: 'dog' | 'cat' | 'pig';
        petDir?: Dir;
      };
      const list: Drawable[] = [];
      list.push({ ty: p.ty, tx: p.tx, fx: p.tx, fy: p.ty, kind: "hero" });

      const equippedPet = useGameStore.getState().equippedPet;
      if (equippedPet && gameState === "EXPLORE") {
        const petIdx = Math.max(0, playerHistory.current.length - 15);
        const petPos = playerHistory.current[petIdx] || { tx: p.tx, ty: p.ty, dir: p.dir };
        list.push({
          ty: petPos.ty,
          tx: petPos.tx,
          fx: petPos.tx,
          fy: petPos.ty,
          kind: "pet",
          petKind: equippedPet as 'dog' | 'cat' | 'pig',
          petDir: petPos.dir
        });
      }

      for (const e of enemiesRef.current) {
        if (e.defeated) continue;
        const eZone = e.tx < 28 ? (e.ty < 24 ? 1 : 4) : e.ty < 24 ? 2 : 3;
        if (!currentUnlocked.includes(eZone)) continue;
        list.push({ ty: e.ty, tx: e.tx, fx: e.fx, fy: e.fy, kind: "enemy", id: e.id });
      }
      list.sort((a, b) => a.ty - b.ty);

      const frame = Math.floor(p.anim);
      let heroSX = 0;
      let heroSY = 0;
      let enemySX = 0;
      let enemySY = 0;
      let hasEnemy = false;

      if (inBattle) {
        const battleScale = 3.8;
        const groundY = vh * 0.64;
        const topY = groundY - TILE * SCALE * battleScale;
        const heroX = vw * 0.3 - (TILE * SCALE) / 2;
        const enemyX = vw * 0.62 - (TILE * SCALE) / 2;
        heroSX = heroX;
        heroSY = topY;
        enemySX = enemyX;
        enemySY = topY;
        hasEnemy = true;

        const hcx = heroX + (TILE * SCALE * battleScale) / 2;
        const ecx = enemyX + (TILE * SCALE * battleScale) / 2;
        drawMagicCircle(ctx, hcx, groundY, TILE * SCALE * battleScale * 0.62, "#7fd4ff", now / 600);
        drawMagicCircle(ctx, ecx, groundY, TILE * SCALE * battleScale * 0.62, "#ff7a7a", now / 600 + 1.7);

        const casting = spellRef.current.active;
        const fromHero = spellRef.current.from === "hero";
        const heroPose = casting && fromHero ? "attack" : "idle";
        const enemyPose = casting && !fromHero ? "attack" : "idle";
        const aFrame = casting ? Math.floor(now / 90) : 0;

        const offX = lungeRef.current * 30 * SCALE;
        drawHero(ctx, heroX + offX, topY, "right", aFrame, false, battleScale, heroPose);

        const eOffX = lungeRef.current * -30 * SCALE;
        const hit = battleResult === "WRONG";
        const enemyBattleScale = battleScale;
        const enemyTopY = topY;
        drawEnemy(ctx, enemyX + eOffX, enemyTopY, aFrame, hit, enemyBattleScale, enemyPose, false);
      } else {
        for (const d of list) {
          const sx = d.fx * TILE * SCALE - camX;
          const sy = d.fy * TILE * SCALE - camY;
          if (d.kind === "hero") {
            heroSX = sx;
            heroSY = sy;
            const offX = p.dir === "left" ? lungeRef.current * -18 * SCALE : p.dir === "right" ? lungeRef.current * 18 * SCALE : 0;
            drawHero(ctx, sx + offX, sy, p.dir, frame, p.moving && !inBattle);
            if (playerName) drawNameTag(ctx, sx + offX + (TILE * SCALE) / 2, sy - 4, playerName);
          } else if (d.kind === "pet") {
            drawPet(ctx, sx, sy, d.petKind!, frame, d.petDir!);
          } else {
            const isCurrent = currentEnemy && d.id === currentEnemy.id;
            if (isCurrent) {
              hasEnemy = true;
              enemySX = sx;
              enemySY = sy;
            }
            const ev = enemiesRef.current.find((e) => e.id === d.id);
            const enemyMoving = !!(ev && (ev.wdx !== 0 || ev.wdy !== 0));
            const scaleBoost = isCurrent ? 1.6 : 1;
            const hit = !!(isCurrent && battleResult === "WRONG");
            const eFrame = enemyMoving ? Math.floor(now / 110) : 0;
            drawEnemy(ctx, sx, sy, eFrame, hit, scaleBoost, enemyMoving ? "walk" : "idle");
          }
        }
      }

      if (inBattle && spellRef.current.active && hasEnemy) {
        drawSpellEffect(ctx, spellRef.current, heroSX, heroSY, enemySX, enemySY);
      }

      if (inBattle) {
        const grad = ctx.createRadialGradient(vw / 2, vh * 0.5, vh * 0.35, vw / 2, vh * 0.5, vh * 0.75);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.28)");
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
      <canvas ref={canvasRef} className="image-rendering-pixelated border-0 block" style={{ width: "100vw", height: "100vh" }} />

      {/* Zone Unlock Notification Banner */}
      {zoneBanner && gameState === "EXPLORE" && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-slide-down">
          <div className="bg-[#fdf5df] border-4 border-[#f8a820] outline outline-4 outline-[#a31c5d] -outline-offset-8 px-6 py-3 shadow-lg text-center">
            <p className="font-pixel font-bold text-sm text-[#a31c5d]">
              {zoneBanner}
            </p>
          </div>
        </div>
      )}

      {/* Gacha Machine Proximity Interaction Alert */}
      {isNearGacha && gameState === "EXPLORE" && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
          <div className="bg-[#1e1b18] border-2 border-[#ffd700] px-4 py-2 text-center text-xs text-[#ffd700] font-pixel shadow-md pointer-events-auto">
            🪙 ใกล้ตู้สุ่มสัตว์เลี้ยง! กด <span className="text-white bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">Space</span> หรือ <span className="text-white bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">E</span> เพื่อเปิดตู้นี้
          </div>
        </div>
      )}

      {/* Shop Proximity Interaction Alert */}
      {isNearShop && gameState === "EXPLORE" && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
          <div className="bg-[#1e1b18] border-2 border-[#ff9900] px-4 py-2 text-center text-xs text-[#ff9900] font-pixel shadow-md pointer-events-auto">
            🛒 ใกล้ร้านค้าอุปกรณ์! กด <span className="text-white bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">Space</span> หรือ <span className="text-white bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">E</span> เพื่อเปิดร้านค้า
          </div>
        </div>
      )}
    </div>
  );
}

function canWalk(tx: number, ty: number, unlockedZones: number[] = [1]): boolean {
  if (ty < 0 || ty >= MAP_ROWS || tx < 0 || tx >= MAP_COLS) return false;
  if (tx === 36 && ty === 12) return false; // Gacha machine collision
  if (tx === 43 && ty === 12) return false;   // Shop NPC collision
  const code = MAP[ty][tx];
  if (code === T.TREE || code === T.ROCK || code === T.WATER) return false;
  if (code === T.GATE_1_2) return unlockedZones.includes(2);
  if (code === T.GATE_2_3) return unlockedZones.includes(3);
  if (code === T.GATE_3_4) return unlockedZones.includes(4);
  return true;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
