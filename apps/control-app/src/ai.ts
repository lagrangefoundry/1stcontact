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
import { sessionIdFor } from '../../../tools/generate/src/cli/ai/host-core'
import { chatLedger } from './ledger'
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
import {
  DOCUMENT_DIGEST_SYSTEM,
  IMAGE_DIGEST_SYSTEM,
  type DescribeImage,
  type DescribeText,
} from './describe'

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

/**
 * The text describer's role, which is also its backend name.
 *
 * ONE CONSTANT WHERE THERE WERE TWO (REQ-207). They were `DESCRIBER_ROLE` and
 * `DESCRIBER_BACKEND`, always the same string, so the pair was two things to keep
 * in sync for no distinction anyone could act on. What matters is that the name is
 * DISTINCT FROM THE IMAGE DESCRIBER'S below — see {@link describerSession}.
 */
export const TEXT_DESCRIBER = 'material_describer'

/** The image describer's role and backend name (REQ-207). */
export const IMAGE_DESCRIBER = 'material_image_describer'

/**
 * A **lightweight session** on this host, which is how this Worker describes
 * material (REQ-173 for documents, REQ-207 for images).
 *
 * THROUGH THE SESSION FACTORY, NOT THROUGH THE SDK. Until REQ-207 the image
 * branch reached the Messages API directly, and said at length why: the AI host's
 * surface carried no image content block, so a photograph genuinely could not be
 * described through the host this Worker already runs. REQ-111 put content blocks
 * on that surface, so the excuse is spent — and this Worker keeps ONE path to a
 * model rather than the two it had.
 *
 * WHAT MAKES IT LIGHTWEIGHT is everything the consultant session has that a
 * description does not need:
 *
 *   - **No tools.** The describer is given material and asked for prose. A
 *     toolbox would hand a describer the ability to write to the client's site,
 *     which is an authority nothing about this task calls for.
 *   - **No corpus and no priming beyond the one instruction.** The material is
 *     the whole context. Priming the describer with the landscape would spend a
 *     large prompt teaching it about material it is not being asked about.
 *   - **A `NullArchive`.** THE LOAD-BEARING ONE. `TicketSessionArchive` homes a
 *     session in a `chat` ticket, so an archiving describer would create one chat
 *     ticket per upload — members of the very corpus REQ-173 was trying to keep
 *     to material a client would recognise. A description is not a conversation
 *     and nobody will resume it.
 *   - **A session per piece of material, closed after it.** Two uploads share no
 *     context: carrying one into the other's turn would let the first colour the
 *     second's description, which is a subtle failure with no symptom.
 *
 * The junction is `memoryJunctions()` for the same reason the chat host's is —
 * `node:fs` under `nodejs_compat` is a per-isolate shim that passes every test in
 * workerd and loses everything in production.
 *
 * ONE FUNCTION FOR BOTH DESCRIBERS, because the difference between them is a
 * system prompt and the shape of one turn's content — everything else, which is
 * all of the above, is the same decision made twice. Consolidating an image path
 * onto the text path only to leave two copies of the path would have missed the
 * point of the exercise.
 *
 * A DISTINCT `name` PER DESCRIBER, AND THAT IS NOT COSMETIC. `registerBackend` is
 * a process-wide idempotent overwrite, so two describers sharing a name means the
 * one constructed second silently owns the first's backend — and since the router
 * builds both per request, the text describer would answer through the image
 * describer's client. The roles differ (their priming is their whole job), so this
 * is a cross-wiring with no symptom until a description comes back written to the
 * wrong instruction.
 */
