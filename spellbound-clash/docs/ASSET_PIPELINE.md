# Asset pipeline — how sprites are made

All game sprites are generated locally + processed with Node scripts using `pngjs`. No paid service beyond the user's QwenCloud free quota.

## Prerequisites

- `DASHSCOPE_API_KEY` in `.env.local` (gitignored). Scripts load it automatically.
- `pngjs` (devDependency). Install if missing: `npm i -D pngjs`

## The 4-step pipeline

For each character/asset:

### 1. Generate (`scripts/gen-sprite-qwen.mjs` / `scripts/gen-sprite-qwen-ref.mjs`)
```bash
SC_GEN_SIZE='512*512' node scripts/gen-sprite-qwen.mjs "<prompt>" <name>-px.png
# variation that keeps the same character (hair/outfit/palette): pass the source art as reference
SC_GEN_SIZE='512*512' node scripts/gen-sprite-qwen-ref.mjs --ref public/assets/gen/_raw/player/player-px.png "<prompt>" <name>-px.png
```
- Uses `qwen-image-2.0-pro` (QwenCloud, DashScope intl endpoint).
- **Always generate posed variants via `gen-sprite-qwen-ref.mjs` with `--ref` pointing at the character's base art** (`_raw/player/player-px.png`, `_raw/enemy/goblin-px.png`). Generating from text alone makes the AI invent a new character (hair color / outfit drift) — the user rejected that.
- **Gen at 512×512 only.** Qwen requires ≥512 output; "direct pixel at 16px" fails/confuses the model.
- Prompt essentials (from `docs/art-direction-brief.md`): top-down 2D game sprite, FULLY VISIBLE, palette words, "chunky pixel art", "NO anti-aliasing", "hard pixel clusters", "flat cel shading", "copied tight around character", "plain flat solid WHITE background" (needed for bg removal), "no text no watermark no scenery behind".
- Output lands in `public/assets/gen/`; final files are moved into `player/` / `enemy/` / `effects/` (see folder layout below).

### 2. Cut background (`scripts/remove-bg.mjs`)
```bash
node scripts/remove-bg.mjs <name>-px.png <name>-battle.png 32
```
- Flood-fill from image borders → transparent. Tolerance last arg (default 48; use ~32 for glyphs so glow core survives).
- Prints remaining bbox — keep in mind for sampling.

### 3. Sample to game size (`scripts/sample-sprite.mjs`)
```bash
node scripts/sample-sprite.mjs <name>-px.png <name>-map 32
```
- **grid-sample** (center-of-cell sampling) that keeps the original's colors — do NOT use `normalize-sprite.mjs` (block-mode re-draw destroys the art; rejected).
- Produces `<name>-map-32.png`.

### 4. Preview for user approval (`scripts/build-preview.mjs`)
```bash
node scripts/build-preview.mjs <file>.png <file>-preview.png
```
- ×8 checkerboard preview so the user can visually approve. **The agent cannot see images — always show the preview and wait for user OK.**

## File naming / wiring

| File | Where it's referenced |
|------|----------------------|
| `player/player.png`, `enemy/enemy_goblin.png` (32×32 map) | `SheetConfig.url` |
| `player/player-battle.png`, `enemy/goblin-battle.png` (512 transparent) | `SheetConfig.battleUrl` (battle close-up) |
| `player/player-cast-battle.png`, `enemy/goblin-cast-battle.png` | `SheetConfig.castBattleUrl` (attack pose in battle; battle-only, no 32px cast) |
| `player/player-hurt-battle.png`, `enemy/goblin-hurt-battle.png` | `SheetConfig.hurtBattleUrl` (damage pose in battle) |
| `effects/glyph-light.png` / `effects/glyph-dark.png` | `EffectRenderer.ts` (`registerSheet('glyph-hero'/'glyph-enemy')`) |

Edit `heroSprites.ts` / `enemySprites.ts` to point configs at the right files. `SpriteSheet.ts` auto-registers `-battle`, `-cast-battle`, `-hurt-battle` variants when the config has those fields.

## Folder layout

```
public/assets/gen/
├── zones/     # zone décor + ground tiles (see "Zone tiles" below)
├── player/    # witch: map + battle idle + cast + hurt
├── enemy/     # goblin: map + battle idle + cast + hurt
├── effects/   # glyph projectiles
└── _raw/
    ├── zones/    # z1-z4,z5,z6 px sources (keep as reference; z1-floor kept at 128)
    ├── player/   # base player-px.png + all pose variants (keep as reference)
    └── enemy/    # base goblin-px.png, goblin-axe-px.png + pose variants
```

## Zone tiles

Floor / path / water tiles are 48×48 (SCALE × TILE), décor sprites 32×32 — all generated from Qwen px sources kept in `_raw/zones/`.

- `zones/z1-floor-48.png` (floor) / `zX-path-48.png` (path) / `zX-water-48.png` (water) → loaded by `tileAssets.ts` (`zoneXFloor` / `zoneXPath` / `zoneXWater`).
- `zones/zX-<deco>-32.png` (tree/bush/rock/flower) → `zoneXTrees` / `Bushes` / `Rocks` / `Flowers`.
- **`scale-sprite.mjs`** — nearest-neighbor resize of a px source to a target size (e.g. 128 → 48 for a floor tile):
  ```bash
  node scripts/scale-sprite.mjs <src-px.png> <out-prefix> 48
  ```
- **`build-palette-tile.mjs`** — paints a seamless 48px tile by extracting the dominant grass/dirt colors from a sprite:
  ```bash
  node scripts/build-palette-tile.mjs <sprite-px.png> grass|dirt <out-prefix>   # writes <out-prefix>-48.png
  ```
- z1 floor reference: the original Qwen floor texture is preserved as `_raw/zones/z1-floor-128.png`; `zones/z1-floor-48.png` is scaled from it (this is the "before palette adjust" version the user wanted back). The z1 path original was not recoverable — `z1-path-48.png` stays as-is.

- **Battle sprites are THREE-QUARTER view**: both fighters angle toward each other but keep their face mostly toward the camera (head/eyes look at the opponent). Do not generate full side-profile.
- Delete unused generated files every time art is regenerated (old previews, obsolete poses) — the repo should never accumulate orphan sprites.

## Rules / gotchas

- **Never trust AI with multi-frame sprite sheets** — generated grids drift. Use single-image poses; animate programmatically (flip for left/right, `walkFrames` cycling, idle bob via `sin(now/…)`).
- Sprite in 512 is used for battle (crisp upscale); 32×32 is used on the map (48px screen at SCALE=3).
- `imageSmoothingEnabled = false` (nearest) everywhere.
- Palette ≤ ~16 colors target per character; by design we keep the sampled colors (up to ~500) for now — that's acceptable.
- Raw AI sources (`-px.png`) are kept in `public/assets/gen/_raw/<character>/`; don't reference them in game configs. Keep the base art (`player-px.png`, `goblin-px.png`, `goblin-axe-px.png`) there permanently — they're the reference for every future pose.