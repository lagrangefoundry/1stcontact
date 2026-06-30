import { copyFileSync } from 'node:fs'
import path from 'node:path'
import { validateSite } from '@1stcontact/site-schema'
import type { Root, StoreContext } from '../store'
import {
  diffSnapshots,
  draftDir,
  ensureDir,
  listFilesRel,
  liveRevision,
  pathExists,
  readHistory,
  readJson,
  removePath,
  revisionDir,
  writeJson,
} from '../store'
import type { GlobalOptions } from './commands'
import { CommandError } from './errors'

/**
 * The structured-edit command surface (REQ-11): validated, AI-legible read and
 * write operations over a site's `draft/`. These are the file-based precursor
 * to the future AI builder tool surface, so two properties are load-bearing:
 *
 * - **Atomic.** A write command assembles the *resulting* definition in memory
 *   and validates it against `@1stcontact/site-schema` BEFORE touching disk. On
 *   any validation failure the draft is left byte-unchanged.
 * - **Structured failures.** Every failure is a {@link CommandError} with a
 *   stable code, message, path, and hint — never a bare stack trace.
 *
 * These commands mutate the draft only. `publish` (REQ-9) remains the sole
 * creator of revisions; pending changes are *derived* by `status`, never logged.
 */

/** The data payload plus a human-readable rendering for one command result. */
export interface EditOutput {
  data: unknown
  human: string
}

function ctxOf(opts: GlobalOptions): StoreContext {
  const root: Root = opts.sandbox ? 'sandbox' : 'sites'
  return { cwd: opts.cwd ?? process.cwd(), root }
}

// ── on-disk helpers ────────────────────────────────────────────────────────

function siteJsonPath(ctx: StoreContext, slug: string): string {
  return path.join(draftDir(ctx, slug), 'site.json')
}

function pagesDirOf(ctx: StoreContext, slug: string): string {
  return path.join(draftDir(ctx, slug), 'pages')
}

function assetsDirOf(ctx: StoreContext, slug: string): string {
  return path.join(draftDir(ctx, slug), 'assets')
}

/** Fail with NOT_FOUND unless the site has a draft we can operate on. */
function requireDraft(ctx: StoreContext, slug: string): void {
  if (!pathExists(draftDir(ctx, slug))) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Site '${slug}' has no draft.`,
      path: slug,
      hint: `Create it with '1c new ${slug}'${ctx.root === 'sandbox' ? ' --sandbox' : ''}.`,
    })
  }
}

/** Read the raw `site.json` metadata object (everything but pages). */
function readBase(ctx: StoreContext, slug: string): Record<string, unknown> {
  requireDraft(ctx, slug)
  const p = siteJsonPath(ctx, slug)
  if (!pathExists(p)) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Site '${slug}' has no site.json.`,
      path: slug,
    })
  }
  return readJson<Record<string, unknown>>(p)
}

interface PageFile {
  /** Path relative to `pages/`, e.g. `home.json`. */
  rel: string
  abs: string
  page: Record<string, unknown>
}

/** Read every `pages/*.json` file, sorted by filename (load order). */
function readPageFiles(ctx: StoreContext, slug: string): PageFile[] {
  const dir = pagesDirOf(ctx, slug)
  return listFilesRel(dir)
    .filter((rel) => rel.endsWith('.json'))
    .map((rel) => {
      const abs = path.join(dir, rel)
      return { rel, abs, page: readJson<Record<string, unknown>>(abs) }
    })
}

/** Locate the page file whose definition `id` matches `pageId`, or null. */
function findPageFile(files: PageFile[], pageId: string): PageFile | null {
  return files.find((f) => f.page.id === pageId) ?? null
}

/**
 * Assemble `{ ...base, pages }` and validate it as a whole site definition.
 * Throws SCHEMA_INVALID (carrying the first error's JSON-pointer path) on
 * failure — the caller has not yet written anything, so the draft is untouched.
 */
