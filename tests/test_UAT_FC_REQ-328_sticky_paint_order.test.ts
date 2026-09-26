/**
 * REQ-328 — **what passes behind a pinned node, and what passes over it.**
 *
 * REQ-325 built the pin and the progress-driven property track, and settled every
 * question the request that filed it raised but one: *paint order against
 * siblings that pass beneath it*. This suite is that one.
 *
 * The gap is not that the answer was wrong — it is that the answer was never the
 * document's to give. L1 emits no `z-index`, so paint order falls to the CSS
 * painting algorithm, and there the answer turns on which paint step each sibling
 * lands in. An in-flow `box` or `container` takes `position: relative` (it is what
 * makes it the containing block for anything placed inside it) and a `transform`
 * promotes a node into the positioned layer; a bare `text` or `image` leaf takes
 * neither. So whether the masthead travels behind the held hero or over the top of
 * it was a function of the masthead's ELEMENT KIND — and wrapping it in a box to
 * give it a background would move it from one side of the hero to the other with
 * nothing in the document saying so.
 *
 * `sticky.lift` makes it a decision instead: one typed field, one declaration.
 *
 * THE EMITTER IS THE OBSERVATION POINT, on REQ-325's own terms: what a browser
 * does with `z-index` is the browser's contract and no headless run adds evidence
 * about it. What is ours to prove is that the field compiles to exactly that one
 * declaration, that it is confined to the width band the pin is confined to, that
 * its absence changes nothing, and that nothing an author writes reaches CSS as a
 * string.
 */
