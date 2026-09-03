/**
 * The AI host's Cloudflare runtime (REQ-146).
 *
 * `host-core.ts` is the host — the session model, the tool loop, the per-turn
 * change signal, the three entry points. It names no filesystem and takes its
 * runtime as {@link HostDeps}. This file is the runtime workerd supplies, and it
 * is the exact counterpart of `ai/host.ts`, which supplies Node's.
 *
 * FOUR ADAPTERS, and each replaces a thing that used to be a disk:
 *
 *   | Node                        | Here                                    |
 *   |-----------------------------|-----------------------------------------|
 *   | `sharedModuleUrl('ai')`     | the bundled `/workers` rung             |
 *   | `FileArchive(dir)`          | `TicketSessionArchive` over the D1 store |
 *   | file junction under the cwd | `memoryJunctions()`                     |
 *   | `fileAuditSink` (appends)   | {@link bufferedAuditSink} + a flush     |
 *
 * WHY NOT `FileArchive`, EMPHATICALLY. `node:fs` RESOLVES in workerd under
 * `nodejs_compat` and gives a per-isolate, ephemeral filesystem: `os.homedir()`
 * answers `/tmp/`, writes succeed, reads come back. A file-backed archive
 * therefore passes every test here and loses every conversation in production,
 * on the next eviction. lagrange-framework REQ-103 measured exactly this before
 * drawing the junction port, and it is why the guard on this file is a static
 * import-graph assertion rather than a passing turn.
 *
 * THE TRANSCRIPT IS A TICKET, NOT AN OBJECT (REQ-160). It was an R2 object at
 * `chat/<tenant>/<session>.md`, and the reason that was safe was stated rather
 * than enforced: the key sits outside `draft/`, and nothing in the router
 * derives an R2 root from a request. `TicketSessionArchive` is what DOC-10 §8
 * specifies instead — the session homed in a `chat` ticket found or created by
 * `fields.session_id`, the whole session file in one `chat_transcript` comment,
 * the ticket body left alone because it is the AI-maintained summary's home
 * (REQ-171), and writes compare-and-set so a concurrent fold conflicts loudly
 * rather than losing the later increment silently.
 *
 * Everything is a ticket, and the transcript is not the exception. Three things
 * come with that. The conversation becomes a member of the project knowledge
 * base, which is what REQ-159's `onTranscriptGrew` was written for and had no
 * caller for. Tenancy stops being a convention and becomes the same information
 * barrier every other read crosses, bound into the handle by `forTenant`. And
 * the session file is unchanged — `Session.toFile()` still produces the
 * language-neutral form, so a conversation archived here still loads in the Node
 * host and in the Python peer.
 *
 * The costs are DOC-10 §8.1's and are accepted there: the whole session file is
 * rewritten per turn, and a D1 row is bounded where an R2 object was not. The
 * fix for the day either hurts is a message-granular archive behind the same
 * port, not a bespoke schema here.
 *
 * THE AUDIT STAYS IN R2, at `audit/<tenant>/<session>/<n>.json` — outside
 * `draft/`, per DOC-12 §7. That is not an inconsistency with the paragraph
 * above: one object per record is what makes the trail append-only by
 * construction, because distinct keys cannot collide, and a ticket per record
 * would be a different trade this ticket is not making.
 */

import * as aiLib from './generated/ai-workers.js'
import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
import type { TicketStore } from './tickets'
import type { HostDeps } from '../../../tools/generate/src/cli/ai/host-core'
import { CONSULTANT_PURPOSE } from '../../../tools/generate/src/cli/ai/host-core'
import {
  bufferedAuditSink,
  type AuditLine,
  type BufferedAuditSink,
} from '../../../tools/generate/src/cli/ai/toolbox-core'
import {
  sessionKnowledgeSurface,
  sessionPriming,
  type SessionKnowledge,
} from './session-knowledge'
import { turnDelta } from './session-delta'
import { DOCUMENT_DIGEST_SYSTEM, type DescribeText } from './describe'

/** The library is untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const lib = aiLib as unknown as Untyped

/**
 * The session archive, over the ticket store (REQ-160).
 *
 * A FUNCTION AND NOT A CLASS, because there is nothing left to implement. The
 * component's `TicketSessionArchive` already satisfies the `TranscriptArchive`
 * port against any client of the duck-typed `TicketClient` shape, and
 * {@link TicketStore} is one — `create`, `get`, `update`, `query`, `comment`
 * and `comments`, same object-arg calls, same `{ticket}` / `{tickets}` /
 * `{comment}` / `{comments}` envelopes. The R2 archive this replaced existed
 * because R2 has no append and the read-modify-write had to be written
 * somewhere; a ticket store folds compare-and-set for us, so the adapter
 * disappears rather than moving.
 *
 * NO TENANT ARGUMENT, and its absence is the point. The R2 archive took one and
 * composed it into every key, so tenancy was a string this file got right. The
 * store handed in here is already bound to one account by `forTenant`, so there
 * is no argument anywhere on this path that could name another — the same rule
 * `tickets.ts` states and `knowledge.ts` inherits.
 */
