/**
 * REQ-288 — a static translate on `transform`, in percent of the node's own size.
 *
 * The axis exists because a pixel offset is a different number at every width
 * whenever the node's size is responsive: it needs per-width keyframes and drifts
 * between them. A share of the node's OWN rendered box resolves correctly at
 * every width from one value, with nothing to keyframe and nothing to drift.
 *
 * The case that produced it: a caption plaque that hangs half off the bottom edge
 * of the picture it labels, inside a reading column that *wraps* at narrow widths
 * — the column's width jumps rather than sliding, so pinned `geometry` keyframes
 * cannot track it, and before this axis the only way to overlap two elements at
 * all was to pin both their coordinates.
 *
 * Proven here, per layer:
 *   - the envelope ACCEPTS the typed axis and REJECTS out-of-range / freeform
 *     spellings of it (no raw-CSS hole opens),
 *   - the renderer EMITS the offset as CSS re-derived from the typed fields, in
 *     an order where the translate is applied before the rotation/scale,
 *   - a state's `motion` offsets ADD to the static translate rather than
 *     discarding it,
 *   - the analytic layout model moves the painted box and its subtree while the
 *     flow advance stays untouched — so the geometry envelope sees the overlap a
 *     browser paints, and reports it unless the node declares `stacked: true`,
 *   - end-to-end in a real browser: one value hangs the plaque half off the
 *     picture's edge at every width, the flow below it does not move, the plaque
 *     paints OVER what it overlaps, and nothing clips it at its parent's edge.
 *
 * Only the last of these needs an engine; it skips cleanly where none is
 * available.
 */
import http from 'node:http'
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Document, renderL1Page } from '../packages/framework/src/index'
import { createEngineDriver, engineAvailable, evaluateLayout } from '../tools/generate/src'

const WIDTHS = [360, 1280]

/** Wrap a node under a minimal valid document so it can be validated + rendered. */
function docWith(node: L1Node): L1Document {
  return { widths: WIDTHS, root: { kind: 'box', children: [node] } }
}

/** The declaration list of the rule for one emitted class (`.l1-N { … }`). */
function ruleFor(css: string, cls: string): string {
  return new RegExp(`\\.${cls} \\{([^}]*)\\}`).exec(css)?.[1] ?? ''
}

function render(node: L1Node): string {
  const res = validateL1(docWith(node))
  expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  return renderL1Document(docWith(node)).css
}

// ── the axis renders as CSS re-derived from its typed fields ──────────────────

