/**
 * [[REQ-313]] — **the assistant can obtain a font**, and the knowledge that said it could not.
 *
 * WHAT WAS TRUE BEFORE. The production instances carry `ReadSite` and
 * `AuthorPages` and not `ManageAssets`, so the assistant could see the fonts a
 * site already held and could paint a `fontFamily` — and had no way whatsoever to
 * obtain a new face. Its only route was asking the client to go and download one.
 * The alternative it reached for instead was painting the name anyway, which does
 * not fail: it paints the browser's default. [[REQ-312]] put ~1,900 licensed
 * families on a shared origin and nothing could reach one of them.
 *
 * WHAT MAKES THESE EVIDENCE. The chain runs end to end over real artifacts:
 *
 *   `1c fonts mirror`  against a `google/fonts`-shaped checkout holding a REAL
 *                      TrueType font (`tests/fixtures/capture/heading-font.ttf`,
 *                      already committed) — so `fonts/platform.json` is the
 *                      manifest the real mirror writes, not a hand-authored one;
 *   `1c fonts index`   projects it into the corpus the assistant reads;
 *   `use_font`         is driven through `l1Operations` — the grant's own
 *                      operations, bound to one site, the same functions the
 *                      chat's Toolbox invokes — over a real filesystem store;
 *   `1c fonts check`   is then run over that workspace and has to PASS, which is
 *                      the claim that the face the assistant bound is one the
 *                      platform can account for.
 *
 * Nothing is mocked and no page is assembled by hand: what the assertions read is
 * the page JSON the store wrote.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - a bound family that does not reach `resources.fonts`, so the page still
 *     paints a fallback and nothing says so;
 *   - a family we do not serve being accepted, which is the silent-default
 *     failure wearing a success;
 *   - a weight a family does not ship being accepted and quietly substituted;
 *   - a second call duplicating the resource entry, which would make the tool
 *     unsafe to call when you are not sure;
 *   - a page bound by `use_font` being reported `unregistered-family` by the
 *     licence gate, which is what the gate did before it knew the tier existed;
 *   - a client's own uploaded face being silently repointed at the platform's;
 *   - the two knowledge sources still telling the assistant a font must be given
 *     to it, which is the failure mode where the tool ships and goes unused.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { parsePlatformFontSrc } from '../packages/site-schema/src/index'
import { l1Operations } from '../tools/generate/src/cli/ai/toolbox-core'
import l1Surface from '../tools/generate/src/cli/ai/l1-surface.json'
import { cmdFontsCheck, REGISTRY_REL } from '../tools/generate/src/cli/fonts'
import { cmdFontsMirror } from '../tools/generate/src/cli/font-mirror'
import { cmdFontsIndex, INDEX_REL, loadIndexFile } from '../tools/generate/src/fonts/index-build'
import { projectControlSurface, projectL1Vocabulary } from '../tools/generate/src/cli/kb-projection'
import { run } from '../tools/generate/src/cli/index'
import { makeFsSite, type SiteFixture } from './support/site-factory'
import type { PlatformFontIndex } from '../tools/generate/src/cli/ai/platform-fonts'

/** A REAL TrueType font, already committed to this repository. */
const UPSTREAM_TTF = fileURLToPath(new URL('./fixtures/capture/heading-font.ttf', import.meta.url))

const TODAY = '2026-09-23'
const REF = '0123456789abcdef0123456789abcdef01234567'

// ── the corpus these cases are built on ──────────────────────────────────────

interface FixtureFamily {
  slug: string
  family: string
  category: string
  weights: number[]
  italic?: boolean
  axes?: { tag: string; min: number; max: number }[]
  /** Release files, each given the fixture's real TTF bytes. */
  files: { filename: string; weight: number; style?: 'normal' | 'italic' }[]
}

/**
 * `Ledger Serif` — a static family, three weights, an italic. The ordinary case.
 * `Meridian Sans` — one variable file covering `wght` 100–900. The case where one
 * file draws every weight, including weights no static face exists for.
 */
