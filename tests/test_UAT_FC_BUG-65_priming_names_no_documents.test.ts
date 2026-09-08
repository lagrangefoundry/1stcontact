import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import { configPath, corpusDir, openKnowledgeRuntime } from '../tools/generate/src/cli/kb'
import { MAX_PRIMING_CHARS } from '../tools/generate/src/cli/ai/host-core'
import {
  consultantRole,
  primingConfig,
  primingText,
  PURPOSE_ENTRY,
  registerCorpusProviders,
  registerSiteProviders,
} from '../tools/generate/src/cli/ai/roles'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'
import { buildIndexesAndMap, STUB_MODEL } from './support/kb-fixture'

/**
 * BUG-65 — **corpus membership reaches a session only through the build**.
 *
 * The `purpose` entry enumerated three document ids in hand-authored prose. That
 * was a second, unsynchronised answer to a question the build already answers by
 * each document's own `doc_kind`, and it drifted the way an id list always
 * drifts: one of the three was demoted out of the corpus and the priming went on
 * telling every session to read it — silently, because a search for a document
 * that is not there returns nothing and the session simply proceeds without it.
 *
 * Two properties, and the second is the one that makes the first durable:
 *
 *   1. no text a session is sent names a document, by id or by title. It names
 *      SUBJECTS, which is what the map's trigger bites on and what retrieval
 *      actually matches;
 *   2. what a session is told about WHICH documents exist tracks the corpus the
 *      build produced — add one and it appears, demote one and it goes — with
 *      `priming.json` byte-identical across both.
 *
 * The second is asserted against an ASSEMBLED PRIMING over a real built index and
 * a real generated awareness map, because that is the artefact the model is sent.
 * A test that read the map file directly would prove the build wrote something,
 * not that a session is told it.
 */

// ── what a session is sent ───────────────────────────────────────────────────

/** Every string in the file that can reach a model, whichever shape it is in. */
function shippedTexts(): string[] {
  const entries = [
    ...(primingDocument.priming as { text?: string | string[] }[]),
    ...(primingDocument.priming_without_corpus as { text?: string | string[] }[]),
    ...(primingDocument.reminders as { text?: string | string[] }[]),
  ]
  const fromEntries = entries
    .map((entry) => entry.text)
    .filter((text): text is string | string[] => text !== undefined)
    .map((text) => (Array.isArray(text) ? text.join('\n') : text))
  return [...fromEntries, ...Object.values(primingDocument.templates as Record<string, string>)]
}

describe('BUG-65 — no authored text names a document', () => {
  it('test_UAT_FC_BUG-65_no_shipped_priming_text_names_a_corpus_document', () => {
    // Both id namespaces the corpus has: exported `doc` tickets keep their human
    // id (`DOC-33`), and the projected reference is written under `REF-`. Either
    // one in authored prose is the same defect.
    //
    // Scoped to text that REACHES A SESSION. The file's `about` block is a
    // comment the loader never reads and the model never sees; it cites the
    // format's own specification, which is provenance a maintainer needs and is
    // not a claim about who is in the corpus.
    for (const text of shippedTexts()) {
      expect(text, `authored priming text names a document: ${text.slice(0, 80)}`).not.toMatch(
        /\bDOC-\d+\b|\bREF-[a-z]/,
      )
    }
  })

  it('test_UAT_FC_BUG-65_no_shipped_priming_text_names_a_document_by_title', () => {
    // An id list is the obvious shape of the defect and a title list is the same
    // defect spelled differently — it drifts on a retitle instead of on a
    // demotion. These three are the titles the retired entry carried.
    for (const text of shippedTexts()) {
      expect(text).not.toMatch(/consultation playbook|personas, modes|differentiation audit/i)
    }
  })

  it('test_UAT_FC_BUG-65_the_purpose_still_carries_the_obligation_and_the_subjects', () => {
    const purpose = primingText(PURPOSE_ENTRY)

    // What the map cannot carry, and therefore what authored priming is for: that
    // the method exists, is written down, and is to be read rather than
    // improvised around. Dropping the ids must not drop this.
    expect(purpose).toMatch(/method is written down/)
    expect(purpose).toMatch(/Read it before you start/)

    // The trigger KM renders after this section says "pick the territories above
    // that bear on your purpose", so a purpose naming nothing to look for gives
    // it nothing to bite on. Subjects, not documents.
    expect(purpose).toMatch(/how a consultation runs/)
    expect(purpose).toMatch(/who\s+you are talking to/)
    expect(purpose).toMatch(/vocabulary a page is written in/)

    // And it still frames BOTH corpora: the client's own material is half of what
    // there is to search and none of it is guessable from priming.
    expect(purpose).toMatch(/corpus your client brings/)
    expect(purpose.length).toBeLessThan(900)
  })

  it('test_UAT_FC_BUG-65_the_reminder_points_at_the_method_without_naming_it', () => {
    const method = (primingDocument.reminders as { name?: string; text?: string }[]).find(
      (entry) => entry.name === 'method',
    )
    // The reminder rides every turn, so it points rather than carries — and after
    // BUG-65 it points at where the method lives rather than at an id that a
    // demotion can invalidate.
    expect(method?.text).toMatch(/differ in kind rather than refining one/)
    expect(method?.text).toMatch(/in your knowledge base/)
    expect(method?.text).not.toMatch(/DOC-\d+/)
  })
})

// ── membership comes from the build ──────────────────────────────────────────

/** One corpus document, in the shape `DocDirStore` reads. */
function member(id: string, title: string, body: string): string {
  return `---\nid: ${id}\ntype: doc\ntitle: ${title}\nfields:\n  system_kb: true\n---\n\n# ${title}\n\n${body}\n`
}