describe('REQ-288 a static translate in percent of the node\'s own size', () => {
  it('test_UAT_FC_REQ_288_percent_translate_emits_derived_css_before_rotate_and_scale', () => {
    // Half the node's own height, downward: the plaque hanging off the picture.
    // ONE value, and no keyframe track — which is the whole point of the axis.
    const half = ruleFor(render({ kind: 'box', id: 'plaque', transform: { translateYPct: 50 } }), 'l1-1')
    expect(half).toContain('transform: translate(0px, 50%)')

    // Both axes, and the px companion for the offset that is a fixed distance
    // rather than a share of anything. Given together on one axis they compose.
    const both = ruleFor(
      render({
        kind: 'box',
        transform: { translateXPct: -50, translateYPct: 50, translateYPx: 4 },
      }),
      'l1-1',
    )
    expect(both).toContain('transform: translate(-50%, calc(50% + 4px))')

    // A px-only offset needs no percentage basis and emits none.
    expect(ruleFor(render({ kind: 'box', transform: { translateXPx: -12 } }), 'l1-1')).toContain(
      'transform: translate(-12px, 0px)',
    )

    // ORDER: translate first, so the node is moved in its parent's frame and
    // *then* spun and scaled about its own centre. Rotating first would spin the
    // offset vector with the node, so the same two values would land it somewhere
    // different for every angle.
    const composed = ruleFor(
      render({ kind: 'box', transform: { translateYPct: 50, rotateDeg: -2, scale: 1.05 } }),
      'l1-1',
    )
    expect(composed).toContain('transform: translate(0px, 50%) rotate(-2deg) scale(1.05)')

    // Identity leaves no trace: a zero offset is not a transform.
    const identity = ruleFor(
      render({ kind: 'box', transform: { translateXPct: 0, translateYPct: 0, translateXPx: 0 } }),
      'l1-1',
    )
    expect(identity).not.toMatch(/(?<![-\w])transform:/)
  })

  it('test_UAT_FC_REQ_288_envelope_rejects_out_of_range_and_freeform_translate', () => {
    const at = (node: unknown): L1Document => ({ widths: WIDTHS, root: node as L1Node })
    const violations: Record<string, { doc: L1Document; path: string }> = {
      pctTooLarge: {
        doc: at({ kind: 'box', transform: { translateYPct: 5000 } }),
        path: '/root/transform/translateYPct',
      },
      pctTooSmall: {
        doc: at({ kind: 'box', transform: { translateXPct: -5000 } }),
        path: '/root/transform/translateXPct',
      },
      pxOutOfRange: {
        doc: at({ kind: 'box', transform: { translateXPx: 250_000 } }),
        path: '/root/transform/translateXPx',
      },
      // The freeform spelling the axis exists to make unnecessary: a raw CSS
      // length/keyword under an unknown key. `.strict()` refuses it, so adding a
      // typed offset has opened no hole for an untyped one.
      freeformKey: {
        doc: at({ kind: 'box', transform: { translate: '50% 100%' } }),
        path: '/root/transform',
      },
      stringValue: {
        doc: at({ kind: 'box', transform: { translateYPct: '50%' } }),
        path: '/root/transform/translateYPct',
      },
    }
    for (const [name, { doc, path }] of Object.entries(violations)) {
      const res = validateL1(doc)
      expect(res.ok, `${name} must be rejected`).toBe(false)
      if (res.ok) continue
      expect(res.errors.map((e) => e.path).join(' '), name).toContain(path)
    }

    // …and the in-range values render, so the envelope is a bound rather than a ban.
    expect(validateL1(docWith({ kind: 'box', transform: { translateYPct: -50, translateXPx: 8 } })).ok).toBe(true)
  })

  it('test_UAT_FC_REQ_288_state_motion_offsets_add_to_the_static_translate', () => {
    // A hover nudge on a node that sits half off its neighbour's edge BY DESIGN.
    // CSS `transform` replaces rather than accumulates, so a state that emitted
    // only its own offset would snap the plaque back into the middle of the
    // picture the moment the pointer arrived.
    const css = render({
      kind: 'box',
      id: 'plaque',
      transform: { translateYPct: 50, translateYPx: 2 },
      interaction: { transition: { durationMs: 150 }, hover: { motion: { offsetYPx: -6 } } },
    })
    expect(ruleFor(css, 'l1-1')).toContain('transform: translate(0px, calc(50% + 2px))')
    const hover = new RegExp(`\\.l1-1:hover \\{([^}]*)\\}`).exec(css)?.[1] ?? ''
    expect(hover).toContain('transform: translate(0px, calc(50% - 4px))')

    // Under reduced motion the state settles back to the node's own transform —
    // the static offset included, since it is placement rather than movement.
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toMatch(/prefers-reduced-motion[^@]*transform: translate\(0px, calc\(50% \+ 2px\)\)/)
  })

  // ── the geometry model: paint moves, flow does not ──────────────────────────

  it('test_UAT_FC_REQ_288_translate_moves_the_painted_box_and_its_subtree_not_the_flow', () => {
    // An in-flow geometry track at both document widths — the shape a folded
    // page actually carries, so the model reads the same heights the renderer
    // emits rather than a content estimate.
    const flow = (h: number, w = 400): L1Node['geometry'] => ({
      place: 'flow',
      keyframes: WIDTHS.map((at) => ({ at, x: 0, y: 0, width: w, height: h })),
    })

    const column = (transform?: L1Node['transform']): L1Document => ({
      widths: WIDTHS,
      root: {
        kind: 'container',
        layout: 'stack',
        children: [
          { kind: 'box', id: 'picture', geometry: flow(200) },
          {
            kind: 'container',
            layout: 'stack',
            id: 'plaque',
            geometry: flow(60, 160),
            ...(transform ? { transform } : {}),
            children: [{ kind: 'text', text: 'Plate I' }],
          },
          { kind: 'box', id: 'after', geometry: flow(40) },
        ],
      },
    })

    expect(validateL1(column({ translateYPct: -50 })).ok).toBe(true)

    const resting = evaluateLayout(column(), 1280)
    // Lift the plaque by half its own height: the museum-label overlap.
    const moved = evaluateLayout(column({ translateYPct: -50 }), 1280)

    const boxOf = (r: ReturnType<typeof evaluateLayout>, id: string): { y: number; height: number } => {
      const leaf = r.leaves.find((l) => l.id === id)
      expect(leaf, `${id} leaf`).toBeDefined()
      return leaf!.box
    }

    // The plaque is a container, so what the model paints is its subtree: the
    // caption run rides up with it by half the PLAQUE's own height (60 → 30),
    // exactly as a translated subtree does in a browser.
    const restingRun = resting.leaves.find((l) => l.kind === 'text')!
    const movedRun = moved.leaves.find((l) => l.kind === 'text')!
    expect(movedRun.box.y).toBeCloseTo(restingRun.box.y - 30, 3)

    // LAYOUT IS UNAFFECTED: what follows the plaque sits exactly where it sat,
    // and so does the picture above it.
    expect(boxOf(moved, 'after').y).toBeCloseTo(boxOf(resting, 'after').y, 3)
    expect(boxOf(moved, 'picture').y).toBeCloseTo(boxOf(resting, 'picture').y, 3)

    // A leaf carries its own offset the same way: a share of ITS height, plus
    // any px companion, and the node after it still does not move.
    const leafDoc = (transform?: L1Node['transform']): L1Document => ({
      widths: WIDTHS,
      root: {
        kind: 'container',
        layout: 'stack',
        children: [
          { kind: 'box', id: 'badge', geometry: flow(80), ...(transform ? { transform } : {}) },
          { kind: 'box', id: 'below', geometry: flow(40) },
        ],
      },
    })
    const leafResting = evaluateLayout(leafDoc(), 1280)
    const leafMoved = evaluateLayout(leafDoc({ translateYPct: 25, translateYPx: -5 }), 1280)
    expect(boxOf(leafMoved, 'badge').y).toBeCloseTo(boxOf(leafResting, 'badge').y + 20 - 5, 3)
    expect(boxOf(leafMoved, 'below').y).toBeCloseTo(boxOf(leafResting, 'below').y, 3)

    // The overlap the translate produced is reported, because no measurement can
    // tell a deliberate stack from two runs painted over each other…
    expect(moved.findings.filter((f) => f.kind === 'overlap').length).toBeGreaterThan(0)

    // …and declaring the intent (BUG-112) exempts it, which is how this axis is
    // meant to be used for a composition rather than an accident.
    const stackedDoc = column({ translateYPct: -50 })
    const plaque = (stackedDoc.root as { children: L1Node[] }).children[1]
    ;(plaque as { stacked?: true }).stacked = true
    expect(evaluateLayout(stackedDoc, 1280).findings.filter((f) => f.kind === 'overlap')).toHaveLength(0)
  })
})

