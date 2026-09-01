import {
  WorkersAiEmbedder,
  agglomerativeClusterer,
  buildAwareness,
  buildChunkIndex,
  buildIndex,
  documentsFromTickets,
  findAwarenessReport,
  knowledgeBasesFromMapping,
  loadIndex,
  publishAwarenessReport,
  resolveCorpus,
  search as kmSearch,
} from './generated/knowledge'
import type { Ticket, TicketStore, TicketStoreEnv } from './tickets'
import { ticketStoreFor } from './tickets'
import KB_CONFIG from '../../../kb/knowledge_bases.json'

/**
 * The PROJECT knowledge base (REQ-159) — [[DOC-39]] §3, §4, §7; [[DOC-38]] §8.
 *
 * WHAT THIS IS FOR, and how it differs from the other one. `1c kb` builds the
 * *system* KB: our design documents, exported to a directory, indexed at release,
 * byte-identical for every client, above the tenancy barrier. This is the other
 * half — **the client's own knowledge**, and it is what makes the assistant know
 * anything about *this* business rather than about websites in general. Its
 * corpus is `chat`, `material`, `reference` and `brief` in the tenant's own
 * ticket store (`tickets.ts`), so it declares no `source` and reads the project
 * store, which is what `DEFAULT_SOURCE` means.
 *
 * ONE DECLARATION FILE, AND EACH HOST NAMES THE KBs IT SERVES. Both knowledge
 * bases are declared in `kb/knowledge_bases.json` — parsed, never paraphrased,
 * the rule `kb.ts` already records. What differs per host is which of them it can
 * actually resolve: the release build has the shipped corpus and serves `system`;
 * the Worker has the tenant's D1 store and serves `project`. So each names its
 * own, rather than a filter guessing from a field — and when the Worker one day
 * mounts the shipped corpus too it adds a name here, with `storeFor` still the
 * thing that refuses a KB whose store the host does not have.
 *
 * INDEX RESIDENCY IS NOT THE BUNDLE, and that decision explicitly does not carry
 * over from the system KB. This corpus is tenant data: it differs per tenant and
 * is written continuously, so a bundled index would be wrong on both counts. It
 * goes to R2 through the component's own `IndexSource` port — same seam, other
 * implementation (see {@link r2IndexSource}).
 *
 * TWO CLOCKS, AND RUNNING THEM OFF ONE TRIGGER IS THE FAILURE THIS EXISTS TO
 * AVOID ([[DOC-39]] §4). The index is cheap and load-bearing: a document that is
 * not embedded is *invisible*, so indexing must be near-live. The map is
 * expensive and advisory: a stale map costs the AI knowledge that a *kind* of
 * thing exists, which is a much smaller loss than not finding it at all. Couple
 * them and you make the cheap thing rare or the expensive thing constant.
 *
 *   | corpus member                        | index                | map     |
 *   |--------------------------------------|----------------------|---------|
 *   | transcripts                          | every ~N thousand ch | never   |
 *   | `material` / `reference` / `brief`   | on write             | rebuild |
 *
 * Transcripts never move the map because the territory "conversations with this
 * client" is stable from the first turn and its description never usefully
 * changes — the AI already knows it is in a conversation. They still need index
 * freshness, because search over transcripts answers what the live context
 * cannot: earlier turns, and other sessions on the same site. An upload is
 * different in kind: it is a request for attention, so it rebuilds.
 *
 * THE REBUILD IS DEFERRED, NEVER AWAITED IN THE TURN. A map build is cluster +
 * one LLM describe per territory + a validating search per candidate access
 * point. Run inline on upload it stalls the assistant at exactly the moment the
 * client is waiting to talk about their document. It is safe to defer because
 * search needs only the *index*, which {@link ProjectKnowledge.onMaterialWritten}
 * refreshes first and synchronously — the document is findable immediately and
 * the territory description catches up behind it.
 *
 * WHAT THIS TICKET DOES NOT DO, on purpose. Session priming, the per-turn delta
 * and the change-feed operation are [[REQ-160]]; the Library and its uploads are
 * [[REQ-161]]; ingestion — blob to text shadow to indexed ticket — is
 * [[REQ-163]]. What is here is the driven capability those three call: a corpus,
 * an incremental index, two triggers and a landscape. It ships no scheduler,
 * which is why {@link Deferral} is injected rather than assumed.
 */

