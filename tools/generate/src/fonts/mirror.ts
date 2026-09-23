/**
 * [[REQ-312]] — `1c fonts mirror`: the platform font corpus, acquired.
 *
 * [[DOC-56]] tells the assistant 1,900-odd families are available to serve, and
 * before this command none of their bytes existed anywhere in the system. This
 * is the half that makes the document true.
 *
 * ACQUIRED LIKE A DEPENDENCY, NOT REBUILT LIKE AN ARTIFACT. The corpus is GB
 * scale and changes when upstream does, not when our code does, so this is a verb
 * in the build toolset beside `1c kb build` rather than a step in every build.
 * Three properties follow, and each is a behaviour rather than an intention:
 *
 *   - **Incremental.** A file whose upstream bytes are unchanged and whose staged
 *     `woff2` is still present and intact is not re-read, not re-compressed and
 *     not re-written. Re-running against an unchanged catalogue therefore
 *     transfers nothing, which is what makes a refresh affordable.
 *   - **Pinned.** The manifest records the catalogue it was built from and the
 *     upstream commit it was taken at, so two deployments built from the same
 *     commit serve the same faces. Typography that depended on the day a
 *     deployment was built would be a site changing under its owner.
 *   - **Subtractive only on purpose.** A family that has left upstream is
 *     REPORTED and its manifest entry RETAINED. Dropping it silently would
 *     un-register a face a live site is serving this minute, turning a licence
 *     question into a broken page.
 *
 * THE BYTES ARE STAGED, NOT COMMITTED. `fonts/mirror/` is a build product on the
 * way to R2 and is gitignored; `fonts/platform.json` — every path, size and
 * digest — is what the repository carries. See `publish.ts` for the other half.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  validatePlatformFontManifest,
  type PlatformFontFamily,
  type PlatformFontFile,
  type PlatformFontManifest,
} from '@1stcontact/site-schema'
import { pathExists } from '../store/fsutil'
import {
  loadCatalogue,
  mirroredLicence,
  redistributableFamilies,
  upstreamDir,
  type Catalogue,
  type CatalogueFamily,
} from './catalogue'
import {
  readUpstreamFamily,
  readUpstreamFile,
  sha256,
  upstreamFamilyExists,
  UpstreamError,
} from './upstream'
import { roundTripDifferences, sfntToWoff2 } from './woff2'

/** Where the generated platform tier lives, relative to the repo root. */
export const MANIFEST_REL = path.join('fonts', 'platform.json')

/** Where converted bytes are staged on their way to R2. Gitignored. */
export const MIRROR_DIR_REL = path.join('fonts', 'mirror')

/** The upstream this mirror is taken from — recorded in the manifest, not configurable. */
export const UPSTREAM_REPO = 'https://github.com/google/fonts'

/** The aggregate licence index, staged at the mirror root. */
export const LICENCE_INDEX_FILE = 'LICENSES.txt'

export function manifestPath(cwd: string): string {
  return path.join(cwd, MANIFEST_REL)
}

export function mirrorDir(cwd: string): string {
  return path.join(cwd, MIRROR_DIR_REL)
}

/** Whether this checkout has a populated platform mirror at all. */
export function manifestExists(cwd: string): boolean {
  return pathExists(manifestPath(cwd))
}

/**
 * Read `fonts/platform.json`, or `null` when the mirror has never been populated.
 *
 * NULL IS AN ANSWER, not an error: a fresh checkout has no mirror, and a gate
 * that refused to run without one would make every clone of this repository fail
 * a licence check over a build product. What must never happen is the mirror's
 * absence going UNSAID — see `formatFontsReport`.
 */
export function loadPlatformManifest(cwd: string): PlatformFontManifest | null {
  const file = manifestPath(cwd)
  if (!pathExists(file)) return null
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as unknown
  const result = validatePlatformFontManifest(parsed)
  if (!result.ok) {
    const first = result.errors[0]
    throw new Error(
      `${MANIFEST_REL} is structurally invalid at ${first.path}: ${first.message}. ` +
        'It is generated — re-run `1c fonts mirror` rather than editing it.',
    )
  }
  return result.value
}

