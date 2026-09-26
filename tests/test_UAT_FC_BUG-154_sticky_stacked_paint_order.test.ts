/**
 * BUG-154 — **the pin's paint order, said in the other spelling.**
 *
 * REQ-328 closed the gap in the pin: `sticky.lift` puts a held node above the
 * siblings that travel past it, and this suite does not re-prove that field. What
 * it proves is the report that followed it. An author building the composition
 * REQ-328 was written for reached instead for `stacked: true` — the axis whose own
 * first line reads "**this node is deliberately stacked over what it overlaps**" —
 * wrote it on the pinned child, watched the envelope accept it and `get_l1` read it
 * back, and got the defect unchanged. The text still crossed the image.
 *
 * The two fields were one sentence to an author and two mechanisms to the renderer.
 * `stacked` is the evaluator's exemption: it says an overlap is the design rather
 * than a defect, so the gate stops reporting it, and it emitted no CSS. In ordinary
 * flow that costs nothing — a later sibling already paints over an earlier one, so
 * the node that declared itself the FIGURE of the overlap is painted as one without
 * anyone emitting a `z-index`. A pin is the one placement where that stops being
 * true: the page moves past a node that does not, so the sibling arriving later
 * covers the figure, and the declaration and the paint say opposite things.
 *
 * So the fix is keyed on the pair, not on `stacked` alone, and the suite is mostly
 * about the bound. A `stacked` node with no pin must still emit nothing — that is
 * what keeps every folded reproduction's paint exactly where the reference put it,
 * since the fold authors `stacked` on the overlaps it measured and never authors
 * `sticky`.
 *
 * THE EMITTER IS THE OBSERVATION POINT, on REQ-328's own terms: what a browser does
 * with `z-index` is the browser's contract. What is ours is that the pair compiles
 * to exactly one declaration, that it is confined to the band the pin is confined
 * to, that the unpaired axis is inert to the byte, and that the envelope is
 * unchanged.
 */
