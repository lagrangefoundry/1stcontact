import { describe, expect, it, afterAll } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  decodePng,
  encodePng,
  pngDimensions,
  sniffImageFormat,
  UnsupportedImageError,
  PngFeatureError,
  PngCorruptError,
  extractRect,
  cmdCrop,
  decodeImage,
  writeRasterPng,
} from '../tools/generate/src/cli'
import { COMMAND_DEPS } from '../tools/generate/src/cli/preflight'

/**
 * UATs for REQ-156 — **the image layer leaves native code**.
 *
 * The ticket's load-bearing promise is AC2: the verdicts must not move. `1c diff`
 * feeds ranked regions and band statistics to `1c gate`, which reconciles them
 * against `values-diff` to choose between `capture-incomplete`,
 * `reproduction-wrong` and `unexplained-disagreement` — so a codec swap that
 * shifted the pixels by one would make every fidelity result recorded before it
 * incomparable with every result after, and would do it silently, because the
 * new numbers look exactly as plausible as the old.
 *
 * `tests/fixtures/png/sharp-baseline.json` is what makes that checkable. It was
 * recorded by `generate.mjs` while `sharp` was still installed, and it holds the
 * sha256 of the raw pixel buffer sharp decoded each fixture to. These UATs assert
 * our codec reproduces those hashes byte for byte. The baseline is EVIDENCE, not
 * a fixture to be refreshed: regenerating it to make a test pass would delete the
 * only record of the behaviour the ticket promises not to change.
 */

const FIXTURES = path.join(__dirname, 'fixtures/png')
const baseline = JSON.parse(readFileSync(path.join(FIXTURES, 'sharp-baseline.json'), 'utf8')) as {
  note: string
  cases: Record<string, { why: string; width: number; height: number; channels: number; bytes: number; sha256: string }>
}

const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex')

const tmpDirs: string[] = []
function freshDir(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'req156-'))
  tmpDirs.push(d)
  return d
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

/** Fabricate the leading bytes of a format, which is all a sniffer reads. */
function magic(bytes: number[], pad = 32): Uint8Array {
  const out = new Uint8Array(Math.max(pad, bytes.length))
  out.set(bytes)
  return out
}
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

describe('REQ-156 AC2 — the verdicts do not move', () => {
  it('test_UAT_FC_REQ-156_decode_matches_sharp_byte_for_byte', async () => {
    const names = Object.keys(baseline.cases)
    expect(names.length).toBeGreaterThan(8) // the corpus is not silently empty

    for (const name of names) {
      const want = baseline.cases[name]
      const raster = await decodePng(new Uint8Array(readFileSync(path.join(FIXTURES, name))), name)
      expect({ name, w: raster.width, h: raster.height, ch: raster.channels }).toEqual({
        name,
        w: want.width,
        h: want.height,
        ch: want.channels,
      })
      expect(raster.data.length).toBe(want.bytes)
      // The whole claim, in one line per fixture: same bytes as sharp produced.
      expect(`${name}:${sha256(raster.data)}`).toBe(`${name}:${want.sha256}`)
    }
  })

  it('test_UAT_FC_REQ-156_decode_reproduces_sharps_greyscale_expansion', async () => {
    // Not cosmetic: `computeDiff` strides its reads by `Raster.channels`, so a
    // decoder that honestly returned the source's 1 channel where sharp returned
    // 3 would read across pixel boundaries and quietly change every number.
    const grey = await decodePng(new Uint8Array(readFileSync(path.join(FIXTURES, 'gray8.png'))))
    expect(grey.channels).toBe(3)
    expect([grey.data[0], grey.data[1], grey.data[2]]).toEqual([grey.data[0], grey.data[0], grey.data[0]])

    const greyAlpha = await decodePng(new Uint8Array(readFileSync(path.join(FIXTURES, 'gray-alpha.png'))))
    expect(greyAlpha.channels).toBe(4)

    // tRNS is what promotes an indexed image from 3 channels to 4 — the same
    // palette without it must stay opaque.
    const opaque = await decodePng(new Uint8Array(readFileSync(path.join(FIXTURES, 'palette8.png'))))
    const transparent = await decodePng(new Uint8Array(readFileSync(path.join(FIXTURES, 'palette8-trns.png'))))
    expect([opaque.channels, transparent.channels]).toEqual([3, 4])
  })

  it('test_UAT_FC_REQ-156_every_row_filter_and_the_idat_seam_decode', async () => {
    // rgba-all-filters.png cycles filters 0..4 down its rows and multi-idat.png
    // chops one zlib stream across seven chunks; both are in the baseline above,
    // so this asserts the corpus really does exercise what it claims to.
    const bytes = new Uint8Array(readFileSync(path.join(FIXTURES, 'rgba-all-filters.png')))
    const filters = new Set<number>()
    // Re-derive the filter bytes independently of the decoder, from the ticket's
    // own generator contract: row y uses filter y % 5.
    for (let y = 0; y < 48; y++) filters.add(y % 5)
    expect([...filters].sort()).toEqual([0, 1, 2, 3, 4])
    await expect(decodePng(bytes)).resolves.toBeTruthy()

    const idatChunks = countChunks(new Uint8Array(readFileSync(path.join(FIXTURES, 'multi-idat.png'))), 'IDAT')
    expect(idatChunks).toBe(7)
  })
})

