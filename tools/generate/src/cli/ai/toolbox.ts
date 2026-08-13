/**
 * The L1 control surface, as a Toolbox surface (REQ-126, DOC-30).
 *
 * The surface is DECLARED IN `l1-surface.json` and IMPLEMENTED HERE, and the two
 * halves do not overlap. The declaration carries every sentence: what each
 * operation does, what it takes, what comes back, how it fails, what is
 * deliberately absent. This file carries no prose the model ever sees — it is
 * nothing but the bridge from a declared operation to the function in `edit.ts`
 * that already does the work.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT DO, because the Toolbox does it:
 * parameter type-checking (it runs BEFORE invocation, which is the security
 * model and not an optimisation — DOC-20 S3); capability and effect gating;
 * rendering a refusal; marking third-party content; recording the call. Every one
 * of those used to live in `tools.ts`'s `guarded()` and its hand-rolled `str()` /
 * `optStr()` checks, duplicated per handler. They are gone, not relocated.
 *
 * `edit.ts` REMAINS THE SINGLE WRITE PATH. A toolbox surface is a caller like the
 * `1c` CLI and the click-to-edit modal, and it reaches the same functions they
 * do. Nothing here validates, writes or re-renders on its own, so nothing here
 * can bypass the atomicity those functions already guarantee.
 *
 * THE SURFACE IS BOUND TO ONE SITE AT CONSTRUCTION. No operation declares a
 * `slug` parameter, so there is no value for a model to get wrong and no
 * predicate to refuse it — strictly stronger than a scope axis, and the reason
 * DOC-30 recommends keeping this binding rather than converting it (its option 2;
 * construction-scoped bindings are the finding to raise upstream).
 */

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatL1Path, type L1Node } from '@1stcontact/site-schema'
import type { GlobalOptions } from '../commands'
import { cmdPublish, ctxOf } from '../commands'
import {
  editAssetAdd,
  editAssetGet,
  editAssetList,
  editAssetRm,
  editAssetWrite,
  editBehaviorList,
  editConfigGet,
  editConfigSet,
  editL1Get,
  editL1Set,
  editModuleAdd,
  editModuleConfigure,
  editModuleRm,
  editPageAdd,
  editPageGet,
  editPageList,
  editPageRm,
  editPageUpdate,
  editPaletteAdd,
  editPaletteGet,
  editPaletteRename,
  editPaletteRm,
  editPaletteSet,
  editStatus,
  type CopyTargetOptions,
} from '../edit'
import { sharedModuleUrl } from '../webui'
import { CARETAKER_ROLE } from './roles'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** The declared surface, read from disk as the JSON the framework validator checks. */
export const L1_DECLARATION: Record<string, unknown> = JSON.parse(
  readFileSync(path.join(HERE, 'l1-surface.json'), 'utf8'),
)

/** Role name → instance configuration. Selects and scopes; never describes. */
export const L1_INSTANCES: Record<string, unknown> = JSON.parse(
  readFileSync(path.join(HERE, 'instances.json'), 'utf8'),
)

/**
 * The surface's OWN version, distinct from the declaration FORMAT version.
 *
 * DOC-20's envelope has no field for it — `version:` there is the format's — so
 * it rides as data and is read here rather than by the parser, which drops
 * unknown keys. That is DOC-30 R6's open question answered locally and raised
 * upstream: a priming document, a customer-facing description or a third-party
 * consumer still wants to say which surface it was written against, and
 * configuration-as-projection does not supply that.
 */
export const L1_SURFACE_VERSION = Number(L1_DECLARATION.surface_version)

/**
 * The AI library's SDK-free entry point.
 *
 * `./core` rather than the package root: the Toolbox is all this needs, and the
 * root self-registers the provider backends. Loaded through
 * {@link sharedModuleUrl} for the reason `host.ts` gives — a bare specifier
 * resolves the shared store from the main checkout and not from a linked
 * worktree.
 */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any
