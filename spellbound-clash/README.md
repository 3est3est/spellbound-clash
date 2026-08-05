# 🎮 Spellbound Clash

Educational RPG — English vocabulary learning game inspired by Pokémon.

---

## 🚀 Quick Start

```bash
cd spellbound-clash
bun dev       # หรือ npm run dev
```
Opens at `http://localhost:5173`

---

## 🕹️ Controls

| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move player |
| Click | Select battle answer |

---

## 🗺️ Game Overview

- **4 Zones** แต่ละโซนมีธีมและมอนสเตอร์ 3 ตัว
- **Zone 1** 🌿 Emerald Forest → **Zone 2** 🍂 Autumn Desert → **Zone 3** ❄️ Frostbite Ridge → **Zone 4** 🔥 Volcanic Wasteland
- ปราบมอนสเตอร์ครบ 3 ตัวในโซน → ปลดล็อคอุโมงค์ข้ามไปโซนถัดไป
- **Fog of War** — โซนที่ยังไม่ปลดล็อคจะมืดอยู่ เมื่อเดินเข้าจะค่อยๆ สว่างขึ้น

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React + Vite + TypeScript |
| State | Zustand |
| Rendering | **HTML5 Canvas 2D** (custom tile renderer) |
| Styling | TailwindCSS |
| Assets | Pixel Art PNGs from `public/assets/` |

> ⚠️ Three.js has been **removed**. Do not re-add it.

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/game/constants.ts` | TILE, SCALE, MAP size, TileCode definitions |
| `src/game/tilemap.ts` | 56×48 tile grid, 4 zone rooms, corridors |
| `src/game/enemyPlacement.ts` | 12 enemy spawn positions (3 per zone) |
| `src/game/assets/tileAssets.ts` | Asset loading for zone-specific trees/bushes |
| `src/game/rendering/TileRenderer.ts` | Per-tile draw + Fog of War + Tunnel gates |
| `src/game/rendering/CharRenderer.ts` | Hero + Enemy sprite rendering |
| `src/components/render/GameCanvas.tsx` | Main render loop, camera, fog overlay, zone fade-in |
| `src/store/useGameStore.ts` | All game state including `unlockedZones` |
| `src/data/vocabQuestions.json` | English→Thai vocab question bank |

---

## 🗂️ Assets Structure (public/assets — DO NOT MODIFY)

```
public/assets/
├── craftpix-net-385863-free-top-down-trees-pixel-art/     ← Trees (Zone 1-4)
├── craftpix-net-141354-free-top-down-bushes-pixel-art/    ← Bushes, Ferns, Cacti
├── craftpix-net-823949-free-nature-backgrounds-pixel-art/ ← Battle BG
└── mana seed seasonal forest sample (summer)/             ← Water sparkles
```

---

## 📋 See Also

- [requirement.md](../requirement.md) — Full technical specification
- [requirement-humanLang.md](../requirement-humanLang.md) — Human-readable design doc (Thai)
