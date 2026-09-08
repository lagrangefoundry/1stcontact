/**
 * A knowledge base built over a corpus somebody else wrote (REQ-123, BUG-65).
 *
 * `buildKb` is the release build and its first step is the export, which goes to
 * the ticket store for documents. A suite that brings its own corpus — because
 * what it is testing is a property of the pipeline rather than of our documents —
 * needs the same build minus that step, so this mirrors `buildKb`'s body from the
 * index onwards.
 *
 * IT LIVES HERE RATHER THAN IN `kb.ts` because production has no caller for
 * "build over a corpus somebody else wrote", and a test seam exported from a
 * production module is a code path nothing ships. It lives here rather than in
 * one of the suites because two now need it, and a copied build is a build that
 * only half tracks the real one.
 *
 * ONLY THE TWO MODEL SEAMS ARE STUBBED. The embedder and the describer are named
 * through the environment variables the build already supports, so no test-only
 * branch exists in the production path; the store, the index, the chunker, the
 * search, the clustering and the access-point validation are all the real thing.
 */

import { writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  awarenessDocument,
  bindKb,
  corpusDir,
  resolveEmbedder,
  SHIPPED_SOURCE,
  SYSTEM_KB,
} from '../../tools/generate/src/cli/kb'
import { sharedModuleUrl } from '../../tools/generate/src/cli/webui'

/** The deterministic stand-ins for the two model seams. */
export const STUB_MODEL = path.resolve('tests/fixtures/kb-stub-model.mjs')

/** What a fixture build produced. */
export interface FixtureBuild {
  documents: number
  embedded: number
  chunks: number
  territories: number
}

/**
 * Index, chunk and map a corpus already on disk under `root`.
 *
 * `nClusters` is passed rather than derived because a fixture corpus is small
 * enough that the release build's size rule (`floor(docs / 2)`, floored at 2)
 * would ask for more territories than there are documents.
 */
export async function buildIndexesAndMap(
  root: string,
  { mapToo = true, nClusters = 2 }: { mapToo?: boolean; nClusters?: number } = {},
): Promise<FixtureBuild> {
  const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
  const { nodeIndexSource } = await import(/* @vite-ignore */ sharedModuleUrl('knowledge', './node'))
  const binding = await bindKb(root)
  const embedder = await resolveEmbedder()

  const indexSource = nodeIndexSource(path.join(corpusDir(root), 'index'))
  const stats = await lib.buildIndex(binding.store, binding.kbs, indexSource, {
    embedder,
    sources: binding.sources,
  })
  const chunkSource = nodeIndexSource(path.join(corpusDir(root), 'chunks'))
  const chunkStats = await lib.buildChunkIndex(binding.store, binding.kbs, chunkSource, {
    embedder,
    sources: binding.sources,
  })

  let territories = 0
  if (mapToo) {
    const { embeddings, metadata } = await lib.loadIndex(indexSource)
    const vectors = new Map(
      metadata.map((row: { uid: string }, i: number) => [row.uid, embeddings[i]]),
    )
    const docs = lib.documentsFromTickets(
      await lib.resolveCorpus(binding.store, binding.kb),
      vectors,
    )
    const { createDescriber } = await import(/* @vite-ignore */ `file://${STUB_MODEL}`)
    const describer = createDescriber()
    const report = await lib.buildAwareness(
      docs,
      new lib.KnowledgeBase({ ...binding.kb, landscape: lib.DERIVED }),
      {
        describe: describer.describe,
        search: async (query: string) => {
          const hits = await lib.search(query, {
            indexes: { [SHIPPED_SOURCE]: indexSource },
            store: binding.store,
            kbs: binding.kbs,
            kb: SYSTEM_KB,
            topK: 5,
            embedder,
            sources: binding.sources,
          })
          return hits.map((hit: { uid: string }) => hit.uid)
        },
        clusterer: lib.agglomerativeClusterer({
          nClusters: Math.min(nClusters, docs.length),
          maxDistance: Infinity,
        }),
        describer: describer.name,
      },
    )
    writeFileSync(
      path.join(corpusDir(root), 'awareness.md'),
      awarenessDocument(report.body, SYSTEM_KB),
      'utf8',
    )
    territories = report.territories.length
  }

  return {
    documents: stats.total,
    embedded: stats.added,
    chunks: chunkStats.chunks,
    territories,
  }
}
