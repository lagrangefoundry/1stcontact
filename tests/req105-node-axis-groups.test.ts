/**
 * REQ-105 — the node-level axis groups are declared once, and a `slot` can be
 * measured.
 *
 * REQ-98 hoisted the *paint* group into one shape spread into every kind, so a
 * slot could be filled, framed and rounded. `sizing` was left declared by hand
 * per kind and `slot` never got it: the seam could be painted but not measured,
 * so giving a mounted behavior module a max-width cost a container that existed
 * only to carry the number — the same "two nodes for one element" hole REQ-98
 * named, and the one REQ-97 had already patched once for `text`.
 *
 * These UATs pin the ticket's acceptance: a slot takes the identical
 * `l1AxisSizingSchema` shape every other kind takes and the renderer honours it;
 * a measured slot needs no wrapper; every node-level group is admitted by every
 * kind from a single declaration (so the next kind inherits them rather than
 * re-deriving which it is allowed); and a document that declares none of this
 * renders exactly as before.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import {
  l1BoxSchema,
  l1ContainerSchema,
  l1ControlSchema,
  l1ImageSchema,
  l1NodeAxisGroupsSchema,
  l1SlotSchema,
  l1TextSchema,
  validateL1,
  type L1Document,
  type L1Node,
  type L1Slot,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { evaluateLayout } from '../tools/generate/src/l1'

const WIDTHS = [320, 768, 1440]

/** The declarations of one class's base rule (no media query) in a stylesheet. */
function baseDecls(css: string, cls: string): string[] {
  const m = new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`).exec(css)
  return m ? m[1].split(';').map((d) => d.trim()).filter(Boolean) : []
}

/** The class of the rendered `<div data-l1-slot="…">`. */
function slotClass(html: string): string {
  const m = /<div class="([^"]+)"[^>]*data-l1-slot=/.exec(html)
  expect(m, 'the slot rendered as a div carrying data-l1-slot').toBeTruthy()
  return m![1]
}

/** A one-slot document whose single seam is the subject under test. */
function docWithSlot(slot: L1Slot): L1Document {
  return {
    widths: WIDTHS,
    root: { kind: 'container', id: 'root', layout: 'stack', children: [slot] },
  }
}

describe('REQ-105 — a slot carries the shared sizing group', () => {
  it('test_UAT_FC_REQ-105_slot_node_accepts_sizing', () => {
    const parsed = l1SlotSchema.safeParse({
      kind: 'slot',
      name: 'signup-form',
      behavior: 'contact-form',
      sizing: { width: { mode: 'fluid', maxPx: 520 } },
    })
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true)

    // The whole axis-sizing shape, identical to every other kind — not a
    // width-only special case.
    for (const width of [
      { mode: 'fixed', px: 480 },
      { mode: 'hug' },
      { mode: 'fluid', minPx: 240, maxPx: 520 },
    ] as const) {
      expect(l1SlotSchema.safeParse({ kind: 'slot', name: 's', sizing: { width } }).success).toBe(
        true,
      )
    }
    expect(
      l1SlotSchema.safeParse({ kind: 'slot', name: 's', sizing: { height: { mode: 'fixed', px: 200 } } })
        .success,
    ).toBe(true)

    // Still strict: the new group opens no freeform hole in the envelope.
    expect(
      l1SlotSchema.safeParse({ kind: 'slot', name: 's', sizing: { width: { mode: 'wide' } } }).success,
    ).toBe(false)
    expect(
      l1SlotSchema.safeParse({ kind: 'slot', name: 's', sizing: { width: { mode: 'fluid' }, q: 1 } })
        .success,
    ).toBe(false)

    // And the document envelope accepts a measured seam end to end.
    const report = validateL1(
      docWithSlot({ kind: 'slot', name: 'signup-form', sizing: { width: { mode: 'fluid', maxPx: 520 } } }),
    )
    expect(report.ok, JSON.stringify(report.ok ? [] : report.errors)).toBe(true)
  })

  it('test_UAT_FC_REQ-105_renderer_emits_width_min_and_max_on_a_measured_slot', () => {
    const { html, css } = renderL1Document(
      docWithSlot({
        kind: 'slot',
        id: 'signup-slot',
        name: 'signup-form',
        sizing: { width: { mode: 'fluid', minPx: 240, maxPx: 520 } },
      }),
    )
    const decls = baseDecls(css, slotClass(html))
    expect(decls).toContain('width: 100%')
    expect(decls).toContain('min-width: 240px')
    expect(decls).toContain('max-width: 520px')

    // A fixed measure emits the px width rather than 100%; a pinned height too.
    const fixed = renderL1Document(
      docWithSlot({
        kind: 'slot',
        name: 'signup-form',
        sizing: { width: { mode: 'fixed', px: 480 }, height: { mode: 'fixed', px: 200 } },
      }),
    )
    const fixedDecls = baseDecls(fixed.css, slotClass(fixed.html))
    expect(fixedDecls).toContain('width: 480px')
    expect(fixedDecls).toContain('height: 200px')

    // The measure applies to the seam itself, so it constrains whatever mounts
    // into it — the whole point of the axis living on the slot.
    const mounted = renderL1Document(
      docWithSlot({
        kind: 'slot',
        name: 'signup-form',
        sizing: { width: { mode: 'fluid', maxPx: 520 } },
      }),
      { mounts: { 'signup-form': '<form data-mounted="1"></form>' } },
    )
    expect(mounted.html).toContain('data-mounted="1"')
    expect(baseDecls(mounted.css, slotClass(mounted.html))).toContain('max-width: 520px')
  })

  it('test_UAT_FC_REQ-105_measured_slot_needs_no_wrapper_container', () => {
    // xgd.dev's beta-capture seam, both ways: the sizing-only wrapper the ticket
    // describes, and the slot declaring its own measure. Same painted measure,
    // one fewer node — and the wrapper carried nothing else.
    const wrapped: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          {
            kind: 'container',
            id: 'signup-measure',
            layout: 'stack',
            sizing: { width: { mode: 'fluid', maxPx: 520 } },
            children: [{ kind: 'slot', id: 'signup-slot', name: 'signup-form' }],
          },
        ],
      },
    }
    const direct = docWithSlot({
      kind: 'slot',
      id: 'signup-slot',
      name: 'signup-form',
      sizing: { width: { mode: 'fluid', maxPx: 520 } },
    })

    const wrappedOut = renderL1Document(wrapped)
    const directOut = renderL1Document(direct)

    // The wrapper is gone from the markup…
    expect(wrappedOut.html.match(/<div/g)!.length).toBe(directOut.html.match(/<div/g)!.length + 1)
    // …and the measure it used to carry is now on the seam itself.
    expect(baseDecls(directOut.css, slotClass(directOut.html))).toContain('max-width: 520px')

    // The analytic gate agrees the two lay out the same: same leaf box width.
    // The wrapper was pure ceremony.
    const w = evaluateLayout(wrapped, 1440)
    const d = evaluateLayout(direct, 1440)
    const wSlot = w.leaves.find((l) => l.id === 'signup-slot')!
    const dSlot = d.leaves.find((l) => l.id === 'signup-slot')!
    expect(dSlot.box.width).toBe(wSlot.box.width)
    expect(dSlot.box.width).toBe(520)
  })

  it('test_UAT_FC_REQ-105_every_kind_admits_every_node_level_axis_group', () => {
    // The class of bug, not the instance: each node-level group is declared ONCE
    // and spread, so no kind can be missing one and a new kind inherits them all.
    // A sample value per group, each the shape the shared declaration names.
    const sample: Record<string, unknown> = {
      geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 100, height: 40 }] },
      sizing: { width: { mode: 'fluid', maxPx: 520 } },
      visibility: { fromPx: 768 },
      transform: { rotateDeg: 2 },
      mask: { shape: 'featherRadial', featherPx: 20 },
      padding: { topPx: 8, leftPx: 8 },
      responsivePadding: { topPx: { keyframes: [{ at: 320, value: 8 }] } },
      interaction: { hover: { opacity: 0.9 } },
      reveal: { yPx: 22, durationMs: 640 },
    }
    const groups = Object.keys(l1NodeAxisGroupsSchema.shape)
    expect(groups.sort()).toEqual(Object.keys(sample).sort())

    const kinds = {
      text: [l1TextSchema, { kind: 'text', text: 'x' }],
      image: [l1ImageSchema, { kind: 'image', src: '/a.png', alt: 'a' }],
      slot: [l1SlotSchema, { kind: 'slot', name: 's' }],
      control: [l1ControlSchema, { kind: 'control', control: 'email' }],
      box: [l1BoxSchema, { kind: 'box' }],
      container: [l1ContainerSchema, { kind: 'container', layout: 'stack', children: [] }],
    } as const

    for (const [kind, [schema, base]] of Object.entries(kinds)) {
      for (const group of groups) {
        const parsed = schema.safeParse({ ...base, [group]: sample[group] })
        expect(
          parsed.success,
          `${kind} must admit ${group}: ${JSON.stringify(parsed.error?.issues)}`,
        ).toBe(true)
      }
    }
  })

  it('test_UAT_FC_REQ-105_documents_that_declare_no_sizing_render_unchanged', () => {
    // The change is strictly additive: the field is opt-in, so an untouched
    // document emits no sizing declarations anywhere and every shipped page
    // still validates and renders.
    const bare = renderL1Document(docWithSlot({ kind: 'slot', id: 'signup-slot', name: 'signup-form' }))
    const bareDecls = baseDecls(bare.css, slotClass(bare.html)).join(';')
    expect(bareDecls).not.toMatch(/(^|;)\s*(min-|max-)?(width|height):/)

    const pages = globSync('storage/sites/*/draft/pages/*.json')
    expect(pages.length, 'shipped L1 pages to re-render').toBeGreaterThan(0)
    for (const path of pages) {
      const page = JSON.parse(readFileSync(path, 'utf8')) as { l1?: L1Document }
      if (!page.l1) continue
      const report = validateL1(page.l1)
      expect(report.ok, `${path}: ${JSON.stringify(report.ok ? [] : report.errors)}`).toBe(true)
      const { html, css } = renderL1Document(page.l1)
      expect(html.length, `${path} rendered markup`).toBeGreaterThan(0)
      expect(css.length, `${path} rendered stylesheet`).toBeGreaterThan(0)
      // No shipped page declares slot sizing today, so no seam silently gained a
      // measure. A geometry-pinned slot still emits its pinned `width`/`height`
      // from the keyframe track — the min/max longhands are the ones only the new
      // group can produce, so their absence is the signal that nothing changed.
      expect(findSlotSizing(page.l1.root), `${path} declares no slot sizing`).toBe(false)
      for (const [, cls] of html.matchAll(/<div class="([^"]+)"[^>]*data-l1-slot=/g)) {
        expect(baseDecls(css, cls).join(';'), `${path} slot .${cls}`).not.toMatch(
          /(^|;)\s*(min|max)-(width|height):/,
        )
      }
    }
  })
})

/** Whether any slot in the tree declares `sizing` (the opt-in this ticket adds). */
function findSlotSizing(node: L1Node): boolean {
  if (node.kind === 'slot') return node.sizing !== undefined
  const children = 'children' in node ? (node.children ?? []) : []
  return children.some(findSlotSizing)
}