// ── The run ──────────────────────────────────────────────────────────────────

export interface MirrorOptions {
  /** Repo root — where `fonts/` lives. */
  cwd: string
  /** A `google/fonts` checkout. */
  checkout: string
  /** The upstream commit, recorded as the pin. */
  ref: string
  /** Mirror only these slugs. For a targeted refresh, not for a partial corpus. */
  only?: string[]
  /** Brotli quality. Lower trades mirror size for wall-clock on a refresh. */
  quality?: number
  /** Today, as `YYYY-MM-DD`. Passed in so a run is reproducible under test. */
  today: string
  onProgress?: (line: string) => void
}

/** A family the mirror could not take, and why — never a silent omission. */
export interface MirrorFailure {
  family: string
  reason: string
}

export interface MirrorReport {
  manifestPath: string
  mirrorDir: string
  /** Families in the manifest after this run. */
  families: number
  /** Files converted and written by THIS run. */
  written: number
  /** Files already present, identical, and therefore not transferred. */
  unchanged: number
  /** Total bytes of `woff2` the mirror now holds. */
  bytes: number
  /**
   * Catalogue families whose upstream directory is gone, with their manifest
   * entries retained. A live site may be serving one of these right now.
   */
  removedUpstream: string[]
  /** Families in the manifest the catalogue no longer lists — retained for the same reason. */
  delisted: string[]
  failures: MirrorFailure[]
}

/** The variable axes a release filename declares: `Roboto[wdth,wght].ttf` → `['wdth','wght']`. */
export function axesFromFilename(filename: string): string[] | undefined {
  const brackets = /\[([^\]]+)\]/.exec(filename)
  if (!brackets) return undefined
  const tags = brackets[1]
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t !== '')
  return tags.length > 0 ? tags : undefined
}

/** `Roboto[wdth,wght].ttf` → `Roboto[wdth,wght].woff2`. The provenance stays legible in the name. */
function mirroredFilename(upstream: string): string {
  return `${upstream.replace(/\.(ttf|otf)$/i, '')}.woff2`
}

/**
 * Build or refresh the mirror.
 *
 * Failures are COLLECTED, not thrown. One family whose `METADATA.pb` upstream has
 * broken must not abandon 1,900 others halfway through a GB-scale run — and the
 * one thing that would be worse than a partial mirror is a partial mirror nobody
 * was told about, which is why every one of them is named in the report.
 */
