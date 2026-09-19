import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import * as pngModule from '../tools/generate/src/cli/png'
import { decodePng, encodePng } from '../tools/generate/src/cli/png'
import * as coreModule from '../tools/generate/src/cli/perceptual-core'
import { computeDiff, type Raster } from '../tools/generate/src/cli/perceptual-core'
// AC-1787 — the arithmetic cores of the rest of the fidelity path, imported from
// the modules that DEFINE them rather than through the `l1` barrel. That
// distinction is the porting finding, not an inconvenience; see the AC-1787
// block below.
import { diffManifests } from '../tools/generate/src/cli/capture/values-diff'
import { buildResponsiveTable, classifyResponsiveTable } from '../tools/generate/src/cli/responsive-diff'
import { foldToL1 } from '../tools/generate/src/l1/fold'
import { threeProbeGate } from '../tools/generate/src/l1/probes'
import { PNG_CORPUS, corpusBytes } from './fixtures/png/corpus'
import type { MultiStateCapture, StateProjection, ValueElement, ValueManifest } from '../tools/generate/src/cli/capture'

/**
 * UATs for the **serverless-runtime half** of story-046cfc56 — the fidelity path
 * running where it will actually run.
 *
 * The previous imaging module was native, so `1c diff` could not run in the
 * deployed runtime at all. Removing it is only half the claim; the other half is
 * that what replaced it works there. These run inside workerd via
 * `@cloudflare/vitest-pool-workers`, against real R2, and they import the SAME
 * modules the command line imports — not a copy, not a shim. That is the whole
 * point of splitting the diff arithmetic out of the filesystem/browser shell
 * verbatim: "the same code runs in the serverless runtime" is a statement about
 * the same code.
 *
 * The refusals, the crop verb and the measurement live in the sibling
 * `*.test.ts`; the recorded-witness decode is asserted on BOTH sides, because
 * "byte-identical in both runtimes" is the half of AC-1776 that only this file
 * can carry.
 */

/** sha256 of a buffer, via the platform's own subtle crypto — workerd has no `node:crypto`. */
const sha256 = async (bytes: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBufferView<ArrayBuffer>)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Build an RGB raster from a per-pixel fill — the node diff UATs' helper. */
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

// ── AC-1776 (the serverless-runtime half) ─────────────────────────────────────

describe('AC-1776 — the recorded witness holds in the deployed runtime too', () => {
  it('test_UAT_AC1776_corpus_decodes_to_the_recorded_witness_in_the_deployed_runtime', async () => {
    // The same corpus, the same recorded numbers, the OTHER runtime — which is
    // the half of the AC the node suite cannot reach. DEFLATE comes from
    // `DecompressionStream` here rather than from the host language's zlib, so
    // this is the assertion that the platform primitive the whole design rests
    // on behaves identically on both sides. The node sibling pins
    // `fixtures/png/corpus.ts` to the same bytes and the same recorded values as
    // `sharp-baseline.json`, so the two runtimes are checked against ONE witness
    // rather than two that could drift apart.
    const names = Object.keys(PNG_CORPUS)
    expect(names.length).toBeGreaterThan(8) // the corpus is not silently empty

    const digests: Record<string, string> = {}
    for (const name of names) {
      const want = PNG_CORPUS[name]
      const got = await decodePng(corpusBytes(name), name)
      expect({ name, w: got.width, h: got.height, ch: got.channels, bytes: got.data.length }).toEqual({
        name,
        w: want.width,
        h: want.height,
        ch: want.channels,
        bytes: want.bytes,
      })
      // Exact equality, deliberately not a tolerance band: a band would hide
      // precisely the drift it exists to catch. The witness was recorded while
      // the native decoder was still installed and may not be regenerated to
      // make this pass.
      digests[name] = await sha256(got.data)
      expect(`${name}:${digests[name]}`).toBe(`${name}:${want.sha256}`)
    }

    // The same SET of digests, not merely the same count.
    expect(digests).toEqual(Object.fromEntries(names.map((n) => [n, PNG_CORPUS[n].sha256])))
  })
})

// ── AC-1786 ───────────────────────────────────────────────────────────────────