function describerSession(
  name: string,
  system: string,
  apiKey: string,
  // THE SAME SEAM THE CHAT HOST'S DOUBLE USES (BUG-39). The Anthropic client is
  // the one boundary these suites may fake — it is the network — and faking it
  // here rather than the whole describer is what lets a UAT assert the things
  // this function actually decides: no tools, a null archive, one session per
  // upload, closed after it, and — for images — that a picture was really sent.
  client: unknown,
): (content: unknown) => Promise<{ text: string; model: string }> {
  // ONE BACKEND OBJECT, held so its `model` can be reported as the describer.
  // `registerBackend` is an idempotent overwrite and the adapter is stateless
  // between segments, so one instance serves every upload this request describes
  // — the per-upload isolation that matters is the SESSION's.
  const backend = new lib.ClaudeAPIBackend({
    apiKey,
    tools: [],
    ...(client ? { client } : {}),
  })
  lib.registerBackend(name, () => backend)

  const role = new lib.Role({
    name,
    // ONE ENTRY, AND ONLY ONE (BUG-63). Under DOC-22 the preamble is not a field
    // but the first priming entry, and this role's priming is the whole of it:
    // the material is the context, and there is nothing else this role should
    // know.
    priming: [new lib.Entry({ name: 'digest-system', text: system })],
  })
  const manager = new lib.SessionManager({ [name]: role }, new lib.NullArchive(), {
    junctions: lib.memoryJunctions(),
  })

  return async (content: unknown) => {
    const sessionId = `describe-${crypto.randomUUID()}`
    await manager.createSession(name, name, { sessionId })
    try {
      const response = await manager.prompt(sessionId, content)
      return { text: String(response.text ?? ''), model: String(backend.model) }
    } finally {
      // ALWAYS, INCLUDING ON THE FAILING PATH. The junction is in memory and the
      // isolate outlives the request; a session left open per failed description
      // is a leak that only shows up under load.
      await manager.closeSession(sessionId)
    }
  }
}

/** The document describer (REQ-173) — see {@link describerSession}. */
export function sessionTextDescriber(
  apiKey: string,
  { client = null }: { client?: unknown } = {},
): DescribeText {
  const run = describerSession(TEXT_DESCRIBER, DOCUMENT_DIGEST_SYSTEM, apiKey, client)
  // A DOCUMENT IS SENT AS A PLAIN STRING, not as a single text block. The port
  // passes a string through untouched, so the overwhelmingly common call does not
  // change shape on the wire because a capability it never uses was added beside
  // it — and this describer's turn is byte-for-byte what it was before REQ-207.
  return (prompt: string) => run(prompt)
}

/**
 * The image describer (REQ-207) — see {@link describerSession}.
 *
 * THE ONE THING THAT DIFFERS FROM ITS TEXT PEER is this turn's content: the
 * picture as an image block, then the instruction beside it. The blocks come from
 * the port's own constructors rather than from object literals here, so the shape
 * this Worker sends is the shape the port validates — and a media type outside the
 * four every vision-capable backend accepts is refused at the component boundary
 * rather than as an opaque 400 from whichever provider is configured.
 *
 * ORDER MATCHES WHAT THIS PRODUCT SENT BEFORE: the image first, the one-line
 * instruction after it. The prompt that governs the answer is the role's system
 * text, so the trailing line is a nudge rather than the specification.
 *
 * BASE64 HERE, THOUGH `imageBlock` ALSO ACCEPTS BYTES. The session manager writes
 * the turn's durable record — and measures the image for it — before the backend
 * normalises content, so raw bytes that far up the path are read as a string and
 * are not one. The encoder is the port's, not a local one: this file having its
 * own would be the duplication this ticket is removing, in miniature.
 */
export function sessionImageDescriber(
  apiKey: string,
  { client = null }: { client?: unknown } = {},
): DescribeImage {
  const run = describerSession(IMAGE_DESCRIBER, IMAGE_DIGEST_SYSTEM, apiKey, client)
  return (bytes: Uint8Array, contentType: string) =>
    run([
      lib.imageBlock({ mediaType: contentType, data: lib.bytesToBase64(bytes) }),
      lib.textBlock('Describe this image.'),
    ])
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
  /** A `wrangler secret`. Absent is an ordinary state — the panel says so. */
  ANTHROPIC_API_KEY?: string
}

