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

import { L1_DOCUMENT_KEYS } from '@1stcontact/site-schema'
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
  editDocumentGet,
  editDrawingRead,
  editDocumentSet,
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
import { CONSULTANT_ROLE } from './roles'
import {
  MeasureUnavailableError,
  NodeNotFoundError,
  evaluateRelations,
  measurementResponse,
  relateAnchors,
  solveTranslation,
  type DrawingMeasurer,
} from './measure-core'
import { AnchorError } from '@1stcontact/site-schema'

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

/**
 * Turn a measuring failure into the surface's own refusal shape (REQ-209).
 *
 * WHY IT IS TRANSLATED AND NOT RETHROWN. Every other operation on this surface
 * fails as a {@link CommandError}, which is what carries the code the Toolbox
 * renders a refusal from. The vocabulary's own errors know the SENTENCE — which
 * anchor, which axis, which node references exist instead — and know nothing
 * about this surface, which is right: they are shared with `measure_page`
 * (DOC-52 §3.6). So the sentence is kept verbatim and only the envelope is
 * added. Anything already a `CommandError` passes through untouched.
 */
function refusal(error: unknown): unknown {
  if (error instanceof CommandError) return error
  if (error instanceof NodeNotFoundError) {
    return new CommandError({ code: 'NOT_FOUND', message: error.message })
  }
  if (error instanceof AnchorError) {
    return new CommandError({ code: 'SCHEMA_INVALID', message: error.message })
  }
  if (error instanceof MeasureUnavailableError) {
    return new CommandError({
      code: 'ENVIRONMENT',
      message: error.message,
      hint: 'Say so to the user rather than guessing at coordinates.',
    })
  }
  return error
}

