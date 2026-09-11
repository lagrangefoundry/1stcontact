import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  SYSTEM_KB,
  bindKb,
  configPath,
  corpusDir,
  ensureConfig,
} from '../tools/generate/src/cli/kb'

/**
 * Reconciliation UATs for story-5281f009 — **the client's own knowledge base**,
 * the half of the declaration a release build reads but never serves.
 *
 * THIS FILE IS THE NODE HALF. What it can assert is everything that lives on a
 * filesystem: the declaration the repository ships, the declaration a fresh
 * workspace is scaffolded, and which of the two knowledge bases the release
 * build's own binding offers. The behaviour — opening, indexing, searching,
 * residency, the account barrier — is in
 * `reconciliation-client-knowledge-base.workers.test.ts`, because it needs the
 * runtime that has the account's store.
 *
 * NOTHING IS DOUBLED HERE. The declaration is read from `kb/knowledge_bases.json`
 * itself rather than restated, the scaffold is written by the real `ensureConfig`,
 * and `bindKb` is the real binding a release build calls.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const DECLARATION = path.join(REPO, 'kb', 'knowledge_bases.json')

/** The declared name of the client's own knowledge base. */
const CLIENT_KB = 'project'

/**
 * The four kinds of record a site is made from ([[DOC-38]] §8, §9): the
 * conversations held with the client, the material they uploaded, the reference
 * sites captured on their behalf, and the brief recording what was decided.
 */
const CLIENT_CORPUS_TYPES = ['brief', 'chat', 'material', 'reference']

interface Declaration {
  knowledge_bases: Record<string, Record<string, unknown>>
}

function shipped(): Declaration {
  return JSON.parse(readFileSync(DECLARATION, 'utf8')) as Declaration
}

function workspace(prefix: string): string {
  return mkdtempSync(path.join(tmpdir(), prefix))
}

describe('story-5281f009 — the declaration the product ships', () => {
  it('test_UAT_AC1654_the_clients_knowledge_base_is_declared_with_exactly_the_four_record_kinds', () => {
    const declaration = shipped()
    const client = declaration.knowledge_bases[CLIENT_KB]

    expect(
      client,
      `kb/knowledge_bases.json declares a '${CLIENT_KB}' knowledge base beside the shipped one ` +
        `(declared: ${Object.keys(declaration.knowledge_bases).sort().join(', ') || 'none'})`,
    ).toBeDefined()

    // EXACT IN BOTH DIRECTIONS. A fifth kind admitted here puts records the
    // client never offered as knowledge in front of the assistant; a missing
    // fourth makes a whole class of what they gave us unfindable, and the only
    // symptom is a search that returns less. Sorted equality is what makes the
    // assertion bite in both directions rather than only on the missing side.
    const corpus = client.corpus as { type: string[] }
    expect([...corpus.type].sort()).toEqual(CLIENT_CORPUS_TYPES)
  })
})

describe('story-5281f009 — the scaffold a fresh workspace gets', () => {
  it('test_UAT_AC1658_a_fresh_workspace_is_scaffolded_the_shipped_client_knowledge_base_field_for_field', () => {
    const root = workspace('ac1658-client-kb-')

    ensureConfig(root)
    const scaffolded = JSON.parse(readFileSync(configPath(root), 'utf8')) as Declaration

    // FIELD FOR FIELD, not merely "an entry of that name exists". The same
    // declaration is necessarily spelled twice — once in the committed file,
    // once in the starting-point one — and the copy that only ever runs on a
    // workspace that has none is the copy nobody would notice going stale. A
    // scaffold declaring a narrower corpus, or a `source`, or an authored
    // landscape, gives a fresh checkout a subtly different knowledge base under
    // the same name, and the divergence is visible only on a machine that has
    // deleted the file.
    // Both sides asserted present first, so the comparison cannot pass by both
    // being absent — which is exactly the shape the stale-scaffold failure takes.
    expect(scaffolded.knowledge_bases[CLIENT_KB], 'the scaffold writes it').toBeDefined()
    expect(shipped().knowledge_bases[CLIENT_KB], 'the repository ships it').toBeDefined()
    expect(scaffolded.knowledge_bases[CLIENT_KB]).toEqual(shipped().knowledge_bases[CLIENT_KB])
  })
})

describe('story-5281f009 — a host serves only what it can resolve', () => {
  it('test_UAT_AC1659_the_release_build_offers_exactly_the_shipped_knowledge_base', async () => {
    const root = workspace('ac1659-client-kb-')
    mkdirSync(corpusDir(root), { recursive: true })
    // The file the release build actually reads, copied rather than invented:
    // the premise of the criterion is that the declaration it reads declares TWO.
    writeFileSync(configPath(root), readFileSync(DECLARATION), 'utf8')

    const declared = Object.keys(
      (JSON.parse(readFileSync(configPath(root), 'utf8')) as Declaration).knowledge_bases,
    ).sort()
    expect(declared, 'the premise: the declaration this host reads declares both').toEqual(
      [CLIENT_KB, SYSTEM_KB].sort(),
    )

    const binding = await bindKb(root)

    // ONE, NAMED. The release build has the shipped document corpus and no
    // account store, so it offers the shipped knowledge base and nothing else.
    expect([...binding.kbs.keys()]).toEqual([SYSTEM_KB])

    // THE FAILURE THIS PREVENTS IS NOT AN ERROR. A host handed a knowledge base
    // whose corpus it cannot reach resolves it anyway against whatever corpus it
    // does have: the client's knowledge base resolved against a directory of
    // design documents holds none of the four client record kinds, so it reports
    // as searchable and empty and the session is primed with an apology for a map
    // this host will never build. Asking for it must yield nothing at all.
    expect(binding.kbs.get(CLIENT_KB)).toBeUndefined()
  }, 120_000)
})