const LEDGER: FixtureFamily = {
  slug: 'ledgerserif',
  family: 'Ledger Serif',
  category: 'Serif',
  weights: [400, 600, 700],
  italic: true,
  files: [
    { filename: 'LedgerSerif-Regular.ttf', weight: 400 },
    { filename: 'LedgerSerif-SemiBold.ttf', weight: 600 },
    { filename: 'LedgerSerif-Bold.ttf', weight: 700 },
    { filename: 'LedgerSerif-Italic.ttf', weight: 400, style: 'italic' },
  ],
}

const MERIDIAN: FixtureFamily = {
  slug: 'meridiansans',
  family: 'Meridian Sans',
  category: 'Sans Serif',
  weights: [100, 400, 700, 900],
  axes: [{ tag: 'wght', min: 100, max: 900 }],
  files: [{ filename: 'MeridianSans[wght].ttf', weight: 400 }],
}

const CORPUS = [LEDGER, MERIDIAN]

/** A `google/fonts`-shaped checkout, with real font bytes under every filename. */
function makeCheckout(families: FixtureFamily[]): string {
  const checkout = mkdtempSync(path.join(tmpdir(), 'req313-gf-'))
  const ttf = readFileSync(UPSTREAM_TTF)
  for (const family of families) {
    const dir = path.join(checkout, 'ofl', family.slug)
    mkdirSync(dir, { recursive: true })
    const blocks = family.files.map((f) =>
      [
        'fonts {',
        `  name: "${family.family}"`,
        `  style: "${f.style ?? 'normal'}"`,
        `  weight: ${f.weight}`,
        `  filename: "${f.filename}"`,
        `  copyright: "Copyright 2026 The ${family.family} Project Authors"`,
        '}',
      ].join('\n'),
    )
    writeFileSync(
      path.join(dir, 'METADATA.pb'),
      [`name: "${family.family}"`, 'license: "OFL"', ...blocks].join('\n') + '\n',
    )
    writeFileSync(
      path.join(dir, 'OFL.txt'),
      `Copyright 2026 The ${family.family} Project Authors\n\nSIL OPEN FONT LICENSE Version 1.1\n`,
    )
    for (const f of family.files) writeFileSync(path.join(dir, f.filename), ttf)
  }
  return checkout
}

/** The one authored registry entry the check needs — the site tier, untouched. */
const SITE_REGISTRY =
  [
    'fonts:',
    '  - family: Housefont',
    '    foundry: Test Foundry',
    '    source: https://example.com/font',
    "    downloaded: '2026-07-25'",
    '    licence:',
    '      name: Test Licence',
    '      url: https://example.com/licence',
    '      commercial_use: true',
    '      self_host: true',
    '      redistribute_in_product: true',
    '    actions: []',
    '    files:',
    '      - { path: housefont-400.woff2 }',
  ].join('\n') + '\n'

// ── the workspace ────────────────────────────────────────────────────────────

/**
 * A site, plus the repo furniture the font commands read.
 *
 * `makeFsSite` lays the site out exactly as `1c new` does — `storage/sites/<slug>/
 * draft/` — which is the tree `1c fonts check` scans, so the check below is
 * looking at the same bytes `use_font` wrote rather than at a copy.
 */
interface Bench {
  site: SiteFixture
  cwd: string
  index: PlatformFontIndex
  ops: Record<string, (p: Record<string, unknown>) => Promise<Record<string, unknown>>>
}

const scratch: string[] = []
const sites: SiteFixture[] = []
afterEach(() => {
  while (sites.length > 0) void sites.pop()?.dispose()
  while (scratch.length > 0) {
    const dir = scratch.pop()
    if (dir) rmSync(dir, { recursive: true, force: true })
  }
})

