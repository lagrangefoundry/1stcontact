import { WorkersAiEmbedder } from './generated/knowledge'

/**
 * How this deployment reaches the embedding model ([[BUG-73]]).
 *
 * ONE PLACE DECIDES, and that is the whole of B1. Four sites used to answer
 * "can this deployment embed, and how" independently — `knowledge.ts` and
 * `system-knowledge.ts` each constructed an embedder, `session-knowledge.ts`
 * gated on `env.AI` to decide whether to open the project half, and
 * `router.ts`'s `defaultIndexer` gated on it again to decide whether an upload
 * could be indexed. Four answers is four places to update and three to forget,
 * and the forgetting is silent: a deployment that could embed but whose gate
 * said otherwise indexes nothing and reports nothing.
 *
 * TWO TRANSPORTS, ONE MODEL. `bge-small-en-v1.5` reached through the `AI`
 * binding in-datacentre, or the same model reached over Cloudflare's REST API
 * with a credential. They are interchangeable BECAUSE they are the same model:
 * search takes the dot product of a query vector and an index vector as their
 * cosine similarity, and vectors from two different models are not comparable —
 * the failure mode of getting that wrong is not an error but plausible-looking
 * nonsense. Switching transport here cannot switch model, because both spellings
 * name `MODEL_NAME` inside `WorkersAiEmbedder`.
 *
 * WHY THE REST TRANSPORT EXISTS AT ALL, given the binding is free and closer
 * (B2). `wrangler dev` cannot serve an `AI` binding locally — there is no model
 * in miniflare — so it proxies every call to a remote preview session it
 * established at the last worker reload. That session expires after a few
 * minutes and wrangler has no refresh timer: its only expiry handling fires on
 * re-upload. So a dev server left idle starts failing every embed with workerd's
 * sanitised `internal error; reference = …` and keeps failing until something
 * touches a file. The REST transport has no session to expire.
 *
 * THE PRODUCTION PATH IS UNTOUCHED (B3). Neither variable is set on a deployed
 * Worker — `wrangler.toml` is forbidden from naming them, see B5 and the UAT
 * that pins it — so {@link embedderFor} selects the binding there exactly as the
 * three constructor sites did before this module existed.
 */

/** The library is untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** What an embedder is, from this file's side: texts in, one vector each out. */
export interface Embedder {
  embed(texts: string[]): Promise<Untyped[]>
}

/**
 * The configuration {@link embedderFor} reads, on top of whatever else an env has.
 *
 * THE NAMES ARE `1c kb build`'s NAMES, deliberately. `resolveEmbedder` in
 * `tools/generate/src/cli/kb.ts` already reads `CLOUDFLARE_API_TOKEN` and
 * `CLOUDFLARE_ACCOUNT_ID` to embed the system KB against this same model. It is
 * the same credential reaching the same account for the same purpose, so a
 * second name for it would be a second thing to provision, rotate and forget.
 */
export interface EmbedderEnv {
  /** Workers AI, in-datacentre. The transport a deployed Worker uses. */
  AI?: { run(model: string, input: unknown): Promise<unknown> }
  /**
   * The Cloudflare account to embed in. REQUIRED alongside the token here,
   * unlike `1c kb build`, which discovers it from the token when it is absent.
   * A Worker has nowhere to cache a discovery, so the alternative would be a
   * REST round-trip on every cold start to learn a value that never changes.
   */
  CLOUDFLARE_ACCOUNT_ID?: string
  /** The Workers AI credential. A `.dev.vars` secret; never a `wrangler.toml` var. */
  CLOUDFLARE_API_TOKEN?: string
}

/** Which of the two transports an embedder is using, for the error messages. */
export type Transport = 'binding' | 'REST'

/**
 * Half the REST configuration, which is a mistake rather than a fallback (B4).
 *
 * FALLING BACK TO THE BINDING WOULD BE THE WORST ANSWER. An operator who set the
 * token and forgot the account id has told us plainly that they mean to use REST;
 * quietly using the binding instead leaves them with exactly the symptom they
 * were switching off — the remote preview session expiring mid-session — while
 * believing they had switched it off. So the incomplete pair is named back to
 * them at the moment they boot, rather than at the moment a search goes quiet.
 */