let core: Promise<Untyped> | null = null
export function aiCore(): Promise<Untyped> {
  if (!core) core = import(/* @vite-ignore */ sharedModuleUrl('ai', './core'))
  return core
}

// ── the page map ─────────────────────────────────────────────────────────────

/** One addressable place on a page, as the model needs to see it. */
export interface Segment {
  /** The dotted address, in the form every write operation takes. */
  path: string
  kind: string
  /** The component instance this address is scoped to, when it is inside one. */
  module?: string
  slot?: string
  /** Enough of the node to recognise it in a listing. Never its axes. */
  label: string
}

/** How long a text run's own words survive into the map before being cut. */
const LABEL_CHARS = 60

/**
 * Enough of a node to recognise it by, and no more (REQ-129).
 *
 * The map's job is "where is everything", so a label has to identify a node
 * among its siblings without reproducing it — the whole reason the map and
 * `get_l1` are separate operations is that the page is too big to pull in order
 * to change a heading. Axes never appear here for the same reason.
 */
function labelOf(node: L1Node): string {
  if (node.kind === 'text') {
    const text = node.text.replace(/\s+/g, ' ').trim()
    return text.length > LABEL_CHARS ? `${text.slice(0, LABEL_CHARS - 1)}…` : text
  }
  if (node.kind === 'image') return node.alt || node.src
  if (node.kind === 'control') return node.control
  if (node.kind === 'slot') return node.behavior ? `${node.name} (${node.behavior})` : node.name
  const children = (node as { children?: L1Node[] }).children?.length ?? 0
  const layout = node.kind === 'container' ? node.layout : 'box'
  return `${layout}, ${children} ${children === 1 ? 'child' : 'children'}`
}

/**
 * Walk an L1 root list, emitting EVERY node.
 *
 * The addressing rule is `resolveL1Node`'s and is not re-derived here: index the
 * root list, then walk `children`. Emitting the address with `formatL1Path` — the
 * same function the renderer stamps `data-l1-path` with — is what guarantees the
 * addresses this map hands out are the addresses the write path resolves. That
 * correspondence IS the addressing contract (DOC-30 R4); the declaration states
 * its render-scoped lifetime, and this walk is why the statement is true.
 *
 * REQ-129 WIDENED THIS FROM "what can I edit" TO "where is everything". It used
 * to emit only nodes `copyFieldsOf` exposes fields for, which was right when the
 * only write was a four-field copy edit: an address the caller could do nothing
 * with was noise. It is exactly wrong now. On `xgd/home` that projection reached
 * 67 of 122 nodes, and the 55 it skipped were the layout containers — precisely
 * what a caller composing a page needs to see.
 */
function walkSegments(
  roots: readonly L1Node[],
  scope: { module?: string; slot?: string },
  prefix: readonly number[] = [],
): Segment[] {
  const out: Segment[] = []
  roots.forEach((node, index) => {
    const at = [...prefix, index]
    out.push({
      path: formatL1Path(at),
      kind: node.kind,
      ...(scope.module ? { module: scope.module, slot: scope.slot } : {}),
      label: labelOf(node),
    })
    const children = (node as { children?: L1Node[] }).children
    if (children?.length) out.push(...walkSegments(children, scope, at))
  })
  return out
}

/**
 * Every addressable node on a page — the page's own L1, then each behavior
 * module instance's slots.
 *
 * Both spaces are walked because both are addressable, and a model shown only
 * the first would conclude the words inside a contact form or a carousel slide
 * are not editable. They are; they just carry a `module` and `slot` scope, which
 * is why those travel with the address here rather than being something the
 * model has to infer.
 */
export function pageSegments(page: Record<string, unknown>): Segment[] {
  const out: Segment[] = []
  const root = (page.l1 as { root?: L1Node } | undefined)?.root
  if (root) out.push(...walkSegments([root], {}))

  const modules = Array.isArray(page.modules) ? (page.modules as Record<string, unknown>[]) : []
  for (const instance of modules) {
    const id = typeof instance.id === 'string' ? instance.id : undefined
    if (!id) continue
    const slots = (instance.slots ?? {}) as Record<string, unknown>
    for (const [slot, raw] of Object.entries(slots)) {
      const roots = Array.isArray(raw) ? (raw as L1Node[]) : [raw as L1Node]
      out.push(...walkSegments(roots, { module: id, slot }))
    }
  }
  return out
}

