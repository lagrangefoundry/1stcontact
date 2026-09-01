/**
 * Build the PNG conformance corpus and record what `sharp` decoded it to.
 *
 * REQ-156 replaces `sharp` with a codec written into this repo, and AC2 says the
 * decoded pixels must be byte-identical to what `sharp` produced — otherwise
 * every fidelity number recorded before the swap becomes incomparable with every
 * number after it, silently. That claim needs a witness, and once `sharp` is
 * uninstalled the witness cannot be re-derived. So it is captured HERE, ONCE,
 * while `sharp` is still resolvable, and committed as `sharp-baseline.json`.
 *
 * The corpus is authored BY HAND rather than by `sharp` on purpose: writing the
 * chunks directly is what lets each fixture pin a specific decode path — a
 * chosen row filter, a sub-byte bit depth, a palette with and without `tRNS`, an
 * IDAT deliberately split across chunks. Asking an encoder to produce those
 * would be asking it to hit them by luck.
 *
 * Re-run (from the repo root, with `sharp` installed) only when adding a case:
 *   node tests/fixtures/png/generate.mjs
 */
import { deflateSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const HERE = path.dirname(fileURLToPath(import.meta.url))

// ── minimal PNG writer with explicit control over every choice ────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  Buffer.from(data).copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/**
 * Assemble a PNG. `rows` is the already-packed scanline bytes (no filter byte);
 * `filterFor(y)` picks the filter type applied to each row, so a fixture can
 * demand Paeth on every row or cycle all five.
 */
function png({ width, height, bitDepth, colorType, rows, filterFor, palette, trns, idatChunks = 1 }) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = bitDepth
  ihdr[9] = colorType
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // adaptive filtering
  ihdr[12] = 0 // no interlace

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType]
  const bpp = Math.max(1, Math.ceil((bitDepth * channels) / 8))
  const rowBytes = Math.ceil((bitDepth * channels * width) / 8)

  // Filter each scanline against the previous ORIGINAL row, per the spec.
  const raw = Buffer.alloc(height * (rowBytes + 1))
  let prev = Buffer.alloc(rowBytes)
  for (let y = 0; y < height; y++) {
    const cur = Buffer.from(rows.subarray(y * rowBytes, (y + 1) * rowBytes))
    const f = filterFor(y)
    const base = y * (rowBytes + 1)
    raw[base] = f
    for (let i = 0; i < rowBytes; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0
      const b = prev[i]
      const c = i >= bpp ? prev[i - bpp] : 0
      let v
      if (f === 0) v = cur[i]
      else if (f === 1) v = cur[i] - a
      else if (f === 2) v = cur[i] - b
      else if (f === 3) v = cur[i] - ((a + b) >> 1)
      else v = cur[i] - paeth(a, b, c)
      raw[base + 1 + i] = v & 0xff
    }
    prev = cur
  }

  const parts = [SIGNATURE, chunk('IHDR', ihdr)]
  if (palette) parts.push(chunk('PLTE', Buffer.from(palette)))
  if (trns) parts.push(chunk('tRNS', Buffer.from(trns)))
  const z = deflateSync(raw)
  const per = Math.ceil(z.length / idatChunks)
  for (let i = 0; i < z.length; i += per) parts.push(chunk('IDAT', z.subarray(i, i + per)))
  parts.push(chunk('IEND', Buffer.alloc(0)))
  return Buffer.concat(parts)
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

/** Pack per-pixel sample tuples into 8-bit scanline bytes. */
function pack8(width, height, channels, fill) {
  const out = Buffer.alloc(width * height * channels)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = fill(x, y)
      for (let c = 0; c < channels; c++) out[(y * width + x) * channels + c] = px[c]
    }
  }
  return out
}

/** Pack single-channel sub-byte samples (bitDepth 1/2/4), MSB-first per the spec. */
function packBits(width, height, bitDepth, fill) {
  const rowBytes = Math.ceil((bitDepth * width) / 8)
  const out = Buffer.alloc(rowBytes * height)
  const perByte = 8 / bitDepth
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = fill(x, y) & ((1 << bitDepth) - 1)
      const shift = 8 - bitDepth * ((x % perByte) + 1)
      out[y * rowBytes + Math.floor(x / perByte)] |= v << shift
    }
  }
  return out
}

// ── the corpus ────────────────────────────────────────────────────────────────

const CASES = []

// Every row filter, on truecolour+alpha — the shape a Playwright screenshot has.
CASES.push({
  name: 'rgba-all-filters.png',
  why: 'RGBA/8, one of each row filter in turn — the five unfilter branches',
  bytes: png({
    width: 64,
    height: 48,
    bitDepth: 8,
    colorType: 6,
    rows: pack8(64, 48, 4, (x, y) => [(x * 4) & 0xff, (y * 5) & 0xff, (x ^ y) & 0xff, x < 32 ? 255 : 128]),
    filterFor: (y) => y % 5,
  }),
})

