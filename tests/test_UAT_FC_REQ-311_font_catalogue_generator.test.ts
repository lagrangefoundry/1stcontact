/**
 * REQ-311 — the font catalogue has a generator.
 *
 * `fonts/catalogue.json` and `fonts/CATALOGUE.md` were produced once by hand and
 * committed, so nothing reproduced them and nothing could refresh them. These
 * UATs cover the closed hole:
 *
 *   - `1c fonts catalogue` rebuilds both files from the two upstream sources,
 *     carrying every field the record shape names.
 *   - Licence comes from each family's own `METADATA.pb`, joined on the name that
 *     file declares for itself — never from a directory name. The renamed `Edu`
 *     case is the regression: a family whose directory name disagrees with its
 *     live name still resolves correctly, and a family no `METADATA.pb` declares
 *     at all is EXCLUDED and named rather than defaulted from its neighbours.
 *   - The live list is the authority for existence: a family the repository
 *     carries and upstream no longer lists is dropped and reported.
 *   - Unreachable upstream fails and leaves the existing catalogue untouched.
 *   - A refresh that changes nothing rewrites nothing, including `retrieved`.
 *   - `1c fonts doc` projects [[DOC-56]]'s body: OFL 1.1 and Apache 2.0 only,
 *     grouped with Slab Serif / Symbols / Noto split out of category, in
 *     sub-headings of 22 by usage, because KB chunking is heading-anchored.
 *
 * The two sources are driven from fixtures on disk — a saved metadata document
 * and a checkout-shaped directory — through the CLI's real `--metadata`/`--repo`
 * seam, so the parse, the join, the writes and the exit code are exercised
 * end-to-end without depending on Google's uptime.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  cmdFontsCatalogue,
  CATALOGUE_JSON_REL,
  CATALOGUE_MD_REL,
  type Catalogue,
  type LiveFamily,
} from '../tools/generate/src/cli/font-catalogue'
import {
  cmdFontsDoc,
  projectFontDoc,
  resolveFontDocTicket,
  GROUP_SIZE,
  DOC_SOURCE_VALUE,
} from '../tools/generate/src/cli/font-doc'
import { run } from '../tools/generate/src/cli/index'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const temps: string[] = []
afterEach(() => {
  while (temps.length > 0) rmSync(temps.pop()!, { recursive: true, force: true })
})

function tempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'req311-'))
  temps.push(dir)
  return dir
}

interface FamilySpec {
  family: string
  category?: string
  stroke?: string | null
  classifications?: string[]
  weights?: number[]
  italic?: boolean
  axes?: Array<{ tag: string; min: number; max: number }>
  isNoto?: boolean
  popularity: number
}

/** One `familyMetadataList` entry, as the live endpoint shapes it. */
function liveFamily(spec: FamilySpec): LiveFamily {
  const weights = spec.weights ?? [400]
  const fonts: Record<string, unknown> = {}
  for (const w of weights) {
    fonts[String(w)] = { lineHeight: 1.2 }
    if (spec.italic) fonts[`${w}i`] = { lineHeight: 1.2 }
  }
  return {
    family: spec.family,
    category: spec.category ?? 'Sans Serif',
    stroke: spec.stroke ?? null,
    classifications: spec.classifications ?? [],
    subsets: ['menu', 'latin'],
    fonts,
    axes: spec.axes ?? [],
    designers: ['A Designer'],
    dateAdded: '2020-01-01',
    popularity: spec.popularity,
    isNoto: spec.isNoto === true,
  }
}

/** A saved copy of the live family list, with Google's XSSI prefix in place. */
function metadataFile(specs: FamilySpec[]): string {
  const dir = tempDir()
  const file = path.join(dir, 'metadata.json')
  writeFileSync(file, `)]}'\n${JSON.stringify({ familyMetadataList: specs.map(liveFamily) })}`)
  return file
}

/**
 * A checkout-shaped directory: `<licence-tree>/<slug>/METADATA.pb`.
 *
 * The `slug` is supplied INDEPENDENTLY of the declared name, because that gap is
 * the whole subject — a directory called `edunswactfoundation` whose file
 * declares `Edu NSW ACT Foundation` is exactly the shape that defeated the
 * one-off script's slug join.
 */
