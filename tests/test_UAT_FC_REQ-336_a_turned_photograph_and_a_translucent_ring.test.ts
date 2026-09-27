/**
 * REQ-336 — three losses on one collage: a rotation the fold threw away, a
 * translucency the capture flattened, and an instrument that reported neither.
 *
 * ## Issue 1 — the fold was the only stage that could not carry a rotation
 *
 * faelan.com turns each of four collage photographs a few degrees with a
 * `transform:rotate()` on the `<div>` that wraps it (`-5`, `3`, `-8`, `4`). The
 * capture records that as `transformRotateDeg`, `l1TransformSchema` has carried
 * `rotateDeg` since REQ-91, and the renderer emits `rotate(<deg>)` — but
 * `foldToL1` attached `transform` to no node of any kind, so a fresh fold of that
 * bundle contained the string `transform` zero times. Four photographs reproduced
 * square-on, and it was worth EVERY ONE of the round's twelve ranked pixel regions
 * (100% of a 71051.80 score) and the only four HIGH value deltas
 * (`rot -8°` against `rot 0°`, and its three siblings).
 *
 * The loss was never image-specific: `transform` lives on `nodeAxisGroupsShape`,
 * so every leaf kind can hold one, and a rotated headline was lost the same way.
 * It is read at all three leaf branches for that reason.
 *
 * ## Issue 2 — a 30%-white ring painted solid white
 *
 * `border:4px solid rgba(255,255,255,.3)` was recorded `#ffffff`, and
 * `color:#ffffffe6` likewise, because `rgbToHex` drops alpha by contract. That
 * contract is right for a colour the capture has already composited against what
 * sits behind it and wrong for one the BROWSER composites at paint time. Worth
 * ZERO deltas in both directions: the image card compared five parameters and
 * `border` was not one of them, and the text colour was compared but read
 * `#ffffff` on BOTH sides — the same helper measured the reference and the
 * reproduction, so the comparison was symmetric and the pixels still differed.
 * `colorDistance` could not have told them apart either: it resolves through
 * `colorToHex`, which slices an 8-digit literal down to six.
 *
 * Four stages had to move together or none of them shows: the capture (keep the
 * fourth channel), the fold (`colorToHexAlpha`, which also stops `colorToHex`
 * REFUSING the 8-digit literal the capture now writes), the comparator (compare
 * the alpha beside the distance) and the object card (a `border` row on an image,
 * so a reader can see the ring on both sides).
 *
 * ## Issue 3 — `foldResiduals: []` on a fold that had just dropped four rotations
 *
 * A residual was a per-ELEMENT fact (emitted / not emitted) when the thing it
 * describes is a per-AXIS one. The four photographs WERE emitted, so no residual
 * was ever considered for them — and `transformRotateDeg` was already in
 * `capturedAxesOf`'s vocabulary, so the fold could name the very thing it was
 * losing and never did. DOC-21 makes that list the completeness signal for the
 * growth loop; on this bundle it reported that nothing was lost.
 *
 * The test that separates a real fix from a suppression is in both directions: a
 * dropped axis must be NAMED, and a leaf that carried everything must report
 * nothing. A change that only ever prints `[]` passes neither.
 *
 * Every number below is faelan.com's own, transcribed from
 * `storage/references/faelan.com/index` (its stylesheet's four `rotate()`
 * declarations, its `.photo-circle` ring, its header paragraph colour) and from
 * `iteration-3`'s `values-diff.json`. The bundle is untracked, so the values are
 * inlined rather than read — and the capture leg is driven through the real
 * `EXTRACT_SCRIPT` under jsdom rather than against a recorded artifact, because
 * the artifact is exactly what was wrong.
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { foldToL1 } from '../tools/generate/src'
import {
  EXTRACT_SCRIPT,
  diffManifests,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'
import type { FoldResidual } from '../tools/generate/src/l1/fold'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1 } from '../packages/site-schema/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import type { MultiStateCapture, StateProjection } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

/** The page's four collage rotations, with the boxes the capture recorded them on. */
const COLLAGE = [
  { alt: 'Faelan', rotateDeg: -5, box: { x: 932, y: 68, width: 216, height: 216 } },
  { alt: 'Ghostship', rotateDeg: 3, box: { x: 64, y: 40, width: 320, height: 205.7 } },
  { alt: 'Faelan with violin', rotateDeg: -8, box: { x: 192, y: 360, width: 260, height: 259.13 } },
  { alt: 'Alley scene', rotateDeg: 4, box: { x: 448, y: 144, width: 450, height: 599.66 } },
]

// ── fixtures ────────────────────────────────────────────────────────────────