/** The library is untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * The KB this Worker serves.
 *
 * The name collides with the component's `DEFAULT_SOURCE`, which is also
 * `'project'`, and the collision is not an accident worth renaming away: the
 * project KB is precisely the one that reads the project store. [[DOC-38]] §8
 * names it, so it is spelled its way.
 */
export const PROJECT_KB = 'project'

/**
 * How much a transcript must grow before it is re-indexed.
 *
 * [[DOC-39]] §4.2 batches transcripts "every ~N thousand characters" — the same
 * unit [[DOC-10]] §5.1 already uses for the tail, rather than per turn. Per turn
 * would re-embed a whole conversation on every exchange for a document whose
 * meaning has barely moved; never would leave a session unable to search its own
 * earlier turns. Configurable, and to be tuned against real corpora.
 */
export const TRANSCRIPT_INDEX_CHARS = 4000

/**
 * How large the enumerated listing may be before the corpus is clustered instead.
 *
 * THE FLOOR IS THE BETTER CASE, NOT THE DEGRADED ONE ([[DOC-39]] §7). A map
 * exists only because a corpus does not fit in a prompt; it is a lossy summary
 * accepted under duress. A new tenant with three documents does fit, and
 * clustering three documents into territories invents topology — which then
 * becomes the first thing the assistant ever learns about that client. So below
 * the floor the landscape is a *complete listing*, and it says so.
 *
 * A CHARACTER BUDGET, NOT A DOCUMENT COUNT, because "small enough to enumerate"
 * is a statement about the prompt and not about arithmetic. ~1KB is roughly a
 * dozen entries.
 *
 * (This ticket's own body proposed ~200 characters of body per entry inside a
 * 2–4KB budget. [[DOC-39]] §7 settles it the other way and is the specification:
 * an excerpt conveys content, which §6.1 says is not the listing's job, and the
 * titles here are unusually good because [[DOC-38]] §6 gives every project-KB
 * entry an AI-written title over an AI-written body. The excerpt survives only as
 * a per-entry fallback — see {@link enumeratedLandscape}.)
 */
export const ENUMERATE_BUDGET_CHARS = 1024

/** Characters of body used when a title is too uninformative to stand alone. */
export const FALLBACK_EXCERPT_CHARS = 120

/**
 * Territory sizing above the floor, copied in spirit from `kb.ts` so the two
 * maps are shaped alike: about one territory per two documents, floored and
 * ceilinged so a mid-sized corpus is neither one bucket nor a list again.
 */
const TERRITORY_DIVISOR = 2
const MIN_TERRITORIES = 2
const MAX_TERRITORIES = 15

/** Where the transcript batching cursors live — beside the index, not in it. */
export const TRANSCRIPT_CURSORS_FILE = 'transcripts.json'

/**
 * Where a tenant's index lives in R2.
 *
 * `BLOBS`, NEVER `SITES`, and for exactly the reason `wrangler.toml` gives for
 * the attachment bucket: `1stcontact-sites` is bound by the Worker whose job is
 * serving bytes to the public internet by path, and this index is a derivative of
 * the client's private material — a vector per brand guideline, a body snippet
 * per positioning paper. It is not servable and must live where nothing can serve
 * it. `kb/` also sits outside `t/<tenant>/blob/`, which is the only prefix the
 * blob store composes, so no attachment key can name it and it can name none.
 */
export function indexPrefix(tenantId: string, kb = PROJECT_KB, part = 'index'): string {
  return `kb/${tenantId}/${kb}/${part}/`
}

