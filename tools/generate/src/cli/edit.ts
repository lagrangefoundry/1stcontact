import { copyFileSync } from 'node:fs'
import path from 'node:path'
import {
  applyCopyFields,
  copyFieldsOf,
  parseL1Path,
  replaceL1Node,
  resolveL1Node,
  validateSite,
  type L1Node,
  type L1SegmentFieldOptions,
} from '@1stcontact/site-schema'
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

// ── copy commands (REQ-117) ──────────────────────────────────────────────────
//
// The editor's write path, and it is deliberately *these* commands rather than a
// path of its own. DOC-28 §4's invariant is that every edit the page editor makes
// is a structured, validated diff through the same validator the AI's edits use —
// the editor and the chat AI are peers, not two mechanisms. Peers share a surface;
// they do not each get one. So a copy edit lands here, beside `page`/`config`/
// `asset`, inheriting this module's two load-bearing properties unchanged:
// atomic (validate the *resulting* definition before a byte hits disk) and
// structured failures.
//
// The whole exposed vocabulary is a change map of plain strings. There is no
// argument this surface accepts that could carry raw HTML or CSS, because the
// only thing it can write is an L1 `text` run's words — and the renderer escapes
// those (DOC-2). "No raw-editing mode" is therefore a property of the surface's
// shape, not a rule it has to remember.

/** A segment address on the CLI: the page, the path, and the scope it indexes. */
export interface CopyTargetOptions extends GlobalOptions {
  /** The behavior-module instance whose slot roots the address, if any. */
  module?: string
  /** The named slot within that instance. */
  slot?: string
}

/**
 * The node list the address indexes — `[doc.root]` for the page's own L1, or a
 * behavior instance's slot subtrees. This mirrors what the renderer handed to
 * `renderL1Fragment` when it stamped the address, which is why the same path
 * resolves in both spaces.
 */
function segmentRoots(
  page: Record<string, unknown>,
  pageId: string,
  target: CopyTargetOptions,
): L1Node[] {
  if (target.module === undefined) {
    const l1 = page.l1 as { root?: L1Node } | undefined
    if (!l1?.root) {
      throw new CommandError({
        code: 'NOT_FOUND',
        message: `Page '${pageId}' has no L1 document.`,
        path: pageId,
        hint: 'Only an L1 page carries editable segments.',
      })
    }
    return [l1.root]
  }

  const modules = Array.isArray(page.modules) ? (page.modules as Record<string, unknown>[]) : []
  const instance = modules.find((m) => m.id === target.module)
  if (!instance) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Page '${pageId}' has no module instance '${target.module}'.`,
      path: `${pageId}/${target.module}`,
      hint: `Inspect the page with '1c page get <slug> ${pageId}'.`,
    })
  }
  if (target.slot === undefined) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: 'An address inside a module instance must name the slot it indexes.',
      path: String(target.module),
      hint: 'Pass --slot <name>; the edit render stamps it as data-l1-slot.',
    })
  }
  const slots = (instance.slots ?? {}) as Record<string, unknown>
  const raw = slots[target.slot]
  if (raw === undefined) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Module '${String(target.module)}' has no slot '${target.slot}'.`,
      path: `${pageId}/${String(target.module)}/${target.slot}`,
    })
  }
  // A repeated slot holds one subtree per item; a single slot holds one subtree.
  // The emitter renders both as a node LIST, so both resolve identically here.
  return Array.isArray(raw) ? (raw as L1Node[]) : [raw as L1Node]
}

/**
 * Put a root list back where {@link segmentRoots} read it from (REQ-129).
 *
 * `segmentRoots` sometimes hands back a live reference (a repeated slot's array)
 * and sometimes a fresh one-element list it built (`[doc.root]`, a single slot's
 * subtree), so a caller that replaced an entry cannot know whether the page it
 * holds already reflects the change. This writes it back in every case, which is
 * why the two functions are read here as one pair rather than as a getter with a
 * caveat.
 *
 * Reached only after `segmentRoots` succeeded on the same page and target, so
 * every lookup it repeats is known to resolve.
 */
