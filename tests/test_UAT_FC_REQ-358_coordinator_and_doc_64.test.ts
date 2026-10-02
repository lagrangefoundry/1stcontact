import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  configPath,
  corpusDir,
  inSystemKb,
  kbBundle,
  KbSkewError,
  kbSkew,
  mapCoverage,
  readDocTickets,
  requireCoherentKb,
} from '../tools/generate/src/cli/kb'
import { COORDINATOR_ROLE } from '../tools/generate/src/cli/ai/roles'
import {
  COORDINATOR_BACKEND,
  coordinatorBackendName,
  coordinatorSessionIdFor,
  groupNames,
} from '../tools/generate/src/cli/ai/group-core'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'
import backends from '../tools/generate/src/cli/ai/backends.json'
import instances from '../tools/generate/src/cli/ai/instances.json'
import groupChat from '../tools/generate/src/cli/ai/group-chat.json'
import { buildIndexesAndMap, STUB_MODEL } from './support/kb-fixture'

/**
 * [[REQ-358]] — the group chat's second member is the COORDINATOR, both members
 * are pointed at DOC-64, and the system landscape can no longer leave an indexed
 * document out without the build saying so.
 *
 * The room's own behaviour under the new name — the session id, the spend role,
 * the tool list, both members' assembled priming, a pre-rename room being
 * recreated — is driven through the Worker in
 * `test_UAT_FC_REQ-357_group_chat.workers.test.ts`. What is here is what has no
 * Worker in it: the configuration the role is named in, the documents the priming
 * names, and the knowledge build's own refusal.
 */

/** Every string in `priming.json` a model can be sent — everything but `about`. */
function primingTexts(): string[] {
  const out: string[] = []
  const walk = (value: unknown): void => {
    if (typeof value === 'string') out.push(value)
    else if (Array.isArray(value)) value.forEach(walk)
    else if (value && typeof value === 'object') Object.values(value).forEach(walk)
  }
  for (const [key, value] of Object.entries(primingDocument)) if (key !== 'about') walk(value)
  return out
}

describe('REQ-358 — the coordinator, and DOC-64', () => {
  it('test_UAT_FC_REQ-358_the_second_member_is_configured_as_the_coordinator_everywhere', () => {
    expect(COORDINATOR_ROLE).toBe('coordinator')
    expect(COORDINATOR_BACKEND).toBe('claude_coordinator')
    expect(coordinatorSessionIdFor('site_x')).toBe('coordinator-site_x')
    expect(coordinatorBackendName('site_x')).toBe('claude_coordinator+site:site_x')

    // ONE WORD IN EVERY DOCUMENT the role is configured in, and the old key gone
    // rather than kept beside the new one.
    expect(Object.keys(backends)).toContain('claude_coordinator')
    expect(Object.keys(backends)).not.toContain('claude_assistant')
    expect(Object.keys(instances)).toContain('coordinator')
    expect(Object.keys(instances)).not.toContain('assistant')
    expect(Object.keys(groupChat.names)).toContain('coordinator')
    expect(Object.keys(groupChat.names)).not.toContain('assistant')
    expect(groupNames().coordinator).toBe(groupChat.names.coordinator)
    expect(Object.keys(primingDocument)).toEqual(
      expect.arrayContaining(['coordinator_priming', 'coordinator_reminders']),
    )
    expect(Object.keys(primingDocument)).not.toContain('assistant_priming')
    expect(Object.keys(primingDocument)).not.toContain('assistant_reminders')

    // AND THE AGENTS' OWN TEXT NEVER CALLS IT AN ASSISTANT.
    for (const text of primingTexts()) expect(text).not.toMatch(/your assistant/i)
  })

  it('test_UAT_FC_REQ-358_both_group_chat_texts_name_doc_64', () => {
    const coordinator = (primingDocument.coordinator_priming as Array<{ text?: string | string[] }>)
      .map((entry) => (Array.isArray(entry.text) ? entry.text.join('\n') : (entry.text ?? '')))
      .join('\n')
    expect(coordinator).toMatch(/DOC-64 in your knowledge base/)
    expect(coordinator).toMatch(/before\s+your first turn in the room/)
    const room = (primingDocument.templates as Record<string, string>)['group-room']
    expect(room).toMatch(/read DOC-64 in your knowledge base/)
    expect(room).toMatch(/Before your first turn in the room/)
  })

  it('test_UAT_FC_REQ-358_every_document_priming_names_is_in_the_system_kb', () => {
    // BUG-65'S CONCERN, HELD BY A CHECK RATHER THAN BY NAMING NOTHING. An id in
    // priming is a promise that the document is there to read; a document that
    // leaves the system KB would make it a promise the session cannot keep, and
    // nothing at runtime would say so.
    const named = new Set(primingTexts().flatMap((text) => text.match(/\bDOC-\d+\b/g) ?? []))
    expect([...named]).toContain('DOC-64')
    const members = new Set(readDocTickets().filter(inSystemKb).map((ticket) => ticket.id))
    for (const id of named) expect(members, `${id} is named in priming`).toContain(id)
  })
})

