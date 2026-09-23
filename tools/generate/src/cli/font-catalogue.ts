/**
 * REQ-311 — `1c fonts catalogue` : the generator behind `fonts/catalogue.json`.
 *
 * The catalogue was produced once, by hand, and committed. Google Fonts gains
 * families continuously, so a catalogue nobody can rebuild is stale from the day
 * it lands — and [[DOC-56]], the system-KB document that tells the assistant
 * which faces it may serve, is projected from it. This module is the missing
 * half: the catalogue is now DERIVED, and the derivation is the artefact.
 *
 * TWO SOURCES, AND EACH ANSWERS EXACTLY ONE QUESTION.
 *
 *   `fonts.google.com/metadata/fonts`  — WHAT EXISTS. The live family list, with
 *       category, stroke, classifications, weights, axes, subsets, designers,
 *       dates and popularity. It is the authority for existence: the repository
 *       carries 2,056 family directories against ~1,946 live families, and the
 *       difference is delisted and sandboxed work that must not be mirrored.
 *
 *   `github.com/google/fonts`          — WHAT ITS LICENCE IS, read from each
 *       family's own `METADATA.pb`. It is the authority for licence, and for
 *       nothing else.
 *
 * LICENCE IS NEVER RESOLVED BY DIRECTORY JOIN, and that is the whole reason this
 * file exists rather than a shell script. The one-off script joined the live list
 * to the repo's licence directories (`ofl/`, `apache/`, `ufl/`) on a normalised
 * slug, and six families did not join: the `Edu *` set was renamed upstream, so
 * `Edu NSW ACT Cursive` does not match the directory `edunswactfoundation`. They
 * were resolved by directory PREFIX — every `edu*` directory happens to sit under
 * `ofl/` — and a licence decided by a happy accident of directory layout is a
 * silent misattribution waiting for the first family that breaks the pattern.
 *
 * So the join is on the name each `METADATA.pb` declares FOR ITSELF, and a family
 * that does not join is EXCLUDED AND REPORTED, never defaulted. That rule has
 * teeth on exactly the families that motivated it: the six renamed `Edu` families
 * have no `METADATA.pb` under any name — the live service serves them from
 * directories (`edunswactcursive`) that do not exist in the repository at all —
 * so they leave the catalogue and are named in the report. A shorter catalogue we
 * can justify beats a longer one we cannot.
 *
 * WHY A PARTIAL CLONE RATHER THAN 2,000 HTTP GETS. Reading each family's own
 * `METADATA.pb` means reading ~2,031 files. Fetching them individually is two
 * thousand round trips into GitHub's rate limiter; cloning the repository whole
 * is gigabytes of font binaries. A blobless partial clone with a sparse checkout
 * naming each tree's per-family METADATA.pb is neither: ~5 MB and a couple of
 * seconds, because git
 * fetches exactly the blobs the checkout names, in one batch.
 *
 * NOTHING IS WRITTEN UNTIL BOTH SOURCES HAVE ANSWERED. A half-written catalogue
 * is worse than a stale one — it reads as current and is not — so every fetch,
 * parse and join happens in memory, and the first byte reaches disk only once a
 * complete catalogue exists to write.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathExists } from '../store/fsutil'
import { CommandError } from './errors'

// ── The artefact ─────────────────────────────────────────────────────────────

/** Where the two generated files live, relative to the repo root. */
export const CATALOGUE_JSON_REL = path.join('fonts', 'catalogue.json')
export const CATALOGUE_MD_REL = path.join('fonts', 'CATALOGUE.md')

/** The live family list. */
export const LIVE_METADATA_URL = 'https://fonts.google.com/metadata/fonts'

/** The repository each family's own `METADATA.pb` is read from. */
export const FONTS_REPO_URL = 'https://github.com/google/fonts.git'

/** A variable axis, as both upstream and the catalogue carry it. */
export interface CatalogueAxis {
  tag: string
  min: number
  max: number
}