function writeSegmentRoots(
  page: Record<string, unknown>,
  target: CopyTargetOptions,
  roots: L1Node[],
): void {
  if (target.module === undefined) {
    ;(page.l1 as { root: L1Node }).root = roots[0]
    return
  }
  const modules = page.modules as Record<string, unknown>[]
  const instance = modules.find((m) => m.id === target.module) as Record<string, unknown>
  const slots = instance.slots as Record<string, unknown>
  const slot = target.slot as string
  slots[slot] = Array.isArray(slots[slot]) ? roots : roots[0]
}

/** The page file, the (possibly cloned) page, and the addressed node within it. */
interface ResolvedSegment {
  file: PageFile
  page: Record<string, unknown>
  node: L1Node
}

function resolveSegment(
  ctx: StoreContext,
  slug: string,
  pageId: string,
  rawPath: string,
  target: CopyTargetOptions,
  /** Resolve against a deep clone, so a write can be abandoned without a trace. */
  clone: boolean,
): { files: PageFile[] } & ResolvedSegment {
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
  const path = parseL1Path(rawPath)
  if (!path) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `'${rawPath}' is not a segment address.`,
      path: rawPath,
      hint: 'An address is dotted child indices, e.g. 0.2.1 — read it off data-l1-path.',
    })
  }
  const page = clone ? structuredClone(file.page) : file.page
  const node = resolveL1Node(segmentRoots(page, pageId, target), path)
  if (!node) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Address '${rawPath}' resolves to no node in page '${pageId}'.`,
      path: rawPath,
      hint: 'Addresses are render-scoped: re-read it from the current edit render.',
    })
  }
  return { files, file, page, node }
}

/**
 * The node kinds whose derivation offers a pick from the site's images: an
 * `image` node's `src` (REQ-118) and a painted surface's `backgroundImageUrl`
 * (REQ-128). Both draw from the SAME listing, so the picker for what sits in
 * front and the picker for what sits behind can never disagree about what the
 * site has.
 */
const PICKER_KINDS: ReadonlySet<L1Node['kind']> = new Set(['image', 'box', 'container'])

/**
 * What the derivation needs beyond the node itself (REQ-118, REQ-128).
 *
 * Only a segment with a picker has choices that come from the site rather than
 * the node, and reading the asset directory for a text run would be pure waste —
 * so the listing is fetched for the kinds that use it and skipped for the rest.
 */
function segmentOptions(
  node: L1Node,
  slug: string,
  opts: GlobalOptions,
): L1SegmentFieldOptions | undefined {
  return PICKER_KINDS.has(node.kind) ? { assets: imageHandles(slug, opts) } : undefined
}

/**
 * The modal's input: the descriptors and current values for one segment, or an
 * empty field list when the segment exposes nothing (DOC-28 §6.2). An empty list
 * is a legitimate answer — a container or a module instance is a real segment
 * with no phase-1 control — so it reads as "nothing to edit here", not an error.
 */
export function editCopyGet(
  slug: string,
  pageId: string,
  rawPath: string,
  opts: CopyTargetOptions = {},
): EditOutput {
  const ctx = ctxOf(opts)
  requireDraft(ctx, slug)
  const { node } = resolveSegment(ctx, slug, pageId, rawPath, opts, false)
  const derived = copyFieldsOf(node, segmentOptions(node, slug, opts))
  const data = {
    target: { pageId, module: opts.module, slot: opts.slot, path: rawPath },
    kind: node.kind,
    fields: derived?.fields ?? [],
    values: derived?.values ?? {},
  }
  const human = derived
    ? derived.fields
        .map((f) => `${f.name}\t${JSON.stringify(derived.values[f.name] ?? '')}`)
        .join('\n')
    : `(no editable copy on this ${node.kind} segment)`
  return { data, human }
}

/**
 * Apply one modal's worth of copy changes.
 *
 * **One invocation is one diff** (DOC-28 §11): the whole change map is applied,
 * validated and written together, however many fields it names. That is why the
 * modal runs `mountFields` in `buffered` commit — `auto` would emit a diff per
 * field and this command would be called once per keystroke-settle, producing a
 * re-render each time and a history the user never asked for.
 *
 * Nothing is written unless the resulting definition validates. On failure the
 * clone is discarded and the draft is byte-unchanged, so the iframe still shows
 * exactly the state the user was editing.
 */
export function editCopySet(
  slug: string,
  pageId: string,
  rawPath: string,
  values: Record<string, unknown>,
  opts: CopyTargetOptions = {},
): EditOutput {
  const ctx = ctxOf(opts)
  const base = readBase(ctx, slug)
  const { files, file, page, node } = resolveSegment(ctx, slug, pageId, rawPath, opts, true)

  const applied = applyCopyFields(node, values, segmentOptions(node, slug, opts))
  if (!applied.ok) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: applied.message,
      path: applied.field ? `${rawPath}/${applied.field}` : rawPath,
      hint: `Read the segment's fields with '1c copy get ${slug} ${pageId} ${rawPath}'.`,
    })
  }

  // The shared validator, layer 1 (DOC-8 §7) — the same call `page`, `config` and
  // `asset` make, and the same one the AI's tool surface will. It runs the site
  // schema AND the L1 envelope over the whole resulting definition.
  validateOrThrow(base, files.map((f) => (f === file ? page : f.page)))

  writeJson(file.abs, page)
  return {
    data: {
      target: { pageId, module: opts.module, slot: opts.slot, path: rawPath },
      changed: applied.changed,
      values,
    },
    human:
      applied.changed.length === 0
        ? `No change at ${rawPath} (value already current).`
        : `Updated ${applied.changed.join(', ')} at ${rawPath} in page '${pageId}'.`,
  }
}

