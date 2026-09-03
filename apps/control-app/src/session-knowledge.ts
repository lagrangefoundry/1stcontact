import {
  KnowledgeDocs,
  KnowledgeRuntime,
  KnowledgeToolbox,
  knowledgeInstanceConfig,
} from './generated/ai-knowledge'
import {
  DEFAULT_CHUNKS_PER_HIT,
  DEFAULT_TOP_K,
  search as kmSearch,
  searchChunks as kmSearchChunks,
} from './generated/knowledge'
import { PROJECT_KB, projectKnowledgeFor, type ProjectKnowledgeEnv } from './knowledge'
import type { Scope } from './scope'
import {
  SHIPPED_SOURCE,
  SYSTEM_KB,
  systemKnowledge,
  type SystemKnowledgeEnv,
} from './system-knowledge'
import { projectKb } from './knowledge'
import type { TicketStore } from './tickets'

/**
 * The session's knowledge, across BOTH knowledge bases ([[REQ-160]]; [[DOC-39]] §6).
 *
 * [[REQ-158]] gave a session the system corpus and [[REQ-159]] gave the tenant a
 * corpus of their own. Until this file they were two things a Worker could open
 * and never one thing a session could reach. This composes them.
 *
 * ONE LANDSCAPE SECTION, NOT TWO, and it is the whole reason the composition
 * happens here rather than by handing the session two surfaces. Splitting the
 * maps would recreate what [[DOC-10]] §5.2 removed when it merged the transcript
 * tools into the knowledge surface: the AI having to know which *kind* of thing
 * it was looking for before it could look. A question half-answered by a design
 * document and half by the client's own paper must return both, ranked together.
 *
 * PROJECT MAP FIRST, THEN SYSTEM ([[DOC-39]] §6.2). The client's material is what
 * the session is about, and the role purpose already frames standing capability.
 * The order is the `kbs` map's insertion order, which `loadLandscapes` preserves,
 * so it is one line and cheap to flip.
 *
 * THE KNOWLEDGE BASES STAY INDEPENDENT. Two corpora, two stores, two indexes,
 * two build cadences — the shipped one is bundle-resident and immutable, the
 * tenant's lives in R2 and changes during a conversation. Nothing here merges
 * those artefacts, and merging them would be the wrong answer at the layer that
 * matters: they would acquire one build clock and the shipped index would be
 * re-decoded every time a client uploaded a file. They meet at exactly one
 * point, which is where results are presented, and {@link CoRankedKnowledge} is
 * that point.
 */

/** The library is untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** The KBs a session reaches, in the order their maps are read (project first). */
export const SESSION_KBS = [PROJECT_KB, SYSTEM_KB] as const

/**
 * One search hit, merged. The component's own hit shape, which is why nothing
 * here reshapes it: `score` is what the merge sorts on, and a host that
 * re-derived a score would be a second answer to how hits are ordered.
 */
export interface RankedHit {
  uid: string
  title: string
  score: number
  kbs: string[]
  [key: string]: unknown
}

/**
 * Both knowledge bases, each with its own runtime, plus the composite view.
 *
 * `perKb` is what search fans out over; `composite` is what priming reads and
 * what the scope axes are enforced against. They are two views of the same two
 * runtimes and are built together so they cannot disagree about which KBs a
 * session has.
 */
export interface SessionKnowledge {
  /** `kb name -> KnowledgeRuntime`, in declaration order. */
  perKb: Map<string, Untyped>
  /** The runtime priming reads landscapes through, and `get` resolves against. */
  composite: Untyped
}

/**
 * The composite runtime.
 *
 * `store` IS THE TENANT'S, and `sources` carries the shipped corpus beside it.
 * That is not a preference between the two stores — it is how the component
 * routes: `storeFor` sends a KB declaring `source: shipped` to `sources.shipped`
 * and every other KB to the base store. So the project map is an ordinary ticket
 * read against D1, the system map is read out of the bundle, and one
 * `primeSession` call gets both without knowing there were two places to look.
 *
 * `source: null` WITH A `documents` MAP, deliberately. The composite has no
 * single index — that is the point of the two KBs staying independent — and
 * `KnowledgeToolbox.resolvers()` refuses a runtime holding an index it never
 * loaded, because an unloaded snapshot reads as *unconstrained* on the `document`
 * scope axis and would let a foreign uid through. Declaring no index and
 * supplying the merged snapshot says the true thing: there is nothing unloaded
 * here, and the axis is enforced off both indexes at once.
 */
function compositeRuntime(perKb: Map<string, Untyped>): Untyped {
  const kbs = new Map<string, Untyped>()
  const documents = new Map<string, string[]>()
  let store: Untyped = null
  const sources: Record<string, Untyped> = {}

  for (const [name, runtime] of perKb) {
    for (const [key, kb] of asMap(runtime.kbs)) kbs.set(key, kb)
    // A uid can be reachable through more than one KB — corpora are predicates,
    // not a partition — so the merge unions rather than overwrites. Losing a
    // name here would narrow the `document` axis and refuse a read the session
    // is entitled to.
    for (const [uid, names] of asMap(runtime.documents ?? new Map())) {
      documents.set(uid, [...new Set([...(documents.get(uid) ?? []), ...names])])
    }
    Object.assign(sources, runtime.sources ?? {})
    // The tenant's store is the base; the shipped corpus is reached by name.
    if (name !== SYSTEM_KB) store = runtime.store
  }
  // A session with only the shipped corpus still needs a base store to hand the
  // component, and its own is the honest one.
  if (store === null) store = perKb.get(SYSTEM_KB)?.store ?? null

  return new KnowledgeRuntime({ store, kbs, source: null, documents, sources })
}

