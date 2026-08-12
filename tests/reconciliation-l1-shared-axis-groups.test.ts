/**
 * Reconciliation UATs — story-d0a8cfad "L1 layout substrate rendered safe by
 * construction", the criteria added by the REQ-98 / REQ-97 / REQ-105 shared-axis
 * upgrade plus the REQ-91/REQ-90 extension of the injection guarantee.
 *
 *   AC-685  injection payloads are inert — *including* in every structured axis
 *           family and in the document-level resource table
 *   AC-801  a painted, internally laid-out element is a single node
 *   AC-802  every node kind admits the same shared axis groups
 *   AC-803  a text run declares its own measure and the layout gate wraps to it
 *   AC-804  a behavior-module seam can be measured through the slot itself
 *   AC-805  a background image on any node kind binds to the site's own mirror
 *
 * The story's other criteria (AC-682/683/684/686/687/688/723 and
 * AC-725/726/727/728) are pinned in `reconciliation-l1-substrate.test.ts` and
 * `reconciliation-l1-language.test.ts`; this file covers only the ones those two
 * do not. Every probe here is engine-free — the validator, the emitter and the
 * analytic layout evaluator are all pure.
 */
import { describe, expect, it } from 'vitest'
import {
  l1BoxSchema,
  l1ContainerSchema,
  l1ControlSchema,
  l1ImageSchema,
  l1NodeAxisGroupsSchema,
  l1SlotSchema,
  l1SurfaceAxesSchema,
  l1TextSchema,
  validateL1,
  type L1Document,
  type L1Node,
  type L1SurfaceAxes,
} from '../packages/site-schema/src/index'
import { renderL1Document, renderL1Page } from '../packages/framework/src/index'
import { evaluateLayout, localizeAssets } from '../tools/generate/src/l1'
import type { CaptureAsset } from '../tools/generate/src/cli/capture'

const WIDTHS = [320, 768, 1440]

/** A long run: a 620px measure forces visibly more lines than a 1440px frame. */
const PROSE =
  "XGD maintains a living spec of your software's intended behavior and tests the " +
  'running system against it on every change. You own that intent and the ' +
  'architecture; XGD owns the implementation.'

/** Every axis in the shared surface group, populated. */
const SURFACE: L1SurfaceAxes = {
  surfaceFill: '#101828',
  borderRadiusPx: 12,
  opacity: 0.9,
  surfaceGradient: { angleDeg: 90, stops: [{ color: '#ff0000' }, { color: '#0000ff' }] },
  backgroundImageUrl: '/assets/card.png',
  overlay: { color: '#000000', opacity: 0.5 },
  boxShadow: { offsetXPx: 0, offsetYPx: 8, blurPx: 24, color: '#00000033' },
  border: { widthPx: 1, color: '#e5e7eb' },
  borderLeft: { widthPx: 4, color: '#f59e0b' },
  backdropBlurPx: 6,
  blendMode: 'multiply',
}

/** One sample value per node-level axis group, in the shared declaration's shape. */
const NODE_GROUP_SAMPLES: Record<string, unknown> = {
  geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 100, height: 40 }] },
  sizing: { width: { mode: 'fluid', minPx: 240, maxPx: 520 } },
  visibility: { fromPx: 768 },
  transform: { rotateDeg: 2 },
  mask: { shape: 'featherRadial', featherPx: 20 },
  padding: { topPx: 8, leftPx: 8 },
  responsivePadding: { topPx: { keyframes: [{ at: 320, value: 8 }] } },
  interaction: { hover: { opacity: 0.9 } },
  reveal: { yPx: 22, durationMs: 640 },
}

/**
 * A minimal node of each box-rendering kind, ready to be spread with the group
 * under test. `control` is included: REQ-96's newest kind is exactly the one that
 * had its surface added by hand, which is the process that produced the drift.
 */
