/**
 * [[REQ-313]] — `1c fonts index`: the mirror, projected into what the assistant reads.
 *
 * `fonts/platform.json` is written to be complete: every file, its byte count and
 * two digests, because `1c fonts publish` has to know what it already sent and a
 * reader has to be able to prove the served bytes are the described ones. None of
 * that answers a question `use_font` asks, and all of it would have to be carried
 * into a Worker bundle to be asked.
 *
 * So the manifest is projected — joined to `fonts/catalogue.json`, which holds the
 * facts the mirror has no reason to: the category a family belongs to, the weights
 * it names, and the ranges its variable axes cover. Those are [[DOC-56]]'s facts,
 * and [[DOC-56]] is generated from the catalogue.
 *
 * A PROJECTION AND NOT A SECOND SOURCE. Nothing here decides anything: every path
 * comes from the manifest and every range from the catalogue, so the index cannot
 * describe a file the mirror did not write or a weight the catalogue does not
 * name. `1c fonts check` re-runs this projection and compares — an index left
 * behind by a refreshed mirror is a reported violation, because the symptom
 * otherwise is an assistant binding a `src` that 404s.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { PlatformFontManifest, PlatformLicence } from '@1stcontact/site-schema'
import type {
  IndexedAxis,
  IndexedFace,
  IndexedFamily,
  PlatformFontIndex,
} from '../cli/ai/platform-fonts'
import { pathExists } from '../store/fsutil'
import { catalogueExists, loadCatalogue, type CatalogueFamily } from './catalogue'
import { loadPlatformManifest } from './mirror'

/**
 * Where the projection lives — inside the tool's own source tree, beside
 * `l1-surface.json` and for the same reason (REQ-146). A Worker carries what the
 * bundler can see, and the bundler sees imports rather than repository paths.
 */
export const INDEX_REL = path.join('tools', 'generate', 'src', 'cli', 'ai', 'platform-fonts.json')

export function indexPath(cwd: string): string {
  return path.join(cwd, INDEX_REL)
}

/** The index as this checkout holds it, or `null` when the file is missing. */
export function loadIndexFile(cwd: string): PlatformFontIndex | null {
  const file = indexPath(cwd)
  if (!pathExists(file)) return null
  return JSON.parse(readFileSync(file, 'utf8')) as PlatformFontIndex
}

/** The catalogue keyed by slug, which is what the manifest carries. */
function catalogueBySlug(cwd: string): Map<string, CatalogueFamily> {
  if (!catalogueExists(cwd)) return new Map()
  return new Map(loadCatalogue(cwd).families.map((f) => [f.slug, f]))
}

/**
 * The axes a family carries, with their ranges.
 *
 * A tag with no range is dropped rather than defaulted. "This family has a `wght`
 * axis of unknown extent" cannot be acted on — the one thing the range is for is
 * deciding whether weight 550 resolves — and an invented range would resolve it
 * wrongly and silently.
 */
function axesOf(family: CatalogueFamily | undefined): IndexedAxis[] | undefined {
  const axes = (family?.axes ?? [])
    .filter((a): a is { tag: string; min: number; max: number } =>
      typeof a.min === 'number' && typeof a.max === 'number',
    )
    .map((a) => ({ tag: a.tag, min: a.min, max: a.max }))
  return axes.length > 0 ? axes : undefined
}

/** One manifest file, reduced to what choosing between faces needs. */
function faceOf(file: PlatformFontManifest['families'][number]['files'][number]): IndexedFace {
  return {
    path: file.path,
    ...(file.weight === undefined ? {} : { weight: file.weight }),
    ...(file.style === undefined ? {} : { style: file.style }),
    ...((file.axes?.length ?? 0) > 0 ? { variable: true as const } : {}),
  }
}

/**
 * The weights a family names.
 *
 * The catalogue's list is preferred because it is what [[DOC-56]] tells the
 * assistant; the manifest's own `weight` values are the fallback for a family the
 * catalogue no longer carries, which is the state [[REQ-312]] deliberately leaves
 * a withdrawn family in rather than dropping it while a live site serves it.
 */
function weightsOf(
  catalogued: CatalogueFamily | undefined,
  faces: readonly IndexedFace[],
): number[] {
  if (catalogued?.weights?.length) return [...catalogued.weights].sort((a, b) => a - b)
  return [...new Set(faces.map((f) => f.weight).filter((w): w is number => w !== undefined))].sort(
    (a, b) => a - b,
  )
}

/** Project one manifest family. */
function familyOf(
  entry: PlatformFontManifest['families'][number],
  catalogued: CatalogueFamily | undefined,
): IndexedFamily {
  const faces = entry.files.map(faceOf)
  return {
    family: entry.family,
    slug: entry.slug,
    // A family the catalogue has dropped keeps its bytes and loses its
    // classification; `Display` is the honest placeholder for "unclassified", and
    // it falls back to `sans-serif` in a painted stack.
    category: catalogued?.category ?? 'Display',
    // [[REQ-314]] — carried only where it is true, so an ordinary family's
    // projection is byte-identical to what it was before the chip existed.
    ...(catalogued?.stroke === 'Slab Serif' ? { slab: true as const } : {}),
    licence: entry.licence as PlatformLicence,
    weights: weightsOf(catalogued, faces),
    italic: catalogued?.italic ?? faces.some((f) => f.style === 'italic'),
    ...(axesOf(catalogued) ? { axes: axesOf(catalogued) } : {}),
    faces,
  }
}

