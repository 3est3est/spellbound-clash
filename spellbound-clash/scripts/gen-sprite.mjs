import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { dirname, resolve } from "node:path"

const MODEL = process.env.SC_GEN_MODEL || "gemini-2.5-flash-image"
const OUT_DIR = resolve(import.meta.dirname, "..", "public", "assets", "gen")
const PROMPT = process.argv[2]
const OUT_NAME = process.argv[3]

if (!PROMPT || !OUT_NAME) {
  console.error("usage: node scripts/gen-sprite.mjs \"<prompt>\" <out-name.png>")
  process.exit(64)
}

let key = process.env.GEMINI_API_KEY
if (!key) {
  const envPath = resolve(import.meta.dirname, "..", ".env.local")
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^GEMINI_API_KEY=(.+)$/)
      if (m) key = m[1].trim()
    }
  }
}
if (!key) {
  console.error("GEMINI_API_KEY not set (put it in .env.local)")
  process.exit(77)
}

const body = {
  contents: [{ parts: [{ text: PROMPT }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
}

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
  {
    method: "POST",
    headers: {
      "x-goog-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  },
)

if (!res.ok) {
  console.error(`API error ${res.status}: ${await res.text()}`)
  process.exit(69)
}

const data = await res.json()
const parts = data?.candidates?.[0]?.content?.parts ?? []
const img = parts.find((p) => p.inlineData?.data)
if (!img) {
  console.error("no image in response", JSON.stringify(data, null, 2).slice(0, 2000))
  process.exit(65)
}

const mime = img.inlineData.mimeType || "image/png"
const buf = Buffer.from(img.inlineData.data, "base64")
mkdirSync(OUT_DIR, { recursive: true })
const outPath = resolve(OUT_DIR, OUT_NAME)
writeFileSync(outPath, buf)
console.log(`saved ${outPath} (${buf.length} bytes, ${mime})`)