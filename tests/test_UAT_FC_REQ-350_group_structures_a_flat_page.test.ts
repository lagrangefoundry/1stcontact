/**
 * REQ-350 geometry items 1, 4 and 5 — an existing flat page is structured
 * without re-capturing it.
 *
 * THE SUBJECT IS THE REAL FLAT PAGE. `tests/fixtures/l1-corpus/.../gigabytealchemy`
 * is the Gigabyte Alchemy home page in the shape the live site still has: 70
 * siblings of the root, every one `absolute`, the sections surviving only as
 * empty backing boxes (`section-band-1`) with their copy painted over them as
 * siblings. Nothing here is synthesised.
 *
 * REAL ENTRY POINTS. The grouping goes through the assistant's own Toolbox
 * (`group_l1`) and the operator's `1c structure group`, over a draft on disk.
 * Render identity is judged by the layout evaluator — the analytic mirror of the
 * renderer — at every captured width, between them, beyond them and at more than
 * one viewport height; where Chromium is available the browser judges it too.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { run } from '../tools/generate/src/cli'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import { captureL1, evaluateLayout, offSampleWidths } from '../tools/generate/src/l1'
import { chromiumAvailable } from '../tools/generate/src/cli/capture/playwright-driver'
import { resolveL1Palette, validateSite, type L1Document, type L1Node } from '../packages/site-schema/src/index'

const CORPUS = path.join(__dirname, 'fixtures', 'l1-corpus', 'storage', 'sites', 'gigabytealchemy', 'draft')

/** "A Different Approach": its band and the four runs painted over it. */
const APPROACH = ['0.1', '0.19', '0.20', '0.21', '0.22']

const chromiumReady = await chromiumAvailable()

let cwd: string
let seq = 0

/** A fresh sandbox copy of the flat GA site; returns its slug. */
function seed(): string {
  const slug = `ga-${++seq}`
  fs.cpSync(CORPUS, path.join(cwd, 'storage', 'sandbox', slug, 'draft'), { recursive: true })
  return slug
}

const pageFile = (slug: string) => path.join(cwd, 'storage', 'sandbox', slug, 'draft', 'pages', 'home.json')
const siteFile = (slug: string) => path.join(cwd, 'storage', 'sandbox', slug, 'draft', 'site.json')
const readDoc = (slug: string): L1Document => JSON.parse(fs.readFileSync(pageFile(slug), 'utf8')).l1
const draftBytes = (slug: string) => fs.readFileSync(pageFile(slug), 'utf8') + fs.readFileSync(siteFile(slug), 'utf8')

/** Every text/image/box leaf's box, keyed by what it is plus its occurrence, at one width and height. */
function leafBoxes(doc: L1Document, width: number, viewportHeight?: number) {
  const seen = new Map<string, number>()
  const out = new Map<string, { x: number; y: number; width: number; height: number }>()
  for (const leaf of evaluateLayout(doc, width, { viewportHeight }).leaves) {
    const key = leaf.text ?? leaf.id ?? leaf.kind
    const n = seen.get(key) ?? 0
    seen.set(key, n + 1)
    out.set(`${key}#${n}`, leaf.box)
  }
  return out
}

/** The largest per-leaf difference between two documents over the whole ladder and beyond it. */
function maxRenderDelta(a: L1Document, b: L1Document): number {
  const widths = [...new Set([...a.widths, ...offSampleWidths(a), 300, 600, 1600, 1920])]
  let max = 0
  for (const width of widths) {
    for (const height of [undefined, 700, 1100]) {
      const before = leafBoxes(a, width, height)
      const after = leafBoxes(b, width, height)
      expect(after.size, `${width}px leaf count`).toBe(before.size)
      for (const [key, box] of before) {
        const moved = after.get(key)!
        max = Math.max(
          max,
          Math.abs(moved.x - box.x),
          Math.abs(moved.y - box.y),
          Math.abs(moved.width - box.width),
          Math.abs(moved.height - box.height),
        )
      }
    }
  }
  return max
}

type Box = { run: (tool: string, input: Record<string, unknown>) => Promise<unknown> }
const ask = async (box: Box, tool: string, input: Record<string, unknown>): Promise<string> => {
  const out = await box.run(tool, input)
  return typeof out === 'string' ? out : JSON.stringify(out)
}

async function cli(...argv: string[]): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: { code?: string } }> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--sandbox', '--json'])
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
    process.exitCode = 0
  }
  return JSON.parse(out.join('\n'))
}

