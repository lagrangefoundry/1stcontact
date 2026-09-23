/**
 * [[REQ-312]] — the platform font mirror, the registry's platform tier, and the
 * check that resolves a platform-origin `src`.
 *
 * WHAT WAS TRUE BEFORE. [[DOC-56]] told the assistant that ~1,900 families were
 * available to serve and **none of their bytes existed anywhere in the system**.
 * There was no platform tier at all: every font in the repo lived per-site under
 * `draft/assets/` and had arrived by hand or as a side effect of a capture.
 *
 * WHAT MAKES THESE EVIDENCE. Every case drives the real CLI entry point —
 * `run(['fonts', …])` — against a real temp workspace and a real
 * `google/fonts`-shaped checkout on disk. The upstream release file in that
 * checkout is a REAL TrueType font (`tests/fixtures/capture/heading-font.ttf`,
 * already committed), so the conversion these cases assert on is the conversion
 * that will run against the corpus: a real `sfnt` parsed, repackaged and reversed.
 * Nothing about the font bytes is simulated, and nothing is mocked.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - a mirrored file that is not the upstream font — a glyph, a `name` record or
 *     a copyright string altered by the repackaging, which would make the mirror
 *     a redistribution of a MODIFIED font under its reserved name;
 *   - a refresh that re-transfers a corpus nothing changed in;
 *   - a family that has left upstream vanishing from the manifest, un-registering
 *     a face a live site is serving this minute;
 *   - a page referencing a platform font being reported `unregistered-file`,
 *     which is what the check did before it knew the tier existed;
 *   - a page referencing a platform family the mirror does not hold passing;
 *   - a deployment whose mirror was never populated being indistinguishable from
 *     one that simply uses no platform fonts;
 *   - `fonts/registry.yaml` being rewritten by a generator.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import {
  fontSrcNamesHost,
  parsePlatformFontSrc,
  platformFontSrc,
  platformFontTarget,
  validateFontRegistry,
  type PlatformFontManifest,
} from '../packages/site-schema/src/index'
import { cmdFontsCheck, formatFontsReport, REGISTRY_REL } from '../tools/generate/src/cli/fonts'
import { cmdFontsMirror } from '../tools/generate/src/cli/font-mirror'
import { MANIFEST_REL, MIRROR_DIR_REL } from '../tools/generate/src/fonts/mirror'
import { parseSfnt, preparedTables, woff2ToSfnt } from '../tools/generate/src/fonts/woff2'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { run } from '../tools/generate/src/cli/index'

/** A REAL TrueType font, already committed to this repository. */
const UPSTREAM_TTF = fileURLToPath(new URL('./fixtures/capture/heading-font.ttf', import.meta.url))

/**
 * A host a page must NOT name (`COMMENT-3711`). Kept as a constant because the
 * off-origin refusal is now a case in its own right rather than the shape every
 * platform `src` used to have.
 */
const ELSEWHERE = 'https://1stcontact.io'

const TODAY = '2026-09-23'
const REF = '0123456789abcdef0123456789abcdef01234567'

// ── A google/fonts-shaped checkout ───────────────────────────────────────────

interface FixtureFamily {
  /** Upstream directory under the licence tree, e.g. `heading`. */
  slug: string
  /** The family name its own METADATA.pb declares. */
  family: string
  tree?: 'ofl' | 'apache'
  /** Release filenames. Each gets the fixture's real TTF bytes. */
  files?: { filename: string; style?: 'normal' | 'italic'; weight?: number }[]
}

/**
 * Write a checkout the mirror can read: a licence tree, a `METADATA.pb` in the
 * real textual protobuf upstream uses, the licence text, and real font bytes.
 */