function validateOrThrow(base: Record<string, unknown>, pages: unknown[]): void {
  const result = validateSite({ ...base, pages })
  if (!result.ok) {
    const first = result.errors[0]
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: first ? `${first.path}: ${first.message}` : 'Definition failed schema validation.',
      path: first?.path,
      hint: 'Adjust the value to satisfy the site schema, or omit it if optional.',
    })
  }
}

// ── dotted-path access (config get/set) ──────────────────────────────────────

/** Read a dotted key (`config.businessName`, `theme.palette.primary`). */
function getDotted(obj: Record<string, unknown>, key: string): unknown {
  let cur: unknown = obj
  for (const seg of key.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[seg]
  }
  return cur
}

/** Set a dotted key in a deep clone, creating intermediate objects as needed. */
function setDotted(obj: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
  const clone = structuredClone(obj)
  const segs = key.split('.')
  let cur: Record<string, unknown> = clone
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]
    const next = cur[seg]
    if (next === null || typeof next !== 'object' || Array.isArray(next)) {
      cur[seg] = {}
    }
    cur = cur[seg] as Record<string, unknown>
  }
  cur[segs[segs.length - 1]] = value
  return clone
}

/** Parse a CLI value as JSON, falling back to the raw string when it is not JSON. */
function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

// ── reference scanning (rm integrity checks) ─────────────────────────────────

/** Nav entry labels whose target points at `pageId` (page or anchor targets). */
function navEntriesTargeting(base: Record<string, unknown>, pageId: string): string[] {
  const nav = base.nav
  if (nav === null || typeof nav !== 'object') return []
  const entries = (nav as Record<string, unknown>).entries
  if (!Array.isArray(entries)) return []
  const labels: string[] = []
  for (const entry of entries) {
    if (entry === null || typeof entry !== 'object') continue
    const target = (entry as Record<string, unknown>).target as Record<string, unknown> | undefined
    if (target && (target.kind === 'page' || target.kind === 'anchor') && target.pageId === pageId) {
      labels.push(String((entry as Record<string, unknown>).label ?? '(unlabelled)'))
    }
  }
  return labels
}

/** Drop nav entries that target `pageId` from a base clone. */
function stripNavTargeting(base: Record<string, unknown>, pageId: string): Record<string, unknown> {
  const clone = structuredClone(base)
  const nav = clone.nav as Record<string, unknown> | undefined
  if (nav && Array.isArray(nav.entries)) {
    nav.entries = (nav.entries as Record<string, unknown>[]).filter((entry) => {
      const target = entry?.target as Record<string, unknown> | undefined
      return !(target && (target.kind === 'page' || target.kind === 'anchor') && target.pageId === pageId)
    })
  }
  return clone
}

/** Descriptor of one module-content reference to an asset by id. */
interface AssetRefSite {
  pageId: string
  moduleId: string
  field: string
}

/** Does a content value (recursively) contain an asset-ref object with this id? */
function valueReferencesAsset(value: unknown, assetName: string): boolean {
  if (Array.isArray(value)) return value.some((v) => valueReferencesAsset(v, assetName))
  if (value !== null && typeof value === 'object') {
    return (value as Record<string, unknown>).id === assetName
  }
  return false
}

/** Every module-content field across all pages that references `assetName`. */
function assetReferences(files: PageFile[], assetName: string): AssetRefSite[] {
  const out: AssetRefSite[] = []
  for (const { page } of files) {
    const modules = page.modules
    if (!Array.isArray(modules)) continue
    for (const m of modules as Record<string, unknown>[]) {
      const content = m?.content as Record<string, unknown> | undefined
      if (!content || typeof content !== 'object') continue
      for (const [field, value] of Object.entries(content)) {
        if (valueReferencesAsset(value, assetName)) {
          out.push({ pageId: String(page.id), moduleId: String(m.id), field })
        }
      }
    }
  }
  return out
}

// ── page commands ────────────────────────────────────────────────────────────

