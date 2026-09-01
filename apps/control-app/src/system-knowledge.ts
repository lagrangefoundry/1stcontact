import { KB } from './generated/kb.js'
import {
  KnowledgeDocs,
  KnowledgeRuntime,
  KnowledgeToolbox,
  knowledgeInstanceConfig,
} from './generated/ai-knowledge'
import {
  WorkersAiEmbedder,
  knowledgeBasesFromMapping,
  memoryIndexSource,
} from './generated/knowledge'
import { DocDirStore, bundleDocReader } from './generated/ticketing'
import { CORPUS_TYPE, SHIPPED_SOURCE, SYSTEM_KB } from '../../../tools/generate/src/cli/kb-model'
import KB_CONFIG from '../../../kb/knowledge_bases.json'

/**
 * The SYSTEM knowledge base, in workerd (REQ-158) — [[DOC-39]] §3; [[DOC-10]] §5.1.
 *
 * THE PEER OF `kb.ts`'s `openKnowledgeRuntime`, AND THE POINT OF THE SEAMS. That
 * function opens the same knowledge base from two directories on a disk. This one
 * opens it from three values in the bundle. Neither the corpus resolution, the
 * ranking, nor the tool surface above them can tell which it got — which is what
 * the component's `IndexSource` and doc-reader ports are for, and why moving the
 * index to R2 later would be a swap rather than a rewrite.
 *
 * THE OTHER HALF IS `knowledge.ts`, and the two must not be confused. That file
 * is the *project* KB: the client's own conversations, uploads and captures,
 * living in the tenant's D1 store, written continuously, indexed into R2 per
 * tenant. This one is *ours*: the design documents, exported to a directory at
 * release time, indexed once, byte-identical for every client, and above the
 * tenancy barrier entirely — there is no tenant id anywhere in this file, because
 * there is nothing here that could differ per account.
 *
 * WHY BUNDLE-RESIDENT IS RIGHT HERE AND WOULD BE WRONG THERE. A shipped corpus
 * is a release artefact: it changes when the software does, so carrying it in the
 * bundle costs a little size and buys a query path with no network on it at all.
 * A tenant corpus is neither fixed nor shared, so the same choice would be wrong
 * on both counts. [[DOC-39]] §3 states the split; this is the shipped side of it.
 *
 * THE MODEL IS THE SAME MODEL ON BOTH SIDES, and that is a correctness property
 * rather than a convenience. `1c kb build` embeds the corpus with Workers AI's
 * `bge-small-en-v1.5` over REST; `WorkersAiEmbedder({binding: env.AI})` is the
 * same model reached in-datacentre. Vectors from two different models are not
 * comparable and the failure mode is not an error but plausible-looking nonsense.
 *
 * THE ABSENT CASE IS ORDINARY AND MUST STAY ORDINARY. An operator who has never
 * run `1c kb build` gets `KB === null`, {@link systemKnowledge} returns `null`,
 * and the session opens with the tool manual and no knowledge surface — the
 * assistant this Worker had before this ticket. What must never happen is a boot
 * failure, which is why `1c assets` writes the module unconditionally.
 */

/** The library is untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

export { SYSTEM_KB }

/** The bindings the system KB needs: the embedding model, and nothing else. */
export interface SystemKnowledgeEnv {
  /** Workers AI. Absent degrades to no knowledge, exactly as an unbuilt KB does. */
  AI?: { run(model: string, input: unknown): Promise<unknown> }
}

/** The shape `1c assets` inlines — `kb.ts`'s `KbBundle`, seen from this side. */
export interface SystemKbBundle {
  index: Record<string, string>
  chunks: Record<string, string>
  docs: Record<string, { text: string; updated_at: string }>
}

/**
 * The `system` knowledge base, as declared.
 *
 * PARSED, NOT PARAPHRASED — the rule `kb.ts` records, the reason it gives, and
 * the same `kb/knowledge_bases.json` `projectKb()` reads. An earlier version
 * there read one field from the file and hand-constructed the rest, which meant
 * editing the declared corpus predicate changed nothing: the file said one thing
 * and the code built another, with no error to notice.
 *
 * ONE DECLARATION FILE, TWO KBs, AND EACH HOST SERVES WHAT IT CAN RESOLVE. The
 * same file declares `project` beside `system`; this Worker now has the store for
 * both, but they are opened separately and each is handed to the library as its
 * own one-entry map, because they are searched through different indexes and one
 * of them is per-tenant.
 */
