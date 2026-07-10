import { beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  assertModuleConforms,
  ConformanceError,
  engineAvailable,
  evaluateXBrowser,
  writeRasterPng,
  X_BROWSER_BOX_PROBE,
  X_BROWSER_TOLERANCE,
  type BrowserDriver,
  type CapturedResponse,
  type ConformanceEngine,
  type ConformanceFixture,
  type Raster,
  type XBrowserBox,
} from '../tools/generate/src'

/**
 * UATs for REQ-42 — the conformance harness **cross-browser dimension**
 * ([[DOC-20]] AC-M3). The dimension renders a module in Blink (Chromium),
 * WebKit and Gecko and asserts layout *equivalence* — a per-element,
 * parent-relative box comparison plus a perceptual block-diff backstop — never
 * pixel equality (engines antialias and hint fonts differently).
 *
 * Two proof strategies, deliberately split:
 *
 *  1. **Calibration UATs use per-engine _fake_ drivers** that feed each engine
 *     controlled geometry / screenshots. A real fixture that forces a
 *     cross-engine shift is Playwright-version-flaky — precisely the "too tight
 *     = flaky" trap the ticket warns of — so the discriminator's own correctness
 *     (a 1-line shift is caught, sub-pixel jitter is not, an unboxed move trips
 *     the backstop) is proven *deterministically* by injecting the exact deltas.
 *     These are the cross-engine analogue of REQ-39/40/41's deliberately-broken
 *     fixtures.
 *
 *  2. A **real 3-engine smoke UAT** (runIf all three binaries are provisioned)
 *     drives real Chromium/WebKit/Firefox over a clean module and asserts it
 *     passes — proving the wiring is live and the calibrated tolerance does not
 *     false-positive on genuine cross-engine font/AA jitter.
 */

// ── per-engine fake driver (mirrors the house FakeDriver in capture.test.ts) ──
class FakeEngineDriver implements BrowserDriver {
  constructor(
    private readonly boxes: XBrowserBox[],
    private readonly shot: Uint8Array,
  ) {}
  async navigate(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> {
    return this.shot
  }
  async query<T>(script: string): Promise<T> {
    return (script === X_BROWSER_BOX_PROBE ? { boxes: this.boxes } : {}) as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<!doctype html><html><body></body></html>'
  }
  async close(): Promise<void> {}
}

/** A `driverFactoryFor` that hands each engine its own canned boxes + screenshot. */
function fakeFactoryFor(
  boxesByEngine: Record<ConformanceEngine, XBrowserBox[]>,
  shotByEngine: Record<ConformanceEngine, Uint8Array>,
): (engine: ConformanceEngine) => () => Promise<BrowserDriver> {
  return (engine) => async () => new FakeEngineDriver(boxesByEngine[engine], shotByEngine[engine])
}

// ── controlled geometry ───────────────────────────────────────────────────────
// A well-formed module's boxes: a section, a heading, an absolutely-positioned
// layer child (the faelan calibration element) and a paragraph. Parent-relative.
const CLEAN_BOXES: XBrowserBox[] = [
  { i: 0, tag: 'section', label: 'section', dx: 0, dy: 0, w: 1280, h: 400 },
  { i: 1, tag: 'h1', label: 'h1: "Title"', dx: 40, dy: 40, w: 600, h: 48 },
  { i: 2, tag: 'div', label: 'div: layer child', dx: 0, dy: 100, w: 300, h: 40 },
  { i: 3, tag: 'p', label: 'p: "Body copy"', dx: 40, dy: 160, w: 600, h: 72 },
]

/** Clone the clean boxes, moving element `i` down by `ddy` px (a local shift). */
function withShift(i: number, ddy: number): XBrowserBox[] {
  return CLEAN_BOXES.map((b) => (b.i === i ? { ...b, dy: b.dy + ddy } : { ...b }))
}

/** Clone the clean boxes with sub-tolerance jitter on every element. */
function withJitter(dPos: number, dSize: number): XBrowserBox[] {
  return CLEAN_BOXES.map((b) => ({
    ...b,
    dx: b.dx + dPos,
    dy: b.dy + dPos,
    w: b.w + dSize,
    h: b.h + dSize,
  }))
}

// ── screenshots for the backstop (built as rasters → PNG bytes) ───────────────
const PNG_W = 160
const PNG_H = 240
function fillRaster(fill: [number, number, number]): Raster {
  const data = new Uint8Array(PNG_W * PNG_H * 3)
  for (let i = 0; i < data.length; i += 3) [data[i], data[i + 1], data[i + 2]] = fill
  return { data, width: PNG_W, height: PNG_H, channels: 3 }
}
/** White canvas with a solid black band across the middle third (a "moved" band). */
function bandedRaster(): Raster {
  const r = fillRaster([255, 255, 255])
  for (let y = Math.floor(PNG_H / 3); y < Math.floor((2 * PNG_H) / 3); y++) {
    for (let x = 0; x < PNG_W; x++) {
      const o = (y * PNG_W + x) * 3
      r.data[o] = r.data[o + 1] = r.data[o + 2] = 0
    }
  }
  return r
}

let WHITE_PNG: Uint8Array
let BANDED_PNG: Uint8Array
beforeAll(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'fc-req42-'))
  WHITE_PNG = new Uint8Array(readFileSync(await writeRasterPng(fillRaster([255, 255, 255]), path.join(dir, 'white.png'))))
  BANDED_PNG = new Uint8Array(readFileSync(await writeRasterPng(bandedRaster(), path.join(dir, 'banded.png'))))
})

