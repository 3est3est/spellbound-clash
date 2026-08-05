# Project Name: Spellbound Clash
# Tech Stack: React + Vite + TypeScript + Zustand + TailwindCSS + HTML5 Canvas 2D

> **Last Updated:** 2026-08-05  
> Original stack included Three.js — **this has been removed**. The game now uses HTML5 Canvas 2D with a custom tile renderer.

---

## 1. Core Concept
Spellbound Clash is an Educational RPG where players explore a 2.5D top-down pixel map across 4 distinct zones. Players walk around and encounter enemies. When colliding with an enemy, a turn-based battle begins where the player must translate difficult English vocabulary words into Thai — similar to Pokémon's encounter system.

---

## 2. Game Flow
```
MENU (Select Difficulty)
  → EXPLORE (Walk on Map, Zone 1)
    → [Zone Cleared] → Gate Unlocked → Cross Tunnel → Next Zone
  → [Encounter Enemy] → BATTLE_TRANSITION (Pokémon-style flash)
    → BATTLE (Vocab Quiz: 4-choice English→Thai)
      → [Enemy HP = 0] → Enemy removed → EXPLORE (continue)
      → [Player HP = 0] → GAMEOVER
  → [All 12 Enemies Defeated] → WIN
```

---

## 3. Difficulty Modes (Selected at Menu)

| Setting              | Easy   | Medium | Hard   |
|----------------------|:------:|:------:|:------:|
| **Player HP ❤️**    | 5      | 3      | 1      |
| **Enemy HP ❤️**     | 5      | 7      | 10     |
| **Questions/Battle** | 5      | 7      | 10     |
| **Timer/Question**   | 10 sec | 7 sec  | 5 sec  |
| **Vocab Level**      | Basic  | Intermediate | Advanced |

- Enemy HP = Number of questions to answer correctly to defeat it.
- Player HP persists across all battles. HP = 0 → GAMEOVER.
- Timer expiry counts as wrong answer (player loses 1 HP).

---

## 4. Map & Exploration

### Grid
- **Total map:** 56×48 tiles (`MAP_COLS=56`, `MAP_ROWS=48`)
- **Tile size:** 16px × 3 scale = 48px per tile on screen (`TILE=16`, `SCALE=3`)
- **View:** Camera follows player, roughly 22×16 tiles visible at once

### Zone Layout (4 Zones)
```
[Zone 1: Forest]  [  buffer  ]  [Zone 2: Autumn]
[  8 tile gap  ]  [ corridor ]  [  8 tile gap  ]
[ Zone 4: Lava ]  [  buffer  ]  [ Zone 3: Snow ]
```

| Zone | Theme | Grid Bounds (x, y) | Player Spawn |
|------|-------|-------------------|-------------|
| 1 | 🌿 Emerald Forest | x:3-23, y:3-19 | tx=3, ty=4 |
| 2 | 🍂 Autumn/Desert | x:32-52, y:3-19 | Enters from corridor left |
| 3 | ❄️ Frostbite Ridge | x:32-52, y:28-44 | Enters from corridor top |
| 4 | 🔥 Volcanic Wasteland | x:3-23, y:28-44 | Enters from corridor right |

### Zone Connections (Corridors / Tunnel Gates)
| Gate Tile | Direction | Grid Position | Unlocked When |
|-----------|-----------|--------------|---------------|
| `T.GATE_1_2 = 6` | Zone 1 → Zone 2 (East) | x=27, y=10-11 | Zone 2 enemies cleared |
| `T.GATE_2_3 = 7` | Zone 2 → Zone 3 (South) | x=42-43, y=23 | Zone 3 enemies cleared |
| `T.GATE_3_4 = 8` | Zone 3 → Zone 4 (West) | x=27, y=36-37 | Zone 4 enemies cleared |

### Tile Codes (`src/game/constants.ts`)
| Code | Value | Type | Walkable |
|------|-------|------|----------|
| `T.GRASS` | 0 | Floor | ✅ |
| `T.PATH` | 1 | Floor | ✅ |
| `T.TREE` | 2 | Solid | ❌ |
| `T.ROCK` | 3 | Solid | ❌ |
| `T.WATER` | 4 | Solid | ❌ |
| `T.FLOWER` | 5 | Floor Decoration | ✅ |
| `T.GATE_1_2` | 6 | Gate | ❌ until Zone 2 unlocked |
| `T.GATE_2_3` | 7 | Gate | ❌ until Zone 3 unlocked |
| `T.GATE_3_4` | 8 | Gate | ❌ until Zone 4 unlocked |