// ── the operations ───────────────────────────────────────────────────────────

/**
 * Validated arguments, as the Toolbox hands them over: a structured object,
 * never a string, so nothing below can re-parse a value as syntax (DOC-20 S2).
 *
 * They arrive type-checked against the declaration. Re-checking here is exactly
 * the per-handler duplication DOC-30 indicts, so these accessors narrow and do
 * not validate.
 */
type Params = Record<string, unknown>
const req = (p: Params, name: string): string => p[name] as string
const opt = (p: Params, name: string): string | undefined => p[name] as string | undefined
/** A declared `object` parameter, which the Toolbox has already shape-checked. */
const obj = (p: Params, name: string): Record<string, unknown> | undefined =>
  p[name] as Record<string, unknown> | undefined

/** The component/slot scope an address is resolved in, read off the arguments. */
function scopeOf(p: Params, opts: GlobalOptions): CopyTargetOptions {
  return { ...opts, module: opt(p, 'module'), slot: opt(p, 'slot') }
}

/** One operation implementation, keyed by the `op` the declaration names. */
export type L1Operations = Record<string, (params: Params) => unknown>

/**
 * Every declared operation, bound to one site.
 *
 * Exported on its own — rather than only through the toolbox class — because it
 * is the whole of this surface's behaviour and it is worth being able to exercise
 * it without a runtime import of the AI library.
 *
 * @param slug The site every operation acts on. Never a model-supplied value.
 * @param opts Store context (`cwd`, `sandbox`), as every `edit.ts` call takes.
 */