// `TENANT_ID` WAS DECLARED HERE AND NEVER READ ([[REQ-168]]). It was listed as
// one of that ticket's four reads on the strength of this declaration alone;
// {@link workerHost} has always taken `tenantId` as a parameter, so the field
// bought nothing and would have kept the var alive in a type after every real
// reader had moved. Deleted rather than left as documentation of an intent the
// code does not have.

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
  /**
   * The assistant's eyes ([[REQ-206]]), or `null` where this deployment has none.
   *
   * A PARAMETER, ASSEMBLED BY `router.ts`, and that is the same division of
   * labour every other wire on this host follows: what the surface needs is a
   * browser binding, a reference store bound to this business, this deployment's
   * own address and the renderer the `/preview/*` route serves from — and the
   * last of those is memoised per store IN THE ROUTER, so building it here would
   * be a second renderer answering from a different stamp than the one the
   * operator is looking at. Assembling it there also keeps
   * `@cloudflare/puppeteer` out of this file's import graph.
   *
   * NULL IS ORDINARY, not an error, and must stay so: a deployment with no
   * `[browser]` binding still opens the session, still replays the transcript,
   * and simply has no eyes — the same shape as a deployment with no API key. The
   * surface is absent rather than present-and-throwing, so the manual never
   * mentions it and the model cannot propose an operation it has not got.
   */
  fidelity: HostDeps['fidelity'] = null,
  /**
   * The assistant's hands for drawing ([[REQ-208]]), or `null` where this
   * deployment holds no image credential.
   *
   * A PARAMETER, ASSEMBLED BY `router.ts`, for the reason `fidelity` above is
   * one: the plugin needs a ticket store scoped and normalised to this
   * product's material vocabulary and the KB indexer to make what it writes
   * findable, and both of those are the router's to assemble. It also keeps the
   * framework plugin and the image-generation component out of this file's
   * import graph, which is the same reason `@cloudflare/puppeteer` is not here.
   *
   * NULL IS ORDINARY, not an error, and must stay so — the same shape a missing
   * browser and a missing describer already have. A deployment with no image key
   * still opens the session, still replays the transcript, and simply cannot
   * make a picture. The surface is ABSENT rather than present-and-throwing, so
   * the manual never mentions it and the model cannot propose an operation it
   * has not got.
   */
  images: { surface: Untyped } | null = null,
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
      // stated rather than hidden — and until BUG-46 it was stated WRONG, which
      // is worse than not stating it, so what the exposure actually is:
      //
      // AN EVICTION MID-TURN LOSES THE WHOLE TURN, not a partial one. This used
      // to say the loss was bounded because `ArchiveSyncer` "drains continuously
      // and everything before it is already durable" — restating DOC-21 §15.4,
      // which restated §1.5's "long-term storage is updated continuously as we
      // go, exactly as the browser is". THAT STOPPED BEING TRUE when
      // lagrange-framework BUG-19 added `closedPrefix`: the archive now cuts at
      // the last boundary where no turn is open, deliberately, because folding
      // half a turn splits one reply in two and destroys the whitespace at the
      // seam. So between `turn_start` and `turn_end` the durable copy has that
      // turn missing ENTIRELY. §1.5, §11 and §15.4 have since been corrected
      // upstream; this is what they now say.
      //
      // The two obligations that follow are both discharged: the host renders
      // from the junction rather than the archive (`host-core.ts`), and the
      // end-of-turn drain is held open past a client disconnect by
      // `ctx.waitUntil` (`router.ts`). Together those make a COMPLETED turn
      // durable under a reload and a reload mid-turn non-destructive.
      //
      // WHAT REMAINS, because it is a property of this line and not of those
      // fixes: the junction is RAM scoped to one isolate, so an isolate evicted
      // mid-turn still loses that turn. DOC-21 §15.4 names a Durable Object as
      // the route back — single writer per session, synchronous SQLite, and it
      // fits this `Junctions` port with no library change.
      junctions: lib.memoryJunctions(),
      audit: audit.sink,
      // Absent is fine and must stay fine: the backend's factory is lazy, so a
      // deployment with no key still opens the session, still replays the
      // transcript, and says why it cannot take a turn.
      ...(env.ANTHROPIC_API_KEY ? { apiKey: env.ANTHROPIC_API_KEY } : {}),
      // BOTH BRING THEIR OWN GRANT ([[REQ-208]]), for the same underlying
      // reason: their declarations live upstream. Knowledge's must, because its
      // two scope axes have to name the same set and composing them in two
      // places is how they would come apart; the image surface's must, because
      // `instances.json` is validated in CI against the declarations THIS
      // repository holds, and a grant there for a surface the validator never
      // sees is a grant nothing can check. Fidelity's is the contrasting case
      // and stays where it is.
      //
      // `createL1Toolbox` narrows a grant away when its surface was not
      // composed, which is what lets a deployment with no image key start an
      // assistant that edits sites perfectly well.
      extraSurfaces: [
        ...(knowing ? [sessionKnowledgeSurface(knowledge)] : []),
        ...(images ? [images] : []),
      ],
      // Passed straight through: `host-core.ts` composes the surface when this
      // is present and composes nothing when it is not, which is the one place
      // that decision should be made.
      fidelity,
      // THE ENGAGEMENT RECORD (REQ-171). Unconditional, unlike the three
      // knowledge wires above: the record does not depend on there being a
      // corpus, and a session with no knowledge base still decides things worth
      // keeping. What it does depend on is a ticket store, which this host
      // always has and the `1c` CLI never does.
      ledger: (slug: string) => chatLedger(tickets, sessionIdFor(slug)),
      priming: knowing ? sessionPriming(knowledge) : null,
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