---

## 5. Fog of War & Zone Reveal System

- **Locked zones:** Covered by dark fog overlay `rgba(8,5,20, 0.93)` — terrain is barely visible, enemies are hidden
- **Newly unlocked zones:** When player walks in for the first time → **2-second smooth fade-in** (alpha decreases from 1.0 → 0 at 0.5/sec)
- **Enemy hiding:** Enemies in locked zones are filtered from the drawable list (not just visually hidden)
- **Implementation:** `GameCanvas.tsx` — `zoneRevealRef`, `lastZoneRef`, fog pass after tile render

---

## 6. Enemy System

### Enemy Placement (`src/game/enemyPlacement.ts`)
12 total enemies, 3 per zone:

| Zone | Enemy Name | Spawn Position |
|------|-----------|---------------|
| 1 | ก็อบลินเงา, วิญญาณแห่งป่า, สไลม์พิษ | (8,5), (18,14), (8,16) |
| 2 | โทรลล์ใบไม้ร่วง, ปีศาจทะเลทราย, แมงมุมถ้ำส้ม | (40,6), (49,15), (42,18) |
| 3 | ค้างคาวน้ำแข็ง, อสูรหิมะ, หมาป่าเหมันต์ | (43,33), (49,40), (35,41) |
| 4 | มังกรเพลิงเถ้า, โกเลมลาวา, จอมมารเงามืด | (14,31), (5,42), (16,42) |

### Enemy AI (Wander)
- Max roam radius: 5 tiles from spawn origin
- Wander timer: 0.6 – 2.2 seconds per direction change
- Speed: `SPEED * 0.28` tiles/sec
- Enemies cannot walk through solid tiles

### Zone Unlock Trigger
- Zone cleared when all 3 enemies in that zone are `defeated = true`
- `defeatEnemy()` in `useGameStore.ts` checks zone, adds to `unlockedZones[]`, fires `zoneBanner`

---

## 7. Battle System

- **Trigger:** Player distance < 0.8 tiles to enemy
- **Transition:** `BATTLE_TRANSITION` state → CSS animation → `BATTLE` state
- **Battle:** Split screen — top = characters, bottom = vocab quiz
- **Attack animation:** `lungeRef`, `spellRef` drive lunge + magic circle effect
- **Result:** CORRECT → enemy -1 HP, WRONG/TIMEOUT → player -1 HP

### Question Format
- Display English word → select correct Thai translation (4 choices)
- Source: `src/data/vocabQuestions.json`
- Never repeats within a playthrough (`usedQuestionIds[]`)
- Minimum 25 questions required; 36+ recommended for Hard mode (12 enemies × 10 Qs)

---

## 8. Rendering Architecture

### Canvas 2D Pipeline (`src/components/render/GameCanvas.tsx`)
```
requestAnimationFrame loop:
  1. Update player position (WASD input + collision)
  2. Update enemy wander AI
  3. Check enemy encounter trigger
  4. Update camera (smooth lerp to player)
  5. Draw tiles: drawForestTile() per visible tile
  6. Draw fog overlay pass (locked zones / fade-in)
  7. Draw drawables (hero + visible enemies) sorted by Y
  8. Draw battle scene if inBattle
  9. Draw spell effects
  10. Draw vignette overlay
```

### Tile Renderer (`src/game/rendering/TileRenderer.ts`)
- `drawForestTile(ctx, code, tx, ty, screenX, screenY, now, unlockedZones)`
- Zone theme auto-detected via `getZoneAt(tx, ty)`
- Assets rendered at **natural pixel scale** (max 1.5× tile size, no stretching)
- Locked zone tiles: draw muted terrain + heavy fog; gate tiles render on top
- Tunnel gate: `drawTunnel()` — cliff archway with glowing interior (open) or purple rune seal (locked)

### Asset Loading (`src/game/assets/`)
- `loadAsset(url)` → creates `HTMLImageElement`, triggers load
- `loadAssets(urls[])` → batch load
- Assets referenced from `public/assets/` — **do NOT move or rename these files**

---

## 9. State Management (`src/store/useGameStore.ts`)

Key state fields added/modified:
```typescript
unlockedZones: number[]        // [1] initially, grows as zones cleared
zoneBanner: string | null      // Banner text for zone unlock notification
clearZoneBanner: () => void    // Clears banner after 4.5s
defeatEnemy: (id: string) => void  // Checks zone clear, unlocks next zone
playerPos: { tx: number, ty: number }  // Saved on pause
```

---

## 10. Directory Structure (Current)

