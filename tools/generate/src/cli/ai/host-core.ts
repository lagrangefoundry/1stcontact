/**
 * The builder's AI host (REQ-122, REQ-126) — everything between an HTTP route
 * and a model turn.
 *
 * SINCE REQ-126 THIS FILE OWNS NO TOOL KNOWLEDGE. The surface is declared as data
 * (`l1-surface.json`), bound by `L1Toolbox` (`toolbox.ts`), and granted by an
 * instance configuration (`instances.json`). What is left here is the wiring: a
 * Toolbox in, wire specs and a manual out, a backend and a session manager built
 * from them. Adding an operation touches the declaration and the class; it does
 * not touch this file.
 *
 * WHY IT RUNS HERE. The `ai` component's Claude backend — named here by its
 * component alone, because {@link sharedModuleUrl} is the one place in this
 * repository that writes the scope it hangs off — is fetch-based, and its node
 * built-ins are inside what `nodejs_compat` reaches, so the backend and the
 * tool loop are not what pins this to Node. The TOOLS are: every one of them
 * bottoms out in `edit.ts`, which reads and writes the operator's site store. So
 * the host sits beside the store for exactly as long as the store does, and moves
 * to workerd with it at DOC-12 §7 phase 2 — unchanged, because nothing in this
 * file knows about a filesystem beyond the `opts` it passes through.
 *
 * THREE THINGS ARE BOUND TO A SITE, and the binding is structural rather than a
 * parameter the model could get wrong:
 *
 *   - the SURFACE is constructed with the slug (`toolbox.ts`), and no operation
 *     declares a `slug` parameter, so there is no value a model could get wrong;
 *   - the BACKEND is registered under a slug-suffixed name, because the registry
 *     is global and a backend instance carries its tool set — the same shape the
 *     reference host uses for its `+fs` variant;
 *   - the SESSION id is derived from the slug, so a reload resumes the site's
 *     conversation with no index to keep in step and nothing to lose.
 *
 * THIS FILE IS WHERE A SITE BECOMES A SESSION, AND THE ONLY SUCH PLACE (REQ-127).
 * Above it — the origin's routes, the browser transport, the chat pane — nothing
 * names a site. {@link openSession} is the one call that takes a slug; every turn
 * afterwards carries the session id it returned, and {@link streamPrompt}
 * resolves that id back to its site here.
 *
 * That is a correction. The slug used to travel all the way to the browser, on
 * the argument that a session id "would add a value the client could send stale".
 * It removed a stale id by giving the client a SITE IDENTITY instead — so every
 * turn re-asserted which site it was for, and the pane grew a generation token
 * whose only job was to stop a late answer landing in a window that had since
 * switched sites. The binding did not need declaring; it needed locating, and it
 * belongs in the session it was always a property of.
 *
 * The library is loaded through {@link sharedModuleUrl} rather than by bare
 * specifier: it lives in the same out-of-repo store the components do, and a bare
 * specifier resolves it from the main checkout and not from a linked worktree.
 */

import type { GlobalOptions } from '../options'
import type { SiteStore } from '../../store/site-store'
import {
  CONSULTANT_ROLE,
  consultantRole,
  LEGACY_ROLE_NAMES,
  registerSiteProviders,
  type TurnSignal,
} from './roles'
import { ledgerInstanceConfig, ledgerSurfaceFor } from './ledger-core'
import type { LedgerDeps } from './ledger-core'
import { createL1Toolbox, type AiLibrary, type L1Operations } from './toolbox-core'
import { configureProjectBackends } from './backends'
import { contentBlocksFrom, fidelitySurfaceFor } from './fidelity-core'
import { browserMeasurer } from './measure-core'
import type { FidelityDeps } from './fidelity-core'

/**
 * The AI library — and everything it constructs — is untyped JavaScript loaded at
 * runtime, so it enters here as `any`. The boundary is narrow on purpose: every
 * value that LEAVES this module is one of the declared interfaces below.
 */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * The library's own event kind for a tool call, matched rather than restated.
 *
 * It is a string on the wire either way; naming it here is what stops the one
 * comparison this file makes against upstream's vocabulary from being a literal
 * buried mid-function.
 */
const TOOL_ACTIVITY = 'tool_activity'

/**
 * The rest of that vocabulary, needed once {@link tailSession} projects INTO it.
 *
 * Matching one kind was a comparison; producing them is a translation, and the
 * junction's record kinds (`delta`, `tool`, `turn_end`) are deliberately not
 * these — one is what a producer writes down, the other is what a subscriber
 * reads. Naming both sides is what keeps the mapping legible as a mapping.
 */
const TEXT = 'text'
const DONE = 'done'

/**
 * THE SITE MOVED, and the operator is looking at it (BUG-43).
 *
 * WHY THE HOST EMITS THIS AND THE MODEL DOES NOT. `draft` and `edit` render at
 * request time (REQ-119), so nothing about a write reaches the iframe on its
 * own — the reload IS the update, and every other producer of structured edits
 * already performs it (the palette popup and the segment editor both reload the
 * frame after their writes). The assistant was the one writer that did not, so
 * its changes were invisible until the operator reloaded by hand, and the system
 * preamble told it they were visible.
 *
 * It could have been a declared operation — "tell the page to refresh" — and
 * that is exactly the shape to avoid. A tool is a capability the model may skip,
 * and the turns it would skip it on are the long ones, which are the turns where
 * seeing the page unfold matters most. Derived from the change counter, the
 * signal cannot be forgotten, cannot be duplicated, and cannot describe a write
 * that did not happen. It is the same argument REQ-131 makes for pushing the
 * change reminder rather than leaving the model to ask.
 *
 * PER WRITE, NOT PER TURN. A request answered by four edits produces four
 * signals, in among the tool activity that caused them, so the page arrives the
 * way the assistant built it rather than in one jump when it stops talking.
 *
 * `meta.at` is the change count after the write; `meta.changes` is how many
 * landed since the previous signal — normally one, more if a single operation
 * journalled several.
 */
export const SITE_CHANGED = 'site_changed'

/** One turn of a conversation, as the panel renders it. */
export interface ChatTurn {
  role: 'user' | 'assistant'
  markdown: string
}

