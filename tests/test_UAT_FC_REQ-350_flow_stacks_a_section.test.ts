/**
 * REQ-350 geometry items 2–4 and decision D1 — `flow_l1` switches a container's
 * contents to flow on an existing page, measured in a browser and checked
 * against a second render.
 *
 * THE BROWSER IS THE ONE THING STOOD IN FOR. `flow_l1` reads every run's box off
 * the rendered draft through a `PageMeasurer`; this suite supplies one that lays
 * the stored draft out with the layout evaluator — the renderer's analytic
 * mirror — and answers in the capture extractor's own shape. Everything else is
 * real: the assistant's Toolbox, the stored draft, the conversion, the second
 * reading and the restore. The real-browser leg is gated on Chromium, which the
 * operator's machine has and this sandbox does not.
 *
 * THE SUBJECT IS THE REAL FLAT PAGE: the Gigabyte Alchemy home page as the live
 * site still has it, 70 absolute siblings (see the group suite).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import type { PageMeasurer } from '../tools/generate/src/cli/ai/measure-core'
import { browserPageMeasurer } from '../tools/generate/src/cli/ai/measure-core'
import { createPlaywrightDriver, chromiumAvailable } from '../tools/generate/src/cli/capture/playwright-driver'
import { startBuilder } from '../tools/generate/src/cli'
import { evaluateLayout, type OracleSource } from '../tools/generate/src/l1'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'

const chromiumReady = await chromiumAvailable()

const CORPUS = path.join(__dirname, 'fixtures', 'l1-corpus', 'storage', 'sites', 'gigabytealchemy', 'draft')
const APPROACH = ['0.1', '0.19', '0.20', '0.21', '0.22']
const COPY = ['A Different Approach', 'Most apps are designed', 'Through privacy-first AI', 'We work at the intersection']

let cwd: string
let seq = 0

function seed(): string {
  const slug = `ga-flow-${++seq}`
  fs.cpSync(CORPUS, path.join(cwd, 'storage', 'sandbox', slug, 'draft'), { recursive: true })
  return slug
}
const pageFile = (slug: string) => path.join(cwd, 'storage', 'sandbox', slug, 'draft', 'pages', 'home.json')
const readDoc = (slug: string): L1Document => JSON.parse(fs.readFileSync(pageFile(slug), 'utf8')).l1

/**
 * A stand-in browser: the stored draft as it is NOW, laid out by the evaluator,
 * reported the way the extractor reports a page — one text element per run.
 */
function evaluatorMeasurer(slug: string, nudge?: { afterCalls: number; dy: number }): PageMeasurer {
  let calls = 0
  return async (_page, widths) => {
    calls++
    const doc = readDoc(slug)
    const projections: OracleSource['projections'] = widths.map((width) => ({
      viewport: { width },
      state: 'rest',
      manifest: {
        elements: evaluateLayout(doc, width)
          .leaves.filter((l) => l.kind === 'text' && l.text)
          .map((l, i) => ({
            text: l.text!,
            role: 'text',
            color: '#111111',
            fontFamily: 'Arial',
            fontSizePx: 16,
            fontWeight: 400,
            box: nudge && calls > nudge.afterCalls && i === 0 ? { ...l.box, y: l.box.y + nudge.dy } : l.box,
          })),
      },
    }))
    return { projections }
  }
}

type Box = { run: (tool: string, input: Record<string, unknown>) => Promise<unknown> }
const ask = async (box: Box, tool: string, input: Record<string, unknown>): Promise<string> => {
  const out = await box.run(tool, input)
  return typeof out === 'string' ? out : JSON.stringify(out)
}

const sectionOf = (doc: L1Document) =>
  (doc.root as { children: L1Node[] }).children[1] as Extract<L1Node, { kind: 'container' }>
const placeOf = (n: L1Node) => ('geometry' in n ? n.geometry?.place : undefined) ?? 'absolute'

