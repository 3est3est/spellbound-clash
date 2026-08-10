import { readFileSync, writeFileSync } from "node:fs"
import { PNG } from "pngjs"

const name = process.argv[2]
const frames = [0, 1, 2, 3].map((i) =>
  PNG.sync.read(readFileSync(`public/assets/gen/${name}-walk${i}-32.png`)),
)
const w = frames[0].width
const h = frames[0].height
const out = new PNG({ width: w * frames.length, height: h })
for (let f = 0; f < frames.length; f++) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4
      const oi = (y * out.width + f * w + x) * 4
      out.data[oi] = frames[f].data[si]
      out.data[oi + 1] = frames[f].data[si + 1]
      out.data[oi + 2] = frames[f].data[si + 2]
      out.data[oi + 3] = frames[f].data[si + 3]
    }
  }
}
writeFileSync(`public/assets/gen/${name}-walk.png`, PNG.sync.write(out))
console.log(`packed ${name}-walk.png ${out.width}x${out.height}`)