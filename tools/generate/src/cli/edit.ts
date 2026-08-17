import {
  applyCopyFields,
  collectL1PaletteRefs,
  copyFieldsOf,
  formatL1Path,
  l1OpaqueHexSchema,
  l1PaletteNameSchema,
  parseL1Path,
  renameL1PaletteRef,
  replaceL1Node,
  resolveL1Node,
  validateSite,
  validateSvg,
  SVG_MAX_BYTES,
  type L1Color,
  type L1FontFace,
  type L1Node,
  type L1SegmentFieldOptions,
} from '@1stcontact/site-schema'
// The Astro-free framework entry, deliberately not the barrel (REQ-143). The
// barrel re-exports the module registry, which imports two `.astro` components
// and would put this file — and every caller of it — back out of a Worker's
// reach. What the edit surface needs is the behavior *contracts*, never their
// components: it asks what exists and validates instances; it renders nothing.
import {
  catalog,
  l1PaintsSurface,
  latestModuleVersion,
  presetSlots,
  validateBehaviorInstance,
  type BehaviorMeta,
  type BehaviorSlotValue,
} from '@1stcontact/framework/worker'
import type { JournalRecord } from '../store/journal-model'
import { clip } from '../store/journal-model'
import type { SiteStore, StoredPage } from '../store/site-store'
import type { GlobalOptions } from './commands'
import { CommandError } from './errors'
import { labelOf } from './segments'

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
 *
 * STORAGE IS A PORT, NOT A FILESYSTEM (REQ-142). Nothing here imports `node:fs`
 * or `node:path`, and nothing here knows a path: every read and write goes
 * through the {@link SiteStore} on `opts.store`, which the caller constructs and
 * injects. That is what makes this module reachable from a Worker, where there
 * is no filesystem to reach for — the `1c` CLI hands it `fsSiteStore`, the
 * Worker will hand it the D1/R2 one, and neither is detected or chosen here.
 *
 * The store field is REQUIRED rather than defaulted, deliberately. A default
 * would have to name an adapter, and naming the filesystem one would import it —
 * putting `node:fs` back in this module's graph through the one door the port
 * exists to close.
 *
 * EVERY COMMAND IS ASYNC, for the same reason: D1 and R2 are. The conversion is
 * mechanical and changes no behaviour, but it is the load-bearing half of the
 * port — a synchronous surface cannot be served by a remote store however clean
 * its interface looks.
 */

/** The data payload plus a human-readable rendering for one command result. */
export interface EditOutput {
  data: unknown
  human: string
  /**
   * The site's change count after this command (REQ-131). Present on every
   * command that WRITES, absent on every command that reads.
   *
   * It is what makes a caller's baseline advance as it writes: hold the number
   * your last write returned, and any gap between it and the current count is by
   * construction somebody ELSE's work. That is why detecting a concurrent edit
   * needs no actor filtering — the arithmetic does it.
   */
  at?: number
}

/**
 * What every command on this surface takes: the global options, plus the store
 * it operates on.
 *
 * `store` is required. See the module docblock — a default would name an
 * adapter, and naming one would import it.
 */
export interface EditOptions extends GlobalOptions {
  store: SiteStore
}

/**
 * Record one write in the draft change journal and return the count it produced.
 *
 * Called at the RETURN of a mutating command, never before the write, which is
 * what makes "a refused write appends nothing" true without a transaction: every
 * write here validates the whole resulting definition and throws on refusal, so
 * reaching this line means the bytes have already landed.
 *
 * The `summary` is the command's own `human` line rather than a second sentence
 * written for the journal. One description, so a change reads the same way in
 * the answer to the person who made it and in the answer to whoever finds it
 * later.
 */
async function note(
  slug: string,
  opts: EditOptions,
  out: EditOutput,
  entry: Omit<JournalRecord, 'at' | 'ts' | 'actor' | 'summary'>,
): Promise<EditOutput> {
  return {
    ...out,
    at: await opts.store.appendChange(slug, {
      ...entry,
      actor: opts.actor ?? 'cli',
      summary: out.human,
    }),
  }
}

/**
 * The words an element holds, its whole subtree flattened (REQ-131).
 *
 * This is the half of a journal record that is worth keeping once an address has
 * stopped meaning anything: "the heading said X and now says Y" is legible to a
 * reader who cannot resolve `0.2.1` and never will, because the render that
 * minted it is long gone.
 */
function textOf(node: L1Node): string {
  const runs: string[] = []
  const walk = (n: L1Node): void => {
    if (n.kind === 'text') runs.push(n.text)
    for (const child of (n as { children?: L1Node[] }).children ?? []) walk(child)
  }
  walk(node)
  return runs.join(' ').replace(/\s+/g, ' ').trim()
}

/** One modal's worth of field values, rendered as the text a person would read. */
function fieldsText(values: Record<string, unknown>, fields: readonly string[]): string {
  const show = (name: string): string => {
    const value = values[name]
    return typeof value === 'string' ? value : JSON.stringify(value ?? null)
  }
  if (fields.length === 1) return show(fields[0])
  return fields.map((name) => `${name}: ${show(name)}`).join('\n')
}

// ── store access ───────────────────────────────────────────────────────────
//
// Everything below reads and writes through `opts.store`. There is no path
// arithmetic left in this module: a page is identified by its STORE NAME
// (`home.json`), which is a key the store owns rather than a location on any
// particular disk.

/** Fail with NOT_FOUND unless the site has a draft we can operate on. */
async function requireDraft(slug: string, opts: EditOptions): Promise<void> {
  if (!(await opts.store.hasDraft(slug))) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Site '${slug}' has no draft.`,
      path: slug,
      hint: `Create it with '1c new ${slug}'${opts.sandbox ? ' --sandbox' : ''}.`,
    })
  }
}

/** Read the raw `site.json` metadata object (everything but pages). */
async function readBase(slug: string, opts: EditOptions): Promise<Record<string, unknown>> {
  await requireDraft(slug, opts)
  const base = await opts.store.readSiteJson(slug)
  if (base === null) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Site '${slug}' has no site.json.`,
      path: slug,
    })
  }
  return base
}

/**
 * One page as this module works with it.
 *
 * `name` is the store's key for the page (`home.json`) and is what a write names
 * it by. It used to be accompanied by an absolute path; nothing here needs one
 * any more, and the store is the only thing entitled to know where bytes live.
 */
type PageFile = StoredPage

