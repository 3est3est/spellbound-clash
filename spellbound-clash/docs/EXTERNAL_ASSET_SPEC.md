# External Asset Spec — สเปกไฟล์สำหรับเจน sprite / map assets นอกโปรเจกต์

> เอาไว้ให้อ่านก่อนไปเจนภาพที่อื่น (QwenCloud / อื่นๆ) แล้วนำไฟล์กลับมาวางที่ `public/`
> ดูเพิ่ม: `docs/ASSET_PIPELINE.md` (pipeline 4 ขั้นตอนในเครื่อง) + `docs/art-direction-brief.md` (ทิศทางภาพ)

## 1. กฎไฟล์สากล (ทุก asset)

| กฎ | รายละเอียด |
|---|---|
| Format | **PNG** (lossless) — ไม่ใช้ JPG/WebP |
| Color space | sRGB, 8-bit |
| ขนาด | ต้องเป็นจัตุรัส ตามตารางด้านล่าง (32 / 128 / 512) |
| พื้นหลัง | **ตัวละคร/effects = พื้นหลังขาวล้วน** (เดี๋ยวผม `remove-bg` ให้) / **tiles = opaque** |
| Filter | `imageSmoothingEnabled=false` (nearest) ทุกที่ → ห้าม anti-aliasing |
| ป้าย | ห้าม text, watermark, ลายเซ็น, UI chrome |
| สไตล์ | chunky pixel art, flat cel shading, hard pixel clusters, palette ≤ ~16 สี |
| ชื่อไฟล์ | ภาษาอังกฤษ ตัวเล็ก, `-` คั่น (เช่น `z1-floor-48.png`) — **ไม่ตั้งเอง ผมจะบอกชื่อให้** |

---

## 2. ตัวละคร (Player + Enemy) — 22 ไฟล์

โค้ดอ้างอิง: `heroSprites.ts` / `enemySprites.ts` (SheetConfigs/`ZONE_ENEMY_KEY`), `SpriteAnimator.ts` (SPRITE_MAP), `CharRenderer.ts`

`ZONE_ENEMY_KEY = { 1:'enemy'(goblin), 2:'scorpion', 3:'bear', 4:'reaper' }`

| ไฟล์ในเกม | ขนาด | กี่เฟรม | ใช้ทำอะไร | ปัจจุบัน |
|---|---|---|---|---|
| `player/player.png` | 32×32 | 1 | ตัวละครบนแผนที่ (idle) | ✅ มี |
| `player/player-walk.png` | **128×32** (4×32) | 4 เฟรมต่อแถว | เดินบนแผนที่ | ✅ มี |
| `player/player-battle.png` | 512×512 | 1 | battle close-up (idle) | ✅ มี |
| `player/player-cast-battle.png` | 512×512 | 1 | ท่าโจมตี (กวัดแกว่ง wand) | ✅ มี |
| `player/player-hurt-battle.png` | 512×512 | 1 | ท่าโดนโจมตี | ✅ มี |
| `enemy/enemy_goblin.png` | 32×32 | 1 | z1 ศัตรูบนแผนที่ | ✅ มี |
| `enemy/goblin-walk.png` | 128×32 (4×32) | 4 เฟรม | z1 เดิน | ✅ มี |
| `enemy/goblin-battle.png` | 512×512 | 1 | z1 battle close-up | ✅ มี |
| `enemy/goblin-cast-battle.png` | 512×512 | 1 | z1 ท่าโจมตี (ฟันขวาน) | ✅ มี |
| `enemy/goblin-hurt-battle.png` | 512×512 | 1 | z1 ท่าโดนโจมตี | ✅ มี |
| `enemy/enemy_scorpion.png` | 32×32 | 1 | z2 ศัตรูบนแผนที่ | ✅ มี |
| `enemy/scorpion-walk.png` | 128×32 (4×32) | 4 เฟรม | z2 เดิน | ✅ มี |
| `enemy/scorpion-battle.png` | 512×512 | 1 | z2 battle close-up | ✅ มี |
| `enemy/scorpion-cast-battle.png` | 512×512 | 1 | z2 ท่าโจมตี (ปิ้งหาง) | ✅ มี |
| `enemy/scorpion-hurt-battle.png` | 512×512 | 1 | z2 ท่าโดนโจมตี | ✅ มี |
| `enemy/enemy_bear.png` | 32×32 | 1 | z3 ศัตรูบนแผนที่ | ✅ มี |
| `enemy/bear-walk.png` | 128×32 (4×32) | 4 เฟรม | z3 เดิน | ✅ มี |
| `enemy/bear-battle.png` | 512×512 | 1 | z3 battle close-up | ✅ มี |
| `enemy/bear-hurt-battle.png` | 512×512 | 1 | z3 ท่าโดนโจมตี (ไม่มี cast — ใช้ glyph) | ✅ มี |
| `enemy/enemy_reaper.png` | 32×32 | 1 | z4 ศัตรูบนแผนที่ | ✅ มี |
| `enemy/reaper-walk.png` | 128×32 (4×32) | 4 เฟรม | z4 เดิน | ✅ มี |
| `enemy/reaper-battle.png` | 512×512 | 1 | z4 battle close-up | ✅ มี |
| `enemy/reaper-hurt-battle.png` | 512×512 | 1 | z4 ท่าโดนโจมตี (ไม่มี cast — ใช้ glyph) | ✅ มี |