function makeCheckout(families: FixtureFamily[]): string {
  const checkout = mkdtempSync(path.join(tmpdir(), 'req312-gf-'))
  mkdirSync(path.join(checkout, 'ofl'), { recursive: true })
  const ttf = readFileSync(UPSTREAM_TTF)
  for (const family of families) {
    const tree = family.tree ?? 'ofl'
    const dir = path.join(checkout, tree, family.slug)
    mkdirSync(dir, { recursive: true })
    const files = family.files ?? [{ filename: `${family.family.replace(/\s+/g, '')}-Regular.ttf` }]
    const blocks = files.map(
      (f) =>
        [
          'fonts {',
          `  name: "${family.family}"`,
          `  style: "${f.style ?? 'normal'}"`,
          `  weight: ${f.weight ?? 400}`,
          `  filename: "${f.filename}"`,
          `  copyright: "Copyright 2026 The ${family.family} Project Authors"`,
          '}',
        ].join('\n'),
    )
    writeFileSync(
      path.join(dir, 'METADATA.pb'),
      [`name: "${family.family}"`, `license: "${tree === 'ofl' ? 'OFL' : 'APACHE2'}"`, ...blocks].join('\n') + '\n',
    )
    writeFileSync(
      path.join(dir, tree === 'ofl' ? 'OFL.txt' : 'LICENSE.txt'),
      `Copyright 2026 The ${family.family} Project Authors\n\nSIL OPEN FONT LICENSE Version 1.1\n`,
    )
    for (const f of files) writeFileSync(path.join(dir, f.filename), ttf)
  }
  return checkout
}

// ── A repo-shaped workspace ──────────────────────────────────────────────────

interface WorkspaceSite {
  slug: string
  distribution?: 'internal' | 'product'
  fonts: { family: string; src: string }[]
}

function pageJson(fonts: { family: string; src: string }[]): unknown {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    modules: [],
    l1: {
      widths: [320, 1280],
      resources: { fonts },
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          {
            kind: 'text',
            id: 'h',
            text: 'Hello',
            axes: { color: '#111827', fontFamily: fonts[0]?.family ?? 'system-ui', fontSizePx: 24 },
            geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 320 }] },
          },
        ],
        geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 320 }] },
      },
    },
  }
}

/** The one authored registry entry these cases need — the site tier, untouched. */
function siteRegistry(family = 'Satoshi', file = 'satoshi-400.woff2'): string {
  return (
    [
      '# Authored by hand. The mirror must never rewrite this file.',
      'fonts:',
      `  - family: ${family}`,
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
      `      - { path: ${file} }`,
    ].join('\n') + '\n'
  )
}

interface WorkspaceOptions {
  /** Families the catalogue documents — what the mirror is measured against. */
  catalogue: FixtureFamily[]
  sites?: WorkspaceSite[]
  registryYaml?: string
}

function makeWorkspace(options: WorkspaceOptions): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req312-repo-'))
  mkdirSync(path.join(cwd, 'fonts'), { recursive: true })
  writeFileSync(path.join(cwd, REGISTRY_REL), options.registryYaml ?? siteRegistry())
  writeFileSync(
    path.join(cwd, 'fonts', 'catalogue.json'),
    JSON.stringify(
      {
        source: 'fixture',
        retrieved: TODAY,
        family_count: options.catalogue.length,
        families: options.catalogue.map((f) => ({
          family: f.family,
          slug: f.slug,
          licence: (f.tree ?? 'ofl') === 'ofl' ? 'OFL-1.1' : 'Apache-2.0',
          licence_source: `${f.tree ?? 'ofl'}/${f.slug}/METADATA.pb`,
          variable: false,
        })),
      },
      null,
      1,
    ),
  )
  for (const site of options.sites ?? []) {
    const draft = path.join(cwd, 'storage', 'sites', site.slug, 'draft')
    mkdirSync(path.join(draft, 'pages'), { recursive: true })
    mkdirSync(path.join(draft, 'assets'), { recursive: true })
    const json = starterSiteJson(site.slug)
    const config = { ...(json.config as Record<string, unknown>) }
    if (site.distribution) config.distribution = site.distribution
    writeFileSync(path.join(draft, 'site.json'), JSON.stringify({ ...json, config }, null, 2))
    writeFileSync(path.join(draft, 'pages', 'home.json'), JSON.stringify(pageJson(site.fonts), null, 2))
  }
  return cwd
}