export function runMirror(options: MirrorOptions): MirrorReport {
  const { cwd, checkout, ref, quality, today } = options
  const progress = options.onProgress ?? (() => {})
  const catalogue: Catalogue = loadCatalogue(cwd)
  const previous = loadPlatformManifest(cwd)
  const previousBySlug = new Map((previous?.families ?? []).map((f) => [f.slug, f]))

  const only = options.only && options.only.length > 0 ? new Set(options.only) : null
  const wanted = redistributableFamilies(catalogue)

  const staged = mirrorDir(cwd)
  mkdirSync(staged, { recursive: true })

  const families: PlatformFontFamily[] = []
  const removedUpstream: string[] = []
  const failures: MirrorFailure[] = []
  let written = 0
  let unchanged = 0

  for (const entry of wanted) {
    if (only && !only.has(entry.slug)) {
      // Not in this run's scope: carry the previous answer forward untouched, so a
      // targeted refresh cannot amputate the rest of the corpus.
      const kept = previousBySlug.get(entry.slug)
      if (kept) {
        families.push(kept)
        unchanged += kept.files.length
      }
      continue
    }

    const dir = upstreamDir(entry)
    if (!upstreamFamilyExists(checkout, dir)) {
      removedUpstream.push(entry.family)
      const kept = previousBySlug.get(entry.slug)
      if (kept) families.push(kept)
      continue
    }

    try {
      const family = mirrorFamily({
        cwd,
        checkout,
        ref,
        today,
        quality,
        entry,
        dir,
        previous: previousBySlug.get(entry.slug),
        staged,
        onWrite: (file) => {
          written += 1
          progress(`  + ${file}`)
        },
        onUnchanged: () => {
          unchanged += 1
        },
      })
      families.push(family)
    } catch (err) {
      const reason = err instanceof UpstreamError || err instanceof Error ? err.message : String(err)
      failures.push({ family: entry.family, reason })
      // A family that failed this run keeps whatever it had, on the same
      // reasoning as one removed upstream: a live site may be serving it.
      const kept = previousBySlug.get(entry.slug)
      if (kept) families.push(kept)
    }
  }

  // Manifest families the catalogue has stopped listing. Retained and reported —
  // the catalogue is the authority on what MAY be offered, not on what is already
  // being served.
  const catalogued = new Set(wanted.map((f) => f.slug))
  const delisted: string[] = []
  for (const [slug, family] of previousBySlug) {
    if (catalogued.has(slug)) continue
    delisted.push(family.family)
    families.push(family)
    unchanged += family.files.length
  }

  families.sort((a, b) => a.slug.localeCompare(b.slug))

  const manifest: PlatformFontManifest = {
    catalogue: { retrieved: catalogue.retrieved, family_count: catalogue.family_count },
    upstream: { repo: UPSTREAM_REPO, ref },
    format: { container: 'woff2', source: 'sfnt', transform: 'none' },
    families,
  }

  writeFileSync(manifestPath(cwd), `${JSON.stringify(manifest, null, 1)}\n`)
  writeFileSync(path.join(staged, LICENCE_INDEX_FILE), licenceIndex(manifest, today))

  return {
    manifestPath: manifestPath(cwd),
    mirrorDir: staged,
    families: families.length,
    written,
    unchanged,
    bytes: families.reduce((n, f) => n + f.files.reduce((m, file) => m + file.bytes, 0), 0),
    removedUpstream,
    delisted,
    failures,
  }
}

interface MirrorFamilyOptions {
  cwd: string
  checkout: string
  ref: string
  today: string
  quality?: number
  entry: CatalogueFamily
  dir: string
  previous?: PlatformFontFamily
  staged: string
  onWrite: (file: string) => void
  onUnchanged: () => void
}