/**
 * The component's `IndexSource` over an R2 bucket.
 *
 * The port is four methods — `readBytes` / `readText` / `writeBytes` /
 * `writeText` — and that narrowness is the whole point of it: the system KB's
 * index is a directory of files, this one is a handful of R2 objects, and the
 * build and search code above both cannot tell. A missing object reads as `null`
 * rather than throwing, which is what makes "there is no index yet" an ordinary
 * state the first build starts from.
 */
export function r2IndexSource(bucket: R2Bucket, prefix: string): Untyped {
  const key = (name: string): string => `${prefix}${name}`
  return {
    async readBytes(name: string): Promise<Uint8Array | null> {
      const object = await bucket.get(key(name))
      return object ? new Uint8Array(await object.arrayBuffer()) : null
    },
    async readText(name: string): Promise<string | null> {
      const object = await bucket.get(key(name))
      return object ? await object.text() : null
    },
    async writeBytes(name: string, bytes: Uint8Array): Promise<void> {
      // Copied into a buffer of its own: `encodeEmbeddings` may hand back a view
      // over a larger allocation, and R2 stores the whole buffer behind a view.
      await bucket.put(key(name), bytes.slice().buffer)
    },
    async writeText(name: string, text: string): Promise<void> {
      await bucket.put(key(name), text)
    },
  }
}

/**
 * Where a deferred rebuild goes.
 *
 * INJECTED, BECAUSE THIS SHIPS A DRIVEN OPERATION AND NOT A SCHEDULER. In a
 * Worker the answer is `ctx.waitUntil`; in a queue consumer it is "just await
 * it"; in a test it is a list. Whether the rebuild eventually runs on a queue, a
 * cron or trailing the request is an open question on the ticket, and hard-wiring
 * one here would answer it by accident.
 *
 * The default drops the result on the floor, which is right for a map: a failed
 * rebuild leaves the previous one in place and the next write tries again.
 */
export type Deferral = (work: Promise<unknown>) => void

const DEFAULT_DEFERRAL: Deferral = (work) => {
  void work.catch(() => {})
}

/** One paragraph of the map, written by whatever model the host reached. */
export type Describe = (prompt: string) => Promise<string> | string

export class DescriberNotConfiguredError extends Error {
  readonly name = 'DescriberNotConfiguredError'
  constructor(documents: number) {
    super(
      `The project corpus has grown to ${documents} documents — past the ` +
        `${ENUMERATE_BUDGET_CHARS}-character listing budget — so its landscape has to be ` +
        'clustered and described, and no `describe` seam was supplied. The knowledge ' +
        "component's own describer lives behind its `ai-knowledge/describe` entry point, " +
        'which is Node-only because it needs the provider backends; a Worker has to hand ' +
        'one in. Until then the map is not rebuilt and the previous one stands.',
    )
  }
}

export class AiNotConfiguredError extends Error {
  readonly name = 'AiNotConfiguredError'
  constructor() {
    super(
      'The AI binding is not configured, so the project knowledge base has no ' +
        'embedder and nothing can be indexed or searched. Declare it in ' +
        'apps/control-app/wrangler.toml, under [ai] for `wrangler dev` and again ' +
        'under [env.production.ai], which does not inherit it. The model is ' +
        'Workers AI’s bge-small-en-v1.5 — the same one the system KB indexes ' +
        'with, so the two agree by construction.',
    )
  }
}

/** The bindings the project KB needs on top of the ticket store's. */
export interface ProjectKnowledgeEnv extends TicketStoreEnv {
  /** Workers AI. Absent is a configuration error, not a degradation. */
  AI?: { run(model: string, input: unknown): Promise<unknown> }
}

/** One search hit, as the component ranks it. */
export interface KnowledgeHit {
  uid: string
  type: string
  title: string
  score: number
  kbs: string[]
  body_snippet: string
  updated_at: string
}

/** What one landscape build produced. */
export interface LandscapeBuild {
  /** `enumerated` below the floor, `clustered` above it — [[DOC-39]] §7. */
  mode: 'enumerated' | 'clustered'
  body: string
  documents: number
}

/** What one index refresh did. `embedded` counts vectors actually computed. */
export interface IndexRefresh {
  documents: number
  embedded: number
  kept: number
  chunks: number
}