/** One of the site's own drawings, by the bare name it was written under. */
function drawingSource(slug: string, opts: EditOptions, name: string): Promise<string> {
  return editDrawingRead(slug, name, opts)
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
   * NOT GRANTED TO THE CONSULTANT (`instances.json` withholds `ManageAssets`), so
   * its absence changes nothing a session can reach: the Toolbox refuses an
   * ungranted operation before it would look for a method. A host that DOES
   * grant it must supply it, and the Toolbox's own startup binding check is what
   * says so.
   */
  extra: Partial<L1Operations> = {},
  /**
   * How a drawing is rendered and measured (REQ-209), or `null` where this
   * deployment has no browser to render it in.
   *
   * NULL IS AN ORDINARY DEPLOYMENT, not a misconfiguration — the same one that
   * composes no fidelity surface. The three measuring operations are still
   * declared and still granted, and they REFUSE WITH A SENTENCE naming the
   * reason rather than being withheld: withholding them per deployment would
   * put the grant in two places and turn a capability question into a start-up
   * failure. The browser is the same one the fidelity surface takes, asked for
   * once — a session that could take a picture of a drawing but not measure one
   * is a shape nobody asked for.
   */
  measurer: DrawingMeasurer | null = null,
): L1Operations {
  /** Measure one of the site's own drawings, or say why nothing could be. */
  const measure = async (name: string) => {
    if (!measurer) throw refusal(new MeasureUnavailableError())
    const svg = await drawingSource(slug, opts, name)
    try {
      return { svg, measurement: await measurer(svg) }
    } catch (error) {
      throw refusal(error)
    }
  }

  /**
   * Evaluate the relations a write stated, against the drawing that landed.
   *
   * AGAINST WHAT WAS WRITTEN, not against what was passed in — the artifact is
   * the thing the assertion is about, and re-reading it is what makes the check
   * a check rather than a restatement.
   *
   * NOTHING DISAPPEARS. A relation that cannot be evaluated at all — a misspelt
   * anchor, a node that is gone, a deployment with no browser — is reported WITH
   * THE REASON rather than dropped, because a silently absent assertion reads
   * exactly like one that passed, and that is the one thing an advisory check
   * must never look like.
   */
  const assertOnWrite = async (name: string, stated: readonly string[]) => {
    try {
      const { measurement } = await measure(name)
      return evaluateRelations(measurement, stated)
    } catch (error) {
      const why = error instanceof Error ? error.message : String(error)
      return stated.map((relation) => ({ relation, why }))
    }
  }

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
      // REQ-175 — the page's own document keys, beside its metadata. This is
      // where the blindness was: `editPageGet` has always returned the whole
      // page, `l1` included, and this projection was what dropped it — so an
      // assistant could not see that a page's background was white, could not
      // discover that it had one, and shipped off-white text onto it.
      const l1 = (page.l1 ?? {}) as Record<string, unknown>
      return {
        page: { id: page.id, slug: page.slug, title: page.title, seoMeta: page.seoMeta ?? null },
        style: Object.fromEntries(
          L1_DOCUMENT_KEYS.filter((key) => l1[key] !== undefined).map((key) => [key, l1[key]]),
        ),
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

    // REQ-175 — the page document, which no operation reached before. It sits
    // beside `get_l1`/`set_l1` rather than beside `update_page` because painting
    // a page is authoring, not page management: the two go in the same grant, so
    // a role that can paint every element on a page can also paint the page.
    get_page_style: async (p) => (await editDocumentGet(slug, req(p, 'page'), opts)).data,

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

    set_page_style: async (p) => {
      const out = await editDocumentSet(slug, req(p, 'page'), obj(p, 'style') ?? {}, opts)
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
    /**
     * Render one of the site's own drawings and answer with its geometry.
     *
     * READ-EFFECT, AND ON THIS SURFACE RATHER THAN THE FIDELITY ONE. The thing
     * it reads is a drawing IN THIS SITE, and reaching it needs the site store —
     * which the fidelity surface deliberately has not got. To the model there is
     * one flat list of tools, so which surface carries them is an internal
     * matter; what is not internal is that a drawing is addressed the same way
     * here as everywhere else in the site.
     */
    measure_drawing: async (p) => {
      const name = req(p, 'drawing')
      const { svg, measurement } = await measure(name)
      return measurementResponse(name, measurement, svg)
    },

    /** The signed distance between two anchors, and the axis it lies on. */
    relate: async (p) => {
      const { measurement } = await measure(req(p, 'drawing'))
      try {
        return relateAnchors(measurement, req(p, 'a'), req(p, 'b'))
      } catch (error) {
        throw refusal(error)
      }
    },

    /**
     * The attribute value that achieves a stated relation.
     *
     * The operation that removes the iteration: with `measure_drawing` and
     * `relate` alone the loop is still measure → compute → write → re-measure,
     * and with this it is state the intent → get the number → write it once.
     */
    solve: async (p) => {
      const { measurement } = await measure(req(p, 'drawing'))
      try {
        return solveTranslation(measurement, {
          move: opt(p, 'move'),
          so: req(p, 'so'),
          equals: req(p, 'equals'),
          offset: typeof p.offset === 'number' ? p.offset : undefined,
        })
      } catch (error) {
        throw refusal(error)
      }
    },

    /**
     * Write a drawing, and — when relations were stated — say whether it holds
     * them (REQ-209).
     *
     * THE CHECK BELONGS ON THE WRITE. `solve` is arithmetic and will be right;
     * what fails is the transcription hop between it and the artifact — the
     * number lands on the wrong attribute, the same rewrite changes the
     * font-size so the solved value is stale before it is written, an ancestor
     * gains a transform. A write that echoes its own relations checks them
     * whether or not anyone remembered to.
     *
     * ADVISORY, NEVER GATING, and the write happens FIRST. A refusal here would
     * be a new failure mode with no upside: the model may have changed something
     * deliberately, and a blocked write on a stale assertion is worse than a
     * visible non-zero delta.
     *
     * A RENDER HAPPENS ONLY WHEN `assert` IS PRESENT. Ordinary writes are a pure
     * string scan with no browser, and stay that way.
     */
    write_image: async (p) => {
      const name = req(p, 'name')
      const svg = req(p, 'svg')
      const out = await editAssetWrite(slug, name, svg, {
        ...opts,
        force: p.replace === true,
      })
      const written = { ...(out.data as object), now: out.at }
      const stated = Array.isArray(p.assert) ? (p.assert as string[]) : []
      if (stated.length === 0) return written
      return { ...written, asserted: await assertOnWrite(name, stated) }
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
          measurer: DrawingMeasurer | null = null,
        ) {
          super(L1_DECLARATION)
          for (const [op, run] of Object.entries(l1Operations(slug, opts, extra, measurer))) {
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
 * UP TO THREE SURFACES: the site's L1 controls, the knowledge corpus (REQ-123),
 * and the fidelity surface (REQ-157). They compose here rather than any one of
 * them wrapping the others, which is what the Toolbox taking a LIST of surfaces
 * is for — upstream's own `knowledgeToolbox()` helper is the one-surface
 * convenience, and a session composing more than one is told to build the
 * Toolbox itself.
 *
 * The knowledge grant is READ-ONLY and is scoped to the declared KBs on both
 * axes, by upstream's `instanceConfig`. Writing it by hand here would be a second
 * place for the two scope axes to drift apart — `kb` (what may be searched) and
 * `document` (what may be read) must name the same set, or a session could read
 * documents it was never allowed to search for. The fidelity grant has no such
 * coupling and is therefore an ordinary entry in `instances.json`.
 */
export async function createL1Toolbox(
  slug: string,
  opts: GlobalOptions = {},
  {
    role = CONSULTANT_ROLE,
    config = null,
    audit = null,
    session = null,
    lib: injectedLib,
    store,
    extraOps = {},
    extraSurfaces = [],
    measurer = null,
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
     * How a drawing is rendered and measured (REQ-209), or absent where this
     * deployment has no browser.
     *
     * THE SAME BROWSER THE FIDELITY SURFACE TAKES, asked for once. A deployment
     * either has one or it does not, and asking that question twice is how the
     * two answers come to disagree. Absent, the three measuring operations are
     * still declared and still granted and refuse with a sentence naming the
     * reason — see {@link l1Operations}.
     */
    measurer?: DrawingMeasurer | null
    /**
     * Surfaces composed ALONGSIDE the L1 one, each with whatever grant travels
     * with it — a LIST since REQ-157, because there are now two of them.
     *
     * WHY A LIST AND NOT TWO NAMED SLOTS. It was `knowledgeSurface`, a single
     * named parameter, which was honest while there was exactly one thing that
     * could be composed. A second named slot would have made the third one's
     * shape a foregone conclusion, and — more to the point — it would have made
     * REQ-157's "registered alongside the L1 surface rather than merged into it"
     * a claim about a special case rather than about the composition rule. The
     * Toolbox has always taken a list of surfaces; this now passes one through.
     *
     * A GRANT IS OPTIONAL PER ENTRY. The knowledge surface brings its own,
     * because its two scope axes (`kb`, `document`) must name the same set and
     * composing them in two places is how they would come to disagree. The
     * fidelity surface brings none: its grant is local and is written in
     * `instances.json` beside the L1 grant, which is where a reviewer looks.
     */
    extraSurfaces?: Array<{ surface: Untyped; granted?: Record<string, unknown> }>
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
  const surfaces: Untyped[] = [new L1Toolbox(slug, { ...opts, store }, extraOps, measurer)]
  let granted = instance
  for (const extra of extraSurfaces) {
    surfaces.push(extra.surface)
    // A grant that travels with its surface is merged over the instance's; one
    // that does not is already in the instance, and this leaves it alone.
    if (extra.granted) granted = { ...granted, ...extra.granted }
  }

  // THE SESSION DESCRIBES ITS OWN TOOLS (REQ-171).
  //
  // Composed here and not by either host, because it is not a deployment
  // choice: priming now carries the SUMMARY manual — group prose and one line
  // per tool — and a summary with no route to the detail moves the failure
  // rather than fixing it. `DescribeTools` is that route, so it travels with
  // the manual it completes.
  //
  // LAST, so its block renders after the surfaces it describes. Its grant
  // travels with it for the same reason the knowledge surface's does: what a
  // session may ask about its own tools is a property of the surface, not a
  // per-role decision, and an entry in `instances.json` would be one more place
  // for the two to drift apart.
  surfaces.push(new lib.ManualToolbox())
  granted = { ...granted, ...lib.manualInstanceConfig() }

  // NARROWED TO THE SURFACES THIS SESSION ACTUALLY COMPOSED (REQ-157).
  //
  // `instances.json` says what the CONSULTANT may do; which surfaces exist is a
  // property of the DEPLOYMENT, and the two are not the same question. The
  // fidelity surface needs a browser and a reference store, and a deployment
  // with neither — a Worker with no `[browser]` binding, a `1c` invocation with
  // no server behind it — composes it not at all. Left unnarrowed, the Toolbox
  // reads the grant, finds a surface nobody registered, and refuses to
  // construct: a deployment that cannot take pictures would fail to start an
  // assistant that could still edit a site perfectly well.
  //
  // The narrowing is one-directional and cannot widen a grant: a surface with no
  // entry here is still ungranted, because this only ever removes keys.
  const composed = new Set(surfaces.map((surface) => surface.surface as string))
  granted = Object.fromEntries(
    Object.entries(granted).filter(([surfaceName]) => composed.has(surfaceName)),
  )

  return new lib.Toolbox(surfaces, granted, { audit, session, role })
}