function fontsRepo(dirs: Array<{ tree: string; slug: string; name: string; licence: string }>): string {
  const root = tempDir()
  for (const d of dirs) {
    const familyDir = path.join(root, d.tree, d.slug)
    mkdirSync(familyDir, { recursive: true })
    writeFileSync(
      path.join(familyDir, 'METADATA.pb'),
      [
        `name: "${d.name}"`,
        'designer: "A Designer"',
        `license: "${d.licence}"`,
        'category: "SANS_SERIF"',
        'fonts {',
        `  name: "${d.name}"`,
        '  style: "normal"',
        '  weight: 400',
        '}',
        '',
      ].join('\n'),
    )
  }
  return root
}

/** Drive the real CLI entry point against a workspace. */
async function cli(cwd: string, argv: string[]): Promise<number> {
  const prevCwd = process.cwd()
  const prevExit = process.exitCode
  try {
    process.chdir(cwd)
    process.exitCode = 0
    await run(argv)
    return process.exitCode ?? 0
  } finally {
    process.chdir(prevCwd)
    process.exitCode = prevExit
  }
}

function workspace(): string {
  const dir = tempDir()
  mkdirSync(path.join(dir, 'fonts'), { recursive: true })
  return dir
}

function readJson(cwd: string): Catalogue {
  return JSON.parse(readFileSync(path.join(cwd, CATALOGUE_JSON_REL), 'utf8')) as Catalogue
}

// ── The suite ────────────────────────────────────────────────────────────────

