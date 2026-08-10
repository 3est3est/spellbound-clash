import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { resolve, extname, dirname } from "node:path"
import { PNG } from "pngjs"

const SRC = resolve(process.argv[2])
const OUT_PREFIX = resolve(process.argv[3] ?? SRC.replace(extname(SRC), ""))
const SIZES = (process.argv[4] ?? "48").split(",").map(Number)

const src = PNG.sync.read(readFileSync(SRC))
const w = src.width
const h = src.height
const d = src.data

// Square-crop the whole image (keep alpha), then nearest-sample to target size.
const c = Math.min(w, h)
const offX = Math.floor((w - c) / 2)
const offY = Math.floor((h - c) / 2)

for (const size of SIZES) {
  const out = new PNG({ width: size, height: size })
  for (let oy = 0; oy < size; oy++) {
    for (let ox = 0; ox < size; ox++) {
      const sx = offX + Math.min(c - 1, Math.floor(((ox + 0.5) / size) * c))
      const sy = offY + Math.min(c - 1, Math.floor(((oy + 0.5) / size) * c))
      const si = (sy * w + sx) * 4
      const oi = (oy * size + ox) * 4
      out.data[oi] = d[si]
      out.data[oi + 1] = d[si + 1]
      out.data[oi + 2] = d[si + 2]
      out.data[oi + 3] = d[si + 3]
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