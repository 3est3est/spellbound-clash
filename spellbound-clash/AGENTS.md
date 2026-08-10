# AGENTS.md — Spellbound Clash

Guide for any AI agent working in this repo. Read this first, then the docs under `docs/` before touching art/asset code.

## Stack

- React 19 + Vite 8 + TypeScript, Zustand, TailwindCSS 4
- Game rendered with **raw HTML5 Canvas 2D** (no game engine, no Three.js — do not re-add)
- Types/interfaces in `src/types/game.types.ts`, store in `src/store/useGameStore.ts`

## Commands

| Task | Command |
|------|---------|
| Dev server | `bun dev` or `npm run dev` (port 5173) |
| Type-check | `npx tsc --noEmit -p tsconfig.app.json` |
| Build (tsc + vite) | `npm run build` |
| Lint | `npm run lint` (oxlint) |
| Preview build | `npm run preview` |

**Verification order before shipping any change:** run type-check → build → lint. Existing oxlint warnings (erasing-op at `CharRenderer.ts:101`, `TileRenderer.ts:355`; exhaustive-deps at `GameCanvas.tsx:503`) are pre-existing — don't add new ones.

## Key files

| File | Purpose |
|------|---------|
| `src/game/constants.ts` | TILE(16), SCALE(3), map size, `COLORS`, `Dir` |
| `src/game/sprites/heroSprites.ts` / `enemySprites.ts` | Sprite config (urls, sizes, cast/battle variants) |
| `src/game/sprites/SpriteSheet.ts` | Sheet registry + auto-register per config |
| `src/game/sprites/SpriteAnimator.ts` | `SPRITE_MAP` → which sheet/frame per action |
| `src/game/rendering/CharRenderer.ts` | Draw hero/enemy (image or procedural fallback) |
| `src/game/rendering/EffectRenderer.ts` | Battle spell projectile (rotating glyph images) |
| `src/game/rendering/BattleRenderer.ts` | Battle background + magic circles |
| `src/game/rendering/TileRenderer.ts` | Tile draw + fog + gates |
| `src/components/render/GameCanvas.tsx` | Main loop, camera, battle stage, input |
| `src/components/ui/BattleOverlay.tsx` | Question/timer/HP overlay during battle |
| `src/game/assets/tileAssets.ts` | Decoration image slots (arrays are empty; fallback procedural) |

## Ground rules

- Follow existing code style; do not add comments unless asked.
- Do not modify `dist/`, do not add Three.js, do not delete files referenced by `heroSprites.ts`/`enemySprites.ts`/`tileAssets.ts`.
- `DASHSCOPE_API_KEY` lives in `.env.local` (gitignored) — never commit or log keys.
- Generated art is **single images** loaded per config (see `docs/ASSET_PIPELINE.md`). Never assume a multi-frame sheet; `walkFrames` default is 1.
- The agent has no vision: every generated image must be shown to the user for approval via `scripts/build-preview.mjs` previews before using.

## Before touching art/assets

Read, in order:
1. `docs/art-direction-brief.md` — visual locks, palettes, sizes
2. `docs/ASSET_PIPELINE.md` — how to generate/process sprites
3. `assets/asset-manifest.json` — current asset inventory & status
4. `docs/DECISIONS.md` — why things are the way they are (avoid re-deciding)