/** What `/api/ai/session` answers with. */
export interface ChatSession {
  sessionId: string
  turns: ChatTurn[]
  /**
   * The junction offset {@link turns} was folded from — where a tail resumes.
   *
   * Travels with the transcript BECAUSE IT IS ONLY MEANINGFUL WITH IT (BUG-46).
   * `/api/ai/reattach` continues from exactly this offset, so a client that
   * painted these turns and then tailed from here sees the rest of an in-flight
   * turn once: a cursor fetched separately would be a cursor for a different
   * fold, and the seam between them is precisely the gap-or-repeat this pairing
   * exists to remove.
   *
   * Zero when there is no conversation yet, and zero is a valid cursor — the
   * beginning of a junction nobody has written to.
   */
  cursor: number
  /**
   * True when a turn is OPEN at {@link cursor} — the panel should reattach.
   *
   * WHY THE CLIENT CANNOT WORK THIS OUT ITSELF. A transcript ending in an
   * assistant turn looks identical whether that turn finished a second ago or is
   * still being written; the difference is a `turn_end` record, which is on the
   * junction and not in the projection. So it is answered where the fold
   * happened — by `transcript`, on the records it folded, by the same rule the
   * archive uses to decide what it may store — and carried here verbatim.
   *
   * WHY IT IS WORTH A FIELD. Tailing unconditionally would be correct and
   * wasteful — a client that reattaches to a quiet junction holds a request open
   * until the tail's own timeout elapses, having rejoined nothing. This is the
   * cheap question that says whether the expensive one is worth asking.
   *
   * AND WHY GETTING IT WRONG IS NOT MERELY WASTEFUL (BUG-64). The panel treats a
   * reattach as a turn in progress, because that is what it is being told; a
   * composer in its streaming state QUEUES what is typed into it rather than
   * sending it. So a `live` that is true when no turn is running does not cost a
   * spare request — it costs the operator the use of the chat, silently, for as
   * long as the tail runs. See {@link storedTranscript} for the derivation that
   * made this true of every session.
   */
  live: boolean
  /** False when a turn cannot be run — the panel says so instead of silently failing. */
  ready: boolean
  /** Why, when `ready` is false. Written for an operator, not a developer. */
  error?: string
}

/**
 * The Anthropic client the site backends are built with, when one is injected.
 *
 * A TEST SEAM, and the only one this module has. The model call is the single
 * genuine external boundary in the whole loop — the library's own README says
 * network backends are covered by per-language UATs rather than by the shared
 * fixture corpus, and injection at the client is how its backend is written to be
 * driven. Everything on this side of that boundary (the tool loop, the tool
 * handlers, the session store, the SSE projection) is then exercised for real.
 *
 * Null in every non-test process, where the backend builds its own client from
 * `ANTHROPIC_API_KEY`.
 */
let modelClient: unknown = null

/**
 * Inject (or clear, with `null`) the model client. Clears the manager cache,
 * because a `SessionManager` holds its backend instance for the life of the
 * process and would otherwise keep talking to the client it was built with.
 */
export function setModelClient(client: unknown): void {
  modelClient = client
  managers.clear()
}

/** The AI library. Always the host's — this module never goes looking for one. */
function ai(deps: HostDeps): Promise<Untyped> {
  return Promise.resolve(deps.lib)
}

/**
 * What this host needs from its runtime, so ONE host can serve two of them
 * (REQ-146).
 *
 * The same shape REQ-145 gave the route table, and for the same reason: every
 * value below was a LOOKUP against the operator's machine, and a Worker has no
 * machine to look at. Naming them as parameters is what lets the Node transport
 * and workerd run the identical session model, tool loop and audit path rather
 * than two implementations that agree until they do not.
 *
 * Every field is optional and every default is the Node one, so the `1c` CLI and
 * the existing tests call this exactly as before.
 */
export interface HostDeps {
  /**
   * The AI library. The Worker passes the `/workers` rung `1c assets` resolved;
   * `host.ts` passes what {@link sharedModuleUrl} resolves out of the shared
   * store.
   *
   * REQUIRED, and this module never falls back to resolving one. A fallback is
   * what would put `../webui` — and through it the Astro module registry — into
   * the import graph of a Worker, which does not merely bloat the bundle, it
   * fails the build.
   */
  lib: AiLibrary

  /** The store edits land in. Its object identity also keys this host's caches. */
  store: SiteStore

  /**
   * Long-term transcript storage — any `TranscriptArchive`.
   *
   * A Worker MUST NOT be given `FileArchive`. It would not merely be wrong, it
   * would appear to work: `node:fs` resolves under `nodejs_compat` onto a
   * per-isolate ephemeral filesystem, so every session would be lost on eviction
   * while every test passed (lagrange-framework REQ-103).
   */
  archive: Untyped

  /**
   * The live junction storage — `memoryJunctions()` in a Worker.
   *
   * Exactly one of this and {@link HostDeps.logDir} is meaningful. `logDir` is
   * the library's file junction and is Node's; passing neither takes the
   * library's own default, which is a MACHINE location (`~/.xgd/sessions/live`)
   * and wrong for both hosts.
   */
  junctions?: Untyped

  /** Where the file junction writes, for a host that has a disk. */
  logDir?: string

  /** The audit sink. Null records nothing, which is a choice a host may make. */
  audit?: ((record: { asObject(): Untyped }) => void) | null

  /**
   * The Anthropic key, when the runtime does not carry one in `process.env` —
   * which a Worker does not. Read from a `wrangler secret` and passed here.
   */
  apiKey?: string

  /**
   * Pre-built surfaces to compose alongside the L1 one, each with whatever grant
   * travels with it. Empty is an ordinary state: an assistant that knows its
   * tools and not the design corpus.
   */
  extraSurfaces?: Array<{ surface: Untyped; granted?: Record<string, unknown> }>

  /**
   * What the fidelity surface needs, or null where this deployment cannot take
   * pictures (REQ-157).
   *
   * NULL IS ORDINARY, not an error — a Worker with no `[browser]` binding and a
   * laptop with no Playwright are both real deployments, and both should get an
   * assistant that can edit a site rather than one that refuses to start. The
   * surface is simply absent, so its manual never mentions it and the model
   * cannot propose, apologise for, or probe for an operation it has not got.
   *
   * Built HERE rather than by each host because constructing it needs the AI
   * library, which is this file's to resolve — the hosts supply the store, the
   * browser and the origin, which are theirs.
   *
   * A FACTORY OF THE SLUG, like {@link HostDeps.priming} is a factory of the
   * Toolbox, because the surface is bound to one site at construction and the
   * host does not know which site until a manager is built for one. Binding it
   * at construction is what means no operation declares a `slug` and no picture
   * can name a site the session is not about.
   */
  fidelity?: ((slug: string) => FidelityDeps) | null

