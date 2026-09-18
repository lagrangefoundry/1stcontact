/**
 * REQ-269 — five residuals a passing gate could not see, and what each cost.
 *
 * Loop 1 iteration 1 of `repro-gigabytealchemy-ai` returned `pass` with **0 value
 * deltas** against a perceptual floor 25× above the measured mean, so the coverage
 * finding, the delta count and the ten ranked regions were never consulted. Each
 * residual below is invisible to both numbers, for a different reason:
 *
 * **1. A captured form field's padding was never recorded.** The renderer's UA
 * reset pushes `padding: 0` into every control's base rule and there was no axis
 * to win against it, so all four reproduced placeholders painted hard against
 * their field's left edge. 788.33 of the 1051.13 ranked region score — 7 of the 10
 * regions. Invisible because a control compares only name/nameSource/
 * placeholderColor/box: neither side carried padding, so the two agreed by
 * construction.
 *
 * **2. `line-height` was rounded to a whole pixel, twice** — once at capture, once
 * in the fold. `leading-relaxed` at 18px is 29.25px; recorded as 29, every wrapped
 * paragraph walks a quarter-pixel per line. The other 262.80 of the score,
 * including the highest-mean region. Invisible because both sides of a diff run
 * the same extraction script, so the error is symmetric and reads as agreement.
 *
 * **3. The `href` was read to decide an a11y role and then discarded**, so `href`
 * occurred zero times in a bundle and L1's `link` axis (REQ-106) had nothing to
 * write — no reproduction of any site could carry a working link.
 *
 * **4. L1 could not say "this run is a heading".** `.strict()` meant a document
 * that invented the field was rejected rather than ignored, so a reproduced page
 * had no document outline at all: 11 runs `heading` → `generic`, 12 heading tags →
 * zero. This one moves no pixel, which is exactly why it needed a decision — see
 * {@link l1HeadingSchema} for the two arguments that admit it.
 *
 * **5. An L1 render has no section bands.** `render.ts` emits one element into
 * `<body>` and the extractor's bands are the `<body>` children, so every
 * reproduction segmented into a single body-spanning band and `values-diff` said
 * in its own words that `overlay`, `contentAnchor` and `textAlign` were UNMEASURED
 * — on every reproduction of every site, not just this one.
 *
 * The browser UATs drive a REAL headless Chromium against committed fixtures over
 * an ephemeral loopback server (no third-party site). The rest pin the downstream
 * consequences — fold, schema, validator, renderer, values-diff — with no browser.
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

async function captureFixture(page: string): Promise<{ capture: Capture; origin: string }> {
  const server = await serveDir(FIXTURES)
  const cwd = mkdtempSync(path.join(tmpdir(), 'req269-'))
  try {
    const { capture } = await cmdCapturePage(`${server.origin}/${page}`, fsReferenceStore(cwd))
    return { capture, origin: server.origin }
  } finally {
    await server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
}

const allRuns = (c: Capture): ContentRun[] =>
  c.sections.flatMap((s) => [...s.content, ...s.items.flatMap((i) => i.content)])
const allFields = (c: Capture): Field[] => c.sections.flatMap((s) => s.fields ?? [])

const runStartingWith = (c: Capture, text: string): ContentRun => {
  const run = allRuns(c).find((r) => (r.text ?? '').trim().startsWith(text))
  expect(run, `run "${text}" captured`).toBeDefined()
  return run!
}
const fieldByName = (c: Capture, name: string): Field => {
  const field = allFields(c).find((f) => f.accessibleName === name)
  expect(field, `control "${name}" captured`).toBeDefined()
  return field!
}

/** Walk an L1 tree to a flat node list. */
const walkNodes = (root: unknown): Array<Record<string, unknown>> => {
  const out: Array<Record<string, unknown>> = []
  const visit = (n: Record<string, unknown>): void => {
    out.push(n)
    for (const c of (n.children as Array<Record<string, unknown>>) ?? []) visit(c)
  }
  visit(root as Record<string, unknown>)
  return out
}