export function sessionArchive(tickets: TicketStore): Untyped {
  return new lib.TicketSessionArchive(tickets)
}

/** The describer's role and backend names — one pair, registered once per key. */
export const DESCRIBER_ROLE = 'material_describer'
export const DESCRIBER_BACKEND = 'material_describer'

/**
 * The document describer, as a **lightweight session** on this host (REQ-173).
 *
 * THROUGH THE SESSION FACTORY, NOT THROUGH THE SDK. `describe.ts`'s image
 * describer reaches the Messages API directly, and says at length why: the AI
 * host's surface carries no image content block, so an image genuinely cannot be
 * described through the host this Worker already runs. A document digest has no
 * such excuse — it is text in and text out — so it goes through the same
 * `SessionManager` a conversation goes through, and this Worker keeps ONE path to
 * a model rather than acquiring a second by default.
 *
 * WHAT MAKES IT LIGHTWEIGHT is everything the consultant session has that a
 * digest does not need:
 *
 *   - **No tools.** The describer is given text and asked for text. A toolbox
 *     would hand a describer the ability to write to the client's site, which is
 *     an authority nothing about this task calls for.
 *   - **No corpus and no priming.** The document is the whole context. Priming
 *     the describer with the landscape would spend a large prompt teaching it
 *     about material it is not being asked about.
 *   - **A {@link NullArchive}.** THE LOAD-BEARING ONE. `TicketSessionArchive`
 *     homes a session in a `chat` ticket, so an archiving describer would create
 *     one chat ticket per upload — members of the very corpus this ticket is
 *     trying to keep to material a client would recognise. A digest is not a
 *     conversation and nobody will resume it.
 *   - **A session per document, closed after it.** Two documents share no
 *     context: carrying one into the other's turn would let the first colour the
 *     second's description, which is a subtle failure with no symptom.
 *
 * The junction is `memoryJunctions()` for the same reason the chat host's is —
 * `node:fs` under `nodejs_compat` is a per-isolate shim that passes every test in
 * workerd and loses everything in production.
 */
export function sessionTextDescriber(
  apiKey: string,
  // THE SAME SEAM THE CHAT HOST'S DOUBLE USES (BUG-39). The Anthropic client is
  // the one boundary these suites may fake — it is the network — and faking it
  // here rather than the whole describer is what lets a UAT assert the things
  // this function actually decides: no tools, a null archive, one session per
  // document, closed after it.
  { client = null }: { client?: unknown } = {},
): DescribeText {
  // ONE BACKEND OBJECT, held so its `model` can be reported as the describer.
  // `registerBackend` is an idempotent overwrite and the adapter is stateless
  // between segments, so one instance serves every document this request
  // describes — the per-document isolation that matters is the SESSION's.
  const backend = new lib.ClaudeAPIBackend({
    apiKey,
    tools: [],
    ...(client ? { client } : {}),
  })
  lib.registerBackend(DESCRIBER_BACKEND, () => backend)

  const role = new lib.Role({
    name: DESCRIBER_ROLE,
    system: DOCUMENT_DIGEST_SYSTEM,
    // The duck-typed `ContextSource`, empty. See above: the document is the
    // context, and there is nothing else this role should know.
    source: { documents: () => [] },
  })
  const manager = new lib.SessionManager({ [DESCRIBER_ROLE]: role }, new lib.NullArchive(), {
    junctions: lib.memoryJunctions(),
  })

  return async (prompt: string) => {
    const sessionId = `describe-${crypto.randomUUID()}`
    await manager.createSession(DESCRIBER_ROLE, DESCRIBER_BACKEND, { sessionId })
    try {
      const response = await manager.prompt(sessionId, prompt)
      return { text: String(response.text ?? ''), model: String(backend.model) }
    } finally {
      // ALWAYS, INCLUDING ON THE FAILING PATH. The junction is in memory and the
      // isolate outlives the request; a session left open per failed description
      // is a leak that only shows up under load.
      await manager.closeSession(sessionId)
    }
  }
}

/**
 * Write a turn's audit records durably, one object per record.
 *
 * ONE OBJECT PER RECORD rather than a read-modify-write of a `.jsonl`. R2 has no
 * append, and a fold would make two concurrent turns able to lose each other's
 * records — an audit trail that drops entries under load is worse than none,
 * because it reads as evidence. Distinct keys cannot collide, so the write is
 * append-only by construction, which is what `appendFileSync` bought on Node.
 *
 * The key sorts chronologically: the record's own timestamp, then its index
 * within the flush, so replaying a session's audit is a prefix listing.
 */
