/**
 * The PNG codec — **the image layer, written into this repo** (REQ-156).
 *
 * `sharp` is a native module. It cannot run in workerd, no `nodejs_compat` flag
 * changes that, and it was this repo's reason for `1c diff` / `1c crop` /
 * `1c aligned-crops` — and therefore `1c gate` — being unable to run in the
 * cloud. That is a blocker with nothing to do with the product.
 *
 * WHY HAND-ROLLED RATHER THAN A PACKAGE. The expensive half of PNG is DEFLATE,
 * and both runtimes already ship it: `DecompressionStream('deflate')` and
 * `CompressionStream('deflate')` are platform globals in Node and in workerd,
 * and `'deflate'` is the zlib wrapping (RFC 1950) that IDAT actually uses, not
 * the raw stream. What is left over is the container: walk chunks, undo five row
 * filters, and reverse that to encode. Weighed against bundling a WASM binary or
 * inheriting a dependency's maintenance, the container is the cheaper thing to
 * own. Taking a package stays available if decode ever proves too slow — see
 * `tests/test_UAT_FC_REQ-156_png_codec.test.ts`, which records the measurement
 * that would reopen the question.
 *
 * WHY PNG AND NOTHING ELSE. Everything that reaches this module is a Playwright
 * screenshot or something `1c` itself wrote, and both are PNG. The other raster
 * formats the product handles — JPEG, GIF, WebP — travel the *material* path
 * (`apps/control-app/src/material.ts` → `describe.ts` → the vision model), which
 * stores bytes whole and never decodes a pixel, so nothing there needs a codec
 * and this one narrows nothing. Adding them here would be expensive and, for
 * JPEG, would forfeit the exactness the fidelity numbers depend on: the JPEG
 * IDCT is specified only to a precision *bound* (ITU-T T.83), so two conforming
 * decoders may legitimately disagree by ±1 and {@link decodePng}'s byte-equality
 * promise could not be made at all.
 *
 * THE DROP-IN CONTRACT. `sharp` does not hand back the source's channel count:
 * it converts to sRGB on decode, so a greyscale PNG arrives as 3-channel RGB and
 * greyscale+alpha as 4-channel RGBA. That is not cosmetic — `computeDiff` strides
 * its reads by `Raster.channels`, so a decoder returning the source's own count
 * would silently read across pixel boundaries. This module therefore reproduces
 * the expansion exactly. `tests/fixtures/png/sharp-baseline.json` is the recorded
 * witness, captured while `sharp` was still installed.
 */
import type { Raster } from './perceptual-core'

/** The 8-byte PNG signature (§5.2). */
const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const

/**
 * Input this codec will not decode, distinguished from a *corrupt* PNG.
 *
 * REQ-156 deliberately narrows `1c crop`, which previously accepted anything
 * `sharp` could read. An operator who hands it a JPEG deserves to be told that,
 * rather than to watch a PNG parser fail on a header it was never given.
 */
export class UnsupportedImageError extends Error {
  readonly format: string
  constructor(format: string, detail: string) {
    super(detail)
    this.name = 'UnsupportedImageError'
    this.format = format
  }
}

/** A PNG this codec understands the *shape* of but cannot decode. */
export class PngFeatureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PngFeatureError'
  }
}

/** A PNG that is malformed — truncated, mis-CRC'd, or self-inconsistent. */
export class PngCorruptError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PngCorruptError'
  }
}

// ── format sniffing ───────────────────────────────────────────────────────────

/**
 * Name the image format from its leading bytes, so a refusal can say *what* it
 * was handed. Magic-number detection only — no extension is consulted, because
 * the extension is what is wrong in the case worth catching.
 */