/** A ladder of identical projections — the fold's minimum viable input. */
const ladderOf = (elements: ValueElement[]): MultiStateCapture => ({
  url: 'http://fixture.test/',
  notes: [],
  projections: [1024, 1280, 1440].map(
    (w): StateProjection => ({
      engine: 'chromium',
      viewport: { width: w, height: 800 },
      state: 'rest',
      manifest: {
        source: `t:${w}`,
        elements: elements.map((e) => ({ ...e })),
        sections: [] as never,
        viewport: { width: w, height: 800 },
      },
    }),
  ),
})

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// Captured once each and shared — every browser UAT asks a different question of
// the same page, and a real Chromium run is the expensive part.
const residuals: Capture | undefined = browserOk ? (await captureFixture('req269-residuals.html')).capture : undefined
const flat: Capture | undefined = browserOk ? (await captureFixture('req269-flat-render.html')).capture : undefined

describe('REQ-269 — a form field records the inset its content sits in', () => {
  // ── 1. The capture reads it, per side, and does not invent one ─────────────
  itB('test_UAT_FC_REQ-269_capture_records_a_form_field_padding', () => {
    // `px-4 py-3`, which is what the reference paints on all four of its controls.
    for (const name of ['Your name', 'Your message']) {
      const field = fieldByName(residuals!, name)
      expect(field.paddingTopPx, `${name} top`).toBe(12)
      expect(field.paddingRightPx, `${name} right`).toBe(16)
      expect(field.paddingBottomPx, `${name} bottom`).toBe(12)
      expect(field.paddingLeftPx, `${name} left`).toBe(16)
    }
    // A control that authors none records none — "recorded" is not "recorded the
    // same number for everything".
    const bare = fieldByName(residuals!, 'Unpadded field')
    expect(bare.paddingLeftPx).toBe(0)
    expect(bare.paddingTopPx).toBe(0)
  })

  // ── 2. The fold authors it onto the control leaf ───────────────────────────
  it('test_UAT_FC_REQ-269_fold_authors_the_captured_control_padding', () => {
    const control = (name: string, y: number, pad: boolean): ValueElement =>
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
        ...(pad ? { paddingTopPx: 12, paddingRightPx: 16, paddingBottomPx: 12, paddingLeftPx: 16 } : {}),
      }) as ValueElement

    const forms: FoldedForm[] = []
    foldToL1(ladderOf([control('Your name', 200, true), control('Your email', 262, true)]), { forms })
    expect(forms.length, 'the two controls clustered into one form').toBe(1)
    const controls =
      (forms[0].form as { children?: Array<{ padding?: Record<string, number> }> }).children ?? []
    expect(controls.length).toBeGreaterThanOrEqual(2)
    for (const c of controls) {
      expect(c.padding, 'the control leaf carries the captured inset').toEqual({
        topPx: 12,
        rightPx: 16,
        bottomPx: 12,
        leftPx: 16,
      })
    }

    // A pre-REQ-269 bundle carries no padding sides, so nothing is authored and
    // that document folds exactly as it did.
    const old: FoldedForm[] = []
    foldToL1(ladderOf([control('Your name', 200, false), control('Your email', 262, false)]), { forms: old })
    const oldControls = (old[0].form as { children?: Array<{ padding?: unknown }> }).children ?? []
    for (const c of oldControls) expect(c.padding ?? null).toBeNull()
  })

  // ── 3. …and the renderer's zero-look reset no longer governs ───────────────
  it('test_UAT_FC_REQ-269_renderer_honours_a_control_padding_over_its_reset', () => {
    const controls = contactFormControls(
      [{ name: 'name', label: 'Your name', labelMode: 'placeholder', type: 'text', required: true }],
      'Send',
    )
    const out = renderL1Fragment(
      [
        {
          kind: 'control',
          control: 'name',
          axes: { color: '#101010' },
          padding: { topPx: 12, rightPx: 16, bottomPx: 12, leftPx: 16 },
        },
      ],
      'cf',
      controls,
    )
    // The reset is still emitted (a control still arrives with UA chrome)…
    expect(out.css).toMatch(/padding: 0/)
    // …and the authored axis is emitted after it, so it wins.
    expect(out.css).toMatch(/padding-left: 16px/)
    expect(out.css).toMatch(/padding-top: 12px/)
    expect(out.css.indexOf('padding: 0')).toBeLessThan(out.css.indexOf('padding-left: 16px'))
  })

  // ── 4. And the gate can finally see a difference it used to agree on ───────
  it('test_UAT_FC_REQ-269_values_diff_reports_a_control_padding_difference', () => {
    const control = (pad: number | null): ValueElement =>
      ({
        role: 'textbox',
        text: 'Your message',
        color: '',
        fontFamily: '',
        fontSizePx: 0,
        fontWeight: 0,
        textless: true,
        a11yRole: 'textbox',
        accessibleName: 'Your message',
        nameSource: 'placeholder',
        box: { x: 664, y: 3916, width: 528, height: 146 },
        ...(pad === null ? {} : { paddingLeftPx: pad, paddingTopPx: pad === 0 ? 0 : 12 }),
      }) as ValueElement
    const mani = (source: string, el: ValueElement): ValueManifest =>
      ({ source, elements: [el], sections: [] }) as ValueManifest
    const props = (d: { property: string }[]): string[] => d.map((x) => x.property)

    // The gigabytealchemy shape: the reference insets 16px, the reproduction zero.
    expect(props(diffManifests(mani('ref', control(16)), mani('act', control(0))).deltas)).toContain('paddingLeftPx')
    // Agreement is silent…
    expect(props(diffManifests(mani('ref', control(16)), mani('act', control(16))).deltas)).not.toContain(
      'paddingLeftPx',
    )
    // …and a reference captured before this value existed stays inert rather than
    // reporting every reproduction's control padding as wrong.
    expect(props(diffManifests(mani('ref', control(null)), mani('act', control(0))).deltas)).not.toContain(
      'paddingLeftPx',
    )
  })
})