// ── end-to-end in a browser ───────────────────────────────────────────────────

const chromiumReady = await engineAvailable('chromium')

/** Serve one rendered L1 page over loopback. */
async function servePage(doc: L1Document): Promise<{ url: string; close: () => Promise<void> }> {
  const page = Buffer.from(renderL1Page(doc), 'utf-8')
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(page)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  const addr = server.address()
  const port = typeof addr === 'object' && addr ? addr.port : 0
  return {
    url: `http://127.0.0.1:${port}/`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

/**
 * The ticket's own case: four plates in a wrapping reading column, each a
 * picture with a caption plaque. The plaque carries ONE value — no geometry
 * keyframes — and the column's width JUMPS between the two widths (one plate per
 * line, then four), which is exactly the discontinuity a pinned coordinate
 * cannot track.
 */
function platesDoc(transform?: L1Node['transform']): L1Document {
  const plate = (n: number): L1Node => ({
    kind: 'container',
    layout: 'stack',
    id: `plate-${n}`,
    sizing: { width: { mode: 'fixed', px: 260 } },
    children: [
      {
        kind: 'box',
        id: `picture-${n}`,
        sizing: { height: { mode: 'fixed', px: 180 } },
        axes: { fill: '#20303c' },
      },
      {
        kind: 'container',
        layout: 'stack',
        id: `plaque-${n}`,
        stacked: true,
        sizing: { width: { mode: 'fixed', px: 160 }, height: { mode: 'fixed', px: 48 } },
        axes: { fill: '#b87333' },
        ...(transform ? { transform } : {}),
        children: [{ kind: 'text', text: `Plate ${n}`, axes: { color: '#ffffff' } }],
      },
    ],
  })
  return {
    widths: WIDTHS,
    root: {
      kind: 'container',
      layout: 'stack',
      children: [
        {
          kind: 'container',
          layout: 'row',
          wrap: true,
          gapPx: 24,
          id: 'column',
          children: [plate(1), plate(2), plate(3), plate(4)],
        },
        {
          kind: 'text',
          id: 'after',
          text: 'The reading column continues beneath the plates.',
        },
      ],
    },
  }
}

const PROBE = `(() => {
  const rect = (id) => {
    const r = document.getElementById(id).getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }
  }
  const plaque = rect('plaque-1')
  const plate = rect('plate-1')
  // What actually paints at a point, named by the nearest element carrying an id.
  const at = (x, y) => {
    const el = document.elementFromPoint(x, y)
    if (!el) return null
    const owner = el.closest('[id]')
    return owner ? owner.id : el.tagName
  }
  const cx = plaque.x + plaque.width / 2
  return {
    plaque,
    plate,
    picture: rect('picture-1'),
    after: rect('after'),
    // A point in the plaque's top quarter — over the picture, once lifted.
    paintsAtPlaqueHead: at(cx, plaque.y + plaque.height / 4),
    // A point in its bottom quarter — past the plate's own edge, once hung.
    paintsAtPlaqueFoot: at(cx, plaque.bottom - plaque.height / 4),
    columnWidth: rect('column').width,
  }
})()`

interface ProbeRect {
  x: number
  y: number
  width: number
  height: number
  bottom: number
}

interface Probe {
  plaque: ProbeRect
  plate: ProbeRect
  picture: ProbeRect
  after: ProbeRect
  paintsAtPlaqueHead: string | null
  paintsAtPlaqueFoot: string | null
  columnWidth: number
}

describe('REQ-288 the plaque hangs half off the picture at every width', () => {
  it(
    'test_UAT_FC_REQ_288_one_value_overlaps_at_every_width_paints_over_and_is_not_clipped',
    async () => {
      if (!chromiumReady) return

      const measure = async (transform: L1Node['transform'] | undefined, width: number): Promise<Probe> => {
        const serve = await servePage(platesDoc(transform))
        const driver = await createEngineDriver('chromium')()
        try {
          await driver.navigate(serve.url, { width, height: 900 })
          return await driver.query<Probe>(PROBE)
        } finally {
          await driver.close()
          await serve.close()
        }
      }

      const widths: number[] = []
      for (const width of [360, 1280]) {
        const resting = await measure(undefined, width)
        const lifted = await measure({ translateYPct: -50 }, width)
        const hung = await measure({ translateYPct: 50 }, width)
        widths.push(resting.columnWidth)

        // ONE VALUE, EVERY WIDTH: the plaque's top sits exactly half its own
        // height above where the flow put it — so half of it lies over the
        // picture — without a keyframe at either width.
        expect(lifted.plaque.height, `plaque height @${width}`).toBeGreaterThan(0)
        expect(lifted.plaque.y, `plaque lifted @${width}`).toBeCloseTo(
          resting.plaque.y - resting.plaque.height / 2,
          1,
        )
        expect(lifted.plaque.y, `overlaps the picture @${width}`).toBeLessThan(lifted.picture.bottom)
        expect(lifted.plaque.bottom, `hangs off the picture @${width}`).toBeGreaterThan(
          lifted.picture.bottom,
        )

        // LAYOUT UNAFFECTED: the prose under the plates does not move, and the
        // plate's own box is unchanged — a paint offset, not a box-model one.
        for (const [name, probe] of [
          ['lifted', lifted],
          ['hung', hung],
        ] as const) {
          expect(probe.after.y, `${name}: flow below is untouched @${width}`).toBeCloseTo(
            resting.after.y,
            1,
          )
          expect(probe.plate.height, `${name}: plate height unchanged @${width}`).toBeCloseTo(
            resting.plate.height,
            1,
          )
        }

        // PAINT ORDER: the node that moved is the node on top of what it moved
        // over — the plaque wins the overlap rather than disappearing behind the
        // picture it labels.
        expect(lifted.paintsAtPlaqueHead, `plaque paints over the picture @${width}`).toBe('plaque-1')

        // NOT CLIPPED: translated the other way, the plaque's lower half leaves
        // its parent's box entirely — and is still painted and still hit-testable
        // there, because nothing in L1 emits an `overflow` that would cut it off.
        expect(hung.plaque.bottom, `plaque escapes its parent @${width}`).toBeGreaterThan(
          hung.plate.bottom + 4,
        )
        expect(hung.paintsAtPlaqueFoot, `plaque paints past its parent @${width}`).toBe('plaque-1')
      }

      // The premise the axis exists for: the column's width genuinely JUMPS
      // between the two widths (the row wraps), so a pinned coordinate could not
      // have tracked the plaque across them — and one percentage did.
      expect(widths[0]).not.toBeCloseTo(widths[1], 0)
    },
    180000,
  )
})
