/**
 * Reconciliation UATs — story-8acc338d "Fold a multi-viewport capture into one L1
 * reproduction document with advisory structural hints", the **seams + backdrops +
 * offline re-fold** upgrade (BUG-27 / REQ-96).
 *
 * The original text-only criteria (AC-689…AC-696) are proven in
 * tests/reconciliation-l1-fold.test.ts and the full-language ones (AC-729…AC-733)
 * in tests/reconciliation-l1-fold-full-language.test.ts. This file proves the
 * three criteria this upgrade added, one UAT per AC:
 *
 *   AC-812  a captured backdrop folds to a box leaf in the document's BACKGROUND
 *           layer (behind the runs of the band it sits under), its edges bound how
 *           far a reconstructed band may tile, and its fill counts toward the
 *           page-base inference
 *   AC-813  a captured form control folds to a `control` leaf whose geometry is
 *           rebased from the page origin to its form's seam — the reference's own
 *           field heights and its submit button's per-width position survive
 *   AC-814  a retained bundle re-folds OFFLINE, rewriting only what the fold
 *           derived (`l1.json` / `forms.json`) and leaving the oracle, screenshots,
 *           mirrored assets and hints byte-unchanged; a bundle with no retained
 *           ladder is rejected with a re-capture instruction
 *
 * Every probe drives a real entry point — `foldToL1` for the fold criteria and the
 * `1c` CLI (`cli.run(['refold', …])`) for the re-fold — over real components. The
 * only stub is the browser driver the capture needs to produce a bundle at all.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1, type FoldedForm, type FoldResidual } from '../tools/generate/src'
import * as cli from '../tools/generate/src/cli/index'
import {
  cmdCapturePage,
  HINTS_SCRIPT,
  type BrowserDriver,
  type CapturedResponse,
  type MultiStateCapture,
  type RawField,
  type RawSignals,
  type StateProjection,
  type StructuralHints,
  type ValueElement,
  type Viewport,
} from '../tools/generate/src/cli/capture'
import { bundleDirFor, fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'

/** The fixed sampled width ladder `1c capture page` walks. */
const LADDER = [320, 375, 768, 1024, 1280, 1440]

type Box = NonNullable<ValueElement['box']>