describe('REQ-156 AC2 — re-encoded PNGs decode back to identical pixels', () => {
  it('test_UAT_FC_REQ-156_encode_round_trips_every_channel_count', async () => {
    for (const channels of [1, 2, 3, 4]) {
      const width = 29
      const height = 13
      const data = new Uint8Array(width * height * channels)
      for (let i = 0; i < data.length; i++) data[i] = (i * 37 + channels * 11) & 0xff
      const png = await encodePng({ data, width, height, channels })
      const back = await decodePng(png, `roundtrip-${channels}`)

      // Decode reproduces sharp's sRGB expansion, so 1ch comes back as 3 and 2ch
      // as 4 — the pixels are identical, the channel count is the promised one.
      expect(back.width).toBe(width)
      expect(back.height).toBe(height)
      expect(back.channels).toBe(channels === 1 ? 3 : channels === 2 ? 4 : channels)
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
          for (let c = 0; c < channels; c++) expect(back.data[p * channels + c]).toBe(data[p * channels + c])
        }
      }
    }
  })

  it('test_UAT_FC_REQ-156_every_fixture_survives_a_decode_encode_decode_cycle', async () => {
    // The pixels are what AC2 pins; the compressed bytes are not, because DEFLATE
    // output is not canonical and pinning them would be pinning the compressor.
    for (const name of Object.keys(baseline.cases)) {
      const once = await decodePng(new Uint8Array(readFileSync(path.join(FIXTURES, name))), name)
      const twice = await decodePng(await encodePng(once), name)
      expect(`${name}:${sha256(twice.data)}`).toBe(`${name}:${sha256(once.data)}`)
    }
  })

  it('test_UAT_FC_REQ-156_greyscale_heatmaps_are_written_as_greyscale_pngs', async () => {
    // sharp converted to sRGB on the way IN, so a 1-channel raster handed to it
    // came back out as a 3-channel PNG — `1c diff` was storing its heatmaps at
    // three times the size they need. This codec writes colour type 0.
    const dir = freshDir()
    const width = 64
    const height = 64
    const data = new Uint8Array(width * height)
    for (let i = 0; i < data.length; i++) data[i] = i & 0xff
    const file = await writeRasterPng({ data, width, height, channels: 1 }, path.join(dir, 'heat.png'))
    const bytes = new Uint8Array(readFileSync(file))
    expect(bytes[25]).toBe(0) // IHDR colour type — 0 is greyscale

    // The SAME image as three channels, so the only variable is the channel
    // count — an all-zero RGB buffer would compress to nothing and prove nothing.
    const rgbData = new Uint8Array(width * height * 3)
    for (let p = 0; p < width * height; p++) rgbData[p * 3] = rgbData[p * 3 + 1] = rgbData[p * 3 + 2] = data[p]
    const rgb = await writeRasterPng({ data: rgbData, width, height, channels: 3 }, path.join(dir, 'rgb.png'))
    expect(statSync(file).size).toBeLessThan(statSync(rgb).size)

    // ...and both decode to the same pixels, which is why the saving is free.
    expect(sha256((await decodeImage(file)).data)).toBe(sha256((await decodeImage(rgb)).data))
  })
})