import { describe, expect, it } from 'vitest'
import {
  L1_STRUCTURAL_RULES,
  emailTargetErrors,
  l1StickySchema,
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

/** The full-bleed illustration the request pins. */
function hero(sticky: Record<string, unknown>): L1Node {
  return { kind: 'image', src: '/hero.jpg', alt: 'The hero', sticky } as L1Node
}

/**
 * The declarations of a selector's rule among the UNGATED, non-media rules — its
 * base rule. A width-gated pin lands in `@media`, which is the one thing these
 * tests have to tell apart from an unconditional one.
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

describe('REQ-328 — the paint order a pin holds at', () => {
  /**
   * AC1 — **the gap is real, and it is decided by the sibling's kind.**
   *
   * The composition the request opens with, rendered: a pinned illustration
   * followed in flow by the content that should pass behind it. Without `lift`
   * the outcome splits on element kind — the two node kinds that take
   * `position: relative`, plus anything carrying a transform, land in the
   * positioned paint step and so cover the pin they follow; the bare leaves do
   * not and pass behind it.
   *
   * Asserted as the SHAPE OF THE DEFECT rather than as a rendering, because that
   * is what the field exists to remove: this is the evidence that absence is not a
   * neutral default, and it is what would start failing if the renderer ever made
   * paint order uniform on its own.
   */
  it('test_UAT_FC_REQ-328_paint_order_without_a_lift_is_the_siblings_kind', () => {
    const d = doc(
      section([
        hero({ topPx: 0 }),
        { kind: 'box', children: [{ kind: 'text', text: 'Masthead' }] } as L1Node,
        { kind: 'container', layout: 'stack', children: [] } as L1Node,
        { kind: 'text', text: 'Sub-line' } as L1Node,
        { kind: 'image', src: '/rule.svg', alt: 'A rule' } as L1Node,
        { kind: 'text', text: 'Nudged', transform: { translateYPx: 4 } } as L1Node,
      ]),
    )
    expect(validateL1(d).ok).toBe(true)
    const css = renderL1Document(d).css

    // The pin itself is positioned — that is what `position: sticky` is.
    expect(baseDecls(css, '.l1-1')).toContain('position: sticky')

    // Siblings that FOLLOW it and are also positioned therefore cover it: a box,
    // a container, and anything a transform promoted.
    expect(baseDecls(css, '.l1-2')).toContain('position: relative')
    expect(baseDecls(css, '.l1-4')).toContain('position: relative')
    expect(baseDecls(css, '.l1-7').join('; ')).toContain('transform:')

    // Siblings that follow it and are NOT positioned pass behind it instead.
    expect(baseDecls(css, '.l1-5')).not.toContain('position: relative')
    expect(baseDecls(css, '.l1-6')).not.toContain('position: relative')

    // And nothing in the document chose either outcome: no `z-index` is emitted
    // anywhere, so there is no declaration an author could have written to say
    // which side of the hero the masthead travels on.
    expect(css).not.toContain('z-index')
  })

  /**
   * AC2 — `sticky.lift` puts the pinned node above every sibling in its container,
   * in the pin's own declaration list.
   *
   * The list matters as much as the value. It is pushed after the placement
   * emitter, so the pin already has to be the last word on `position` there; the
   * lift riding in the same list is what keeps one emitter owning the whole of
   * "where this box is and what level it holds at", with nothing to sequence
   * between two rules.
   */
  it('test_UAT_FC_REQ-328_lift_paints_the_pin_above_its_siblings', () => {
    const d = doc(
      section([
        hero({ topPx: 72, lift: true }),
        { kind: 'box', children: [{ kind: 'text', text: 'Masthead' }] } as L1Node,
      ]),
    )
    expect(validateL1(d).ok).toBe(true)
    const css = renderL1Document(d).css

    const decls = baseDecls(css, '.l1-1')
    expect(decls).toContain('position: sticky')
    expect(decls).toContain('top: 72px')
    expect(decls).toContain('z-index: 1')

    // The sibling that used to cover it is untouched — the pin rose, nothing else
    // was pushed down, so a page gains no second `z-index` to reason about.
    expect(baseDecls(css, '.l1-2')).toEqual(['position: relative'])
    expect(css.match(/z-index/g)).toHaveLength(1)

    // A lifted pin on a box still overrides that box's own `position: relative`,
    // exactly as an unlifted one does.
    const box = doc(section([{ kind: 'box', sticky: { lift: true }, children: [] } as L1Node]))
    const boxDecls = baseDecls(renderL1Document(box).css, '.l1-1')
    expect(boxDecls.filter((x) => x.startsWith('position:')).at(-1)).toBe('position: sticky')
    expect(boxDecls).toContain('z-index: 1')
    // Absent offset still means zero, not "no offset" — the lift changes nothing
    // about the rest of the pin.
    expect(boxDecls).toContain('top: 0px')
  })

  /**
   * AC3 — a width-gated pin lifts **only inside its own band**.
   *
   * The paint level a pin holds at is only meaningful where the pin is. Below
   * `fromPx` the node is in ordinary flow and lifting it would be changing the
   * page's paint for a pin that is not happening — a change the author asked for
   * nowhere, visible at exactly the widths they excluded.
   */
  it('test_UAT_FC_REQ-328_a_gated_pin_lifts_only_where_it_is_held', () => {
    const d = doc(
      section([
        hero({ topPx: 24, fromPx: 900, lift: true }),
        { kind: 'box', children: [] } as L1Node,
      ]),
    )
    expect(validateL1(d).ok).toBe(true)
    const css = renderL1Document(d).css

    // Below the gate: no pin and no lift in the node's unconditional rule.
    const base = baseDecls(css, '.l1-1')
    expect(base).not.toContain('position: sticky')
    expect(base).not.toContain('z-index: 1')

    // At and above it: both, in one rule.
    expect(mediaBlock(css, '(min-width: 900px)')).toContain(
      '.l1-1 { position: sticky; top: 24px; z-index: 1 }',
    )
  })

  /**
   * AC4 — absent `lift` emits no `z-index` at all.
   *
   * The default is not "passes in front" and not "passes behind": it is the
   * document-order paint the substrate already had. A following section that
   * slides OVER a held hero is a real editorial composition, and it is exactly
   * what that default gives — so making the tidier-looking default would have cost
   * expression rather than bought it. The stylesheet of a pin that does not ask to
   * be lifted is the one it was before the field existed.
   */
  it('test_UAT_FC_REQ-328_a_pin_that_does_not_ask_to_be_lifted_is_unchanged', () => {
    const plain = doc(section([hero({ topPx: 40 }), { kind: 'box', children: [] } as L1Node]))
    const css = renderL1Document(plain).css
    expect(css).not.toContain('z-index')
    expect(baseDecls(css, '.l1-1')).toEqual(['display: block', 'position: sticky', 'top: 40px'])

    // The lifted rendering of the same document differs by EXACTLY one declaration
    // — so the field adds what it says it adds and touches nothing else, and the
    // unlifted stylesheet is the one the substrate emitted before it existed.
    const lifted = doc(
      section([hero({ topPx: 40, lift: true }), { kind: 'box', children: [] } as L1Node]),
    )
    expect(renderL1Document(lifted).css).toBe(css.replace('top: 40px', 'top: 40px; z-index: 1'))
  })

  /**
   * AC5 — the envelope: `lift` is `true`-or-absent, and a lifted pin is refused
   * wherever a pin is refused.
   *
   * `false` is refused rather than accepted as a synonym for absent, on the
   * `stacked` precedent: a second spelling of "no" is the drift the schema refuses
   * everywhere, and absence has to keep meaning "the document has not chosen"
   * rather than "the document chose the default". And the field buys no exemption
   * from anything the pin is already held to — an absolute placement is still two
   * owners of `top` whatever level the node paints at, and an email client still
   * scrolls its own panel.
   */
  it('test_UAT_FC_REQ-328_the_envelope_holds_the_lift_to_true_or_absent', () => {
    expect(l1StickySchema.safeParse({ topPx: 0, lift: true }).success).toBe(true)
    expect(l1StickySchema.safeParse({ topPx: 0 }).success).toBe(true)
    // Not a second spelling of absent.
    expect(l1StickySchema.safeParse({ topPx: 0, lift: false }).success).toBe(false)
    // Not a level, not a string, not a nudge — one value or nothing.
    expect(l1StickySchema.safeParse({ topPx: 0, lift: 2 }).success).toBe(false)
    expect(l1StickySchema.safeParse({ topPx: 0, lift: 'over' }).success).toBe(false)
    // The pin stays `.strict()`: a near-miss key is refused, never ignored.
    expect(l1StickySchema.safeParse({ topPx: 0, lifted: true }).success).toBe(false)

    // Still two placements and two owners of `top`, lifted or not.
    const result = validateL1(
      doc(
        section([
          {
            ...hero({ topPx: 0, lift: true }),
            geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 320, height: 400 }] },
          } as L1Node,
        ]),
      ),
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.map((e) => e.message)).toContain(L1_STRUCTURAL_RULES.stickyIsInFlow)
    }

    // And still refused on an email page, by the axis's own name rather than by
    // being silently dropped.
    const paths = emailTargetErrors({
      widths: [600],
      root: {
        kind: 'box',
        children: [{ kind: 'text', text: 'Hello', sticky: { topPx: 0, lift: true } }],
      },
    } as L1Document).map((e) => e.path)
    expect(paths).toContain('/root/children/0/sticky')
  })
})