/** Read every page, in load order. */
function readPageFiles(slug: string, opts: EditOptions): Promise<PageFile[]> {
  return opts.store.readPages(slug)
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

/**
 * Parse a CLI value as JSON, falling back to the raw string when it is not JSON.
 *
 * Exported because this is now the ONLY place a settings value is ever a string
 * that has to be re-read as syntax, and that place is argv — where a value
 * genuinely arrives as text and there is no other option. Every other caller
 * hands {@link editConfigSet} a structured value directly, which is the point of
 * REQ-130's widening: a string that is parsed as data downstream is exactly the
 * shape DOC-20 S2 rules out for a tool surface.
 */
export function parseConfigValue(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/** A plain JSON object — not an array, not null. The only shape that merges. */
function isMapping(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Merge `patch` over `existing` (REQ-130).
 *
 * The rule is one sentence: **two objects merge, everything else replaces.** So
 * naming one setting inside a group leaves its siblings alone, and a list or a
 * scalar is written whole because there is no meaningful way to merge one.
 *
 * The alternative — replace at the addressed key, as this surface did before —
 * is what makes structured config dangerous rather than useful: a caller
 * changing a single colour in a palette family would have to resend the whole
 * family, and any entry it forgot would be silently deleted. That failure is
 * invisible until someone looks at the site, which is the worst kind.
 */
function mergeConfigValue(existing: unknown, patch: unknown): unknown {
  if (!isMapping(existing) || !isMapping(patch)) return patch
  const out: Record<string, unknown> = { ...existing }
  for (const [key, value] of Object.entries(patch)) {
    out[key] = mergeConfigValue(out[key], value)
  }
  return out
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
export interface CopyTargetOptions extends EditOptions {
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

async function resolveSegment(
  slug: string,
  pageId: string,
  rawPath: string,
  target: CopyTargetOptions,
  /** Resolve against a deep clone, so a write can be abandoned without a trace. */
  clone: boolean,
): Promise<{ files: PageFile[] } & ResolvedSegment> {
  const files = await readPageFiles(slug, target)
  const file = findPageFile(files, pageId)
  if (!file) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Page '${pageId}' not found in site '${slug}'.`,
      path: pageId,
      hint: `List pages with '1c page list ${slug}'.`,
    })
  }
  const addr = parseL1Path(rawPath)
  if (!addr) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `'${rawPath}' is not a segment address.`,
      path: rawPath,
      hint: 'An address is dotted child indices, e.g. 0.2.1 — read it off data-l1-path.',
    })
  }
  const page = clone ? structuredClone(file.page) : file.page
  const node = resolveL1Node(segmentRoots(page, pageId, target), addr)
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
 * What the derivation needs beyond the node itself (REQ-118, REQ-128, REQ-135).
 *
 * Both halves are properties of the site or the document rather than of the
 * node, and both are fetched only for the kinds that consume them: reading the
 * asset directory for a text run, or the font table for an image, would be pure
 * waste.
 *
 * The fonts come from the PAGE's L1 document even when the node lives inside a
 * behavior module's slot. That is not a shortcut — `@font-face` is emitted once
 * per rendered document, so the faces a slotted run can actually paint in are
 * the page's, and reading them from anywhere else would offer a weight the
 * render cannot serve.
 */
async function segmentOptions(
  node: L1Node,
  slug: string,
  page: Record<string, unknown>,
  base: Record<string, unknown>,
  opts: EditOptions,
): Promise<L1SegmentFieldOptions> {
  // REQ-140 — the palette is on EVERY kind that can carry a colour, which is
  // both of the kinds below. It comes from `site.json` rather than the page
  // because an entry is site-wide by construction, and reading it per-page is
  // what would let two pages disagree about what `primary` means.
  const palette = base.palette as L1SegmentFieldOptions['palette']
  if (PICKER_KINDS.has(node.kind)) {
    // `paints` is asked of the RENDERER, because "this box is a segment" and
    // "this box was stamped" have to be the same question — an unpainted
    // wrapper is not clickable and must expose nothing, however many paint axes
    // are added later. On an `image` node it is simply false and unread.
    return { assets: await imageHandles(slug, opts), palette, paints: l1PaintsSurface(node) }
  }
  if (node.kind === 'text') return { fonts: documentFonts(page), palette }
  return {}
}

/** The document's declared font faces, or none when it declares no resources. */
function documentFonts(page: Record<string, unknown>): L1FontFace[] {
  const l1 = page.l1 as { resources?: { fonts?: L1FontFace[] } } | undefined
  return l1?.resources?.fonts ?? []
}

/** The panel a text run sits on: where to escalate to, and what it looks like now. */
export interface PanelBehind {
  /** The ancestor's address, in the same vocabulary the client already holds. */
  path: string
  /** Its fill, absent when the panel paints by some other axis (an image, a radius). */
  fill?: L1Color
}

/**
 * The nearest painted ancestor of the addressed run (REQ-140 / REQ-135 §2).
 *
 * WHY THE EDITOR NEEDS THIS AT ALL. Background colour belongs to the panel, not
 * to the text — a folded run's box is glyph-tight, so filling it paints a
 * rectangle behind the words rather than the background anyone means. The panel
 * is already its own segment, so the capability exists; what is missing is a way
 * to REACH it. Innermost-wins means clicking the words opens the run, and
 * DOC-28 §6.5 measured a container on `xgd/home` fully occluded by its lone text
 * run — so "click just outside the words" is not always available.
 *
 * NEAREST, not outermost: the walk runs inward-out and stops at the first hit,
 * because the panel a user means by "behind this text" is the one immediately
 * behind it, not the page section three levels up.
 *
 * `l1PaintsSurface` is the RENDERER's test, imported rather than restated. The
 * target has to be a node the editor can actually open, and "can be opened" is
 * decided by whatever the emitter chose to stamp — a second list of paint axes
 * here would drift the first time one is added, and the symptom would be an
 * escalation link that opens an empty modal.
 *
 * `undefined` when the run sits on nothing painted. The client shows no row at
 * all then, which is honest: there is no panel behind this text to edit.
 */
function panelBehind(
  page: Record<string, unknown>,
  pageId: string,
  rawPath: string,
  target: CopyTargetOptions,
): PanelBehind | undefined {
  const addr = parseL1Path(rawPath)
  if (!addr) return undefined
  const roots = segmentRoots(page, pageId, target)
  for (let depth = addr.length - 1; depth > 0; depth--) {
    const ancestor = resolveL1Node(roots, addr.slice(0, depth))
    if (!ancestor || !l1PaintsSurface(ancestor)) continue
    const fill = (ancestor.axes as { surfaceFill?: L1Color } | undefined)?.surfaceFill
    return { path: formatL1Path(addr.slice(0, depth)), ...(fill === undefined ? {} : { fill }) }
  }
  return undefined
}

/**
 * The modal's input: the descriptors and current values for one segment, or an
 * empty field list when the segment exposes nothing (DOC-28 §6.2). An empty list
 * is a legitimate answer — a container or a module instance is a real segment
 * with no phase-1 control — so it reads as "nothing to edit here", not an error.
 */
export async function editCopyGet(
  slug: string,
  pageId: string,
  rawPath: string,
  opts: CopyTargetOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const { page, node } = await resolveSegment(slug, pageId, rawPath, opts, false)
  const derived = copyFieldsOf(node, await segmentOptions(node, slug, page, base, opts))
  const data = {
    target: { pageId, module: opts.module, slot: opts.slot, path: rawPath },
    kind: node.kind,
    fields: derived?.fields ?? [],
    values: derived?.values ?? {},
    // REQ-140 — the closed list a colour field draws from, travelling WITH the
    // descriptors that reference it. A client fetching the palette separately
    // could render a swatch against one palette and post a reference validated
    // against another; one response makes that unreachable.
    ...(base.palette ? { palette: base.palette } : {}),
    // The panel behind a run, for the escalation (REQ-135 §2). Only a text
    // segment has one to escalate FROM — a panel is already the thing being
    // escalated to.
    ...(node.kind === 'text' ? { panel: panelBehind(page, pageId, rawPath, opts) } : {}),
  }
  const human = derived
    ? derived.fields
        .map((f) => {
          const held = `${f.name}\t${JSON.stringify(derived.values[f.name] ?? '')}`
          // REQ-139 — a locked field is listed WITH its reason. This listing is
          // what the CLI reader and the AI both work from, and a field that
          // reads like every other one is a field they will try to set and be
          // refused for, with no way to have known.
          return f.locked ? `${held}\t(locked: ${f.reason ?? 'not editable here'})` : held
        })
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
export async function editCopySet(
  slug: string,
  pageId: string,
  rawPath: string,
  values: Record<string, unknown>,
  opts: CopyTargetOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const { files, file, page, node } = await resolveSegment(slug, pageId, rawPath, opts, true)

  // Read BEFORE the apply, because `applyCopyFields` mutates the node in place
  // and the journal's whole value is being able to say what the words used to
  // be (REQ-131).
  const options = await segmentOptions(node, slug, page, base, opts)
  const label = labelOf(node)
  const wasValues = copyFieldsOf(node, options)?.values ?? {}

  const applied = applyCopyFields(node, values, options)
  if (!applied.ok) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: applied.message,
      path: applied.field ? `${rawPath}/${applied.field}` : rawPath,
      hint: `Read the segment's fields with '1c copy get ${slug} ${pageId} ${rawPath}'.`,
    })
  }
  const nowValues = copyFieldsOf(node, options)?.values ?? {}

  // The shared validator, layer 1 (DOC-8 §7) — the same call `page`, `config` and
  // `asset` make, and the same one the AI's tool surface will. It runs the site
  // schema AND the L1 envelope over the whole resulting definition.
  validateOrThrow(base, files.map((f) => (f === file ? page : f.page)))

  await opts.store.write(slug, { pages: [{ name: file.name, page }] })
  const out: EditOutput = {
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
  // A call that changed nothing still wrote nothing worth telling anyone about,
  // so it does not advance the count — otherwise every no-op save from the modal
  // would look, to the assistant, exactly like the operator rewriting a heading.
  if (applied.changed.length === 0) return { ...out, at: await opts.store.counter(slug) }
  return note(slug, opts, out, {
    op: 'copy.set',
    page: pageId,
    path: rawPath,
    module: opts.module,
    slot: opts.slot,
    label,
    before: clip(fieldsText(wasValues, applied.changed)),
    after: clip(fieldsText(nowValues, applied.changed)),
  })
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
export async function editL1Get(
  slug: string,
  pageId: string,
  rawPath: string,
  opts: CopyTargetOptions,
): Promise<EditOutput> {
  await requireDraft(slug, opts)
  const { node } = await resolveSegment(slug, pageId, rawPath, opts, false)
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
export async function editL1Set(
  slug: string,
  pageId: string,
  rawPath: string,
  node: unknown,
  opts: CopyTargetOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const files = await readPageFiles(slug, opts)
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
  // What was there, read before it is gone. The address will not survive the
  // next render (DOC-28 §5.2), so this is the only moment the journal can learn
  // what the caller actually replaced (REQ-131).
  const previous = resolveL1Node(roots, parsed)
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

  await opts.store.write(slug, { pages: [{ name: file.name, page }] })
  return note(
    slug,
    opts,
    {
      data: {
        target: { pageId, module: opts.module, slot: opts.slot, path: rawPath },
        changed: [rawPath],
        node,
      },
      human: `Replaced the element at ${rawPath} in page '${pageId}'.`,
    },
    {
      op: 'l1.set',
      page: pageId,
      path: rawPath,
      module: opts.module,
      slot: opts.slot,
      label: previous ? labelOf(previous) : undefined,
      before: previous ? clip(textOf(previous)) : undefined,
      after: clip(textOf(node as L1Node)),
    },
  )
}

// ── page commands ────────────────────────────────────────────────────────────

export async function editPageList(slug: string, opts: EditOptions): Promise<EditOutput> {
  await requireDraft(slug, opts)
  const pages = (await readPageFiles(slug, opts)).map((f) => ({
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

export async function editPageGet(
  slug: string,
  pageId: string,
  opts: EditOptions,
): Promise<EditOutput> {
  await requireDraft(slug, opts)
  const file = findPageFile(await readPageFiles(slug, opts), pageId)
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

export interface PageWriteOptions extends EditOptions {
  title?: string
  path?: string
  /**
   * REQ-130 — the page's search and share metadata (`title`, `description`, and
   * an optional `ogImage`). Small, and the only page-level content nothing else
   * on this surface could write: it is not part of the L1 tree, so `set_l1`
   * cannot reach it, and it is per-page, so `set_config` cannot either.
   *
   * Merged rather than replaced, on the same reasoning as a settings group: an
   * operator asking for a better description should not lose their title.
   * Validated by `seoMetaSchema` through `validateOrThrow`, like everything else.
   */
  seoMeta?: Record<string, unknown>
}

export async function editPageAdd(
  slug: string,
  pageId: string,
  opts: PageWriteOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const files = await readPageFiles(slug, opts)

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
  // A page file under this name but carrying a different `id` — the check above
  // reads ids, this one reads the store's keys, and they are not the same
  // question.
  const name = `${pageId}.json`
  if (files.some((f) => f.name === name)) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Page file '${name}' already exists.`,
      path: name,
    })
  }

  const newPage: Record<string, unknown> = {
    id: pageId,
    slug: pageSlug,
    title: opts.title ?? pageId,
    ...(opts.seoMeta ? { seoMeta: opts.seoMeta } : {}),
    modules: [],
  }
  validateOrThrow(base, [...files.map((f) => f.page), newPage])

  await opts.store.write(slug, { pages: [{ name, page: newPage }] })
  return note(
    slug,
    opts,
    { data: { page: newPage }, human: `Added page '${pageId}' (path: ${pageSlug}).` },
    { op: 'page.add', page: pageId, label: String(newPage.title) },
  )
}

export async function editPageUpdate(
  slug: string,
  pageId: string,
  opts: PageWriteOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const files = await readPageFiles(slug, opts)
  const file = findPageFile(files, pageId)
  if (!file) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Page '${pageId}' not found in site '${slug}'.`,
      path: pageId,
      hint: `List pages with '1c page list ${slug}'.`,
    })
  }
  if (opts.title === undefined && opts.path === undefined && opts.seoMeta === undefined) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: 'Nothing to update; pass --title, --path and/or --seo.',
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
  if (opts.seoMeta !== undefined) updated.seoMeta = mergeConfigValue(file.page.seoMeta, opts.seoMeta)

  const pages = files.map((f) => (f === file ? updated : f.page))
  validateOrThrow(base, pages)

  await opts.store.write(slug, { pages: [{ name: file.name, page: updated }] })
  return note(
    slug,
    opts,
    { data: { page: updated }, human: `Updated page '${pageId}'.` },
    {
      op: 'page.update',
      page: pageId,
      label: String(updated.title ?? pageId),
      before: clip(String(file.page.title ?? '')),
      after: clip(String(updated.title ?? '')),
    },
  )
}

export interface PageRmOptions extends EditOptions {
  force?: boolean
}

export async function editPageRm(
  slug: string,
  pageId: string,
  opts: PageRmOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const files = await readPageFiles(slug, opts)
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

  // The nav rewrite and the page removal are ONE write. They were two before,
  // and a caller that crashed between them left a nav entry pointing at a page
  // that no longer existed — an invalid site nothing had refused to create.
  await opts.store.write(slug, {
    ...(newBase !== base ? { siteJson: newBase } : {}),
    removePages: [file.name],
  })
  return note(
    slug,
    opts,
    {
      data: { removed: pageId, navEntriesRemoved: referencing.length },
      human: `Removed page '${pageId}'${
        referencing.length > 0 ? ` and ${referencing.length} nav entr${referencing.length === 1 ? 'y' : 'ies'}` : ''
      }.`,
    },
    { op: 'page.remove', page: pageId, label: String(file.page.title ?? pageId) },
  )
}

// ── behavior-module instances (REQ-130) ──────────────────────────────────────
//
// A behavior module is a vetted behavioural core plus typed `config` plus named
// L1 presentation slots (DOC-25). INSTANTIATING one is configuration and belongs
// on this surface; AUTHORING a new type is development with a vetting bar
// (DOC-26) and is not reachable from here at all — the catalog is closed, and a
// `type` outside it is a NOT_FOUND that names what the catalog holds.
//
// The division of labour with `set_l1` is deliberate and there is no overlap: an
// instance's slots are L1 subtrees, and once the instance exists `set_l1`
// already addresses inside them through its `module`/`slot` scope. So these
// commands create, configure and remove an instance, and never write its
// presentation beyond the moment of creation.

/** The page file whose definition `id` is `pageId`, or NOT_FOUND. */
function requirePageFile(files: PageFile[], slug: string, pageId: string): PageFile {
  const file = findPageFile(files, pageId)
  if (!file) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Page '${pageId}' not found in site '${slug}'.`,
      path: pageId,
      hint: `List pages with '1c page list ${slug}'.`,
    })
  }
  return file
}

/** The catalog's contract for one behavior, or NOT_FOUND naming what it holds. */
function requireBehavior(type: string, version: number | undefined): BehaviorMeta {
  const known = [...new Set([...catalog.values()].map((m) => m.id))].sort()
  const resolved = version ?? (known.includes(type) ? latestModuleVersion(type) : undefined)
  const meta = resolved === undefined ? undefined : catalog.get(`${type}@${resolved}`)
  if (!meta) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message:
        `No behavior '${type}'${version === undefined ? '' : ` v${version}`} in the catalog.`,
      path: type,
      hint: `The catalog holds: ${known.join(', ')}. A new behavior is built by a developer, not configured here.`,
    })
  }
  return meta
}

/** Turn the behavior contract's violations into one refusal the caller can act on. */
function assertBehaviorInstance(
  meta: BehaviorMeta,
  instance: { config: Record<string, unknown>; slots: Record<string, BehaviorSlotValue> },
  pageId: string,
): void {
  const errors = validateBehaviorInstance(meta, instance)
  if (errors.length === 0) return
  throw new CommandError({
    code: 'SCHEMA_INVALID',
    message: `${meta.id}: ${errors.map((e) => `${e.field} — ${e.message}`).join('; ')}`,
    path: `${pageId}/${errors[0].field}`,
    hint: `Read the behavior's contract with '1c behavior list'.`,
  })
}

/** The instances on a page, as a mutable list. */
function moduleList(page: Record<string, unknown>): Record<string, unknown>[] {
  return Array.isArray(page.modules) ? (page.modules as Record<string, unknown>[]) : []
}

/**
 * The catalog, as a caller deciding what to instantiate needs to see it: what
 * each behavior does behaviourally, what it must be configured with, and what
 * presentation it expects. Read-only and site-independent — the catalog is the
 * framework's, not a site's.
 */
export function editBehaviorList(): EditOutput {
  const behaviors = [...catalog.values()].map((meta) => ({
    type: meta.id,
    version: meta.version,
    config: Object.fromEntries(
      Object.entries(meta.config).map(([name, spec]) => [
        name,
        {
          type: spec.type,
          required: spec.required,
          ...(spec.values ? { values: [...spec.values] } : {}),
          ...(spec.itemSchema
            ? {
                items: Object.fromEntries(
                  Object.entries(spec.itemSchema).map(([n, s]) => [
                    n,
                    { type: s.type, required: s.required, ...(s.values ? { values: [...s.values] } : {}) },
                  ]),
                ),
              }
            : {}),
        },
      ]),
    ),
    slots: meta.slots,
    // Only the controls an instance may bind. An invariant control is the
    // module's own to paint (DOC-25 §10.3) and offering it would invite a caller
    // to try — which the contract then refuses, for a reason that reads as a bug.
    controls: Object.fromEntries(
      Object.entries(meta.controls ?? {})
        .filter(([, spec]) => !spec.invariant)
        .map(([name, spec]) => [
          name,
          {
            element: spec.element,
            required: spec.required,
            ...(spec.perItemOf ? { onePerItemOf: spec.perItemOf } : {}),
            ...(spec.perSubtreeOf ? { onePerSubtreeOf: spec.perSubtreeOf } : {}),
          },
        ]),
    ),
    /** Whether L2 can supply a default look, i.e. whether `slots` is optional. */
    hasDefaultPresentation: presetSlots(meta.id, {}) !== null,
  }))
  return {
    data: { behaviors },
    human: behaviors.map((b) => `${b.type}@${b.version}\t${Object.keys(b.slots).join(', ')}`).join('\n'),
  }
}

export interface ModuleAddOptions extends EditOptions {
  /** The catalog version to pin. Defaults to the catalog's current version. */
  version?: number
  /** The `slot` node in the page's L1 tree this instance mounts into. */
  slot?: string
  config?: Record<string, unknown>
  /** L1 presentation per slot. Omitted, the L2 preset for this behavior is used. */
  slots?: Record<string, BehaviorSlotValue>
}

/**
 * Add a behavior instance to a page.
 *
 * `slots` may be omitted, and usually is: L2 holds a vetted default look for a
 * behavior that has one, derived from this instance's own config
 * (`presetSlots`). That is what makes instantiation a single call rather than a
 * demand that the caller author a whole form's presentation before the form
 * exists — and because the result is ordinary L1, `set_l1` refines it
 * afterwards exactly as it refines anything else. A behavior with no preset says
 * so, naming the slots it needs.
 */
export async function editModuleAdd(
  slug: string,
  pageId: string,
  moduleId: string,
  type: string,
  opts: ModuleAddOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const files = await readPageFiles(slug, opts)
  const file = requirePageFile(files, slug, pageId)
  const meta = requireBehavior(type, opts.version)

  if (moduleList(file.page).some((m) => m.id === moduleId)) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Page '${pageId}' already has a component called '${moduleId}'.`,
      path: `${pageId}/${moduleId}`,
      hint: 'Choose a different name, or configure the existing one.',
    })
  }

  const config = opts.config ?? {}
  const slots = opts.slots ?? presetSlots(meta.id, config)
  if (!slots) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `'${meta.id}' has no default presentation, so its slots must be supplied: ${Object.keys(meta.slots).join(', ')}.`,
      path: `${pageId}/${moduleId}`,
      hint: 'Send an L1 subtree per slot.',
    })
  }
  assertBehaviorInstance(meta, { config, slots }, pageId)

  const instance: Record<string, unknown> = {
    id: moduleId,
    type: meta.id,
    version: meta.version,
    ...(opts.slot === undefined ? {} : { slot: opts.slot }),
    config,
    slots,
  }
  const page = { ...file.page, modules: [...moduleList(file.page), instance] }
  validateOrThrow(base, files.map((f) => (f === file ? page : f.page)))

  await opts.store.write(slug, { pages: [{ name: file.name, page }] })
  return note(
    slug,
    opts,
    {
      data: { module: { id: moduleId, type: meta.id, version: meta.version, slot: opts.slot } },
      human: `Added ${meta.id} '${moduleId}' to page '${pageId}'${opts.slot ? ` at slot '${opts.slot}'` : ''}.`,
    },
    { op: 'component.add', page: pageId, module: moduleId, label: `${meta.id} '${moduleId}'` },
  )
}

/**
 * Change an instance's behavioural configuration.
 *
 * Merged, so naming one setting leaves the rest alone — the same rule
 * {@link editConfigSet} follows and for the same reason. Presentation is not
 * reachable here: a slot is L1 and `set_l1` owns L1.
 */
export async function editModuleConfigure(
  slug: string,
  pageId: string,
  moduleId: string,
  config: Record<string, unknown>,
  opts: EditOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const files = await readPageFiles(slug, opts)
  const file = requirePageFile(files, slug, pageId)

  const page = structuredClone(file.page)
  const instance = moduleList(page).find((m) => m.id === moduleId)
  if (!instance) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Page '${pageId}' has no component called '${moduleId}'.`,
      path: `${pageId}/${moduleId}`,
      hint: `Read the page's components with '1c page get ${slug} ${pageId}'.`,
    })
  }
  const meta = requireBehavior(String(instance.type), Number(instance.version))
  instance.config = mergeConfigValue(instance.config, config) as Record<string, unknown>
  assertBehaviorInstance(
    meta,
    {
      config: instance.config as Record<string, unknown>,
      slots: (instance.slots ?? {}) as Record<string, BehaviorSlotValue>,
    },
    pageId,
  )

  validateOrThrow(base, files.map((f) => (f === file ? page : f.page)))

  await opts.store.write(slug, { pages: [{ name: file.name, page }] })
  return note(
    slug,
    opts,
    {
      data: { module: { id: moduleId, type: instance.type }, config: instance.config },
      human: `Configured '${moduleId}' on page '${pageId}'.`,
    },
    {
      op: 'component.configure',
      page: pageId,
      module: moduleId,
      label: `${String(instance.type)} '${moduleId}'`,
      after: clip(JSON.stringify(instance.config)),
    },
  )
}

/** Remove an instance from a page. Its `slot` node in the L1 tree is left alone. */
export async function editModuleRm(
  slug: string,
  pageId: string,
  moduleId: string,
  opts: EditOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const files = await readPageFiles(slug, opts)
  const file = requirePageFile(files, slug, pageId)

  const existing = moduleList(file.page)
  if (!existing.some((m) => m.id === moduleId)) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Page '${pageId}' has no component called '${moduleId}'.`,
      path: `${pageId}/${moduleId}`,
    })
  }
  const page = { ...file.page, modules: existing.filter((m) => m.id !== moduleId) }
  validateOrThrow(base, files.map((f) => (f === file ? page : f.page)))

  await opts.store.write(slug, { pages: [{ name: file.name, page }] })
  return note(
    slug,
    opts,
    { data: { removed: moduleId }, human: `Removed '${moduleId}' from page '${pageId}'.` },
    { op: 'component.remove', page: pageId, module: moduleId, label: `'${moduleId}'` },
  )
}

// ── config commands ──────────────────────────────────────────────────────────

export async function editConfigGet(
  slug: string,
  key: string | undefined,
  opts: EditOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
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

/**
 * Write settings (REQ-130).
 *
 * `value` is a **typed value, not a string**. It used to be a string that this
 * function re-read as JSON, which worked for `1c config set` and was unusable
 * from a tool surface: a declared `string` parameter tells a caller that a
 * string is what a setting holds, so `palette`, `theme` and `nav.entries` — the
 * three structured settings a real site actually carries — were unreachable,
 * and the one shape that could carry them was an undeclared re-parse.
 *
 * `key` addresses the group to write in, and may be omitted to write at the top
 * level. The value merges (see {@link mergeConfigValue}), so naming a group and
 * sending the fields to change is safe.
 *
 * Nothing new is validated here and nothing needs to be: `validateOrThrow` runs
 * `siteSchema` over the whole resulting definition, and the palette, theme and
 * nav shapes are already described there. The gap was never the validator.
 */
export async function editConfigSet(
  slug: string,
  key: string | undefined,
  value: unknown,
  opts: EditOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const scoped = key === undefined || key === ''
  const merged = mergeConfigValue(scoped ? base : getDotted(base, key), value)
  if (scoped && !isMapping(merged)) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: 'Writing the top-level settings needs an object of settings to write.',
      hint: 'Name a key to write a single setting, e.g. key "config" with { "businessName": "…" }.',
    })
  }
  const newBase = scoped ? (merged as Record<string, unknown>) : setDotted(base, key, merged)
  const files = await readPageFiles(slug, opts)
  validateOrThrow(newBase, files.map((f) => f.page))

  await opts.store.write(slug, { siteJson: newBase })
  const where = scoped ? '(top level)' : key
  return note(
    slug,
    opts,
    {
      data: { key: scoped ? null : key, value: merged },
      human: `Set ${where} = ${typeof merged === 'string' ? merged : JSON.stringify(merged)}`,
    },
    {
      op: 'config.set',
      label: where,
      before: clip(JSON.stringify(scoped ? base : getDotted(base, key)) ?? 'null'),
      after: clip(JSON.stringify(merged) ?? 'null'),
    },
  )
}

// ── palette commands (REQ-133) ───────────────────────────────────────────────

/**
 * The palette surface (REQ-133 §6 / DOC-28 §8).
 *
 * WHY ITS OWN GROUP RATHER THAN `config set`. `editConfigSet` can already write a
 * palette, because a palette is a setting — but it writes by *merge*, and merge
 * has no way to express the two operations this surface exists for: removing a
 * key, and moving one. It also has nothing to say about references, and both the
 * delete rule and the rename confirmation are stated entirely in terms of them.
 *
 * WHY THE GUARDS ARE HERE AND NOT IN THE POPUP. The browser is a second
 * *producer* of edits, not the authority on them (DOC-8 §7): the AI drives the
 * identical functions, and a stale tab must not be able to talk the store into
 * an orphaned reference. Every refusal below is therefore evaluated against the
 * definition on disk at the moment of the write, never against a count the
 * caller sent.
 */

/** One entry as the surface reports it: its color, and what an edit to it moves. */
export interface PaletteEntryUse {
  name: string
  value: string
  /**
   * References to this entry across the whole site — the document and every
   * page — **at any shade** (REQ-137). There is no per-shade tally because a
   * shade is a position within this entry's own family, not a sibling of it, so
   * this number is the whole truth about what changing `value` will repaint.
   */
  count: number
}

/** The palette map exactly as `site.json` holds it, or `{}` when it holds none. */
function paletteOf(base: Record<string, unknown>): Record<string, { value: string }> {
  const palette = base.palette
  if (palette === null || typeof palette !== 'object' || Array.isArray(palette)) return {}
  return palette as Record<string, { value: string }>
}

/**
 * Every entry with its usage count.
 *
 * The census walks the site document AND every page, which is the scope
 * `resolveL1Palette` already runs at in `loadSite`. References live in pages
 * today; walking the document is what keeps that a fact rather than an
 * assumption the day a color axis lands somewhere else.
 *
 * An entry with no references is reported at zero rather than omitted — zero is
 * the delete rule's entire subject, so it is the one count that must be
 * reportable.
 */
function paletteCensus(
  base: Record<string, unknown>,
  pages: unknown[],
): { entries: PaletteEntryUse[]; counts: Map<string, number> } {
  const palette = paletteOf(base)
  const counts = new Map<string, number>()
  for (const name of Object.keys(palette)) counts.set(name, 0)
  // The palette itself is excluded from the walk: an entry is a `{value}` and
  // never a reference, so nothing in it can be counted — but a future entry
  // shape that could would be counted against itself, which is why the scope is
  // stated rather than implied.
  const { palette: _omit, ...document } = base
  for (const { ref } of collectL1PaletteRefs([document, ...pages])) {
    counts.set(ref.ref, (counts.get(ref.ref) ?? 0) + 1)
  }
  const entries = Object.entries(palette)
    .map(([name, entry]) => ({ name, value: entry?.value, count: counts.get(name) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name)) as PaletteEntryUse[]
  return { entries, counts }
}

/** Refuse a name the schema would refuse, but with the reason the operator needs. */
function requirePaletteName(name: string, path: string): void {
  if (!l1PaletteNameSchema.safeParse(name).success) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `'${name}' is not a valid palette name.`,
      path,
      hint: 'Use kebab-case: lowercase letters and digits separated by single hyphens, e.g. brand-teal.',
    })
  }
}

/** Refuse a value the entry schema would refuse — opaque hex only; alpha is a reference axis. */
function requirePaletteValue(value: unknown, path: string): string {
  const parsed = l1OpaqueHexSchema.safeParse(value)
  if (!parsed.success) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `'${String(value)}' is not a palette color: ${parsed.error.issues[0]?.message}`,
      path,
      hint: 'A palette entry is an opaque hex (#rgb or #rrggbb). Translucency lives on the reference, not the entry.',
    })
  }
  return parsed.data
}

/** Read the palette with per-entry usage counts (REQ-133 AC-1, AC-11). */
export async function editPaletteGet(slug: string, opts: EditOptions): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const files = await readPageFiles(slug, opts)
  const { entries } = paletteCensus(base, files.map((f) => f.page))
  return {
    data: { slug, entries },
    human: entries.length
      ? entries.map((e) => `${e.name}  ${e.value}  used ${e.count}×`).join('\n')
      : `Site '${slug}' has no palette yet.`,
  }
}

/**
 * Change an entry's color (REQ-133 §5a / AC-5).
 *
 * ONE WRITE, AND THE WHOLE FAMILY FOLLOWS. Nothing here touches a page: every
 * use — at every shade — reads through the entry, so repainting them is what
 * REQ-137's model buys and what this function deliberately does *not* have to
 * implement. The count is reported so the answer says how much moved.
 */
export async function editPaletteSet(
  slug: string,
  name: string,
  value: unknown,
  opts: EditOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const palette = paletteOf(base)
  if (!(name in palette)) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Site '${slug}' has no palette color '${name}'.`,
      path: `palette.${name}`,
      hint: `Add it with '1c palette add ${slug} ${name} <hex>', or list what exists with '1c palette get ${slug}'.`,
    })
  }
  const hex = requirePaletteValue(value, `palette.${name}.value`)
  const files = await readPageFiles(slug, opts)
  const newBase = { ...base, palette: { ...palette, [name]: { ...palette[name], value: hex } } }
  validateOrThrow(newBase, files.map((f) => f.page))
  await opts.store.write(slug, { siteJson: newBase })
  const { entries } = paletteCensus(newBase, files.map((f) => f.page))
  const count = entries.find((e) => e.name === name)?.count ?? 0
  return note(
    slug,
    opts,
    {
      data: { slug, name, value: hex, count },
      human: `Set ${name} = ${hex} (${count} use${count === 1 ? '' : 's'} repainted).`,
    },
    {
      op: 'palette.set',
      label: `color '${name}'`,
      before: String(palette[name]?.value ?? ''),
      after: hex,
    },
  )
}

