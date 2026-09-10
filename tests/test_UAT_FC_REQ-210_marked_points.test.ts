// @vitest-environment jsdom
/**
 * REQ-210 — **Marked Points**: the reader points, and the pointing becomes text
 * in the message (DOC-52 §4).
 *
 * *"Move the st a little closer to the 1."* **A little** is a continuous
 * quantity with no efficient encoding in language, so the loop is intent →
 * words → guess → render → perception → words and nothing in it carries a
 * number. The session DOC-52 was written from ran thirteen iterations of that
 * and did not land the logo.
 *
 * WHAT THESE DRIVE. The overlay runs against the bytes `1c render --edit`
 * actually wrote, parsed by a real DOM and driven by real click and pointer
 * events — the same harness REQ-117's suite uses, for the same reason: the
 * whole subject is what a clicked pixel resolves to, and a fabricated document
 * would resolve to whatever the fabrication said.
 *
 * WHAT IS STUBBED, AND WHY IT HAS TO BE. jsdom has no layout engine, so
 * `getBoundingClientRect` answers zero for everything. A box is therefore
 * supplied per element — that is the ONE thing a browser would have provided,
 * and the arithmetic under test is precisely what turns it into the other
 * frames. The asset's bytes are fetched over HTTP, which is injected for the
 * usual reason.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { resolveEditTarget } from '../packages/framework/src/l1/edit-client'
import * as markedPoints from '../packages/framework/src/l1/marked-points'
import * as anchors from '../packages/site-schema/src/anchors'
import { measureScript } from '../tools/generate/src/cli/capture/measure-svg'
import { L1_EDIT_PAGE_ATTR } from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const HEADLINE = 'A painted band.'
/** The wordmark's own viewBox, so the numbers below are DOC-52's numbers. */
const VIEW_BOX = '0 0 320 86'
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW_BOX}">
  <text id="one" x="0" y="62" font-family="Satoshi" font-size="62">1</text>
