import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  SHIPPED_SOURCE,
  SYSTEM_KB,
  bindKb,
  configPath,
  corpusDir,
  corpusDocument,
  ensureConfig,
} from '../tools/generate/src/cli/kb'
import { PROJECT_KB, projectKb } from '../apps/control-app/src/knowledge'
import {
  knowledgeBasesFromMapping,
  resolveCorpus,
} from '../apps/control-app/src/generated/knowledge'

/**
 * story-bb91191c — **one declaration, and each host offering what it can resolve**.
 *
 * THE OTHER HALF OF THE STORY IS PROVED IN WORKERD
 * (`reconciliation-project-knowledge-base.workers.test.ts`): the corpus, the
 * tenancy barrier, the index residency, the incremental pass and the landscape
 * all need a real D1 database and real R2 buckets. What is proved here is what
 * workerd structurally cannot see — a file on disk, and the build host that reads
 * it beside the Worker.
 *
 * NOTHING IS STOOD IN FOR. `bindKb` is the real build-host binding over a real
 * `DocDirStore` reading a real corpus directory, and `projectKb` is the function
 * the Worker itself calls. The corpus directory is scratch rather than the
 * repository's own `kb/system`, which is derived and gitignored — a suite that
 * depended on `1c kb build` having been run would report a missing artefact as a
 * failure of the claim.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const DECLARATION = path.join(REPO, 'kb', 'knowledge_bases.json')

/** A scratch KB root: the shipped declaration, and one real corpus document. */
function scratchRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'story-bb91191c-kb-'))
  ensureConfig(root)
  mkdirSync(corpusDir(root), { recursive: true })
  writeFileSync(
    path.join(corpusDir(root), 'DOC-1.md'),
    corpusDocument({
      uid: 'doc-1',
      id: 'DOC-1',
      title: 'How the layout substrate works',
      body: 'L1 is a structured layout language, not a stylesheet.',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      fields: {},
    }),
    'utf8',
  )
  return root
}

// ── AC-1522: a host offers only the knowledge bases it can resolve ───────────

describe('story-bb91191c — each host offers what it can actually resolve', () => {
  it('test_UAT_AC1522_the_shipped_corpus_host_offers_the_system_knowledge_base_alone', async () => {
    const root = scratchRoot()

    // THE DECLARATION DECLARES BOTH, so a single-entry scope below is the host's
    // own decision rather than an artefact of a half-written file.
    const declared = JSON.parse(readFileSync(configPath(root), 'utf8')) as {
      knowledge_bases: Record<string, unknown>
    }
    expect(Object.keys(declared.knowledge_bases).sort()).toEqual([PROJECT_KB, SYSTEM_KB].sort())

    // THE HOST THAT CARRIES THE SHIPPED DESIGN-DOCUMENT CORPUS OFFERS ONE KB.
    // `binding.kbs` is the scope handed to search and to priming, so this is
    // exactly the set of knowledge bases that host can search or report on.
    const binding = await bindKb(root)
    expect([...binding.kbs.keys()]).toEqual([SYSTEM_KB])
    expect(binding.kbs.has(PROJECT_KB)).toBe(false)

    // The client's knowledge base is NOT PRESENT here — not offered as
    // searchable, not reported as an empty corpus, and contributing no apology
    // for a map this host will never build. Handing it the whole declaration
    // would resolve `project` against a read-only directory of design documents
    // holding no `chat`, `material`, `reference` or `brief`, and the result would
    // not be an error: it would be a knowledge base reported as searchable and
    // empty, which is the failure this story exists to eliminate.
    expect(Object.keys(binding.sources)).toEqual([SHIPPED_SOURCE])
    expect(binding.kb.source).toBe(SHIPPED_SOURCE)

    // And it genuinely resolves the one it does offer, against the corpus it
    // holds — so the single entry is a host that can answer, not a host with
    // nothing wired up at all.
    const corpus = (await resolveCorpus(binding.store, binding.kb)) as Array<{ uid: string }>
    expect(corpus.map((doc) => doc.uid)).toContain('DOC-1')

    // CONVERSELY, THE CLIENT-SERVING HOST NAMES THE OTHER ONE, resolved from the
    // same shared declaration and read against the client's own records — it
    // states no shipped source, so its corpus is the tenant's own store.
    const client = projectKb()
    expect(client.name).toBe(PROJECT_KB)
    expect(client.source).toBe('project')
    expect(client.source).not.toBe(SHIPPED_SOURCE)
  })
})

