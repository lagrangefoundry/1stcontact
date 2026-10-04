/**
 * REQ-383 — five residuals on bluelotusintegralhealing.com (a Zyro page), round 3.
 *
 * - **issue 1** (fold) — a band REQ-380 declines to rebuild because a captured
 *   backdrop of the same fill already paints it leaves its runs `backedBy` that
 *   backdrop, and the backdrop never OWNED them: pinned siblings of a pinned
 *   plate, which every content-robustness width reported as escapes (30 of 40),
 *   and which the recovery made worse by flowing the copy past the plate. The
 *   carrier now owns its runs as the band would have, and stays paired with its
 *   oracle sample.
 * - **issue 2** (recovery) — `promoteToFlow` dropped every child already in flow,
 *   which is REQ-377's pin rail: the sticky header and everything pinned in it
 *   vanished from the recovered page, so it never served. The rail is kept, and
 *   the flow starts past it.
 * - **issue 3** (capture + module + instrument) — a control labelled ABOVE its
 *   box that paints different words INSIDE it lost the placeholder at capture
 *   (one accessible name, the label winning) and could not express it in the
 *   module (one `label`). The words are now captured, carried and compared.
 * - **issue 4** (fold) — a centred pill's inset is kept at the fold's hundredth
 *   precision rather than rounded to whole pixels.
 * - **issue 5** (fold) — an element's paint level is the one at which its
 *   stacking chain parts from the chain of what it overlaps, not the innermost.
 *
 * The fold and recovery cases drive the real `foldToL1` / `promoteToFlow` and the
 * gate's own probes over synthetic ladders shaped like the bundle; the capture
 * case runs the REAL page script under jsdom (which lays nothing out, so the
 * fixture states the boxes a browser would report).
 */
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { contentRobustnessProbe, foldToL1, promoteToFlow, sampleFidelityProbe } from '../tools/generate/src'
import { measuredTextHeights, type FoldedForm } from '../tools/generate/src/l1'
import { diffManifests, EXTRACT_SCRIPT, type RawSignals } from '../tools/generate/src/cli'
import type {
  MultiStateCapture,
  SectionValues,
  StateProjection,
  ValueElement,
  ValueManifest,
} from '../tools/generate/src/cli/capture'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { contactForm } from '../packages/framework/src/modules/contact-form/component'
import { contactFormControls } from '../packages/framework/src/modules/contact-form/controls'

// ── shared fixtures ──────────────────────────────────────────────────────────

const LADDER = [768, 1280]

function multiFrom(elementsAt: (w: number) => ValueElement[], sectionsAt: (w: number) => SectionValues[] = () => []): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 800 },
    state: 'rest',
    manifest: {
      source: `req383:${width}`,
      elements: elementsAt(width),
      sections: sectionsAt(width),
      viewport: { width, height: 800 },
    },
  })) as unknown as StateProjection[]
  return { url: 'http://fixture.test/', notes: [], projections }
}

const el = (o: Partial<ValueElement>): ValueElement =>
  ({ text: '', role: 'generic', color: '#333333', fontFamily: 'Lato', fontSizePx: 16, fontWeight: 400, lineHeightPx: 24, ...o }) as ValueElement

type Walked = { node: L1Node; ancestors: L1Node[] }
function walk(doc: L1Document): Walked[] {
  const out: Walked[] = []
  const visit = (node: L1Node, ancestors: L1Node[]): void => {
    out.push({ node, ancestors })
    const kids = node.kind === 'container' ? node.children : node.kind === 'box' ? (node.children ?? []) : []
    kids.forEach((c) => visit(c, [...ancestors, node]))
  }
  visit(doc.root, [])
  return out
}
const idOf = (n: L1Node): string | undefined => (n as { id?: string }).id
const textOf = (n: L1Node): unknown => (n as { text?: unknown }).text

// ── issue 1 — a band carried on its captured backdrop owns its runs ──────────