function multi(elements: ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `t:${width}`,
      elements,
      sections: [] as never,
      viewport: { width, height: 900 },
    },
  }))
  return { url: 'http://faelan.test/', notes: [], projections }
}

function picture(over: Partial<ValueElement>): ValueElement {
  return {
    role: 'img',
    text: '',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'img',
    objectFit: 'cover',
    src: 'a.jpg',
    ...over,
  } as ValueElement
}

function run(over: Partial<ValueElement> & { text: string }): ValueElement {
  return {
    role: 'body',
    color: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 18,
    fontWeight: 400,
    lineHeightPx: 29,
    ...over,
  } as ValueElement
}

function panel(over: Partial<ValueElement>): ValueElement {
  return {
    role: 'generic',
    text: '',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    surfaceFill: '#0b101e',
    ...over,
  } as ValueElement
}

function nodesOf(doc: L1Document): L1Node[] {
  const out: L1Node[] = []
  const walk = (nodes: readonly L1Node[]): void => {
    for (const n of nodes) {
      out.push(n)
      walk(n.kind === 'container' ? n.children : ((n as { children?: L1Node[] }).children ?? []))
    }
  }
  walk([doc.root])
  return out
}

const imageByAlt = (doc: L1Document, alt: string): L1Node =>
  nodesOf(doc).find((n) => n.kind === 'image' && (n as { alt?: string }).alt === alt)!

/** The whole collage, as the bundle recorded it: four turned photographs. */
const collagePage = (): MultiStateCapture =>
  multi(COLLAGE.map((c) => picture({ alt: c.alt, box: { ...c.box }, transformRotateDeg: c.rotateDeg, transformScale: 1 })))

function manifest(source: string, elements: ValueElement[]): ValueManifest {
  return { source, elements, sections: [], viewport: { width: 1280, height: 800 } }
}

/** Run the real `EXTRACT_SCRIPT` over a DOM, stubbing layout via a class→box map. */
function extract(html: string, boxByClass: Record<string, [number, number, number, number]>): {
  bands: Array<{
    content?: Array<{ text: string; color?: string }>
    fields?: Array<{ alt?: string; borderColor?: string | null; borderWidthPx?: number }>
  }>
} {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  const rect = (x: number, y: number, w: number, h: number): DOMRect =>
    ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect
  dom.window.Element.prototype.getBoundingClientRect = function (): DOMRect {
    const b = boxByClass[(this as Element).className || '']
    return b ? rect(...b) : rect(0, 0, 0, 0)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 900 })
  const win = dom.window as unknown as { eval(s: string): unknown }
  return win.eval(EXTRACT_SCRIPT) as ReturnType<typeof extract>
}

// ── issue 1 ─────────────────────────────────────────────────────────────────

