import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
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
import {
  aiCore,
  auditPath,
  createL1Toolbox,
  fileAuditSink,
} from '../tools/generate/src/cli/ai/toolbox'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import {
  openSession,
  resetAiHost,
  setModelClient,
  streamPrompt,
} from '../tools/generate/src/cli/ai/host'
import { cmdNew } from '../tools/generate/src/cli/commands'
import { says, scriptedClient } from './support/scripted-model-client'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * **The knowledge half of one continuing conversation** (story-a58a0974).
 *
 * The conversation's own criteria — opening, turns, binding, continuity, honest
 * failure — are covered next door in `reconciliation-assistant-conversation`.
 * What is left, and what this file is about, is the corpus reaching a session:
 * through the SAME granted surface the site operations arrive on, read-only,
 * scoped from one declaration, and primed as a MAP rather than as documents.
 *
 * Everything below the model boundary is real: a real corpus directory, a real
 * `DocDirStore`, a real index and chunk index, the real cosine search, the real
 * Toolbox with its real gating, provenance marking and audit sink, and the real
 * priming assembly. ONE thing is a stand-in — the embedding model, named through
 * the same `LAGRANGE_KM_EMBEDDER` seam the production build already supports, for
 * the reason its fixture states: search must be *checkable*, and a real embedder
 * is a network call. The knowledge base built against production embedding
 * credentials is therefore not what is proven here; the wiring and the shape of
 * priming are.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

const SLUG = 'studio'
const HEADLINE = 'The old headline.'
/** The address of the page's one text run: root list index, then child index. */
const HEADLINE_PATH = '0.0'

/** What the caretaker is here to do — priming step 2, and the ordering probe. */
const PURPOSE = 'You look after a website for someone who is not technical.'

/**
 * Two corpus documents whose BODIES are distinctive, because the load-bearing
 * assertion about priming is an absence: these sentences must not appear in it.
 */
const BODY_A = 'The carousel rotates slides between its slots on an interval.'
const BODY_B = 'Publishing snapshots the draft into a numbered revision.'

const CORPUS: Record<string, string> = {
  'DOC-A.md': `---
id: DOC-A
type: doc
title: Carousel behaviour module
fields:
  system_kb: true
---
# Carousel behaviour module

${BODY_A}
`,
  'DOC-B.md': `---
id: DOC-B
type: doc
title: Storage and revisions
fields:
  system_kb: true
---
# Storage and revisions

${BODY_B}
`,
}

/** A page with one addressable text run, so a write has somewhere to land. */
function seedPage(cwd: string, slug: string): void {
  const home = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const page = JSON.parse(readFileSync(home, 'utf8'))
  page.l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }],
  } satisfies L1Node
  page.modules = []
  writeFileSync(home, JSON.stringify(page, null, 2))
}

const workspaces: string[] = []

/** A throwaway workspace holding one seeded site. */
function makeWorkspace(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'a58a0974-kb-'))
  workspaces.push(cwd)
  cmdNew(SLUG, { cwd })
  seedPage(cwd, SLUG)
  return cwd
}

/** A minimal BUILT knowledge base: corpus, declaration, both indexes, and a map. */
async function buildFixtureKb(root: string): Promise<void> {
  const dir = corpusDir(root)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    configPath(root),
    JSON.stringify({
      knowledge_bases: {
        [SYSTEM_KB]: {
          description: 'Test system knowledge.',
          corpus: { type: ['doc'], 'fields.system_kb': true },
          landscape: 'authored',
          source: 'shipped',
        },
      },
    }),
    'utf8',
  )
  for (const [name, text] of Object.entries(CORPUS)) {
    writeFileSync(path.join(dir, name), text, 'utf8')
  }

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
  // The map, written directly rather than clustered: what these cases are about
  // is what a SESSION does with a map, not how the map came to be — that is the
  // knowledge library's own story (story-c4f329d3).
  writeFileSync(
    path.join(dir, 'awareness.md'),
    awarenessDocument(
      '## Behaviour modules\n\nCarousels and forms. Start at **DOC-A**.\n\n' +
        '## Storage\n\nDrafts, revisions and publishing. Start at **DOC-B**.\n',
      SYSTEM_KB,
    ),
    'utf8',
  )
}