  /**
   * This session's engagement record (REQ-171), or `null` where there is none.
   *
   * A FACTORY OVER THE SLUG, exactly like `fidelity` above and for the same
   * reason: the record belongs to one session, and which session that is falls
   * out of the site. A deployment with nowhere to keep a record — the `1c` CLI,
   * whose archive is a file and which has no ticket store — passes `null` and
   * composes no ledger surface at all, rather than one that fails on first use.
   */
  ledger?: ((slug: string) => LedgerDeps) | null

  /**
   * Registers the providers the corpus half of the priming names (REQ-182).
   *
   * A FACTORY rather than a value, for the reason it always was: the priming
   * contains the tool manual, and the manual is a projection of THIS session's
   * actual grant — it cannot be built before the box it describes.
   *
   * IT REGISTERS AND RETURNS NOTHING. Under BUG-63 it also handed back the
   * entries naming what it registered, which put the order of a session's
   * priming in two places at once — here for the corpus, in this file for
   * everything around it. The order is declared in `priming.json` now, so what
   * is left is the binding: this seam says what `km.landscape` and
   * `km.mechanism` reach, and the configuration says where they sit.
   *
   * ITS PRESENCE IS THE CORPUS QUESTION. Absent means this host has no knowledge
   * base, and {@link build} loads the configuration's other declared order —
   * what a host that has never run `1c kb build` supplies, and the assistant this
   * host had before there was a KB at all.
   */
  priming?: ((box: Untyped, providers: Untyped) => Promise<void>) | null
  /**
   * What entered the knowledge corpus since this session was last told (REQ-160).
   *
   * A SEAM RATHER THAN A CALL, because this file is runtime-agnostic and the
   * change feed is not: it is a query against the tenant's ticket store, over a
   * knowledge base only the Worker has, with a cursor that lives on a ticket type
   * this host knows nothing about. What the host owns is the DELIVERY — the turn
   * boundary, and the fact that the role's reminders are re-assembled at the top
   * of every turn — which is exactly what REQ-131 already built for the draft
   * change signal and what this rides in on rather than duplicating.
   *
   * Returning `null` must mean "nothing arrived" and must cost nothing: an empty
   * delta contributes no tokens (DOC-39 §6.4).
   */
  delta?: ((sessionId: string) => Promise<string | null>) | null

  /** Operations only the host's runtime can implement (`add_asset`, `publish`). */
  extraOps?: Partial<L1Operations>
}


/** Backends carry their tool set, and the registry is global — so names are per-site. */
export function siteBackendName(slug: string): string {
  return `claude+site:${slug}`
}

/**
 * A site's session id.
 *
 * Derived rather than minted, which is what makes "one session per site" true
 * without an index: any process, on any request, computes the same id for the
 * same site, so a reload resumes and a crash loses nothing but the turn in
 * flight.
 */
export function sessionIdFor(slug: string): string {
  return `site-${slug}`
}

/**
 * The cap on this host's assembled priming (REQ-182; DOC-22 §Q).
 *
 * DECLARED RATHER THAN INHERITED. The framework's default is 200,000 characters —
 * a backstop for any host, not a budget for this one — and a limit nobody chose is
 * a limit nobody notices being approached.
 *
 * The arithmetic: the three static entries are 4,851 characters together and the
 * projected manual summary is about 11,000, so a session with a corpus primes at
 * roughly 16,000 today. The one part that grows without anyone editing this
 * repository is the landscape, which tracks the client's knowledge base. 60,000
 * leaves that room to more than treble before the session refuses to start, and
 * refusing is the right outcome: overflow is a loud failure naming the entry, with
 * no truncation path, so a landscape that ran away is a message rather than a
 * priming quietly missing its last section.
 */
export const MAX_PRIMING_CHARS = 60_000

/** One `SessionManager` per site, keyed by the store it acts on. */
const managers = new Map<string, Promise<Untyped>>()

/**
 * What a site's next turn has to be told, under the same key (REQ-131, REQ-160).
 *
 * THE HOST HOLDS THE SIGNAL; THE PROVIDERS RENDER IT (REQ-182). Until BUG-63 this
 * was a map of `Role` objects refreshed by assigning to `role.reminder`, which
 * worked only because `SessionManager` happened to re-read the field at the top of
 * every turn; under DOC-22 a `Role` is frozen and that assignment throws. BUG-63
 * replaced it with a map of rendered strings, which fixed the mutation and left
 * the host still writing prose.
 *
 * What it holds now is the facts and nothing else — how many changes landed, and
 * what arrived in the corpus. Turning them into sentences is the providers' job,
 * and the words they use are in the configuration file. That is DOC-22 §5's split
 * held all the way down: code contributes the structure, configuration
 * contributes the prose, and the host contributes neither — only the state.
 *
 * An absent entry is an ordinary state, not a missing one: it is the first turn of
 * a session, before any signal exists. Both signal providers answer `null` for it,
 * and a `null` drops its entry and its separator with it.
 */
const signals = new Map<string, TurnSignal>()

/**
 * The draft change count as it stood at the end of each site's last turn.
 *
 * THE BASELINE IS A NUMBER THE HOST MAY HOLD ACROSS TURNS, which an L1 address
 * explicitly is not (see the surface `overview`). The difference is that
 * staleness here is DETECTABLE rather than silent: a baseline that has fallen
 * behind produces a signal, which is the correct outcome, whereas a stale
 * address produces a write landing somewhere nobody chose.
 *
 * Recorded AFTER the turn rather than before it, so the assistant's own edits
 * are absorbed into the baseline and never reported back to it as somebody
 * else's work.
 */
const baselines = new Map<string, number>()

/**
 * A stable id per injected store, so a key can name one without a path.
 *
 * {@link managerKey} identified a host by its `cwd` and root, which is the right
 * identity for a filesystem store and no identity at all for a Worker's — there
 * the store is a pair of bindings and `process.cwd()` is `/` for every tenant.
 * Keying by the store OBJECT is the same move `router.ts` made for its render
 * cache, and a `WeakMap` lets a finished store's managers be collected with it.
 */
let storeSeq = 0
const storeIds = new WeakMap<object, string>()
function storeId(store: SiteStore): string {
  let id = storeIds.get(store as object)
  if (!id) {
    id = `store#${(storeSeq += 1)}`
    storeIds.set(store as object, id)
  }
  return id
}

function hostKey(deps: HostDeps): string {
  return storeId(deps.store)
}

function managerKey(slug: string, deps: HostDeps): string {
  return `${hostKey(deps)}\0${slug}`
}