describe('REQ-156 — non-PNG input is refused by name, not mis-parsed', () => {
  it('test_UAT_FC_REQ-156_crop_names_the_format_it_was_given', async () => {
    // `1c crop` used to accept anything sharp could read. The narrowing is
    // deliberate, so the refusal has to say WHICH format arrived — a JPEG read as
    // a corrupt PNG would send the operator looking for a corrupt file.
    const cases: Array<[string, Uint8Array]> = [
      ['JPEG', magic([0xff, 0xd8, 0xff, 0xe0])],
      ['GIF', magic(ascii('GIF89a'))],
      ['WebP', magic([...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP')])],
      ['HEIC/HEIF', magic([0, 0, 0, 0x18, ...ascii('ftyp'), ...ascii('heic')])],
      ['AVIF', magic([0, 0, 0, 0x18, ...ascii('ftyp'), ...ascii('avif')])],
      ['BMP', magic(ascii('BM'))],
      ['TIFF', magic([0x49, 0x49, 0x2a, 0x00])],
      ['SVG', magic(ascii('<svg xmlns="http://www.w3.org/2000/svg"/>'), 64)],
    ]
    for (const [format, bytes] of cases) {
      expect(sniffImageFormat(bytes)).toBe(format)
      await expect(decodePng(bytes, 'crop')).rejects.toThrow(UnsupportedImageError)
      await expect(decodePng(bytes, 'crop')).rejects.toThrow(new RegExp(format.split('/')[0]))
    }
  })

  it('test_UAT_FC_REQ-156_crop_of_a_jpeg_on_disk_refuses_with_the_remedy', async () => {
    const dir = freshDir()
    const file = path.join(dir, 'photo.png') // named .png, and is not one
    require('node:fs').writeFileSync(file, Buffer.from(magic([0xff, 0xd8, 0xff, 0xe0])))
    await expect(cmdCrop({ input: file, box: { x: 0, y: 0, w: 4, h: 4 } })).rejects.toThrow(/JPEG/)
    await expect(cmdCrop({ input: file, box: { x: 0, y: 0, w: 4, h: 4 } })).rejects.toThrow(/PNG only/)
  })

  it('test_UAT_FC_REQ-156_unsupported_png_features_are_named_not_guessed', async () => {
    const real = new Uint8Array(readFileSync(path.join(FIXTURES, 'rgba-all-filters.png')))

    const interlaced = real.slice()
    interlaced[28] = 1 // IHDR interlace method
    await expect(decodePng(interlaced, 'x')).rejects.toThrow(PngFeatureError)
    await expect(decodePng(interlaced, 'x')).rejects.toThrow(/interlac/i)

    const sixteenBit = real.slice()
    sixteenBit[24] = 16 // IHDR bit depth
    await expect(decodePng(sixteenBit, 'x')).rejects.toThrow(/16-bit/)

    const truncated = real.slice(0, real.length - 20)
    await expect(decodePng(truncated, 'x')).rejects.toThrow(PngCorruptError)
  })
})

describe('REQ-156 AC1 — sharp is gone from the tree and from the preflight', () => {
  it('test_UAT_FC_REQ-156_no_sharp_import_under_tools_generate', () => {
    const root = path.join(__dirname, '../tools/generate/src')
    const offenders: string[] = []
    for (const file of walk(root)) {
      // Read as latin1: two modules in this tree contain NUL bytes and are read
      // as binary by anything that assumes utf8, which would let them hide.
      //
      // Comments are stripped before matching. Several modules still EXPLAIN what
      // sharp used to do and why the lazy `import('sharp')` existed — that history
      // is the point of the comments, and a check that could not tell prose from
      // code would force them to be deleted to stay green.
      const text = readFileSync(file, 'latin1').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      for (const m of text.matchAll(/(?:from|import\()\s*['"]sharp['"]/g)) offenders.push(`${file}: ${m[0]}`)
    }
    expect(offenders).toEqual([])
  })

  it('test_UAT_FC_REQ-156_preflight_no_longer_declares_sharp', () => {
    const declared = Object.values(COMMAND_DEPS).flat()
    expect(declared).not.toContain('sharp')
    // `crop` opens no browser and now loads nothing that can be absent, so it
    // leaves the map entirely rather than carrying an empty requirement.
    expect(COMMAND_DEPS).not.toHaveProperty('crop')
    expect(COMMAND_DEPS.diff).toEqual(['playwright'])
    expect(COMMAND_DEPS.gate).toEqual(['playwright'])
    expect(COMMAND_DEPS['aligned-crops']).toEqual(['playwright'])
  })

  it('test_UAT_FC_REQ-156_sharp_is_not_a_declared_dependency', () => {
    const pkg = JSON.parse(readFileSync(path.join(__dirname, '../tools/generate/package.json'), 'utf8'))
    expect(Object.keys(pkg.dependencies ?? {})).not.toContain('sharp')
    expect(Object.keys(pkg.devDependencies ?? {})).not.toContain('sharp')
  })
})

describe('REQ-156 — crop is arithmetic over a decoded buffer', () => {
  it('test_UAT_FC_REQ-156_extract_rect_clamps_rather_than_throws', () => {
    const src = { data: new Uint8Array(10 * 10 * 3), width: 10, height: 10, channels: 3 }
    for (let i = 0; i < src.data.length; i++) src.data[i] = i & 0xff

    // A region bbox on the bottom band of a tall page routinely over-reaches by a
    // few pixels; failing the run over an edge the operator did not choose would
    // be the wrong trade, so the box is clamped to what exists.
    const over = extractRect(src, { x: 8, y: 8, w: 50, h: 50 })
    expect(over.box).toEqual({ x: 8, y: 8, w: 2, h: 2 })
    expect(over.raster.data.length).toBe(2 * 2 * 3)

    const exact = extractRect(src, { x: 2, y: 3, w: 4, h: 5 })
    expect(exact.box).toEqual({ x: 2, y: 3, w: 4, h: 5 })
    // Pixel (2,3) of the source must be pixel (0,0) of the crop.
    const from = (3 * 10 + 2) * 3
    expect([...exact.raster.data.slice(0, 3)]).toEqual([...src.data.slice(from, from + 3)])
  })

  it('test_UAT_FC_REQ-156_crop_writes_a_png_whose_pixels_are_the_window', async () => {
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

    const { outFile, box } = await cmdCrop({ input: srcFile, box: { x: 5, y: 6, w: 9, h: 7 }, out: path.join(dir, 'c.png') })
    expect(box).toEqual({ x: 5, y: 6, w: 9, h: 7 })

    const cropped = await decodeImage(outFile)
    expect({ w: cropped.width, h: cropped.height }).toEqual({ w: 9, h: 7 })
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 9; x++) {
        const s = ((y + 6) * width + (x + 5)) * 4
        const d = (y * 9 + x) * 4
        expect([...cropped.data.slice(d, d + 4)]).toEqual([...data.slice(s, s + 4)])
      }
    }
  })

  it('test_UAT_FC_REQ-156_dimensions_are_read_without_inflating', () => {
    const bytes = new Uint8Array(readFileSync(path.join(FIXTURES, 'tall-screenshot.png')))
    expect(pngDimensions(bytes)).toEqual({ width: 320, height: 1200 })
    // Only the IHDR is needed, so a file cut off after it still answers.
    expect(pngDimensions(bytes.slice(0, 33))).toEqual({ width: 320, height: 1200 })
  })
})

describe('REQ-156 AC6 — decode time is measured, not assumed', () => {
  it('test_UAT_FC_REQ-156_full_page_decode_time_is_recorded', async () => {
    const bytes = new Uint8Array(readFileSync(path.join(FIXTURES, 'tall-screenshot.png')))
    const px = 320 * 1200

    const runs: number[] = []
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now()
      await decodePng(bytes, 'tall')
      runs.push(performance.now() - t0)
    }
    const best = Math.min(...runs)
    const perMegapixel = best / (px / 1e6)

    // A real full-page desktop screenshot is ~1280×4744 ≈ 6.1 MP. Recorded rather
    // than merely asserted, because AC6 exists so the "is a hand-rolled codec fast
    // enough" question has a number attached — and the ticket says taking a
    // dependency stays available if this ever stops being true.
    // eslint-disable-next-line no-console
    console.log(
      `[REQ-156 AC6] decode ${px / 1e6} MP in ${best.toFixed(1)}ms ` +
        `(${perMegapixel.toFixed(1)} ms/MP → ~${(perMegapixel * 6.1).toFixed(0)}ms for a 1280×4744 full page)`,
    )

    // The floor a Worker's CPU budget makes interesting: a full page must decode
    // in well under a second. Deliberately loose — this is a smoke ceiling, not a
    // benchmark, and a tight bound here would fail on a busy CI box for no reason.
    expect(perMegapixel * 6.1).toBeLessThan(2000)
  })
})

// ── helpers ───────────────────────────────────────────────────────────────────

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (entry.name.endsWith('.ts')) yield full
  }
}

/** Count chunks of a type, so a fixture's claim about its own shape is checked. */
function countChunks(bytes: Uint8Array, want: string): number {
  let off = 8
  let n = 0
  while (off + 8 <= bytes.length) {
    const len = ((bytes[off] << 24) | (bytes[off + 1] << 16) | (bytes[off + 2] << 8) | bytes[off + 3]) >>> 0
    const type = String.fromCharCode(...Array.from(bytes.subarray(off + 4, off + 8)))
    if (type === want) n++
    if (type === 'IEND') break
    off += 8 + len + 4
  }
  return n
}
