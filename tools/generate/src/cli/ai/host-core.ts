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
 * A SESSION IS NOT ALWAYS ABOUT A SITE ([[REQ-239]]). The settings conversation
 * is about a BUSINESS — which is what a business's name and its public address
 * are properties of, and, after [[REQ-236]], the only scope under which either
 * means anything. So the three bindings above have a second form: the surface is
 * the `settings` one and takes no site, the backend is registered under
 * `claude+business:<id>`, and the id is `business-<id>`. The two never collide,
 * the manager map holds both, and every function below that resolves an id asks
 * which kind it is exactly once.
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
  BUILDER_ROLE,
  builderRole,
  CONSULTANT_ROLE,
  consultantRole,
  LEGACY_ROLE_NAMES,
  registerBudgetProvider,
  registerBuilderProviders,
  registerMemoryProviders,
  registerSettingsProviders,
  registerSiteProviders,
  SETTINGS_ROLE,
  settingsRole,
  toolTranscriptNote,
  type TurnSignal,
} from './roles'
import { delegationFor } from './delegation'
import {
  settingsInstanceConfig,
  settingsSurfaceFor,
  type SettingsDeps,
} from './settings-core'
import {
  dnsInstanceConfig,
  dnsSurfaceFor,
  type DnsChangeView,
  type DnsDeps,
} from './dns-core'
import { ledgerEntries, ledgerInstanceConfig, ledgerSurfaceFor } from './ledger-core'
import type { LedgerDeps } from './ledger-core'
import { libraryInstanceConfig, librarySurfaceFor } from './library-core'
import type { LibraryDeps } from './library-core'
import { createL1Toolbox, l1SurfaceSet, type AiLibrary, type L1Operations } from './toolbox-core'
import { siteDigestSource } from './digest-core'
import {
  configureProjectBackends,
  PROJECT_BACKEND,
  projectBackendCeiling,
  projectBackendModel,
  projectBackendWindow,
} from './backends'
import { turnSpendRecord, type RecordTurnSpend } from './spend-core'
import { newId } from '../../store/ids'
import { contentBlocksFrom, fidelitySurfaceFor } from './fidelity-core'
import { imageInstanceConfig, imageSurfaceFor, type ImageEditDeps } from './image-core'
import { browserMeasurer } from './measure-core'
import type { FidelityDeps } from './fidelity-core'
import {
  BUDGET_STOP_REASON,
  DONE,
  TEXT,
  TOOL_ACTIVITY,
  budgetStopMeta,
  budgetStopNotice,
  guardTurn,
  lastOccupancy,
  overBudget,
} from './budget-core'

/**
 * The AI library — and everything it constructs — is untyped JavaScript loaded at
 * runtime, so it enters here as `any`. The boundary is narrow on purpose: every
 * value that LEAVES this module is one of the declared interfaces below.
 */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * The library's event vocabulary — matched here, and PRODUCED in `budget-core.ts`.
 *
 * It was three constants in this file: one for the comparison {@link streamPrompt}
 * makes, two more once {@link tailSession} began projecting INTO the vocabulary.
 * [[REQ-296]]'s guard has to close a turn with a terminal event of its own, so the
 * three moved to the module that emits them and this file imports them. One
 * definition site, which is what keeps the junction's record kinds (`delta`,
 * `tool`, `turn_end`) legibly a DIFFERENT set rather than three more literals.
 */

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

/**
 * The settings host's event kind for "the business's record moved" ([[REQ-251]]).
 *
 * THE SAME SIGNAL AS {@link SITE_CHANGED}, FOR THE OTHER HALF OF THE BUILDER, and
 * for the identical reason: the Settings tab puts the pane and its assistant on
 * screen side by side, both able to write the same record, and until this existed
 * only one of them knew when it had. A pane that goes on offering an empty box
 * for an address the conversation beside it has just taken is not stale in a way
 * anybody has to go looking for — both statements are visible at once, they
 * contradict each other, and the claim behind one of them is permanent.
 *
 * A SECOND KIND AND NOT A SECOND MEANING FOR THE FIRST. A settings session has no
 * site, and the host that consumes {@link SITE_CHANGED} answers it by reloading a
 * preview frame — which a business rename is not a reason to do. Two kinds is
 * what lets one pane act on one of them and the other pane on the other, with
 * neither having to ask what kind of session it is in.
 *
 * DERIVED FROM THE OPERATIONS THAT RETURNED, not from a tool the model may call.
 * The site's counterpart is arithmetic over the store's change counter; a
 * business is not a store and has none, so the equivalent is a count of writes
 * that actually completed — see `settings-core.ts`'s `settingsOperations`, which
 * reads which operations are writes out of the declaration rather than from a
 * list beside it.
 *
 * `meta.at` is the count of writes this business's conversation has made since
 * the host was built; `meta.changes` is how many landed since the previous
 * signal. The shape is {@link SITE_CHANGED}'s exactly, so a client that already
 * observes one needs no second reader for the other.
 */
export const BUSINESS_CHANGED = 'business_changed'

/**
 * The settings host's event kind for "we have just changed the client's domain"
 * ([[REQ-260]]).
 *
 * A THIRD KIND, AND THE FIRST ONE THAT CARRIES A PAYLOAD. {@link SITE_CHANGED}
 * and {@link BUSINESS_CHANGED} carry a count and nothing else, deliberately: the
 * pane beside the conversation is an ordinary caller of the same routes the
 * assistant is, and a payload it rendered instead would make the assistant the
 * pane's writer. This one is not that signal. It is the CARD — the sentence the
 * client is owed at the moment their DNS changes, and the undo anchored on it —
 * and it belongs in the conversation rather than in a pane, so it arrives with
 * the change's own id and the sentence that was recorded with it.
 *
 * IT IS A NOTICE AND NOT A QUESTION, which is the whole design decision this
 * ticket turns on. The obvious shape — propose, ask, apply on approval — sounds
 * safe and is not: *a confirmation step the client cannot meaningfully perform
 * is worse than none, because it launders our error into their approval.* The
 * safety is in the operations' own rules, which hold whether or not anybody
 * clicks; what this delivers is visibility, an audit record, and the commit
 * point the undo hangs off.
 *
 * `meta.change` is the change's id, `meta.summary` the sentence recorded with
 * it, and `meta.settles_by` when the world may be expected to agree. One event
 * per change, so six changes are six cards rather than one silent cascade.
 */
export const DNS_CHANGED = 'dns_changed'

/** One turn of a conversation, as the panel renders it. */
export interface ChatTurn {
  role: 'user' | 'assistant'
  markdown: string
  /**
   * When the turn happened, ISO-8601 — the moment the panel stamps it with
   * ([[BUG-138]]).
   *
   * CARRIED, NOT COMPUTED, and that is the whole of why it is a field. The panel
   * stamps a live turn from its own clock, which is right exactly once: at the
   * instant it happens. Replayed turns are history, some of them days of it, and
   * a clock reading is the one number that is certainly wrong for them — so the
   * moment travels with the turn, from the `ts="…"` the transcript markup has
   * carried on every marker since it was written, through the fold that keeps it
   * on every turn it projects, to here.
   *
   * OPTIONAL BECAUSE A RECORD MAY NOT HAVE ONE — a turn folded from a stream that
   * carried no timestamp, or a transcript written before the markup did. Absent,
   * the panel renders the turn exactly as it did before stamps existed: no time,
   * no part in day-boundary detection, no error. Degrading to the old appearance
   * is what keeps a bad or missing value cheaper than a wrong one.
   */
  ts?: string
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
  /**
   * A turn of this conversation that did not finish, or absent ([[BUG-121]]).
   *
   * WHY THE CLIENT CANNOT WORK THIS OUT EITHER. An interrupted turn's defining
   * property is that it left nothing behind: the transcript after it is
   * byte-identical to the transcript before it, so silence is indistinguishable
   * from the assistant having been asked nothing. The fact lives in the record
   * {@link HostDeps.pending} kept BEFORE the model was called, which is the only
   * thing that survives an isolate going away mid-turn.
   *
   * ABSENT IS THE ORDINARY STATE — every turn of the conversation finished — so a
   * pane that has not been taught about this field renders exactly what it did.
   */
  interrupted?: InterruptedTurn
}

/**
 * The turn that did not finish, as the panel needs it ([[BUG-121]]).
 *
 * `recorded` IS THE WHOLE OF WHAT THE PANEL HAS TO DECIDE BETWEEN, and the two
 * cases are genuinely different losses:
 *
 *   - **false** — the turn left no trace: this prompt is in no transcript
 *     anywhere, and this record is the ONLY surviving copy of what the client
 *     typed. The pane owes them their words back.
 *   - **true** — the turn's records did land ([[BUG-46]]'s drain ran) and the
 *     reply in the transcript is a fragment of one. The words are safe; what the
 *     client is owed is being told that what they are reading stopped early
 *     rather than ended.
 *
 * Computed by comparing this record against the transcript answered alongside it,
 * because that comparison can only be made where both are in hand.
 */
export interface InterruptedTurn {
  /** What the client typed, verbatim. */
  text: string
  /** When the turn was opened, ISO-8601. Empty from a record written before this field. */
  at: string
  /** Whether the prompt reached the transcript — see above. */
  recorded: boolean
}

/**
 * What a session remembers about a turn that has not accounted for itself
 * ([[BUG-121]]).
 *
 * `status` IS THE TURN'S OWN VERDICT WHERE IT MANAGED TO GIVE ONE. `open` means
 * nothing closed the turn — the ordinary reading of which is that the isolate
 * driving it went away, because a turn that ends by any route this host can see
 * closes its record. `aborted` and `error` are the library's own outcomes,
 * recorded by a turn that did end and did not complete.
 */
export interface PendingPrompt {
  text: string
  at: string
  status: 'open' | 'aborted' | 'error'
}

/**
 * Where a turn's prompt is remembered while the turn is unaccounted for
 * ([[BUG-121]]).
 *
 * THE HOST OWNS THE TIMING AND NOTHING ELSE. `open` before the model is called is
 * the whole guarantee — it is what puts the client's words on disk ahead of the
 * first token and ahead of any tool write — and `close` when the turn ends is
 * what distinguishes an interruption from a conversation. Where the record lives
 * and what it is written with belongs to the runtime, exactly like
 * {@link HostDeps.delta} beside it.
 */
export interface SessionOccupancy {
  /**
   * What this session's last measured request carried, or `0` for not measured.
   *
   * ZERO IS NEVER "EMPTY", which is upstream's rule for the same figure: a gauge
   * reading zero is a gauge saying there is room, and a guard reading zero would
   * wave through a conversation it cannot measure.
   */
  read(sessionId: string): Promise<number>
  /**
   * Record what this turn's last request carried. Called as the turn closes.
   *
   * A NO-OP FOR ZERO, so a turn whose provider reported nothing leaves the last
   * real figure standing — the same judgement the manager makes about its own
   * in-memory copy, and for the same reason: that figure is still what the most
   * recent measured request carried.
   */
  write(sessionId: string, tokens: number): Promise<void>
}

export interface PendingPrompts {
  /** Remember this prompt. Called before the turn's first token exists. */
  open(sessionId: string, text: string): Promise<void>
  /**
   * The turn ended. `complete` forgets the record; anything else KEEPS it,
   * carrying the outcome — which is what makes an interrupted turn visible to the
   * next page load and to the next turn.
   */
  close(sessionId: string, outcome: 'complete' | 'aborted' | 'error'): Promise<void>
  /** What this session remembers, or `null`. A pure read. */
  read(sessionId: string): Promise<PendingPrompt | null>
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
   * What the `image` surface needs, or null where this deployment cannot change
   * a picture ([[REQ-219]]).
   *
   * A FACTORY OVER THE SLUG, exactly like `fidelity` above and for the same
   * reason: a picture is named across two namespaces and one of them is the
   * site's own files, so which pictures exist falls out of which site the
   * session is about. Binding it at construction is what means no operation
   * declares a `slug` and no recipe can be written against a site the session is
   * not about.
   *
   * NULL IS ORDINARY. A deployment with no renderer — a Worker with no
   * `[images]` binding, a `1c` invocation with no binding at all — composes the
   * surface not at all, so its manual never mentions editing and the model
   * cannot propose, apologise for, or probe for an operation it has not got.
   * That is the same shape a missing browser already has.
   */
  pictures?: ((slug: string) => ImageEditDeps) | null

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
   * The client's catalogue ([[REQ-228]]), or `null` where this deployment holds
   * none.
   *
   * A FACTORY OVER THE SLUG, exactly like `fidelity` above and for the same
   * reason: *"is this on the site"* is a question about the site the session is
   * about, and the record answers for every site its bytes are on — so which one
   * is being asked about falls out of the session rather than being a parameter
   * the model could get wrong.
   *
   * NULL IS ORDINARY, and here it is the `1c` CLI. The Library is material
   * tickets, a local builder has no ticket store, and a deployment that has
   * nothing to catalogue composes the surface not at all rather than one that
   * lists nothing — an empty catalogue and an absent one read identically to a
   * model, and only one of them is true. Same shape as the ledger above.
   */
  library?: ((slug: string) => LibraryDeps) | null

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

