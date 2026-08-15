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

import path from 'node:path'
import type { GlobalOptions } from '../commands'
import { ctxOf } from '../commands'
import { draftCounter } from '../../store'
import { sharedModuleUrl } from '../webui'
import { openKnowledgeRuntime } from '../kb'
import { CARETAKER_ROLE, CARETAKER_SYSTEM, caretakerReminder } from './roles'
import { createL1Toolbox, fileAuditSink } from './toolbox'

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

/** The AI library, imported once. */
let library: Promise<Untyped> | null = null
function ai(): Promise<Untyped> {
  if (!library) library = import(/* @vite-ignore */ sharedModuleUrl('ai'))
  return library
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
 * Where transcripts live: beside the store they are about, and gitignored.
 *
 * Not the library's default (`~/.xgd/sessions`): these belong to a workspace, not
 * to a machine, and two checkouts of two different projects must not share one
 * pile of conversations keyed only by slug.
 */
export function sessionsDir(opts: GlobalOptions): string {
  return path.join(ctxOf(opts).cwd, 'storage', 'chat')
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

function managerKey(slug: string, opts: GlobalOptions): string {
  const ctx = ctxOf(opts)
  return `${ctx.cwd}\0${ctx.root}\0${slug}`
}

/**
 * Session ids this host has minted, and the site each one is bound to.
 *
 * The registry is what makes a session id arriving from a client RESOLVED rather
 * than trusted. `sessionIdFor` is derivable, so the slug could equally be
 * recovered by recomputation — but then whatever string arrived would be a
 * free-form key into the session store, resuming or creating a conversation by
 * that name. A session id is exactly the kind of value that invites being taken
 * as an authority, so the host answers only for ids it issued.
 *
 * Keyed by store as well as by id, on the same reasoning as {@link managerKey}:
 * two checkouts can hold sites of the same name, and their conversations are not
 * the same conversation. `\0` rather than a literal NUL byte — the same string at
 * runtime, without making this file binary to `grep` and `diff`.
 */
const minted = new Map<string, string>()

function mintedKey(sessionId: string, opts: GlobalOptions): string {
  const ctx = ctxOf(opts)
  return `${ctx.cwd}\0${ctx.root}\0${sessionId}`
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
function managerFor(slug: string, opts: GlobalOptions): Promise<Untyped> {
  const key = managerKey(slug, opts)
  let existing = managers.get(key)
  if (!existing) {
    existing = build(slug, opts)
    managers.set(key, existing)
  }
  return existing
}

async function build(slug: string, opts: GlobalOptions): Promise<Untyped> {
  const lib = await ai()

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
  const knowledge = await openKnowledge()

  const box = await createL1Toolbox(
    slug,
    { ...opts, actor: 'ai' },
    { audit: fileAuditSink(opts), session: sessionIdFor(slug), knowledge },
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
    source: await primingSource(knowledge, box),
    reminder: caretakerReminder(slug),
  })
  roles.set(managerKey(slug, opts), role)

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
  const dir = sessionsDir(opts)
  return new lib.SessionManager({ [CARETAKER_ROLE]: role }, new lib.FileArchive(dir), {
    logDir: path.join(dir, 'live'),
  })
}

/**
 * What the caretaker is here to do, for KM's priming (step 2 of the landscape).
 *
 * Deliberately the ROLE'S purpose and not a restatement of the system prompt: the
 * priming answers "what should I go looking for in this corpus", and an agent
 * told only "you are a caretaker" has no basis for choosing between a document
 * about storage and one about typography.
 */
const CARETAKER_PURPOSE =
  'You look after a website for someone who is not technical. You will need to ' +
  'know how this system builds and describes sites — its layout vocabulary, its ' +
  'components, how pages are stored and published, and the reasoning behind those ' +
  'designs — so you can act correctly and explain plainly.'

/**
 * The system knowledge runtime, or `null` when the KB has not been built.
 *
 * Built once per process rather than per site: the KB is a release artefact
 * shared by every site, so caching it per slug would load the same index many
 * times over. Any failure to open it degrades to `null` — see {@link build}.
 */
let knowledgeRuntime: Promise<Untyped | null> | null = null
function openKnowledge(): Promise<Untyped | null> {
  if (!knowledgeRuntime) {
    knowledgeRuntime = openKnowledgeRuntime().catch((err: unknown) => {
      // A KB that was BUILT and then failed to open is not the same as one that
      // was never built, and it must not look the same. The usual cause is the
      // embedding credentials being absent, which would otherwise cost the
      // operator their whole knowledge surface with no symptom but an assistant
      // that has quietly stopped knowing anything. The session still opens —
      // this is a degradation, not a failure — but it says so.
      console.error(
        `The system knowledge base could not be opened, so the assistant will ` +
          `run without it: ${err instanceof Error ? err.message : String(err)}`,
      )
      return null
    })
  }
  return knowledgeRuntime
}

/**
 * The role's priming: KM's landscape when there is a KB, the tool manual alone
 * when there is not.
 *
 * Both satisfy the same duck-typed `ContextSource`, so the role is constructed
 * identically either way and nothing downstream branches on which one it got.
 */
async function primingSource(knowledge: Untyped | null, box: Untyped): Promise<Untyped> {
  if (knowledge === null) return { documents: () => [box.manual()] }
  const { KnowledgeDocs } = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
  return KnowledgeDocs.open(knowledge, {
    rolePurpose: CARETAKER_PURPOSE,
    mechanism: box.manual(),
  })
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
export async function openSession(slug: string, opts: GlobalOptions = {}): Promise<ChatSession> {
  const sessionId = sessionIdFor(slug)
  // Recorded BEFORE the backend is touched, and regardless of how the rest of
  // this call goes. "This id belongs to this site" is true whether or not the
  // assistant can currently run, and a session opened into a frozen panel must
  // still be able to take a turn once the operator supplies an API key and
  // restarts — the binding is not what failed.
  minted.set(mintedKey(sessionId, opts), slug)
  let manager: Untyped
  try {
    manager = await managerFor(slug, opts)
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
): AsyncGenerator<{ kind: string; content: string; meta?: Record<string, unknown> }> {
  const slug = minted.get(mintedKey(sessionId, opts))
  if (!slug) throw new UnknownSessionError(sessionId)
  const manager = await managerFor(slug, opts)
  await attach(manager, sessionId, slug)

  // REQ-131 — the push half of the change journal. The comparison happens here
  // because this is the only place that knows where a turn begins, and the
  // reminder is refreshed rather than re-registered because the manager reads
  // `role.reminder` afresh on every turn.
  const key = managerKey(slug, opts)
  const role = roles.get(key)
  const before = baselines.get(key)
  const at = draftCounter(ctxOf(opts), slug)
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
    baselines.set(key, draftCounter(ctxOf(opts), slug))
  }
}

/** What the assistant is, and whether it can run — the panel's mount-time check. */
export async function aiStatus(
  opts: GlobalOptions = {},
): Promise<{ roles: string[]; backends: string[]; ready: boolean; error?: string }> {
  const base = { roles: [CARETAKER_ROLE], backends: [] as string[] }
  try {
    const lib = await ai()
    // Construction is where a missing prerequisite surfaces, by design — the
    // registry stores factories precisely so the clear error arrives when the
    // backend is first used rather than at import.
    if (!modelClient) new lib.ClaudeAPIBackend()
    return { ...base, backends: lib.availableBackends(), ready: true }
  } catch (err) {
    return { ...base, ready: false, error: operatorMessage(err) }
  }
}

/**
 * Drop every cached manager and issued id. Exported for tests that rebuild a
 * store per case.
 *
 * The knowledge runtime is dropped too. It is cached for the life of the
 * process, so an operator who runs `1c kb build` while the builder origin is
 * already serving picks the new KB up on the next restart — the index is a
 * release artefact, and re-reading it per session would spend the load on every
 * site switch to catch a change that happens once a release.
 */
export function resetAiHost(): void {
  managers.clear()
  minted.clear()
  roles.clear()
  baselines.clear()
  knowledgeRuntime = null
}