/**
 * Resolve a session id back to the site it names, or null (BUG-38).
 *
 * THE RESOLUTION IS A STORE READ, and it has to be. This used to be a
 * module-level `Map` that {@link openSession} wrote and this read — which made
 * the binding a property of ONE PROCESS. Under `1c builder` that process is the
 * operator's whole session, so it held; in workerd it is one isolate, and
 * `/api/ai/session` and `/api/ai/prompt` are two requests that are not promised
 * the same one. A turn arriving at a cold isolate found the map empty and was
 * told its conversation was closed — which was, in the cloud, every turn.
 *
 * Nothing was lost by deleting it, because it held nothing that is not
 * derivable: {@link sessionIdFor} is the total inverse of the strip below, and
 * the rest of the host was already built for isolate churn — the archive is
 * durable and `attach` resumes from it whenever the live junction has nothing.
 *
 * WHAT THE REGISTRY WAS ACTUALLY FOR SURVIVES, strengthened. Its job was to stop
 * an arbitrary client string becoming a free-form key into the session store,
 * resuming or creating a conversation by whatever name arrived. `hasDraft` is
 * that same check made against storage instead of against memory: an id resolves
 * only if it names a site THIS TENANT ACTUALLY HOLDS — a fact that does not
 * depend on which isolate is asking, and that a per-process map could not have
 * checked at all.
 */
const SESSION_PREFIX = 'site-'

async function slugForSession(sessionId: string, deps: HostDeps): Promise<string | null> {
  if (!sessionId.startsWith(SESSION_PREFIX)) return null
  const slug = sessionId.slice(SESSION_PREFIX.length)
  if (slug === '') return null
  return (await deps.store.hasDraft(slug)) ? slug : null
}

/**
 * A turn named a session this host did not issue.
 *
 * Its own type because the origin answers it differently from every other
 * failure here: there is nothing for an operator to fix and nothing for the pane
 * to explain away — the client is holding an id from before a restart, or one it
 * invented. The answer is to open a session, which is a thing the caller does,
 * not a thing the operator does.
 */
export class UnknownSessionError extends Error {
  constructor(readonly sessionId: string) {
    super(`No open session '${sessionId}'.`)
    this.name = 'UnknownSessionError'
  }
}

/**
 * The manager for one site: its role, its store, and its registered backend.
 *
 * The role's priming was once the generated tool manual alone. Since REQ-123 the
 * system KB supplies the domain documents, and it arrives through the same
 * `ContextSource` seam this file was already written around — the prediction in
 * the previous version of this comment held, and nothing here changed shape to
 * accommodate it.
 *
 * What is still deliberate is that NEITHER document is hand-written prose about
 * the tools. The manual is projected from the declaration; the landscape is
 * generated from the corpus. Both track their source, which is how priming stays
 * in agreement with what the session can actually do and actually knows.
 */
function managerFor(slug: string, opts: GlobalOptions, deps: HostDeps): Promise<Untyped> {
  const key = managerKey(slug, deps)
  let existing = managers.get(key)
  if (!existing) {
    existing = build(slug, opts, deps)
    managers.set(key, existing)
  }
  return existing
}

/**
 * Run one tool and hand back what the model should actually receive ([[REQ-206]]).
 *
 * EVERY CALL GOES THROUGH THE TOOLBOX, unchanged: validation, the capability
 * gate, the declared refusals, the provenance marking and the audit record are
 * all still what `run` does, for every operation on every surface. This is not a
 * second dispatch path.
 *
 * WHAT IT ADDS is one thing the Toolbox's contract cannot carry. `run` renders a
 * result to TEXT, because that is what a tool result is on every surface that
 * existed when it was written. The fidelity surface's picture operations return
 * Anthropic content blocks, and this backend's wire adapter passes a handler's
 * value through unmodified — so rendered, the picture reached the model as a
 * JSON document with base64 in it: described rather than shown, at the full cost
 * of the image and none of its benefit. The recovery is `fidelity-core`'s,
 * because the shape is, and it hands back `null` for everything else.
 *
 * This was invisible until [[REQ-206]] mounted the surface on a host that
 * registers its tools this way. The `1c` CLI gets the fix for free, having had
 * the same defect for the same reason.
 */
async function runTool(box: Untyped, name: string, input: Record<string, unknown>): Promise<unknown> {
  const payload = await box.run(name, input)
  return contentBlocksFrom(payload) ?? payload
}