  /**
   * Where a turn's prompt is kept while the turn is unaccounted for
   * ([[BUG-121]]).
   *
   * A SEAM FOR {@link HostDeps.delta}'s REASON, and it is the same store: a write
   * to a `chat` ticket, over a ticket type this file knows nothing about. What is
   * decided HERE is the only part that matters — that the record is written
   * BEFORE `promptStream`, so the client's words are durable ahead of the first
   * token and ahead of anything a tool does to their site.
   *
   * ABSENT IS ORDINARY, and it is the `1c` CLI: a local builder has no ticket
   * store, and a host with nowhere to keep the record simply does not keep one
   * rather than failing a turn over a safety net. The same shape `ledger` and
   * `library` already have.
   */
  pending?: PendingPrompts | null

  /**
   * How full this conversation's context was when its last turn ended
   * ([[REQ-296]]).
   *
   * A SEAM FOR {@link HostDeps.pending}'s REASON, and deliberately the same shape:
   * one advisory value on the session's own `chat` ticket, read at the start of a
   * turn and replaced at the end of it.
   *
   * WHY THE HOST HAS TO KEEP IT AT ALL. Upstream measures occupancy off the
   * provider's counters and hands it to the next turn as `ctx.occupancyTokens` —
   * off the manager's IN-MEMORY session. This Worker rebuilds `deps` per request,
   * the manager cache is keyed by the store's object identity, and the session is
   * resumed from the archive: so that field is zero on every turn, the gauge
   * renders nothing, and a guard reading it would never fire. Nothing upstream is
   * broken; nothing on this host can see it.
   *
   * BOTH READERS ARE HERE. The gauge the session is shown (`roles.ts`) and the
   * pre-turn refusal below read the same figure, which is what stops the warning
   * and the guard disagreeing about how full the conversation is.
   *
   * ABSENT IS ORDINARY, and it is the `1c` CLI again — where the manager lives for
   * the whole process, so the framework's own figure is already right and this
   * would have nothing to add.
   */
  occupancy?: SessionOccupancy | null

  /** Operations only the host's runtime can implement (`add_asset`, `publish`). */
  extraOps?: Partial<L1Operations>

  /**
   * Where this host serves one of a site's own assets to the person being talked
   * to, or `null` where it has no surface that could show a picture ([[REQ-217]]).
   *
   * A FACTORY OVER THE SLUG, exactly like `fidelity`, `pictures` and `ledger`
   * above and for the same reason: a site asset is named within one site, and
   * which site that is falls out of the session rather than out of the call.
   *
   * NULL IS ORDINARY AND IS THE DEFAULT. The `1c` CLI's conversation is a
   * terminal: there is nowhere to put a picture and no origin to address it
   * from, so a drawing is written and described in words, exactly as it was
   * before this existed. The Worker supplies one, scoped to the business whose
   * conversation this is — an unscoped path would be resolved against whichever
   * business happens to be admissible first, which is the crossing `scope.ts`
   * exists to prevent.
   *
   * IT ANSWERS WITH AN ADDRESS AND NOT A LINE. What that address is worth saying
   * in — markdown, in this product's case — is the surface's business, and the
   * surface prose that tells the model to paste the line is written beside the
   * code that composes it.
   */
  assetUrl?: ((slug: string, handle: string) => string) | null

  /**
   * Every public address one of this deployment's sites can be reached at, or
   * `null` where it cannot answer ([[REQ-238]]).
   *
   * A FACTORY OVER THE SLUG, like `fidelity`, `pictures`, `ledger` and
   * `assetUrl` above it, and for the same reason: an address names a site, and
   * which site that is falls out of the session rather than out of the call.
   *
   * NULL IS ORDINARY AND IS THE DEFAULT — the `1c` CLI's permanent state. It
   * publishes a directory on somebody's disk: there is no business behind it, no
   * database to ask, and no address a site could have. A host without this
   * publishes exactly as it did before this existed.
   */
  addresses?: ((slug: string) => Promise<readonly unknown[]>) | null

  /**
   * The business's own record, and which business it is ([[REQ-239]]).
   *
   * THE ONE WIRE ON THIS HOST THAT IS NOT A FACTORY OVER A SLUG, and that is the
   * whole novelty of the settings session. Every other surface here is bound to a
   * site because a session was a thing about a site; this one is bound to a
   * BUSINESS, which is what the business's name and its public address are
   * properties of — and which, after [[REQ-236]], is the only scope under which
   * either means anything.
   *
   * THE ID TRAVELS WITH THE DEPS RATHER THAN BEING DERIVED FROM THEM. It is what
   * {@link businessSessionIdFor} names the conversation after, and what
   * {@link businessForSession} checks an incoming id against — the same job
   * `hasDraft` does for a site session, made against a scope this host is already
   * holding rather than against a store read.
   *
   * NULL IS ORDINARY AND IS THE DEFAULT. The `1c` CLI has no businesses: it edits
   * a directory on the operator's machine, and there is no record to read, nothing
   * that could be renamed and no second conversation to open. A host without this
   * behaves in every respect as it did before this existed.
   */
  settings?: { businessId: string; deps: SettingsDeps } | null

  /**
   * The client's domain, as the assistant reads and changes it ([[REQ-260]]).
   *
   * BOUND TO THE SAME BUSINESS {@link HostDeps.settings} is, and composed into
   * the same conversation: a domain is a property of the business rather than of
   * a site, and the pane the client reads its history on is the settings pane.
   *
   * NULL IS ORDINARY AND IS THE DEFAULT, for `fidelity`'s reason: the `1c` CLI
   * manages nobody's DNS, and a deployment with no Cloudflare credential manages
   * none either. The surface is then simply absent, so its manual never mentions
   * it and the model cannot propose, apologise for, or probe for an operation it
   * has not got.
   */
  dns?: DnsDeps | null

  /**
   * Where this turn's token spend is written down ([[REQ-292]]), or absent where
   * this deployment keeps no meter.
   *
   * NOT A FACTORY OVER THE SLUG, unlike `fidelity`, `pictures`, `ledger`,
   * `library`, `assetUrl` and `addresses` above it, and the asymmetry is the
   * point: a turn's cost is a fact about the TENANT and the conversation, not
   * about a site — the settings conversation has no site at all and spends money
   * exactly like a site one does. So it is bound to the tenant by whoever builds
   * it, once, and takes a whole record per turn.
   *
   * ABSENT IS ORDINARY AND IS THE DEFAULT, for `fidelity`'s reason and with a
   * sharper consequence: a host with nowhere to keep a meter reading still takes
   * the turn, unchanged, and simply records nothing. That is the `1c` CLI's
   * permanent state — it edits a directory on somebody's machine, has no tenant
   * and nothing to bill — and it is also what the Worker falls back to if the
   * database handle is not there. A meter that could fail a conversation would
   * be worse than no meter at all.
   */
  recordTurnSpend?: RecordTurnSpend | null
}


/** Backends carry their tool set, and the registry is global — so names are per-site. */
export function siteBackendName(site: string): string {
  return `claude+site:${site}`
}

/**
 * …and per-business, for the same reason ([[REQ-239]]).
 *
 * A DIFFERENT PREFIX AND NOT A DIFFERENT SUFFIX. The two namespaces must not be
 * able to collide, and `claude+site:` already carries a value chosen elsewhere —
 * a site key on the Worker, a directory name under `1c` — so `claude+site:acme`
 * and a business called `acme` would have been the same registry entry with two
 * different tool sets, resolved by whichever built last.
 */
export function businessBackendName(businessId: string): string {
  return `claude+business:${businessId}`
}

/**
 * A site's session id.
 *
 * Derived rather than minted, which is what makes "one session per site" true
 * without an index: any process, on any request, computes the same id for the
 * same site, so a reload resumes and a crash loses nothing but the turn in
 * flight.
 *
 * DERIVED FROM THE STORE'S NAME FOR THE SITE, WHICH IS NOW A KEY ([[REQ-236]]).
 * Nothing in this function changed and that is the point of the change: in the
 * cloud the argument used to be a slug derived from the business's name
 * ([[BUG-90]]), so the FIRST rename of a business would have moved this id —
 * and the ticket holding the whole transcript is found by `fields.session_id`.
 * The conversation would not have been destroyed, which would at least have been
 * visible; it would have been silently replaced by an empty one. A key is minted
 * and never derived, so a rename changes the business's name and leaves the
 * conversation exactly where it was. (In the file-backed tier the argument is
 * still a directory name, and a rename there is still `mv`.)
 */
export function sessionIdFor(site: string): string {
  return `site-${site}`
}

/**
 * A business's session id ([[REQ-239]]).
 *
 * DERIVED, LIKE A SITE'S, AND FOR THE IDENTICAL REASON: any isolate, on any
 * request, computes the same id for the same business, so a reload resumes the
 * settings conversation and there is no index anywhere to keep in step.
 *
 * FROM THE BUSINESS'S KEY AND NEVER FROM ITS NAME. This is the conversation about
 * renaming the business, so a name-derived id would be moved by the very operation
 * the session exists to perform — and the ticket holding the whole transcript is
 * found by `fields.session_id`, so the first rename would silently replace the
 * conversation with an empty one rather than destroying it visibly. That is the
 * failure [[REQ-236]] removed for sites; it would have been reintroduced here, on
 * the one surface where renaming is the point.
 */
export function businessSessionIdFor(businessId: string): string {
  return `business-${businessId}`
}

/**
 * The cap on this host's assembled priming (REQ-182; DOC-22 §Q).
 *
 * DECLARED RATHER THAN INHERITED. The framework's default is 200,000 characters —
 * a backstop for any host, not a budget for this one — and a limit nobody chose is
 * a limit nobody notices being approached.
 *
 * RAISED FROM 60,000, WHICH CLOSED THE BUILDER. The old arithmetic below it was
 * sound and its inputs expired: the manual summary it sized against was about
 * 11,000 characters, and the surfaces this session is granted now contribute
 * roughly 30,000. Assembly reached 65,925 at `km-mechanism` and every session
 * refused to open.
 *
 * WHAT THE OLD NUMBER WAS GUARDING IS NOT EXPENSIVE. The cache boundary is the
 * LAST entry in `priming.json`, so the whole seed — manual and landscape included
 * — sits in the cached prefix, and `_seedForTurn` re-assembles only the entries
 * past that marker. So the seed is built once per session and read from cache at
 * `DEFAULT_CACHE_TTL` (one hour) thereafter. 66,000 characters is ~17,000 tokens,
 * paid once, against a 1M-token window. The ceiling was throttling something that
 * is neither per-turn nor scarce.
 *
 * WHY THE FRAMEWORK'S OWN DEFAULT RATHER THAN A NEW LOCAL GUESS. The previous
 * comment declined `DEFAULT_MAX_PRIMING_CHARS` on the grounds that "a limit nobody
 * chose is a limit nobody notices being approached" — and then nobody noticed this
 * one being approached either, because a constant cannot warn. The backstop is the
 * right role for this value; noticing belongs to the occupancy gauge
 * (lagrange-framework REQ-169), which reports what a request actually costs.
 *
 * Overflow is still a loud failure naming the entry, with no truncation path. That
 * property is why a backstop is safe: a landscape that genuinely runs away is a
 * message rather than a priming quietly missing its last section.
 */