/** Add an entry (REQ-133 §5b / AC-6). Refused on a duplicate or a malformed name. */
export async function editPaletteAdd(
  slug: string,
  name: string,
  value: unknown,
  opts: EditOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const palette = paletteOf(base)
  requirePaletteName(name, `palette.${name}`)
  if (name in palette) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Site '${slug}' already has a palette color '${name}'.`,
      path: `palette.${name}`,
      hint: `Change it with '1c palette set ${slug} ${name} <hex>', or choose another name.`,
    })
  }
  const hex = requirePaletteValue(value, `palette.${name}.value`)
  const files = await readPageFiles(slug, opts)
  const newBase = { ...base, palette: { ...palette, [name]: { value: hex } } }
  validateOrThrow(newBase, files.map((f) => f.page))
  await opts.store.write(slug, { siteJson: newBase })
  return note(
    slug,
    opts,
    { data: { slug, name, value: hex, count: 0 }, human: `Added ${name} = ${hex}.` },
    { op: 'palette.add', label: `color '${name}'`, after: hex },
  )
}

/**
 * Delete an entry — **only when nothing references it** (REQ-133 §5c / AC-7).
 *
 * A referenced entry has no correct default for what each use becomes: repoint
 * it at another entry, or inline the hex as a literal? The answer differs per
 * site, per page, per element, so it is a product decision and not something a
 * swatch's ✕ may take silently. The refusal names the count, which is what
 * turns "no" into a next step — the operator can ask the assistant, which can
 * talk the choice through before making it.
 *
 * There is deliberately no `--force`. A force flag here would be a one-keystroke
 * route to an invalid site, since every orphaned reference is a validation
 * failure (DOC-23 §6) rather than a fallback.
 */
export async function editPaletteRm(
  slug: string,
  name: string,
  opts: EditOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const palette = paletteOf(base)
  if (!(name in palette)) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Site '${slug}' has no palette color '${name}'.`,
      path: `palette.${name}`,
    })
  }
  const files = await readPageFiles(slug, opts)
  const pages = files.map((f) => f.page)
  const { counts } = paletteCensus(base, pages)
  const count = counts.get(name) ?? 0
  if (count > 0) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `'${name}' is used ${count} time${count === 1 ? '' : 's'} and cannot be deleted.`,
      path: `palette.${name}`,
      hint: 'Deleting a color in use means deciding what each use becomes — ask the assistant to repoint or inline them first.',
    })
  }
  const { [name]: _gone, ...rest } = palette
  const newBase = { ...base, palette: rest }
  validateOrThrow(newBase, pages)
  await opts.store.write(slug, { siteJson: newBase })
  return note(
    slug,
    opts,
    { data: { slug, name, removed: true }, human: `Removed ${name}.` },
    { op: 'palette.remove', label: `color '${name}'`, before: String(palette[name]?.value ?? '') },
  )
}