/** Build a resting `MultiStateCapture` over the ladder from a per-width element list. */
function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: { source: `fold@${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 1200 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** A styled text run at one width (has a box → folds to a real text leaf). */
function run(text: string, box: Box, over: Partial<ValueElement> = {}): ValueElement {
  return { text, role: 'body', color: '#111827', fontFamily: 'Inter', fontSizePx: 18, fontWeight: 400, box, ...over }
}

/** A text-free element at one width — the media / surface / backdrop / control shape. */
function textless(over: Partial<ValueElement> & Pick<ValueElement, 'role'>): ValueElement {
  return { text: '', color: '', fontFamily: '', fontSizePx: 0, fontWeight: 0, textless: true, ...over }
}

/** The root box's direct children — the folded leaves, in document order. */
function leavesOf(doc: ReturnType<typeof foldToL1>) {
  return doc.root.kind === 'box' ? (doc.root.children ?? []) : []
}

/**
 * The reference's own measurement at one width, read straight back out of the
 * retained oracle — so every assertion below is pinned to the ladder the fold
 * consumed, not to a number restated in the test.
 */
function oracleBox(multi: MultiStateCapture, width: number, key: string): Box {
  const projection = multi.projections.find((p) => p.viewport.width === width)
  const hit = projection?.manifest.elements.find((e) => (e.textless ? (e.accessibleName ?? '') : e.text) === key)
  if (!hit?.box) throw new Error(`no captured element '${key}' at ${width}px`)
  return hit.box
}

// ── AC-812: a captured backdrop folds into the background layer ───────────────

describe('AC-812 a captured backdrop folds to a box leaf in the background layer whose edges bound reconstructed bands', () => {
  const HERO_IMAGE = 'https://cdn.example.test/hero.jpg'
  const HERO_FILL = '#101014'
  const PAGE_FILL = '#ffffff'
  /** The hero backdrop's painted extent — its bottom edge is the surface change. */
  const HERO_BOTTOM = 600

  it('test_UAT_AC812_backdrop_folds_behind_content_bounds_bands_and_feeds_the_page_base', () => {
    // A nested full-bleed background PHOTOGRAPH over a solid fill, with a white
    // panel below it. The manifest lists a band's text-free elements AFTER that
    // band's runs, so the backdrop is emitted last here — exactly the order that
    // would paint the hero photograph over the hero's own headline if the fold
    // placed it in document order.
    const capture = multiFrom((w) => [
      // The hero headline, sitting ON the hero's dark fill.
      run('Nested Hero', { x: 0, y: 240, width: w, height: 60 }, { surfaceFill: HERO_FILL }),
      // The white panel below the hero — the fill the page is mostly painted in.
      ...[800, 1000, 1200, 1400, 1600, 1800].map((y, i) =>
        run(`Panel row ${i}`, { x: 0, y, width: w, height: 60 }, { surfaceFill: PAGE_FILL }),
      ),
      // …and the backdrop itself, captured at any depth (a nested `<section>`).
      textless({
        role: 'generic',
        a11yRole: 'generic',
        backgroundImageUrl: HERO_IMAGE,
        surfaceFill: HERO_FILL,
        box: { x: 0, y: 0, width: w, height: HERO_BOTTOM },
      }),
    ])
    const doc = foldToL1(capture)

    // (a) A box leaf carries the image handle AND the fill painted beneath it,
    //     with a geometry track pinning all four sides at every sampled width.
    const leaves = leavesOf(doc)
    const backdrops = leaves.filter((n) => n.kind === 'box' && n.axes?.backgroundImageUrl)
    expect(backdrops).toHaveLength(1)
    const backdrop = backdrops[0]
    if (backdrop.kind !== 'box') throw new Error('expected a box leaf')
    expect(backdrop.axes?.backgroundImageUrl).toBe(HERO_IMAGE)
    expect(backdrop.axes?.surfaceFill).toBe(HERO_FILL)
    expect(backdrop.geometry?.keyframes.map((k) => k.at)).toEqual(LADDER)
    for (const kf of backdrop.geometry!.keyframes) {
      expect(kf.x).toBe(0)
      expect(kf.y).toBe(0)
      expect(kf.width).toBe(kf.at)
      expect(kf.height).toBe(HERO_BOTTOM)
    }

    // (b) It is placed in the document's BACKGROUND layer — before the runs of the
    //     band it sits under — so the headline paints over it rather than under it.
    const backdropIndex = leaves.indexOf(backdrop)
    const firstTextIndex = leaves.findIndex((n) => n.kind === 'text')
    expect(backdropIndex).toBeGreaterThanOrEqual(0)
    expect(firstTextIndex).toBeGreaterThan(backdropIndex)
    // Strong observation: the same order survives into the rendered document, where
    // absolutely-positioned siblings with no z-index paint in source order.
    const { html, css } = renderL1Document(doc)
    expect(html.indexOf(`id="${backdrop.id}"`)).toBeGreaterThanOrEqual(0)
    expect(html.indexOf(`id="${backdrop.id}"`)).toBeLessThan(html.indexOf('Nested Hero'))
    expect(css).toContain(`background-image: url("${HERO_IMAGE}")`)

    // (c) The backdrop's top and bottom edges join the section-edge set, so the
    //     band reconstructed from the runs sitting on the hero fill stops at the
    //     backdrop's bottom edge instead of tiling one dark fill down the page.
    //     (This page's panels are all nested, so it yields no interior section
    //     edge of its own — the backdrop is the only evidence of the change.)
    const heroBands = leaves.filter(
      (n) => n.kind === 'box' && n.axes?.surfaceFill === HERO_FILL && !n.axes?.backgroundImageUrl,
    )
    expect(heroBands.length).toBeGreaterThan(0)
    for (const band of heroBands) {
      if (band.kind !== 'box') throw new Error('expected a box leaf')
      for (const kf of band.geometry!.keyframes) {
        expect(kf.y + (kf.height ?? 0), 'hero band stops at the backdrop edge').toBeLessThanOrEqual(HERO_BOTTOM + 1)
      }
    }

    // …and the clamp is the BACKDROP's doing: fold the same page with the backdrop
    // removed and the very same dark fill, with no edge to stop at, tiles past it.
    const withoutBackdrop = foldToL1(
      multiFrom((w) =>
        capture.projections
          .find((p) => p.viewport.width === w)!
          .manifest.elements.filter((e) => !e.backgroundImageUrl),
      ),
    )
    const unbounded = leavesOf(withoutBackdrop).filter(
      (n) => n.kind === 'box' && n.axes?.surfaceFill === HERO_FILL,
    )
    expect(
      unbounded.some((n) =>
        n.kind === 'box'
          ? n.geometry!.keyframes.some((kf) => kf.y + (kf.height ?? 0) > HERO_BOTTOM + 1)
          : false,
      ),
      'without the backdrop edge the hero fill tiles past the hero',
    ).toBe(true)

    // (d) The backdrop's fill counts toward the page-base inference alongside the
    //     reconstructed bands — and the inferred base is the fill the page is
    //     MOSTLY painted in (the white panel), not the hero's.
    expect(doc.background).toBe(PAGE_FILL)
    expect(css).toContain(`body { background-color: ${PAGE_FILL} }`)
  })
})

// ── AC-813: a form control folds to a control leaf rebased to its seam ────────

describe('AC-813 a captured form control folds to a control leaf rebased to its form seam', () => {
  /** Taller than any module default single-line control — the reference's own height. */
  const FIELD_H = 64
  const isWide = (w: number): boolean => w >= 1024

  /** A captured form control at one width. */
  function control(name: string, box: Box, over: Partial<ValueElement> = {}): ValueElement {
    return textless({ role: 'textbox', a11yRole: 'textbox', accessibleName: name, box, ...over })
  }

  const nameBox = (w: number): Box => ({ x: 40, y: 1000, width: isWide(w) ? 420 : w - 80, height: FIELD_H })
  const emailBox = (w: number): Box => ({ x: 40, y: 1080, width: isWide(w) ? 420 : w - 80, height: FIELD_H })
  // Beside its field at the wide rungs; stacked below it at the narrow ones.
  const submitBox = (w: number): Box =>
    isWide(w)
      ? { x: 480, y: 1080, width: 140, height: FIELD_H }
      : { x: 40, y: 1164, width: w - 80, height: 52 }

  const capture = (): MultiStateCapture =>
    multiFrom((w) => [
      run('Get in touch', { x: 40, y: 900, width: w - 80, height: 40 }),
      control('Your name', nameBox(w), { controlType: 'text', formAction: 'https://example.test/submit' }),
      control('Your email', emailBox(w), { controlType: 'email', formAction: 'https://example.test/submit' }),
      // The submit affordance carries text, so the capture reads it as a run.
      run('Send message', submitBox(w), { a11yRole: 'button' }),
    ])

  it('test_UAT_AC813_controls_fold_to_control_leaves_rebased_to_their_form_seam', () => {
    const multi = capture()
    const forms: FoldedForm[] = []
    const residuals: FoldResidual[] = []
    const doc = foldToL1(multi, { forms, residuals })

    // (a) One behaviour seam per form, pinned at the cluster's union rect per width
    //     (widened to hold the submit button matched to that form).
    const slots = leavesOf(doc).filter((n) => n.kind === 'slot')
    expect(slots).toHaveLength(1)
    expect(forms).toHaveLength(1)
    const seam = slots[0]
    if (seam.kind !== 'slot') throw new Error('expected a slot node')
    expect(forms[0].slot).toBe(seam.name)
    expect(forms[0].behavior).toBe('contact-form')

    const seamAt = new Map(seam.geometry!.keyframes.map((kf) => [kf.at, kf]))
    expect([...seamAt.keys()]).toEqual(LADDER)
    for (const w of LADDER) {
      const union = [nameBox(w), emailBox(w), submitBox(w)].reduce((a, b) => ({
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        width: Math.max(a.x + a.width, b.x + b.width) - Math.min(a.x, b.x),
        height: Math.max(a.y + a.height, b.y + b.height) - Math.min(a.y, b.y),
      }))
      const kf = seamAt.get(w)!
      expect([kf.x, kf.y, kf.width, kf.height]).toEqual([union.x, union.y, union.width, union.height])
    }

    // (b) Every control in the cluster folded to a `control` leaf naming the
    //     module-declared element it binds — no raw `<input>` was synthesized.
    const controls = new Map<string, { geometry?: { keyframes: Array<Record<string, number>> } }>()
    const walk = (n: { kind: string; control?: string; children?: unknown[] }): void => {
      if (n.kind === 'control' && n.control) controls.set(n.control, n as never)
      for (const c of (n.children ?? []) as Array<typeof n>) walk(c)
    }
    walk(forms[0].form as never)
    expect([...controls.keys()].sort()).toEqual(['submit', 'your-email', 'your-name'])
    expect(JSON.stringify(doc)).not.toContain('"input"')
    // A control that carries geometry binds; it is no longer a residual.
    expect(residuals.filter((r) => r.kind === 'field')).toEqual([])

    // (c) Each leaf's keyframe is the CAPTURED box offset by the seam's origin at
    //     the same width — only the ORIGIN moved; the measured width and height
    //     are the reference's, read back out of the retained oracle.
    const expected: Array<[string, string]> = [
      ['your-name', 'Your name'],
      ['your-email', 'Your email'],
      ['submit', 'Send message'],
    ]
    for (const [element, key] of expected) {
      const kfs = controls.get(element)!.geometry!.keyframes
      expect(kfs.map((k) => k.at)).toEqual(LADDER)
      for (const kf of kfs) {
        const captured = oracleBox(multi, kf.at, key)
        const s = seamAt.get(kf.at)!
        expect([kf.x, kf.y], `${element} @${kf.at} rebased to the seam`).toEqual([
          Math.round(captured.x - s.x!),
          Math.round(captured.y - s.y!),
        ])
        expect([kf.width, kf.height], `${element} @${kf.at} keeps its measured box`).toEqual([
          Math.round(captured.width),
          Math.round(captured.height),
        ])
      }
    }

    // (d) The reference's field heights survive the fold rather than being replaced
    //     by whatever a module's own defaults would place.
    for (const element of ['your-name', 'your-email']) {
      for (const kf of controls.get(element)!.geometry!.keyframes) expect(kf.height).toBe(FIELD_H)
    }

    // (e) …and so does the submit's per-width position: beside its field at the
    //     wide rungs, below it at the narrow ones, because each control carries
    //     its own geometry.
    const email = new Map(controls.get('your-email')!.geometry!.keyframes.map((k) => [k.at, k]))
    for (const kf of controls.get('submit')!.geometry!.keyframes) {
      const beside = email.get(kf.at)!
      if (isWide(kf.at)) {
        expect(kf.y, `submit is inline at ${kf.at}`).toBe(beside.y)
        expect(kf.x, `submit is right of its field at ${kf.at}`).toBeGreaterThan(beside.x + beside.width - 1)
      } else {
        expect(kf.y, `submit is stacked below its field at ${kf.at}`).toBeGreaterThanOrEqual(beside.y + beside.height)
      }
    }
  })
})

// ── AC-814: offline re-fold rewrites only what the fold derived ───────────────

/** Canned advisory hints — the sidecar a re-fold must leave byte-unchanged. */
const CANNED_HINTS: StructuralHints = {
  viewport: { width: 1280, height: 900 },
  mediaBreakpoints: [640, 1024],
  nodes: [
    {
      id: 0,
      parentId: null,
      tag: 'section',
      a11yRole: 'generic',
      position: 'relative',
      display: 'flex',
      parentLayout: null,
      widthUnit: 'percent',
      heightUnit: null,
      repeatCount: 1,
      box: { x: 0, y: 0, width: 1280, height: 400 },
    },
  ],
}

/** A captured form control, in the raw shape the extractor emits. */
function rawField(over: Partial<RawField> & Pick<RawField, 'accessibleName' | 'box'>): RawField {
  return {
    a11yRole: 'textbox',
    nameSource: 'label',
    borderRadiusPx: 6,
    boxShadow: null,
    backdropFilter: null,
    blendMode: null,
    opacity: 1,
    outline: null,
    pseudo: null,
    arrangement: null,
    zIndex: 0,
    filter: null,
    textShadow: null,
    maskEdge: null,
    transformRotateDeg: 0,
    transformScale: 1,
    motion: null,
    ...over,
  }
}

function signalsFor(width: number): RawSignals {
  return {
    viewport: { width, height: 900 },
    bands: [
      {
        box: { x: 0, y: 0, width, height: 900 },
        backgroundColor: '#ffffff',
        backgroundImage: 'none',
        colorScheme: 'light',
        fontFamily: 'Inter',
        textAlign: 'left',
        paddingTopPx: 40,
        paddingBottomPx: 40,
        overlay: null,
        contentAnchorRatio: 0.5,
        content: [
          {
            role: 'heading',
            text: 'Fluid Headline',
            color: '#111827',
            fontFamily: 'Inter',
            fontSizePx: 40,
            fontWeight: 700,
            fontStyle: null,
            textDecoration: null,
            textTransform: null,
            fontVariant: null,
            listMarker: null,
            lineHeightPx: 48,
            letterSpacingPx: 0,
            gradientCss: null,
            borderLeftWidthPx: 0,
            borderLeftColor: null,
            accentBox: null,
            paddingLeftPx: 0,
            paddingTopPx: 0,
            paddingRightPx: 0,
            paddingBottomPx: 0,
            textAlign: 'left',
            box: { x: 20, y: 120, width: width - 40, height: 60 },
            borderRadiusPx: 0,
            boxShadow: null,
            backdropFilter: null,
            blendMode: null,
            opacity: 1,
            outline: null,
            pseudo: null,
            a11yRole: 'heading',
            arrangement: null,
            zIndex: 0,
            filter: null,
            textShadow: null,
            maskEdge: null,
            transformRotateDeg: 0,
            transformScale: 1,
            motion: null,
          },
        ],
        items: [],
        // A real behaviour on the page, so the re-fold has a binding to report.
        fields: [
          rawField({
            accessibleName: 'Your name',
            controlType: 'text',
            box: { x: 20, y: 400, width: 280, height: 56 },
          }),
          rawField({
            accessibleName: 'Your email',
            controlType: 'email',
            box: { x: 20, y: 470, width: 280, height: 56 },
          }),
        ],
      },
    ],
    colorUsage: [{ hex: '#111827', usage: 'text', freq: 1 }],
    fontFaces: [],
    typeScale: [40],
    spacingScalePx: [40],
    containerMaxWidthPx: null,
    images: [],
    bodyBackground: '#ffffff',
  }
}

/** A fake CF-shaped driver: width-varying value signals, canned structural hints. */
class FakeDriver implements BrowserDriver {
  private width = 1280
  async navigate(_url: string, viewport?: Viewport): Promise<void> {
    if (viewport) this.width = viewport.width
  }
  async screenshot(): Promise<Uint8Array> {
    return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  }
  async query<T>(script: string): Promise<T> {
    if (script === HINTS_SCRIPT) return CANNED_HINTS as T
    return signalsFor(this.width) as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<html><body>Fluid Headline</body></html>'
  }
  async close(): Promise<void> {}
}

/** Every file in a bundle, relative path → sha256 of its bytes. */
function fingerprint(dir: string): Map<string, string> {
  const out = new Map<string, string>()
  const walk = (rel: string): void => {
    for (const entry of readdirSync(path.join(dir, rel))) {
      const next = path.join(rel, entry)
      if (statSync(path.join(dir, next)).isDirectory()) walk(next)
      else out.set(next, createHash('sha256').update(readFileSync(path.join(dir, next))).digest('hex'))
    }
  }
  walk('')
  return out
}

describe('AC-814 a retained bundle can be re-folded offline, rewriting only what the fold derived', () => {
  const tmpDirs: string[] = []
  afterAll(() => {
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('test_UAT_AC814_refold_is_offline_rewrites_only_derived_artifacts_and_demands_an_oracle', async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'ac814-'))
    tmpDirs.push(cwd)
    const captured = await cmdCapturePage('http://fixture.test/', fsReferenceStore(cwd), {
      driverFactory: async () => new FakeDriver(),
      isEngineAvailable: async () => true,
    })
    const bundle = bundleDirFor(cwd, captured.capture)
    const freshL1 = readFileSync(path.join(bundle, 'l1.json'), 'utf8')
    const freshForms = readFileSync(path.join(bundle, 'forms.json'), 'utf8')
    const before = fingerprint(bundle)

    // Simulate a fold whose output has moved on from what this bundle stores: the
    // two DERIVED artifacts are stale, everything observed is not. (Re-capturing
    // would pick a fold change up only by re-rolling the oracle in the same step —
    // which is exactly what the re-fold exists to avoid.)
    writeFileSync(path.join(bundle, 'l1.json'), JSON.stringify({ widths: [], root: { kind: 'box' }, stale: true }))
    writeFileSync(path.join(bundle, 'forms.json'), JSON.stringify([{ stale: true }]))

    // The network is unavailable: a re-fold that reached for the captured origin
    // would fail here rather than quietly succeed.
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('network unavailable during re-fold')
    })
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {})

    process.exitCode = 0
    await cli.run(['refold', '--ref', bundle])

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(0)

    // (a) The re-folded document is the SAME document a fresh capture of those
    //     bytes would fold — the fold change is picked up, the reference is not
    //     re-rolled.
    expect(readFileSync(path.join(bundle, 'l1.json'), 'utf8')).toBe(freshL1)
    expect(readFileSync(path.join(bundle, 'forms.json'), 'utf8')).toBe(freshForms)

    // (b) A re-fold rewrites ONLY what the fold produced: the retained ladder, the
    //     screenshots, the mirrored assets and the advisory hints are byte-unchanged.
    const after = fingerprint(bundle)
    expect([...after.keys()].sort()).toEqual([...before.keys()].sort())
    const changed = [...after.keys()].filter((f) => after.get(f) !== before.get(f))
    expect(changed).toEqual([])
    for (const untouched of ['multistate.json', 'hints.json', 'capture.json', 'screenshot.full.png']) {
      expect(after.get(untouched), `${untouched} untouched`).toBe(before.get(untouched))
    }

    // (c) It reports what it rewrote: node count, forms and residuals.
    const report = stdout.mock.calls.map((c) => String(c[0])).join('\n')
    expect(report).toContain(`Refolded ${bundle}`)
    expect(report).toMatch(/l1\.json: [1-9]\d* node\(s\)/)
    expect(report).toMatch(/forms\.json: 1 behaviour binding\(s\)/)
    expect(report).toContain("contact-form → slot 'form-0'")
    expect(report).toMatch(/fold residuals: \d+/)

    // (d) A bundle carrying no retained ladder has no oracle to re-fold: it is
    //     rejected with a message naming re-capture as the remedy, rather than
    //     producing a document from nothing.
    const ladderless = path.join(cwd, 'ladderless-bundle')
    mkdirSync(ladderless, { recursive: true })
    writeFileSync(path.join(ladderless, 'capture.json'), readFileSync(path.join(bundle, 'capture.json')))
    await expect(cli.run(['refold', '--ref', ladderless])).rejects.toThrow(/re-capture with `1c capture page/)
    expect(existsSync(path.join(ladderless, 'l1.json'))).toBe(false)
    expect(existsSync(path.join(ladderless, 'forms.json'))).toBe(false)
  })
})