// ── L1 authoring: read and write one subtree, verbatim (REQ-129) ─────────────
//
// The copy commands above are the click-to-edit modal's contract: four fields,
// the granularity a non-technical operator clicking a heading needs. These two
// are the AUTHORING pair, and they are deliberately the whole language rather
// than a projection of it — a caller that can only see `text` cannot compose a
// nav bar, and 86 of `xgd/home`'s 122 nodes carry `axes` that no projection
// reaches.
//
// VERBATIM IS THE DECISION. `editL1Get` returns what is stored, unresolved:
// palette refs stay refs, responsive tracks stay tracks. A resolved view reads
// better and cannot be written back, and read/write symmetry around one address
// is the entire point of the pair.
//
// Nothing new is validated. `validateOrThrow` already runs the site schema AND
// `validateL1`'s full envelope — numeric ranges, the URL-scheme allowlist, the
// node-count cap, geometry-track well-formedness, unique ids — over the whole
// assembled site before a byte is written, and reports JSON-pointer paths built
// for exactly this caller. The guarantee that no HTML, CSS or JavaScript can be
// written therefore MOVES here: it used to hold because no operation accepted
// them, and it now holds because L1's schema is closed (`.strict()` objects,
// closed enums, hex-only colours, no raw-CSS hole by policy). Any hole found in
// that closure is a security finding, not a capability gap.

/** Read the subtree at one address, exactly as stored. */
export function editL1Get(
  slug: string,
  pageId: string,
  rawPath: string,
  opts: CopyTargetOptions = {},
): EditOutput {
  const ctx = ctxOf(opts)
  requireDraft(ctx, slug)
  const { node } = resolveSegment(ctx, slug, pageId, rawPath, opts, false)
  return {
    data: {
      target: { pageId, module: opts.module, slot: opts.slot, path: rawPath },
      node,
    },
    human: JSON.stringify(node, null, 2),
  }
}

/**
 * Replace the subtree at one address.
 *
 * Bounded by address on purpose. A whole-document write would be simpler and
 * worse: it costs the caller the entire page on every change, and it has them
 * rewriting regions they never intended to touch.
 *
 * Atomic on the same terms as every other write here — the replacement lands in
 * a clone, the resulting site is validated whole, and on refusal the clone is
 * discarded and the draft is byte-unchanged.
 *
 * UPSTREAM FINDING, recorded where it bites. `validateOrThrow` reports the
 * offending JSON pointer — `/pages/0/l1/root/children/1/axes/fontSizePx` — which
 * is precisely what a caller needs to correct a rejected subtree within the
 * turn, and `1c` users get it. A Toolbox caller does not: `Toolbox._renderHostError`
 * renders a declared code as `code + the surface's declared meaning` and drops
 * the host error's own message, with no channel for a per-call detail. That was
 * invisible while the only write was a four-field copy edit, where the generic
 * meaning was enough. It is not enough for a subtree, and the declared
 * `SCHEMA_INVALID` meaning carries the fallback strategy because of it.
 */