// Odd dimensions catch stride arithmetic that only works on multiples of 8.
CASES.push({
  name: 'rgb-odd-dims.png',
  why: 'RGB/8 at 33×17 — row stride that is not a round number, Paeth throughout',
  bytes: png({
    width: 33,
    height: 17,
    bitDepth: 8,
    colorType: 2,
    rows: pack8(33, 17, 3, (x, y) => [(x * 7) & 0xff, (y * 11) & 0xff, ((x + y) * 3) & 0xff]),
    filterFor: () => 4,
  }),
})

CASES.push({
  name: 'gray8.png',
  why: 'greyscale/8 — the shape `1c diff` writes its heatmaps in',
  bytes: png({
    width: 40,
    height: 40,
    bitDepth: 8,
    colorType: 0,
    rows: packBits(40, 40, 8, (x, y) => (x * 6 + y * 3) & 0xff),
    filterFor: (y) => (y % 2 === 0 ? 2 : 1),
  }),
})

CASES.push({
  name: 'gray-alpha.png',
  why: 'greyscale+alpha/8 — the two-channel case, which nothing else covers',
  bytes: png({
    width: 24,
    height: 24,
    bitDepth: 8,
    colorType: 4,
    rows: pack8(24, 24, 2, (x, y) => [(x * 10) & 0xff, (y * 10) & 0xff]),
    filterFor: () => 3,
  }),
})

const PALETTE = []
for (let i = 0; i < 16; i++) PALETTE.push(i * 17, 255 - i * 17, (i * 37) & 0xff)

CASES.push({
  name: 'palette8.png',
  why: 'indexed/8 without tRNS — palette expansion, opaque',
  bytes: png({
    width: 32,
    height: 32,
    bitDepth: 8,
    colorType: 3,
    palette: PALETTE,
    rows: packBits(32, 32, 8, (x, y) => (x + y) % 16),
    filterFor: () => 0,
  }),
})

CASES.push({
  name: 'palette8-trns.png',
  why: 'indexed/8 WITH tRNS — whether transparency promotes the output to 4 channels',
  bytes: png({
    width: 32,
    height: 32,
    bitDepth: 8,
    colorType: 3,
    palette: PALETTE,
    trns: [0, 64, 128, 255, 255, 255, 255, 255],
    rows: packBits(32, 32, 8, (x, y) => (x + y) % 16),
    filterFor: () => 0,
  }),
})

CASES.push({
  name: 'gray4.png',
  why: 'greyscale/4 — sub-byte unpacking plus the scale to 0..255',
  bytes: png({
    width: 16,
    height: 16,
    bitDepth: 4,
    colorType: 0,
    rows: packBits(16, 16, 4, (x, y) => (x + y) % 16),
    filterFor: () => 0,
  }),
})

CASES.push({
  name: 'gray1.png',
  why: 'greyscale/1 — the extreme of sub-byte packing; bpp clamps to one byte',
  bytes: png({
    width: 16,
    height: 16,
    bitDepth: 1,
    colorType: 0,
    rows: packBits(16, 16, 1, (x, y) => (x + y) % 2),
    filterFor: () => 0,
  }),
})

CASES.push({
  name: 'palette4.png',
  why: 'indexed/4 — sub-byte samples that are indices, not intensities',
  bytes: png({
    width: 16,
    height: 16,
    bitDepth: 4,
    colorType: 3,
    palette: PALETTE,
    rows: packBits(16, 16, 4, (x, y) => (x * y) % 16),
    filterFor: () => 0,
  }),
})

CASES.push({
  name: 'multi-idat.png',
  why: 'one image split across seven IDAT chunks — the concatenation seam',
  bytes: png({
    width: 48,
    height: 32,
    bitDepth: 8,
    colorType: 6,
    rows: pack8(48, 32, 4, (x, y) => [x * 5, y * 8, 200 - x, 255]),
    filterFor: (y) => y % 5,
    idatChunks: 7,
  }),
})

// A stand-in for the real subject: tall, banded, with hard edges and gradients,
// which is what a full-page screenshot looks like to a filter heuristic.
CASES.push({
  name: 'tall-screenshot.png',
  why: 'RGBA 320×1200 — the tall, banded shape a full-page screenshot actually has',
  bytes: png({
    width: 320,
    height: 1200,
    bitDepth: 8,
    colorType: 6,
    rows: pack8(320, 1200, 4, (x, y) => {
      const band = Math.floor(y / 150)
      if (band % 2 === 0) return [250 - (x >> 2), 250 - (x >> 2), 250 - (x >> 2), 255] // gradient
      if (x > 40 && x < 280 && y % 150 > 30 && y % 150 < 60) return [20, 40, 90, 255] // hard block
      return [245, 245, 245, 255]
    }),
    filterFor: (y) => (y % 3 === 0 ? 4 : y % 3 === 1 ? 2 : 1),
  }),
})

// ── write, then record what sharp makes of each ───────────────────────────────