/**
 * The project KB, bound to one tenant.
 *
 * TENANCY IS BOUND ONCE, INTO THE HANDLE, and never passed per call — the rule
 * `tickets.ts` states and this inherits rather than restates. Every read and
 * write goes through the scoped `TicketStore` it was constructed with, and the
 * index lives under a key prefix derived from the same tenant id, so there is no
 * argument anywhere on this class that could name another account. That is
 * [[DOC-10]] §4.1's information barrier holding at the second layer: the ticket
 * store isolates the rows, and this isolates the vectors derived from them.
 *
 * The KB scope and the store scope are the same shape at different strengths.
 * The tenant is a hard barrier; the site is a predicate — and the difference is
 * deliberate, because two sites belonging to one client *should* share what has
 * been learned about that client.
 */
export class ProjectKnowledge {
  readonly store: TicketStore
  readonly kb: Untyped
  readonly kbs: Map<string, Untyped>
  readonly index: Untyped
  readonly chunks: Untyped
  readonly embedder: Untyped
  readonly defer: Deferral
  readonly transcriptChars: number
  readonly enumerateBudget: number

  constructor(opts: {
    store: TicketStore
    kb: Untyped
    index: Untyped
    chunks: Untyped
    embedder: Untyped
    defer?: Deferral
    transcriptChars?: number
    enumerateBudget?: number
  }) {
    this.store = opts.store
    this.kb = opts.kb
    // The one KB this host serves, as its own map — the shape every library call
    // takes. Handing the whole declaration file in would ask the component to
    // resolve `system` against a store this Worker does not have, which
    // `storeFor` would rightly refuse.
    this.kbs = new Map([[PROJECT_KB, opts.kb]])
    this.index = opts.index
    this.chunks = opts.chunks
    this.embedder = opts.embedder
    this.defer = opts.defer ?? DEFAULT_DEFERRAL
    this.transcriptChars = opts.transcriptChars ?? TRANSCRIPT_INDEX_CHARS
    this.enumerateBudget = opts.enumerateBudget ?? ENUMERATE_BUDGET_CHARS
  }

  /** The corpus, resolved through the ticket API and nothing else. */
  async corpus(): Promise<Ticket[]> {
    return (await resolveCorpus(this.store, this.kb)) as Ticket[]
  }

  /**
   * Search this tenant's knowledge.
   *
   * Scoped by construction rather than by argument: the store is the tenant's and
   * the index is the tenant's, so there is no `tenant` parameter to get wrong.
   */
  async search(query: string, { topK = 5 }: { topK?: number } = {}): Promise<KnowledgeHit[]> {
    return (await kmSearch(query, {
      source: this.index,
      store: this.store,
      kbs: this.kbs,
      kb: PROJECT_KB,
      topK,
      embedder: this.embedder,
    })) as KnowledgeHit[]
  }

  /**
   * Bring the index up to date — the change-feed consumer, not a rebuild.
   *
   * THERE IS NO "REINDEX THE PROJECT KB" IN NORMAL RUNNING. The component's
   * manifest records `uid -> updated_at`, so a ticket whose timestamp has not
   * moved keeps its vector and only genuinely changed tickets are re-embedded.
   * That is what makes indexing affordable on every write instead of on a
   * cadence, and it is why `onMaterialWritten` can do it inline.
   */
  async refreshIndex(): Promise<IndexRefresh> {
    const stats = (await buildIndex(this.store, this.kbs, this.index, {
      embedder: this.embedder,
    })) as { total: number; added: number; kept: number }
    const chunkStats = (await buildChunkIndex(this.store, this.kbs, this.chunks, {
      embedder: this.embedder,
    })) as { chunks: number }
    return {
      documents: stats.total,
      embedded: stats.added,
      kept: stats.kept,
      chunks: chunkStats.chunks,
    }
  }