export const MAX_PRIMING_CHARS = 200_000

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
 * How many writes each business's settings conversation has made ([[REQ-251]]).
 *
 * KEYED THE WAY ITS MANAGER IS — `businessManagerKey` — so the count and the
 * conversation it counts for are created and discarded together, and
 * {@link resetAiHost} clears both in one place.
 *
 * IT IS A TOTAL AND NOT A FLAG, so a turn that writes twice is distinguishable
 * from a turn that writes once. The absolute value means nothing outside this
 * host; the differences are the whole of what is reported.
 */
const businessWrites = new Map<string, number>()

/**
 * The DNS changes each business's conversation has made and not yet reported
 * ([[REQ-260]]).
 *
 * A QUEUE AND NOT A COUNT, which is the difference from {@link businessWrites}
 * above. That signal says *something moved, go and re-read*; this one carries
 * the sentence the client is owed, and the sentence is the whole of what the
 * card is. A count would leave the pane to re-derive it, and a sentence rebuilt
 * from a record diff is a sentence nobody wrote.
 *
 * DRAINED BY THE TURN THAT PRODUCED IT — see {@link streamPrompt} — so an entry
 * cannot outlive the conversation it belongs to. Keyed the way its manager is,
 * so {@link resetAiHost} clears it with everything else.
 */
const businessDnsChanges = new Map<string, DnsChangeView[]>()

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

function managerKey(site: string, deps: HostDeps): string {
  return `${hostKey(deps)}\0${site}`
}

/**
 * …and one per business, in the same map ([[REQ-239]]).
 *
 * ONE MAP AND NOT TWO, because what the map is actually keyed by is a STORE and a
 * SCOPE, and a business is a second kind of scope rather than a second kind of
 * host. Two maps would mean two places to clear in {@link resetAiHost} and
 * {@link setModelClient}, and a stale settings manager holding a backend built
 * against a replaced model client is exactly the state those two exist to prevent.
 *
 * THE PREFIX IS WHAT KEEPS THEM APART. A site key and a business id are both
 * opaque strings from this file's point of view, so without it a business and a
 * site that happened to share one would share a manager — and share a ROLE, which
 * is the part that would not merely be wrong but would grant the settings surface
 * to a site conversation.
 */