const WHITE = '#ffffff'
const BLUE = '#249ed3'
const section = (index: number, y: number, height: number, w: number, fill: string): SectionValues =>
  ({ index, box: { x: 0, y, width: w, height }, surfaceFill: fill, overlay: null, contentAnchorRatio: null }) as SectionValues
const row = (text: string, y: number, w: number, fill: string): ValueElement =>
  el({ text, surfaceFill: fill, box: { x: 40, y, width: 420, height: 24 } })

/**
 * The contact section (white) and the footer (blue), each painted by a captured
 * backdrop of its own fill, with their rows interleaved the way the responsive
 * table streams them and the footer logo standing in the blue section.
 */
const carried = multiFrom(
  (w) => [
    el({ textless: true, surfaceFill: WHITE, box: { x: 0, y: 1993, width: w, height: 561 } }),
    el({ textless: true, surfaceFill: BLUE, box: { x: 0, y: 2553, width: w, height: 393 } }),
    row('Get in Touch', 2080, w, WHITE),
    row('Blue Lotus Integral Healing', 2586, w, BLUE),
    row('Contact', 2241, w, WHITE),
    row('contact', 2706, w, BLUE),
    row('Your Name*', 2306, w, WHITE),
    row('Your Name*', 2640, w, BLUE),
    row('© 2025. All rights reserved.', 2900, w, BLUE),
    el({
      textless: true,
      role: 'img',
      a11yRole: 'img',
      objectFit: 'cover',
      intrinsicAspect: 1.06,
      src: 'https://assets.example.test/logo.png',
      alt: 'Blue Lotus',
      box: { x: 505, y: 2600, width: 200, height: 200 },
    }),
  ],
  (w) => [section(0, 1994, 560, w, WHITE), section(1, 2554, 392, w, BLUE)],
)

describe('REQ-383 issue 1 — a backdrop that carries a band owns the runs standing on it', () => {
  const doc = foldToL1(carried)
  const nodes = walk(doc)
  const measured = measuredTextHeights(carried)

  it('test_UAT_FC_REQ-383_a_carrier_backdrop_is_a_container_holding_its_runs', () => {
    const backedBy = (n: L1Node): string | undefined => (n as { backedBy?: string }).backedBy
    const carriers = nodes.filter(
      (b) => idOf(b.node)?.startsWith('backdrop-') && nodes.some((n) => backedBy(n.node) === idOf(b.node)),
    )
    expect(carriers.length, 'the blue band is carried on its backdrop').toBeGreaterThan(0)
    for (const b of carriers) {
      expect(b.node.kind, `${idOf(b.node)} owns what stands on it`).toBe('container')
      const runs = nodes.filter((n) => backedBy(n.node) === idOf(b.node))
      for (const r of runs) {
        expect(r.ancestors, `'${String(textOf(r.node))}' sits inside ${idOf(b.node)}`).toContain(b.node)
      }
    }
    expect(carriers.length, 'the white section and the blue footer are both carried').toBe(2)
    const footer = carriers.find((b) => (b.node as { axes?: { surfaceFill?: string } }).axes?.surfaceFill === BLUE)!
    expect(nodes.filter((n) => backedBy(n.node) === idOf(footer.node)).map((n) => textOf(n.node))).toEqual(
      expect.arrayContaining(['contact', '© 2025. All rights reserved.']),
    )
  })

  it('test_UAT_FC_REQ-383_the_recovered_page_has_no_run_escaping_its_backdrop', () => {
    const recovered = promoteToFlow(doc, { measured }).doc
    const escapes = contentRobustnessProbe(recovered, { measured }).byWidth.flatMap((w) =>
      w.findings.filter((f) => f.kind === 'escape' && /backdrop-/.test(f.detail)),
    )
    expect(escapes.map((f) => f.detail)).toEqual([])
  })

  it('test_UAT_FC_REQ-383_an_owning_backdrop_still_pairs_with_its_oracle_and_the_page_reads_in_order', () => {
    // The owning backdrop is a structural node, still graded as the `box` it was
    // captured as; and the footer — which owns the early-indexed logo — sorts
    // after the contact section, so each repeated label meets its own twin.
    const f = sampleFidelityProbe(doc, carried, { measured })
    expect(f.unmatched).toEqual([])
    expect(f.residuals).toEqual([])
  })
})