interface AuditLine {
  surface: string
  operation: string
  tool: string
  effect: string
  policy: { decision: string; rule: string | null }
  outcome: { ok: boolean; error: string | null }
  session: string | null
  role: string | null
}

function auditLines(cwd: string): AuditLine[] {
  const file = auditPath({ cwd })
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AuditLine)
}

interface Toolbox {
  run: (tool: string, input: Record<string, unknown>) => Promise<string> | string
  schemas: () => Record<string, { properties: Record<string, unknown>; required: string[] }>
  manual: () => string
}

/** The `ai-knowledge` bridge — the declaration and the grant this host composes. */
interface Bridge {
  DECLARATION: {
    operations: { op: string; tool: string; effect: string; returns: { provenance: string } }[]
    groups: { group: string; effect: string; operations: string[] }[]
    scope_axes: Record<string, unknown>
  }
  TOOL_NAMES: Record<string, string>
  knowledgeInstanceConfig: (kbs: string[]) => {
    knowledge: { groups: string[]; scope: { kb: string[]; document: string[] } }
  }
  KnowledgeDocs: { open: (runtime: unknown, opts: object) => Promise<{ documents(): string[] }> }
}

function bridge(): Promise<Bridge> {
  return import(/* @vite-ignore */ sharedModuleUrl('ai-knowledge')) as Promise<Bridge>
}

// ── the fixture ──────────────────────────────────────────────────────────────

let kbRootDir: string
let runtime: unknown
let knowledgeTools: string[]

beforeAll(async () => {
  kbRootDir = mkdtempSync(path.join(tmpdir(), 'a58a0974-corpus-'))
  process.env.LAGRANGE_KM_EMBEDDER = STUB
  await buildFixtureKb(kbRootDir)
  runtime = await openKnowledgeRuntime(kbRootDir)
  expect(runtime).not.toBeNull()
  knowledgeTools = Object.values((await bridge()).TOOL_NAMES)
}, 180000)

afterAll(() => {
  delete process.env.LAGRANGE_KM_EMBEDDER
  rmSync(kbRootDir, { recursive: true, force: true })
  for (const dir of workspaces) rmSync(dir, { recursive: true, force: true })
})

// ── two surfaces, one toolbox ────────────────────────────────────────────────

