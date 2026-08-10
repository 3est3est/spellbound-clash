import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { resolve, extname, dirname } from "node:path"
import { PNG } from "pngjs"

// Extract real color palettes from a generated sprite (e.g. the mushroom asset)
// and paint seamless 48px tiles for the forest floor / dirt path.
// Usage: node scripts/build-palette-tile.mjs <sprite-px.png> <kind: grass|dirt> <out-prefix>

const SRC = resolve(process.argv[2])
const KIND = process.argv[3]
const OUT_PREFIX = resolve(process.argv[4] ?? SRC.replace(extname(SRC), ""))
const SIZE = 48

const src = PNG.sync.read(readFileSync(SRC))
const w = src.width
const h = src.height
const d = src.data

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))) }

const isGrass = (r, g, b) =>
  !(r > 240 && g > 240 && b > 240) &&
  g > 140 && g > r && g > b && r < 190 && b < 120

const isDirt = (r, g, b) =>
  !(r > 240 && g > 240 && b > 240) &&
  r > 110 && r > g * 1.05 && g >= b * 0.9 && g < 200 && b < 150 &&
  !(r > 180 && g < 80 && b < 70) && // exclude red mushroom cap areas
  g > 70 && b > 30 &&               // no very dark / pure charcoal
  Math.abs(r - g) < 110 &&          // keep warm browns, drop red-orange/pink
  Math.abs(g - b) < 90

const pal = new Map()
for (let i = 0; i < w * h; i++) {
  const o = i * 4
  const r = d[o], g = d[o + 1], b = d[o + 2]
  const hit = KIND === 'grass' ? isGrass(r, g, b) : isDirt(r, g, b)
  if (!hit) continue
  const k = `${Math.round(r / 8) * 8},${Math.round(g / 8) * 8},${Math.round(b / 8) * 8}`
  pal.set(k, (pal.get(k) ?? 0) + 1)
}
const top = [...pal.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
if (!top.length) {
  console.error(`no ${KIND} pixels found in ${SRC}`)
  process.exit(1)
}
const colors = top.map(([k]) => k.split(',').map(Number))
console.log(`${KIND} palette (${colors.length}):`, colors.map(c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')).join(' '))

// Seeded hash for deterministic texture (avoids visible tile seams)
function seeded(x, y, salt) {
  let h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(salt + 1, 1442695041)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const out = new PNG({ width: SIZE, height: SIZE })
const base = colors[0]
for (let oy = 0; oy < SIZE; oy++) {
  for (let ox = 0; ox < SIZE; ox++) {
    // blend palette colors with seeded jitter for organic ground variation
    let r = 0, g = 0, b = 0, n = 0
    for (let k = 0; k < colors.length; k++) {
      const w = seeded(ox, oy, 100 + k * 3)
      if (w < 0.82) continue
      r += colors[k][0] * (1 + (seeded(ox, oy, 200 + k) - 0.5) * 0.06)
      g += colors[k][1] * (1 + (seeded(ox, oy, 300 + k) - 0.5) * 0.06)
      b += colors[k][2] * (1 + (seeded(ox, oy, 400 + k) - 0.5) * 0.06)
      n++
    }
    if (!n) { r = base[0]; g = base[1]; b = base[2] }
    else { r /= n; g /= n; b /= n }

    const oi = (oy * SIZE + ox) * 4
    out.data[oi] = clamp(r)
    out.data[oi + 1] = clamp(g)
    out.data[oi + 2] = clamp(b)
    out.data[oi + 3] = 255
  }
}

// directional seam-blend pass: mix edges toward neighbors so tiles tile seamlessly
const blendedPx = Buffer.from(out.data)
for (let oy = 0; oy < SIZE; oy++) {
  for (let ox = 0; ox < SIZE; ox++) {
    const oi = (oy * SIZE + ox) * 4
    const wrapX = (o, mod) => ((o % mod) + mod) % mod
    const wrapY = (o, mod) => ((o % mod) + mod) % mod
    // neighbor samples across wrap
    const nb = [
      [wrapX(ox - 2, SIZE), oy], [wrapX(ox + 2, SIZE), oy],
      [ox, wrapY(oy - 2, SIZE)], [ox, wrapY(oy + 2, SIZE)],
      [wrapX(ox - 1, SIZE), wrapY(oy - 1, SIZE)], [wrapX(ox + 1, SIZE), wrapY(oy + 1, SIZE)],
    ]
    let edge = 0
    let er = 0, eg = 0, eb = 0
    for (const [nx, ny] of nb) {
      const ni = (ny * SIZE + nx) * 4
      er += blendedPx[ni]; eg += blendedPx[ni + 1]; eb += blendedPx[ni + 2]
      edge++
    }
    if (edge) {
      // 25% neighbor blend makes left/right and top/bottom edges continuous
      out.data[oi] = clamp(out.data[oi] * 0.75 + (er / edge) * 0.25)
      out.data[oi + 1] = clamp(out.data[oi + 1] * 0.75 + (eg / edge) * 0.25)
      out.data[oi + 2] = clamp(out.data[oi + 2] * 0.75 + (eb / edge) * 0.25)
    }
  }
}

const p = `${OUT_PREFIX}-${SIZE}.png`
mkdirSync(dirname(p), { recursive: true })
writeFileSync(p, PNG.sync.write(out))
console.log(`saved ${p} (${SIZE}x${SIZE})`)