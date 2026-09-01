/**
 * REQ-102 — `1c new` scaffolds a minimal valid L1 document.
 *
 * The starter page was `{ modules: [] }` with no `l1` block, so authoring a site
 * began by hand-writing the whole document from nothing — the width ladder, the
 * background, the root container — before a single pixel existed. Every authored
 * site paid that, and every author had to know the ladder convention by heart or
 * copy it out of an unrelated site.
 *
 * These UATs drive the real CLI entry points against real on-disk trees in a temp
 * workspace, and cover the closed hole:
 *
 *   - the skeleton  a freshly scaffolded page validates as a site definition and
 *                   its `l1` block validates against `l1DocumentSchema` directly.
 *   - it renders    `1c render` succeeds on a fresh site with no hand editing and
 *                   paints the placeholder — the point of seeding at all is that
 *                   the pixel exists before the first edit.
 *   - it shoots     `1c shot` produces a PNG of that same fresh site (the eyes
 *                   loop works from the first command).
 *   - the ladder    the scaffolded widths ARE the capture ladder, so an authored
 *                   document and a reproduced one keyframe at the same widths.
 *   - no contam.    `1c repro` over a freshly scaffolded slug yields byte-identical
 *                   output to `1c repro` over a slug that never had a skeleton —
 *                   the scaffold cannot leak into a reproduction import.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import type { L1Document } from '@1stcontact/site-schema'
import { l1DocumentSchema, validateSite } from '../packages/site-schema/src/index'
import { chromiumAvailable, cmdNew, cmdRender, cmdShot } from '../tools/generate/src/cli'
import { RESPONSIVE_VIEWPORTS } from '../tools/generate/src/cli/capture/values-diff'
import { writeL1 } from '../tools/generate/src/cli/capture/bundle'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import { STARTER_WIDTHS, starterHomePage } from '../tools/generate/src/cli/scaffold'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

const tmpDirs: string[] = []
function freshCwd(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req102-'))
  tmpDirs.push(cwd)
  return cwd
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

/** Read the scaffolded home page back off disk — the artifact `1c new` leaves. */
function readHome(draftDir: string): { l1?: L1Document } {
  return JSON.parse(readFileSync(path.join(draftDir, 'pages', 'home.json'), 'utf8')) as {
    l1?: L1Document
  }
}

/** A minimal capture bundle carrying a folded `l1.json` for the repro UAT. */
async function bundle(cwd: string): Promise<string> {
  const dir = path.join(cwd, 'bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  await writeL1(fsReferenceBundle(dir), {
    widths: [320, 1280],
    background: '#101010',
    root: {
      kind: 'container',
      id: 'captured-root',
      layout: 'stack',
      children: [{ kind: 'text', id: 'captured-run', text: 'Captured headline' }],
    },
  })
  writeFileSync(
    path.join(dir, 'capture.json'),
    JSON.stringify({ url: 'https://example.test/', host: 'example.test', assets: [] }, null, 2),
  )
  return dir
}

