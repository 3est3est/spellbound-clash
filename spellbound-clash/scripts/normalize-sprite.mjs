import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { resolve, extname, dirname } from "node:path"
import { PNG } from "pngjs"

const SRC = resolve(process.argv[2])
const OUT = resolve(process.argv[3] ?? SRC.replace(extname(SRC), "-norm.png"))
const TARGET = parseInt(process.argv[4] ?? "0", 10)
const QUANTIZE = process.argv.includes("--quantize")

const COLORVAL = [
  ["grass", [126, 200, 80]],
  ["grassDark", [108, 179, 63]],
  ["path", [217, 184, 120]],
  ["pathDark", [201, 168, 104]],
  ["tree", [47, 125, 50]],
  ["treeDark", [31, 94, 34]],
  ["treeTrunk", [107, 68, 35]],
  ["rock", [158, 158, 158]],
  ["rockDark", [122, 122, 122]],
  ["water", [79, 195, 247]],
  ["waterDark", [41, 182, 246]],
  ["flower", [255, 138, 179]],
  ["hero", [59, 110, 240]],
  ["heroDark", [39, 71, 196]],
  ["heroHat", [30, 58, 138]],
  ["heroSkin", [241, 194, 125]],
  ["enemy", [192, 57, 43]],
  ["enemyDark", [146, 43, 33]],
  ["enemyEye", [255, 225, 77]],
]

const palet = COLORVAL.map(([name, rgb]) => ({ name, rgb }))

function nearestPalRgb(r, g, b) {
  let best = palet[0]
  let bestD = Infinity
  for (const p of palet) {
    const dr = r - p.rgb[0]
    const dg = g - p.rgb[1]
    const db = b - p.rgb[2]
    const d = dr * dr + dg * dg + db * db
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return best.rgb
}

const src = PNG.sync.read(readFileSync(SRC))
const { width: w, height: h, data } = src

// 1. background = average color of four corners
const bg = [0, 0, 0]
{
  let n = 0
  const acc = [0, 0, 0]
  for (const [cx, cy] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) {
    for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
      const x = cx + dx, y = cy + dy
      if (x < 0 || y < 0 || x >= w || y >= h) continue
      const i = (y * w + x) * 4
      acc[0] += data[i]; acc[1] += data[i + 1]; acc[2] += data[i + 2]; n++
    }
  }
  bg[0] = acc[0] / n; bg[1] = acc[1] / n; bg[2] = acc[2] / n
}

const bgDist = (r, g, b) => {
  const dr = r - bg[0], dg = g - bg[1], db = b - bg[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

// 2. background -> transparent
const TOL = 90
let minX = w, minY = h, maxX = -1, maxY = -1
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4
    if (bgDist(data[i], data[i + 1], data[i + 2]) <= TOL) {
      data[i + 3] = 0
    } else {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
}

if (maxX < minX) {
  console.error("no sprite pixels found")
  process.exit(65)
}

// 3. crop bbox (with pad)
const PAD = 2
const cw = maxX - minX + 1 + PAD * 2
const ch = maxY - minY + 1 + PAD * 2
const outW = TARGET || cw
const outH = TARGET || ch

// 4. block-mode downscale: each output pixel = mode (dominant) color of its source block
const out = new PNG({ width: outW, height: outH })
for (let oy = 0; oy < outH; oy++) {
  for (let ox = 0; ox < outW; ox++) {
    const x0 = minX - PAD + Math.floor((ox / outW) * cw)
    const x1 = minX - PAD + Math.floor(((ox + 1) / outW) * cw)
    const y0 = minY - PAD + Math.floor((oy / outH) * ch)
    const y1 = minY - PAD + Math.floor(((oy + 1) / outH) * ch)
    const counts = new Map()
    for (let sy = y0; sy < y1; sy++) {
      for (let sx = x0; sx < x1; sx++) {
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue
        const si = (sy * w + sx) * 4
        if (data[si + 3] === 0) {
          counts.set("T", (counts.get("T") ?? 0) + 1)
          continue
        }
        let r = data[si], g = data[si + 1], b = data[si + 2]
        if (QUANTIZE) {
          const p = nearestPalRgb(r, g, b)
          r = p[0]; g = p[1]; b = p[2]
        }
        const key = `${r},${g},${b}`
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    const oi = (oy * outW + ox) * 4
    let bestKey = "T"
    let bestN = -1
    for (const [k, n] of counts) {
      if (n > bestN) { bestN = n; bestKey = k }
    }
    if (bestKey === "T") {
      out.data[oi + 3] = 0
      continue
    }
    const [r, g, b] = bestKey.split(",").map(Number)
    out.data[oi] = r
    out.data[oi + 1] = g
    out.data[oi + 2] = b
    out.data[oi + 3] = 255
  }
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, PNG.sync.write(out))
const unique = new Set()
for (let i = 0; i < outW * outH; i++) {
  const oi = i * 4
  if (out.data[oi + 3] === 0) continue
  unique.add(`${out.data[oi]},${out.data[oi + 1]},${out.data[oi + 2]}`)
}
console.log(`saved ${OUT} (${outW}x${outH}) colors=${unique.size}`)