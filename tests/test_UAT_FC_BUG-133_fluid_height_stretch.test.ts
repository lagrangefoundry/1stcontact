/**
 * BUG-133 — a `fluid` height is honoured on the axis it lands on.
 *
 * The report: an `image` with `sizing.height.mode = "fluid"` inside a
 * stretch-aligned `row` rendered at the picture's natural proportions and left
 * the row's foot ragged. The write was accepted, `get_l1` read the field back
 * intact, and nothing anywhere said the field did nothing — which is what made
 * it expensive to diagnose.
 *
 * The cause is one line of the emitter. `fluid` compiled to `100%` on whichever
 * axis it was given, and that is right for a width and inert for a height: a
 * block's containing width is definite, a flex row's height is not. Worse than
 * inert, in fact — the computed value being a percentage rather than `auto`
 * disqualifies the node from the flex `stretch` step, so the declaration
 * actively suppressed the fill the row would have given it for free.
 *
 * These UATs pin the ticket's acceptance through the one real entry point, the
 * renderer: the reported layout now stretches; a row's cross-axis fluid height
 * beats the container's own `align`; a `grid` parent gets the same spelling; a
 * `stack` parent (where height is the MAIN axis) is untouched; a responsive
 * parent that flips row<->stack restates the spelling whole at each breakpoint
 * that flips it; the min/max companions survive on both branches; and a
 * document that declares no cross-axis fluid height renders byte-identically.
 */
import { describe, expect, it } from 'vitest'
import type { L1Container, L1Document, L1Node } from '@1stcontact/site-schema'
import { validateL1 } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/l1/render'

const WIDTHS = [320, 768, 1280]

function doc(root: L1Node, widths: number[] = WIDTHS): L1Document {
  return { widths, root }
}