/** The projection, from whatever this checkout holds. */
export function buildIndex(cwd: string): PlatformFontIndex {
  const manifest = loadPlatformManifest(cwd)
  if (!manifest) return { mirror: null, families: [] }
  const catalogued = catalogueBySlug(cwd)
  return {
    mirror: { catalogue: manifest.catalogue.retrieved, upstream: manifest.upstream.ref },
    families: manifest.families.map((entry) => familyOf(entry, catalogued.get(entry.slug))),
  }
}

/**
 * The bytes the index file holds for a given projection.
 *
 * ONE SERIALISATION, because `1c fonts check` decides whether the committed file
 * is current by comparing text. Two spellings of the same object would make an
 * unchanged mirror look stale on whichever machine formatted it differently.
 */
export function serialiseIndex(index: PlatformFontIndex): string {
  return JSON.stringify(index) + '\n'
}

export interface IndexReport {
  /** Whether the mirror exists at all. */
  populated: boolean
  families: number
  faces: number
  /** Families the manifest holds that the catalogue does not classify. */
  unclassified: string[]
  /** Families whose named weights no mirrored file can draw. */
  undrawable: string[]
  /** Whether the file on disk changed. */
  written: boolean
  path: string
}

/**
 * Compare a projection against the committed file, without writing.
 *
 * This is what makes the index a checked artifact rather than a remembered step:
 * a mirror refreshed without re-running the projection leaves the assistant
 * binding paths nothing serves, and that failure is invisible from every side
 * except this comparison.
 */
export function indexIsCurrent(cwd: string): boolean {
  const file = indexPath(cwd)
  if (!pathExists(file)) return false
  return readFileSync(file, 'utf8') === serialiseIndex(buildIndex(cwd))
}

/** Which families the projection could not fully account for. */
function gaps(index: PlatformFontIndex, cwd: string): { unclassified: string[]; undrawable: string[] } {
  const catalogued = catalogueBySlug(cwd)
  const unclassified: string[] = []
  const undrawable: string[] = []
  for (const family of index.families) {
    if (!catalogued.has(family.slug)) unclassified.push(family.family)
    const styles = new Set(family.faces.map((f) => f.style ?? 'normal'))
    const variable = family.faces.some((f) => f.variable)
    const drawable =
      variable ||
      family.weights.some((w) =>
        [...styles].some((s) => family.faces.some((f) => (f.style ?? 'normal') === s && f.weight === w)),
      )
    if (!drawable) undrawable.push(family.family)
  }
  return { unclassified: unclassified.sort(), undrawable: undrawable.sort() }
}

/** Build the projection and write it, reporting what it found. */
export function cmdFontsIndex(cwd: string = process.cwd()): IndexReport {
  const index = buildIndex(cwd)
  const bytes = serialiseIndex(index)
  const file = indexPath(cwd)
  const written = !pathExists(file) || readFileSync(file, 'utf8') !== bytes
  if (written) {
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, bytes)
  }
  return {
    populated: index.mirror !== null,
    families: index.families.length,
    faces: index.families.reduce((n, f) => n + f.faces.length, 0),
    ...gaps(index, cwd),
    written,
    path: INDEX_REL,
  }
}

/** Human rendering of an index build. */
export function formatIndexReport(report: IndexReport): string {
  if (!report.populated) {
    return [
      `fonts index — NOT POPULATED: no mirror to project.`,
      `  ${report.path} now describes no families, which is what a deployment with no mirror serves.`,
      '  Run `1c fonts mirror --repo <google/fonts checkout>` first.',
    ].join('\n')
  }
  const lines = [
    `fonts index — ${report.families} famil${report.families === 1 ? 'y' : 'ies'}, ` +
      `${report.faces} face(s) → ${report.path}`,
    report.written ? '  written' : '  unchanged',
  ]
  if (report.unclassified.length > 0) {
    lines.push(
      `  ${report.unclassified.length} famil${report.unclassified.length === 1 ? 'y is' : 'ies are'} not in the catalogue ` +
        `(kept, unclassified): ${report.unclassified.slice(0, 8).join(', ')}${report.unclassified.length > 8 ? ', …' : ''}`,
    )
  }
  if (report.undrawable.length > 0) {
    lines.push(
      `  ${report.undrawable.length} famil${report.undrawable.length === 1 ? 'y has' : 'ies have'} no file for any weight they name: ` +
        `${report.undrawable.slice(0, 8).join(', ')}${report.undrawable.length > 8 ? ', …' : ''}`,
    )
  }
  return lines.join('\n')
}
