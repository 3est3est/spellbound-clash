# 🎮 Spellbound Clash — Game Documentation (รายละเอียดเกม)

> **Last Updated:** 2026-08-05  
> เอกสารนี้สำหรับนักพัฒนา (AI หรือคน) ที่จะทำงานต่อจากสถานะปัจจุบัน

---

## คอนเซ็ปต์เกม
**Spellbound Clash** เป็นเกมแนว RPG เพื่อการศึกษา ที่ได้แรงบันดาลใจจาก Pokémon  
ผู้เล่นจะบังคับตัวละครเดินสำรวจแมพแบบ 2.5D top-down (ลงซ้าย ขวา บน ล่าง)  
เมื่อเดินชนศัตรู จะเข้าสู่โหมดต่อสู้แบบ Turn-based โดย **ทายคำศัพท์ภาษาอังกฤษ** — ตอบถูกโจมตีศัตรู ตอบผิดโดนโจมตีแทน

---

## 🗺️ สถานะปัจจุบัน (สิ่งที่ทำแล้ว)

### ✅ ระบบแมพ 4 โซน (Zone System)
- **แมพขนาด 56×48 tiles** ประกอบด้วย 4 โซน แต่ละโซนขนาด 22×18 tiles
- โซนแยกออกจากกันด้วย Buffer Wall ป่าหนาทึบ 8 tiles
- การเชื่อมต่อโซนด้วยทางเดินอุโมงค์ (Corridor) ที่มีประตูสลักเวทกั้น

| โซน | ธีม | ตำแหน่ง | ทางเชื่อมไปโซนถัดไป |
|-----|-----|---------|-------------------|
| 1 | 🌿 Emerald Forest | Top-Left (x:3-23, y:3-19) | → โซน 2 (ขวา) |
| 2 | 🍂 Autumn Desert | Top-Right (x:32-52, y:3-19) | → โซน 3 (ล่าง) |
| 3 | ❄️ Frostbite Ridge | Bottom-Right (x:32-52, y:28-44) | → โซน 4 (ซ้าย) |
| 4 | 🔥 Volcanic Wasteland | Bottom-Left (x:3-23, y:28-44) | — ปลายทาง |

### ✅ ระบบปลดล็อคโซน (Zone Unlock & Progression)
- เริ่มต้นที่โซน 1 เท่านั้น (unlockedZones = [1])
- ปราบมอนสเตอร์ครบ 3 ตัวในโซน → ปลดล็อคอุโมงค์ทางเข้าโซนถัดไป
- แสดง Banner แจ้งเตือนเมื่อปลดล็อคสำเร็จ

### ✅ ระบบ Fog of War (หมอกบังโซน)
- โซนที่ยังไม่ปลดล็อค จะถูก **ปกคลุมด้วยหมอกมืด** (`rgba(8,5,20, 0.93)`)
- โซนที่เพิ่งปลดล็อคและเดินเข้าไปครั้งแรก → **ค่อยๆ สว่างขึ้นนุ่มนวลใน ~2 วินาที** (Fade-in Reveal)
- ศัตรูในโซนที่มืดอยู่ จะถูกซ่อนจากการแสดงผล

### ✅ ทางเชื่อมเป็นอุโมงค์ถ้ำธรรมชาติ (Cave Tunnel Gates)
- ไม่มีป้ายตัวหนังสือบนแมพ เป็นซุ้มหน้าผาหินธรรมชาติ
- ขณะล็อค: ปากอุโมงค์มืดมนมีแสงม่วงเวทผนึก
- เมื่อปลดล็อค: ปากอุโมงค์ส่องแสงสีเขียว เดินผ่านได้ทันที

### ✅ ระบบสิ่งแวดล้อม Organic (Environment Scatter)
- ต้นไม้ พุ่มไม้ หิน ดอกไม้ บึงน้ำ กระจายทั่วภายในแมพแบบสุ่ม (seeded deterministic)
- สินทรัพย์ภาพ (Pixel Art Assets) render ที่ **สเกลธรรมชาติ 1:1** ไม่ถูกขยายจนแตก
- ทางเดิน (PATH) คดเคี้ยวเป็นธรรมชาติ สไตล์ Adventure RPG
- Safe zones ป้องกันไม่ให้ต้นไม้สุ่มทับ spawn point ผู้เล่นหรือมอนสเตอร์