export class PartialAiCredentialError extends Error {
  readonly name = 'PartialAiCredentialError'
  constructor(missing: 'CLOUDFLARE_ACCOUNT_ID' | 'CLOUDFLARE_API_TOKEN') {
    const present =
      missing === 'CLOUDFLARE_API_TOKEN' ? 'CLOUDFLARE_ACCOUNT_ID' : 'CLOUDFLARE_API_TOKEN'
    super(
      `${present} is set but ${missing} is not, so Workers AI cannot be reached ` +
        'over REST. Both are needed together: the token is the credential and the ' +
        'account id is a path segment in the URL. Set both in ' +
        'apps/control-app/.dev.vars to embed over REST, or neither to use the AI ' +
        'binding. Falling back to the binding here would leave `wrangler dev` on ' +
        'the remote preview session you were switching off, failing every embed ' +
        'with `internal error; reference = …` once it expires ([[BUG-73]]).',
    )
  }
}

/**
 * An embedding call that failed, said out loud (B6).
 *
 * THE OPAQUE REFERENCE IS THE WHOLE PROBLEM. `internal error; reference =
 * 6knvuijid52gaa1eks2l9jl5` is workerd's SANITISED internal-error form: the
 * detail is discarded before anything wrangler writes can see it, so the console
 * carries a burst of correlation ids and nothing to correlate them with. There is
 * no stack, no request line, and no indication of which binding produced them —
 * BUG-73's diagnosis had to come from log timestamps and a binding inventory.
 *
 * WHAT THIS ADDS is the three facts the reference id cannot carry: which
 * TRANSPORT was in use, which KNOWLEDGE BASE was being embedded for, and — for
 * the binding — what an operator should actually do about it. The underlying
 * message is preserved rather than replaced, because on the REST side it is the
 * useful part (a 401 says the token is wrong) and on the binding side it is at
 * least the reference id, which is what a Cloudflare support ticket would ask
 * for.
 */
export class EmbeddingFailedError extends Error {
  readonly name = 'EmbeddingFailedError'
  /** The transport that failed, so a caller can branch without parsing prose. */
  readonly transport: Transport
  /** The knowledge base whose vectors were being computed. */
  readonly kb: string

  constructor(transport: Transport, kb: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause)
    super(
      `Embedding for the ${kb} knowledge base failed over the ${transport} ` +
        `transport: ${detail}` +
        (transport === 'binding' ? ` ${BINDING_ADVICE}` : ''),
      { cause },
    )
    this.transport = transport
    this.kb = kb
  }
}

/**
 * What to tell an operator whose binding call failed.
 *
 * NAMED SEPARATELY so the UAT can assert the advice reaches the message without
 * restating the sentence — a test that spells the prose out again passes when
 * both copies drift together, which is the failure mode of pinning wording.
 */
export const BINDING_ADVICE =
  'Under `wrangler dev` an `internal error; reference = …` here means the remote ' +
  'preview session that proxies the AI binding has expired — wrangler refreshes it ' +
  'on worker reload and never on a timer, so touching a source file restores it. ' +
  'Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in apps/control-app/.dev.vars ' +
  'to embed over REST instead and avoid the session entirely ([[BUG-73]]).'

/**
 * An embedder that says which transport and which KB it is, when it fails (B6).
 *
 * A DECORATOR RATHER THAN A SUBCLASS because `WorkersAiEmbedder` is the
 * component's, not ours: it carries `name` and `dimension` that the index build
 * and the search both read, and reimplementing that contract to add a `catch`
 * would be a second definition of what an embedder is. Delegation keeps one.
 *
 * `name` AND `dimension` ARE FORWARDED, and forgetting them would not be
 * cosmetic — `buildIndex` reads `dimension` to size its vectors and `search`
 * reads `name` to refuse an index built by another model. A decorator that
 * dropped them would turn this ticket's legibility fix into the exact
 * comparability bug the module header warns about.
 */
export class DescribedEmbedder implements Embedder {
  readonly name: string
  readonly dimension: number