/**
 * Rename an entry, rewriting every reference to it (REQ-133 §5d / AC-8, AC-9).
 *
 * **Atomic, and it has to be.** A reference names its entry by key, so a rename
 * that moved the key without the references would orphan every one of them —
 * and an orphan is a validation failure, not a silent fallback. So the whole
 * resulting site (document, palette and every page) is assembled in memory and
 * validated before a byte is written: a refusal leaves the draft exactly as it
 * was, and no partially-renamed state is reachable from any caller.
 *
 * **Refused on collision**, because a name that already exists would *merge* two
 * entries — the same class of decision as deleting one in use, and equally not a
 * text field's call.
 *
 * **Why this is allowed where delete is not.** Rename is total and lossless:
 * every use has exactly one correct new value and the system can compute it.
 * The rule is about which decisions have a computable answer, not about how many
 * references are involved.
 */
export async function editPaletteRename(
  slug: string,
  from: string,
  to: string,
  opts: EditOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const palette = paletteOf(base)
  if (!(from in palette)) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Site '${slug}' has no palette color '${from}'.`,
      path: `palette.${from}`,
    })
  }
  requirePaletteName(to, `palette.${to}`)
  if (to !== from && to in palette) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Site '${slug}' already has a palette color '${to}'.`,
      path: `palette.${to}`,
      hint: 'Renaming onto an existing name would merge two colors — choose an unused name.',
    })
  }
  const files = await readPageFiles(slug, opts)
  const pages = files.map((f) => f.page)
  const { counts } = paletteCensus(base, pages)
  const count = counts.get(from) ?? 0

  // The key moves IN PLACE rather than being deleted and re-appended, so a
  // palette an operator has arranged keeps its order across a rename.
  const renamed = Object.fromEntries(
    Object.entries(palette).map(([key, entry]) => [key === from ? to : key, entry]),
  )
  // Both halves through the SAME walk the census used, which is what makes the
  // count reported above the count actually rewritten (REQ-133 AC-10).
  const { palette: _old, ...document } = base
  const newBase = {
    ...(renameL1PaletteRef(document, from, to) as Record<string, unknown>),
    palette: renamed,
  }
  const newPages = pages.map((page) => renameL1PaletteRef(page, from, to))
  validateOrThrow(newBase, newPages)

  // ONE call, and this is the case that made it the port's shape (REQ-142 AC-5).
  // A rename that moved `site.json`'s key without every page's references would
  // orphan them, and an orphan is a validation failure rather than a fallback —
  // so the store is asked for one transition, and the D1 adapter can make that
  // transition atomic without a caller here changing at all.
  //
  // Only the pages that actually moved: `mapL1PaletteRefs` returns an untouched
  // subtree by identity, so a page with no reference to `from` is not rewritten
  // and its file keeps its mtime.
  await opts.store.write(slug, {
    siteJson: newBase,
    pages: files
      .map((file, i) => ({ name: file.name, page: newPages[i] as Record<string, unknown> }))
      .filter((_, i) => newPages[i] !== files[i].page),
  })
  return note(
    slug,
    opts,
    {
      data: { slug, from, to, count },
      human: `Renamed ${from} → ${to} (${count} reference${count === 1 ? '' : 's'} rewritten).`,
    },
    { op: 'palette.rename', label: `color '${from}'`, before: from, after: to },
  )
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
  /**
   * The store holds bytes for it under the draft's `assets/`.
   *
   * Named for the filesystem because the picker and its tests already read this
   * field by name; since REQ-142 it means "the store has it", which is the same
   * question asked of a store that may have no disk.
   */
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
export async function listSiteAssets(slug: string, opts: EditOptions): Promise<SiteAsset[]> {
  const base = await readBase(slug, opts)
  const byHandle = new Map<string, SiteAsset>()

  for (const rel of await opts.store.listAssets(slug)) {
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
async function imageHandles(slug: string, opts: EditOptions): Promise<string[]> {
  return (await listSiteAssets(slug, opts)).filter((a) => a.kind === 'image').map((a) => a.src)
}

export async function editAssetList(slug: string, opts: EditOptions): Promise<EditOutput> {
  const assets = await listSiteAssets(slug, opts)
  const human =
    assets.length === 0
      ? '(no assets)'
      : assets
          .map((a) => `${a.id}\t${a.src}\t${a.kind}${a.registered ? '' : '\t(unregistered)'}`)
          .join('\n')
  return { data: { assets }, human }
}

export async function editAssetGet(
  slug: string,
  assetName: string,
  opts: EditOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
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

export interface AssetAddOptions extends EditOptions {
  /** Registered name (and store name); defaults to the source basename. */
  as?: string
}

/**
 * Register bytes the operator already had, under `name`.
 *
 * WHY IT TAKES BYTES AND NOT A PATH (REQ-142). It used to take a path on the
 * operator's own machine and `copyFileSync` it in. That path was never the
 * store's — it is a *source*, outside the site entirely, and in a Worker there
 * is nothing it could name. So reading it moved OUT to the two callers that have
 * a filesystem to read from: `1c asset add` and the AI toolbox's adapter. Both
 * still take a `file` argument and both still refuse a missing one with the same
 * NOT_FOUND envelope; what changed is which layer opens it.
 */
export async function editAssetAdd(
  slug: string,
  name: string,
  bytes: Uint8Array,
  opts: AssetAddOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const assets = assetRegistry(base)
  if (assets.some((a) => a.id === name)) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Asset '${name}' is already registered in site '${slug}'.`,
      path: name,
      hint: 'Choose a different name with --as.',
    })
  }
  if ((await opts.store.listAssets(slug)).includes(name)) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Asset file '${name}' already exists in draft/assets.`,
      path: name,
      hint: 'Choose a different name with --as.',
    })
  }

  const newAsset: Record<string, unknown> = { id: name, src: name, alt: '' }
  const newBase = { ...base, assets: [...assets, newAsset] }
  // Validate the registry before any byte is stored.
  validateOrThrow(newBase, (await readPageFiles(slug, opts)).map((f) => f.page))

  await opts.store.write(slug, { siteJson: newBase, assets: [{ name, bytes }] })
  return note(
    slug,
    opts,
    { data: { asset: newAsset }, human: `Added asset '${name}'.` },
    { op: 'asset.add', label: name },
  )
}