export function editPageList(slug: string, opts: GlobalOptions = {}): EditOutput {
  const ctx = ctxOf(opts)
  requireDraft(ctx, slug)
  const pages = readPageFiles(ctx, slug).map((f) => ({
    id: f.page.id,
    slug: f.page.slug,
    title: f.page.title,
  }))
  const human =
    pages.length === 0
      ? '(no pages)'
      : pages.map((p) => `${String(p.id)}\t${String(p.slug)}\t${String(p.title)}`).join('\n')
  return { data: { pages }, human }
}

export function editPageGet(slug: string, pageId: string, opts: GlobalOptions = {}): EditOutput {
  const ctx = ctxOf(opts)
  requireDraft(ctx, slug)
  const file = findPageFile(readPageFiles(ctx, slug), pageId)
  if (!file) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Page '${pageId}' not found in site '${slug}'.`,
      path: pageId,
      hint: `List pages with '1c page list ${slug}'.`,
    })
  }
  return { data: { page: file.page }, human: JSON.stringify(file.page, null, 2) }
}

export interface PageWriteOptions extends GlobalOptions {
  title?: string
  path?: string
}

export function editPageAdd(slug: string, pageId: string, opts: PageWriteOptions = {}): EditOutput {
  const ctx = ctxOf(opts)
  const base = readBase(ctx, slug)
  const files = readPageFiles(ctx, slug)

  if (findPageFile(files, pageId)) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Page id '${pageId}' already exists in site '${slug}'.`,
      path: pageId,
      hint: 'Choose a different page id, or update the existing page.',
    })
  }
  const pageSlug = opts.path ?? pageId
  if (files.some((f) => f.page.slug === pageSlug)) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Page path '${pageSlug}' is already used in site '${slug}'.`,
      path: pageSlug,
      hint: 'Pass a unique --path.',
    })
  }
  const destAbs = path.join(pagesDirOf(ctx, slug), `${pageId}.json`)
  if (pathExists(destAbs)) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Page file '${pageId}.json' already exists.`,
      path: `${pageId}.json`,
    })
  }

  const newPage: Record<string, unknown> = {
    id: pageId,
    slug: pageSlug,
    title: opts.title ?? pageId,
    modules: [],
  }
  validateOrThrow(base, [...files.map((f) => f.page), newPage])

  writeJson(destAbs, newPage)
  return { data: { page: newPage }, human: `Added page '${pageId}' (path: ${pageSlug}).` }
}

export function editPageUpdate(slug: string, pageId: string, opts: PageWriteOptions = {}): EditOutput {
  const ctx = ctxOf(opts)
  const base = readBase(ctx, slug)
  const files = readPageFiles(ctx, slug)
  const file = findPageFile(files, pageId)
  if (!file) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Page '${pageId}' not found in site '${slug}'.`,
      path: pageId,
      hint: `List pages with '1c page list ${slug}'.`,
    })
  }
  if (opts.title === undefined && opts.path === undefined) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: 'Nothing to update; pass --title and/or --path.',
      hint: 'Provide at least one field to change.',
    })
  }
  if (opts.path !== undefined && files.some((f) => f !== file && f.page.slug === opts.path)) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Page path '${opts.path}' is already used in site '${slug}'.`,
      path: opts.path,
      hint: 'Pass a unique --path.',
    })
  }

  const updated: Record<string, unknown> = { ...file.page }
  if (opts.title !== undefined) updated.title = opts.title
  if (opts.path !== undefined) updated.slug = opts.path

  const pages = files.map((f) => (f === file ? updated : f.page))
  validateOrThrow(base, pages)

  writeJson(file.abs, updated)
  return { data: { page: updated }, human: `Updated page '${pageId}'.` }
}

export interface PageRmOptions extends GlobalOptions {
  force?: boolean
}