  /**
   * The landscape: a complete listing below the floor, a clustered map above it.
   *
   * The two are the same artefact to everything downstream — one awareness-report
   * ticket, read by ordinary priming — which is what makes the switch a local
   * decision rather than a second code path through the session.
   */
  async landscape({ describe = null }: { describe?: Describe | null } = {}): Promise<LandscapeBuild> {
    const corpus = await this.corpus()
    const listing = enumeratedLandscape(corpus, this.kb)
    if (listing.entryChars <= this.enumerateBudget) {
      return { mode: 'enumerated', body: listing.body, documents: corpus.length }
    }
    if (describe === null) throw new DescriberNotConfiguredError(corpus.length)
    return {
      mode: 'clustered',
      body: await this.clusteredLandscape(corpus, describe),
      documents: corpus.length,
    }
  }

  /**
   * Cluster, describe, validate — the component's own pipeline, composed here.
   *
   * THE VECTORS ARE READ BACK OUT OF THE INDEX rather than re-embedded. The map
   * has to be clustered in the same vector space the reader searches, and
   * embedding twice is the one reliable way to end up with two.
   *
   * THE ACCESS-POINT CHECK RUNS THE READER'S OWN SEARCH — same index, same
   * ranking, same KB scope. A map whose doors were validated by a different query
   * path would promise routes that do not exist for the agent that follows them.
   */
  private async clusteredLandscape(corpus: Ticket[], describe: Describe): Promise<string> {
    const { embeddings, metadata } = (await loadIndex(this.index)) as {
      embeddings: Untyped[] | null
      metadata: Array<{ uid: string }>
    }
    const vectors = new Map((metadata ?? []).map((row, i) => [row.uid, (embeddings ?? [])[i]]))
    const docs = documentsFromTickets(corpus, vectors) as Untyped[]

    const find = async (query: string): Promise<string[]> =>
      (await this.search(query, { topK: 5 })).map((hit) => hit.uid)

    const wanted = Math.max(
      MIN_TERRITORIES,
      Math.min(MAX_TERRITORIES, Math.floor(docs.length / TERRITORY_DIVISOR)),
    )
    const report = (await buildAwareness(docs, this.kb, {
      describe,
      search: find,
      clusterer: agglomerativeClusterer({
        nClusters: Math.min(wanted, docs.length),
        // A count was asked for, so the distance guard must not veto it.
        maxDistance: Infinity,
      }),
      describer: 'the host describe seam',
    })) as { body: string }
    return report.body
  }

  /**
   * Build the landscape and publish it as this tenant's awareness report.
   *
   * The report is recycled in place — one `system`/`awareness_report` ticket per
   * KB, body replaced wholesale — so anything holding a reference keeps pointing
   * at the current map and a rebuild is honest: regenerated, never patched.
   */
  async rebuildMap(
    opts: { describe?: Describe | null } = {},
  ): Promise<LandscapeBuild & { uid: string }> {
    const built = await this.landscape(opts)
    const ticket = (await publishAwarenessReport(this.store, this.kb, built.body)) as Ticket
    return { ...built, uid: ticket.uid }
  }

  /** The published map, or `null` when none has been built yet. */
  async publishedMap(): Promise<Ticket | null> {
    return (await findAwarenessReport(this.store, PROJECT_KB)) as Ticket | null
  }

  /**
   * A `material`, `reference` or `brief` arrived — index now, rebuild behind.
   *
   * AN UPLOAD IS A REQUEST FOR ATTENTION ([[DOC-39]] §4.2). The client is not
   * adding a document to be thorough; they want to talk about it now. That is a
   * different event from a conversation lengthening and it earns a different
   * response — a territory description that may genuinely change.
   *
   * The order is the whole design. The index refresh is awaited, so the document
   * is searchable the instant this returns; the map goes to {@link Deferral}, so
   * the turn does not pay for an LLM call per territory. Search needs only the
   * index, which is what makes that decomposition available at all — the
   * assistant is never blocked and never blind.
   *
   * @returns the refresh that already happened, and the rebuild that has not, so
   *   a caller that does want to wait (a queue consumer, a test) can.
   */
  async onMaterialWritten(
    opts: { describe?: Describe | null } = {},
  ): Promise<{ index: IndexRefresh; rebuild: Promise<LandscapeBuild & { uid: string }> }> {
    const index = await this.refreshIndex()
    const rebuild = this.rebuildMap(opts)
    this.defer(rebuild)
    return { index, rebuild }
  }