mkdirSync(HERE, { recursive: true })
for (const c of CASES) writeFileSync(path.join(HERE, c.name), c.bytes)

// `sharp` is a dependency of tools/generate, not of the repo root, and ESM
// resolution walks up from THIS file — so it is resolved explicitly from the
// package that declares it rather than by bare specifier.
const require_ = createRequire(path.join(HERE, '../../../tools/generate/package.json'))

/**
 * Pinned, not read from the manifest — REQ-156 DELETED the `sharp` entry from
 * `tools/generate/package.json`, which is the whole point of the ticket, so
 * there is no longer a declaration to read. This is the version the baseline
 * below was actually recorded from; anyone re-running this script needs to
 * install that version for the numbers to mean the same thing.
 */
const SHARP_VERSION = '0.35.2'
const sharp = require_('sharp')
// sharp does not export ./package.json, so the version is read from the manifest
// that declares it — which is the number a reader would check anyway.

const baseline = {
  note:
    `Recorded by generate.mjs from sharp ${SHARP_VERSION}. sha256 is over the raw decoded pixel ` +
    'buffer. Do not regenerate to make a test pass — these numbers ARE the pre-swap behaviour ' +
    'REQ-156 AC2 promises not to move.',
  cases: {},
}

for (const c of CASES) {
  const file = path.join(HERE, c.name)
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  baseline.cases[c.name] = {
    why: c.why,
    width: info.width,
    height: info.height,
    channels: info.channels,
    bytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
  }
}

writeFileSync(path.join(HERE, 'sharp-baseline.json'), JSON.stringify(baseline, null, 2) + '\n')

/**
 * The same corpus again, base64 in a TypeScript module.
 *
 * workerd has no filesystem, so the workerd half of REQ-156 AC3 cannot
 * `readFileSync` these. Inlining them is what lets BOTH runtimes run the SAME
 * corpus against the SAME recorded sharp hashes — which is the only way "the
 * same code runs in workerd" is a claim about the code rather than about a
 * second, luckier copy of it. The whole corpus is under 10 kB, so there is no
 * reason to inline a subset.
 */
const inlineLines = [
  '// GENERATED by tests/fixtures/png/generate.mjs — do not edit by hand.',
  '//',
  '// The PNG conformance corpus, base64-encoded so workerd can read it, together',
  '// with what `sharp` decoded each fixture to (see sharp-baseline.json for the',
  '// provenance of those numbers). Regenerating this to make a test pass would',
  '// destroy the only record of the pre-REQ-156 behaviour AC2 promises to hold.',
  '',
  'export interface PngBaselineCase {',
  '  /** What this fixture exists to exercise. */',
  '  why: string',
  '  /** The fixture itself, base64. */',
  '  base64: string',
  '  width: number',
  '  height: number',
  '  /** Channels SHARP produced — it expands greyscale to sRGB, so 1ch sources read back as 3. */',
  '  channels: number',
  '  bytes: number',
  '  /** sha256 of the raw pixel buffer sharp decoded this fixture to. */',
  '  sha256: string',
  '}',
  '',
  `export const SHARP_BASELINE_NOTE = ${JSON.stringify(baseline.note)}`,
  '',
  'export const PNG_CORPUS: Record<string, PngBaselineCase> = {',
]
for (const c of CASES) {
  const b = baseline.cases[c.name]
  inlineLines.push(`  ${JSON.stringify(c.name)}: {`)
  inlineLines.push(`    why: ${JSON.stringify(b.why)},`)
  inlineLines.push(`    base64: ${JSON.stringify(c.bytes.toString('base64'))},`)
  inlineLines.push(`    width: ${b.width},`)
  inlineLines.push(`    height: ${b.height},`)
  inlineLines.push(`    channels: ${b.channels},`)
  inlineLines.push(`    bytes: ${b.bytes},`)
  inlineLines.push(`    sha256: ${JSON.stringify(b.sha256)},`)
  inlineLines.push('  },')
}
inlineLines.push('}')
inlineLines.push('')
inlineLines.push('/** Decode one corpus entry to bytes — the runtime-neutral spelling of readFileSync. */')
inlineLines.push('export function corpusBytes(name: string): Uint8Array {')
inlineLines.push('  const entry = PNG_CORPUS[name]')
inlineLines.push('  if (!entry) throw new Error(`no such PNG fixture: ${name}`)')
inlineLines.push('  const binary = atob(entry.base64)')
inlineLines.push('  const out = new Uint8Array(binary.length)')
inlineLines.push('  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)')
inlineLines.push('  return out')
inlineLines.push('}')
inlineLines.push('')
writeFileSync(path.join(HERE, 'corpus.ts'), inlineLines.join('\n'))
console.log(`wrote ${CASES.length} fixtures + sharp-baseline.json + corpus.ts`)
for (const [k, v] of Object.entries(baseline.cases)) console.log(` ${k}: ${v.width}×${v.height} ch=${v.channels}`)