describe('REQ-102 — `1c new` seeds a renderable L1 document', () => {
  it('test_UAT_FC_REQ-102_scaffolded_page_carries_a_valid_l1_document', () => {
    const cwd = freshCwd()
    const { draftDir } = cmdNew('fresh', { cwd })

    // AC-1: the `l1` block exists and validates against the L1 envelope directly.
    const page = readHome(draftDir)
    expect(page.l1).toBeDefined()
    const parsed = l1DocumentSchema.safeParse(page.l1)
    expect(parsed.success).toBe(true)

    // …and the whole definition still validates as a site — a seeded skeleton
    // must not trip the page-level `l1` ↔ module-slot binding rules (REQ-93).
    const site = JSON.parse(readFileSync(path.join(draftDir, 'site.json'), 'utf8')) as Record<
      string,
      unknown
    >
    const result = validateSite({ ...site, pages: [page] })
    expect(result.ok).toBe(true)
  })

  it('test_UAT_FC_REQ-102_scaffolded_widths_are_the_capture_ladder', () => {
    const cwd = freshCwd()
    const { draftDir } = cmdNew('ladder', { cwd })

    // AC-4: the seeded ladder is DERIVED from the capture ladder, not restated —
    // so an authored document and a reproduced one keyframe at the same widths.
    const expected = RESPONSIVE_VIEWPORTS.map((v) => v.width)
    expect(readHome(draftDir).l1?.widths).toEqual(expected)
    expect([...STARTER_WIDTHS]).toEqual(expected)
  })

  it('test_UAT_FC_REQ-102_fresh_site_renders_without_hand_editing', async () => {
    const cwd = freshCwd()
    cmdNew('renderme', { cwd })

    // AC-2: `1c render` succeeds on a fresh site — no editing step in between.
    const { outDir, files } = await cmdRender('renderme', { cwd })
    expect(files.length).toBeGreaterThan(0)
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // The placeholder actually PAINTS — asserted on the body, not the whole
    // document: the slug is in the `<title>` too, so "contains the slug"
    // would pass on a page whose body was empty.
    const body = html.slice(html.indexOf('<body>'))
    // REQ-106 — a node's `id` is now emitted as a real DOM id (so `#anchor`
    // navigation has something to land on), so the run carries attributes beyond
    // its class. Match the class and the content, not the exact attribute list.
    expect(body).toMatch(/<p class="[^"]+"[^>]*>renderme<\/p>/)
    // …laid out by the root container as a flowed, centred stack, and painted
    // on the document background.
    expect(html).toContain('display: flex')
    expect(html).toContain('align-items: center')
    expect(html).toContain('background-color: #ffffff')
  })

  itB('test_UAT_FC_REQ-102_fresh_site_shoots_without_hand_editing', async () => {
    const cwd = freshCwd()
    cmdNew('shootme', { cwd })

    // AC-2 (eyes half): `1c shot` renders + serves + screenshots the fresh site.
    const out = path.join(cwd, 'fresh.png')
    const shot = await cmdShot({ cwd, slug: 'shootme', out })
    expect(existsSync(shot.outFile)).toBe(true)
    const bytes = readFileSync(shot.outFile)
    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  }, 60_000)

  it('test_UAT_FC_REQ-102_repro_over_a_scaffolded_slug_is_uncontaminated', async () => {
    const cwd = freshCwd()
    const ref = await bundle(cwd)

    // AC-3: import over a slug that never existed…
    const virgin = await cmdRepro('virgin', { cwd, ref })
    // …and over one `1c new` already seeded with a skeleton.
    cmdNew('seeded', { cwd })
    const seeded = await cmdRepro('seeded', { cwd, ref })

    const normalize = (dir: string, slug: string): string =>
      readFileSync(path.join(dir, 'pages', 'home.json'), 'utf8').split(slug).join('<slug>')

    // Identical page documents: the scaffold is fully overwritten, so no seeded
    // width, background or placeholder run survives into the reproduction.
    expect(normalize(seeded.draftDir, 'seeded')).toBe(normalize(virgin.draftDir, 'virgin'))
    const page = readHome(seeded.draftDir)
    expect(page.l1?.widths).toEqual([320, 1280])
    expect(page.l1?.background).toBe('#101010')
    expect(JSON.stringify(page.l1)).not.toContain('placeholder')
  })

  it('test_UAT_FC_REQ-102_starter_seeds_l1_unconditionally', () => {
    // AC-5: one shape, no flag, no mode detection — the starter emits an L1
    // document for every slug it is asked for, with no opt-in to forget.
    for (const slug of ['a', 'another-site', 'x9']) {
      const parsed = l1DocumentSchema.safeParse(
        (starterHomePage(slug) as { l1?: unknown }).l1,
      )
      expect(parsed.success).toBe(true)
    }
  })
})