/** Mirror the corpus into a workspace and project the assistant's index from it. */
function bench(options: { corpus?: FixtureFamily[]; pages?: number } = {}): Bench {
  const corpus = options.corpus ?? CORPUS
  const site = makeFsSite()
  sites.push(site)
  const cwd = site.cwd
  mkdirSync(path.join(cwd, 'fonts'), { recursive: true })
  writeFileSync(path.join(cwd, REGISTRY_REL), SITE_REGISTRY)
  writeFileSync(
    path.join(cwd, 'fonts', 'catalogue.json'),
    JSON.stringify({
      source: 'fixture',
      retrieved: TODAY,
      family_count: corpus.length,
      families: corpus.map((f) => ({
        family: f.family,
        slug: f.slug,
        licence: 'OFL-1.1',
        licence_source: `ofl/${f.slug}/METADATA.pb`,
        category: f.category,
        weights: f.weights,
        italic: f.italic ?? false,
        variable: (f.axes?.length ?? 0) > 0,
        ...(f.axes ? { axes: f.axes } : {}),
      })),
    }),
  )

  const checkout = makeCheckout(corpus)
  scratch.push(checkout)
  const report = cmdFontsMirror({ cwd, repo: checkout, ref: REF, today: TODAY, quality: 5 })
  expect(report.failures, 'the fixture corpus must mirror cleanly').toEqual([])

  cmdFontsIndex(cwd)
  const index = loadIndexFile(cwd)
  expect(index).not.toBeNull()
  return {
    site,
    cwd,
    index: index as PlatformFontIndex,
    ops: l1Operations(site.slug, site.opts, {}, null, null, null, index as PlatformFontIndex) as Bench['ops'],
  }
}

/** The page as the store now holds it — never a value the call returned. */
async function storedPage(site: SiteFixture, pageId = 'home'): Promise<Record<string, unknown>> {
  const files = await site.store.readPages(site.slug)
  const found = files.find((f) => String(f.page.id) === pageId)
  expect(found, `page '${pageId}' must exist`).toBeDefined()
  return found!.page as Record<string, unknown>
}

/** `resources.fonts` on a stored page. */
async function servedFaces(
  site: SiteFixture,
  pageId = 'home',
): Promise<{ family: string; src: string; weight?: number; style?: string }[]> {
  const page = await storedPage(site, pageId)
  const l1 = page.l1 as { resources?: { fonts?: { family: string; src: string; weight?: number; style?: string }[] } }
  return l1.resources?.fonts ?? []
}

/** Drive the real CLI and return the exit code it set (`undefined` = success). */
async function runCli(cwd: string, argv: string[]): Promise<number | undefined> {
  const previousCwd = process.cwd()
  const previousExit = process.exitCode
  const log = console.log
  process.chdir(cwd)
  process.exitCode = undefined
  console.log = () => {}
  try {
    await run(argv)
    return process.exitCode
  } finally {
    console.log = log
    process.chdir(previousCwd)
    process.exitCode = previousExit
  }
}

async function refused(body: () => Promise<unknown>): Promise<{ code: string; message: string; hint: string }> {
  try {
    await body()
  } catch (err) {
    const e = err as { code?: string; message?: string; hint?: string }
    expect(e.code, `expected a refusal, got ${String(err)}`).toBeTypeOf('string')
    return { code: e.code ?? '', message: e.message ?? '', hint: e.hint ?? '' }
  }
  throw new Error('expected a refusal; the call succeeded')
}

// ── the cases ────────────────────────────────────────────────────────────────

