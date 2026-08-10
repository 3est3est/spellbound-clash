# Art direction brief

## Game frame

- Player fantasy: Top-down pixel RPG — player wanders 4-open zones, answers magic questions to defeat enemies in magic-duel battles.
- Core verbs: move, explore, approach enemy, answer spell question, defeat / take damage.
- Engine and renderer: Web (React 19 + Vite 8 + TypeScript), raw 2D canvas renderer, no game engine. Tailwind for DOM UI.
- Target platforms: Desktop browsers primarily; responsive down to mobile.
- Camera/view/facing: Top-down tile grid, orthographic TOP-DOWN view (units face camera, slight front bias), camera follows player, tile 16px native x3 scale.
- Native viewport and common display scale: Canvas view ~22x16 tiles mounted on larger page; sprites drawn at TILE*SCALE = 48px on screen.
- Typical asset size on screen: 48x48px on screen (16px tile base) — silhouette must read at this size.

## Visual system

- Shape language: Soft, rounded, chibi-proportioned characters (big head / small body), 32x32 source sprites. Enemies share the blocky-but-readable top-down pixel silhouette, slightly more angular for menace.
- Silhouette priorities: Player = triangle pointy wizard hat + round robe silhouette. Enemy goblin = pointy ears + hunched torso + large eyes. Backpack nothing; wand held in hand and clearly readable.
- Value structure: Strong outline-ish darker edge at the character's bottom (anchoring on ground), light sources from top-left, shadows beneath feet.
- Palette roles and exact swatches:
  - Base outline / ground anchor: `#1f2937` (near-black slate).
  - Player (cute witch, blue-purple theme): hat + robe purple `#7c3aed` (dark `#4c1d95`), trim sky-blue `#60a5fa` (dark `#1e40af`), hair pale lavender `#c4b5fd`/silver, skin `#f1c27d`, eyes light blue `#bfdbfe`, wand wood `#6b4423` with glow tip `#93c5fd`.
  - Enemy goblin (fierce, shirtless): skin green `#22c55e` (dark `#15803d` / shade `#166534`), eyes glowing yellow `#fde047`, teeth/white `#f8fafc`, leather pants `#92400e`/`#78350f`.
  - Battle/UI accents reuse the above to stay cohesive.
- Materials and surface cues: Flat cel shading, no gradients in sprites; hard pixel clusters only. Cloth = clean flat fill; skin = one shade + one darker shade; metal/glow only on wand tip + enemy eyes.
- Edge/line treatment: 1px dark pixel outline on characters, anchored darker feet; no anti-aliasing anywhere.
- Lighting direction and contrast: Top-left light; bottom of sprite darker for ground contact; full-screen flat, no cast shadows except small ellipse under feet.
- Detail density and focal hierarchy: Focal = face (eyes) + hat silhouette for player, eyes + ears for goblin; body kept low-detail so it survives 16px collapse.
- Motion character: Idle bob 1-2px, walk leg/arm alternation pre-generated as separate frames; no squash unless user-approved.
- Explicit exclusions: No text/labels in sprites, no UI chrome, no scenery behind characters (transparent background), no signature/watermarks, no complex shading, no photo AI look.

## Technical contract

- Asset dimensions/aspect: 32x32 PNG per character frame (gen at 1024, normalize to 32). Aspect 1:1.
- Alpha/background: Transparent background guaranteed by normalize script (flood-fill removal + crop), verified alpha channel.
- Grid/tile/frame size: 32x32 grid; frames can be packed later into 64x64 sheet cells.
- Anchor/pivot/baseline: Bottom-center anchor (feet at y=32, x=16) matching game's `TILE*SCALE` draw position.
- Filtering/mipmaps/compression: `imageSmoothingEnabled = false` (nearest-neighbor) in the canvas renderer.
- Color space: sRGB; flat palette quantized to game `COLORS` when possible.
- Texture/poly/material budgets: Negligible texture budget; keep each sprite <= 32x32, palette <= 16 colors ex-transparency.
- Naming and folders: `public/assets/gen/<character>/<asset-id>.png` (characters in `player/` / `enemy/`, effects in `effects/`); sources recorded in `asset-manifest.json`.

## Visual target

- Approved seed/reference paths: `public/assets/gen/player/player.png` (witch) + `public/assets/gen/enemy/enemy_goblin.png` (goblin) — first approval gates.
- Battle casting poses: `player-cast-battle.png` (512, wand raised, purple charge), `goblin-cast-battle.png` (512, axe swung, red charge). Both in THREE-QUARTER view angled toward each other (face stays toward the camera).
- Spell projectile: rotating hexagram/rune glyph images `glyph-light.png` (purple) + `glyph-dark.png` (red); NOT round orbs.
- Required do/don't examples: DO keep hat+robe silhouette readable at 16px; DON'T add texture noise or gradient shading.
- Native-scale gameplay capture: pending after sprites approved.
- Approval owner/date: naruebet (pending).