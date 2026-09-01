import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { decodePng, encodePng, sniffImageFormat, UnsupportedImageError } from '../tools/generate/src/cli/png'
import { computeDiff, cropRaster, extractRect, type Raster } from '../tools/generate/src/cli/perceptual-core'
import { PNG_CORPUS, corpusBytes } from './fixtures/png/corpus'
// AC4 — the arithmetic cores of the rest of the fidelity path, imported from the
// modules that define them rather than from `tools/generate/src`'s barrel. The
// barrel is a filesystem module graph; see the AC4 block below for why that
// distinction is the finding rather than an inconvenience.
import { diffManifests } from '../tools/generate/src/cli/capture/values-diff'
import { buildResponsiveTable, classifyResponsiveTable } from '../tools/generate/src/cli/responsive-diff'
import { threeProbeGate } from '../tools/generate/src/l1/probes'
import { foldToL1 } from '../tools/generate/src/l1/fold'
import type { MultiStateCapture, StateProjection, ValueElement, ValueManifest } from '../tools/generate/src/cli/capture'

/**
 * UATs for REQ-156 AC3 and AC4 — **the fidelity path, in the runtime it will run
 * in**.
 *
 * `sharp` was a native module, so `1c diff` could not run in workerd at all.
 * Removing it is only half the claim; the other half is that what replaced it
 * actually works where it has to. These run inside workerd via
 * `@cloudflare/vitest-pool-workers`, against real R2, and they import the SAME
 * modules the CLI imports — not a copy, not a shim. That is the whole point of
 * splitting `perceptual-core.ts` out of `perceptual.ts`: the arithmetic became
 * importable without the filesystem, so "the same code runs in workerd" is a
 * statement about the same code.
 *
 * The corpus and the sharp hashes are the ones the node suite uses
 * (`tests/fixtures/png/corpus.ts`, generated beside `sharp-baseline.json`),
 * inlined as base64 because workerd has no filesystem to read them from.
 */