describe('REQ-350 — flow_l1 stacks a section on an existing page', () => {
  beforeAll(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req350-flow-'))
  })
  afterAll(() => {
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-350_stacking_a_section_keeps_the_render_and_pushes_later_content_down', async () => {
    const slug = seed()
    const box = (await createL1Toolbox(slug, { cwd, sandbox: true }, { pageMeasurer: evaluatorMeasurer(slug) })) as unknown as Box
    await ask(box, 'group_l1', { page: 'home', paths: APPROACH, id: 'approach' })
    const grouped = readDoc(slug)

    const answer = JSON.parse(await ask(box, 'flow_l1', { page: 'home', path: '0.1' }))
    expect(answer.changed).toEqual(['0.1'])

    const flowed = readDoc(slug)
    const section = sectionOf(flowed)
    // The copy now stacks in flow; the band that paints the section's colour
    // holds nothing and stays where it is, behind it.
    expect(section.children.filter((c) => c.kind === 'text').map(placeOf)).toEqual(['flow', 'flow', 'flow', 'flow'])
    expect(section.children.filter((c) => c.kind === 'box').map(placeOf)).toEqual(['absolute'])

    for (const width of flowed.widths) {
      const before = evaluateLayout(grouped, width)
      const rest = evaluateLayout(flowed, width)
      const grown = evaluateLayout(flowed, width, { contentScale: 2.5 })
      const at = (r: typeof rest, t: string) => r.leaves.find((l) => l.text?.startsWith(t))!.box
      for (const t of COPY) {
        // Nothing moved at rest…
        expect(Math.abs(at(rest, t).y - at(before, t).y), `${t} @${width}`).toBeLessThan(0.01)
        expect(Math.abs(at(rest, t).x - at(before, t).x), `${t} @${width}`).toBeLessThan(0.01)
      }
      // …and when the heading grows, the paragraph under it moves down by exactly
      // as much, and growing the copy lands no run of it on another. (The ruler
      // here is the evaluator's ESTIMATED run height, which at 375px is a few
      // pixels taller than the gap the capture left under one paragraph — so the
      // comparison is with the same reading at rest, not with zero.)
      const grew = at(grown, COPY[0]).height - at(rest, COPY[0]).height
      expect(at(grown, COPY[1]).y - at(rest, COPY[1]).y, `${width}`).toBeCloseTo(grew, 3)
      const copyOverlaps = (r: typeof rest) => {
        const copy = r.leaves.filter((l) => COPY.some((t) => l.text?.startsWith(t))).map((l) => l.path)
        return r.findings
          .filter((f) => f.kind === 'overlap' && f.paths.every((p) => copy.includes(p)))
          .map((f) => f.paths.join('~'))
      }
      expect(copyOverlaps(grown), `${width}`).toEqual(copyOverlaps(rest))
    }
  })

  it('test_UAT_FC_REQ-350_without_a_browser_flow_is_refused_and_nothing_changes', async () => {
    const slug = seed()
    const box = (await createL1Toolbox(slug, { cwd, sandbox: true })) as unknown as Box
    await ask(box, 'group_l1', { page: 'home', paths: APPROACH })
    const before = fs.readFileSync(pageFile(slug), 'utf8')
    const refusal = await ask(box, 'flow_l1', { page: 'home', path: '0.1' })
    expect(refusal).toContain('ENVIRONMENT')
    expect(fs.readFileSync(pageFile(slug), 'utf8')).toBe(before)
  })

  it('test_UAT_FC_REQ-350_a_conversion_that_moves_anything_is_put_back_and_named', async () => {
    const slug = seed()
    // A browser whose second reading finds the first run 3px lower than the first
    // reading did: the conversion changed the picture, so it must not stand.
    const box = (await createL1Toolbox(slug, { cwd, sandbox: true }, {
      pageMeasurer: evaluatorMeasurer(slug, { afterCalls: 1, dy: 3 }),
    })) as unknown as Box
    await ask(box, 'group_l1', { page: 'home', paths: APPROACH })
    const before = fs.readFileSync(pageFile(slug), 'utf8')
    const refusal = await ask(box, 'flow_l1', { page: 'home', path: '0.1' })
    expect(refusal).toContain('SCHEMA_INVALID')
    // It names the run that moved, where, and by how much.
    expect(refusal).toMatch(/would move ".+" at \d+px by 3px, so nothing was changed/)
    expect(fs.readFileSync(pageFile(slug), 'utf8')).toBe(before)
  })

  it.runIf(chromiumReady)(
    'test_UAT_FC_REQ-350_flow_is_render_identical_in_the_browser',
    async () => {
      const slug = seed()
      const builder = await startBuilder({ cwd, sandbox: true, port: 0 })
      try {
        const measure = browserPageMeasurer({ slug, origin: builder.url, driverFactory: createPlaywrightDriver })
        const box = (await createL1Toolbox(slug, { cwd, sandbox: true }, { pageMeasurer: measure })) as unknown as Box
        await ask(box, 'group_l1', { page: 'home', paths: APPROACH })
        // The operation itself re-renders and refuses on any drift over half a
        // pixel, so a success here IS the browser's verdict of render identity.
        const answer = JSON.parse(await ask(box, 'flow_l1', { page: 'home', path: '0.1' }))
        expect(answer.changed).toEqual(['0.1'])
        expect(sectionOf(readDoc(slug)).children.filter((c) => c.kind === 'text').map(placeOf)).toEqual([
          'flow',
          'flow',
          'flow',
          'flow',
        ])
      } finally {
        await builder.close()
      }
    },
    180_000,
  )
})