/** One family. The record shape [[REQ-311]] names, in the order it names it. */
export interface CatalogueEntry {
  family: string
  slug: string
  licence: string
  /**
   * WHERE THE LICENCE CAME FROM — the repo-relative path of the `METADATA.pb`
   * that declared it, e.g. `ofl/roboto/METADATA.pb`.
   *
   * A path rather than a category word ("directory-join", "prefix-inference"):
   * the committed catalogue's `prefix-inference` was a label for a guess, and
   * the point of this generator is that there are no guesses left to label. A
   * path is checkable — the reader can open it — and there is only ever one
   * legitimate value for it, so the field cannot quietly acquire a second
   * meaning the way a vocabulary of source *kinds* invites.
   */
  licence_source: string
  category: string
  /** `Sans Serif` | `Serif` | `Slab Serif`, or null where upstream declares none. */
  stroke: string | null
  classifications: string[]
  weights: number[]
  italic: boolean
  variable: boolean
  axes: CatalogueAxis[]
  subsets: string[]
  designers: string[]
  date_added: string
  popularity_rank: number
  is_noto: boolean
}

/** The document `fonts/catalogue.json` holds. */
export interface Catalogue {
  source: string
  /** ISO date. Only advanced when the family records actually changed. */
  retrieved: string
  family_count: number
  families: CatalogueEntry[]
  caveats: string[]
}

// ── Upstream shapes ──────────────────────────────────────────────────────────

/**
 * One entry of `familyMetadataList`, narrowed to the fields the catalogue reads.
 *
 * Declared structurally rather than imported: there is no published type for
 * this endpoint, and pinning the fields we consume is the check that a shape
 * change is noticed here rather than three transformations downstream.
 */
export interface LiveFamily {
  family: string
  category: string
  stroke: string | null
  classifications: string[]
  subsets: string[]
  /** Keyed by weight with an `i` suffix for italic: `400`, `400i`, `700i`. */
  fonts: Record<string, unknown>
  axes: Array<{ tag: string; min: number; max: number }>
  designers: string[]
  dateAdded: string
  popularity: number
  isNoto: boolean
}

/** A licence as one family's own `METADATA.pb` declares it. */
export interface LicenceRecord {
  /** The SPDX-ish name the catalogue records: `OFL-1.1`, `Apache-2.0`, `UFL-1.0`. */
  licence: string
  /** Repo-relative path of the file that said so. */
  source: string
}

/**
 * The licence index: every family name a `METADATA.pb` declares FOR ITSELF.
 *
 * A name claimed by two files is dropped from the index rather than resolved by
 * order, so an upstream duplicate excludes the family instead of silently
 * picking whichever one `readdir` happened to return first.
 */
export type LicenceIndex = Map<string, LicenceRecord>

/**
 * The two sources, as an injectable pair.
 *
 * The seam exists because the default implementations reach the network and
 * `git`, and a UAT that did the same would be testing Google's uptime. It is
 * also a real operator affordance rather than test scaffolding: `--metadata` and
 * `--repo` point the same command at a saved snapshot, which is how a refresh is
 * re-run and inspected without pulling 2,000 files again.
 */
export interface CatalogueSources {
  liveFamilies(): Promise<LiveFamily[]>
  licences(): Promise<LicenceIndex>
}

/** The `license:` tokens `METADATA.pb` uses, and what the catalogue calls them. */
export const LICENCE_NAMES: Readonly<Record<string, string>> = {
  OFL: 'OFL-1.1',
  APACHE2: 'Apache-2.0',
  UFL: 'UFL-1.0',
}

// ── Default sources ──────────────────────────────────────────────────────────

/**
 * Parse the live family list.
 *
 * Google serves some of these endpoints with an XSSI-defeating `)]}'` prefix and
 * some without, so the prefix is stripped when present rather than assumed
 * either way — the shape of the guard is cheaper than the shape of the outage.
 */
