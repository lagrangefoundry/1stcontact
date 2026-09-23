/**
 * REQ-265 — two values the capture could not see, and what each cost.
 *
 * **1. A run's box was two different rects wearing one name.** For a BLOCK
 * element `getBoundingClientRect()` returns the border box, whose top is the top
 * of the first line box. For a non-replaced INLINE element it returns the union
 * of its fragments' *content areas* — the font's ascent+descent at that size,
 * which has nothing to do with `line-height`. Nothing downstream could tell the
 * two apart, so the fold transcribed an inline run's content-area top as an L1
 * line-box top and the renderer placed the glyphs half a leading away from where
 * the reference painted them.
 *
 * Measured on gigabytealchemy.ai: the wordmark reported `y=79, height=97`
 * against `line-height: 90`, and a ±6px shift search of the stored crops found
 * every one of the wordmark's five ranked regions aligned at exactly `dy=+4`
 * (residual 27–34/255 → 1.5–3.0). That single 3.5px was 82% of the whole
 * reproduction's ranked pixel residual, and its only HIGH `values-diff` delta
 * (`gap 142px → 149px`, which is `97 − 90`).
 *
 * The fix is one conversion, at capture, where the computed style that resolves
 * it is already in hand: **a text run's `box` is the line box it occupies.** The
 * content area is not lost — it is `renderedTextBox`, which for these runs is
 * exactly the rect this replaces.
 *
 * **2. A placeholder's ink was expressible by nothing at all.** `::placeholder`
 * is a UA pseudo-element that inherits nothing, so no axis on the control
 * describes it and no geometry field can see it; the capture never read it, L1
 * had no axis for it, and the renderer hard-coded one behaviour for every
 * document (re-point the pseudo-element at the field's own colour). A reference
 * that deliberately kept the browser's grey was therefore *unauthorable*: setting
 * the field's `color` to that grey would have greyed the typed text too. Four
 * gigabytealchemy fields painted `#000000` where the reference paints `#746f69`
 * — 17% of the ranked residual, with `deltaCount: 0` on all four.
 *
 * The browser UATs drive a REAL headless Chromium against a committed fixture
 * over an ephemeral loopback server (no third-party site). The rest pin the
 * downstream consequences — fold, schema, renderer, values-diff — with no browser
 * at all.
 */
import { describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  chromiumAvailable,
  cmdCapturePage,
  type Capture,
  type ContentRun,
  type Field,
} from '../tools/generate/src/cli/capture'
import { diffManifests, type StateProjection, type ValueElement, type ValueManifest } from '../tools/generate/src/cli'
import type { MultiStateCapture } from '../tools/generate/src/cli/capture'
import { foldToL1 } from '../tools/generate/src'
import type { FoldedForm } from '../tools/generate/src/l1'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'
import { renderL1Fragment } from '../packages/framework/src/l1/render'
import { contactFormControls } from '../packages/framework/src/modules/contact-form/controls'
import { validateL1 } from '../packages/site-schema/src/index'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

const allRuns = (c: Capture): ContentRun[] =>
  c.sections.flatMap((s) => [...s.content, ...s.items.flatMap((i) => i.content)])
const allFields = (c: Capture): Field[] => c.sections.flatMap((s) => s.fields ?? [])

const runByText = (c: Capture, text: string): ContentRun => {
  const run = allRuns(c).find((r) => (r.text ?? '').trim() === text)
  expect(run, `run "${text}" captured`).toBeDefined()
  return run!
}
const fieldByName = (c: Capture, name: string): Field => {
  const field = allFields(c).find((f) => f.accessibleName === name)
  expect(field, `control "${name}" captured`).toBeDefined()
  return field!
}

/** The vertical centre of a rect — the axis the half-leading is symmetric about. */
const midY = (b: { y: number; height: number }): number => b.y + b.height / 2

