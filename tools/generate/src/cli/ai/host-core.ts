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
import type { SiteStore, StoredPage } from '../../store/site-store'
import { scopeOf } from '../../store/journal-model'
import { editAlternativeChoose, servedPageId, siteStructureFindings, siteStructureLine } from '../edit'
import { homePageOf, isPagePart, isServedPage } from '@1stcontact/site-schema'
import {
  COORDINATOR_ROLE,
  coordinatorRole,
  BUILDER_ROLE,
  BUILDER_TURN_MAX_BYTES,
  builderRole,
  CONSULTANT_ROLE,
  consultantRole,
  LEGACY_ROLE_NAMES,
  registerCoordinatorProviders,
  registerBudgetProvider,
  registerBuilderProviders,
  registerMemoryProviders,
  registerSettingsProviders,
  registerSiteProviders,
  SETTINGS_ROLE,
  settingsRole,
  productConfig,
  openingCue,
  continuationCue,
  stallContinuationCue,
  isStallContinuationCue,
  finishedCue,
  layoutContinuationCue,
  promiseContinuationCue,
  isPromiseContinuationCue,
  gearCount,
  talkerCue,
  spendCeilingNotice,
  reportReserveNotice,
  type TurnSignal,
  type ClientView,
  type WorkerKnowledge,
} from './roles'
import { delegationForScope, type DelegationResolver } from './delegation'
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
import {
  approvedDetails,
  builderSessionCompleted,
  lookWidthOf,
  OPENING_MESSAGE,
  owedPromises,
  pagesNotLooked,
  screenshotTaken,
  type NotLooked,
  planInstanceConfig,
  planPanel,
  planSurfaceFor,
  type LookChoice,
  type PlanDeps,
} from './plan-core'
import type { LedgerDeps } from './ledger-core'
import { libraryInstanceConfig, librarySurfaceFor } from './library-core'
import LIBRARY_DECLARATION from './library-surface.json'
import {
  COORDINATOR_BACKEND,
  EXCHANGE_FIELD,
  EventChannel,
  coordinatorBackendName,
  coordinatorSessionIdFor,
  groupNames,
  groupRoomSettings,
  guardIsStale,
  memberNames,
  readGuard,
  roleOfMember,
  roomSessionIdFor,
  roomTurn,
  siteOfRoom,
  writeGuard,
  type ExchangeGuard,
  type GroupNames,
  MEMBER_DONE,
  ROOM_POST,
  type RoomContribution,
  type RoomTurn,
} from './group-core'
import type { LibraryDeps } from './library-core'
import {
  L1_DECLARATION,
  L1_INSTANCES,
  createL1Toolbox,
  l1SurfaceSet,
  readOnlyGrant,
  type AiLibrary,
  type L1Operations,
} from './toolbox-core'
import { siteDigestSource } from './digest-core'
import {
  REPORT_SHAPE_HINT,
  REPORT_TOOL,
  draftAccount,
  reportInput,
  reportRecorded,
  reportRefused,
  reportSchema,
  reportingDelegationToolbox,
} from './account-core'
import {
  configureProjectBackends,
  PROJECT_BACKEND,
  projectBackendBudgets,
  projectBackendCeiling,
  projectBackendModel,
  projectBackendWindow,
} from './backends'
import {
  SpendMeter,
  countersOf,
  measured,
  turnSpendRecord,
  type RecordTurnSpend,
} from './spend-core'
import { newId } from '../../store/ids'
import {
  FIDELITY_DECLARATION,
  contentBlocksFrom,
  fidelityOperations,
  fidelitySurfaceFor,
  type ContentBlock,
} from './fidelity-core'
import { browserLayoutChecker, layoutLine, LAYOUT_WIDTHS } from './layout-check'
import { imageInstanceConfig, imageSurfaceFor, type ImageEditDeps } from './image-core'
import { iconMaker } from '../favicon'
import { browserMeasurer, browserPageMeasurer } from './measure-core'
import type { FidelityDeps } from './fidelity-core'
import {
  BUDGET_STOP_REASON,
  DONE,
  REPORT_RESERVE_FRACTION,
  TEXT,
  TOOL_ACTIVITY,
  TURN_END,
  budgetStopMeta,
  budgetStopNotice,
  guardTurn,
  lastOccupancy,
  overBudget,
} from './budget-core'
import {
  MAX_BUILDER_REPLACEMENTS,
  MAX_CONTINUATIONS,
  SPEND_CEILING_MICROS,
  TURN_TIMEOUT_SECONDS,
  DELEGATE_TOOL,
  delegationResult,
  endedOnBudget,
  narrateExhaustion,
  stallDeadlineMs,
} from './turn-clock-core'
import { keepClientOriented, WORKING_UNNAMED, workingText, type CadenceHooks, type WorkingNote } from './cadence-core'
import { ALREADY_SWITCHED, busyReason, type ShowDeps, type ShowPage } from './show-core'
import {
  isProgress,
  PROGRESS,
  progressEvent,
  STALLED,
  stallDetail,
  TalkerFrames,
  withProgress,
  type Beside,
  type Stall,
  type StallWatch,
} from './progress-core'
import { concurrentSupported, draftClaims, scopeSupported } from './lease-core'

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
 * journalled several. [[BUG-248]] — `meta.pages` and `meta.site` say what they
 * touched (`scopeOf`), so a preview showing another page can leave itself alone.
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
 * The site host's event kind for "the site's plan was written" ([[REQ-364]]).
 *
 * {@link SITE_CHANGED}'s SHAPE AND MOMENT, FOR THE PLAN. The plan panel above the
 * chat renders the plan ticket, and an ask the consultant adds mid-turn should
 * appear while it works rather than when it stops talking. The plan is not the
 * draft store, so the draft counter never moves for it; the equivalent is a count
 * of plan writes that completed, kept per site ({@link planWrites}).
 *
 * `meta.at` is the count of plan writes since the host was built; `meta.changes`
 * is how many landed since the previous signal.
 */
export const PLAN_CHANGED = 'plan_changed'

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
  /**
   * Messages the client sent mid-turn that no turn has taken yet ([[BUG-224]]).
   * Absent when there are none. The panel shows them as waiting rather than
   * offering them back as unsent.
   */
  waiting?: WaitingMessage[]
  /**
   * [[REQ-403]] — the conversation has nothing in it yet: the panel offers *Click
   * here to start*, which posts the consultant's introduction (`/api/ai/opening`).
   * Absent on any conversation that has ever had a turn.
   */
  opening?: boolean
  /**
   * [[REQ-416]] — a message written while the consultant works is answered by a
   * talker beside the work (lagrange-framework REQ-210), so the panel's composer
   * sends rather than interposing or queueing. Absent where it is not — the
   * settings assistant, a room.
   */
  talker?: boolean
  /**
   * [[BUG-245]] — a result of the work arrived while the client was writing and
   * has not been told yet: the panel shows a quiet "done" state, and the next
   * reply carries the news. Absent otherwise.
   */
  news?: boolean
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
 * A message the client sent while a turn was running, not yet handed to the
 * model ([[BUG-224]]).
 */
export interface WaitingMessage {
  id: string
  text: string
  at: string
}

/**
 * Where a message sent mid-turn waits for the turn to reach it ([[BUG-224]]).
 *
 * NOT THE JUNCTION. On the Worker a junction is mirrored per isolate, so a write
 * from the request carrying the message would land in an isolate that is not
 * running the turn and never be seen by the one that is. The inbox is a store
 * every isolate shares; the isolate running the turn takes from it after each
 * tool call and interposes locally, so the junction keeps its one writer.
 */
export interface ClientInbox {
  /** Keep `text` for this session; answers what was kept. */
  post(sessionId: string, text: string): Promise<WaitingMessage>
  /** Remove and return the messages named, or every message when `ids` is absent. */
  take(sessionId: string, ids?: readonly string[]): Promise<WaitingMessage[]>
  /** What is waiting, oldest first. A pure read. */
  read(sessionId: string): Promise<WaitingMessage[]>
  /**
   * [[REQ-416]] — the client pressed Stop: keep the request for the isolate
   * running the turn, for the inbox's own reason. `turnId` names a talker's reply
   * to stop; `null` stops whatever is working — during a build, the build.
   */
  stop(sessionId: string, turnId: string | null): Promise<void>
  /** [[REQ-416]] — remove and return the stop requests kept, oldest first. */
  takeStops(sessionId: string): Promise<StopRequest[]>
}

/** [[REQ-416]] — a Stop the client pressed, waiting for the turn's isolate. */
export interface StopRequest {
  turn: string | null
  at: string
}