export function parseLiveMetadata(raw: string): LiveFamily[] {
  const body = raw.replace(/^\)\]\}'\s*/, '')
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch (err) {
    throw new CommandError({
      code: 'ENVIRONMENT',
      message: `Google Fonts metadata is not JSON: ${(err as Error).message}`,
      hint: `Expected the document served at ${LIVE_METADATA_URL}.`,
    })
  }
  const list = (parsed as { familyMetadataList?: unknown }).familyMetadataList
  if (!Array.isArray(list) || list.length === 0) {
    throw new CommandError({
      code: 'ENVIRONMENT',
      message: 'Google Fonts metadata carries no familyMetadataList.',
      hint: `Expected the document served at ${LIVE_METADATA_URL}.`,
    })
  }
  return list as LiveFamily[]
}

/** Read the live family list — from a local snapshot when `from` is a path. */
export async function fetchLiveFamilies(from: string = LIVE_METADATA_URL): Promise<LiveFamily[]> {
  if (!/^https?:/i.test(from)) {
    if (!pathExists(from)) {
      throw new CommandError({
        code: 'NOT_FOUND',
        message: `No Google Fonts metadata snapshot at ${from}.`,
        path: from,
      })
    }
    return parseLiveMetadata(readFileSync(from, 'utf8'))
  }
  let res: Response
  try {
    res = await fetch(from)
  } catch (err) {
    throw new CommandError({
      code: 'ENVIRONMENT',
      message: `Could not reach ${from}: ${(err as Error).message}`,
      hint: 'The catalogue is rebuilt from upstream; nothing was written.',
    })
  }
  if (!res.ok) {
    throw new CommandError({
      code: 'ENVIRONMENT',
      message: `${from} answered ${res.status} ${res.statusText}.`,
      hint: 'The catalogue is rebuilt from upstream; nothing was written.',
    })
  }
  return parseLiveMetadata(await res.text())
}

/**
 * The one field pair this module reads out of a protobuf text file.
 *
 * `METADATA.pb` is protobuf TEXT format and its top-level scalars are one per
 * line, so the two anchored patterns below read them exactly. A real protobuf
 * parser would be a dependency, a schema and a build step to read two strings.
 * Anchoring at line start is what keeps it honest: `name:` also appears indented
 * inside every `fonts { … }` block, and an unanchored match would take the first
 * font file's name instead of the family's.
 */
export function parseMetadataPb(text: string): { name: string; licence: string } | null {
  const name = /^name:\s*"((?:[^"\\]|\\.)*)"/m.exec(text)
  const licence = /^license:\s*"((?:[^"\\]|\\.)*)"/m.exec(text)
  if (!name || !licence) return null
  const mapped = LICENCE_NAMES[licence[1]]
  if (!mapped) return null
  return { name: name[1], licence: mapped }
}

/** Every `<tree>/<family>/METADATA.pb` under a checkout of `google/fonts`. */
export function indexMetadataDir(dir: string): LicenceIndex {
  const index: LicenceIndex = new Map()
  const conflicted = new Set<string>()
  for (const tree of readdirSync(dir, { withFileTypes: true })) {
    if (!tree.isDirectory() || tree.name.startsWith('.')) continue
    const treeDir = path.join(dir, tree.name)
    for (const family of readdirSync(treeDir, { withFileTypes: true })) {
      if (!family.isDirectory()) continue
      const file = path.join(treeDir, family.name, 'METADATA.pb')
      if (!pathExists(file)) continue
      const parsed = parseMetadataPb(readFileSync(file, 'utf8'))
      if (!parsed) continue
      const rel = `${tree.name}/${family.name}/METADATA.pb`
      if (index.has(parsed.name)) {
        // Two files claiming one family name. There is no defensible way to pick
        // between them, so neither is used and the family falls out as
        // undeterminable — the same outcome as no record at all.
        conflicted.add(parsed.name)
        continue
      }
      index.set(parsed.name, { licence: parsed.licence, source: rel })
    }
  }
  for (const name of conflicted) index.delete(name)
  return index
}