export function sniffImageFormat(bytes: Uint8Array): string {
  const at = (i: number) => bytes[i]
  const ascii = (o: number, n: number) =>
    String.fromCharCode(...Array.from(bytes.subarray(o, o + n)))

  if (bytes.length >= 8 && SIGNATURE.every((b, i) => at(i) === b)) return 'PNG'
  if (bytes.length >= 3 && at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return 'JPEG'
  if (bytes.length >= 6 && (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a')) return 'GIF'
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'WebP'
  if (bytes.length >= 12 && ascii(4, 4) === 'ftyp') {
    const brand = ascii(8, 4)
    if (brand === 'avif' || brand === 'avis') return 'AVIF'
    // `mif1`/`msf1` are the generic HEIF brands an iPhone photo also carries.
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) return 'HEIC/HEIF'
    return `ISO-BMFF (${brand})`
  }
  if (bytes.length >= 2 && at(0) === 0x42 && at(1) === 0x4d) return 'BMP'
  if (bytes.length >= 4 && (ascii(0, 4) === 'II\x2a\x00' || ascii(0, 4) === 'MM\x00\x2a')) return 'TIFF'
  const lead = ascii(0, Math.min(bytes.length, 300)).trimStart()
  if (lead.startsWith('<?xml') || lead.startsWith('<svg')) return 'SVG'
  return 'unrecognised'
}

/**
 * Refuse a non-PNG input by name.
 *
 * HEIC is called out specifically because it is the one an operator is most
 * likely to arrive with by accident — it is what an iPhone produces — and
 * because "convert it" is genuinely the whole remedy.
 */
function refuseNonPng(bytes: Uint8Array, what: string): never {
  const format = sniffImageFormat(bytes)
  if (format === 'unrecognised') {
    throw new UnsupportedImageError(
      format,
      `${what}: not a PNG, and the leading bytes match no image format this build recognises.`,
    )
  }
  throw new UnsupportedImageError(
    format,
    `${what}: this is a ${format} image, and 1c decodes PNG only (REQ-156 replaced the native ` +
      `codec with a PNG one). Convert it first — e.g. 'sips -s format png in.${format.toLowerCase()} ` +
      `--out out.png' on macOS — and pass the PNG.`,
  )
}

// ── header ────────────────────────────────────────────────────────────────────

interface Ihdr {
  width: number
  height: number
  bitDepth: number
  colorType: number
  interlace: number
}

function u32(bytes: Uint8Array, off: number): number {
  return ((bytes[off] << 24) | (bytes[off + 1] << 16) | (bytes[off + 2] << 8) | bytes[off + 3]) >>> 0
}

function readIhdr(bytes: Uint8Array, what: string): Ihdr {
  if (bytes.length < 8 || !SIGNATURE.every((b, i) => bytes[i] === b)) refuseNonPng(bytes, what)
  if (bytes.length < 33) throw new PngCorruptError(`${what}: PNG is too short to hold an IHDR.`)
  if (String.fromCharCode(...Array.from(bytes.subarray(12, 16))) !== 'IHDR') {
    throw new PngCorruptError(`${what}: first chunk is not IHDR, which the spec requires.`)
  }
  const ihdr: Ihdr = {
    width: u32(bytes, 16),
    height: u32(bytes, 20),
    bitDepth: bytes[24],
    colorType: bytes[25],
    interlace: bytes[28],
  }
  if (ihdr.width === 0 || ihdr.height === 0) {
    throw new PngCorruptError(`${what}: IHDR declares a zero dimension (${ihdr.width}×${ihdr.height}).`)
  }
  return ihdr
}

/**
 * Read a PNG's dimensions without inflating it — the IHDR is the first 33 bytes,
 * so this stays O(1) whatever the image weighs. `1c crop` clamps its box against
 * these before deciding it needs the pixels at all.
 */
export function pngDimensions(bytes: Uint8Array, what = 'png'): { width: number; height: number } {
  const { width, height } = readIhdr(bytes, what)
  return { width, height }
}

// ── DEFLATE, from the platform ────────────────────────────────────────────────

/**
 * The write side is NOT awaited before the read loop starts.
 *
 * A transform stream's `write()` does not settle until the reader has drained
 * enough for backpressure to clear, so awaiting it first deadlocks on any image
 * larger than the internal queue — which is every real screenshot. The write is
 * kicked off as a concurrent task and joined *after* the reader reaches `done`.
 */
/**
 * Structural, and reached through a cast at the two call sites: the platform
 * types declare the writable half as `BufferSource`, whose `ArrayBufferView`
 * arm is pinned to `ArrayBuffer` — so a plain `Uint8Array`, which TypeScript now
 * parameterises as `Uint8Array<ArrayBufferLike>`, is not assignable to it. The
 * mismatch is `SharedArrayBuffer`, which neither runtime hands us and neither
 * compression stream would accept.
 */
type ByteTransform = { writable: WritableStream<Uint8Array>; readable: ReadableStream<Uint8Array> }

async function through(transform: ByteTransform, data: Uint8Array): Promise<Uint8Array> {
  const writer = transform.writable.getWriter()
  const pump = (async () => {
    await writer.write(data)
    await writer.close()
  })()
  const reader = transform.readable.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  await pump
  const out = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.length
  }
  return out
}

/** IDAT is a zlib stream (RFC 1950) — `'deflate'`, not `'deflate-raw'`. */
const inflate = (data: Uint8Array) => through(new DecompressionStream('deflate') as unknown as ByteTransform, data)
const deflate = (data: Uint8Array) => through(new CompressionStream('deflate') as unknown as ByteTransform, data)

// ── decode ────────────────────────────────────────────────────────────────────

/** Source channels per colour type (§6): grey, —, RGB, indexed, grey+A, —, RGBA. */
const SOURCE_CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }

/**
 * Decode PNG bytes to a {@link Raster}, matching `sharp`'s output exactly —
 * including its expansion of greyscale to RGB (see the module header).
 *
 * SUPPORTED: bit depth 8 for colour types 0/2/4/6, and bit depths 1/2/4/8 for
 * the sub-byte types 0 and 3. REFUSED, loudly: 16-bit samples and Adam7
 * interlacing. Neither is reachable from anything this pipeline produces —
 * Playwright writes 8-bit non-interlaced RGBA — and a decoder that guessed at
 * them would be worse than one that says so.
 */
export async function decodePng(bytes: Uint8Array, what = 'png'): Promise<Raster> {
  const ihdr = readIhdr(bytes, what)
  const { width, height, bitDepth, colorType, interlace } = ihdr

  if (interlace !== 0) {
    throw new PngFeatureError(
      `${what}: Adam7-interlaced PNG. This codec decodes non-interlaced PNGs only; re-save without interlacing.`,
    )
  }
  if (bitDepth === 16) {
    throw new PngFeatureError(
      `${what}: 16-bit PNG. This codec decodes 8-bit samples (and sub-byte greyscale/indexed); re-save at 8 bits.`,
    )
  }
  const srcChannels = SOURCE_CHANNELS[colorType]
  if (srcChannels === undefined) {
    throw new PngCorruptError(`${what}: IHDR declares colour type ${colorType}, which is not a PNG colour type.`)
  }
  if (bitDepth !== 8 && !(colorType === 0 || colorType === 3)) {
    throw new PngFeatureError(
      `${what}: ${bitDepth}-bit colour type ${colorType}. Sub-byte depths exist only for greyscale and indexed images.`,
    )
  }
  if (![1, 2, 4, 8].includes(bitDepth)) {
    throw new PngCorruptError(`${what}: IHDR declares bit depth ${bitDepth}, which is not a PNG bit depth.`)
  }

  // ── walk the chunks ──
  const idat: Uint8Array[] = []
  let idatTotal = 0
  let palette: Uint8Array | undefined
  let trns: Uint8Array | undefined
  let off = 8
  let sawEnd = false
  while (off + 8 <= bytes.length) {
    const len = u32(bytes, off)
    const type = String.fromCharCode(...Array.from(bytes.subarray(off + 4, off + 8)))
    const start = off + 8
    if (start + len + 4 > bytes.length) {
      throw new PngCorruptError(`${what}: chunk '${type}' claims ${len} bytes but the file ends first.`)
    }
    if (type === 'PLTE') palette = bytes.subarray(start, start + len)
    else if (type === 'tRNS') trns = bytes.subarray(start, start + len)
    else if (type === 'IDAT') {
      idat.push(bytes.subarray(start, start + len))
      idatTotal += len
    } else if (type === 'IEND') {
      sawEnd = true
      break
    }
    off = start + len + 4
  }
  if (!sawEnd) throw new PngCorruptError(`${what}: no IEND chunk — the file is truncated.`)
  if (idatTotal === 0) throw new PngCorruptError(`${what}: no IDAT chunk — there is no image data.`)
  if (colorType === 3 && !palette) throw new PngCorruptError(`${what}: indexed PNG with no PLTE chunk.`)

  // IDAT is ONE zlib stream that merely happens to be chopped across chunks, so
  // the parts are concatenated before inflating rather than inflated apart.
  const compressed = new Uint8Array(idatTotal)
  {
    let p = 0
    for (const part of idat) {
      compressed.set(part, p)
      p += part.length
    }
  }
  const raw = await inflate(compressed)

  // ── undo the row filters ──
  const bpp = Math.max(1, Math.ceil((bitDepth * srcChannels) / 8))
  const rowBytes = Math.ceil((bitDepth * srcChannels * width) / 8)
  const expected = height * (rowBytes + 1)
  if (raw.length < expected) {
    throw new PngCorruptError(
      `${what}: inflated to ${raw.length} bytes but ${height} rows of ${rowBytes} need ${expected}.`,
    )
  }
  const lines = unfilter(raw, width, height, rowBytes, bpp, what)

  // ── expand to sRGB, the way sharp does ──
  const hasAlpha = colorType === 4 || colorType === 6 || (colorType === 3 && trns !== undefined)
  const outChannels = hasAlpha ? 4 : 3
  const data = new Uint8Array(width * height * outChannels)

  for (let y = 0; y < height; y++) {
    const src = y * rowBytes
    let dst = y * width * outChannels
    if (colorType === 6) {
      data.set(lines.subarray(src, src + width * 4), dst)
    } else if (colorType === 2) {
      data.set(lines.subarray(src, src + width * 3), dst)
    } else if (colorType === 4) {
      for (let x = 0; x < width; x++) {
        const g = lines[src + x * 2]
        data[dst++] = g
        data[dst++] = g
        data[dst++] = g
        data[dst++] = lines[src + x * 2 + 1]
      }
    } else if (colorType === 0) {
      // Sub-byte greyscale is scaled to the full 0..255 range, not left in its
      // own: 1-bit becomes 0/255, 4-bit becomes v×17. `255 / maxValue` is exact
      // in integers for every depth the spec allows.
      const max = (1 << bitDepth) - 1
      for (let x = 0; x < width; x++) {
        const g = bitDepth === 8 ? lines[src + x] : (sample(lines, src, x, bitDepth) * 255) / max
        data[dst++] = g
        data[dst++] = g
        data[dst++] = g
      }
    } else {
      for (let x = 0; x < width; x++) {
        const idx = bitDepth === 8 ? lines[src + x] : sample(lines, src, x, bitDepth)
        const p = idx * 3
        if (p + 2 >= palette!.length) {
          throw new PngCorruptError(`${what}: palette index ${idx} is past the end of a ${palette!.length / 3}-entry PLTE.`)
        }
        data[dst++] = palette![p]
        data[dst++] = palette![p + 1]
        data[dst++] = palette![p + 2]
        // tRNS on an indexed image is a short list of alphas; entries past its
        // end are opaque (§11.3.2), which is why this is not an index error.
        if (hasAlpha) data[dst++] = idx < trns!.length ? trns![idx] : 255
      }
    }
  }

  return { data, width, height, channels: outChannels }
}