/** An inbox in this process's memory — for a host with one process (the `1c` CLI). */
export function memoryInbox(now: () => string = () => new Date().toISOString()): ClientInbox {
  const held = new Map<string, WaitingMessage[]>()
  const stops = new Map<string, StopRequest[]>()
  return {
    async stop(sessionId, turnId) {
      stops.set(sessionId, [...(stops.get(sessionId) ?? []), { turn: turnId, at: now() }])
    },
    async takeStops(sessionId) {
      const taken = stops.get(sessionId) ?? []
      stops.delete(sessionId)
      return taken
    },
    async post(sessionId, text) {
      const message = { id: newId('msg'), text, at: now() }
      held.set(sessionId, [...(held.get(sessionId) ?? []), message])
      return message
    },
    async take(sessionId, ids) {
      const all = held.get(sessionId) ?? []
      const taken = ids ? all.filter((m) => ids.includes(m.id)) : all
      held.set(sessionId, all.filter((m) => !taken.includes(m)))
      return taken
    },
    async read(sessionId) {
      return [...(held.get(sessionId) ?? [])]
    },
  }
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
   *
   * IT MAY CARRY ONE METHOD THE PORT ITSELF DOES NOT ([[REQ-307]]):
   * `prepare(sessionId): Promise<void>`, awaited by {@link prepareJunction}
   * below at each entry point here. The port is synchronous by design — every
   * read `SessionLog` makes returns a value rather than a promise, which is what
   * lets one record layer serve a file, an isolate's RAM and a Durable Object
   * alike — so an adapter whose substrate is reached over the network has
   * nowhere inside the port to fill itself from. This is that place, and it is
   * the ONLY asynchrony the port gains. A store without the method — the file
   * junction, `memoryJunctions()` — is untouched by it.
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
   * The site's plan ([[REQ-356]]), or `null` where there is none.
   *
   * A FACTORY OVER THE SLUG like `ledger` above, and on the same condition: a
   * deployment with a ticket store keeps one plan per site, and the `1c` CLI,
   * which has none, composes no plan surface and renders no plan entry.
   */
  plan?: ((slug: string) => PlanDeps) | null

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
   * The platform reference, for a delegated worker ([[REQ-355]]), or `null`.
   *
   * THE SYSTEM KB AND NOTHING WIDER, and a seam of its own rather than a share of
   * {@link HostDeps.priming}: the consultant's corpus includes the client's own
   * knowledge base on the Worker, and a worker must not see it. Both hosts build
   * this through `roles.ts`'s `builderKnowledge`, so the surface and its priming
   * arrive together or not at all.
   *
   * ABSENT IS ORDINARY — a deployment with no built KB — and composes the worker
   * exactly as it was composed before this existed.
   */
  workerKnowledge?: WorkerKnowledge | null
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
   * What the client answered on the plan panel since this session was last told
   * ([[REQ-364]]), rendered, or `null`.
   *
   * {@link HostDeps.delta}'s SHAPE AND REASON: the cursor lives on the session's
   * own `chat` ticket, a type this file knows nothing about, and what the host
   * owns is the delivery at the turn boundary. It takes the site as well because
   * a room member's session id does not name one. Unlike the corpus delta it
   * needs no knowledge base — the plan is the site's — so a host wires it
   * wherever it keeps plans.
   */
  planAnswers?: ((sessionId: string, site: string) => Promise<string | null>) | null

  /**
   * [[BUG-245]] — the results of the consultant's work the client was not shown,
   * because they arrived while the client was writing; the next reply carries the
   * news instead. {@link openSession} keeps them off the replayed transcript, so a
   * reload shows what the client saw, and says when one has not been told yet.
   */
  absorbed?: ((sessionId: string) => Promise<{ turn_id: string; text: string; told: boolean }[]>) | null

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
   * Messages the client sent while a turn was running ([[BUG-224]]). Absent, the
   * interpose route refuses and the panel falls back to queueing in the page.
   */
  inbox?: ClientInbox | null

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
   * Every public address one of this deployment's sites can be reached at, or
   * `null` where it cannot answer ([[REQ-238]]).
   *
   * A FACTORY OVER THE SLUG, like `fidelity`, `pictures` and `ledger`
   * above it, and for the same reason: an address names a site, and
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
   * `library` and `addresses` above it, and the asymmetry is the
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

  /**
   * Whether the business in scope delegates construction ([[REQ-353]]), or absent
   * where this host has no per-business answer to read.
   *
   * NOT A FACTORY OVER THE SLUG, unlike `fidelity`, `pictures`, `ledger`,
   * `library` and `addresses`, and the asymmetry is the same one
   * `recordTurnSpend` has: whether the consultant commissions construction is a
   * fact about the BUSINESS, not about a site. A business's two sites do not get
   * two different networks, and a factory over the slug would be an argument
   * inviting exactly that.
   *
   * A RESOLVER RATHER THAN A VALUE, because `build` is where it matters. The
   * host is cached for as long as its store is, so a value read by whoever
   * assembled the deps would be the answer from the first request of the
   * isolate's life; asked HERE, it is the answer the database holds when the
   * manager is composed. See {@link DelegationResolver}.
   *
   * ABSENT IS ORDINARY AND IS THE DEFAULT, for `fidelity`'s reason: a host with
   * no per-business answer reads the bundled `delegation.json`, which is the `1c`
   * CLI's permanent state and every suite's. That is a host with no override to
   * read rather than two hosts disagreeing about one value.
   *
   * IT TAKES EFFECT ON THE BUSINESS'S NEXT SESSION AND NOT ON A TURN IN FLIGHT.
   * The delegation surface is composed when the Toolbox is built and a manager
   * holds its backend for its whole life, so a flip reaches the next manager
   * rather than the conversation somebody is in the middle of. That is the
   * semantics, and the surface that offers the switch says so in words.
   */
  delegation?: DelegationResolver | null

  /**
   * Whether the business in scope runs its builder conversation as a group chat
   * ([[REQ-357]]), asked per request. Absent — the `1c` CLI, which has no
   * businesses and no ticket store to home a room in — is off.
   */
  groupChat?: { enabled(): Promise<boolean> } | null

  /** The ticket store a room is homed in ([[REQ-357]]). Required for group chat. */
  tickets?: Untyped | null

  /**
   * What the coordinator reads beside the site ([[REQ-357]]): the corpus and the
   * ticket reader, each with the grant it travels with. Never a write surface.
   */
  coordinatorSurfaces?: Array<{ surface: Untyped; granted?: Record<string, unknown> }>
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

/** Whether each cached manager was composed for a group chat ([[REQ-357]]). */
const managerGrouped = new Map<string, boolean>()

/**
 * What a grouped manager's room wiring is ([[REQ-357]]): the live maps both
 * members' `GroupRuntime`s read, filled when the room is opened. Keyed by the
 * manager object, so a rebuilt manager carries its own.
 */
const groupWirings = new WeakMap<object, GroupWiring>()

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
 * How many plan writes each site's agents have made ([[REQ-364]]) — the count
 * {@link PLAN_CHANGED} is arithmetic over. Keyed by `managerKey`, so both members
 * of a room count into one total: the panel shows the plan, not an agent.
 */
const planWrites = new Map<string, number>()

/**
 * [[REQ-390]] — the latest slow operation each site's consultant announced, and a
 * sequence number so the turn's stream can tell a new one from one it has passed
 * on. Keyed by `managerKey`, like {@link planWrites}.
 */
const workingNotes = new Map<string, { seq: number; note: WorkingNote }>()

/**
 * [[REQ-413]] — what each site's client was doing when they sent the message
 * being answered, and whether the consultant has switched their view since.
 * Set per CLIENT MESSAGE, not per turn: a continuation or a room's later rounds
 * answer the same message, so a second switch in any of them is still a second
 * switch with nothing done in between. Keyed by `managerKey`, like
 * {@link workingNotes}, so a room's members share it.
 */
const clientShows = new Map<string, { busy: string | null; switched: boolean }>()

/**
 * [[BUG-240]] — the talker cue waiting to be opened for each site, the status
 * note of a round that went to work without replying; and the sites whose
 * current client message has already had one. ONE CUE PER CLIENT MESSAGE: a
 * continuation that goes straight back to work is the same message, already
 * answered. Keyed by `managerKey`, like {@link clientShows}.
 */
const talkerCues = new Map<string, string>()
const cuedMessages = new Set<string>()

/** [[REQ-413]] — a client message arrived: what they were doing, and no switch yet. */
function clientMessage(slug: string, deps: HostDeps, view: ClientView | null | undefined): void {
  const key = managerKey(slug, deps)
  clientShows.set(key, { busy: view?.busy ?? null, switched: false })
  cuedMessages.delete(key)
}

/**
 * [[REQ-413]] — the host's side of `show_client` for one site: the draft's pages
 * off the store, and the guard. A switch is allowed once per client message, and
 * never while they are working; the browser checks again when it arrives.
 */
function showDeps(slug: string, deps: HostDeps, grouped: boolean): ShowDeps {
  return {
    pages: async () => (await deps.store.readPages(slug)).map((p) => p.page as unknown as ShowPage),
    present: () => {
      const key = managerKey(slug, deps)
      const state = clientShows.get(key) ?? { busy: null, switched: false }
      const busy = busyReason(state.busy)
      if (busy) return { ok: false, reason: busy }
      if (state.switched) return { ok: false, reason: ALREADY_SWITCHED }
      clientShows.set(key, { ...state, switched: true })
      return { ok: true, room: grouped }
    },
  }
}

/**
 * [[REQ-409]] — what each site's current client message has spent so far, across
 * the consultant's turns and every builder they commission. Reset when the next
 * client message arrives; read by the guards, the delegation surface and the
 * continuation loop in {@link streamPrompt}.
 */
const spendMeters = new Map<string, SpendMeter>()

/** [[REQ-409]] — how many continuations each site's current message has left. */
const continuationsLeft = new Map<string, number>()

/**
 * [[REQ-409]] — whether the turn that just ran out told the client "still working",
 * so the continuation loop keeps the promise the narration made rather than
 * judging again on a meter that has moved since.
 */
const promisedContinuation = new Map<string, boolean>()

function spendMeterFor(key: string): SpendMeter {
  let meter = spendMeters.get(key)
  if (meter === undefined) {
    meter = new SpendMeter(SPEND_CEILING_MICROS)
    spendMeters.set(key, meter)
  }
  return meter
}

/**
 * [[REQ-409]] — whether a consultant turn that runs out of calls or time now is
 * continued by the host: a continuation is left and the spend ceiling is not
 * reached.
 */
function willContinue(key: string): boolean {
  return (continuationsLeft.get(key) ?? 0) > 0 && !spendMeterFor(key).over()
}

/**
 * A site's plan port that counts the writes that completed ([[REQ-364]]).
 *
 * AT THE PORT, NOT THE TOOL, so every path that writes the plan through this
 * session — every plan operation, and the ledger's decision log through its own
 * port — is one the panel hears about, and a refused write counts nothing.
 */
function countedPlan(deps: HostDeps, slug: string): PlanDeps {
  const plan = deps.plan!(slug)
  const key = managerKey(slug, deps)
  return {
    ...plan,
    write: async (change) => {
      const written = await plan.write(change)
      planWrites.set(key, (planWrites.get(key) ?? 0) + 1)
      return written
    },
  }
}

/**
 * The options every AI write on this site runs under: journalled as the
 * assistant's (REQ-131), and — where the host keeps plans — held to the contact
 * details the client has approved ([[REQ-389]]). Read at the write, not at
 * composition, so an approval recorded mid-turn counts for the very next write.
 * A host without plans has nothing an approval could be recorded in, and its
 * writes go unguarded rather than refusing every address.
 */
export function aiOptions(
  opts: GlobalOptions,
  deps: Pick<HostDeps, 'plan' | 'pictures'>,
  slug: string,
): GlobalOptions {
  // [[REQ-400]] — the tab icon is cut by the same renderer and named in the same
  // vocabulary the `image` surface uses, so a picture the assistant can look at
  // is a picture it can make the icon from. No renderer, no `icons`, and
  // `make_favicon` says so.
  const pictures = deps.pictures ? deps.pictures(slug) : null
  const icons = pictures ? { icons: iconMaker(pictures.images, pictures.renderer) } : {}
  if (!deps.plan) return { ...opts, ...icons, actor: 'ai' }
  return {
    ...opts,
    ...icons,
    actor: 'ai',
    publicDetails: async () => approvedDetails((await deps.plan!(slug).read())?.fields ?? {}),
  }
}

/**
 * What the consultant's backend reads and writes to keep the client oriented
 * ([[REQ-379]]): the panel's open count, and the milestone a completed builder
 * session is. Through {@link countedPlan}, so the panel hears about the write.
 * A host without plans has neither, and the status line goes without the count.
 */
function cadenceHooks(deps: HostDeps, slug: string): CadenceHooks {
  // [[REQ-390]] — THE STATUS NEEDS NO PLAN: it is about the turn, not the site.
  const working = (note: WorkingNote): void => {
    const key = managerKey(slug, deps)
    workingNotes.set(key, { seq: (workingNotes.get(key)?.seq ?? 0) + 1, note })
  }
  // [[BUG-240]] — kept for the turn's talker desk, which opens it on its next poll.
  const dived = (note: string): void => {
    const key = managerKey(slug, deps)
    if (cuedMessages.has(key)) return
    cuedMessages.add(key)
    talkerCues.set(key, note)
  }
  if (!deps.plan) return { working, dived }
  return {
    working,
    dived,
    openAsks: async () => {
      const plan = await deps.plan!(slug).read()
      return plan ? planPanel(plan.fields).asks.open.length : 0
    },
    builderCompleted: async () => {
      await countedPlan(deps, slug).write((plan) => builderSessionCompleted(plan, new Date().toISOString()))
    },
  }
}

// ── [[REQ-415]] — the host looks, and remembers what the consultant looked at ──

/**
 * [[REQ-415]] — record that the consultant took a picture of a page of the draft.
 *
 * KEPT ON THE PLAN, keyed by the page's id and the width class, with the change
 * counter as it stands — so a later change to that page makes the look stale by
 * arithmetic, and the publishing stages can ask whether every page has been seen
 * as it now is. A plain write, not {@link countedPlan}: the client's panel has
 * nothing to show for it.
 */
function lookRecorder(deps: HostDeps, slug: string): (page: string, width: number) => Promise<void> {
  return async (page, width) => {
    const at = lookWidthOf(width)
    if (!at || !deps.plan) return
    const id = servedPageId(await deps.store.readPages(slug), page)
    if (id === null) return
    const counter = await deps.store.counter(slug)
    await deps.plan(slug).write((plan) => screenshotTaken(plan, id, at, counter))
  }
}

/** [[REQ-415]] — the served pages that have changed since the consultant last looked at them. */
async function unlookedFor(deps: HostDeps, slug: string): Promise<NotLooked[]> {
  const plan = await deps.plan!(slug).read()
  const looked = plan?.fields.looked_at ?? {}
  const pages = (await deps.store.readPages(slug))
    .map((p) => p.page)
    .filter(isServedPage)
    .map((page) => ({ id: String(page.id), name: String(page.slug) }))
  const ats = pages.flatMap((p) => Object.values(looked[p.id] ?? {}))
  const since = ats.length ? Math.min(...ats) : await deps.store.counter(slug)
  return pagesNotLooked(looked, pages, await deps.store.changesSince(slug, since))
}

/**
 * [[REQ-415]] — the layout faults the host's last look found on each page a
 * builder wrote during the client's current message, by page id. Cleared for a
 * page when a later look finds it clean, and for every page when the next client
 * message starts. While anything is here, the consultant's reply is not the end
 * of the request: see {@link continuedTurn}.
 */
const layoutOwed = new Map<string, Map<string, string[]>>()

/** Every outstanding layout finding for one session, in the order they were found. */
function owedLayout(key: string): string[] {
  return [...(layoutOwed.get(key)?.values() ?? [])].flat()
}

/** The {@link toolSet} hook that hands a `Delegate` result to the host's look. */
function delegateLooked(look: (output: unknown) => Promise<unknown>): (name: string, output: unknown) => Promise<unknown> {
  return async (name, output) => (name === DELEGATE_TOOL ? look(output) : output)
}

/** How many of the pages one builder wrote are pictured in its result; the rest are named. */
const HOST_LOOK_PAGES = 3

/**
 * [[REQ-415]] — AFTER A BUILDER WRITES A PAGE, THE HOST LOOKS FIRST.
 *
 * The consultant signed off a price table it had only read, because a picture was
 * a thing it had to decide to ask for. So the `Delegate` result now carries one:
 * each page the builder wrote, at the width the client is viewing at (desktop if
 * none was reported), low detail — and a layout check of each at desktop and
 * phone width, as plain lines naming the section. A page with findings is not
 * done, and the result says so.
 *
 * THE BUILDER'S RESULT IS KEPT WHOLE AND FIRST, fence and all, as the first text
 * block: the provenance marking is the Toolbox's, and the host's own words follow
 * it rather than being mixed into it. The pictures are the consultant's camera,
 * so they count as looks ({@link lookRecorder}). Nothing here fails the
 * delegation: a check or a picture that cannot be had is said, and the result
 * goes back as it came when there is nothing to look at.
 */
function hostLook(deps: HostDeps, slug: string, fidelity: FidelityDeps): (output: unknown) => Promise<unknown> {
  const camera = fidelityOperations(fidelity)
  const checker = browserLayoutChecker(fidelity)
  const said = (error: unknown): string => (error instanceof Error ? error.message : String(error))
  return async (output) => {
    const account = delegationResult(output)?.result.account as
      | { changed?: { differences?: { page?: unknown }[] } }
      | undefined
    const written = [
      ...new Set((account?.changed?.differences ?? []).map((d) => d.page).filter((p): p is string => typeof p === 'string')),
    ]
    if (written.length === 0) return output
    let stored: StoredPage[]
    let siteJson: Record<string, unknown> | null
    try {
      stored = await deps.store.readPages(slug)
      siteJson = await deps.store.readSiteJson(slug)
    } catch {
      return output
    }
    const touched = written
      .map((id) => stored.find((p) => String(p.page.id) === id))
      .filter((p): p is StoredPage => p !== undefined)
    // [[REQ-422]] — a shared part is seen where it is drawn: on the home page.
    const home = homePageOf(stored)
    const pages = [
      ...touched.filter((p) => isServedPage(p.page)),
      ...(touched.some((p) => isPagePart(p.page.kind)) && home && !touched.some((p) => p.page === home)
        ? stored.filter((p) => p.page === home)
        : []),
    ]
    if (pages.length === 0 && touched.every((p) => !isPagePart(p.page.kind))) return output
    const key = managerKey(slug, deps)
    const owed = layoutOwed.get(key) ?? new Map<string, string[]>()
    layoutOwed.set(key, owed)
    const viewport = fidelity.clientView?.() ? 'client' : 'desktop'
    const lines: string[] = []
    const pictures: ContentBlock[] = []
    const pictured: string[] = []
    for (const [i, p] of pages.entries()) {
      const name = String(p.page.slug)
      const id = String(p.page.id)
      try {
        const checked = await checker(name, p.sections ?? [])
        const found = checked.map(layoutLine)
        // [[REQ-429]] a check that could not run is said, but is not the page's fault to fix.
        const faults = checked.filter((f) => f.kind !== 'check_failed').map(layoutLine)
        if (faults.length) owed.set(id, faults)
        else owed.delete(id)
        lines.push(...(found.length ? found : [`${name}: nothing wrong at any width.`]))
      } catch (error) {
        lines.push(`${name}: the check could not run (${said(error)}).`)
      }
      if (i >= HOST_LOOK_PAGES) continue
      try {
        const blocks = await camera.screenshot({ of: { kind: 'draft', page: `/${name}`, viewport }, tiles: 'all', detail: 'low' })
        pictures.push(...(blocks as ContentBlock[]))
        pictured.push(name)
      } catch (error) {
        lines.push(`No picture of ${name}: ${said(error)}.`)
      }
    }
    /*
     * [[REQ-422]] — AND HOW THE SITE'S PAGES HANG TOGETHER: every page reachable
     * from home, a way back home from every page, no placeholder left from a
     * page's creation. Across EVERY page, not only those written, because a build
     * that hid a page from the menu stranded a page it never touched. Owed under
     * its own key per page, so a later browser look at the page cannot clear it.
     */
    const structure = siteJson ? siteStructureFindings(stored, siteJson) : []
    for (const p of stored.filter((s) => isServedPage(s.page))) {
      const found = structure.filter((f) => f.page === String(p.page.id)).map(siteStructureLine)
      if (found.length) owed.set(`${String(p.page.id)}#site`, found)
      else owed.delete(`${String(p.page.id)}#site`)
      lines.push(...found)
    }
    const unpictured = pages.map((p) => String(p.page.slug)).filter((n) => !pictured.includes(n))
    const faulty = pages.some((p) => owed.has(String(p.page.id))) || structure.length > 0
    const widths = new Intl.ListFormat('en', { type: 'conjunction' }).format(LAYOUT_WIDTHS.map((w) => `${w.name} (${w.width}px)`))
    const report = [
      'The host looked at what the build you started wrote, so you did not have to ask. This is guidance for you, not words for your client.' +
        (pictured.length
          ? ` Below: ${pictured.join(', ')} at ${viewport === 'client' ? "your client's width" : 'desktop width'}, low detail.`
          : '') +
        (unpictured.length ? ` Not pictured: ${unpictured.join(', ')} — take a screenshot to see ${unpictured.length > 1 ? 'them' : 'it'}.` : ''),
      `Layout at ${widths}:`,
      ...lines.map((l) => `- ${l}`),
      faulty
        ? 'THIS BUILD IS NOT DONE: the site has layout or navigation faults. Fix every line above — brief the fix with them — and look again before you say a page is ready or in the menu.'
        : 'No layout faults at any width. Whether the page is what your client asked for is what the picture is for.',
      // [[BUG-241]] — what this is, said to the consultant in the words its client hears.
      'To your client, this is you checking the page on a computer and a phone: never name the check, or who wrote the page.',
    ].join('\n')
    return [
      { type: 'text', text: typeof output === 'string' ? output : JSON.stringify(output) },
      { type: 'text', text: report },
      ...pictures,
    ]
  }
}

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
function managerFor(
  slug: string,
  opts: GlobalOptions,
  deps: HostDeps,
  grouped = false,
): Promise<Untyped> {
  const key = managerKey(slug, deps)
  let existing = managers.get(key)
  // REBUILT WHEN THE GROUP-CHAT SWITCH HAS MOVED ([[REQ-357]]), rather than
  // cached under a second key. The backend registry is global and keyed by
  // NAME, and a resumed session reaches its backend by the name its
  // `session_start` recorded — so two managers for one site would share one
  // registration, and whichever was built last would hand the other its tools.
  // One manager per site, composed for the switch as it now stands, is the
  // arrangement where that cannot happen.
  if (existing && managerGrouped.get(key) !== grouped) existing = undefined
  if (!existing) {
    existing = build(slug, opts, deps, grouped)
    managers.set(key, existing)
    managerGrouped.set(key, grouped)
  }
  return existing
}

/** Whether the business in scope runs its builder conversation as a room ([[REQ-357]]). */
async function groupChatOn(deps: HostDeps): Promise<boolean> {
  if (!deps.groupChat || !deps.tickets) return false
  return deps.groupChat.enabled()
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
  if (name === REPORT_TOOL) {
    // [[BUG-212]] — a string read as the check it quotes, and a refusal that
    // still happens spelled out, so the one retry a worker may have left is
    // the right one. See {@link reportInput}.
    const output = await box.run(name, reportInput(input))
    return reportRefused(output) ? `${output}\n\n${REPORT_SHAPE_HINT}` : output
  }
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
/**
 * How many web searches one consultant backend may run ([[REQ-378]]) — the
 * framework's `max_uses` cap. A comp review is three or four sites found among a
 * few searches; twenty leaves room for a second round without leaving the meter
 * open. Each search is billed and recorded in `turn_spend`.
 */
export const CONSULTANT_WEB_SEARCHES = 20

/**
 * Web search, as the consultant backend's own surface ([[REQ-378]],
 * lagrange-framework REQ-206).
 *
 * THE BACKEND'S TOOLBOX AND NOT THE HOST'S. The provider runs the search, so
 * there is no handler for {@link toolSet} to wrap: what the backend needs is the
 * `web` surface in its own Toolbox, which declares the tool to the provider in
 * the provider's form, offers it only where the adapter's `capabilities` say it
 * can search, and spends each search against the cap.
 *
 * THE GRANT TRAVELS WITH THE SURFACE, for [[REQ-228]]'s reason: `web` is the
 * framework's surface, and an `instances.json` entry for it is a grant the in-repo
 * declaration validator cannot check.
 */
function webSearchFor(lib: Untyped): Record<string, unknown> {
  if (!lib.WebToolbox || !lib.webInstanceConfig) return {}
  return {
    surfaces: [new lib.WebToolbox()],
    toolConfig: lib.webInstanceConfig({ maxUses: CONSULTANT_WEB_SEARCHES }),
  }
}

function toolSet(
  lib: Untyped,
  box: Untyped,
  // [[REQ-397]] — how each call runs: as which writer of draft files. One store
  // serves every session on a site, so who is writing is a fact about the call.
  around: (<T>(run: () => Promise<T>) => Promise<T>) | null = null,
  // [[REQ-415]] — what the host adds to a call's result once it has run, outside
  // `around`: the host's own reads are nobody's writes.
  after: ((name: string, output: unknown) => Promise<unknown>) | null = null,
): Untyped[] {
  const schemas = box.schemas() as Record<
    string,
    { description: string; properties: Record<string, unknown>; required: string[] }
  >
  return Object.entries(schemas).map(
    ([name, spec]) =>
      new lib.Tool(
        name,
        spec.description,
        // [[BUG-212]] — `failed`'s entries offered with their keys, which the
        // declaration cannot yet say (lagrange-framework BUG-86).
        { properties: name === REPORT_TOOL ? reportSchema(spec.properties) : spec.properties, required: spec.required },
        async (input: Record<string, unknown>) => {
          const output = await (around ? around(() => runTool(box, name, input)) : runTool(box, name, input))
          return after ? after(name, output) : output
        },
        // [[REQ-411]] — a closure runs beside other calls exactly when the
        // operation it wraps is declared `concurrent` (lagrange-framework
        // REQ-208): today `Delegate`. Each call is its own writer in `around`.
        { concurrent: box.concurrent(name) },
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

async function build(
  slug: string,
  opts: GlobalOptions,
  deps: HostDeps,
  grouped = false,
): Promise<Untyped> {
  const lib = await ai(deps)

  // THE MODEL AND THE REPLY CEILING, AS THIS PROJECT'S DECISION (BUG-67). Ahead
  // of everything, because the backend registered below reads the configuration
  // when it is CONSTRUCTED and a manager keeps its instance for its lifetime —
  // installing after the fact would leave the first session on the framework's
  // defaults with the file saying otherwise. See `backends.ts` for why this is a
  // document rather than the constructor options that also exist.
  configureProjectBackends(lib)

  // AND WHETHER THIS DELEGATES ([[REQ-295]]), beside it and for the same reason:
  // both are start-up questions, both are documents, and both are answered before
  // anything is constructed that reads them. The call validates as well as reads —
  // a worker role bound to a backend `backends.json` does not declare, or one this
  // host cannot build, fails HERE naming the offending key rather than at the
  // first delegation, which would be a configuration mistake discovered in the
  // middle of a customer's conversation.
  //
  // AND IT IS THE BUSINESS'S ANSWER WHERE THERE IS ONE ([[REQ-353]]). The
  // resolver is asked here rather than by whoever assembled the deps, because
  // this is the one line per manager where the question is worth asking: the
  // surface below is composed exactly once per manager and held for its life, so
  // a flip is visible to the next session and to no turn in flight. A host with
  // no resolver reads the bundled document, unchanged — and a malformed stored
  // value is refused here too, naming the business as well as the key.
  const delegation = await delegationForScope([BUILDER_ROLE], deps.delegation ?? null)

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
  //
  // [[REQ-388]] — and the picture the client is looking at is the CONSULTANT'S
  // signal, read late: a `screenshot` at `viewport: "client"` is at the width
  // their builder reported with the turn in progress.
  const fidelity = deps.fidelity
    ? { ...deps.fidelity(slug), clientView: () => signals.get(managerKey(slug, deps))?.view ?? null }
    : null
  // [[REQ-415]] — THE CONSULTANT'S CAMERA RECORDS WHAT IT LOOKED AT; a builder's
  // does not, because the principal checking the work is the point.
  const consultantFidelity: FidelityDeps | null =
    fidelity && deps.plan ? { ...fidelity, looked: lookRecorder(deps, slug) } : fidelity

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
  // WHAT IT COMPOSES IS THE L1 SURFACE, THE CAMERA, THE MANUAL AND — WHERE THIS
  // DEPLOYMENT HAS THEM — THE PLATFORM REFERENCE AND THE CLIENT'S LIBRARY READ-ONLY,
  // and deliberately nothing else: no client corpus, no ledger, no catalogue
  // write, no session context. A worker is handed a bounded piece of work and
  // reports. The ledger and the catalogue are the ENGAGEMENT's, and a worker
  // writing to either would be a second author on a record that exists to say
  // what the consultant and their client settled. The client's corpus is out for
  // the reason the builder's prose gives: the worker never sees the conversation
  // — which that corpus indexes — and must not form its own view of what the
  // client wants.
  //
  // READING THE LIBRARY IS IN ([[REQ-387]]), because neither reason touches it.
  // A brief that says *use the testimonials in DOC-7 verbatim* names material
  // the client handed over, not a conversation; a worker that cannot open it puts
  // a placeholder on the page and spends its calls looking. The grant is the
  // coordinator's, derived from the declaration, so it can read and never place,
  // re-role or delete.
  //
  // THE SYSTEM KB IS IN ([[REQ-355]]), read-only, because neither reason touches
  // it — it is our reference, not the engagement's record or the client's words.
  // A worker without it guesses at what the language can express, and its guess
  // comes back as a limit in `decisions` that nobody can check against the change
  // record, because a limit changes nothing.
  const workerKnowledge = workerSettings ? (deps.workerKnowledge ?? null) : null
  const worker = workerSettings
    ? await l1SurfaceSet(
        slug,
        aiOptions(opts, deps, slug),
        {
          role: BUILDER_ROLE,
          lib: deps.lib,
          store: deps.store,
          extraOps: deps.extraOps ?? {},
          measurer: fidelity ? browserMeasurer(fidelity) : null,
          pageMeasurer: fidelity ? browserPageMeasurer(fidelity) : null,
          // [[REQ-415]] — what a browser finds wrong with a page, on its map.
          layoutChecker: fidelity ? browserLayoutChecker(fidelity) : null,
          addresses: deps.addresses ? () => deps.addresses!(slug) : null,
          extraSurfaces: [
            ...(fidelity ? [{ surface: await fidelitySurfaceFor(lib, fidelity) }] : []),
            ...(workerKnowledge ? [workerKnowledge.surface()] : []),
            // [[REQ-387]] — THE CLIENT'S LIBRARY, READ-ONLY.
            ...(await readOnlyLibrary(lib, deps, slug)),
          ],
        },
      )
    : null

  // [[REQ-397]] — ONE AGENT PER DRAFT FILE. Null where the store is not leased,
  // which leaves every write as it was. See `lease-core.ts`.
  const claims = draftClaims(deps.store, slug, delegation.leaseIdleSeconds * 1000)

  const runtime =
    worker && workerSettings
      ? new lib.DelegationRuntime({
          manager: () => manager,
          // WHICH SESSION IS CALLING, answered at the moment of the call rather
          // than captured — the same shape and the same reason the Toolbox's own
          // audit attribution takes one. This host has exactly one session per
          // site, so the answer is derived rather than tracked.
          caller: () => sessionIdFor(slug),
          // [[REQ-360]] — HOW OFTEN A BUILD SAYS IT IS STILL GOING, from the same
          // document that turned delegation on. The framework records the line on
          // the caller's open round; {@link withProgress} carries it to the client.
          progressIntervalMs: delegation.progressSeconds * 1000,
          // THE HOST'S OWN RECORD OF WHAT A DELEGATION CHANGED ([[REQ-340]]),
          // bracketed by the framework, and the containment checks that record
          // answers so the worker is never asked them ([[REQ-354]]).
          account: draftAccount(deps.store, slug),
          workers: {
            [BUILDER_ROLE]: new lib.WorkerConfig({
              backend: workerSettings.backend,
              surfaces: worker.surfaces,
              // [[REQ-397]] — THE FILES THE BUILDER DECLARED, LEASED BEFORE IT
              // OPENS. A file somebody else holds refuses the delegation as
              // `scope_held`, with no session and no spend; the release runs in
              // the framework's `finally` whatever ended the run. [[REQ-410]] — a
              // delegation naming no files is refused here too; only where the
              // installed Delegate takes a `scope`, so elsewhere nothing changes.
              ...(claims && scopeSupported(lib) ? { claim: claims.claim } : {}),
              // ONLY THE HOST KNOWS HOW TO BUILD AN ADAPTER, which is why this is
              // a callback at all. The toolbox handed over is the FRAMEWORK'S —
              // composed from the surfaces above plus its own report operation,
              // and granted from the builder role's `tools` — so the worker's
              // authority is settled before this runs and nothing here can widen
              // it.
              build: ({ toolbox, backend, session }: { toolbox: Untyped; backend: string; session: string }) => {
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
                  tools: toolSet(lib, toolbox, claims ? claims.worker(session) : null),
                }), {
                  // [[BUG-212]] — told to report while it still has the room to.
                  reserve: { fraction: REPORT_RESERVE_FRACTION, notice: reportReserveNotice },
                  // [[BUG-243]] — and once its report is recorded, its turn is over.
                  finish: reportRecorded,
                  // [[REQ-409]] — a builder's requests count against its caller's message.
                  charge: (records) => spendMeterFor(managerKey(slug, deps)).charge(backend, records),
                })
              },
            }),
          },
        })
      : null

  // -- the consultant's own grant, narrowed where it no longer writes -------
  //
  // [[REQ-343]] — CONSTRUCTION IS COMMISSIONED. With `primary_writes: false` the
  // consultant keeps every read, every measurement and every camera and holds
  // none of the write groups: its route to a change in the site is a brief to a
  // worker and nothing else. Which groups those are is DERIVED from the surface
  // declarations rather than listed — see {@link readOnlyGrant}.
  //
  // TIED TO `runtime` AND NOT TO `delegation.enabled`, and that is the whole of
  // how the rollback is kept. `runtime` is non-null exactly where the `delegate`
  // tool is composed, so reading the same value here makes "cannot write" and
  // "can commission" one condition rather than two that could disagree. Every way
  // the surface can be absent — the switch off, the switch on with no worker role
  // bound, a host that builds no worker — takes the consultant's full grant with
  // it. There is no reachable configuration in which it can neither write nor
  // delegate, and that is a property of this line rather than a check somewhere
  // that could be forgotten.
  //
  // NULL LEAVES THE DOCUMENT IN CHARGE. `l1SurfaceSet` reads `instances.json` for
  // the role when no config is passed, so the unnarrowed path is the same code it
  // has always been and `instances.json` goes on stating the maximum authority
  // this key hands back.
  const consultantGrant =
    runtime && !delegation.primaryWrites
      ? readOnlyGrant(L1_INSTANCES[CONSULTANT_ROLE] as Record<string, unknown>, [
          L1_DECLARATION,
          FIDELITY_DECLARATION,
        ])
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

  // -- the product tier and the session-memory core ([[BUG-210]]) -----------
  //
  // lagrange-framework BUG-83 deleted `registerDefaults` and the shipped product
  // tier, and composes a session-memory core around whatever product a host
  // passes, configured by its `memory:` block and refusing a host registry bound
  // under a name it owns. So the product tier is this host's own
  // (`productConfig`, `priming.json`'s `product_priming`), every entry under a
  // `memory.*` name, and the core keeps its charter — which names the chat ticket
  // — with the layers this host already provides switched off by name. Why each
  // is off is recorded with the block itself, in `priming.json`.
  //
  // EVERY ENTRY IS GATED BY ITS PROVIDER, not by a branch here: each renders
  // `null` — dropping the entry and its separator — when what it states is not
  // true of this session. The `1c` CLI has no ledger, so it is told none of it.
  //
  // THE OCCUPANCY GAUGE READS A FIGURE THAT SURVIVES A TURN ([[REQ-296]]). See
  // `roles.ts` for why `ctx.occupancyTokens` cannot be the only source here.
  registerBudgetProvider(
    providers,
    (sessionId: string) => (deps.occupancy ? deps.occupancy.read(sessionId) : Promise.resolve(0)),
    lib.DEFAULT_PROSE,
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
  // core's summary layer renders a frame plus a tail of the STORE's log; ours
  // renders the standing note plus a tail of the LEDGER, under this host's own
  // name. The core's layer is off ([[BUG-210]]), so there is exactly one seed.
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
          // THE READER IS THE ARCHIVE'S OWN, which is also what `read_work_log`
          // answers from: `''` for a session that has recorded no call.
          hasWorkLog: async (sessionId: string) => Boolean(await deps.archive.toolTranscript(sessionId)),
        }
      : null,
  )
  const product = productConfig(lib, providers)

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

  // -- the group chat's room tools ([[REQ-357]]) -----------------------------
  //
  // `undefined` WITH THE SWITCH OFF, and everything group-shaped hangs off it:
  // no room tools on the consultant, no room framing in its priming, no
  // coordinator role, no coordinator backend. Off is the builder exactly as it was.
  //
  // ONE `GroupRuntime` PER MEMBER, each naming its own speaker, over maps the
  // room fills when it is opened — held by reference, so a room created after
  // this manager is still reachable from both members' tools. The manager is
  // late-bound here for the delegation runtime's reason.
  const wiring: GroupWiring | undefined = grouped ? newGroupWiring(lib) : undefined

  const box = await createL1Toolbox(
    slug,
    aiOptions(opts, deps, slug),
    {
      // NARROWED WHERE THIS DEPLOYMENT COMMISSIONS ITS CONSTRUCTION, and `null`
      // — the document's own entry — everywhere else ([[REQ-343]]).
      config: consultantGrant,
      audit: deps.audit ?? null,
      session: sessionIdFor(slug),
      lib: deps.lib,
      store: deps.store,
      extraOps: deps.extraOps ?? {},
      // Absent where there is no browser, which is an ordinary deployment: the
      // measuring operations stay declared and granted and refuse with a
      // sentence naming the reason, rather than vanishing per deployment.
      measurer: fidelity ? browserMeasurer(fidelity) : null,
      // [[REQ-350]] — the same browser, reading a page's runs for `flow_l1`.
      pageMeasurer: fidelity ? browserPageMeasurer(fidelity) : null,
      // [[REQ-415]] — what a browser finds wrong with a page, on its map.
      layoutChecker: fidelity ? browserLayoutChecker(fidelity) : null,
      // [[REQ-238]] — WHETHER THIS SITE HAS A PUBLIC ADDRESS, bound to this
      // session's site here, so the publish
      // operation then takes no site, and cannot ask about one the conversation
      // is not about.
      addresses: deps.addresses ? () => deps.addresses!(slug) : null,
      extraSurfaces: [
        ...(deps.extraSurfaces ?? []),
        // THE ROOM'S READ AND POST TOOLS ([[REQ-357]]), where this business runs
        // a group chat. Additive: every tool the consultant already had is
        // still here, unchanged.
        ...(wiring
          ? [{ surface: new lib.GroupToolbox(wiring.consultant), granted: lib.groupInstanceConfig() }]
          : []),
        // HANDING WORK OVER ([[REQ-295]]), where this deployment delegates.
        //
        // COMPOSED BESIDE the consultant's `l1` and `fidelity` entries, and it
        // still removes nothing here: what the consultant may do to the site is
        // settled by the grant above, not by this surface's presence. The two are
        // decided from ONE value ([[REQ-343]]) — `runtime` composes `delegate` and
        // the same `runtime` narrows the grant — so "construction is commissioned"
        // and "there is something to commission with" cannot come apart. Where
        // `primary_writes: true` restores the write groups this stays exactly as it
        // was: additive, and delegating is a decision made per piece of work.
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
                // `wrote`, `activity` and `ended` beside the framework's result
                // ([[BUG-167]], [[BUG-191]]); the account itself is the runtime's
                // hook ([[REQ-354]]) — see {@link reportingDelegationToolbox}. The
                // ceiling and the round budgets are the WORKER'S, by the name its
                // adapter was built under, so `ended` names a budget stop on the
                // same line the guard drew and the size of a budget that ran out;
                // and a brief longer than the builder's turn ceiling is refused
                // rather than cut ([[BUG-208]]).
                surface: new (reportingDelegationToolbox(
                  lib,
                  projectBackendCeiling(lib as Untyped, workerSettings?.backend),
                  {
                    budgets: projectBackendBudgets(lib as Untyped, workerSettings?.backend),
                    briefMaxBytes: BUILDER_TURN_MAX_BYTES,
                    // [[REQ-409]] — a builder that runs out is replaced, while the
                    // message's spend allows.
                    replacements: MAX_BUILDER_REPLACEMENTS,
                    spendOver: () => spendMeterFor(managerKey(slug, deps)).over(),
                  },
                ))(runtime),
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
        ...(consultantFidelity ? [{ surface: await fidelitySurfaceFor(lib, consultantFidelity) }] : []),
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
        // THE SITE'S PLAN ([[REQ-356]]), where this deployment keeps one. Its
        // grant travels with it, like the ledger's, and is the CONSULTANT's: the
        // coordinator's groups are declared beside it and granted wherever that
        // role is composed.
        ...(deps.plan
          ? [
              {
                // [[REQ-391]] — WITH THE SITE WRITE `choose_look` NEEDS, bound to
                // this session's site: the plan surface holds no site, so the
                // host lends it the one call that puts a chosen look on a page.
                surface: await planSurfaceFor(lib, {
                  ...countedPlan(deps, slug),
                  // [[REQ-413]] — and the pages and guard `show_client` needs.
                  show: showDeps(slug, deps, grouped),
                  // [[REQ-415]] — and what has not been looked at since it changed:
                  // [[BUG-235]] only where a browser can record a look, or the
                  // publishing stages could never close.
                  ...(consultantFidelity ? { unlooked: () => unlookedFor(deps, slug) } : {}),
                  looks: {
                    choose: async (look: string, choice?: { contentChangesSeen?: boolean }) =>
                      (await editAlternativeChoose(slug, look, { ...opts, ...choice, actor: 'ai', store: deps.store }))
                        .data as unknown as LookChoice,
                  },
                }),
                granted: planInstanceConfig('consultant'),
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
        // [[BUG-168]] — a turn that runs out of budget says what it did. Inside
        // the guard, so the guard's own stop is not mistaken for one.
        // [[REQ-409]] — and, where the host will continue it, says so instead of
        // asking the client whether to go on.
        narrateExhaustion(
          // [[REQ-379]] — and one that goes quiet says so first.
          keepClientOriented(
            new lib.ClaudeAPIBackend({
              ...(modelClient ? { client: modelClient } : {}),
              // A Worker has no `process.env`; the key arrives from a `wrangler
              // secret` and is passed in. Spread conditionally so Node keeps reading
              // the environment and an absent key still fails at FIRST USE with the
              // library's own message rather than at construction.
              ...(deps.apiKey ? { apiKey: deps.apiKey } : {}),
              // [[REQ-397]] — the consultant's writes are implicit leases, refused
              // on a file a builder holds; and up to `max_concurrent` builders it
              // commissions in one reply run together where the framework can.
              // [[REQ-415]] — and a builder's result comes back with the host's look at it.
              tools: toolSet(
                lib,
                box,
                claims ? claims.consultant(sessionIdFor(slug)) : null,
                runtime && consultantFidelity ? delegateLooked(hostLook(deps, slug, consultantFidelity)) : null,
              ),
              ...(runtime ? { maxConcurrentTools: delegation.maxConcurrent } : {}),
              ...webSearchFor(lib),
            }),
            cadenceHooks(deps, slug),
          ),
          () => {
            const key = managerKey(slug, deps)
            const promised = willContinue(key)
            promisedContinuation.set(key, promised)
            return promised ? (workingNotes.get(key)?.note.doing ?? '') : null
          },
        ),
        {
          // [[REQ-409]] — the consultant's requests count against the message, and
          // once it has spent its ceiling she is told to finish.
          charge: (records) => spendMeterFor(managerKey(slug, deps)).charge(PROJECT_BACKEND, records),
          notice: () => (spendMeterFor(managerKey(slug, deps)).over() ? spendCeilingNotice() : ''),
        },
      ),
    // [[BUG-224]] — so what the client writes mid-turn reaches the next call.
    // [[REQ-416]] — and so a round can be forked: the client's message opens a
    // talker beside the build (lagrange-framework REQ-210); and stopped: Stop
    // building ends the round rather than only the client's view of it.
    betweenCalls(lib, { talker: true }),
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
    // [[REQ-416]] — whether the round being assembled is a talker's.
    talking: () => talking(sessionIdFor(slug)),
    // [[REQ-428]] — the replies in a row that asked and moved nothing.
    questions: () => questionRuns.get(key) ?? 0,
    // [[REQ-295]] — WHETHER THE CONSULTANT IS TOLD HOW TO HAND WORK OVER, which
    // is the same question as whether it was given the tool. With the switch off
    // the entry renders nothing, so the prompt is byte-for-byte what this host
    // sent before delegation existed.
    delegating: runtime !== null,
    // [[REQ-357]] — what the consultant is told about the room, or nothing.
    room: wiring ? String(lib.defaultGroupMemberFraming()) : null,
    // [[REQ-343]] — AND WHETHER IT IS TOLD IT HAS A CHOICE, which is the same
    // question as whether it kept its write groups. The SAME value the grant was
    // narrowed with, so the framing cannot describe a session the grant does not
    // match: prose weighing handing work over against doing it itself, read by a
    // session that holds no write group, is prose about a tool it has not got.
    writing: consultantGrant === null,
    // [[REQ-397]] — WHETHER IT IS TAUGHT FILES AND SCOPES, and how many builders
    // may overlap. Files only where a builder's scope is actually enforced: the
    // installed Delegate takes one and this store is leased. Overlap only where
    // the installed framework runs Delegate calls together — declared AND, since
    // the host hands Delegate over as a closure, registered (REQ-411); otherwise
    // it is told builders run one at a time, whatever `max_concurrent` says.
    files: runtime !== null && claims !== null && scopeSupported(lib),
    parallel:
      runtime !== null && claims !== null && scopeSupported(lib) && concurrentSupported(lib)
        ? delegation.maxConcurrent
        : 1,
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
    // [[REQ-356]] — THE PLAN ARRIVES WITH THE TURN, read late like the digest,
    // because the plan changes under a conversation: the client answers, a task
    // finishes, another session records a decision.
    plan: deps.plan ? () => deps.plan!(slug).read() : null,
    // [[BUG-230]] — so the plan entry can say the site has no address yet.
    addresses: deps.addresses ? () => deps.addresses!(slug) : null,
    // [[REQ-415]] — and which pages have not been looked at since they changed;
    // [[BUG-235]] with no browser, that they cannot be looked at.
    unlooked: deps.plan && fidelity ? () => unlookedFor(deps, slug) : null,
    cannotLook: Boolean(deps.plan) && !fidelity,
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
    const builderBox = new lib.Toolbox(
      [...worker.surfaces, new lib.DelegationToolbox(runtime, { workerSession: '' })],
      {
        ...worker.granted,
        [lib.DELEGATION_SURFACE]: {
          groups: [lib.REPORT_GROUP],
          scope: { [lib.DELEGATION_ROLE_AXIS]: [] },
        },
      },
      { role: BUILDER_ROLE },
    )
    registerBuilderProviders(providers, { box: builderBox })
    // THE MAP AND THE MECHANISM WITH THE SURFACE, OR NEITHER ([[REQ-355]]). Bound
    // to the worker's OWN box, so the mechanism projects the tools a worker has
    // rather than the consultant's.
    if (workerKnowledge) await workerKnowledge.priming(builderBox, providers)
    named[BUILDER_ROLE] = builderRole(lib, providers, worker.granted, Boolean(workerKnowledge))
  }

  // AND THE COORDINATOR, where this business runs a group chat ([[REQ-357]]).
  if (wiring) {
    named[COORDINATOR_ROLE] = await composeCoordinator(lib, slug, opts, deps, wiring, providers, fidelity)
  }

  const witness = { at: Date.now() }
  manager = new lib.SessionManager(named, deps.archive, {
    // [[BUG-249]] — WITNESSED, so a delegated worker's progress on its own junction
    // keeps the consultant's turn alive and a wedged one does not.
    ...(deps.junctions ? { junctions: witnessed(deps.junctions, witness) } : { logDir: deps.logDir }),
    // BOTH HALVES, EXPLICITLY (DOC-22 §10). The manager defaults the registry and
    // the product tier *together*, because a product mapping names providers and
    // a registry without them could not load it — so a host passing only one is
    // taken to mean it, and the other is left empty. This host passes both: the
    // registry it bound every one of its own names in, and its own product tier
    // loaded against it, the memory core configured in it ([[BUG-210]]).
    providers,
    product,
    // NO `summary` OPTION, and the omission is deliberate ([[REQ-283]]). The
    // manager's one use for it is the `/compact` hint, which only a
    // compaction-capable backend ever asks for and this host's does not — so a
    // shim over the standing note would be a reader with no caller. The note is
    // delivered where it is actually read: in the seed, every turn.
    maxPrimingChars: MAX_PRIMING_CHARS,
  })
  progressWitness.set(manager, witness)
  if (wiring) {
    wiring.consultant.manager = manager
    wiring.coordinator.manager = manager
    groupWirings.set(manager, wiring)
  }
  // ASSIGNED AND THEN RETURNED, rather than returned directly ([[REQ-295]]). The
  // delegation runtime above holds `() => manager`, so this assignment is what
  // closes the cycle; returning the expression would leave the holder null for
  // the life of the manager and every delegation refusing for want of one.
  return manager
}

/** A grouped manager's room wiring ([[REQ-357]]) — see {@link groupWirings}. */
interface GroupWiring {
  /** room chat ticket -> room session id, filled when the room is opened. */
  rooms: Record<string, string>
  /** room chat ticket -> (member ticket -> display name). */
  names: Record<string, Record<string, string>>
  /** Each member's `GroupRuntime`; its `speaker` is set to the member's ticket on open. */
  consultant: Untyped
  coordinator: Untyped
}

function newGroupWiring(lib: Untyped): GroupWiring {
  const rooms: Record<string, string> = {}
  const names: Record<string, Record<string, string>> = {}
  // NO `sessionId`, so a successful post does not end the member's round
  // (lagrange-framework REQ-197 is out of this ticket's scope): the round ends
  // when the member's turn does, through the turn path every round takes.
  const runtime = () => new lib.GroupRuntime({ manager: null, rooms, names })
  return { rooms, names, consultant: runtime(), coordinator: runtime() }
}

/**
 * The client's Library under a READ-ONLY grant, or nothing where this host keeps
 * no Library — for every role that may look at the catalogue but not change it:
 * the coordinator ([[REQ-364]]) and the delegated builder ([[REQ-387]]).
 *
 * THE GRANT IS DERIVED, NOT LISTED ({@link readOnlyGrant}), so a write group
 * added to the declaration later is withheld from both with no edit here. A FRESH
 * surface per call, never the consultant's instance: a Toolbox binds each surface
 * to the grant it was built with.
 */
async function readOnlyLibrary(
  lib: Untyped,
  deps: HostDeps,
  slug: string,
): Promise<{ surface: Untyped; granted: Record<string, unknown> }[]> {
  if (!deps.library) return []
  return [
    {
      surface: await librarySurfaceFor(lib, deps.library(slug)),
      granted: readOnlyGrant(libraryInstanceConfig(), [LIBRARY_DECLARATION]),
    },
  ]
}

/**
 * The coordinator: its read-only box, its backend and its role ([[REQ-357]]).
 *
 * READ ACCESS TO WHAT THE CONSULTANT CAN SEE, AND NOTHING THAT WRITES. The L1
 * read groups (`instances.json`'s `coordinator` entry), the corpus and the ticket
 * reader (`deps.coordinatorSurfaces`), the Library's read group, and the room. No
 * camera, no image surface, no delegation, no ledger writes. The decisions the
 * consultant recorded reach it through the product tier's seed, which reads the
 * engagement's ledger for every role on this manager.
 *
 * NO ACCESS CONTROL BETWEEN THE TWO, deliberately (operator decision,
 * 2026-10-01): the ticket reader reaches the consultant's own transcript like any
 * other ticket.
 *
 * ITS OWN SURFACE INSTANCES, never the consultant's: a Toolbox binds each surface
 * to the grant it was built with ({@link l1SurfaceSet}).
 */
async function composeCoordinator(
  lib: Untyped,
  slug: string,
  opts: GlobalOptions,
  deps: HostDeps,
  wiring: GroupWiring,
  providers: Untyped,
  fidelity: FidelityDeps | null,
): Promise<Untyped> {
  const { surfaces, granted } = await l1SurfaceSet(
    slug,
    aiOptions(opts, deps, slug),
    {
      role: COORDINATOR_ROLE,
      lib: deps.lib,
      store: deps.store,
      extraOps: deps.extraOps ?? {},
      measurer: fidelity ? browserMeasurer(fidelity) : null,
      pageMeasurer: fidelity ? browserPageMeasurer(fidelity) : null,
      // [[REQ-415]] — what a browser finds wrong with a page, on its map.
      layoutChecker: fidelity ? browserLayoutChecker(fidelity) : null,
      addresses: deps.addresses ? () => deps.addresses!(slug) : null,
      extraSurfaces: [
        ...(deps.coordinatorSurfaces ?? []),
        // THE SITE'S PLAN, WITH THE COORDINATOR'S GROUPS ([[REQ-364]]). REQ-356
        // declared them and left the grant to the coordinator's runtime; the
        // room is that runtime. The asks are kept by whichever member is
        // maintaining the panel, so the room changes who keeps it, not how.
        ...(deps.plan
          ? [
              {
                surface: await planSurfaceFor(lib, countedPlan(deps, slug), 'coordinator'),
                granted: planInstanceConfig('coordinator'),
              },
            ]
          : []),
        ...(await readOnlyLibrary(lib, deps, slug)),
        { surface: new lib.GroupToolbox(wiring.coordinator), granted: lib.groupInstanceConfig() },
      ],
    },
  )
  const box = new lib.Toolbox(surfaces, granted, {
    audit: deps.audit ?? null,
    session: coordinatorSessionIdFor(slug),
    role: COORDINATOR_ROLE,
  })
  // GUARDED AND NARRATED like the consultant's, so every member round is held to
  // its own window and says why it stopped. Constructed under its OWN
  // `backends.json` name, which is what decides the model and the ceiling.
  lib.registerBackend(coordinatorBackendName(slug), () =>
    guardTurn(
      lib,
      narrateExhaustion(
        new lib.ClaudeAPIBackend({
          ...(modelClient ? { client: modelClient } : {}),
          ...(deps.apiKey ? { apiKey: deps.apiKey } : {}),
          name: COORDINATOR_BACKEND,
          tools: toolSet(lib, box),
        }),
      ),
    ),
  )
  registerCoordinatorProviders(providers, {
    box,
    // [[REQ-364]] — the coordinator's own signal, kept under its own key by
    // `siteTurn`, so it is told the client's answers on its own cursor.
    signal: () => signals.get(`${managerKey(slug, deps)}\0${COORDINATOR_ROLE}`),
  })
  return coordinatorRole(lib, providers)
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
        // [[BUG-168]] — narrated like the consultant's, for the same reason.
        narrateExhaustion(
          new lib.ClaudeAPIBackend({
            ...(modelClient ? { client: modelClient } : {}),
            ...(deps.apiKey ? { apiKey: deps.apiKey } : {}),
            tools: toolSet(lib, box),
          }),
        ),
      ),
    // [[BUG-224]] — as the consultant's.
    betweenCalls(lib),
  )

  const providers = new lib.PrimingProviders()
  // NO PRODUCT ENTRIES, AND THE SAME MEMORY BLOCK ([[REQ-296]], [[BUG-210]]). The
  // consultant's tier would tell a settings session its turns are addressable by
  // id, which is true of the consultant, which has the `agent` surface, and not of
  // this one — so this manager's product is the `memory` block alone, with the
  // core's transcript layer off. Its occupancy gauge is named by its own reminder
  // tier, under this host's name.
  registerBudgetProvider(
    providers,
    (sessionId: string) => (deps.occupancy ? deps.occupancy.read(sessionId) : Promise.resolve(0)),
    lib.DEFAULT_PROSE,
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

  const witness = { at: Date.now() }
  const settingsManager = new lib.SessionManager({ [SETTINGS_ROLE]: settingsRole(lib, providers) }, deps.archive, {
    // [[BUG-249]] — see the site manager's.
    ...(deps.junctions ? { junctions: witnessed(deps.junctions, witness) } : { logDir: deps.logDir }),
    providers,
    product: productConfig(lib, providers, false),
    maxPrimingChars: MAX_PRIMING_CHARS,
  })
  progressWitness.set(settingsManager, witness)
  return settingsManager
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
  /** [[BUG-245]] — results the client was not shown, cut from the replay. */
  absorbed: { turn_id: string; text: string }[] = [],
): Promise<{ turns: ChatTurn[]; cursor: number; live: boolean; started: boolean } | null> {
  let read: { session: Untyped; cursor: number; live: boolean }
  try {
    read = await manager.transcript(sessionId)
  } catch (err) {
    if ((await manager.archive.list()).includes(sessionId)) throw err
    return null
  }
  const recorded = withoutAbsorbed(read.session.turns as { role: string; content: string; ts?: string; turn_id?: string }[], absorbed)
  // [[REQ-403]] — THE OPENING'S CUE IS NOT THE CLIENT'S, so it is not shown as
  // theirs. It still counts as the conversation having started.
  const opening = openingCue()
  // [[REQ-409]] — nor is the host's cue for a continuation. [[BUG-245]] — nor its
  // cue for a finished comp board or [[REQ-424]] focus task.
  const cues = new Set([opening, continuationCue(), finishedCue()])
  // [[BUG-249]] — nor its cue for a round it carried on after a stall. [[REQ-428]] —
  // nor for one it carried on because a promise was owed.
  const hidden = (turn: { role: string; content: string }): boolean =>
    turn.role === 'user' && (cues.has(turn.content) || isStallContinuationCue(turn.content) || isPromiseContinuationCue(turn.content))
  const turns = recorded.filter((turn) => !hidden(turn)).map(
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
  return { turns, cursor: read.cursor, live: read.live === true, started: recorded.length > 0 }
}

/**
 * [[BUG-245]] — THE TRANSCRIPT AS THE CLIENT SAW IT: each result the client was not
 * shown is cut from the end of the consultant's turn that carried it (by its turn
 * id where the record has one, else the latest turn ending with it), and a turn
 * left with nothing is dropped. A result not found is left where it is: showing
 * it twice is the lesser fault than losing words the client did see.
 */
export function withoutAbsorbed<T extends { role: string; content: string; turn_id?: string }>(
  turns: T[],
  absorbed: { turn_id: string; text: string }[],
): T[] {
  if (absorbed.length === 0) return turns
  const out = turns.map((t) => ({ ...t }))
  const gone = new Set<number>()
  for (const entry of absorbed) {
    const text = entry.text.trim()
    if (text === '') continue
    const ends = (t: T): boolean => typeof t.content === 'string' && t.content.trimEnd().endsWith(text)
    let at = -1
    for (let i = out.length - 1; i >= 0; i--) {
      if (gone.has(i) || out[i].role !== 'assistant' || !ends(out[i])) continue
      if (entry.turn_id !== '' && out[i].turn_id && out[i].turn_id !== entry.turn_id) continue
      at = i
      break
    }
    if (at === -1) continue
    const kept = out[at].content.trimEnd().slice(0, -text.length).trimEnd()
    if (kept === '') gone.add(at)
    else out[at].content = kept
  }
  return out.filter((_, i) => !gone.has(i))
}

/**
 * [[REQ-403]] — open a conversation with the consultant's stock introduction, and
 * answer the turn the client sees; `null` when this conversation cannot have one:
 * it is not a site's own conversation, or it has already had a turn, or one is
 * running.
 *
 * NO MODEL CALL AND NO SPEND. Both turns are POSTED — recorded complete, as a room
 * records a contribution — so nothing opens the turn ledger and nothing is billed.
 *
 * TWO TURNS, NOT ONE, because the history window the model is sent starts at a
 * user turn: an assistant turn with nothing before it would be dropped, and the
 * consultant would never see her own introduction. The cue is that user turn, and
 * {@link storedTranscript} keeps it off the client's screen.
 *
 * ONCE, BY THE TRANSCRIPT. The posted turns are the record that it happened, so a
 * reload finds the conversation started and the panel offers no button.
 */
export async function openConversation(
  sessionId: string,
  opts: GlobalOptions = {},
  deps: HostDeps,
): Promise<ChatTurn | null> {
  const slug = await siteForSession(sessionId, deps)
  if (!slug || (await groupChatOn(deps))) return null
  await prepareJunction(deps, sessionId)
  const manager = await managerFor(slug, opts, deps)
  const read = await storedTranscript(manager, sessionId)
  if (read?.started || read?.live) return null
  if ((await previousTurn(deps, sessionId)) !== null) return null
  await attach(manager, sessionId, CONSULTANT_ROLE, siteBackendName(slug))
  await manager.postTurn(sessionId, openingCue(), { role: 'user' })
  await manager.postTurn(sessionId, OPENING_MESSAGE, { role: 'assistant' })
  const after = await storedTranscript(manager, sessionId)
  return after?.turns.at(-1) ?? { role: 'assistant', markdown: OPENING_MESSAGE }
}

/**
 * Attach the site's session to a live backend segment, creating it if new.
 *
 * Awaited throughout since the archive port went async: `resume` reads the
 * archive when no junction exists, and `createSession` records its home ref. The
 * shape of the decision is unchanged.
 */
/**
 * Let the junction store fill itself for this session, if it needs to ([[REQ-307]]).
 *
 * WHY IT IS CALLED AT EVERY ENTRY POINT AND NOT AT MANAGER CONSTRUCTION. A
 * manager is built once per site per process and then reused, so a hook there
 * would fill the store once and never notice the object moving on. In a Worker
 * that is not hypothetical: two requests for one session need not land in the
 * same isolate, and an isolate that has been idle holds a mirror as old as the
 * last turn it drove. Asking per entry point costs one round trip for a delta
 * that is usually empty, and removes a whole class of stale-mirror question.
 *
 * NEVER THROWS, because a store that could not be reached is a DURABILITY
 * failure and not a conversational one: the session still opens, still replays
 * and still takes a turn, exactly as it did when the junction was RAM. The
 * adapter reports the failure where it happened and degrades itself; this is
 * only the seam.
 */
async function prepareJunction(deps: HostDeps, sessionId: string): Promise<void> {
  await deps.junctions?.prepare?.(sessionId)
  await repairWatermark(deps, sessionId)
}

/** The NDJSON record separator — a record ends where a byte equal to this does. */
const NEWLINE_BYTE = 0x0a

/**
 * Whether `mark` is somewhere the archive could have stopped: the start, the
 * end, or just past a record's newline ([[BUG-229]]).
 *
 * Every watermark the archive writes is one of those, because it is the end
 * offset of the last record it folded. One that is none of them was not written
 * against these bytes.
 */
function atRecordBoundary(log: Untyped, mark: number): boolean {
  const size = Number(log.size())
  if (mark === 0 || mark === size) return true
  if (!Number.isInteger(mark) || mark < 0 || mark > size) return false
  return log.storage.read(mark - 1, 1)[0] === NEWLINE_BYTE
}

/**
 * Where the archive actually stopped: the end of the `turn_end` of the last turn
 * it holds, `0` where it holds nothing, or `null` where that cannot be told
 * ([[BUG-229]]).
 *
 * THE ARCHIVE'S OWN WORD AND NOT THE STREAM'S. A watermark too far by a whole
 * record is mid-record in the next one, and "the previous newline" would then
 * skip every turn between where the archive stopped and where the watermark
 * says it did — on the session this was found on, two whole turns. The
 * archived transcript names each turn it holds (`xgd-turn`), and that name is on
 * the junction's records, so the boundary is read off both rather than guessed
 * from either.
 */
async function archivedBoundary(deps: HostDeps, log: Untyped, sessionId: string): Promise<number | null> {
  // NOTHING ARCHIVED IS AN ANSWER: a session with no home has folded nothing.
  if (String((await deps.archive.homeRef(sessionId)) ?? '') === '') return 0
  const turns = ((await deps.archive.load(sessionId)).turns ?? []) as { turn_id?: string }[]
  const last = [...turns].reverse().find((turn) => turn.turn_id)?.turn_id
  if (!last) return null
  const [records, ends] = log.readSpans(0) as [{ kind: string; turn_id?: string }[], number[]]
  let boundary: number | null = null
  records.forEach((record, i) => {
    if (record.kind === TURN_END && record.turn_id === last) boundary = ends[i]
  })
  return boundary
}

/**
 * Put back a watermark that is not where the archive stopped ([[BUG-229]]).
 *
 * WHAT IT REPAIRS. A Durable Object once refused one oversized record and kept
 * every one after it, so the mirror and the object counted offsets differently
 * and the archive's watermark — counted in the mirror — landed 2.46 MB past
 * where the object's archived boundary was. Two turns then "saved" by reading
 * nothing (the stream was still shorter than the mark), and every turn after
 * that failed parsing half an image. The adapter can no longer produce that, but
 * a session that already carries one has to be brought back, and this is how:
 * the next entry point moves the mark to the archive's own boundary and the next
 * sync folds everything since.
 *
 * WHERE IT CANNOT TELL, IT MOVES NOTHING, and says so: a guess in either
 * direction is either a duplicate or a loss, and the turn that follows fails
 * loudly on its own rather than saving silently.
 *
 * NEVER THROWS, like {@link prepareJunction}: a repair that could cost the
 * conversation would be worse than the fault.
 */
async function repairWatermark(deps: HostDeps, sessionId: string): Promise<void> {
  if (typeof deps.junctions?.open !== 'function') return
  try {
    const log = deps.junctions.open(sessionId)
    if (!log.exists()) return
    const mark = log.watermark()
    if (atRecordBoundary(log, mark)) return
    const boundary = await archivedBoundary(deps, log, sessionId)
    if (boundary === null) {
      console.error(
        `junction ${sessionId}: watermark ${mark} is not a record boundary of this ` +
          `${log.size()}-byte stream, and the archive does not say where it stopped — left as it is`,
      )
      return
    }
    log.setWatermark(boundary)
    console.error(
      `junction ${sessionId}: watermark ${mark} is not a record boundary of this ` +
        `${log.size()}-byte stream — moved to ${boundary}, the end of the last turn the archive holds`,
    )
  } catch (err) {
    console.error(`junction ${sessionId}: watermark could not be checked — ${String(err)}`)
  }
}

/**
 * Whether the turn that just closed reached the archive ([[BUG-229]]).
 *
 * A SAVE CAN FAIL WITHOUT THROWING, and that is the failure this exists for: a
 * watermark past the end of the stream reads nothing, folds nothing and returns
 * success. So the question is asked of the result rather than of the call — a
 * `turn_end` the archive has not taken is still past the watermark after the
 * turn's own sync. A turn that was not saved is logged naming the artifacts, and
 * the caller keeps its pending record so the client is told ([[BUG-121]]).
 *
 * A NON-DURABLE ARCHIVE never advances the watermark (REQ-159), so it is not
 * asked.
 */
function reachedArchive(manager: Untyped, sessionId: string): boolean {
  if (manager.archive?.durable === false) return true
  try {
    const log = manager.logFor(sessionId)
    const mark = log.watermark()
    const [records] = atRecordBoundary(log, mark) ? log.readSpans(mark) : [[{ kind: TURN_END }]]
    if (!(records as { kind: string }[]).some((record) => record.kind === TURN_END)) return true
    console.error(
      `archive ${sessionId}: a turn closed and did not reach the chat_transcript or ` +
        `tool_transcript — watermark ${mark} of ${log.size()} bytes`,
    )
    return false
  } catch (err) {
    console.error(`archive ${sessionId}: could not tell whether the turn was saved — ${String(err)}`)
    return false
  }
}

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
 * A TURN THAT ACCOUNTED FOR NOTHING WRITES NOTHING, decided by
 * {@link turnSpendRecord} rather than here, so every host gets the rule instead
 * of every host restating it. ACCOUNTED FOR rather than MEASURED since
 * [[BUG-145]]: a turn that handed work to a worker is answerable for that
 * worker's bill whether or not its own meta ever arrived, so the attribution
 * below is a second reason for a row to exist and not merely a field on one.
 */
async function writeTurnSpend(
  deps: HostDeps,
  meta: Record<string, unknown> | undefined,
  facts: {
    session: string
    turn: string
    startedAt: string
    role: string
    /**
     * The `backends.json` name this turn's role runs on ([[REQ-362]]) —
     * {@link PROJECT_BACKEND} where omitted. Recorded, and priced, as the backend
     * that ran: the consultant's name stamped on a coordinator's row priced
     * Haiku's tokens at Opus rates.
     */
    backend?: string
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
      backend: facts.backend ?? PROJECT_BACKEND,
      model: projectBackendModel(lib, facts.backend ?? PROJECT_BACKEND),
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
 * Where this conversation's junction ends, before the turn appends anything to it
 * ([[BUG-232]]).
 *
 * THE BOUNDARY {@link closedTurn} READS FROM, so the `turn_end` it finds can only
 * be this turn's. A turn the budget refused before calling the manager, or one the
 * manager rejected before opening, appends no `turn_end` — and reading the whole
 * log would then hand back the PREVIOUS turn's, billing its spend (and its
 * attributions) a second time.
 *
 * A BYTE COUNT, NOT A READ: `size()` is the same cursor `readFrom` takes, and it
 * costs a turn that completes nothing beyond it. `-1` where there is no junction
 * to measure, which {@link closedTurn} reads as "nothing to recover".
 */
function turnCursor(manager: Untyped, sessionId: string): number {
  try {
    return Number(manager.logFor(sessionId).size()) || 0
  } catch {
    return -1
  }
}

/**
 * The `turn_end` record the manager appended for the turn that just closed, or
 * `null` ([[REQ-295]], [[BUG-232]]).
 *
 * WHY THE JUNCTION AND NOT THE TERMINAL EVENT. The manager appends `turn_end`
 * from its own `finally`, so it is durable on every exit path — the worker that
 * failed, the worker that was stopped, the turn that threw, the turn the client
 * walked away from. The terminal event is not: on a throw the manager rethrows
 * without emitting one. Two facts are read off this record for that reason:
 * `attributed`, which the manager puts here and never on `doneEvent`, and — since
 * framework BUG-73 made the tool loop report its spend before rethrowing — the
 * turn's OWN spend (`usage`, `requests`, `cost_usd`), which the manager folds
 * onto this record whichever way the turn ended.
 *
 * READ ONLY PAST `from`, the {@link turnCursor} taken before the turn began, so
 * the record found is this turn's or nothing. The last such record, because a
 * turn appends exactly one; and it exists by the time this runs, because
 * returning the manager's generator runs its `finally` first.
 *
 * A MISSING JUNCTION IS `null`, NOT A THROW. This is called from a `finally`
 * beside the meter, and a reader that took the turn down would be worse than the
 * figure it was fetching.
 */
function closedTurn(
  manager: Untyped,
  sessionId: string,
  from: number,
): Record<string, unknown> | null {
  if (from < 0) return null
  try {
    const [records] = manager.logFor(sessionId).readFrom(from) as [Array<Record<string, unknown>>]
    for (let at = records.length - 1; at >= 0; at -= 1) {
      if (records[at]?.kind === TURN_END) return records[at]
    }
  } catch {
    // No junction, nothing to recover.
  }
  return null
}

/**
 * The spend to meter this turn by: its terminal event's, else its `turn_end`'s
 * ([[BUG-232]]).
 *
 * THE TERMINAL EVENT FIRST, because it is what a completed turn already carries
 * and reading it costs nothing. The junction is read only when that event never
 * arrived or measured nothing — the turn that threw, the turn walked away from —
 * or when `delegating` asks for its attributions anyway, so one read answers both.
 *
 * WHAT `turn_end` CANNOT SAY IT STILL DOES NOT CLAIM. A turn that ended badly
 * having measured nothing closes with `spend_unknown: true` and no `usage`; that
 * folds, through {@link turnSpendRecord}, to no counters and a NULL cost — "not
 * observed", never "free".
 */
function turnSpendSource(
  manager: Untyped,
  sessionId: string,
  from: number,
  spendMeta: Record<string, unknown> | undefined,
  delegating: boolean,
): { meta: Record<string, unknown> | undefined; attributed: unknown[] | null } {
  const carried = measured(countersOf(spendMeta?.usage))
  const closed = carried && !delegating ? null : closedTurn(manager, sessionId, from)
  const attributed = delegating && Array.isArray(closed?.attributed) ? closed.attributed : null
  return { meta: carried ? spendMeta : (closed ?? spendMeta), attributed }
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
  // A GROUP CHAT OPENS ITS ROOM ([[REQ-357]]). With the switch off nothing below
  // changes; with it on, the builder's conversation is the room and the site's
  // own conversation carries on, unchanged, as the consultant's private session —
  // which is what this function returns again the moment the switch goes off.
  if (await groupChatOn(deps)) return openRoomSession(slug, opts, deps)
  const sessionId = sessionIdFor(slug)
  // BEFORE THE MANAGER, because building one opens this session's junction and
  // the store has to be holding this session's bytes by then ([[REQ-307]]).
  await prepareJunction(deps, sessionId)
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
  // [[BUG-245]] — what the client was not shown is not replayed either.
  const absorbed = deps.absorbed ? await deps.absorbed(sessionId).catch(() => []) : []
  const read = await storedTranscript(manager, sessionId, absorbed)
  const turns = read?.turns ?? []
  const cursor = read?.cursor ?? 0
  const live = read?.live ?? false
  const news = absorbed.some((e) => !e.told) ? { news: true } : {}
  // BESIDE THE TRANSCRIPT, NEVER INSTEAD OF IT ([[BUG-121]]). A turn that did not
  // finish is reported alongside the conversation it belongs to and reconciled
  // against it — see {@link interruptedTurn}, which is also why this is read here
  // rather than by the route.
  const cut = await interruptedTurn(deps, sessionId, turns, live)
  const lost = cut ? { interrupted: cut } : {}
  try {
    await attach(manager, sessionId, CONSULTANT_ROLE, siteBackendName(slug))
  } catch (err) {
    return { sessionId, turns, cursor, live, ready: false, error: operatorMessage(err), ...lost, ...news }
  }
  // [[REQ-403]] — NOTHING SAID YET, SO THE PANEL OFFERS TO START.
  const fresh = !read?.started && !live && (await previousTurn(deps, sessionId)) === null
  return {
    sessionId,
    turns,
    cursor,
    live,
    ready: true,
    ...lost,
    ...news,
    ...(await waitingFor(deps, sessionId)),
    ...(fresh ? { opening: true } : {}),
    ...((await manager.talker(sessionId)) ? { talker: true } : {}),
  }
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
  // [[REQ-307]], for {@link openSession}'s reason.
  await prepareJunction(deps, sessionId)
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
  return { sessionId, turns, cursor, live, ready: true, ...lost, ...(await waitingFor(deps, sessionId)) }
}

/**
 * The capabilities this host registers its conversation backends with
 * ([[BUG-224]]): a round can be reached between its calls, and nothing else.
 *
 * A backend registered under a host's own name declares nothing unless told, and
 * the manager only hands a round the messages interposed into it when the
 * backend declares this. Every other capability stays off — they change what
 * the manager sends, and declaring them is a separate decision from this one.
 *
 * [[REQ-416]] — THE CONSULTANT'S DECLARES TWO MORE, together: `fork`, so a message
 * written while it works opens a talker beside the work (lagrange-framework
 * REQ-210), and `interrupt`, so Stop building ends the round rather than only the
 * client's view of it.
 */
function betweenCalls(lib: Untyped, { talker = false }: { talker?: boolean } = {}): Untyped {
  const none = Object.fromEntries(Object.keys(lib.ClaudeAPIBackend.capabilities).map((k) => [k, false]))
  return Object.freeze({ ...none, injectBetweenCalls: true, ...(talker ? { fork: true, interrupt: true } : {}) })
}

/**
 * Keep a message the client sent while a turn may be running ([[BUG-224]]).
 *
 * Refused for a session this host does not know, exactly as a prompt is, and for
 * a host with no inbox — the caller then has nothing durable to hand the message
 * to, and saying so lets the panel keep it rather than believe it was taken.
 */
export async function interposeMessage(
  sessionId: string,
  text: string,
  deps: HostDeps,
): Promise<WaitingMessage> {
  if (!deps.inbox) throw new Error('this host cannot take a message while a turn is running')
  const known = businessForSession(sessionId, deps) ?? (await siteForSession(sessionId, deps))
  if (!known) throw new UnknownSessionError(sessionId)
  return deps.inbox.post(sessionId, text)
}

/** What is waiting for this session, or nothing. Never throws: it rides an open. */
async function waitingFor(deps: HostDeps, sessionId: string): Promise<{ waiting?: WaitingMessage[] }> {
  try {
    const waiting = (await deps.inbox?.read(sessionId)) ?? []
    return waiting.length > 0 ? { waiting } : {}
  } catch {
    return {}
  }
}

/**
 * Hand everything waiting to the running round ([[BUG-224]]).
 *
 * Called after each tool event, which is where a round reaches its next call:
 * the tool loop reads interpositions when it builds the next request, and this
 * generator is pulled before that happens. So a message taken here is in the
 * very next request the model sees. Never throws: a store that cannot answer
 * leaves the messages waiting, and they are taken at the next tool event or by
 * the next turn.
 */
async function deliverWaiting(manager: Untyped, sessionId: string, deps: HostDeps): Promise<void> {
  if (!deps.inbox) return
  let taken: WaitingMessage[]
  try {
    taken = await deps.inbox.take(sessionId)
  } catch {
    return
  }
  for (const message of taken) manager.interpose(sessionId, message.text)
}

/**
 * [[REQ-416]] — how often the turn's isolate looks for a message or a Stop the
 * client sent. Each look is one read of the session's chat ticket, so this is
 * slower than the junction poll it rides: a client waits at most this long for
 * the talker to start answering.
 */
export const INBOX_POLL_MS = 2_000

/** [[REQ-416]] — who wrote a `progress` record: the consultant's own words. */
const PROGRESS_MODEL = 'model'

/**
 * [[BUG-249]] — what the client reads while the host carries a stalled round on: a
 * status line, never a turn id and never an apology for machinery.
 */
export const RECOVERING_LINE = 'One moment — picking that back up…'

/** [[BUG-249]] — what the client reads when a message stalls a second time. */
export const STUCK_AGAIN_LINE = "Sorry — that didn't go through. Ask me again and I'll pick it up from here."

/**
 * [[BUG-249]] — when each manager's junctions last recorded progress, in epoch ms.
 * Written by {@link witnessed}; read by {@link stallWatch}.
 */
const progressWitness = new WeakMap<object, { at: number }>()

/**
 * [[BUG-249]] — `junctions`, with every log it opens stamping `witness` on each
 * append that is progress ({@link isProgress}).
 *
 * WHY ACROSS EVERY SESSION THE MANAGER OPENS. A delegated worker runs in its own
 * session, on its own junction, while the consultant's round sits inside one
 * `Delegate` call writing nothing — so the consultant's junction alone would call
 * a working build silent. The manager's other sessions are the only place that
 * work shows.
 */
function witnessed(junctions: Untyped, witness: { at: number }): Untyped {
  return {
    ...junctions,
    open(sessionId: string) {
      const log = junctions.open(sessionId)
      const append = log.append.bind(log)
      log.append = (kind: string, fields: Record<string, unknown> = {}) => {
        if (isProgress({ ...fields, kind })) witness.at = Date.now()
        return append(kind, fields)
      }
      return log
    },
  }
}

/**
 * [[BUG-249]] — free what a turn holds, from outside it: the session's claim, the
 * talkers' claims, the fork and the talker count. Returns how many it closed.
 *
 * WRITTEN ON THE JUNCTION, because that is where the lease is decided. A
 * `turn_end` closes a claim for every reader (`resolveClaim`, `resolveTalker`), and
 * a claim that never reached its `turn_start` is retracted the way its holder would
 * have. The wedged step's own heartbeat timer cannot be reached from here and goes
 * on beating for a claim nobody honours any more — lagrange-framework BUG-92 asks
 * for an `abandonTurn` that can stop it.
 *
 * THE STOP FIRST: a turn stuck on the model stream is unwound by it. One stuck in a
 * tool is not (the tool loop does not look while it waits — BUG-92 again), which is
 * why the records follow it rather than waiting on it.
 */
function releaseStalledTurn(manager: Untyped, sessionId: string, from: number, why: string): number {
  try {
    manager.requestStop(sessionId, null, { reason: 'stalled' })
  } catch {
    // A stop must never cost the release.
  }
  const log = manager.logFor(sessionId)
  const [records] = log.readFrom(Math.max(0, from)) as [Array<Record<string, unknown>>]
  const claimed = new Map<string, string>()
  const started = new Set<string>()
  for (const r of records) {
    const id = String(r.turn_id ?? '')
    if (id === '') continue
    if (r.kind === 'turn_claim') {
      if (r.release) claimed.delete(id)
      else claimed.set(id, String(r.producer ?? ''))
    } else if (r.kind === 'turn_start') started.add(id)
    else if (r.kind === 'turn_end') {
      claimed.delete(id)
      started.delete(id)
    }
  }
  for (const id of started) {
    log.append('turn_end', { turn_id: id, status: ABORTED_STATUS, stalled: true, reason: why })
    claimed.delete(id)
  }
  for (const [id, producer] of claimed) log.append('turn_claim', { turn_id: id, producer, release: true })
  manager._forks?.delete(sessionId)
  talkerRounds.delete(sessionId)
  return started.size + claimed.size
}

/**
 * [[BUG-249]] — the progress deadline for one round: no progress for
 * `stall_seconds` and the round is ended `stalled`, what it held freed, and the
 * stall logged as the operator's alert — at the moment it happens, naming what it
 * was waiting on, so the next incident names its own cause.
 */
function stallWatch(manager: Untyped, sessionId: string, from: number, turn: string): StallWatch {
  const witness = progressWitness.get(manager)
  return {
    ms: stallDeadlineMs(),
    ...(witness ? { progressedAt: () => witness.at } : {}),
    onStall: async (stall: Stall) => {
      const released = releaseStalledTurn(manager, sessionId, from, stallDetail(stall))
      console.error(
        JSON.stringify({
          event: 'turn_stalled',
          session: sessionId,
          turn,
          silent_s: stall.silentS,
          awaiting: stall.awaiting,
          last: stall.last,
          released,
        }),
      )
    },
  }
}

/**
 * [[BUG-249]] — the operator's last resort: free a session something still holds.
 *
 * The same release the deadline runs, over the WHOLE junction rather than one
 * round's records, so it frees whatever is open however it got that way. Returns
 * how many turns or claims it closed; `0` is an honest answer for a session that
 * was not stuck.
 */
export async function unstickSession(sessionId: string, deps: HostDeps): Promise<{ released: number }> {
  await prepareJunction(deps, sessionId)
  const business = businessForSession(sessionId, deps)
  let manager: Untyped
  if (business) manager = await managerForBusiness(business, deps)
  else {
    const slug = await siteForSession(sessionId, deps)
    if (!slug) throw new UnknownSessionError(sessionId)
    manager = await managerFor(slug, {}, deps, await groupChatOn(deps))
  }
  const released = releaseStalledTurn(manager, sessionId, 0, 'unstuck by an operator')
  console.error(JSON.stringify({ event: 'session_unstuck', session: sessionId, released }))
  await deps.junctions?.flush?.(sessionId)
  return { released }
}

/**
 * [[REQ-428]] — THE GEAR-CHANGE COUNT, per site: the talker's and the consultant's
 * replies in a row that asked the client something and moved nothing on the plan
 * or the site. The plan entry says so at {@link GEAR_CHANGE_QUESTIONS}.
 */
const questionRuns = new Map<string, number>()

/**
 * [[REQ-428]] — count one reply toward the gear change, from its own records on the
 * junction past `from`: what it said and which tools it called. `turnId` names a
 * talker's round; without it, the first round opened past `from` that was not
 * forked from another — the consultant's own. A round's records are its own, so the
 * worker's writes beside a talker are never the talker's. Never throws.
 */
function tallyReply(manager: Untyped, sessionId: string, key: string, from: number, turnId?: string): void {
  if (from < 0) return
  try {
    const [records] = manager.logFor(sessionId).readFrom(from) as [Array<Record<string, unknown>>]
    const id = turnId ?? String(records.find((r) => r?.kind === 'turn_start' && !r.fork_of)?.turn_id ?? '')
    if (!id) return
    const mine = records.filter((r) => r?.turn_id === id)
    const said = mine.filter((r) => r.kind === 'delta').map((r) => String(r.content ?? '')).join('')
    const tools = mine.filter((r) => r.kind === 'tool_issue').map((r) => String(r.name ?? ''))
    questionRuns.set(key, gearCount(questionRuns.get(key) ?? 0, said, tools))
  } catch {
    // No junction, nothing to count.
  }
}

/**
 * [[REQ-416]] — the talker rounds opening or running in this isolate, by session.
 * What the talker's reminder provider asks: a round assembled while one is, is a
 * talker's (the worker assembled its own before the fork).
 */
const talkerRounds = new Map<string, number>()

/** [[REQ-416]] — whether a talker round is opening or running for this session. */
export function talking(sessionId: string): boolean {
  return (talkerRounds.get(sessionId) ?? 0) > 0
}

/**
 * [[REQ-416]] — whether the consultant's round in this isolate can be forked
 * right now: it is running, and it is not closing.
 *
 * The framework keeps the fork in the manager that runs the worker
 * (lagrange-framework REQ-210), and `startTurn` QUEUES a message on the junction
 * when there is none — a queue this host never drains, because its turns run
 * through `promptStream`. So the message is only handed over when there is a
 * worker to open a talker beside, and otherwise stays in the inbox, where the
 * panel runs it as the next prompt.
 */
function forkable(manager: Untyped, sessionId: string): boolean {
  const fork = manager._forks?.get(sessionId)
  return fork !== undefined && !fork.closing
}

/**
 * [[REQ-416]] — what the consultant's turn does beside its stream: take the
 * client's waiting messages and answer each with a talker round, and act on the
 * Stops the client pressed. See `progress-core.ts`'s {@link withProgress}.
 *
 * A MESSAGE IS TAKEN ONLY ONCE ITS TALKER HAS OPENED. Read, handed to
 * `startTurn`, and retired from the inbox only if it went to a talker; one that
 * did not stays waiting and runs as the next prompt, as before.
 *
 * NEVER THROWS: a store that cannot answer leaves everything where it was, for
 * the next poll.
 */
function talkerDesk(manager: Untyped, sessionId: string, deps: HostDeps, since: string, key: string): Beside {
  const talkers = new TalkerFrames()
  const running: Promise<void>[] = []
  let looked = 0
  // [[BUG-249]] — a talker round of this worker round ended in error: no more are
  // opened beside it, and the client's messages go to the worker instead.
  let failed = false
  type Started = { turnId: string; queued: boolean; talker: boolean; done: Promise<void> } | null
  /**
   * [[BUG-249]] — a talker round that ERRORED leaves the client's message unanswered
   * unless the host does something: it is put back in the inbox, where the worker's
   * next tool boundary takes it (BUG-224) or the panel runs it as the next prompt,
   * and the client is told so on the status line. Logged with its cause, once per
   * worker round, because a broken talker breaks every round at once.
   */
  async function talkerFailed(closed: Record<string, unknown> | undefined, text: string): Promise<void> {
    if (closed?.status !== 'error') return
    const first = !failed
    failed = true
    if (first) {
      console.error(
        JSON.stringify({ event: 'talker_failed', session: sessionId, turn: String(closed.turn_id ?? ''), error: String(closed.error ?? '') }),
      )
      try {
        manager.progress(sessionId, TALKER_DEFERRED_LINE, { source: PROGRESS_MODEL })
      } catch {
        // A status line must never cost the message.
      }
    }
    if (text === '' || !deps.inbox) return
    try {
      await deps.inbox.post(sessionId, text)
    } catch {
      // The panel still holds the message it sent, and replays what no turn took.
    }
  }
  /** Open one talker round with `start`; whether it opened. `messageId` is what it answers, or `''`. */
  async function open(start: () => Promise<Started>, messageId: string, text = ''): Promise<boolean> {
    talkerRounds.set(sessionId, (talkerRounds.get(sessionId) ?? 0) + 1)
    const ends = () => {
      talkerRounds.set(sessionId, (talkerRounds.get(sessionId) ?? 1) - 1)
    }
    const from = turnCursor(manager, sessionId)
    const startedAt = new Date().toISOString()
    let started: Started
    try {
      started = await start()
    } catch {
      ends()
      return false
    }
    if (!started || started.queued) {
      ends()
      return false
    }
    talkers.follow(started.turnId, messageId)
    const turnId = started.turnId
    // [[REQ-416]] — AND WHAT IT COST, once it has closed: a talker round sends
    // requests of its own, on its own conversation, which the worker's row
    // does not carry.
    running.push(
      started.done
        .then(ends, ends)
        // [[REQ-428]] — a talker's reply counts toward the gear change.
        .then(() => tallyReply(manager, sessionId, key, from, turnId))
        .then(() => writeTalkerSpend(manager, sessionId, turnId, from, startedAt, deps))
        .then((closed) => talkerFailed(closed, text)),
    )
    return true
  }
  return {
    talkers,
    async tick() {
      // [[BUG-240]] — THE ROUND WENT TO WORK WITHOUT REPLYING: a talker answers
      // the rest of the client's message now, on the host's cue
      // (lagrange-framework REQ-215), not when the client writes again. Taken on
      // the first poll after the dive, not on the inbox's slower cadence.
      const note = failed ? undefined : talkerCues.get(key)
      if (note !== undefined) {
        talkerCues.delete(key)
        if (forkable(manager, sessionId)) {
          await open(() => manager.cueTalker(sessionId, talkerCue(note), { timeout: TURN_TIMEOUT_SECONDS }), '')
        }
      }
      if (!deps.inbox || Date.now() - looked < INBOX_POLL_MS) return
      looked = Date.now()
      try {
        for (const stop of await deps.inbox.takeStops(sessionId)) {
          if (stop.at >= since) manager.requestStop(sessionId, stop.turn)
        }
        for (const message of await deps.inbox.read(sessionId)) {
          if (failed || !forkable(manager, sessionId)) return
          const opened = await open(
            () => manager.startTurn(sessionId, message.text, { timeout: TURN_TIMEOUT_SECONDS }),
            message.id,
            message.text,
          )
          if (!opened) return
          await deps.inbox.take(sessionId, [message.id])
        }
      } catch {
        // Left where it was: the next poll looks again.
      }
    },
    settle: async () => {
      await Promise.all(running)
    },
    failed: () => failed,
  }
}

/** [[BUG-249]] — the status line a client reads when its talker could not answer. */
export const TALKER_DEFERRED_LINE = "I'll pick that up as soon as this part of the build is done."


/**
 * [[REQ-416]] — a talker round's spend row ([[REQ-292]]), off its own `turn_end`.
 *
 * A TALKER ROUND IS A TURN THAT COSTS MONEY, and nothing else meters it: it runs
 * on a conversation forked from the worker's, so the worker's terminal event never
 * sees its requests, and it is not driven through {@link siteTurn}'s `finally`.
 * The manager folds the round's spend onto its `turn_end` however it ended
 * ([[BUG-232]]), so that record is the source, found by the round's id past the
 * cursor taken before it opened. A round that left no `turn_end` writes the row
 * {@link writeTurnSpend} writes for a turn that measured nothing. Never throws.
 */
async function writeTalkerSpend(
  manager: Untyped,
  sessionId: string,
  turnId: string,
  from: number,
  startedAt: string,
  deps: HostDeps,
): Promise<Record<string, unknown> | undefined> {
  let closed: Record<string, unknown> | undefined
  try {
    const [records] = manager.logFor(sessionId).readFrom(Math.max(0, from)) as [Array<Record<string, unknown>>]
    closed = [...records].reverse().find((r) => r?.kind === TURN_END && r.turn_id === turnId)
  } catch {
    // No junction, nothing to recover.
  }
  await writeTurnSpend(deps, closed, {
    session: sessionId,
    turn: turnId,
    startedAt,
    role: CONSULTANT_ROLE,
    backend: PROJECT_BACKEND,
    outcome: closed ? turnOutcome(closed) : 'aborted',
  })
  // [[BUG-249]] — and the record itself, so the desk can tell a round that failed.
  return closed
}

/**
 * [[REQ-416]] — keep a Stop the client pressed for the isolate running the turn.
 * `turnId` names a talker's reply; `null` stops whatever is working.
 */
export async function stopTurn(sessionId: string, turnId: string | null, deps: HostDeps): Promise<void> {
  if (!deps.inbox) throw new Error('this host cannot take a Stop while a turn is running')
  const known = businessForSession(sessionId, deps) ?? (await siteForSession(sessionId, deps))
  if (!known) throw new UnknownSessionError(sessionId)
  await deps.inbox.stop(sessionId, turnId)
}

/**
 * Retire the waiting messages this prompt carries ([[BUG-224]]): the ones it
 * names, and any whose text it is. A message that missed every call of the turn
 * it was sent into comes back as the next prompt, and must not then be delivered
 * a second time into that prompt's own round.
 */
async function settleWaiting(
  deps: HostDeps,
  sessionId: string,
  text: string,
  named: readonly string[],
): Promise<void> {
  if (!deps.inbox) return
  try {
    const said = text.trim()
    const ids = (await deps.inbox.read(sessionId))
      .filter((m) => named.includes(m.id) || m.text.trim() === said)
      .map((m) => m.id)
    if (ids.length > 0) await deps.inbox.take(sessionId, ids)
  } catch {
    // Left waiting, it is delivered into this turn at its first tool call — a
    // repeat, which is better than a loss.
  }
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
 *
 * `turn` IS THE CALLER'S NAME FOR THIS TURN, AND IT IS OPTIONAL ([[BUG-166]]).
 * A caller that already opened a record of the turn before the stream existed —
 * `/api/ai/prompt`, whose ledger row is written before the `Response` so a dead
 * isolate is visible by that row's absence of an ending — passes the id it used.
 * The meter then writes its row under the SAME key, and the two records are two
 * records of one turn rather than two turns that happen to coincide.
 *
 * WITHOUT IT THE JOIN CANNOT EXIST, which is the bug. Both ids were minted
 * independently — one here, one in the route — so they could never be equal, and
 * the console's cost column, which looks the meter up by the ledger's id, was a
 * dash on every row from the day it shipped. A caller with no record of its own
 * (the `1c` CLI) passes nothing and one is minted, exactly as before.
 */
export async function* streamPrompt(
  sessionId: string,
  text: string,
  opts: GlobalOptions = {},
  deps: HostDeps,
  turn?: string,
  /**
   * [[REQ-388]] — the width the client is viewing the draft at, reported with
   * this prompt. Absent is ordinary: the `1c` CLI has no preview to report from.
   */
  view?: ClientView | null,
  /**
   * [[BUG-224]] — the waiting messages this prompt is the delivery of, retired
   * before the turn so they are not delivered into it a second time.
   */
  fromMessages: readonly string[] = [],
): AsyncGenerator<{ kind: string; content: string; meta?: Record<string, unknown> }> {
  await settleWaiting(deps, sessionId, text, fromMessages)
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
  // [[REQ-307]] — ahead of the branch, because both halves below drive a turn
  // and a turn's records are the whole of what this ticket makes durable.
  await prepareJunction(deps, sessionId)
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
    // than as an instant at the moment it closed. The framework's own turn id
    // never leaves the junction, so the key is the CALLER'S if it named one
    // ([[BUG-166]]) and minted here if it did not — see the header.
    const spendTurn = turn ?? newId('turn')
    const spendStartedAt = new Date().toISOString()
    let spendMeta: Record<string, unknown> | undefined
    // [[BUG-232]] — see the site branch below.
    const spendFrom = turnCursor(settingsManager, sessionId)
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
      // [[BUG-168]] — this project's clock, not the framework's 600 s default.
      // One clock for every turn this host drives, so there is one number to reason about.
      // [[BUG-249]] — AND THE PROGRESS DEADLINE. A settings turn has no talker and
      // nothing to carry on, so a stall simply ends it, freed and recorded.
      for await (const event of withProgress(
        settingsManager.promptStream(sessionId, text, { timeout: TURN_TIMEOUT_SECONDS }),
        settingsManager.logFor(sessionId),
        settingsManager.pollIntervalMs,
        null,
        stallWatch(settingsManager, sessionId, spendFrom, spendTurn),
      )) {
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
        // [[BUG-224]] — what the customer wrote meanwhile goes into the next call.
        await deliverWaiting(settingsManager, sessionId, deps)
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
      // And a complete turn that was not saved is told as one ([[BUG-229]]).
      const saved =
        outcome !== 'complete' ||
        spendMeta?.queued === true ||
        reachedArchive(settingsManager, sessionId)
      await closePending(deps, sessionId, saved ? outcome : 'error')
      // AND WHAT IT COST ([[REQ-292]]). A settings turn spends exactly as a site
      // turn does, so it is metered by the same call with the same shape — the
      // role is the only thing that differs, and it is a column. See the site
      // branch's own note below for where a turn with no terminal event is read
      // from ([[BUG-232]]). A settings turn delegates nothing.
      const source = turnSpendSource(settingsManager, sessionId, spendFrom, spendMeta, false)
      await writeTurnSpend(deps, source.meta, {
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
  if (!slug) {
    // A ROOM'S ID RUNS AN EXCHANGE ([[REQ-357]]) — only where this business runs
    // a group chat and the site is this tenant's, which is the same check
    // {@link siteForSession} makes for a conversation.
    const room = siteOfRoom(sessionId)
    if (room && (await groupChatOn(deps)) && (await deps.store.hasDraft(room))) {
      clientMessage(room, deps, view)
      yield* streamExchange(room, text, opts, deps)
      return
    }
    throw new UnknownSessionError(sessionId)
  }
  const manager = await managerFor(slug, opts, deps, await groupChatOn(deps))
  clientMessage(slug, deps, view)
  yield* continuedTurn(manager, slug, sessionId, text, deps, turn, view)
}

/**
 * [[REQ-409]] — the consultant's turn on one client message, CONTINUED BY THE
 * HOST when it runs out of calls or time with the work in progress.
 *
 * WHY. A reply that stops half-done and asks permission to go on hands the client
 * confusion instead of an outcome, to save a token bill the client is not paying.
 * So the host starts a continuation itself, with no client message, up to
 * {@link MAX_CONTINUATIONS} times per message and only while the message is under
 * its spend ceiling. The consultant still stops for a decision that is the
 * client's; that is a reply that ends normally, and nothing here continues it.
 *
 * ONE STREAM, ONE TERMINAL EVENT. Each continuation is a whole turn — its own
 * pending record, its own spend row, its own clock — but the client is holding one
 * request, so only the last turn's `done` reaches it. The narrated exhaustion
 * paragraph is what the client reads in between: "Still working on it…".
 *
 * THE CUE IS RECORDED AS A USER TURN, because the history window starts at one,
 * and kept off the client's screen like the opening cue ({@link storedTranscript}).
 */
async function* continuedTurn(
  manager: Untyped,
  slug: string,
  sessionId: string,
  text: string,
  deps: HostDeps,
  turn?: string,
  view?: ClientView | null,
): AsyncGenerator<{ kind: string; content: string; meta?: Record<string, unknown> }> {
  const key = managerKey(slug, deps)
  const meter = spendMeterFor(key)
  meter.reset()
  continuationsLeft.set(key, MAX_CONTINUATIONS)
  // [[REQ-415]] — what a builder left wrong is owed within the message it was built in.
  layoutOwed.delete(key)
  // [[BUG-235]] — A STOP PRESSED ANYWHERE IN THE REQUEST counts, from here.
  const since = new Date().toISOString()
  let prompt = text
  let turnId = turn
  // [[BUG-241]] — the end of what the client has been shown so far: a round the
  // host continued opens a new paragraph in the same live bubble.
  let said = ''
  // [[BUG-249]] — the stall this message already recovered from, if any. One.
  let stalled: Record<string, unknown> | null = null
  for (let round = 0; ; round++) {
    let done: { kind: string; content: string; meta?: Record<string, unknown> } | null = null
    let opened = round === 0
    promisedContinuation.delete(key)
    const from = turnCursor(manager, sessionId)
    for await (const event of siteTurn(
      manager, slug, sessionId, CONSULTANT_ROLE, siteBackendName(slug), prompt, deps, turnId, view, WORKING_UNNAMED, since,
    )) {
      if (event.kind === DONE) {
        done = event
        continue
      }
      if (event.kind === TEXT && event.content && !(event as Untyped).forked && !event.meta?.forked) {
        const content = opened ? event.content : `${paragraphBreak(said)}${event.content}`
        opened = true
        said = (said + content).slice(-2)
        yield content === event.content ? event : { ...event, content }
        continue
      }
      yield event
    }
    // [[BUG-249]] — A ROUND THAT STALLED IS CARRIED ON ONCE: the host freed the
    // session, and the client's message is still owed an answer. A second stall in
    // the same message is not chased — it ends the request, said gently.
    if (done?.meta?.status === STALLED) {
      const first = stalled === null
      stalled ??= (done.meta.stalled as Record<string, unknown>) ?? {}
      if (first && !(await stopPending(deps, sessionId, since))) {
        yield { kind: PROGRESS, content: RECOVERING_LINE, meta: { source: PROGRESS_MODEL, turn_id: '', elapsed_s: 0 } }
        prompt = stallContinuationCue(String(stalled.awaiting ?? 'a step'))
        turnId = turn ? `${turn}-recovered` : undefined
        continue
      }
      yield { kind: TEXT, content: `${paragraphBreak(said)}${STUCK_AGAIN_LINE}` }
      yield { ...done, meta: { ...done.meta, stalled } }
      return
    }
    // [[REQ-428]] — the consultant's reply counts toward the gear change.
    tallyReply(manager, sessionId, key, from)
    // [[BUG-235]] — A STOPPED ROUND IS NEVER CONTINUED, by any path below.
    const stopped = done === null || done.meta?.status === ABORTED_STATUS
    const again = !stopped && endedOnBudget(done!.meta) && promisedContinuation.get(key) === true
    // [[REQ-415]] — A REPLY THAT ENDS WITH LAYOUT FAULTS ON A PAGE A BUILDER WROTE
    // IS NOT THE END OF THE BUILD: the host carries it on, on REQ-409's terms —
    // the same continuations and the same spend ceiling.
    const owed = owedLayout(key)
    const ended = !stopped && !again && done!.meta?.exhausted !== true && done!.meta?.status !== 'error' && willContinue(key)
    const unfinished = ended && owed.length > 0
    // [[REQ-428]] — NOR IS A HAND-BACK THAT LEAVES A PROMISE HANGING: a task the
    // client asked for during this message, on the plan as next, neither started
    // nor explained to them. Carried on the same terms, with the cue naming it.
    const promised = ended && !unfinished ? await promisesOwed(deps, slug, since) : []
    // [[BUG-235]] — nor is one the client stopped after the round last looked.
    if ((!again && !unfinished && promised.length === 0) || (await stopPending(deps, sessionId, since))) {
      if (meter.over()) {
        // VISIBLE TO THE OPERATOR, NEVER TO THE CLIENT: the Worker's log.
        console.warn(
          `[REQ-409] spend ceiling reached: session ${sessionId}, ${meter.micros} of ${meter.ceilingMicros} micros`,
        )
      }
      // [[BUG-249]] — a request that recovered from a stall still says it stalled.
      if (done) yield stalled ? { ...done, meta: { ...done.meta, stalled } } : done
      return
    }
    continuationsLeft.set(key, (continuationsLeft.get(key) ?? 0) - 1)
    prompt = unfinished ? layoutContinuationCue(owed) : promised.length ? promiseContinuationCue(promised) : continuationCue()
    // Each turn its own spend row; the caller's ledger id keys the first.
    turnId = turn ? `${turn}-continued-${round + 1}` : undefined
  }
}

/**
 * [[REQ-428]] — the titles of the promises the client is still owed from the
 * message that began at `since`. A plan that cannot be read owes nothing.
 */
async function promisesOwed(deps: HostDeps, slug: string, since: string): Promise<string[]> {
  if (!deps.plan) return []
  try {
    const plan = await deps.plan(slug).read()
    return plan ? owedPromises(plan.fields, since).map((t) => t.title) : []
  } catch {
    return []
  }
}

/**
 * [[BUG-241]] — what goes in front of a continued round's first words so they
 * start a paragraph of their own: nothing when what the client was shown ends
 * with a blank line, one newline when it ends with one, two otherwise.
 *
 * WHY IT MATTERS. Every round of one request lands in ONE live chat bubble, which
 * concatenates them. The framework separates text blocks WITHIN a turn
 * (`BLOCK_SEPARATOR`), but a round the host continues is a new turn, so nothing
 * separated them: a closing `**` landed between a `?` and a letter (`…off?**Then`),
 * where Markdown does not read it as closing, and the client read literal
 * asterisks. The stored transcript keeps rounds as separate turns, so a reload
 * never showed it; the break is added here, above the manager, so it is the live
 * bubble's alone and the transcript is unchanged.
 */
function paragraphBreak(said: string): string {
  if (said === '' || said.endsWith('\n\n')) return ''
  return said.endsWith('\n') ? '\n' : '\n\n'
}

/** The status a turn the client stopped ends with (lagrange-framework `ABORTED`). */
const ABORTED_STATUS = 'aborted'

/**
 * [[BUG-235]] — whether the client pressed Stop building since `since`, and it is
 * still waiting: pressed after the round's last look at the inbox, so nothing has
 * acted on it. Taken, so it cannot stop the turn after this request. A Stop that
 * names a talker's reply is not a Stop of the build. Never throws: a store that
 * cannot answer is no Stop.
 */
async function stopPending(deps: HostDeps, sessionId: string, since: string): Promise<boolean> {
  if (!deps.inbox) return false
  try {
    return (await deps.inbox.takeStops(sessionId)).some((stop) => stop.turn === null && stop.at >= since)
  } catch {
    return false
  }
}

/**
 * One builder turn in one site session — the consultant's, or a room member's
 * ([[REQ-357]]).
 *
 * THE BODY {@link streamPrompt} HAS ALWAYS HAD, lifted out so a room's member
 * rounds go through it rather than around it. Every round therefore gets what a
 * consultant turn gets: the pending-turn record ([[BUG-121]]), the spend meter and
 * the turn clock, {@link SITE_CHANGED} after tool activity, the context guard and
 * the exhaustion narration.
 *
 * THE ASSISTANT'S SIGNALS ARE KEPT APART from the consultant's. The change
 * baseline and the per-turn signal are the consultant's reminders — "the site
 * moved since your last turn" — and an assistant turn absorbing them would tell
 * the consultant nothing moved.
 */
async function* siteTurn(
  manager: Untyped,
  slug: string,
  sessionId: string,
  role: string,
  backend: string,
  text: string,
  deps: HostDeps,
  turn?: string,
  view?: ClientView | null,
  // [[BUG-205]] — who the status names: no one in a one-to-one
  // conversation (DOC-66), the member by its display name in a room.
  who: string = WORKING_UNNAMED,
  // [[BUG-235]] — when the client's request began, for a continuation round: a
  // Stop pressed between rounds stops this one rather than being discarded.
  stopsSince?: string,
): AsyncGenerator<{ kind: string; content: string; meta?: Record<string, unknown> }> {
  await attach(manager, sessionId, role, backend)

  // REQ-131 — the push half of the change journal. The comparison happens here
  // because this is the only place that knows where a turn begins, and the
  // reminder is refreshed rather than re-registered because the manager
  // re-assembles the role's reminders afresh on every turn.
  // THE COUNTER COMES OFF THE STORE PORT NOW (REQ-146), not off the filesystem.
  // It was `draftCounter(ctxOf(opts), slug)` — synchronous, and reading the
  // journal file directly. `SiteStore.counter` is the same number through the
  // port REQ-142 drew, so it is one line here and the only cost is an `await`
  // the surrounding function was already able to take.
  const key =
    role === CONSULTANT_ROLE ? managerKey(slug, deps) : `${managerKey(slug, deps)}\0${role}`
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
  // [[REQ-364]] — the plan panel's answers, on the same channel and for the same
  // reason: the client answered while the agent was away, and nothing would
  // otherwise tell it. Per member session, so in a room each member hears each
  // answer once.
  const answers = deps.planAnswers ? await deps.planAnswers(sessionId, slug) : null
  // [[BUG-121]] — the third signal, and the only one about the CONVERSATION
  // rather than about the world. Read BEFORE this turn's own record replaces it,
  // so what it reports is the previous turn's fate: a surviving record means that
  // turn never closed cleanly, because a turn that completes forgets it.
  const interrupted = (await previousTurn(deps, sessionId)) !== null
  signals.set(key, {
    since: before === undefined ? undefined : { at: before, changes: at - before },
    delta,
    answers,
    interrupted,
    // [[REQ-388]] — THIS turn's report and never an earlier one's: a turn that
    // reported no width says nothing about one, rather than repeating the last.
    view: view ?? null,
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
  // because this is where the turn starts costing money, and keyed by the
  // CALLER'S id where it named one ([[BUG-166]]) because the framework's own
  // turn id is stamped on junction records and never reaches the stream
  // vocabulary this loop consumes.
  const spendTurn = turn ?? newId('turn')
  const spendStartedAt = new Date().toISOString()
  let spendMeta: Record<string, unknown> | undefined
  // [[BUG-232]] — where the junction ends before this turn, so the `turn_end`
  // read at its close can only be its own. See {@link turnCursor}.
  const spendFrom = turnCursor(manager, sessionId)

  // BUG-43 — the counter as it stands right now, carried down the loop below so
  // each write is compared against the one before it rather than against the
  // start of the turn. `at` itself must survive for the baseline arithmetic.
  let seen = at
  // [[REQ-364]] — the plan's own count, compared the same way.
  const planKey = managerKey(slug, deps)
  let planSeen = planWrites.get(planKey) ?? 0
  // [[REQ-390]] — and the working note's, so only a note this turn made is passed on.
  let workingSeen = workingNotes.get(planKey)?.seq ?? 0
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
    // [[BUG-168]] — THIS PROJECT'S CLOCK, NOT THE FRAMEWORK'S DEFAULT. Passing
    // nothing ran every turn at 600 s, and a delegating turn spends its worker's
    // whole run inside one tool call. `turn-clock.json` gives the value and why
    // the platform can hold it.
    // [[REQ-360]] — WITH THE BUILD'S HEARTBEAT PUT IN. The turn's own stream is
    // parked inside a `Delegate` call for the whole build; the framework's
    // `progress` records go to the junction, and this is what reads them back
    // onto the stream the client is actually holding. See `progress-core.ts`.
    // [[REQ-416]] — AND, IN A ONE-TO-ONE CONVERSATION, THE TALKER BESIDE IT: the
    // client's messages are taken from the inbox while the turn runs and answered
    // by a talker round in this isolate, whose reply rides this same stream.
    const talks = role === CONSULTANT_ROLE && who === WORKING_UNNAMED
    // A STOP PRESSED BEFORE THIS TURN BEGAN was for a turn that is over — and
    // [[BUG-235]] a continuation round's turn begins with the client's message.
    // [[BUG-240]] — a cue left by an earlier round is that round's, and stale.
    talkerCues.delete(planKey)
    const beside = talks ? talkerDesk(manager, sessionId, deps, stopsSince ?? new Date().toISOString(), planKey) : null
    // [[BUG-249]] — AND NO ROUND WAITS FOREVER: see {@link stallWatch}.
    const events = withProgress(
      manager.promptStream(sessionId, text, { timeout: TURN_TIMEOUT_SECONDS }),
      manager.logFor(sessionId),
      manager.pollIntervalMs,
      beside,
      stallWatch(manager, sessionId, spendFrom, spendTurn),
    )
    for await (const event of events) {
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
      // [[REQ-390]] — RIGHT BEHIND THE ANNOUNCEMENT the wrapper yielded, which is
      // the event that carried the note here. A Map read, so free on every event.
      // [[REQ-416]] — RECORDED AS THE ROUND'S STATUS, not sent as a frame of its
      // own: the junction's `progress` record is what the status widget shows
      // (the poll above puts it on this stream) and what a talker is told when the
      // client asks how it is going.
      const working = workingNotes.get(planKey)
      if (working && working.seq > workingSeen) {
        workingSeen = working.seq
        const { doing, minutes } = working.note
        manager.progress(sessionId, workingText(who, doing), { source: PROGRESS_MODEL, etaS: (minutes ?? 0) * 60 })
      }
      // [[REQ-364]] — THE PLAN, on every event and not only after the turn's own
      // tool activity: a talker's story-board note lands while the worker is
      // parked in a build ([[REQ-416]]). A Map read, so it costs nothing.
      const planned = planWrites.get(planKey) ?? 0
      if (planned > planSeen) {
        yield { kind: PLAN_CHANGED, content: '', meta: { at: planned, changes: planned - planSeen } }
        planSeen = planned
      }
      // ONLY AFTER TOOL ACTIVITY, which is the only thing in a turn that can
      // write. A turn that answers a question makes no extra read at all, and a
      // turn that writes makes one primary-key lookup per call it made.
      if (event.kind !== TOOL_ACTIVITY) continue
      // [[BUG-224]] — what the client wrote meanwhile goes into the next call,
      // where there is no talker to answer it (a room member's round).
      // [[BUG-249]] — and where the talker failed, so the message is not left unanswered.
      if (!talks || beside?.failed?.()) await deliverWaiting(manager, sessionId, deps)
      const now = await store.counter(slug)
      if (now <= seen) continue
      const changes = now - seen
      const scope = scopeOf(await store.changesSince(slug, seen))
      seen = now
      yield { kind: SITE_CHANGED, content: '', meta: { at: now, changes, ...scope } }
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
    //
    // [[BUG-229]] — A COMPLETE TURN THAT WAS NOT SAVED IS NOT COMPLETE TO THE
    // CLIENT. Its pending record is kept as an error, which is what tells them,
    // on the next load, that this reply may not have been kept.
    // A QUEUED TURN CLOSED NOTHING, so there is nothing of it to have saved.
    const saved =
      outcome !== 'complete' || spendMeta?.queued === true || reachedArchive(manager, sessionId)
    await closePending(deps, sessionId, saved ? outcome : 'error')
    // AND WHAT THE TURN COST, in the same block and for the same reason
    // ([[REQ-292]]). A turn the client walked away from reaches here and nowhere
    // else, and on the Worker `ctx.waitUntil` holds the isolate open for it — so
    // a turn abandoned the instant its answer arrived is recorded like any other.
    //
    // WHERE A TURN WITH NO TERMINAL EVENT IS READ FROM ([[BUG-232]]). A turn
    // that THROWS — the tool loop failing after requests were sent and paid for —
    // and a turn the client walked away from both reach this block without a
    // terminal event, so `spendMeta` is undefined. Their spend is not lost: the
    // tool loop reports it before rethrowing (framework BUG-73), and the manager
    // folds it onto the `turn_end` record it appends from its own `finally`. That
    // record is read here, only when the terminal event carried nothing, so a
    // completed turn costs no extra read. A `turn_end` that truly measured
    // nothing (`spend_unknown`) still writes no counters and a NULL cost: the
    // honest answer rather than the convenient one, since a zero would claim the
    // turn was free.
    //
    // AND WHAT THAT TURN HANDED OFF ([[BUG-145]]), off the same record and in
    // the same read: the manager writes `attributed` onto `turn_end` and never
    // onto the terminal event, and it is a reason for the row to exist rather
    // than a field discarded with it. Asked only where this deployment composes
    // the delegation surface at all ([[REQ-295]]): with the switch off there can
    // be no attribution, and a host that cannot delegate should not pay a
    // junction read per completed turn to be told so.
    const source = turnSpendSource(
      manager,
      sessionId,
      spendFrom,
      spendMeta,
      role === CONSULTANT_ROLE && Boolean(manager.roles[BUILDER_ROLE]),
    )
    await writeTurnSpend(deps, source.meta, {
      session: sessionId,
      turn: spendTurn,
      startedAt: spendStartedAt,
      role,
      // THE ROLE'S OWN BACKEND ([[REQ-362]]): a room's coordinator round runs on
      // `claude_coordinator`, and its row must say so.
      backend: role === COORDINATOR_ROLE ? COORDINATOR_BACKEND : PROJECT_BACKEND,
      outcome,
      attributed: source.attributed,
    })
    // AND HOW FULL IT LEFT THE CONVERSATION ([[REQ-296]]). Off the same terminal
    // event the meter reads, in the same `finally`, and with the same rule about
    // a turn that measured nothing: the last real figure stands rather than being
    // blanked by a turn that merely failed to measure.
    await writeOccupancy(deps, spendMeta, sessionId)
  }
}

// -- the group chat ([[REQ-357]]) ---------------------------------------------

/**
 * A builder conversation that is a room: the room's transcript, every turn
 * attributed to who said it, and the names it is drawn with.
 */
export interface RoomSession extends ChatSession {
  turns: RoomTurn[]
  group: { names: GroupNames }
}

/** An open room and both of its members, each ready to take a round. */
interface OpenRoom {
  group: Untyped
  names: GroupNames
  consultant: { ticket: string; sessionId: string }
  coordinator: { ticket: string; sessionId: string }
}

/** What a second exchange against a live room is told. */
export const EXCHANGE_BUSY =
  'This room is already in the middle of an exchange. Wait for it to finish, or stop it first.'

/** How often a running exchange looks for a stop request while a round is in flight. */
const STOP_POLL_MS = 2_000

/** Thrown out of the orchestrator's prompt function to end an exchange that was stopped. */
class ExchangeStopped extends Error {
  constructor() {
    super('the exchange was stopped')
    this.name = 'ExchangeStopped'
  }
}

/** The chat ticket homing a session, minted by draining it if it has never drained. */
async function homeTicket(manager: Untyped, deps: HostDeps, sessionId: string): Promise<string> {
  let uid = String((await deps.archive.homeRef(sessionId)) ?? '')
  if (uid === '') {
    await manager.sync(sessionId)
    uid = String((await deps.archive.homeRef(sessionId)) ?? '')
  }
  if (uid === '') throw new Error(`session '${sessionId}' has no chat ticket to join a room with.`)
  return uid
}

/**
 * Drop a room junction that no live room ticket homes ([[BUG-176]]).
 *
 * A ROOM'S SESSION ID IS FIXED PER SITE, which no other session's is: a site has
 * exactly one `room-<site>`, minted from the slug rather than at random. So a room
 * whose ticket was archived leaves a junction under the very id its successor
 * must take, and `createGroup` refuses an id that already has one — forever,
 * since nothing else would ever clear it. With no live ticket there is nothing
 * left for that junction to serve: the archive answers nothing for it, so the
 * room it held is unreachable either way.
 *
 * THE ROOM SESSION ONLY. Called with `roomSessionIdFor(slug)` and nothing else —
 * never the consultant's `site-<site>`, which is the site's whole conversation,
 * nor `coordinator-<site>`. A member session with no ticket yet is the ordinary
 * not-yet-drained state, which {@link homeTicket} finishes.
 *
 * DELETED DIRECTLY, NOT CLOSED. `closeSession` drains to the archive before it
 * deletes, and a drain with no live ticket would mint a fresh chat ticket for the
 * room — one with no roster, which `openGroup` would then find and refuse. So the
 * log is deleted first and `closeSession` is called after, when it finds nothing
 * to drain and only drops what the manager was holding for that id.
 */
async function discardOrphanRoomJunction(manager: Untyped, roomSid: string): Promise<void> {
  const log = manager.logFor(roomSid)
  if (!log.exists()) return
  log.delete()
  await manager.closeSession(roomSid)
}

/**
 * Bring a reopened room's roster to exactly `members`, in order ([[BUG-176]]).
 *
 * A MEMBER IS REPLACED, THE ROOM IS NOT. When a member session gives way to
 * another (REQ-358's `assistant` → `coordinator`), the room keeps its ticket, its
 * junction and every contribution, and only the roster moves — through the
 * framework's own `add`/`remove`, which is what they exist for. The departing
 * member's past contributions stay: a roster edit is not a retraction.
 */
async function keepRoster(group: Untyped, members: string[]): Promise<void> {
  const current: string[] = await group.members()
  if (current.length === members.length && current.every((uid, i) => uid === members[i])) return
  for (const uid of current) if (!members.includes(uid)) await group.remove(uid)
  for (const uid of members) if (!current.includes(uid)) await group.add(uid)
}

/**
 * Open a site's room, creating it the first time ([[REQ-357]]).
 *
 * THE ROOM IS THE FRAMEWORK'S. `createGroup` homes it on a chat ticket of its own
 * with the two members' chat tickets as its roster; `openGroup` reopens it.
 * The consultant's member session IS the site's existing conversation, unchanged
 * — it simply becomes private — and the coordinator's is `coordinator-<site>`.
 *
 * SURVIVES ISOLATE EVICTION BY CONSTRUCTION. Nothing here is held only in this
 * isolate: every junction the run depends on is filled from its durable object
 * first, then both member sessions are attached — so a cold isolate's
 * orchestrator finds both members live rather than recording either as skipped
 * merely because its junction was not loaded here.
 */
async function openRoom(manager: Untyped, slug: string, deps: HostDeps): Promise<OpenRoom> {
  const lib = await ai(deps)
  const wiring = groupWirings.get(manager)
  if (!wiring) throw new Error(`the conversation for '${slug}' was not composed as a group chat.`)
  const names = groupNames()
  const consultantSid = sessionIdFor(slug)
  const coordinatorSid = coordinatorSessionIdFor(slug)
  const roomSid = roomSessionIdFor(slug)
  for (const sid of [consultantSid, coordinatorSid, roomSid]) await prepareJunction(deps, sid)
  await attach(manager, consultantSid, CONSULTANT_ROLE, siteBackendName(slug))
  await attach(manager, coordinatorSid, COORDINATOR_ROLE, coordinatorBackendName(slug))
  const consultant = { ticket: await homeTicket(manager, deps, consultantSid), sessionId: consultantSid }
  const coordinator = { ticket: await homeTicket(manager, deps, coordinatorSid), sessionId: coordinatorSid }
  const labels = memberNames(consultant.ticket, coordinator.ticket, names)
  const existing = String((await deps.archive.homeRef(roomSid)) ?? '')
  if (!existing) await discardOrphanRoomJunction(manager, roomSid)
  const settings = groupRoomSettings()
  const group = existing
    ? await lib.openGroup(manager, deps.tickets, existing, labels)
    : await lib.createGroup(manager, deps.tickets, {
        members: [consultant.ticket, coordinator.ticket],
        sessionId: roomSid,
        title: `Group chat: ${slug}`,
        names: labels,
        maxAutoTurns: settings.maxAutoTurns,
        maxContributions: settings.maxContributions,
        endRoundOnPost: false,
      })
  if (existing) await keepRoster(group, [consultant.ticket, coordinator.ticket])
  await group.revive()
  // THE MEMBERS' TOOLS REACH THE ROOM THROUGH THESE, filled now that it exists.
  wiring.rooms[group.chatUid] = roomSid
  wiring.names[group.chatUid] = labels
  wiring.consultant.speaker = consultant.ticket
  wiring.coordinator.speaker = coordinator.ticket
  return { group, names, consultant, coordinator }
}

/**
 * Open the builder conversation as a room ([[REQ-357]]) — what {@link openSession}
 * answers while the business's switch is on.
 *
 * THE ROOM'S TRANSCRIPT, ATTRIBUTED, and the same reading on every reload: the
 * contributions come off the room's own record, each carrying who said it. Never
 * `live` — an exchange is streamed by the request that runs it, and a page that
 * reloads mid-exchange is drawn from the record as it stands.
 */
async function openRoomSession(
  slug: string,
  opts: GlobalOptions,
  deps: HostDeps,
): Promise<RoomSession> {
  const names = groupNames()
  const sessionId = roomSessionIdFor(slug)
  const empty = { sessionId, turns: [], cursor: 0, live: false, group: { names } }
  let room: OpenRoom
  try {
    room = await openRoom(await managerFor(slug, opts, deps, true), slug, deps)
  } catch (err) {
    return { ...empty, ready: false, error: operatorMessage(err) }
  }
  const { contributions, cursor } = room.group.history(0) as {
    contributions: RoomContribution[]
    cursor: number
  }
  return {
    ...empty,
    turns: contributions.map((c) => roomTurn(c, names)),
    cursor,
    ready: true,
  }
}

async function roomTicket(deps: HostDeps, uid: string): Promise<Untyped> {
  const record = await deps.tickets.get({ uid })
  return record?.ticket ?? record
}

function isConflict(error: unknown): boolean {
  const text = `${(error as { code?: string })?.code ?? ''} ${(error as Error)?.message ?? ''}`
  return /conflict|version|stale|expected_version/i.test(text)
}

/**
 * Rewrite the room's exchange guard by compare-and-set, re-reading on a lost race.
 * `change` returns the next value, or `undefined` to write nothing.
 */
async function updateGuard(
  deps: HostDeps,
  uid: string,
  change: (held: ExchangeGuard | null) => ExchangeGuard | '' | undefined,
): Promise<boolean> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ticket = await roomTicket(deps, uid)
    const next = change(readGuard(ticket?.fields?.[EXCHANGE_FIELD]))
    if (next === undefined) return false
    try {
      await deps.tickets.update({
        uid,
        patch: { fields: { [EXCHANGE_FIELD]: next === '' ? '' : writeGuard(next) } },
        expected_version: ticket.version,
      })
      return true
    } catch (error) {
      if (!isConflict(error)) throw error
    }
  }
  return false
}

const liveGuard = (held: ExchangeGuard | null): ExchangeGuard | null =>
  held && !guardIsStale(held, TURN_TIMEOUT_SECONDS) ? held : null

/** Claim the room for one exchange; false if one is already live. */
async function claimExchange(deps: HostDeps, uid: string): Promise<boolean> {
  const ticket = await roomTicket(deps, uid)
  if (liveGuard(readGuard(ticket?.fields?.[EXCHANGE_FIELD]))) return false
  try {
    await deps.tickets.update({
      uid,
      patch: {
        fields: {
          [EXCHANGE_FIELD]: writeGuard({ at: new Date().toISOString(), calling: '', stop: false }),
        },
      },
      expected_version: ticket.version,
    })
    return true
  } catch (error) {
    // LOST THE RACE: another request claimed it between the read and the write.
    if (isConflict(error)) return false
    throw error
  }
}

/**
 * Run one exchange in a site's room, inside the prompt request ([[REQ-357]]).
 *
 * The client's message is posted as the operator's contribution and the
 * framework's `Orchestrator` runs one exchange. ITS PROMPT FUNCTION IS
 * {@link siteTurn} — the consultant's own turn path — so every member round is a
 * full builder turn, and each member's events are forwarded to this stream
 * tagged with whose they are. Every post the room records is forwarded too, as a
 * `room_post` carrying its speaker, which is what the panel draws.
 *
 * ONE EXCHANGE AT A TIME, guarded by a compare-and-set field on the room ticket
 * rather than an in-memory flag, so the guard holds whichever isolate a second
 * request lands in. A stop request is honoured between rounds and, while a round
 * is in flight, by the framework's control-record stop on that member's session.
 *
 * A CLIENT THAT WALKS AWAY DOES NOT END THE EXCHANGE. The room has several
 * participants mid-conversation and the run finishes under the request's
 * `waitUntil`; the way to end one is to stop it.
 */
async function* streamExchange(
  slug: string,
  text: string,
  opts: GlobalOptions,
  deps: HostDeps,
): AsyncGenerator<{ kind: string; content: string; meta?: Record<string, unknown> }> {
  type Event = { kind: string; content: string; meta?: Record<string, unknown> }
  const lib = await ai(deps)
  const manager = await managerFor(slug, opts, deps, true)
  const room = await openRoom(manager, slug, deps)
  const { group, names } = room
  const roomUid = String(group.chatUid)

  if (!(await claimExchange(deps, roomUid))) {
    yield { kind: TEXT, content: EXCHANGE_BUSY }
    yield { kind: DONE, content: '', meta: { status: 'refused' } }
    return
  }

  const channel = new EventChannel<Event>()
  let emitted = group.cursor() as number
  const flushPosts = (): void => {
    const { contributions, cursor } = group.history(emitted) as {
      contributions: RoomContribution[]
      cursor: number
    }
    emitted = cursor
    for (const c of contributions) {
      const turn = roomTurn(c, names)
      channel.push({ kind: ROOM_POST, content: turn.markdown, meta: { ...turn } })
    }
  }
  const stopAsked = async (): Promise<boolean> =>
    (await roomTicket(deps, roomUid).then((t) => readGuard(t?.fields?.[EXCHANGE_FIELD])))?.stop === true
  let stopped = false

  const seam = async (member: { sessionId: string }, brief: Untyped): Promise<void> => {
    flushPosts()
    if (await stopAsked()) {
      stopped = true
      throw new ExchangeStopped()
    }
    // THE HEARTBEAT, and who is calling — what a stop request reads.
    await updateGuard(deps, roomUid, (held) =>
      held ? { ...held, at: new Date().toISOString(), calling: member.sessionId } : undefined,
    )
    const role = roleOfMember(member.sessionId, slug)
    const backend = role === COORDINATOR_ROLE ? coordinatorBackendName(slug) : siteBackendName(slug)
    const name = role === COORDINATOR_ROLE ? names.coordinator : names.consultant
    // A STOP THAT LANDS MID-ROUND, in whichever isolate, ends the round here with
    // the framework's own control-record stop on the member's junction.
    let polling = false
    const poll = setInterval(() => {
      if (polling || stopped) return
      polling = true
      void stopAsked()
        .then((asked) => {
          if (!asked) return
          stopped = true
          manager.requestStop(member.sessionId, null, { reason: 'stopped' })
        })
        .catch(() => {})
        .finally(() => {
          polling = false
        })
    }, STOP_POLL_MS)
    try {
      for await (const event of siteTurn(
        manager,
        slug,
        member.sessionId,
        role,
        backend,
        String(lib.briefText(brief)),
        deps,
        undefined,
        null,
        name,
      )) {
        const meta = { ...(event.meta ?? {}), member: name }
        channel.push(event.kind === DONE ? { kind: MEMBER_DONE, content: '', meta } : { ...event, meta })
      }
    } finally {
      clearInterval(poll)
    }
    flushPosts()
  }

  const run = (async () => {
    try {
      await group.contributeAsOperator(text)
      flushPosts()
      const handover = await new lib.Orchestrator(group, { prompt: seam }).run()
      flushPosts()
      channel.push({
        kind: DONE,
        content: '',
        meta: {
          status: 'complete',
          stop: handover.stop,
          reason: handover.reason,
          contributions: handover.contributions,
        },
      })
    } catch (err) {
      try {
        flushPosts()
      } catch {
        // The record is what it is; the stream still has to end.
      }
      if (err instanceof ExchangeStopped || stopped) {
        channel.push({ kind: DONE, content: '', meta: { status: 'aborted', stop: 'stopped' } })
      } else {
        channel.push({ kind: TEXT, content: `\n\n_${operatorMessage(err)}_` })
        channel.push({ kind: DONE, content: '', meta: { status: 'error' } })
      }
    } finally {
      try {
        await updateGuard(deps, roomUid, () => '')
      } finally {
        for (const sid of [room.consultant.sessionId, room.coordinator.sessionId]) {
          await deps.junctions?.flush?.(sid)
        }
        channel.close()
      }
    }
  })()

  try {
    yield* channel.drain()
  } finally {
    await run
  }
}

/**
 * Ask a running exchange to stop ([[REQ-357]]). Durable: the request is a write
 * on the room ticket, read by whichever isolate is running the exchange. Answers
 * whether there was an exchange to stop.
 */
export async function stopExchange(
  sessionId: string,
  deps: HostDeps,
): Promise<{ stopping: boolean }> {
  const slug = siteOfRoom(sessionId)
  if (!slug || !deps.tickets || !(await deps.store.hasDraft(slug))) {
    throw new UnknownSessionError(sessionId)
  }
  const uid = String((await deps.archive.homeRef(roomSessionIdFor(slug))) ?? '')
  if (uid === '') return { stopping: false }
  const stopping = await updateGuard(deps, uid, (held) =>
    liveGuard(held) ? { ...(held as ExchangeGuard), stop: true } : undefined,
  )
  return { stopping }
}

/**
 * Each member's own private session, for the Debug tab ([[REQ-357]]; EPIC-22 §2).
 *
 * What each agent said to itself deciding, which the room does not contain.
 * `null` where the business does not run a group chat.
 */
export async function privateSessions(
  slug: string,
  opts: GlobalOptions,
  deps: HostDeps,
): Promise<{ members: Array<{ role: string; name: string; turns: ChatTurn[] }> } | null> {
  if (!(await groupChatOn(deps)) || !(await deps.store.hasDraft(slug))) return null
  const manager = await managerFor(slug, opts, deps, true)
  const names = groupNames()
  const read = async (sessionId: string): Promise<ChatTurn[]> => {
    await prepareJunction(deps, sessionId)
    return (await storedTranscript(manager, sessionId))?.turns ?? []
  }
  return {
    members: [
      { role: CONSULTANT_ROLE, name: names.consultant, turns: await read(sessionIdFor(slug)) },
      {
        role: COORDINATOR_ROLE,
        name: names.coordinator,
        turns: await read(coordinatorSessionIdFor(slug)),
      },
    ],
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
  // [[REQ-307]] — a tailer reads the junction and nothing else, so an isolate
  // that has never held this session has nothing to replay until it does.
  await prepareJunction(deps, sessionId)
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
    : await managerFor(slug as string, opts, deps, await groupChatOn(deps))
  // [[REQ-416]] — A TALKER'S ROUND IS ITS OWN: drawn as one, and its end is not
  // the end of the turn being rejoined.
  const talkers = new TalkerFrames()
  for await (const record of manager.watch(sessionId, { cursor })) {
    const kind = String(record.kind)
    const talker = talkers.frame(record)
    if (talker) {
      yield talker
      continue
    }
    if (kind === 'delta') {
      // [[REQ-416]] — the worker's prose after a talker opened stays marked, so the
      // panel holds it as the live stream does.
      yield { kind: TEXT, content: String(record.content ?? ''), ...(record.forked ? { meta: { forked: true } } : {}) }
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
    } else if (kind === PROGRESS) {
      // [[REQ-360]] — the build's heartbeat. `watch` serves only the current one,
      // so a reattach mid-build sees the latest figure and one after it sees none.
      yield progressEvent(record)
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
  managerGrouped.clear()
  signals.clear()
  baselines.clear()
  // CLEARED WITH THE MANAGERS IT COUNTS FOR ([[REQ-251]]). A count that outlived
  // the conversation would be compared against a fresh toolbox's zero on the next
  // turn and report a write that has already been seen — or, negative, none at
  // all.
  businessWrites.clear()
  planWrites.clear()
  workingNotes.clear()
  talkerRounds.clear()
  questionRuns.clear()
  clientShows.clear()
  talkerCues.clear()
  cuedMessages.clear()
  spendMeters.clear()
  continuationsLeft.clear()
  promisedContinuation.clear()
  // AND THE CARDS THAT HAVE NOT BEEN DELIVERED ([[REQ-260]]). A queued change
  // that outlived its conversation would be reported into the next one, putting
  // a card about somebody's domain in a turn that did not touch it.
  businessDnsChanges.clear()
}