describe('REQ-350 — group_l1 structures a flat page without re-capturing it', () => {
  beforeAll(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req350-group-'))
  })
  afterAll(() => {
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-350_grouping_a_section_nests_its_contents_and_renders_identically', async () => {
    const slug = seed()
    const before = readDoc(slug)
    expect((before.root as { children: L1Node[] }).children).toHaveLength(70)

    const box = (await createL1Toolbox(slug, { cwd, sandbox: true })) as unknown as Box
    const answer = await ask(box, 'group_l1', { page: 'home', paths: APPROACH, id: 'approach' })
    expect(JSON.parse(answer).changed).toEqual(['0.1'])

    const after = readDoc(slug)
    const root = after.root as { children: L1Node[] }
    // Five siblings became one child: the band and its four runs, in page order.
    expect(root.children).toHaveLength(66)
    const section = root.children[1] as Extract<L1Node, { kind: 'container' }>
    expect(section.kind).toBe('container')
    expect(section.id).toBe('approach')
    expect(section.children.map((c) => (c.kind === 'text' ? c.text : c.id))).toEqual([
      'section-band-1',
      'A Different Approach',
      expect.stringMatching(/^Most apps are designed/),
      expect.stringMatching(/^Through privacy-first AI/),
      expect.stringMatching(/^We work at the intersection/),
    ])
    // Coordinates are now measured from the section: the heading sits 96px into it
    // at every captured width, where on the flat page it sat at the page's y.
    const heading = section.children[1] as { geometry: { keyframes: { at: number; y: number }[] } }
    for (const kf of heading.geometry.keyframes) expect(kf.y).toBe(96)

    // The page is still a valid site, and it renders as it did — everywhere,
    // not only at the widths the capture sampled.
    const site = { ...JSON.parse(fs.readFileSync(siteFile(slug), 'utf8')), pages: [JSON.parse(fs.readFileSync(pageFile(slug), 'utf8'))] }
    expect(validateSite(site).ok).toBe(true)
    expect(maxRenderDelta(before, after)).toBeLessThan(0.01)
  })

  it('test_UAT_FC_REQ-350_moving_the_group_carries_its_contents', async () => {
    const slug = seed()
    const out = await cli('structure', 'group', slug, 'home', ...APPROACH, '--id', 'approach')
    expect(out.ok).toBe(true)

    const grouped = readDoc(slug)
    const moved = structuredClone(grouped)
    const section = (moved.root as { children: L1Node[] }).children[1] as { geometry: { keyframes: { y: number }[] } }
    for (const kf of section.geometry.keyframes) kf.y += 100

    // One edit to the section moves every element in it, and nothing else.
    for (const width of moved.widths) {
      const a = leafBoxes(grouped, width)
      const b = leafBoxes(moved, width)
      for (const [key, box] of a) {
        const inSection = /^(section-band-1#|A Different Approach|Most apps|Through privacy-first|We work at the intersection)/.test(key)
        expect(b.get(key)!.y - box.y, `${key} at ${width}`).toBeCloseTo(inSection ? 100 : 0, 5)
      }
    }
  })

  it('test_UAT_FC_REQ-350_grouping_refuses_what_it_cannot_do_identically_and_changes_nothing', async () => {
    const slug = seed()
    const box = (await createL1Toolbox(slug, { cwd, sandbox: true })) as unknown as Box
    const untouched = draftBytes(slug)

    // Not siblings of one parent.
    const notSiblings = await ask(box, 'group_l1', { page: 'home', paths: ['0.1', '0'] })
    expect(notSiblings).toContain('SCHEMA_INVALID')

    // The hero's band, grouped with a run from the NEXT section, would lift that run
    // above `section-band-1` — which it overlaps, and which paints over it today
    // only because it comes later. The refusal names the element in the way.
    const paintOrder = await ask(box, 'group_l1', { page: 'home', paths: ['0.0', '0.19'] })
    expect(paintOrder).toContain('SCHEMA_INVALID')
    expect(paintOrder).toMatch(/would paint 0\.1 over 0\.19/)

    // An address that is not there.
    const missing = await ask(box, 'group_l1', { page: 'home', paths: ['0.1', '0.99'] })
    expect(missing).toContain('NOT_FOUND')

    expect(draftBytes(slug)).toBe(untouched)
  })

  it('test_UAT_FC_REQ-350_a_flat_absolute_page_stays_valid', () => {
    // Geometry item 5: nothing here makes the flat page invalid. The untouched
    // corpus page — 70 absolute siblings — still validates as a site.
    const slug = seed()
    const site = { ...JSON.parse(fs.readFileSync(siteFile(slug), 'utf8')), pages: [JSON.parse(fs.readFileSync(pageFile(slug), 'utf8'))] }
    expect(validateSite(site).ok).toBe(true)
    const root = readDoc(slug).root as { children: L1Node[] }
    expect(root.children.every((c) => !('geometry' in c) || c.geometry?.place !== 'flow')).toBe(true)
  })

  it.runIf(chromiumReady)(
    'test_UAT_FC_REQ-350_grouping_is_render_identical_in_the_browser',
    async () => {
      const slug = seed()
      const palette = JSON.parse(fs.readFileSync(siteFile(slug), 'utf8')).palette
      const before = resolveL1Palette(readDoc(slug), palette)
      await cli('structure', 'group', slug, 'home', ...APPROACH)
      const after = resolveL1Palette(readDoc(slug), palette)

      const boxes = async (doc: L1Document) => {
        const out = new Map<string, { x: number; y: number; width: number; height: number }>()
        for (const p of await captureL1(doc)) {
          const seen = new Map<string, number>()
          for (const el of p.manifest.elements) {
            if (!el.text || !el.box) continue
            const n = seen.get(el.text) ?? 0
            seen.set(el.text, n + 1)
            out.set(`${p.viewport.width}:${el.text}#${n}`, el.box)
          }
        }
        return out
      }
      const a = await boxes(before)
      const b = await boxes(after)
      expect(b.size).toBe(a.size)
      for (const [key, box] of a) {
        const got = b.get(key)!
        expect(Math.abs(got.x - box.x), key).toBeLessThan(0.5)
        expect(Math.abs(got.y - box.y), key).toBeLessThan(0.5)
      }
    },
    120_000,
  )
})