function asMap(value: Untyped): Map<string, Untyped> {
  return value instanceof Map ? value : new Map(Object.entries(value ?? {}))
}

/**
 * The knowledge surface over two independent indexes.
 *
 * SEARCH FANS OUT AND MERGES ON THE COMPONENT'S OWN SCORES. Each knowledge base
 * is searched through its own runtime — its own index, its own store, its own
 * declared weight — so the full ranking the component defines runs within each,
 * shortlist cut and supersession demotion included. This class then sorts the
 * union by that score and takes the top `k`. It does not re-rank, re-weight or
 * re-score, because a second answer to "how are hits ordered" is exactly what
 * the component's search module opens by refusing to have.
 *
 * THE SCORES ARE COMPARABLE BY CONSTRUCTION, which is what makes the merge sound
 * rather than merely plausible: one embedding model across both indexes
 * (`bge-small-en-v1.5` — the property the component's search already requires,
 * and the reason `1c kb build` and the Worker share Workers AI), and one set of
 * ranking dials applied on both sides. Two models would make the comparison
 * meaningless and the failure would not be an error, it would be confident
 * nonsense.
 *
 * THIS IS THE INTERIM SHAPE. lagrange-framework REQ-112 asks the component for an
 * `IndexSource` per knowledge base, at which point `search` reads each in-scope
 * KB's own index and the merge happens inside the ranking rather than after it —
 * and this class deletes. Doing it here first is deliberate: the alternative was
 * concatenating two independent indexes into one artefact, which would have made
 * "independent knowledge bases" false in order to make one query work.
 *
 * `get` IS NOT OVERRIDDEN, because the base implementation is already right for
 * two KBs: it resolves the uid through the merged `documents` snapshot and reads
 * it from the store that uid's own knowledge base declares. That is the routing
 * `sources` exists for, and it is why one index spanning several KBs was always
 * the component's model even when a host only had one.
 */
export class CoRankedKnowledge extends KnowledgeToolbox {
  private readonly perKb: Map<string, Untyped>

  constructor(knowledge: SessionKnowledge) {
    super(knowledge.composite)
    this.perKb = knowledge.perKb
  }

  /** The runtimes a call reaches, in declaration order. `null` is all of them. */
  private inScope(kb: string | string[] | null): Array<[string, Untyped]> {
    if (kb === null || kb === undefined) return [...this.perKb]
    const names = typeof kb === 'string' ? [kb] : [...kb]
    return [...this.perKb].filter(([name]) => names.includes(name))
  }

  async search({
    query,
    kb = null,
    top_k = DEFAULT_TOP_K,
  }: {
    query: string
    kb?: string | string[] | null
    top_k?: number
  }): Promise<RankedHit[]> {
    // `_declared` first, so an undeclared KB name is the surface's own
    // `unknown_kb` rather than an empty result set that looks like a working
    // query returning nothing.
    return this._declared(kb, async () => {
      const perKb = await Promise.all(
        this.inScope(kb).map(([name, runtime]) =>
          kmSearch(query, {
            source: runtime.source,
            store: runtime.store,
            kbs: runtime.kbs,
            kb: name,
            topK: top_k,
            embedder: runtime.embedder,
            sources: runtime.sources,
          }),
        ),
      )
      return coRank(perKb as RankedHit[][], top_k)
    })
  }

  async chunk_search({
    query,
    kb = null,
    top_k = DEFAULT_TOP_K,
    chunks_per_hit = DEFAULT_CHUNKS_PER_HIT,
  }: {
    query: string
    kb?: string | string[] | null
    top_k?: number
    chunks_per_hit?: number
  }): Promise<RankedHit[]> {
    return this._declared(kb, async () => {
      const perKb = await Promise.all(
        this.inScope(kb).map(([name, runtime]) =>
          kmSearchChunks(query, {
            source: runtime.chunkSource,
            store: runtime.store,
            kbs: runtime.kbs,
            kb: name,
            topK: top_k,
            chunksPerHit: chunks_per_hit,
            embedder: runtime.embedder,
            sources: runtime.sources,
          }),
        ),
      )
      return coRank(perKb as RankedHit[][], top_k)
    })
  }
}

/**
 * Merge per-KB hit lists into one ranked list.
 *
 * A STABLE SORT ON THE COMPONENT'S SCORE, and stability is the tie-break rather
 * than a second rule: `Array.prototype.sort` is stable, and the lists arrive in
 * KB declaration order, so two hits scoring identically come back project-first.
 * That is the same precedence the landscape uses and it needs no code.
 *
 * The union is cut to `topK` AFTER merging, not before — each side already
 * returned its own top `k`, and taking `k` of the union is what makes the result
 * the same one a single index over both corpora would have produced.
 */
