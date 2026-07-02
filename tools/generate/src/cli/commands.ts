import path from 'node:path'
import type { ValidationError } from '@1stcontact/site-schema'
import { renderSite } from '../render/render'
import type { RenderChannel, Root, StoreContext } from '../store'
import {
  appendHistory,
  copyDir,
  diffSnapshots,
  distDir,
  draftDir,
  emptyDir,
  ensureDir,
  listDirs,
  liveRevision,
  loadSite,
  nextRevisionId,
  pathExists,
  readDraftBase,
  readHistory,
  revisionDir,
  siteDir,
  snapshot,
  writeDraftBase,
  writeJson,
} from '../store'
import type { LoadedSite, SiteSource } from '../store'
import { starterHomePage, starterSiteJson } from './scaffold'

/** Options common to every command: working dir + which site tree to target. */
export interface GlobalOptions {
  cwd?: string
  sandbox?: boolean
}

function ctxOf(opts: GlobalOptions): StoreContext {
  const root: Root = opts.sandbox ? 'sandbox' : 'sites'
  return { cwd: opts.cwd ?? process.cwd(), root }
}

/** Thrown when a definition fails schema validation; carries path-pointed errors. */
export class InvalidDefinitionError extends Error {
  constructor(
    public slug: string,
    public errors: ValidationError[],
  ) {
    super(
      `Invalid site definition '${slug}':\n` +
        errors.map((e) => `  ${e.path}: ${e.message}`).join('\n'),
    )
    this.name = 'InvalidDefinitionError'
  }
}

/** Load a definition or throw {@link InvalidDefinitionError} (writes nothing). */
function loadOrThrow(ctx: StoreContext, slug: string, source: SiteSource): LoadedSite {
  const result = loadSite(ctx, slug, source)
  if (!result.ok) throw new InvalidDefinitionError(slug, result.errors)
  return result.value
}

/** List slugs that have a `draft/` under the active root. */
function listSlugs(ctx: StoreContext): string[] {
  return listDirs(path.join(ctx.cwd, 'storage', ctx.root)).filter((slug) =>
    pathExists(draftDir(ctx, slug)),
  )
}

// ── new ──────────────────────────────────────────────────────────────────────

export interface NewResult {
  slug: string
  draftDir: string
}

/** Scaffold an empty `draft/` (metadata + one starter page) for a new site. */
export function cmdNew(slug: string, opts: GlobalOptions = {}): NewResult {
  const ctx = ctxOf(opts)
  const dir = siteDir(ctx, slug)
  if (pathExists(dir)) {
    throw new Error(`Site '${slug}' already exists at ${dir}`)
  }
  const draft = draftDir(ctx, slug)
  writeJson(path.join(draft, 'site.json'), starterSiteJson(slug))
  writeJson(path.join(draft, 'pages', 'home.json'), starterHomePage(slug))
  ensureDir(path.join(draft, 'assets'))
  writeJson(path.join(dir, 'history.json'), { revisions: [] })
  writeDraftBase(ctx, slug, null)
  return { slug, draftDir: draft }
}

// ── list ─────────────────────────────────────────────────────────────────────

export interface SiteListing {
  slug: string
  latest: number | null
}

/** List sites under the active root with their latest revision id. */
export function cmdList(opts: GlobalOptions = {}): SiteListing[] {
  const ctx = ctxOf(opts)
  return listSlugs(ctx).map((slug) => ({
    slug,
    latest: liveRevision(readHistory(ctx, slug)),
  }))
}

// ── revisions ─────────────────────────────────────────────────────────────────

/** The publish log, newest-first. */
export function cmdRevisions(slug: string, opts: GlobalOptions = {}) {
  const ctx = ctxOf(opts)
  return [...readHistory(ctx, slug).revisions].sort((a, b) => b.id - a.id)
}

// ── render ────────────────────────────────────────────────────────────────────

export interface RenderOptions extends GlobalOptions {
  source?: SiteSource
  out?: string
}

export interface RenderResult {
  outDir: string
  files: string[]
}