```
spellbound-clash/
├── public/
│   └── assets/              ← DO NOT TOUCH — Pixel Art assets
│       ├── craftpix-net-385863-free-top-down-trees-pixel-art/
│       ├── craftpix-net-141354-free-top-down-bushes-pixel-art/
│       ├── craftpix-net-823949-free-nature-backgrounds-pixel-art/
│       └── mana seed seasonal forest sample (summer)/
└── src/
    ├── game/
    │   ├── constants.ts        ← TILE, SCALE, MAP_COLS/ROWS, TileCode, T.*
    │   ├── tilemap.ts          ← buildMap(), getZoneAt(), MAP[][]
    │   ├── enemyPlacement.ts   ← ZONE_ENEMIES[], ZoneEnemySpec
    │   └── assets/
    │   │   ├── AssetLoader.ts
    │   │   └── tileAssets.ts   ← zone1-4 Trees/Bushes, waterSparkles
    │   ├── rendering/
    │   │   ├── index.ts        ← re-exports all renderers
    │   │   ├── TileRenderer.ts ← drawForestTile, drawTunnel, Fog of War
    │   │   ├── CharRenderer.ts ← drawHero, drawEnemy, drawNameTag
    │   │   ├── BattleRenderer.ts
    │   │   └── EffectRenderer.ts
    │   └── sprites/
    │       ├── SpriteSheet.ts, SpriteAnimator.ts
    │       ├── heroSprites.ts, enemySprites.ts
    │       └── index.ts
    ├── components/
    │   ├── render/
    │   │   └── GameCanvas.tsx  ← Main canvas loop, camera, fog, zone reveal
    │   └── ui/
    │       ├── MainMenu.tsx, HUD.tsx, BattleOverlay.tsx
    │       ├── BattleTransition.tsx, VictoryScreen.tsx, GameOver.tsx
    ├── store/
    │   └── useGameStore.ts
    └── data/
        └── vocabQuestions.json
```

---

## 11. Key Implementation Rules

1. **Do NOT use Three.js** — removed. Use HTML5 Canvas 2D only.
2. **Do NOT modify `public/` directory** — assets are loaded by URL reference.
3. **Tile collision** is determined by `isBlocked(code)` in `constants.ts`.
4. **Zone detection** uses `getZoneAt(tx, ty)` in `tilemap.ts` (split at x=28, y=24).
5. **Enemy zone detection** in `GameCanvas.tsx`: `eZone = e.tx < 28 ? (e.ty < 24 ? 1 : 4) : e.ty < 24 ? 2 : 3`
6. **Tile render scale:** TILE=16, SCALE=3 → 48px per tile on screen.
7. **Player spawn** is protected: always set tx=3, ty=4 as GRASS after map build.
8. **Victory condition** needs update: currently triggers at `enemiesDefeated === totalEnemies`. `totalEnemies` should be 12.

---

## 12. Win & Lose Conditions

| State | Condition |
|-------|-----------|
| 🏆 WIN | `enemiesDefeated >= 12` (all 4 zones cleared) |
| 💀 GAMEOVER | `playerHP <= 0` during any battle |

---

## 13. Things Implemented vs. Original MVP Plan

| Feature | MVP Plan | Current Status |
|---------|----------|---------------|
| 3D Three.js rendering | ✅ Planned | ❌ Removed → Canvas 2D |
| Single forest map | ✅ Planned | ⬆️ Extended → 4 zones |
| 3 enemies | ✅ Planned | ⬆️ Extended → 12 enemies (3/zone) |
| Pixel Art assets | 🔮 Future | ✅ Implemented (zone-specific) |
| Fog of War | 🔮 Future | ✅ Implemented (zone-level) |
| Zone progression | 🔮 Future | ✅ Implemented (4-zone unlock chain) |
| Battle system | ✅ Planned | ✅ Implemented |
| Vocab quiz | ✅ Planned | ✅ Implemented |
| Pokémon transition | ✅ Planned | ✅ Implemented |

---

## 14. Future Enhancements (Not Yet Done)

- [ ] Sprite Pixel Art for hero and enemies (infrastructure ready in `src/game/sprites/`)
- [ ] Victory condition fix for 12 enemies total
- [ ] Sound effects & background music per zone
- [ ] Save/load progress between sessions
- [ ] Enemy variety per zone (visual differences)
- [ ] Boss enemy in Zone 4 final slot
- [ ] Leaderboard / high score system
- [ ] Mobile / touch support
- [ ] More question types (fill-in, matching, audio)
- [ ] Multiplayer mode