/**
 * Read every family's own `METADATA.pb` — from a checkout when `from` is a path.
 *
 * The clone is blobless (`--filter=blob:none`), single-branch, depth 1 and
 * checkout-less, then sparse-checks out only `METADATA.pb`. git then fetches
 * exactly those blobs, in one batch: ~5 MB against the repository's many
 * gigabytes of font binaries.
 *
 * `--template=` is not tidiness. git copies its hook samples into `.git/hooks`
 * at init, and a sandboxed environment can refuse that write while permitting
 * everything else the clone needs; an empty template skips the copy, so the
 * clone stops depending on a directory nobody wants.
 */
export async function fetchLicenceIndex(from: string = FONTS_REPO_URL): Promise<LicenceIndex> {
  if (!/^https?:|^git@/i.test(from)) {
    if (!pathExists(from)) {
      throw new CommandError({
        code: 'NOT_FOUND',
        message: `No google/fonts checkout at ${from}.`,
        path: from,
      })
    }
    return indexMetadataDir(from)
  }

  const work = mkdtempSync(path.join(tmpdir(), '1c-fonts-'))
  const repo = path.join(work, 'fonts')
  try {
    git(work, [
      'clone',
      '--template=',
      '--filter=blob:none',
      '--no-checkout',
      '--depth',
      '1',
      '--single-branch',
      from,
      repo,
    ])
    git(repo, ['sparse-checkout', 'init', '--no-cone'])
    writeFileSync(path.join(repo, '.git', 'info', 'sparse-checkout'), '/*/*/METADATA.pb\n')
    git(repo, ['checkout'])
    const index = indexMetadataDir(repo)
    if (index.size === 0) {
      throw new CommandError({
        code: 'ENVIRONMENT',
        message: `The checkout of ${from} carries no readable METADATA.pb.`,
        hint: 'Licence is read per family; without it nothing can be catalogued.',
      })
    }
    return index
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

/**
 * Run git with the credential helper disabled.
 *
 * The clone is of a public repository and needs no credentials; leaving the
 * helper enabled lets a machine's own keychain fail the clone for a repository
 * that never asked for a password.
 */
function git(cwd: string, args: string[]): void {
  try {
    execFileSync('git', ['-c', 'credential.helper=', ...args], {
      cwd,
      stdio: ['ignore', 'ignore', 'pipe'],
      encoding: 'utf8',
    })
  } catch (err) {
    const detail = (err as { stderr?: string }).stderr ?? (err as Error).message
    throw new CommandError({
      code: 'ENVIRONMENT',
      message: `git ${args[0]} failed: ${String(detail).trim().split('\n').slice(-1)[0]}`,
      hint: 'Reading each family\'s own METADATA.pb needs `git` on PATH and network access. Nothing was written.',
    })
  }
}

/** The default pair: the live endpoint and a fresh partial clone. */
export function defaultSources(opts: { metadata?: string; repo?: string } = {}): CatalogueSources {
  return {
    liveFamilies: () => fetchLiveFamilies(opts.metadata ?? LIVE_METADATA_URL),
    licences: () => fetchLicenceIndex(opts.repo ?? FONTS_REPO_URL),
  }
}

// ── The join ─────────────────────────────────────────────────────────────────

/** `PT Sans` → `ptsans`. The same normalisation Google's own asset paths use. */
export function familySlug(family: string): string {
  return family.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** A family the catalogue refuses to carry, and why. */
export interface ExcludedFamily {
  family: string
  reason: string
}

/**
 * The live list joined to the licence index.
 *
 * Existence comes from the left side and licence from the right, and neither
 * side is allowed to supply the other's answer: a family the live list does not
 * carry is not in the catalogue however many directories hold it, and a family
 * no `METADATA.pb` claims is excluded however obvious its licence looks.
 */
export function joinFamilies(
  live: LiveFamily[],
  licences: LicenceIndex,
): { families: CatalogueEntry[]; excluded: ExcludedFamily[] } {
  const families: CatalogueEntry[] = []
  const excluded: ExcludedFamily[] = []

  for (const f of live) {
    const record = licences.get(f.family)
    if (!record) {
      excluded.push({
        family: f.family,
        reason: 'no METADATA.pb in github.com/google/fonts declares this family name',
      })
      continue
    }
    const weights = [
      ...new Set(Object.keys(f.fonts ?? {}).map((k) => Number.parseInt(k, 10))),
    ]
      .filter((w) => Number.isFinite(w))
      .sort((a, b) => a - b)
    families.push({
      family: f.family,
      slug: familySlug(f.family),
      licence: record.licence,
      licence_source: record.source,
      category: f.category,
      stroke: f.stroke ?? null,
      // SORTED, because upstream's order for these two is not stable between
      // responses and an unsorted copy makes every refresh a diff. Both are sets
      // — membership carries the meaning, order carries none. `designers` is NOT
      // sorted: attribution order is upstream's statement about who did what.
      classifications: [...(f.classifications ?? [])].sort(),
      weights,
      italic: Object.keys(f.fonts ?? {}).some((k) => k.endsWith('i')),
      variable: (f.axes ?? []).length > 0,
      axes: (f.axes ?? [])
        .map((a) => ({ tag: a.tag, min: a.min, max: a.max }))
        .sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0)),
      subsets: [...(f.subsets ?? [])].sort(),
      designers: [...(f.designers ?? [])],
      date_added: f.dateAdded,
      popularity_rank: f.popularity,
      is_noto: f.isNoto === true,
    })
  }

  // Popularity order, so the file reads the way every projection of it groups.
  families.sort((a, b) => a.popularity_rank - b.popularity_rank)
  excluded.sort((a, b) => a.family.localeCompare(b.family))
  return { families, excluded }
}

/**
 * The caveats the catalogue carries about itself.
 *
 * Generated rather than authored, because each one is a statement about THIS
 * run: how many families the licence side could not account for, and how far
 * the repository's family count is from the live one. A caveat list that did not
 * move with the data would be prose pretending to be a measurement.
 */
export function caveatsFor(
  families: CatalogueEntry[],
  excluded: ExcludedFamily[],
  licenceCount: number,
): string[] {
  const caveats = [
    'Licence is read from each family\'s own METADATA.pb in github.com/google/fonts, joined on the ' +
      'family name that file declares for itself. No licence is inferred from a directory name.',
    `The live list carries ${families.length + excluded.length} families; the repository declares ` +
      `${licenceCount}. The live list is the authority for what exists, so delisted and sandboxed ` +
      'families in the repository are not mirrored.',
  ]
  if (excluded.length > 0) {
    caveats.push(
      `${excluded.length} live famil${excluded.length === 1 ? 'y was' : 'ies were'} excluded because ` +
        `no METADATA.pb declares ${excluded.length === 1 ? 'it' : 'them'}: ` +
        `${excluded.map((e) => e.family).join(', ')}. A licence is never defaulted.`,
    )
  }
  caveats.push(
    'Upstream carries no style descriptors — nothing says "geometric", "humanist" or "grotesque". ' +
      'A style query therefore retrieves a category slate rather than a precise match.',
  )
  return caveats
}

// ── What changed ─────────────────────────────────────────────────────────────

/** One family whose licence is not what the previous catalogue recorded. */
export interface LicenceChange {
  family: string
  from: string
  to: string
}

/**
 * What a refresh did to the catalogue.
 *
 * A REFRESH THAT SAYS NOTHING HIDES AN UPSTREAM REMOVAL, which is the change
 * most likely to break a site that is already live — the family simply stops
 * being served, and the only place that fact was ever visible is the diff
 * between two runs of this command.
 */
export interface CatalogueChange {
  added: string[]
  removed: string[]
  licenceChanged: LicenceChange[]
  excluded: ExcludedFamily[]
  /** Whether the family records differ from the previous catalogue at all. */
  changed: boolean
}

export function diffCatalogue(
  previous: Catalogue | null,
  families: CatalogueEntry[],
  excluded: ExcludedFamily[],
): CatalogueChange {
  const before = new Map((previous?.families ?? []).map((f) => [f.family, f]))
  const after = new Map(families.map((f) => [f.family, f]))

  const added = [...after.keys()].filter((k) => !before.has(k)).sort()
  const removed = [...before.keys()].filter((k) => !after.has(k)).sort()
  const licenceChanged: LicenceChange[] = []
  for (const [family, entry] of after) {
    const was = before.get(family)
    if (was && was.licence !== entry.licence) {
      licenceChanged.push({ family, from: was.licence, to: entry.licence })
    }
  }
  licenceChanged.sort((a, b) => a.family.localeCompare(b.family))

  // Full record equality, not just membership: a weight added to an existing
  // family is a change the catalogue must carry, and comparing names alone would
  // call that run a no-op and never rewrite the file.
  const changed =
    previous === null ||
    JSON.stringify(previous.families) !== JSON.stringify(families)

  return { added, removed, licenceChanged, excluded, changed }
}

// ── The human summary ────────────────────────────────────────────────────────

/**
 * Which licences permit shipping the bytes with a customer site.
 *
 * OFL 1.1 and Apache 2.0 both permit bundling and redistribution as part of a
 * larger work. UFL 1.0's modification terms differ and it is cleared per family,
 * so it is carried in the catalogue and excluded from anything that says "you
 * may serve this" — see the projection in `font-doc.ts`.
 */
export const REDISTRIBUTABLE_LICENCES: readonly string[] = ['OFL-1.1', 'Apache-2.0']

/**
 * The argument the catalogue exists to settle, kept with the generator.
 *
 * It is the one block of authored prose here, and it is authored HERE rather
 * than in the file it appears in for the reason every projected document works
 * that way: the file is generated, so a sentence living in it would be erased by
 * the next refresh. One source for one fact; the generator is the source.
 */
const WHY_THIS_FILE = `## Why this file exists

The earlier reading of [[EPIC-21]] was that the assistant needed no font list because "the
model already knows the corpus". **That claim was tested and is false.** A random sample of
40 non-Noto families produced roughly one third the model could describe and two thirds it
could not, and the estimate of corpus size was wrong by hundreds of families.

A corpus the model cannot enumerate is a corpus it will not use. Left to recall alone it
reaches for the same forty faces and every site looks the same. So the list is documented,
committed, queryable — and, since [[REQ-311]], regenerated rather than transcribed.`

const RELATIONSHIP = `## Relationship to \`fonts/registry.yaml\`

Different artifacts, different jobs. The **registry** is the provenance and licence record
over bytes this repository actually holds, and it gates (\`1c fonts check\`). This
**catalogue** is the index of what is available to mirror. A family appears in the registry
only once its bytes are here.`

function tally<T>(items: T[], key: (item: T) => string): Array<[string, number]> {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

/** `1,946` — thousands separated, because these numbers are read by people. */
function n(value: number): string {
  return value.toLocaleString('en-US')
}

/** The human summary: what is here, how it was resolved, and what to distrust. */
export function renderCatalogueMarkdown(catalogue: Catalogue): string {
  const families = catalogue.families
  const redistributable = families.filter((f) => REDISTRIBUTABLE_LICENCES.includes(f.licence))
  const lines: string[] = []

  lines.push('# Google Fonts catalogue — the documented font list')
  lines.push('')
  lines.push('**Generated artifact. Do not hand-edit.** Rebuild it with `1c fonts catalogue`.')
  lines.push('')
  lines.push(`- **Data**: \`fonts/catalogue.json\` — one record per family.`)
  lines.push(`- **Retrieved**: ${catalogue.retrieved}`)
  lines.push(`- **Sources**: ${catalogue.source}`)
  lines.push('')
  lines.push(WHY_THIS_FILE)
  lines.push('')
  lines.push('## What is here')
  lines.push('')
  lines.push('| | |')
  lines.push('|---|---|')
  lines.push(`| Live families catalogued | **${n(families.length)}** |`)
  lines.push(`| Redistributable (${REDISTRIBUTABLE_LICENCES.join(' + ')}) | **${n(redistributable.length)}** |`)
  lines.push(`| Variable (carry at least one axis) | ${n(families.filter((f) => f.variable).length)} |`)
  lines.push(`| Noto families | ${n(families.filter((f) => f.is_noto).length)} |`)
  lines.push('')
  lines.push('### By licence')
  lines.push('')
  lines.push('| Licence | Families | Redistributable in product |')
  lines.push('|---|---|---|')
  for (const [licence, count] of tally(families, (f) => f.licence)) {
    const verdict = REDISTRIBUTABLE_LICENCES.includes(licence)
      ? 'yes — bundling and redistribution explicitly permitted'
      : '**clear individually** — terms differ'
    lines.push(`| ${licence} | ${n(count)} | ${verdict} |`)
  }
  lines.push('')
  lines.push('### By category')
  lines.push('')
  lines.push('| Category | Families |')
  lines.push('|---|---|')
  for (const [category, count] of tally(families, (f) => f.category)) {
    lines.push(`| ${category} | ${n(count)} |`)
  }
  lines.push('')
  lines.push('**Category is an index, not taste.** It is carried so the corpus can be *queried* — you')
  lines.push('cannot search a set you cannot describe. Pairing hints and house shortlists are taste and')
  lines.push('are deliberately absent.')
  lines.push('')
  lines.push('## Record shape')
  lines.push('')
  lines.push('```json')
  lines.push(JSON.stringify(families[0] ?? {}, null, 1))
  lines.push('```')
  lines.push('')
  lines.push('## Top 25 by popularity')
  lines.push('')
  lines.push('| # | Family | Category | Licence | Weights | Axes |')
  lines.push('|---|---|---|---|---|---|')
  families.slice(0, 25).forEach((f, i) => {
    const axes = f.axes.length > 0 ? f.axes.map((a) => a.tag).join(',') : '—'
    lines.push(
      `| ${i + 1} | ${f.family} | ${f.category} | ${f.licence} | ${f.weights.join(',')} | ${axes} |`,
    )
  })
  lines.push('')
  lines.push('## Most recently added (20)')
  lines.push('')
  lines.push('The newest families are the ones a model is least likely to be able to name from recall,')
  lines.push('and they are the clearest argument for a list it can read instead.')
  lines.push('')
  lines.push('| Family | Category | Added |')
  lines.push('|---|---|---|')
  for (const f of [...families].sort((a, b) => b.date_added.localeCompare(a.date_added)).slice(0, 20)) {
    lines.push(`| ${f.family} | ${f.category} | ${f.date_added} |`)
  }
  lines.push('')
  lines.push('## Caveats')
  lines.push('')
  catalogue.caveats.forEach((c, i) => lines.push(`${i + 1}. ${c}`))
  lines.push('')
  lines.push(RELATIONSHIP)
  lines.push('')
  return lines.join('\n')
}

// ── The command ──────────────────────────────────────────────────────────────

export interface CatalogueOptions {
  cwd?: string
  /** Override the two sources — a saved snapshot, or a checkout already on disk. */
  sources?: CatalogueSources
  /** `--metadata`: a URL or a path to a saved copy of the live family list. */
  metadata?: string
  /** `--repo`: a URL or a path to a checkout of google/fonts. */
  repo?: string
  /** The date a refreshed catalogue records. Injectable so a UAT is deterministic. */
  today?: string
}

export interface CatalogueReport extends CatalogueChange {
  jsonPath: string
  mdPath: string
  familyCount: number
  /** Repo-relative paths actually rewritten. Empty when nothing changed. */
  written: string[]
  retrieved: string
}

/** The previous catalogue, or null when there is none (or it is unreadable). */
export function readCatalogue(cwd: string): Catalogue | null {
  const file = path.join(cwd, CATALOGUE_JSON_REL)
  if (!pathExists(file)) return null
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Catalogue
    return Array.isArray(parsed.families) ? parsed : null
  } catch {
    return null
  }
}

/**
 * `1c fonts catalogue` — rebuild `fonts/catalogue.json` and `fonts/CATALOGUE.md`.
 *
 * ORDER IS THE ATOMICITY. Both sources are read and joined before anything is
 * opened for writing, so an unreachable upstream throws with the existing
 * catalogue exactly as it was.
 *
 * A RUN THAT CHANGES NOTHING WRITES NOTHING, including `retrieved`. A refresh
 * date that advanced on every run would make every run a commit, and the diff
 * that is supposed to tell an operator what upstream did would be a date line in
 * a file of two thousand unchanged records.
 */
export async function cmdFontsCatalogue(opts: CatalogueOptions = {}): Promise<CatalogueReport> {
  const cwd = opts.cwd ?? process.cwd()
  const sources = opts.sources ?? defaultSources({ metadata: opts.metadata, repo: opts.repo })

  const [live, licences] = await Promise.all([sources.liveFamilies(), sources.licences()])
  const { families, excluded } = joinFamilies(live, licences)
  if (families.length === 0) {
    throw new CommandError({
      code: 'ENVIRONMENT',
      message: 'No live family could be given a licence from its own METADATA.pb.',
      hint: 'Nothing was written. Check that the google/fonts checkout is complete.',
    })
  }

  const previous = readCatalogue(cwd)
  const change = diffCatalogue(previous, families, excluded)
  const retrieved = change.changed
    ? (opts.today ?? new Date().toISOString().slice(0, 10))
    : (previous?.retrieved ?? opts.today ?? new Date().toISOString().slice(0, 10))

  const catalogue: Catalogue = {
    source: `${LIVE_METADATA_URL} + each family's own METADATA.pb in github.com/google/fonts`,
    retrieved,
    family_count: families.length,
    families,
    caveats: caveatsFor(families, excluded, licences.size),
  }

  const written: string[] = []
  for (const [rel, text] of [
    [CATALOGUE_JSON_REL, `${JSON.stringify(catalogue, null, 1)}\n`],
    [CATALOGUE_MD_REL, renderCatalogueMarkdown(catalogue)],
  ] as const) {
    const file = path.join(cwd, rel)
    const current = pathExists(file) ? readFileSync(file, 'utf8') : null
    if (current === text) continue
    writeFileSync(file, text)
    written.push(rel)
  }

  return {
    ...change,
    jsonPath: path.join(cwd, CATALOGUE_JSON_REL),
    mdPath: path.join(cwd, CATALOGUE_MD_REL),
    familyCount: families.length,
    written,
    retrieved,
  }
}

/** Human rendering of a refresh — what moved, and what was refused. */
export function formatCatalogueReport(report: CatalogueReport): string {
  const lines: string[] = []
  lines.push(
    `fonts catalogue — ${n(report.familyCount)} families, retrieved ${report.retrieved}` +
      (report.written.length === 0 ? ' (no change; nothing rewritten)' : ''),
  )
  if (report.written.length > 0) lines.push(`  wrote: ${report.written.join(', ')}`)

  const section = (title: string, items: string[]) => {
    if (items.length === 0) return
    lines.push('')
    lines.push(`${title} (${items.length}):`)
    for (const item of items) lines.push(`  ${item}`)
  }
  section('Added', report.added)
  section('Removed upstream — delisted, no longer catalogued', report.removed)
  section(
    'Licence changed',
    report.licenceChanged.map((c) => `${c.family}: ${c.from} → ${c.to}`),
  )
  section(
    'Excluded — licence could not be determined',
    report.excluded.map((e) => `${e.family} — ${e.reason}`),
  )

  if (report.added.length + report.removed.length + report.licenceChanged.length === 0) {
    lines.push('')
    lines.push('No families added, removed or relicensed since the last refresh.')
  }
  return lines.join('\n')
}
