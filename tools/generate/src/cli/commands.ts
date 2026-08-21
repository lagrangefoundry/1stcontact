import path from 'node:path'
import { InvalidDefinitionError } from './errors'
import type { GlobalOptions } from './options'
import { renderSite } from '../render/write'
import type { EditActor, RenderChannel, Root, StoreContext } from '../store'
import {
  distDir,
  draftDir,
  ensureDir,
  fsSiteStore,
  listDirs,
  liveRevisionOf,
  loadSite,
  pathExists,
  readHistory,
  siteDir,
  writeDraftBase,
  writeJson,
} from '../store'
import type { LoadedSite, RevisionEntry, SiteSource } from '../store'
import {
  checkoutRevision,
  publishSite,
  revisionHistory,
  type CheckoutResult,
  type PublishResult,
} from '../publish/publish'
import { starterHomePage, starterSiteJson } from './scaffold'


export type { GlobalOptions } from './options'

export function ctxOf(opts: GlobalOptions): StoreContext {
  const root: Root = opts.sandbox ? 'sandbox' : 'sites'
  return { cwd: opts.cwd ?? process.cwd(), root }
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
    latest: liveRevisionOf(readHistory(ctx, slug).revisions),
  }))
}

// ── revisions ─────────────────────────────────────────────────────────────────

/** The publish log, newest-first. */
export function cmdRevisions(slug: string, opts: GlobalOptions = {}): Promise<RevisionEntry[]> {
  return revisionHistory(fsSiteStore(ctxOf(opts)), slug)
}

// ── render ────────────────────────────────────────────────────────────────────

export interface RenderOptions extends GlobalOptions {
  source?: SiteSource
  out?: string
  /**
   * REQ-116 — render the **edit** channel: the page the builder's editor works
   * on (DOC-28 §5). Always rendered from `draft/`, because the editor edits the
   * draft; a revision is immutable and there is nothing on it to edit.
   */
  edit?: boolean
}

export interface RenderResult {
  outDir: string
  files: string[]
}

/** Render a site (default `--source draft`) to its private preview directory. */
export async function cmdRender(slug: string, opts: RenderOptions = {}): Promise<RenderResult> {
  const ctx = ctxOf(opts)
  const edit = opts.edit === true
  // REQ-116 — the edit channel renders the draft, and only the draft. `--edit`
  // therefore SETTLES the source rather than combining with it: a revision is
  // immutable, so an edit render of one would be a page offering to change
  // something that cannot change.
  const source = edit ? 'draft' : (opts.source ?? 'draft')
  const loaded = loadOrThrow(ctx, slug, source)
  const channel: RenderChannel = edit ? 'edit' : source === 'draft' ? 'draft' : 'published'
  const outDir = opts.out ?? distDir(ctx, slug, channel)
  const files = await renderSite(loaded, outDir, { edit })
  return { outDir, files }
}

// ── publish ───────────────────────────────────────────────────────────────────

export interface PublishOptions extends GlobalOptions {
  message?: string
  by?: string
  /** ISO timestamp to record (injectable for deterministic tests). */
  now?: string
}

export interface CliPublishResult extends PublishResult {
  /** Where the rendered output landed, for the CLI's report. */
  outDir: string
}

/**
 * `1c publish` — the publish service, over the filesystem store.
 *
 * A CLIENT, NOT AN IMPLEMENTATION (REQ-149 AC-6/AC-7). Every step that used to
 * be here — mint an id, copy a directory, diff two trees, append `history.json`,
 * render — is `publishSite`'s, and the builder's `/api/publish` calls the same
 * function against D1 and R2. What is left is the two things only a CLI knows:
 * which store it is talking to, and where to tell the operator to look.
 *
 * It does NOT go over HTTP to reach the Worker. It could — the route exists —
 * but that would make a one-shot command depend on a running server to do
 * something it can do directly, and the thing worth sharing was the sequence
 * rather than a wire format.
 */
export async function cmdPublish(
  slug: string,
  opts: PublishOptions = {},
): Promise<CliPublishResult> {
  const ctx = ctxOf(opts)
  const result = await publishSite(fsSiteStore(ctx), slug, opts)
  return { ...result, outDir: distDir(ctx, slug, 'published') }
}

// ── checkout ──────────────────────────────────────────────────────────────────

export interface CheckoutOptions extends GlobalOptions {
  force?: boolean
}

export interface CliCheckoutResult extends CheckoutResult {
  draftDir: string
}

/**
 * `1c checkout` — replace the draft with a revision. Forward-only: publishing
 * afterwards mints a NEW highest revision and records what it descended from.
 */
export async function cmdCheckout(
  slug: string,
  revId?: number,
  opts: CheckoutOptions = {},
): Promise<CliCheckoutResult> {
  const ctx = ctxOf(opts)
  const result = await checkoutRevision(fsSiteStore(ctx), slug, revId, opts)
  return { ...result, draftDir: draftDir(ctx, slug) }
}
