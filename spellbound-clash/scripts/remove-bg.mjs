import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { PNG } from "pngjs"

const SRC = resolve(process.argv[2])
const OUT = resolve(process.argv[3] ?? SRC.replace(/\.png$/, "-nobg.png"))
const TOL = Number(process.argv[4] ?? 48)

const src = PNG.sync.read(readFileSync(SRC))
const w = src.width
const h = src.height
const d = src.data

const isClose = (a, b) =>
  Math.abs(d[a] - d[b]) + Math.abs(d[a + 1] - d[b + 1]) + Math.abs(d[a + 2] - d[b + 2]) <= TOL

const queue = []
const push = (i) => {
  const o = i * 4
  if (d[o + 3] === 0) return
  if (isClose(o, (w * 0 + 0) * 4) === false) return
  queue.push(i)
  d[o + 3] = 0
}

const seed = [
  0, w - 1, w * (h - 1), w * h - 1,
]
for (const s of seed) push(s)
for (let x = 1; x < w - 1; x++) { push(x); push(w * (h - 1) + x) }
for (let y = 1; y < h - 1; y++) { push(y * w); push(y * w + w - 1) }

while (queue.length) {
  const i = queue.pop()
  const x = i % w
  const y = (i / w) | 0
  if (x > 0) push(i - 1)
  if (x < w - 1) push(i + 1)
  if (y > 0) push(i - w)
  if (y < h - 1) push(i + w)
}

const removed = seed.length + (w * h - 1 - seed.length) - (queue.length === 0 ? 0 : 0)
let transparent = 0
for (let i = 0; i < w * h; i++) if (d[i * 4 + 3] === 0) transparent++
let opaque = w * h - transparent
console.log(`removed bg -> transparent=${transparent} (${((transparent / (w * h)) * 100).toFixed(1)}%), opaque=${opaque}`)

let minX = w, minY = h, maxX = -1, maxY = -1
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    if (d[(y * w + x) * 4 + 3] === 0) continue
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
}
console.log(`sprite bbox ${maxX - minX + 1}x${maxY - minY + 1} @ (${minX},${minY})`)

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, PNG.sync.write(src))
console.log(`saved ${OUT}`)
