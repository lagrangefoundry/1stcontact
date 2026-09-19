import { afterAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { deflateSync, inflateSync } from 'node:zlib'
import path from 'node:path'
import {
  alignedAreas,
  cmdCrop,
  cmdDiff,
  computeDiff,
  decodeImage,
  decodePng,
  encodePng,
  extractRect,
  normText,
  pickAnchors,
  pngDimensions,
  PngCorruptError,
  PngFeatureError,
  sniffImageFormat,
  UnsupportedImageError,
  writeRasterPng,
  type AlignedBox,
  type AnchorEl,
  type Raster,
} from '../tools/generate/src/cli'
import { computeDiff as coreComputeDiff } from '../tools/generate/src/cli/perceptual-core'
import { PNG_CORPUS, corpusBytes } from './fixtures/png/corpus'

/**
 * UATs for **the image layer as part of the toolchain** (story-046cfc56).
 *
 * The pixel half of the fidelity path used to bottom out in a native imaging
 * module, which cannot load in the deployed serverless runtime under any
 * compatibility flag. The codec now lives in this repo, and the load-bearing
 * promise of that move is that the verdicts do not move with it: `1c diff` feeds
 * ranked regions and band statistics to `1c gate`, so a codec that shifted the
 * pixels by one would make every fidelity number recorded before the change
 * incomparable with every number after — silently, because the new numbers look
 * exactly as plausible as the old.
 *
 * `tests/fixtures/png/sharp-baseline.json` is what makes that checkable. It was
 * recorded while the native decoder was still installed and holds the sha256 of
 * the raw pixel buffer it decoded each fixture to. It is EVIDENCE, not a fixture:
 * regenerating it to make an assertion pass would delete the only record of the
 * behaviour these UATs exist to pin.
 *
 * The serverless-runtime half of the story lives in the sibling
 * `*.workers.test.ts`, which runs inside workerd against real bindings.
 */

const FIXTURES = path.join(__dirname, 'fixtures/png')
const TOOL_ROOT = path.join(__dirname, '../tools/generate')

interface BaselineCase {
  why: string
  width: number
  height: number
  channels: number
  bytes: number
  sha256: string
}
const baseline = JSON.parse(readFileSync(path.join(FIXTURES, 'sharp-baseline.json'), 'utf8')) as {
  note: string
  cases: Record<string, BaselineCase>
}

const sha256 = (b: Uint8Array): string => createHash('sha256').update(b).digest('hex')
const fixtureBytes = (name: string): Uint8Array => new Uint8Array(readFileSync(path.join(FIXTURES, name)))

const tmpDirs: string[] = []
function freshDir(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'png-codec-'))
  tmpDirs.push(d)
  return d
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

// ── decoder-independent PNG inspection ────────────────────────────────────────
//
// Everything below reads the container by hand, so a fixture's claim about its
// own shape is CHECKED rather than trusted, and checked without the decoder that
// is on trial.

interface RawChunk {
  type: string
  data: Uint8Array
}

function chunksOf(bytes: Uint8Array): RawChunk[] {
  const out: RawChunk[] = []
  let off = 8
  while (off + 8 <= bytes.length) {
    const len = ((bytes[off] << 24) | (bytes[off + 1] << 16) | (bytes[off + 2] << 8) | bytes[off + 3]) >>> 0
    const type = String.fromCharCode(...Array.from(bytes.subarray(off + 4, off + 8)))
    out.push({ type, data: bytes.subarray(off + 8, off + 8 + len) })
    if (type === 'IEND') break
    off += 8 + len + 4
  }
  return out
}

/** IHDR fields, read straight out of the first 33 bytes. */
function ihdrOf(bytes: Uint8Array): { width: number; height: number; bitDepth: number; colorType: number } {
  const u32 = (o: number) => ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0
  return { width: u32(16), height: u32(20), bitDepth: bytes[24], colorType: bytes[25] }
}

/** Inflate the concatenated IDAT stream with node's own zlib, not the codec's. */
function inflateIdat(bytes: Uint8Array): Uint8Array {
  const parts = chunksOf(bytes).filter((c) => c.type === 'IDAT')
  const total = parts.reduce((n, c) => n + c.data.length, 0)
  const joined = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    joined.set(p.data, off)
    off += p.data.length
  }
  return new Uint8Array(inflateSync(Buffer.from(joined)))
}

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