// ── generated assets (REQ-130) ───────────────────────────────────────────────
//
// `editAssetAdd` above copies a file the operator already has. This writes bytes
// a caller COMPOSED, and that is a different kind of thing: every other asset on
// this surface was vouched for by a human placing it on their own machine, which
// is the whole reason an extension check was ever enough.
//
// It is deliberately NOT a file-write primitive that happens to be pointed at
// `draft/assets/`. Three separate narrowings, each of which has to hold:
//
//   1. the NAME is generated from the caller's word, never taken from it — one
//      path segment, one extension, no separator and no traversal to reject
//      because there is nothing to reject;
//   2. the FORMAT is text and there is one of it. A model cannot produce a
//      `.woff2`, and a channel that looked as though it could is a channel
//      someone will eventually try to use as one (fonts are REQ-101's, with
//      provenance attached, and that is where they stay);
//   3. the CONTENT passes `validateSvg` — a closed grammar, not an extension
//      check. An SVG is a document the browser executes, served same-origin from
//      the site's own `/assets/`, so the renderer's URL-scheme allowlist neither
//      applies nor helps. Without a content validator this operation is a
//      stored-XSS sink, which is why the ticket says it ships with one or does
//      not ship.

/** The one generated format, and the extension it is written under. */
const GENERATED_EXTENSION = '.svg'

