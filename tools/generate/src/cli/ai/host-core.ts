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
import { CARETAKER_ROLE, CARETAKER_SYSTEM, caretakerReminder } from './roles'
import { createL1Toolbox, type AiLibrary, type L1Operations } from './toolbox-core'

/**
 * The AI library — and everything it constructs — is untyped JavaScript loaded at
 * runtime, so it enters here as `any`. The boundary is narrow on purpose: every
 * value that LEAVES this module is one of the declared interfaces below.
 */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** One turn of a conversation, as the panel renders it. */
export interface ChatTurn {
  role: 'user' | 'assistant'
  markdown: string
}

/** What `/api/ai/session` answers with. */
export interface ChatSession {
  sessionId: string
  turns: ChatTurn[]
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
   * A pre-built knowledge surface and the grant that travels with it, or null.
   * Null is an ordinary state: an assistant that knows its tools and not the
   * design corpus.
   */
  knowledgeSurface?: { surface: Untyped; granted: Record<string, unknown> } | null

  /**
   * Builds the role's priming `ContextSource` from the constructed Toolbox.
   *
   * A FACTORY rather than a value, because the priming contains the tool manual
   * and the manual is a projection of THIS session's actual grant — it cannot be
   * built before the box it describes. Absent means the manual alone, which is
   * what a host with no knowledge corpus supplies.
   */
  priming?: ((box: Untyped) => Promise<Untyped>) | null

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

/** One `SessionManager` per site, keyed by the store it acts on. */
const managers = new Map<string, Promise<Untyped>>()

/**
 * The `Role` object each manager was built with, under the same key (REQ-131).
 *
 * Held because the reminder is no longer a constant. `SessionManager` reads
 * `role.reminder` at the top of EVERY turn, so refreshing it there is all it
 * takes to push a per-turn signal through the system channel — no upstream
 * change, and no second delivery mechanism to keep in step with the first.
 */
const roles = new Map<string, Untyped>()

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

async function build(slug: string, opts: GlobalOptions, deps: HostDeps): Promise<Untyped> {
  const lib = await ai(deps)

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
  const box = await createL1Toolbox(
    slug,
    { ...opts, actor: 'ai' },
    {
      audit: deps.audit ?? null,
      session: sessionIdFor(slug),
      lib: deps.lib,
      store: deps.store,
      extraOps: deps.extraOps ?? {},
      knowledgeSurface: deps.knowledgeSurface ?? null,
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
              (input: Record<string, unknown>) => box.run(name, input),
            ),
        ),
      }),
  )

  const role = new lib.Role({
    name: CARETAKER_ROLE,
    system: CARETAKER_SYSTEM,
    // `ContextSource` is duck-typed — `{documents(): string[]}` — so the manual
    // is supplied in memory. `StaticDocs` reads files; there is no file here, and
    // writing one so it could be read back would only create something to go
    // stale.
    //
    // Projected per role and per scope, which is a REQUIRED property rather than
    // a nicety: a session's manual never mentions a capability it was not
    // granted, so the model cannot propose one, apologise for one, or probe for
    // one.
    //
    // LANDSCAPE FIRST, MANUAL LAST, when the KB is built. `KnowledgeDocs` assembles
    // one document whose internal order is load-bearing and which KM owns: the map
    // of what exists, then what this agent is for, then how to reach the rest. The
    // manual goes in as the `mechanism` — the last thing read is the thing done
    // first — so the corpus is reached through THIS session's actual grant rather
    // than through a sentence written by hand about what it might have.
    //
    // This is the alternative to stuffing 32 design documents into every context:
    // the agent is given a map and the means to pull what it needs.
    // LANDSCAPE FIRST, MANUAL LAST when the host has a corpus; the manual alone
    // when it has not. Both satisfy the same duck-typed `ContextSource`, so the
    // role is constructed identically either way and nothing downstream branches
    // on which one it got.
    source: deps.priming ? await deps.priming(box) : { documents: () => [box.manual()] },
    reminder: caretakerReminder(slug),
  })
  roles.set(managerKey(slug, deps), role)

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
  return new lib.SessionManager(
    { [CARETAKER_ROLE]: role },
    deps.archive,
    deps.junctions ? { junctions: deps.junctions } : { logDir: deps.logDir },
  )
}

/** The stored transcript, or nothing. A site with no conversation yet is normal. */
async function storedTurns(manager: Untyped, sessionId: string): Promise<ChatTurn[]> {
  try {
    const session = await manager.archive.load(sessionId)
    return (session.turns as { role: string; content: string }[]).map((turn) => ({
      role: turn.role === 'user' ? 'user' : 'assistant',
      markdown: turn.content,
    }))
  } catch {
    return []
  }
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
    await manager.createSession(CARETAKER_ROLE, siteBackendName(slug), { sessionId })
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
    return { sessionId, turns: [], ready: false, error: operatorMessage(err) }
  }
  const turns = await storedTurns(manager, sessionId)
  try {
    await attach(manager, sessionId, slug)
  } catch (err) {
    return { sessionId, turns, ready: false, error: operatorMessage(err) }
  }
  return { sessionId, turns, ready: true }
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
 * Yields the library's stream events verbatim (`text` / `tool_activity` /
 * `done`), which is the shape the chat panel consumes.
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
  // reminder is refreshed rather than re-registered because the manager reads
  // `role.reminder` afresh on every turn.
  // THE COUNTER COMES OFF THE STORE PORT NOW (REQ-146), not off the filesystem.
  // It was `draftCounter(ctxOf(opts), slug)` — synchronous, and reading the
  // journal file directly. `SiteStore.counter` is the same number through the
  // port REQ-142 drew, so it is one line here and the only cost is an `await`
  // the surrounding function was already able to take.
  const key = managerKey(slug, deps)
  const store = deps.store
  const role = roles.get(key)
  const before = baselines.get(key)
  const at = await store.counter(slug)
  if (role) {
    role.reminder =
      before === undefined
        ? caretakerReminder(slug)
        : caretakerReminder(slug, { at: before, changes: at - before })
  }

  try {
    yield* manager.promptStream(sessionId, text)
  } finally {
    // AFTER the turn, and in a `finally` so an abandoned turn does not leave the
    // baseline behind: the assistant's own writes have landed by now, so they
    // are absorbed rather than reported back to it next turn.
    baselines.set(key, await store.counter(slug))
  }
}

/** What the assistant is, and whether it can run — the panel's mount-time check. */
export async function aiStatus(
  opts: GlobalOptions = {},
  deps: HostDeps,
): Promise<{ roles: string[]; backends: string[]; ready: boolean; error?: string }> {
  const base = { roles: [CARETAKER_ROLE], backends: [] as string[] }
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
  roles.clear()
  baselines.clear()
}