const KIND_BASES = {
  box: [l1BoxSchema, { kind: 'box' }],
  container: [l1ContainerSchema, { kind: 'container', layout: 'stack', children: [] }],
  text: [l1TextSchema, { kind: 'text', text: 'Evidence of correctness' }],
  image: [l1ImageSchema, { kind: 'image', src: '/assets/photo.jpg', alt: 'Photo' }],
  slot: [l1SlotSchema, { kind: 'slot', name: 'signup-form' }],
  control: [l1ControlSchema, { kind: 'control', control: 'email' }],
} as const

/**
 * The declarations of one class's **axis** rule — the last un-media-queried rule
 * for that selector (a node with geometry emits its position rule for the same
 * selector first; the axis rule the emitter builds is always last).
 */
function baseDecls(css: string, cls: string): string[] {
  const head = css.split('@media')[0]
  const rules = [...head.matchAll(new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`, 'g'))]
  const last = rules[rules.length - 1]
  return last ? last[1].split(';').map((d) => d.trim()).filter(Boolean) : []
}

/** The class of the first element in a rendered fragment/document. */
function firstClass(html: string): string {
  return /class="([^"]+)"/.exec(html)![1]
}

/** The class of a rendered `<p>` text run. */
function runClass(html: string): string {
  const m = /<p class="([^"]+)"/.exec(html)
  expect(m, 'the run rendered as a <p> with a class').toBeTruthy()
  return m![1]
}

/** The class of the rendered `<div data-l1-slot="…">` seam. */
function slotClass(html: string): string {
  const m = /<div class="([^"]+)"[^>]*data-l1-slot=/.exec(html)
  expect(m, 'the slot rendered as a div carrying data-l1-slot').toBeTruthy()
  return m![1]
}

/** A one-child document whose single node is the subject under test. */
function docWith(node: L1Node): L1Document {
  return {
    widths: WIDTHS,
    root: { kind: 'container', id: 'root', layout: 'stack', children: [node] },
  }
}

// ── AC-685: injection payloads are inert, structured axes and fonts included ───

describe('AC-685 injection payloads in content values are inert in the rendered output', () => {
  it('test_UAT_AC685_structured_axis_and_resource_table_payloads_emit_no_raw_css', () => {
    // The criterion's second half: the guarantee extends to every *structured*
    // family and to the resource table, none of which is ever emitted as a
    // passthrough CSS string. As with the scalar case, this bypasses validation
    // deliberately — the emitter is the last line of defence, not the validator.
    const BREAKOUT = '#000000; } body { background: url(javascript:alert(1)) } .x {'
    const doc = {
      widths: WIDTHS,
      resources: {
        fonts: [
          // A family carrying CSS syntax, and a source off the URL allowlist.
          { family: 'Evil"; } @import "evil.css"; @font-face { font-family: "y', src: '/fonts/ok.woff2' },
          { family: 'Blocked', src: 'javascript:alert(1)' },
          { family: 'AlsoBlocked', src: 'data:font/woff2;base64,AAAA' },
        ],
      },
      root: {
        kind: 'box',
        axes: {
          // A gradient stop colour, a border colour, a shadow colour and a
          // background-image URL, each carrying a payload.
          surfaceGradient: { stops: [{ color: BREAKOUT }, { color: 'expression(alert(1))' }] },
          border: { widthPx: 2, color: 'expression(alert(1))' },
          borderLeft: { widthPx: 4, color: BREAKOUT },
          boxShadow: { offsetXPx: 0, offsetYPx: 2, blurPx: 4, color: BREAKOUT },
          overlay: { color: BREAKOUT, opacity: 0.5 },
          backgroundImageUrl: 'javascript:alert(1)',
        },
        // Mask and transform carry only numbers; a payload smuggled into one is
        // not finite, so it can never reach a declaration as syntax.
        mask: { shape: 'featherBottom', featherPx: '48px; } body{display:none} .y{' },
        transform: { rotateDeg: '</style><script>alert(1)</script>', scale: 1.2 },
        children: [
          {
            kind: 'text',
            text: 'Wordmark',
            axes: { gradientFill: { stops: [{ color: BREAKOUT }, { color: '@import "x"' }] } },
          },
        ],
      },
    } as unknown as L1Document

    const { css } = renderL1Document(doc)
    const page = renderL1Page(doc)

    // Nothing anywhere in the emitted document can pull a stylesheet, navigate,
    // or evaluate.
    for (const emitted of [css, page]) {
      expect(emitted).not.toContain('@import')
      expect(emitted).not.toContain('javascript:')
      expect(emitted).not.toContain('expression(')
    }
    // No payload closed the style block: the stylesheet itself carries no
    // `</style>`, and the page carries exactly the one pair the shell opened.
    expect(css).not.toContain('</style>')
    expect((page.match(/<style>/g) ?? []).length).toBe(1)
    expect((page.match(/<\/style>/g) ?? []).length).toBe(1)

    // The unsafe URL and the non-hex colours are ABSENT, not emitted — a
    // structured axis reaches CSS only re-derived from typed fields, so an
    // unpaintable value is dropped rather than passed through.
    expect(css).not.toContain('alert(1)')
    // The payloads' own signatures — the rule each tried to open beside a typed
    // field — appear nowhere. (`html, body { … }` below is the renderer's own
    // reset, so the assertion is on the payload's shape, not the word `body`.)
    expect(css).not.toContain('} body {')
    expect(css).not.toContain('.x {')
    expect(css).not.toContain('display:none')
    expect(css).not.toContain('url("javascript')
    expect(css).not.toContain('data:font')
    expect(css).not.toContain('/fonts/ok.woff2; }')

    // Every brace the emitter opened, it closed — no payload escaped a rule.
    expect((css.match(/}/g) ?? []).length).toBe((css.match(/{/g) ?? []).length)

    // The off-allowlist font sources produce NO rule at all, and the family that
    // carried CSS syntax is reduced to inert font-name characters before it is
    // quoted into the one rule that survives.
    const faces = [...css.matchAll(/@font-face \{([^}]*)\}/g)].map((m) => m[1])
    expect(faces).toHaveLength(1)
    expect(faces[0]).toContain('src: url("fonts/ok.woff2")')
    expect(/font-family: "[A-Za-z0-9 -]+"/.test(faces[0])).toBe(true)
  })
})

// ── AC-801: a painted, internally laid-out element is a single node ────────────

describe('AC-801 a painted, internally laid-out element is a single node', () => {
  it('test_UAT_AC801_one_container_carries_both_the_surface_and_its_layout', () => {
    const card: L1SurfaceAxes = {
      surfaceFill: '#ffffff',
      borderRadiusPx: 16,
      border: { widthPx: 1, color: '#e5e7eb' },
      boxShadow: { offsetXPx: 0, offsetYPx: 2, blurPx: 8, color: '#0000001a' },
    }
    const rows: L1Node[] = [
      { kind: 'text', id: 'title', text: 'Evidence of correctness' },
      { kind: 'text', id: 'body', text: 'A living spec, tested on every change.' },
    ]

    // (a) the painted box wrapping a laying-out container the old split forced…
    const paired = renderL1Document({
      widths: WIDTHS,
      root: {
        kind: 'box',
        id: 'card',
        axes: card,
        children: [{ kind: 'container', layout: 'stack', gapPx: 12, children: rows }],
      },
    })
    // …and (b) the single container declaring both the surface group and layout.
    const single = renderL1Document({
      widths: WIDTHS,
      root: { kind: 'container', id: 'card', layout: 'stack', gapPx: 12, axes: card, children: rows },
    })

    // One fewer element in the markup, same children present.
    expect(single.html.match(/<div/g)!.length).toBe(paired.html.match(/<div/g)!.length - 1)
    for (const out of [paired, single]) {
      expect(out.html).toContain('Evidence of correctness')
      expect(out.html).toContain('A living spec, tested on every change.')
    }

    // The surviving node's ONE rule carries the paint and the layout together.
    const decls = baseDecls(single.css, firstClass(single.html))
    expect(decls).toContain('background-color: #ffffff')
    expect(decls).toContain('border-radius: 16px')
    expect(decls).toContain('border: 1px solid #e5e7eb')
    expect(decls).toContain('box-shadow: 0px 2px 8px #0000001a')
    expect(decls).toContain('display: flex')
    expect(decls).toContain('flex-direction: column')
    expect(decls).toContain('gap: 12px')

    // In the paired form the paint and the layout are on two different elements —
    // the outer box paints and does not lay out. That is the shape now collapsed.
    const pairedOuter = baseDecls(paired.css, firstClass(paired.html))
    expect(pairedOuter).toContain('background-color: #ffffff')
    expect(pairedOuter).not.toContain('display: flex')

    // The same reaches the other seam: a slot paints its own frame, so a mount
    // point needs no decorative wrapper either.
    const seam = renderL1Document(
      docWith({
        kind: 'slot',
        name: 'signup-form',
        axes: {
          surfaceFill: '#101828',
          borderRadiusPx: 12,
          border: { widthPx: 1, color: '#e5e7eb' },
          boxShadow: { offsetXPx: 0, offsetYPx: 8, blurPx: 24, color: '#00000033' },
        },
      }),
    )
    const seamDecls = baseDecls(seam.css, slotClass(seam.html))
    expect(seamDecls).toContain('background-color: #101828')
    expect(seamDecls).toContain('border-radius: 12px')
    expect(seamDecls).toContain('border: 1px solid #e5e7eb')
    expect(seamDecls).toContain('box-shadow: 0px 8px 24px #00000033')
  })
})

// ── AC-802: every node kind admits the same shared axis groups ─────────────────

describe('AC-802 every node kind admits the same shared axis groups', () => {
  it('test_UAT_AC802_shared_groups_accepted_identically_and_strictly_on_every_kind', () => {
    // REQ-136 widened this AC with colour adjustment on every kind (distinct from
    // backdrop blur) and with the image-only framing axis. Both are proven by
    // their own siblings — test_UAT_AC1125_* and test_UAT_AC1124_* in
    // tests/reconciliation-l1-image-framing.test.ts — while this test remains the
    // every-kind sweep the AC is named for.
    //
    // The node-level groups are declared once, so the sample table below must
    // enumerate exactly them — if a group is added and not sampled here, this
    // fails rather than silently under-testing the next kind.
    const groups = Object.keys(l1NodeAxisGroupsSchema.shape)
    expect(groups.slice().sort()).toEqual(Object.keys(NODE_GROUP_SAMPLES).sort())

    for (const [kind, [schema, base]] of Object.entries(KIND_BASES)) {
      // Every node-level group, one at a time, on every kind.
      for (const group of groups) {
        const ok = schema.safeParse({ ...base, [group]: NODE_GROUP_SAMPLES[group] })
        expect(ok.success, `${kind} must admit ${group}: ${JSON.stringify(ok.error?.issues)}`).toBe(
          true,
        )
        // …and the identical strictness: an unknown key inside the group is
        // refused, not ignored, on every kind alike.
        const extra = schema.safeParse({
          ...base,
          [group]: { ...(NODE_GROUP_SAMPLES[group] as object), styleHack: 'color:red' },
        })
        expect(extra.success, `${kind} must refuse an unknown key in ${group}`).toBe(false)
      }

      // The whole surface group, with the identical field set, on every kind.
      const painted = schema.safeParse({ ...base, axes: SURFACE })
      expect(painted.success, `${kind} must admit the surface group: ${JSON.stringify(painted.error?.issues)}`).toBe(
        true,
      )
      const paintedExtra = schema.safeParse({
        ...base,
        axes: { ...SURFACE, styleHack: 'color:red' },
      })
      expect(paintedExtra.success, `${kind} must refuse an unknown surface key`).toBe(false)

      // …and every surface axis is genuinely the SAME field on this kind, not a
      // re-declared slice: each one is accepted on its own.
      for (const axis of Object.keys(l1SurfaceAxesSchema.shape)) {
        const one = schema.safeParse({
          ...base,
          axes: { [axis]: SURFACE[axis as keyof L1SurfaceAxes] },
        })
        expect(one.success, `${kind} must admit surface axis ${axis}`).toBe(true)
      }
    }

    // The whole vocabulary, on each kind in turn, through the document envelope.
    for (const [kind, [, base]] of Object.entries(KIND_BASES)) {
      const node = { ...base, axes: SURFACE, ...NODE_GROUP_SAMPLES }
      const report = validateL1({ widths: WIDTHS, root: node })
      expect(report.ok, `${kind}: ${JSON.stringify(report.ok ? [] : report.errors)}`).toBe(true)
    }

    // The two gaps the upgrade closed by name: a slot admits sizing and a text
    // run admits sizing — neither did before, and each cost a wrapper node.
    expect(
      l1SlotSchema.safeParse({ kind: 'slot', name: 's', sizing: { width: { mode: 'fluid', maxPx: 520 } } })
        .success,
    ).toBe(true)
    expect(
      l1TextSchema.safeParse({ kind: 'text', text: 'x', sizing: { width: { mode: 'fluid', maxPx: 620 } } })
        .success,
    ).toBe(true)

    // A kind still declares what is genuinely its own — the shared groups did not
    // dissolve the per-kind fields into one another.
    expect(l1TextSchema.safeParse({ kind: 'text', text: 'x', objectFit: 'cover' }).success).toBe(false)
    expect(l1SlotSchema.safeParse({ kind: 'slot', name: 's', layout: 'stack' }).success).toBe(false)
  })
})

// ── AC-803: a text run declares its own measure; the gate wraps against it ─────

describe('AC-803 a text run declares its own measure and the layout gate wraps against it', () => {
  it('test_UAT_AC803_measured_run_emits_its_width_and_the_gate_narrows_the_frame', () => {
    // A fluid measure with a maximum emits the full-width rule capped at it.
    const fluid = renderL1Document(
      docWith({
        kind: 'text',
        id: 'sub',
        text: PROSE,
        sizing: { width: { mode: 'fluid', minPx: 240, maxPx: 620 } },
      }),
    )
    const fluidDecls = baseDecls(fluid.css, runClass(fluid.html))
    expect(fluidDecls).toContain('width: 100%')
    expect(fluidDecls).toContain('min-width: 240px')
    expect(fluidDecls).toContain('max-width: 620px')

    // A fixed measure emits its pixel width.
    const fixed = renderL1Document(
      docWith({ kind: 'text', id: 'sub', text: PROSE, sizing: { width: { mode: 'fixed', px: 480 } } }),
    )
    expect(baseDecls(fixed.css, runClass(fixed.html))).toContain('width: 480px')

    // Strictly opt-in: a run declaring none emits NO width declarations at all.
    const bare = renderL1Document(docWith({ kind: 'text', id: 'sub', text: PROSE }))
    expect(baseDecls(bare.css, runClass(bare.html)).join(';')).not.toMatch(
      /(^|;)\s*(min-|max-)?width:/,
    )

    // The measured run needs no wrapper: same painted width, one fewer element.
    const wrapped: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          {
            kind: 'container',
            id: 'sub-measure',
            layout: 'stack',
            sizing: { width: { mode: 'fluid', maxPx: 620 } },
            children: [{ kind: 'text', id: 'sub', text: PROSE, axes: { fontSizePx: 19, lineHeightPx: 31 } }],
          },
        ],
      },
    }
    const direct = docWith({
      kind: 'text',
      id: 'sub',
      text: PROSE,
      axes: { fontSizePx: 19, lineHeightPx: 31 },
      sizing: { width: { mode: 'fluid', maxPx: 620 } },
    })
    const wrappedOut = renderL1Document(wrapped)
    const directOut = renderL1Document(direct)
    expect(wrappedOut.html.match(/<div/g)!.length).toBe(directOut.html.match(/<div/g)!.length + 1)
    expect(baseDecls(directOut.css, runClass(directOut.html))).toContain('max-width: 620px')

    // The analytic gate models the same constraint: the frame a node is offered
    // is narrowed by the node's own declared width before its content is laid
    // out — so the wrapper form and the direct form evaluate IDENTICALLY.
    for (const width of [1440, 320]) {
      const w = evaluateLayout(wrapped, width).leaves.find((l) => l.id === 'sub')!
      const d = evaluateLayout(direct, width).leaves.find((l) => l.id === 'sub')!
      expect(d.box.width, `leaf width at ${width}`).toBe(w.box.width)
      expect(d.box.height, `leaf height at ${width}`).toBe(w.box.height)
    }

    // …and because a run's height is a function of its width, the measured run is
    // predicted to wrap TALLER than the unmeasured one at the wide viewport,
    // rather than reading as drift against the browser.
    const unmeasured = docWith({
      kind: 'text',
      id: 'sub',
      text: PROSE,
      axes: { fontSizePx: 19, lineHeightPx: 31 },
    })
    const wideMeasured = evaluateLayout(direct, 1440).leaves.find((l) => l.id === 'sub')!
    const wideUnmeasured = evaluateLayout(unmeasured, 1440).leaves.find((l) => l.id === 'sub')!
    expect(wideMeasured.box.width).toBe(620)
    expect(wideUnmeasured.box.width).toBe(1440)
    expect(wideMeasured.box.height).toBeGreaterThan(wideUnmeasured.box.height)

    // A cap wider than the frame is inert — max-width caps, it does not stretch.
    expect(evaluateLayout(direct, 320).leaves.find((l) => l.id === 'sub')!.box.width).toBe(320)

    // A pinned, geometry-tracked run (the folded-reproduction shape) is
    // unaffected in both the emitted CSS and the gate.
    const folded: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'box',
        id: 'band',
        children: [
          {
            kind: 'text',
            id: 'run',
            text: PROSE,
            axes: { fontSizePx: 16, lineHeightPx: 26, color: '#314158' },
            geometry: { keyframes: WIDTHS.map((at) => ({ at, x: 24, y: 40, width: at - 48 })) },
          },
        ],
      },
    }
    const foldedCss = renderL1Document(folded).css
    const widthDecls = foldedCss
      .split(/[;{}\n]/)
      .map((d) => d.trim())
      .filter((d) => /^(min-|max-)?width:/.test(d) || /fit-content/.test(d))
    // The only width a folded run paints is its geometry keyframe track.
    expect(widthDecls.filter((d) => !/^width: \d/.test(d) && !/^width: calc\(/.test(d))).toEqual([])
    expect(evaluateLayout(folded, 1440).leaves.find((l) => l.id === 'run')!.box.width).toBe(1440 - 48)
  })
})

// ── AC-804: a behavior-module seam can be measured through the slot itself ─────

describe('AC-804 a behavior-module seam can be measured through the slot itself', () => {
  it('test_UAT_AC804_measured_slot_emits_its_width_and_needs_no_wrapper', () => {
    // A fluid measure with a maximum, on the seam's own element.
    const fluid = renderL1Document(
      docWith({
        kind: 'slot',
        id: 'signup-slot',
        name: 'signup-form',
        sizing: { width: { mode: 'fluid', minPx: 240, maxPx: 520 } },
      }),
    )
    const fluidDecls = baseDecls(fluid.css, slotClass(fluid.html))
    expect(fluidDecls).toContain('width: 100%')
    expect(fluidDecls).toContain('min-width: 240px')
    expect(fluidDecls).toContain('max-width: 520px')

    // A fixed measure emits its pixel width (and a pinned height likewise).
    const fixed = renderL1Document(
      docWith({
        kind: 'slot',
        name: 'signup-form',
        sizing: { width: { mode: 'fixed', px: 480 }, height: { mode: 'fixed', px: 200 } },
      }),
    )
    const fixedDecls = baseDecls(fixed.css, slotClass(fixed.html))
    expect(fixedDecls).toContain('width: 480px')
    expect(fixedDecls).toContain('height: 200px')

    // Opt-in exactly as on every other kind: a slot declaring none emits no
    // width declarations, so existing pages render unchanged.
    const bare = renderL1Document(docWith({ kind: 'slot', id: 'signup-slot', name: 'signup-form' }))
    expect(baseDecls(bare.css, slotClass(bare.html)).join(';')).not.toMatch(
      /(^|;)\s*(min-|max-)?(width|height):/,
    )

    // A mounted module takes its measure from the seam it mounts into…
    const MOUNT = { mounts: { 'signup-form': '<form data-mounted="1"></form>' } }
    const measured = renderL1Document(
      docWith({
        kind: 'slot',
        id: 'signup-slot',
        name: 'signup-form',
        sizing: { width: { mode: 'fluid', maxPx: 520 } },
      }),
      MOUNT,
    )
    // …and the sizing-only wrapper it replaces renders at the same width with
    // one MORE element in the markup.
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
    const wrappedOut = renderL1Document(wrapped, MOUNT)

    expect(measured.html).toContain('data-mounted="1"')
    expect(wrappedOut.html).toContain('data-mounted="1"')
    expect(baseDecls(measured.css, slotClass(measured.html))).toContain('max-width: 520px')
    expect(wrappedOut.html.match(/<div/g)!.length).toBe(measured.html.match(/<div/g)!.length + 1)

    const measuredSlot = evaluateLayout(
      docWith({
        kind: 'slot',
        id: 'signup-slot',
        name: 'signup-form',
        sizing: { width: { mode: 'fluid', maxPx: 520 } },
      }),
      1440,
    ).leaves.find((l) => l.id === 'signup-slot')!
    const wrappedSlot = evaluateLayout(wrapped, 1440).leaves.find((l) => l.id === 'signup-slot')!
    expect(measuredSlot.box.width).toBe(wrappedSlot.box.width)
    expect(measuredSlot.box.width).toBe(520)
  })
})

// ── AC-805: a background image on any kind binds to the site's own mirror ──────

describe('AC-805 a background image on any node kind binds to the mirrored asset', () => {
  it('test_UAT_AC805_background_handles_resolve_site_local_on_every_kind_or_are_reported', () => {
    const ORIGIN = 'https://example.test/images/card.png'
    const doc = {
      widths: WIDTHS,
      root: {
        kind: 'container',
        id: 'panel',
        layout: 'stack',
        axes: { backgroundImageUrl: ORIGIN },
        children: [
          { kind: 'slot', id: 'seam', name: 'signup-form', axes: { backgroundImageUrl: ORIGIN } },
          { kind: 'text', id: 'chip', text: 'Coming soon', axes: { backgroundImageUrl: ORIGIN } },
          { kind: 'image', id: 'shot', src: ORIGIN, alt: 'Shot' },
        ],
      },
    } as unknown as L1Document
    const assets: CaptureAsset[] = [
      { id: 'card', kind: 'image', src: ORIGIN, localPath: 'assets/card.png' },
    ]

    const out = localizeAssets(doc, assets)
    const root = out.doc.root as Extract<L1Node, { kind: 'container' }>
    const [seam, chip, shot] = root.children as [
      Extract<L1Node, { kind: 'slot' }>,
      Extract<L1Node, { kind: 'text' }>,
      Extract<L1Node, { kind: 'image' }>,
    ]

    // The background handle resolves to a site-local /assets/… path on a
    // container, a slot and a text run — not only on a box / image leaf.
    expect(root.axes?.backgroundImageUrl).toBe('/assets/card.png')
    expect(seam.axes?.backgroundImageUrl).toBe('/assets/card.png')
    expect(chip.axes?.backgroundImageUrl).toBe('/assets/card.png')
    expect(shot.src).toBe('/assets/card.png')
    expect(out.unmirrored).toEqual([])
    expect(out.unreferenced).toEqual([])

    // The imported page therefore requests no URL from the captured origin — it
    // serves its own bytes rather than hotlinking.
    const { html, css } = renderL1Document(out.doc)
    expect(css).not.toContain('example.test')
    expect(html).not.toContain('example.test')
    expect(css).toContain('url("assets/card.png")')

    // A handle with no mirrored counterpart is REPORTED as a gap rather than
    // silently left pointing at the origin.
    const unmirrorable = {
      widths: WIDTHS,
      root: {
        kind: 'container',
        layout: 'stack',
        axes: { backgroundImageUrl: 'https://example.test/images/missing.png' },
        children: [],
      },
    } as unknown as L1Document
    const gap = localizeAssets(unmirrorable, assets)
    expect(gap.unmirrored).toEqual(['https://example.test/images/missing.png'])
  })
})
