/**
 * Reconciliation UATs for story-86c7c21b — "A newly created site is a page that
 * already renders: creation seeds a complete, valid layout document".
 *
 * Creating a site used to leave a page with no layout document at all, so
 * authoring began by hand-writing the width ladder, the background and the root
 * container from nothing before a single pixel existed. Creation now seeds a
 * minimal-but-complete L1 document, and these UATs pin the properties the story
 * declares load-bearing beyond "something exists":
 *
 *   AC-869  the seeded document is complete and the whole definition validates
 *           unedited (envelope bounds, node cap, unique ids, page↔module rules).
 *   AC-870  `1c render` paints it with no intervening edit.
 *   AC-871  `1c shot` screenshots it with no intervening edit.
 *   AC-872  the seeded ladder IS the capture ladder — derived, not restated.
 *   AC-873  colour is stated as literals in the page's own layout document, and
 *           creation declares no palette (REQ-114 retired the theme's).
 *   AC-874  the root is flowed, not pinned — no per-width geometry track.
 *   AC-875  one shape, no opt-in: creation takes a slug and the shared
 *           workspace-root selector, and the documented usage advertises none.
 *   AC-876  a reproduction import replaces the page document wholesale, so a
 *           seeded skeleton cannot contaminate a reproduced site.
 *
 * Every test drives the real entry points against real on-disk trees in a temp
 * workspace. AC-875's usage half runs the shipped `1c` launcher as a subprocess,
 * because "documented usage" is what an author actually reads from `1c help`.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { l1DocumentSchema, validateSite } from '../packages/site-schema/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { chromiumAvailable, cmdNew, cmdRender, cmdShot } from '../tools/generate/src/cli'
import { RESPONSIVE_VIEWPORTS } from '../tools/generate/src/cli/capture/values-diff'
import { writeL1 } from '../tools/generate/src/cli/capture/bundle'
import { cmdRepro } from '../tools/generate/src/cli/repro'
import { STARTER_WIDTHS } from '../tools/generate/src/cli/scaffold'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** The hex grammar an L1 colour literal is written in (DOC-23 §5). */
const HEX = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

const tmpDirs: string[] = []
function freshCwd(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'story86c7c21b-'))
  tmpDirs.push(cwd)
  return cwd
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

/** The page artifact `1c new` leaves on disk, read back rather than recomputed. */
function readHome(draftDir: string): { l1?: L1Document } {
  return JSON.parse(readFileSync(path.join(draftDir, 'pages', 'home.json'), 'utf8')) as {
    l1?: L1Document
  }
}

/** The site metadata artifact `1c new` leaves on disk (carries the theme). */
function readSiteJson(draftDir: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(draftDir, 'site.json'), 'utf8')) as Record<
    string,
    unknown
  >
}

/** Every node in the document, root first. */
function walk(node: L1Node): L1Node[] {
  const kids = (node as { children?: L1Node[] }).children ?? []
  return [node, ...kids.flatMap(walk)]
}

/** The draft dir an already-created slug occupies under the default root. */
function draftDirOf(cwd: string, slug: string): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft')
}

/** A minimal capture bundle carrying a folded `l1.json`, for the repro UAT. */
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

// ── AC-869 — the seeded document is complete, and validates unedited ──────────