// ── issue 2 — the recovery keeps a child already in flow ─────────────────────

const PIN = (w: number) => ({ id: '0.0', x: 0, y: 0, width: w, height: 140, topPx: 0 })
const ground = (fill: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement =>
  el({ text: '(generic)', textless: true, a11yRole: 'generic', surfaceFill: fill, box, color: '', fontFamily: '', fontSizePx: 0, fontWeight: 0, ...over })

/** A pinned 140px header (bar + nav) over a body of runs that runs to y 3000. */
const pinned = multiFrom((w) => [
  ground('#224e7a', { x: 0, y: 0, width: w, height: 140 }, { sticky: PIN(w) }),
  el({ text: 'Home', color: '#ffffff', surfaceFill: '#224e7a', box: { x: w - 200, y: 76, width: 60, height: 24 }, sticky: PIN(w) }),
  el({ text: 'Hear what matters.', box: { x: 28, y: 884, width: w - 56, height: 48 }, lineHeightPx: 48, sticky: null }),
  el({ text: 'Our clinic is open six days a week.', box: { x: 28, y: 960, width: w - 56, height: 24 }, sticky: null }),
  el({ text: 'Where To Find Us', box: { x: 28, y: 2938, width: w - 56, height: 48 }, lineHeightPx: 48, sticky: null }),
])

describe('REQ-383 issue 2 — the recovery keeps the sticky header’s rail', () => {
  const doc = foldToL1(pinned)
  const measured = measuredTextHeights(pinned)
  const ids = (d: L1Document): string[] => walk(d).flatMap((n) => (idOf(n.node) ? [idOf(n.node)!] : []))

  it('test_UAT_FC_REQ-383_promote_to_flow_drops_no_node_already_in_flow', () => {
    expect(ids(doc), 'the fold pins the header in a rail').toContain('pin-0-rail')
    const recovered = promoteToFlow(doc, { measured }).doc
    const after = new Set(ids(recovered))
    expect(ids(doc).filter((id) => !after.has(id))).toEqual([])
    expect(walk(recovered).some((n) => textOf(n.node) === 'Home')).toBe(true)
  })

  it('test_UAT_FC_REQ-383_the_recovered_page_reproduces_the_capture_past_a_page_tall_rail', () => {
    const recovered = promoteToFlow(doc, { measured }).doc
    const f = sampleFidelityProbe(recovered, pinned, { measured })
    expect(f.unmatched).toEqual([])
    expect(f.residuals).toEqual([])
    expect(f.maxDelta).toBeLessThanOrEqual(0.1)
  })
})

// ── issue 3 — a placeholder that is not the label ────────────────────────────

const domRect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

function extract(bodyHtml: string, boxes: Record<string, [number, number, number, number]>): RawSignals {
  const dom = new JSDOM(`<!doctype html><html><body style="margin:0">${bodyHtml}</body></html>`, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://www.example.test/',
  })
  dom.window.Element.prototype.getBoundingClientRect = function (this: Element) {
    const [x, y, w, h] = boxes[this.id] ?? [0, 0, 1280, 400]
    return domRect(x, y, w, h)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })
  return (dom.window as unknown as { eval(s: string): unknown }).eval(EXTRACT_SCRIPT) as RawSignals
}

const control = (name: string, y: number, over: Partial<ValueElement> = {}): ValueElement =>
  el({
    role: 'textbox',
    text: name,
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'textbox',
    accessibleName: name,
    nameSource: 'label',
    controlType: 'text',
    box: { x: 676, y, width: 546, height: 53 },
    ...over,
  })

