import type { Site, ValidationError } from '@1stcontact/site-schema'
import { resolveL1Palette, validateSite } from '@1stcontact/site-schema'

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

/**
 * Merge `{ ...base, pages }` and validate it as a whole site definition.
 *
 * A structurally invalid definition returns `{ ok: false, errors }` with
 * JSON-pointer-style paths and the caller writes nothing.
 */
export function assembleSite(parts: SiteParts): LoadResult {
  const result = validateSite({ ...parts.base, pages: parts.pages })
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