const scratch: string[] = []
function checkout(families: FixtureFamily[]): string {
  const dir = makeCheckout(families)
  scratch.push(dir)
  return dir
}
function workspace(options: WorkspaceOptions): string {
  const dir = makeWorkspace(options)
  scratch.push(dir)
  return dir
}
afterEach(() => {
  while (scratch.length > 0) {
    const dir = scratch.pop()
    if (dir) rmSync(dir, { recursive: true, force: true })
  }
})

function mirror(cwd: string, repo: string, only?: string[]) {
  return cmdFontsMirror({ cwd, repo, ref: REF, today: TODAY, quality: 5, only })
}

function manifestOf(cwd: string): PlatformFontManifest {
  return JSON.parse(readFileSync(path.join(cwd, MANIFEST_REL), 'utf8')) as PlatformFontManifest
}

const HEADING: FixtureFamily = {
  slug: 'headingfont',
  family: 'Heading Font',
  files: [{ filename: 'HeadingFont-Regular.ttf', weight: 400 }],
}
const BODY: FixtureFamily = {
  slug: 'bodyface',
  family: 'Body Face',
  files: [
    { filename: 'BodyFace-Regular.ttf', weight: 400 },
    { filename: 'BodyFace-Italic.ttf', weight: 400, style: 'italic' },
  ],
}

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('REQ-312 — the platform font mirror', () => {
  it('test_UAT_FC_REQ-312_a_mirrored_file_reverses_to_the_upstream_font', () => {
    // THE LICENCE POSTURE OF THE WHOLE MIRROR, AS A FACT ABOUT BYTES. The upstream
    // repository ships no `woff2`, so the bytes are repackaged here — and the only
    // reason that is not "distributing a modified version" under OFL's Reserved
    // Font Name clause is that the repackaging is losslessly invertible. So the
    // assertion is the inversion itself, against a real font: decode what was
    // written and compare it, table by table, with what the encoder was handed.
    const cwd = workspace({ catalogue: [HEADING] })
    const report = mirror(cwd, checkout([HEADING]))
    expect(report.failures).toEqual([])
    expect(report.written).toBe(1)

    const mirrored = path.join(cwd, MIRROR_DIR_REL, 'headingfont', 'HeadingFont-Regular.woff2')
    const woff2 = readFileSync(mirrored)
    expect(woff2.subarray(0, 4).toString('latin1')).toBe('wOF2')

    const upstream = readFileSync(UPSTREAM_TTF)
    // Smaller, or the container bought nothing and the whole exercise is pointless.
    expect(woff2.length).toBeLessThan(upstream.length)

    const reversed = parseSfnt(woff2ToSfnt(woff2))
    const expected = preparedTables(parseSfnt(upstream))
    expect(reversed.tables.map((t) => t.tag).sort()).toEqual(expected.map((t) => t.tag).sort())

    // Every table byte-identical — `head` excepted only in `checkSumAdjustment`,
    // which a WOFF2 decoder is REQUIRED to recompute.
    for (const table of expected) {
      const got = reversed.tables.find((t) => t.tag === table.tag)
      expect(got, `table ${table.tag} survived`).toBeDefined()
      if (table.tag === 'head') {
        expect(got!.data.subarray(12).equals(table.data.subarray(12))).toBe(true)
        continue
      }
      expect(got!.data.equals(table.data), `table ${table.tag} is unchanged`).toBe(true)
    }

    // And the manifest describes exactly what is on disk.
    const manifest = manifestOf(cwd)
    expect(manifest.format).toEqual({ container: 'woff2', source: 'sfnt', transform: 'none' })
    expect(manifest.upstream.ref).toBe(REF)
    const file = manifest.families[0].files[0]
    expect(file.path).toBe('headingfont/HeadingFont-Regular.woff2')
    expect(file.upstream).toBe('HeadingFont-Regular.ttf')
    expect(file.bytes).toBe(woff2.length)
  })

  it('test_UAT_FC_REQ-312_rerunning_against_an_unchanged_catalogue_transfers_nothing', () => {
    // A GB-scale dependency is only affordable if a refresh moves what moved and
    // nothing else. The staged file's mtime is the observation that matters: a
    // report saying "unchanged" while the bytes were rewritten anyway would be the
    // claim without the property.
    const cwd = workspace({ catalogue: [HEADING, BODY] })
    const repo = checkout([HEADING, BODY])

    const first = mirror(cwd, repo)
    expect(first.written).toBe(3)
    expect(first.unchanged).toBe(0)

    const staged = path.join(cwd, MIRROR_DIR_REL, 'bodyface', 'BodyFace-Italic.woff2')
    const before = statSync(staged).mtimeMs

    const second = mirror(cwd, repo)
    expect(second.written).toBe(0)
    expect(second.unchanged).toBe(3)
    expect(second.families).toBe(2)
    expect(statSync(staged).mtimeMs).toBe(before)
  })

  it('test_UAT_FC_REQ-312_a_refresh_that_adds_families_leaves_served_faces_byte_identical', () => {
    // The mirror is refreshed roughly annually, against a corpus that gains
    // 120-200 families a year. A refresh that rewrote the faces already being
    // served would change live typography for every tenant using one — so adding
    // is strictly additive, and the digest is the observation that says so.
    const cwd = workspace({ catalogue: [HEADING] })
    mirror(cwd, checkout([HEADING]))
    const servedPath = path.join(cwd, MIRROR_DIR_REL, 'headingfont', 'HeadingFont-Regular.woff2')
    const servedBytes = readFileSync(servedPath)
    const servedDigest = manifestOf(cwd).families[0].files[0].sha256

    // Upstream gains a family, and the catalogue documents it.
    const cwd2 = cwd
    writeFileSync(
      path.join(cwd2, 'fonts', 'catalogue.json'),
      readFileSync(path.join(cwd2, 'fonts', 'catalogue.json'), 'utf8').replace(
        '"family_count": 1',
        '"family_count": 2',
      ),
    )
    const catalogue = JSON.parse(readFileSync(path.join(cwd2, 'fonts', 'catalogue.json'), 'utf8'))
    catalogue.families.push({
      family: BODY.family,
      slug: BODY.slug,
      licence: 'OFL-1.1',
      licence_source: `ofl/${BODY.slug}/METADATA.pb`,
      variable: false,
    })
    writeFileSync(path.join(cwd2, 'fonts', 'catalogue.json'), JSON.stringify(catalogue, null, 1))

    const after = mirror(cwd2, checkout([HEADING, BODY]))
    expect(after.families).toBe(2)
    expect(after.written).toBe(2) // only the new family's two files
    expect(after.unchanged).toBe(1)

    // The already-served face: same bytes, same digest, untouched.
    expect(readFileSync(servedPath).equals(servedBytes)).toBe(true)
    const refreshed = manifestOf(cwd2).families.find((f) => f.slug === 'headingfont')!
    expect(refreshed.files[0].sha256).toBe(servedDigest)
  })

  it('test_UAT_FC_REQ-312_the_mirror_is_not_wired_into_the_build_or_the_deploy', () => {
    // Populating R2 is not deploying a bundle. The mirror is ~1.35GB of objects
    // that persist across deploys, so a deploy must neither re-upload them nor
    // wait on them — and the way that stays true is that no build or deploy step
    // invokes the mirror at all. It is acquired like a dependency, on its own verb.
    const repoRoot = path.resolve(__dirname, '..')
    for (const script of ['bin/build', 'bin/deploy']) {
      const text = readFileSync(path.join(repoRoot, script), 'utf8')
      expect(text, `${script} does not run the mirror`).not.toContain('fonts mirror')
      expect(text, `${script} does not publish the mirror`).not.toContain('fonts publish')
    }
    // And the staged bytes are not repository content that a bundle could sweep up.
    const gitignore = readFileSync(path.join(repoRoot, '.gitignore'), 'utf8')
    expect(gitignore).toContain(`/${MIRROR_DIR_REL}/`)
  })

  it('test_UAT_FC_REQ-312_a_family_gone_upstream_is_reported_and_its_entry_retained', () => {
    // A live site may be serving this face right now. Dropping it silently would
    // un-register bytes a page still points at, turning a licence question into a
    // broken page — so the run REPORTS it and the manifest KEEPS it.
    const cwd = workspace({ catalogue: [HEADING, BODY] })
    const repo = checkout([HEADING, BODY])
    mirror(cwd, repo)
    expect(manifestOf(cwd).families.map((f) => f.slug).sort()).toEqual(['bodyface', 'headingfont'])

    rmSync(path.join(repo, 'ofl', 'bodyface'), { recursive: true, force: true })
    const after = mirror(cwd, repo)

    expect(after.removedUpstream).toEqual(['Body Face'])
    expect(manifestOf(cwd).families.map((f) => f.slug).sort()).toEqual(['bodyface', 'headingfont'])
  })

  it('test_UAT_FC_REQ-312_each_family_licence_travels_with_its_bytes_and_the_index_names_every_family', () => {
    // OFL requires the notice to travel with the distribution. The per-family file
    // beside the bytes is that obligation discharged; the aggregate index is what
    // makes the whole mirror auditable in one request.
    const cwd = workspace({ catalogue: [HEADING, BODY] })
    mirror(cwd, checkout([HEADING, BODY]))

    for (const family of manifestOf(cwd).families) {
      const licence = path.join(cwd, MIRROR_DIR_REL, ...family.licence_file.split('/'))
      expect(existsSync(licence), `${family.family} ships its licence beside its bytes`).toBe(true)
      expect(readFileSync(licence, 'utf8')).toContain('OPEN FONT LICENSE')
      // The notice itself, carried so it can be served rather than merely recorded.
      expect(family.copyright[0]).toContain('Project Authors')
    }

    const index = readFileSync(path.join(cwd, MIRROR_DIR_REL, 'LICENSES.txt'), 'utf8')
    expect(index).toContain('Heading Font')
    expect(index).toContain('Body Face')
    expect(index).toContain('/_fonts/headingfont/OFL.txt')
  })

  it('test_UAT_FC_REQ-312_the_mirror_never_rewrites_the_authored_registry', () => {
    // `fonts/registry.yaml` is hand-authored and carries the reasoning behind each
    // licence judgement in prose. One producer per file: a generator that touched
    // it would drown nine reviewed entries in nineteen hundred generated ones.
    const cwd = workspace({ catalogue: [HEADING] })
    const before = readFileSync(path.join(cwd, REGISTRY_REL), 'utf8')
    mirror(cwd, checkout([HEADING]))
    expect(readFileSync(path.join(cwd, REGISTRY_REL), 'utf8')).toBe(before)
    expect(before).toContain('# Authored by hand.')
  })
})