/** Read one sub-byte sample, MSB-first within each byte (§7.2). */
function sample(lines: Uint8Array, rowStart: number, x: number, bitDepth: number): number {
  const perByte = 8 / bitDepth
  const byte = lines[rowStart + Math.floor(x / perByte)]
  const shift = 8 - bitDepth * ((x % perByte) + 1)
  return (byte >> shift) & ((1 << bitDepth) - 1)
}

/**
 * Reverse the five per-row filters (§9.2) into a flat `height × rowBytes` buffer.
 *
 * Each filter is defined against the *reconstructed* bytes — `a` to the left in
 * this row, `b` above, `c` above-left — so this necessarily walks forwards and
 * cannot be vectorised past the byte. It is also the whole of the decoder's hot
 * loop, which is why the previous row is addressed by offset into the same
 * output buffer rather than copied out each time.
 */
function unfilter(
  raw: Uint8Array,
  width: number,
  height: number,
  rowBytes: number,
  bpp: number,
  what: string,
): Uint8Array {
  const out = new Uint8Array(height * rowBytes)
  for (let y = 0; y < height; y++) {
    const inBase = y * (rowBytes + 1)
    const filter = raw[inBase]
    const cur = y * rowBytes
    const prev = cur - rowBytes
    const src = inBase + 1

    switch (filter) {
      case 0:
        out.set(raw.subarray(src, src + rowBytes), cur)
        break
      case 1:
        for (let i = 0; i < rowBytes; i++) {
          out[cur + i] = (raw[src + i] + (i >= bpp ? out[cur + i - bpp] : 0)) & 0xff
        }
        break
      case 2:
        for (let i = 0; i < rowBytes; i++) {
          out[cur + i] = (raw[src + i] + (y > 0 ? out[prev + i] : 0)) & 0xff
        }
        break
      case 3:
        for (let i = 0; i < rowBytes; i++) {
          const a = i >= bpp ? out[cur + i - bpp] : 0
          const b = y > 0 ? out[prev + i] : 0
          out[cur + i] = (raw[src + i] + ((a + b) >> 1)) & 0xff
        }
        break
      case 4:
        for (let i = 0; i < rowBytes; i++) {
          const a = i >= bpp ? out[cur + i - bpp] : 0
          const b = y > 0 ? out[prev + i] : 0
          const c = y > 0 && i >= bpp ? out[prev + i - bpp] : 0
          out[cur + i] = (raw[src + i] + paeth(a, b, c)) & 0xff
        }
        break
      default:
        throw new PngCorruptError(`${what}: row ${y} declares filter type ${filter}; only 0–4 exist.`)
    }
  }
  return out
}

