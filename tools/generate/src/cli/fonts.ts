/**
 * REQ-101 — `1c fonts` : the enforcement half of the font provenance registry.
 *
 * The registry (`fonts/registry.yaml`, schema in `@1stcontact/site-schema`)
 * records where every font file came from and what its licence permits. Without
 * a gate that file is documentation, and documentation drifts — so `1c fonts
 * check` joins every site's `l1.resources.fonts` against the registry and fails
 * on anything un-provenanced.
 *
 * The check is *project* level, not per-site: licence obligations attach to the
 * font, not to the site that happens to reference it, so both the git-tracked
 * `sites/` tree and the gitignored `sandbox/` scratch tree are scanned in one
 * pass. Sandbox reproduction sites carry capture-derived fonts whose terms are
 * often unclear, and that is precisely the state the registry exists to record.
 *
 * Registration is *provenance, not approval*. A registered family with an open
 * `actions` entry warns; it does not fail. The blocking gate is
 * `licence.redistribute_in_product`, and it fires only for a site declaring
 * `config.distribution: "product"` — the "may I ship this to 10,000 customer
 * sites" question, which has a different answer from "may I use this here".
 */

import path from 'node:path'
import { readFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import type { FontRegistry, FontRegistryEntry, L1FontFace, Page } from '@1stcontact/site-schema'
import { validateFontRegistry } from '@1stcontact/site-schema'
import { listDirs, listFilesRel, pathExists } from '../store/fsutil'
import { draftDir, type Root, type StoreContext } from '../store/paths'
import { loadSite } from '../store/loadSite'
import { CommandError } from './errors'

/** Where the registry lives, relative to the repo root. */
export const REGISTRY_REL = path.join('fonts', 'registry.yaml')

export function registryPath(cwd: string): string {
  return path.join(cwd, REGISTRY_REL)
}

/**
 * Read and validate `fonts/registry.yaml`. A missing or malformed registry is a
 * hard error rather than an empty result: silently checking against nothing
 * would report a clean pass over completely un-provenanced fonts.
 */
export function loadFontRegistry(cwd: string): FontRegistry {
  const file = registryPath(cwd)
  if (!pathExists(file)) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Font registry not found at ${REGISTRY_REL}.`,
      path: REGISTRY_REL,
      hint: 'Every font file in the project must be registered. Create the registry with a `fonts:` list.',
    })
  }

  let parsed: unknown
  try {
    parsed = parseYaml(readFileSync(file, 'utf8'))
  } catch (err) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `Font registry is not valid YAML: ${(err as Error).message}`,
      path: REGISTRY_REL,
    })
  }

  const result = validateFontRegistry(parsed)
  if (!result.ok) {
    const first = result.errors[0]
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `Font registry is structurally invalid: ${first.message}`,
      path: `${REGISTRY_REL}${first.path}`,
      hint: `${result.errors.length} issue(s); each entry needs family, foundry, source, downloaded, licence and files.`,
    })
  }
  return result.value
}

// ── The join ─────────────────────────────────────────────────────────────────

/** One `resources.fonts[]` entry, tagged with the site and page that carry it. */
export interface FontUsage {
  root: Root
  slug: string
  /** `'product'` when the site declares product distribution, else `'internal'`. */
  distribution: 'internal' | 'product'
  pageSlug: string
  family: string
  src: string
  /** `src` reduced to the asset basename the registry's `files[].path` records. */
  file: string
}

/** A font file present in the source trees, with every location holding it. */
export interface FontFileOnDisk {
  /** Asset basename — the key the registry's `files[].path` records. */
  file: string
  /** Repo-relative paths holding this file, sorted. */
  locations: string[]
}

export type ViolationKind =
  | 'unregistered-family'
  | 'unregistered-file'
  | 'unprovenanced-file'
  | 'redistribution-not-permitted'

export interface FontViolation {
  kind: ViolationKind
  /** Present when the violation came from a page's font reference. */
  usage?: FontUsage
  /** Present when the violation came from the on-disk scan. */
  file?: FontFileOnDisk
  message: string
  hint: string
}

export interface FontWarning {
  family: string
  /** The sites that reference this family, so an open action has a blast radius. */
  usedBy: string[]
  actions: string[]
}

export interface FontsCheckReport {
  pass: boolean
  registryPath: string
  /** Families in the registry, whether referenced or not. */
  registered: string[]
  /** Every font reference found across every site, in scan order. */
  usages: FontUsage[]
  /** Every font file present in the source trees, by basename. */
  filesOnDisk: FontFileOnDisk[]
  violations: FontViolation[]
  warnings: FontWarning[]
}

/** `/assets/satoshi-400.woff2` → `satoshi-400.woff2`; a bare URL keeps its tail. */
export function assetBasename(src: string): string {
  const withoutQuery = src.split(/[?#]/, 1)[0]
  const tail = withoutQuery.split('/').pop() ?? withoutQuery
  return tail
}

/** Index the registry by family. A duplicated family is a registry authoring bug. */
function indexByFamily(registry: FontRegistry): Map<string, FontRegistryEntry> {
  const byFamily = new Map<string, FontRegistryEntry>()
  for (const entry of registry.fonts) {
    if (byFamily.has(entry.family)) {
      throw new CommandError({
        code: 'CONFLICT',
        message: `Font registry declares family '${entry.family}' more than once.`,
        path: REGISTRY_REL,
        hint: 'Merge the duplicate entries — one family, one provenance record.',
      })
    }
    byFamily.set(entry.family, entry)
  }
  return byFamily
}

/**
 * Collect every `l1.resources.fonts` reference across both site trees.
 *
 * A site whose definition does not currently validate is skipped rather than
 * thrown on: a font-licence gate must not be the thing that reports an unrelated
 * schema error, and the site's own commands already surface that.
 */
export function collectFontUsages(cwd: string): FontUsage[] {
  const usages: FontUsage[] = []
  for (const root of ['sites', 'sandbox'] as const) {
    const ctx: StoreContext = { cwd, root }
    const treeDir = path.join(cwd, 'storage', root)
    if (!pathExists(treeDir)) continue
    for (const slug of listDirs(treeDir)) {
      if (!pathExists(draftDir(ctx, slug))) continue
      const loaded = loadSite(ctx, slug, 'draft')
      if (!loaded.ok) continue
      const { site } = loaded.value
      const distribution = site.config.distribution ?? 'internal'
      for (const page of site.pages as Page[]) {
        const fonts: L1FontFace[] = page.l1?.resources?.fonts ?? []
        for (const face of fonts) {
          usages.push({
            root,
            slug,
            distribution,
            pageSlug: page.slug,
            family: face.family,
            src: face.src,
            file: assetBasename(face.src),
          })
        }
      }
    }
  }
  return usages
}

const FONT_EXTENSIONS = ['.woff2', '.woff', '.ttf', '.otf']

/**
 * Trees under `storage/` that hold no project source and are therefore not
 * scanned: `dist/` is gitignored render output copied byte-for-byte from a
 * draft, so counting it would double every finding and make the check depend on
 * whether anyone had rendered recently; `node_modules/` is vendored.
 */
const NON_SOURCE_TREES = new Set(['dist', 'node_modules'])

/**
 * Every font file present in the project's source trees, keyed by basename.
 *
 * The usage join below only sees fonts a site actually *references*, which
 * leaves the class this ticket cares most about invisible: a capture bundle
 * mirrors a third party's fonts into `storage/references/`, and those bytes are
 * in the repo whether or not a page ever points at them. Their redistribution
 * status is exactly the thing least likely to be clear, so provenance has to be
 * demanded of the file on disk, not of the reference to it.
 */
export function collectFontFilesOnDisk(cwd: string): FontFileOnDisk[] {
  const storage = path.join(cwd, 'storage')
  if (!pathExists(storage)) return []

  const byFile = new Map<string, string[]>()
  for (const tree of listDirs(storage)) {
    if (NON_SOURCE_TREES.has(tree)) continue
    for (const rel of listFilesRel(path.join(storage, tree))) {
      const base = rel.split('/').pop() ?? rel
      const lower = base.toLowerCase()
      if (!FONT_EXTENSIONS.some((ext) => lower.endsWith(ext))) continue
      const locations = byFile.get(base) ?? []
      locations.push(`storage/${tree}/${rel}`)
      byFile.set(base, locations)
    }
  }

  return [...byFile.entries()]
    .map(([file, locations]) => ({ file, locations: locations.sort() }))
    .sort((a, b) => a.file.localeCompare(b.file))
}

/**
 * Join every site's font references — and every font file on disk — against the
 * registry.
 *
 * Four failures, each answering a different question:
 *   - `unregistered-family` — a page names a font we cannot account for at all.
 *   - `unregistered-file`   — we know the family, but not this particular file
 *                             (a weight added by hand escapes the record).
 *   - `unprovenanced-file`  — bytes are in the tree that no entry records, even
 *                             though nothing references them yet.
 *   - `redistribution-not-permitted` — the site ships as product and the licence
 *                             does not permit that, or has not been resolved.
 */
export function cmdFontsCheck(cwd: string = process.cwd()): FontsCheckReport {
  const registry = loadFontRegistry(cwd)
  const byFamily = indexByFamily(registry)
  const usages = collectFontUsages(cwd)

  const violations: FontViolation[] = []
  const actionSites = new Map<string, Set<string>>()

  const registeredFiles = new Set(registry.fonts.flatMap((e) => e.files.map((f) => f.path)))
  const filesOnDisk = collectFontFilesOnDisk(cwd)
  for (const onDisk of filesOnDisk) {
    if (registeredFiles.has(onDisk.file)) continue
    violations.push({
      kind: 'unprovenanced-file',
      file: onDisk,
      message: `'${onDisk.file}' is on disk (${onDisk.locations[0]}) but no registry entry records it.`,
      hint: `Add it to the owning family's files list in ${REGISTRY_REL}, recording where it came from and what its licence permits — or delete the file.`,
    })
  }

  for (const usage of usages) {
    const siteRef = `${usage.root}/${usage.slug}`
    const entry = byFamily.get(usage.family)

    if (!entry) {
      violations.push({
        kind: 'unregistered-family',
        usage,
        message: `${siteRef} references unregistered font family '${usage.family}'.`,
        hint: `Add a '${usage.family}' entry to ${REGISTRY_REL} recording foundry, source, download date and licence.`,
      })
      continue
    }

    if (!entry.files.some((f) => f.path === usage.file)) {
      violations.push({
        kind: 'unregistered-file',
        usage,
        message: `${siteRef} serves '${usage.file}' for family '${usage.family}', which the registry does not list.`,
        hint: `Add { path: ${usage.file} } to the '${usage.family}' files list, or point the page at a registered file.`,
      })
    }

    if (usage.distribution === 'product' && entry.licence.redistribute_in_product !== true) {
      const state =
        entry.licence.redistribute_in_product === 'REVIEW_REQUIRED'
          ? 'is unresolved (REVIEW_REQUIRED)'
          : 'is not permitted'
      violations.push({
        kind: 'redistribution-not-permitted',
        usage,
        message: `${siteRef} declares distribution 'product' but redistribution of '${usage.family}' ${state}.`,
        hint: 'Resolve the licence question and set licence.redistribute_in_product: true, or use a font that permits product redistribution.',
      })
    }

    if (entry.actions.length > 0) {
      const sites = actionSites.get(entry.family) ?? new Set<string>()
      sites.add(siteRef)
      actionSites.set(entry.family, sites)
    }
  }

  const warnings: FontWarning[] = [...actionSites.entries()].map(([family, sites]) => ({
    family,
    usedBy: [...sites].sort(),
    actions: byFamily.get(family)?.actions ?? [],
  }))

  return {
    pass: violations.length === 0,
    registryPath: registryPath(cwd),
    registered: registry.fonts.map((f) => f.family),
    usages,
    filesOnDisk,
    violations,
    warnings,
  }
}