describe('the corpus arrives on the surface the site operations arrive on', () => {
  it('test_UAT_AC1317_knowledge_is_offered_beside_the_site_operations_and_audited_like_an_edit', async () => {
    const cwd = makeWorkspace()
    const { DECLARATION } = await bridge()
    const { UNTRUSTED_OPEN, UNTRUSTED_CLOSE } = await aiCore()

    // The same site, the same role, with and without a built knowledge base —
    // the only difference being the corpus.
    const siteOnly = Object.keys((await createL1Toolbox(SLUG, { cwd })).schemas())
    const box: Toolbox = await createL1Toolbox(
      SLUG,
      { cwd },
      { audit: fileAuditSink({ cwd }), session: `site-${SLUG}`, knowledge: runtime },
    )
    const offered = Object.keys(box.schemas())

    // COMPOSITION, not replacement. The three knowledge operations are added, and
    // the site operations are exactly what they were — asserted as an equality, so
    // a knowledge surface that quietly displaced or renamed one cannot pass.
    for (const tool of knowledgeTools) expect(offered).toContain(tool)
    expect(offered.filter((name) => !knowledgeTools.includes(name)).sort()).toEqual(
      siteOnly.slice().sort(),
    )
    expect(offered).toContain('set_l1')
    expect(offered).toContain('describe_page')

    // The corpus is reached by knowledge-base name and document uid — never by
    // path, and never with a site to get wrong. AC-1058's rule, at the corpus.
    const schemas = box.schemas()
    for (const tool of knowledgeTools) {
      const params = Object.keys(schemas[tool].properties)
      expect(params, tool).not.toContain('slug')
      expect(params, tool).not.toContain('path')
      expect(params, tool).not.toContain('file')
    }
    expect(Object.keys(schemas.KnowledgeSearch.properties)).toContain('kb')
    expect(Object.keys(schemas.KnowledgeGet.properties)).toContain('uid')

    // A search through that surface answers with ranked hits naming the document.
    const hits = String(
      await box.run('KnowledgeSearch', { query: 'how do the slides rotate', kb: [SYSTEM_KB] }),
    )
    expect(hits).toContain('DOC-A')
    expect(hits).toContain('score')

    // A retrieved document is authored text arriving in the model's context, so it
    // comes back MARKED — both in what the operation declares and in what the call
    // actually returns.
    for (const operation of DECLARATION.operations) {
      expect(operation.returns.provenance, operation.tool).toBe('untrusted')
    }
    expect(hits.startsWith(UNTRUSTED_OPEN)).toBe(true)
    expect(hits.trimEnd().endsWith(UNTRUSTED_CLOSE)).toBe(true)

    // …and a change to the site, through the same box, so the two calls can be
    // compared in one trail rather than in two.
    await box.run('set_l1', {
      page: 'home',
      path: HEADLINE_PATH,
      node: { kind: 'text', text: 'Audited.', axes: { fontSizePx: 32 } },
    })

    const lines = auditLines(cwd)
    const search = lines.find((line) => line.operation === 'search')
    const edit = lines.find((line) => line.operation === 'set_l1')
    expect(search, 'the knowledge call is in the audit trail').toBeDefined()
    expect(edit, 'the edit is in the audit trail').toBeDefined()

    // ONE policy, ONE sink, ONE session identity: the knowledge call is gated and
    // recorded exactly as the edit is, differing only in which surface answered it.
    expect(search).toMatchObject({ surface: 'knowledge', tool: 'KnowledgeSearch', effect: 'read' })
    expect(search!.policy).toEqual({ decision: 'allow', rule: null })
    expect(search!.outcome.ok).toBe(true)
    expect(edit).toMatchObject({ surface: 'l1', effect: 'write' })
    expect(search!.session).toBe(edit!.session)
    expect(search!.session).toBe(`site-${SLUG}`)
    expect(search!.role).toBe(edit!.role)
  })
})

// ── the grant ────────────────────────────────────────────────────────────────

describe('the knowledge grant is read-only and confined by one declaration', () => {
  it('test_UAT_AC1318_the_grant_is_the_read_set_and_names_one_kb_on_both_scope_axes', async () => {
    const cwd = makeWorkspace()
    const { DECLARATION, knowledgeInstanceConfig } = await bridge()
    const box: Toolbox = await createL1Toolbox(SLUG, { cwd }, { knowledge: runtime })

    // Exactly the three read operations, as an EQUALITY rather than a handful of
    // absences — so an operation added upstream cannot enter the grant unnoticed
    // just because nobody thought to name it here.
    const offered = Object.keys(box.schemas())
      .filter((name) => knowledgeTools.includes(name))
      .sort()
    expect(offered).toEqual(['KnowledgeChunkSearch', 'KnowledgeGet', 'KnowledgeSearch'])

    // Read-only is enforced by ABSENCE: every declared operation is a read and the
    // one group is the read group, so there is no corpus-writing operation for the
    // assistant to reach for or to argue about.
    expect(DECLARATION.operations.map((operation) => operation.effect)).toEqual([
      'read',
      'read',
      'read',
    ])
    expect(DECLARATION.groups.map((group) => group.group)).toEqual(['ReadKnowledge'])

    // ONE named set fills BOTH scope axes — what may be searched and what may be
    // read — so a session cannot read a document it was never allowed to search
    // for, and there is no second place for the two to drift apart.
    const grant = knowledgeInstanceConfig([SYSTEM_KB]).knowledge
    expect(Object.keys(DECLARATION.scope_axes).sort()).toEqual(['document', 'kb'])
    expect(grant.groups).toEqual(['ReadKnowledge'])
    expect(grant.scope.kb).toEqual([SYSTEM_KB])
    expect(grant.scope.document).toEqual(grant.scope.kb)

    // A search naming a knowledge base this session was not granted is refused,
    // and comes back with none of the corpus.
    const refused = String(
      await box.run('KnowledgeSearch', { query: 'slides and revisions', kb: ['someone-elses-kb'] }),
    )
    expect(refused).not.toContain('DOC-A')
    expect(refused).not.toContain('DOC-B')
    expect(refused).not.toContain(BODY_A)
    expect(refused.toLowerCase()).toMatch(/refus|denied|not allowed|scope|allow/)
  })
})

