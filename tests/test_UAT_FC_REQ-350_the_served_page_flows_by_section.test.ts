/**
 * REQ-350 geometry items 1–3 and "Changes to reproduction" — a reproduction is
 * served as sections that carry their contents, with content that follows other
 * content pushed down by it, wherever that reproduces the capture.
 *
 * The load-bearing evidence is a synthetic capture (three sections of copy, no
 * collision anywhere at rest), so it runs in every worktree and on every branch.
 * The real Gigabyte Alchemy bundle confirms it where it is present; the bundles
 * are gitignored, so that leg returns early elsewhere.
 *
 * The judge is the same one `1c repro` and `1c l1-gate` use: `chooseRecovery`
 * over the capture's own measured text heights. The browser round trip is the
 * operator's run; here the analytic evaluator — the renderer's mirror — stands
 * in, at the captured widths and at grown content.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import {
  chooseRecovery,
  contentRobustnessProbe,
  evaluateLayout,
  foldToL1,
  measuredTextHeights,
  mountBehaviours,
  sampleFidelityProbe,
  type FoldedForm,
} from '../tools/generate/src'
import type { MultiStateCapture, SectionValues, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const VIEWPORT_H = 900
const HERO = '#0f172b'
const BAND = '#e8dfd3'
const FOOT = '#d9ccba'

const run = (text: string, box: ValueElement['box'], fill: string): ValueElement => ({
  text,
  role: 'text',
  color: '#111111',
  fontFamily: 'Arial',
  fontSizePx: 18,
  fontWeight: 400,
  box,
  surfaceFill: fill,
})

const section = (index: number, box: NonNullable<SectionValues['box']>): SectionValues => ({
  index,
  overlay: null,
  contentAnchorRatio: null,
  box,
})

/** Three sections, each a heading and its copy, 16px apart: nothing collides at rest. */
function threeSections(): MultiStateCapture {
  const project = (width: number): StateProjection => {
    const x = 24
    const w = width - 48
    const line = (text: string, y: number, fill: string) => run(text, { x, y, width: w, height: 24 }, fill)
    return {
      engine: 'chromium',
      viewport: { width, height: VIEWPORT_H },
      state: 'rest',
      manifest: {
        source: `t:${width}`,
        viewport: { width, height: VIEWPORT_H },
        elements: [
          line('The studio', 80, HERO),
          line('What we make and why', 120, HERO),
          line('Our approach', 380, BAND),
          line('We build quiet tools', 420, BAND),
          line('That leave you room', 460, BAND),
          line('Get in touch', 680, FOOT),
          line('hello@example.test', 720, FOOT),
        ],
        sections: [
          section(0, { x: 0, y: 0, width, height: 300 }),
          section(1, { x: 0, y: 300, width, height: 300 }),
          section(2, { x: 0, y: 600, width, height: 200 }),
        ],
      },
    }
  }
  return { url: 'http://fixture.test/', notes: [], projections: LADDER.map(project) }
}

const kidsOf = (n: L1Node): readonly L1Node[] =>
  n.kind === 'container' ? n.children : n.kind === 'box' ? (n.children ?? []) : []

const isSection = (n?: L1Node): boolean => /^(section-band-|section-bg-|card-)/.test(n?.id ?? '')

/** Every node with its path and the nearest section (band, background or card) above it. */
function walk(doc: L1Document): Array<{ node: L1Node; path: string; section?: L1Node }> {
  const out: Array<{ node: L1Node; path: string; section?: L1Node }> = []
  const go = (n: L1Node, p: string, section?: L1Node): void => {
    out.push({ node: n, path: p, section })
    kidsOf(n).forEach((k, i) => go(k, `${p}.${i}`, isSection(n) ? n : section))
  }
  go(doc.root, '0')
  return out
}

function serve(ms: MultiStateCapture) {
  const forms: FoldedForm[] = []
  const base = foldToL1(ms, { forms })
  const measured = measuredTextHeights(ms)
  return { base, measured, choice: chooseRecovery(base, ms, { scale: 2.5, measured, compose: (d) => mountBehaviours(d, forms) }) }
}

