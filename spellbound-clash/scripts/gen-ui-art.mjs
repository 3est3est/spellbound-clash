import { writeFileSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"
import { PNG } from "pngjs"

// Procedural UI pixel-art generator (no AI quota needed).
//  - menu-bg.png        : fantasy adventure backdrop for the main menu (640x360)
//  - panel-frame-zN.png : 9-slice pixel frame for the battle question panel, one per zone (64x64)
// Usage: node scripts/gen-ui-art.mjs

const OUT_DIR = resolve("public/assets/gen/ui")
mkdirSync(OUT_DIR, { recursive: true })

function hexToRgb(hex) {
  const s = hex.replace("#", "")
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
}
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- menu-bg (drawn low-res, scaled up for chunky pixels) ----------
const LW = 160
const LH = 90
const SCALE = 4
const img = new PNG({ width: LW, height: LH })
const d = img.data

function setPx(x, y, [r, g, b]) {
  if (x < 0 || y < 0 || x >= LW || y >= LH) return
  const o = (y * LW + x) * 4
  d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255
}

const C = {
  skyTop: hexToRgb("#171126"),
  skyMid: hexToRgb("#1c1530"),
  skyLow: hexToRgb("#241a3a"),
  glow: hexToRgb("#2a1b3d"),
  mountainFar: hexToRgb("#1a1330"),
  mountainNear: hexToRgb("#221a34"),
  groundFar: hexToRgb("#33261b"),
  groundMid: hexToRgb("#2f2418"),
  groundNear: hexToRgb("#4a2c16"),
  tree: hexToRgb("#2a1f14"),
  treeHi: hexToRgb("#3f2c1a"),
  towerWall: hexToRgb("#2b2440"),
  towerRoof: hexToRgb("#4c1d95"),
  towerRoofHi: hexToRgb("#7c3aed"),
  towerTrim: hexToRgb("#f0c05a"),
  window: hexToRgb("#ffcf7a"),
  windowHi: hexToRgb("#ffe0a8"),
  moon: hexToRgb("#e8e3ff"),
  moonShade: hexToRgb("#b9b0e8"),
  star: hexToRgb("#c4b5fd"),
  starGold: hexToRgb("#f0c05a"),
  particle: hexToRgb("#a78bfa"),
  particleGold: hexToRgb("#f0c05a"),
}

const rnd = mulberry32(20240811)
for (let y = 0; y < LH; y++) {
  for (let x = 0; x < LW; x++) {
    let col
    const t = y / LH
    if (t < 0.62) {
      // sky bands with subtle dither
      col = t < 0.3 ? C.skyTop : t < 0.45 ? C.skyMid : C.skyLow
      if (t > 0.5 && rnd() < 0.18) col = C.glow
    } else if (t < 0.72) {
      col = C.groundFar
      if (rnd() < 0.2) col = C.tree
    } else {
      col = C.groundMid
      if (rnd() < 0.25) col = C.groundNear
    }
    setPx(x, y, col)
  }
}

// stars
for (let i = 0; i < 130; i++) {
  const x = Math.floor(rnd() * LW)
  const y = Math.floor(rnd() * LH * 0.5)
  if (rnd() < 0.25) setPx(x, y, C.starGold)
  else setPx(x, y, C.star)
}

// big moon with shade
for (let dy = -8; dy <= 8; dy++) {
  for (let dx = -8; dx <= 8; dx++) {
    if (dx * dx + dy * dy > 64) continue
    const mx = 122 + dx
    const my = 18 + dy
    setPx(mx, my, dx * dx + dy * dy > 38 ? C.moonShade : C.moon)
  }
}

// distant mountains (two silhouettes)
for (let x = 0; x < LW; x++) {
  const base = Math.floor(56 + Math.sin(x * 0.045) * 4 + Math.sin(x * 0.013) * 3)
  for (let y = base; y < Math.floor(LH * 0.62); y++) setPx(x, y, C.mountainFar)
}
for (let x = 0; x < LW; x++) {
  const base = Math.floor(62 + Math.sin(x * 0.09 + 2) * 2.5 + Math.sin(x * 0.023) * 2)
  for (let y = base; y < Math.floor(LH * 0.62); y++) setPx(x, y, C.mountainNear)
}

// wizard tower + battlements (right of center)
const tx = 96, ty = 34
// body
for (let y = ty; y < 58; y++) {
  for (let x = tx - 4; x < tx + 5; x++) {
    if (x < tx - 4 || x >= tx + 5) continue
    setPx(x, y, C.towerWall)
  }
}
// battlement crenellations
for (let x = tx - 5; x < tx + 6; x += 2) {
  setPx(x, ty - 2, C.towerWall); setPx(x, ty - 1, C.towerWall); setPx(x, ty - 3, C.towerWall)
}
// roof (cone)
for (let y = ty - 10; y < ty; y++) {
  const half = (ty - y) + 1
  for (let x = tx - half; x <= tx + half; x++) {
    if (Math.abs(x - tx) > half - 1) continue
    setPx(x, y, C.towerRoof)
    if ((y + x) % 5 === 0) setPx(x, y, C.towerRoofHi)
  }
}
setPx(tx, ty - 10, C.towerTrim); setPx(tx, ty - 11, C.towerTrim)
// glowing windows
for (const [wx, wy] of [[tx - 2, ty + 3], [tx + 2, ty + 3], [tx - 2, ty + 8], [tx + 2, ty + 8], [tx, ty + 13]]) {
  setPx(wx - 1, wy, C.window); setPx(wx, wy, C.windowHi); setPx(wx + 1, wy, C.window)
  setPx(wx, wy - 1, C.window); setPx(wx, wy + 1, C.window)
}

// forest at the 62-72 band
for (let x = 0; x < LW; x++) {
  if (rnd() < 0.5) continue
  const cx = x
  const top = 62 - Math.floor(rnd() * 4)
  const w = 2 + Math.floor(rnd() * 2)
  for (let t = 0; t < w; t++) {
    setPx(cx - w + t, 62, C.tree)
    setPx(cx - w + t, 63, C.treeHi)
  }
  for (let y = top; y < 64; y++) setPx(cx, y, C.tree)
}

// floating magic particles
for (let i = 0; i < 26; i++) {
  const px = Math.floor(rnd() * LW)
  const py = 8 + Math.floor(rnd() * 50)
  if (rnd() < 0.4) setPx(px, py, C.particleGold)
  else setPx(px, py, C.particle)
}

// nearest-neighbor upscale
const big = new PNG({ width: LW * SCALE, height: LH * SCALE })
for (let y = 0; y < LH; y++) {
  for (let x = 0; x < LW; x++) {
    const so = (y * LW + x) * 4
    const r = d[so], g = d[so + 1], b = d[so + 2]
    for (let sy = 0; sy < SCALE; sy++) {
      for (let sx = 0; sx < SCALE; sx++) {
        const o = ((y * SCALE + sy) * LW * SCALE + (x * SCALE + sx)) * 4
        big.data[o] = r; big.data[o + 1] = g; big.data[o + 2] = b; big.data[o + 3] = 255
      }
    }
  }
}
writeFileSync(resolve(OUT_DIR, "menu-bg.png"), PNG.sync.write(big))
console.log(`saved ${OUT_DIR}/menu-bg.png (${big.width}x${big.height})`)

// ---------- panel-frame per zone (64x64, border ~20px) ----------
const ZONES = [
  { id: "z1", accent: "#2f8f4f", hi: "#57b86f", lo: "#1c5f33", gold: "#e8c04a" },
  { id: "z2", accent: "#d98e3f", hi: "#f0aa55", lo: "#a86922", gold: "#f0c05a" },
  { id: "z3", accent: "#4aa3d8", hi: "#8fd4f5", lo: "#2b6fa3", gold: "#dcecff" },
  { id: "z4", accent: "#e0502a", hi: "#ff7a3d", lo: "#9c3118", gold: "#ffcf7a" },
]

const FS = 64
const T = 20

function edgeDist(x, y) {
  return Math.min(x, y, FS - 1 - x, FS - 1 - y)
}

for (const zone of ZONES) {
  const accent = hexToRgb(zone.accent)
  const hi = hexToRgb(zone.hi)
  const lo = hexToRgb(zone.lo)
  const gold = hexToRgb(zone.gold)
  const accentDark = accent.map(v => Math.round(v * 0.72))
  const frame = new PNG({ width: FS, height: FS })
  for (let y = 0; y < FS; y++) {
    for (let x = 0; x < FS; x++) {
      const o = (y * FS + x) * 4
      const ed = edgeDist(x, y)
      if (ed >= T) {
        // transparent inner window — filled by the panel's own background
        frame.data[o + 3] = 0
        continue
      }
      let col
      if (ed < 3) col = lo
      else if (ed === 3) col = hi
      else if (ed < 8) col = accent
      else if (ed === 8) col = accentDark
      else if (ed === 9) col = gold
      else if (ed < 14) col = accentDark
      else if (ed < 17) col = accent
      else if (ed === 17) col = hi
      else col = lo
      // top/left bevel highlight, bottom/right shadow
      const isTopEdge = y < T && y < FS - 1 - y
      const isLeftEdge = x < T && x < FS - 1 - x
      const isBottomEdge = y >= FS - 1 - y - 1 && y >= T
      const isRightEdge = x >= FS - 1 - x - 1 && x >= T
      if ((isTopEdge || isLeftEdge) && (ed >= 3 && ed < 8)) col = hi
      if ((isBottomEdge || isRightEdge) && (ed >= 3 && ed < 8)) col = accentDark
      // corner gem
      const corner = (x < T && y < T) || (x >= FS - T && y < T) || (x < T && y >= FS - T) || (x >= FS - T && y >= FS - T)
      if (corner && ed >= 10 && ed < 16) col = gold
      if (corner && ed >= 16 && ed < 17) col = gold.map(v => Math.round(v * 0.7))
      frame.data[o] = col[0]; frame.data[o + 1] = col[1]; frame.data[o + 2] = col[2]; frame.data[o + 3] = 255
    }
  }
  writeFileSync(resolve(OUT_DIR, `panel-frame-${zone.id}.png`), PNG.sync.write(frame))
  console.log(`saved ${OUT_DIR}/panel-frame-${zone.id}.png (${FS}x${FS})`)
}

// ---------- previews (8x, checkerboard) ----------
import { execSync } from "node:child_process"
const files = ["menu-bg.png", ...ZONES.map(z => `panel-frame-${z.id}.png`)]
for (const f of files) {
  const p = resolve(OUT_DIR, f)
  execSync(`node scripts/build-preview.mjs ${p} ${p.replace(".png", "-preview.png")}`, { stdio: "inherit" })
}
console.log("previews done")