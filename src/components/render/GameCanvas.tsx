import { useEffect, useRef } from "react";
import { useGameStore } from "../../store/useGameStore";
import { TILE, SCALE, MAP_COLS, MAP_ROWS, type Dir } from "../../game/constants";
import { MAP } from "../../game/tilemap";
import { prepareCtx, drawForestTile, drawHero, drawEnemy, drawBattleBackground, pickRandomNatureBg, setNatureBg } from "../../game/draw";

const SPEED = 4.5; // tiles per second

interface EnemyView {
  id: string;
  tx: number;
  ty: number;
  defeated: boolean;
  name: string;
  // Live (float) position used by the wander AI. Starts at the store's
  // placed tile; enemy strolls around randomly like in classic RPGs.
  fx: number;
  fy: number;
  // Current wander direction (unit-ish vector) and a countdown (seconds)
  // until the enemy picks a new random heading.
  wdx: number;
  wdy: number;
  wanderTimer: number;
  // Origin tile the enemy tends to roam around (keeps it near its spawn).
  ox: number;
  oy: number;
}

// The store now stores enemy positions as 2D tile coords [tx, y, ty],
// so we can use them directly.
function enemyToTile(pos: [number, number, number]): { tx: number; ty: number } {
  const tx = Math.round(pos[0]);
  const ty = Math.round(pos[2]);
  return { tx: Math.max(1, Math.min(MAP_COLS - 2, tx)), ty: Math.max(1, Math.min(MAP_ROWS - 2, ty)) };
}