// ── priming ──────────────────────────────────────────────────────────────────

describe('a conversation is primed with the map and the manual, not the documents', () => {
  it('test_UAT_AC1319_priming_carries_the_map_then_the_purpose_then_the_manual', async () => {
    const cwd = makeWorkspace()
    const { KnowledgeDocs } = await bridge()
    const box: Toolbox = await createL1Toolbox(SLUG, { cwd }, { knowledge: runtime })

    // Assembled exactly as the host assembles it: the role's purpose, and the
    // manual PROJECTED from this session's actual grant as the mechanism.
    const manual = box.manual().trim()
    const source = await KnowledgeDocs.open(runtime, { rolePurpose: PURPOSE, mechanism: manual })
    const [priming] = source.documents()

    // The map's territories, and for each the document it routes to.
    expect(priming).toContain('## Behaviour modules')
    expect(priming).toContain('## Storage')
    expect(priming).toContain('DOC-A')
    expect(priming).toContain('DOC-B')

    // …and NOT the prose of the documents it describes. This is the property the
    // whole design rests on: the corpus can grow without the primed context
    // growing with it, because what is primed is a map and the means to pull the
    // rest, never the bodies.
    expect(priming).not.toContain(BODY_A)
    expect(priming).not.toContain(BODY_B)

    // The manual is the mechanism, verbatim — so the corpus is reached through
    // this session's real grant rather than through a sentence written by hand
    // about what it might have.
    expect(priming).toContain(PURPOSE)
    expect(priming).toContain(manual)
    expect(manual).toContain('KnowledgeSearch')

    // The order is load-bearing, asserted on the CONTENT rather than only on the
    // headings: the map, then what this assistant is here to do, then the manual
    // last, so the last thing read is the thing done first.
    expect(priming.indexOf('## Behaviour modules')).toBeLessThan(priming.indexOf(PURPOSE))
    expect(priming.indexOf(PURPOSE)).toBeLessThan(priming.indexOf(manual))
    expect(priming.indexOf('# What exists')).toBeLessThan(priming.indexOf('# Your purpose'))
    expect(priming.indexOf('# Your purpose')).toBeLessThan(priming.indexOf('# How to search'))
  })
})

// ── degradation is not failure, and the two are distinguished ────────────────