describe('REQ-350 — the served reproduction flows by section', () => {
  it('test_UAT_FC_REQ-350_sections_carry_their_contents_and_both_flow', () => {
    const ms = threeSections()
    const { choice } = serve(ms)
    expect(choice.served, 'the flowed page is the one served').toBe(true)
    const nodes = walk(choice.doc)

    // Every run is held by the section that backs it…
    const runs = nodes.filter((e) => e.node.kind === 'text')
    expect(runs).toHaveLength(7)
    const fillOf = (r: (typeof runs)[number]) => (r.section as { axes?: { surfaceFill?: string } }).axes?.surfaceFill
    expect(runs.map(fillOf)).toEqual([HERO, HERO, BAND, BAND, BAND, FOOT, FOOT])
    // …each section is placed in flow within the page, and each run in flow within its section.
    const sections = nodes.filter((e) => isSection(e.node))
    expect(sections.length).toBe(3)
    for (const s of sections) expect(s.node.kind === 'container' && s.node.geometry?.place).toBe('flow')
    for (const r of runs) expect((r.node as { geometry?: { place?: string } }).geometry?.place).toBe('flow')
  })

  it('test_UAT_FC_REQ-350_growing_an_early_element_pushes_later_content_down_with_no_overlap', () => {
    const ms = threeSections()
    const { base, measured, choice } = serve(ms)

    let pushed = 0
    for (const width of LADDER) {
      const rest = evaluateLayout(choice.doc, width, { measured })
      const grown = evaluateLayout(choice.doc, width, { measured, contentScale: 2.5 })
      const box = (r: typeof rest, text: string) => r.leaves.find((l) => l.text === text)!.box
      // However much the hero's copy grew at this width, the next section's heading
      // and everything after it moved down by that much — no more, no less…
      const grew = ['The studio', 'What we make and why']
        .map((t) => box(grown, t).height - box(rest, t).height)
        .reduce((a, b) => a + b, 0)
      expect(box(grown, 'Our approach').y - box(rest, 'Our approach').y, `${width}`).toBeCloseTo(grew, 3)
      expect(box(grown, 'hello@example.test').y, `${width}`).toBeGreaterThanOrEqual(box(rest, 'hello@example.test').y + grew)
      if (grew > 0) pushed++
      // …and nothing lands on anything.
      expect(grown.findings.filter((f) => f.kind === 'overlap'), `${width}`).toEqual([])
    }
    // The perturbation really did make the hero taller somewhere on the ladder.
    expect(pushed).toBeGreaterThan(0)
    // The flat base is what this replaces: grown content overruns what follows it.
    expect(
      contentRobustnessProbe(base, { scale: 2.5, measured }).byWidth.some((w) =>
        w.findings.some((f) => f.kind === 'overlap'),
      ),
    ).toBe(true)
  })

  it('test_UAT_FC_REQ-350_the_flowed_page_reproduces_the_capture_at_every_captured_width', () => {
    const ms = threeSections()
    const { measured, choice } = serve(ms)
    const report = sampleFidelityProbe(choice.doc, ms, { tolerancePx: 0.5, measured })
    expect(report.residuals).toEqual([])
    expect(report.unmatched).toEqual([])
    expect(report.pass).toBe(true)
  })

  it('test_UAT_FC_REQ-350_the_real_gigabyte_alchemy_capture_is_served_nested_and_flowed', () => {
    const dir = path.join(process.cwd(), 'storage', 'references', 'gigabytealchemy.ai', 'index')
    if (!existsSync(path.join(dir, 'multistate.json'))) return
    const ms = JSON.parse(readFileSync(path.join(dir, 'multistate.json'), 'utf8')) as MultiStateCapture
    const { base, measured, choice } = serve(ms)
    expect(choice.served).toBe(true)

    // Nesting is guarded: the page's sections hold its copy. The only runs held by
    // no section are the contact block's, which the capture paints straight on the
    // page background with no band of its own.
    const nodes = walk(choice.doc)
    const runs = nodes.filter((e) => e.node.kind === 'text')
    const loose = runs.filter((r) => !r.section).map((r) => (r.node as { text: string }).text)
    expect(loose).toEqual([
      'Get in touch',
      expect.stringMatching(/^Join our mailing list/),
      expect.stringMatching(/^Protected by Cloudflare Turnstile/),
    ])
    expect(nodes.filter((e) => isSection(e.node)).length).toBeGreaterThanOrEqual(11)
    // Every run is placed in flow.
    expect(runs.every((r) => (r.node as { geometry?: { place?: string } }).geometry?.place === 'flow')).toBe(true)

    // The capture is reproduced exactly where it was before…
    expect(choice.recovery.residuals).toBe(0)
    expect(choice.recovery.unmatched).toBe(0)
    expect(choice.recovery.maxDelta).toBeLessThanOrEqual(choice.base.maxDelta + 0.1)
    // …and grown content overruns far less: the remaining overlaps are one card
    // whose capture order is not its visual order (REQ-278's negative offsets).
    const overlaps = (doc: L1Document) =>
      contentRobustnessProbe(doc, { scale: 2.5, measured }).byWidth.flatMap((w) =>
        w.findings.filter((f) => f.kind === 'overlap'),
      ).length
    expect(overlaps(choice.doc)).toBeLessThan(overlaps(base) / 4)
  })
})