async function build(slug: string, opts: GlobalOptions, deps: HostDeps): Promise<Untyped> {
  const lib = await ai(deps)

  // THE MODEL AND THE REPLY CEILING, AS THIS PROJECT'S DECISION (BUG-67). Ahead
  // of everything, because the backend registered below reads the configuration
  // when it is CONSTRUCTED and a manager keeps its instance for its lifetime —
  // installing after the fact would leave the first session on the framework's
  // defaults with the file saying otherwise. See `backends.ts` for why this is a
  // document rather than the constructor options that also exist.
  configureProjectBackends(lib)

  // Constructing the Toolbox is where a CONFIGURATION failure surfaces — a group
  // the surface does not declare, an operation the class does not implement — so
  // it happens once, here, rather than mid-turn as a tool error the model would
  // try to correct and could not.
  // `actor: 'ai'` — REQ-131. Every write the assistant makes is journalled as
  // its own, which is what lets the operator be told who moved something. The
  // per-turn signal does not depend on it (a counter comparison already
  // attributes by arithmetic), so this is for the ANSWER, not the detection.
  // The system KB, when it has been built (REQ-123). `null` is an ordinary
  // state, not an error: an operator who has never run `1c kb build` gets an
  // assistant that knows its tools and not the design documents, which is the
  // assistant this host had before. Failing instead would trade a missing
  // capability for a missing product.
  //
  // THE BROWSER IS ASKED FOR ONCE (REQ-209). The fidelity surface takes a
  // picture with it and the L1 surface measures a drawing with it, and a
  // deployment either has one or it does not — asking that question twice is how
  // the two answers come to disagree, and a session that could photograph a
  // drawing but not measure one is a shape nobody asked for. So the deps are
  // built once here and both consumers read them.
  const fidelity = deps.fidelity ? deps.fidelity(slug) : null
  const box = await createL1Toolbox(
    slug,
    { ...opts, actor: 'ai' },
    {
      audit: deps.audit ?? null,
      session: sessionIdFor(slug),
      lib: deps.lib,
      store: deps.store,
      extraOps: deps.extraOps ?? {},
      // Absent where there is no browser, which is an ordinary deployment: the
      // measuring operations stay declared and granted and refuse with a
      // sentence naming the reason, rather than vanishing per deployment.
      measurer: fidelity ? browserMeasurer(fidelity) : null,
      extraSurfaces: [
        ...(deps.extraSurfaces ?? []),
        // The fidelity surface, when this deployment has the browser and the
        // store it needs. No grant travels with it — see `fidelity-core.ts`.
        ...(fidelity ? [{ surface: await fidelitySurfaceFor(lib, fidelity) }] : []),
        // The engagement record, where this deployment keeps one. Its grant
        // TRAVELS WITH IT — unlike fidelity's, which is an entry in
        // `instances.json` — because what a session may do to its own record is
        // a property of the surface and not a per-role decision, and the
        // narrowing below removes it wherever it was not composed.
        ...(deps.ledger
          ? [
              {
                surface: await ledgerSurfaceFor(lib, deps.ledger(slug)),
                granted: ledgerInstanceConfig(),
              },
            ]
          : []),
      ],
    },
  )

  // Registered rather than constructed directly: the manager reaches its backend
  // through the registry, and registration is an idempotent overwrite, so the
  // instance a manager caches is always the one built with this site's tools.
  //
  // The tools are a PROJECTION of the enabled operations, not a second list: a
  // capability the instance does not grant is never offered, and `run` refuses it
  // again if it somehow arrives. The handler does nothing but hand the call over —
  // validation, gating, invocation, provenance and audit all live behind `run`.
  const schemas = box.schemas() as Record<
    string,
    { description: string; properties: Record<string, unknown>; required: string[] }
  >
  lib.registerBackend(
    siteBackendName(slug),
    () =>
      new lib.ClaudeAPIBackend({
        ...(modelClient ? { client: modelClient } : {}),
        // A Worker has no `process.env`; the key arrives from a `wrangler
        // secret` and is passed in. Spread conditionally so Node keeps reading
        // the environment and an absent key still fails at FIRST USE with the
        // library's own message rather than at construction.
        ...(deps.apiKey ? { apiKey: deps.apiKey } : {}),
        tools: Object.entries(schemas).map(
          ([name, spec]) =>
            new lib.Tool(
              name,
              spec.description,
              { properties: spec.properties, required: spec.required },
              (input: Record<string, unknown>) => runTool(box, name, input),
            ),
        ),
      }),
  )

  // -- priming, as configuration (REQ-182; DOC-22) ---------------------------
  //
  // THE DOCUMENT IS DECLARED, NOT BUILT. BUG-63 said the assembly as an ordered
  // list of named entries but still constructed that list here, in TypeScript,
  // out of prose held in TypeScript. Both halves are data now: `priming.json`
  // holds the entries and every word of them, and `consultantRole` loads it
  // through the framework's own `rolesFromMapping`, so a malformed entry, a
  // stray cache marker or a `provider:` naming something nobody registered is a
  // `PrimingConfigError` at start-up naming the entry.
  //
  // ONE TIER, NOT TWO, and deliberately. DOC-22 distinguishes the product tier
  // from the role tier by variation scope, never by topic; here there is one
  // role and one manager per site, so everything below varies together and
  // splitting it across tiers would only fix the order wrong — product entries
  // are concatenated BEFORE role entries, which would put the product facts in
  // front of "you are a design consultant" and lose the register REQ-171 chose.
  //
  // The product tier is left empty rather than defaulted, and this host means it.
  // `SessionManager` populates both halves with framework defaults only when it
  // is handed NEITHER, so supplying a registry keeps the shipped product entries
  // off — which is the right answer for all three of them:
  // `session.transcript_pointer` tells a session its turns are addressable by id
  // and this host grants no operation that reads them, `session.tool_transcript_note`
  // needs a reader it does not have, and `session.summary` waits on
  // lagrange-framework BUG-45. A session is never told about a capability it was
  // not granted, and that rule does not stop applying because the claim ships
  // upstream.
  const providers = new lib.PrimingProviders()

  // EVERY NAME THE CONFIGURATION MAY USE, BOUND IN ONE PLACE. `roles.ts` owns both
  // halves of that bargain — the file that names the providers and the function
  // that says what each name reaches — so a name can only be added to the
  // configuration by adding it here too, and adding it here without using it is
  // dead weight a reader can see.
  //
  // THE SIGNAL IS READ LATE, not captured. It is a callback rather than a value
  // because `Role` is frozen (DOC-22 §S) and the whole point of the providers is
  // that they see the state as it stands when the manager assembles the turn.
  const key = managerKey(slug, deps)
  registerSiteProviders(providers, { slug, box, signal: () => signals.get(key) })

  // KM's two providers, when this host has a corpus. The seam registers and
  // returns nothing; which entries name it is the configuration's business, and
  // whether this host has one at all is the question this branch asks.
  const withCorpus = Boolean(deps.priming)
  if (deps.priming) await deps.priming(box, providers)

  const role = consultantRole(lib, providers, withCorpus)

  // A TRANSCRIPT ARCHIVE, not a session store. Upstream replaced the whole-object
  // `save(session)` store with an incremental archive port (`apply` / `load` /
  // `list`, all async) because the junction wants an append and long-term storage
  // wants an increment, and one port was forcing both into a rewrite. For this
  // host the consequence is mostly that reads are awaited — `FileArchive` writes
  // the same `<dir>/<id>.md` session file this project already had on disk, so no
  // transcript needs migrating.
  //
  // THE JUNCTION IS PLACED EXPLICITLY, and it has to be. A session now has two
  // tiers — the junction is canonical while it runs, the archive is what it
  // drains into — and `logDir` defaults to `~/.xgd/sessions/live`, which is a
  // MACHINE location. Left alone, one conversation would live half in the
  // workspace and half in the home directory, and two checkouts would share a
  // junction keyed only by slug. That is precisely what {@link sessionsDir} exists
  // to prevent, so both tiers sit under it.
  //
  // BOTH TIERS ARE NOW INJECTABLE (REQ-146), and a Worker must supply both. The
  // defaults stay exactly what they were, so nothing about the operator's local
  // loop changes: a file archive and a file junction, both under the workspace.
  //
  // The Worker's pairing is a store-backed archive plus `memoryJunctions()`. It
  // is NOT free to keep the file junction: `node:fs` resolves under
  // `nodejs_compat` onto a per-isolate ephemeral filesystem, so the file
  // adapters would pass every test in workerd and lose every conversation in
  // production — the precise failure lagrange-framework REQ-103 measured before
  // drawing the port.

  // ONE ROLE, UNDER EVERY NAME IT HAS EVER BEEN WRITTEN AS (REQ-174).
  //
  // The manager resolves a resumed session's role by looking its stored name up
  // in this map and throwing on a miss, and the name is durable in two places a
  // rename cannot reach — the archived transcript's header and the live
  // junction's `session_start` record. Every legacy name is therefore an extra
  // KEY onto the SAME role object, which is what lets a conversation started
  // before the rename reopen unchanged.
  //
  // It is a read path only: `createSession` records {@link CONSULTANT_ROLE} and
  // {@link aiStatus} reports it alone, so nothing is ever written under a legacy
  // name and the alias ages out with the sessions that need it.
  const named: Record<string, Untyped> = { [CONSULTANT_ROLE]: role }
  for (const legacy of LEGACY_ROLE_NAMES) named[legacy] = role

  return new lib.SessionManager(named, deps.archive, {
    ...(deps.junctions ? { junctions: deps.junctions } : { logDir: deps.logDir }),
    // BOTH HALVES OR NEITHER (DOC-22 §10). The manager defaults the registry and
    // the product tier *together*, because a product mapping names providers and
    // a registry without them could not load it — so a host passing only one is
    // taken to mean it, and the other is left empty rather than half-populated
    // with framework defaults it did not ask for. This host means it: its
    // priming is entirely role-tier, and the product tier is empty.
    providers,
    maxPrimingChars: MAX_PRIMING_CHARS,
  })
}