function drawNameTag(ctx: CanvasRenderingContext2D, cx: number, boxBottomY: number, name: string) {
  ctx.save();
  ctx.font = 'bold 12px "Press Start 2P", "Kanit", monospace';
  ctx.imageSmoothingEnabled = false;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  const h = 16;
  const y = boxBottomY - h;
  
  // Shadow for readability
  ctx.fillStyle = "#000000";
  ctx.fillText(name, cx + 1, y + 1);
  ctx.fillText(name, cx + 2, y + 2);

  // Name text - Cute bright pink color to match new theme
  ctx.fillStyle = "#ff66aa";
  ctx.fillText(name, cx, y);
  
  ctx.restore();
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const player = useRef({ tx: 3, ty: 4, dir: "down" as Dir, anim: 0, moving: false });
  const cam = useRef({ x: 0, y: 0 });
  const enemiesRef = useRef<EnemyView[]>([]);
  const lungeRef = useRef(0); // -1..1 offset applied to hero during battle
  const wasPausedRef = useRef(false); // detects the transition into pause

  const gameState = useGameStore((s) => s.gameState);
  const enemies = useGameStore((s) => s.enemies);
  const battleResult = useGameStore((s) => s.battleResult);
  const currentEnemy = useGameStore((s) => s.currentEnemy);
  const playerName = useGameStore((s) => s.playerName);

  // Pick a random nature backdrop for battle scenes once per session.
  useEffect(() => {
    const idx = pickRandomNatureBg();
    setNatureBg(idx);
  }, []);

  // When (re)entering EXPLORE, place the player at the saved position so a
  // continued game resumes exactly where it was left off.
  useEffect(() => {
    if (gameState === "EXPLORE") {
      const pos = useGameStore.getState().playerPos;
      player.current.tx = pos.tx;
      player.current.ty = pos.ty;
    }
  }, [gameState]);

  // Sync enemies from the store into a local view model. Preserve the
  // live float position across syncs so the wander AI doesn't snap back.
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

  // Battle lunge animation driver.
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

      // ---- Pause freeze ----
      // When the game is paused we skip ALL simulation (movement, enemy
      // wander, collision, spell FX) but still repaint the last frame so
      // the frozen scene stays visible behind the pause menu.
      const paused = useGameStore.getState().isPaused;
      if (paused) {
        // On the frame we *enter* pause, checkpoint the live player position
        // so "Exit" / a later "Continue" resumes at this exact spot.
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

      // ---- Movement (locked during battle) ----
      if (gameState === "EXPLORE") {
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

        // ---- Enemy wander AI (Pokémon-style) ----
        // Each living enemy strolls around its spawn at random, slowly
        // changing direction now and then. It does NOT chase the player;
        // the player walks into enemies to start a battle. This keeps the
        // world feeling alive without a horde swarming the hero.
        const eStep = SPEED * 0.28 * dt;
        for (const e of enemiesRef.current) {
          if (e.defeated) continue;
          if (currentEnemy && e.id === currentEnemy.id) continue;

          // Countdown to picking a new random heading.
          e.wanderTimer -= dt;
          if (e.wanderTimer <= 0) {
            // Mostly keep drifting, sometimes pause, sometimes turn.
            const r = Math.random();
            if (r < 0.25) {
              e.wdx = 0; e.wdy = 0; // idle a moment
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
          // Try the chosen direction; if blocked, slide on one axis; if
          // still blocked, pick a fresh direction next tick.
          if (canWalk(eTileX, eTileY)) {
            e.fx = tryEX;
            e.fy = tryEY;
            moved = true;
          } else if (canWalk(Math.floor(tryEX + 0.5), Math.floor(e.fy + 0.5))) {
            e.fx = tryEX;
            moved = true;
          } else if (canWalk(Math.floor(e.fx + 0.5), Math.floor(tryEY + 0.5))) {
            e.fy = tryEY;
            moved = true;
          }
          if (!moved) {
            e.wanderTimer = 0; // re-roll a direction next frame
          }

          // Gently pull back toward the spawn so enemies don't wander off-map.
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

        // ---- Enemy collision ----
        for (const e of enemiesRef.current) {
          if (e.defeated) continue;
          // Skip the enemy we're already fighting so we don't re-trigger.
          if (currentEnemy && e.id === currentEnemy.id) continue;
          const ddx = p.tx - e.tx;
          const ddy = p.ty - e.ty;
          // Distance-squared check (was a typo: ddx*ddx). Trigger when
          // the player is within ~0.9 tiles of the enemy.
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
            drawForestTile(ctx, code, col, row, col * TILE * SCALE - camX, row * TILE * SCALE - camY, now);
          }
        }
      }

      // Sprites sorted by tile-y so lower ones draw on top.
      type Drawable = { ty: number; tx: number; fx: number; fy: number; kind: "hero" | "enemy"; id?: string };
      const list: Drawable[] = [];
      list.push({ ty: p.ty, tx: p.tx, fx: p.tx, fy: p.ty, kind: "hero" });
      for (const e of enemiesRef.current) {
        if (e.defeated) continue;
        list.push({ ty: e.ty, tx: e.tx, fx: e.fx, fy: e.fy, kind: "enemy", id: e.id });
      }
      list.sort((a, b) => a.ty - b.ty);

      const frame = Math.floor(p.anim);
      // Track the on-screen positions of hero & active enemy for the spell FX.
      let heroSX = 0;
      let heroSY = 0;
      let enemySX = 0;
      let enemySY = 0;
      let hasEnemy = false;

      if (inBattle) {
        // ---- Battle arena: a dedicated full-screen duel stage. Both
        // combatants are the SAME size and stand on the SAME ground line,
        // facing each other (hero left→right, enemy right→left). They idle
        // by default and strike the "release power" attack pose while a
        // spell is firing. Glowing magic circles power them up. ----
        const battleScale = 3.8;
        const groundY = vh * 0.64; // shared feet baseline
        const topY = groundY - TILE * SCALE * battleScale;
        const heroX = vw * 0.30 - (TILE * SCALE) / 2;
        const enemyX = vw * 0.62 - (TILE * SCALE) / 2;
        heroSX = heroX;
        heroSY = topY;
        enemySX = enemyX;
        enemySY = topY;
        hasEnemy = true;

        // Glowing magic-circle platforms under each fighter's feet.
        const hcx = heroX + (TILE * SCALE * battleScale) / 2;
        const ecx = enemyX + (TILE * SCALE * battleScale) / 2;
        drawMagicCircle(ctx, hcx, groundY, TILE * SCALE * battleScale * 0.62, "#7fd4ff", now / 600);
        drawMagicCircle(ctx, ecx, groundY, TILE * SCALE * battleScale * 0.62, "#ff7a7a", now / 600 + 1.7);

        // Who is casting this frame? (idle unless a spell is in flight)
        const casting = spellRef.current.active;
        const fromHero = spellRef.current.from === "hero";
        const heroPose = casting && fromHero ? "attack" : "idle";
        const enemyPose = casting && !fromHero ? "attack" : "idle";
        const aFrame = casting ? Math.floor(now / 90) : 0;

        // Hero (facing right), lunges forward on a correct answer.
        const offX = lungeRef.current * 30 * SCALE;
        drawHero(ctx, heroX + offX, topY, "right", aFrame, false, battleScale, heroPose);

        // Enemy (facing left), lunges back on a wrong answer.
        const eOffX = lungeRef.current * -30 * SCALE;
        const hit = battleResult === "WRONG";
        // Both combatants use the same scale for a balanced duel.
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

      // ---- Spell / attack FX (during a battle hit) — "release power" ----
      if (inBattle && spellRef.current.active && hasEnemy) {
        const sp = spellRef.current;
        const ah = sp.from === "hero";
        const battleScale = 3.8;
        const scaleA = battleScale;
        const scaleB = battleScale;
        const fromX = (ah ? heroSX : enemySX) + (TILE * SCALE * scaleA) / 2;
        const fromY = (ah ? heroSY : enemySY) + TILE * SCALE * scaleA * 0.45;
        const toX = (ah ? enemySX : heroSX) + (TILE * SCALE * scaleB) / 2;
        const toY = (ah ? enemySY : heroSY) + TILE * SCALE * scaleB * 0.45;
        const color = ah ? "#7fd4ff" : "#ff7a7a";
        const travel = Math.min(1, sp.t / 0.6);

        // Charging aura around the attacker (builds up, then releases).
        const charge = Math.sin(travel * Math.PI);
        const ar = TILE * SCALE * scaleA * (0.45 + charge * 0.55);
        const aura = ctx.createRadialGradient(fromX, fromY, ar * 0.25, fromX, fromY, ar);
        aura.addColorStop(0, color);
        aura.addColorStop(1, "rgba(0,0,0,0)");
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
          // Glowing projectile with a fading trail.
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
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(bx, by, 3 * SCALE, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Big impact burst: expanding rings + sparks.
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
          ctx.fillStyle = "#ffffff";
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 + burst;
            const r = burst * 20 * SCALE;
            ctx.fillRect(toX + Math.cos(a) * r - SCALE, toY + Math.sin(a) * r - SCALE, 2.4 * SCALE, 2.4 * SCALE);
          }
        }
      }

      // ---- Battle vignette: very soft edge darkening to frame the duel ----
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
    </div>
  );
}

// A glowing, pulsing, slowly-rotating magic circle drawn flat on the ground
// beneath a fighter — sells the "powered up / releasing energy" vibe.
function drawMagicCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  phase: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.42); // flatten into the ground plane
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = 0.18 + 0.12 * Math.sin(phase * Math.PI * 2);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.6 + 0.25 * Math.sin(phase * Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(phase);
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(r * 0.72, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function canWalk(tx: number, ty: number): boolean {
  if (ty < 0 || ty >= MAP_ROWS || tx < 0 || tx >= MAP_COLS) return false;
  const code = MAP[ty][tx];
  return code !== 2 && code !== 3 && code !== 4; // tree/rock/water
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
