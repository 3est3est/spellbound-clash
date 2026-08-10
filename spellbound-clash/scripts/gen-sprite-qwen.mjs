import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const OUT_DIR = resolve(import.meta.dirname, "..", "public", "assets", "gen")
const PROMPT = process.argv[2]
const OUT_NAME = process.argv[3]
const MODEL = process.env.SC_GEN_MODEL || "qwen-image-2.0-pro"
const SIZE = process.env.SC_GEN_SIZE || "1024*1024"

if (!PROMPT || !OUT_NAME) {
  console.error("usage: node scripts/gen-sprite-qwen.mjs \"<prompt>\" <out-name.png>")
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

const body = {
  model: MODEL,
  input: {
    messages: [{ role: "user", content: [{ text: PROMPT }] }],
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

const content = data?.output?.choices?.[0]?.message?.content ?? []
const imgPart = content.find((p) => p.image)
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