export async function flushAudit(
  bucket: R2Bucket,
  tenantId: string,
  sessionId: string,
  lines: AuditLine[],
): Promise<void> {
  await Promise.all(
    lines.map((line, i) => {
      const stamp = String((line as Untyped).timestamp ?? '').replace(/[^0-9A-Za-z._-]/g, '-')
      const key = `audit/${tenantId}/${sessionId}/${stamp}-${String(i).padStart(4, '0')}.json`
      return bucket.put(key, JSON.stringify(line), {
        httpMetadata: { contentType: 'application/json; charset=utf-8' },
      })
    }),
  )
}

/** What the Worker needs to build a host: the store, the bindings, the secret. */
export interface WorkerAiEnv {
  SITES: R2Bucket
  TENANT_ID?: string
  /** A `wrangler secret`. Absent is an ordinary state — the panel says so. */
  ANTHROPIC_API_KEY?: string
}

/**
 * The Worker's {@link HostDeps}, plus the audit buffer its route must flush.
 *
 * The buffer is handed back rather than hidden because flushing is the ROUTE'S
 * job: upstream's `emit` is synchronous and swallows failures, so the durable
 * write cannot happen inside the sink, and in a Worker the isolate can go away
 * the moment the response ends. The route awaits {@link flushAudit} before it
 * finishes, which is what makes the trail survive the isolate that produced it.
 */
export interface WorkerHost {
  deps: HostDeps
  audit: BufferedAuditSink
  flush(sessionId: string): Promise<void>
}

/**
 * Build the host runtime for one request.
 *
 * The MANAGER CACHE is keyed by the store's object identity (`host-core.ts`), and
 * `storeFor` constructs a store per request so the tenant check is never stale —
 * so a fresh store per request would mean a fresh conversation per request. The
 * store handed in here is therefore the caller's to keep for as long as it wants
 * the conversation to live; `router.ts` holds one per isolate for the chat routes
 * alone, which is the one place that trade is the right way round.
 */
export function workerHost(
  env: WorkerAiEnv,
  store: TenantSiteStore,
  tenantId: string,
  tickets: TicketStore,
  knowledge: SessionKnowledge | null = null,
): WorkerHost {
  const audit = bufferedAuditSink()
  // THE SURFACE AND THE PRIMING COME AS A PAIR OR NOT AT ALL (REQ-158) — the
  // rule `host.ts` states for Node and this inherits rather than restates. A
  // session primed with the landscape but not granted the corpus would be told
  // to read documents it cannot open; one granted the corpus and not primed
  // would never learn there was anything to read.
  // `!= null` deliberately, covering `undefined` as well: `router.ts` resolves
  // this through an injectable seam, and a seam that hands back nothing must
  // read as "no corpus" rather than as a corpus that throws on first use.
  const knowing = knowledge != null
  return {
    audit,
    deps: {
      lib,
      store,
      archive: sessionArchive(tickets),
      // The in-memory junction, per REQ-103's Cloudflare packaging. Its cost is
      // stated rather than hidden: an eviction mid-turn loses the turn in
      // flight, because `ArchiveSyncer` drains continuously and everything
      // before it is already durable.
      junctions: lib.memoryJunctions(),
      audit: audit.sink,
      // Absent is fine and must stay fine: the backend's factory is lazy, so a
      // deployment with no key still opens the session, still replays the
      // transcript, and says why it cannot take a turn.
      ...(env.ANTHROPIC_API_KEY ? { apiKey: env.ANTHROPIC_API_KEY } : {}),
      extraSurfaces: knowing ? [sessionKnowledgeSurface(knowledge)] : [],
      priming: knowing ? sessionPriming(knowledge, CONSULTANT_PURPOSE) : null,
      // THE THIRD THING THAT COMES WITH THE PAIR (REQ-160). A session primed with
      // a landscape and granted the corpus still cannot be TOLD that the corpus
      // grew — a map is a description, not a notification — so the delta is
      // wired wherever the other two are and never on its own. Without knowledge
      // there is no corpus to have a delta about.
      //
      // The clock is read here, per turn, rather than passed down: the host is
      // runtime-agnostic and `Date` is one of the things a runtime supplies.
      delta: knowing
        ? (sessionId: string) =>
            turnDelta(knowledge, tickets, sessionId, new Date().toISOString())
        : null,
    },
    flush: (sessionId: string) =>
      flushAudit(env.SITES, tenantId, sessionId, audit.drain()),
  }
}