/** Render a site (default `--source draft`) to its private preview directory. */
export async function cmdRender(slug: string, opts: RenderOptions = {}): Promise<RenderResult> {
  const ctx = ctxOf(opts)
  const source = opts.source ?? 'draft'
  const loaded = loadOrThrow(ctx, slug, source)
  const channel: RenderChannel = source === 'draft' ? 'draft' : 'published'
  const outDir = opts.out ?? distDir(ctx, slug, channel)
  const files = await renderSite(loaded, outDir)
  return { outDir, files }
}

// ── publish ───────────────────────────────────────────────────────────────────

export interface PublishOptions extends GlobalOptions {
  message?: string
  by?: string
  /** ISO timestamp to record (injectable for deterministic tests). */
  now?: string
}

export interface PublishResult {
  id: number
  revisionDir: string
  outDir: string
  changes: ReturnType<typeof diffSnapshots>
}

/**
 * Snapshot `draft/` to the next locked revision, diff it against the previous
 * live revision, append the history entry, then render the new latest to the
 * public `published/` output. Publish always renders.
 */
export async function cmdPublish(slug: string, opts: PublishOptions = {}): Promise<PublishResult> {
  const ctx = ctxOf(opts)
  // Validate the draft before mutating anything; an invalid draft writes nothing.
  loadOrThrow(ctx, slug, 'draft')

  const prevId = liveRevision(readHistory(ctx, slug))
  const prevDir = prevId === null ? null : revisionDir(ctx, slug, prevId)

  const id = nextRevisionId(ctx, slug)
  const snap = snapshot(ctx, slug)
  // nextRevisionId is computed before the copy; they must agree.
  if (snap.id !== id) {
    throw new Error(`Revision id race: expected ${id}, snapshot produced ${snap.id}`)
  }

  const changes = diffSnapshots(prevDir, snap.dir)
  const basedOn = readDraftBase(ctx, slug).basedOn
  appendHistory(ctx, slug, {
    id,
    publishedAt: opts.now ?? new Date().toISOString(),
    message: opts.message ?? '',
    by: opts.by ?? null,
    basedOn,
    changes,
  })
  // The new revision is now the draft's lineage parent.
  writeDraftBase(ctx, slug, id)

  const loaded = loadOrThrow(ctx, slug, 'latest')
  const outDir = distDir(ctx, slug, 'published')
  await renderSite(loaded, outDir)

  return { id, revisionDir: snap.dir, outDir, changes }
}

// ── checkout ──────────────────────────────────────────────────────────────────

export interface CheckoutOptions extends GlobalOptions {
  force?: boolean
}

export interface CheckoutResult {
  id: number
  draftDir: string
}

/**
 * Copy a revision (default: latest) into `draft/`. Refuses when `draft/` has
 * uncommitted changes versus the current live revision, unless `--force`.
 * Forward-only: checking out an old revision then publishing creates a new
 * highest revision (it never rewinds history).
 */
export function cmdCheckout(
  slug: string,
  revId?: number,
  opts: CheckoutOptions = {},
): CheckoutResult {
  const ctx = ctxOf(opts)
  const history = readHistory(ctx, slug)
  const live = liveRevision(history)
  if (live === null) {
    throw new Error(`Site '${slug}' has no revisions to check out.`)
  }
  const target = revId ?? live
  if (!pathExists(revisionDir(ctx, slug, target))) {
    throw new Error(`Revision ${target} does not exist for site '${slug}'.`)
  }

  const draft = draftDir(ctx, slug)
  if (!opts.force && pathExists(draft)) {
    const dirty = diffSnapshots(revisionDir(ctx, slug, live), draft)
    const changed = dirty.added.length + dirty.modified.length + dirty.removed.length
    if (changed > 0) {
      throw new Error(
        `draft/ has uncommitted changes (${changed} file(s)); publish them or pass --force to discard.`,
      )
    }
  }

  emptyDir(draft)
  copyDir(revisionDir(ctx, slug, target), draft)
  writeDraftBase(ctx, slug, target)
  return { id: target, draftDir: draft }
}