### สเปกตัวละคร (ทุกตัว)
- **มุมมอง**: TOP-DOWN, ตัวตั้งตรง facing กล้อง (front bias) — ไม่ใช่ side-profile
- **Anchoring**: กึ่งกลางล่าง (bottom-center) — เท้าอยู่ที่ขอบล่างของภาพ ตรงกลางแนวนอน
- **ตัวละครเต็มภาพ**: copy tight รอบตัว ไม่มีช่องว่างเยอะ, ขา/เท้าชิดขอบล่าง
- **Silhouette**:
  - Player = หมวกแหลมแม่มด + เสื้อคลุมกลม (cute witch, chibi หัวใหญ่ตัวเล็ก)
  - Enemy z1 = goblin หูแหลม + หลังงุ้ม + ขวาน (ถือขวานใน idle/walk)
  - Enemy z2 = ปีศาจแมงป่องทะเลทราย: **2 ก้ามหน้าแบบสมมาตร, ขาเดิน 4 คู่, หาง 1 หาง** (ห้ามมีก้าม/แขนเกิน)
  - Enemy z3 = ปีศาจหมีขาว: **ขา 4 ข้าง, 1 หัว, ห้ามมีแขน/ขาเกิน** ชุดขาวอมฟ้า ตัวโต
  - Enemy z4 = ปีศาจแดงคล้ายยมทูต: เสื้อคลุมแดงเข้ม + เคียว (ถือแค่อาวุธ เดี่ยว) หน้าไม่มีคอ
- **Palette**:
  - Player: ม่วง `#7c3aed` (มืด `#4c1d95`) + ฟ้า `#60a5fa` + ผม `#c4b5fd` + ผิว `#f1c27d` + ไม้ wand `#6b4423` / ปลาย `#93c5fd`
  - Goblin: ผิวเขียว `#22c55e` (มืด `#15803d`) + ตาเหลืองเรืองแสง `#fde047` + กางเกงหนัง `#92400e`
  - Scorpion: เปลือกแดง-ส้ม `#c2410c` / `#ea580c`, ตาแดงเรืองแสง
  - Bear: ขาวขุ่น-ขาวอมฟ้า `#f8fafc` / `#bae6fd`, จมูก/ตาดำ
  - Reaper: เสื้อคลุมแดงเข้ม `#7f1d1d` / `#b91c1c`, เคียว ดำ+เทา
- **battle = 3/4 view**: หันเข้าหากัน (enemy หัน **ซ้าย** ฝั่งขวาจอ), หน้าอยู่กับกล้อง (เห็นหน้า/ตา)
- **Walk strip**: 4 เฟรม ต่อเนื่องกันในแนวนอน (ขา/แขนสลับกัน) ภาพละ 32×32 เรียงติดกัน → 128×32 ทั้งแผ่น; **ทุกเฟรมต้องขนาดกล่องเท่ากัน** (โปรด copy เฟรมแรกเป็น ref แล้วปรับท่าเท่านั้น — ไม่งั้นเดินกระดุกกระดิก)

### Prompt template (ภาษาอังกฤษ)
```
Top-down 2D game sprite of a cute witch [goblin], FULLY VISIBLE, whole body,
chibi proportions (big head small body), pointy wizard hat + round purple robe
[pointy ears + hunched green goblin body + battle axe], flat cel shading,
chunky pixel art, hard pixel clusters, NO anti-aliasing, palette limited to
purple #7c3aed / sky blue #60a5fa / lavender #c4b5fd [green #22c55e / yellow #fde047],
no text no watermark no scenery behind, plain flat solid WHITE background,
copied tight around character
```