describe('REQ-383 issue 3 — a visibly-labelled control keeps the words it paints inside', () => {
  it('test_UAT_FC_REQ-383_the_capture_records_the_placeholder_whatever_names_the_control', () => {
    const signals = extract(
      `<form id="f"><label for="n" id="ln">Your Name*</label><input id="n" type="text" placeholder="  Enter   your name ">` +
        `<label for="m" id="lm">Message</label><input id="m" type="text"></form>`,
      { f: [0, 0, 1280, 400], ln: [676, 80, 120, 20], n: [676, 111, 546, 53], lm: [676, 180, 120, 20], m: [676, 203, 546, 53] },
    )
    const fields = signals.bands.flatMap((b) => b.fields)
    const named = fields.find((f) => f.accessibleName === 'Your Name*')
    expect(named, 'the labelled control is recorded').toBeTruthy()
    expect(named!.nameSource).toBe('label')
    expect(named!.placeholderText).toBe('Enter your name')
    const bare = fields.find((f) => f.accessibleName === 'Message')
    expect(bare!.placeholderText ?? null).toBeNull()
  })

  it('test_UAT_FC_REQ-383_the_fold_carries_the_placeholder_onto_the_form_field', () => {
    const forms: FoldedForm[] = []
    foldToL1(
      multiFrom(() => [
        control('Your Name*', 2111, { placeholderText: 'Enter your name' }),
        control('Your Email Address*', 2203, { placeholderText: 'Enter your email address', controlType: 'email' }),
        control('Phone', 2295),
      ]),
      { forms },
    )
    expect(forms.length).toBe(1)
    const byLabel = new Map(forms[0].fields.map((f) => [f.label, f]))
    expect(byLabel.get('Your Name*')).toMatchObject({ labelMode: 'visible', placeholder: 'Enter your name' })
    expect(byLabel.get('Your Email Address*')!.placeholder).toBe('Enter your email address')
    expect(byLabel.get('Phone')!.placeholder, 'nothing is invented for a control without one').toBeUndefined()
  })

  it('test_UAT_FC_REQ-383_the_module_paints_the_placeholder_beside_a_visible_label', () => {
    // The module's config as an instance carries it, coerced by the component.
    const html = contactForm({
      config: {
        fields: [{ name: 'your-name', label: 'Your Name*', labelMode: 'visible', placeholder: 'Enter your name', type: 'text' }],
      },
    })
    expect(html, 'the label is still the accessible name').toContain('Your Name*')
    // The control contract the emitter pairs with the L1 node naming each field.
    const controls = contactFormControls(
      [
        { name: 'your-name', label: 'Your Name*', labelMode: 'visible', placeholder: 'Enter your name', type: 'text', required: true },
        { name: 'message', label: 'Message', labelMode: 'visible', placeholder: 'Type your message here', type: 'textarea', required: false },
        { name: 'email', label: 'Email', labelMode: 'placeholder', type: 'email', required: false },
        { name: 'phone', label: 'Phone', labelMode: 'visible', type: 'tel', required: false },
      ],
      'Send',
    )
    expect(controls['your-name'].attrs.placeholder).toBe('Enter your name')
    expect(controls.message.attrs.placeholder).toBe('Type your message here')
    // A placeholder-labelled field still puts its label inside, as before.
    expect(controls.email.attrs.placeholder).toBe('Email')
    expect(controls.phone.attrs.placeholder).toBeUndefined()
  })

  it('test_UAT_FC_REQ-383_values_diff_reports_a_placeholder_the_reproduction_does_not_paint', () => {
    const mani = (source: string, e: ValueElement): ValueManifest =>
      ({ source, elements: [e], sections: [] }) as unknown as ValueManifest
    const props = (d: { property: string }[]): string[] => d.map((x) => x.property)
    const ref = control('Your Name*', 2111, { placeholderText: 'Enter your name' })

    const lost = diffManifests(mani('ref', ref), mani('act', control('Your Name*', 2111, { placeholderText: null })))
    expect(props(lost.deltas)).toContain('placeholderText')

    const same = diffManifests(mani('ref', ref), mani('act', control('Your Name*', 2111, { placeholderText: 'Enter your name' })))
    expect(props(same.deltas)).not.toContain('placeholderText')

    // A reference captured before the words were read stays inert.
    const old = diffManifests(mani('ref', control('Your Name*', 2111)), mani('act', control('Your Name*', 2111, { placeholderText: null })))
    expect(props(old.deltas)).not.toContain('placeholderText')
  })
})