/** The Paeth predictor (§9.4) — pick whichever neighbour the gradient favours. */
function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = p > a ? p - a : a - p
  const pb = p > b ? p - b : b - p
  const pc = p > c ? p - c : c - p
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

// ── encode ────────────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** Colour type for a raster's channel count — the inverse of the decode table. */
const COLOR_TYPE: Record<number, number> = { 1: 0, 2: 4, 3: 2, 4: 6 }

/**
 * Encode a raster to PNG bytes.
 *
 * A 1-channel raster is written as a TRUE GREYSCALE PNG (colour type 0), where
 * `sharp` wrote a 3-channel RGB one — it converts to sRGB on the way in, so the
 * heatmaps `1c diff` emits were being stored at three times the size they need.
 * Nothing downstream can tell the difference, because {@link decodePng}
 * reproduces sharp's expansion and hands back (g,g,g) either way, which is
 * exactly why REQ-156 AC2 pins *decoded pixels* rather than file bytes: DEFLATE
 * output is not canonical and a byte-for-byte file comparison would be pinning
 * the compressor, not the image.
 */
export async function encodePng(src: Raster): Promise<Uint8Array> {
  const colorType = COLOR_TYPE[src.channels]
  if (colorType === undefined) {
    throw new PngFeatureError(`encodePng: ${src.channels}-channel raster; PNG holds 1, 2, 3 or 4 samples per pixel.`)
  }
  const needed = src.width * src.height * src.channels
  if (src.data.length < needed) {
    throw new PngFeatureError(
      `encodePng: ${src.width}×${src.height}×${src.channels} needs ${needed} bytes, got ${src.data.length}.`,
    )
  }

  const ihdr = new Uint8Array(13)
  writeU32(ihdr, 0, src.width)
  writeU32(ihdr, 4, src.height)
  ihdr[8] = 8
  ihdr[9] = colorType
  // 0/0/0 — DEFLATE, adaptive filtering, no interlace. The only values the spec
  // defines, so they are constants rather than options.
  const idat = await deflate(filterRows(src))

  const chunks = [
    Uint8Array.from(SIGNATURE),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', new Uint8Array(0)),
  ]
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.length
  }
  return out
}

function writeU32(target: Uint8Array, off: number, v: number): void {
  target[off] = (v >>> 24) & 0xff
  target[off + 1] = (v >>> 16) & 0xff
  target[off + 2] = (v >>> 8) & 0xff
  target[off + 3] = v & 0xff
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  writeU32(out, 0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  writeU32(out, 8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

/**
 * Filter every scanline, choosing per row by the standard minimum-sum-of-
 * absolute-differences heuristic (PNG spec §12.8): score each candidate by
 * summing its output bytes read as SIGNED, and keep the smallest, on the
 * reasoning that the row DEFLATE compresses best is the one closest to zero.
 *
 * Filtering none of them would be a third of the work and several times the
 * file — a full-page screenshot's heatmap is megabytes — so the five trial
 * passes are the cheaper side of the trade.
 */
function filterRows(src: Raster): Uint8Array {
  const bpp = src.channels
  const rowBytes = src.width * bpp
  const out = new Uint8Array(src.height * (rowBytes + 1))
  const candidate = new Uint8Array(rowBytes)
  const best = new Uint8Array(rowBytes)

  for (let y = 0; y < src.height; y++) {
    const cur = y * rowBytes
    const prev = cur - rowBytes
    let bestScore = Infinity
    let bestFilter = 0

    for (let f = 0; f <= 4; f++) {
      let score = 0
      for (let i = 0; i < rowBytes; i++) {
        const x = src.data[cur + i]
        const a = i >= bpp ? src.data[cur + i - bpp] : 0
        const b = y > 0 ? src.data[prev + i] : 0
        const c = y > 0 && i >= bpp ? src.data[prev + i - bpp] : 0
        const v =
          f === 0 ? x : f === 1 ? x - a : f === 2 ? x - b : f === 3 ? x - ((a + b) >> 1) : x - paeth(a, b, c)
        const byte = v & 0xff
        candidate[i] = byte
        score += byte < 128 ? byte : 256 - byte
      }
      if (score < bestScore) {
        bestScore = score
        bestFilter = f
        best.set(candidate)
      }
    }

    out[y * (rowBytes + 1)] = bestFilter
    out.set(best, y * (rowBytes + 1) + 1)
  }
  return out
}