  /**
   * A transcript grew — index if it has grown enough, and NEVER touch the map.
   *
   * Both halves are load-bearing. The batching is what stops a whole conversation
   * being re-embedded on every exchange; the silence about the map is what stops
   * the expensive clock being driven by the fast one. Describing a "conversations
   * with this client" territory has approximately zero marginal value against a
   * real describe cost — the AI is sitting in one.
   *
   * THE CURSOR LIVES BESIDE THE INDEX, not on the chat ticket. It is derived
   * data, exactly like the assignment map the component tells its callers to
   * persist there, and putting it in `fields` would make a bookkeeping counter
   * part of a ticket type the AI component owns.
   *
   * @param uid the `chat` ticket whose transcript grew
   * @param chars its current length
   */
  async onTranscriptGrew(
    uid: string,
    chars: number,
  ): Promise<{ indexed: boolean; grown: number; index: IndexRefresh | null }> {
    const cursors = await this.transcriptCursors()
    const grown = chars - (cursors[uid] ?? 0)
    if (grown < this.transcriptChars) return { indexed: false, grown, index: null }
    const index = await this.refreshIndex()
    cursors[uid] = chars
    await this.index.writeText(TRANSCRIPT_CURSORS_FILE, JSON.stringify(cursors))
    return { indexed: true, grown, index }
  }

  /** `chatUid -> characters at the last index pass`. Absent reads as empty. */
  async transcriptCursors(): Promise<Record<string, number>> {
    const text = await this.index.readText(TRANSCRIPT_CURSORS_FILE)
    if (typeof text !== 'string' || text.trim() === '') return {}
    try {
      const parsed: unknown = JSON.parse(text)
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {}
    } catch {
      // A corrupt cursor file costs one extra index pass, which is wasteful and
      // never wrong — re-embedding an unchanged ticket is a no-op by manifest.
      // Failing the turn over it would be the more expensive answer.
      return {}
    }
  }
}

/**
 * A title that cannot stand alone in a listing.
 *
 * [[DOC-38]] §6 gives every project-KB entry an AI-written title over an
 * AI-written body — a `material` ticket is not called `Notes.pdf` — so the
 * enumerated listing is titles, and this is the narrow exception [[DOC-39]] §7
 * allows: a bare filename, or nothing at all. Detected mechanically rather than
 * judged, because the fallback is a per-entry rescue and not a default for all of
 * them.
 */
export function uninformativeTitle(title: string): boolean {
  const trimmed = (title ?? '').trim()
  return trimmed === '' || /^\S+\.[A-Za-z0-9]{1,5}$/.test(trimmed)
}

/** One line of body, collapsed and clipped, for the fallback above. */
function excerpt(body: string, limit = FALLBACK_EXCERPT_CHARS): string {
  const flat = (body ?? '').replace(/\s+/g, ' ').trim()
  return flat.length > limit ? `${flat.slice(0, limit).trimEnd()}…` : flat
}

/**
 * The complete listing, and the claim that it is complete.
 *
 * LABELLING IT AS COMPLETE IS NOT DECORATION. A short list read as "knowledge
 * here is thin" produces very different behaviour in front of a new client than
 * the same list read as "you know everything there is" — and the second reading
 * is the true one. This is the sentence that carries it.
 *
 * NOTHING IS BOLDED, deliberately. The component treats a bolded term in a
 * landscape as a *validated search access point* — one demonstrably shown to
 * retrieve the territory it appears in — and the clustered path earns that claim
 * by running the reader's own search per candidate. A listing has no territories
 * and no routing problem to solve: every document is named. Bolding titles here
 * would make an unearned promise in the component's own vocabulary, so priming
 * correctly finds no access points and the reader is told to search directly.
 *
 * `entryChars` measures the ENTRIES, not the whole document: the budget is
 * "does the listing fit", and charging it for a heading and a KB description
 * would make the floor drift with unrelated prose.
 */