/** A name we are prepared to generate a filename from: one plain word. */
const GENERATED_NAME = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

export interface AssetWriteOptions extends EditOptions {
  /** Replace the bytes of an asset of this name that already exists. */
  force?: boolean
  /** Alt text recorded in the registry. */
  alt?: string
}

export async function editAssetWrite(
  slug: string,
  name: string,
  content: string,
  opts: AssetWriteOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)

  const stem = name.toLowerCase().replace(new RegExp(`\\${GENERATED_EXTENSION}$`), '')
  if (!GENERATED_NAME.test(stem)) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `'${name}' is not a name an image can be written under.`,
      path: name,
      hint: 'Use lowercase letters, digits and hyphens — one word, no folders, e.g. "wordmark".',
    })
  }
  const filename = `${stem}${GENERATED_EXTENSION}`

  const svg = validateSvg(content)
  if (!svg.ok) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `The image was refused: ${svg.errors.map((e) => `${e.path}: ${e.message}`).join('; ')}`,
      path: filename,
      hint: `A generated image is drawing only — shapes, paths, gradients and text. It may carry no script, no event handler, no stylesheet and no reference to anywhere else, and must be under ${SVG_MAX_BYTES} bytes.`,
    })
  }

  const assets = assetRegistry(base)
  const registered = assets.find((a) => a.id === filename)
  const stored = (await opts.store.listAssets(slug)).includes(filename)
  if ((registered || stored) && opts.force !== true) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `Site '${slug}' already has an image called '${filename}'.`,
      path: filename,
      hint: 'Choose a different name, or pass force to replace what is there.',
    })
  }

  const entry: Record<string, unknown> = {
    id: filename,
    src: filename,
    alt: opts.alt ?? registered?.alt ?? '',
  }
  const newBase = {
    ...base,
    assets: [...assets.filter((a) => a.id !== filename), entry],
  }
  // The registry is validated before a byte is stored, as everywhere else here.
  validateOrThrow(newBase, (await readPageFiles(slug, opts)).map((f) => f.page))

  // `TextEncoder` rather than `Buffer`: the byte count is part of the answer and
  // has to be computable wherever this runs, not only under Node.
  const bytes = new TextEncoder().encode(content)
  await opts.store.write(slug, { siteJson: newBase, assets: [{ name: filename, bytes }] })
  return note(
    slug,
    opts,
    {
      data: { asset: { ...entry, src: `/assets/${filename}` } },
      human: `${registered ? 'Replaced' : 'Wrote'} image '${filename}' (${bytes.length} bytes).`,
    },
    { op: 'asset.write', label: filename, after: clip(String(entry.alt ?? '')) },
  )
}