/**
 * What the panel should paint right now, and the cursor to tail from (BUG-46).
 *
 * READS THE JUNCTION, NOT THE ARCHIVE, and that swap is the whole bug. This used
 * to be `archive.load(sessionId)`, which is the DURABLE copy and lags by a whole
 * open turn on purpose: `ArchiveSyncer` cuts at `closedPrefix`, because folding
 * half a turn splits one reply into two stored turns and destroys the whitespace
 * at the seam (lagrange-framework BUG-19 D1). That fold is correct. Rendering
 * from its output is not — between `turn_start` and `turn_end` the archive holds
 * the conversation with that turn missing entirely, so every turn was a window
 * in which a page load painted a transcript the operator could see was wrong.
 *
 * It was invisible for exactly as long as nobody reloaded. The turn is on screen
 * because it STREAMED, over a channel that never touched storage, so nothing
 * looks wrong until the page reloads and takes the turn with it — side effects
 * durable (the tool calls committed), conversation not.
 *
 * `transcript` folds the junction and hands back the cursor it consumed, so
 * {@link openSession} can pass that to a tailer and the tail continues from
 * exactly where the paint stopped — no gap, no turn painted twice. Where there
 * is no junction it seeds one from the archive, which is what makes DOC-21 §11's
 * "one source with no splice" true rather than aspirational. It touches no
 * backend, which is why it can stay ahead of {@link attach}.
 *
 * NULL MEANS "NO CONVERSATION YET", and only that. The blanket `catch { return
 * [] }` this replaces is what let the bug read as an empty conversation instead
 * of a failure: every reason a transcript might not load — a broken store, an
 * unmigrated table — came back looking exactly like a site nobody has talked to.
 * The discriminator is the archive's own listing rather than the error's message,
 * which is the same call {@link attach} already makes the same distinction with.
 *
 * `live` IS UPSTREAM'S ANSWER, NOT ONE COMPUTED HERE (BUG-64). It used to be
 * re-derived from a second read of the log this very call had just folded —
 * `closedPrefix(records).length !== records.length` — and `closedPrefix` returns
 * a COUNT, so `.length` on it was `undefined` and the comparison was true for
 * every session that had any records at all. The panel was therefore told a turn
 * was open every single time it opened a conversation: it reattached to a quiet
 * junction, `watch` held that request for its full ten-minute timeout, and the
 * composer sat in its streaming state for the duration — STOP button showing, and
 * anything typed QUEUED behind a turn that was never running rather than sent.
 *
 * The library is loaded untyped, so nothing objected. But the deeper fault is
 * that the value was derived at all: `transcript` computes this exact predicate
 * on the exact records it folded, and says so in its own contract. Two
 * definitions of "a turn is open" is one more than the codebase can keep in step,
 * and the one written here was the one that could drift — as it had, from the day
 * it was written. Taking the answer removes the divergence rather than fixing
 * one side of it.
 */
async function storedTranscript(
  manager: Untyped,
  sessionId: string,
): Promise<{ turns: ChatTurn[]; cursor: number; live: boolean } | null> {
  let read: { session: Untyped; cursor: number; live: boolean }
  try {
    read = await manager.transcript(sessionId)
  } catch (err) {
    if ((await manager.archive.list()).includes(sessionId)) throw err
    return null
  }
  const turns = (read.session.turns as { role: string; content: string }[]).map((turn) => ({
    role: turn.role === 'user' ? ('user' as const) : ('assistant' as const),
    markdown: turn.content,
  }))
  return { turns, cursor: read.cursor, live: read.live === true }
}

/**
 * Attach the site's session to a live backend segment, creating it if new.
 *
 * Awaited throughout since the archive port went async: `resume` reads the
 * archive when no junction exists, and `createSession` records its home ref. The
 * shape of the decision is unchanged.
 */
async function attach(manager: Untyped, sessionId: string, slug: string): Promise<void> {
  try {
    // `getSession` and NOT `resume`: it resumes only when the session is not
    // already live in this manager. Attach runs on every turn, and `resume` is no
    // longer idempotent now that it reconciles the junction — re-resuming a live
    // session re-folds a record stream that has already been folded, which fails
    // as "fold started mid-stream".
    await manager.getSession(sessionId)
  } catch (err) {
    // `resume` fails for two very different reasons: there is no session yet
    // (normal, and the answer is to create one), or the backend cannot be built
    // (no API key). Only the first is recoverable here, and creating a session
    // would fail the same way for the second — so the distinction is made by
    // whether the archive holds it, not by inspecting the error.
    if ((await manager.archive.list()).includes(sessionId)) throw err
    await manager.createSession(CONSULTANT_ROLE, siteBackendName(slug), { sessionId })
  }
}

/** How a backend failure should read to an operator who is not a developer. */
function operatorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  if (message.includes('ANTHROPIC_API_KEY')) {
    return (
      'The assistant is not switched on: this builder was started without an ' +
      'Anthropic API key. Set ANTHROPIC_API_KEY in the environment and restart it.'
    )
  }
  return message
}

/**
 * Open the site's conversation: its transcript, and whether it can take a turn.
 *
 * Never throws for an unusable backend. The transcript is read BEFORE the backend
 * is touched, so a missing API key costs the operator an explanation rather than
 * their history — the two failures are independent and reporting them together is
 * what lets the panel show the conversation and the reason it is frozen.
 */