export function editL1Set(
  slug: string,
  pageId: string,
  rawPath: string,
  node: unknown,
  opts: CopyTargetOptions = {},
): EditOutput {
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
  const parsed = parseL1Path(rawPath)
  if (!parsed) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `'${rawPath}' is not a segment address.`,
      path: rawPath,
      hint: 'An address is dotted child indices, e.g. 0.2.1 — read it off a page map.',
    })
  }

  const page = structuredClone(file.page)
  const roots = segmentRoots(page, pageId, opts)
  if (!replaceL1Node(roots, parsed, node as L1Node)) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Address '${rawPath}' resolves to no node in page '${pageId}'.`,
      path: rawPath,
      hint: 'Addresses are render-scoped: re-read the page map and use the address it gives.',
    })
  }
  writeSegmentRoots(page, opts, roots)

  validateOrThrow(base, files.map((f) => (f === file ? page : f.page)))

  writeJson(file.abs, page)
  return {
    data: {
      target: { pageId, module: opts.module, slot: opts.slot, path: rawPath },
      changed: [rawPath],
      node,
    },
    human: `Replaced the element at ${rawPath} in page '${pageId}'.`,
  }
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

/** What an asset can be used for, derived from its extension. */
export type SiteAssetKind = 'image' | 'font' | 'other'

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif'])
const FONT_EXTENSIONS = new Set(['woff2', 'woff', 'ttf', 'otf'])

function assetKind(name: string): SiteAssetKind {
  const ext = name.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (FONT_EXTENSIONS.has(ext)) return 'font'
  return 'other'
}

/**
 * A reference that is already complete: an absolute URL, or a protocol-relative
 * one. Deliberately the same shape `l1/assets.ts` treats as "not site-local".
 */
const COMPLETE_REFERENCE = /^([a-z][a-z0-9+.-]*:|\/\/)/i

/**
 * The site-local handle an L1 node references, from any way of naming the asset.
 *
 * The registry stores a bare filename (`editAssetAdd` writes `src: name`) while
 * the capture fold writes `/assets/<name>`. Both name the same byte, so both
 * normalize to the fold's form — that is the vocabulary already in the pages,
 * and the picker must write it rather than a second one (DOC-28 §13 Q5). The
 * leading-`./`-or-`/` strip is the same rule `l1/assets.ts` applies.
 *
 * A reference that is ALREADY complete is passed through untouched. It names a
 * byte that is not under `draft/assets/`, so prefixing it would manufacture a
 * handle (`/assets/https://cdn.example/x.png`) that resolves to nothing and that
 * no page holds — a listing has to report what the site actually references, not
 * a rewrite of it. Whether such a handle may be *written* into a node stays the
 * envelope validator's call: its URL-scheme allowlist is the security boundary
 * (DOC-2), and normalising here must not quietly stand in for it.
 */