describe('REQ-269 — a line-height keeps the fraction the reference paints', () => {
  // ── 5. The capture keeps two decimals, exactly as letter-spacing already did ──
  itB('test_UAT_FC_REQ-269_capture_keeps_a_fractional_line_height', () => {
    // 18 × 1.625 = 29.25 — the value the whole-pixel round turned into 29.
    expect(runStartingWith(residuals!, 'We are a software studio').lineHeightPx).toBeCloseTo(29.25, 2)
    // A whole-pixel leading is unchanged: this is precision, not a blanket shift.
    expect(runStartingWith(residuals!, 'Whole-pixel leading').lineHeightPx).toBe(32)
  })

  // ── 6. …and so does the fold, on both the scalar and the responsive track ──
  it('test_UAT_FC_REQ-269_fold_and_renderer_keep_the_fractional_line_height', () => {
    const para = (lh: number, w: number): ValueElement =>
      ({
        role: 'body',
        text: 'We are a software studio building tools',
        color: '#f5e6a3',
        fontFamily: 'Georgia, serif',
        fontSizePx: 18,
        fontWeight: 400,
        lineHeightPx: lh,
        box: { x: 88, y: 452, width: w, height: 79.5 },
      }) as ValueElement

    // Static: one value across the ladder stays a scalar and keeps its fraction.
    const flatDoc = foldToL1(ladderOf([para(29.25, 420)]))
    const node = walkNodes(flatDoc.root).find((n) => n.kind === 'text')
    expect((node!.axes as { lineHeightPx?: number }).lineHeightPx).toBeCloseTo(29.25, 2)

    // Responsive: a track that varies across the ladder rounds the same way, or
    // the widest keyframe would disagree with the scalar beside it.
    const varying: MultiStateCapture = {
      url: 'http://fixture.test/',
      notes: [],
      projections: [
        { at: 1024, lh: 26.25 },
        { at: 1280, lh: 29.25 },
        { at: 1440, lh: 32.5 },
      ].map(
        ({ at, lh }): StateProjection => ({
          engine: 'chromium',
          viewport: { width: at, height: 800 },
          state: 'rest',
          manifest: {
            source: `t:${at}`,
            elements: [para(lh, 420)],
            sections: [] as never,
            viewport: { width: at, height: 800 },
          },
        }),
      ),
    }
    const tracked = walkNodes(foldToL1(varying).root).find((n) => n.kind === 'text')!
    const track = (tracked.responsive as { lineHeightPx?: { keyframes: Array<{ value: number }> } }).lineHeightPx
    expect(track, 'a varying leading earns a track').toBeDefined()
    expect(track!.keyframes.map((k) => k.value)).toEqual([26.25, 29.25, 32.5])

    // The renderer emits the fraction rather than swallowing it.
    const out = renderL1Fragment(
      [{ kind: 'text', text: 'We are a software studio', axes: { fontSizePx: 18, lineHeightPx: 29.25 } }],
      'p',
    )
    expect(out.css).toMatch(/line-height: 29\.25px/)
  })
})

