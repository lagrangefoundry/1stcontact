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
 * font, not to the site that happens to reference it, so every tree that can
 * hold a site is scanned in one pass, whether or not anything currently writes
 * it. Reproduction sites carry capture-derived fonts whose terms are often
 * unclear, and that is precisely the state the registry exists to record.
 *
 * WHAT "PROJECT" MEANS SINCE REQ-290. The obligation attaches to bytes in the
 * repository, not to a directory name, so the scan follows the bytes. REQ-290
 * retired `storage/sites/` as an authoring tier and moved the hand-authored L1
 * corpus — which carries seven committed font files — to a fixture under
 * `tests/`. Scanning only `storage/` afterwards would have left those files
 * unaccounted for while still reporting PASS, which is the one outcome this
 * gate exists to prevent. See {@link SOURCE_BASES_REL}.
 *
 * Registration is *provenance, not approval*. A registered family with an open
 * `actions` entry warns; it does not fail. The blocking gate is
 * `licence.redistribute_in_product`, and it fires only for a site declaring
 * `config.distribution: "product"` — the "may I ship this to 10,000 customer
 * sites" question, which has a different answer from "may I use this here".
 *
 * TWO TIERS SINCE [[REQ-312]]. A page may now point at the shared platform mirror
 * instead of at its own `draft/assets/`, and before this the check reported that
 * as `unregistered-file` — it resolved every `src` to an asset basename and looked
 * for it on disk, so the one arrangement the platform tier exists to make possible
 * was the one arrangement it failed. A `src` whose path is the platform origin's
 * resolves against `fonts/platform.json`; everything else resolves exactly as it
 * did, and the product-distribution gate is untouched.
 *
 * THE TIERS ARE INDEXED SEPARATELY AND THAT IS LOAD-BEARING. Five authored
 * entries — Cinzel, Lato, Oswald, Raleway, Karla — are families the mirror also
 * holds, so a single index over both would find a duplicate family and refuse to
 * load the registry at all. "Which Lato?" is answered by where the bytes are
 * served from, and nothing else can answer it.
 *
 * AND THE MIRROR IS CHECKED AGAINST THE DOCUMENT. [[DOC-56]] tells the assistant
 * a family is available to serve; a family it names with nothing behind it is the
 * failure this whole ticket exists to prevent, so the catalogue the document is
 * generated from is joined to the mirror here.
 */