</svg>`
const PREVIEW_URL = 'https://builder.test/preview/acme/edit/'

/** A page with a drawing in it and one run of copy beside it. */
function seedPage(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }, // [0.0]
      { kind: 'image', src: 'assets/mark.svg', alt: 'The wordmark' }, // [0.1]
    ],
  }
  home.l1.root = root
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

async function editDom(cwd: string, slug: string): Promise<JSDOM> {
  const { outDir } = await cmdRender(slug, { cwd, edit: true })
  return new JSDOM(readFileSync(path.join(outDir, 'index.html'), 'utf8'), { url: PREVIEW_URL })
}

/** Give one element the box a browser would have measured. */
function withBox(
  el: Element,
  box: { left: number; top: number; width: number; height: number },
): void {
  el.getBoundingClientRect = () =>
    ({
      left: box.left,
      top: box.top,
      right: box.left + box.width,
      bottom: box.top + box.height,
      width: box.width,
      height: box.height,
      x: box.left,
      y: box.top,
      toJSON: () => ({}),
    }) as DOMRect
}

/** A composer stand-in with the two calls the controller is given by `app.js`. */
function composer() {
  let markdown = ''
  return {
    get: () => markdown,
    set: (md: string) => void (markdown = md),
    insertToken: (token: string) => {
      markdown = `${markdown}${markdown === '' || /\s$/.test(markdown) ? '' : ' '}${token} `
    },
    removeToken: (label: string) => {
      markdown = markdown.replace(new RegExp(`\\[\\s*point\\s+${label}\\s*\\]\\s?`, 'gi'), '')
    },
  }
}

let createMarkedPoints: (opts?: Record<string, unknown>) => never

beforeAll(async () => {
  ;({ createMarkedPoints } = await import('../apps/control-app/src/builder/points.js'))
})

describe('REQ-210 — the user can point', () => {
  let cwd: string
  let dom: JSDOM
  let doc: Document
  let box: ReturnType<typeof composer>
  let controller: ReturnType<typeof createMarkedPoints>
  let img: HTMLImageElement
  let copy: Element
  let fetched: string[]

  const api = {
    resolveEditTarget,
    L1_EDIT_PAGE_ATTR,
    markedPoints,
    anchors,
    measureScript,
  }

  /** Click the preview at a viewport coordinate, on a given element. */
  function clickAt(el: Element, clientX: number, clientY: number): void {
    el.dispatchEvent(
      new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, clientX, clientY }),
    )
  }

  beforeEach(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req210-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
    dom = await editDom(cwd, 'acme')
    doc = dom.window.document
    // jsdom does not implement hit testing; the drag path asks for it, and a
    // click supplies its own target and never does.
    doc.elementFromPoint = () => null
    img = doc.querySelector('img')!
    copy = [...doc.querySelectorAll('*')].find(
      (n) => n.children.length === 0 && n.textContent === HEADLINE,
    )!
    // The drawing at its natural size, so user space and node space coincide and
    // a wrong inversion is visible rather than merely differently wrong.
    withBox(img, { left: 100, top: 50, width: 320, height: 86 })
    withBox(copy, { left: 0, top: 0, width: 600, height: 40 })
    fetched = []
    box = composer()
    controller = createMarkedPoints({
      api,
      insertToken: box.insertToken,
      removeToken: box.removeToken,
      fetch: async (url: string) => {
        fetched.push(url)
        return { ok: true, text: async () => MARK_SVG } as Response
      },
      // The measurement the `near:` line names its lines from. Injected because
      // jsdom has no canvas; REQ-209's own browser suite is what proves the
      // script measures, and what is under test HERE is that a measurement
      // reaches the pill as vocabulary rather than as coordinates.
      measure: async () => ({
        viewBox: [0, 0, 320, 86],
        fonts: [
          {
            key: 'f0',
            requested: 'Satoshi',
            resolved: 'Satoshi',
            generic: false,
            capHeight: 0.7,
            xHeight: 0.5,
            ascender: 0.75,
            descender: -0.25,
          },
        ],
        nodes: [
          {
            ref: '#one',
            text: '1',
            font: 'f0',
            fontSize: 62,
            box: [0, 15.5, 34.4, 62],
            ink: [1.2, 18.6, 24.8, 43.4],
            baseline: 62,
            advanceStart: 0,
            advanceWidth: 34.4,
          },
        ],
        warnings: [],
      }),
    })
    controller.bind(doc)
  })

  afterEach(() => {
    controller.destroy()
    rmSync(cwd, { recursive: true, force: true })
  })

  /** Let the asset fetch and the measurement settle. */
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

  // ── the mode ───────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-210_the_toggle_is_what_reassigns_the_click', () => {
    // OFF: the gesture is still the editor's. Nothing is intercepted, nothing is
    // placed, and the click reaches the bridge exactly as it did before.
    const before = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY: 10,
    })
    copy.dispatchEvent(before)
    expect(before.defaultPrevented).toBe(false)
    expect(controller.list()).toEqual([])
    expect(box.get()).toBe('')

    // ON: the click places a point and is stopped, so the bridge's own
    // bubble-phase handler — and the modal behind it — never runs.
    controller.setActive(true)
    const after = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY: 10,
    })
    copy.dispatchEvent(after)
    expect(after.defaultPrevented).toBe(true)
    expect(controller.list()).toHaveLength(1)
    expect(box.get().trim()).toBe('[Point A]')
    // And it is unmistakable while it is on, rather than a silent reassignment.
    expect(doc.body.hasAttribute('data-fc-points')).toBe(true)

    controller.setActive(false)
    expect(doc.body.hasAttribute('data-fc-points')).toBe(false)
  })

  // ── what a point resolves to ───────────────────────────────────────────────

  it('test_UAT_FC_REQ-210_a_point_in_a_drawing_reports_svg_user_space', async () => {
    controller.setActive(true)
    clickAt(img, 131.2, 74.8)
    await settle()

    const [point] = controller.list()
    expect(point.drawing).toMatchObject({
      asset: 'assets/mark.svg',
      viewBox: [0, 0, 320, 86],
    })
    // The box is the drawing's natural size, so user space is node space — and
    // these are DOC-52 §4.6's own numbers.
    expect(point.drawing.x).toBeCloseTo(31.2, 3)
    expect(point.drawing.y).toBeCloseTo(24.8, 3)

    // WITHOUT INLINING IT. The renderer emits `<img src="…svg">` and one cannot
    // hit-test inside an `<img>` — but one does not have to, and the document
    // the reader is looking at is not modified to make it possible.
    expect(doc.querySelector('svg')).toBeNull()
    expect(fetched).toEqual([`${PREVIEW_URL}assets/mark.svg`])
  })

  it('test_UAT_FC_REQ-210_near_names_lines_from_the_anchor_vocabulary', async () => {
    controller.setActive(true)
    // Just under the digit's cap line: cap-top is 62 − 0.7 × 62 = 18.6.
    clickAt(img, 100 + 10, 50 + 21)
    await settle()

    const [point] = controller.list()
    const named = point.near.map((line: { anchor: string }) => line.anchor)
    // Every name is one the closed set admits — the pill is not free to invent a
    // word for a line, because `relate` and `solve` answer from the same set.
    for (const anchor of named) expect(anchors.ANCHOR_NAMES).toContain(anchor)
    expect(named).toContain('cap-top')

    const expansion = markedPoints.formatMarkedPoint(point)
    expect(expansion).toContain('cap-top of "1"')
    // The distance is reported and the point is NOT snapped: someone who meant
    // *just below* has said so, and the line is offered rather than imposed.
    expect(expansion).toMatch(/cap-top of "1" \(2\.4u above\)/)
  })

  it('test_UAT_FC_REQ-210_the_expansion_carries_the_width_and_document_coordinates', async () => {
    // Scrolled, so client and document coordinates genuinely differ — which is
    // the whole reason the document pair is what travels.
    Object.defineProperty(dom.window, 'scrollY', { value: 400, configurable: true })
    Object.defineProperty(dom.window, 'innerWidth', { value: 375, configurable: true })
    controller.setActive(true)
    clickAt(img, 142, 88)
    await settle()

    const [point] = controller.list()
    expect(point.doc).toEqual({ x: 142, y: 488 })
    expect(point.viewportWidth).toBe(375)

    const { markdown } = markedPoints.expandMarkedPoints('Move it to [Point A].', [point])
    expect(markdown).toContain('viewport:       (142, 488) at width 375')
    // The render it was taken against, so a stale reference is detectable.
    expect(markdown).toMatch(/render:\s+page home, render 1/)
    // And the prose is still a sentence: the pill flattens, the block follows.
    expect(markdown).toContain('Move it to Point A.')
  })

  it('test_UAT_FC_REQ-210_several_points_expand_to_distinct_entries', async () => {
    controller.setActive(true)
    clickAt(img, 110, 60)
    clickAt(copy, 20, 20)
    await settle()

    expect(controller.list().map((p: { label: string }) => p.label)).toEqual(['A', 'B'])
    expect(box.get().trim()).toBe('[Point A] [Point B]')

    const { markdown } = markedPoints.expandMarkedPoints(box.get(), controller.list())
    expect(markdown).toContain('Point A — inside image node 0.1')
    expect(markdown).toContain('Point B — inside copy node 0.0')
    // The width-ambiguity rule (DOC-52 §4.9): B is on an L1 node, whose geometry
    // is keyframed, so the assistant is told to ask which width is meant.
    expect(markdown).toContain('ask which width the instruction is for')
  })

  // ── the pill ───────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-210_the_plus_control_restores_a_deleted_pill', async () => {
    controller.setActive(true)
    clickAt(img, 110, 60)
    await settle()

    // The failure this exists for: the reader starts typing, makes a mistake,
    // and takes the pill out with it. The X is still on the page and there is
    // no way left to refer to it.
    box.set('Move it closer')
    expect(markedPoints.referencedPointLabels(box.get(), ['A'])).toEqual([])

    const plus = doc.querySelector('.fc-point[data-point="A"] [data-act="refer"]')!
    plus.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(markedPoints.referencedPointLabels(box.get(), ['A'])).toEqual(['A'])
    // The SAME point — same coordinates, not a new one placed near it.
    const { used } = markedPoints.expandMarkedPoints(box.get(), controller.list())
    expect(used).toHaveLength(1)
    expect(used[0].doc).toEqual({ x: 110, y: 60 })
  })

  it('test_UAT_FC_REQ-210_deleting_a_point_takes_its_pills_with_it', async () => {
    controller.setActive(true)
    clickAt(img, 110, 60)
    clickAt(copy, 20, 20)
    await settle()
    expect(box.get().trim()).toBe('[Point A] [Point B]')

    const drop = doc.querySelector('.fc-point[data-point="A"] [data-act="delete"]')!
    drop.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))

    // NOT MERELY TIDY. The letter is free again immediately, so a reference left
    // behind would bind to a different point the next time A is handed out.
    expect(box.get().trim()).toBe('[Point B]')
    expect(doc.querySelector('.fc-point[data-point="A"]')).toBeNull()
    clickAt(copy, 30, 30)
    expect(controller.list().map((p: { label: string }) => p.label)).toEqual(['B', 'A'])
  })

  it('test_UAT_FC_REQ-210_a_fresh_label_fades_when_the_pointer_leaves_it', async () => {
    controller.setActive(true)
    clickAt(img, 110, 60)
    const mark = doc.querySelector('.fc-point[data-point="A"]')!
    // Fresh on placement — the label says which point this is, and it has not
    // been read yet.
    expect(mark.classList.contains('is-fresh')).toBe(true)

    // A pointer that has not left it does not fade it. NOT ON A TIMER: a timed
    // fade fires while the reader is still reading.
    doc.dispatchEvent(
      new dom.window.MouseEvent('pointermove', { bubbles: true, clientX: 118, clientY: 66 }),
    )
    expect(mark.classList.contains('is-fresh')).toBe(true)

    doc.dispatchEvent(
      new dom.window.MouseEvent('pointermove', { bubbles: true, clientX: 400, clientY: 400 }),
    )
    expect(mark.classList.contains('is-fresh')).toBe(false)

    // And the next point landing takes the previous one's label with it, so a
    // label never occludes where the next point is going.
    clickAt(copy, 20, 20)
    expect(doc.querySelector('.fc-point[data-point="B"]')!.classList.contains('is-fresh')).toBe(
      true,
    )
  })

  // ── the send ───────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-210_points_clear_on_send_and_the_marks_grey_out', async () => {
    controller.setActive(true)
    clickAt(img, 110, 60)
    await settle()

    const out = controller.expand(box.get())
    expect(out).toContain('Marked points (this turn):')
    // CLEARED as live points: the letter is free and a new point starts over.
    expect(controller.list()).toEqual([])

    // STILL VISIBLE, and inert. The reader is owed a view of what they referred
    // to while the answer is being written; the marks are already dead by then,
    // so leaving them on screen reintroduces no staleness.
    const mark = doc.querySelector('.fc-point[data-point="A"]')!
    expect(mark.classList.contains('is-sent')).toBe(true)

    // Until the new render arrives — a new document is a new render, and a point
    // marked BECAUSE something should move cannot survive it moving.
    controller.bind(doc)
    expect(doc.querySelector('.fc-point')).toBeNull()
    expect(controller.getRenderOrdinal()).toBe(2)
  })

  it('test_UAT_FC_REQ-210_only_referenced_points_are_sent', async () => {
    controller.setActive(true)
    clickAt(img, 110, 60)
    clickAt(copy, 20, 20)
    await settle()

    // B's pill was deleted and never restored, so B is a point the reader chose
    // not to mention. Sending it anyway would make the `+` control pointless.
    box.set('Nudge [Point A] left.')
    const out = controller.expand(box.get())
    expect(out).toContain('Point A —')
    expect(out).not.toContain('Point B —')
  })
})

// ── the arithmetic, on its own ───────────────────────────────────────────────

describe('REQ-210 — inverting the chain', () => {
  const drawing = markedPoints.readDrawingIntrinsics(MARK_SVG)!

  it('test_UAT_FC_REQ-210_a_drawing_reports_its_own_view_of_itself', () => {
    expect(drawing.viewBox).toEqual([0, 0, 320, 86])
    expect(drawing.intrinsic).toBeNull()
    // The spec's default said rather than left implicit: an omitted attribute is
    // `xMidYMid meet`, and treating it as `none` letterboxes nothing and
    // silently mislocates every point in a box of a different ratio.
    expect(drawing.preserveAspectRatio).toBe('xMidYMid meet')
    expect(markedPoints.readDrawingIntrinsics('<svg><text>no viewBox</text></svg>')).toBeNull()
  })

  it('test_UAT_FC_REQ-210_object_fit_decides_where_the_drawing_is_painted', () => {
    // `fill`, the initial value: the drawing stretches to the box, so a box of
    // twice the size halves every user coordinate.
    expect(
      markedPoints.toUserSpace(
        { x: 62.4, y: 49.6 },
        { width: 640, height: 172, objectFit: 'fill', objectPosition: '50% 50%' },
        drawing,
      ),
    ).toEqual({ x: 31.2, y: 24.8 })

    // `contain` in a box of a different ratio letterboxes, and the letterbox is
    // exactly what a single-stage inversion gets wrong: 320×172 fits the ratio
    // at scale 1 and centres it 43px down.
    const contained = markedPoints.toUserSpace(
      { x: 31.2, y: 43 + 24.8 },
      { width: 320, height: 172, objectFit: 'contain', objectPosition: '50% 50%' },
      drawing,
    )!
    expect(contained.x).toBeCloseTo(31.2, 6)
    expect(contained.y).toBeCloseTo(24.8, 6)

    // `object-position` moves the painted box, and the point moves with it.
    expect(
      markedPoints.toUserSpace(
        { x: 31.2, y: 24.8 },
        { width: 320, height: 172, objectFit: 'contain', objectPosition: '50% 0%' },
        drawing,
      ),
    ).toEqual({ x: 31.2, y: 24.8 })
  })

  it('test_UAT_FC_REQ-210_preserve_aspect_ratio_is_the_second_stage', () => {
    // `object-fit: fill` hands the drawing a viewport of a different ratio, and
    // the drawing's OWN `preserveAspectRatio` then letterboxes inside it. The
    // two stages agree — and collapsing them looks harmless — right up until
    // this case, where a single stage puts every point in the wrong place.
    const meet = markedPoints.readDrawingIntrinsics(
      `<svg viewBox="${VIEW_BOX}" preserveAspectRatio="xMidYMid meet"></svg>`,
    )!
    const stretched = { width: 320, height: 172, objectFit: 'fill', objectPosition: '50% 50%' }
    const letterboxed = markedPoints.toUserSpace({ x: 31.2, y: 43 + 24.8 }, stretched, meet)!
    expect(letterboxed.x).toBeCloseTo(31.2, 6)
    expect(letterboxed.y).toBeCloseTo(24.8, 6)

    // `none` is the one value that says stretch, and then the two stages really
    // are one.
    const none = markedPoints.readDrawingIntrinsics(
      `<svg viewBox="${VIEW_BOX}" preserveAspectRatio="none"></svg>`,
    )!
    expect(markedPoints.toUserSpace({ x: 31.2, y: 49.6 }, stretched, none)).toEqual({
      x: 31.2,
      y: 24.8,
    })
  })

  it('test_UAT_FC_REQ-210_a_typed_reference_resolves_and_an_unknown_one_does_not', () => {
    // Lenient, because a pill deleted by accident is the failure `+` exists for
    // and a reader who retypes `Point A` should be understood.
    expect(markedPoints.referencedPointLabels('align [Point A] with point b', ['A', 'B'])).toEqual([
      'A',
      'B',
    ])
    // And confined to LIVE labels, so ordinary prose about a point of view is
    // never mistaken for a reference.
    expect(markedPoints.referencedPointLabels('that is a fair point c', ['A'])).toEqual([])
    // A letter is reused the moment its point is gone, which is what keeps the
    // namespace small enough to read.
    expect(markedPoints.nextPointLabel(['A', 'C'])).toBe('B')
  })

  it('test_UAT_FC_REQ-210_anchor_lines_are_reported_per_axis_and_never_snapped', () => {
    const nodes = [
      {
        ref: '#one',
        text: '1',
        font: 'f0',
        fontSize: 62,
        box: [0, 15.5, 34.4, 62] as [number, number, number, number],
        ink: [1.2, 18.6, 24.8, 43.4] as [number, number, number, number],
        baseline: 62,
        advanceStart: 0,
        advanceWidth: 34.4,
      },
    ]
    const fonts = {
      f0: {
        requested: 'Satoshi',
        resolved: 'Satoshi',
        generic: false,
        capHeight: 0.7,
        xHeight: 0.5,
        ascender: 0.75,
        descender: -0.25,
      },
    }
    const near = anchors.nearestAnchors(nodes, fonts, { x: 26, y: 21 })
    // ONE PER AXIS AT LEAST: a y-line and an x-line are not competing to be the
    // nearest thing. A purely-nearest list reports two horizontals for a point
    // sitting squarely on a corner, which answers half the question twice.
    expect(near.filter((l) => l.axis === 'y').length).toBeGreaterThan(0)
    expect(near.filter((l) => l.axis === 'x').length).toBeGreaterThan(0)

    const capTop = near.find((l) => l.anchor === 'cap-top')!
    expect(capTop.value).toBeCloseTo(18.6, 3)
    // The SIGN is the direction: the line is above the point, and the point is
    // left exactly where it was put.
    expect(capTop.delta).toBeCloseTo(-2.4, 3)
    expect(capTop.label).toBe('cap-top of "1"')

    // `ink-right` and `advance-end` differ by 8.4 units on this glyph, which is
    // the whole reason the families are named separately — "where the 1 ends"
    // is two different numbers and the vocabulary has to say which.
    const inkRight = anchors.anchorValue({ node: nodes[0], font: fonts.f0 }, 'ink-right')
    const advanceEnd = anchors.anchorValue({ node: nodes[0], font: fonts.f0 }, 'advance-end')
    expect(advanceEnd - inkRight).toBeCloseTo(8.4, 3)
  })
})

// ── the composition ──────────────────────────────────────────────────────────

if (!WEBUI_INSTALLED) console.warn(`REQ-210 composition suite skipped: ${WEBUI_SKIP_REASON}`)

let createChatPanel: (opts?: Record<string, unknown>) => never

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createChatPanel } = await import('../apps/control-app/src/builder/chat.js'))
  }
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-210 — the pill reaches the assistant', () => {
  const streamOf = (events: unknown[]) =>
    async function* () {
      for (const event of events) yield event
    }

  it('test_UAT_FC_REQ-210_the_turn_carries_the_expansion_and_the_bubble_keeps_the_pill', async () => {
    const sent: string[] = []
    const chat = createChatPanel({
      transport: {
        streamPrompt: (_id: string, text: string) => {
          sent.push(text)
          return streamOf([{ kind: 'text', content: 'Done.' }, { kind: 'done' }])()
        },
      },
      expandPrompt: (markdown: string) => `${markdown}\n\nMarked points (this turn):\n\nPoint A — …`,
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'site-alpha', turns: [], ready: true })

    await chat.getChat().send('Move the st to [Point A].')

    // The assistant is told the whole thing — the marks live in the reader's own
    // browser overlay and are in no render it ever sees, so this expansion is
    // the entire channel.
    expect(sent).toHaveLength(1)
    expect(sent[0]).toContain('Marked points (this turn):')

    // And the bubble the reader watches appear keeps the short form they typed.
    const said = chat.getChat().getMessages()
    expect(said[0]).toMatchObject({ role: 'user', markdown: 'Move the st to [Point A].' })
    chat.destroy()
  })

  it('test_UAT_FC_REQ-210_a_pill_survives_cut_and_paste_in_the_real_composer', async () => {
    const chat = createChatPanel({ transport: { streamPrompt: () => streamOf([])() } })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'site-alpha', turns: [], ready: true })
    const panel = chat.getChat()

    // Placed by the overlay, through the two calls `app.js` gives the controller.
    panel.setInputMarkdown('Move the st to [Point A] please')
    const area = chat.element.querySelector('textarea')!

    // Cut it out and paste it back — the pill is a literal in the draft's own
    // markdown, so the clipboard carries its identity with it and nothing has to
    // reconstitute a node.
    area.value = 'Move the st to  please'
    area.dispatchEvent(new Event('input', { bubbles: true }))
    expect(markedPoints.referencedPointLabels(panel.getInputMarkdown(), ['A'])).toEqual([])

    area.value = 'Move the st to [Point A] please'
    area.dispatchEvent(new Event('input', { bubbles: true }))
    expect(markedPoints.referencedPointLabels(panel.getInputMarkdown(), ['A'])).toEqual(['A'])
    chat.destroy()
  })
})

// ── the wiring ───────────────────────────────────────────────────────────────

describe('REQ-210 — one implementation, served', () => {
  it('test_UAT_FC_REQ-210_the_browser_runs_the_same_modules_the_tools_do', () => {
    const assets = readFileSync('tools/generate/src/cli/assets.ts', 'utf8')
    const entry = readFileSync('apps/control-app/src/builder/main.js', 'utf8')
    // Every module the overlay reaches for is SERVED from its one definition
    // site rather than copied into the browser — `anchors.ts` is what `relate`
    // and `solve` answer from, and `measureScript` is what the capture driver
    // evaluates, so a second copy of either would be a second opinion about
    // what `cap-top` means or where the ink is.
    for (const [name, source] of [
      ['marked-points', 'packages/framework/src/l1/marked-points.ts'],
      ['site-schema-anchors', 'packages/site-schema/src/anchors.ts'],
      ['measure-svg', 'tools/generate/src/cli/capture/measure-svg.ts'],
    ]) {
      expect(assets).toContain(`'${name}': '${source}'`)
      expect(entry).toContain(`'/framework/${name}.js'`)
    }
  })
})
