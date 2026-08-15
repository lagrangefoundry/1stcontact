/**
 * The two model seams, as deterministic stand-ins (REQ-123).
 *
 * WHAT THIS IS AND IS NOT A DOUBLE FOR. The KB build has exactly two external
 * boundaries — an embedding model and a describing model — and they are the only
 * two things stubbed here. Everything the UATs then exercise is the real thing:
 * the real `DocDirStore` over a real corpus directory, the real index build, the
 * real chunker, the real cosine search, the real ranker, the real clustering, the
 * real access-point validation. That is what makes the evidence worth having; a
 * test that stubbed the index or the search would prove only that the pipeline
 * can call itself.
 *
 * Both seams are named through the same environment variables the build already
 * supports (`LAGRANGE_KM_EMBEDDER`, `LAGRANGE_KM_DESCRIBER`), so no test-only
 * branch exists in the production path.
 *
 * WHY A HASHING EMBEDDER RATHER THAN RANDOM VECTORS. Search has to be *checkable*
 * — a UAT that asserts "searching for the carousel document returns it" needs
 * similarity to track word overlap the way a real model roughly does. Bag-of-
 * words hashing gives exactly that, deterministically and with no network: two
 * texts sharing vocabulary score high, two that share none score near zero.
 * Random vectors would make every assertion about ranking meaningless.
 */

/** The real model's width, so a stubbed index is the same shape as a real one. */
const DIMENSION = 384

/** FNV-1a, for a stable token → bucket mapping across runs and platforms. */
function bucket(token) {
  let hash = 0x811c9dc5
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash % DIMENSION
}

/** Words, lowercased, with punctuation and markdown syntax dropped. */
function tokens(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)
}

export function createEmbedder() {
  return {
    name: 'stub-hash-384',
    dimension: DIMENSION,
    async embed(texts) {
      return texts.map((text) => {
        const vector = new Float32Array(DIMENSION)
        for (const token of tokens(text)) vector[bucket(token)] += 1
        // L2-normalised, because search takes the dot product AS the cosine
        // similarity — an un-normalised vector silently ranks by length.
        let sum = 0
        for (let i = 0; i < DIMENSION; i++) sum += vector[i] * vector[i]
        const norm = Math.sqrt(sum)
        if (norm > 0) for (let i = 0; i < DIMENSION; i++) vector[i] /= norm
        return vector
      })
    },
  }
}

export function createDescriber() {
  return {
    name: 'stub-describer',
    /**
     * One paragraph per territory. Echoes a distinctive slice of the prompt so a
     * UAT can tell the map was built FROM the corpus rather than from a constant
     * — a describer returning fixed text would let a broken clustering step pass.
     */
    async describe(prompt) {
      const words = tokens(prompt).slice(0, 12).join(' ')
      return `This territory covers ${words}.`
    },
  }
}