export function editPageRm(slug: string, pageId: string, opts: PageRmOptions = {}): EditOutput {
  const ctx = ctxOf(opts)
  const base = readBase(ctx, slug)
  const files = readPageFiles(ctx, slug)
  const file = findPageFile(files, pageId)
  if (!file) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Page '${pageId}' not found in site '${slug}'.`,
      path: pageId,
    })
  }

  const referencing = navEntriesTargeting(base, pageId)
  if (referencing.length > 0 && !opts.force) {
    throw new CommandError({
      code: 'REFERENTIAL_INTEGRITY',
      message: `Page '${pageId}' is targeted by nav entr${referencing.length === 1 ? 'y' : 'ies'}: ${referencing
        .map((l) => `'${l}'`)
        .join(', ')}.`,
      path: pageId,
      hint: 'Remove the nav entry first, or pass --force to remove it automatically.',
    })
  }

  const newBase = referencing.length > 0 ? stripNavTargeting(base, pageId) : base
  const newPages = files.filter((f) => f !== file).map((f) => f.page)
  validateOrThrow(newBase, newPages)

  if (newBase !== base) writeJson(siteJsonPath(ctx, slug), newBase)
  removePath(file.abs)
  return {
    data: { removed: pageId, navEntriesRemoved: referencing.length },
    human: `Removed page '${pageId}'${
      referencing.length > 0 ? ` and ${referencing.length} nav entr${referencing.length === 1 ? 'y' : 'ies'}` : ''
    }.`,
  }
}

// ── config commands ──────────────────────────────────────────────────────────

export function editConfigGet(slug: string, key: string | undefined, opts: GlobalOptions = {}): EditOutput {
  const ctx = ctxOf(opts)
  const base = readBase(ctx, slug)
  if (key === undefined) {
    return { data: { config: base }, human: JSON.stringify(base, null, 2) }
  }
  const value = getDotted(base, key)
  if (value === undefined) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Config key '${key}' not found in site '${slug}'.`,
      path: key,
      hint: `Read the whole object with '1c config get ${slug}'.`,
    })
  }
  return {
    data: { key, value },
    human: `${key} = ${typeof value === 'string' ? value : JSON.stringify(value)}`,
  }
}

export function editConfigSet(slug: string, key: string, rawValue: string, opts: GlobalOptions = {}): EditOutput {
  const ctx = ctxOf(opts)
  const base = readBase(ctx, slug)
  const value = parseValue(rawValue)
  const newBase = setDotted(base, key, value)
  const files = readPageFiles(ctx, slug)
  validateOrThrow(newBase, files.map((f) => f.page))

  writeJson(siteJsonPath(ctx, slug), newBase)
  return {
    data: { key, value },
    human: `Set ${key} = ${typeof value === 'string' ? value : JSON.stringify(value)}`,
  }
}

// ── asset commands ───────────────────────────────────────────────────────────

function assetRegistry(base: Record<string, unknown>): Record<string, unknown>[] {
  const assets = base.assets
  return Array.isArray(assets) ? (assets as Record<string, unknown>[]) : []
}

export function editAssetList(slug: string, opts: GlobalOptions = {}): EditOutput {
  const ctx = ctxOf(opts)
  const base = readBase(ctx, slug)
  const assets = assetRegistry(base)
  const human =
    assets.length === 0
      ? '(no assets)'
      : assets.map((a) => `${String(a.id)}\t${String(a.src)}`).join('\n')
  return { data: { assets }, human }
}