โซนใหม่:
```
[Scorpion] ... scorpion demon, desert sand red-orange shell #c2410c / #ea580c,
glowing red eyes, EXACTLY TWO symmetric front pincer claws, FOUR pairs of walking
legs, ONE tail raised up behind, NO extra claws or arms
[Bear] ... big white frost bear demon, white/icy blue fur #f8fafc / #bae6fd,
black nose and eyes, EXACTLY FOUR legs, ONE head, NO extra arms or limbs
[Reaper] ... grim reaper demon, dark crimson hooded robe #7f1d1d / #b91c1c, holding
ONE scythe, hooded face, dark shadow eyes
```

ทั้งหมด battle/hurt เพิ่มคำสั่งท้าย: `facing LEFT toward the right side of the screen, whole body visible, ...`

---

## 3. Effects (Spell glyph) — 5 ไฟล์

โค้ดอ้างอิง: `EffectRenderer.ts` (`registerSheet` …`glyph-hero`/`glyph-enemy`/`glyph-fire`/`glyph-ice`/`glyph-soul`)

| ไฟล์ | ขนาด | ใช้ทำอะไร | ปัจจุบัน |
|---|---|---|---|
| `effects/glyph-light.png` | 512×512 | โพรเจกไทล์เวทย์ฮีโร่ (ม่วง) | ✅ มี |
| `effects/glyph-dark.png` | 512×512 | โพรเจกไทล์เวทย์ goblin z1 (แดง) | ✅ มี |
| `effects/glyph-fire.png` | 512×512 | โพรเจกไทล์เวทย์แมงป่อง z2 (ส้ม-แดง / เปลวไฟ) | ✅ มี |
| `effects/glyph-ice.png` | 512×512 | โพรเจกไทล์เวทย์หมี z3 (ฟ้าเย็น เกล็ดหิมะ 8 แฉก) | ✅ มี |
| `effects/glyph-soul.png` | 512×512 | โพรเจกไทล์เวทย์ยมทูต z4 (แดงเข้ม/เลือด วิญญาณ) | ✅ มี |

### สเปก glyph
- **รูปร่าง**: hexagram/octagon + วงแหวน rune หมุนได้ (ก้อนพลัง "glyph") — **ไม่ใช่ลูกกลมธรรมดา**
- **จุดศูนย์กลาง**: สัญลักษณ์อยู่กลางภาพ
- **ธีมต่อโซน**: fire = เปลวไฟ ฟันแหลม / ice = เกล็ดหิมะ 8 แฉก / soul = ไข่ดาววิญญาณหรือโยเกิร์ตแดงเข้ม
- **สี**: ม่วง `#7c3aed` / แดง `#ef4444` / ส้ม-แดง `#f97316` / ฟ้าเย็น `#60a5fa` / แดงเข้ม `#dc2626` (มีแกนเรืองแสงตรงกลางพอ remove-bg แล้วยังเหลือ core)
- พื้นหลังขาวล้วน (ตัด bg ด้วย tolerance ~32 เพื่อเก็บ core เรืองแสง)

---

## 4. Map tiles (Zone 1-4) — 32 ไฟล์ (8 ต่อโซน)

โค้ดอ้างอิง: `tileAssets.ts` (`z('zX-...')`), `TileRenderer.ts`

### ต่อ 1 โซน (z1 = Emerald Forest, z2 = Autumn Desert, z3 = Frostbite Ridge, z4 = Volcanic Wasteland)

| ไฟล์ | ขนาด | ชนิด | ใช้ทำอะไร | ปัจจุบัน |
|---|---|---|---|---|
| `zX-floor-48.png` | 48×48 | opaque, **seamless** | พื้นเดิน | ✅ มี (z1 ถูกกู้เป็นสีเขียวเข้ม) |
| `zX-path-48.png` | 48×48 | opaque, **seamless** | ทางเดิน | ✅ มี |
| `zX-water-48.png` | 48×48 | opaque, **seamless** | น้ำ (มี sparkle แยก) | ✅ มี |
| `zX-tree0-32.png` | 32×32 | transparent | ต้นไม้ obstruct | ✅ มี |
| `zX-tree1-32.png` | 32×32 | transparent | ต้นไม้อีกแบบ | ✅ มี |
| `zX-bush0-32.png` | 32×32 | transparent | พุ่มไม้ (obstruct) | ✅ มี |
| `zX-rock0-32.png` | 32×32 | transparent | หิน obstruct | ✅ มี |
| `zX-flower0-32.png` | 32×32 | transparent | ดอกไม้ตกแต่ง (เดินได้) | ✅ มี |