const CAROUSEL = member(
  'DOC-A',
  'Carousel behaviour module',
  'The carousel module rotates slides. Autoplay, loop and interval are behavioural config.',
)
const STORAGE = member(
  'DOC-B',
  'Storage and revisions',
  'A draft is private until publishing snapshots it into a numbered immutable revision.',
)
const TYPOGRAPHY = member(
  'DOC-C',
  'Typography and colour palette',
  'Text colour is picked from the site palette. Font size, weight and measure are typed axes.',
)

/** Replace the corpus wholesale, so a rebuild sees exactly these documents. */
function seed(root: string, docs: Record<string, string>): void {
  const dir = corpusDir(root)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    configPath(root),
    JSON.stringify({
      knowledge_bases: {
        system: {
          description: 'Test system knowledge.',
          corpus: { type: ['doc'], 'fields.system_kb': true },
          landscape: 'authored',
          source: 'shipped',
        },
      },
    }),
    'utf8',
  )
  for (const [name, text] of Object.entries(docs)) {
    writeFileSync(path.join(dir, name), text, 'utf8')
  }
}

/**
 * The priming a consultant session is sent, over the KB built under `root`.
 *
 * Assembled through the framework's own loader and assembler with the real
 * `km.landscape` and `km.mechanism` providers bound to a real runtime — the same
 * path `host-core.ts` takes — so what comes back is the document the model gets.
 */
async function assembledPriming(root: string): Promise<string> {
  const ai = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as {
    assemble: (p: unknown, r: unknown, c: unknown, o: unknown) => Promise<string>
    ProductConfig: new () => unknown
    PrimingProviders: new () => Record<string, Function>
    SessionContext: new (o: unknown) => unknown
  }
  const bridge = await import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge'))
  const knowledge = await openKnowledgeRuntime(root)
  expect(knowledge, 'the fixture KB was not built').not.toBeNull()

  const providers = new ai.PrimingProviders()
  const box = { manual: () => 'MANUAL' }
  await registerCorpusProviders(bridge, () => knowledge)(box, providers)
  registerSiteProviders(providers, { slug: 'bug65', box, signal: () => undefined })

  return ai.assemble(
    new ai.ProductConfig(),
    consultantRole(ai, providers, true),
    new ai.SessionContext({ role: 'consultant', backend: 'test' }),
    { providers, maxPrimingChars: MAX_PRIMING_CHARS },
  )
}

describe('BUG-65 — which documents exist is the build’s answer, not a sentence’s', () => {
  let root: string
  let before: string
  let after: string
  let primingFileBefore: string
  let primingFileAfter: string

  const PRIMING_FILE = 'tools/generate/src/cli/ai/priming.json'

  beforeAll(async () => {
    root = mkdtempSync(path.join(tmpdir(), 'bug65-kb-'))
    process.env.LAGRANGE_KM_EMBEDDER = STUB_MODEL
    process.env.LAGRANGE_KM_DESCRIBER = STUB_MODEL

    seed(root, { 'DOC-A.md': CAROUSEL, 'DOC-B.md': STORAGE })
    await buildIndexesAndMap(root)
    primingFileBefore = readFileSync(PRIMING_FILE, 'utf8')
    before = await assembledPriming(root)

    // The corpus changes the only way it can: a document is demoted out and
    // another is added. Nothing else is touched — no edit to `priming.json`, no
    // edit to any `.ts`.
    seed(root, { 'DOC-B.md': STORAGE, 'DOC-C.md': TYPOGRAPHY })
    await buildIndexesAndMap(root)
    primingFileAfter = readFileSync(PRIMING_FILE, 'utf8')
    after = await assembledPriming(root)
  }, 180_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    delete process.env.LAGRANGE_KM_DESCRIBER
    rmSync(root, { recursive: true, force: true })
  })

  it('test_UAT_FC_BUG-65_a_document_added_to_the_corpus_reaches_the_session', () => {
    // It was not in the first build and nothing authored ever mentions it, so the
    // only way it can be in the second priming is the map the build generated.
    expect(before).not.toContain('DOC-C')
    expect(after).toContain('DOC-C')
    expect(after).toMatch(/[Tt]ypography/)
  })

  it('test_UAT_FC_BUG-65_a_document_demoted_from_the_corpus_leaves_the_session', () => {
    // The failure this bug WAS: a document leaves the corpus and the priming goes
    // on naming it, so the session is told to read something it cannot open.
    expect(before).toContain('DOC-A')
    expect(after).not.toContain('DOC-A')
  })

  it('test_UAT_FC_BUG-65_neither_change_cost_an_edit_to_the_authored_priming', () => {
    // The whole claim, stated as bytes: the corpus a session sees changed
    // completely and the authored half of the priming did not move at all.
    expect(primingFileAfter).toBe(primingFileBefore)
    expect(before).not.toBe(after)
    // And the assembled document still fits the declared budget with the map in
    // it — the landscape is the part that grows with the corpus.
    expect(after.length).toBeLessThan(MAX_PRIMING_CHARS)
  })

  it('test_UAT_FC_BUG-65_the_session_is_still_told_to_go_and_read_its_method', () => {
    // Removing the ids must not remove the obligation. Both primings carry the
    // purpose verbatim, whatever the corpus underneath them is.
    for (const priming of [before, after]) {
      expect(priming).toContain(primingText(PURPOSE_ENTRY))
    }
    // And the purpose is declared once, in the corpus-bearing order — the shape
    // that carries a landscape for it to point at.
    const names = (primingConfig(true).priming as { name?: string }[]).map((e) => e.name)
    expect(names.filter((name) => name === PURPOSE_ENTRY)).toHaveLength(1)
  })
})