describe('REQ-269 — a captured link keeps its target', () => {
  // ── 7. The capture records it, projected for a reproduction to consume ─────
  itB('test_UAT_FC_REQ-269_capture_records_a_link_target', () => {
    // Same-origin: SITE-INTERNAL, so the reproduction links to itself rather than
    // sending its own visitors back at the site it was captured from.
    expect(runStartingWith(residuals!, 'Blog').href).toBe('/blog')
    // A fragment on this page stays a bare fragment.
    expect(runStartingWith(residuals!, 'About').href).toBe('#about')
    // Cross-origin keeps the absolute URL, which is what the reference means.
    expect(runStartingWith(residuals!, 'Somewhere else').href).toBe('https://example.com/elsewhere')
    // A scheme the L1 URL allowlist refuses is not recorded: folding it would
    // produce a document `validateL1` then rejects.
    expect(runStartingWith(residuals!, 'Write to us').href ?? null).toBeNull()
    // And nothing is invented for a run that is inside no link at all.
    expect(runStartingWith(residuals!, 'Plain body copy').href ?? null).toBeNull()
  })

  // ── 8. The fold authors it and the renderer emits the anchor ───────────────
  it('test_UAT_FC_REQ-269_fold_authors_the_link_and_the_render_carries_it', () => {
    const linked = (text: string, href?: string): ValueElement =>
      ({
        role: 'body',
        text,
        color: '#101010',
        fontFamily: 'Georgia, serif',
        fontSizePx: 18,
        fontWeight: 400,
        box: { x: 88, y: 200, width: 120, height: 28 },
        ...(href ? { href } : {}),
      }) as ValueElement

    const doc = foldToL1(ladderOf([linked('Blog', '/blog')]))
    const node = walkNodes(doc.root).find((n) => n.kind === 'text' && n.text === 'Blog')
    expect(node!.link, 'the fold authors the navigation role').toEqual({ href: '/blog' })
    expect(validateL1({ widths: doc.widths, root: doc.root }).ok, 'and the document still validates').toBe(true)

    // An unfoldable target degrades to the un-linked leaf rather than producing a
    // document the validator refuses.
    const unsafe = foldToL1(ladderOf([linked('Write to us', 'javascript:alert(1)')]))
    const unsafeNode = walkNodes(unsafe.root).find((n) => n.kind === 'text' && n.text === 'Write to us')
    expect(unsafeNode!.link ?? null).toBeNull()

    // The renderer retags the run itself, so the `<a>` keeps the class it painted.
    const out = renderL1Fragment([{ kind: 'text', text: 'Blog', link: { href: '/blog' } }], 'nav')
    expect(out.htmls.join('')).toMatch(/<a [^>]*href="blog"/)
  })
})