import { describe, expect, it } from 'vitest'
import {
  L1_STRUCTURAL_RULES,
  emailTargetErrors,
  l1NodeAxisGroupsSchema,
  validateL1,
  type L1Document,
  type L1Node,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

function doc(root: L1Node): L1Document {
  return { widths: WIDTHS, root }
}

/** A section deep enough to hold a pin through — a pin's parent must be. */
function section(children: L1Node[]): L1Node {
  return { kind: 'container', layout: 'stack', children } as L1Node
}

/**
 * The declarations of a selector's ungated, non-media rule. A width-gated pin
 * lands in `@media`, which is the one thing these tests have to tell apart from an
 * unconditional one.
 */
function baseDecls(css: string, selector: string): string[] {
  const head = css.split('@media')[0].split('@supports')[0]
  const esc = selector.replace(/[.:*+?^${}()|[\]\\]/g, '\\$&')
  const rules = [...head.matchAll(new RegExp(`${esc}\\s*\\{([^}]*)\\}`, 'g'))]
  if (!rules.length) return []
  return rules[rules.length - 1][1]
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
}

/** The body of a named media block, wherever it sits. */
function mediaBlock(css: string, media: string): string {
  const blocks = [...css.matchAll(/@media ([^{]+)\{([\s\S]*?)\n\s*\}/g)]
  return blocks.find((b) => b[1].trim() === media)?.[2] ?? ''
}

/**
 * The report's own structure, to the field: a `stack` of two children, the first
 * pinned and stacked and carrying an opaque surface, the second a plain container
 * of text tall enough to scroll past it.
 */
function pinnedHero(sticky: Record<string, unknown>, stacked = true): L1Node {
  const hero: Record<string, unknown> = {
    kind: 'container',
    layout: 'stack',
    sticky,
    axes: { surfaceFill: '#101820' },
    children: [{ kind: 'image', src: '/hero.jpg', alt: 'The drawing' }],
  }
  if (stacked) hero.stacked = true
  return section([
    hero as L1Node,
    {
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', text: 'The masthead' },
        { kind: 'text', text: 'and the copy beneath it' },
      ],
    } as L1Node,
  ])
}

describe('BUG-154 — `stacked` is honoured on a pinned node', () => {
  /**
   * AC1 — **the reported composition works, written the way it was reported.**
   *
   * The pinned child declared `stacked` and an opaque `surfaceFill` and was painted
   * under the container that scrolled past it anyway. Rendered now, the pin holds
   * the positive-z paint step and the sibling that used to cover it is untouched —
   * nothing was pushed down to make room, so the page gains one `z-index` to reason
   * about rather than two.
   *
   * The surface fill is asserted alongside it because the report offered it as a
   * second, independent reason the occlusion should have happened: it was being
   * painted all along, and being painted underneath. It still is painted, and now
   * it is painted on top.
   */
  it('test_UAT_FC_BUG-154_a_stacked_pin_paints_above_the_siblings_that_pass_it', () => {
    const d = doc(pinnedHero({ topPx: 0 }))
    expect(validateL1(d).ok).toBe(true)
    const css = renderL1Document(d).css

    const pin = baseDecls(css, '.l1-1')
    expect(pin).toContain('position: sticky')
    expect(pin).toContain('top: 0px')
    expect(pin).toContain('z-index: 1')

    // The second, independent reason the report expected occlusion — still painted,
    // and now painted over the copy rather than under it.
    expect(pin.join('; ')).toContain('background-color: #101820')

    // The sibling that was covering it is unchanged: it is still the positioned
    // box it always was, and it was not pushed down to make room. The pin rose,
    // nothing sank, so the page carries one `z-index` rather than two.
    const sibling = baseDecls(css, '.l1-3')
    expect(sibling).toContain('position: relative')
    expect(sibling.join('; ')).not.toContain('z-index')
    expect(css.match(/z-index/g)).toHaveLength(1)
  })

  /**
   * AC2 — **`stacked` without a pin is still inert, to the byte.**
   *
   * The bound that makes the change safe, and the reason it is keyed on the pair.
   * `stacked` is authored by the FOLD, on every overlap a captured reference
   * actually painted — a headline over a hero photograph, a badge on a card's
   * corner. If the axis emitted a `z-index` on its own, every one of those
   * reproductions would have its paint order moved by a field that was recording
   * what the reference already did.
   *
   * Asserted as byte-identity against the same document with the axis removed,
   * rather than as an absence of the string: the guarantee is that the stylesheet
   * is the one the renderer emitted before this change, not merely that it has no
   * `z-index` in it.
   */
  it('test_UAT_FC_BUG-154_stacked_without_a_pin_emits_nothing', () => {
    const stacked = doc(
      section([
        {
          kind: 'container',
          layout: 'stack',
          stacked: true,
          axes: { surfaceFill: '#101820' },
          children: [{ kind: 'image', src: '/hero.jpg', alt: 'The drawing' }],
        } as L1Node,
        { kind: 'text', text: 'The masthead' } as L1Node,
      ]),
    )
    const plain = doc(
      section([
        {
          kind: 'container',
          layout: 'stack',
          axes: { surfaceFill: '#101820' },
          children: [{ kind: 'image', src: '/hero.jpg', alt: 'The drawing' }],
        } as L1Node,
        { kind: 'text', text: 'The masthead' } as L1Node,
      ]),
    )
    expect(validateL1(stacked).ok).toBe(true)
    expect(renderL1Document(stacked).css).toBe(renderL1Document(plain).css)
    expect(renderL1Document(stacked).css).not.toContain('z-index')
  })

  /**
   * AC3 — **both spellings on one node emit one declaration.**
   *
   * They are one decision said twice, not two paint levels, so the pin does not
   * climb a second step for being told twice. This is also what makes the pair
   * harmless to write: an author who finds `lift` after having written `stacked`
   * has nothing to undo.
   */
  it('test_UAT_FC_BUG-154_both_spellings_are_one_decision', () => {
    const both = doc(pinnedHero({ topPx: 0, lift: true }))
    expect(validateL1(both).ok).toBe(true)
    const bothCss = renderL1Document(both).css
    expect(bothCss.match(/z-index/g)).toHaveLength(1)

    // And the two spellings are the same stylesheet: `stacked` alone, `lift` alone,
    // and the pair all render identically.
    const liftOnly = doc(pinnedHero({ topPx: 0, lift: true }, false))
    const stackedOnly = doc(pinnedHero({ topPx: 0 }))
    expect(renderL1Document(stackedOnly).css).toBe(renderL1Document(liftOnly).css)
    expect(bothCss).toBe(renderL1Document(liftOnly).css)
  })

  /**
   * AC4 — **a width-gated pin stacks only inside its own band.**
   *
   * The paint level a pin holds at is only meaningful where the pin is. Below
   * `fromPx` the node is in ordinary flow, and lifting it there would change the
   * page's paint at exactly the widths the author excluded the pin from — a change
   * asked for nowhere. `stacked` rides in the pin's declaration list for that
   * reason, the same list `lift` rides in, so the confinement is structural rather
   * than a second thing to remember.
   */
  it('test_UAT_FC_BUG-154_a_gated_pin_stacks_only_where_it_is_held', () => {
    const d = doc(pinnedHero({ topPx: 24, fromPx: 900 }))
    expect(validateL1(d).ok).toBe(true)
    const css = renderL1Document(d).css

    const base = baseDecls(css, '.l1-1')
    expect(base).not.toContain('position: sticky')
    expect(base).not.toContain('z-index: 1')

    expect(mediaBlock(css, '(min-width: 900px)')).toContain(
      '.l1-1 { position: sticky; top: 24px; z-index: 1 }',
    )
  })

  /**
   * AC5 — **the envelope is untouched.**
   *
   * The axis buys no exemption from anything it was already held to, and gains no
   * new legal value for having gained an effect. `false` is still refused rather
   * than read as a synonym for absent — absence has to keep meaning "nobody has
   * chosen", which for an overlap is still a finding and for a pin is still the
   * document-order paint. A stacked pin is still two placements against an absolute
   * track, and an email client still scrolls its own panel.
   */
  it('test_UAT_FC_BUG-154_the_envelope_is_unchanged_by_the_new_effect', () => {
    expect(l1NodeAxisGroupsSchema.safeParse({ stacked: true }).success).toBe(true)
    expect(l1NodeAxisGroupsSchema.safeParse({}).success).toBe(true)
    // Not a second spelling of absent, and not a level.
    expect(l1NodeAxisGroupsSchema.safeParse({ stacked: false }).success).toBe(false)
    expect(l1NodeAxisGroupsSchema.safeParse({ stacked: 2 }).success).toBe(false)
    // Still `.strict()`: a near-miss key is refused, never ignored.
    expect(l1NodeAxisGroupsSchema.safeParse({ stack: true }).success).toBe(false)

    // Still two placements and two owners of `top`, stacked or not.
    const result = validateL1(
      doc(
        section([
          {
            kind: 'image',
            src: '/hero.jpg',
            alt: 'The drawing',
            stacked: true,
            sticky: { topPx: 0 },
            geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 320, height: 400 }] },
          } as L1Node,
        ]),
      ),
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.map((e) => e.message)).toContain(L1_STRUCTURAL_RULES.stickyIsInFlow)
    }

    // And still refused on an email page by the pin's own name.
    const paths = emailTargetErrors({
      widths: [600],
      root: {
        kind: 'box',
        children: [{ kind: 'text', text: 'Hello', stacked: true, sticky: { topPx: 0 } }],
      },
    } as L1Document).map((e) => e.path)
    expect(paths).toContain('/root/children/0/sticky')
  })
})