export function enumeratedLandscape(
  corpus: Ticket[],
  kb: { name: string; description?: string },
): { body: string; entryChars: number } {
  const entries = corpus.map((ticket) => {
    const kind = typeof ticket.fields?.kind === 'string' ? `/${ticket.fields.kind}` : ''
    const title = uninformativeTitle(ticket.title)
      ? `${(ticket.title ?? '').trim() || '(untitled)'} — ${excerpt(ticket.body)}`
      : ticket.title.trim()
    return `- ${title} (${ticket.type}${kind}, ${ticket.uid})`
  })
  const entryChars = entries.reduce((n, line) => n + line.length + 1, 0)

  const lines = [`# Awareness map: ${kb.name}`, '']
  if (kb.description) lines.push(`*${kb.description}*`, '')
  lines.push(
    corpus.length === 0
      ? 'This client has no material yet. Nothing has been uploaded, captured or ' +
          'decided, so there is nothing here to search — ask for what you need.'
      : `Complete listing of ${corpus.length} document(s). This client's corpus is ` +
          'small enough to list in full, so what follows is everything there is — not a ' +
          'summary of it, and not a sample. There are no territories to route between ' +
          'and no access points to follow: search by whatever you actually need.',
    '',
    'Machine-generated and recycled on every rebuild — do not hand-edit.',
    '',
    ...entries,
  )
  return { body: `${lines.join('\n').replace(/\s+$/, '')}\n`, entryChars }
}

/**
 * The `project` knowledge base, as declared.
 *
 * PARSED, NOT PARAPHRASED — the rule `kb.ts` records and the reason it gives:
 * an earlier version there read one field from the file and hand-constructed the
 * rest, which meant editing the declared corpus predicate changed nothing. A
 * declaration that is not the thing actually used is worse than no declaration.
 */
export function projectKb(): Untyped {
  const kbs = knowledgeBasesFromMapping(KB_CONFIG) as Map<string, Untyped>
  const kb = kbs.get(PROJECT_KB)
  if (kb === undefined) {
    throw new Error(
      `kb/knowledge_bases.json declares no knowledge base '${PROJECT_KB}' ` +
        `(declared: ${[...kbs.keys()].sort().join(', ') || 'none'}).`,
    )
  }
  return kb
}

/**
 * Open the project KB for this request.
 *
 * Everything it needs is already tenant-bound or derived from the tenant id, so
 * there is one place the account is named and it is `TENANT_ID` — the same
 * single point `ticketStoreFor` uses.
 */
export async function projectKnowledgeFor(
  env: ProjectKnowledgeEnv,
  opts: {
    store?: TicketStore
    embedder?: Untyped
    defer?: Deferral
    transcriptChars?: number
    enumerateBudget?: number
  } = {},
): Promise<ProjectKnowledge> {
  const store = opts.store ?? (await ticketStoreFor(env))
  const tenantId = (env.TENANT_ID ?? '').trim()
  if (!env.BLOBS) {
    // `ticketStoreFor` already refuses this, so reaching it means a store was
    // injected without one. Named rather than left to throw on `undefined`.
    throw new Error(
      'The project knowledge index needs the BLOBS binding: it is where the ' +
        "tenant's vectors live, and it is deliberately not SITES.",
    )
  }
  let embedder = opts.embedder
  if (embedder === undefined) {
    if (!env.AI) throw new AiNotConfiguredError()
    embedder = new WorkersAiEmbedder({ binding: env.AI })
  }
  return new ProjectKnowledge({
    store,
    kb: projectKb(),
    index: r2IndexSource(env.BLOBS, indexPrefix(tenantId, PROJECT_KB, 'index')),
    chunks: r2IndexSource(env.BLOBS, indexPrefix(tenantId, PROJECT_KB, 'chunks')),
    embedder,
    defer: opts.defer,
    transcriptChars: opts.transcriptChars,
    enumerateBudget: opts.enumerateBudget,
  })
}
