import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const OUT_DIR = resolve(import.meta.dirname, "..", "public", "assets", "gen")
const MODEL = process.env.SC_GEN_MODEL || "qwen-image-2.0-pro"
const SIZE = process.env.SC_GEN_SIZE || "1536*864"

const args = process.argv.slice(2)
const REF_IMAGES = []
while (args.includes("--ref")) {
  const refIdx = args.indexOf("--ref")
  REF_IMAGES.push(resolve(args[refIdx + 1]))
  args.splice(refIdx, 2)
}
const PROMPT = args[0]
const OUT_NAME = args[1]

if (!PROMPT || !OUT_NAME) {
  console.error('usage: node scripts/gen-main-menu.mjs --ref <base-image> [--ref <ref2> ...] "<prompt>" <out-name>.png')
  process.exit(64)
}
if (REF_IMAGES.length === 0) {
  console.error("--ref <base-image> is required (the reference cover art)")
  process.exit(64)
}

let key = process.env.DASHSCOPE_API_KEY
if (!key) {
  const envPath = resolve(import.meta.dirname, "..", ".env.local")
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^DASHSCOPE_API_KEY=(.+)$/)
      if (m) key = m[1].trim()
    }
  }
}
if (!key) {
  console.error("DASHSCOPE_API_KEY not set (put it in .env.local)")
  process.exit(77)
}

const content = [
  ...REF_IMAGES.map((path) => {
    const buf = readFileSync(path)
    const mime = path.toLowerCase().endsWith(".jpg") || path.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : "image/png"
    return { image: `data:${mime};base64,${buf.toString("base64")}` }
  }),
  {
    text: `${PROMPT} STRICT: use the first reference image as the exact base scene — keep every character, goblin, rock, object, colors and layout identical. Remove ONLY the duplicate little witch on the RIGHT side. Match the pixel-art style from the references. No text other than the requested logo, no watermark.`,
  },
]

const body = {
  model: MODEL,
  input: {
    messages: [{ role: "user", content }],
  },
  parameters: {
    prompt_extend: false,
    watermark: false,
    n: 1,
    size: SIZE,
  },
}

const res = await fetch(
  "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  },
)

const raw = await res.text()
if (!res.ok) {
  console.error(`API error ${res.status}: ${raw}`)
  process.exit(69)
}

let data
try {
  data = JSON.parse(raw)
} catch {
  console.error(`non-JSON response: ${raw.slice(0, 2000)}`)
  process.exit(65)
}

if (data.code && data.code !== 200) {
  console.error(`API code ${data.code}: ${JSON.stringify(data)}`)
  process.exit(69)
}

const content0 = data?.output?.choices?.[0]?.message?.content ?? []
const imgPart = content0.find((p) => p.image)
if (!imgPart) {
  console.error("no image in response", JSON.stringify(data, null, 2).slice(0, 3000))
  process.exit(65)
}

const imageRef = imgPart.image
let buf
if (imageRef.startsWith("data:")) {
  buf = Buffer.from(imageRef.split(",")[1], "base64")
} else {
  const imgRes = await fetch(imageRef)
  if (!imgRes.ok) {
    console.error(`image download failed ${imgRes.status}`)
    process.exit(69)
  }
  buf = Buffer.from(await imgRes.arrayBuffer())
}

mkdirSync(OUT_DIR, { recursive: true })
const outPath = resolve(OUT_DIR, OUT_NAME)
writeFileSync(outPath, buf)
console.log(`saved ${outPath} (${buf.length} bytes)`)