export async function openSession(
  slug: string,
  opts: GlobalOptions = {},
  deps: HostDeps,
): Promise<ChatSession> {
  // NOTHING IS RECORDED HERE (BUG-38). The binding used to be written into a
  // per-process map at exactly this point, ahead of touching the backend, so
  // that a session opened into a frozen panel could still take a turn once the
  // operator supplied an API key. That property is now free rather than
  // arranged: {@link slugForSession} derives the same binding from the id and
  // the store, so it holds for any isolate, at any time, whether or not this
  // call was the one that opened the session.
  const sessionId = sessionIdFor(slug)
  let manager: Untyped
  try {
    manager = await managerFor(slug, opts, deps)
  } catch (err) {
    return {
      sessionId,
      turns: [],
      cursor: 0,
      live: false,
      ready: false,
      error: operatorMessage(err),
    }
  }
  // STILL BEFORE `attach`, and now for a second reason as well as the first.
  // {@link storedTranscript} folds the junction and touches no backend, so the
  // property this ordering already bought — a deployment with no API key shows
  // the conversation AND says why it is frozen — survives the swap intact.
  const read = await storedTranscript(manager, sessionId)
  const turns = read?.turns ?? []
  const cursor = read?.cursor ?? 0
  const live = read?.live ?? false
  try {
    await attach(manager, sessionId, slug)
  } catch (err) {
    return { sessionId, turns, cursor, live, ready: false, error: operatorMessage(err) }
  }
  return { sessionId, turns, cursor, live, ready: true }
}

/**
 * Stream one turn in an open session.
 *
 * Takes the SESSION ID, not a slug (REQ-127). A turn is a thing that happens in
 * a conversation, and the conversation already knows which site it is about —
 * naming the site again on every turn is what pushed a site identity out to the
 * browser and made the pane responsible for keeping it in step.
 *
 * The id must be one {@link openSession} issued. That ordering — open, then
 * send — is not a burden moved onto the caller: it is 1c's job to bring up the
 * right session when the operator switches site, and this is the point at which
 * doing it wrong is caught rather than silently starting a conversation about
 * somewhere else.
 *
 * Yields the library's stream events (`text` / `tool_activity` / `done`), which
 * is the shape the chat panel consumes, INTERLEAVED WITH THIS HOST'S OWN
 * {@link SITE_CHANGED} — see below.
 */
export async function* streamPrompt(
  sessionId: string,
  text: string,
  opts: GlobalOptions = {},
  deps: HostDeps,
): AsyncGenerator<{ kind: string; content: string; meta?: Record<string, unknown> }> {
  const slug = await slugForSession(sessionId, deps)
  if (!slug) throw new UnknownSessionError(sessionId)
  const manager = await managerFor(slug, opts, deps)
  await attach(manager, sessionId, slug)

  // REQ-131 — the push half of the change journal. The comparison happens here
  // because this is the only place that knows where a turn begins, and the
  // reminder is refreshed rather than re-registered because the manager
  // re-assembles the role's reminders afresh on every turn.
  // THE COUNTER COMES OFF THE STORE PORT NOW (REQ-146), not off the filesystem.
  // It was `draftCounter(ctxOf(opts), slug)` — synchronous, and reading the
  // journal file directly. `SiteStore.counter` is the same number through the
  // port REQ-142 drew, so it is one line here and the only cost is an `await`
  // the surrounding function was already able to take.
  const key = managerKey(slug, deps)
  const store = deps.store
  const before = baselines.get(key)
  const at = await store.counter(slug)
  // REQ-160 — the corpus delta rides the same channel. Two independent signals
  // about two different things: the site moved under the assistant (a counter
  // comparison), and the client's knowledge grew (a change feed). Both are
  // questions the model has no reason to ask, both are absent when the answer is
  // "nothing", and both are delivered on the reminder the manager is about to
  // assemble — so there is one delivery mechanism to keep in step, not two.
  //
  // PUSHED TO HOST STATE, NOT ASSIGNED TO THE ROLE (BUG-63). A `Role` is frozen,
  // and the assignment this replaces would now throw rather than go stale. The
  // registered reminder provider reads {@link reminders} when the manager
  // assembles the turn's system channel, which is the same moment the old
  // `role.reminder` read happened.
  const delta = deps.delta ? await deps.delta(sessionId) : null
  signals.set(key, {
    since: before === undefined ? undefined : { at: before, changes: at - before },
    delta,
  })

  // BUG-43 — the counter as it stands right now, carried down the loop below so
  // each write is compared against the one before it rather than against the
  // start of the turn. `at` itself must survive for the baseline arithmetic.
  let seen = at
  try {
    for await (const event of manager.promptStream(sessionId, text)) {
      yield withoutImageData(event)
      // ONLY AFTER TOOL ACTIVITY, which is the only thing in a turn that can
      // write. A turn that answers a question makes no extra read at all, and a
      // turn that writes makes one primary-key lookup per call it made.
      if (event.kind !== TOOL_ACTIVITY) continue
      const now = await store.counter(slug)
      if (now <= seen) continue
      const changes = now - seen
      seen = now
      yield { kind: SITE_CHANGED, content: '', meta: { at: now, changes } }
    }
  } finally {
    // AFTER the turn, and in a `finally` so an abandoned turn does not leave the
    // baseline behind: the assistant's own writes have landed by now, so they
    // are absorbed rather than reported back to it next turn.
    baselines.set(key, await store.counter(slug))
  }
}

/**
 * Rejoin a turn already in flight, from the cursor a transcript was folded at.
 *
 * THE OTHER HALF OF {@link openSession} (BUG-46). Reading the junction fixes what
 * a reload PAINTS — the transcript now carries the turn up to the fold, rather
 * than dropping it — but the fold is a still frame of something still moving.
 * Without this the operator gets a reply frozen mid-sentence and no indication it
 * is still being written; they would be back to reloading, which is how they lost
 * a turn in the first place.
 *
 * A SUBSCRIBER, NEVER A SECOND PRODUCER. `watch` is a cursor over the junction
 * and the turn is driven by whoever started it, so attaching here cannot disturb
 * it, cannot start one, and cannot be noticed by the turn or by any other tailer
 * (DOC-21 §11). That is what makes reattaching safe to do on any page load, and
 * why a dropped socket on this route costs nothing at all.
 *
 * THE PROJECTION IS THIS HOST'S, and it belongs here rather than in `router.ts`
 * for the reason every other decision about a conversation does: the router is a
 * transport. `watch` yields junction RECORDS — the producer's vocabulary, with
 * `delta` for a prose chunk — and the panel reads the STREAM vocabulary the
 * library defines for `promptStream` (`text` / `tool_activity` / `card` /
 * `done`). Mapping between them is the same translation {@link streamPrompt}'s
 * consumer already relies on, so a reattached tail and a live turn are
 * indistinguishable to the client, which is what lets the pane's existing reader
 * consume this unchanged.
 *
 * ENDS AT THE TURN, not at the session. `turn_end` closes exactly one turn per
 * subscriber and becomes the `done` that tells a client the reply is whole;
 * `session_end` ends the conversation and also ends this. Records before the
 * cursor are the caller's already — that is what the cursor MEANS — so nothing
 * here replays them, and the concatenation of painted and tailed text is the
 * reply exactly once.
 *
 * A cursor at the end of a quiet junction yields nothing and returns when the
 * tail's own timeout elapses; there is no turn to rejoin, and saying so by
 * closing is the honest answer.
 */