export function coRank(perKb: RankedHit[][], topK: number): RankedHit[] {
  return perKb
    .flatMap((hits) => hits ?? [])
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

/** What opening both knowledge bases needs — the union of the two halves. */
export interface SessionKnowledgeEnv extends ProjectKnowledgeEnv, SystemKnowledgeEnv {}

/**
 * Open both knowledge bases for one chat host.
 *
 * DEGRADATION IS PER KB AND IS SYMMETRIC HERE, which is the one place it differs
 * from `knowledge.ts` — deliberately, and the difference is worth stating rather
 * than reading as an inconsistency. There, an absent `AI` binding RAISES, because
 * that path is ingestion and an unindexed upload is invisible rather than merely
 * stale, so failing loudly is the only honest answer. Here the binding is the
 * embedder for *queries*, and without one there is nothing to search in either
 * corpus — the system half has always answered `null` to exactly this, and a
 * session that opened for one KB and refused for the other would be a chat panel
 * that will not start because a search is unavailable.
 *
 * So: no embedder, no project KB; no built bundle, no system KB; neither, and
 * this answers `null`, which keeps the caller's existing rule intact — the
 * surface and the priming come as a pair or not at all.
 *
 * @param opts.system a pre-opened system runtime, or `null` for none. This is
 *   [[REQ-158]]'s injection seam reached through: the built-in corpus is the one
 *   `1c kb build` produced for THIS checkout, a release artefact a UAT cannot
 *   assert against, so a test hands in a corpus whose content it chose.
 * @param opts.embedder the model seam for the project half; must be the one its
 *   index was built with.
 * @param opts.tickets the tenant's ticket store, when the caller already holds
 *   one. The chat host does, and building a second would be a second archive.
 */
export async function sessionKnowledgeFor(
  env: SessionKnowledgeEnv,
  scope: Scope,
  opts: {
    system?: Untyped | null
    embedder?: Untyped
    tickets?: TicketStore
  } = {},
): Promise<SessionKnowledge | null> {
  const perKb = new Map<string, Untyped>()

  // PROJECT FIRST, and the order is load-bearing all the way down: it is this
  // map's insertion order that becomes the landscape's section order and the
  // co-ranked merge's tie-break.
  if (opts.embedder !== undefined || env.AI) {
    const project = await projectKnowledgeFor(env, scope, {
      ...(opts.tickets ? { store: opts.tickets } : {}),
      ...(opts.embedder !== undefined ? { embedder: opts.embedder } : {}),
    })
    perKb.set(
      PROJECT_KB,
      await KnowledgeRuntime.open({
        store: project.store,
        kbs: new Map([[PROJECT_KB, projectKb()]]),
        source: project.index,
        chunkSource: project.chunks,
        embedder: project.embedder,
      }),
    )
  }

  const system =
    opts.system !== undefined
      ? opts.system
      : await systemKnowledge(env, opts.embedder !== undefined ? { embedder: opts.embedder } : {})
  if (system !== null && system !== undefined) perKb.set(SYSTEM_KB, system)

  if (perKb.size === 0) return null
  return { perKb, composite: compositeRuntime(perKb) }
}

/**
 * The tool surface and the grant that travels with it.
 *
 * THE GRANT NAMES EXACTLY THE KBs THAT OPENED, not the two this file knows
 * about. A session granted `system` when the bundle was never built would be
 * told it can search a corpus that answers nothing — the failure `kb.ts`
 * describes as "a knowledge base reported as searchable and empty".
 */
export function sessionKnowledgeSurface(knowledge: SessionKnowledge): {
  surface: Untyped
  granted: Record<string, unknown>
} {
  return {
    surface: new CoRankedKnowledge(knowledge),
    granted: knowledgeInstanceConfig([...knowledge.perKb.keys()]) as Record<string, unknown>,
  }
}

/**
 * The role's priming source: both maps, in one landscape section.
 *
 * A FACTORY over the constructed Toolbox, because the priming's last section is
 * the tool manual and the manual is a projection of THIS session's actual grant
 * — the rule `system-knowledge.ts` states and this inherits. KM owns the
 * internal order: landscape, then role purpose, then mechanism and trigger,
 * because the last thing the agent reads is the first thing it does.
 *
 * PRIMING NEVER TOUCHES AN INDEX. `KnowledgeDocs.open` reads each KB's awareness
 * report through the ticket API and nothing else, which is why the composite
 * runtime can declare no index and still prime correctly — and why a map rebuilt
 * behind a turn is picked up on the next one with no new machinery. What that
 * does NOT give is a notification, which is what the per-turn delta is for.
 */
export function sessionPriming(
  knowledge: SessionKnowledge,
  rolePurpose: string,
): (box: Untyped) => Promise<Untyped> {
  return (box: Untyped) =>
    KnowledgeDocs.open(knowledge.composite, { rolePurpose, mechanism: box.manual({ level: 'summary' }) })
}

export { PROJECT_KB, SYSTEM_KB, SHIPPED_SOURCE }