  /**
   * EXPORTED, AND THE REASON IS THE UAT RATHER THAN A SECOND CALLER. The failure
   * this decorator exists to describe is a network failure inside upstream's
   * embedder, and a test that produced one for real would be a network monitor.
   * Handing the decorator an inner that throws is the seam that makes B6
   * assertable without asserting anything about Cloudflare's availability.
   */
  constructor(
    private readonly inner: Untyped,
    private readonly transport: Transport,
    private readonly kb: string,
  ) {
    this.name = inner.name
    this.dimension = inner.dimension
  }

  async embed(texts: string[]): Promise<Untyped[]> {
    try {
      return await this.inner.embed(texts)
    } catch (cause) {
      // ALREADY NAMED STAYS NAMED. Nothing wraps twice today, but a future
      // caller layering two of these would otherwise produce a message that
      // names the same failure at two altitudes and reads as two failures.
      if (cause instanceof EmbeddingFailedError) throw cause
      throw new EmbeddingFailedError(this.transport, this.kb, cause)
    }
  }
}

/**
 * The embedder this deployment should use for `kb`, or `null` if it has none.
 *
 * `null` RATHER THAN A THROW, because the two callers disagree about what an
 * absent embedder means and both are right (B7). The project KB raises — a
 * client's uploads that embed nowhere are invisible, and silence there loses
 * material to a problem nobody is told about. The system KB returns `null` — an
 * operator who has never run `1c kb build` should still get a builder. Deciding
 * for them here would force one of those two to be wrong.
 *
 * REST WINS WHEN IT IS CONFIGURED, and the precedence is the point rather than
 * an arbitrary tie-break. `wrangler.toml` declares the `AI` binding
 * unconditionally, so local dev has both available and would otherwise never
 * reach the transport it went to the trouble of provisioning a credential for.
 * Production has no credential, so the same rule selects the binding there
 * without a second branch or an `isLocal` guess.
 *
 * @param env the deployment's bindings and vars.
 * @param kb the knowledge base being embedded for. It appears in the failure
 *   message and nowhere else: an operator reading *"embedding for the project
 *   knowledge base failed"* knows which half of the session went quiet, which
 *   the reference id could never tell them.
 */
export function embedderFor(env: EmbedderEnv, kb: string): Embedder | null {
  const transport = transportFor(env)
  if (transport === null) return null
  const inner =
    transport === 'REST'
      ? new WorkersAiEmbedder({
          accountId: (env.CLOUDFLARE_ACCOUNT_ID ?? '').trim(),
          apiToken: (env.CLOUDFLARE_API_TOKEN ?? '').trim(),
        })
      : new WorkersAiEmbedder({ binding: env.AI })
  return new DescribedEmbedder(inner, transport, kb)
}

/**
 * Which transport this deployment's configuration selects, or `null` for none.
 *
 * SEPARATE FROM {@link embedderFor} so the gates below can ask the question
 * without paying for the answer: `canEmbed` wants to know whether a knowledge
 * base can open at all, and constructing an embedder to throw it away would put
 * a credential-shaped object on the heap on every request that asks.
 */
export function transportFor(env: EmbedderEnv): Transport | null {
  const accountId = (env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = (env.CLOUDFLARE_API_TOKEN ?? '').trim()

  if (accountId && apiToken) return 'REST'
  if (accountId) throw new PartialAiCredentialError('CLOUDFLARE_API_TOKEN')
  if (apiToken) throw new PartialAiCredentialError('CLOUDFLARE_ACCOUNT_ID')

  return env.AI ? 'binding' : null
}

/**
 * Can this deployment embed at all?
 *
 * THE GATE AND THE CONSTRUCTOR MUST NOT DISAGREE, which is why this asks
 * {@link transportFor} — the same predicate {@link embedderFor} selects on —
 * rather than testing `env.AI` a second time. The gates in
 * `session-knowledge.ts` and `router.ts` decide whether to OPEN the project half
 * and whether an upload can be indexed; had they kept their own predicate, a
 * deployment configured for REST would have been told it could not embed by a
 * gate that had never heard of the credential, and the symptom would be a
 * knowledge base that is silently absent rather than an error.
 *
 * IT PROPAGATES {@link PartialAiCredentialError} rather than answering `false`,
 * for B4's reason: half a credential is a mistake to report, and a gate that
 * swallowed it would turn the report back into the silence it replaces.
 */
export function canEmbed(env: EmbedderEnv): boolean {
  return transportFor(env) !== null
}
