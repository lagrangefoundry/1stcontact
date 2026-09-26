/**
 * REQ-326 — **more than one motion behaviour on one element, composed rather
 * than replaced.**
 *
 * An element's entrance was a single object, so naming a second behaviour
 * replaced the first. Concretely: one `reveal` carries one `durationMs`, one
 * `delayMs` and one `easing`, so a node that wanted to fade quickly and rise
 * slowly had to pick one timing for both properties — "A and B simultaneously
 * with different durations" had no spelling at all.
 *
 * The other two pairings the ticket names resolve elsewhere and are deliberately
 * not re-tested here: an entrance plus a HOVER response already composes (they
 * animate `translate` and `transform` respectively, and REQ-100's suite pins
 * it), and an entrance plus a SCROLL-LINKED track composes for free once that
 * lands as its own node-level field (REQ-325 / REQ-328, filed separately).
 *
 * These UATs pin what this ticket settles:
 *   1. two behaviours animating different properties compose, each with its own
 *      duration, delay and curve;
 *   2. two behaviours animating the SAME property refuse the document, naming
 *      the property and both behaviours — never silently dropping one;
 *   3. a behaviour that animates nothing is refused;
 *   4. order in the list is the authored composition order;
 *   5. a single object is still accepted and unchanged, and a one-element list
 *      is refused rather than admitted as a second spelling of it;
 *   6. every behaviour is bounded on its own, and the refusal says which;
 *   7. composing costs the entrance none of the properties that make it safe —
 *      it still fails visible, still honours reduced motion, and still takes a
 *      container's stagger;
 *   8. and a refusal inside an entrance still names the offending key, which is
 *      what turning the field into a union put at risk.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

function doc(root: L1Node): L1Document {
  return { widths: WIDTHS, root }
}

function escapeSelector(selector: string): string {
  return selector.replace(/[.:*+?^${}()|[\]\\]/g, '\\$&')
}

/** Every declaration a selector carries outside a media query, in source order. */
function allDecls(css: string, selector: string): string[] {
  const head = css.split('@media')[0]
  const rules = [...head.matchAll(new RegExp(`${escapeSelector(selector)}\\s*\\{([^}]*)\\}`, 'g'))]
  return rules.flatMap((r) =>
    r[1]
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean),
  )
}

/** Every declaration for a selector inside the named media query. */
function mediaDecls(css: string, media: string, selector: string): string[] {
  const blocks = [...css.matchAll(/@media ([^{]+)\{([\s\S]*?)\n\}/g)]
  const block = blocks.find((b) => b[1].trim() === media)
  if (!block) return []
  const rules = [...block[2].matchAll(new RegExp(`${escapeSelector(selector)}\\s*\\{([^}]*)\\}`, 'g'))]
  return rules.flatMap((r) =>
    r[1]
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean),
  )
}

/** The value of a longhand on a rule, e.g. `transition-property` → its list. */
function longhand(list: string[], prop: string): string | undefined {
  const found = list.find((d) => d.startsWith(`${prop}:`))
  return found?.slice(prop.length + 1).trim()
}

/** A comma-list longhand, split into its per-property entries. */
function longhandList(list: string[], prop: string): string[] {
  const v = longhand(list, prop)
  return v === undefined ? [] : v.split(',').map((s) => s.trim())
}

const REDUCED = '(prefers-reduced-motion: reduce)'
const pre = (n: number) => `html[data-l1-motion] .l1-${n}:not(.l1-in)`

/** Every refusal message the envelope produces for a document. */
function refusals(d: L1Document): string[] {
  const r = validateL1(d)
  return r.ok ? [] : r.errors.map((e) => `${e.path}: ${e.message}`)
}