describe('AC-1786 — a perceptual diff runs end to end in the deployed runtime', () => {
  it('test_UAT_AC1786_diff_from_images_in_the_object_store_reproduces_the_cli_verdicts', async () => {
    // The code exercised here is the code the command line uses. `cli/index.ts`
    // re-exports `perceptual.ts`, which re-exports these very modules — so
    // asserting the bindings are the modules' own exports is what rules out a
    // workerd-only copy or shim standing in for them.
    expect(computeDiff).toBe(coreModule.computeDiff)
    expect(decodePng).toBe(pngModule.decodePng)
    expect(encodePng).toBe(pngModule.encodePng)

    // No filesystem here, so the bytes travel the route they will actually
    // travel in the cloud: encode → put in the bucket → get back → decode → diff.
    const ref = raster(64, 64, () => [0, 0, 0])
    const actual = raster(64, 64, (_x, y) => (y >= 32 ? [100, 100, 100] : [0, 0, 0]))

    await env.SITES.put('png-codec/ref.png', (await encodePng(ref)) as unknown as ArrayBufferView<ArrayBuffer>)
    await env.SITES.put('png-codec/actual.png', (await encodePng(actual)) as unknown as ArrayBufferView<ArrayBuffer>)

    const [refBack, actualBack] = await Promise.all(
      ['png-codec/ref.png', 'png-codec/actual.png'].map(async (key) => {
        const obj = await env.SITES.get(key)
        expect(obj, `R2 has no object at ${key}`).not.toBeNull()
        return decodePng(new Uint8Array(await obj!.arrayBuffer()), key)
      }),
    )

    // THE SAME NUMBERS the command-line diff tests assert for the same input:
    // mean difference, band profile, dimensions, over-threshold percentage.
    const headline = computeDiff(refBack, actualBack, { blockPx: 16, bands: 4 })
    expect(headline.meanDiff).toBeCloseTo(50, 5)
    expect(headline.bands.map((b) => Math.round(b))).toEqual([0, 0, 100, 100])
    expect(headline.dims).toEqual({ w: 64, h: 64 })
    expect(headline.pctOverThreshold).toBeCloseTo(50, 5)

    // ...and the same regions found, with the same bounding boxes.
    const twoPatches = raster(64, 64, (x, y) =>
      (x < 16 && y < 16) || (x >= 48 && y >= 48) ? [200, 200, 200] : [0, 0, 0],
    )
    await env.SITES.put('png-codec/patches.png', (await encodePng(twoPatches)) as unknown as ArrayBufferView<ArrayBuffer>)
    const patchesObj = await env.SITES.get('png-codec/patches.png')
    expect(patchesObj).not.toBeNull()
    const patchesBack = await decodePng(new Uint8Array(await patchesObj!.arrayBuffer()), 'png-codec/patches.png')

    const regions = computeDiff(refBack, patchesBack, { blockPx: 16, blockThreshold: 24, padPx: 0 })
    expect(regions.regions).toHaveLength(2)
    expect(regions.regions.map((r) => r.bbox)).toEqual(
      expect.arrayContaining([
        { x: 0, y: 0, w: 16, h: 16 },
        { x: 48, y: 48, w: 16, h: 16 },
      ]),
    )
  })
})

// ── AC-1787 ───────────────────────────────────────────────────────────────────

describe('AC-1787 — the remaining fidelity comparisons run in the deployed runtime', () => {
  it('test_UAT_AC1787_value_responsive_and_l1_probe_comparisons_all_produce_reports', () => {
    // (1) The per-element value comparison. Its command wrapper reads bundles off
    // a disk; `diffManifests` is the comparison it wraps, and its module imports
    // no `node:` module at all — so the arithmetic needed no porting, only
    // proving.
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
      source: 'png-codec',
      viewport: { width: 1280, height: 900 },
      sections: [],
      elements: [el('Front door', color)],
    })

    // Two identical manifests return no deltas...
    expect(diffManifests(manifest('#111827'), manifest('#111827')).deltas).toHaveLength(0)
    // ...and two that differ return a delta naming the changed property.
    const changed = diffManifests(manifest('#111827'), manifest('#ff0000'))
    expect(changed.deltas.length).toBeGreaterThan(0)
    expect(JSON.stringify(changed.deltas)).toContain('color')

    // (2) The responsive comparison. Its module DOES import the filesystem at
    // module scope — for the report it writes — and that import resolves here
    // under `nodejs_compat` without being called, so the module loads and its two
    // pure functions run.
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
      {
        size: 'mobile',
        manifest: { source: 'm', viewport: { width: 375, height: 900 }, sections: [], elements: [at(320, 48)] },
      },
      {
        size: 'desktop',
        manifest: { source: 'd', viewport: { width: 1280, height: 900 }, sections: [], elements: [at(1200, 24)] },
      },
    ])
    expect(table.sizes).toEqual(['mobile', 'desktop'])
    expect(table.rows.some((r) => r.changed)).toBe(true)
    expect(classifyResponsiveTable(table).classifications.length).toBeGreaterThan(0)

    // (3) The L1 gate's three probes. THE ONE PORTING FINDING, and it is an
    // import path rather than a port: the gate's command entry point lives in a
    // file-reading module, and the `l1` BARREL re-exports a round-trip module
    // that pulls in an HTTP server. The fold and the probes themselves are clean,
    // so reaching them here means importing `l1/fold` and `l1/probes` directly
    // instead of through `../l1`. Recorded here so the next caller does not
    // rediscover it.
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
    const projections: StateProjection[] = [320, 375, 768, 1024, 1280, 1440].map((width) => ({
      engine: 'chromium',
      viewport: { width, height: 900 },
      state: 'rest',
      manifest: {
        source: `png-codec@${width}`,
        viewport: { width, height: 900 },
        sections: [],
        elements: [text('Front door', 100, width), text('Body copy line', 170, width), text('Caption row', 240, width)],
      },
    }))
    const oracle: MultiStateCapture = { projections }

    const report = threeProbeGate(foldToL1(oracle), oracle)

    // What is asserted is that they RAN — a report carrying all three probe
    // results and a pass verdict, rather than an import failure. The verdicts
    // themselves are those capabilities' own business, not this story's.
    expect(report).toHaveProperty('sampleFidelity')
    expect(report).toHaveProperty('offSample')
    expect(report).toHaveProperty('contentRobustness')
    expect(typeof report.pass).toBe('boolean')
  })
})