### สเปก tile
- **Floor/Path/Water**: ต้อง **tileable (seamless)** — ขอบซ้าย-ขวา, บน-ล่าง ต่อกันเนียน (ถ้าทำไม่ได้ บอกผม — ผมใช้ `build-palette-tile.mjs` ปั้นให้จาก palette)
- **Décor (tree/bush/rock/flower)**: สไปรต์เดียว transparent, anchor bottom-center, ราก/โคนชิดขอบล่าง, เนื้อชัดที่ 32px
- **Palette ต่อโซน**:
  - z1 forest: พื้นเขียว `#70a030` (เดิมดั้งเดิม `#496731`), path น้ำตาล `#786028`, น้ำฟ้า
  - z2 desert: พื้นทอง `#d69e48`, path `#e4c48c`, rock ทราย
  - z3 frost: พื้นฟ้า-ขาว `#b8e0fc`, path `#8bb4d4`, rock น้ำเงิน
  - z4 volcanic: พื้นเทาดำ `#382820`, path `#573f37`, rock ดำ
- **ขนาดบนจอ**: 48×48 = TILE(16)×SCALE(3) → ต้อง **integer scale** ไม่มี blur

### Prompt template (tile)
```
[Floor] Top-down 2D game ground texture, seamless tileable pixel art, 16-color
palette dominated by [grass green #70a030 / warm brown #786028 / icy blue #b8e0fc /
dark volcanic gray #382820] with a few darker/lighter shades, flat cel shading,
hard pixel clusters, chunky pixel art, NO anti-aliasing, no gradients, no objects,
no text no watermark, plain flat solid [WHITE / color] background

[Décor] Top-down 2D game sprite of a single [tree / bush / rock / flower] for a
tile-based RPG, transparent background not needed (solid white ok), chunky pixel
art, flat cel shading, NO anti-aliasing, palette per zone, no text no watermark
```

---

## 5. อื่นๆ (แผนไว้แต่ยังไม่ได้ใช้ / เป็นตัวเลือก)

| ไฟล์ | ขนาด | ใช้ทำอะไร | ปัจจุบัน |
|---|---|---|---|
| `z5-cave-48.png` | 48×48 | ประตูถ้ำ (โหลดใน `tileAssets.ts` ยังไม่ได้เรนเดอร์) | ❌ ยังไม่มี |
| `z6-barrier-96.png` | **96×96** | แผงกั้นเวทระหว่างโซน (ดึงขนาด 2 tiles = 96) | ✅ มี (`z6-barrier-48` ก็มี) |
| `natureBgs` (battle bg) | 1280×768 ต่อโซน | พื้นหลัง battle ต่อโซน (`z1` ป่าเขียว, `z2` ที่ราบแห้งแล้ง, `z3` หิมะ, `z4` ลาวา) ผ่าน `getNatureBg(zone)` | ✅ มี (`z1..z4-battle-bg.png`) |

---

## 6. วิธีส่งไฟล์ให้ผม

1. **เจนให้ครบตามตาราง** แล้ววางโฟลเดอร์/ไฟล์ PNG ไว้ที่ใดก็ได้บนเครื่อง แล้วบอก path
2. ผมจะ:
   - คัดลอกเข้า `public/assets/gen/<folder>/` ด้วยชื่อที่ตรง config (`tileAssets.ts` / sprite configs)
   - `remove-bg` (ตัวละคร/effects) + ตรวจ dominant color + ปั้น tile ถ้าจำเป็น
   - สร้าง preview + **รอคุณ approve** (ผมดูภาพไม่ได้)
   - `tsc → build → lint`
3. **หมายเหตุ**: ถ้าเจนไม่ครบ บอกได้เลยว่าขาดตัวไหน ผมจะแยก task ให้เจนที่เหลือทีหลัง (ต้องใช้คีย์/โควต้า DashScope ของคุณ)

## 7. เช็กลิสต์ก่อนส่ง (Checklist)

- [ ] PNG, ไม่ใช่ JPG
- [ ] ขนาดตรงตาราง (32 / 128×32 / 512 / 48)
- [ ] ตัวละคร: พื้นหลังขาวล้วน, เท้าชิดขอบล่าง, กลางแนวนอน
- [ ] Tiles: seamless (floor/path/water)
- [ ] ไม่มี text / watermark
- [ ] Palette ตามโซน/ตัวละคร