const sha256 = async (bytes: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBufferView<ArrayBuffer>)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Build an RGB raster from a per-pixel fill — the node REQ-38 UATs' helper. */
function raster(w: number, h: number, fill: (x: number, y: number) => [number, number, number]): Raster {
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

describe('REQ-156 AC3 — the codec decodes in workerd exactly as it does in node', () => {
  it('test_UAT_FC_REQ-156_workerd_decode_matches_the_sharp_baseline', async () => {
    // The same corpus, the same recorded hashes, the other runtime. DEFLATE comes
    // from `DecompressionStream` here rather than from Node's zlib, so this is
    // the assertion that the platform primitive the whole design rests on behaves
    // identically on both sides.
    const names = Object.keys(PNG_CORPUS)
    expect(names.length).toBeGreaterThan(8)
    for (const name of names) {
      const want = PNG_CORPUS[name]
      const got = await decodePng(corpusBytes(name), name)
      expect({ name, w: got.width, h: got.height, ch: got.channels }).toEqual({
        name,
        w: want.width,
        h: want.height,
        ch: want.channels,
      })
      expect(`${name}:${await sha256(got.data)}`).toBe(`${name}:${want.sha256}`)
    }
  })

  it('test_UAT_FC_REQ-156_workerd_encodes_a_png_that_decodes_back_unchanged', async () => {
    // `CompressionStream` is the other half of the platform bet.
    const src = await decodePng(corpusBytes('rgba-all-filters.png'))
    const round = await decodePng(await encodePng(src))
    expect(await sha256(round.data)).toBe(await sha256(src.data))
  })

  it('test_UAT_FC_REQ-156_workerd_refuses_a_non_png_by_name', async () => {
    const jpeg = new Uint8Array(32)
    jpeg.set([0xff, 0xd8, 0xff, 0xe0])
    expect(sniffImageFormat(jpeg)).toBe('JPEG')
    await expect(decodePng(jpeg, 'crop')).rejects.toThrow(UnsupportedImageError)
  })
})

describe('REQ-156 AC3 — a perceptual diff, in workerd, from PNGs in real R2', () => {
  it('test_UAT_FC_REQ-156_diff_from_two_pngs_in_r2_reproduces_the_cli_verdicts', async () => {
    // Screenshots live in R2 in the cloud, so the bytes travel the route they
    // will actually travel: encode → put → get → decode → diff.
    const ref = raster(64, 64, () => [0, 0, 0])
    const actual = raster(64, 64, (_x, y) => (y >= 32 ? [100, 100, 100] : [0, 0, 0]))

    await env.SITES.put('req156/ref.png', (await encodePng(ref)) as unknown as ArrayBufferView<ArrayBuffer>)
    await env.SITES.put('req156/actual.png', (await encodePng(actual)) as unknown as ArrayBufferView<ArrayBuffer>)

    const fetched = await Promise.all(
      ['req156/ref.png', 'req156/actual.png'].map(async (key) => {
        const obj = await env.SITES.get(key)
        expect(obj, `R2 has no object at ${key}`).not.toBeNull()
        return decodePng(new Uint8Array(await obj!.arrayBuffer()), key)
      }),
    )

    const res = computeDiff(fetched[0], fetched[1], { blockPx: 16, bands: 4 })

    // THE SAME NUMBERS the node UAT for REQ-38 asserts against the same input.
    // AC2's promise is that the verdicts do not move; this is that promise
    // restated in the runtime the move was made for.
    expect(res.meanDiff).toBeCloseTo(50, 5)
    expect(res.bands.map((b) => Math.round(b))).toEqual([0, 0, 100, 100])
    expect(res.dims).toEqual({ w: 64, h: 64 })
    expect(res.pctOverThreshold).toBeCloseTo(50, 5)
  })

  it('test_UAT_FC_REQ-156_regions_rank_in_workerd_as_they_do_on_the_cli', async () => {
    const ref = raster(64, 64, () => [0, 0, 0])
    const actual = raster(64, 64, (x, y) => {
      const inA = x < 16 && y < 16
      const inB = x >= 48 && y >= 48
      return inA || inB ? [200, 200, 200] : [0, 0, 0]
    })
    const png = await encodePng(actual)
    const back = await decodePng(png)

    const res = computeDiff(ref, back, { blockPx: 16 })
    expect(res.regions).toHaveLength(2)
    expect(res.regions.map((r) => r.bbox)).toEqual(
      expect.arrayContaining([
        { x: 0, y: 0, w: 16, h: 16 },
        { x: 48, y: 48, w: 16, h: 16 },
      ]),
    )
  })

  it('test_UAT_FC_REQ-156_crop_and_common_rect_are_pure_arithmetic_in_workerd', async () => {
    // `1c crop` and the ref/actual size reconciliation are the other two things
    // sharp did. Both are now arithmetic over a decoded buffer, so both run here.
    const src = await decodePng(corpusBytes('rgb-odd-dims.png'))
    const { raster: window, box } = extractRect(src, { x: 30, y: 15, w: 40, h: 40 })
    expect(box).toEqual({ x: 30, y: 15, w: 3, h: 2 }) // clamped to a 33×17 image
    expect(window.data.length).toBe(3 * 2 * src.channels)

    const shorter = cropRaster(src, 20, 10)
    expect({ w: shorter.width, h: shorter.height }).toEqual({ w: 20, h: 10 })
  })
})

describe('REQ-156 AC4 — the rest of the fidelity path is workerd-clean at its core', () => {
  it('test_UAT_FC_REQ-156_values_diff_comparison_runs_in_workerd', () => {
    // `cmdValuesDiff` reads bundles off a disk; `diffManifests` is the comparison
    // it wraps, and `capture/values-diff.ts` imports no `node:` module at all — so
    // the arithmetic needed no porting, only proving.
    const el = (text: string, color: string): ValueElement => ({
      text,
      role: 'body',
      color,
      fontFamily: 'Inter',
      fontSizePx: 16,
      fontWeight: 400,
      lineHeightPx: 24,
      box: { x: 0, y: 0, width: 100, height: 24 },
    })
    const manifest = (color: string): ValueManifest => ({
      source: 'req156',
      viewport: { width: 1280, height: 900 },
      sections: [],
      elements: [el('Front door', color)],
    })

    const clean = diffManifests(manifest('#111827'), manifest('#111827'))
    expect(clean.deltas).toHaveLength(0)

    const dirty = diffManifests(manifest('#111827'), manifest('#ff0000'))
    expect(dirty.deltas.length).toBeGreaterThan(0)
    expect(JSON.stringify(dirty.deltas)).toContain('color')
  })

  it('test_UAT_FC_REQ-156_responsive_diff_table_and_classifier_run_in_workerd', () => {
    // `responsive-diff.ts` DOES import `node:fs` at module scope — for the report
    // it writes — and the import resolves here under `nodejs_compat` without
    // being called. So the module loads and its two pure functions run; nothing
    // needed porting, which is the confirmation AC4 asks for.
    const at = (width: number, height: number): ValueElement => ({
      text: 'Front door',
      role: 'body',
      color: '#111827',
      fontFamily: 'Inter',
      fontSizePx: 16,
      fontWeight: 400,
      lineHeightPx: 24,
      box: { x: 0, y: 0, width, height },
    })
    const table = buildResponsiveTable([
      { size: 'mobile', manifest: { source: 'm', viewport: { width: 375, height: 900 }, sections: [], elements: [at(320, 48)] } },
      { size: 'desktop', manifest: { source: 'd', viewport: { width: 1280, height: 900 }, sections: [], elements: [at(1200, 24)] } },
    ])
    expect(table.sizes).toEqual(['mobile', 'desktop'])
    expect(table.rows.some((r) => r.changed)).toBe(true)

    const classified = classifyResponsiveTable(table)
    expect(classified.classifications.length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-156_l1_gate_probes_run_in_workerd_via_the_direct_module', () => {
    // THE ONE PORTING FINDING, and it is an import path rather than a rewrite.
    // `cmdL1Gate` lives in `repro.ts`, which reads and writes files, and the `l1`
    // BARREL re-exports `roundtrip.ts`, which imports `node:http`. The gate's
    // arithmetic — `foldToL1` + `threeProbeGate` — is clean, and reaching it here
    // means importing `l1/fold` and `l1/probes` directly instead of through
    // `../l1`. Recorded as a UAT so the next caller does not rediscover it.
    const ladder = [320, 375, 768, 1024, 1280, 1440]
    const text = (t: string, y: number, width: number): ValueElement => ({
      text: t,
      role: 'body',
      color: '#111827',
      fontFamily: 'Inter',
      fontSizePx: 40,
      fontWeight: 600,
      lineHeightPx: 48,
      box: { x: 20, y, width: width - 40, height: 48 },
    })
    const projections: StateProjection[] = ladder.map((width) => ({
      engine: 'chromium',
      viewport: { width, height: 900 },
      state: 'rest',
      manifest: {
        source: `req156@${width}`,
        viewport: { width, height: 900 },
        sections: [],
        elements: [text('Front door', 100, width), text('Body copy line', 170, width), text('Caption row', 240, width)],
      },
    }))
    const oracle: MultiStateCapture = { projections }

    const base = foldToL1(oracle)
    const report = threeProbeGate(base, oracle)

    // Not asserting pass/fail — the fixture is a stand-in and the verdict is the
    // gate's business, not this ticket's. What AC4 needs is that all three probes
    // actually RAN in workerd and produced a report rather than an import error.
    expect(report).toHaveProperty('sampleFidelity')
    expect(report).toHaveProperty('offSample')
    expect(report).toHaveProperty('contentRobustness')
    expect(typeof report.pass).toBe('boolean')
  })
})
