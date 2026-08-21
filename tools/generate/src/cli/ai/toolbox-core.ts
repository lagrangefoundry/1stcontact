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

import type { GlobalOptions } from '../options'
import type { SiteStore } from '../../store/site-store'
import l1Surface from './l1-surface.json'
import l1Instances from './instances.json'
import { CommandError } from '../errors'
import { pageSegments } from '../segments'
import { publishSite } from '../../publish/publish'
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
import { CARETAKER_ROLE } from './roles'

/**
 * The declared surface, IMPORTED AS DATA rather than read from disk (REQ-146).
 *
 * It was `readFileSync(HERE/l1-surface.json)`, which needs a filesystem and a
 * module path — neither of which exists in a Worker. As a static import it is a
 * value the bundler carries, so the surface reaches workerd by the same route
 * the code does and cannot go missing at request time.
 *
 * Nothing else changed: it is still the same JSON the framework validator checks
 * and still the single declaration site. `1c` and the Worker read one file.
 */
export const L1_DECLARATION: Record<string, unknown> = l1Surface as Record<string, unknown>

/** Role name → instance configuration. Selects and scopes; never describes. */
export const L1_INSTANCES: Record<string, unknown> = l1Instances as Record<string, unknown>

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

/**
 * The library, as a dependency rather than as a lookup (REQ-146).
 *
 * {@link aiCore} resolves the shared store and dynamically imports it, which is
 * right for Node and impossible in workerd: there is no filesystem to resolve
 * against and no dynamic import of an arbitrary URL. So a HOST may supply the
 * module instead — the Worker passes the `/workers` rung that `1c assets` wrote
 * out for the bundler.
 *
 * This is the {@link RouterDeps} shape, not a mode flag: one implementation, two
 * hosts, and the difference named at the edge by whoever knows their runtime.
 * Nothing below ever asks which one it got.
 */
export type AiLibrary = Untyped

// ── the operations ───────────────────────────────────────────────────────────

/**
 * Validated arguments, as the Toolbox hands them over: a structured object,
 * never a string, so nothing below can re-parse a value as syntax (DOC-20 S2).
 *
 * They arrive type-checked against the declaration. Re-checking here is exactly
 * the per-handler duplication DOC-30 indicts, so these accessors narrow and do
 * not validate.
 */
export type Params = Record<string, unknown>
export const req = (p: Params, name: string): string => p[name] as string
export const opt = (p: Params, name: string): string | undefined =>
  p[name] as string | undefined
/** A declared `object` parameter, which the Toolbox has already shape-checked. */
const obj = (p: Params, name: string): Record<string, unknown> | undefined =>
  p[name] as Record<string, unknown> | undefined

