/**
 * REQ-333 issues 5 and 7 — two renderer bugs that both put the browser's default
 * on the page where L1 had already said something else.
 *
 * ## Issue 5 — a bare parenthesised column extent
 *
 * `columnExtentCss` returned `(min(896px, 100vw) - 48px)`. A parenthesised math
 * sub-expression is legal only *inside* a math function, so `width: (min(896px,
 * 100vw) - 48px)` is an invalid declaration and the browser DROPS it: the run keeps
 * `position: absolute` with no width, shrinks to fit, and the `text-align: center`
 * emitted on the same rule becomes a no-op. On faelan.com that was three CRITICAL
 * `position` deltas — a hero name, a tagline and a footer line all pinned to the
 * left edge of a column they should have been centred in — and 8.24% of the round's
 * ranked pixel residual.
 *
 * The helper's other two callers happened to wrap it (`min(maxWidthPx, …)` and the
 * keyframe track's `calc(…)`), which is exactly why only the uncapped, full-width,
 * untracked case was ever wrong and why the suite never caught it.
 *
 * ## Issue 7 — the UA anchor rule beating an inherited run colour
 *
 * A link RUN inside a sentence (`Artist • <a>Musician</a> • Creator`) carries no
 * `color` of its own, which is L1 for "same colour as the sentence". The renderer
 * emitted the `<a>` with no colour, and `a:-webkit-any-link { color: -webkit-link }`
 * is a rule on the ELEMENT — it beats the parent's inherited value. So a white hero
 * run painted `#0000ee` where the page (whose own Tailwind base resets
 * `a { color: inherit }`) paints white.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Text } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1280]

/**
 * Every declaration of `.cls`'s base (media-query-free) rules — plural: the emitter
 * writes the placement group and the axis group as two rules on the same selector.
 */
function baseDecls(css: string, cls: string): string[] {
  const out: string[] = []
  for (const [, body] of css.matchAll(new RegExp(`(?:^|\\n)\\.${cls}\\s*\\{([^}]*)\\}`, 'g'))) {
    out.push(...body.split(';').map((d) => d.trim()).filter(Boolean))
  }
  return out
}

/** The value of one property in `.cls`'s base rule. */
function decl(css: string, cls: string, prop: string): string | undefined {
  return baseDecls(css, cls)
    .find((d) => d.startsWith(`${prop}:`))
    ?.slice(prop.length + 1)
    .trim()
}

/**
 * A page whose one run fills a centred column: `anchor.width` is the whole extent
 * with no cap and no track, which is the single shape that reached the bare-extent
 * path.
 */
function centredColumnPage(maxWidthPx?: number): L1Document {
  const text: L1Text = {
    kind: 'text',
    id: 'tagline',
    text: 'Worlds End Studio founder, DJ, Producer and Fiddle Player',
    axes: { textAlign: 'center', color: '#ffffff' },
    geometry: {
      keyframes: WIDTHS.map((at) => ({ at, x: 24, y: 96, width: Math.min(896, at) - 48 })),
      anchor: { x: { px: 0, fraction: 0 }, width: { px: 0, fraction: 1, ...(maxWidthPx ? { maxPx: maxWidthPx } : {}) } },
    },
  }
  return {
    widths: WIDTHS,
    column: { containerPx: 896, insetPx: 24 },
    root: { kind: 'container', id: 'root', layout: 'stack', children: [text] },
  }
}

/** A sentence whose middle word is a link run with no colour of its own. */
function linkedSentence(runOverrides: Record<string, unknown> = {}): L1Document {
  const text: L1Text = {
    kind: 'text',
    id: 'hero-sentence',
    text: [
      { text: 'Artist • ' },
      {
        text: 'Musician',
        axes: { textDecoration: 'underline', ...runOverrides },
        link: { href: 'https://open.spotify.com/artist/abc' },
      },
      { text: ' • Creator' },
    ],
    axes: { color: '#ffffff' },
    geometry: { keyframes: WIDTHS.map((at) => ({ at, x: 102, y: 168, width: Math.min(400, at) })) },
  }
  return {
    widths: WIDTHS,
    root: { kind: 'container', id: 'root', layout: 'stack', children: [text] },
  }
}