function assetHandle(src: string): string {
  const trimmed = src.trim()
  if (COMPLETE_REFERENCE.test(trimmed)) return trimmed
  const local = trimmed.replace(/^\.?\//, '')
  return local.startsWith('assets/') ? `/${local}` : `/assets/${local}`
}

/** One asset a site can reference, whether or not the registry knows about it. */
export interface SiteAsset {
  /** The registry id, or the filename when the file is unregistered. */
  id: string
  /** The handle to write into an L1 node — always `/assets/<name>`. */
  src: string
  alt: string
  kind: SiteAssetKind
  /** A file for it exists under `draft/assets/`. */
  onDisk: boolean
  /** `site.json`'s `assets` array carries an entry for it. */
  registered: boolean
}

/**
 * Every asset the site can reference (REQ-118 AC-7).
 *
 * Exported and free of any UI, because the image picker is not its only caller:
 * DOC-28 §9.2 has the same store surfaced as an asset browser mode, and `1c
 * asset list` reads it too. One listing, three consumers — the alternative is
 * three ideas of what a site's assets are.
 *
 * It is the UNION of two sources that genuinely disagree. The registry carries
 * metadata (`alt`, `focalPoint`) but every real site in `storage/` has an empty
 * one, so a registry-only picker offers nothing on the sites we actually build.
 * The directory carries the bytes but no metadata. Reporting both, with
 * provenance, is the honest answer: the picker can offer what exists, and a
 * future browser mode can show which files are undeclared.
 */
export function listSiteAssets(slug: string, opts: GlobalOptions = {}): SiteAsset[] {
  const ctx = ctxOf(opts)
  const base = readBase(ctx, slug)
  const byHandle = new Map<string, SiteAsset>()

  for (const rel of listFilesRel(assetsDirOf(ctx, slug))) {
    const src = assetHandle(rel)
    const kind = assetKind(rel)
    byHandle.set(src, { id: rel, src, alt: '', kind, onDisk: true, registered: false })
  }
  for (const entry of assetRegistry(base)) {
    const id = String(entry.id ?? '')
    const src = assetHandle(String(entry.src ?? id))
    const existing = byHandle.get(src)
    byHandle.set(src, {
      id: id || existing?.id || src,
      src,
      alt: typeof entry.alt === 'string' ? entry.alt : (existing?.alt ?? ''),
      kind: assetKind(String(entry.src ?? id)),
      onDisk: existing?.onDisk ?? false,
      registered: true,
    })
  }
  return [...byHandle.values()].sort((a, b) => a.src.localeCompare(b.src))
}

/** The handles an image picker may offer — the listing, narrowed to images. */
function imageHandles(slug: string, opts: GlobalOptions): string[] {
  return listSiteAssets(slug, opts)
    .filter((a) => a.kind === 'image')
    .map((a) => a.src)
}

export function editAssetList(slug: string, opts: GlobalOptions = {}): EditOutput {
  const assets = listSiteAssets(slug, opts)
  const human =
    assets.length === 0
      ? '(no assets)'
      : assets
          .map((a) => `${a.id}\t${a.src}\t${a.kind}${a.registered ? '' : '\t(unregistered)'}`)
          .join('\n')
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

// ── gap inversion (REQ-74) ───────────────────────────────────────────────────

/** REQ-74 — spacing token → px (mirrors SPACING_STEPS); content modules default `lg`. */
const SPACING_PX: Record<string, number> = { none: 0, sm: 16, md: 32, lg: 64, xl: 96, '2xl': 128, '3xl': 192 }
const DEFAULT_SPACING_TOP_PX = 64 // the text-block / services-grid / hero / contact-form default (lg)

export interface GapFix {
  moduleId: string
  boundary: string
  from: string
  to: string
  note?: string
}

/** The first rendered text of a module — in render order (wordmark/eyebrow BEFORE the
 *  heading), so a gap whose B is a module's heading but not its first row (e.g. the
 *  hero's eyebrow→heading gap) does NOT mis-attribute to that module's top boundary. */
function moduleFirstText(m: Record<string, unknown>): string | undefined {
  const c = m.content as Record<string, unknown> | undefined
  if (!c) return undefined
  const wm = c.wordmark as Record<string, unknown> | undefined
  if (typeof wm?.text === 'string') return wm.text
  const eb = c.eyebrow as Record<string, unknown> | undefined
  if (typeof eb?.text === 'string') return eb.text
  const h = c.heading as Record<string, unknown> | undefined
  if (typeof h?.text === 'string') return h.text
  if (typeof c.body === 'string') {
    const first = c.body
      .split('\n\n')[0]
      .replace(/^>\s*\[![^\]]*\]\s*/, '')
      .replace(/[[\]*_#>]/g, '')
      .trim()
    if (first) return first
  }
  if (typeof c.subhead === 'string') return c.subhead
  return undefined
}

const px = (v: string): number | null => {
  const n = parseFloat(v)
  return Number.isNaN(n) ? null : n
}

/**
 * REQ-74 — the gap inversion. A gap is linear in one spacing knob (∂gap/∂spacingTop = 1),
 * so to close a `gap` delta on a module's TOP boundary: `new spacingTop = current +
 * (ref_gap − our_gap)`. Match each gap's B-fragment (the row *below* the gap) to the
 * module whose first rendered text it is, read that module's current `spacingTop`
 * (token→px, or the module default), and set it (nearest token, else a literal px). A
 * negative target means the base already exceeds the reference gap — not closeable via
 * `spacingTop`; reported as a note (reduce the previous section's spacingBottom / a margin).
 * Mutates the page objects in place; returns the fix list.
 */
export function planGapFixes(
  gaps: Array<{ text: string; expected: string; actual: string }>,
  pages: Array<{ page: Record<string, unknown> }>,
): GapFix[] {
  const modules: Record<string, unknown>[] = []
  for (const pf of pages) {
    const ms = pf.page.modules
    if (Array.isArray(ms)) for (const m of ms) modules.push(m as Record<string, unknown>)
  }
  const fixes: GapFix[] = []
  for (const g of gaps) {
    // Skip responsive/varying gaps (`197px .. 142px`) — section spacing is not per-breakpoint.
    if (g.expected.includes('..') || g.actual.includes('..')) continue
    const refGap = px(g.expected)
    const ourGap = px(g.actual)
    if (refGap === null || ourGap === null) continue
    const bFrag = (g.text.split('→').pop() ?? '').trim().replace(/…$/, '')
    if (!bFrag) continue
    // Match the module whose first text is (or starts with) the B-fragment.
    const m = modules.find((mm) => {
      const ft = moduleFirstText(mm)
      return !!ft && (ft === bFrag || ft.startsWith(bFrag))
    })
    if (!m) continue
    const dials = (m.dials ?? (m.dials = {})) as Record<string, unknown>
    const id = String(m.id ?? '?')
    const readPx = (v: unknown, dflt: number): number =>
      typeof v === 'string' ? (SPACING_PX[v] ?? px(v) ?? dflt) : dflt
    const snap = (n: number): string => Object.entries(SPACING_PX).find(([, v]) => v === n)?.[0] ?? `${n}px`
    const curTop = readPx(dials.spacingTop, DEFAULT_SPACING_TOP_PX)
    const fromTop = typeof dials.spacingTop === 'string' ? dials.spacingTop : `${curTop}px (default)`
    const next = Math.round(curTop + (refGap - ourGap))
    if (next >= 0) {
      dials.spacingTop = snap(next)
      fixes.push({ moduleId: id, boundary: bFrag, from: fromTop, to: dials.spacingTop as string })
      continue
    }
    // spacingTop bottoms out at 0; take the rest from the PREVIOUS section's spacingBottom
    // (the reference makes this gap tighter than our base allows via the top knob alone).
    dials.spacingTop = 'none'
    const remaining = -next
    const prev = modules[modules.indexOf(m) - 1]
    if (prev) {
      const pd = (prev.dials ?? (prev.dials = {})) as Record<string, unknown>
      const curBot = readPx(pd.spacingBottom, DEFAULT_SPACING_TOP_PX)
      const fromBot = typeof pd.spacingBottom === 'string' ? pd.spacingBottom : `${curBot}px (default)`
      const nextBot = Math.round(curBot - remaining)
      pd.spacingBottom = snap(Math.max(0, nextBot))
      fixes.push({
        moduleId: id,
        boundary: bFrag,
        from: fromTop,
        to: 'none',
        note: `tight gap — also ${String(prev.id ?? '?')} spacingBottom ${fromBot} → ${pd.spacingBottom}${nextBot < 0 ? ` (base still ${-nextBot}px over — reduce a margin)` : ''}`,
      })
    } else {
      fixes.push({ moduleId: id, boundary: bFrag, from: fromTop, to: 'none', note: `base ${remaining}px over ref gap — reduce a margin` })
    }
  }
  return fixes
}

export function cmdApplyGapFixes(
  slug: string,
  gaps: Array<{ text: string; expected: string; actual: string }>,
  opts: GlobalOptions & { apply?: boolean },
): EditOutput {
  const ctx = ctxOf(opts)
  const base = readBase(ctx, slug)
  const files = readPageFiles(ctx, slug)
  const fixes = planGapFixes(
    gaps,
    files.map((f) => ({ page: f.page })),
  )
  validateOrThrow(base, files.map((f) => f.page))
  const apply = opts.apply === true
  if (apply && fixes.length > 0) for (const file of files) writeJson(file.abs, file.page)
  const head = apply
    ? `adopt-gaps: adjusted spacing on ${fixes.length} boundary(ies)`
    : `adopt-gaps (dry-run): ${fixes.length} spacing change(s) to close section gaps; pass --apply to write`
  const lines = [
    head,
    ...fixes.map((f) => `   ${f.moduleId}: spacingTop ${f.from} -> ${f.to}   (below "${f.boundary}")${f.note ? `  ⚠ ${f.note}` : ''}`),
  ]
  return { data: { fixes, applied: apply && fixes.length > 0 }, human: lines.join('\n') }
}