export interface AssetRmOptions extends EditOptions {
  force?: boolean
}

export async function editAssetRm(
  slug: string,
  assetName: string,
  opts: AssetRmOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const assets = assetRegistry(base)
  const asset = assets.find((a) => a.id === assetName)
  if (!asset) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Asset '${assetName}' not found in site '${slug}'.`,
      path: assetName,
    })
  }

  const files = await readPageFiles(slug, opts)
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

  // De-registering and removing the bytes are one write. Removing an asset the
  // store does not hold is not an error, which is why there is no existence
  // check in front of it.
  await opts.store.write(slug, {
    siteJson: newBase,
    removeAssets: [String(asset.src ?? assetName)],
  })
  return note(
    slug,
    opts,
    {
      data: { removed: assetName, referencesIgnored: refs.length },
      human: `Removed asset '${assetName}'${refs.length > 0 ? ` (left ${refs.length} dangling reference(s))` : ''}.`,
    },
    { op: 'asset.remove', label: assetName },
  )
}

// ── status ───────────────────────────────────────────────────────────────────

export async function editStatus(slug: string, opts: EditOptions): Promise<EditOutput> {
  await requireDraft(slug, opts)
  const { baseRevision: live, ...changes } = await opts.store.pendingChanges(slug)
  const total = changes.added.length + changes.modified.length + changes.removed.length
  const lines: string[] = [`baseRevision: ${live === null ? '(none)' : `r${live}`}`]
  for (const rel of changes.added) lines.push(`A  ${rel}`)
  for (const rel of changes.modified) lines.push(`M  ${rel}`)
  for (const rel of changes.removed) lines.push(`D  ${rel}`)
  if (total === 0) lines.push('(no pending changes)')
  return { data: { baseRevision: live, ...changes }, human: lines.join('\n') }
}

// ── the draft change journal (REQ-131) ───────────────────────────────────────

/**
 * What has changed on the draft, and where the change count stands now.
 *
 * The third of DOC-33 §7.9's three questions, at the cost the middle one should
 * have: proportional to THE CHANGE rather than to the page. "Has anything
 * changed?" is answered without a call at all — the host compares counts between
 * turns and says so in the reminder — and "what is the page now?" is the
 * existing reads, which stay the fallback.
 *
 * `since` omitted means everything the window still holds. Passing the count a
 * previous write returned is the normal use, and it is what makes a caller's own
 * edits invisible to it: the count it holds already includes them.
 */
export async function editChanges(
  slug: string,
  since: number | undefined,
  opts: EditOptions,
): Promise<EditOutput> {
  await requireDraft(slug, opts)
  const slice = await opts.store.changesSince(slug, since)
  const lines = slice.changes.map((c) => {
    const where = c.page ? ` on '${c.page}'` : ''
    const words = c.before !== undefined || c.after !== undefined ? `\n     "${c.before ?? ''}" → "${c.after ?? ''}"` : ''
    return `${c.at}  ${c.actor}  ${c.op}${where}  ${c.label ?? ''}${words}`
  })
  if (slice.truncated) lines.unshift('(older changes are no longer retained)')
  if (slice.changes.length === 0) lines.push('(nothing has changed)')
  return { data: slice, human: `now: ${slice.now}\n${lines.join('\n')}` }
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

export async function cmdApplyGapFixes(
  slug: string,
  gaps: Array<{ text: string; expected: string; actual: string }>,
  opts: EditOptions & { apply?: boolean },
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const files = await readPageFiles(slug, opts)
  const fixes = planGapFixes(
    gaps,
    files.map((f) => ({ page: f.page })),
  )
  validateOrThrow(base, files.map((f) => f.page))
  const apply = opts.apply === true
  // `planGapFixes` mutated the pages in place, so every one of them is written —
  // as one call, so a partial application is not a state the store can be left
  // in by a caller that stops half way.
  if (apply && fixes.length > 0) await opts.store.write(slug, { pages: files })
  const head = apply
    ? `adopt-gaps: adjusted spacing on ${fixes.length} boundary(ies)`
    : `adopt-gaps (dry-run): ${fixes.length} spacing change(s) to close section gaps; pass --apply to write`
  const lines = [
    head,
    ...fixes.map((f) => `   ${f.moduleId}: spacingTop ${f.from} -> ${f.to}   (below "${f.boundary}")${f.note ? `  ⚠ ${f.note}` : ''}`),
  ]
  const out: EditOutput = {
    data: { fixes, applied: apply && fixes.length > 0 },
    human: lines.join('\n'),
  }
  // A dry run writes nothing, so it is not a change and must not look like one.
  if (!apply || fixes.length === 0) return { ...out, at: await opts.store.counter(slug) }
  return note(slug, opts, out, { op: 'gaps.apply', label: `${fixes.length} boundaries` })
}