/** Human rendering of a check report — violations first, then open actions. */
export function formatFontsReport(report: FontsCheckReport): string {
  const lines: string[] = []
  const sites = new Set(report.usages.map((u) => `${u.root}/${u.slug}`))
  lines.push(
    `fonts check — ${report.registered.length} registered famil${report.registered.length === 1 ? 'y' : 'ies'}, ` +
      `${report.usages.length} reference(s) across ${sites.size} site(s), ` +
      `${report.filesOnDisk.length} font file(s) on disk`,
  )

  if (report.violations.length > 0) {
    lines.push('')
    lines.push(`FAIL — ${report.violations.length} violation(s):`)
    for (const v of report.violations) {
      lines.push(`  [${v.kind}] ${v.message}`)
      lines.push(`      hint: ${v.hint}`)
    }
  }

  if (report.warnings.length > 0) {
    lines.push('')
    lines.push(`Outstanding licence actions (advisory — ${report.warnings.length} famil${report.warnings.length === 1 ? 'y' : 'ies'}):`)
    for (const w of report.warnings) {
      lines.push(`  ${w.family} — used by ${w.usedBy.join(', ')}`)
      for (const a of w.actions) lines.push(`      - ${a}`)
    }
  }

  if (report.pass) {
    lines.push('')
    lines.push('PASS — every referenced font is registered.')
  }
  return lines.join('\n')
}