import path from 'node:path'
import { readFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import type {
  FontRegistry,
  FontRegistryEntry,
  FontTier,
  L1FontFace,
  Page,
  PlatformFontManifest,
} from '@1stcontact/site-schema'
import {
  fontSrcNamesHost,
  parsePlatformFontSrc,
  platformRegistryEntries,
  validateFontRegistry,
} from '@1stcontact/site-schema'
import {
  catalogueExists,
  loadCatalogue,
  redistributableFamilies,
} from '../fonts/catalogue'
import { loadPlatformManifest, MANIFEST_REL } from '../fonts/mirror'
import { indexIsCurrent, INDEX_REL } from '../fonts/index-build'
import { listDirs, listFilesRel, pathExists } from '../store/fsutil'
import { draftDir, type Root, type StoreContext } from '../store/paths'
import { loadSite } from '../store/loadSite'
import { CommandError } from './errors'

/** Where the registry lives, relative to the repo root. */
export const REGISTRY_REL = path.join('fonts', 'registry.yaml')

/**
 * Every repo-relative directory that may hold project font bytes.
 *
 * `.` is the repository itself, whose `storage/` trees hold the reproduction
 * substrate and the mirrored bytes of every capture. The second entry is the
 * L1 conformance corpus, which is repo-shaped (`<base>/storage/sites/<slug>/`)
 * precisely so that one `cwd` swap reads it — see its README.
 *
 * This is the one place production code names the fixture, and it is deliberate
 * rather than a leak of test layout into the CLI: a font file committed under
 * `tests/` is redistributed by this repository exactly as one committed under
 * `storage/` is, and a licence gate that declined to look at it would be
 * answering a question about directory names instead of about obligations. A
 * base that is not present is skipped, so a consumer that vendors only the tool
 * scans what it has.
 */
export const SOURCE_BASES_REL = ['.', path.join('tests', 'fixtures', 'l1-corpus')] as const

/** The {@link SOURCE_BASES_REL} entries that exist under `cwd`, as absolute paths. */
function sourceBases(cwd: string): Array<{ dir: string; rel: string }> {
  return SOURCE_BASES_REL.map((rel) => ({ dir: path.resolve(cwd, rel), rel })).filter(({ dir }) =>
    pathExists(path.join(dir, 'storage')),
  )
}

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
  /**
   * Which tier this reference addresses, decided by the `src` alone.
   *
   * `'platform'` when the `src` is the mirror's root-relative path — see
   * `parsePlatformFontSrc`, which admits no host at all, so a site definition
   * checks the same against a local preview, a staging deployment and production,
   * and a page can never name an origin that later moves.
   */
  tier: FontTier
  /**
   * `src` reduced to the key its tier's registry records: an asset basename for
   * the site tier, the mirror-relative `<slug>/<file>` for the platform tier.
   */
  file: string
  /** Whether this `src` sends the visitor's browser to another host — see `off-origin-font`. */
  offOrigin: boolean
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
  /**
   * The catalogue documents a family the mirror does not hold ([[REQ-312]]).
   *
   * [[DOC-56]] is generated from the catalogue and tells the assistant those
   * families are available to serve, so this is the document and the mirror
   * disagreeing — a promise with nothing behind it, which is the failure the
   * platform tier was built to end. It fires only once the mirror has been
   * populated at all; an empty mirror is reported as absent rather than as 1,900
   * separate broken promises.
   */
  | 'documented-not-mirrored'
  /**
   * A page's font `src` names a host ([[REQ-312]], `COMMENT-3711`).
   *
   * THE PROPERTY IS THAT A SITE IS SELF-CONTAINED. A face fetched from
   * `fonts.gstatic.com`, from a CDN, or from this platform's own hostname is the
   * same fact seen from the visitor's browser: a third-party request, made before
   * any text can paint, disclosing their IP to somebody the customer never named
   * — which is the thing the German Google-Fonts judgments were about and the
   * thing a small business gets asked about. It is also how a page comes to carry
   * a hostname that later moves, since binding a custom domain re-renders nothing.
   *
   * Every font a site serves therefore comes from the site's own domain: its own
   * assets, or the platform mirror at `/_fonts/…`, which every serving surface
   * answers for at its own snapshot root.
   */
  | 'off-origin-font'
  /**
   * The corpus the assistant reads is not the corpus the mirror holds ([[REQ-313]]).
   *
   * `use_font` serves a face by writing a path the mirror recorded, and it reads
   * those paths out of a projection rather than out of the manifest — a Worker has
   * no filesystem, so the manifest cannot be read at call time. A mirror refreshed
   * without re-running `1c fonts index` therefore leaves the assistant binding
   * paths that 404, and nothing else in the system can see that: the manifest is
   * right, the origin is right, and the page validates. This comparison is the
   * only place the drift is visible.
   */
  | 'stale-font-index'

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

/** What the platform tier is, as this run found it. */
export interface PlatformTierState {
  /** Whether `fonts/platform.json` exists at all. */
  populated: boolean
  /** Families the mirror holds. */
  families: number
  /** Redistributable families the catalogue documents, or `null` with no catalogue. */
  documented: number | null
  /** Documented families the mirror does not hold, sorted. */
  missing: string[]
  /** The catalogue the mirror was pinned to, when it is populated. */
  catalogueRetrieved?: string
  /** The upstream commit the bytes were taken at. */
  upstreamRef?: string
}

export interface FontsCheckReport {
  pass: boolean
  registryPath: string
  /** The platform mirror's state — absent is an answer, and a reported one. */
  platform: PlatformTierState
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

/**
 * Index one tier's entries by family.
 *
 * PER TIER, never across both: the two tiers legitimately hold the same family
 * name (five of the nine authored entries are Google families the mirror also
 * carries), and one index over them would call that a conflict and refuse to load
 * anything. Within a tier a duplicate is still exactly what it always was — an
 * authoring bug in the site tier, a generator bug in the platform tier.
 */
function indexByFamily(
  entries: readonly FontRegistryEntry[],
  tier: FontTier,
  source: string,
): Map<string, FontRegistryEntry> {
  const byFamily = new Map<string, FontRegistryEntry>()
  for (const entry of entries) {
    if (byFamily.has(entry.family)) {
      throw new CommandError({
        code: 'CONFLICT',
        message: `The ${tier} font tier declares family '${entry.family}' more than once.`,
        path: source,
        hint:
          tier === 'site'
            ? 'Merge the duplicate entries — one family, one provenance record.'
            : 'The platform tier is generated; re-run `1c fonts mirror` rather than editing it.',
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
  for (const base of sourceBases(cwd)) {
    for (const root of ['sites', 'sandbox'] as const) {
      const ctx: StoreContext = { cwd: base.dir, root }
      const treeDir = path.join(base.dir, 'storage', root)
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
            // The tier is a property of the `src` and of nothing else. A page
            // pointing at the platform origin is asking the platform tier to
            // account for the bytes; a page pointing anywhere else is asking its
            // own site to.
            const platformPath = parsePlatformFontSrc(face.src)
            usages.push({
              root,
              slug,
              distribution,
              pageSlug: page.slug,
              family: face.family,
              src: face.src,
              tier: platformPath === null ? 'site' : 'platform',
              file: platformPath ?? assetBasename(face.src),
              offOrigin: fontSrcNamesHost(face.src),
            })
          }
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
  const byFile = new Map<string, string[]>()
  for (const source of sourceBases(cwd)) {
    const storage = path.join(source.dir, 'storage')
    // A location is reported relative to the repo root, so a violation names a
    // path the reader can open; the repository's own base contributes no prefix.
    const prefix = source.rel === '.' ? '' : `${source.rel.split(path.sep).join('/')}/`
    for (const tree of listDirs(storage)) {
      if (NON_SOURCE_TREES.has(tree)) continue
      for (const rel of listFilesRel(path.join(storage, tree))) {
        const base = rel.split('/').pop() ?? rel
        const lower = base.toLowerCase()
        if (!FONT_EXTENSIONS.some((ext) => lower.endsWith(ext))) continue
        const locations = byFile.get(base) ?? []
        locations.push(`${prefix}storage/${tree}/${rel}`)
        byFile.set(base, locations)
      }
    }
  }

  return [...byFile.entries()]
    .map(([file, locations]) => ({ file, locations: locations.sort() }))
    .sort((a, b) => a.file.localeCompare(b.file))
}

/**
 * The platform tier as this checkout holds it, including the two ways it can be
 * absent — no mirror, or no catalogue to check one against.
 *
 * ABSENCE IS AN ANSWER AND IT IS SAID OUT LOUD. A fresh clone has no mirror,
 * because the bytes are a build product rather than repository content, and a gate
 * that failed over that would fail on every clone. What must not happen is the
 * absence being silent: a deployment serving no platform fonts and a deployment
 * whose mirror was never populated look identical from the outside, and only one
 * of them is a mistake.
 */
export function platformTierState(
  cwd: string,
  manifest: PlatformFontManifest | null,
): PlatformTierState {
  const held = new Set((manifest?.families ?? []).map((f) => f.slug))
  const documented = catalogueExists(cwd) ? redistributableFamilies(loadCatalogue(cwd)) : null

  return {
    populated: manifest !== null,
    families: manifest?.families.length ?? 0,
    documented: documented?.length ?? null,
    missing: (documented ?? [])
      .filter((f) => !held.has(f.slug))
      .map((f) => f.family)
      .sort((a, b) => a.localeCompare(b)),
    ...(manifest ? { catalogueRetrieved: manifest.catalogue.retrieved, upstreamRef: manifest.upstream.ref } : {}),
  }
}

/**
 * Join every site's font references — and every font file on disk — against both
 * tiers of the registry.
 *
 * Five failures, each answering a different question:
 *   - `unregistered-family` — a page names a font we cannot account for at all,
 *                             in the tier its `src` addresses.
 *   - `unregistered-file`   — we know the family, but not this particular file
 *                             (a weight added by hand escapes the record).
 *   - `unprovenanced-file`  — bytes are in the tree that no entry records, even
 *                             though nothing references them yet.
 *   - `redistribution-not-permitted` — the site ships as product and the licence
 *                             does not permit that, or has not been resolved.
 *   - `documented-not-mirrored` — [[DOC-56]] offers a family the mirror does not
 *                             hold, so the catalogue and the bytes disagree.
 */
export function cmdFontsCheck(cwd: string = process.cwd()): FontsCheckReport {
  const registry = loadFontRegistry(cwd)
  const siteTier = indexByFamily(registry.fonts, 'site', REGISTRY_REL)
  const manifest = loadPlatformManifest(cwd)
  const platformEntries = manifest ? platformRegistryEntries(manifest) : []
  const platformTier = indexByFamily(platformEntries, 'platform', MANIFEST_REL)
  const usages = collectFontUsages(cwd)

  const violations: FontViolation[] = []
  const actionSites = new Map<string, Set<string>>()

  const platform = platformTierState(cwd, manifest)
  // Only once the mirror exists at all. An unpopulated mirror is REPORTED as
  // unpopulated — one plain sentence, the way `1c assets` reports a KB that was
  // never built — rather than as one broken promise per documented family.
  if (platform.populated && platform.missing.length > 0) {
    const named = platform.missing.slice(0, 8).join(', ')
    const rest = platform.missing.length > 8 ? `, and ${platform.missing.length - 8} more` : ''
    violations.push({
      kind: 'documented-not-mirrored',
      message:
        `${platform.missing.length} famil${platform.missing.length === 1 ? 'y' : 'ies'} documented in the font ` +
        `catalogue ${platform.missing.length === 1 ? 'is' : 'are'} not in the platform mirror: ${named}${rest}.`,
      hint:
        'The assistant is told these are available to serve, so a page may reference one and get nothing. ' +
        'Re-run `1c fonts mirror` against a current checkout, or take them out of the catalogue.',
    })
  }

  // [[REQ-313]] — and the projection the assistant reads must be the mirror it was
  // taken from. Only when there IS a mirror: an empty projection beside an empty
  // mirror is a fresh clone agreeing with itself.
  if (platform.populated && !indexIsCurrent(cwd)) {
    violations.push({
      kind: 'stale-font-index',
      message: `${INDEX_REL} does not match ${MANIFEST_REL}: the assistant's font corpus is out of date.`,
      hint: 'Run `1c fonts index`. Until then `use_font` may refuse a mirrored family, or bind a path the origin no longer serves.',
    })
  }

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

    // REPORTED WITH ITS OWN SENTENCE, and reported FIRST. `parsePlatformFontSrc`
    // admits no host, so an absolute `src` falls to the site tier and would
    // otherwise surface as *"the registry does not list `Roboto[wght].woff2`"* —
    // a true statement about the wrong problem, and one whose obvious fix is to
    // register the file rather than to stop fetching it from somebody else.
    if (usage.offOrigin) {
      violations.push({
        kind: 'off-origin-font',
        usage,
        message: `${siteRef} loads '${usage.family}' from another host: ${usage.src}`,
        hint:
          "A site serves every font from its own domain — no third-party request from a visitor's browser, " +
          'and no hostname baked into published bytes that a later domain change would strand. Use the ' +
          'platform mirror (`/_fonts/<family>/<file>.woff2`, which every surface answers at its own root) ' +
          'or an asset the site holds itself.',
      })
      continue
    }

    const platformRef = usage.tier === 'platform'
    const entry = (platformRef ? platformTier : siteTier).get(usage.family)

    if (!entry) {
      violations.push({
        kind: 'unregistered-family',
        usage,
        message: platformRef
          ? `${siteRef} references '${usage.family}' from the platform font origin, which the mirror does not hold.`
          : `${siteRef} references unregistered font family '${usage.family}'.`,
        hint: platformRef
          ? `The platform mirror serves no '${usage.family}'. Mirror it with \`1c fonts mirror\` if the catalogue ` +
            'offers it, or point the page at a font the site holds itself.'
          : `Add a '${usage.family}' entry to ${REGISTRY_REL} recording foundry, source, download date and licence.`,
      })
      continue
    }

    if (!entry.files.some((f) => f.path === usage.file)) {
      violations.push({
        kind: 'unregistered-file',
        usage,
        message: platformRef
          ? `${siteRef} serves '${usage.file}' for platform family '${usage.family}', which the mirror does not hold.`
          : `${siteRef} serves '${usage.file}' for family '${usage.family}', which the registry does not list.`,
        hint: platformRef
          ? `The mirror holds: ${entry.files.map((f) => f.path).slice(0, 6).join(', ')}. Point the page at one of them.`
          : `Add { path: ${usage.file} } to the '${usage.family}' files list, or point the page at a registered file.`,
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
    actions: siteTier.get(family)?.actions ?? [],
  }))

  return {
    pass: violations.length === 0,
    registryPath: registryPath(cwd),
    platform,
    registered: [...registry.fonts.map((f) => f.family), ...platformEntries.map((f) => f.family)],
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
  const total = report.registered.length
  const site = total - report.platform.families
  lines.push(
    `fonts check — ${total} registered famil${total === 1 ? 'y' : 'ies'} ` +
      `(${site} site, ${report.platform.families} platform), ` +
      `${report.usages.length} reference(s) across ${sites.size} site(s), ` +
      `${report.filesOnDisk.length} font file(s) on disk`,
  )

  // The same shape `1c assets` uses to report a knowledge base nobody built. A
  // deployment with no mirror serves no platform font, and the operator has to be
  // able to tell that from a deployment that simply uses none.
  if (!report.platform.populated) {
    lines.push('')
    lines.push(
      `platform mirror  *** NOT POPULATED — ${report.platform.documented ?? 'the catalogued'} documented famil` +
        `${report.platform.documented === 1 ? 'y has' : 'ies have'} no bytes behind ` +
        `${report.platform.documented === 1 ? 'it' : 'them'}. Run \`1c fonts mirror\`. ***`,
    )
  } else {
    lines.push(
      `platform mirror  ${report.platform.families} famil${report.platform.families === 1 ? 'y' : 'ies'}, ` +
        `catalogue ${report.platform.catalogueRetrieved}, upstream ${report.platform.upstreamRef}`,
    )
  }

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