export function editAssetGet(slug: string, assetName: string, opts: GlobalOptions = {}): EditOutput {
  const ctx = ctxOf(opts)
  const base = readBase(ctx, slug)
  const asset = assetRegistry(base).find((a) => a.id === assetName)
  if (!asset) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Asset '${assetName}' not found in site '${slug}'.`,
      path: assetName,
      hint: `List assets with '1c asset list ${slug}'.`,
    })
  }
  return { data: { asset }, human: JSON.stringify(asset, null, 2) }
}

export interface AssetAddOptions extends GlobalOptions {
  /** Registered name (and on-disk filename); defaults to the source basename. */
  as?: string
}

export function editAssetAdd(slug: string, file: string, opts: AssetAddOptions = {}): EditOutput {
  const ctx = ctxOf(opts)
  const base = readBase(ctx, slug)
  const name = opts.as ?? path.basename(file)

  if (!pathExists(file)) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Source file '${file}' does not exist.`,
      path: file,
      hint: 'Pass a path to a readable file.',
    })
  }
  const assets = assetRegistry(base)
  if (assets.some((a) => a.id === name)) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Asset '${name}' is already registered in site '${slug}'.`,
      path: name,
      hint: 'Choose a different name with --as.',
    })
  }
  const destAbs = path.join(assetsDirOf(ctx, slug), name)
  if (pathExists(destAbs)) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Asset file '${name}' already exists in draft/assets.`,
      path: name,
      hint: 'Choose a different name with --as.',
    })
  }

  const newAsset: Record<string, unknown> = { id: name, src: name, alt: '' }
  const newBase = { ...base, assets: [...assets, newAsset] }
  // Validate the registry before any byte hits disk.
  validateOrThrow(newBase, readPageFiles(ctx, slug).map((f) => f.page))

  ensureDir(assetsDirOf(ctx, slug))
  copyFileSync(file, destAbs)
  writeJson(siteJsonPath(ctx, slug), newBase)
  return { data: { asset: newAsset }, human: `Added asset '${name}'.` }
}

export interface AssetRmOptions extends GlobalOptions {
  force?: boolean
}

export function editAssetRm(slug: string, assetName: string, opts: AssetRmOptions = {}): EditOutput {
  const ctx = ctxOf(opts)
  const base = readBase(ctx, slug)
  const assets = assetRegistry(base)
  const asset = assets.find((a) => a.id === assetName)
  if (!asset) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Asset '${assetName}' not found in site '${slug}'.`,
      path: assetName,
    })
  }

  const files = readPageFiles(ctx, slug)
  const refs = assetReferences(files, assetName)
  if (refs.length > 0 && !opts.force) {
    const first = refs[0]
    throw new CommandError({
      code: 'REFERENTIAL_INTEGRITY',
      message: `Asset '${assetName}' is referenced by ${refs.length} module field(s), e.g. page '${first.pageId}' module '${first.moduleId}' field '${first.field}'.`,
      path: `${first.pageId}/${first.moduleId}/${first.field}`,
      hint: 'Detach the asset from those modules first, or pass --force to remove it anyway.',
    })
  }

  const newBase = { ...base, assets: assets.filter((a) => a.id !== assetName) }
  validateOrThrow(newBase, files.map((f) => f.page))

  writeJson(siteJsonPath(ctx, slug), newBase)
  const fileAbs = path.join(assetsDirOf(ctx, slug), String(asset.src ?? assetName))
  if (pathExists(fileAbs)) removePath(fileAbs)
  return {
    data: { removed: assetName, referencesIgnored: refs.length },
    human: `Removed asset '${assetName}'${refs.length > 0 ? ` (left ${refs.length} dangling reference(s))` : ''}.`,
  }
}

// ── status ───────────────────────────────────────────────────────────────────

export function editStatus(slug: string, opts: GlobalOptions = {}): EditOutput {
  const ctx = ctxOf(opts)
  requireDraft(ctx, slug)
  const live = liveRevision(readHistory(ctx, slug))
  const prevDir = live === null ? null : revisionDir(ctx, slug, live)
  const changes = diffSnapshots(prevDir, draftDir(ctx, slug))
  const total = changes.added.length + changes.modified.length + changes.removed.length
  const lines: string[] = [`baseRevision: ${live === null ? '(none)' : `r${live}`}`]
  for (const rel of changes.added) lines.push(`A  ${rel}`)
  for (const rel of changes.modified) lines.push(`M  ${rel}`)
  for (const rel of changes.removed) lines.push(`D  ${rel}`)
  if (total === 0) lines.push('(no pending changes)')
  return { data: { baseRevision: live, ...changes }, human: lines.join('\n') }
}
