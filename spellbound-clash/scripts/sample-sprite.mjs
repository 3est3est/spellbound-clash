import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { resolve, extname, dirname } from "node:path"
import { PNG } from "pngjs"

const SRC = resolve(process.argv[2])
const OUT_PREFIX = resolve(process.argv[3] ?? SRC.replace(extname(SRC), ""))
const SIZES = (process.argv[4] ?? "16,32").split(",").map(Number)

const src = PNG.sync.read(readFileSync(SRC))
const w = src.width
const h = src.height
const data = src.data

// background = dominant color (most frequent)
const bg = new Map()
for (let i = 0; i < w * h; i++) {
  const o = i * 4
  const k = `${data[o]},${data[o + 1]},${data[o + 2]}`
  bg.set(k, (bg.get(k) ?? 0) + 1)
}
let top = null
let topN = -1
for (const [k, n] of bg) {
  if (n > topN) { topN = n; top = k }
}
const [br, bgG, bb] = top.split(",").map(Number)

const isBg = (r, g, b) =>
  Math.abs(r - br) + Math.abs(g - bgG) + Math.abs(b - bb) < 90

// sprite bbox
let minX = w, minY = h, maxX = -1, maxY = -1
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4
    if (isBg(data[o], data[o + 1], data[o + 2])) continue
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
}
if (maxX < minX) {
  console.error("no sprite found")
  process.exit(65)
}

const PAD = 0
const cw = maxX - minX + 1 + PAD * 2
const ch = maxY - minY + 1 + PAD * 2
console.log(`sprite bbox ${cw}x${ch} @ (${minX},${minY}) bg=(${br},${bgG},${bb})`)

for (const size of SIZES) {
  const out = new PNG({ width: size, height: size })
  for (let oy = 0; oy < size; oy++) {
    for (let ox = 0; ox < size; ox++) {
      // center of destination pixel, mapped to source coords
      const sx = minX + Math.round(((ox + 0.5) / size) * cw - 0.5)
      const sy = minY + Math.round(((oy + 0.5) / size) * ch - 0.5)
      const si = (Math.min(Math.max(sy, 0), h - 1) * w + Math.min(Math.max(sx, 0), w - 1)) * 4
      const oi = (oy * size + ox) * 4
      const r = data[si], g = data[si + 1], b = data[si + 2]
      if (isBg(r, g, b)) {
        out.data[oi + 3] = 0
      } else {
        out.data[oi] = r
        out.data[oi + 1] = g
        out.data[oi + 2] = b
        out.data[oi + 3] = 255
      }
    }
  }
  const p = `${OUT_PREFIX}-${size}.png`
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, PNG.sync.write(out))
  const uniq = new Set()
  for (let i = 0; i < size * size; i++) {
    const oi = i * 4
    if (out.data[oi + 3] === 0) continue
    uniq.add(`${out.data[oi]},${out.data[oi + 1]},${out.data[oi + 2]}`)
  }
  console.log(`saved ${p} (${size}x${size}) colors=${uniq.size}`)
}