// ── AC-1523: one declaration, in force, and scaffolded whole ─────────────────

describe('story-bb91191c — the declaration is the one in force', () => {
  it('test_UAT_AC1523_every_declared_property_is_the_one_the_system_uses_and_the_scaffold_matches', () => {
    const file = readFileSync(DECLARATION, 'utf8')
    const declared = (JSON.parse(file) as {
      knowledge_bases: Record<string, Record<string, unknown>>
    }).knowledge_bases

    // READ THROUGH THE SAME PATH THE RUNNING SYSTEM READS IT. `projectKb` is the
    // function the Worker calls; a hand-built copy beside a declaration nobody
    // parses would pass a test that asserted the same literals twice.
    const client = projectKb()
    expect(client.name).toBe(PROJECT_KB)
    expect(client.description).toBe(declared[PROJECT_KB].description)
    expect([...client.corpus.types].sort()).toEqual(
      (declared[PROJECT_KB].corpus as { type: string[] }).type.slice().sort(),
    )
    expect(client.weight).toBe(declared[PROJECT_KB].weight)
    // The landscape is GENERATED, not authored: `derived` is what permits a
    // rebuild, and `authored` would make the awareness pipeline refuse.
    expect(client.landscape).toBe('derived')
    expect(client.landscape).toBe(declared[PROJECT_KB].landscape)
    // It READS THE CLIENT'S OWN RECORDS: no shipped source is stated at all, so
    // the corpus resolves against the tenant's own store.
    expect(Object.keys(declared[PROJECT_KB])).not.toContain('source')
    expect(client.source).toBe('project')

    // Both knowledge bases are described in the ONE declaration, and the other
    // half is the shipped corpus — the two are not the same knowledge base wearing
    // two names.
    expect(Object.keys(declared).sort()).toEqual([PROJECT_KB, SYSTEM_KB].sort())
    expect(declared[SYSTEM_KB].source).toBe(SHIPPED_SOURCE)
    expect(declared[SYSTEM_KB].landscape).toBe('authored')

    // CHANGING A STATED PROPERTY CHANGES WHAT THE SYSTEM DOES. Narrow the
    // declared corpus and the selected corpus narrows with it, through the same
    // parse the runtime uses — the one thing a paraphrased declaration could not
    // do, and the failure that has already happened once.
    const mutated = JSON.parse(file) as {
      knowledge_bases: Record<string, { corpus?: { type?: string[] } }>
    }
    mutated.knowledge_bases[PROJECT_KB].corpus = { type: ['material'] }
    const changed = (knowledgeBasesFromMapping(mutated) as Map<string, { corpus: { types: Set<string> } }>).get(
      PROJECT_KB,
    )
    expect([...changed!.corpus.types]).toEqual(['material'])
    expect([...changed!.corpus.types]).not.toContain('brief')
    // …and the shipped declaration is untouched by that, so the two readings are
    // genuinely of the file rather than of a shared mutable object.
    expect([...projectKb().corpus.types].sort()).toEqual(['brief', 'chat', 'material', 'reference'])

    // AN INSTALLATION WITH NO DECLARATION IS GIVEN ONE, and the generated file is
    // identical to the one the repository ships — a fresh checkout gets BOTH
    // knowledge bases complete, not only the half the local host happens to
    // serve. Byte-for-byte, because the copy that runs only on an empty checkout
    // is the copy nobody would notice going stale.
    const empty = mkdtempSync(path.join(os.tmpdir(), 'story-bb91191c-scaffold-'))
    const written = ensureConfig(empty)
    expect(readFileSync(written, 'utf8')).toBe(file)
  })
})
