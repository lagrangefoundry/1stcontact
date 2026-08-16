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
import type { GlobalOptions } from '../commands'
import { cmdPublish, ctxOf } from '../commands'
import { fsSiteStore } from '../../store'
import { CommandError } from '../errors'
import { pageSegments } from '../segments'
import type { EditOptions } from '../edit'
import {
  editAssetAdd,
  editAssetGet,
  editAssetList,
  editAssetRm,
  editAssetWrite,
  editBehaviorList,
  editChanges,
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
import { SYSTEM_KB } from '../kb'
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
function scopeOf(p: Params, opts: EditOptions): CopyTargetOptions {
  return { ...opts, module: opt(p, 'module'), slot: opt(p, 'slot') }
}

/**
 * Read a source file the operator named, for `add_asset` (REQ-142).
 *
 * The store no longer takes a path, and it should never have: a source file sits
 * OUTSIDE the site, on whatever machine this host happens to be running on, and
 * a store that accepted one would have to be a filesystem. So the read is here,
 * in the Node-side host that actually has a disk, and what crosses into
 * `edit.ts` is bytes.
 *
 * The refusal is the same `CommandError` `editAssetAdd` used to raise, with the
 * same code, path and hint — the envelope a caller sees is unchanged by the
 * layer that produces it.
 */
function readSourceFile(file: string): { name: string; bytes: Uint8Array } {
  try {
    return { name: path.basename(file), bytes: new Uint8Array(readFileSync(file)) }
  } catch {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Source file '${file}' does not exist.`,
      path: file,
      hint: 'Pass a path to a readable file.',
    })
  }
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
 * Every operation is ASYNC (REQ-142), because `edit.ts` is: the store behind it
 * may be a database. `Toolbox.run` awaits what `surface.invoke` returns, so this
 * needs nothing of the declaration and nothing of the host.
 *
 * @param slug The site every operation acts on. Never a model-supplied value.
 * @param opts The store to act on, plus the context every `edit.ts` call takes.
 */
export function l1Operations(slug: string, opts: EditOptions): L1Operations {
  return {
    describe_site: async () => ({
      config: ((await editConfigGet(slug, undefined, opts)).data as { config: unknown }).config,
      pages: ((await editPageList(slug, opts)).data as { pages: unknown }).pages,
      pending: (await editStatus(slug, opts)).data,
    }),

    list_pages: async () => (await editPageList(slug, opts)).data,

    describe_page: async (p) => {
      const page = (
        (await editPageGet(slug, req(p, 'page'), opts)).data as { page: Record<string, unknown> }
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

    get_l1: async (p) =>
      (await editL1Get(slug, req(p, 'page'), req(p, 'path'), scopeOf(p, opts))).data,

    list_assets: async () => (await editAssetList(slug, opts)).data,

    get_asset: async (p) => (await editAssetGet(slug, req(p, 'asset'), opts)).data,

    get_config: async (p) => (await editConfigGet(slug, req(p, 'key'), opts)).data,

    // REQ-133 — the palette, with the usage counts the delete and rename rules
    // are stated in. The assistant had no way to ask "what would changing this
    // color move" before this; without it, `set_config` on `palette` was an
    // edit made blind.
    get_palette: async () => (await editPaletteGet(slug, opts)).data,

    status: async () => (await editStatus(slug, opts)).data,

    // REQ-131 — the answer to "did anything move under me". The signal that
    // this is worth asking arrives in the per-turn reminder, so in the common
    // case (nothing changed) this is never called at all.
    list_changes: async (p) =>
      (await editChanges(slug, p.since as number | undefined, opts)).data,

    set_l1: async (p) => {
      const out = await editL1Set(slug, req(p, 'page'), req(p, 'path'), p.node, scopeOf(p, opts))
      return { changed: (out.data as { changed: unknown }).changed, message: out.human, now: out.at }
    },

    add_page: async (p) => {
      const out = await editPageAdd(slug, req(p, 'page'), {
        ...opts,
        title: opt(p, 'title'),
        path: opt(p, 'path'),
        seoMeta: obj(p, 'seo'),
      })
      return { changed: out.data, message: out.human, now: out.at }
    },

    update_page: async (p) => {
      const out = await editPageUpdate(slug, req(p, 'page'), {
        ...opts,
        title: opt(p, 'title'),
        path: opt(p, 'path'),
        seoMeta: obj(p, 'seo'),
      })
      return { changed: out.data, message: out.human, now: out.at }
    },

    add_component: async (p) => {
      const out = await editModuleAdd(slug, req(p, 'page'), req(p, 'name'), req(p, 'behavior'), {
        ...opts,
        slot: opt(p, 'slot'),
        config: obj(p, 'config'),
        slots: obj(p, 'presentation') as never,
      })
      return { changed: out.data, message: out.human, now: out.at }
    },

    configure_component: async (p) => {
      const out = await editModuleConfigure(
        slug,
        req(p, 'page'),
        req(p, 'name'),
        obj(p, 'config') ?? {},
        opts,
      )
      return { changed: out.data, message: out.human, now: out.at }
    },

    remove_component: async (p) => {
      const out = await editModuleRm(slug, req(p, 'page'), req(p, 'name'), opts)
      return { changed: out.data, message: out.human, now: out.at }
    },

    remove_page: async (p) => {
      const out = await editPageRm(slug, req(p, 'page'), opts)
      return { changed: out.data, message: out.human, now: out.at }
    },

    set_config: async (p) => {
      const out = await editConfigSet(slug, opt(p, 'key'), obj(p, 'settings'), opts)
      return { changed: out.data, message: out.human, now: out.at }
    },

    // The palette writes (REQ-133). `set_config` could express the first two by
    // merge and neither of the last two at all — merge cannot remove a key or
    // move one, and it has nothing to say about the references both of those
    // are defined in terms of. The guards live in the functions below, so they
    // hold for the assistant exactly as they hold for the popup.
    set_palette_color: async (p) => {
      const out = await editPaletteSet(slug, req(p, 'name'), req(p, 'color'), opts)
      return { changed: out.data, message: out.human, now: out.at }
    },

    add_palette_color: async (p) => {
      const out = await editPaletteAdd(slug, req(p, 'name'), req(p, 'color'), opts)
      return { changed: out.data, message: out.human, now: out.at }
    },

    remove_palette_color: async (p) => {
      const out = await editPaletteRm(slug, req(p, 'name'), opts)
      return { changed: out.data, message: out.human, now: out.at }
    },

    rename_palette_color: async (p) => {
      const out = await editPaletteRename(slug, req(p, 'name'), req(p, 'to'), opts)
      return { changed: out.data, message: out.human, now: out.at }
    },

    // These two answer with the asset rather than with a `change`, but they are
    // writes and so must still hand the count back (REQ-131). A caller whose
    // only writes were assets would otherwise hold a baseline that never
    // advanced, and would be told next turn that its own upload was somebody
    // else's work — the one thing the counter exists to prevent.
    add_asset: async (p) => {
      const source = readSourceFile(req(p, 'file'))
      const out = await editAssetAdd(slug, opt(p, 'as') ?? source.name, source.bytes, opts)
      return { ...(out.data as object), now: out.at }
    },

    write_image: async (p) => {
      const out = await editAssetWrite(slug, req(p, 'name'), req(p, 'svg'), {
        ...opts,
        alt: opt(p, 'alt'),
        force: p.replace === true,
      })
      return { ...(out.data as object), now: out.at }
    },

    remove_asset: async (p) => {
      const out = await editAssetRm(slug, req(p, 'asset'), { ...opts, force: p.force === true })
      return { changed: out.data, message: out.human, now: out.at }
    },

    /**
     * DECLARED BUT NOT REACHABLE FROM A SESSION YET, and the reason is upstream.
     *
     * `publish` is declared and implemented, and `instances.json` does not grant
     * `Publish` to the caretaker — so the manual never mentions it and the model
     * cannot propose it. The operator publishes from the builder toolbar or
     * `1c publish`, unchanged.
     *
     * The reason recorded here used to be that `Toolbox.run` was synchronous and
     * would serialize a promise as `{}`. That is no longer true upstream —
     * `Toolbox.run` awaits what `surface.invoke` returns, which is what lets
     * REQ-142 make every operation above async. Whether to grant the group is
     * now an operator decision rather than a technical impossibility, and this
     * ticket does not take it.
     *
     * Declaring it is still right — the surface declares the whole API, and the
     * grant narrows it (DOC-30). So it is documented and validated, and
     * `instances.json` simply does not grant `Publish` to the caretaker; the
     * manual therefore never mentions it and the model cannot propose it. The
     * operator publishes from the builder toolbar or `1c publish`, unchanged.
     *
     * Left implemented, so granting the group is the whole change.
     */
    publish: async (p) => {
      const result = await cmdPublish(slug, { ...opts, message: opt(p, 'message') })
      const { added, modified, removed } = result.changes
      return {
        id: result.id,
        // Publishing does not touch the draft, so this is the count as it
        // stands — reported for the same reason a write reports it, so a
        // caller's baseline stays current across every call it makes.
        now: await opts.store.counter(slug),
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
        constructor(slug: string, opts: EditOptions) {
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
 *
 * TWO SURFACES WHEN THE SYSTEM KB IS BUILT (REQ-123): the site's L1 controls, and
 * the knowledge corpus. They compose here rather than either one wrapping the
 * other, which is what the Toolbox taking a LIST of surfaces is for — upstream's
 * own `knowledgeToolbox()` helper is the one-surface convenience, and a session
 * that composes knowledge with anything else is told to build the Toolbox itself.
 *
 * The knowledge grant is READ-ONLY and is scoped to the declared KBs on both
 * axes, by upstream's `instanceConfig`. Writing it by hand here would be a second
 * place for the two scope axes to drift apart — `kb` (what may be searched) and
 * `document` (what may be read) must name the same set, or a session could read
 * documents it was never allowed to search for.
 */
export async function createL1Toolbox(
  slug: string,
  opts: GlobalOptions = {},
  {
    role = CARETAKER_ROLE,
    config = null,
    audit = null,
    session = null,
    knowledge = null,
  }: {
    role?: string
    config?: Record<string, unknown> | null
    audit?: ((record: { asObject(): AuditLine }) => void) | null
    session?: string | null
    /** A `KnowledgeRuntime`, or `null` when the KB has not been built. */
    knowledge?: Untyped | null
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

  // The AI host runs on the operator's machine, so the adapter it injects is the
  // filesystem one (REQ-142). It is named here, once — the operations below it
  // never learn which store they got.
  const surfaces: Untyped[] = [new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })]
  let granted = instance
  if (knowledge !== null) {
    const bridge = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
    surfaces.push(new bridge.KnowledgeToolbox(knowledge))
    // `knowledgeInstanceConfig` at the package root; `instanceConfig` is the
    // name inside the module it comes from.
    granted = { ...instance, ...bridge.knowledgeInstanceConfig([SYSTEM_KB]) }
  }

  return new lib.Toolbox(surfaces, granted, { audit, session, role })
}