function businessManagerKey(businessId: string, deps: HostDeps): string {
  return `${hostKey(deps)}\0business:${businessId}`
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

async function siteForSession(sessionId: string, deps: HostDeps): Promise<string | null> {
  if (!sessionId.startsWith(SESSION_PREFIX)) return null
  const site = sessionId.slice(SESSION_PREFIX.length)
  if (site === '') return null
  return (await deps.store.hasDraft(site)) ? site : null
}

/** The business half of the same grammar ([[REQ-239]]). */
const BUSINESS_SESSION_PREFIX = 'business-'

/**
 * Resolve a session id back to the business it names, or null ([[REQ-239]]).
 *
 * THE SAME CHECK {@link siteForSession} MAKES, AGAINST A DIFFERENT FACT. There
 * the question is *does this tenant hold that site*, answered by a store read
 * because a store is what a site is in. Here the question is *is this the
 * business this request already resolved to*, and the answer is already in hand:
 * the scope was settled before the host was built, and `deps.settings` is the
 * wire it arrived on. So the check is an equality rather than a read, and it is
 * strictly stronger — a client cannot name ANOTHER business's conversation even
 * if it knows the id, because the comparison is against the scope rather than
 * against existence.
 *
 * SYNCHRONOUS, unlike its site counterpart, and the asymmetry is that difference
 * made visible rather than smoothed over.
 */
function businessForSession(sessionId: string, deps: HostDeps): string | null {
  if (!deps.settings) return null
  if (!sessionId.startsWith(BUSINESS_SESSION_PREFIX)) return null
  const businessId = sessionId.slice(BUSINESS_SESSION_PREFIX.length)
  if (businessId === '') return null
  return businessId === deps.settings.businessId ? businessId : null
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

/** The manager for one business's settings conversation ([[REQ-239]]). */
function managerForBusiness(businessId: string, deps: HostDeps): Promise<Untyped> {
  const key = businessManagerKey(businessId, deps)
  let existing = managers.get(key)
  if (!existing) {
    existing = buildBusiness(businessId, deps)
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

/**
 * The tools a backend is built with, projected from a Toolbox ([[REQ-295]]).
 *
 * A PROJECTION OF THE ENABLED OPERATIONS, never a second list: a capability the
 * instance does not grant is never offered, and `run` refuses it again if it
 * somehow arrives. The handler does nothing but hand the call over — validation,
 * gating, invocation, provenance and audit all live behind `run`.
 *
 * ONE FUNCTION BECAUSE THERE ARE NOW THREE BACKENDS. The site's, the business's
 * and — since delegation — every worker's, and all three want exactly this. Three
 * copies of a projection is how one of them silently stops matching its box.
 */
function toolSet(lib: Untyped, box: Untyped): Untyped[] {
  const schemas = box.schemas() as Record<
    string,
    { description: string; properties: Record<string, unknown>; required: string[] }
  >
  return Object.entries(schemas).map(
    ([name, spec]) =>
      new lib.Tool(
        name,
        spec.description,
        { properties: spec.properties, required: spec.required },
        (input: Record<string, unknown>) => runTool(box, name, input),
      ),
  )
}

/**
 * The reads a session gets on ITSELF ([[REQ-283]]).
 *
 * THE DECLARATION IS UPSTREAM'S AND NOTHING HERE RESTATES IT. `agent_surface.json`
 * declares what a session may know about its own priming, its own reminder and
 * its own turns; this composes it and says what this product grants of it. That
 * is the whole of the change — no operation, no parameter and no scope axis is
 * added anywhere.
 *
 * WHAT IS GRANTED IS `InspectContext` MINUS ONE OPERATION, expressed as an
 * operation list because that is the one thing a group name cannot say:
 *
 *   - `priming`, `reminder`, `context` — what this session was actually sent.
 *     A consultant that has lost the thread can read its own instructions back
 *     instead of guessing at them.
 *   - `history` — the turns, by position or by turn id. This is the reader the
 *     product tier's transcript pointer names, and it is what makes "everything
 *     outside the recent window is reachable" true rather than aspirational.
 *
 * `summary` IS WITHHELD BECAUSE IT CANNOT BE ANSWERED. It reads a `SummaryStore`,
 * and this host has none: its standing note is a field on the chat ticket and its
 * log is that ticket's body, which is the placement the record's own indexing
 * argument settles. Upstream's own handler says so — with no store it raises
 * `not_found`, *"this host keeps no session summaries"* — and a granted operation
 * that always refuses is precisely the shape this repository keeps refusing to
 * ship. The same fact withholds the whole `MaintainSummary` group: the standing
 * note is written through `set_standing_note` on the ledger surface, beside the
 * decisions it summarises.
 *
 * `history_full` AND `role_priming` ARE NOT GRANTED EITHER: upstream says plainly
 * they belong to somebody working ON a session rather than in one, and an
 * unbounded paste read back into a live conversation displaces everything else in
 * it.
 *
 * NO SESSION SCOPE, DELIBERATELY. The axis exists and `when_unset: allow` is
 * upstream's supported configuration for leaving it open (lagrange-framework
 * REQ-158 §3). The barrier here is the STORE: the ticket store this runtime was
 * built over is bound to one business by `forTenant`, so every ticket that could
 * home a session on this path is already this client's own. It is also the
 * decision [[REQ-228]] already took and asserted, in as many words — *"the reach
 * into past conversations is the intention"* — for the same client's `chat`
 * tickets through the ticket surface. An allow-set here would be a second, weaker
 * barrier that has to be recomputed every time a ticket is minted, and it could
 * not be computed at all before the first turn archives one.
 */
export function sessionContextSurface(
  lib: AiLibrary,
  runtime: {
    archive: Untyped
    junctions: Untyped
    roles: Record<string, Untyped>
    product: Untyped
    providers: Untyped
  },
): { surface: Untyped; granted: Record<string, unknown> } {
  const box = lib as Untyped
  // READ OFF THE PARSED DECLARATION rather than listed, so an operation renamed
  // or regrouped upstream fails here at start-up instead of silently narrowing
  // what a session can do. `INSPECT_GROUP`'s members minus the one withheld
  // above. `groups` is a Map keyed by group name, which is upstream's shape after
  // `Declaration.parse` and not the raw JSON's list.
  const inspect = box.AGENT_DECLARATION.groups.get(box.INSPECT_GROUP)
  if (inspect === undefined) {
    throw new Error(
      `The agent surface declares no ${String(box.INSPECT_GROUP)} group ` +
        `(declared: ${[...box.AGENT_DECLARATION.groups.keys()].sort().join(', ')}).`,
    )
  }
  const granted: string[] = (inspect.operations as string[]).filter(
    (op: string) => op !== 'summary',
  )
  return {
    surface: new box.AgentToolbox(new box.AgentRuntime({ ...runtime, summary: null })),
    granted: box.agentInstanceConfig(null, { operations: granted }),
  }
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

  // AND WHETHER THIS DEPLOYMENT DELEGATES ([[REQ-295]]), beside it and for the
  // same reason: both are start-up questions, both are documents, and both are
  // answered before anything is constructed that reads them. The call validates
  // as well as reads — a worker role bound to a backend `backends.json` does not
  // declare, or one this host cannot build, fails HERE naming the offending key
  // rather than at the first delegation, which would be a configuration mistake
  // discovered in the middle of a customer's conversation.
  const delegation = delegationFor([BUILDER_ROLE])

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

  // -- delegation: construction on a cheaper session ([[REQ-295]]) -----------
  //
  // THE MANAGER IS LATE-BOUND, and it has to be: the manager resolves a backend,
  // the backend carries a Toolbox, the Toolbox carries the delegation surface,
  // and the surface drives the manager. That cycle is real rather than an
  // accident of ordering, which is why the framework's runtime takes a CALLABLE
  // here — this holder is the whole of what breaks it.
  let manager: Untyped = null

  // `undefined` WHEN THIS DEPLOYMENT DOES NOT DELEGATE, and everything below
  // hangs off that one value. Off means the surface is never composed — not
  // composed-and-refusing — so the consultant's manual never mentions `delegate`,
  // its method prose renders nothing, no worker role is registered and no second
  // backend is built. That is the same structural absence a missing browser, a
  // missing renderer and a missing ticket store already have here, and it is what
  // makes the switch a rollback rather than a new state to debug.
  const workerSettings = delegation.enabled ? delegation.workers[BUILDER_ROLE] : undefined

  // The worker's OWN surfaces — its own L1 instance and its own camera, never the
  // consultant's. A Toolbox BINDS each surface to the grant it was built with, so
  // sharing an instance across the two roles would re-bind the consultant's L1
  // surface to the worker's narrower grant and silently take capabilities off the
  // conversation. See {@link l1SurfaceSet}.
  //
  // WHAT IT COMPOSES IS THE L1 SURFACE, THE CAMERA AND THE MANUAL, and
  // deliberately nothing else: no knowledge corpus, no ledger, no catalogue, no
  // session context. A worker is handed a bounded piece of work and reports; the
  // corpus is the consultant's method, the ledger and the catalogue are the
  // ENGAGEMENT's, and a worker writing to either would be a second author on a
  // record that exists to say what the consultant and their client settled.
  const worker = workerSettings
    ? await l1SurfaceSet(
        slug,
        { ...opts, actor: 'ai' },
        {
          role: BUILDER_ROLE,
          lib: deps.lib,
          store: deps.store,
          extraOps: deps.extraOps ?? {},
          measurer: fidelity ? browserMeasurer(fidelity) : null,
          assetUrl: deps.assetUrl ? (handle: string) => deps.assetUrl!(slug, handle) : null,
          addresses: deps.addresses ? () => deps.addresses!(slug) : null,
          extraSurfaces: fidelity ? [{ surface: await fidelitySurfaceFor(lib, fidelity) }] : [],
        },
      )
    : null

  const runtime =
    worker && workerSettings
      ? new lib.DelegationRuntime({
          manager: () => manager,
          // WHICH SESSION IS CALLING, answered at the moment of the call rather
          // than captured — the same shape and the same reason the Toolbox's own
          // audit attribution takes one. This host has exactly one session per
          // site, so the answer is derived rather than tracked.
          caller: () => sessionIdFor(slug),
          workers: {
            [BUILDER_ROLE]: new lib.WorkerConfig({
              backend: workerSettings.backend,
              surfaces: worker.surfaces,
              // ONLY THE HOST KNOWS HOW TO BUILD AN ADAPTER, which is why this is
              // a callback at all. The toolbox handed over is the FRAMEWORK'S —
              // composed from the surfaces above plus its own report operation,
              // and granted from the builder role's `tools` — so the worker's
              // authority is settled before this runs and nothing here can widen
              // it.
              build: ({ toolbox, backend }: { toolbox: Untyped; backend: string }) => {
                auditWorker(toolbox, deps.audit ?? null)
                // GUARDED AGAINST ITS OWN WINDOW ([[REQ-296]]). The ceiling is
                // read off the instance, and the instance reads its settings
                // under the name it was CONSTRUCTED with — so a worker on
                // `claude-haiku-4-5` is held to 200k while the consultant that
                // opened it is held to a million, from one wrapper and with
                // nothing here naming either number.
                return guardTurn(lib, new lib.ClaudeAPIBackend({
                  ...(modelClient ? { client: modelClient } : {}),
                  ...(deps.apiKey ? { apiKey: deps.apiKey } : {}),
                  // THE CONFIGURED NAME AND NOT THE DERIVED ONE. The framework
                  // registers this adapter under a per-session name so the manager
                  // resolves it like any other, but `ClaudeAPIBackend` reads its
                  // settings under the name it was CONSTRUCTED with — so passing
                  // the configured one is what makes `backends.json`'s
                  // `claude_builder` entry the thing that decides the model and
                  // the ceiling.
                  name: backend,
                  tools: toolSet(lib, toolbox),
                }))
              },
            }),
          },
        })
      : null

  // -- the session's own memory ([[REQ-283]]) --------------------------------
  //
  // THREE THINGS THAT ONLY MEAN ANYTHING TOGETHER, so they are decided here in
  // one place rather than three times further down: the provider registry, the
  // role map the registry's product tier and the agent surface both read, and
  // whether this host keeps a record of its own conversation at all.
  //
  // THE REGISTRY AND THE ROLE MAP MOVE UP the function because the agent surface
  // needs both and is composed into the Toolbox, while the role that fills the
  // map is built FROM the Toolbox's manual. That is a genuine cycle, and the
  // resolution is that both are mutable containers handed over empty and filled
  // below — not a second registry and not a second role map, which is what would
  // actually break: the surface would then re-render a session's priming from a
  // registry nobody registered anything in.
  const providers = new lib.PrimingProviders()
  const named: Record<string, Untyped> = {}

  // WHETHER THIS HOST REMEMBERS. The record lives on the chat ticket that homes
  // the session — the standing note in its frontmatter, the decisions in its body
  // — so it exists exactly where a ticket store does, which is the Worker. The
  // `1c` CLI archives to a file, has no ticket store, passes no ledger, and gets
  // none of this: no record, no agent surface, and the product tier's entries
  // rendering nothing. That is the same honest absence the catalogue already has.
  //
  // ONE WIRE AND NOT TWO. Both zones are on one object, so one port reaches both
  // and there is no configuration in which this host has half a memory.
  const ledger = deps.ledger ? deps.ledger(slug) : null

  // -- the product tier, adopted ([[REQ-283]]) -------------------------------
  //
  // THIS HOST USED TO DECLINE IT, and the reason it gave has expired. The note
  // said `session.transcript_pointer` and `session.tool_transcript_note` name
  // readers this host does not grant and that `session.summary` waited on
  // lagrange-framework BUG-45. BUG-45 is fixed in the installed code
  // (`PrimingAssembly.offsets` filters volatile sections before computing), and
  // the agent surface below IS the reader the transcript pointer wanted.
  //
  // ADOPTED WHOLE AND GATED BY THE PROVIDERS, not by a branch here. Every entry
  // in the shipped mapping renders `null` — dropping the entry and its separator
  // — when the fact it states is not true of this session: the pointer when the
  // session has no home ticket, the seed when there is no record, and the tool
  // transcript when no reader was bound. So the tier loads identically on both
  // hosts and the CLI is told none of it, which is what "a session is never told
  // about a capability it was not granted" has to mean once the claim ships
  // upstream.
  //
  // `tool-transcript-note` WAS DECLINED ON ITS OWN MERITS and is now bound
  // ([[REQ-296]]). The reason it was declined was real: the agent surface reads
  // the CONVERSATION, nothing here read the persisted TOOL record stream, and
  // pointing a session at an artifact it cannot open is a hand-written claim
  // about a tool it does not have. `read_work_log` on the ledger surface is that
  // reader, so the claim is now true — and it is bound on the SAME condition the
  // surface is composed on, which is what keeps the two from disagreeing.
  //
  // THE READER IS THE ARCHIVE'S OWN, which is also what the operation answers
  // from. `toolTranscript` is `''` for a session that has recorded no call, so
  // the entry renders only once there is something to point at; a failed read is
  // silence rather than a failed turn, because an unreadable archive is a reason
  // not to advertise a log and never a reason to lose the turn that was being
  // assembled.
  lib.registerDefaults(providers, {
    ...(ledger
      ? {
          toolTranscriptNote: toolTranscriptNote(),
          hasToolTranscript: async (ctx: Untyped) => {
            try {
              return Boolean(await deps.archive.toolTranscript(String(ctx?.sessionId ?? '')))
            } catch {
              return false
            }
          },
        }
      : {}),
  })

  // AND THE GAUGE, REBOUND TO A FIGURE THAT SURVIVES A TURN ([[REQ-296]]). The
  // shipped product tier already declares the entry in the right place — after
  // its cache boundary, so it rides the per-turn tail past the message history —
  // and what it is bound to is this host's decision, exactly as the seed above is.
  // See `roles.ts` for why `ctx.occupancyTokens` cannot be the only source here.
  registerBudgetProvider(providers, (sessionId: string) =>
    deps.occupancy ? deps.occupancy.read(sessionId) : Promise.resolve(0),
  )

  // -- the memory is ONE OBJECT ([[REQ-283]]) --------------------------------
  //
  // The framework's summary has two zones with opposite polarity — a bounded
  // standing note rewritten in place, and an append-only log — and it splits them
  // across a comment's FIELD and that comment's BODY so that the two writes
  // cannot clobber each other. That invariant is what matters; the comment is
  // incidental.
  //
  // THIS HOST ALREADY HAD THE LOG, and somewhere better. [[REQ-171]]'s engagement
  // ledger is it: `record_decision` writes what was settled, why, and what was
  // rejected into the chat ticket's BODY, which is what the knowledge component
  // indexes — a comment body is not. So the note goes in that same ticket's
  // FRONTMATTER, which reproduces the invariant exactly (a field patch merges and
  // never touches the body; an append never reads the field) and collapses the
  // whole of a session's memory into one object.
  //
  // THREE THINGS FALL OUT OF THAT, none cosmetic. It removes a full comment scan,
  // because the ticket is already being fetched for the ledger. Compare-and-set is
  // already there, on `update`'s `expected_version`. And the note stays OUT of the
  // index, which is right rather than a compromise: the ledger is the durable
  // record and belongs in the corpus, the note is rewritten many times a session
  // and would feed it a stream of churn that supersedes itself.
  //
  // SO `SummaryStore` IS NOT USED, and what it would have supplied is supplied
  // deliberately: its cap rule is kept verbatim (`ledger-core.ts` raises rather
  // than truncating, through upstream's own `checkFrame`), its two operations are
  // replaced by one narrow verb on the ledger surface, and its seed provider is
  // replaced by the one registered here.
  //
  // THE SEED IS THIS HOST'S, which is the whole of what that choice costs. The
  // shipped `session.summary` provider renders a frame plus a tail of the STORE's
  // log; ours renders the standing note plus a tail of the LEDGER. Registered
  // over the framework's binding rather than beside it, so the shipped product
  // mapping still names exactly one provider for that entry and there is no
  // second seed to fall out of step.
  //
  // DELIVERY IS THE POINT. Until this, `record_decision` was write-only: the
  // consultant recorded a decision and could not see it on the next turn, so it
  // re-derived state it had already settled — expensively, by looking at the site.
  // Nothing else here matters as much.
  //
  // READ LATE, PER TURN, because a manager outlives many turns and a record
  // captured at build is the empty one for the rest of the conversation.
  registerMemoryProviders(
    providers,
    ledger
      ? {
          record: async () => {
            const record = await ledger.read()
            return { note: record.note, decisions: ledgerEntries(record.body) }
          },
        }
      : null,
    // THE SHIPPED PROSE, BOUND TO THIS HOST'S CONDITION ([[REQ-283]]). It names
    // where the rest of the conversation is and how to reach it — which is true
    // here exactly when the agent surface below is composed, and the two are
    // composed on the same question.
    String(lib.DEFAULT_PROSE.transcript_pointer).trim(),
  )
  const product = lib.defaultProduct(providers)

  // The agent surface's runtime: long-term storage and the live junction, which
  // between them are the whole of what a session's own turns are recorded on. It
  // reads the role map and the registry ABOVE — the same objects the manager is
  // built with — so a closed session whose recorded priming has gone is
  // re-rendered from this host's real configuration rather than from a second
  // copy of it.
  //
  // COMPOSED ON THE SAME QUESTION THE RECORD IS. A session addressed by ticket
  // needs an archive that homes sessions on tickets, and the host that has one is
  // the host that has a ledger — so one condition serves both rather than two
  // that could disagree.
  const context = ledger
    ? sessionContextSurface(lib, {
        archive: deps.archive,
        junctions: deps.junctions,
        roles: named,
        product,
        providers,
      })
    : null

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
      // WHERE A DRAWING CAN BE SEEN ([[REQ-217]]), or absent where it cannot be.
      // Bound to this session's site here, so no operation takes a slug and no
      // line can address a site the conversation is not about.
      assetUrl: deps.assetUrl ? (handle: string) => deps.assetUrl!(slug, handle) : null,
      // [[REQ-238]] — WHETHER THIS SITE HAS A PUBLIC ADDRESS, bound to this
      // session's site here for the same reason `assetUrl` is: the publish
      // operation then takes no site, and cannot ask about one the conversation
      // is not about.
      addresses: deps.addresses ? () => deps.addresses!(slug) : null,
      extraSurfaces: [
        ...(deps.extraSurfaces ?? []),
        // HANDING WORK OVER ([[REQ-295]]), where this deployment delegates.
        //
        // ADDITIVE AND NOTHING ELSE. It composes BESIDE the consultant's `l1` and
        // `fidelity` entries and removes nothing: the consultant can still author
        // a page itself, and delegating is a decision it makes per piece of work
        // rather than a capability it lost. The narrower design — moving
        // construction out of the consultant so delegation is compulsory — is
        // held in reserve for what REQ-293 measures.
        //
        // ITS GRANT TRAVELS WITH IT, like the ledger's and the catalogue's and
        // unlike fidelity's, for `image-core.ts`'s reason: `instances.json` is
        // validated in CI against the declarations THIS repository hands the
        // validator, so a key there for a surface composed per deployment would
        // be a grant nothing can check. The scope axis is `when_unset: error`, so
        // the helper is also the one thing that cannot be got wrong by hand.
        ...(runtime
          ? [
              {
                surface: new lib.DelegationToolbox(runtime),
                granted: lib.delegationInstanceConfig(runtime.roleNames()),
              },
            ]
          : []),
        // THE SESSION'S OWN CONTEXT ([[REQ-283]]), where this host keeps one.
        // Its grant travels with it, like the ledger's and the catalogue's and
        // unlike fidelity's, for the reason `image-core.ts` states: the
        // declaration is UPSTREAM'S, and `instances.json` is validated in CI
        // against the declarations this repository hands the validator, so a key
        // there would be a grant nothing can check.
        ...(context ? [context] : []),
        // The fidelity surface, when this deployment has the browser and the
        // store it needs. No grant travels with it — see `fidelity-core.ts`.
        ...(fidelity ? [{ surface: await fidelitySurfaceFor(lib, fidelity) }] : []),
        // The `image` surface, when this deployment has a renderer to apply a
        // recipe with ([[REQ-219]]). Its grant TRAVELS WITH IT, like the
        // ledger's below and unlike fidelity's, because what a session may do to
        // a picture's recipe is a property of the surface rather than a per-role
        // decision — and because `instances.json` is validated against the
        // declarations the L1 suite hands the validator, so a key there would
        // name a surface that validator was never given.
        ...(deps.pictures
          ? [
              {
                surface: await imageSurfaceFor(lib, deps.pictures(slug)),
                granted: imageInstanceConfig(),
              },
            ]
          : []),
        // The engagement record, where this deployment keeps one. Its grant
        // TRAVELS WITH IT — unlike fidelity's, which is an entry in
        // `instances.json` — because what a session may do to its own record is
        // a property of the surface and not a per-role decision, and the
        // narrowing below removes it wherever it was not composed.
        ...(deps.ledger
          ? [
              {
                surface: await ledgerSurfaceFor(lib, {
                  ...deps.ledger(slug),
                  // THE WORK LOG, READ THROUGH THE ARCHIVE ([[REQ-296]]). Not a
                  // second ticket query: the archive is what WRITES the artifact
                  // on every drain and already answers for it, and it is the same
                  // reader the tool-transcript pointer is bound to above — so the
                  // entry that tells the session the log exists and the operation
                  // that opens it cannot come apart.
                  workLog: () => deps.archive.toolTranscript(sessionIdFor(slug)),
                }),
                granted: ledgerInstanceConfig(),
              },
            ]
          : []),
        // THE CLIENT'S CATALOGUE ([[REQ-228]]), where this deployment holds one.
        // Its grant TRAVELS WITH IT, like the ledger's and the image surface's
        // and unlike fidelity's, for the reason `image-core.ts` states:
        // `instances.json` is validated in CI against the declarations THIS
        // repository hands the validator, so a key there for a surface composed
        // per deployment would be a grant nothing can check.
        //
        // COMPOSED ONLY WHERE THERE IS SOMETHING TO CATALOGUE. The Library is
        // material tickets and the `1c` CLI has no ticket store, so a local
        // builder gets a consultant that edits sites perfectly well and never
        // hears of a catalogue — rather than one that offers to list a Library
        // and always finds it empty, which reads to a model as a client who has
        // given them nothing.
        ...(deps.library
          ? [
              {
                surface: await librarySurfaceFor(lib, deps.library(slug)),
                granted: libraryInstanceConfig(),
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
  // The tools are a PROJECTION of the enabled operations — see {@link toolSet}.
  //
  // AND GUARDED ([[REQ-296]]). `guardTurn` wraps the adapter's tool loop and ends
  // a turn between two requests when the last one measured over this backend's
  // ceiling, so the request that would have overflowed the window is never built.
  // Wrapped at the factory rather than inside it, so every backend this host
  // registers is guarded by construction and a second adapter cannot arrive
  // unguarded — see the worker's own below, which is guarded against its OWN
  // window rather than against the consultant's.
  lib.registerBackend(
    siteBackendName(slug),
    () =>
      guardTurn(
        lib,
        new lib.ClaudeAPIBackend({
          ...(modelClient ? { client: modelClient } : {}),
          // A Worker has no `process.env`; the key arrives from a `wrangler
          // secret` and is passed in. Spread conditionally so Node keeps reading
          // the environment and an absent key still fails at FIRST USE with the
          // library's own message rather than at construction.
          ...(deps.apiKey ? { apiKey: deps.apiKey } : {}),
          tools: toolSet(lib, box),
        }),
      ),
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
  // WHAT IS IN EACH TIER IS SETTLED BY VARIATION SCOPE, never by topic (DOC-22).
  // Everything this project writes is role-tier: there is one role and one
  // manager per site, so it all varies together, and product entries are
  // concatenated BEFORE role entries — splitting the prose across tiers would
  // put product facts in front of "you are a design consultant" and lose the
  // register REQ-171 chose.
  //
  // THE PRODUCT TIER IS THE FRAMEWORK'S, adopted whole ([[REQ-283]]) — see the
  // block at the top of this function for what it carries and why each entry is
  // honest here. It is loaded above rather than below because the agent surface
  // is composed with it, and it is passed to the manager below so the "both
  // halves or neither" default is never reached.
  //
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
  registerSiteProviders(providers, {
    slug,
    box,
    signal: () => signals.get(key),
    // [[REQ-295]] — WHETHER THE CONSULTANT IS TOLD HOW TO HAND WORK OVER, which
    // is the same question as whether it was given the tool. With the switch off
    // the entry renders nothing, so the prompt is byte-for-byte what this host
    // sent before delegation existed.
    delegating: runtime !== null,
    // [[REQ-285]] — THE PAGE ARRIVES WITH THE TURN. Built once per manager and
    // DERIVED AFRESH on every turn it is delivered ([[BUG-128]]): it used to keep
    // the derivation against the draft's write version, which does not move when
    // a journal record or a publish does — so the entry whose whole job is to say
    // *"your client edited something"* could quote a superseded number. See
    // `digest-core.ts` for why the answer is no cache rather than a better key.
    digest: siteDigestSource(
      slug,
      { ...opts, store: deps.store },
      {
        // THE SHARED NAME, WHERE THIS DEPLOYMENT HAS ONE ([[REQ-280]]). The
        // client reads `IMAGE-5` on their own Library row and says it out loud;
        // a digest naming the same picture `/assets/hero.png` would make the
        // session translate, and translating is where it goes wrong. `null` on
        // the `1c` CLI, which has no catalogue and no client to share a name
        // with — the pictures are named by their handles there, which is the
        // only name that exists.
        labels: deps.library
          ? async () => {
              const named = new Map<string, string>()
              for (const item of await deps.library!(slug).list()) {
                if (!item.label) continue
                for (const placed of item.placed_as ?? []) {
                  if (placed.slug === slug) named.set(placed.name, item.label)
                }
              }
              return named
            }
          : null,
      },
    ),
  })

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
  //
  // FILLED RATHER THAN CONSTRUCTED ([[REQ-283]]). The map is declared empty at
  // the top of this function because the agent surface holds it and is composed
  // into the Toolbox the role's manual is projected from. Assigning into the
  // same object is what keeps one role map in the system; handing the surface a
  // copy would leave it re-rendering closed sessions against an empty registry.
  named[CONSULTANT_ROLE] = role
  for (const legacy of LEGACY_ROLE_NAMES) named[legacy] = role

  // AND THE WORKER'S ROLE, where this deployment delegates ([[REQ-295]]).
  //
  // IN THE SAME MAP, because the framework opens a worker with
  // `manager.createSession(role, …)` — so the worker's priming is assembled by
  // the ordinary path and it reads the builder's prose, never the consultant's.
  //
  // THE MANUAL IS PROJECTED FROM THE WORKER'S OWN BOX, which is what the second
  // Toolbox below is for. It composes exactly what a worker gets — the surfaces
  // above, plus the report operation the framework adds to every worker — so the
  // tool list a worker is PRIMED with is the tool list it actually has. Building
  // it here rather than per delegation is what keeps that prefix identical across
  // every worker this deployment opens, and therefore cacheable.
  if (worker && runtime) {
    registerBuilderProviders(providers, {
      box: new lib.Toolbox(
        [...worker.surfaces, new lib.DelegationToolbox(runtime, { workerSession: '' })],
        {
          ...worker.granted,
          [lib.DELEGATION_SURFACE]: {
            groups: [lib.REPORT_GROUP],
            scope: { [lib.DELEGATION_ROLE_AXIS]: [] },
          },
        },
        { role: BUILDER_ROLE },
      ),
    })
    named[BUILDER_ROLE] = builderRole(lib, providers, worker.granted)
  }

  manager = new lib.SessionManager(named, deps.archive, {
    ...(deps.junctions ? { junctions: deps.junctions } : { logDir: deps.logDir }),
    // BOTH HALVES, EXPLICITLY (DOC-22 §10). The manager defaults the registry and
    // the product tier *together*, because a product mapping names providers and
    // a registry without them could not load it — so a host passing only one is
    // taken to mean it, and the other is left empty. This host passes both: the
    // registry it bound every one of its own names in, and the framework's
    // shipped product tier loaded against it ([[REQ-283]]).
    providers,
    product,
    // NO `summary` OPTION, and the omission is deliberate ([[REQ-283]]). The
    // manager's one use for it is the `/compact` hint, which only a
    // compaction-capable backend ever asks for and this host's does not — so a
    // shim over the standing note would be a reader with no caller. The note is
    // delivered where it is actually read: in the seed, every turn.
    maxPrimingChars: MAX_PRIMING_CHARS,
  })
  // ASSIGNED AND THEN RETURNED, rather than returned directly ([[REQ-295]]). The
  // delegation runtime above holds `() => manager`, so this assignment is what
  // closes the cycle; returning the expression would leave the holder null for
  // the life of the manager and every delegation refusing for want of one.
  return manager
}

/**
 * Record a worker's tool calls where the caller's are recorded ([[REQ-295]]).
 *
 * CONDITION 8, AND THE ONE PLACE THIS HOST REACHES PAST THE FRAMEWORK'S API. The
 * worker's Toolbox is constructed by the delegation surface — deliberately, since
 * that is what makes the worker's authority its role's grant rather than this
 * host's discipline — and `Toolbox` takes its audit sink at construction, which
 * the surface does not pass on. There is no other seam: the record is built
 * inside `run`, from the grant and the declaration, and anything reconstructed
 * out here would be a second, poorer opinion about what happened.
 *
 * IT IS SAFE BECAUSE THE FIELD IS READ PER CALL rather than captured, and it is
 * WORTH DOING because the alternative is a blind spot exactly where an auditor
 * most needs sight: which side of a delegation changed a customer's site. The
 * attribution itself is already right — the surface builds the worker's Toolbox
 * with its own session id and role — so this supplies the sink and nothing else.
 *
 * The upstream fix is one option on `WorkerConfig`; until it exists this is the
 * honest shape, and it is one line so it is cheap to delete.
 */
function auditWorker(
  toolbox: Untyped,
  sink: ((record: { asObject(): Untyped }) => void) | null,
): void {
  if (sink) toolbox._audit = sink
}

/**
 * The settings session's manager — its one surface, its role, its backend
 * ([[REQ-239]]).
 *
 * IT IS NOT {@link build} WITH A FLAG, and the difference is not stylistic. Every
 * line of that function is about a site: the L1 surface constructed with a slug,
 * the browser the fidelity surface navigates with, the change counter the turn
 * signal is arithmetic over, the ledger and the catalogue bound per site. A
 * settings session has a business and no site at all, so a shared function would
 * be a sequence of `if (site)` guards around code that never runs — and the one
 * thing the two genuinely share, the way a manager is assembled, is upstream's
 * `SessionManager` rather than anything this file would be factoring out.
 *
 * THE TOOLBOX IS COMPOSED HERE RATHER THAN BY `createL1Toolbox`, for the same
 * reason: that function's first act is to construct the L1 surface over a slug.
 * What it does that IS general — append the manual, merge each travelling grant,
 * narrow the grant to the surfaces actually composed — is three lines, and they
 * are written out below where a reader can see that the settings surface and the
 * manual are the whole of what this session has.
 *
 * WHAT THE GRANT IS, AND WHERE IT LIVES. [[REQ-239]] asked for an entry in
 * `instances.json` granting the settings surface and nothing else; [[REQ-237]]
 * settled it the other way and this follows [[REQ-237]], because that file is
 * validated in CI against the declarations THIS repository hands the validator
 * and a key there for a surface composed per deployment is a grant nothing can
 * check. The property the ticket was actually asking for is unchanged and is
 * visible in one expression here: `settingsInstanceConfig()` plus the manual's
 * own, and nothing else — no L1 groups, no knowledge, no ledger, no catalogue.
 */
async function buildBusiness(businessId: string, deps: HostDeps): Promise<Untyped> {
  const settings = deps.settings
  if (!settings) throw new UnknownSessionError(businessSessionIdFor(businessId))
  const lib = await ai(deps)

  // AHEAD OF THE BACKEND, exactly as in {@link build}: the backend reads this
  // project's model and reply-ceiling configuration when it is CONSTRUCTED, and a
  // manager keeps its instance for its lifetime.
  configureProjectBackends(lib)

  /**
   * THE WRITE SIGNAL IS INSTALLED HERE ([[REQ-251]]), where the surface is
   * composed and where the business it is composed for is in hand. The surface
   * itself counts nothing and knows nothing about panes — it reports that a write
   * returned, and this is the one place that can say which conversation's write
   * it was.
   */
  const key = businessManagerKey(businessId, deps)
  const surfaces: Untyped[] = [
    await settingsSurfaceFor(lib, settings.deps, () => {
      businessWrites.set(key, (businessWrites.get(key) ?? 0) + 1)
    }),
    new lib.ManualToolbox(),
  ]
  const granted: Record<string, unknown> = {
    ...settingsInstanceConfig(),
    ...lib.manualInstanceConfig(),
  }

  /**
   * THE CLIENT'S DOMAIN, WHERE THIS DEPLOYMENT MANAGES ONE ([[REQ-260]]).
   *
   * COMPOSED INTO THE SETTINGS CONVERSATION rather than into the site's, because
   * a domain belongs to the business and not to a site — and because the pane
   * the client reads the change history on is six inches to the left of this
   * conversation.
   *
   * ABSENT IS AN ORDINARY DEPLOYMENT, and absent means the surface is not
   * composed at all rather than composed and refusing: the manual is projected
   * from what is granted, so a `1c` process or a Worker with no Cloudflare
   * credential gets an assistant that does not know these tools exist.
   *
   * THE HOOK QUEUES THE CARD. `settings.deps`'s hook above counts writes so the
   * pane can re-read; this one carries the sentence the client is owed, because
   * a card is the sentence and nothing else can reconstruct it.
   */
  if (deps.dns) {
    surfaces.unshift(
      await dnsSurfaceFor(lib, deps.dns, (change) => {
        businessDnsChanges.set(key, [...(businessDnsChanges.get(key) ?? []), change])
      }),
    )
    Object.assign(granted, dnsInstanceConfig())
  }
  const box = new lib.Toolbox(surfaces, granted, {
    audit: deps.audit ?? null,
    session: businessSessionIdFor(businessId),
    role: SETTINGS_ROLE,
  })

  // GUARDED LIKE THE CONSULTANT'S ([[REQ-296]]), and on the same terms: a
  // settings conversation runs on the same adapter, against the same window, and
  // has no more protection from a long turn than any other.
  lib.registerBackend(
    businessBackendName(businessId),
    () =>
      guardTurn(
        lib,
        new lib.ClaudeAPIBackend({
          ...(modelClient ? { client: modelClient } : {}),
          ...(deps.apiKey ? { apiKey: deps.apiKey } : {}),
          tools: toolSet(lib, box),
        }),
      ),
  )

  const providers = new lib.PrimingProviders()
  // THE FRAMEWORK'S DEFAULTS, FOR ONE NAME ([[REQ-296]]). This manager is built
  // with a registry and NO product tier — deliberately: the shipped tier would
  // tell a settings session its turns are addressable by id, which is true of the
  // consultant, which has the `agent` surface, and not of this one. But the
  // occupancy gauge is upstream's provider, so the registry has to hold it before
  // the configuration can name it, and `registerDefaults` is how it is bound. The
  // three names it registers beside it are named by no tier this role loads.
  lib.registerDefaults(providers, {})
  registerBudgetProvider(providers, (sessionId: string) =>
    deps.occupancy ? deps.occupancy.read(sessionId) : Promise.resolve(0),
  )
  // THE NAME IS READ PER TURN AND NOT CAPTURED. It is the thing this session
  // exists to change, so a framing line rendered once would spend the rest of the
  // conversation naming the business by the name the customer has just corrected.
  registerSettingsProviders(providers, {
    box,
    name: async () => (await settings.deps.read())?.name ?? null,
    // Under the settings manager's own key, so the conversation's signal and the
    // conversation are created and discarded together ([[BUG-121]]).
    signal: () => signals.get(businessManagerKey(businessId, deps)),
  })

  return new lib.SessionManager({ [SETTINGS_ROLE]: settingsRole(lib, providers) }, deps.archive, {
    ...(deps.junctions ? { junctions: deps.junctions } : { logDir: deps.logDir }),
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
  const turns = (read.session.turns as { role: string; content: string; ts?: string }[]).map(
    (turn) => ({
      role: turn.role === 'user' ? ('user' as const) : ('assistant' as const),
      markdown: turn.content,
      // WHEN, AND NOT ONLY WHAT ([[BUG-138]]). The fold puts a `ts` on every turn
      // it projects — a user turn takes its `turn_start`'s, an assistant turn its
      // first delta's — and this mapping is the last place that fact exists before
      // the wire. Dropping it here left the panel with no moment to stamp a
      // replayed turn with and nothing to detect a day boundary from, which is
      // exactly the bare history the ticket describes.
      //
      // OMITTED RATHER THAN EMPTY when the record carries none, so `ts` absent
      // means "this turn has no moment" on the wire as it does in the type — an
      // empty string would be a value the panel had to know to disbelieve.
      ...(typeof turn.ts === 'string' && turn.ts !== '' ? { ts: turn.ts } : {}),
    }),
  )
  return { turns, cursor: read.cursor, live: read.live === true }
}

/**
 * Attach the site's session to a live backend segment, creating it if new.
 *
 * Awaited throughout since the archive port went async: `resume` reads the
 * archive when no junction exists, and `createSession` records its home ref. The
 * shape of the decision is unchanged.
 */
async function attach(
  manager: Untyped,
  sessionId: string,
  // THE ROLE AND THE BACKEND ARE PARAMETERS NOW ([[REQ-239]]). They were a slug,
  // from which both were derived here — which was honest while every session was
  // a site's. A settings session has neither a slug nor the consultant's role, and
  // deriving a second pair from a second kind of key inside this function would
  // put the "what kind of session is this" question in a place that has already
  // been answered twice by the time it is reached.
  role: string,
  backend: string,
): Promise<void> {
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
    await manager.createSession(role, backend, { sessionId })
  }
}

/** What became of a turn, as {@link PendingPrompts.close} takes it ([[BUG-121]]). */
type TurnOutcome = 'complete' | 'aborted' | 'error'

/**
 * What the library's terminal event says became of the turn ([[BUG-121]]).
 *
 * A QUEUED TURN IS REPORTED COMPLETE, and it is the one case that reads oddly:
 * nothing ran, so nothing was interrupted. The text is a control record on the
 * junction and whoever holds the session will drain it, so keeping a record of it
 * would offer the client a re-send of a message that is still going to be
 * answered — a duplicate rather than a rescue.
 *
 * A TERMINAL EVENT WITH NO STATUS IS COMPLETE TOO. The library stamps one on
 * every real turn; reading its absence as an interruption would mark ordinary
 * turns on the day it stops, which is the failure direction that costs the
 * client trust in the notice.
 */
function turnOutcome(meta?: Record<string, unknown>): TurnOutcome {
  if (meta?.queued === true) return 'complete'
  const status = typeof meta?.status === 'string' ? meta.status : ''
  if (status === '' || status === 'complete') return 'complete'
  return status === 'error' ? 'error' : 'aborted'
}

/**
 * What the previous turn left unaccounted for, or `null` ([[BUG-121]]).
 *
 * NEVER THROWS, like both calls below it. This is a safety net, and a net that
 * fails the turn it was there to protect has made things worse than having none:
 * every one of these is a ticket-store round trip, and a store that cannot answer
 * must cost the conversation a notice rather than the turn.
 */
async function previousTurn(deps: HostDeps, sessionId: string): Promise<PendingPrompt | null> {
  if (!deps.pending) return null
  try {
    return await deps.pending.read(sessionId)
  } catch {
    return null
  }
}

/** Remember this turn's prompt, before the model is called ([[BUG-121]]). */
async function openPending(deps: HostDeps, sessionId: string, text: string): Promise<void> {
  if (!deps.pending) return
  try {
    await deps.pending.open(sessionId, text)
  } catch {
    // See {@link previousTurn}.
  }
}

/** Record what became of the turn ([[BUG-121]]). */
async function closePending(
  deps: HostDeps,
  sessionId: string,
  outcome: TurnOutcome,
): Promise<void> {
  if (!deps.pending) return
  try {
    await deps.pending.close(sessionId, outcome)
  } catch {
    // See {@link previousTurn}. This one runs in a `finally`, so a throw here
    // would also REPLACE whatever error the turn was already carrying.
  }
}

/**
 * Write down what the turn cost ([[REQ-292]]).
 *
 * IN THE SAME `finally` AS {@link closePending}, and for a stronger version of
 * the same reason. A consumer that walks away mid-turn returns the generator,
 * which runs that block and never reaches `catch` — and abandonment is exactly
 * when spend would otherwise be lost, because the requests were sent and paid
 * for whatever became of their answers. On the Worker that `finally` is held
 * open past the client disconnect by `ctx.waitUntil` (BUG-46), so the write
 * survives the response closing without a new lifecycle mechanism and without
 * delaying the last frame the client sees.
 *
 * NEVER THROWS, like the three calls above it. A meter is not worth a
 * conversation: this runs in a `finally`, so a throw here would also REPLACE
 * whatever error the turn was already carrying — the operator would be shown a
 * database failure in place of the model's own.
 *
 * A TURN THAT MEASURED NOTHING WRITES NOTHING, decided by
 * {@link turnSpendRecord} rather than here, so every host gets the rule instead
 * of every host restating it.
 */
async function writeTurnSpend(
  deps: HostDeps,
  meta: Record<string, unknown> | undefined,
  facts: {
    session: string
    turn: string
    startedAt: string
    role: string
    outcome: string
    /**
     * What this turn caused ELSEWHERE — a delegated worker's requests
     * ([[REQ-295]]), or absent on a host that does not delegate.
     *
     * READ OFF THE JUNCTION BY THE CALLER, for the reason the comment below
     * records: the manager puts `attributed` on the junction's `turn_end` record
     * and not on the terminal event, so a turn's own meta cannot carry it. The
     * read is the caller's because only the caller holds the manager, and it is
     * skipped entirely where the surface was never composed — a host that cannot
     * delegate must not pay a log read per turn to be told so.
     */
    attributed?: unknown[] | null
  },
): Promise<void> {
  if (!deps.recordTurnSpend) return
  try {
    // FOLDED FROM THE TERMINAL EVENT'S META BY THE LIBRARY'S OWN FUNCTION, which
    // is the one place that says which of that meta's keys are spend and which
    // are facts about the turn that are not (`interrupted`, `occupancy_tokens`).
    // Re-deriving the split here would be a second opinion about upstream's
    // vocabulary, which is the thing that goes quietly out of date.
    const lib = deps.lib as Untyped
    const spend = {
      ...((lib.turnSpend(meta) ?? {}) as Record<string, unknown>),
      // …PLUS WHAT THE TURN CAUSED ELSEWHERE, which `turnSpend` deliberately
      // does not carry: its whole job is to say which of that meta's keys ARE
      // spend, and a delegated worker's requests are not this turn's spend —
      // they are a second party's, attributed to the turn that caused them
      // (REQ-148 §8).
      //
      // TWO SOURCES, IN THAT ORDER ([[REQ-295]]). The raw meta first, so the
      // record holds it the day the terminal event starts carrying it; the
      // caller's junction read second, which is where the manager actually puts
      // it today — `turn_end` gets `attributed`, `doneEvent` does not. Whichever
      // answers is the same list from the same place; naming both is what stops
      // this needing a change when upstream closes the gap.
      ...(Array.isArray(meta?.attributed)
        ? { attributed: meta.attributed }
        : facts.attributed?.length
          ? { attributed: facts.attributed }
          : {}),
    } as Record<string, unknown>
    const record = turnSpendRecord(spend, {
      session: facts.session,
      turn: facts.turn,
      startedAt: facts.startedAt,
      endedAt: new Date().toISOString(),
      role: facts.role,
      backend: PROJECT_BACKEND,
      model: projectBackendModel(lib),
      outcome: facts.outcome,
    })
    if (record === null) return
    await deps.recordTurnSpend(record)
  } catch {
    // See above. Deliberately swallowed.
  }
}

/**
 * Whether this turn can be taken at all, and what to say when it cannot
 * ([[REQ-296]]).
 *
 * THE PRE-TURN HALF OF THE GUARD, and the half that has to be here rather than in
 * the adapter: what it reads is the figure the LAST turn measured, and on a Worker
 * that figure survives only because this host wrote it down
 * ({@link HostDeps.occupancy}). The adapter's own guard covers the other moment —
 * between two requests INSIDE a turn — from the segment ledger it holds itself.
 *
 * WHY BOTH MOMENTS ARE NEEDED. A conversation that ended its last turn nearly full
 * overflows on its FIRST request of the next one, before any tool has run and
 * before the in-turn guard has anything to read. That is the shape the measured
 * ~300k-token session would have hit on a 200k worker, and a count of iterations
 * could never have seen it coming.
 *
 * A REFUSAL IS NOT A FAILURE. The turn ends `aborted`, its prompt stays on the
 * pending record — so the client can re-send it into a fresh conversation — and
 * nothing is written to the meter, because nothing was sent and a row of zeros
 * would claim a turn that cost nothing rather than a turn that never ran.
 */
async function overContextBudget(deps: HostDeps, sessionId: string): Promise<number> {
  if (!deps.occupancy) return 0
  const ceiling = projectBackendCeiling(deps.lib as Untyped)
  if (ceiling <= 0) return 0
  try {
    const resident = await deps.occupancy.read(sessionId)
    return overBudget(resident, ceiling) ? resident : 0
  } catch {
    // See {@link previousTurn}: a store that cannot answer must cost the
    // conversation a safeguard rather than the turn it was there to protect.
    return 0
  }
}

/** The two events a refused turn is made of ([[REQ-296]]). */
function budgetRefusal(
  deps: HostDeps,
  resident: number,
): { kind: string; content: string; meta?: Record<string, unknown> }[] {
  return [
    { kind: TEXT, content: budgetStopNotice(resident, projectBackendWindow(deps.lib as Untyped)) },
    // `aborted`, like the adapter's own stop and for the same reason: the turn
    // neither finished nor broke, and `turnOutcome` reads this meta.
    //
    // AND THE REASON, NAMED HERE DIRECTLY, because this event is the host's own
    // and reaches the client unaltered. The in-turn half has to have it restated
    // above the manager instead — see {@link budgetNamed}.
    {
      kind: DONE,
      content: '',
      meta: { status: 'aborted', stop_reason: BUDGET_STOP_REASON, occupancy_tokens: resident },
    },
  ]
}

/**
 * The turn's terminal event as the client should read it ([[REQ-296]]).
 *
 * ONE REASON FOR BOTH HALVES OF THE GUARD. A turn the ADAPTER stopped arrives
 * here having lost its `stop_reason`: the manager reads `interrupted`,
 * `occupancy_tokens` and the spend keys off the adapter's meta and emits a
 * terminal event of its own, which is the right boundary for upstream and means
 * the reason must be re-stated on this side of it. `budgetStopMeta` derives it
 * from the two numbers the guard itself fires on, so a client sees the same
 * outcome whether the refusal came before the turn or inside it.
 *
 * EVERY OTHER TERMINAL EVENT PASSES THROUGH UNCHANGED, image data stripped as
 * always.
 */
function budgetNamed(deps: HostDeps, event: Untyped): Untyped {
  const stripped = withoutImageData(event)
  const named = budgetStopMeta(
    deps.lib as Untyped,
    event.meta as Record<string, unknown> | undefined,
    projectBackendCeiling(deps.lib as Untyped),
  )
  return named ? { ...stripped, meta: named } : stripped
}

/**
 * Record how full the conversation was when this turn ended ([[REQ-296]]).
 *
 * DERIVED FROM THE TERMINAL EVENT'S `requests`, which is the same list the meter
 * beside this reads — so one terminal event feeds both, and a turn the guard
 * stopped is measured exactly like a turn that finished. The LAST record, never
 * their sum: each request in a turn replays everything the one before it carried.
 *
 * NEVER THROWS, and writes nothing for a turn that measured nothing — see
 * {@link writeTurnSpend}, which this sits beside in the same `finally` and follows
 * in every respect.
 */
async function writeOccupancy(
  deps: HostDeps,
  meta: Record<string, unknown> | undefined,
  sessionId: string,
): Promise<void> {
  if (!deps.occupancy) return
  try {
    const requests = Array.isArray(meta?.requests) ? (meta.requests as unknown[]) : []
    const measured = lastOccupancy(deps.lib as Untyped, requests)
    if (measured > 0) await deps.occupancy.write(sessionId, measured)
  } catch {
    // Deliberately swallowed, in a `finally`, for {@link writeTurnSpend}'s reason.
  }
}

/**
 * The junction record kind that closes a turn.
 *
 * A LITERAL, matched rather than restated — the same liberty {@link TOOL_ACTIVITY}
 * and {@link DONE} already take with upstream's vocabulary, and for the same
 * reason: it is a string on the wire either way, `/core` does not re-export it,
 * and naming it here is what stops the one comparison this file makes against
 * that vocabulary being a bare string buried mid-function.
 */
const TURN_END = 'turn_end'

/**
 * What the turn that just closed handed off, and what that cost ([[REQ-295]]).
 *
 * WHY THE JUNCTION AND NOT THE TERMINAL EVENT. The manager takes the turn's
 * attributions, clears them, and writes them onto the `turn_end` record it
 * appends from its own `finally` — so they are durable on every exit path,
 * including the worker that failed, the worker that was stopped and the turn the
 * client walked away from, which is precisely condition 7. They are NOT on
 * `doneEvent`, which carries the turn's own spend and its status. This reads the
 * place the fact actually is.
 *
 * THE LAST `turn_end` IS THIS TURN'S. It is read from the `finally` that closes
 * the stream, and returning the manager's generator runs its `finally` first —
 * so the record exists by the time this looks for it, and nothing later can have
 * been appended.
 *
 * READING THE WHOLE LOG IS THE FRAMEWORK'S OWN IDIOM here (`readFrom(0)` is what
 * the delegation surface's stop watch does, every hundred milliseconds), and this
 * runs once per turn and only where delegation is composed at all.
 *
 * A MISSING JUNCTION IS `null`, NOT A THROW. This is called from a `finally`
 * beside the meter, and a reader that took the turn down would be worse than the
 * figure it was fetching.
 */
function turnAttributions(manager: Untyped, sessionId: string): unknown[] | null {
  try {
    const [records] = manager.logFor(sessionId).readFrom(0) as [Array<Record<string, unknown>>]
    for (let at = records.length - 1; at >= 0; at -= 1) {
      if (records[at]?.kind !== TURN_END) continue
      const attributed = records[at].attributed
      return Array.isArray(attributed) ? attributed : null
    }
  } catch {
    // No junction, no attribution to read.
  }
  return null
}

/**
 * The turn of this conversation that did not finish, or `null` ([[BUG-121]]).
 *
 * THE RECONCILIATION, and it is why this is computed where the transcript is
 * already in hand. The record is advisory and the transcript is authoritative, so
 * whether the client's words survived is decided by looking for them: the last
 * user turn of what is about to be painted, against what the record kept. A match
 * means the turn's records landed and only the reply is a fragment; no match means
 * this record is the only copy of the prompt in existence.
 *
 * A LIVE TURN IS NOT AN INTERRUPTED ONE. `live` says a turn is open at the cursor
 * this fold stopped at — the panel is about to reattach to it — so reporting it
 * would be telling the operator that the reply arriving in front of them was
 * lost. That check is the only thing that keeps this quiet during an ordinary
 * reload mid-turn.
 *
 * WHAT IT CANNOT SEE, stated because it decides the one false positive left. A
 * turn being driven by ANOTHER isolate is invisible here — the junction is RAM,
 * so `live` is false and the transcript has nothing — and it is reported as
 * interrupted even though it may yet finish. The client is then shown their own
 * words back and told the turn did not survive, which is what this host can
 * honestly say from where it is standing; a shared junction is what would let it
 * say better ([[EPIC-19]] Finding 4).
 */
async function interruptedTurn(
  deps: HostDeps,
  sessionId: string,
  turns: ChatTurn[],
  live: boolean,
): Promise<InterruptedTurn | null> {
  const pending = await previousTurn(deps, sessionId)
  if (pending === null) return null
  if (live && pending.status === 'open') return null
  const asked = turns.filter((turn) => turn.role === 'user').at(-1)
  return {
    text: pending.text,
    at: pending.at,
    recorded: (asked?.markdown ?? '').trim() === pending.text.trim(),
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
  // arranged: {@link siteForSession} derives the same binding from the id and
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
  // BESIDE THE TRANSCRIPT, NEVER INSTEAD OF IT ([[BUG-121]]). A turn that did not
  // finish is reported alongside the conversation it belongs to and reconciled
  // against it — see {@link interruptedTurn}, which is also why this is read here
  // rather than by the route.
  const cut = await interruptedTurn(deps, sessionId, turns, live)
  const lost = cut ? { interrupted: cut } : {}
  try {
    await attach(manager, sessionId, CONSULTANT_ROLE, siteBackendName(slug))
  } catch (err) {
    return { sessionId, turns, cursor, live, ready: false, error: operatorMessage(err), ...lost }
  }
  return { sessionId, turns, cursor, live, ready: true, ...lost }
}

/**
 * Open the BUSINESS's conversation — the settings assistant ([[REQ-239]]).
 *
 * IT TAKES NO SUBJECT AT ALL, and that is the shape of the thing rather than an
 * omission. {@link openSession} takes a slug because a tenant holds several sites
 * and the caller is choosing one; a request has already resolved to exactly one
 * business by the time it reaches this host, so a business parameter would be a
 * value the caller could get wrong about a choice it does not have. The scope
 * arrives on `deps.settings` and the id is read from there.
 *
 * THE FAILURE SHAPE IS {@link openSession}'s, DELIBERATELY. The transcript is read
 * before the backend is touched, so a deployment with no API key costs the
 * customer an explanation rather than their history — the settings conversation
 * is the one a customer is most likely to return to weeks later, because the
 * decisions in it are the ones made once.
 *
 * A HOST WITH NO RECORD REFUSES RATHER THAN OPENING AN EMPTY ONE. The `1c` CLI
 * has no businesses at all; answering with a session that could never take a turn
 * would give a caller something to paint and nothing to say.
 */
export async function openBusinessSession(
  opts: GlobalOptions = {},
  deps: HostDeps,
): Promise<ChatSession> {
  if (!deps.settings) throw new UnknownSessionError(BUSINESS_SESSION_PREFIX)
  const businessId = deps.settings.businessId
  const sessionId = businessSessionIdFor(businessId)
  let manager: Untyped
  try {
    manager = await managerForBusiness(businessId, deps)
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
  const read = await storedTranscript(manager, sessionId)
  const turns = read?.turns ?? []
  const cursor = read?.cursor ?? 0
  const live = read?.live ?? false
  // THE SETTINGS CONVERSATION LOSES A TURN THE SAME WAY ([[BUG-121]]): the
  // customer closes the tab mid-rename, and the words they typed are on the same
  // junction in the same RAM. Reported identically, for the reason `tailSession`
  // gives — a reload during a turn is a reload during a turn whatever it was
  // about.
  const cut = await interruptedTurn(deps, sessionId, turns, live)
  const lost = cut ? { interrupted: cut } : {}
  try {
    await attach(manager, sessionId, SETTINGS_ROLE, businessBackendName(businessId))
  } catch (err) {
    return { sessionId, turns, cursor, live, ready: false, error: operatorMessage(err), ...lost }
  }
  return { sessionId, turns, cursor, live, ready: true, ...lost }
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
  /**
   * A SETTINGS TURN IS A SHORTER FUNCTION, NOT A BRANCHED ONE ([[REQ-239]]).
   *
   * Everything below this block is about a site: the change counter the signal is
   * arithmetic over, the corpus delta, the per-write {@link SITE_CHANGED} the
   * preview pane reloads on. A settings session has no site, so none of it has an
   * answer — not `0`, not `null`, but no question. Handing the stream straight
   * through is what that means, and taking the early return is what stops a
   * reader having to work out which half of a long function applies.
   */
  const business = businessForSession(sessionId, deps)
  if (business) {
    const settingsManager = await managerForBusiness(business, deps)
    await attach(settingsManager, sessionId, SETTINGS_ROLE, businessBackendName(business))
    /**
     * [[REQ-251]] — the same loop the site half runs below, over the count this
     * business's own surface keeps rather than over a store's change counter.
     *
     * READ AFTER THE MANAGER IS BUILT, because building it is what installs the
     * hook that maintains the count: read before, the first turn of a session
     * would compare against an entry that does not exist yet and report its own
     * write twice.
     *
     * PER WRITE AND NOT PER TURN, for {@link SITE_CHANGED}'s reason: a request
     * answered by a rename and then a claim moves the pane twice, as the
     * assistant works, rather than once when it stops talking.
     */
    const key = businessManagerKey(business, deps)
    // [[BUG-121]] — read BEFORE this turn's own record replaces it, so what it
    // reports is the PREVIOUS turn's fate. A surviving record means that turn
    // never closed cleanly, because a turn that completes forgets it.
    signals.set(key, { interrupted: (await previousTurn(deps, sessionId)) !== null })
    // AND BEFORE THE MODEL. This is the whole of the guarantee: the customer's
    // words are on disk before the first token exists and before any tool can
    // change their business.
    await openPending(deps, sessionId, text)
    let outcome: TurnOutcome = 'aborted'
    // [[REQ-292]] — the turn's meter, opened beside the pending record and for
    // the same reason it is: this is the point at which the turn begins costing
    // money, and `startedAt` is what makes a long turn visible as one rather
    // than as an instant at the moment it closed. The id is minted rather than
    // read because the framework's own turn id never leaves the junction.
    const spendTurn = newId('turn')
    const spendStartedAt = new Date().toISOString()
    let spendMeta: Record<string, unknown> | undefined
    let seen = businessWrites.get(key) ?? 0
    try {
      // [[REQ-296]] — REFUSED BEFORE THE PROVIDER DOES. A settings conversation
      // runs on the same adapter against the same window as the consultant's, so
      // it is held to the same ceiling by the same reading.
      const full = await overContextBudget(deps, sessionId)
      if (full > 0) {
        outcome = 'aborted'
        for (const event of budgetRefusal(deps, full)) yield event
        return
      }
      for await (const event of settingsManager.promptStream(sessionId, text)) {
        if (event.kind === DONE) {
          outcome = turnOutcome(event.meta)
          // WHAT IT COST RIDES THE SAME EVENT ([[REQ-292]]). Held rather than
          // folded here, because the fold belongs in the `finally` where the
          // turn is genuinely over.
          spendMeta = event.meta
          yield budgetNamed(deps, event)
          continue
        }
        yield withoutImageData(event)
        // ONLY AFTER TOOL ACTIVITY, which is the only thing in a turn that can
        // write — and a Map read rather than the site half's store round trip, so
        // a turn that only answers a question costs nothing at all.
        if (event.kind !== TOOL_ACTIVITY) continue
        /**
         * THE CARDS FIRST ([[REQ-260]]), and the order is deliberate: the change to
         * the client's DNS has already landed, so the notice about it belongs in
         * the conversation at the point it happened rather than after whatever the
         * pane does about it.
         *
         * ONE EVENT PER CHANGE, drained rather than counted, so six changes are six
         * cards. A turn that made none drains an empty queue and costs one Map
         * read.
         */
        const cards = businessDnsChanges.get(key)
        if (cards && cards.length > 0) {
          businessDnsChanges.set(key, [])
          for (const card of cards) {
            yield {
              kind: DNS_CHANGED,
              content: card.summary,
              meta: { change: card.id, summary: card.summary, settles_by: card.settlesBy },
            }
          }
        }
        const now = businessWrites.get(key) ?? 0
        if (now <= seen) continue
        const changes = now - seen
        seen = now
        yield { kind: BUSINESS_CHANGED, content: '', meta: { at: now, changes } }
      }
    } catch (err) {
      outcome = 'error'
      throw err
    } finally {
      // IN A `finally`, so the one exit that matters reaches it: a consumer that
      // walks away mid-turn returns the generator, which runs this and never
      // `catch`. That is the interruption this ticket is about ([[BUG-121]]).
      await closePending(deps, sessionId, outcome)
      // AND WHAT IT COST ([[REQ-292]]). A settings turn spends exactly as a site
      // turn does, so it is metered by the same call with the same shape — the
      // role is the only thing that differs, and it is a column. See the site
      // branch's own note below for what an abandoned turn can and cannot say.
      await writeTurnSpend(deps, spendMeta, {
        session: sessionId,
        turn: spendTurn,
        startedAt: spendStartedAt,
        role: SETTINGS_ROLE,
        outcome,
      })
      // AND HOW FULL IT LEFT THE CONVERSATION ([[REQ-296]]), off the same
      // terminal event and in the same block, for the same reason: this is the
      // one exit every turn reaches.
      await writeOccupancy(deps, spendMeta, sessionId)
    }
    return
  }
  const slug = await siteForSession(sessionId, deps)
  if (!slug) throw new UnknownSessionError(sessionId)
  const manager = await managerFor(slug, opts, deps)
  await attach(manager, sessionId, CONSULTANT_ROLE, siteBackendName(slug))

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
  // [[BUG-121]] — the third signal, and the only one about the CONVERSATION
  // rather than about the world. Read BEFORE this turn's own record replaces it,
  // so what it reports is the previous turn's fate: a surviving record means that
  // turn never closed cleanly, because a turn that completes forgets it.
  const interrupted = (await previousTurn(deps, sessionId)) !== null
  signals.set(key, {
    since: before === undefined ? undefined : { at: before, changes: at - before },
    delta,
    interrupted,
  })

  // BEFORE THE MODEL, AND THAT IS THE WHOLE OF THE GUARANTEE ([[BUG-121]]). An
  // in-flight turn is durable nowhere — the junction is RAM and the archive lags
  // by a whole open turn on purpose — so this is the point at which the client's
  // words stop being recoverable only from the isolate that happens to be
  // holding them. It is deliberately ahead of any tool write: what the client
  // asked for can never again be the half that is missing while the work it
  // caused survives.
  await openPending(deps, sessionId, text)
  let outcome: TurnOutcome = 'aborted'
  // [[REQ-292]] — the turn's meter. See the settings branch above: opened here
  // because this is where the turn starts costing money, and the id is minted
  // because the framework's own turn id is stamped on junction records and never
  // reaches the stream vocabulary this loop consumes.
  const spendTurn = newId('turn')
  const spendStartedAt = new Date().toISOString()
  let spendMeta: Record<string, unknown> | undefined

  // BUG-43 — the counter as it stands right now, carried down the loop below so
  // each write is compared against the one before it rather than against the
  // start of the turn. `at` itself must survive for the baseline arithmetic.
  let seen = at
  try {
    // [[REQ-296]] — REFUSED BEFORE THE PROVIDER DOES. Read after the prompt is
    // durable and before the model is called: the client's words survive a turn
    // that is refused exactly as they survive one that is interrupted, which is
    // what lets them be carried into a fresh conversation.
    const full = await overContextBudget(deps, sessionId)
    if (full > 0) {
      outcome = 'aborted'
      for (const event of budgetRefusal(deps, full)) yield event
      return
    }
    for await (const event of manager.promptStream(sessionId, text)) {
      // WHAT BECAME OF THE TURN, taken off the library's terminal event
      // ([[BUG-121]]). Seeing no terminal event at all is itself the answer —
      // `outcome` starts at `aborted` — because the consumer walking away is
      // exactly how a turn ends without one.
      if (event.kind === DONE) {
        outcome = turnOutcome(event.meta)
        // AND WHAT IT COST, OFF THE SAME EVENT ([[REQ-292]]). The adapter counts
        // every request it sends and the manager folds the turn's; both ride
        // this one terminal meta, which this host read for `status` and then
        // discarded. Held rather than folded here, because the fold belongs in
        // the `finally` where the turn is genuinely over.
        spendMeta = event.meta
        yield budgetNamed(deps, event)
        continue
      }
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
  } catch (err) {
    outcome = 'error'
    throw err
  } finally {
    // AFTER the turn, and in a `finally` so an abandoned turn does not leave the
    // baseline behind: the assistant's own writes have landed by now, so they
    // are absorbed rather than reported back to it next turn.
    baselines.set(key, await store.counter(slug))
    // AND THE TURN'S OWN VERDICT, in the same `finally` and for a sharper
    // version of the same reason ([[BUG-121]]). A consumer that walks away
    // mid-turn returns this generator, which runs this block and never reaches
    // `catch` — so this is the one place that can tell an interruption from a
    // conversation.
    await closePending(deps, sessionId, outcome)
    // AND WHAT THE TURN COST, in the same block and for the same reason
    // ([[REQ-292]]). A turn the client walked away from reaches here and nowhere
    // else, and on the Worker `ctx.waitUntil` holds the isolate open for it — so
    // a turn abandoned the instant its answer arrived is recorded like any other.
    //
    // WHAT IT CANNOT RECOVER, stated because the gap is upstream's rather than
    // this line's: a turn cut off MID-GENERATION never produces a terminal
    // event, so `spendMeta` is undefined and the requests already sent are
    // accounted for nowhere this host can reach — the adapter's own per-segment
    // ledger has them and the manager's `turn_end` does not. Nothing is written,
    // which is the honest answer rather than the convenient one: a row of zeros
    // would claim the turn was free.
    await writeTurnSpend(deps, spendMeta, {
      session: sessionId,
      turn: spendTurn,
      startedAt: spendStartedAt,
      role: CONSULTANT_ROLE,
      outcome,
      // AND WHAT IT HANDED OFF ([[REQ-295]]). Asked only where this deployment
      // composes the delegation surface at all: with the switch off there can be
      // no attribution, and a host that cannot delegate should not pay a junction
      // read per turn to be told so.
      attributed: manager.roles[BUILDER_ROLE] ? turnAttributions(manager, sessionId) : null,
    })
    // AND HOW FULL IT LEFT THE CONVERSATION ([[REQ-296]]). Off the same terminal
    // event the meter reads, in the same `finally`, and with the same rule about
    // a turn that measured nothing: the last real figure stands rather than being
    // blanked by a turn that merely failed to measure.
    await writeOccupancy(deps, spendMeta, sessionId)
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
  // THE SETTINGS CONVERSATION IS TAILED THE SAME WAY ([[REQ-239]]). A reload
  // during a turn is a reload during a turn whatever the turn was about, and the
  // projection below is over junction records, which carry no site.
  const business = businessForSession(sessionId, deps)
  const slug = business ? null : await siteForSession(sessionId, deps)
  if (!business && !slug) throw new UnknownSessionError(sessionId)
  // NO `attach`, deliberately — unlike {@link streamPrompt}. Attaching builds
  // the backend, and a backend is what a turn needs, not what a reader needs.
  // Keeping it out is what lets a deployment with no API key still rejoin a turn
  // another isolate is driving, and it is the same reason the transcript read
  // runs ahead of `attach` in {@link openSession}.
  const manager = business
    ? await managerForBusiness(business, deps)
    : await managerFor(slug as string, opts, deps)
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
  // BOTH ROLES WHERE BOTH EXIST ([[REQ-239]]). The settings role is only stood up
  // on a host that holds a business record, so reporting it unconditionally would
  // claim a conversation the `1c` CLI cannot open.
  const base = {
    roles: deps.settings ? [CONSULTANT_ROLE, SETTINGS_ROLE] : [CONSULTANT_ROLE],
    backends: [] as string[],
  }
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
  // CLEARED WITH THE MANAGERS IT COUNTS FOR ([[REQ-251]]). A count that outlived
  // the conversation would be compared against a fresh toolbox's zero on the next
  // turn and report a write that has already been seen — or, negative, none at
  // all.
  businessWrites.clear()
  // AND THE CARDS THAT HAVE NOT BEEN DELIVERED ([[REQ-260]]). A queued change
  // that outlived its conversation would be reported into the next one, putting
  // a card about somebody's domain in a turn that did not touch it.
  businessDnsChanges.clear()
}