describe('REQ-313 — the assistant can obtain a font', () => {
  it('test_UAT_FC_REQ-313_a_mirrored_family_is_bound_and_served', async () => {
    const { site, ops } = bench()

    const result = await ops.use_font({ family: 'Ledger Serif', weights: [400, 700] })

    // What the page now serves, read back out of the store.
    const faces = await servedFaces(site)
    expect(faces.map((f) => `${f.family} ${f.weight} ${f.style}`).sort()).toEqual([
      'Ledger Serif 400 normal',
      'Ledger Serif 700 normal',
    ])
    // Every `src` addresses the platform origin — the same parse `1c fonts check`
    // and `public-site` resolve one with, so all three agree about what it is.
    for (const face of faces) {
      expect(parsePlatformFontSrc(face.src)).toMatch(/^ledgerserif\/LedgerSerif-\w+\.woff2$/)
      expect(face.src.startsWith('/_fonts/'), `${face.src} must be site-relative`).toBe(true)
    }

    // The handle the model is told to paint carries a fallback, so painting it
    // cannot silently resolve to the browser default — the failure REF-l1 names.
    expect(result.fontFamily).toBe('Ledger Serif, serif')
    expect(result.family).toBe('Ledger Serif')
    expect(typeof result.now).toBe('number')
  })

  it('test_UAT_FC_REQ-313_a_family_we_do_not_serve_is_refused_by_name', async () => {
    const { site, ops } = bench()

    const refusal = await refused(() => ops.use_font({ family: 'Gotham' }))

    expect(refusal.code).toBe('NOT_FOUND')
    expect(refusal.message).toContain('Gotham')
    // Legible enough to choose again from: it says what to do instead.
    expect(refusal.hint.toLowerCase()).toContain('knowledge base')
    // And the refusal wrote nothing.
    expect(await servedFaces(site)).toEqual([])
  })

  it('test_UAT_FC_REQ-313_a_weight_that_does_not_ship_is_answered_with_the_ones_that_do', async () => {
    const { site, ops } = bench()

    // Ledger Serif ships 400/600/700 and is not variable, so 300 does not exist.
    const result = await ops.use_font({ family: 'Ledger Serif', weights: [300] })

    const unavailable = result.unavailable as { weights?: number[]; servedInstead?: number[] }
    expect(unavailable.weights).toEqual([300])
    expect((result.ships as { weights: number[] }).weights).toEqual([400, 600, 700])
    // Answered rather than obeyed — and rather than refused, which would leave the
    // page painting a fallback over a spelling detail.
    expect(unavailable.servedInstead).toEqual([400])
    expect((await servedFaces(site)).map((f) => f.weight)).toEqual([400])
  })

  it('test_UAT_FC_REQ-313_a_variable_family_draws_a_weight_no_static_face_has', async () => {
    const { site, ops } = bench()

    // Meridian Sans ships ONE file, carrying `wght` 100–900. 550 is a real
    // instance of it and no static face exists for it.
    const result = await ops.use_font({ family: 'Meridian Sans', weights: [550] })

    expect(result.unavailable).toBeUndefined()
    const faces = await servedFaces(site)
    expect(faces).toHaveLength(1)
    expect(faces[0].weight).toBe(550)
    expect(parsePlatformFontSrc(faces[0].src)).toBe('meridiansans/MeridianSans[wght].woff2')
    // The axis range is reported, which is how the assistant learns 550 was real.
    expect((result.ships as { axes: { tag: string; min: number; max: number }[] }).axes).toEqual([
      { tag: 'wght', min: 100, max: 900 },
    ])
  })

  it('test_UAT_FC_REQ-313_binding_the_same_family_twice_leaves_one_entry', async () => {
    const { site, ops } = bench()

    const first = await ops.use_font({ family: 'Ledger Serif', weights: [400, 700] })
    const before = await servedFaces(site)
    const second = await ops.use_font({ family: 'Ledger Serif', weights: [400, 700] })
    const after = await servedFaces(site)

    expect(after).toEqual(before)
    expect(after).toHaveLength(2)
    // Nothing was written, so the site's change count did not move — which is what
    // makes the call safe to make when you are not sure whether it is already bound.
    expect(second.now).toBe(first.now)
    expect((second.pages as { served: string[]; alreadyServing: string[] }).served).toEqual([])
    expect((second.pages as { alreadyServing: string[] }).alreadyServing).toEqual(['home'])
  })

  it('test_UAT_FC_REQ-313_a_page_bound_by_use_font_passes_the_licence_gate', async () => {
    const { site, cwd, ops } = bench()

    await ops.use_font({ family: 'Ledger Serif', weights: [400, 700] })
    await ops.use_font({ family: 'Meridian Sans', styles: ['normal'] })

    const report = cmdFontsCheck(cwd)

    expect(report.violations.map((v) => `${v.kind}: ${v.message}`)).toEqual([])
    expect(report.pass).toBe(true)
    // The references were seen, and were resolved against the PLATFORM tier —
    // no copy of any of these files exists in the site's own assets.
    expect(report.usages.length).toBeGreaterThan(0)
    expect(report.usages.every((u) => u.tier === 'platform')).toBe(true)
    expect(report.filesOnDisk).toEqual([])

    // And through the real CLI entry point, which is what an operator runs.
    expect(await runCli(cwd, ['fonts', 'check'])).toBeUndefined()
    void site
  })

  it('test_UAT_FC_REQ-313_a_face_the_client_uploaded_is_not_repointed', async () => {
    const { site, ops } = bench()

    // The page already serves `Ledger Serif` from the site's own assets: the
    // tenant's bytes, on the tenant's attestation.
    const page = await storedPage(site)
    const l1 = page.l1 as Record<string, unknown>
    l1.resources = { fonts: [{ family: 'Ledger Serif', src: '/assets/ledger-400.woff2', weight: 400 }] }
    await site.store.write(site.slug, { pages: [{ name: 'home.json', page }] })

    const refusal = await refused(() => ops.use_font({ family: 'Ledger Serif' }))

    expect(refusal.code).toBe('CONFLICT')
    expect(refusal.message).toContain('Ledger Serif')
    // The client's own file is exactly as it was — not swapped for ours.
    expect(await servedFaces(site)).toEqual([
      { family: 'Ledger Serif', src: '/assets/ledger-400.woff2', weight: 400 },
    ])
  })

  it('test_UAT_FC_REQ-313_a_deployment_with_no_mirror_says_so', async () => {
    const site = makeFsSite()
    sites.push(site)
    // The corpus this build ships when `1c fonts mirror` has never been run.
    const ops = l1Operations(site.slug, site.opts, {}, null, null, null, {
      mirror: null,
      families: [],
    }) as Bench['ops']

    const refusal = await refused(() => ops.use_font({ family: 'Ledger Serif' }))

    // ENVIRONMENT and not NOT_FOUND: nothing the model sends can fix it, and
    // reporting every family as unknown would send it hunting for a spelling.
    expect(refusal.code).toBe('ENVIRONMENT')
    expect(refusal.message.toLowerCase()).toContain('mirror')
    expect(refusal.hint).toContain('1c fonts mirror')
  })

  it('test_UAT_FC_REQ-313_one_call_serves_the_typeface_on_every_page', async () => {
    const { site, ops } = bench()
    await ops.add_page({ page: 'services', title: 'What we do' })
    await ops.add_page({ page: 'enquiry', title: 'Thanks', kind: 'email', subject: 'Thanks' })

    const result = await ops.use_font({ family: 'Ledger Serif', weights: [400] })

    const pages = result.pages as { served: string[]; notAWebPage?: string[] }
    expect(pages.served.sort()).toEqual(['home', 'services'])
    // A site that set one page in a face and the rest in a fallback is the mistake
    // the default exists to prevent, so BOTH web pages are read back.
    expect((await servedFaces(site, 'home')).map((f) => f.family)).toEqual(['Ledger Serif'])
    expect((await servedFaces(site, 'services')).map((f) => f.family)).toEqual(['Ledger Serif'])
    // And the message page was left alone — a mail client cannot load a web font,
    // so the email target refuses `resources` outright. Skipped, and said to be.
    expect(pages.notAWebPage).toEqual(['enquiry'])
    expect(await servedFaces(site, 'enquiry')).toEqual([])
  })

  it('test_UAT_FC_REQ-313_1c_fonts_index_projects_the_mirror_and_check_catches_drift', async () => {
    const { cwd, index } = bench()

    // The projection is the mirror's own families, with the catalogue's facts
    // joined on — and every path is one the mirror recorded having written.
    expect(index.families.map((f) => f.family).sort()).toEqual(['Ledger Serif', 'Meridian Sans'])
    const ledger = index.families.find((f) => f.family === 'Ledger Serif')!
    expect(ledger.category).toBe('Serif')
    expect(ledger.weights).toEqual([400, 600, 700])
    expect(ledger.italic).toBe(true)
    expect(ledger.faces.map((f) => f.path).sort()).toEqual([
      'ledgerserif/LedgerSerif-Bold.woff2',
      'ledgerserif/LedgerSerif-Italic.woff2',
      'ledgerserif/LedgerSerif-Regular.woff2',
      'ledgerserif/LedgerSerif-SemiBold.woff2',
    ])
    const meridian = index.families.find((f) => f.family === 'Meridian Sans')!
    expect(meridian.faces[0].variable).toBe(true)

    // A mirror refreshed without re-projecting leaves the assistant binding paths
    // nothing serves. This comparison is the only place that is visible.
    expect(cmdFontsCheck(cwd).violations.map((v) => v.kind)).toEqual([])
    writeFileSync(path.join(cwd, INDEX_REL), JSON.stringify({ mirror: null, families: [] }) + '\n')
    const stale = cmdFontsCheck(cwd)
    expect(stale.pass).toBe(false)
    expect(stale.violations.map((v) => v.kind)).toContain('stale-font-index')
    expect(await runCli(cwd, ['fonts', 'check'])).toBe(1)

    // And re-running the projection repairs it, through the real CLI.
    expect(await runCli(cwd, ['fonts', 'index'])).toBeUndefined()
    expect(cmdFontsCheck(cwd).pass).toBe(true)
  })

  it('test_UAT_FC_REQ-313_the_surface_grants_use_font_where_production_can_reach_it', () => {
    const surface = l1Surface as {
      groups: { group: string; operations: string[] }[]
      operations: { op: string; effect: string; params?: Record<string, { required?: boolean }> }[]
      absences: { name: string; note: string }[]
      shapes: Record<string, unknown>
    }

    // `AuthorPages` and not a group of its own: both production instances already
    // carry it, so no grant is added in two places and `ManageAssets` — the group
    // that reads a file off the operator's disk — stays ungranted.
    const authoring = surface.groups.find((g) => g.group === 'AuthorPages')!
    expect(authoring.operations).toContain('use_font')
    const instances = JSON.parse(
      readFileSync(
        fileURLToPath(new URL('../tools/generate/src/cli/ai/instances.json', import.meta.url)),
        'utf8',
      ),
    ) as Record<string, { l1: { groups: string[] } }>
    for (const role of ['consultant', 'builder']) {
      expect(instances[role].l1.groups).toContain('AuthorPages')
      expect(instances[role].l1.groups).not.toContain('ManageAssets')
    }

    const declared = surface.operations.find((o) => o.op === 'use_font')!
    expect(declared.effect).toBe('write')
    expect(declared.params?.family.required).toBe(true)
    // `page` is optional — leaving it out is what serves the face site-wide.
    expect(declared.params?.page.required).toBeUndefined()
    expect(surface.shapes.font_binding).toBeDefined()
  })

  it('test_UAT_FC_REQ-313_the_knowledge_no_longer_says_a_font_must_be_given', () => {
    // 1. The absence in the control surface. The sentence stays true for
    //    photographs and logos, which the assistant still cannot fetch.
    const absence = (l1Surface as { absences: { name: string; note: string }[] }).absences.find(
      (a) => a.name === 'Fetching a picture, or any file, yourself',
    )!
    expect(absence.note).not.toMatch(/or a font/i)
    expect(absence.note).toMatch(/photograph/i)
    expect(absence.note).toMatch(/use_font/)

    // 2. `REF-l1`'s rendering rule, at its source. It is still true as a statement
    //    about rendering and no longer reads as "so do not choose a font".
    const vocabulary = projectL1Vocabulary().body
    const rule = vocabulary
      .split('\n')
      .find((line) => line.includes('silently paints the browser default'))
    expect(rule, 'the rule must still be projected — it is still true').toBeDefined()
    expect(rule).toMatch(/use_font/)

    // 3. And the projected control surface carries the operation, which is the
    //    document a reader asking "what can it do" actually reads.
    expect(projectControlSurface().body).toMatch(/use_font/)
  })
})