describe('no knowledge base is ordinary; one that cannot be opened is reported', () => {
  it('test_UAT_AC1320_an_unbuilt_kb_is_silent_and_an_unopenable_one_is_reported', async () => {
    // Driven through the host's own conversation API — `openSession` and
    // `streamPrompt`, the two calls the origin's routes are wrappers around — so
    // the real session manager, the real role assembly, the real Toolbox
    // construction and the real degradation branch all run. The HTTP boundary
    // above them is not what this criterion is about; it is covered by the
    // conversation UATs next door, and reaching for it here would only add a
    // listening socket to a case about what happens inside `build()`.
    //
    // The knowledge base the host opens is the REPOSITORY's — a release artefact
    // serving every site, not a per-workspace one — so this case operates on that
    // real location. Whatever is there is moved aside first and restored after.
    const corpus = corpusDir()
    const index = path.join(corpus, 'index')
    const aside = path.join(corpus, 'index.uat-ac1320-aside')
    const hadCorpus = existsSync(corpus)
    const hadIndex = existsSync(index)

    const credentials = {
      LAGRANGE_KM_EMBEDDER: process.env.LAGRANGE_KM_EMBEDDER,
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    }

    const cwd = makeWorkspace()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})

    /** Open the site's conversation, speak in it, and report what the model was offered. */
    async function toolsOfferedByATurn(): Promise<string[]> {
      // The one double in this file's origin path: the Anthropic client, which is
      // the network. It is the SHARED one (BUG-39), so it answers in the
      // backend's own streamed wire events rather than in a finished message —
      // a double shaped like the reply the SDK would hand back, not like a
      // convenience the loop never sees.
      const client = scriptedClient([says('Understood.')])
      setModelClient(client)
      const seen = client.seen

      const opened = await openSession(SLUG, { cwd })
      expect(opened.ready, opened.error).toBe(true)
      expect(opened.error).toBeUndefined()

      // Drained to completion — a turn that ran is the premise of the assertion
      // this case is actually about, which is what the turn CARRIED to the model.
      const kinds: string[] = []
      for await (const event of streamPrompt(opened.sessionId, 'What can you do?', { cwd })) {
        kinds.push(event.kind)
      }
      expect(kinds.filter((kind) => kind === 'done')).toHaveLength(1)
      expect(seen).not.toHaveLength(0)
      return seen[0].tools.map((tool) => tool.name)
    }

    try {
      if (hadIndex) renameSync(index, aside)

      // ── never built: an ordinary state, and it is silent ──────────────────
      resetAiHost()
      errors.mockClear()

      const before = await toolsOfferedByATurn()
      expect(before).toContain('set_l1')
      expect(before).toContain('describe_page')
      expect(before.filter((name) => knowledgeTools.includes(name))).toEqual([])

      // Nothing is reported, because nothing is wrong. This is the assistant this
      // host had before the corpus existed.
      expect(
        errors.mock.calls
          .map((call) => call.map(String).join(' '))
          .filter((line) => /knowledge base/i.test(line)),
      ).toEqual([])

      // ── built, and it cannot be opened: a different situation ─────────────
      // An index is present, so the KB WAS built; the embedding credentials its
      // index needs are not, which is the failure an operator actually hits.
      mkdirSync(index, { recursive: true })
      delete process.env.LAGRANGE_KM_EMBEDDER
      delete process.env.CLOUDFLARE_ACCOUNT_ID
      delete process.env.CLOUDFLARE_API_TOKEN
      resetAiHost()
      errors.mockClear()

      // The conversation still opens, and still works on its site operations —
      // this is a degradation, not a failure.
      const after = await toolsOfferedByATurn()
      expect(after).toContain('set_l1')
      expect(after).toContain('describe_page')
      expect(after.filter((name) => knowledgeTools.includes(name))).toEqual([])

      // …but it says so, on the origin's error output, naming the knowledge base
      // as unopenable and giving the reason — so the operator sees a cause rather
      // than an assistant that has quietly stopped knowing anything.
      const reported = errors.mock.calls.map((call) => call.map(String).join(' '))
      const notice = reported.find((line) => /knowledge base could not be opened/i.test(line))
      expect(notice, reported.join('\n')).toBeDefined()
      expect(notice).toMatch(/CLOUDFLARE_ACCOUNT_ID/)
    } finally {
      errors.mockRestore()
      setModelClient(null)
      resetAiHost()
      rmSync(index, { recursive: true, force: true })
      if (hadIndex) renameSync(aside, index)
      else if (!hadCorpus) rmSync(corpus, { recursive: true, force: true })
      for (const [name, value] of Object.entries(credentials)) {
        if (value === undefined) delete process.env[name]
        else process.env[name] = value
      }
    }
  }, 180000)
})
