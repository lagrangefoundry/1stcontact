/**
 * A deterministic embedder, for suites that must prove retrieval without a model.
 *
 * WHY THIS IS A LEGITIMATE DOUBLE when almost nothing else in this repository is.
 * The embedder is the knowledge component's *model seam* — a true external
 * boundary, a third-party artifact that is not ours, injected for exactly that
 * reason. What the project-KB suites prove is the mechanism around it: that a
 * corpus resolves, that an index is incremental, that a tenant cannot see another
 * tenant's vectors, that a transcript does not rebuild the map. None of those
 * claims is about the quality of an embedding, and reaching Workers AI to make
 * them would make the suite depend on a network and a credential to assert
 * something neither one affects.
 *
 * IT IS ALSO THE ONLY OPTION HERE. `@cloudflare/vitest-pool-workers` runs
 * miniflare, which has no local Workers AI: an `[ai]` binding needs the remote
 * proxy. A suite that insisted on the real model could not run at all.
 *
 * WHAT IT ACTUALLY IS: a hashed bag of words. Each token lands in one of
 * {@link STUB_DIM} buckets and the vector is L2-normalised, so the dot product
 * the component takes as a cosine similarity is a real overlap measure — a query
 * sharing words with a document scores above one that does not. That is enough
 * for "the document we uploaded comes back first", which is what the suites
 * assert, and it is honestly less than a real model: it has no synonymy.
 *
 * DETERMINISTIC AND SELF-DESCRIBING. `name` is recorded in the index, and the
 * component forces a full rebuild when the stored model name changes — so a suite
 * can never silently rank a stub query against real vectors, or the reverse.
 */

/** The stub's vector width. Small: it is a bag of words, not a model. */
export const STUB_DIM = 64

/** The model identity written into the index. Deliberately not a real model id. */
export const STUB_MODEL = 'stub/hashed-bag-of-words-64'

function fnv1a(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

/** One unit-norm vector for `text`. Empty text gets a fixed non-zero vector. */
export function stubVector(text: string): Float32Array {
  const vector = new Float32Array(STUB_DIM)
  const tokens = String(text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  for (const token of tokens) vector[fnv1a(token) % STUB_DIM] += 1
  let sum = 0
  for (const value of vector) sum += value * value
  if (sum === 0) {
    // A zero vector would score zero against everything, which reads as "no
    // match" rather than as "nothing to match on". Unit and constant is honest.
    vector[0] = 1
    return vector
  }
  const norm = Math.sqrt(sum)
  for (let i = 0; i < STUB_DIM; i++) vector[i] /= norm
  return vector
}

/** The `Embedder` shape the knowledge component injects: name, dimension, embed. */
export function stubEmbedder(): {
  name: string
  dimension: number
  embed(texts: string[]): Promise<Float32Array[]>
  calls: number
} {
  return {
    name: STUB_MODEL,
    dimension: STUB_DIM,
    // Counted, so a suite can assert an incremental pass embedded nothing rather
    // than inferring it from a returned tally the implementation also computes.
    calls: 0,
    async embed(texts: string[]): Promise<Float32Array[]> {
      this.calls += texts.length
      return texts.map(stubVector)
    },
  }
}