describe('REQ-333 issue 5 — the column extent is a self-contained CSS value', () => {
  it('test_UAT_FC_REQ-333_a_full_width_column_run_gets_a_width_the_browser_can_parse', () => {
    const doc = centredColumnPage()
    expect(validateL1(doc).ok, 'the document is a valid L1 envelope').toBe(true)
    const { css, html } = renderL1Document(doc)
    const cls = /<p class="([^"]+)"/.exec(html)![1]

    // THE FAILURE, quoted. `width: (min(896px, 100vw) - 48px)` is what shipped, and
    // a bare parenthesised sub-expression is not a CSS value at all.
    const width = decl(css, cls, 'width')
    expect(width, 'the run carries a width at all').toBeTruthy()
    expect(width, 'no bare parenthesised sub-expression').not.toMatch(/^\(/)

    // THE FIX. The subtraction carries its own math function, so the declaration is
    // valid and the column's extent reaches the element.
    expect(width).toBe('calc(min(896px, 100vw) - 48px)')

    // And the alignment L1 asked for is still emitted beside it — which is the
    // reason the invalid width mattered: without a width there is nothing to centre
    // in, so `text-align: center` silently did nothing.
    expect(baseDecls(css, cls)).toContain('text-align: center')
  })

  it('test_UAT_FC_REQ-333_every_extent_bearing_declaration_is_parseable', () => {
    // THE RAIL, over all three callers at once — the uncapped width, the capped
    // width (`min(maxPx, extent)`) and the keyframe-tracked left (`calc(origin +
    // track + extent)`). The bug was not "this one value is wrong", it was "a helper
    // returns a fragment and each caller has to remember to wrap it", so the
    // property under test is that NO emitted declaration opens on a paren.
    for (const maxWidthPx of [undefined, 640]) {
      const { css } = renderL1Document(centredColumnPage(maxWidthPx))
      const values = [...css.matchAll(/(?:^|[{;])\s*(?:left|width|min-width|top|height)\s*:\s*([^;}]+)/g)]
      expect(values.length, `declarations found (cap=${maxWidthPx})`).toBeGreaterThan(0)
      for (const [, value] of values) {
        expect(value.trim(), `value is a CSS value, not a fragment (cap=${maxWidthPx})`).not.toMatch(/^\(/)
      }
      // Whatever the branch, the extent is only ever spelled inside a math function.
      const bare = css.includes('(min(896px, 100vw) - 48px)') && !css.includes('calc(min(896px, 100vw) - 48px)')
      expect(bare, `the unwrapped extent is gone (cap=${maxWidthPx})`).toBe(false)
    }
  })
})

describe('REQ-333 issue 7 — a synthesised link run inherits the sentence, not the UA', () => {
  it('test_UAT_FC_REQ-333_a_link_run_with_no_colour_of_its_own_inherits_the_sentence', () => {
    const doc = linkedSentence()
    expect(validateL1(doc).ok, 'the document is a valid L1 envelope').toBe(true)
    const { css, html } = renderL1Document(doc)

    // The run is an `<a>` — that part was always right, and is the reason the UA
    // rule applies to it.
    const runClass = /<a class="([^"]+)"/.exec(html)![1]
    expect(html).toContain('href="https://open.spotify.com/artist/abc"')

    // THE FAILURE: `.l1-3-r1 { text-decoration: underline }` and nothing else, so
    // `a:-webkit-any-link { color: -webkit-link }` — a rule on the element — beat the
    // sentence's inherited `#ffffff` and the word painted `#0000ee`.
    const decls = baseDecls(css, runClass)
    expect(decls, 'the UA link colour is neutralised').toContain('color: inherit')

    // The decoration L1 DID ask for is still there, and the sentence still owns the
    // colour: "this run overrides nothing" now means what it says.
    expect(decls).toContain('text-decoration: underline')
    const nodeClass = /<p class="([^"]+)"/.exec(html)![1]
    expect(baseDecls(css, nodeClass)).toContain('color: #ffffff')
  })

  it('test_UAT_FC_REQ-333_a_link_run_that_names_its_own_colour_still_wins', () => {
    // THE RAIL. The reset is a floor, not an override: a run that carries a colour
    // is a run that asked for one, and neutralising the UA must not neutralise the
    // document. `color: inherit` would be a silent regression of every deliberately
    // recoloured link in the corpus.
    const { css, html } = renderL1Document(linkedSentence({ color: '#ff6b35' }))
    const runClass = /<a class="([^"]+)"/.exec(html)![1]
    const decls = baseDecls(css, runClass)
    expect(decls).toContain('color: #ff6b35')
    expect(decls).not.toContain('color: inherit')
  })

  it('test_UAT_FC_REQ-333_a_link_run_that_asks_for_no_decoration_gets_none', () => {
    // The same UA question in its other direction: an `<a>` is underlined by the UA
    // sheet too, so a link run that names no decoration must not acquire one. A
    // decoration is a thing the document asks for through `textDecoration` or not at
    // all — the identical contract the node-level link path has always kept.
    const doc = linkedSentence()
    const undecorated = doc.root as { children: L1Text[] }
    const runs = undecorated.children[0].text as Array<{ axes?: Record<string, unknown> }>
    delete runs[1].axes
    const { css, html } = renderL1Document(doc)
    const runClass = /<a class="([^"]+)"/.exec(html)![1]
    const decls = baseDecls(css, runClass)
    expect(decls).toContain('text-decoration: none')
    expect(decls).toContain('color: inherit')
  })
})