describe('REQ-311 — the font catalogue has a generator', () => {
  it('test_UAT_FC_REQ-311_catalogue_is_rebuilt_from_upstream', async () => {
    const cwd = workspace()
    const metadata = metadataFile([
      {
        family: 'Roboto',
        popularity: 1,
        weights: [100, 400, 900],
        italic: true,
        stroke: 'Sans Serif',
        axes: [
          { tag: 'wght', min: 100, max: 900 },
          { tag: 'GRAD', min: -50, max: 100 },
        ],
      },
      { family: 'Roboto Slab', popularity: 2, category: 'Serif', stroke: 'Slab Serif' },
    ])
    const repo = fontsRepo([
      { tree: 'apache', slug: 'roboto', name: 'Roboto', licence: 'APACHE2' },
      { tree: 'ofl', slug: 'robotoslab', name: 'Roboto Slab', licence: 'OFL' },
    ])

    const exit = await cli(cwd, ['fonts', 'catalogue', '--metadata', metadata, '--repo', repo])
    expect(exit).toBe(0)

    const catalogue = readJson(cwd)
    expect(catalogue.family_count).toBe(2)
    // Every field the record shape names, on one record.
    expect(catalogue.families[0]).toMatchObject({
      family: 'Roboto',
      slug: 'roboto',
      licence: 'Apache-2.0',
      licence_source: 'apache/roboto/METADATA.pb',
      category: 'Sans Serif',
      stroke: 'Sans Serif',
      classifications: [],
      weights: [100, 400, 900],
      italic: true,
      variable: true,
      subsets: ['latin', 'menu'],
      designers: ['A Designer'],
      date_added: '2020-01-01',
      popularity_rank: 1,
      is_noto: false,
    })
    // Axes are carried with their bounds, in a stable order.
    expect(catalogue.families[0].axes).toEqual([
      { tag: 'GRAD', min: -50, max: 100 },
      { tag: 'wght', min: 100, max: 900 },
    ])
    // The licence read from the family's OWN file, not from the tree it sits in
    // by resemblance: `robotoslab` is under ofl/ and is OFL, `roboto` is under
    // apache/ and is Apache — two trees, two answers, both from the file.
    expect(catalogue.families[1].licence).toBe('OFL-1.1')

    // The human summary is written beside it and reports the same counts.
    const md = readFileSync(path.join(cwd, CATALOGUE_MD_REL), 'utf8')
    expect(md).toContain('Apache-2.0')
    expect(md).toContain('| OFL-1.1 | 1 |')
    expect(md).toContain('Rebuild it with `1c fonts catalogue`')
  })

  it('test_UAT_FC_REQ-311_licence_is_not_resolved_by_directory_name', async () => {
    const cwd = workspace()
    // The `Edu *` case, in both of its shapes:
    //   - `Edu NSW ACT Foundation` lives in a directory whose slug does not
    //     normalise to its name. A slug join misses it; reading the file finds it.
    //   - `Edu NSW ACT Cursive` has no METADATA.pb at all. The one-off script
    //     defaulted it to OFL because its neighbours were OFL. That is the
    //     silent misattribution this ticket exists to prevent.
    const metadata = metadataFile([
      { family: 'Edu NSW ACT Foundation', popularity: 1, category: 'Handwriting' },
      { family: 'Edu NSW ACT Cursive', popularity: 2, category: 'Handwriting' },
    ])
    const repo = fontsRepo([
      {
        tree: 'ofl',
        slug: 'edunswactfoundation',
        name: 'Edu NSW ACT Foundation',
        licence: 'OFL',
      },
    ])

    const exit = await cli(cwd, ['fonts', 'catalogue', '--metadata', metadata, '--repo', repo])
    expect(exit).toBe(0)

    const catalogue = readJson(cwd)
    expect(catalogue.families.map((f) => f.family)).toEqual(['Edu NSW ACT Foundation'])
    expect(catalogue.families[0].licence).toBe('OFL-1.1')
    expect(catalogue.families[0].licence_source).toBe('ofl/edunswactfoundation/METADATA.pb')
    // Excluded, and named — never defaulted to its neighbours' licence.
    expect(catalogue.caveats.join('\n')).toContain('Edu NSW ACT Cursive')

    const report = await cmdFontsCatalogue({ cwd, metadata, repo, today: '2026-01-02' })
    expect(report.excluded.map((e) => e.family)).toEqual(['Edu NSW ACT Cursive'])
  })

  it('test_UAT_FC_REQ-311_delisted_families_are_dropped_and_reported', async () => {
    const cwd = workspace()
    const repo = fontsRepo([
      { tree: 'ofl', slug: 'alpha', name: 'Alpha', licence: 'OFL' },
      // In the repository, delisted upstream. It must not be mirrored.
      { tree: 'ofl', slug: 'gone', name: 'Gone', licence: 'OFL' },
    ])
    const before = metadataFile([
      { family: 'Alpha', popularity: 1 },
      { family: 'Gone', popularity: 2 },
    ])
    await cmdFontsCatalogue({ cwd, metadata: before, repo, today: '2026-01-01' })
    expect(readJson(cwd).families.map((f) => f.family)).toEqual(['Alpha', 'Gone'])

    // Upstream stops listing it; the repository still carries the directory.
    const after = metadataFile([
      { family: 'Alpha', popularity: 1 },
      { family: 'Beta', popularity: 2 },
    ])
    const repo2 = fontsRepo([
      { tree: 'ofl', slug: 'alpha', name: 'Alpha', licence: 'OFL' },
      { tree: 'ofl', slug: 'beta', name: 'Beta', licence: 'OFL' },
      { tree: 'ofl', slug: 'gone', name: 'Gone', licence: 'OFL' },
    ])
    const report = await cmdFontsCatalogue({ cwd, metadata: after, repo: repo2, today: '2026-01-02' })

    expect(readJson(cwd).families.map((f) => f.family)).toEqual(['Alpha', 'Beta'])
    // A silent refresh would hide the removal, which is the change most likely
    // to break a site that is already live.
    expect(report.removed).toEqual(['Gone'])
    expect(report.added).toEqual(['Beta'])
  })

  it('test_UAT_FC_REQ-311_unreachable_upstream_leaves_the_catalogue_untouched', async () => {
    const cwd = workspace()
    const metadata = metadataFile([{ family: 'Alpha', popularity: 1 }])
    const repo = fontsRepo([{ tree: 'ofl', slug: 'alpha', name: 'Alpha', licence: 'OFL' }])
    await cmdFontsCatalogue({ cwd, metadata, repo, today: '2026-01-01' })
    const kept = readFileSync(path.join(cwd, CATALOGUE_JSON_REL), 'utf8')

    // The live list cannot be read. A half-written catalogue is worse than a
    // stale one, so the command fails and writes nothing at all.
    const exit = await cli(cwd, [
      'fonts',
      'catalogue',
      '--metadata',
      path.join(cwd, 'no-such-snapshot.json'),
      '--repo',
      repo,
    ])
    expect(exit).not.toBe(0)
    expect(readFileSync(path.join(cwd, CATALOGUE_JSON_REL), 'utf8')).toBe(kept)

    // And the same when the licence side is the one that cannot be read.
    await expect(
      cmdFontsCatalogue({ cwd, metadata, repo: path.join(cwd, 'no-such-checkout') }),
    ).rejects.toThrow()
    expect(readFileSync(path.join(cwd, CATALOGUE_JSON_REL), 'utf8')).toBe(kept)
  })

  it('test_UAT_FC_REQ-311_an_unchanged_refresh_rewrites_nothing', async () => {
    const cwd = workspace()
    const metadata = metadataFile([
      { family: 'Alpha', popularity: 1 },
      { family: 'Beta', popularity: 2 },
    ])
    const repo = fontsRepo([
      { tree: 'ofl', slug: 'alpha', name: 'Alpha', licence: 'OFL' },
      { tree: 'ofl', slug: 'beta', name: 'Beta', licence: 'OFL' },
    ])
    const first = await cmdFontsCatalogue({ cwd, metadata, repo, today: '2026-01-01' })
    expect(first.written).toEqual([CATALOGUE_JSON_REL, CATALOGUE_MD_REL])

    const again = await cmdFontsCatalogue({ cwd, metadata, repo, today: '2026-06-30' })
    expect(again.changed).toBe(false)
    expect(again.written).toEqual([])
    expect(again.added).toEqual([])
    expect(again.removed).toEqual([])
    expect(again.licenceChanged).toEqual([])
    // `retrieved` did not advance either — a date that moved on every run would
    // make every run a commit and bury the diff that says what upstream did.
    expect(readJson(cwd).retrieved).toBe('2026-01-01')

    // A licence that genuinely changes is a change, and is named as one.
    const relicensed = fontsRepo([
      { tree: 'ofl', slug: 'alpha', name: 'Alpha', licence: 'OFL' },
      { tree: 'apache', slug: 'beta', name: 'Beta', licence: 'APACHE2' },
    ])
    const third = await cmdFontsCatalogue({ cwd, metadata, repo: relicensed, today: '2026-06-30' })
    expect(third.licenceChanged).toEqual([{ family: 'Beta', from: 'OFL-1.1', to: 'Apache-2.0' }])
    expect(third.written).toContain(CATALOGUE_JSON_REL)
    expect(readJson(cwd).retrieved).toBe('2026-06-30')
  })

  it('test_UAT_FC_REQ-311_doc_projects_only_servable_families_in_retrieval_groups', async () => {
    const cwd = workspace()
    // Enough Sans Serif families to force a second sub-heading, plus one of each
    // split-out group and one family whose licence is carried but not servable.
    const specs: FamilySpec[] = []
    for (let i = 0; i < GROUP_SIZE + 3; i++) {
      specs.push({ family: `Sans ${i}`, popularity: i + 1 })
    }
    specs.push({ family: 'Slabby', popularity: 100, category: 'Serif', stroke: 'Slab Serif' })
    specs.push({
      family: 'Iconic',
      popularity: 101,
      category: 'Display',
      classifications: ['Symbols'],
    })
    specs.push({ family: 'Noto Sans Thaana', popularity: 102, isNoto: true })
    // A Noto family that is also a symbol font: Symbols wins, because an icon
    // font in the "bold poster face" slate is the failure the split prevents.
    specs.push({
      family: 'Noto Color Emoji',
      popularity: 103,
      classifications: ['Symbols'],
      isNoto: true,
    })
    specs.push({ family: 'Ubuntu', popularity: 104 })

    const metadata = metadataFile(specs)
    const repo = fontsRepo([
      ...specs
        .filter((s) => s.family !== 'Ubuntu')
        .map((s) => ({
          tree: 'ofl',
          slug: s.family.toLowerCase().replace(/[^a-z0-9]/g, ''),
          name: s.family,
          licence: 'OFL',
        })),
      // UFL is catalogued and NOT servable: its modification terms are cleared
      // per family, so the document that reads as permission must not list it.
      { tree: 'ufl', slug: 'ubuntu', name: 'Ubuntu', licence: 'UFL' },
    ])
    await cmdFontsCatalogue({ cwd, metadata, repo, today: '2026-01-01' })

    const projection = projectFontDoc(readJson(cwd))
    expect(projection.body).not.toContain('Ubuntu')
    expect(projection.families).toBe(specs.length - 1)

    // Slab Serif, Symbols and Noto are split out of category, so a slab query is
    // not answered from inside Serif and an icon font is not in the Display slate.
    const groups = Object.fromEntries(projection.groups.map((g) => [g.label, g.families]))
    expect(groups['Slab Serif']).toBe(1)
    expect(groups['Symbols']).toBe(2)
    expect(groups['Noto (script coverage)']).toBe(1)
    expect(groups['Serif']).toBeUndefined()

    // Heading-anchored chunking: the sans group splits at GROUP_SIZE, in usage
    // order, and each sub-heading names its leading families so a retrieval can
    // be recognised from the heading alone.
    const sans = projection.groups.find((g) => g.label === 'Sans Serif')!
    expect(sans.families).toBe(GROUP_SIZE + 3)
    expect(sans.sections).toBe(2)
    expect(projection.body).toContain(`### Sans Serif — 1–${GROUP_SIZE} by usage: Sans 0, Sans 1,`)
    expect(projection.body).toContain(`### Sans Serif — ${GROUP_SIZE + 1}–${GROUP_SIZE + 3} by usage:`)
    expect(projection.body).toContain('## Counts')
    expect(projection.body).toContain('## Known limits of this catalogue')

    // The same body through the CLI's real entry point.
    const exit = await cli(cwd, ['fonts', 'doc', '--stdout'])
    expect(exit).toBe(0)
  })

  it('test_UAT_FC_REQ-311_doc_writes_the_document_once_and_not_again', async () => {
    const cwd = workspace()
    const metadata = metadataFile([
      { family: 'Alpha', popularity: 1 },
      { family: 'Beta', popularity: 2 },
    ])
    const repo = fontsRepo([
      { tree: 'ofl', slug: 'alpha', name: 'Alpha', licence: 'OFL' },
      { tree: 'ofl', slug: 'beta', name: 'Beta', licence: 'OFL' },
    ])
    await cmdFontsCatalogue({ cwd, metadata, repo, today: '2026-01-01' })

    const ticket = {
      uid: 'doc-56',
      id: 'DOC-56',
      body: 'whatever the document used to say',
      fields: { doc_kind: 'system_kb', source: DOC_SOURCE_VALUE },
    }
    const writes: Array<{ uid: string; body: string }> = []
    const first = cmdFontsDoc({
      cwd,
      tickets: [ticket],
      writeBody: (uid, body) => writes.push({ uid, body }),
    })
    expect(first.changed).toBe(true)
    expect(first.ticket).toBe('DOC-56')
    expect(writes).toHaveLength(1)
    expect(writes[0].uid).toBe('doc-56')
    expect(writes[0].body).toContain('**Alpha**')

    // The store strips trailing whitespace on write, so the body that comes back
    // is not byte-identical to the one that went in. A second run must still be
    // a no-op — otherwise every invocation commits the document.
    const stored = { ...ticket, body: writes[0].body.replace(/\s+$/, '') }
    const again = cmdFontsDoc({
      cwd,
      tickets: [stored],
      writeBody: (uid, body) => writes.push({ uid, body }),
    })
    expect(again.changed).toBe(false)
    expect(writes).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-311_doc_target_is_the_document_declaring_the_catalogue_as_its_source', () => {
    const tickets = [
      { uid: 'doc-1', id: 'DOC-1', body: null, fields: { doc_kind: 'system_kb' } },
      {
        uid: 'doc-56',
        id: 'DOC-56',
        body: 'stale',
        fields: { doc_kind: 'system_kb', source: DOC_SOURCE_VALUE },
      },
      // An architecture document naming the same file is NOT the target: the
      // system-KB kind is what admits a document to the assistant's corpus.
      { uid: 'doc-9', id: 'DOC-9', body: null, fields: { doc_kind: 'architecture', source: DOC_SOURCE_VALUE } },
    ]
    expect(resolveFontDocTicket(tickets).id).toBe('DOC-56')

    // Two documents claiming one source has no defensible resolution.
    expect(() =>
      resolveFontDocTicket([
        ...tickets,
        { uid: 'doc-57', id: 'DOC-57', body: null, fields: { doc_kind: 'system_kb', source: DOC_SOURCE_VALUE } },
      ]),
    ).toThrow(/DOC-56, DOC-57/)

    // And none at all is a refusal rather than a silent no-op.
    expect(() => resolveFontDocTicket([tickets[0]])).toThrow(/No system-KB doc ticket/)
  })
})