### ✅ ระบบ Collision (ชนสิ่งแวดล้อม)
- ต้นไม้ (`T.TREE`), หิน (`T.ROCK`), น้ำ (`T.WATER`) บล็อคการเดิน
- ประตูอุโมงค์บล็อคการเดินจนกว่าจะปลดล็อค
- ผู้เล่นและมอนสเตอร์ไม่สามารถเดินทะลุสิ่งแวดล้อมได้

### ✅ ระบบต่อสู้ Turn-based (Battle System)
- เข้าสู้เมื่อตัวละครเดินชนมอนสเตอร์ (radius ~0.8 tiles)
- Battle Transition แบบ Pokémon (screen flash + slide)
- แสดงคำถามภาษาอังกฤษ 4 ตัวเลือก พร้อม Countdown Timer
- ตอบถูก → Attack Animation + มอนสเตอร์เสีย HP
- ตอบผิด / หมดเวลา → Hit Animation + ผู้เล่นเสีย HP
- มอนสเตอร์ที่ตาย จะถูกลบออกจากแมพถาวร

### ✅ Pixel Art Assets ที่ใช้อยู่ (จาก public/assets)
- 🌲 **Trees**: craftpix-net-385863 — Zone1 ต้นไม้เขียว, Zone2 Autumn/Palm, Zone3 Snow/Christmas, Zone4 Burned/Broken
- 🌿 **Bushes**: craftpix-net-141354 — Fern, Colored flower bushes, Cactus, Snow bushes
- 💧 **Water**: mana seed seasonal forest — Water sparkles animation 16×16

---

## 🕹️ วิธีเล่น

### ขั้นตอนที่ 1 — เลือกโหมดความยาก
| โหมด | หัวใจเรา ❤️ | หัวใจศัตรู ❤️ | คำถามต่อตัว | เวลา/ข้อ |
|------|:-----------:|:------------:|:-----------:|:--------:|
| ง่าย | 5 | 5 | 5 ข้อ | 10 วิ |
| ปานกลาง | 3 | 7 | 7 ข้อ | 7 วิ |
| ยาก | 1 | 10 | 10 ข้อ | 5 วิ |

### ขั้นตอนที่ 2 — สำรวจแมพ
- ใช้ **WASD** หรือ **ลูกศร** เดินสำรวจแมพ
- เริ่มที่โซน 1 → ปราบมอนสเตอร์ 3 ตัว → ปลดล็อคอุโมงค์ → ข้ามโซน 2 → 3 → 4
- โซนอื่นจะมืดอยู่จนกว่าจะปลดล็อค (Fog of War)
- มอนสเตอร์เดินเตร่อยู่ในโซน รัศมีการ Wander 5 tiles

### ขั้นตอนที่ 3 — ต่อสู้มอนสเตอร์
- เดินเข้าใกล้ → เปลี่ยนฉากแบบ Pokémon → ทายคำศัพท์ 4 ตัวเลือก
- ตอบถูก → ศัตรูเสีย HP | ตอบผิด / หมดเวลา → เราเสีย HP
- ชนะ → มอนสเตอร์หายจากแมพ + นับ Progress

### ขั้นตอนที่ 4 — ชนะเกม
- ปราบมอนสเตอร์ครบ 12 ตัว (3 ตัว × 4 โซน) → 🏆 Victory!

---

## 📊 HUD ที่แสดงบนหน้าจอ

### ตอนสำรวจแมพ
- ❤️ HP ผู้เล่น | ⭐ เหรียญ (Coins) | 🗡️ ศัตรูที่ฆ่า/ทั้งหมด | 🎯 ระดับความยาก

### ตอนต่อสู้
- ❤️ HP ผู้เล่น + ศัตรู | 📝 ข้อที่เท่าไหร่ | ⏱️ เวลาถอยหลัง

---

## 📁 โครงสร้างไฟล์สำคัญ

