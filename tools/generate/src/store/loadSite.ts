import path from 'node:path'
import type { Site, ValidationError } from '@1stcontact/site-schema'
import { validateSite } from '@1stcontact/site-schema'
import type { StoreContext } from './paths'
import { draftDir, revisionDir } from './paths'
import { listFilesRel, pathExists, readJson } from './fsutil'
import { liveRevision, readHistory } from './history'

/**
 * Where to load a site definition from:
 * - `'draft'`  — the working set under `draft/`
 * - `'latest'` — the highest published revision
 * - a revision id (number or 4-digit string, e.g. `1` / `'0001'`)
 */
export type SiteSource = 'draft' | 'latest' | number | string

/** A fully assembled, validated site plus the assets discovered alongside it. */
export interface LoadedSite {
  slug: string
  /** Absolute directory the definition was assembled from. */
  sourceDir: string
  /** The validated site definition. */
  site: Site
  /** Asset files relative to `<sourceDir>/assets`, sorted. */
  assetFiles: string[]
}

export type LoadResult =
  | { ok: true; value: LoadedSite }
  | { ok: false; errors: ValidationError[] }

/** Resolve a {@link SiteSource} to the absolute directory holding the definition. */
function resolveSourceDir(ctx: StoreContext, slug: string, source: SiteSource): string {
  if (source === 'draft') return draftDir(ctx, slug)
  if (source === 'latest') {
    const id = liveRevision(readHistory(ctx, slug))
    if (id === null) {
      throw new Error(`Site '${slug}' has no published revisions to load as 'latest'.`)
    }
    return revisionDir(ctx, slug, id)
  }
  const id = typeof source === 'number' ? source : Number(source)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid revision source '${String(source)}' for site '${slug}'.`)
  }
  return revisionDir(ctx, slug, id)
}

/**
 * Assemble a site definition from one source and validate it against
 * `@1stcontact/site-schema`.
 *
 * The on-disk model is one file per page: `site.json` carries everything except
 * pages (`id`, `config`, `theme`, `nav`, optional `assets`), and `pages/*.json`
 * each hold a single page. They are merged (pages sorted by filename for
 * deterministic order) and validated as a whole. A structurally invalid
 * definition returns `{ ok: false, errors }` with JSON-pointer-style paths and
 * the caller writes nothing; a missing source directory is a precondition bug
 * and throws.
 */
export function loadSite(ctx: StoreContext, slug: string, source: SiteSource = 'draft'): LoadResult {
  const sourceDir = resolveSourceDir(ctx, slug, source)
  if (!pathExists(sourceDir)) {
    throw new Error(`Site source not found: ${sourceDir}`)
  }

  const siteJsonPath = path.join(sourceDir, 'site.json')
  if (!pathExists(siteJsonPath)) {
    throw new Error(`Missing site.json in ${sourceDir}`)
  }
  const base = readJson<Record<string, unknown>>(siteJsonPath)

  const pagesDir = path.join(sourceDir, 'pages')
  const pages = listFilesRel(pagesDir)
    .filter((rel) => rel.endsWith('.json'))
    .map((rel) => readJson<unknown>(path.join(pagesDir, rel)))

  const candidate = { ...base, pages }
  const result = validateSite(candidate)
  if (!result.ok) {
    return { ok: false, errors: result.errors }
  }

  const assetFiles = listFilesRel(path.join(sourceDir, 'assets'))
  return { ok: true, value: { slug, sourceDir, site: result.value, assetFiles } }
}