describe('REQ-336 issue 1 — a captured wrapper rotation reaches the rendered page', () => {
  it('test_UAT_FC_REQ-336_all_four_collage_rotations_fold_and_render', () => {
    const doc = foldToL1(collagePage())

    // THE FIX, at the stage that lost it: one `transform` per turned photograph,
    // carrying the page's own degrees. Before this the document held none.
    for (const c of COLLAGE) {
      expect(imageByAlt(doc, c.alt).transform).toEqual({ rotateDeg: c.rotateDeg })
    }
    expect(nodesOf(doc).filter((n) => n.transform).length).toBe(4)

    // It survives the substrate and reaches the browser: four `rotate()`s, at the
    // four declared angles, in the CSS the renderer emits. `grep -c "rotate("` on
    // the reproduction's own HTML read 0 for this page.
    expect(validateL1(doc).ok).toBe(true)
    const { css } = renderL1Document(doc)
    for (const c of COLLAGE) expect(css).toContain(`rotate(${c.rotateDeg}deg)`)
  })

  it('test_UAT_FC_REQ-336_a_rotation_moves_no_layout_box', () => {
    // Why this could not create new findings, stated as a measurement rather than
    // as a promise: a CSS transform paints outside the layout box without changing
    // it, so every keyframe the fold pins is the one it pinned before — no `escape`
    // and no overlap can appear from turning a picture.
    const turned = foldToL1(collagePage())
    const flat = foldToL1(
      multi(COLLAGE.map((c) => picture({ alt: c.alt, box: { ...c.box }, transformRotateDeg: 0, transformScale: 1 }))),
    )

    for (const c of COLLAGE) {
      expect(imageByAlt(turned, c.alt).geometry).toEqual(imageByAlt(flat, c.alt).geometry)
    }
  })

  it('test_UAT_FC_REQ-336_a_rotated_run_and_a_rotated_panel_carry_it_too', () => {
    // NOT AN IMAGE AXIS. `transform` is a node field on every kind, and this
    // bundle only happens to rotate photographs — a tilted badge or an angled
    // panel was lost identically, so it is read at every leaf branch.
    const doc = foldToL1(
      multi([
        run({
          text: 'Angled pull-quote',
          box: { x: 40, y: 40, width: 400, height: 40 },
          renderedTextBox: { x: 40, y: 40, width: 400, height: 21 },
          transformRotateDeg: -2.5,
          transformScale: 1,
        }),
        panel({ box: { x: 40, y: 200, width: 300, height: 120 }, transformRotateDeg: 6, transformScale: 1 }),
      ]),
    )

    const text = nodesOf(doc).find((n) => n.kind === 'text')
    const box = nodesOf(doc).find((n) => n.kind === 'box' && n.transform !== undefined)
    expect(text?.transform).toEqual({ rotateDeg: -2.5 })
    expect(box?.transform).toEqual({ rotateDeg: 6 })
    expect(validateL1(doc).ok).toBe(true)
  })

  it('test_UAT_FC_REQ-336_a_scale_folds_and_the_identity_does_not', () => {
    // The field pair moves together (the same capture read, the same loss), and
    // the IDENTITY is not a transform: `rotate(0deg)`/`scale(1)` move no pixel and
    // emitting one would promote the node into the positioned paint layer for
    // nothing. (`transformScale` is unevidenced on this bundle — every field reads
    // 1 — and is here because it is the same read, not because it was measured.)
    const scaled = foldToL1(
      multi([picture({ alt: 'shrunk', box: { x: 0, y: 0, width: 100, height: 100 }, transformRotateDeg: 0, transformScale: 0.8 })]),
    )
    expect(imageByAlt(scaled, 'shrunk').transform).toEqual({ scale: 0.8 })

    const upright = foldToL1(
      multi([picture({ alt: 'square-on', box: { x: 0, y: 0, width: 100, height: 100 }, transformRotateDeg: 0, transformScale: 1 })]),
    )
    expect(imageByAlt(upright, 'square-on').transform).toBeUndefined()
  })

  it('test_UAT_FC_REQ-336_an_out_of_envelope_rotation_is_dropped_not_carried', () => {
    // `L1_ENVELOPE.rotateDeg` is ±3600 and `validateL1` REFUSES a document past
    // it — which would cost the whole fold, every element of it, over one absurd
    // value. So it is dropped rather than clamped (half-honouring a ten-turn
    // rotation is not a design) and the document still validates. The drop is not
    // silent: see the residual leg below.
    const doc = foldToL1(
      multi([picture({ alt: 'spun', box: { x: 0, y: 0, width: 100, height: 100 }, transformRotateDeg: 5000, transformScale: 1 })]),
    )

    expect(imageByAlt(doc, 'spun').transform).toBeUndefined()
    expect(validateL1(doc).ok).toBe(true)
  })
})

// ── issue 3 ─────────────────────────────────────────────────────────────────