const ENGINES: ConformanceEngine[] = ['chromium', 'webkit', 'firefox']
/** Same screenshot for every engine — isolates the box comparison from the backstop. */
function identicalShots(): Record<ConformanceEngine, Uint8Array> {
  return { chromium: WHITE_PNG, webkit: WHITE_PNG, firefox: WHITE_PNG }
}

/** A well-formed real catalog module — the served page for the fake-driver runs. */
const cleanFixture: ConformanceFixture = {
  label: 'clean-text-block',
  props: {
    version: 2,
    variant: 'prose',
    content: {
      // REQ-50 — the discrete heading slot is a flat styled run.
      heading: { text: 'A Cross-Engine Heading' },
      body: 'A well-formed paragraph that lays out equivalently in Blink, WebKit and Gecko.',
    },
  },
}

/** Run the harness and return the thrown ConformanceError (or null if it passed). */
async function conformanceErrorOf(
  fixture: ConformanceFixture,
  opts: Parameters<typeof assertModuleConforms>[2],
): Promise<ConformanceError | null> {
  return assertModuleConforms('text-block', [fixture], opts).then(
    () => null,
    (e: unknown) => e as ConformanceError,
  )
}

describe('Conformance harness cross-browser dimension (REQ-42)', () => {
  // ── unit-level proof of the discriminator (pure, no browser) ────────────────
  it('test_UAT_FC_REQ-42_layout_box_tolerance_respected', () => {
    // Sub-tolerance jitter on every element (3px position, 4px size — both below
    // the 6px / 12px tolerances) must NOT be flagged: this is the AA/font-metric
    // noise floor, not a real layout bug.
    const jitter = withJitter(3, 4)
    const violations = evaluateXBrowser('clean', '1280', 'webkit', CLEAN_BOXES, jitter, X_BROWSER_TOLERANCE)
    expect(violations).toEqual([])
  })

  it('test_UAT_FC_REQ-42_layout_box_shift_discriminated', () => {
    // A 22px (~1-line) shift of the layer child IS flagged, and only that element.
    const shifted = withShift(2, 22)
    const violations = evaluateXBrowser('faelan', '1280', 'webkit', CLEAN_BOXES, shifted, X_BROWSER_TOLERANCE)
    expect(violations).toHaveLength(1)
    expect(violations[0].ac).toBe('x-browser.layout-shift')
    expect(violations[0].message).toContain('layer child')
  })

  // ── end-to-end through the harness with per-engine fake drivers ─────────────
  it('test_UAT_FC_REQ-42_engine_consistent_module_passes', async () => {
    // Identical boxes + identical screenshots across all three engines: the
    // module lays out equivalently, so the harness passes with no violation.
    const boxes = { chromium: CLEAN_BOXES, webkit: CLEAN_BOXES, firefox: CLEAN_BOXES }
    await expect(
      assertModuleConforms('text-block', [cleanFixture], {
        dimension: 'x-browser',
        tier: 'full',
        engines: ENGINES,
        driverFactoryFor: fakeFactoryFor(boxes, identicalShots()),
      }),
    ).resolves.toBeUndefined()
  }, 60000)

  it('test_UAT_FC_REQ-42_webkit_shift_fixture_flagged', async () => {
    // The faelan calibration case: the layer child sits ~1 line lower in WebKit
    // and Firefox (percentage-`top` resolved against a different containing
    // block). Both engines are flagged; Chromium (the reference) is clean.
    const boxes = {
      chromium: CLEAN_BOXES,
      webkit: withShift(2, 22),
      firefox: withShift(2, 20),
    }
    const err = await conformanceErrorOf(cleanFixture, {
      dimension: 'x-browser',
      tier: 'full',
      engines: ENGINES,
      driverFactoryFor: fakeFactoryFor(boxes, identicalShots()),
    })
    expect(err).toBeInstanceOf(ConformanceError)
    const shifts = err!.violations.filter((v) => v.ac === 'x-browser.layout-shift')
    expect(shifts.map((v) => v.viewport).length).toBeGreaterThan(0)
    expect(shifts.some((v) => v.message.includes('webkit'))).toBe(true)
    expect(shifts.some((v) => v.message.includes('firefox'))).toBe(true)
  }, 60000)

  it('test_UAT_FC_REQ-42_layout_box_tolerance_respected_e2e', async () => {
    // The same sub-tolerance jitter, driven end-to-end through the harness, must
    // not produce a false positive — the module passes at every viewport.
    const boxes = {
      chromium: CLEAN_BOXES,
      webkit: withJitter(3, 4),
      firefox: withJitter(2, 5),
    }
    await expect(
      assertModuleConforms('text-block', [cleanFixture], {
        dimension: 'x-browser',
        tier: 'full',
        engines: ENGINES,
        driverFactoryFor: fakeFactoryFor(boxes, identicalShots()),
      }),
    ).resolves.toBeUndefined()
  }, 60000)

  it('test_UAT_FC_REQ-42_perceptual_backstop_catches_unboxed_move', async () => {
    // Boxes are identical across engines (the box list is blind to this change),
    // but WebKit's screenshot has a solid band the Chromium render does not — a
    // move outside the tracked element set. The perceptual backstop catches it.
    const boxes = { chromium: CLEAN_BOXES, webkit: CLEAN_BOXES, firefox: CLEAN_BOXES }
    const shots = { chromium: WHITE_PNG, webkit: BANDED_PNG, firefox: WHITE_PNG }
    const err = await conformanceErrorOf(cleanFixture, {
      dimension: 'x-browser',
      tier: 'full',
      engines: ['chromium', 'webkit'],
      driverFactoryFor: fakeFactoryFor(boxes, shots),
    })
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err!.violations.some((v) => v.ac === 'x-browser.perceptual')).toBe(true)
    expect(err!.violations.every((v) => v.ac !== 'x-browser.layout-shift')).toBe(true)
  }, 60000)

  it('test_UAT_FC_REQ-42_advisory_no_op_without_second_engine', async () => {
    // With only the reference engine available there is nothing to compare, so
    // the dimension is an advisory no-op (a runner missing WebKit/Firefox binaries
    // must not hard-fail the leaf) — DOC-20's advisory-on-missing-runner contract.
    await expect(
      assertModuleConforms('text-block', [cleanFixture], {
        dimension: 'x-browser',
        tier: 'full',
        engines: ['chromium'],
        driverFactoryFor: fakeFactoryFor(
          { chromium: withShift(2, 40), webkit: CLEAN_BOXES, firefox: CLEAN_BOXES },
          identicalShots(),
        ),
      }),
    ).resolves.toBeUndefined()
  }, 60000)
})

// ── real 3-engine smoke: proves the wiring + the tolerance's non-flakiness ────
const allEnginesReady =
  (await engineAvailable('chromium')) &&
  (await engineAvailable('webkit')) &&
  (await engineAvailable('firefox'))
const itReal = it.runIf(allEnginesReady)

describe('Conformance harness cross-browser dimension — real engines (REQ-42)', () => {
  itReal('test_UAT_FC_REQ-42_real_engines_clean_module_passes', async () => {
    // Drive real Chromium + WebKit + Firefox over a clean text-block. A
    // well-formed module lays out equivalently across engines within the
    // calibrated tolerance, and the perceptual backstop does not trip on genuine
    // cross-engine antialiasing — the run passes with no violation.
    await expect(
      assertModuleConforms('text-block', [cleanFixture], {
        dimension: 'x-browser',
        tier: 'full',
        viewports: [1280],
      }),
    ).resolves.toBeUndefined()
  }, 300000)
})