async function captureFixture(): Promise<Capture> {
  const server = await serveDir(FIXTURES)
  const cwd = mkdtempSync(path.join(tmpdir(), 'req265-'))
  try {
    const { capture } = await cmdCapturePage(
      `${server.origin}/req265-line-box-and-placeholder.html`,
      fsReferenceStore(cwd),
    )
    return capture
  } finally {
    await server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
}

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// Captured once and shared — every browser UAT asks a different question of the
// same page, and a real Chromium run is the expensive part.
const fixture: Capture | undefined = browserOk ? await captureFixture() : undefined

describe("REQ-265 — a text run's box is the line box it occupies", () => {
  // ── 1. An inline run whose content area is TALLER than its line box ─────────
  itB('test_UAT_FC_REQ-265_inline_run_box_is_its_line_box', () => {
    const run = runByText(fixture!, 'Gigabyte Alchemy')
    expect(run.lineHeightPx).toBe(60)
    expect(run.box).toBeDefined()
    expect(run.renderedTextBox).toBeDefined()
    const box = run.box!
    const glyphs = run.renderedTextBox!

    // The box IS the line box: one line, so exactly one line-height tall.
    expect(box.height).toBeCloseTo(60, 1)

    // The content area this replaces is still recorded, and it is a DIFFERENT
    // rect — which is the whole of the defect: transcribing one as the other put
    // the glyphs half a leading out. At 72px no real font's ascent+descent fits
    // in 60px, so the rect's top sat ABOVE the line box (the reference's sign).
    expect(glyphs.height).toBeGreaterThan(box.height)
    expect(box.y).toBeGreaterThan(glyphs.y + 1)

    // CSS centres the content area inside the line box, so the two share a centre
    // line. That relation is the conversion, stated as the invariant it is.
    expect(Math.abs(midY(box) - midY(glyphs))).toBeLessThan(1)
  })

  // ── 2. …and one whose line box is roomier, so the correction has the other sign ──
  itB('test_UAT_FC_REQ-265_inline_run_line_box_is_corrected_in_both_directions', () => {
    const run = runByText(fixture!, 'Roomy inline run')
    expect(run.lineHeightPx).toBe(60)
    const box = run.box!
    const glyphs = run.renderedTextBox!

    expect(box.height).toBeCloseTo(60, 1)
    // 20px of type in a 60px line box: the content area is well inside it, so the
    // rect's top sits BELOW the line box and the correction moves the box UP.
    expect(glyphs.height).toBeLessThan(box.height)
    expect(box.y).toBeLessThan(glyphs.y - 1)
    expect(Math.abs(midY(box) - midY(glyphs))).toBeLessThan(1)
  })

  // ── 3. The block path is untouched ─────────────────────────────────────────
  itB('test_UAT_FC_REQ-265_block_run_box_is_still_its_border_box', () => {
    const run = runByText(fixture!, 'Intentional Software')
    const box = run.box!
    const glyphs = run.renderedTextBox!

    // A block's box is the CONTAINER's width, not the glyph extent — the signature
    // that this rect is still the element's own, unconverted.
    expect(box.width).toBeGreaterThan(1000)
    expect(glyphs.width).toBeLessThan(box.width - 100)

    // And its top is the BORDER box's top: 24px of padding above the first line
    // box, which is 90px tall and centres the content area. A conversion that had
    // leaked onto the block path would have eaten exactly that padding.
    expect(run.lineHeightPx).toBe(90)
    expect(box.y + 24 + 90 / 2).toBeCloseTo(midY(glyphs), 0)
  })

  // ── 4. The number the fold writes, from the reference's own measurements ────
  it('test_UAT_FC_REQ-265_fold_pins_the_line_box_the_capture_recorded', () => {
    // gigabytealchemy's wordmark, exactly as the ticket measured it: a content
    // area of 97px at y=79 inside a 90px line box, so the line box top is
    // 79 + (97 − 90) / 2 = 82.5 — which is what the capture now records as `box`.
    const LADDER = [1024, 1280, 1440]
    const wordmark = (): ValueElement =>
      ({
        role: 'heading',
        text: 'Gigabyte Alchemy',
        color: '#f5e6a3',
        fontFamily: 'Cinzel, serif',
        fontSizePx: 72,
        fontWeight: 600,
        lineHeightPx: 90,
        box: { x: 88, y: 82.5, width: 685.3125, height: 90 },
        renderedTextBox: { x: 88, y: 79, width: 685.3125, height: 97 },
      }) as ValueElement

    const projections: StateProjection[] = LADDER.map((w) => ({
      engine: 'chromium',
      viewport: { width: w, height: 800 },
      state: 'rest',
      manifest: {
        source: `t:${w}`,
        elements: [wordmark()],
        sections: [] as never,
        viewport: { width: w, height: 800 },
      },
    }))
    const ms: MultiStateCapture = { url: 'http://fixture.test/', notes: [], projections }

    const nodes: Array<Record<string, unknown>> = []
    const walk = (n: Record<string, unknown>): void => {
      nodes.push(n)
      for (const c of (n.children as Array<Record<string, unknown>>) ?? []) walk(c)
    }
    walk(foldToL1(ms).root as never)
    const node = nodes.find((n) => n.kind === 'text' && n.text === 'Gigabyte Alchemy')
    expect(node, 'the wordmark folded to a text leaf').toBeDefined()
    const kf = (node!.geometry as { keyframes: Array<{ at: number; y: number }> }).keyframes
    // The ticket's stated right answer: the line-box top, not the 79 the
    // content-area rect used to hand over. Rendered at that top, the 90px line
    // box centres the 97px content area back onto the reference's own 79.
    //
    // REQ-302 — the value is 82.5 rather than 83 because the fold now writes
    // derived geometry at two decimals instead of rounding to a whole pixel.
    // What REQ-265 pins is unchanged and is the DISTINCTION, not the integer:
    // the line-box top, which is 3.5px below the content-area top it replaced.
    for (const k of kf) expect(k.y, `keyframe at ${k.at}`).toBe(82.5)
    for (const k of kf) expect(k.y, `keyframe at ${k.at} is not the content area`).not.toBe(79)
  })
})

describe('REQ-265 — a control can say what colour its placeholder paints', () => {
  // ── 5. The capture reads it — in every shape an engine hands it over in ────
  itB('test_UAT_FC_REQ-265_capture_records_the_placeholder_ink', () => {
    // An authored, opaque colour is recorded verbatim.
    expect(fieldByName(fixture!, 'Your stated email').placeholderColor).toBe('#746f69')

    // A field that authors nothing still HAS a placeholder colour — the engine's
    // own — and it is a value like any other. Chromium's computes opaque
    // (measured: rgb(117, 117, 117)), so it is taken as it stands.
    expect(fieldByName(fixture!, 'Your default message').placeholderColor).toBe('#757575')

    // Tailwind v4's preflight rule, verbatim: an oklab color-mix at 50% alpha.
    // Two ways to lose it, and both are closed here — the computed value does not
    // serialise as rgb()/rgba() so the cheap regex reads nothing (REQ-52's lesson
    // in a second place), and it is translucent, so the declared value is not what
    // the eye reads. What is recorded must lie strictly between the ink it mixes
    // and the band it mixes onto.
    const faded = fieldByName(fixture!, 'Your faded number').placeholderColor
    expect(faded, 'a modern-colour-space placeholder is resolved, not dropped').toBeTruthy()
    const channels = (hex: string): number[] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
    const ink = channels('#101010')
    const band = channels('#e8dfd3')
    channels(faded!).forEach((ch, i) => {
      expect(ch, `channel ${i} is above the ink it mixes`).toBeGreaterThan(ink[i])
      expect(ch, `channel ${i} is below the band it mixes onto`).toBeLessThan(band[i])
    })

    // A control with no placeholder has no placeholder ink. Nothing is invented.
    expect(fieldByName(fixture!, 'No placeholder here').placeholderColor ?? null).toBeNull()
  })

  // ── 6. L1 can carry it, and is no less strict for it ───────────────────────
  it('test_UAT_FC_REQ-265_l1_accepts_a_placeholder_colour_on_a_control', () => {
    const doc = (axes: Record<string, unknown>) => ({
      widths: [1280],
      root: {
        kind: 'box' as const,
        children: [
          {
            kind: 'control',
            control: 'email',
            axes,
            geometry: { keyframes: [{ at: 1280, x: 0, y: 0, width: 320, height: 50 }] },
          },
        ],
      },
    })
    expect(validateL1(doc({ color: '#101010', placeholderColor: '#746f69' })).ok).toBe(true)
    // The axis bag is still closed: it gained one name, not permission.
    expect(validateL1(doc({ color: '#101010', placeholderInk: '#746f69' })).ok).toBe(false)
  })

  // ── 7. The renderer paints it, and keeps today's behaviour without it ──────
  it('test_UAT_FC_REQ-265_renderer_paints_the_authored_placeholder_ink', () => {
    const controls = contactFormControls(
      [{ name: 'email', label: 'Your email', labelMode: 'placeholder', type: 'email', required: true }],
      'Send',
    )
    const authored = renderL1Fragment(
      [{ kind: 'control', control: 'email', axes: { color: '#101010', placeholderColor: '#746f69' } }],
      'cf',
      controls,
    )
    expect(authored.css).toMatch(/::placeholder\s*\{[^}]*color:\s*#746f69/)
    // The typed text keeps its OWN colour — which is why `color` could never have
    // stood in for this axis.
    expect(authored.css).toMatch(/color: #101010/)

    // Absent, the pre-REQ-265 default is unchanged: a document that never heard of
    // this axis renders exactly as it did.
    const silent = renderL1Fragment(
      [{ kind: 'control', control: 'email', axes: { color: '#101010' } }],
      'cf',
      controls,
    )
    expect(silent.css).toMatch(/::placeholder\s*\{[^}]*color:\s*inherit/)
  })

  // ── 8. The fold authors it from the capture ────────────────────────────────
  it('test_UAT_FC_REQ-265_fold_authors_the_captured_placeholder_ink', () => {
    const control = (name: string, y: number, ink: string | null): ValueElement =>
      ({
        role: 'textbox',
        text: name,
        color: '',
        fontFamily: '',
        fontSizePx: 0,
        fontWeight: 0,
        textless: true,
        a11yRole: 'textbox',
        accessibleName: name,
        nameSource: 'placeholder',
        controlType: 'text',
        box: { x: 88, y, width: 320, height: 50 },
        ...(ink ? { placeholderColor: ink } : {}),
      }) as ValueElement

    const projections: StateProjection[] = [1024, 1280, 1440].map((w) => ({
      engine: 'chromium',
      viewport: { width: w, height: 800 },
      state: 'rest',
      manifest: {
        source: `t:${w}`,
        elements: [control('Your name', 200, '#746f69'), control('Your email', 262, '#746f69')],
        sections: [] as never,
        viewport: { width: w, height: 800 },
      },
    }))
    const forms: FoldedForm[] = []
    foldToL1({ url: 'http://fixture.test/', notes: [], projections }, { forms })
    expect(forms.length, 'the two controls clustered into one form').toBe(1)
    const controls = (forms[0].form as { children?: Array<{ axes?: { placeholderColor?: string } }> }).children ?? []
    expect(controls.length).toBeGreaterThanOrEqual(2)
    for (const c of controls) expect(c.axes?.placeholderColor).toBe('#746f69')
  })

  // ── 9. …and the diff can finally see it ────────────────────────────────────
  it('test_UAT_FC_REQ-265_values_diff_reports_a_placeholder_ink_difference', () => {
    const control = (ink?: string): ValueElement =>
      ({
        role: 'textbox',
        text: 'Your email',
        color: '',
        fontFamily: '',
        fontSizePx: 0,
        fontWeight: 0,
        textless: true,
        a11yRole: 'textbox',
        accessibleName: 'Your email',
        nameSource: 'placeholder',
        box: { x: 88, y: 200, width: 320, height: 50 },
        ...(ink ? { placeholderColor: ink } : {}),
      }) as ValueElement
    const mani = (source: string, el: ValueElement): ValueManifest =>
      ({ source, elements: [el], sections: [] }) as ValueManifest
    const props = (d: { property: string }[]): string[] => d.map((x) => x.property)

    // The gigabytealchemy shape: same name, same box, same everything the diff
    // used to compare — and the whole of the placeholder's ink different.
    const seen = diffManifests(mani('ref', control('#746f69')), mani('act', control('#000000')))
    expect(props(seen.deltas)).toContain('placeholderColor')

    // Agreement is silent…
    const agree = diffManifests(mani('ref', control('#746f69')), mani('act', control('#746f69')))
    expect(props(agree.deltas)).not.toContain('placeholderColor')

    // …and a reference captured before this value existed stays inert rather than
    // reporting every reproduction's placeholder as wrong.
    const old = diffManifests(mani('ref', control()), mani('act', control('#000000')))
    expect(props(old.deltas)).not.toContain('placeholderColor')
  })
})