// ── the landscape ────────────────────────────────────────────────────────────

/** One corpus document, in the shape `DocDirStore` reads. */
function member(id: string, title: string, body: string): string {
  return `---\nid: ${id}\ntype: doc\ntitle: ${title}\nfields:\n  doc_kind: system_kb\n---\n\n# ${title}\n\n${body}\n`
}

describe('REQ-358 — the map covers what is indexed, or the build says so', () => {
  let root: string

  beforeAll(async () => {
    process.env.LAGRANGE_KM_EMBEDDER = STUB_MODEL
    process.env.LAGRANGE_KM_DESCRIBER = STUB_MODEL
    root = mkdtempSync(path.join(tmpdir(), 'req358-kb-'))
    mkdirSync(corpusDir(root), { recursive: true })
    writeFileSync(
      configPath(root),
      JSON.stringify({
        knowledge_bases: {
          system: { description: 'Test.', corpus: {}, landscape: 'authored', source: 'shipped' },
        },
      }),
      'utf8',
    )
    writeFileSync(
      path.join(corpusDir(root), 'DOC-A.md'),
      member('DOC-A', 'Carousel module', 'The carousel rotates slides on an interval.'),
      'utf8',
    )
    writeFileSync(
      path.join(corpusDir(root), 'DOC-B.md'),
      member('DOC-B', 'Storage', 'A draft is private until publishing snapshots it.'),
      'utf8',
    )
    await buildIndexesAndMap(root)
  }, 120_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    delete process.env.LAGRANGE_KM_DESCRIBER
    rmSync(root, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-358_a_document_indexed_but_left_off_the_map_is_refused', async () => {
    // A BUILD'S MAP COVERS EVERYTHING IT INDEXED, at the version it indexed.
    const built = await kbSkew((await kbBundle(root))!, root)
    expect(built.unmapped).toEqual([])
    const covers = mapCoverage(readFileSync(path.join(corpusDir(root), 'awareness.md'), 'utf8'))
    expect(Object.keys(covers).sort()).toEqual(['DOC-A', 'DOC-B'])

    // 2026-10-01's STATE: a new document indexed, and the map left as it was. The
    // index is coherent with the corpus; only the map is behind, and it is the
    // part every session is primed with.
    writeFileSync(
      path.join(corpusDir(root), 'DOC-C.md'),
      member('DOC-C', 'How a build runs', 'The consultant builds; the coordinator tracks the plan.'),
      'utf8',
    )
    await buildIndexesAndMap(root, { mapToo: false })
    const behind = await kbSkew((await kbBundle(root))!, root)
    expect(behind.missing).toEqual([])
    expect(behind.stale).toEqual([])
    expect(behind.unmapped).toEqual(['DOC-C'])
    const refusal = requireCoherentKb((await kbBundle(root))!, root)
    await expect(refusal).rejects.toBeInstanceOf(KbSkewError)
    await expect(refusal).rejects.toThrow(/UNMAPPED[\s\S]*DOC-C/)

    // The repair is the build, which draws the map again.
    await buildIndexesAndMap(root)
    await expect(requireCoherentKb((await kbBundle(root))!, root)).resolves.toBeTruthy()
  }, 120_000)
})

// ── the shipped landscape ────────────────────────────────────────────────────

/**
 * The checkout's own built knowledge base, where there is one.
 *
 * `kb/system/` is a gitignored build product, so a fresh worktree has none and
 * this case has nothing to read there; the refusal above is what holds the
 * property everywhere, and `1c assets` will not inline a bundle that fails it.
 */
const SHIPPED = path.resolve(__dirname, '..', 'kb')
const SHIPPED_BUILT = existsSync(path.join(corpusDir(SHIPPED), 'index', 'manifest.json'))

describe.skipIf(!SHIPPED_BUILT)('REQ-358 — the shipped system landscape', () => {
  it('test_UAT_FC_REQ-358_the_shipped_map_covers_every_indexed_document', () => {
    const indexed = JSON.parse(
      readFileSync(path.join(corpusDir(SHIPPED), 'index', 'manifest.json'), 'utf8'),
    ) as Record<string, string>
    const covers = mapCoverage(readFileSync(path.join(corpusDir(SHIPPED), 'awareness.md'), 'utf8'))
    expect(covers).toEqual(indexed)
    expect(Object.keys(covers)).toEqual(expect.arrayContaining(['DOC-63', 'DOC-64']))
  })
})