export function l1Operations(slug: string, opts: GlobalOptions = {}): L1Operations {
  return {
    describe_site: () => ({
      config: (editConfigGet(slug, undefined, opts).data as { config: unknown }).config,
      pages: (editPageList(slug, opts).data as { pages: unknown }).pages,
      pending: editStatus(slug, opts).data,
    }),

    list_pages: () => editPageList(slug, opts).data,

    describe_page: (p) => {
      const page = (
        editPageGet(slug, req(p, 'page'), opts).data as { page: Record<string, unknown> }
      ).page
      const modules = Array.isArray(page.modules) ? (page.modules as Record<string, unknown>[]) : []
      return {
        page: { id: page.id, slug: page.slug, title: page.title, seoMeta: page.seoMeta ?? null },
        // REQ-130 — the instances themselves, not only the addresses inside their
        // slots. A caller that can add and configure a component needs to see the
        // ones already there, and its config is what it would be changing.
        components: modules.map((m) => ({
          id: m.id,
          type: m.type,
          version: m.version,
          slot: m.slot ?? null,
          config: m.config ?? {},
        })),
        segments: pageSegments(page),
      }
    },

    list_behaviors: () => editBehaviorList().data,

    get_l1: (p) => editL1Get(slug, req(p, 'page'), req(p, 'path'), scopeOf(p, opts)).data,

    list_assets: () => editAssetList(slug, opts).data,

    get_asset: (p) => editAssetGet(slug, req(p, 'asset'), opts).data,

    get_config: (p) => editConfigGet(slug, req(p, 'key'), opts).data,

    // REQ-133 — the palette, with the usage counts the delete and rename rules
    // are stated in. The assistant had no way to ask "what would changing this
    // color move" before this; without it, `set_config` on `palette` was an
    // edit made blind.
    get_palette: () => editPaletteGet(slug, opts).data,

    status: () => editStatus(slug, opts).data,

    set_l1: (p) => {
      const out = editL1Set(slug, req(p, 'page'), req(p, 'path'), p.node, scopeOf(p, opts))
      return { changed: (out.data as { changed: unknown }).changed, message: out.human }
    },

    add_page: (p) => {
      const out = editPageAdd(slug, req(p, 'page'), {
        ...opts,
        title: opt(p, 'title'),
        path: opt(p, 'path'),
        seoMeta: obj(p, 'seo'),
      })
      return { changed: out.data, message: out.human }
    },

    update_page: (p) => {
      const out = editPageUpdate(slug, req(p, 'page'), {
        ...opts,
        title: opt(p, 'title'),
        path: opt(p, 'path'),
        seoMeta: obj(p, 'seo'),
      })
      return { changed: out.data, message: out.human }
    },

    add_component: (p) => {
      const out = editModuleAdd(slug, req(p, 'page'), req(p, 'name'), req(p, 'behavior'), {
        ...opts,
        slot: opt(p, 'slot'),
        config: obj(p, 'config'),
        slots: obj(p, 'presentation') as never,
      })
      return { changed: out.data, message: out.human }
    },

    configure_component: (p) => {
      const out = editModuleConfigure(
        slug,
        req(p, 'page'),
        req(p, 'name'),
        obj(p, 'config') ?? {},
        opts,
      )
      return { changed: out.data, message: out.human }
    },

    remove_component: (p) => {
      const out = editModuleRm(slug, req(p, 'page'), req(p, 'name'), opts)
      return { changed: out.data, message: out.human }
    },

    remove_page: (p) => {
      const out = editPageRm(slug, req(p, 'page'), opts)
      return { changed: out.data, message: out.human }
    },

    set_config: (p) => {
      const out = editConfigSet(slug, opt(p, 'key'), obj(p, 'settings'), opts)
      return { changed: out.data, message: out.human }
    },

    // The palette writes (REQ-133). `set_config` could express the first two by
    // merge and neither of the last two at all — merge cannot remove a key or
    // move one, and it has nothing to say about the references both of those
    // are defined in terms of. The guards live in the functions below, so they
    // hold for the assistant exactly as they hold for the popup.
    set_palette_color: (p) => {
      const out = editPaletteSet(slug, req(p, 'name'), req(p, 'color'), opts)
      return { changed: out.data, message: out.human }
    },

    add_palette_color: (p) => {
      const out = editPaletteAdd(slug, req(p, 'name'), req(p, 'color'), opts)
      return { changed: out.data, message: out.human }
    },

    remove_palette_color: (p) => {
      const out = editPaletteRm(slug, req(p, 'name'), opts)
      return { changed: out.data, message: out.human }
    },

    rename_palette_color: (p) => {
      const out = editPaletteRename(slug, req(p, 'name'), req(p, 'to'), opts)
      return { changed: out.data, message: out.human }
    },

    add_asset: (p) => editAssetAdd(slug, req(p, 'file'), { ...opts, as: opt(p, 'as') }).data,

    write_image: (p) =>
      editAssetWrite(slug, req(p, 'name'), req(p, 'svg'), {
        ...opts,
        alt: opt(p, 'alt'),
        force: p.replace === true,
      }).data,

    remove_asset: (p) => {
      const out = editAssetRm(slug, req(p, 'asset'), { ...opts, force: p.force === true })
      return { changed: out.data, message: out.human }
    },

    /**
     * DECLARED BUT NOT REACHABLE FROM A SESSION YET, and the reason is upstream.
     *
     * `Toolbox.run` is synchronous: it invokes, serializes and audits in one
     * pass, so an operation that returns a promise is serialized as `{}` and its
     * failure is unobservable. `cmdPublish` awaits the published render, so this
     * is the one declared operation that cannot be hosted correctly today.
     *
     * Declaring it is still right — the surface declares the whole API, and the
     * grant narrows it (DOC-30). So it is documented and validated, and
     * `instances.json` simply does not grant `Publish` to the caretaker; the
     * manual therefore never mentions it and the model cannot propose it. The
     * operator publishes from the builder toolbar or `1c publish`, unchanged.
     *
     * Left implemented so that the day `Toolbox.run` awaits, granting the group
     * is the whole change.
     */
    publish: async (p) => {
      const result = await cmdPublish(slug, { ...opts, message: opt(p, 'message') })
      const { added, modified, removed } = result.changes
      return {
        id: result.id,
        added,
        modified,
        removed,
        message:
          `Published revision ${result.id} — ` +
          `${added.length} added, ${modified.length} changed, ${removed.length} removed.`,
      }
    },
  }
}

