import type { Site, ValidationError } from '@1stcontact/site-schema'
import { resolveL1Palette, validateSite } from '@1stcontact/site-schema'
import { upgradePageModules } from '@1stcontact/framework/worker'
import type { StoredInstance } from '@1stcontact/framework/worker'

/**
 * Assembling a site definition out of its parts, with no idea where the parts
 * came from (REQ-142).
 *
 * The on-disk model is one file per page: `site.json` carries everything except
 * pages, and `pages/*.json` each hold a single page. That shape is not really
 * *about* files — it is the store's unit of change, and D1 will hold the same
 * split in rows. So the merge-and-validate step belongs here, above both
 * adapters, rather than inside the filesystem one where it started: `loadSite`
 * reads it off disk and the in-memory adapter reads it out of a Map, and both
 * get an identical answer because there is one place the answer is decided.
 */

/** A fully assembled, validated site plus the assets discovered alongside it. */
export interface LoadedSite {
  /**
   * What the STORE this was loaded from calls the site — a directory name in
   * the file-backed tier, the site's key in D1 ([[REQ-236]]).
   *
   * Descriptive, exactly like {@link sourceDir} beside it: nothing at request
   * time reads it, and the two adapters legitimately report different strings
   * for the same definition, which is why a test comparing an assembled site
   * across stores compares everything else.
   */
  slug: string
  /**
   * Where the definition was assembled from.
   *
   * Meaningful to the filesystem adapter, which reports an absolute directory —
   * `renderSite` reads `<sourceDir>/assets` when it copies bytes through to a
   * rendered tree. An adapter with no filesystem reports an opaque label; no
   * request-time path reads it (`renderSiteFiles` never touches it), so it is
   * descriptive, not load-bearing.
   */
  sourceDir: string
  /** The validated site definition. */
  site: Site
  /** Asset files relative to the definition's `assets/`, sorted. */
  assetFiles: string[]
}

export type LoadResult = { ok: true; value: LoadedSite } | { ok: false; errors: ValidationError[] }

/** The parts a definition is assembled from, in load order. */
export interface SiteParts {
  slug: string
  sourceDir: string
  /** `site.json`: everything except pages. */
  base: Record<string, unknown>
  /** One entry per page, already in load order. */
  pages: unknown[]
  /** Asset files relative to `assets/`, sorted. */
  assetFiles: string[]
}

/** True when this value is a plain object rather than an array or a primitive. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * One page with every stale module instance carried to its current contract,
 * or the page unchanged when there is nothing here to carry ([[BUG-91]]).
 *
 * THE SHAPE CHECK IS NOT PARANOIA. This runs BEFORE `validateSite`, so the page
 * is whatever the store held — including, on a bad day, something that is not a
 * page at all. An upgrade path is a poor diagnostician of malformed JSON: it
 * would throw where the schema would have named the offending pointer. So
 * anything that is not recognisably a list of instances is passed through
 * untouched and left for validation to report properly.
 */
function upgradePageOnLoad(page: unknown): unknown {
  if (!isRecord(page)) return page
  const modules = page.modules
  if (!Array.isArray(modules) || modules.length === 0) return page
  const instances = modules.every(
    (m) => isRecord(m) && typeof m.type === 'string' && Number.isInteger(m.version),
  )
  if (!instances) return page

  const { modules: upgraded, upgrades } = upgradePageModules(modules as StoredInstance[])
  return upgrades.length === 0 ? page : { ...page, modules: upgraded }
}

/**
 * Merge `{ ...base, pages }` and validate it as a whole site definition.
 *
 * A structurally invalid definition returns `{ ok: false, errors }` with
 * JSON-pointer-style paths and the caller writes nothing.
 */
export function assembleSite(parts: SiteParts): LoadResult {
  // BUG-91 — a *loaded* site has current-contract module instances, for the
  // same reason it has literal colours below: the stored `version` is the
  // store's business, and nothing downstream of here should be able to tell
  // which contract version a page was authored against.
  //
  // WHY THE RENDER PATH GETS TO DO THIS AT ALL. A bump cannot land without a
  // declared migration reaching it — [[BUG-85]] made that a precondition and
  // `missingMigrations` enforces it in CI — so a stored instance can ALWAYS be
  // carried to the current contract. Refusing to render one is therefore
  // refusing over a difference the framework already knows how to erase.
  // `contact-form` 5 → 7 proved the point the expensive way: every site in the
  // store went dark on a pin that two declared, tested migrations could cross.
  //
  // BEFORE `validateSite`, which is the load-bearing half of it. A migration
  // may AUTHOR L1 (`account-chrome` v1 → v2 synthesises `sent` and `error`
  // cards, borrowing the dialog's text colour — which may be a palette
  // reference), so the upgraded definition is the one that must be validated
  // and the one whose references must resolve. Validating the stored shape and
  // rendering a different one is the drift this ordering exists to make
  // impossible.
  //
  // NOTHING IS WRITTEN. The store keeps its pin until an ordinary edit rewrites
  // the page or an operator runs `1c module upgrade --write`, which goes on
  // reporting these instances as stale because they are. What this removes is
  // only the site going dark while they wait.
  const pages = parts.pages.map(upgradePageOnLoad)
  const result = validateSite({ ...parts.base, pages })
  if (!result.ok) return { ok: false, errors: result.errors }

  // REQ-114 — a *loaded* site has literal colours. The palette (DOC-23 §5) is an
  // authoring overlay: it is the unit of change in the store, but every consumer
  // downstream of here — the renderer, the analytic evaluator, the round-trip
  // gate, values-diff — reads a colour as the value it paints. Resolving once,
  // at this boundary, is what makes converting a site's literals to references
  // pixel-identical: nothing downstream can tell which form was authored.
  //
  // Validation ran first, so every reference is known to resolve;
  // `resolveL1Palette` throws rather than substituting a default if one somehow
  // does not. Structured-edit commands read and write the raw JSON, never this
  // object, so the stored references survive a round-trip through the CLI
  // untouched.
  const site = resolveL1Palette(result.value, result.value.palette)
  return {
    ok: true,
    value: { slug: parts.slug, sourceDir: parts.sourceDir, site, assetFiles: parts.assetFiles },
  }
}