describe('story-86c7c21b — a created site carries a complete layout document', () => {
  it('test_UAT_AC869_created_page_carries_a_complete_valid_l1_document', () => {
    const cwd = freshCwd()
    const { draftDir } = cmdNew('complete', { cwd })

    // The document is present on the artifact `1c new` wrote — read back off
    // disk, not recomputed from the scaffold function.
    const page = readHome(draftDir)
    expect(page.l1).toBeDefined()
    const doc = page.l1 as L1Document

    // Complete enough to describe a page on its own: a non-empty width ladder,
    // a document background, and a root container holding a run of the slug.
    expect(doc.widths.length).toBeGreaterThan(0)
    expect(doc.background).toMatch(/^#[0-9a-f]{6}$/i)
    expect(doc.root.kind).toBe('container')
    const runs = walk(doc.root).filter((n) => n.kind === 'text')
    expect(runs.map((n) => (n as { text?: string }).text)).toContain('complete')

    // It validates against the layout-document contract on its own…
    expect(l1DocumentSchema.safeParse(doc).success).toBe(true)

    // …and the site definition assembled from the created site's metadata plus
    // that page validates as a whole — envelope checks (numeric bounds, URL
    // allowlist, node cap, unique node ids) and the page-level rules binding a
    // page's L1 document to any behavior module it mounts. No editing step
    // occurred between creation and validation.
    const result = validateSite({ ...readSiteJson(draftDir), pages: [page] })
    expect(result.ok).toBe(true)
    if (!result.ok) expect(result.errors).toEqual([])
  })
})

// ── AC-870 — it renders with no editing ──────────────────────────────────────

describe('story-86c7c21b — a created site renders unedited', () => {
  it('test_UAT_AC870_fresh_site_renders_placeholder_centred_on_theme_background', async () => {
    const cwd = freshCwd()
    const { draftDir } = cmdNew('rendersme', { cwd })

    // No editing step between creation and render.
    const { outDir, files } = await cmdRender('rendersme', { cwd })
    expect(files.length).toBeGreaterThan(0)
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // The run actually PAINTS. Asserted on the body, not the whole document:
    // the slug is in the `<title>` too, so "the markup contains the slug" would
    // pass on a page whose body was empty.
    const body = html.slice(html.indexOf('<body>'))
    expect(body).toMatch(/<p class="[^"]+"[^>]*>rendersme<\/p>/)

    // Laid out by a root that flows and centres its children…
    expect(html).toContain('display: flex')
    expect(html).toContain('align-items: center')

    // …painted on the document background the created page's OWN layout document
    // declares. Read back off disk, not restated here: the render is being shown
    // to carry the seeded colour through, which a hard-coded literal would not
    // demonstrate.
    const doc = readHome(draftDir).l1 as L1Document
    expect(doc.background).toMatch(HEX)
    expect(html).toContain(`background-color: ${doc.background}`)
  })
})

// ── AC-871 — it screenshots with no editing ──────────────────────────────────

describe('story-86c7c21b — a created site screenshots unedited', () => {
  itB(
    'test_UAT_AC871_fresh_site_shoots_without_hand_editing',
    async () => {
      const cwd = freshCwd()
      cmdNew('shootsme', { cwd })

      // The eyes half of the render-and-look loop: render + serve + capture,
      // with no intervening edit.
      const out = path.join(cwd, 'fresh.png')
      const shot = await cmdShot({ cwd, slug: 'shootsme', out })
      expect(existsSync(shot.outFile)).toBe(true)
      // A well-formed PNG, not merely a file that exists.
      const bytes = readFileSync(shot.outFile)
      expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
    },
    60_000,
  )
})

// ── AC-872 — the seeded ladder IS the capture ladder ─────────────────────────

describe('story-86c7c21b — the starting ladder is the capture ladder', () => {
  it('test_UAT_AC872_starter_widths_are_the_capture_viewport_ladder', () => {
    const cwd = freshCwd()
    const { draftDir } = cmdNew('ladder', { cwd })

    // Element-wise equality including order and length: an authored document and
    // a reproduced one keyframe at the same widths by construction.
    const expected = RESPONSIVE_VIEWPORTS.map((v) => v.width)
    expect(expected.length).toBeGreaterThan(0)
    expect(readHome(draftDir).l1?.widths).toEqual(expected)

    // The published starting-ladder value the scaffold exposes is DERIVED from
    // the capture ladder rather than restated, so a change to the capture ladder
    // is observable in a created site without editing the scaffold.
    expect([...STARTER_WIDTHS]).toEqual(expected)
  })
})

// ── AC-873 — colour is stated as literals in the page's own document ──────────

describe('story-86c7c21b — the starting colours live in the page document', () => {
  it('test_UAT_AC873_document_and_placeholder_colours_are_literals_in_the_page_document', () => {
    const cwd = freshCwd()
    const { draftDir } = cmdNew('themed', { cwd })

    // Both artifacts creation writes, read back off disk.
    const site = readSiteJson(draftDir)
    const doc = readHome(draftDir).l1 as L1Document

    // REQ-114 — the page document is where a fresh site's colour is stated. Both
    // page-level colours are plain hex literals: a literal is always a valid
    // colour (DOC-23 §5), so a starting page needs no palette to be complete.
    expect(doc.background).toMatch(HEX)
    expect(doc.textColor).toMatch(HEX)

    const placeholder = walk(doc.root).find((n) => n.kind === 'text') as
      | { axes?: { color?: string } }
      | undefined
    expect(placeholder).toBeDefined()
    // The run inherits the document's own text colour rather than restating a
    // third value, so the page keeps ONE statement of each colour.
    expect(placeholder?.axes?.color).toBe(doc.textColor)

    // Creation declares no palette anywhere — neither a site-level one nor a
    // theme colour surface. The colour group left the token surface with the
    // legacy palette; the theme a created site carries is the non-colour groups
    // only, and every one of those still arrives.
    expect(site.palette).toBeUndefined()
    const theme = site.theme as Record<string, unknown>
    expect(theme.palette).toBeUndefined()
    expect(Object.keys(theme).sort()).toEqual(
      ['breakpoints', 'container', 'radius', 'shadow', 'spacing', 'typography'].sort(),
    )

    // The scaffold invents no third colour: every colour value anywhere in the
    // seeded document is one of the two the document itself declares.
    const declared = new Set([doc.background, doc.textColor].map((c) => c.toLowerCase()))
    const seeded = walk(doc.root)
      .flatMap((n) => Object.values(((n as { axes?: Record<string, unknown> }).axes ?? {}) as object))
      .filter((v): v is string => typeof v === 'string' && HEX.test(v))
    expect(seeded.length).toBeGreaterThan(0)
    for (const c of seeded) expect(declared.has(c.toLowerCase())).toBe(true)
  })
})

// ── AC-874 — the root is flowed, not pinned ──────────────────────────────────

describe('story-86c7c21b — the starting root flows rather than pinning', () => {
  it('test_UAT_AC874_scaffolded_root_declares_no_per_width_geometry_track', async () => {
    const cwd = freshCwd()
    cmdNew('flowed', { cwd })
    const doc = readHome(draftDirOf(cwd, 'flowed')).l1 as L1Document

    // A flowed, centred root with its own padding…
    const root = doc.root as {
      layout?: string
      align?: string
      padding?: unknown
      geometry?: unknown
    }
    expect(root.layout).toBe('stack')
    expect(root.align).toBe('center')
    expect(root.padding).toBeDefined()

    // …and NO per-width geometry track, on the root or on any of its children:
    // keyframes are what a *capture* folds to, and six absolute boxes would be
    // the author's first chore.
    for (const node of walk(doc.root)) {
      expect((node as { geometry?: unknown }).geometry).toBeUndefined()
    }

    // The emitted layout is flow-based and centred, with no per-width
    // positioning for the seeded nodes.
    const { outDir } = await cmdRender('flowed', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toContain('display: flex')
    expect(html).toContain('align-items: center')
    expect(html).toContain('justify-content: center')
    expect(html).toContain('position: relative')
    expect(html).not.toContain('position: absolute')
  })
})

// ── AC-875 — one shape, no opt-in ────────────────────────────────────────────

describe('story-86c7c21b — creation offers no starter-mode selection', () => {
  it('test_UAT_AC875_every_created_slug_yields_one_starter_shape_with_no_flag', () => {
    const cwd = freshCwd()

    // The shape does not vary by slug or by invocation: every slug creation is
    // asked for yields a page carrying a valid layout document.
    for (const slug of ['a', 'another-site', 'x9']) {
      const { draftDir } = cmdNew(slug, { cwd })
      const doc = readHome(draftDir).l1
      expect(doc, slug).toBeDefined()
      expect(l1DocumentSchema.safeParse(doc).success, slug).toBe(true)
    }

    // The documented usage advertises no opt-in: creation lists the slug and the
    // shared workspace-root selector, and nothing else. Read from the shipped
    // launcher's own help output — what an author actually reads.
    const help = execFileSync('node', [path.join('tools', 'generate', 'bin', '1c.mjs'), 'help'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    })
    const newLine = help.split('\n').find((l) => l.trim().startsWith('1c new '))
    expect(newLine).toBeDefined()
    expect(newLine?.trim()).toBe('1c new <slug> [--sandbox]')
    // `--sandbox` is the workspace-root selector every command shares, not a
    // starter mode: it appears on the other storage verbs too.
    expect(help).toContain('1c list [--sandbox]')
    // No starter-mode flag exists to choose or to forget.
    expect(help).not.toMatch(/1c new[^\n]*--l1/)
    expect(help).not.toMatch(/1c new[^\n]*--empty/)
  })
})

// ── AC-876 — a reproduction import replaces the page document wholesale ──────

describe('story-86c7c21b — a reproduction import is uncontaminated by the skeleton', () => {
  it('test_UAT_AC876_repro_over_a_created_slug_matches_repro_over_a_virgin_slug', async () => {
    const cwd = freshCwd()
    const ref = await bundle(cwd)

    // The same reference bundle imported into a slug that never existed…
    const virgin = await cmdRepro('virgin', { cwd, ref })
    // …and into a slug created immediately beforehand, so it carries the
    // starting skeleton.
    cmdNew('seeded', { cwd })
    const seeded = await cmdRepro('seeded', { cwd, ref })

    const normalize = (dir: string, slug: string): string =>
      readFileSync(path.join(dir, 'pages', 'home.json'), 'utf8').split(slug).join('<slug>')

    // Byte-identical page documents after normalising the slug name: the result
    // is asserted, not the mechanism.
    expect(normalize(seeded.draftDir, 'seeded')).toBe(normalize(virgin.draftDir, 'virgin'))

    // The widths, the background and every node are the imported reproduction's:
    // no scaffolded width, background colour or placeholder run survives.
    const page = readHome(seeded.draftDir)
    expect(page.l1?.widths).toEqual([320, 1280])
    expect(page.l1?.background).toBe('#101010')
    expect(page.l1?.widths).not.toEqual([...STARTER_WIDTHS])
    const ids = walk(page.l1?.root as L1Node).map((n) => n.id)
    expect(ids).toContain('captured-root')
    expect(ids).not.toContain('placeholder')
  })
})