// ── the bound surface ────────────────────────────────────────────────────────

/**
 * `L1Toolbox`, constructed with the slug and store context it operates on.
 *
 * Built inside a factory because `ToolboxSurface` is untyped JavaScript in the
 * shared artifact store and only exists after an `import()`. The operations are
 * installed as own methods rather than prototype ones so the Toolbox's
 * startup binding check — which asks whether the surface implements a method per
 * enabled operation — sees exactly the declared set and no more.
 */
let bound: Promise<Untyped> | null = null
function l1ToolboxClass(): Promise<Untyped> {
  if (!bound) {
    bound = aiCore().then((lib) => {
      return class L1Toolbox extends lib.ToolboxSurface {
        constructor(slug: string, opts: GlobalOptions = {}) {
          super(L1_DECLARATION)
          for (const [op, run] of Object.entries(l1Operations(slug, opts))) {
            ;(this as unknown as Params)[op] = run
          }
        }
      }
    })
  }
  return bound
}

/** One audit record, as it reaches a sink. Plain data by the time it is written. */
export interface AuditLine {
  surface: string
  operation: string
  tool: string
  effect: string
  params: Record<string, unknown>
  policy: { decision: string; rule: string | null }
  outcome: { ok: boolean; error: string | null; resultBytes: number }
}

/**
 * Where a site's tool calls are recorded.
 *
 * Beside the transcripts they belong to, and gitignored with them: these are a
 * record of what an assistant did to one operator's site, not something a
 * checkout should carry. DOC-20 S6 calls this "the minimum needed to operate an
 * AI that edits customer-facing sites", which is a description of this product;
 * nothing recorded it before.
 */
export function auditPath(opts: GlobalOptions): string {
  return path.join(ctxOf(opts).cwd, 'storage', 'chat', 'audit.jsonl')
}

/**
 * A sink that appends one JSON line per call.
 *
 * Deliberately dumb. The Toolbox swallows a sink's own failure — an audit
 * backend being down is not a reason to fail a call the policy already
 * allowed — so this does the smallest thing that survives a crash mid-turn:
 * one line, appended, flushed.
 */
export function fileAuditSink(opts: GlobalOptions): (record: { asObject(): AuditLine }) => void {
  const file = auditPath(opts)
  return (record) => {
    mkdirSync(path.dirname(file), { recursive: true })
    appendFileSync(file, `${JSON.stringify(record.asObject())}\n`)
  }
}

/**
 * Construct the Toolbox for one site and one role.
 *
 * Every failure of CONFIGURATION is thrown here, at construction — a group the
 * surface does not declare, an operation the class does not implement, a scope
 * axis that is not declared. That is the startup-failure rule, and it is why the
 * same check runs in CI against the same two files.
 */
export async function createL1Toolbox(
  slug: string,
  opts: GlobalOptions = {},
  {
    role = CARETAKER_ROLE,
    config = null,
    audit = null,
    session = null,
  }: {
    role?: string
    config?: Record<string, unknown> | null
    audit?: ((record: { asObject(): AuditLine }) => void) | null
    session?: string | null
  } = {},
): Promise<Untyped> {
  const lib = await aiCore()
  const L1Toolbox = await l1ToolboxClass()
  const instance = config ?? (L1_INSTANCES[role] as Record<string, unknown> | undefined)
  if (!instance) {
    throw new Error(
      `No instance configuration for role '${role}' (configured: ` +
        `${Object.keys(L1_INSTANCES).sort().join(', ') || 'none'}).`,
    )
  }
  return new lib.Toolbox([new L1Toolbox(slug, opts)], instance, { audit, session, role })
}