/** The component/slot scope an address is resolved in, read off the arguments. */
function scopeOf(p: Params, opts: EditOptions): CopyTargetOptions {
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
 * Every operation is ASYNC (REQ-142), because `edit.ts` is: the store behind it
 * may be a database. `Toolbox.run` awaits what `surface.invoke` returns, so this
 * needs nothing of the declaration and nothing of the host.
 *
 * @param slug The site every operation acts on. Never a model-supplied value.
 * @param opts The store to act on, plus the context every `edit.ts` call takes.
 */
export function l1Operations(
  slug: string,
  opts: EditOptions,
  /**
   * Operations this runtime can supply and the core cannot (REQ-146).
   *
   * `add_asset` reads a file off the operator's disk; that is Node's, and it
   * would drag `node:fs` and the whole Astro-backed command layer into a Worker
   * bundle that has no use for either. It lives in `toolbox.ts` — the Node entry
   * point — and arrives here.
   *
   * `publish` USED TO BE ONE OF THESE and no longer is (REQ-149). It was here
   * because publishing meant snapshotting a directory tree; it is a port verb
   * now, so it sits in the core with every other operation and works against
   * whichever store the host supplied.
   *
   * NOT GRANTED TO THE CARETAKER (`instances.json` withholds `ManageAssets`), so
   * its absence changes nothing a session can reach: the Toolbox refuses an
   * ungranted operation before it would look for a method. A host that DOES
   * grant it must supply it, and the Toolbox's own startup binding check is what
   * says so.
   */
  extra: Partial<L1Operations> = {},
): L1Operations {
  return {
    describe_site: async () => ({
      config: ((await editConfigGet(slug, undefined, opts)).data as { config: unknown }).config,
      pages: ((await editPageList(slug, opts)).data as { pages: unknown }).pages,
      pending: (await editStatus(slug, opts)).data,
    }),

    list_pages: async () => (await editPageList(slug, opts)).data,

    /**
     * Freeze the draft as a revision and render it (REQ-149).
     *
     * IN THE CORE NOW. It was Node-only while publishing meant copying a
     * directory; `publishSite` sequences port verbs, so this operation runs
     * wherever the toolbox does — which is the point of the port.
     */
    publish: async (p) => {
      const result = await publishSite(opts.store, slug, { message: opt(p, 'message') })
      const { added, modified, removed } = result.changes
      return {
        id: result.id,
        published: result.published,
        // Publishing does not touch the draft, so this is the count as it
        // stands — reported for the same reason a write reports it, so a
        // caller's baseline stays current across every call it makes.
        now: await opts.store.counter(slug),
        added,
        modified,
        removed,
      }
    },

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

    // Last, so a host can only ADD to the declared set and never quietly replace
    // an operation the core implements.
    ...extra,
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
/**
 * Keyed by the LIBRARY, not held in one slot (REQ-146).
 *
 * The class extends `lib.ToolboxSurface`, so it is only valid for the library it
 * was built from. A single cached class was correct while there was exactly one
 * way to obtain the library; now a host may inject its own, and a shared slot
 * would hand the first caller's class to a second library's surfaces. A
 * `WeakMap` also lets the class go when the module it extends does.
 */
const bound = new WeakMap<object, Promise<Untyped>>()
function l1ToolboxClass(lib: AiLibrary): Promise<Untyped> {
  return Promise.resolve(lib).then((mod: Untyped) => {
    const existing = bound.get(mod as object)
    if (existing) return existing
    const built = Promise.resolve(
      class L1Toolbox extends mod.ToolboxSurface {
        constructor(
          slug: string,
          opts: EditOptions,
          extra: Partial<L1Operations> = {},
        ) {
          super(L1_DECLARATION)
          for (const [op, run] of Object.entries(l1Operations(slug, opts, extra))) {
            ;(this as unknown as Params)[op] = run
          }
        }
      },
    )
    bound.set(mod as object, built)
    return built
  })
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
 * An audit sink that COLLECTS synchronously and is flushed by its host (REQ-146).
 *
 * WHY THE SPLIT, AND WHY IT IS NOT A DESIGN CHOICE HERE. Upstream's `emit` calls
 * the sink synchronously, ignores its return value and swallows anything it
 * throws — deliberately, because "an audit backend being down is not a reason to
 * fail a tool call the policy already allowed". A sink that returned a promise
 * would therefore be neither awaited nor caught, and in a Worker the isolate can
 * be torn down the moment the response ends, so those writes would be lost
 * exactly when they matter. An `async` sink is not available to us.
 *
 * So the record is captured into a buffer while the turn runs — which cannot
 * fail — and the DURABLE write is one call the route awaits after the turn. The
 * ordering is what AC3 asks for: the audit is written before the response
 * completes, so it survives the isolate that produced it.
 *
 * Records are handed over and the buffer cleared, so a flush cannot write the
 * same call twice and a failed flush does not silently drop the ones after it.
 */
export interface BufferedAuditSink {
  /** The sink to hand the Toolbox. */
  readonly sink: (record: { asObject(): AuditLine }) => void
  /** Take everything recorded since the last call, clearing the buffer. */
  drain(): AuditLine[]
  /** How many records are waiting. */
  readonly pending: number
}

export function bufferedAuditSink(): BufferedAuditSink {
  const lines: AuditLine[] = []
  return {
    sink: (record) => {
      lines.push(record.asObject())
    },
    drain: () => lines.splice(0, lines.length),
    get pending() {
      return lines.length
    },
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
    lib: injectedLib,
    store,
    extraOps = {},
    knowledgeSurface = null,
  }: {
    role?: string
    config?: Record<string, unknown> | null
    audit?: ((record: { asObject(): AuditLine }) => void) | null
    session?: string | null
    /** The AI library. Supplied by the host — see {@link AiLibrary}. */
    lib: AiLibrary
    /**
     * The store every operation reads and writes through (REQ-146).
     *
     * A PARAMETER rather than a lookup, for the same reason the router's is:
     * `fsSiteStore(ctxOf(opts))` was named here, and a runtime with no
     * filesystem cannot reach it however the call arrives. `toolbox.ts` supplies
     * the filesystem adapter for the `1c` CLI; the Worker supplies D1/R2.
     */
    store: SiteStore
    /** Operations only the host's runtime can implement — see {@link l1Operations}. */
    extraOps?: Partial<L1Operations>
    /**
     * A pre-built knowledge surface and the grant it adds, when the host has a
     * system KB. The BRIDGE is loaded by the host, not here: it lives in the
     * shared store and is reached by file URL, which is Node's to do.
     */
    knowledgeSurface?: { surface: Untyped; granted: Record<string, unknown> } | null
  },
): Promise<Untyped> {
  const lib = injectedLib
  const L1Toolbox = await l1ToolboxClass(lib)
  const instance = config ?? (L1_INSTANCES[role] as Record<string, unknown> | undefined)
  if (!instance) {
    throw new Error(
      `No instance configuration for role '${role}' (configured: ` +
        `${Object.keys(L1_INSTANCES).sort().join(', ') || 'none'}).`,
    )
  }

  // The adapter is the HOST'S choice (REQ-146). The operations below it never
  // learn which store they got, which is what lets the same surface run against
  // the filesystem under `1c` and against D1/R2 in the Worker without either one
  // branching.
  const surfaces: Untyped[] = [new L1Toolbox(slug, { ...opts, store }, extraOps)]
  let granted = instance
  if (knowledgeSurface) {
    surfaces.push(knowledgeSurface.surface)
    // The grant is the host's too, and travels WITH the surface: `kb` (what may
    // be searched) and `document` (what may be read) must name the same set, and
    // composing them in two places is how they would come to disagree.
    granted = { ...instance, ...knowledgeSurface.granted }
  }

  return new lib.Toolbox(surfaces, granted, { audit, session, role })
}