function writeU32(target: Uint8Array, off: number, v: number): void {
  target[off] = (v >>> 24) & 0xff
  target[off + 1] = (v >>> 16) & 0xff
  target[off + 2] = (v >>> 8) & 0xff
  target[off + 3] = v & 0xff
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  writeU32(out, 0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  writeU32(out, 8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

const SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/**
 * Assemble a PNG by hand. `rawScanlines` is the already-filtered image data
 * (filter byte per row); omitting it produces a file with no IDAT at all, which
 * is one of the malformed cases no encoder will produce on request.
 */
function handBuiltPng(width: number, height: number, rawScanlines?: Uint8Array): Uint8Array {
  const ihdr = new Uint8Array(13)
  writeU32(ihdr, 0, width)
  writeU32(ihdr, 4, height)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolour
  const parts: Uint8Array[] = [SIGNATURE, makeChunk('IHDR', ihdr)]
  if (rawScanlines) parts.push(makeChunk('IDAT', new Uint8Array(deflateSync(Buffer.from(rawScanlines)))))
  parts.push(makeChunk('IEND', new Uint8Array(0)))
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

/** Fabricate the leading bytes of a format, which is all a sniffer reads. */
function magic(bytes: number[], pad = 32): Uint8Array {
  const out = new Uint8Array(Math.max(pad, bytes.length))
  out.set(bytes)
  return out
}
const ascii = (s: string): number[] => [...s].map((c) => c.charCodeAt(0))

/** The formats an operator can plausibly arrive with, by their own magic bytes. */
const NON_PNG_FORMATS: Array<[string, Uint8Array]> = [
  ['JPEG', magic([0xff, 0xd8, 0xff, 0xe0])],
  ['GIF', magic(ascii('GIF89a'))],
  ['WebP', magic([...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP')])],
  ['HEIC/HEIF', magic([0, 0, 0, 0x18, ...ascii('ftyp'), ...ascii('heic')])],
  ['AVIF', magic([0, 0, 0, 0x18, ...ascii('ftyp'), ...ascii('avif')])],
  ['BMP', magic(ascii('BM'))],
  ['TIFF', magic([0x49, 0x49, 0x2a, 0x00])],
  ['SVG', magic(ascii('<svg xmlns="http://www.w3.org/2000/svg"/>'), 64)],
]

type Fill = (x: number, y: number) => [number, number, number]

/** Build an in-memory RGB raster from a per-pixel fill — the REQ-38 helper. */
function raster(w: number, h: number, fill: Fill): Raster {
  const data = new Uint8Array(w * h * 3)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fill(x, y)
      const i = (y * w + x) * 3
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }
  }
  return { data, width: w, height: h, channels: 3 }
}
const BLACK: Fill = () => [0, 0, 0]

function* walkTs(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walkTs(full)
    else if (entry.name.endsWith('.ts')) yield full
  }
}

// ── AC-1776 ───────────────────────────────────────────────────────────────────

describe('AC-1776 — decoded pixels are byte-identical to the recorded witness', () => {
  it('test_UAT_AC1776_corpus_decodes_to_the_recorded_witness_in_both_runtimes', async () => {
    const names = Object.keys(baseline.cases)
    expect(names.length).toBeGreaterThan(8) // the corpus is not silently empty

    for (const name of names) {
      const want = baseline.cases[name]
      const got = await decodePng(fixtureBytes(name), name)
      expect({ name, w: got.width, h: got.height, ch: got.channels, bytes: got.data.length }).toEqual({
        name,
        w: want.width,
        h: want.height,
        ch: want.channels,
        bytes: want.bytes,
      })
      // Exact equality, deliberately not a tolerance band: a band would hide
      // precisely the drift it exists to catch.
      expect(`${name}:${sha256(got.data)}`).toBe(`${name}:${want.sha256}`)
    }

    // The other runtime asserts the SAME SET OF DIGESTS, in the sibling
    // `*.workers.test.ts` — `test_UAT_AC1776_..._in_the_deployed_runtime`, which
    // decodes this corpus inside workerd off the platform's own decompression
    // primitive. workerd has no filesystem, so it reads the corpus from
    // `fixtures/png/corpus.ts` instead; what follows pins that module to be the
    // same bytes and the same recorded numbers as the files on disk, so
    // "byte-identical in both runtimes" is one witness checked twice, not two
    // witnesses that could drift apart.
    expect(Object.keys(PNG_CORPUS).sort()).toEqual(names.sort())
    for (const name of names) {
      const want = baseline.cases[name]
      const shipped = PNG_CORPUS[name]
      expect({ name, ...shipped, base64: undefined, why: undefined }).toEqual({
        name,
        width: want.width,
        height: want.height,
        channels: want.channels,
        bytes: want.bytes,
        sha256: want.sha256,
        base64: undefined,
        why: undefined,
      })
      expect(sha256(corpusBytes(name))).toBe(sha256(fixtureBytes(name)))
    }
  })
})

// ── AC-1777 ───────────────────────────────────────────────────────────────────

describe('AC-1777 — greyscale and indexed arrive expanded to sRGB', () => {
  it('test_UAT_AC1777_greyscale_and_indexed_expand_exactly_as_before', async () => {
    // A compatibility contract rather than a preference: `computeDiff` strides
    // its reads by `Raster.channels`, so a decoder honestly returning the
    // source's own count would read across pixel boundaries and move every
    // number the gate depends on.
    const grey = await decodePng(fixtureBytes('gray8.png'), 'gray8.png')
    expect(grey.channels).toBe(3)
    for (let p = 0; p < grey.width * grey.height; p++) {
      const [r, g, b] = [grey.data[p * 3], grey.data[p * 3 + 1], grey.data[p * 3 + 2]]
      expect(`${p}:${r},${g},${b}`).toBe(`${p}:${r},${r},${r}`)
    }

    const greyAlpha = await decodePng(fixtureBytes('gray-alpha.png'), 'gray-alpha.png')
    expect(greyAlpha.channels).toBe(4)

    // The transparency table ALONE is what promotes an indexed image to four
    // channels — the same palette without it must stay at three.
    const opaque = await decodePng(fixtureBytes('palette8.png'), 'palette8.png')
    const transparent = await decodePng(fixtureBytes('palette8-trns.png'), 'palette8-trns.png')
    expect([opaque.channels, transparent.channels]).toEqual([3, 4])

    // The matched pair really does differ only in the presence of tRNS.
    expect(chunksOf(fixtureBytes('palette8.png')).some((c) => c.type === 'tRNS')).toBe(false)
    expect(chunksOf(fixtureBytes('palette8-trns.png')).some((c) => c.type === 'tRNS')).toBe(true)

    // Sub-byte scaling to 0..255 and the past-the-end-of-tRNS opacity rule are
    // carried by the recorded-witness digests for gray1/gray4/palette4, which
    // AC-1776 pins; what they need here is only that they decode at the expanded
    // channel count rather than the source's one.
    for (const name of ['gray1.png', 'gray4.png', 'palette4.png']) {
      const got = await decodePng(fixtureBytes(name), name)
      expect(`${name}:${got.channels}`).toBe(`${name}:3`)
    }
  })
})

// ── AC-1778 ───────────────────────────────────────────────────────────────────

describe('AC-1778 — the corpus exercises every decode path that could differ', () => {
  it('test_UAT_AC1778_corpus_covers_each_decode_path_and_decodes_to_its_pixels', async () => {
    // (1) All five row filters, cycled down the rows of one image — read out of
    // the inflated scanlines with node's own zlib, so this is checked
    // independently of the decoder on trial.
    const allFilters = fixtureBytes('rgba-all-filters.png')
    const { width, height, colorType } = ihdrOf(allFilters)
    expect({ width, height, colorType }).toEqual({ width: 64, height: 48, colorType: 6 })
    const rowBytes = width * 4
    const rawScanlines = inflateIdat(allFilters)
    expect(rawScanlines.length).toBe(height * (rowBytes + 1))
    const filtersUsed = new Set<number>()
    for (let y = 0; y < height; y++) filtersUsed.add(rawScanlines[y * (rowBytes + 1)])
    expect([...filtersUsed].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4])

    // (2) Image data split across several chunks of a SINGLE compressed stream.
    const idatChunks = chunksOf(fixtureBytes('multi-idat.png')).filter((c) => c.type === 'IDAT')
    expect(idatChunks.length).toBeGreaterThan(1)
    expect(idatChunks.length).toBe(7)

    // (3) A row stride that is not a whole multiple of the pixel size' natural
    // word — 33×17 RGB gives a 99-byte stride and an odd width.
    const odd = ihdrOf(fixtureBytes('rgb-odd-dims.png'))
    expect({ w: odd.width, h: odd.height, ct: odd.colorType }).toEqual({ w: 33, h: 17, ct: 2 })
    expect((odd.width * 3) % 4).not.toBe(0)

    // (4) Sub-byte greyscale depths and (5) sub-byte indexed depths.
    expect(Object.fromEntries(
      ['gray1.png', 'gray4.png', 'palette4.png'].map((n) => {
        const h = ihdrOf(fixtureBytes(n))
        return [n, `${h.bitDepth}/${h.colorType}`]
      }),
    )).toEqual({ 'gray1.png': '1/0', 'gray4.png': '4/0', 'palette4.png': '4/3' })

    // (6) A palette with and a palette without a transparency table.
    const paletteEntries = ['palette8.png', 'palette8-trns.png'].map((n) => {
      const cs = chunksOf(fixtureBytes(n))
      return [ihdrOf(fixtureBytes(n)).colorType, cs.some((c) => c.type === 'PLTE'), cs.some((c) => c.type === 'tRNS')]
    })
    expect(paletteEntries).toEqual([
      [3, true, false],
      [3, true, true],
    ])

    // (7) A full-page-shaped screenshot, tall enough to stand in for real input.
    const tall = ihdrOf(fixtureBytes('tall-screenshot.png'))
    expect({ w: tall.width, h: tall.height }).toEqual({ w: 320, h: 1200 })
    expect(tall.height / tall.width).toBeGreaterThan(3)

    // Every entry decodes successfully, and to its recorded pixels.
    for (const name of Object.keys(baseline.cases)) {
      const got = await decodePng(fixtureBytes(name), name)
      expect(`${name}:${sha256(got.data)}`).toBe(`${name}:${baseline.cases[name].sha256}`)
    }
  })
})

// ── AC-1779 ───────────────────────────────────────────────────────────────────

describe('AC-1779 — an unreadable image is refused by name, in three distinct classes', () => {
  it('test_UAT_AC1779_unsupported_malformed_and_not_an_image_stay_distinct', async () => {
    const good = fixtureBytes('rgba-all-filters.png')
    const caught = async (bytes: Uint8Array): Promise<Error> => {
      try {
        await decodePng(bytes, 'subject')
        throw new Error('decodePng resolved where it should have refused')
      } catch (e) {
        return e as Error
      }
    }

    // ── class 1: an understood but unsupported feature, named, with the remedy.
    const interlaced = good.slice()
    interlaced[28] = 1 // IHDR interlace method
    const interlaceErr = await caught(interlaced)
    expect(interlaceErr).toBeInstanceOf(PngFeatureError)
    expect(interlaceErr.message).toMatch(/interlac/i)
    expect(interlaceErr.message).toMatch(/re-save/i)

    const sixteenBit = good.slice()
    sixteenBit[24] = 16 // IHDR bit depth
    const depthErr = await caught(sixteenBit)
    expect(depthErr).toBeInstanceOf(PngFeatureError)
    expect(depthErr.message).toMatch(/16-bit/)
    expect(depthErr.message).toMatch(/re-save/i)

    // ── class 2: malformed, which is a different class from unsupported.
    const truncatedMidChunk = good.slice(0, good.length - 20) // ends before a chunk it declares
    const noIend = good.slice(0, good.length - 12) // IEND is exactly 12 bytes
    const zeroDim = good.slice()
    writeU32(zeroDim, 16, 0) // IHDR width
    const badColorType = good.slice()
    badColorType[25] = 7 // no such PNG colour type
    const notIhdrFirst = good.slice()
    notIhdrFirst[15] = 'X'.charCodeAt(0) // 'IHDR' → 'IHDX'
    const noIdat = handBuiltPng(4, 4) // hand-built: no encoder will omit IDAT on request
    const badFilter = handBuiltPng(
      4,
      4,
      // Four rows of 4 RGB pixels, each declaring row filter 9 — a filter type
      // that does not exist. Hand-built for the same reason: an encoder will
      // only ever emit 0–4.
      Uint8Array.from(Array.from({ length: 4 }, () => [9, ...new Array(12).fill(0x40)]).flat()),
    )

    for (const [label, bytes] of [
      ['truncated mid-chunk', truncatedMidChunk],
      ['no IEND', noIend],
      ['zero dimension', zeroDim],
      ['impossible colour type', badColorType],
      ['first chunk is not IHDR', notIhdrFirst],
      ['no IDAT', noIdat],
      ['impossible row filter', badFilter],
    ] as Array<[string, Uint8Array]>) {
      const err = await caught(bytes)
      expect(`${label}:${err.constructor.name}`).toBe(`${label}:${PngCorruptError.name}`)
      expect(err).toBeInstanceOf(PngCorruptError)
    }

    // ── class 3: not a PNG at all — named from the file's OWN leading bytes,
    // never its extension, which is exactly what is wrong in the case worth
    // catching, and offered the remedy.
    for (const [format, bytes] of NON_PNG_FORMATS) {
      expect(sniffImageFormat(bytes)).toBe(format)
      const err = (await caught(bytes)) as UnsupportedImageError
      expect(`${format}:${err.constructor.name}`).toBe(`${format}:${UnsupportedImageError.name}`)
      expect(err.format).toBe(format)
      expect(err.message).toContain(format.split('/')[0])
      expect(err.message).toMatch(/convert/i)
    }

    // Bytes matching nothing are refused as UNRECOGNISED — distinctly, rather
    // than as a corrupt PNG.
    const nothing = magic([0x00, 0x01, 0x02, 0x03])
    expect(sniffImageFormat(nothing)).toBe('unrecognised')
    const unknownErr = (await caught(nothing)) as UnsupportedImageError
    expect(unknownErr).toBeInstanceOf(UnsupportedImageError)
    expect(unknownErr.format).toBe('unrecognised')
    expect(unknownErr.message).toMatch(/recognises|unrecognised/i)

    // ── the encode side refuses in the same spirit, rather than writing a file
    // that fails much later in someone else's verb.
    await expect(
      encodePng({ data: new Uint8Array(5 * 4 * 4), width: 4, height: 4, channels: 5 }),
    ).rejects.toThrow(PngFeatureError)
    await expect(
      encodePng({ data: new Uint8Array(10), width: 40, height: 24, channels: 4 }),
    ).rejects.toThrow(PngFeatureError)

    // ── and the three classes are distinguishable by a CALLER, not only by the
    // text of their messages: none is an instance of either of the others.
    const unsupported = await caught(interlaced)
    const malformed = await caught(noIend)
    const notAnImage = await caught(NON_PNG_FORMATS[0][1])
    expect(unsupported).not.toBeInstanceOf(PngCorruptError)
    expect(unsupported).not.toBeInstanceOf(UnsupportedImageError)
    expect(malformed).not.toBeInstanceOf(PngFeatureError)
    expect(malformed).not.toBeInstanceOf(UnsupportedImageError)
    expect(notAnImage).not.toBeInstanceOf(PngFeatureError)
    expect(notAnImage).not.toBeInstanceOf(PngCorruptError)
  })
})

// ── AC-1780 ───────────────────────────────────────────────────────────────────

describe('AC-1780 — a re-encoded raster decodes back to identical pixels', () => {
  it('test_UAT_AC1780_round_trip_is_lossless_at_every_channel_count', async () => {
    for (const channels of [1, 2, 3, 4]) {
      const width = 29
      const height = 13
      const data = new Uint8Array(width * height * channels)
      for (let i = 0; i < data.length; i++) data[i] = (i * 37 + channels * 11) & 0xff
      const back = await decodePng(await encodePng({ data, width, height, channels }), `roundtrip-${channels}`)

      // The expansion contract applies on the way back: 1ch returns as 3 and 2ch
      // as 4, with the samples themselves unchanged.
      expect({ channels, w: back.width, h: back.height, ch: back.channels }).toEqual({
        channels,
        w: width,
        h: height,
        ch: channels === 1 ? 3 : channels === 2 ? 4 : channels,
      })
      for (let p = 0; p < width * height; p++) {
        if (channels === 1) {
          const g = data[p]
          expect([back.data[p * 3], back.data[p * 3 + 1], back.data[p * 3 + 2]]).toEqual([g, g, g])
        } else if (channels === 2) {
          const g = data[p * 2]
          expect([back.data[p * 4], back.data[p * 4 + 1], back.data[p * 4 + 2], back.data[p * 4 + 3]]).toEqual([
            g,
            g,
            g,
            data[p * 2 + 1],
          ])
        } else {
          for (let c = 0; c < channels; c++) {
            expect(`${p}.${c}:${back.data[p * channels + c]}`).toBe(`${p}.${c}:${data[p * channels + c]}`)
          }
        }
      }
    }

    // Every corpus entry, decoded → re-encoded → decoded, yields a pixel buffer
    // whose digest equals the first decode's. What is pinned is the PIXELS: the
    // compressed form is not canonical, so comparing encoded bytes would pin the
    // compressor rather than the image.
    for (const name of Object.keys(baseline.cases)) {
      const once = await decodePng(fixtureBytes(name), name)
      const twice = await decodePng(await encodePng(once), name)
      expect(`${name}:${sha256(twice.data)}`).toBe(`${name}:${sha256(once.data)}`)
    }
  })
})

// ── AC-1781 ───────────────────────────────────────────────────────────────────

describe('AC-1781 — a single-channel heatmap is stored as a true greyscale image', () => {
  it('test_UAT_AC1781_one_channel_rasters_are_written_greyscale_and_smaller', async () => {
    const dir = freshDir()
    const width = 64
    const height = 64

    // A VARIED pattern on purpose: a flat one would compress to nothing and the
    // size comparison would prove nothing.
    const grey = new Uint8Array(width * height)
    for (let i = 0; i < grey.length; i++) grey[i] = i & 0xff
    const greyFile = await writeRasterPng({ data: grey, width, height, channels: 1 }, path.join(dir, 'heat.png'))
    expect(ihdrOf(new Uint8Array(readFileSync(greyFile))).colorType).toBe(0) // 0 is greyscale

    // The SAME picture as three channels, so the only variable is the channel
    // count. Previously the native decoder converted to sRGB on the way IN, so
    // these heatmaps were stored at roughly three times the size they need.
    const rgb = new Uint8Array(width * height * 3)
    for (let p = 0; p < width * height; p++) rgb[p * 3] = rgb[p * 3 + 1] = rgb[p * 3 + 2] = grey[p]
    const rgbFile = await writeRasterPng({ data: rgb, width, height, channels: 3 }, path.join(dir, 'rgb.png'))
    expect(ihdrOf(new Uint8Array(readFileSync(rgbFile))).colorType).toBe(2)
    expect(statSync(greyFile).size).toBeLessThan(statSync(rgbFile).size)

    // Both decode to the same pixels, which is what makes the saving free — the
    // expansion contract hands back equal samples either way, so nothing
    // downstream can tell the difference.
    expect(sha256((await decodeImage(greyFile)).data)).toBe(sha256((await decodeImage(rgbFile)).data))
  })
})

// ── AC-1782 ───────────────────────────────────────────────────────────────────

describe('AC-1782 — the pixel verbs keep their verdicts, regions and band statistics', () => {
  it('test_UAT_AC1782_diff_and_aligned_crops_report_what_they_reported_before', async () => {
    // These are the values the pre-existing `1c diff` and `1c aligned-crops`
    // acceptance tests assert, on the same inputs, written against the previous
    // image layer and unchanged by this work. They are re-asserted here because
    // they are the load-bearing promise: `1c gate` reconciles these numbers
    // against the value diff and the L1 gate to choose between
    // `capture-incomplete`, `reproduction-wrong` and `unexplained-disagreement`,
    // so a shift of one would make every fidelity result recorded to date
    // incomparable with every result after — silently.

    // The same code, not a copy: the barrel's `computeDiff` IS the core's.
    expect(computeDiff).toBe(coreComputeDiff)

    // Headline metrics: mean difference, horizontal band profile, dimensions.
    const flatRef = raster(64, 64, BLACK)
    const halfLit = raster(64, 64, (_x, y) => (y >= 32 ? [100, 100, 100] : [0, 0, 0]))
    const headline = computeDiff(flatRef, halfLit, { blockPx: 16, bands: 4 })
    expect(headline.meanDiff).toBeCloseTo(50, 5)
    expect(headline.bands.map((b) => Math.round(b))).toEqual([0, 0, 100, 100])
    expect(headline.dims).toEqual({ w: 64, h: 64 })
    expect(headline.pctOverThreshold).toBeCloseTo(50, 5)

    // Regions: the same connected components, with the same bounding boxes.
    const twoPatches = raster(64, 64, (x, y) =>
      (x < 16 && y < 16) || (x >= 48 && y >= 48) ? [200, 200, 200] : [0, 0, 0],
    )
    const regions = computeDiff(flatRef, twoPatches, { blockPx: 16, blockThreshold: 24, padPx: 0 })
    expect(regions.regions).toHaveLength(2)
    expect(regions.regions.map((r) => r.bbox)).toContainEqual({ x: 0, y: 0, w: 16, h: 16 })
    expect(regions.regions.map((r) => r.bbox)).toContainEqual({ x: 48, y: 48, w: 16, h: 16 })

    // ...and the same ranking: large-and-faint (3 blocks × 40 → Σ120) still
    // outranks small-and-intense (1 block × 100 → Σ100).
    const ranked = computeDiff(
      flatRef,
      raster(64, 64, (x, y) => {
        if (x < 48 && y < 16) return [40, 40, 40]
        if (x < 16 && y >= 48) return [100, 100, 100]
        return [0, 0, 0]
      }),
      { blockPx: 16, blockThreshold: 24, padPx: 0 },
    )
    expect(ranked.regions.map((r) => r.score)).toEqual([120, 100])
    expect(ranked.regions[0].bbox).toEqual({ x: 0, y: 0, w: 48, h: 16 })

    // The de-noise property: block-averaging still dilutes a 1px registration
    // shift below threshold.
    const stripes = raster(64, 64, (x) => (((x >> 3) & 1) === 1 ? [200, 200, 200] : [0, 0, 0]))
    const shifted = raster(64, 64, (x) => ((((x + 1) >> 3) & 1) === 1 ? [200, 200, 200] : [0, 0, 0]))
    const denoise = computeDiff(shifted, stripes, { blockPx: 16, pixelThreshold: 32, bands: 1 })
    expect(denoise.pctOverThreshold).toBeGreaterThan(0)
    expect(denoise.blockPctOverThreshold).toBe(0)

    // End to end through `1c diff`, over real PNG files this codec both wrote
    // and read back: the same report shape, the same crop triptychs on disk.
    const dir = freshDir()
    const refPng = await writeRasterPng(flatRef, path.join(dir, 'ref.png'))
    const actualPng = await writeRasterPng(
      raster(64, 64, (x, y) => (x < 16 && y < 16 ? [200, 200, 200] : [0, 0, 0])),
      path.join(dir, 'actual.png'),
    )
    const outDir = path.join(dir, 'out')
    const report = await cmdDiff({
      ref: refPng,
      actualImagePath: actualPng,
      out: outDir,
      tuning: { blockPx: 16, blockThreshold: 24, padPx: 0 },
    })
    expect(existsSync(path.join(outDir, 'regions.json'))).toBe(true)
    expect(existsSync(path.join(outDir, 'diff.png'))).toBe(true)
    expect(existsSync(path.join(outDir, 'diff-blocks.png'))).toBe(true)
    expect(report.regions.length).toBeGreaterThanOrEqual(1)
    expect(report.regions[0].bbox).toEqual({ x: 0, y: 0, w: 16, h: 16 })
    for (const crop of [report.regions[0].crops.ref, report.regions[0].crops.actual, report.regions[0].crops.diff]) {
      expect(existsSync(crop)).toBe(true)
    }

    // `1c aligned-crops` likewise: the same drift-aligned crop pairs, each side
    // windowed against its OWN top.
    const box = (x: number, y: number, w: number, h: number): AlignedBox => ({ x, y, width: w, height: h })
    const el = (text: string, role: string, y: number): AnchorEl => ({ text, role, box: box(0, y, 400, 40) })
    const anchors = pickAnchors([
      el('Intentional Software', 'body', 318),
      el('Our Mission', 'heading', 1384),
      el("What We're Building", 'heading', 1978),
    ])
    expect(anchors.map((a) => a.text)).toEqual(['Our Mission', "What We're Building"])
    const ours = new Map<string, AlignedBox>([
      [normText('Our Mission'), box(0, 1338, 400, 40)], // -46 drift
      [normText("What We're Building"), box(0, 1923, 400, 40)], // -55 drift
    ])
    const areas = alignedAreas(anchors, ours, { viewportWidth: 1280, pad: 40 })
    expect(areas).toHaveLength(2)
    expect({ refTop: areas[0].refTop, oursTop: areas[0].oursTop, drift: areas[0].drift, width: areas[0].width }).toEqual(
      { refTop: 1344, oursTop: 1298, drift: -46, width: 1280 },
    )
    expect(areas[1].drift).toBe(-55)
  })
})

// ── AC-1783 ───────────────────────────────────────────────────────────────────

describe('AC-1783 — 1c crop accepts PNG only, naming the format it was handed', () => {
  it('test_UAT_AC1783_crop_refuses_a_non_png_by_the_name_its_bytes_give', async () => {
    const dir = freshDir()

    // The case worth catching: NAMED `.png`, and not one. The refusal has to
    // name JPEG, not fail on a PNG header it was never given.
    const liar = path.join(dir, 'photo.png')
    writeFileSync(liar, Buffer.from(magic([0xff, 0xd8, 0xff, 0xe0])))
    const crop = () => cmdCrop({ input: liar, box: { x: 0, y: 0, w: 4, h: 4 } })
    await expect(crop()).rejects.toThrow(UnsupportedImageError)
    await expect(crop()).rejects.toThrow(/JPEG/)
    await expect(crop()).rejects.toThrow(/PNG only/)
    await expect(crop()).rejects.toThrow(/convert/i)

    // ...and every other named format, at the decode boundary the verb uses.
    for (const [format, bytes] of NON_PNG_FORMATS) {
      const file = path.join(dir, `${format.replace('/', '-')}.png`)
      writeFileSync(file, Buffer.from(bytes))
      await expect(cmdCrop({ input: file, box: { x: 0, y: 0, w: 4, h: 4 } })).rejects.toThrow(
        new RegExp(`${format.split('/')[0]}`),
      )
      await expect(cmdCrop({ input: file, box: { x: 0, y: 0, w: 4, h: 4 } })).rejects.toThrow(/PNG only/)
    }

    // A real PNG is cropped, so the narrowing is to PNG and not to nothing.
    const real = await writeRasterPng(raster(16, 16, (x, y) => [x * 8, y * 8, 0]), path.join(dir, 'real.png'))
    const { outFile } = await cmdCrop({ input: real, box: { x: 0, y: 0, w: 4, h: 4 } })
    expect(existsSync(outFile)).toBe(true)
  })
})

// ── AC-1784 ───────────────────────────────────────────────────────────────────

describe('AC-1784 — 1c crop clamps an over-reaching box and writes that window', () => {
  it('test_UAT_AC1784_an_over_reaching_box_is_clamped_not_failed', async () => {
    const dir = freshDir()
    const width = 40
    const height = 24
    const data = new Uint8Array(width * height * 4)
    for (let p = 0; p < width * height; p++) {
      data[p * 4] = p & 0xff
      data[p * 4 + 1] = (p * 3) & 0xff
      data[p * 4 + 2] = (p * 7) & 0xff
      data[p * 4 + 3] = 255
    }
    const srcFile = await writeRasterPng({ data, width, height, channels: 4 }, path.join(dir, 'src.png'))

    // Over-reaching BOTH axes: a region bbox on the bottom band of a tall page
    // routinely does, and failing a run over an edge the operator did not choose
    // would be the wrong outcome. The reported box is the clamped one...
    const over = await cmdCrop({ input: srcFile, box: { x: 32, y: 18, w: 50, h: 50 }, out: path.join(dir, 'over.png') })
    expect(over.box).toEqual({ x: 32, y: 18, w: 8, h: 6 })
    const overRaster = await decodeImage(over.outFile)
    expect({ w: overRaster.width, h: overRaster.height }).toEqual({ w: 8, h: 6 })

    // ...and a box wholly inside the image is returned unchanged.
    const inside = await cmdCrop({ input: srcFile, box: { x: 5, y: 6, w: 9, h: 7 }, out: path.join(dir, 'in.png') })
    expect(inside.box).toEqual({ x: 5, y: 6, w: 9, h: 7 })

    // In both cases the output's pixels are exactly the source's pixels at the
    // requested offset — the first pixel of the crop is the source pixel at the
    // box's top-left corner.
    const insideRaster = await decodeImage(inside.outFile)
    expect({ w: insideRaster.width, h: insideRaster.height }).toEqual({ w: 9, h: 7 })
    for (const [crop, box] of [
      [overRaster, over.box],
      [insideRaster, inside.box],
    ] as Array<[Raster, { x: number; y: number; w: number; h: number }]>) {
      for (let y = 0; y < box.h; y++) {
        for (let x = 0; x < box.w; x++) {
          const s = ((y + box.y) * width + (x + box.x)) * 4
          const d = (y * box.w + x) * 4
          expect(`${x},${y}:${[...crop.data.slice(d, d + 4)]}`).toBe(`${x},${y}:${[...data.slice(s, s + 4)]}`)
        }
      }
    }

    // The same arithmetic, exercised directly on a decoded buffer.
    const src: Raster = { data, width, height, channels: 4 }
    expect(extractRect(src, { x: 32, y: 18, w: 50, h: 50 }).box).toEqual({ x: 32, y: 18, w: 8, h: 6 })
  })
})

// ── AC-1785 ───────────────────────────────────────────────────────────────────

describe('AC-1785 — dimensions are readable from the opening bytes alone', () => {
  it('test_UAT_AC1785_dimensions_come_from_the_header_without_decoding', () => {
    const bytes = fixtureBytes('tall-screenshot.png')
    expect(pngDimensions(bytes)).toEqual({ width: 320, height: 1200 })

    // Constant work whatever the image weighs: a file truncated to its first 33
    // bytes — the IHDR and nothing else — still answers, identically. This is
    // what lets the crop verbs clamp a box before deciding they need pixels.
    expect(pngDimensions(bytes.slice(0, 33))).toEqual({ width: 320, height: 1200 })
    expect(pngDimensions(bytes.slice(0, 33))).toEqual(pngDimensions(bytes))

    // A shorter prefix is refused as malformed rather than answered with a guess.
    expect(() => pngDimensions(bytes.slice(0, 32), 'short')).toThrow(PngCorruptError)
    expect(() => pngDimensions(bytes.slice(0, 32), 'short')).toThrow(/too short/i)

    // ...as is a file whose first chunk is not the header.
    const notIhdr = bytes.slice(0, 64)
    notIhdr[15] = 'X'.charCodeAt(0)
    expect(() => pngDimensions(notIhdr, 'mislabelled')).toThrow(PngCorruptError)
    expect(() => pngDimensions(notIhdr, 'mislabelled')).toThrow(/IHDR/)
  })
})

// ── AC-1788 ───────────────────────────────────────────────────────────────────

describe('AC-1788 — decode cost is measured, reported and held under a ceiling', () => {
  it('test_UAT_AC1788_full_page_decode_cost_is_reported_and_under_the_ceiling', async () => {
    const bytes = fixtureBytes('tall-screenshot.png')
    const { width, height } = pngDimensions(bytes)
    const megapixels = (width * height) / 1e6

    const runs: number[] = []
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now()
      await decodePng(bytes, 'tall-screenshot.png')
      runs.push(performance.now() - t0)
    }
    const best = Math.min(...runs)
    const perMegapixel = best / megapixels
    // A real full-page desktop screenshot is ~1280×4744 ≈ 6.1 MP.
    const fullPageProjection = perMegapixel * 6.1

    // Reported in output an operator can read, because the decision to own the
    // codec is reversible and this measurement is what would reopen it.
    // eslint-disable-next-line no-console
    console.log(
      `[AC-1788] decoded ${megapixels} MP in ${best.toFixed(1)}ms ` +
        `(${perMegapixel.toFixed(1)} ms/MP → ~${fullPageProjection.toFixed(0)}ms for a 1280×4744 full page)`,
    )
    expect(Number.isFinite(best)).toBe(true)
    expect(best).toBeGreaterThan(0)

    // The ceiling is loose on purpose — a smoke bound against a busy machine,
    // not a benchmark — but it exists, so a regression that doubled the cost is
    // caught rather than merely recorded.
    expect(fullPageProjection).toBeLessThan(2000)
  })
})

// ── AC-1789 ───────────────────────────────────────────────────────────────────

describe('AC-1789 — the toolchain declares and loads no native imaging module', () => {
  it('test_UAT_AC1789_no_native_imaging_module_is_declared_imported_or_needed', async () => {
    const NATIVE_IMAGING = [
      'sharp',
      'canvas',
      'node-canvas',
      '@napi-rs/canvas',
      'skia-canvas',
      'jimp',
      'pngjs',
      'gm',
      'image-size',
      '@squoosh/lib',
    ]

    // (1) Neither dependency set names an imaging library.
    const pkg = JSON.parse(readFileSync(path.join(TOOL_ROOT, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const declared = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]
    expect(declared.filter((d) => NATIVE_IMAGING.includes(d))).toEqual([])

    // (2) No module under the tool's source imports one — eagerly or through a
    // deferred load, so there is nothing left to be missing at run time and
    // nothing to defer against.
    //
    // Comments are stripped before matching, and the files are read as latin1
    // because two modules in this tree carry NUL bytes and would otherwise be
    // read as binary and hide. Several modules still EXPLAIN what the native
    // module used to do and why the lazy `import()` existed; that history is
    // worth keeping, and a check that could not tell prose from code would force
    // it to be deleted to stay green.
    const offenders: string[] = []
    const pattern = new RegExp(
      `(?:from|import\\(|require\\()\\s*['"](${NATIVE_IMAGING.map((n) => n.replace(/[@/]/g, '\\$&')).join('|')})['"]`,
      'g',
    )
    for (const file of walkTs(path.join(TOOL_ROOT, 'src'))) {
      const code = readFileSync(file, 'latin1')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
      for (const m of code.matchAll(pattern)) offenders.push(`${path.relative(TOOL_ROOT, file)}: ${m[0]}`)
    }
    expect(offenders).toEqual([])

    // (3) The claim is deliberately the NARROW one. An imaging module may still
    // be reachable in a developer's install, because the harness that runs the
    // serverless-runtime test project pulls one in transitively — so asserting
    // "nothing resolves anywhere in this checkout" would be asserting something
    // this story does not promise and cannot keep. What it does promise is that
    // whatever is present is the HARNESS's and never the tool's: every path to
    // one in the lockfile runs through miniflare, which is what
    // `@cloudflare/vitest-pool-workers` runs workerd with.
    //
    // Only blocks that mean an INSTALL count. `jsdom` and `unpdf` both name a
    // canvas under `peerDependencies` with `optional: true`, which is a slot
    // they would use if something else installed one — nothing here does, and
    // neither resolves below.
    const lock = readFileSync(path.join(__dirname, '../pnpm-lock.yaml'), 'utf8').split('\n')
    const importersOfImaging = new Set<string>()
    let lockPkg = ''
    let lockBlock = ''
    for (const line of lock) {
      const header = /^ {2}(\S.*?):\s*(\{\})?\s*$/.exec(line)
      if (header) {
        lockPkg = header[1].replace(/^'|'$/g, '')
        lockBlock = ''
        continue
      }
      const block = /^ {4}(\w+):\s*$/.exec(line)
      if (block) {
        lockBlock = block[1]
        continue
      }
      const dep = /^ {6}'?([^':]+)'?:\s/.exec(line)
      if (!dep || !NATIVE_IMAGING.includes(dep[1])) continue
      if (lockBlock === 'dependencies' || lockBlock === 'optionalDependencies') importersOfImaging.add(lockPkg)
    }
    expect([...importersOfImaging].filter((p) => !p.startsWith('miniflare@'))).toEqual([])
    expect(importersOfImaging.size).toBeGreaterThan(0) // the parser found the block it is judging
    // ...and the workspace root does not declare one either, so nothing a
    // developer typed asks for it directly.
    const rootPkg = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const rootDeclared = [...Object.keys(rootPkg.dependencies ?? {}), ...Object.keys(rootPkg.devDependencies ?? {})]
    expect(rootDeclared.filter((d) => NATIVE_IMAGING.includes(d))).toEqual([])
    expect(rootDeclared).toContain('@cloudflare/vitest-pool-workers')

    // ...and the pixel verbs run without one. No `1c` verb can fail because a
    // native imaging module is absent, because none is ever reached for: after
    // the verbs below have run, the module registry holds no entry for any of
    // them. Reachable and yet never loaded is the whole claim — an eager import
    // or a deferred `import()` would both have put an entry here.
    const resolveFrom = createRequire(__filename)
    const loaded = (): string[] =>
      NATIVE_IMAGING.filter((name) => {
        try {
          return resolveFrom.resolve(name) in resolveFrom.cache
        } catch {
          return false // not installed at all, which is also not loaded
        }
      })
    expect(loaded()).toEqual([])

    const dir = freshDir()
    const refPng = await writeRasterPng(raster(64, 64, BLACK), path.join(dir, 'ref.png'))
    const actualPng = await writeRasterPng(
      raster(64, 64, (x, y) => (x < 16 && y < 16 ? [200, 200, 200] : [0, 0, 0])),
      path.join(dir, 'actual.png'),
    )
    const report = await cmdDiff({
      ref: refPng,
      actualImagePath: actualPng,
      out: path.join(dir, 'out'),
      tuning: { blockPx: 16, blockThreshold: 24, padPx: 0 },
    })
    expect(report.regions.length).toBeGreaterThanOrEqual(1)

    const { outFile, box } = await cmdCrop({ input: actualPng, box: { x: 0, y: 0, w: 16, h: 16 } })
    expect(box).toEqual({ x: 0, y: 0, w: 16, h: 16 })
    expect((await decodeImage(outFile)).width).toBe(16)

    // Still nothing loaded, having run `1c diff` and `1c crop` end to end.
    expect(loaded()).toEqual([])
  })
})
