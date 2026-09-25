/**
 * BUG-142 — a section band, a section background and a card OWN the content they
 * back, instead of standing beside it as pinned siblings.
 *
 * The defect these UATs pin: 14 painted panels and 58 flowed runs in one flat
 * sibling list, with no parent/child link and no ownership field, so a panel sat
 * behind its runs only because their coordinates coincided. Every perturbation —
 * a wider viewport, a longer paragraph, a taller window — moved one layer and not
 * the other, because on each axis exactly one layer responded.
 *
 * Two layers are exercised, at the entry point each one is reached through:
 *
 *  - the FOLD, over a synthetic multi-viewport capture, for the ownership itself
 *    (`foldToL1` → `chooseRecovery` / `mountBehaviours` → `renderL1Document` /
 *    `sampleFidelityProbe`);
 *  - the RECOVERY and the model, over an authored L1 document, for what a panel
 *    does once its content sizes it (`promoteToFlow` → `evaluateLayout`). The
 *    recovery is demand-driven, so a document that demands it is the only way to
 *    reach that path; the demand here is a collision under content growth, the
 *    same signal the references produce.
 *
 * Real components throughout. Nothing is mocked: the fixtures are a capture and a
 * document, which is what a browser and the fold respectively produce.
 */
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import {
  chooseRecovery,
  evaluateLayout,
  foldToL1,
  measuredTextHeights,
  mountBehaviours,
  promoteToFlow,
  sampleFidelityProbe,
  type FoldedForm,
  type MeasuredTextHeights,
} from '../tools/generate/src'
import type {
  MultiStateCapture,
  SectionValues,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const VIEWPORT_H = 1200
/** The height-probe viewport: the same width, a taller window (REQ-88). */
const PROBE_H = 1600

const HERO_FILL = '#0f172b'
const BAND_FILL = '#e8dfd3'
const FOOT_FILL = '#d9ccba'
const CARD_FILL = '#f8f5f2'
const ACCENT = { widthPx: 4, color: '#ffb900' }

// ── shared reading ────────────────────────────────────────────────────────────

const kidsOf = (n: L1Node): readonly L1Node[] =>
  n.kind === 'container' ? n.children : n.kind === 'box' ? (n.children ?? []) : []

/** Every node under the root, by evaluator path (`0.1.2`). */
function nodesByPath(doc: L1Document): Map<string, L1Node> {
  const out = new Map<string, L1Node>()
  const walk = (n: L1Node, path: string): void => {
    out.set(path, n)
    kidsOf(n).forEach((k, i) => walk(k, `${path}.${i}`))
  }
  walk(doc.root, '0')
  return out
}

const SURFACE_ID = /^(section-band-|section-bg-|card-)/
const isSurface = (n: L1Node): boolean => SURFACE_ID.test(n.id ?? '')

/** Every painted surface in the tree, at any depth. */
const surfacesOf = (doc: L1Document): L1Node[] => [...nodesByPath(doc).values()].filter(isSurface)

const surfacesNamed = (doc: L1Document, prefix: string): L1Node[] =>
  surfacesOf(doc).filter((n) => (n.id ?? '').startsWith(prefix))

const pathOf = (doc: L1Document, node: L1Node): string =>
  [...nodesByPath(doc)].find(([, n]) => n === node)![0]

/**
 * Each surface's held runs: the text leaves in its subtree, by path.
 *
 * This is the relation BUG-142 introduces. Before it there was none to read — a
 * panel and the runs it was painted for were siblings — so this measure is the
 * fix's own evidence and not a restatement of the geometry.
 */
function heldRuns(doc: L1Document): Map<string, string[]> {
  const nodes = nodesByPath(doc)
  const out = new Map<string, string[]>()
  for (const [path, node] of nodes) {
    if (node.kind !== 'text') continue
    const parts = path.split('.')
    for (let i = parts.length - 1; i > 0; i--) {
      const ancestor = parts.slice(0, i).join('.')
      if (!isSurface(nodes.get(ancestor)!)) continue
      out.set(ancestor, [...(out.get(ancestor) ?? []), path])
      break
    }
  }
  return out
}

type Rect = { x: number; y: number; width: number; height: number }

/** Every node's resolved box at `width`, by path. */
function boxesAt(
  doc: L1Document,
  width: number,
  contentScale = 1,
  measured?: MeasuredTextHeights,
): Map<string, Rect> {
  const res = evaluateLayout(doc, width, { contentScale, measured })
  const out = new Map<string, Rect>(res.boxes)
  for (const leaf of res.leaves) out.set(leaf.path, leaf.box)
  return out
}

/** A pixel of slack — the fold rounds to a hundredth and a run can sit flush. */
const inside = (child: Rect, parent: Rect): boolean =>
  child.y >= parent.y - 1 && child.y + child.height <= parent.y + parent.height + 1

/**
 * The runs that leave the panel HOLDING them at one perturbation.
 *
 * A panel not painted at that width, and a run not laid out there, are skipped:
 * neither can separate from the other.
 */
function escapes(
  doc: L1Document,
  width: number,
  contentScale = 1,
  measured?: MeasuredTextHeights,
): string[] {
  const boxes = boxesAt(doc, width, contentScale, measured)
  const nodes = nodesByPath(doc)
  const out: string[] = []
  for (const [panel, runs] of heldRuns(doc)) {
    const pb = boxes.get(panel)
    if (!pb || pb.height <= 0) continue
    for (const path of runs) {
      const tb = boxes.get(path)
      if (!tb || tb.height <= 0) continue
      if (!inside(tb, pb)) out.push(`${nodes.get(panel)!.id ?? panel} ← ${path}`)
    }
  }
  return out
}

// ── the capture the fold is exercised over ────────────────────────────────────

/** A text run at one width. */
function run(text: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement {
  return {
    text,
    role: 'text',
    color: '#111111',
    fontFamily: 'Arial',
    fontSizePx: 18,
    fontWeight: 400,
    box,
    ...over,
  }
}

const section = (index: number, box: NonNullable<SectionValues['box']>): SectionValues => ({
  index,
  overlay: null,
  contentAnchorRatio: null,
  box,
})

interface Page {
  elementsAt: (width: number) => ValueElement[]
  sectionsAt?: (width: number, viewportHeight: number) => SectionValues[]
  /** A second projection at one width and a different viewport height (REQ-88). */
  probeWidth?: number
}

function capture(page: Page): MultiStateCapture {
  const project = (width: number, height: number): StateProjection => ({
    engine: 'chromium',
    viewport: { width, height },
    state: 'rest',
    manifest: {
      source: `t:${width}x${height}`,
      elements: page.elementsAt(width),
      sections: page.sectionsAt?.(width, height) ?? [],
      viewport: { width, height },
    },
  })
  const projections = LADDER.map((w) => project(w, VIEWPORT_H))
  if (page.probeWidth) projections.push(project(page.probeWidth, PROBE_H))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** The document as SERVED: folded, then given the recovery's verdict. */
function serve(ms: MultiStateCapture): L1Document {
  const forms: FoldedForm[] = []
  const base = foldToL1(ms, { forms })
  const measured = measuredTextHeights(ms)
  return chooseRecovery(base, ms, { measured, compose: (d) => mountBehaviours(d, forms) }).doc
}

/**
 * A viewport-height hero over a content band, a card on that band, a footer band
 * and a painted rule that backs nothing — the shape §2 of the ticket describes,
 * in miniature.
 *
 * Every run is expressed relative to the width so the page re-flows across the
 * ladder as a real one does, and the hero section's bottom edge travels with the
 * window so the `min-h-screen` response is measurable rather than assumed.
 */
const HERO_BOTTOM = 800
const BAND_BOTTOM = 1400

function pageElements(width: number): ValueElement[] {
  const gutter = Math.min(40, Math.round(width / 12))
  const inner = width - gutter * 2
  const card = { x: gutter + 24, width: inner - 48, height: 24 }
  return [
    run('Everything starts here', { x: gutter, y: 120, width: inner, height: 24 }, { surfaceFill: HERO_FILL }),
    run('A line of hero copy', { x: gutter, y: 160, width: inner, height: 24 }, { surfaceFill: HERO_FILL }),
    run('What we do', { x: gutter, y: 860, width: inner, height: 24 }, { surfaceFill: BAND_FILL }),
    run('A paragraph on the band', { x: gutter, y: 900, width: inner, height: 24 }, { surfaceFill: BAND_FILL }),
    run('Panel title', { ...card, y: 1000 }, { surfaceFill: CARD_FILL, borderLeft: ACCENT }),
    run('Panel body copy', { ...card, y: 1040 }, { surfaceFill: CARD_FILL, borderLeft: ACCENT }),
    run('And a closing line', { x: gutter, y: 1140, width: inner, height: 24 }, { surfaceFill: BAND_FILL }),
    run('Footer note', { x: gutter, y: 1440, width: inner, height: 24 }, { surfaceFill: FOOT_FILL }),
    // A painted rule with nothing on it: a surface that backs no content.
    {
      text: '',
      textless: true,
      role: 'separator',
      a11yRole: 'separator',
      box: { x: 0, y: 1560, width, height: 4 },
      surfaceFill: '#00d492',
    } as ValueElement,
  ]
}

function pageSections(width: number, viewportHeight: number): SectionValues[] {
  // The hero is a viewport-height section: its bottom edge travels with the
  // window, and the bands below it travel bodily by the same amount.
  const grow = viewportHeight - VIEWPORT_H
  return [
    section(0, { x: 0, y: 0, width, height: HERO_BOTTOM + grow }),
    section(1, { x: 0, y: HERO_BOTTOM + grow, width, height: BAND_BOTTOM - HERO_BOTTOM }),
    section(2, { x: 0, y: BAND_BOTTOM + grow, width, height: 200 }),
  ]
}

const page = (): MultiStateCapture =>
  capture({ elementsAt: pageElements, sectionsAt: pageSections, probeWidth: 1280 })

const bandWithFill = (doc: L1Document, fill: string): L1Node =>
  surfacesNamed(doc, 'section-band-').find((b) => b.axes?.surfaceFill === fill)!

// ── the document the recovery is exercised over ───────────────────────────────

const AUTHORED_WIDTHS = [768, 1280]
const LINE_H = 25
/** ~5 chars a word: 26 words wraps to two lines at 600px / 18px, three at ×1.3. */
const PARAGRAPH = 'word '.repeat(26).trim()

const norm = (s: string): string => s.replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * A panel holding three runs, over a second panel holding one.
 *
 * Authored rather than folded because the recovery is DEMAND-driven: it flows the
 * regions whose content collides when the copy grows, and nothing else. The
 * collisions here (the heading into the paragraph, the closing line into the
 * footer) are that demand, so both the panel and the runs on it reach the flow
 * path this ticket changes.
 */
function authoredPage(): { doc: L1Document; measured: MeasuredTextHeights } {
  const frames = (y: number, height: number | null, x = 0, width?: number) =>
    AUTHORED_WIDTHS.map((at) => ({
      at,
      x,
      y,
      width: width ?? at,
      ...(height === null ? {} : { height }),
    }))
  const text = (content: string, y: number, height: number): L1Node => ({
    kind: 'text',
    text: content,
    axes: { fontSizePx: 18, lineHeightPx: LINE_H, color: '#111111', fontFamily: 'Arial', fontWeight: 400 },
    geometry: { keyframes: frames(y, height, 40, 600) },
  })
  const panel = (id: string, y: number, height: number, fill: string, children: L1Node[]): L1Node => ({
    kind: 'container',
    id,
    layout: 'stack',
    axes: { surfaceFill: fill },
    geometry: { keyframes: frames(y, height) },
    children,
  })
  const doc: L1Document = {
    widths: AUTHORED_WIDTHS,
    root: {
      kind: 'box',
      children: [
        panel('section-band-1', 0, 200, BAND_FILL, [
          text('Heading', 20, LINE_H),
          text(PARAGRAPH, 60, LINE_H * 2),
          text(`${PARAGRAPH} end`, 130, LINE_H * 2),
        ]),
        panel('section-band-2', 220, 100, FOOT_FILL, [text('Footer note', 20, LINE_H)]),
      ],
    },
  }
  // The heights the browser gave each run — what `measuredTextHeights` reads off
  // a capture, here stated directly beside the keyframes they belong to.
  const tracks = new Map<string, Array<{ at: number; height: number }>>()
  const seen = new Map<string, number>()
  for (const [content, height] of [
    ['Heading', LINE_H],
    [PARAGRAPH, LINE_H * 2],
    [`${PARAGRAPH} end`, LINE_H * 2],
    ['Footer note', LINE_H],
  ] as const) {
    const key = norm(content)
    const occurrence = seen.get(key) ?? 0
    seen.set(key, occurrence + 1)
    tracks.set(
      `${key}#${occurrence}`,
      AUTHORED_WIDTHS.map((at) => ({ at, height })),
    )
  }
  return { doc, measured: { tracks } }
}

/** The captured height of each authored panel, by id. */
const AUTHORED_PANELS = [
  { id: 'section-band-1', y: 0, height: 200 },
  { id: 'section-band-2', y: 220, height: 100 },
]

describe('BUG-142 — a backing surface owns the content it backs', () => {
  it('test_UAT_FC_BUG-142_a_backing_surface_holds_the_content_it_backs', () => {
    // §6.1 — a band, a section background and a card fold to a container carrying
    // the fill on its axes and the backed runs as its CHILDREN, so containment
    // holds by construction rather than by coordinate coincidence.
    const doc = foldToL1(page())
    expect(validateL1(doc).ok, JSON.stringify(validateL1(doc))).toBe(true)

    const card = surfacesNamed(doc, 'card-')[0]
    expect(card, 'the panel folds to a card').toBeDefined()
    expect(card.kind, 'a card that backs content is a container, not a pinned box').toBe('container')
    expect(
      kidsOf(card).map((n) => (n.kind === 'text' ? n.text : n.kind)),
      'the card holds exactly the two runs it was built from',
    ).toEqual(['Panel title', 'Panel body copy'])

    // The card sits INSIDE the band it is painted on: one tree, not two layers.
    const band = bandWithFill(doc, BAND_FILL)
    expect(kidsOf(band), 'the band holds the card standing on it').toContain(card)
    expect(
      kidsOf(band).filter((n) => n.kind === 'text').map((n) => (n.kind === 'text' ? n.text : '')),
      'and the runs painted directly on the band',
    ).toEqual(['What we do', 'A paragraph on the band', 'And a closing line'])

    // §7 — no top-level pinned panel sibling remains for a surface that backs
    // content: every run on the page is inside the surface that backs it.
    const held = heldRuns(doc)
    const runsHeld = [...held.values()].flat().length
    const runsTotal = [...nodesByPath(doc).values()].filter((n) => n.kind === 'text').length
    expect(runsHeld, 'every run is held by the surface it is painted behind').toBe(runsTotal)
  })

  it('test_UAT_FC_BUG-142_a_surface_that_backs_nothing_stays_a_pinned_box', () => {
    // §6.2 — the REQ-278 exemption narrows to what actually needs it. A painted
    // rule with nothing on it is genuinely meant to sit under its neighbours, so
    // it keeps its own rect: childless and absolute, exactly as before.
    const doc = serve(page())
    const rule = [...nodesByPath(doc).values()].find(
      (n) => (n.kind === 'box' || n.kind === 'container') && n.axes?.surfaceFill === '#00d492',
    )!
    expect(rule, 'the painted rule survives the fold').toBeDefined()
    expect(rule.kind).toBe('box')
    expect(kidsOf(rule)).toEqual([])
    expect(rule.geometry?.place ?? 'absolute', 'a surface that backs nothing is not flowed').not.toBe('flow')
  })

  it('test_UAT_FC_BUG-142_a_card_that_leaves_its_band_on_a_narrow_rung_is_not_owned', () => {
    // A tree has ONE shape, so ownership has to hold at every width the capture
    // measured and not only at the widest. A card that sits on a band at 1440 and
    // four thousand pixels below it at 320 — the page has stacked and the bands
    // have re-tiled — is not that band's content, and claiming it would hand the
    // band a content extent it never had.
    const doc = foldToL1(
      capture({
        elementsAt: (w) => {
          const stacked = w <= 375
          return [
            run('Band copy', { x: 20, y: 100, width: w - 40, height: 24 }, { surfaceFill: BAND_FILL }),
            run('Band more', { x: 20, y: 140, width: w - 40, height: 24 }, { surfaceFill: BAND_FILL }),
            // On the narrow rungs the card has been pushed far below the band.
            run('Away card', { x: 20, y: stacked ? 4000 : 200, width: 200, height: 24 }, { surfaceFill: CARD_FILL }),
          ]
        },
      }),
    )
    const card = surfacesNamed(doc, 'card-')[0]
    const band = surfacesNamed(doc, 'section-band-')[0]
    expect(card, 'the away run still folds a card').toBeDefined()
    expect(kidsOf(band), 'the band does not claim a card it loses on the narrow rungs').not.toContain(card)
    // …and the card still holds its own run, which never leaves it.
    expect(kidsOf(card).map((n) => (n.kind === 'text' ? n.text : n.kind))).toEqual(['Away card'])
  })

  it('test_UAT_FC_BUG-142_a_card_accent_rule_does_not_shift_the_runs_it_backs', () => {
    // §10.2 — a child of an absolutely-placed panel is positioned from the panel's
    // PADDING box, inside its border. The renderer emits a card's 4px accent as a
    // real `border-left`, so a rebase that ignored it would shift every word on
    // the card by its width: the runs come back exactly where the capture had them.
    const ms = page()
    const doc = foldToL1(ms)
    const card = surfacesNamed(doc, 'card-')[0]
    expect(card.axes?.borderLeft, 'the card really does carry the accent').toEqual(ACCENT)

    const report = sampleFidelityProbe(doc, ms, { tolerancePx: 0.5 })
    expect(report.residuals, 'the accent does not move the runs it is painted beside').toEqual([])
  })

  it('test_UAT_FC_BUG-142_a_repeated_wordmark_still_pairs_with_its_own_capture_element', () => {
    // The fidelity probe pairs the k-th oracle element of a text key with the k-th
    // reproduced leaf IN DOCUMENT ORDER. Nesting a run inside the panel that backs
    // it moves it in that order, so the root's children are ordered by the earliest
    // capture element each subtree holds. Without that, a page with a wordmark in
    // its header AND its footer measures each against the other, and reports the
    // distance between two parts of the page as a fidelity miss.
    const ms = capture({
      elementsAt: (w) => [
        run('Acme', { x: 20, y: 40, width: 120, height: 24 }, { surfaceFill: CARD_FILL }),
        run('Headline', { x: 20, y: 200, width: w - 40, height: 24 }, { surfaceFill: BAND_FILL }),
        run('Body copy on the band', { x: 20, y: 240, width: w - 40, height: 24 }, { surfaceFill: BAND_FILL }),
        run('Acme', { x: 20, y: 2000, width: 120, height: 24 }, { surfaceFill: CARD_FILL }),
      ],
    })
    const doc = foldToL1(ms)
    const report = sampleFidelityProbe(doc, ms, { tolerancePx: 2 })
    expect(report.residuals, 'a repeated wordmark pairs with its own element').toEqual([])
    expect(report.unmatched).toEqual([])
    expect(report.pass).toBe(true)
  })

  it('test_UAT_FC_BUG-142_at_rest_the_reproduction_is_no_worse', () => {
    // §6.3 — a representation change can only make the at-rest geometry worse or
    // leave it alone, so it is measured rather than assumed. Folded and served,
    // every sampled width still reproduces the capture to within a hundredth of a
    // pixel, with nothing unmatched.
    const ms = page()
    for (const [label, doc] of [
      ['base', foldToL1(ms)],
      ['served', serve(ms)],
    ] as const) {
      const report = sampleFidelityProbe(doc, ms, { tolerancePx: 2 })
      expect(report.pass, `${label} sampleFidelity`).toBe(true)
      expect(report.unmatched, `${label} unmatched`).toEqual([])
      expect(report.maxDelta, `${label} max residual`).toBeLessThanOrEqual(1)
    }
  })

  it('test_UAT_FC_BUG-142_a_panel_whose_height_is_a_viewport_function_keeps_it', () => {
    // §10.3 — the one panel that does NOT hand its height to its content. A
    // `min-h-screen` hero is a fifth of a page tall in copy and a whole viewport
    // tall on screen; the capture measured the rule it follows, and handing that
    // height to the copy would collapse the hero and lift the whole page under it.
    const ms = page()
    const heroBase = bandWithFill(foldToL1(ms), HERO_FILL)
    expect(
      heroBase.geometry?.viewportResponse?.heightFactor,
      'the fixture measures a hero height rule',
    ).toBe(1)

    const hero = bandWithFill(serve(ms), HERO_FILL)
    expect(hero.geometry?.viewportResponse?.heightFactor, 'the hero keeps its measured response').toBe(1)
    expect(
      hero.geometry!.keyframes.find((k) => k.at === 1280)!.height,
      'and its captured height, not its content extent',
    ).toBe(HERO_BOTTOM)
  })

  it('test_UAT_FC_BUG-142_a_vertical_resize_moves_a_panel_and_the_content_it_backs_together', () => {
    // §3 — the composition that tore the page in half on a vertical resize: 13 of
    // 14 panels carried `viewportResponse: {yFactor: 1}` and no text node did, or
    // structurally could. Drag the window 200px taller and every band moved 200px
    // while every word stayed exactly where it was.
    //
    // The rule itself is right — the band really does start a viewport height down
    // the page — so what changes is who it applies to. The runs are the band's
    // DESCENDANTS now, so the one transform moves the panel and its content as one
    // thing, which is the whole of the fix on this axis.
    const doc = serve(page())
    const band = bandWithFill(doc, BAND_FILL)
    expect(band.geometry?.viewportResponse?.yFactor, 'the band answers the viewport height').toBe(1)

    const { html, css } = renderL1Document(doc)
    /** The generated class the renderer put on the element carrying `id`. */
    const classOf = (id: string): string =>
      html.match(new RegExp(`class="([^"]+)" id="${id}"`))![1].split(' ')[0]

    // The band's own rule is where the viewport-height term lives…
    const bandClass = classOf(band.id!)
    expect(
      css.split('}').filter((r) => r.includes(`.${bandClass} `)).join(' '),
      'the band carries the viewport-height rule',
    ).toMatch(/100vh/)

    // …and the runs it backs are emitted INSIDE its element, so the term reaches
    // them. Before the fix they were siblings, and it could not.
    const open = html.indexOf(`id="${band.id}"`)
    const held = html.slice(open, html.indexOf('id="section-band-2"'))
    for (const text of ['What we do', 'A paragraph on the band', 'Panel title']) {
      expect(held, `"${text}" is inside the band that backs it`).toContain(text)
    }

    // No run answers the viewport height on its own — one rule, one panel, one
    // subtree; nothing is applied twice and nothing is left behind.
    const panelClasses = new Set(surfacesOf(doc).map((n) => classOf(n.id!)))
    for (const rule of css.split('}').filter((r) => r.includes('100vh'))) {
      const selector = rule.slice(rule.lastIndexOf('.'), rule.indexOf('{')).trim()
      expect(
        panelClasses.has(selector.replace('.', '')),
        `only a panel answers the viewport height, not ${selector}`,
      ).toBe(true)
    }
  })

  it('test_UAT_FC_BUG-142_a_recovered_panel_keeps_its_captured_height_at_every_sampled_width', () => {
    // §10.3 — a backing surface is taller than the words on it: a section's own
    // bottom padding is the difference, and it is why the fill reaches the next
    // section's edge instead of stopping at the last line. Once the content sizes
    // the panel — which is the point, since that is what makes it grow — the
    // difference is stated as a per-width bottom inset, and the panel reproduces
    // the rect the capture measured at every sampled width.
    const { doc, measured } = authoredPage()
    const { doc: recovered } = promoteToFlow(doc, { measured })
    expect(validateL1(recovered).ok, JSON.stringify(validateL1(recovered))).toBe(true)

    const band = surfacesNamed(recovered, 'section-band-1')[0]
    const inset = 'responsivePadding' in band ? band.responsivePadding?.bottomPx : undefined
    expect(inset, 'the panel states the inset that keeps its captured height').toBeDefined()
    expect(inset!.keyframes.map((k) => k.at)).toEqual(AUTHORED_WIDTHS)
    expect(band.geometry?.place, 'the panel is in flow, so its content sizes it').toBe('flow')

    for (const width of AUTHORED_WIDTHS) {
      const boxes = boxesAt(recovered, width, 1, measured)
      for (const panel of AUTHORED_PANELS) {
        const node = surfacesNamed(recovered, panel.id)[0]
        const box = boxes.get(pathOf(recovered, node))!
        expect(box.y, `${panel.id} top at ${width}px`).toBeCloseTo(panel.y, 1)
        expect(box.height, `${panel.id} height at ${width}px`).toBeCloseTo(panel.height, 1)
      }
    }
  })

  it('test_UAT_FC_BUG-142_growing_the_copy_grows_the_panel_and_keeps_its_runs_inside_it', () => {
    // §7 — grow the copy and each panel moves WITH the runs it backs: no run
    // escapes the panel holding it, where flat siblings slid apart by up to 426px
    // on the references this was measured against, with 0 of 14 panels moving at
    // all. The panel grows by exactly what its content grew by, and the panel
    // below it moves down by the same amount.
    const { doc, measured } = authoredPage()
    const { doc: recovered } = promoteToFlow(doc, { measured })
    const widest = Math.max(...AUTHORED_WIDTHS)
    const band = pathOf(recovered, surfacesNamed(recovered, 'section-band-1')[0])
    const footer = pathOf(recovered, surfacesNamed(recovered, 'section-band-2')[0])

    const rest = boxesAt(recovered, widest, 1, measured)
    for (const scale of [1.15, 1.3]) {
      expect(escapes(recovered, widest, scale, measured), `runs escaping their panel at ×${scale}`).toEqual([])
    }

    // And the panel really did move — the containment above is not "nothing moved".
    const grown = boxesAt(recovered, widest, 1.3, measured)
    expect(grown.get(band)!.height, 'the panel grows with the content it holds').toBeGreaterThan(
      rest.get(band)!.height,
    )
    expect(grown.get(footer)!.y, 'and the panel below it moves down by the same amount').toBeCloseTo(
      rest.get(footer)!.y + (grown.get(band)!.height - rest.get(band)!.height),
      1,
    )
  })

  it('test_UAT_FC_BUG-142_between_the_captured_rungs_a_run_stays_on_the_panel_that_holds_it', () => {
    // §7 — at widths the capture never measured, the panel and the runs it backs
    // resolve from one geometry instead of two. Today's flat document loses up to
    // 576px of containment at 500px on the references; a held run cannot.
    const { doc, measured } = authoredPage()
    const { doc: recovered } = promoteToFlow(doc, { measured })
    for (const width of [500, 900, 1100]) {
      expect(escapes(recovered, width, 1, measured), `runs escaping their panel at ${width}px`).toEqual([])
    }
  })
})