// ── issue 4 — a centred pill's inset keeps its half pixel ────────────────────

describe('REQ-383 issue 4 — a chip-centring inset is not rounded to whole pixels', () => {
  it('test_UAT_FC_REQ-383_a_56px_pill_around_a_19px_line_is_inset_17_5_each_side', () => {
    // Zyro's `.grid-button--primary`: min-height 56, flex-centred, no padding, 1px border.
    const pill = el({
      text: '2. Order A Session',
      role: 'link',
      color: '#ffffff',
      fontWeight: 500,
      lineHeightPx: undefined,
      box: { x: 440.83, y: 654, width: 194, height: 56 },
      renderedTextBox: { x: 470, y: 672.5, width: 130, height: 19 },
      paddingTopPx: 0,
      paddingBottomPx: 0,
      surfaceFill: '#30499c',
      borderRadiusPx: 28,
      border: { widthPx: 1, color: '#ffffff', style: 'solid' },
      href: '/order',
    })
    const anchor = el({ text: 'Anchor', box: { x: 28, y: 900, width: 80, height: 20 }, lineHeightPx: 20 })
    const doc = foldToL1(multiFrom(() => [pill, anchor]))
    const node = walk(doc).find((n) => textOf(n.node) === '2. Order A Session')!.node as { padding?: unknown }
    expect(node.padding).toEqual({ topPx: 17.5, bottomPx: 17.5 })
  })
})

// ── issue 5 — the level that orders an element against what it overlaps ─────

describe('REQ-383 issue 5 — a flattened paint order takes the deciding stacking level', () => {
  const at = (id: string, z: number) => ({ id, z })
  const doc = foldToL1(
    multiFrom(() => [
      // The footer logo: its own and its wrapper's levels are 0, under a column at 8.
      el({
        textless: true,
        role: 'img',
        a11yRole: 'img',
        objectFit: 'contain',
        intrinsicAspect: 1.06,
        src: 'https://assets.example.test/logo.png',
        alt: 'Blue Lotus',
        box: { x: 505, y: 2617, width: 270, height: 254 },
        zIndex: 0,
        paintStack: [at('4.1', 14), at('4.1.8', 8), at('4.1.8.0', 0), at('4.1.8.0.0', 0)],
      }),
      // The copyright run it overlaps, in the sibling column at 7.
      el({
        text: '© 2025. All rights reserved.',
        box: { x: 58, y: 2824, width: 503, height: 18 },
        zIndex: 7,
        paintStack: [at('4.1', 14), at('4.1.7', 7), at('4.1.7.0', 0)],
      }),
      // A run that overlaps nothing keeps its captured level.
      el({
        text: 'Connect',
        box: { x: 900, y: 2400, width: 120, height: 24 },
        zIndex: 5,
        paintStack: [at('4.1', 14), at('4.1.5', 5), at('4.1.5.0', 0)],
      }),
    ]),
  )
  const nodes = walk(doc)
  const level = (match: (n: L1Node) => boolean): number | undefined =>
    (nodes.find((n) => match(n.node))!.node as { paintOrder?: number }).paintOrder

  it('test_UAT_FC_REQ-383_the_logo_paints_above_the_run_its_column_outranks', () => {
    const logo = level((n) => n.kind === 'image')
    const copyright = level((n) => textOf(n) === '© 2025. All rights reserved.')
    expect(copyright).toBe(7)
    expect(logo).toBe(8)
  })

  it('test_UAT_FC_REQ-383_an_element_that_overlaps_nothing_keeps_its_captured_level', () => {
    expect(level((n) => textOf(n) === 'Connect')).toBe(5)
  })
})