/** The declarations of the rule for `selector` outside every media block. */
function baseDecls(css: string, selector: string): string[] {
  const bare = css.replace(/@media[^{]+\{[\s\S]*?\n\}/g, '')
  const m = new RegExp(`\\${selector} \\{ ([^}]*) \\}`).exec(bare)
  return m ? m[1].split('; ') : []
}

/** Every declaration for `selector` inside the `(min-width: N)` block. */
function mediaDecls(css: string, minWidth: number, selector: string): string[] {
  const block = new RegExp(`@media \\(min-width: ${minWidth}px\\) \\{\\n([\\s\\S]*?)\\n\\}`).exec(css)
  if (!block) return []
  return [...block[1].matchAll(new RegExp(`\\${selector} \\{ ([^}]*) \\}`, 'g'))].flatMap((m) =>
    m[1].split('; '),
  )
}

/**
 * The ticket's own reproduction: a portrait picture at a fixed width beside a
 * column of prose that is taller than it, in a stretch-aligned row.
 */
function mediaObject(align: L1Container['align'] = 'stretch'): L1Document {
  return doc({
    kind: 'container',
    layout: 'row',
    align,
    gapPx: 24,
    children: [
      {
        kind: 'image',
        src: '/img/portrait.jpg',
        alt: 'A portrait',
        sizing: { width: { mode: 'fixed', px: 182 }, height: { mode: 'fluid' } },
        axes: { objectFit: 'cover' },
      },
      {
        kind: 'container',
        layout: 'stack',
        sizing: { width: { mode: 'fluid', maxPx: 466, minPx: 240 } },
        children: [
          { kind: 'text', text: 'A heading', axes: { fontSizePx: 32 } },
          { kind: 'text', text: 'A paragraph of prose that runs to several lines.' },
        ],
      },
    ],
  })
}

describe('BUG-133 — a fluid height fills the axis it actually landed on', () => {
  // ── the reported layout ───────────────────────────────────────────────────

  it('test_UAT_FC_BUG-133_image_with_a_fluid_height_stretches_to_its_rows_height', () => {
    const d = mediaObject()
    expect(validateL1(d).ok).toBe(true)

    const { css, html } = renderL1Document(d)

    // `.l1-0` is the row, `.l1-1` the image.
    expect(baseDecls(css, '.l1-0')).toContain('flex-direction: row')
    expect(baseDecls(css, '.l1-0')).toContain('align-items: stretch')

    const img = baseDecls(css, '.l1-1')
    // The fix: the height is handed back to `auto` and the stretch asked for
    // explicitly. `height: 100%` was the inert spelling and must be gone —
    // leaving it would keep the computed value a percentage and so keep the
    // node out of the flex stretch step.
    expect(img).toContain('height: auto')
    expect(img).toContain('align-self: stretch')
    expect(img).not.toContain('height: 100%')

    // The picture's own width is unchanged, and `objectFit` still governs the
    // crop — which is what makes the stretch a crop rather than a distortion.
    expect(img).toContain('width: 182px')
    expect(img).toContain('object-fit: cover')

    // And it is the `<img>` itself that carries the rule, not a wrapper.
    expect(html).toMatch(/<img class="l1-1"/)
  })

  it('test_UAT_FC_BUG-133_a_fluid_height_stretches_even_in_a_row_aligned_center', () => {
    // The node's own sizing is the more specific statement than the container's
    // default alignment, so `align-self` on the child wins. A fluid height that
    // only worked under `align: "stretch"` would put the author back to reading
    // the parent to find out whether their own field does anything.
    for (const align of ['center', 'start', 'end'] as const) {
      const { css } = renderL1Document(mediaObject(align))
      expect(baseDecls(css, '.l1-0')).toContain(`align-items: ${ALIGN_CSS[align]}`)
      expect(baseDecls(css, '.l1-1'), align).toContain('align-self: stretch')
      expect(baseDecls(css, '.l1-1'), align).toContain('height: auto')
    }
  })

  // ── the axis rule, stated in both directions ──────────────────────────────

  it('test_UAT_FC_BUG-133_a_grid_parent_gets_the_same_cross_axis_spelling', () => {
    // A grid sizes its tracks from their content and stretches its items into
    // them, so a percentage height has nothing to resolve against there either.
    const d = doc({
      kind: 'container',
      layout: 'grid',
      columns: 2,
      children: [
        { kind: 'box', sizing: { height: { mode: 'fluid' } }, children: [] },
        { kind: 'text', text: 'Taller than its neighbour, over several lines.' },
      ],
    })
    expect(validateL1(d).ok).toBe(true)

    const cell = baseDecls(renderL1Document(d).css, '.l1-1')
    expect(cell).toContain('height: auto')
    expect(cell).toContain('align-self: stretch')
    expect(cell).not.toContain('height: 100%')
  })

  it('test_UAT_FC_BUG-133_a_stack_parent_keeps_the_percentage_height', () => {
    // Under a `stack`, height is the MAIN axis: a percentage resolves against a
    // parent that declares one, and where none is declared there is no free
    // space to fill either. Nothing to fix, so nothing changes.
    const d = doc({
      kind: 'container',
      layout: 'stack',
      sizing: { height: { mode: 'fixed', px: 600 } },
      children: [{ kind: 'box', sizing: { height: { mode: 'fluid' } }, children: [] }],
    })
    expect(validateL1(d).ok).toBe(true)

    const child = baseDecls(renderL1Document(d).css, '.l1-1')
    expect(child).toContain('height: 100%')
    expect(child).not.toContain('align-self: stretch')
  })

  it('test_UAT_FC_BUG-133_a_box_parent_keeps_the_percentage_height', () => {
    // A `box` is a plain block, not a flex container — there is no cross axis to
    // stretch into, so it answers the same way a stack does.
    const d = doc({
      kind: 'box',
      sizing: { height: { mode: 'fixed', px: 400 } },
      children: [{ kind: 'box', sizing: { height: { mode: 'fluid' } }, children: [] }],
    })
    expect(validateL1(d).ok).toBe(true)

    const child = baseDecls(renderL1Document(d).css, '.l1-1')
    expect(child).toContain('height: 100%')
    expect(child).not.toContain('align-self: stretch')
  })

  it('test_UAT_FC_BUG-133_a_fluid_width_is_unchanged_under_every_parent', () => {
    // The defect is height-only: a block's containing width is definite, so
    // `width: 100%` resolves everywhere and needs no per-parent spelling.
    for (const layout of ['row', 'stack', 'grid'] as const) {
      const d = doc({
        kind: 'container',
        layout,
        columns: 2,
        children: [{ kind: 'box', sizing: { width: { mode: 'fluid' } }, children: [] }],
      })
      const child = baseDecls(renderL1Document(d).css, '.l1-1')
      expect(child, layout).toContain('width: 100%')
      expect(child, layout).not.toContain('align-self: stretch')
    }
  })

  it('test_UAT_FC_BUG-133_min_and_max_height_survive_beside_both_spellings', () => {
    for (const [layout, expected] of [
      ['row', 'height: auto'],
      ['stack', 'height: 100%'],
    ] as const) {
      const d = doc({
        kind: 'container',
        layout,
        children: [
          {
            kind: 'box',
            sizing: { height: { mode: 'fluid', minPx: 120, maxPx: 480 } },
            children: [],
          },
        ],
      })
      const child = baseDecls(renderL1Document(d).css, '.l1-1')
      expect(child, layout).toContain(expected)
      expect(child, layout).toContain('min-height: 120px')
      expect(child, layout).toContain('max-height: 480px')
    }
  })

  // ── REQ-104: a parent whose axis assignment changes with the width ────────

  it('test_UAT_FC_BUG-133_a_responsive_parent_restates_the_spelling_whole_at_each_flip', () => {
    // The commonest responsive shape there is: a media object that stacks on a
    // phone and becomes a row on a desktop. Which axis `height` is changes at
    // the breakpoint, so the fluid spelling has to change with it — and each
    // rule has to be self-sufficient, because a `@media` override REPLACES the
    // mode below it. Half a spelling leaking past the breakpoint (an
    // `align-self: stretch` still standing in stack mode) is a layout nobody
    // declared.
    const d = doc({
      kind: 'container',
      layout: 'row',
      responsiveLayout: { keyframes: [{ at: 0, value: 'stack' }, { at: 768, value: 'row' }] },
      children: [
        {
          kind: 'image',
          src: '/img/portrait.jpg',
          alt: 'A portrait',
          sizing: { width: { mode: 'fixed', px: 182 }, height: { mode: 'fluid' } },
          axes: { objectFit: 'cover' },
        },
        { kind: 'text', text: 'Prose beside it.' },
      ],
    })
    expect(validateL1(d).ok).toBe(true)

    const { css } = renderL1Document(d)

    // Below the breakpoint the parent stacks: the percentage spelling, with the
    // stretch explicitly off so the desktop rule cannot cascade backwards.
    const base = baseDecls(css, '.l1-1')
    expect(base).toContain('height: 100%')
    expect(base).toContain('align-self: auto')

    // At and above it the parent is a row: the stretch spelling, whole.
    const wide = mediaDecls(css, 768, '.l1-1')
    expect(wide).toContain('height: auto')
    expect(wide).toContain('align-self: stretch')
  })

  it('test_UAT_FC_BUG-133_a_track_that_never_crosses_the_boundary_emits_no_override', () => {
    // `row` -> `grid` puts height on the cross axis at every width, so there is
    // nothing to restate and the ticket costs such a document no extra bytes.
    const d = doc({
      kind: 'container',
      layout: 'grid',
      columns: 2,
      responsiveLayout: { keyframes: [{ at: 0, value: 'row' }, { at: 768, value: 'grid' }] },
      children: [{ kind: 'box', sizing: { height: { mode: 'fluid' } }, children: [] }],
    })
    const { css } = renderL1Document(d)

    expect(baseDecls(css, '.l1-1')).toContain('align-self: stretch')
    // The child contributes nothing at the breakpoint — only the parent does.
    expect(mediaDecls(css, 768, '.l1-1')).toEqual([])
  })

  // ── the floor ─────────────────────────────────────────────────────────────

  it('test_UAT_FC_BUG-133_a_document_with_no_cross_axis_fluid_height_is_unchanged', () => {
    // Every other sizing mode, on every axis, under a row — the spelling this
    // ticket did not touch. `align-self` appears nowhere in the stylesheet.
    const d = doc({
      kind: 'container',
      layout: 'row',
      align: 'stretch',
      gapPx: 12,
      children: [
        { kind: 'box', sizing: { width: { mode: 'fixed', px: 200 }, height: { mode: 'fixed', px: 90 } }, children: [] },
        { kind: 'box', sizing: { width: { mode: 'fluid' }, height: { mode: 'hug' } }, children: [] },
        { kind: 'text', text: 'No sizing at all.' },
      ],
    })
    expect(validateL1(d).ok).toBe(true)

    const { css } = renderL1Document(d)
    expect(css).not.toContain('align-self')

    expect(baseDecls(css, '.l1-1')).toContain('height: 90px')
    expect(baseDecls(css, '.l1-2')).toContain('height: fit-content')
    expect(baseDecls(css, '.l1-2')).toContain('width: 100%')
  })
})

/** The CSS `align-items` value each L1 `align` names, for the assertion above. */
const ALIGN_CSS = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
} as const
