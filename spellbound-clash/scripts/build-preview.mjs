import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { PNG } from "pngjs"

const SRC = resolve(process.argv[2])
const OUT = resolve(process.argv[3] ?? SRC.replace(/\.png$/, "-preview.png"))
const UP = parseInt(process.argv[4] ?? "8", 10)

const src = PNG.sync.read(readFileSync(SRC))
const { width: w, height: h } = src
const out = new PNG({ width: w * UP, height: h * UP })

for (let oy = 0; oy < out.height; oy++) {
  for (let ox = 0; ox < out.width; ox++) {
    const si = ((Math.floor(oy / UP) * w + Math.floor(ox / UP)) * 4)
    const oi = (oy * out.width + ox) * 4
    const a = src.data[si + 3]
    if (a === 0) {
      const c = ((Math.floor(ox / UP) + Math.floor(oy / UP)) % 2 === 0) ? 200 : 160
      out.data[oi] = c
      out.data[oi + 1] = c
      out.data[oi + 2] = c
      out.data[oi + 3] = 255
    } else {
      out.data[oi] = src.data[si]
      out.data[oi + 1] = src.data[si + 1]
      out.data[oi + 2] = src.data[si + 2]
      out.data[oi + 3] = 255
    }
  }
}

writeFileSync(OUT, PNG.sync.write(out))
console.log(`preview ${w}x${h} -> ${out.width}x${out.height}: ${OUT}`)