describe('REQ-336 issue 3 — an emitted leaf reports the axis it dropped', () => {
  it('test_UAT_FC_REQ-336_a_dropped_axis_on_an_emitted_leaf_is_named', () => {
    // A LIVE instance of the class the round could not see: the leaf IS emitted
    // (a full image node, with its fit and its box), and one painted axis on it is
    // not carried. Before this, that was indistinguishable from losing nothing.
    const residuals: FoldResidual[] = []
    foldToL1(
      multi([picture({ alt: 'spun', box: { x: 0, y: 0, width: 100, height: 100 }, transformRotateDeg: 5000, transformScale: 1 })]),
      { residuals },
    )

    expect(residuals).toHaveLength(1)
    expect(residuals[0].kind).toBe('image')
    expect(residuals[0].reason).toMatch(/emitted/)
    expect(residuals[0].capturedAxes).toContain('transformRotateDeg')
  })

  it('test_UAT_FC_REQ-336_a_leaf_that_carried_the_rotation_reports_nothing', () => {
    // The other half, and the half that separates a fix from a suppression: on the
    // page issue 1 fixes, the list is EMPTY — and empty for the true reason, because
    // the identical shape above is not. A change that only ever prints `[]` fails
    // the first of these two and a change that always speaks fails this one.
    const residuals: FoldResidual[] = []
    foldToL1(collagePage(), { residuals })

    expect(residuals).toEqual([])
  })

  it('test_UAT_FC_REQ-336_a_runs_card_treatment_is_not_claimed_as_a_drop', () => {
    // The noise this must not become. A text run's fill, border, rounding and
    // shadow are read off the enclosing CARD (or off its own element) and carried
    // by the card/band boxes rebuilt after the fold's loop — not by the text node.
    // Judging them from the node would file a residual for every run on every page
    // with a background colour, and a list of rows nobody can act on is worth less
    // than no list.
    const residuals: FoldResidual[] = []
    foldToL1(
      multi([
        run({
          text: 'Body copy on a card',
          box: { x: 40, y: 40, width: 400, height: 40 },
          renderedTextBox: { x: 40, y: 40, width: 400, height: 21 },
          surfaceFill: '#101826',
          borderRadiusPx: 12,
          border: { widthPx: 1, color: '#334155', style: 'solid' },
        }),
      ]),
      { residuals },
    )

    expect(residuals).toEqual([])
  })

  it('test_UAT_FC_REQ-336_a_feather_the_text_leaf_cannot_hold_is_named', () => {
    // The vocabulary is per-axis now, so it reports more than the one axis that
    // sent it: a mask on a RUN is folded by no text branch, and that is a real
    // framework gap this list is for.
    const residuals: FoldResidual[] = []
    foldToL1(
      multi([
        run({
          text: 'Fading strapline',
          box: { x: 40, y: 40, width: 400, height: 40 },
          renderedTextBox: { x: 40, y: 40, width: 400, height: 21 },
          maskEdge: 'linear-gradient(to bottom, rgb(0, 0, 0) 60%, rgba(0, 0, 0, 0) 100%)',
        }),
      ]),
      { residuals },
    )

    expect(residuals).toHaveLength(1)
    expect(residuals[0].kind).toBe('text')
    expect(residuals[0].capturedAxes).toEqual(['maskEdge'])
  })
})

// ── issue 2 ─────────────────────────────────────────────────────────────────