describe('REQ-269 — L1 can say that a run is a heading', () => {
  // ── 9. The capture learns the level a11yRole flattens away ─────────────────
  itB('test_UAT_FC_REQ-269_capture_records_the_heading_level', () => {
    expect(runStartingWith(residuals!, 'A Different Approach').headingLevel).toBe(1)
    expect(runStartingWith(residuals!, 'Our Mission').headingLevel).toBe(3)
    // A role="heading" element declares its depth with aria-level, which occurred
    // nowhere in a capture bundle before this.
    expect(runStartingWith(residuals!, 'Declared by ARIA').headingLevel).toBe(4)
    // Ordinary copy is not a heading at any level.
    expect(runStartingWith(residuals!, 'Plain body copy').headingLevel ?? null).toBeNull()
  })

  // ── 10. L1 carries it, and is no less strict for it ────────────────────────
  it('test_UAT_FC_REQ-269_l1_accepts_a_heading_role_and_bounds_its_level', () => {
    const doc = (node: Record<string, unknown>) => ({
      widths: [1280],
      root: {
        kind: 'box' as const,
        children: [
          {
            kind: 'text',
            text: 'Our Mission',
            geometry: { keyframes: [{ at: 1280, x: 0, y: 0, width: 320, height: 40 }] },
            ...node,
          },
        ],
      },
    })
    for (const level of [1, 2, 3, 4, 5, 6]) {
      expect(validateL1(doc({ heading: { level } })).ok, `level ${level}`).toBe(true)
    }
    // An outline depth HTML has no element for is refused rather than clamped to a
    // depth the author did not ask for.
    for (const level of [0, 7, 1.5, -1]) {
      expect(validateL1(doc({ heading: { level } })).ok, `level ${level}`).toBe(false)
    }
    // The node object is still closed: it gained one name, not permission.
    expect(validateL1(doc({ heading: { level: 2, tag: 'h2' } })).ok).toBe(false)
    expect(validateL1(doc({ headingLevel: 2 })).ok).toBe(false)
    // And `control` deliberately cannot take the role at all.
    expect(
      validateL1({
        widths: [1280],
        root: {
          kind: 'box' as const,
          children: [
            {
              kind: 'control',
              control: 'email',
              heading: { level: 2 },
              geometry: { keyframes: [{ at: 1280, x: 0, y: 0, width: 320, height: 50 }] },
            },
          ],
        },
      }).ok,
    ).toBe(false)
  })

  // ── 11. The renderer is the sole <h1>…<h6> sink ────────────────────────────
  it('test_UAT_FC_REQ-269_renderer_is_the_sole_heading_sink', () => {
    const out = renderL1Fragment(
      [{ kind: 'text', text: 'Our Mission', axes: { fontSizePx: 24, fontWeight: 600 }, heading: { level: 2 } }],
      'h',
    )
    expect(out.htmls.join('')).toMatch(/<h2 class="[^"]+"/)
    expect(out.htmls.join('')).toMatch(/<\/h2>/)
    // The node's OWN element becomes the heading, so every paint axis it authored
    // stays on the class the renderer already styled.
    expect(out.css).toMatch(/font-size: 24px/)
    expect(out.css).toMatch(/font-weight: 600/)
    // …and the UA's own type scale is neutralised beneath it, so a run whose
    // document authored no size is not repainted at `2em bold`.
    const bare = renderL1Fragment([{ kind: 'text', text: 'Big', heading: { level: 1 } }], 'h')
    expect(bare.css).toMatch(/font-size: inherit/)
    expect(bare.css).toMatch(/font-weight: inherit/)

    // A linked heading is an `<a>`: the retag precedence is the reference's own,
    // since the capture reads the a11y role off the element bearing the href.
    const linked = renderL1Fragment(
      [{ kind: 'text', text: 'Our Mission', heading: { level: 2 }, link: { href: '/mission' } }],
      'h',
    )
    expect(linked.htmls.join('')).toMatch(/<a [^>]*href="mission"/)
    expect(linked.htmls.join('')).not.toMatch(/<h2/)

    // Absent, nothing changes: a document that never heard of the role renders
    // exactly as it did.
    expect(renderL1Fragment([{ kind: 'text', text: 'Body' }], 'p').htmls.join('')).toMatch(/<p class="/)
  })

  // ── 12. The fold authors it from the captured level ────────────────────────
  it('test_UAT_FC_REQ-269_fold_authors_the_heading_from_the_captured_level', () => {
    const run = (text: string, level?: number): ValueElement =>
      ({
        role: 'heading',
        text,
        color: '#101010',
        fontFamily: 'Georgia, serif',
        fontSizePx: 24,
        fontWeight: 600,
        a11yRole: level ? 'heading' : 'generic',
        box: { x: 88, y: 200, width: 320, height: 40 },
        ...(level ? { headingLevel: level } : {}),
      }) as ValueElement

    const doc = foldToL1(ladderOf([run('Our Mission', 3)]))
    const node = walkNodes(doc.root).find((n) => n.kind === 'text' && n.text === 'Our Mission')
    expect(node!.heading).toEqual({ level: 3 })
    expect(validateL1({ widths: doc.widths, root: doc.root }).ok).toBe(true)

    // A pre-REQ-269 bundle records no level, so nothing is authored and the leaf
    // folds exactly as it did.
    const old = foldToL1(ladderOf([run('Our Mission')]))
    const oldNode = walkNodes(old.root).find((n) => n.kind === 'text' && n.text === 'Our Mission')
    expect(oldNode!.heading ?? null).toBeNull()
  })
})

describe('REQ-269 — a flat render segments into the bands it paints', () => {
  // ── 13. The shape every L1 reproduction has ────────────────────────────────
  itB('test_UAT_FC_REQ-269_a_flat_render_segments_into_its_painted_bands', () => {
    const sections = flat!.sections
    // Before: ONE band covering the whole page, so the reference's sections had
    // nothing to pair against and every section-level value went unmeasured.
    expect(sections.length, 'the page segments into its painted slices').toBeGreaterThan(1)

    const boxes = sections.map((s) => ({ y: Math.round(s.box.y), height: Math.round(s.box.height) }))
    // The three painted backdrops, plus the unpainted stretch between the second
    // and the third — which is a section too: it is the body background showing
    // through, and the copy standing on it has to belong somewhere.
    expect(boxes).toEqual([
      { y: 0, height: 400 },
      { y: 400, height: 300 },
      { y: 700, height: 200 },
      { y: 900, height: 300 },
    ])

    // The scrim is a SIBLING of the band it veils, which is why a descendant walk
    // could not find it. Resolved geometrically, it is the hero's overlay.
    expect(sections[0].background.overlay).toEqual({ color: '#030717', opacity: 0.3 })
    // …and a band with no veil over it reports none.
    expect(sections[1].background.overlay ?? null).toBeNull()

    // Every run lands in the band it is painted inside — the whole page is one DOM
    // subtree, so a per-band walk would have collected all four into each slice.
    const textOf = (i: number): string[] => sections[i].content.map((r) => r.text.trim())
    expect(textOf(0)).toContain('Hero copy over the scrim')
    expect(textOf(1)).toContain('Copy on the second band')
    expect(textOf(2)).toContain('Copy on the page background')
    expect(textOf(3)).toContain('Footer copy')
    // Nothing is dropped on the way: partitioning is a redistribution, not a filter.
    expect(sections.flatMap((s) => s.content).length).toBe(4)

    // The anchor is measured from where each band's own content landed.
    expect(sections[0].layout.contentAnchorRatio).not.toBeNull()
    expect(sections[0].layout.contentAnchorRatio!).toBeGreaterThan(0.3)
    expect(sections[0].layout.contentAnchorRatio!).toBeLessThan(0.7)
  })

  // ── 14. A conventionally-nested page is untouched ──────────────────────────
  itB('test_UAT_FC_REQ-269_a_nested_page_still_segments_by_its_body_children', () => {
    // The residuals fixture has three real `<body>`-level bands (two of which
    // coalesce on a shared style signature, as they always have), so the top-level
    // scan never degenerates and the geometric path is never reached.
    const sections = residuals!.sections
    expect(sections.length).toBe(2)
    // Each band is still its own DOM subtree's: the cream band holds the three
    // controls and none of the copy, which a geometric partition of a flat tree
    // could not have produced from this page.
    expect(sections[1].background.color).toBe('#e8dfd3')
    expect(sections[1].fields.map((f) => f.accessibleName)).toEqual([
      'Your name',
      'Your message',
      'Unpadded field',
    ])
    expect(sections[1].content).toEqual([])
    expect(sections[0].fields).toEqual([])
    expect(sections[0].content.map((r) => r.text.trim()).some((t) => t.startsWith('A Different Approach'))).toBe(true)
  })
})