/** Mirror one family: its release files, converted, plus its own licence notice. */
function mirrorFamily(options: MirrorFamilyOptions): PlatformFontFamily {
  const { cwd, checkout, ref, today, quality, entry, dir, previous, staged } = options
  const upstream = readUpstreamFamily(checkout, dir)
  const licence = mirroredLicence(entry)
  if (!licence) throw new Error(`'${entry.licence}' is not a mirrored licence.`)

  const familyDir = path.join(staged, entry.slug)
  mkdirSync(familyDir, { recursive: true })

  const previousByPath = new Map((previous?.files ?? []).map((f) => [f.path, f]))
  const files: PlatformFontFile[] = []
  const copyrights: string[] = []

  for (const release of upstream.files) {
    if (release.copyright && !copyrights.includes(release.copyright)) copyrights.push(release.copyright)

    const mirroredName = mirroredFilename(release.filename)
    const relPath = `${entry.slug}/${mirroredName}`
    const target = path.join(familyDir, mirroredName)

    const source = readUpstreamFile(checkout, dir, release.filename)
    const upstreamDigest = sha256(source)

    // The incremental case, and the whole reason a refresh is affordable: the
    // upstream bytes are the ones this manifest was built from AND the staged file
    // is still exactly what the manifest says it is. Either half failing means the
    // work has to be redone — a half-written `woff2` from an interrupted run is the
    // case the second half exists for.
    const carried = previousByPath.get(relPath)
    if (carried && carried.upstream_sha256 === upstreamDigest && pathExists(target)) {
      if (sha256(readFileSync(target)) === carried.sha256) {
        files.push(carried)
        options.onUnchanged()
        continue
      }
    }

    const woff2 = sfntToWoff2(source, quality)
    const differences = roundTripDifferences(source, woff2)
    if (differences.length > 0) {
      // The mirror's whole licence posture is that the repackaging took nothing
      // away. A file that cannot demonstrate it is not written — an unmirrored
      // family is a reported gap, while a silently modified one is a redistribution
      // of a modified font under its reserved name.
      throw new Error(
        `${dir}/${release.filename} did not survive the round trip (${differences.join('; ')}).`,
      )
    }
    writeFileSync(target, woff2)
    options.onWrite(relPath)

    files.push({
      path: relPath,
      upstream: release.filename,
      ...(release.weight === undefined ? {} : { weight: release.weight }),
      style: release.style,
      ...(axesFromFilename(release.filename) === undefined
        ? {}
        : { axes: axesFromFilename(release.filename) }),
      bytes: woff2.length,
      sha256: sha256(woff2),
      upstream_sha256: upstreamDigest,
    })
  }

  if (files.length === 0) throw new Error(`${dir} produced no mirrored files.`)

  // The notice travels WITH the bytes, which is the obligation discharged rather
  // than recorded: it is copied into the family's own directory so the licence is
  // served from beside the font, not only indexed at the origin root.
  const licenceText = readUpstreamFile(checkout, dir, upstream.licenceFile)
  writeFileSync(path.join(familyDir, upstream.licenceFile), licenceText)

  // Any staged file this family no longer ships is removed, so the mirror cannot
  // accumulate faces upstream has withdrawn from a family it still publishes.
  for (const stale of previousByPath.keys()) {
    if (files.some((f) => f.path === stale)) continue
    rmSync(path.join(cwd, MIRROR_DIR_REL, stale), { force: true })
  }

  return {
    family: entry.family,
    slug: entry.slug,
    licence,
    upstream_dir: dir,
    source: `${UPSTREAM_REPO}/tree/${ref}/${dir}`,
    copyright: copyrights,
    licence_file: `${entry.slug}/${upstream.licenceFile}`,
    mirrored: today,
    files,
  }
}

/**
 * `LICENSES.txt` — the aggregate index served at the origin root.
 *
 * The PER-FAMILY licence file discharges the OFL obligation, because that is the
 * notice travelling with the distribution. THIS makes the whole mirror auditable
 * in one request: every family it serves, under what licence, whose copyright,
 * and where the bytes came from.
 */
export function licenceIndex(manifest: PlatformFontManifest, today: string): string {
  const lines: string[] = [
    '1st Contact — platform font mirror',
    '',
    `Generated ${today} from ${manifest.upstream.repo} at ${manifest.upstream.ref},`,
    `against the font catalogue retrieved ${manifest.catalogue.retrieved}.`,
    '',
    `${manifest.families.length} families are served from this origin. Every one of them is`,
    'licensed under the SIL Open Font License 1.1 or the Apache License 2.0, both of',
    'which permit redistribution as part of a larger work.',
    '',
    'The bytes are the upstream release files repackaged into the WOFF2 container and',
    'nothing else: no subsetting, no renaming, no table removed. Each family\'s full',
    'licence text is served beside its bytes at the path named below.',
    '',
  ]
  for (const family of manifest.families) {
    lines.push('─'.repeat(72))
    lines.push(`${family.family} — ${family.licence}`)
    for (const notice of family.copyright) lines.push(`  ${notice}`)
    lines.push(`  Licence: /_fonts/${family.licence_file}`)
    lines.push(`  Source:  ${family.source}`)
    lines.push('')
  }
  return lines.join('\n')
}