describe('REQ-336 issue 2 — a translucent colour survives the capture, the fold and the comparison', () => {
  it('test_UAT_FC_REQ-336_the_capture_records_the_ring_and_the_paragraph_at_their_own_alpha', () => {
    // The page's own two declarations, through the real extractor. This is the
    // stage the alpha was lost at, so nothing downstream could recover it — and it
    // is why this issue needs a RE-CAPTURE rather than a refold before its
    // evidence moves.
    const signals = extract(
      `<!doctype html><html><body>
         <section class="band" style="background:#0b101e">
           <p class="para" style="color:#ffffffe6">Artist • Musician • Creator</p>
           <div class="wrap"><img class="pic" src="/a.jpg" alt="Faelan"
                style="border:4px solid rgba(255,255,255,.3);border-radius:9999px"></div>
         </section>
       </body></html>`,
      { band: [0, 0, 1280, 600], para: [40, 40, 400, 30], wrap: [932, 68, 216, 216], pic: [932, 68, 216, 216] },
    )

    const fields = signals.bands.flatMap((b) => b.fields ?? [])
    const ring = fields.find((f) => f.alt === 'Faelan')
    expect(ring?.borderWidthPx).toBe(4)
    // `rgba(255,255,255,.3)` — 30% white, not white. Recorded `#ffffff` before.
    expect(ring?.borderColor).toBe('#ffffff4d')

    const runs = signals.bands.flatMap((b) => b.content ?? [])
    expect(runs.find((r) => r.text.startsWith('Artist'))?.color).toBe('#ffffffe6')
  })

  it('test_UAT_FC_REQ-336_an_opaque_colour_is_still_written_in_six_digits', () => {
    // Why no bundle has to be re-captured to keep comparing clean: this only adds
    // digits where there were digits to add. `#ffffffff` and `#ffffff` paint the
    // same pixel, and two spellings of one value is the drift this refuses.
    const signals = extract(
      `<!doctype html><html><body>
         <section class="band" style="background:#0b101e">
           <p class="para" style="color:#ffffff">Solid</p>
           <div class="wrap"><img class="pic" src="/a.jpg" alt="Solid ring"
                style="border:2px solid #ffffff"></div>
         </section>
       </body></html>`,
      { band: [0, 0, 1280, 600], para: [40, 40, 400, 30], wrap: [932, 68, 216, 216], pic: [932, 68, 216, 216] },
    )

    expect(signals.bands.flatMap((b) => b.fields ?? []).find((f) => f.alt === 'Solid ring')?.borderColor).toBe('#ffffff')
    expect(signals.bands.flatMap((b) => b.content ?? []).find((r) => r.text === 'Solid')?.color).toBe('#ffffff')
  })

  it('test_UAT_FC_REQ-336_the_fold_and_the_renderer_keep_the_alpha', () => {
    // The dependent half. `colorToHex` did not merely truncate the 8-digit literal
    // the capture now writes — its hex branch slices to six digits, so a ring the
    // capture recorded correctly would have been re-flattened here. Both sites
    // change together or neither shows.
    const doc = foldToL1(
      multi([
        picture({
          alt: 'Faelan',
          box: { x: 932, y: 68, width: 216, height: 216 },
          border: { widthPx: 4, color: '#ffffff4d', style: 'solid' },
        }),
      ]),
    )

    const axes = (imageByAlt(doc, 'Faelan') as { axes?: { border?: { color: string } } }).axes
    expect(axes?.border?.color).toBe('#ffffff4d')
    expect(validateL1(doc).ok).toBe(true)
    expect(renderL1Document(doc).css).toContain('#ffffff4d')
  })

  it('test_UAT_FC_REQ-336_a_flattened_ring_and_a_flattened_paragraph_are_deltas_now', () => {
    // The measurement half. Both of these were worth ZERO: `colorDistance`
    // resolves each side through `colorToHex`, which slices the alpha off, so ΔEOK
    // read `#ffffff4d` and `#ffffff` as the SAME COLOUR.
    const ring = diffManifests(
      manifest('ref', [picture({ alt: 'Faelan', box: { x: 932, y: 68, width: 216, height: 216 }, border: { widthPx: 4, color: '#ffffff4d', style: 'solid' } })]),
      manifest('repro', [picture({ alt: 'Faelan', box: { x: 932, y: 68, width: 216, height: 216 }, border: { widthPx: 4, color: '#ffffff', style: 'solid' } })]),
    )
    const borderDeltas = ring.deltas.filter((d) => d.property === 'border')
    expect(borderDeltas).toHaveLength(1)
    expect(borderDeltas[0].expected).toContain('#ffffff4d')
    expect(borderDeltas[0].actual).toContain('#ffffff')

    const para = diffManifests(
      manifest('ref', [run({ text: 'Artist • ', color: '#ffffffe6', box: { x: 40, y: 40, width: 200, height: 30 } })]),
      manifest('repro', [run({ text: 'Artist • ', color: '#ffffff', box: { x: 40, y: 40, width: 200, height: 30 } })]),
    )
    const colorDeltas = para.deltas.filter((d) => d.property === 'color')
    expect(colorDeltas).toHaveLength(1)
    expect(colorDeltas[0].expected).toBe('#ffffffe6')
  })

  it('test_UAT_FC_REQ-336_the_same_translucency_on_both_sides_is_not_a_delta', () => {
    // No false positives, and no new noise for a page that reproduces its own
    // translucency correctly — which is what makes the delta above mean something.
    const clean = diffManifests(
      manifest('ref', [
        picture({ alt: 'Faelan', box: { x: 932, y: 68, width: 216, height: 216 }, border: { widthPx: 4, color: '#ffffff4d', style: 'solid' } }),
        run({ text: 'Artist • ', color: '#ffffffe6', box: { x: 40, y: 40, width: 200, height: 30 } }),
      ]),
      manifest('repro', [
        picture({ alt: 'Faelan', box: { x: 932, y: 68, width: 216, height: 216 }, border: { widthPx: 4, color: '#ffffff4d', style: 'solid' } }),
        run({ text: 'Artist • ', color: '#ffffffe6', box: { x: 40, y: 40, width: 200, height: 30 } }),
      ]),
    )

    expect(clean.deltas.filter((d) => d.property === 'border' || d.property === 'color')).toEqual([])
  })

  it('test_UAT_FC_REQ-336_an_images_card_shows_the_ring_on_both_sides', () => {
    // The instrument half of issue 2. The image card compared `name`, `objectFit`,
    // `aspect` and `box` — four rows, none of them the ring — so a reader had
    // nothing to notice. The row is fixed rather than appended-on-delta, which is
    // the point: it is there when the two sides AGREE too.
    const report = diffManifests(
      manifest('ref', [picture({ alt: 'Faelan', box: { x: 932, y: 68, width: 216, height: 216 }, border: { widthPx: 4, color: '#ffffff4d', style: 'solid' } })]),
      manifest('repro', [picture({ alt: 'Faelan', box: { x: 932, y: 68, width: 216, height: 216 }, border: { widthPx: 4, color: '#ffffff', style: 'solid' } })]),
    )

    const card = report.objects.find((o) => o.kind === 'image')!
    const border = card.params.find((p) => p.name === 'border')!
    expect(border.expected).toContain('#ffffff4d')
    expect(border.actual).toContain('#ffffff')
    expect(border.mismatch).toBe(true)
  })
})