```
spellbound-clash/
├── public/
│   └── assets/           ← ห้ามแตะ (Pixel Art Assets ทั้งหมด)
│       ├── craftpix-net-385863-free-top-down-trees-pixel-art/
│       ├── craftpix-net-141354-free-top-down-bushes-pixel-art/
│       ├── craftpix-net-823949-free-nature-backgrounds-pixel-art/
│       └── mana seed seasonal forest sample (summer)/
└── src/
    ├── game/
    │   ├── constants.ts       ← TILE, SCALE, MAP_COLS/ROWS, T.* tile codes
    │   ├── tilemap.ts         ← buildMap(), getZoneAt(), MAP[][] grid data
    │   ├── enemyPlacement.ts  ← ZONE_ENEMIES[] ตำแหน่งและชื่อมอนสเตอร์
    │   ├── assets/
    │   │   ├── AssetLoader.ts     ← loadAsset(), loadAssets()
    │   │   └── tileAssets.ts      ← zone1Trees/Bushes, zone2-4..., waterSparkles
    │   ├── rendering/
    │   │   ├── TileRenderer.ts    ← drawForestTile(), Fog of War, Tunnel gates
    │   │   ├── CharRenderer.ts    ← drawHero(), drawEnemy(), drawNameTag()
    │   │   ├── BattleRenderer.ts  ← drawBattleBackground(), drawMagicCircle()
    │   │   └── EffectRenderer.ts  ← drawSpellEffect()
    │   └── sprites/
    │       ├── SpriteSheet.ts, SpriteAnimator.ts
    │       ├── heroSprites.ts, enemySprites.ts
    │       └── index.ts
    ├── components/
    │   ├── render/
    │   │   └── GameCanvas.tsx    ← Main Canvas render loop (rAF), player movement, camera, enemy AI, Fog overlay, Zone fade-in
    │   └── ui/
    │       ├── MainMenu.tsx, HUD.tsx, BattleOverlay.tsx
    │       ├── BattleTransition.tsx, VictoryScreen.tsx, GameOver.tsx
    ├── store/
    │   └── useGameStore.ts       ← Zustand store, unlockedZones, zoneBanner, defeatEnemy()
    └── data/
        └── vocabQuestions.json   ← คลังคำถามภาษาอังกฤษ-ไทย
```

---

## ⚙️ Tile Code Reference

| Tile Code | ค่า | ความหมาย | เดินได้? |
|-----------|-----|---------|---------|
| `T.GRASS` | 0 | พื้นหญ้า | ✅ |
| `T.PATH` | 1 | ทางเดินดิน | ✅ |
| `T.TREE` | 2 | ต้นไม้/พุ่มไม้ (Solid) | ❌ |
| `T.ROCK` | 3 | หิน (Solid) | ❌ |
| `T.WATER` | 4 | น้ำ/ลาวา | ❌ |
| `T.FLOWER` | 5 | ดอกไม้ (Decorative) | ✅ |
| `T.GATE_1_2` | 6 | อุโมงค์ 1→2 | ❌ ถ้าล็อค / ✅ ถ้าปลดล็อค |
| `T.GATE_2_3` | 7 | อุโมงค์ 2→3 | ❌ / ✅ |
| `T.GATE_3_4` | 8 | อุโมงค์ 3→4 | ❌ / ✅ |

---

## 🎯 เงื่อนไขชนะ / แพ้

| สถานะ | เงื่อนไข |
|-------|---------|
| 🏆 ชนะ | ปราบมอนสเตอร์ครบ 12 ตัว (3 ตัว × 4 โซน) |
| 💀 แพ้ | HP ผู้เล่นถึง 0 ระหว่างการต่อสู้ |

---

## 🔮 สิ่งที่ควรพัฒนาต่อ (Next Steps)

### Priority สูง
- [ ] **ใส่ Sprite ตัวละคร Pixel Art** สำหรับผู้เล่นและมอนสเตอร์ (โครงสร้าง SpriteSheet พร้อมแล้วใน `src/game/sprites/`)
- [ ] **ปรับ Victory Condition** เป็นปราบ 12 ตัว ไม่ใช่ 3 ตัวเหมือนเดิม
- [ ] **เพิ่มคำถามในคลัง** ให้ครอบคลุม 12 ศัตรู (ต้องการอย่างน้อย 36 คำถาม Hard mode)
- [ ] **Zone Name Overlay** แสดงชื่อโซนเมื่อเดินเข้าครั้งแรก (แทน Banner เล็กๆ)

### Priority กลาง
- [ ] **เสียงเอฟเฟกต์** (BGM, attack sound, zone unlock jingle)
- [ ] **Save/Load Progress** ระหว่าง Session
- [ ] **Enemy Variety** แต่ละโซนมีรูปร่างมอนสเตอร์ต่างกัน
- [ ] **Boss Zone 4** มอนสเตอร์ตัวที่ 3 ของโซน 4 เป็น Boss (HP สูงกว่าปกติ)

### Priority ต่ำ
- [ ] Mobile/Touch support
- [ ] Multiplayer mode
- [ ] Leaderboard