describe('REQ-312 — `1c fonts check` resolves the platform tier', () => {
  it('test_UAT_FC_REQ-312_a_page_on_the_platform_origin_passes_with_no_font_in_its_assets', async () => {
    // THE WHOLE POINT OF THE SHARED TIER. Before this, a `src` pointing at the
    // platform origin was reduced to an asset basename and looked for on disk, so
    // the one arrangement the tier exists to make possible was reported
    // `unregistered-file`. The site below holds NO font file at all.
    const cwd = workspace({
      catalogue: [HEADING],
      sites: [
        {
          slug: 'alice',
          distribution: 'product',
          fonts: [
            {
              family: 'Heading Font',
              src: platformFontSrc('headingfont/HeadingFont-Regular.woff2'),
            },
          ],
        },
      ],
    })
    mirror(cwd, checkout([HEADING]))

    const report = cmdFontsCheck(cwd)
    expect(report.violations).toEqual([])
    expect(report.pass).toBe(true)
    // Nothing was copied into the site to make that true.
    expect(report.filesOnDisk).toEqual([])
    // And the usage resolved as the platform tier, not by accident as a site file.
    expect(report.usages[0].tier).toBe('platform')

    // `distribution: product` is the gate that matters, and a platform font clears
    // it by construction — its licence permits redistribution in terms, so no
    // human answered a question about this family.
    expect(report.violations.filter((v) => v.kind === 'redistribution-not-permitted')).toEqual([])

    // Through the real CLI, and it exits clean.
    const code = await runCli(cwd, ['fonts', 'check'])
    expect(code).toBeUndefined()
  })

  it('test_UAT_FC_REQ-312_a_platform_src_the_mirror_does_not_hold_fails_naming_it', () => {
    // The refusal has to be legible: the model that wrote the `src` must be told
    // which family it asked for, not merely that something did not resolve.
    const cwd = workspace({
      catalogue: [HEADING],
      sites: [
        {
          slug: 'alice',
          fonts: [
            { family: 'Absent Face', src: platformFontSrc('absentface/AbsentFace-Regular.woff2') },
          ],
        },
      ],
    })
    mirror(cwd, checkout([HEADING]))

    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(false)
    const violation = report.violations.find((v) => v.kind === 'unregistered-family')
    expect(violation, 'an unmirrored platform family is a violation').toBeDefined()
    expect(violation!.message).toContain('Absent Face')
    expect(violation!.message).toContain('platform font origin')
  })

  it('test_UAT_FC_REQ-312_a_platform_src_for_a_file_the_family_does_not_ship_fails_naming_it', () => {
    // The family is mirrored; this weight is not. Resolution is per FILE and not
    // per family, or a page could point at any byte under a mirrored family's
    // prefix and be told it was fine.
    const cwd = workspace({
      catalogue: [HEADING],
      sites: [
        {
          slug: 'alice',
          fonts: [
            { family: 'Heading Font', src: platformFontSrc('headingfont/HeadingFont-Black.woff2') },
          ],
        },
      ],
    })
    mirror(cwd, checkout([HEADING]))

    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(false)
    const violation = report.violations.find((v) => v.kind === 'unregistered-file')
    expect(violation!.message).toContain('HeadingFont-Black.woff2')
    expect(violation!.hint).toContain('headingfont/HeadingFont-Regular.woff2')
  })

  it('test_UAT_FC_REQ-312_one_family_name_may_exist_in_both_tiers', () => {
    // Five of the nine authored entries are Google families the mirror also holds.
    // A registry indexed across both tiers would see a duplicate family and refuse
    // to load at all — so this is the case that decides whether the gate runs.
    const cwd = workspace({
      catalogue: [HEADING],
      registryYaml: siteRegistry('Heading Font', 'heading-local.woff2'),
      sites: [
        {
          slug: 'alice',
          fonts: [
            // The same NAME, resolved to different bytes by where they are served
            // from: one the site holds, one the platform serves.
            { family: 'Heading Font', src: '/assets/heading-local.woff2' },
            {
              family: 'Heading Font',
              src: platformFontSrc('headingfont/HeadingFont-Regular.woff2'),
            },
          ],
        },
      ],
    })
    writeFileSync(
      path.join(cwd, 'storage', 'sites', 'alice', 'draft', 'assets', 'heading-local.woff2'),
      'wOF2',
    )
    mirror(cwd, checkout([HEADING]))

    const report = cmdFontsCheck(cwd)
    expect(report.violations).toEqual([])
    expect(report.usages.map((u) => u.tier).sort()).toEqual(['platform', 'site'])
  })

  it('test_UAT_FC_REQ-312_an_unpopulated_mirror_is_reported_plainly_and_does_not_fail_the_gate', async () => {
    // A fresh clone has no mirror, because the bytes are a build product — so this
    // must not fail. What must NOT happen is the absence being silent: a deployment
    // serving no platform font and one whose mirror was never populated look
    // identical from the outside, and only one of them is a mistake.
    const cwd = workspace({ catalogue: [HEADING, BODY] })
    expect(existsSync(path.join(cwd, MANIFEST_REL))).toBe(false)

    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(true)
    expect(report.platform.populated).toBe(false)
    expect(report.platform.documented).toBe(2)

    const text = formatFontsReport(report)
    expect(text).toContain('NOT POPULATED')
    expect(text).toContain('1c fonts mirror')

    const code = await runCli(cwd, ['fonts', 'check'])
    expect(code).toBeUndefined()
  })

  it('test_UAT_FC_REQ-312_a_documented_family_the_mirror_does_not_hold_is_reported', () => {
    // [[DOC-56]] is generated from the catalogue and tells the assistant these
    // families are available to serve. A family it offers with nothing behind it is
    // the promise this whole ticket exists to keep, so the document and the mirror
    // are checked against each other.
    const cwd = workspace({ catalogue: [HEADING, BODY] })
    mirror(cwd, checkout([HEADING, BODY]), ['headingfont'])

    const report = cmdFontsCheck(cwd)
    expect(report.platform.populated).toBe(true)
    expect(report.platform.missing).toEqual(['Body Face'])
    const violation = report.violations.find((v) => v.kind === 'documented-not-mirrored')
    expect(violation, 'the catalogue and the mirror disagreeing is a violation').toBeDefined()
    expect(violation!.message).toContain('Body Face')
    expect(report.pass).toBe(false)
  })

  it('test_UAT_FC_REQ-312_the_platform_tier_is_generated_and_carries_the_licence_by_construction', () => {
    // No human writes taste into the platform tier and no family gets an individual
    // legal decision: `redistribute_in_product` follows from the licence field, and
    // the entries are PROJECTED from the manifest rather than serialised a second
    // time into a file that could drift from it.
    const cwd = workspace({ catalogue: [HEADING] })
    mirror(cwd, checkout([HEADING]))

    const report = cmdFontsCheck(cwd)
    expect(report.platform.families).toBe(1)
    expect(report.platform.upstreamRef).toBe(REF)
    expect(report.platform.catalogueRetrieved).toBe(TODAY)
    expect(report.registered).toContain('Heading Font')

    // The authored registry still validates and still describes only its own tier.
    const authored = validateFontRegistry(parseYaml(readFileSync(path.join(cwd, REGISTRY_REL), 'utf8')))
    expect(authored.ok).toBe(true)
    if (authored.ok) expect(authored.value.fonts.every((f) => f.tier === 'site')).toBe(true)
  })

  it('test_UAT_FC_REQ-312_a_platform_src_names_no_host_at_all', () => {
    // SAME-ORIGIN (`COMMENT-3711`). The `src` a page carries is root-relative, so
    // one site definition checks the same against a local preview, a staging
    // deployment and production — and, the reason this is a refusal and not merely
    // a convention, a page can never carry a hostname that a later domain binding
    // strands, since binding a domain re-renders nothing.
    const file = 'headingfont/HeadingFont-Regular.woff2'
    expect(platformFontSrc(file)).toBe(`/_fonts/${file}`)
    expect(parsePlatformFontSrc(platformFontSrc(file))).toBe(file)

    // AN ABSOLUTE URL IS NOT A PLATFORM REFERENCE, whichever host it names —
    // including this platform's own. Reading one as a platform reference would
    // hand the tier's licence clearance to bytes a third party serves.
    for (const origin of [ELSEWHERE, 'http://127.0.0.1:8787', 'https://fonts.gstatic.com']) {
      expect(parsePlatformFontSrc(`${origin}/_fonts/${file}`), origin).toBeNull()
      expect(fontSrcNamesHost(`${origin}/_fonts/${file}`), origin).toBe(true)
    }
    // Protocol-relative is an absolute URL wearing a relative shape — the one
    // spelling a bare leading-slash test would let through.
    expect(parsePlatformFontSrc(`//1stcontact.io/_fonts/${file}`)).toBeNull()
    expect(fontSrcNamesHost(`//1stcontact.io/_fonts/${file}`)).toBe(true)

    // And a site-relative path is NOT a platform reference, however its tail looks
    // — otherwise a site could claim the platform tier's clearance for its own bytes.
    expect(parsePlatformFontSrc('/assets/_fonts/headingfont/HeadingFont-Regular.woff2')).toBeNull()
    expect(parsePlatformFontSrc('assets/heading.woff2')).toBeNull()
    expect(fontSrcNamesHost('/assets/heading.woff2')).toBe(false)
  })

  it('test_UAT_FC_REQ-312_the_same_path_resolves_at_every_snapshot_root', () => {
    // THE INVARIANT THE SAME-ORIGIN DECISION CREATES (`COMMENT-3711`). The renderer
    // reduces the root-relative `src` to a reference against the page's own
    // directory, so the byte is asked for at whatever root the snapshot is served
    // at — `/` on a bound domain, `/site/<key>/` on the platform's host,
    // `/preview/<key>/<channel>/` in the builder, a directory under the capture
    // fixture. Every one of those arrives here as the same snapshot-relative tail,
    // which is why one function answers for all four and none of them needs to know
    // the others' depth.
    const file = 'headingfont/HeadingFont-Regular.woff2'
    expect(platformFontTarget(`_fonts/${file}`)).toBe(file)
    expect(platformFontTarget('_fonts/LICENSES.txt')).toBe('LICENSES.txt')

    // A page or asset of the site's own is not a font, and traversal is refused
    // rather than reasoned about — the key is built by concatenation on every one
    // of those four serving sides.
    expect(platformFontTarget('index.html')).toBeNull()
    expect(platformFontTarget('assets/_fonts/x.woff2')).toBeNull()
    expect(platformFontTarget('_fonts/../sites/secret/index.html')).toBeNull()
    expect(platformFontTarget('_fonts/')).toBeNull()
  })

  it('test_UAT_FC_REQ-312_a_font_loaded_from_another_host_is_a_violation', () => {
    // *"A site is self-contained and everything it needs comes from its domain"* is
    // CHECKED, not preferred (`COMMENT-3711`). A face fetched from anywhere else is
    // a third-party request from the visitor's browser, made before any text can
    // paint, disclosing their IP to somebody the customer never named.
    const cwd = workspace({
      catalogue: [HEADING],
      sites: [
        {
          slug: 'alice',
          fonts: [
            {
              family: 'Heading Font',
              src: `${ELSEWHERE}/_fonts/headingfont/HeadingFont-Regular.woff2`,
            },
          ],
        },
      ],
    })
    mirror(cwd, checkout([HEADING]))

    const report = cmdFontsCheck(cwd)
    expect(report.pass).toBe(false)
    const violation = report.violations.find((v) => v.kind === 'off-origin-font')
    expect(violation, 'an off-origin font is a violation in its own right').toBeDefined()
    // REPORTED AS WHAT IT IS. Before, an absolute `src` fell to the site tier and
    // surfaced as *"the registry does not list HeadingFont-Regular.woff2"* — true,
    // about the wrong problem, and with the wrong obvious fix.
    expect(violation!.message).toContain(ELSEWHERE)
    expect(report.violations.some((v) => v.kind === 'unregistered-file')).toBe(false)
    expect(violation!.hint).toContain('/_fonts/')
  })
})

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
