/**
 * REQ-104 — a row that can wrap, and a layout mode that can vary with width.
 *
 * Before this ticket `container.layout` was one enum value for every width, so a
 * horizontal run of peers had no way to become a vertical one on a narrow screen
 * — the single most common responsive behaviour on the web. The only expressible
 * answer was to author the subtree **twice** under paired `visibility.fromPx` /
 * `untilPx`: double the nodes against the 2000 cap, two copies to keep in step,
 * and both in the DOM, so `staggerMs` counted peers the reader never sees.
 *
 * For a REQ-96 `control` leaf that workaround does not merely cost — it does not
 * exist. Duplicating a control duplicates a *form field*: two `<input>`s sharing
 * one `name` and one `id`. `visibility` is CSS, not `disabled`, so the hidden
 * copy still submits, and the duplicate id breaks the `for`↔`id` association the
 * module exists to guarantee. A row of controls that must stack at mobile had no
 * representation in L1 at any cost.
 *
 * The ACs, driven through real entry points (`renderL1Document`, `1c render` over
 * a real workspace, `validateSite`, and the analytic evaluator that gates REQ-95):
 *
 *   AC1 — a row lays out as a stack below a stated width, as ONE subtree.
 *   AC2 — a row of controls reflows to a column with exactly one `<input>` per
 *         field, one `id` per control, and an intact `for`↔`id` at every width.
 *   AC3 — `staggerMs` indexes only the children that exist once.
 *   AC4 — xgd.dev's duplicated row/stack pairs collapse, the page stays clean at
 *         375/768/1280 and under content perturbation, and the node count drops.
 *   AC5 — a document declaring no responsive layout renders unchanged.
 *
 * Plus the two things the axis forced: `wrap` (the cheap complement — cards that
 * reflow with no breakpoint authored) and ascending-breakpoint stylesheet order,
 * without which two interleaved authored breakpoints cascade backwards.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import type { L1Container, L1Document, L1Node } from '@1stcontact/site-schema'
import { resolveLayoutMode, validateL1 } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/l1/render'
import { cmdNew, cmdRender } from '../tools/generate/src/cli'
import { evaluateLayout } from '../tools/generate/src/l1'

const tmpDirs: string[] = []
function freshCwd(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req104-'))
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

/** The declarations of the first rule for `selector`, outside any media block. */
function baseDecls(css: string, selector: string): string[] {
  const bare = css.replace(/@media[^{]+\{[\s\S]*?\n\}/g, '')
  const m = new RegExp(`\\${selector} \\{ ([^}]*) \\}`).exec(bare)
  return m ? m[1].split('; ') : []
}

/**
 * Every declaration for `selector` inside the `(min-width: Npx)` block, in
 * source order across ALL of that selector's rules in the block — a node can
 * contribute more than one (its layout track and its visibility both write
 * `display`), and which comes last is the whole point.
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

describe('REQ-104 — responsive layout track + wrapping rows', () => {
  // ── AC1: one subtree, two layouts ─────────────────────────────────────────

  it('test_UAT_FC_REQ-104_row_lays_out_as_a_stack_below_the_breakpoint_as_one_subtree', () => {
    const row: L1Container = {
      kind: 'container',
      layout: 'row',
      responsiveLayout: { keyframes: [{ at: 0, value: 'stack' }, { at: 768, value: 'row' }] },
      gapPx: 16,
      children: [
        { kind: 'text', text: 'Capability' },
        { kind: 'text', text: 'User story' },
      ],
    }
    const d = doc({ kind: 'container', layout: 'stack', children: [row] })
    expect(validateL1(d).ok).toBe(true)

    const { html, css } = renderL1Document(d)

    // The base rule is the stack; the breakpoint promotes it to a row. One node,
    // two modes — not two nodes hidden from each other.
    expect(baseDecls(css, '.l1-1')).toContain('flex-direction: column')
    expect(mediaDecls(css, 768, '.l1-1')).toContain('flex-direction: row')

    // ONE subtree: each child's text appears exactly once in the DOM. The
    // visibility-paired duplicate this replaces would put both copies here.
    expect(html.match(/Capability/g)).toHaveLength(1)
    expect(html.match(/User story/g)).toHaveLength(1)

    // And the analytic model agrees with the emitted CSS at both widths: stacked
    // below the breakpoint (children share an x, differ in y), side by side above.
    const narrow = evaluateLayout(d, 375).leaves.filter((l) => l.kind === 'text')
    expect(narrow[0].box.x).toBe(narrow[1].box.x)
    expect(narrow[1].box.y).toBeGreaterThan(narrow[0].box.y)

    const wide = evaluateLayout(d, 1280).leaves.filter((l) => l.kind === 'text')
    expect(wide[1].box.x).toBeGreaterThan(wide[0].box.x)
    expect(wide[1].box.y).toBe(wide[0].box.y)
  })

  it('test_UAT_FC_REQ-104_layout_mode_resolves_through_one_shared_cascade', () => {
    // The renderer and the analytic evaluator must not each carry their own copy
    // of the cascade — that drift is what makes the gate report phantom findings.
    // This is the single resolver both call.
    const node: L1Container = {
      kind: 'container',
      layout: 'grid',
      responsiveLayout: {
        keyframes: [{ at: 0, value: 'stack' }, { at: 600, value: 'row' }, { at: 1024, value: 'grid' }],
      },
      children: [],
    }
    // The first keyframe is the base — in force BELOW its own `at`.
    expect(resolveLayoutMode(node, 320)).toBe('stack')
    expect(resolveLayoutMode(node, 599)).toBe('stack')
    // `min-width` semantics: a breakpoint takes effect AT its width, inclusive.
    expect(resolveLayoutMode(node, 600)).toBe('row')
    expect(resolveLayoutMode(node, 1023)).toBe('row')
    expect(resolveLayoutMode(node, 1024)).toBe('grid')
    // With no track, the static value stands at every width.
    expect(resolveLayoutMode({ kind: 'container', layout: 'row', children: [] }, 320)).toBe('row')
  })

  // ── AC2: a control row that reflows, with one field per field ──────────────

  it('test_UAT_FC_REQ-104_control_row_reflows_with_exactly_one_input_per_field', async () => {
    // The case with NO workaround: duplicating a control duplicates a form field.
    // Driven through `1c render` over a real workspace — the command an author
    // runs — so the module's attribute bundle, the `for`↔`id` wiring and the L1
    // emission are all the shipping ones.
    const cwd = freshCwd()
    const { draftDir } = cmdNew('req104-form', { cwd })
    const homePath = path.join(draftDir, 'pages', 'home.json')
    const page = JSON.parse(readFileSync(homePath, 'utf8')) as Record<string, unknown>

    const control = (name: string): L1Node => ({
      kind: 'control',
      control: name,
      sizing: { width: { mode: 'fluid' }, height: { mode: 'fixed', px: 48 } },
    })
    // A first/last-name pair: side by side on desktop, stacked at mobile. ONE
    // subtree, so one `<input>` per field at every width.
    const formSubtree: L1Node = {
      kind: 'container',
      layout: 'stack',
      gapPx: 12,
      children: [
        {
          kind: 'container',
          layout: 'row',
          responsiveLayout: { keyframes: [{ at: 0, value: 'stack' }, { at: 640, value: 'row' }] },
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

    const { outDir } = await cmdRender('req104-form', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // Exactly one input per field — the property the duplicate-subtree workaround
    // could never hold, at any width, because `visibility` hides but does not
    // disable and both copies would submit.
    for (const name of ['first_name', 'last_name', 'email']) {
      expect(html.match(new RegExp(`name="${name}"`, 'g')), name).toHaveLength(1)
    }

    // One id per control, and every label still resolves to the input it names.
    const ids = [...html.matchAll(/<(?:input|textarea|button)[^>]*\sid="([^"]+)"/g)].map((m) => m[1])
    expect(new Set(ids).size).toBe(ids.length)
    const fors = [...html.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1])
    expect(fors.length).toBeGreaterThanOrEqual(3)
    for (const f of fors) expect(ids, `label for=${f} resolves`).toContain(f)

    // …and the row genuinely reflows: the pair's container stacks below 640 and
    // rows above it, in the page's own stylesheet.
    expect(html).toMatch(/@media \(min-width: 640px\) \{[\s\S]*?flex-direction: row/)
  })

  // ── AC3: no phantom peers in the stagger ──────────────────────────────────

  it('test_UAT_FC_REQ-104_stagger_indexes_only_the_children_that_exist_once', () => {
    const d = doc({
      kind: 'container',
      layout: 'row',
      responsiveLayout: { keyframes: [{ at: 0, value: 'stack' }, { at: 768, value: 'row' }] },
      staggerMs: 80,
      children: [
        { kind: 'text', text: 'One', reveal: { yPx: 16, durationMs: 500 } },
        { kind: 'text', text: 'Two', reveal: { yPx: 16, durationMs: 500 } },
        { kind: 'text', text: 'Three', reveal: { yPx: 16, durationMs: 500 } },
      ],
    })
    expect(validateL1(d).ok).toBe(true)

    const { css } = renderL1Document(d)
    const delayOf = (n: number) =>
      baseDecls(css, `.l1-${n}`).find((x) => x.startsWith('transition-delay'))

    // Three children, three slots: 0 / 80 / 160ms. The duplicated-subtree
    // workaround would have put SIX nodes in this count, so the third visible
    // card waited 400ms for two peers the reader never saw.
    expect(delayOf(1)).toBeUndefined() // index 0 → 0ms → initial value, omitted
    expect(delayOf(2)).toBe('transition-delay: 80ms')
    expect(delayOf(3)).toBe('transition-delay: 160ms')
  })

  // ── AC4: xgd.dev's duplicated pairs are gone ──────────────────────────────

  it('test_UAT_FC_REQ-104_xgd_home_collapses_its_duplicated_row_stack_pairs', () => {
    const page = JSON.parse(
      readFileSync(path.join('storage', 'sites', 'xgd', 'draft', 'pages', 'home.json'), 'utf8'),
    ) as { l1: L1Document }
    const l1 = page.l1

    const nodes: L1Node[] = []
    const walk = (n: L1Node): void => {
      nodes.push(n)
      const kids = n.kind === 'container' ? n.children : n.kind === 'box' ? (n.children ?? []) : []
      kids.forEach(walk)
    }
    walk(l1.root)

    // The three pairs the ticket names, plus the hero CTA, now exist once each,
    // carrying a track instead of a twin.
    const byId = new Map(nodes.filter((n) => n.id).map((n) => [n.id!, n]))
    for (const id of ['cta', 'problem-items', 'how-steps', 'contract-panels']) {
      const node = byId.get(id)
      expect(node, id).toBeDefined()
      expect(node!.kind).toBe('container')
      expect((node as L1Container).responsiveLayout?.keyframes.map((k) => k.value)).toEqual([
        'stack',
        'row',
      ])
      // A collapsed node is NOT visibility-gated — that was the whole workaround.
      expect(node!.visibility, id).toBeUndefined()
    }
    // And no `-row` / `-stack` twin survives anywhere in the tree.
    for (const n of nodes) {
      expect(n.id ?? '').not.toMatch(/-(row|stack)$/)
    }

    // Materially fewer nodes: the four collapsed pairs took 50 of the page's 172.
    expect(nodes.length).toBeLessThan(140)

    // REQ-95 AC3 — clean at the three checked widths, now that the mode the
    // evaluator reads is the mode the page actually renders at each of them.
    expect(validateL1(l1).ok).toBe(true)
    for (const width of [375, 768, 1280]) {
      expect(evaluateLayout(l1, width).findings, `width ${width}`).toEqual([])
    }
    // REQ-95 AC4 — content robustness: still clean when every run grows.
    for (const width of [375, 768, 1280]) {
      expect(evaluateLayout(l1, width, { contentScale: 1.6 }).findings, `perturbed ${width}`).toEqual(
        [],
      )
    }
  })

  // ── AC5: nothing changes for a document that declares no track ────────────

  it('test_UAT_FC_REQ-104_container_without_a_track_emits_exactly_what_it_did_before', () => {
    const d = doc({
      kind: 'container',
      layout: 'row',
      gapPx: 8,
      children: [{ kind: 'text', text: 'Only' }],
    })
    const { css } = renderL1Document(d)

    // The same two declarations as before the axis existed, in the same order,
    // and — critically — no `flex-wrap`: a container that never declared `wrap`
    // must not start carrying one.
    const decls = baseDecls(css, '.l1-0')
    expect(decls.slice(0, 2)).toEqual(['display: flex', 'flex-direction: row'])
    expect(decls.some((x) => x.startsWith('flex-wrap'))).toBe(false)
    // No track → no media block of its own.
    expect(breakpointOrder(css)).toEqual([])

    // A grid keeps its columns emission untouched too.
    const grid = renderL1Document(
      doc({ kind: 'container', layout: 'grid', columns: 3, children: [] }),
    )
    expect(baseDecls(grid.css, '.l1-0')).toEqual([
      'display: grid',
      'grid-template-columns: repeat(3, 1fr)',
      'position: relative',
    ])
  })

  // ── The cheap complement: a wrapping row ──────────────────────────────────

  it('test_UAT_FC_REQ-104_wrapping_row_lines_its_children_instead_of_clipping', () => {
    // Three 300px cards in a 1000px row fit; in a 700px one they do not. Without
    // `wrap` the third overflows the viewport and the evaluator reports a clip —
    // with it, the row takes a second line and the envelope holds, with no
    // breakpoint authored anywhere.
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

    // `flex-wrap` is emitted only when declared, and only where the mode is a row.
    expect(baseDecls(renderL1Document(wrapped).css, '.l1-0')).toContain('flex-wrap: wrap')
    expect(baseDecls(renderL1Document(plain).css, '.l1-0')).toContain('flex-wrap: nowrap')

    // At 700px the third card starts a new line rather than running off the edge.
    const leaves = evaluateLayout(wrapped, 700).leaves
    expect(leaves[2].box.x).toBe(leaves[0].box.x)
    expect(leaves[2].box.y).toBeGreaterThan(leaves[0].box.y)
    expect(evaluateLayout(wrapped, 700).findings).toEqual([])
    expect(evaluateLayout(plain, 700).findings.some((f) => f.kind === 'clip')).toBe(true)

    // At 1000px all three fit on one line — a row that never wraps is unchanged.
    const wide = evaluateLayout(wrapped, 1000).leaves
    expect(wide.map((l) => l.box.y)).toEqual([wide[0].box.y, wide[0].box.y, wide[0].box.y])
  })

  it('test_UAT_FC_REQ-104_wrap_is_reset_when_the_resolved_mode_is_not_a_row', () => {
    // A wrapping row that becomes a stack must not carry `flex-wrap: wrap` into
    // its column mode — a wrapping column breaks the moment anything constrains
    // its height, and a media override that only restated `flex-direction` would
    // leave the base rule's wrap standing.
    const d = doc({
      kind: 'container',
      layout: 'row',
      wrap: true,
      responsiveLayout: { keyframes: [{ at: 0, value: 'stack' }, { at: 768, value: 'row' }] },
      children: [{ kind: 'text', text: 'x' }],
    })
    const { css } = renderL1Document(d)
    expect(baseDecls(css, '.l1-0')).toContain('flex-wrap: nowrap')
    expect(mediaDecls(css, 768, '.l1-0')).toContain('flex-wrap: wrap')
  })

  // ── The cascade the axis forced ───────────────────────────────────────────

  it('test_UAT_FC_REQ-104_breakpoint_blocks_are_ordered_by_ascending_width', () => {
    // Blocks used to be ordered by first appearance across the whole document. A
    // node emitting 768 before another node emitted 520 put 520 AFTER 768 — and
    // then, for any node declaring both, the 520 rule won at 1280px. Interleaved
    // authored breakpoints are exactly what a layout track invites.
    const d = doc(
      {
        kind: 'container',
        layout: 'stack',
        children: [
          // Introduces 768 first…
          {
            kind: 'container',
            layout: 'row',
            responsiveLayout: { keyframes: [{ at: 0, value: 'stack' }, { at: 768, value: 'row' }] },
            children: [{ kind: 'text', text: 'a' }],
          },
          // …then a node that needs BOTH 520 and 768.
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
    // The widest rule for the second node is the one that survives at 1280.
    expect(mediaDecls(css, 768, '.l1-3')).toContain('display: grid')
  })

  // ── The envelope ──────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-104_envelope_rejects_an_incoherent_layout_track', () => {
    // Descending breakpoints are a track whose later keyframe can never apply.
    const descending = doc({
      kind: 'container',
      layout: 'stack',
      responsiveLayout: { keyframes: [{ at: 768, value: 'row' }, { at: 320, value: 'stack' }] },
      children: [],
    })
    const a = validateL1(descending)
    expect(a.ok).toBe(false)
    expect(!a.ok && a.errors.some((e) => /ascending/.test(e.message))).toBe(true)

    // `layout` is the representative WIDEST value. Letting it disagree with the
    // track leaves every non-responsive consumer reading a mode the page never
    // renders at any width — worse than declaring none at all.
    const disagreeing = doc({
      kind: 'container',
      layout: 'stack',
      responsiveLayout: { keyframes: [{ at: 0, value: 'stack' }, { at: 768, value: 'row' }] },
      children: [],
    })
    const b = validateL1(disagreeing)
    expect(b.ok).toBe(false)
    expect(!b.ok && b.errors.some((e) => /widest responsiveLayout keyframe/.test(e.message))).toBe(
      true,
    )

    // And the shape stays closed: no freeform escape hatch on the new axis.
    const freeform = doc({
      kind: 'container',
      layout: 'row',
      responsiveLayout: { keyframes: [{ at: 0, value: 'stack' }], css: 'display:block' },
      children: [],
    } as unknown as L1Node)
    expect(validateL1(freeform).ok).toBe(false)
  })

  it('test_UAT_FC_REQ-104_a_hidden_node_stays_hidden_at_a_width_its_track_lays_out', () => {
    // Two features now write `display` for the same node. Hidden must win: a
    // container whose track re-declared `display: flex` after a `display: none`
    // would simply reappear at that width.
    const d = doc({
      kind: 'container',
      layout: 'row',
      responsiveLayout: { keyframes: [{ at: 0, value: 'stack' }, { at: 768, value: 'row' }] },
      visibility: { untilPx: 768 },
      children: [{ kind: 'text', text: 'desktop only' }],
    })
    const { css } = renderL1Document(d)
    expect(mediaDecls(css, 768, '.l1-0').at(-1)).toBe('display: none')
  })
})
