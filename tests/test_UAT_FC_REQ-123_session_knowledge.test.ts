import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  awarenessDocument,
  bindKb,
  configPath,
  corpusDir,
  openKnowledgeRuntime,
  resolveEmbedder,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import { aiCore, createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'

/**
 * REQ-123 — **the KB as a chat session actually receives it**.
 *
 * Two things have to be true for the KB to be worth building, and neither is
 * about retrieval quality:
 *
 *   1. the corpus is reachable through DECLARED TOOL OPERATIONS, so search and
 *      retrieval get the ordinary guardrails, provenance marking and audit
 *      rather than being a side channel the Toolbox never sees;
 *   2. the session is primed with a MAP, not with the documents — the whole
 *      point of landscape-first priming is that a corpus can grow without the
 *      context growing with it.
 *
 * The Toolbox, the scope enforcement and the priming assembly are all real here.
 * Only the embedding model is a stand-in, for the reason its fixture gives.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

const CORPUS: Record<string, string> = {
  'DOC-A.md': `---
id: DOC-A
type: doc
title: Carousel behaviour module
fields:
  system_kb: true
---
# Carousel behaviour module

The carousel rotates slides. Autoplay and interval are behavioural config.
`,
  'DOC-B.md': `---
id: DOC-B
type: doc
title: Storage and revisions
fields:
  system_kb: true
---
# Storage and revisions

Publishing snapshots the draft into a numbered revision and renders the output.
`,
}

/** A minimal built KB: corpus, declaration, index, chunk index and a map. */
async function buildFixtureKb(root: string): Promise<void> {
  const dir = corpusDir(root)
  mkdirSync(dir, { recursive: true })
  writeFileSync(configPath(root), JSON.stringify({
        knowledge_bases: {
          system: {
            description: 'Test system knowledge.',
            corpus: { type: ['doc'], 'fields.system_kb': true },
            landscape: 'authored',
            source: 'shipped',
          },
        },
      }), 'utf8')
  for (const [name, text] of Object.entries(CORPUS)) writeFileSync(path.join(dir, name), text, 'utf8')

  const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
  const { nodeIndexSource } = await import(/* @vite-ignore */ sharedModuleUrl('knowledge', './node'))
  const binding = await bindKb(root)
  const embedder = await resolveEmbedder()
  await lib.buildIndex(binding.store, binding.kbs, nodeIndexSource(path.join(dir, 'index')), {
    embedder,
    sources: binding.sources,
  })
  await lib.buildChunkIndex(binding.store, binding.kbs, nodeIndexSource(path.join(dir, 'chunks')), {
    embedder,
    sources: binding.sources,
  })
  // A map, so priming has a landscape to assemble. Written directly rather than
  // clustered: what this suite is about is what the session DOES with a map.
  writeFileSync(
    path.join(dir, 'awareness.md'),
    awarenessDocument(
      '## Behaviour modules\n\nCarousels and forms. Start at DOC-A.\n\n' +
        '## Storage\n\nDrafts, revisions and publishing. Start at DOC-B.\n',
      SYSTEM_KB,
    ),
    'utf8',
  )
}

describe('REQ-123 — the KB reaches the session', () => {
  let root: string
  let runtime: unknown

  beforeAll(async () => {
    root = mkdtempSync(path.join(tmpdir(), 'kb-session-'))
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    await buildFixtureKb(root)
    runtime = await openKnowledgeRuntime(root)
  }, 120_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    rmSync(root, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-123_knowledge_is_offered_as_declared_operations_beside_the_site_tools', async () => {
    // Composition, not replacement: the session keeps every L1 control it had
    // and gains the corpus. Both surfaces are in one Toolbox, which is what
    // makes a knowledge call subject to the same gating and audit as an edit.
    const box = await createL1Toolbox('studio', {}, { knowledge: runtime })
    const names = Object.keys(box.schemas())

    // The declaration names the tools, not this repo — `search` is the OP, and
    // `KnowledgeSearch` is what the model is offered.
    expect(names).toContain('KnowledgeSearch')
    expect(names).toContain('KnowledgeChunkSearch')
    expect(names).toContain('KnowledgeGet')
    // The site tools are untouched.
    expect(names).toContain('set_l1')
    expect(names).toContain('describe_site')
  })

  it('test_UAT_FC_REQ-123_the_corpus_is_read_only_to_the_session', async () => {
    // The grant is the read group. Nothing the assistant can call writes to the
    // KB — and that is enforced by ABSENCE, the same way the forbidden-language
    // rule is: an operation that is not offered cannot be argued for.
    const box = await createL1Toolbox('studio', {}, { knowledge: runtime })
    const knowledgeTools = Object.keys(box.schemas())
      .filter((name) => name.startsWith('Knowledge'))
      .sort()

    // Exactly the read set — asserted as an equality rather than a handful of
    // absences, so an operation added upstream cannot slip into the grant
    // unnoticed just because nobody thought to name it here. The expectation is
    // DERIVED FROM THE DECLARATION rather than written out: a census goes stale
    // the first time the read group grows, and the property this case is about is
    // "the grant is the read group and nothing writes", not "there are three".
    const { DECLARATION } = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
    const readOps = new Set(
      DECLARATION.groups
        .filter((group: { effect: string }) => group.effect === 'read')
        .flatMap((group: { operations: string[] }) => group.operations),
    )
    const readTools = DECLARATION.operations
      .filter((operation: { op: string }) => readOps.has(operation.op))
      .map((operation: { tool: string }) => operation.tool)
      .sort()

    expect(readTools.length).toBeGreaterThan(0)
    expect(knowledgeTools).toEqual(readTools)
    expect(
      DECLARATION.operations.filter((operation: { effect: string }) => operation.effect !== 'read'),
    ).toEqual([])
  })

  it('test_UAT_FC_REQ-123_a_search_runs_through_the_toolbox_and_returns_a_hit', async () => {
    // End to end through the declared surface — not by calling the library
    // directly — so what is proven is the path the model actually takes.
    const box = await createL1Toolbox('studio', {}, { knowledge: runtime })

    const result = await box.run('KnowledgeSearch', {
      query: 'how do slides rotate',
      kb: [SYSTEM_KB],
    })

    expect(JSON.stringify(result)).toContain('DOC-A')
  })

  it('test_UAT_FC_REQ-123_a_search_outside_the_granted_kb_is_refused', async () => {
    // The scope axes are filled from the declaration, both of them, so a session
    // cannot reach a knowledge base it was not granted — the property that makes
    // per-tenant KBs safe to add later without revisiting this wiring.
    const box = await createL1Toolbox('studio', {}, { knowledge: runtime })

    const result = await box.run('KnowledgeSearch', {
      query: 'anything',
      kb: ['someone-elses-kb'],
    })

    expect(JSON.stringify(result)).not.toContain('DOC-A')
    expect(JSON.stringify(result).toLowerCase()).toMatch(/refus|denied|not allowed|scope|allow/)
  })

  it('test_UAT_FC_REQ-123_without_a_built_kb_the_session_still_works', async () => {
    // Degradation, not failure. An operator who has never run `1c kb build` gets
    // the assistant they had before REQ-123 — one that knows its tools and not
    // the design documents. Failing here would trade a missing capability for a
    // missing product.
    const empty = mkdtempSync(path.join(tmpdir(), 'kb-none-'))
    try {
      expect(await openKnowledgeRuntime(empty)).toBeNull()

      const box = await createL1Toolbox('studio', {}, { knowledge: null })
      const names = Object.keys(box.schemas())
      expect(names).toContain('set_l1')
      expect(names.filter((n) => n.startsWith('Knowledge'))).toEqual([])
    } finally {
      rmSync(empty, { recursive: true, force: true })
    }
  })

  it('test_UAT_FC_REQ-123_priming_is_the_map_and_the_mechanism_not_the_documents', async () => {
    // The claim the whole design rests on: a session is primed with what EXISTS
    // and how to reach it, so the corpus can grow without the context growing.
    // If the documents themselves were being pasted in, this priming would carry
    // the body text — and it must not.
    // TWO PROVIDERS, NOT ONE ASSEMBLED DOCUMENT. KM used to take the role's
    // purpose and the mechanism and hand back a snapshot whose internal order it
    // owned; that seam is gone, because a snapshot assembled once cannot reflect
    // a document published after the session opened. It now renders its own two
    // texts — `km.landscape` and `km.mechanism` — and names no role, so the
    // purpose between them is the HOST's entry and the order is the host's too
    // (see `ai/host-core.ts`, and the criterion-level case in
    // `reconciliation-assistant-conversation-knowledge`). What REQ-123 asks of
    // the library is unchanged and is what is asserted here: a map and the means
    // to reach it, never the bodies.
    const bridge = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
    const box = await createL1Toolbox('studio', {}, { knowledge: runtime })

    const { PrimingProviders } = await aiCore()
    const providers = new PrimingProviders()
    bridge.registerKmProviders(providers, () => runtime, {
      mechanismFor: () => box.manual(),
    })

    const ctx = { backend: 'claude' }
    const landscape = await providers.get(bridge.LANDSCAPE_PROVIDER)(ctx)
    const mechanism = await providers.get(bridge.MECHANISM_PROVIDER)(ctx)

    // The map is there, and it routes: a territory plus where to start.
    expect(landscape).toContain('Behaviour modules')
    expect(landscape).toContain('DOC-A')
    // The documents themselves are NOT — this is the property the design rests on.
    expect(landscape).not.toContain('Autoplay and interval are behavioural config')
    expect(mechanism).not.toContain('Autoplay and interval are behavioural config')
    // And the mechanism is THIS session's projected manual rather than a sentence
    // written by hand about what it might reach.
    expect(mechanism).toContain('KnowledgeSearch')
    expect(mechanism).toContain('set_l1')
  })
})
