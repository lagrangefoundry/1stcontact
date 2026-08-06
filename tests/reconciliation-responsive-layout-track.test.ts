/**
 * Reconciliation UATs — story-3569e1a4 "Responsive layout: a container's layout
 * mode varies per breakpoint and a row can wrap" (REQ-104).
 *
 * One UAT per acceptance criterion, driven through the shipping entry points —
 * `validateL1` (the envelope), `renderL1Document` (the sole CSS/HTML emitter),
 * `resolveLayoutMode` (the one cascade), `evaluateLayout` (the analytic gate),
 * and `1c new` + `1c render` over a real workspace:
 *
 *   AC-833  a row lays out as a stack below an authored breakpoint, as ONE subtree
 *   AC-834  a control row reflows to a column with one input per field, and the
 *           stagger counts no phantom peers
 *   AC-835  a row can wrap, each breakpoint restates its mode whole, and one
 *           cascade serves both renderer and layout gate
 *   AC-836  breakpoint blocks serialize ascending; a hidden node is never re-shown
 *   AC-837  a page declaring no track and no wrap renders exactly as before
 *   AC-838  the envelope rejects an incoherent layout track
 *
 * Site-definition *content* is deliberately not asserted here: collapsing a
 * particular site's duplicated row/stack pairs is evidence of the capability,
 * not a criterion of it, so every document below is authored by the test.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  resolveLayoutMode,
  validateL1,
  type L1Container,
  type L1Document,
  type L1Node,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/l1/render'
import { cmdNew, cmdRender } from '../tools/generate/src/cli'
import { evaluateLayout } from '../tools/generate/src/l1'

const tmpDirs: string[] = []
function freshCwd(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'recon-req104-'))
  tmpDirs.push(cwd)
  return cwd
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

const WIDTHS = [320, 768, 1280]

function doc(root: L1Node, widths: number[] = WIDTHS): L1Document {
  return { widths, root }
}

/** The declarations of the rule for `selector` that sits outside any media block. */
function baseDecls(css: string, selector: string): string[] {
  const bare = css.replace(/@media[^{]+\{[\s\S]*?\n\}/g, '')
  const m = new RegExp(`\\${selector} \\{ ([^}]*) \\}`).exec(bare)
  return m ? m[1].split('; ') : []
}

/**
 * Every declaration for `selector` inside the `(min-width: Npx)` block, in source
 * order across ALL of that selector's rules in the block — a node can contribute
 * more than one (its layout track and its visibility both write `display`), and
 * which of them comes last is exactly what AC-836 is about.
 */
function mediaDecls(css: string, minWidth: number, selector: string): string[] {
  const block = new RegExp(`@media \\(min-width: ${minWidth}px\\) \\{\\n([\\s\\S]*?)\\n\\}`).exec(css)
  if (!block) return []
  return [...block[1].matchAll(new RegExp(`\\${selector} \\{ ([^}]*) \\}`, 'g'))].flatMap((m) =>
    m[1].split('; '),
  )
}

/** Every `(min-width: N)` breakpoint in the stylesheet, in source order. */
function breakpointOrder(css: string): number[] {
  return [...css.matchAll(/@media \(min-width: (\d+)px\)/g)].map((m) => Number(m[1]))
}

describe('story-3569e1a4 — per-width layout mode + wrapping rows', () => {
  // ── AC-833 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC833_row_lays_out_as_a_stack_below_an_authored_breakpoint_as_one_subtree', () => {
    // The first keyframe is the base — in force BELOW its own `at` — and each
    // later keyframe takes over from its `at` upward, `min-width` semantics.
    const row: L1Container = {
      kind: 'container',
      layout: 'row',
      responsiveLayout: {
        keyframes: [
          { at: 0, value: 'stack' },
          { at: 768, value: 'row' },
        ],
      },
      gapPx: 16,
      children: [
        { kind: 'text', text: 'Capability' },
        { kind: 'text', text: 'User story' },
      ],
    }
    const d = doc({ kind: 'container', layout: 'stack', children: [row] })
    expect(validateL1(d).ok).toBe(true)

    const { html, css } = renderL1Document(d)

    // Base rule flows it as a column; the 768px block flows it as a row.
    expect(baseDecls(css, '.l1-1')).toContain('flex-direction: column')
    expect(mediaDecls(css, 768, '.l1-1')).toContain('flex-direction: row')

    // The static `layout` remains the representative WIDEST value, so a consumer
    // that does not resolve per width still reads the mode the widest render uses.
    expect(row.layout).toBe('row')
    expect(resolveLayoutMode(row, Math.max(...WIDTHS))).toBe('row')

    // ONE subtree: each child's content appears exactly once in the markup at
    // every width. The duplicate-subtree workaround this replaces put both copies
    // in the DOM.
    expect(html.match(/Capability/g)).toHaveLength(1)
    expect(html.match(/User story/g)).toHaveLength(1)

    // `at` is an authored breakpoint, not a captured sample: a breakpoint at a
    // width the document never declared is accepted, and emitted.
    expect(WIDTHS).not.toContain(900)
    const offLadder = doc({
      kind: 'container',
      layout: 'row',
      responsiveLayout: {
        keyframes: [
          { at: 0, value: 'stack' },
          { at: 900, value: 'row' },
        ],
      },
      children: [{ kind: 'text', text: 'Off-ladder' }],
    })
    expect(validateL1(offLadder).ok).toBe(true)
    expect(mediaDecls(renderL1Document(offLadder).css, 900, '.l1-0')).toContain(
      'flex-direction: row',
    )

    // The page's own layout report agrees at both widths: children share an x and
    // differ in y below the breakpoint, differ in x and share a y above it.
    const narrow = evaluateLayout(d, 375).leaves.filter((l) => l.kind === 'text')
    expect(narrow[0].box.x).toBe(narrow[1].box.x)
    expect(narrow[1].box.y).toBeGreaterThan(narrow[0].box.y)

    const wide = evaluateLayout(d, 1280).leaves.filter((l) => l.kind === 'text')
    expect(wide[1].box.x).toBeGreaterThan(wide[0].box.x)
    expect(wide[1].box.y).toBe(wide[0].box.y)
  })

  // ── AC-834 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC834_control_row_reflows_with_one_input_per_field_and_no_phantom_stagger_peers', async () => {
    // The case that had NO representation at any cost: a row of form controls
    // that must become a column at mobile. Driven through the ordinary render of
    // a real workspace, so the module's attribute bundle, the label wiring and
    // the L1 emission are the shipping ones.
    const cwd = freshCwd()
    const { draftDir } = cmdNew('recon-req104-form', { cwd })
    const homePath = path.join(draftDir, 'pages', 'home.json')
    const page = JSON.parse(readFileSync(homePath, 'utf8')) as Record<string, unknown>

    const control = (name: string): L1Node => ({
      kind: 'control',
      control: name,
      sizing: { width: { mode: 'fluid' }, height: { mode: 'fixed', px: 48 } },
    })
    const formSubtree: L1Node = {
      kind: 'container',
      layout: 'stack',
      gapPx: 12,
      children: [
        {
          // The first-name / last-name pair: ONE container declaring
          // `stack@0 → row@640`, not two visibility-paired copies.
          kind: 'container',
          layout: 'row',
          responsiveLayout: {
            keyframes: [
              { at: 0, value: 'stack' },
              { at: 640, value: 'row' },
            ],
          },
          gapPx: 12,
          children: [control('first_name'), control('last_name')],
        },
        control('email'),
        control('submit'),
      ],
    }

    writeFileSync(
      homePath,
      JSON.stringify(
        {
          ...page,
          modules: [
            {
              id: 'signup',
              type: 'contact-form',
              version: 4,
              slot: 'signup-form',
              config: {
                action: '/api/lead',
                submitLabel: 'Request access',
                fields: [
                  { name: 'first_name', label: 'First name', type: 'text', required: true },
                  { name: 'last_name', label: 'Last name', type: 'text', required: true },
                  { name: 'email', label: 'Email address', type: 'email', required: true },
                ],
              },
              slots: { form: formSubtree },
            },
          ],
          l1: {
            widths: WIDTHS,
            root: {
              kind: 'container',
              layout: 'stack',
              children: [{ kind: 'slot', name: 'signup-form' }],
            },
          },
        },
        null,
        2,
      ),
    )

    const { outDir } = await cmdRender('recon-req104-form', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // Each field appears exactly once in the markup — one `name` per field. The
    // duplicate-subtree workaround could never hold this: `visibility` is CSS,
    // not `disabled`, so the hidden copy would still submit.
    for (const name of ['first_name', 'last_name', 'email']) {
      expect(html.match(new RegExp(`name="${name}"`, 'g')), name).toHaveLength(1)
    }

    // One `id` per control, and every `<label for="…">` resolves to an input that
    // exists — the association a duplicated id would break.
    const ids = [...html.matchAll(/<(?:input|textarea|button)[^>]*\sid="([^"]+)"/g)].map((m) => m[1])
    expect(new Set(ids).size).toBe(ids.length)
    const fors = [...html.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1])
    expect(fors.length).toBeGreaterThanOrEqual(3)
    for (const f of fors) expect(ids, `label for=${f} resolves`).toContain(f)

    // …and the pair genuinely stacks below 640px and rows above it.
    expect(html).toMatch(/@media \(min-width: 640px\) \{[\s\S]*?flex-direction: row/)

    // A container's reveal stagger indexes only children that exist ONCE: three
    // revealing children in a reflowing row take three consecutive slots (0, 1×,
    // 2× the interval), not six. The duplicated subtree fed the count peers the
    // reader never sees, desynchronising every reveal after the first duplicate.
    const staggered = doc({
      kind: 'container',
      layout: 'row',
      responsiveLayout: {
        keyframes: [
          { at: 0, value: 'stack' },
          { at: 768, value: 'row' },
        ],
      },
      staggerMs: 80,
      children: ['One', 'Two', 'Three'].map((text) => ({
        kind: 'text',
        text,
        reveal: { yPx: 16, durationMs: 500 },
      })) as L1Node[],
    })
    expect(validateL1(staggered).ok).toBe(true)
    const staggerCss = renderL1Document(staggered).css
    const delayOf = (n: number) =>
      baseDecls(staggerCss, `.l1-${n}`).find((x) => x.startsWith('transition-delay'))
    expect(delayOf(1)).toBeUndefined() // slot 0 → 0ms → initial value, omitted
    expect(delayOf(2)).toBe('transition-delay: 80ms')
    expect(delayOf(3)).toBe('transition-delay: 160ms')
    expect(delayOf(4)).toBeUndefined() // only three children exist — no phantom 4th
  })

  // ── AC-835 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC835_row_wraps_restates_its_mode_whole_and_shares_one_cascade', () => {
    // Wrapping: three 300px cards fit in a 1000px row and not in a 700px one.
    // With `wrap` the third takes a second line and the layout report is clean;
    // without it the row clips — no breakpoint authored anywhere.
    const cards = (wrap: boolean): L1Document =>
      doc(
        {
          kind: 'container',
          layout: 'row',
          wrap,
          gapPx: 20,
          children: [1, 2, 3].map((i) => ({
            kind: 'text',
            text: `Card ${i}`,
            sizing: { width: { mode: 'fixed', px: 300 } },
          })) as L1Node[],
        },
        [320, 700, 1000],
      )

    const wrapped = cards(true)
    const plain = cards(false)
    expect(validateL1(wrapped).ok).toBe(true)

    const lines = evaluateLayout(wrapped, 700).leaves
    expect(lines[2].box.x).toBe(lines[0].box.x)
    expect(lines[2].box.y).toBeGreaterThan(lines[0].box.y)
    expect(evaluateLayout(wrapped, 700).findings).toEqual([])
    expect(evaluateLayout(plain, 700).findings.some((f) => f.kind === 'clip')).toBe(true)

    // At a width where they all fit, a wrapping row is one line — unchanged.
    const wide = evaluateLayout(wrapped, 1000).leaves
    expect(wide.map((l) => l.box.y)).toEqual([wide[0].box.y, wide[0].box.y, wide[0].box.y])

    // Restated WHOLE, never as a delta. A wrapping row that becomes a stack
    // resets its wrapping: a column that inherited `wrap` breaks the moment
    // anything constrains its height.
    const wrappingTrack = doc({
      kind: 'container',
      layout: 'row',
      wrap: true,
      responsiveLayout: {
        keyframes: [
          { at: 0, value: 'stack' },
          { at: 768, value: 'row' },
        ],
      },
      children: [{ kind: 'text', text: 'x' }],
    })
    const wrapCss = renderL1Document(wrappingTrack).css
    expect(baseDecls(wrapCss, '.l1-0')).toContain('flex-wrap: nowrap')
    expect(mediaDecls(wrapCss, 768, '.l1-0')).toContain('flex-wrap: wrap')

    // A grid that becomes a row resets its display rather than layering one mode
    // over the other.
    const gridToRow = doc({
      kind: 'container',
      layout: 'row',
      columns: 2,
      responsiveLayout: {
        keyframes: [
          { at: 0, value: 'grid' },
          { at: 768, value: 'row' },
        ],
      },
      children: [{ kind: 'text', text: 'x' }],
    })
    const gridCss = renderL1Document(gridToRow).css
    expect(baseDecls(gridCss, '.l1-0').slice(0, 2)).toEqual([
      'display: grid',
      'grid-template-columns: repeat(2, 1fr)',
    ])
    expect(mediaDecls(gridCss, 768, '.l1-0')).toEqual(['display: flex', 'flex-direction: row'])

    // Wrapping is inert wherever the resolved mode is not a row.
    const wrappingStack = doc({
      kind: 'container',
      layout: 'stack',
      wrap: true,
      children: [{ kind: 'text', text: 'x' }],
    })
    expect(baseDecls(renderL1Document(wrappingStack).css, '.l1-0')).toContain('flex-wrap: nowrap')

    // ONE cascade, TWO consumers. The rule that resolves a mode at a width is
    // stated once and drives both the stylesheet and the analytic gate.
    const tracked: L1Container = {
      kind: 'container',
      layout: 'grid',
      responsiveLayout: {
        keyframes: [
          { at: 0, value: 'stack' },
          { at: 600, value: 'row' },
          { at: 1024, value: 'grid' },
        ],
      },
      gapPx: 0,
      children: [
        { kind: 'text', text: 'A', sizing: { width: { mode: 'fixed', px: 100 } } },
        { kind: 'text', text: 'B', sizing: { width: { mode: 'fixed', px: 100 } } },
      ],
    }
    const probeDoc = doc(tracked, [320, 600, 1024])
    expect(validateL1(probeDoc).ok).toBe(true)

    const probes = [320, 599, 600, 1023, 1024]
    expect(probes.map((w) => resolveLayoutMode(tracked, w))).toEqual([
      'stack',
      'stack',
      'row',
      'row',
      'grid',
    ])

    // The analytic report at those same widths reflects the same modes: peers sit
    // side by side exactly where the shared cascade resolves `row`, and stack
    // otherwise. Reading the static widest value instead would model this
    // container as a grid at 320px and report a layout that is never published.
    for (const w of probes) {
      const [a, b] = evaluateLayout(probeDoc, w).leaves.filter((l) => l.kind === 'text')
      const sideBySide = b.box.x > a.box.x && b.box.y === a.box.y
      expect(sideBySide, `width ${w}`).toBe(resolveLayoutMode(tracked, w) === 'row')
    }
  })

  // ── AC-836 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC836_breakpoint_blocks_ascend_and_a_hidden_node_is_never_re_shown', () => {
    // The first container introduces 768; the second declares BOTH 520 and 768.
    // Ordered by first appearance, 520 would land AFTER 768 — and then, for the
    // second container, the 520 rule would win at desktop widths.
    const d = doc(
      {
        kind: 'container',
        layout: 'stack',
        children: [
          {
            kind: 'container',
            layout: 'row',
            responsiveLayout: {
              keyframes: [
                { at: 0, value: 'stack' },
                { at: 768, value: 'row' },
              ],
            },
            children: [{ kind: 'text', text: 'a' }],
          },
          {
            kind: 'container',
            layout: 'grid',
            responsiveLayout: {
              keyframes: [
                { at: 0, value: 'stack' },
                { at: 520, value: 'row' },
                { at: 768, value: 'grid' },
              ],
            },
            columns: 2,
            children: [{ kind: 'text', text: 'b' }],
          },
        ],
      },
      [320, 520, 768],
    )
    const { css } = renderL1Document(d)

    const order = breakpointOrder(css)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(order).toContain(520)
    expect(order).toContain(768)
    expect(order.indexOf(520)).toBeLessThan(order.indexOf(768))
    // The second container's WIDEST rule is the one in force at desktop width.
    expect(mediaDecls(css, 768, '.l1-3')).toContain('display: grid')

    // A condition carrying no minimum width sorts last: it is either disjoint from
    // the width blocks (a max-width) or must survive them (reduced motion).
    const mixed = doc({
      kind: 'container',
      layout: 'row',
      responsiveLayout: {
        keyframes: [
          { at: 0, value: 'stack' },
          { at: 768, value: 'row' },
        ],
      },
      visibility: { fromPx: 640 },
      children: [{ kind: 'text', text: 'x', reveal: { yPx: 8, durationMs: 300 } }],
    })
    const mixedCss = renderL1Document(mixed).css
    const blocks = [...mixedCss.matchAll(/@media ([^{]+)\{/g)].map((m) => m[1].trim())
    const widthBlocks = blocks.filter((b) => /min-width/.test(b))
    const otherBlocks = blocks.filter((b) => !/min-width/.test(b))
    expect(otherBlocks.length).toBeGreaterThan(0)
    for (const other of otherBlocks) {
      for (const wb of widthBlocks) {
        expect(blocks.indexOf(wb), `${wb} before ${other}`).toBeLessThan(blocks.indexOf(other))
      }
    }

    // Visibility is the final word on display: a node hidden at a width stays
    // hidden even when its layout track re-states a display mode at that width.
    const hidden = doc({
      kind: 'container',
      layout: 'row',
      responsiveLayout: {
        keyframes: [
          { at: 0, value: 'stack' },
          { at: 768, value: 'row' },
        ],
      },
      visibility: { untilPx: 768 },
      children: [{ kind: 'text', text: 'mobile only' }],
    })
    const hiddenDecls = mediaDecls(renderL1Document(hidden).css, 768, '.l1-0')
    expect(hiddenDecls).toContain('display: flex')
    expect(hiddenDecls.at(-1)).toBe('display: none')
  })

  // ── AC-837 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC837_page_without_a_track_or_wrap_publishes_the_stylesheet_it_did_before', () => {
    const d = doc({
      kind: 'container',
      layout: 'row',
      gapPx: 8,
      children: [{ kind: 'text', text: 'Only' }],
    })
    const { css } = renderL1Document(d)

    // The same two flow declarations, in the same order — and no wrapping
    // declaration at all, in either direction. A container that never asked to
    // wrap must not start carrying a wrapping rule.
    const decls = baseDecls(css, '.l1-0')
    expect(decls.slice(0, 2)).toEqual(['display: flex', 'flex-direction: row'])
    expect(decls.some((x) => x.startsWith('flex-wrap'))).toBe(false)
    expect(css).not.toContain('flex-wrap')

    // No track → no breakpoint block attributable to it; the static layout stands
    // at every width.
    expect(breakpointOrder(css)).toEqual([])
    expect(css).not.toContain('@media')

    // A grid container's column emission is untouched.
    const grid = renderL1Document(doc({ kind: 'container', layout: 'grid', columns: 3, children: [] }))
    expect(baseDecls(grid.css, '.l1-0')).toEqual([
      'display: grid',
      'grid-template-columns: repeat(3, 1fr)',
      'position: relative',
    ])
  })

  // ── AC-838 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC838_envelope_rejects_an_incoherent_layout_track', () => {
    // Breakpoints that do not strictly ascend: a later keyframe at or below an
    // earlier one can never apply, so the track is incoherent rather than unusual.
    const descending = doc({
      kind: 'container',
      layout: 'stack',
      responsiveLayout: {
        keyframes: [
          { at: 768, value: 'row' },
          { at: 320, value: 'stack' },
        ],
      },
      children: [],
    })
    const a = validateL1(descending)
    expect(a.ok).toBe(false)
    expect(!a.ok && a.errors.some((e) => /responsiveLayout/.test(e.path))).toBe(true)
    expect(!a.ok && a.errors.some((e) => /ascending/.test(e.message))).toBe(true)

    // The static `layout` must name the WIDEST keyframe's mode. Letting the two
    // drift leaves every non-responsive consumer reading a mode the page renders
    // at no width at all.
    const disagreeing = doc({
      kind: 'container',
      layout: 'stack',
      responsiveLayout: {
        keyframes: [
          { at: 0, value: 'stack' },
          { at: 768, value: 'row' },
        ],
      },
      children: [],
    })
    const b = validateL1(disagreeing)
    expect(b.ok).toBe(false)
    expect(!b.ok && b.errors.some((e) => /layout/.test(e.path))).toBe(true)
    expect(!b.ok && b.errors.some((e) => /widest responsiveLayout keyframe/.test(e.message))).toBe(
      true,
    )

    // The shape stays closed: an unknown/extra key is rejected, so the axis offers
    // no freeform escape hatch back to raw CSS.
    const freeform = doc({
      kind: 'container',
      layout: 'row',
      responsiveLayout: { keyframes: [{ at: 0, value: 'row' }], css: 'display:block' },
      children: [],
    } as unknown as L1Node)
    const c = validateL1(freeform)
    expect(c.ok).toBe(false)

    // Breakpoints themselves are NOT checked against the document's declared
    // widths — an authored breakpoint is a design decision, not a captured sample.
    const offLadder = doc({
      kind: 'container',
      layout: 'row',
      responsiveLayout: {
        keyframes: [
          { at: 0, value: 'stack' },
          { at: 933, value: 'row' },
        ],
      },
      children: [],
    })
    expect(WIDTHS).not.toContain(933)
    expect(validateL1(offLadder).ok).toBe(true)
  })
})