export async function* tailSession(
  sessionId: string,
  cursor: number,
  opts: GlobalOptions = {},
  deps: HostDeps,
): AsyncGenerator<{ kind: string; content: string; meta?: Record<string, unknown> }> {
  const slug = await slugForSession(sessionId, deps)
  if (!slug) throw new UnknownSessionError(sessionId)
  // NO `attach`, deliberately — unlike {@link streamPrompt}. Attaching builds
  // the backend, and a backend is what a turn needs, not what a reader needs.
  // Keeping it out is what lets a deployment with no API key still rejoin a turn
  // another isolate is driving, and it is the same reason the transcript read
  // runs ahead of `attach` in {@link openSession}.
  const manager = await managerFor(slug, opts, deps)
  for await (const record of manager.watch(sessionId, { cursor })) {
    const kind = String(record.kind)
    if (kind === 'delta') {
      yield { kind: TEXT, content: String(record.content ?? '') }
    } else if (kind === 'tool') {
      // Through the same scrubber a live turn's tool activity goes through
      // (REQ-157): a replayed `screenshot` result carries the identical base64,
      // and an SSE frame is no better a place for it the second time.
      yield withoutImageData({
        kind: TOOL_ACTIVITY,
        content: String(record.content ?? ''),
        meta: (record.meta ?? {}) as Record<string, unknown>,
      })
    } else if (kind === 'card') {
      yield {
        kind: 'card',
        content: String(record.content ?? ''),
        meta: (record.meta ?? {}) as Record<string, unknown>,
      }
    } else if (kind === 'turn_end' || kind === 'session_end') {
      // `turn_end` carries how the turn ENDED — `complete`, `aborted`, `error` —
      // and it rides along on `done` because a turn that stopped early looks
      // exactly like a short one to a client that is only told it finished.
      yield {
        kind: DONE,
        content: '',
        ...(kind === 'turn_end' && record.status
          ? { meta: { status: String(record.status) } }
          : {}),
      }
      return
    }
    // Everything else is structure the fold already accounted for —
    // `session_start`, `segment_start`, and the `turn_start` whose text the
    // caller painted from the transcript. Silence is the correct projection.
  }
}

/**
 * REQ-157 — the same event, with any image bytes taken out of it.
 *
 * WHY. A `screenshot` result is an array of content blocks, and the base64 in it
 * is there for the MODEL. Upstream's tool loop yields the identical value as
 * `tool_activity`'s `meta.output`, and this generator's consumer is an SSE
 * stream to the operator's browser — so without this the picture crosses the
 * wire twice, once to the provider and once to a pane that renders an activity
 * line and has no use for the pixels. On a full-page desktop shot that is a
 * megabyte of base64 per call, per turn, framed as a single `data:` line.
 *
 * WHAT SURVIVES. The text block, which is the whole point of `screenshot`
 * returning two: it says what was shot and at what size, so the activity line
 * still reads correctly and the placeholder says a picture was there rather
 * than leaving a hole.
 *
 * WHAT THIS DOES NOT FIX, stated because it would otherwise look fixed. The
 * session manager appends the ORIGINAL event as a `tool` record before this
 * generator ever sees it, and `tool` is a content kind — so the durable
 * transcript still holds the base64 and carries it across a recycle. That is
 * upstream's to redact, shaped exactly like the redaction REQ-111 already built
 * for `turn_start`; the cap in `fidelity-core.ts` is what keeps it bounded until
 * then.
 */
function withoutImageData(event: {
  kind: string
  content: string
  meta?: Record<string, unknown>
}): { kind: string; content: string; meta?: Record<string, unknown> } {
  const output = event.meta?.output
  if (!Array.isArray(output)) return event
  let stripped = false
  const blocks = output.map((block) => {
    const b = block as { type?: string; source?: { media_type?: string; data?: string } }
    if (b?.type !== 'image' || typeof b.source?.data !== 'string') return block
    stripped = true
    return {
      type: 'image',
      source: {
        ...b.source,
        // The size is kept and the bytes are not: an operator watching the pane
        // should be able to see that a picture was taken and how big it was.
        data: `<${b.source.data.length} bytes of ${b.source.media_type ?? 'image'} elided>`,
      },
    }
  })
  if (!stripped) return event
  return { ...event, meta: { ...event.meta, output: blocks } }
}

/** What the assistant is, and whether it can run — the panel's mount-time check. */
export async function aiStatus(
  opts: GlobalOptions = {},
  deps: HostDeps,
): Promise<{ roles: string[]; backends: string[]; ready: boolean; error?: string }> {
  const base = { roles: [CONSULTANT_ROLE], backends: [] as string[] }
  try {
    const lib = await ai(deps)
    // Construction is where a missing prerequisite surfaces, by design — the
    // registry stores factories precisely so the clear error arrives when the
    // backend is first used rather than at import.
    if (!modelClient) new lib.ClaudeAPIBackend(deps.apiKey ? { apiKey: deps.apiKey } : {})
    return { ...base, backends: lib.availableBackends(), ready: true }
  } catch (err) {
    return { ...base, ready: false, error: operatorMessage(err) }
  }
}

/**
 * Drop every cached manager. Exported for tests that rebuild a store per case.
 *
 * The KNOWLEDGE RUNTIME is not dropped here, because it is not held here — it is
 * the Node host's, and `host.ts` clears it alongside this. Its lifetime is the
 * one thing about it that mattered to callers: it is cached for the life of the
 * process, so an operator who runs `1c kb build` while the builder origin is
 * already serving picks the new KB up on the next restart.
 */
export function resetAiHost(): void {
  managers.clear()
  signals.clear()
  baselines.clear()
}