export function systemKb(): Untyped {
  const kbs = knowledgeBasesFromMapping(KB_CONFIG) as Map<string, Untyped>
  const kb = kbs.get(SYSTEM_KB)
  if (kb === undefined) {
    throw new Error(
      `kb/knowledge_bases.json declares no knowledge base '${SYSTEM_KB}' ` +
        `(declared: ${[...kbs.keys()].sort().join(', ') || 'none'}).`,
    )
  }
  return kb
}

/**
 * The corpus store over a bundled KB — a `DocDirStore` with no directory.
 *
 * `DocDirStore` is reader-agnostic by design, so this is the same store the build
 * uses with the same `type` predicate; only the reader differs. It has no
 * `create` and no `update`, structurally, which is what makes a shipped corpus
 * read-only without anybody having to enforce it.
 */
export function bundleStore(bundle: SystemKbBundle): Untyped {
  return new DocDirStore(bundleDocReader(bundle.docs), { type: CORPUS_TYPE })
}

/**
 * Open the system knowledge runtime, or `null` when there is nothing to open.
 *
 * Two ways to get `null`, and both are degradations rather than failures:
 * the KB was never built (`KB === null`), or the AI binding is absent so there is
 * no embedder to search with. Neither may throw — a builder that cannot answer a
 * question about the design documents is still a builder, whereas one that will
 * not boot is not.
 *
 * (`knowledge.ts` raises `AiNotConfiguredError` for the missing binding instead,
 * and the difference is deliberate rather than an inconsistency. There, the
 * binding is the *only* way a client's own uploads become findable at all, and a
 * silent failure would leave material indexed nowhere. Here the corpus is
 * optional to begin with.)
 *
 * @param opts.bundle a corpus to open instead of the built-in one — the seam the
 *   UATs use to plant a document with a known answer, and the same shape
 *   `1c assets` emits.
 * @param opts.embedder the model seam; must be the one the index was built with.
 */
export async function systemKnowledge(
  env: SystemKnowledgeEnv,
  opts: { bundle?: SystemKbBundle | null; embedder?: Untyped } = {},
): Promise<Untyped | null> {
  const bundle = (opts.bundle ?? (KB as SystemKbBundle | null)) as SystemKbBundle | null
  if (bundle === null) return null
  let embedder = opts.embedder
  if (embedder === undefined) {
    if (!env.AI) return null
    embedder = new WorkersAiEmbedder({ binding: env.AI })
  }
  const store = bundleStore(bundle)
  const kb = systemKb()
  return KnowledgeRuntime.open({
    store,
    kbs: new Map([[SYSTEM_KB, kb]]),
    source: memoryIndexSource(bundle.index),
    chunkSource: memoryIndexSource(bundle.chunks),
    embedder,
    // The KB declares `source: shipped`, so the library resolves its corpus
    // against the store named here rather than against a project store that has
    // never heard of these uids.
    sources: { [SHIPPED_SOURCE]: store },
  })
}

/**
 * The tool surface and the grant that travels with it, for a runtime.
 *
 * Extracted so the two hosts construct it identically: `host.ts` does exactly
 * this on Node, and a second spelling of `knowledgeInstanceConfig([SYSTEM_KB])`
 * would be a second answer to "which knowledge bases may this session reach".
 */
export function knowledgeSurfaceFor(runtime: Untyped): {
  surface: Untyped
  granted: Record<string, unknown>
} {
  return {
    surface: new KnowledgeToolbox(runtime),
    // `knowledgeInstanceConfig` at the package root; `instanceConfig` is the name
    // inside the module it comes from.
    granted: knowledgeInstanceConfig([SYSTEM_KB]) as Record<string, unknown>,
  }
}

/**
 * The role's priming source: the MAP, not the pile ([[DOC-10]] §5.1).
 *
 * A FACTORY over the constructed Toolbox, because the priming's last section is
 * the tool manual and the manual is a projection of THIS session's actual grant.
 * KM owns the internal order — landscape, then role purpose, then mechanism —
 * because the last thing the agent reads is the first thing it does.
 *
 * SEARCH WITHOUT PRIMING IS THE SAME FAILURE AS NO SEARCH. A session handed the
 * knowledge tools and no landscape has no reason to believe there is anything to
 * find, so it never looks. The two are built from one runtime and are wired as a
 * pair or not at all.
 */
export function knowledgePriming(
  runtime: Untyped,
  rolePurpose: string,
): (box: Untyped) => Promise<Untyped> {
  return (box: Untyped) =>
    KnowledgeDocs.open(runtime, { rolePurpose, mechanism: box.manual() })
}