describe('REQ-326 — one element, more than one entrance behaviour', () => {
  /**
   * AC1 — the case with no spelling before this ticket. The image the ticket
   * describes: a fade that lands quickly so the content is legible, and a rise
   * that keeps moving long after it — two durations on one node.
   */
  it('test_UAT_FC_REQ-326_two_behaviours_compose_with_their_own_timings', () => {
    const d = doc({
      kind: 'container',
      layout: 'stack',
      children: [
        {
          kind: 'image',
          src: '/assets/plate.jpg',
          alt: 'A plate',
          reveal: [
            { fromOpacity: 0, durationMs: 200, easing: 'linear' },
            { yPx: 48, durationMs: 800, delayMs: 120, easing: 'ease-in-out' },
          ],
        },
      ],
    } as L1Node)
    expect(validateL1(d).ok).toBe(true)

    const { html, css } = renderL1Document(d)

    // Both behaviours reach the pre-state: the node comes from BOTH places at
    // once, which is what "composed rather than replaced" means.
    const preDecls = allDecls(css, pre(1))
    expect(preDecls).toContain('opacity: 0')
    expect(preDecls).toContain('translate: 0 48px')

    // And each property arrives on its OWN timing. Before this ticket a single
    // `durationMs` was broadcast across both, so this is the assertion the
    // whole change exists for.
    const base = allDecls(css, '.l1-1')
    expect(longhandList(base, 'transition-property')).toEqual(['opacity', 'translate'])
    expect(longhandList(base, 'transition-duration')).toEqual(['200ms', '800ms'])
    expect(longhandList(base, 'transition-timing-function')).toEqual(['linear', 'ease-in-out'])
    expect(longhandList(base, 'transition-delay')).toEqual(['0ms', '120ms'])

    // Composing behaviours does not multiply the machinery that drives them: the
    // node carries exactly the observer handles a single behaviour would have.
    const single = renderL1Document(
      doc({
        kind: 'container',
        layout: 'stack',
        children: [
          {
            kind: 'image',
            src: '/assets/plate.jpg',
            alt: 'A plate',
            reveal: { fromOpacity: 0, durationMs: 200 },
          },
        ],
      } as L1Node),
    )
    expect(html.match(/\bl1-rv\b/g)?.length).toBe(single.html.match(/\bl1-rv\b/g)?.length)
  })

  /**
   * AC2 — the composition rule the ticket asks to be settled. Refusing is chosen
   * over last-one-wins precisely because the dropped behaviour moves no pixel and
   * says nothing about why: the author meets it as a design that did not arrive.
   */
  it('test_UAT_FC_REQ-326_two_behaviours_on_the_same_property_are_refused', () => {
    // Both rise. There is no reading of this that is not a contest.
    const bothRise = refusals(
      doc({
        kind: 'box',
        children: [
          {
            kind: 'text',
            text: 'x',
            reveal: [
              { yPx: 24, fromOpacity: 0, durationMs: 200 },
              { yPx: 48, durationMs: 800 },
            ],
          },
        ],
      } as L1Node),
    )
    expect(bothRise.length).toBeGreaterThan(0)
    const contest = bothRise.find((m) => m.includes('cannot animate the same property'))
    // The message names WHICH property, and which behaviour already had it — a
    // refusal saying only "invalid" leaves an author bisecting their own list.
    expect(contest).toBeDefined()
    expect(contest).toContain("'translate'")
    expect(contest).toContain('behaviour 0')
    // And the path reaches the offending behaviour, not merely the node.
    expect(contest).toContain('/root/children/0/reveal/1')

    // The same rule on the other axis. Two fades are a contest for the same
    // reason two rises are — the node has one opacity.
    const bothFade = refusals(
      doc({
        kind: 'box',
        children: [
          {
            kind: 'text',
            text: 'x',
            reveal: [
              { fromOpacity: 0, yPx: 24, durationMs: 200 },
              { fromOpacity: 0.2, durationMs: 800 },
            ],
          },
        ],
      } as L1Node),
    )
    expect(bothFade.some((m) => m.includes("'opacity'"))).toBe(true)

    // A rise beside a fade is NOT a contest, even though only one of the two
    // names an opacity: the entrance-level default lands on the first behaviour
    // only when no behaviour names one at all, so it never manufactures a claim
    // that takes a property out from under a behaviour that asked for it.
    expect(
      validateL1(
        doc({
          kind: 'box',
          children: [
            {
              kind: 'text',
              text: 'x',
              reveal: [
                { yPx: 24, durationMs: 200 },
                { fromOpacity: 0.2, durationMs: 800 },
              ],
            },
          ],
        } as L1Node),
      ).ok,
    ).toBe(true)

    // Different properties are the common case and must NOT be refused.
    expect(
      validateL1(
        doc({
          kind: 'box',
          children: [
            {
              kind: 'text',
              text: 'x',
              reveal: [
                { fromOpacity: 0, durationMs: 200 },
                { yPx: 48, durationMs: 800 },
              ],
            },
          ],
        } as L1Node),
      ).ok,
    ).toBe(true)
  })

  /**
   * AC3 — a behaviour has to move something. Timing attached to no property is
   * not a behaviour; it is a place in the composition order, and a list carrying
   * one describes a node moving in a way it never moves.
   */
  it('test_UAT_FC_REQ-326_a_behaviour_that_animates_nothing_is_refused', () => {
    const inert = refusals(
      doc({
        kind: 'box',
        children: [
          {
            kind: 'text',
            text: 'x',
            reveal: [{ fromOpacity: 0, durationMs: 200 }, { durationMs: 800 }],
          },
        ],
      } as L1Node),
    )
    expect(inert.some((m) => m.includes('must animate at least one property'))).toBe(true)

    // A zero rise is the same thing wearing an axis: it names `yPx` and still
    // moves nothing, so the claim is judged by what will actually be emitted.
    const zeroRise = refusals(
      doc({
        kind: 'box',
        children: [
          {
            kind: 'text',
            text: 'x',
            reveal: [{ fromOpacity: 0, durationMs: 200 }, { yPx: 0, durationMs: 800 }],
          },
        ],
      } as L1Node),
    )
    expect(zeroRise.some((m) => m.includes('must animate at least one property'))).toBe(true)
  })

  /**
   * AC4 — order in the list is the composition order. Because a same-property
   * contest is refused rather than resolved, order never decides a winner; what
   * it buys is an emission an author chose rather than one the renderer's walk
   * happened to produce.
   */
  it('test_UAT_FC_REQ-326_composition_order_is_the_authored_order', () => {
    const fadeFirst = renderL1Document(
      doc({
        kind: 'image',
        src: '/assets/a.jpg',
        alt: '',
        reveal: [
          { fromOpacity: 0, durationMs: 200 },
          { yPx: 48, durationMs: 800 },
        ],
      } as L1Node),
    )
    const riseFirst = renderL1Document(
      doc({
        kind: 'image',
        src: '/assets/a.jpg',
        alt: '',
        reveal: [
          { yPx: 48, durationMs: 800 },
          { fromOpacity: 0, durationMs: 200 },
        ],
      } as L1Node),
    )

    expect(longhandList(allDecls(fadeFirst.css, '.l1-0'), 'transition-property')).toEqual([
      'opacity',
      'translate',
    ])
    expect(longhandList(allDecls(riseFirst.css, '.l1-0'), 'transition-property')).toEqual([
      'translate',
      'opacity',
    ])
    // The timings travel with their own behaviour, so reordering reorders both
    // lists together rather than pairing a property with a stranger's duration.
    expect(longhandList(allDecls(riseFirst.css, '.l1-0'), 'transition-duration')).toEqual([
      '800ms',
      '200ms',
    ])
  })

  /**
   * AC5 — backwards compatibility, and the one deliberate departure from the
   * ticket's wording. A single object is unchanged; a ONE-element list is refused
   * rather than accepted as a second spelling of it, for the reason the text
   * node's own copy union already gives: two ways to write the same thing is a
   * document that reads differently depending on who wrote it.
   */
  it('test_UAT_FC_REQ-326_a_single_behaviour_is_unchanged_and_a_one_item_list_is_refused', () => {
    const single = doc({
      kind: 'text',
      text: 'Code got cheap.',
      reveal: { yPx: 24, fromOpacity: 0, durationMs: 600, easing: 'ease-out' },
    } as L1Node)
    expect(validateL1(single).ok).toBe(true)

    const { css } = renderL1Document(single)
    expect(allDecls(css, pre(0))).toEqual(['opacity: 0', 'translate: 0 24px'])
    const base = allDecls(css, '.l1-0')
    expect(longhand(base, 'transition-property')).toBe('opacity, translate')
    // Uniform timing still collapses to one value rather than a repeated list,
    // so an existing document's stylesheet is untouched by this change.
    expect(longhand(base, 'transition-duration')).toBe('600ms')
    expect(longhand(base, 'transition-timing-function')).toBe('ease-out')

    const oneItem = refusals(
      doc({
        kind: 'text',
        text: 'x',
        reveal: [{ yPx: 24, fromOpacity: 0, durationMs: 600 }],
      } as L1Node),
    )
    expect(oneItem.length).toBeGreaterThan(0)
    expect(oneItem.join(' ')).toMatch(/>=2|at least 2|2 items/i)
  })

  /**
   * AC6 — every behaviour is bounded on its own, and the refusal says which one.
   * Told only that "a duration on this node is out of range", an author with two
   * behaviours has to bisect their own list to find out which.
   */
  it('test_UAT_FC_REQ-326_each_behaviour_is_bounded_and_the_refusal_names_which', () => {
    const outOfRange = refusals(
      doc({
        kind: 'box',
        children: [
          {
            kind: 'text',
            text: 'x',
            reveal: [
              { fromOpacity: 0, durationMs: 200 },
              { yPx: 48, durationMs: 999_999 },
            ],
          },
        ],
      } as L1Node),
    )
    expect(outOfRange.some((m) => m.startsWith('/root/children/0/reveal/1/durationMs'))).toBe(true)

    // A single behaviour keeps REQ-100's own path verbatim, so an existing
    // refusal reads exactly as it always did.
    const singleOutOfRange = refusals(
      doc({ kind: 'box', reveal: { yPx: 24, durationMs: 999_999 } } as L1Node),
    )
    expect(singleOutOfRange.some((m) => m.startsWith('/root/reveal/durationMs'))).toBe(true)

    // And the composition itself is bounded: a list longer than the envelope
    // admits is refused whole rather than walked.
    const tooMany = refusals(
      doc({
        kind: 'box',
        children: [
          {
            kind: 'text',
            text: 'x',
            reveal: [
              { fromOpacity: 0 },
              { yPx: 1 },
              { yPx: 2 },
              { yPx: 3 },
              { yPx: 4 },
            ],
          },
        ],
      } as L1Node),
    )
    expect(tooMany.some((m) => m.includes('entrance behaviours out of range'))).toBe(true)
  })

  /**
   * AC7 — the entrance-level default fade. `reveal` has meant "fade in, and
   * optionally rise" since it existed, and applying that default per behaviour
   * would put every composed entrance in breach of AC2 and leave the list form
   * able to express nothing. So the default is resolved once for the entrance.
   */
  it('test_UAT_FC_REQ-326_the_default_fade_belongs_to_the_entrance_not_to_each_behaviour', () => {
    const d = doc({
      kind: 'image',
      src: '/assets/a.jpg',
      alt: '',
      // Neither behaviour names a from-opacity. The first owns the fade; the
      // second animates only the rise it does name.
      reveal: [
        { yPx: 12, durationMs: 300 },
        { yPx: 0, durationMs: 900 },
      ],
    } as L1Node)
    // ...except the second one now moves nothing at all, which AC3 refuses.
    expect(validateL1(d).ok).toBe(false)

    const ok = doc({
      kind: 'image',
      src: '/assets/a.jpg',
      alt: '',
      reveal: [
        { durationMs: 300, easing: 'linear' },
        { yPx: 40, durationMs: 900 },
      ],
    } as L1Node)
    expect(validateL1(ok).ok).toBe(true)
    const { css } = renderL1Document(ok)
    // The fade landed on the FIRST behaviour, with that behaviour's timing.
    expect(allDecls(css, pre(0))).toEqual(['opacity: 0', 'translate: 0 40px'])
    const base = allDecls(css, '.l1-0')
    expect(longhandList(base, 'transition-property')).toEqual(['opacity', 'translate'])
    expect(longhandList(base, 'transition-duration')).toEqual(['300ms', '900ms'])
    expect(longhandList(base, 'transition-timing-function')).toEqual(['linear', 'ease-out'])
  })

  /**
   * AC8 — composing must cost the entrance none of the properties that make the
   * mechanism safe rather than merely pretty. A feature that gained expressive
   * range by weakening fail-visible or reduced-motion would be a bad trade.
   */
  it('test_UAT_FC_REQ-326_a_composed_entrance_keeps_the_safety_properties', () => {
    const d = doc({
      kind: 'container',
      layout: 'stack',
      staggerMs: 90,
      children: [
        {
          kind: 'text',
          text: 'One',
          axes: { opacity: 0.6 },
          reveal: [
            { fromOpacity: 0, durationMs: 200 },
            { yPx: 40, durationMs: 800, delayMs: 10 },
          ],
        },
        {
          kind: 'text',
          text: 'Two',
          reveal: [
            { fromOpacity: 0, durationMs: 200 },
            { yPx: 40, durationMs: 800, delayMs: 10 },
          ],
        },
      ],
    } as L1Node)
    expect(validateL1(d).ok).toBe(true)
    const { css } = renderL1Document(d)

    // FAILS VISIBLE — every rule that can present a node pre-entrance is behind
    // the marker only the driver sets. A composed entrance adds no ungated rule.
    for (const selector of [pre(1), pre(2)]) {
      expect(allDecls(css, selector).length).toBeGreaterThan(0)
    }
    expect(css).not.toMatch(/(^|\n)\.l1-1:not\(\.l1-in\)/)

    // REDUCED MOTION — ONE rule for the whole entrance, restoring the node's own
    // authored settled design however many behaviours compose into it.
    expect(mediaDecls(css, REDUCED, pre(1))).toEqual(['opacity: 0.6', 'translate: none'])
    expect(mediaDecls(css, REDUCED, pre(2))).toEqual(['opacity: 1', 'translate: none'])

    // STAGGER — a container's share adds to EVERY behaviour's own delay, so a
    // per-behaviour delay still tunes the stagger rather than fighting it.
    expect(longhandList(allDecls(css, '.l1-1'), 'transition-delay')).toEqual(['0ms', '10ms'])
    expect(longhandList(allDecls(css, '.l1-2'), 'transition-delay')).toEqual(['90ms', '100ms'])
  })

  /**
   * AC9 — **a refusal inside an entrance still names the offending key.** Making
   * the field a union put this at risk in a way that had nothing to do with
   * composition: the envelope localises a union by asking which branch the author
   * was plausibly writing, and a closed-enum failure one segment deep on the
   * single form is indistinguishable from a discriminator mismatch. Read that
   * way, the object branch looked excluded and the ARRAY branch looked like the
   * survivor, so an author who mistyped an easing was told their entrance should
   * have been an array — a refusal that names the wrong fault costs the diagnosis
   * cycle this ticket's composition rule is chosen to avoid.
   */
  it('test_UAT_FC_REQ-326_a_refusal_inside_an_entrance_names_the_offending_key', () => {
    // The single form: a bad easing is reported AT the easing, not as a verdict
    // on the shape of the whole entrance.
    const single = refusals(
      doc({ kind: 'text', text: 'x', reveal: { yPx: 24, easing: 'steps(4, end)' } } as unknown as L1Node),
    )
    expect(single).toHaveLength(1)
    expect(single[0]).toContain('/root/reveal/easing')
    expect(single[0]).not.toMatch(/expected array/)

    // An unknown key on the single form keeps reporting where it always did —
    // the union must not have moved an existing refusal either.
    expect(
      refusals(doc({ kind: 'text', text: 'x', reveal: { yPx: 24, bogus: 1 } } as unknown as L1Node)),
    ).toEqual(['/root/reveal: Unrecognized key: "bogus"'])

    // And the list form localises to the behaviour that carries the fault, so the
    // index in the path is as useful for a schema error as for a bounds refusal.
    const list = refusals(
      doc({
        kind: 'text',
        text: 'x',
        reveal: [{ yPx: 24, easing: 'steps(4, end)' }, { fromOpacity: 0 }],
      } as unknown as L1Node),
    )
    expect(list).toHaveLength(1)
    expect(list[0]).toContain('/root/reveal/0/easing')
  })
})
