# Decision log

Why the project is built this way — read before changing anything, so we don't re-litigate settled decisions.

## Art generation

| # | Decision | Reason |
|---|----------|--------|
| D1 | Use QwenCloud (`qwen-image-2.0-pro`), free tier, NOT SpriteCook | User does not want to pay. SpriteCook (`skills-collective`, MCP) is a paid credit service; skipped. |
| D2 | Generate at 512×512 always | Qwen requires ≥512 output; a "16px-native" prompt at 512 confused the model and produced worse art than the plain 512x art (mushroom test was clean at 512). |
| D3 | Don't use `normalize-sprite.mjs` (block-mode/quantize) | It re-draws sample colors with block-dominant + palette quantization, which visibly changed the approved art. Rejected in favor of `sample-sprite.mjs` (grid-sample, keeps original colors). |
| D4 | Two sizes per character: 512 `-battle` (transparent) + 32 map sprite | Battle/cutscene needs the full-res art; the map needs integer ~scale (512/48 = 10.66 not integer → jaggies). 32×32 → 48px on screen. |
| D5 | Background removal via flood-fill from borders (tolerance per asset) | Protects interior near-white pixels (eyes, highlights). Glyphs use lower tolerance (~32) to keep glowing cores. |
| D6 | Walk = single-facing pose, flip horizontally for left/right, same art for up/down | User approved "ท่าเดียว flip" — chibi top-down convention. Enemies/hero use the same frames for up/down. |
| D7 | Cast/attack pose is a separate generated image (`-cast`), not procedural | User wants real casting poses (witch + wand, goblin + axe). Mapped to `SPRITE_MAP.attack()` via `castUrl`. |
| D8 | Spell projectile = rotating glyph **image** (hexagram/rune), not a circle | User rejected round orbs; wants a "ก้อนพลัง" glyph. Purple for hero, red for enemy. |
| D9 | Zone tiles: floor/path/water are **48px** (`SCALE×TILE`), décor 32px, each generated from a Qwen px source kept in `_raw/zones/` | Tiles must tile at the 48px screen scale; keeping the px source allows regenerating/re-tiling without re-generating with the AI. |
| D10 | Floor/server tiles built locally via `scale-sprite.mjs` (nearest resize) or `build-palette-tile.mjs` (seamless palette tile) — never trust AI sheets | Ground tiles are plain textures; local deterministic processing keeps them seamless and on-palette. |
| D11 | z1 floor uses the original Qwen texture (green, `_raw/zones/z1-floor-128.png`) scaled to 48, NOT the palette-adjusted plate | User preferred the original ("ก่อนปรับสี") look. z1 path original was not recoverable; keep the existing `z1-path-48.png`. |
| D12 | One enemy type per zone: goblin (z1) / scorpion demon (z2) / white frost bear demon (z3) / red grim-reaper demon (z4), wired via `ZONE_ENEMY_KEY` | Per-zone set of creatures the user wanted. All battle/idle/walk art faces **left** (enemy sits on the right of the screen, facing the hero) — no runtime flip. |
| D13 | Bear + reaper have **no cast pose** (`castBattleUrl` omitted) — attack pose falls back to their battle idle; the spell visuals come from the glyph | User chose "ก้อนพลัง glyph" over a dedicated cast art for these two. Goblin + scorpion keep their generated cast poses. |
| D14 | Per-zone enemy glyphs: goblin=red (`glyph-dark`), scorpion=fire (`glyph-fire`), bear=ice (`glyph-ice`), reaper=soul (`glyph-soul`); hero keeps `glyph-light` purple | Each zone enemy casts a themed projectile. |
| D15 | Removed water from zones 1-3; kept the z4 lava pool (also `T.WATER` code) | User: "เอาน้ำแม่น้ำออก เหลือลาวา". Water code still renders differently per zone in TileRenderer. |
| D16 | Corridors between zones are **1 tile wide** (kept gate row/col, closed the parallel lane) | User chose "เฉพาะคอร์ริดอร์ 1 ช่อง" over wider corridors. Gate renderer adapts to single-tile runs automatically. |

## Colors

| Element | Color |
|---------|-------|
| Hero magic / magic circle / glyph | purple `#7c3aed` |
| Enemy magic / magic circle / glyph | red `#ef4444` |
| z1 goblin glyph / magic circle | red `#ef4444` |
| z2 scorpion glyph (fire) | orange-red `#f97316` |
| z3 bear glyph (ice) | icy blue `#60a5fa` |
| z4 reaper glyph (soul) | deep red `#dc2626` |
| Player character theme | blue-purple (original witch) |
| Enemy goblin | green skin + yellow eyes |

## Architecture

- Raw canvas 2D renderer (TILE=16, SCALE=3 → 48px tiles). No engine. Three.js removed — do not re-add.
- Sprite system: single images per config ``SheetConfig`` (map `url`, `battleUrl`, `castUrl` + variants). `SpriteSheet.ts` auto-registers variants; `SpriteAnimator.ts` maps actions → sheet/frame; `CharRenderer.ts` draws with nearest-neighbor and falls back to procedural shapes if an image isn't ready.
- Old craftpix/mana-seed asset packs were deleted (`git rm`); `tileAssets.ts` arrays are empty and TileRenderer/BattleRenderer use procedural fallbacks. Regenerate decoration later from the same pipeline if needed.
- Battle flow: answer question → `battleResult` → lunge toward opponent + glyph projectile (via `spellRef.t`, ~1s). Idle bobbing added via `sin(now/…)`; hit shake added on WRONG/TIMEOUT.

## Workflow rules

- Agent has no vision → every generation must be previewed by the user (`build-preview.mjs`) and OK'd before use.
- Always run `tsc → vite build → oxlint` before finishing.
- Existing oxlint warnings are pre-existing; don't add new ones.