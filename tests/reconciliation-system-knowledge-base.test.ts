import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  awarenessDocument,
  bindKb,
  buildKb,
  configPath,
  corpusDir,
  corpusDocument,
  ensureConfig,
  exportCorpus,
  kbRoot,
  kbStatus,
  KB_USAGE,
  readDocTickets,
  resolveDescriber,
  SHIPPED_SOURCE,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import { run } from '../tools/generate/src/cli'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'

/**
 * Reconciliation UATs for story-c4f329d3 — **the system knowledge base**: the
 * pipeline that turns our own `doc` tickets into something an assistant can
 * search (AC-1291 … AC-1306, AC-1632, AC-1633).
 *
 * WHAT IS STOOD IN FOR, AND WHY ONLY THAT. The build has exactly three external
 * boundaries and each is doubled at its own seam, through the mechanism
 * production already ships:
 *
 *   • the embedding model — `LAGRANGE_KM_EMBEDDER`, the seam `resolveEmbedder`
 *     reads (`tests/fixtures/kb-stub-model.mjs`, a deterministic hashing
 *     embedder so ranking assertions are checkable at all);
 *   • the describing model — `LAGRANGE_KM_DESCRIBER`, the same shape;
 *   • the ticket store — the `xgd` CLI `readDocTickets` shells out to, replaced
 *     on `PATH` by a shim that prints a controlled envelope. This is a separate
 *     product invoked as a subprocess, not one of our modules: the export's own
 *     argv, JSON parsing, envelope check, membership filter, rendering,
 *     incremental write and sweep all still run for real.
 *
 * Everything else is the real thing — the real `DocDirStore`, the real index and
 * chunk builds, the real cosine search and ranker, the real clustering, the real
 * access-point validation, and `buildKb` itself as the entry point.
 *
 * THIS FILE IS THE EVIDENCE FOR AC-1291 … AC-1306, all of it. It absorbed
 * `test_UAT_FC_REQ-123_system_kb.test.ts`, which verified fourteen of the same
 * scenarios in the same shape — same runner, same stub model, same real
 * `DocDirStore` — and was retired rather than kept: two files asserting one
 * property is not unit-versus-integration diversity, it is the same assertion
 * twice, and the second copy is where an upstream API change goes unnoticed
 * because nobody is sure which file is authoritative. If a scenario belongs to
 * one of these ACs, it belongs here.
 *
 * Controlling the store is what makes the harder ACs assertable rather than
 * vacuous: exclusions, removals, truncation and the nothing-carries-the-kind
 * refusal have nothing to demonstrate against a store we do not author. Where an
 * AC asks specifically for the real store (AC-1295's integration half, AC-1297's
 * read-back) it gets the real store, in one shared export.
 *
 * MEMBERSHIP IS A KIND, NOT A FLAG. Every fixture ticket below carries
 * `doc_kind: system_kb` (DOC-39 §3.3) unless it is deliberately a non-member.
 * The retired `system_kb: true` boolean is superseded rather than deprecated —
 * it appears here only as a NON-member, because honouring a marker nobody
 * maintains any more is how a document reaches a client-facing assistant that
 * nobody meant to put there.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

/** The field and value that decide membership — the rule the ACs are written against. */
const KIND_FIELD = 'doc_kind'
const MEMBER_KIND = 'system_kb'

// ── the controlled ticket store ──────────────────────────────────────────────

/** A `doc` ticket in the shape `xgd ticket list --view --json` returns. */
interface StoreTicket {
  uid: string
  id: string
  title: string
  body: string
  created_at: string | null
  updated_at: string | null
  fields: Record<string, unknown> | null
}

/** A ticket that belongs to the KB, unless `fields` says otherwise. */
function ticket(
  id: string,
  title: string,
  body: string,
  fields: Record<string, unknown> | null = { [KIND_FIELD]: MEMBER_KIND },
): StoreTicket {
  return {
    uid: `doc-${id.toLowerCase()}`,
    id,
    title,
    body,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    fields,
  }
}

/** Membership, stated by the test rather than borrowed from the implementation. */
function isMember(t: { fields?: Record<string, unknown> | null }): boolean {
  return (t.fields ?? {})[KIND_FIELD] === MEMBER_KIND
}

const shims: string[] = []
let lastShim: string | null = null

/**
 * Put an `xgd` on `PATH` whose stdout is produced by `body`, given its argv.
 *
 * The shim is handed the ARGV rather than a fixed payload, which is the whole
 * point for the exhaustive-listing AC: whether `readDocTickets` actually asks
 * for every page is only observable from the flags it passes, and a shim that
 * ignored them would let a truncating export pass. It records its argv beside
 * itself so a test can assert the request as well as the answer.
 */
function installStore(body: string): () => void {
  const dir = mkdtempSync(path.join(tmpdir(), 'kb-store-'))
  shims.push(dir)
  lastShim = dir
  const argvFile = path.join(dir, 'argv.json')
  const shim = path.join(dir, 'xgd')
  writeFileSync(
    shim,
    `#!/usr/bin/env node\nconst argv = process.argv.slice(2)\n` +
      `require('node:fs').writeFileSync(${JSON.stringify(argvFile)}, JSON.stringify(argv))\n` +
      `${body}\n`,
    'utf8',
  )
  chmodSync(shim, 0o755)
  const previous = process.env.PATH
  process.env.PATH = `${dir}${path.delimiter}${previous ?? ''}`
  return () => {
    if (previous === undefined) delete process.env.PATH
    else process.env.PATH = previous
  }
}

/** The argv the most recently installed store shim was last invoked with. */
function recordedArgv(): string[] {
  return JSON.parse(readFileSync(path.join(lastShim!, 'argv.json'), 'utf8')) as string[]
}

/** A store that answers with `tickets`, paging at `pageSize` unless told not to. */
function paging(tickets: StoreTicket[], pageSize = 50): () => () => void {
  return () =>
    installStore(
      `const all = ${JSON.stringify(tickets)}\n` +
        `if (argv.includes('--no-limit')) {\n` +
        `  process.stdout.write(JSON.stringify({ items: all, next_cursor: null, truncated: false }))\n` +
        `} else {\n` +
        `  const page = all.slice(0, ${pageSize})\n` +
        `  process.stdout.write(JSON.stringify({\n` +
        `    items: page,\n` +
        `    next_cursor: all.length > page.length ? 'page-2' : null,\n` +
        `    truncated: all.length > page.length,\n` +
        `  }))\n` +
        `}`,
    )
}

/** Run `fn` against a store installed by `install`. */
async function withStore<T>(install: () => () => void, fn: () => Promise<T> | T): Promise<T> {
  const restore = install()
  try {
    return await fn()
  } finally {
    restore()
  }
}

/** A scratch KB tree, removed when `fn` returns. */
async function withRoot<T>(fn: (root: string) => Promise<T> | T): Promise<T> {
  const root = mkdtempSync(path.join(tmpdir(), 'kb-'))
  try {
    return await fn(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

/**
 * Run `fn`, which drives a command that WRITES into the repository's own KB
 * tree, and put whatever was built there back afterwards.
 *
 * `kb export` resolves its own root — a release artefact belongs to the
 * repository and not to whatever directory a process was started in — so a test
 * that drives the command rather than the function beneath it cannot point it at
 * a scratch tree. Moving the built corpus aside and back is what keeps asserting
 * the command's output from costing a developer the corpus they had built.
 */
async function withRepoCorpus<T>(fn: () => Promise<T> | T): Promise<T> {
  const live = corpusDir(kbRoot())
  const aside = `${live}.saved-by-test`
  const had = existsSync(live)
  if (had) renameSync(live, aside)
  try {
    return await fn()
  } finally {
    rmSync(live, { recursive: true, force: true })
    if (had) renameSync(aside, live)
  }
}

/** Run `fn` with `names` absent from the environment, then put them back. */
async function withoutEnv<T>(names: string[], fn: () => Promise<T> | T): Promise<T> {
  const saved = new Map(names.map((name) => [name, process.env[name]]))
  for (const name of names) delete process.env[name]
  try {
    return await fn()
  } finally {
    for (const [name, value] of saved) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
}

/**
 * Run `fn` with the repository's own corpus directory moved out of the way, and
 * put it back afterwards — including when `fn` throws.
 *
 * Only for the ACs that assert what the COMMAND prints, since `1c kb export`
 * and `1c kb status` take no root argument and are therefore the real tree or
 * nothing. Every other AC drives the functions directly against a scratch tree.
 */
async function withRealCorpusAside<T>(fn: () => Promise<T>): Promise<T> {
  const real = corpusDir()
  const aside = existsSync(real) ? `${real}.aside-${process.pid}` : null
  if (aside !== null) renameSync(real, aside)
  try {
    return await fn()
  } finally {
    if (aside !== null) {
      rmSync(real, { recursive: true, force: true })
      renameSync(aside, real)
    }
  }
}

/** The `1c` command line, with its two output streams captured separately. */
async function cli(
  argv: string[],
): Promise<{ out: string; err: string; code: typeof process.exitCode }> {
  const out: string[] = []
  const err: string[] = []
  const log = vi.spyOn(console, 'log').mockImplementation((...parts: unknown[]) => {
    out.push(parts.map(String).join(' '))
  })
  const error = vi.spyOn(console, 'error').mockImplementation((...parts: unknown[]) => {
    err.push(parts.map(String).join(' '))
  })
  const before = process.exitCode
  try {
    await run(argv)
  } finally {
    log.mockRestore()
    error.mockRestore()
  }
  const code = process.exitCode
  process.exitCode = before
  return { out: out.join('\n'), err: err.join('\n'), code }
}

/** Every `.md` in the corpus, the generated map excluded. */
function corpusFiles(root: string): string[] {
  return readdirSync(corpusDir(root))
    .filter((name) => name.endsWith('.md') && name !== 'awareness.md')
    .sort()
}

afterEach(() => {
  while (shims.length) rmSync(shims.pop()!, { recursive: true, force: true })
  lastShim = null
})

// ── the corpus the build is driven over ──────────────────────────────────────

/**
 * Six documents on six clearly separate subjects.
 *
 * Separate on purpose: a search assertion is only worth making over a corpus
 * whose right answer is known, and a territory count is only meaningful when the
 * corpus genuinely has more than one subject in it. Each carries markdown
 * sections so the chunker has real sections to return.
 */
const CORPUS: StoreTicket[] = [
  ticket(
    'DOC-A',
    'Carousel behaviour module',
    `# Carousel behaviour module

## Rotation
The slides rotate automatically on a fixed interval, and the rotation loops back
to the first slide once it reaches the last one.

## Composition
A slide is a subtree bound into a slot, so the module itself ships no stylesheet.`,
  ),
  ticket(
    'DOC-B',
    'Storage and revisions',
    `# Storage and revisions

## Publishing
Publishing snapshots the draft into a numbered revision and appends it to the
history log.

## Immutability
A revision is immutable once written; a correction becomes a later revision.`,
  ),
  ticket(
    'DOC-C',
    'Typography and palette',
    `# Typography and palette

## Font axes
Font size, weight and measure are typed axes on a text leaf rather than
free-form declarations.

## Swatches
Text colour is picked from the site palette swatch and never written as a
literal value.`,
  ),
  ticket(
    'DOC-D',
    'Contact form and spam',
    `# Contact form and spam

## Anti-spam
A honeypot field and a Turnstile widget guard the public submission endpoint.

## Delivery
An accepted submission is delivered to the business inbox and recorded as a
lead.`,
  ),
  ticket(
    'DOC-E',
    'Magic link sign in',
    `# Magic link sign in

## Issuing
A single-use token is mailed to a verified mailbox; there is no password
anywhere in the flow.

## Scope
The token grants a scoped session, and an invitation grants a narrower one.`,
  ),
  ticket(
    'DOC-F',
    'Uptime monitoring',
    `# Uptime monitoring

## Probes
A scheduled probe checks availability, certificate validity and DNS health.

## Alerting
A failing probe raises an internal event rather than paging anybody directly.`,
  ),
]

// ── AC-1291 / 1301 / 1302 / 1303 / 1304: one full build, asserted many ways ──

describe('story-c4f329d3 — the whole pipeline, built once and read back', () => {
  let root: string
  let built: Awaited<ReturnType<typeof buildKb>>
  let map = ''
  /**
   * The build's own failure, carried into the tests rather than thrown out of
   * `beforeAll`. A hook that throws reports its tests as SKIPPED, which reads as
   * "not run" when what actually happened is "the pipeline is broken" — the one
   * distinction a reconciliation run has to get right.
   */
  let buildFailure: unknown = null

  beforeAll(async () => {
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    process.env.LAGRANGE_KM_DESCRIBER = STUB
    root = mkdtempSync(path.join(tmpdir(), 'kb-built-'))
    try {
      built = await withStore(paging(CORPUS), () => buildKb(root))
      map = readFileSync(path.join(corpusDir(root), 'awareness.md'), 'utf8')
    } catch (error) {
      buildFailure = error
    }
  }, 120_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    delete process.env.LAGRANGE_KM_DESCRIBER
    rmSync(root, { recursive: true, force: true })
  })

  it('test_UAT_AC1291_build_runs_the_whole_pipeline_and_reports_what_it_produced', () => {
    if (buildFailure) throw buildFailure
    // Corpus, document index, passage index, map — in that order, from one
    // command. A build that produced only the document index would leave the KB
    // technically present and practically useless, so every figure the report
    // gives is checked against the tree the build actually left behind.
    expect(corpusFiles(root)).toEqual(CORPUS.map((t) => `${t.id}.md`).sort())
    expect(existsSync(path.join(corpusDir(root), 'index'))).toBe(true)
    expect(existsSync(path.join(corpusDir(root), 'chunks'))).toBe(true)
    expect(existsSync(path.join(corpusDir(root), 'awareness.md'))).toBe(true)

    // The document count is the corpus, and on a first build every one of them
    // was newly embedded.
    expect(built.documents).toBe(corpusFiles(root).length)
    expect(built.embedded).toBe(CORPUS.length)
    // Every document has at least one section, so the passage index is strictly
    // larger than the document index.
    expect(built.chunks).toBeGreaterThan(built.documents)

    // The reported territory count is the number the map actually names.
    const headings = map.split('\n').filter((line) => line.startsWith('## '))
    expect(built.territories).toBe(headings.length)
    // …and the reported ways in are the ones the map records, which it records
    // by bolding them.
    expect(built.accessPoints).toBe((map.match(/\*\*[^*]+\*\*/g) ?? []).length)
    // The map credits whoever wrote its prose — a map written by a model and one
    // written by a stand-in are different artefacts.
    expect(built.describer).toBe('stub-describer')
  })

  it('test_UAT_AC1301_a_document_is_found_by_describing_what_it_is_about', async () => {
    if (buildFailure) throw buildFailure
    // The property the whole capability exists for: a reader that knows neither
    // the id, the filename nor the title reaches the document by describing, in
    // ordinary words, what it wants. None of "rotate", "automatically" or
    // "interval" appears in any title or id in this corpus.
    const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
    const { nodeIndexSource } = await import(/* @vite-ignore */ sharedModuleUrl('knowledge', './node'))
    const binding = await bindKb(root)

    for (const title of CORPUS.map((t) => t.title.toLowerCase())) {
      for (const word of ['rotate', 'automatically', 'interval']) {
        expect(title).not.toContain(word)
      }
    }

    const hits = await lib.search('what makes the slides rotate automatically on an interval', {
      indexes: { [SHIPPED_SOURCE]: nodeIndexSource(path.join(corpusDir(root), 'index')) },
      store: binding.store,
      kbs: binding.kbs,
      kb: SYSTEM_KB,
      topK: 3,
      embedder: (await import(/* @vite-ignore */ `file://${STUB}`)).createEmbedder(),
      sources: binding.sources,
    })

    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].uid).toBe('DOC-A')
  })

  it('test_UAT_AC1302_a_passage_search_returns_a_section_and_names_its_document', async () => {
    if (buildFailure) throw buildFailure
    // A whole design document is far too coarse a unit to hand back as an
    // answer. A passage hit must be a SECTION, and must carry the document it
    // came from so a citation resolves back to a source.
    const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
    const { nodeIndexSource } = await import(/* @vite-ignore */ sharedModuleUrl('knowledge', './node'))
    const binding = await bindKb(root)

    const hits = await lib.searchChunks('which swatch is the text colour picked from', {
      indexes: { [SHIPPED_SOURCE]: nodeIndexSource(path.join(corpusDir(root), 'chunks')) },
      store: binding.store,
      kbs: binding.kbs,
      kb: SYSTEM_KB,
      topK: 3,
      embedder: (await import(/* @vite-ignore */ `file://${STUB}`)).createEmbedder(),
      sources: binding.sources,
    })

    expect(hits.length).toBeGreaterThan(0)
    // The identity of the result is the parent document — the citation.
    expect(hits[0].uid).toBe('DOC-C')

    // …and what came back is one of its sections, not the document.
    const passage = hits[0].chunks[0]
    expect(passage.heading).toBe('Swatches')
    const body = CORPUS.find((t) => t.id === 'DOC-C')!.body
    expect(passage.end - passage.start).toBeLessThan(body.length)
  })

  it('test_UAT_AC1303_the_map_is_generated_from_the_corpus_and_names_a_territory_with_no_way_in', async () => {
    if (buildFailure) throw buildFailure
    // GENERATED, never assembled from fixed text. The evidence is that the
    // paragraphs carry this corpus's own vocabulary — a map built from constants
    // would satisfy a mere existence check and fail this one.
    expect(built.territories).toBeGreaterThanOrEqual(2)
    expect(map.toLowerCase()).toMatch(/carousel|revision|palette|honeypot|token|probe/)
    // Every way in the report counted is one the map records.
    expect(built.accessPoints).toBe((map.match(/\*\*[^*]+\*\*/g) ?? []).length)

    // A territory nothing routes to is NAMED, not passed over. These two
    // documents carry the SAME bag of words in a different order, so every query
    // scores them identically and the first-indexed one always wins the single
    // hit a one-document territory is judged in — leaving DOC-Z with no phrase
    // that demonstrably retrieves it, which is exactly the hole in the map the
    // report has to admit to rather than paper over.
    const unreachable: StoreTicket[] = [
      ticket(
        'DOC-A',
        'Carousel autoplay',
        '# Carousel autoplay slides rotate\n\ncarousel autoplay slides rotate loop interval',
      ),
      ticket(
        'DOC-Z',
        'Autoplay carousel',
        '# Rotate slides autoplay carousel\n\ninterval loop rotate slides autoplay carousel',
      ),
    ]

    const doorless = await withRoot(async (scratch) => {
      const result = await withStore(paging(unreachable), () => buildKb(scratch))
      const body = readFileSync(path.join(corpusDir(scratch), 'awareness.md'), 'utf8')
      // The section of the map whose entry point is DOC-Z — its label is what
      // the build must have reported as having no way in.
      const section = body
        .split('\n## ')
        .slice(1)
        .find((part) => part.includes('(DOC-Z)'))
      return { result, label: section?.split('\n')[0] }
    })

    expect(doorless.label).toBeTruthy()
    expect(doorless.result.doorless).toContain(doorless.label)
  }, 120_000)

  it('test_UAT_AC1304_the_map_is_out_of_the_corpus_and_found_as_the_awareness_report', async () => {
    if (buildFailure) throw buildFailure
    // Out of the corpus it describes, or every rebuild would cluster the
    // previous build's map and the KB would fill with descriptions of its own
    // descriptions.
    const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
    const binding = await bindKb(root)

    const corpus = await lib.resolveCorpus(binding.store, binding.kb)
    const uids = corpus.map((t: { uid: string }) => t.uid).sort()
    expect(uids).toEqual(CORPUS.map((t) => t.id).sort())
    expect(uids.some((uid: string) => uid.includes('awareness'))).toBe(false)

    // Retrievable all the same, through the ordinary report lookup — by kind and
    // by which KB it belongs to, with no second file-shaped path.
    const report = await lib.findAwarenessReport(binding.store, SYSTEM_KB)
    expect(report).not.toBeNull()
    expect(report.fields.kind).toBe('awareness_report')
    expect(report.fields.kb).toBe(SYSTEM_KB)
  })
})

// ── AC-1292 / 1296 / 1298 / 1299 / 1300 / 1305 / 1306: the build's contracts ──

describe('story-c4f329d3 — what the build refuses, reports and leaves alone', () => {
  beforeAll(() => {
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    process.env.LAGRANGE_KM_DESCRIBER = STUB
  })

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    delete process.env.LAGRANGE_KM_DESCRIBER
  })

  it('test_UAT_AC1292_the_corpus_can_be_built_alone_with_no_model_and_no_credentials', async () => {
    // The corpus-only form is what an operator with no credentials at all can
    // run, and it must still leave a COHERENT tree: documents plus the
    // declaration that says what they belong to, and nothing that needs a model.
    const store = [...CORPUS, ticket('DOC-OUT', 'Not in the KB', '# Not in the KB', {})]

    await withRoot(async (root) => {
      const result = await withoutEnv(
        [
          'LAGRANGE_KM_EMBEDDER',
          'LAGRANGE_KM_DESCRIBER',
          'CLOUDFLARE_ACCOUNT_ID',
          'CLOUDFLARE_API_TOKEN',
          'ANTHROPIC_API_KEY',
        ],
        () =>
          withStore(paging(store), () => {
            // Exactly what `1c kb export` runs: the declaration too, so the tree
            // is coherent, then the corpus.
            ensureConfig(root)
            return exportCorpus(root)
          }),
      )

      expect(result.docs.length).toBe(CORPUS.length)
      expect(result.dir).toBe(corpusDir(root))
      expect(result.skipped).toEqual(['DOC-OUT'])

      // One file per member document, and the declaration beside them.
      expect(corpusFiles(root)).toEqual(CORPUS.map((t) => `${t.id}.md`).sort())
      expect(existsSync(configPath(root))).toBe(true)

      // Nothing that would have needed a model.
      expect(existsSync(path.join(corpusDir(root), 'index'))).toBe(false)
      expect(existsSync(path.join(corpusDir(root), 'chunks'))).toBe(false)
      expect(existsSync(path.join(corpusDir(root), 'awareness.md'))).toBe(false)
    })

    // The AC is about the COMMAND FORM an operator types, and the block above
    // mirrors its body rather than invoking it — faithful today, and silently
    // wrong the day the command grows a step. So the form itself is driven too,
    // stripped of every credential, and asserted to produce the same coherent
    // tree without reaching a model.
    await withRepoCorpus(async () => {
      const result = await withoutEnv(
        [
          'LAGRANGE_KM_EMBEDDER',
          'LAGRANGE_KM_DESCRIBER',
          'CLOUDFLARE_ACCOUNT_ID',
          'CLOUDFLARE_API_TOKEN',
          'ANTHROPIC_API_KEY',
        ],
        () => withStore(store, () => cli(['kb', 'export'])),
      )

      expect(result.code).toBeUndefined()
      expect(result.out).toContain(`corpus: ${CORPUS.length} document(s)`)
      expect(result.err).toBe('')

      const live = kbRoot()
      expect(corpusFiles(live)).toEqual(CORPUS.map((t) => `${t.id}.md`).sort())
      expect(existsSync(configPath(live))).toBe(true)
      expect(existsSync(path.join(corpusDir(live), 'index'))).toBe(false)
      expect(existsSync(path.join(corpusDir(live), 'chunks'))).toBe(false)
      expect(existsSync(path.join(corpusDir(live), 'awareness.md'))).toBe(false)
    })
  }, 120_000)

  it('test_UAT_AC1296_every_excluded_document_is_named_individually', async () => {
    // A bare count tells an operator something is missing without telling them
    // what, which is the version of the message that generates a support
    // question. So: named, never counted, never silent — and the line names the
    // marker that would admit them, which turns a report of loss into an
    // instruction.
    const mixed: StoreTicket[] = [
      ticket('DOC-IN1', 'In one', '# In one'),
      ticket('DOC-IN2', 'In two', '# In two'),
      ticket('DOC-OUT1', 'Out one', '# Out one', {}),
      ticket('DOC-OUT2', 'Out two', '# Out two', { [KIND_FIELD]: 'architecture' }),
      ticket('DOC-OUT3', 'Out three', '# Out three', null),
    ]

    await withRoot(async (root) => {
      const result = await withStore(paging(mixed), () => exportCorpus(root))

      expect(result.skipped).toEqual(['DOC-OUT1', 'DOC-OUT2', 'DOC-OUT3'])

      // Exclusions and exports are disjoint, and together account for the store.
      const exported = result.docs.map((d) => d.id)
      expect(exported.filter((id) => result.skipped.includes(id))).toEqual([])
      expect([...exported, ...result.skipped].sort()).toEqual(mixed.map((t) => t.id).sort())
    })

    // With nothing excluded there is no exclusion line at all — the CLI prints
    // one only when this set is non-empty.
    await withRoot(async (root) => {
      const clean = await withStore(paging(CORPUS), () => exportCorpus(root))
      expect(clean.skipped).toEqual([])
    })

    // …and the same two halves through the COMMAND, because that is where the
    // AC's other claim lives: the export returns a bare array of ids, and it is
    // the command layer that says WHY those documents are out. Asserting the
    // array alone would leave the reason — and the line's conditional emission —
    // unproven, which is the half an operator actually reads.
    await withRepoCorpus(async () => {
      const excluded = await withStore(mixed, () => cli(['kb', 'export']))

      expect(excluded.code).toBeUndefined()
      expect(excluded.out).toContain('not in the KB (no fields.system_kb):')
      // Named individually, every one of them — not summarised, not truncated.
      for (const id of ['DOC-OUT1', 'DOC-OUT2', 'DOC-OUT3']) {
        expect(excluded.out).toContain(id)
      }
      // A bare count is the failure mode this AC exists to rule out.
      expect(excluded.out).not.toMatch(/\b3 skipped\b/)

      // Nothing left out: the line is absent ENTIRELY. Not printed empty, not
      // printed as a zero — an operator should have nothing to go looking for.
      const none = await withStore(CORPUS, () => cli(['kb', 'export']))
      expect(none.code).toBeUndefined()
      expect(none.out).toContain(`corpus: ${CORPUS.length} document(s)`)
      expect(none.out).not.toContain('not in the KB')
    })
  }, 120_000)

  it('test_UAT_AC1298_a_document_that_leaves_the_knowledge_base_is_deleted_from_the_corpus', async () => {
    // Withdrawal has to be a DELETION rather than a stop-refreshing: a stale
    // file would stay searchable, and confidently wrong, forever. Both ways of
    // leaving travel the same path, and the generated map travels neither.
    const pair = [ticket('DOC-P', 'Stays', '# Stays'), ticket('DOC-Q', 'Goes', '# Goes')]

    await withRoot(async (root) => {
      await withStore(paging(pair), () => exportCorpus(root))
      expect(corpusFiles(root)).toEqual(['DOC-P.md', 'DOC-Q.md'])

      // The map is written by the index step, and an export must never sweep it.
      writeFileSync(
        path.join(corpusDir(root), 'awareness.md'),
        awarenessDocument('# Awareness map: system\n\nA map.', SYSTEM_KB),
        'utf8',
      )

      // (1) The ticket no longer exists.
      const gone = await withStore(paging([pair[0]]), () => exportCorpus(root))
      expect(gone.removed).toContain('DOC-Q.md')
      expect(readdirSync(corpusDir(root))).not.toContain('DOC-Q.md')
      expect(gone.removed).not.toContain('awareness.md')
      expect(readdirSync(corpusDir(root))).toContain('awareness.md')

      // (2) The ticket still exists but has been reclassified out of the KB.
      const out = await withStore(
        paging([ticket('DOC-P', 'Stays', '# Stays', { [KIND_FIELD]: 'architecture' })]),
        () => exportCorpus(root),
      )
      expect(out.removed).toContain('DOC-P.md')
      expect(readdirSync(corpusDir(root))).not.toContain('DOC-P.md')
      expect(out.skipped).toEqual(['DOC-P'])
      expect(readdirSync(corpusDir(root))).toContain('awareness.md')
    })
  })

  it('test_UAT_AC1299_an_unchanged_document_is_not_rewritten_and_an_unchanged_corpus_is_not_re_embedded', async () => {
    // The index keys incremental work on the FILE stamp, so an export that
    // rewrote every byte-identical file would re-embed the whole corpus on every
    // build — at cost, and while telling the ranker every document had just
    // changed. This is why it is a correctness property, not an optimisation.
    await withRoot(async (root) => {
      const before = [
        ticket('DOC-S', 'Same', '# Same\n\nUnchanged body.'),
        ticket('DOC-T', 'Touched', '# Touched\n\nOriginal body.'),
      ]
      await withStore(paging(before), () => exportCorpus(root))

      // Backdate both files, so "unchanged" is provable rather than a same-
      // millisecond coincidence.
      const old = new Date(Date.now() - 10_000)
      const stable = path.join(corpusDir(root), 'DOC-S.md')
      const changing = path.join(corpusDir(root), 'DOC-T.md')
      utimesSync(stable, old, old)
      utimesSync(changing, old, old)
      const stampBefore = statSync(stable).mtimeMs

      const after = [before[0], ticket('DOC-T', 'Touched', '# Touched\n\nRewritten body.')]
      await withStore(paging(after), () => exportCorpus(root))

      // The untouched document kept its stamp; the edited one did not.
      expect(statSync(stable).mtimeMs).toBe(stampBefore)
      expect(statSync(changing).mtimeMs).toBeGreaterThan(stampBefore)
    })

    // And a rebuild over a corpus nothing changed embeds nothing at all.
    await withRoot(async (root) => {
      const first = await withStore(paging(CORPUS), () => buildKb(root))
      expect(first.embedded).toBe(CORPUS.length)

      const second = await withStore(paging(CORPUS), () => buildKb(root))
      expect(second.documents).toBe(first.documents)
      expect(second.embedded).toBe(0)
    })
  }, 120_000)

  it('test_UAT_AC1300_a_build_with_nothing_carrying_the_kind_is_refused_and_reaches_no_model', async () => {
    // "No documents" would send an operator looking in the wrong place
    // entirely; the cause is the membership KIND, so the refusal names it — the
    // field, the value and the ticket type. Run with no embedder configured at
    // all, so reaching the model would raise the CREDENTIALS error instead: the
    // membership message is therefore proof the refusal happened first.
    const nobody = [
      ticket('DOC-N1', 'No kind', '# No kind', {}),
      ticket('DOC-N2', 'Another kind', '# Another kind', { [KIND_FIELD]: 'architecture' }),
    ]

    await withRoot(async (root) => {
      const message = await withoutEnv(
        ['LAGRANGE_KM_EMBEDDER', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'],
        () =>
          withStore(paging(nobody), () => buildKb(root)).then(
            () => '',
            (err: Error) => err.message,
          ),
      )

      expect(message).not.toBe('')
      expect(message).toContain(KIND_FIELD)
      expect(message).toContain(MEMBER_KIND)
      // The ticket type, so the operator knows which tickets to look at.
      expect(message).toContain('doc ticket')
      // A kind, not a flag — and never the retired boolean.
      expect(message).toMatch(/kind, not a flag/i)
      expect(message).not.toMatch(/fields\.system_kb/)
      expect(message).not.toMatch(/no documents/i)
      // Where documents exist but carry another kind, the refusal says how many.
      expect(message).toMatch(/2 carry another kind/)

      // Nothing was built and no model was reached.
      expect(existsSync(path.join(corpusDir(root), 'index'))).toBe(false)
      expect(existsSync(path.join(corpusDir(root), 'chunks'))).toBe(false)
      expect(existsSync(path.join(corpusDir(root), 'awareness.md'))).toBe(false)
    })
  })

  it('test_UAT_AC1305_the_declaration_is_in_force_never_overwritten_and_a_missing_one_is_refused_by_name', async () => {
    // The declaration must be the thing actually used, not a document describing
    // what the code separately decides — otherwise tuning it produces no error
    // and no effect.
    await withRoot(async (root) => {
      mkdirSync(corpusDir(root), { recursive: true })
      writeFileSync(
        configPath(root),
        JSON.stringify({
          knowledge_bases: {
            system: {
              description: 'Declared description, not a hard-coded one.',
              corpus: { type: ['doc'], [`fields.${KIND_FIELD}`]: MEMBER_KIND },
              landscape: 'authored',
              source: 'shipped',
              weight: 2.5,
            },
          },
        }),
        'utf8',
      )

      const binding = await bindKb(root)
      expect(binding.kb.description).toBe('Declared description, not a hard-coded one.')
      expect(binding.kb.weight).toBe(2.5)
      expect([...binding.kb.corpus.terms.keys()]).toContain(`fields.${KIND_FIELD}`)

      // Authored data: a build never overwrites it, so a tuned description or an
      // adjusted weight survives every rebuild.
      const bytes = readFileSync(configPath(root))
      await withStore(paging(CORPUS), () => buildKb(root))
      expect(readFileSync(configPath(root)).equals(bytes)).toBe(true)
    })

    // A tree declaring no KB under the expected name is refused by name, rather
    // than silently building nothing.
    await withRoot(async (root) => {
      mkdirSync(corpusDir(root), { recursive: true })
      writeFileSync(
        configPath(root),
        JSON.stringify({
          knowledge_bases: {
            tenant: {
              description: 'Somebody else.',
              corpus: { type: ['doc'] },
              landscape: 'authored',
              source: 'shipped',
            },
          },
        }),
        'utf8',
      )
      await expect(bindKb(root)).rejects.toThrow(/system.*tenant|tenant.*system/s)
    })
  }, 120_000)

  it('test_UAT_AC1306_indexing_is_refused_without_embedding_credentials_and_the_map_needs_none', async () => {
    // The two models are asked for on different terms, and the difference is
    // visible to the operator. There is deliberately no local stand-in for the
    // embedder: a substitute would make laptop vectors incomparable with
    // production ones, and the failure mode of two models is not an error but
    // plausible-looking nonsense.
    const message = await withRoot((root) =>
      withoutEnv(
        ['LAGRANGE_KM_EMBEDDER', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'],
        () =>
          withStore(paging(CORPUS), () => buildKb(root)).then(
            () => '',
            (err: Error) => err.message,
          ),
      ),
    )
    expect(message).toContain('CLOUDFLARE_ACCOUNT_ID')
    expect(message).toContain('CLOUDFLARE_API_TOKEN')
    expect(message).toMatch(/index/i)

    // The describing seam costs no credential of its own: with no model API key
    // set it still resolves a backend, and the map is written by whatever
    // answered — which the build names.
    const describer = await withoutEnv(['ANTHROPIC_API_KEY', 'LAGRANGE_KM_DESCRIBER'], () =>
      resolveDescriber(),
    )
    expect(typeof describer.describe).toBe('function')
    expect(describer.name).toBeTruthy()

    const built = await withRoot((root) =>
      withoutEnv(['ANTHROPIC_API_KEY'], () => withStore(paging(CORPUS), () => buildKb(root))),
    )
    expect(built.describer).toBeTruthy()
    expect(built.territories).toBeGreaterThanOrEqual(2)

    // …and the usage text states both facts, so an operator knows what each form
    // will ask of them before running it.
    expect(KB_USAGE).toContain('CLOUDFLARE_ACCOUNT_ID')
    expect(KB_USAGE).toContain('CLOUDFLARE_API_TOKEN')
    expect(KB_USAGE).toMatch(/needs no credentials/i)
  }, 120_000)
})

// ── AC-1293 / 1294: the command surface ──────────────────────────────────────

describe('story-c4f329d3 — the command answers before it acts', () => {
  it('test_UAT_AC1293_status_reports_the_corpus_against_the_ticket_count_and_each_artefact', async () => {
    // Four facts, over three trees: how many documents, and whether each of the
    // three artefacts is built or missing.
    await withRoot(async (root) => {
      // Nothing built at all — reports zeros rather than failing.
      await withStore(paging([]), () => {
        expect(kbStatus(root)).toMatchObject({
          corpus: 0,
          tickets: 0,
          index: false,
          chunks: false,
          map: false,
        })
      })
    })

    await withRoot(async (root) => {
      process.env.LAGRANGE_KM_EMBEDDER = STUB
      process.env.LAGRANGE_KM_DESCRIBER = STUB
      try {
        await withStore(paging(CORPUS), () => {
          exportCorpus(root)
          expect(kbStatus(root)).toMatchObject({
            corpus: CORPUS.length,
            tickets: CORPUS.length,
            index: false,
            chunks: false,
            map: false,
          })
        })

        await withStore(paging(CORPUS), () => buildKb(root))
        // The generated map sits in the corpus directory but is not one of the
        // documents, so the count is unchanged by it.
        expect(readdirSync(corpusDir(root))).toContain('awareness.md')
        await withStore(paging(CORPUS), () => {
          expect(kbStatus(root)).toMatchObject({
            corpus: CORPUS.length,
            tickets: CORPUS.length,
            index: true,
            chunks: true,
            map: true,
          })
        })
      } finally {
        delete process.env.LAGRANGE_KM_EMBEDDER
        delete process.env.LAGRANGE_KM_DESCRIBER
      }
    })

    // The corpus line takes one of three shapes, and all three are the point of
    // the change: a bare file count cannot show truncation, because 37 documents
    // looks exactly as healthy as 38 unless something says what the number was
    // supposed to be.
    //
    // (1) AGREEMENT — an empty corpus against an empty store.
    const agreeing = await withRealCorpusAside(() =>
      withStore(paging([]), () => cli(['kb', 'status'])),
    )
    expect(agreeing.out).toMatch(
      new RegExp(`of 0 ticket\\(s\\) carrying ${KIND_FIELD}: ${MEMBER_KIND}`),
    )

    // (2) DISAGREEMENT — nothing on disk against three in the store: a warning,
    // the word stale, and the command that repairs it.
    const stale = await withRealCorpusAside(() =>
      withStore(
        paging([
          ticket('DOC-A', 'One', '# One'),
          ticket('DOC-B', 'Two', '# Two'),
          ticket('DOC-C', 'Three', '# Three'),
        ]),
        () => cli(['kb', 'status']),
      ),
    )
    expect(stale.out).toMatch(new RegExp(`3 ticket\\(s\\) carry ${KIND_FIELD}: ${MEMBER_KIND}`))
    expect(stale.out).toMatch(/stale/)
    expect(stale.out).toContain('1c kb export')

    // (3) UNKNOWN — a store that cannot be read at all. Never zero: zero is a
    // real and alarming answer, and manufacturing it from an unrelated failure
    // would send an operator to rebuild a corpus that was never broken.
    const unreadable = await withStore(
      () => installStore('process.exit(3)'),
      () => cli(['kb', 'status']),
    )
    expect(unreadable.out).toContain('ticket store unreadable')
    expect(unreadable.out).not.toMatch(/of 0 ticket/)
    await withRoot(async (root) => {
      const status = await withStore(() => installStore('process.exit(3)'), () => kbStatus(root))
      expect((status as { tickets: number | null }).tickets).toBeNull()
      expect(status.corpus).toBe(0)
    })

    // Naming no form at all reports the same thing, so the bare command is safe:
    // it answers rather than acting.
    const bare = await withStore(paging([]), () => cli(['kb']))
    const named = await withStore(paging([]), () => cli(['kb', 'status']))
    expect(bare.code).toBeUndefined()
    expect(bare.out).toBe(named.out)
    expect(bare.out).toMatch(/^corpus: /m)
    expect(bare.out).toMatch(/^index: {2}(built|missing)$/m)
    expect(bare.out).toMatch(/^chunks: (built|missing)$/m)
    expect(bare.out).toMatch(/^map: {4}(built|missing)$/m)
  }, 120_000)

  it('test_UAT_AC1294_an_unrecognised_form_is_refused_with_usage_and_builds_nothing', async () => {
    // The refusal names the unrecognised word, prints the usage, goes to the
    // error stream, exits non-zero — and touches nothing.
    const before = existsSync(kbRoot()) ? readdirSync(kbRoot()).sort() : []
    const stamps = before.map((name) => statSync(path.join(kbRoot(), name)).mtimeMs)

    const result = await cli(['kb', 'nonsense'])

    expect(result.code).toBe(1)
    expect(result.err).toContain('nonsense')
    expect(result.err).toContain('usage: 1c kb <build|export|status>')
    expect(result.out).toBe('')

    const after = existsSync(kbRoot()) ? readdirSync(kbRoot()).sort() : []
    expect(after).toEqual(before)
    expect(after.map((name) => statSync(path.join(kbRoot(), name)).mtimeMs)).toEqual(stamps)
  })
})

// ── AC-1295 / 1632 / 1633: membership, the declaration, and the listing ──────

describe('story-c4f329d3 — what is in the knowledge base, and how it is read', () => {
  it('test_UAT_AC1295_only_the_system_kb_doc_kind_puts_a_document_in', async () => {
    // Membership is a KIND, not a flag (DOC-39 §3.3). `doc_kind` is
    // single-valued, so "this architecture document is ALSO a system document"
    // is unsayable — which is the category error the kind exists to prevent.
    // The retired boolean is superseded rather than deprecated: a document still
    // carrying `system_kb: true` and nothing else is NOT a member, because
    // honouring a marker nobody maintains any more is how a document reaches a
    // client-facing assistant that nobody meant to put there.
    const shapes: StoreTicket[] = [
      ticket('DOC-KIND', 'The kind', '# Kind'), //            in  — doc_kind: system_kb
      ticket('DOC-ABSENT', 'No kind field', '# Absent', {}), // out — field absent
      ticket('DOC-NOFIELDS', 'No fields at all', '# None', null), // out — no fields
      ticket('DOC-OTHER', 'Another kind', '# Other', { [KIND_FIELD]: 'architecture' }), // out
      ticket('DOC-NEARMISS', 'Near miss', '# Near', { [KIND_FIELD]: 'System_KB' }), // out
      ticket('DOC-RETIRED', 'Retired boolean', '# Retired', { system_kb: true }), // out
    ]

    await withRoot(async (root) => {
      const result = await withStore(paging(shapes), () => exportCorpus(root))

      expect(result.docs.map((d) => d.id)).toEqual(['DOC-KIND'])
      expect(result.skipped).toEqual([
        'DOC-ABSENT',
        'DOC-NEARMISS',
        'DOC-NOFIELDS',
        'DOC-OTHER',
        'DOC-RETIRED',
      ])
      expect(corpusFiles(root)).toEqual(['DOC-KIND.md'])
    })

    // The integration half, against the REAL store, through the export command:
    // what the corpus ends up holding is exactly what the rule selects — nothing
    // silently added, nothing silently dropped, and no excluded document with a
    // file in the corpus.
    //
    // AGREEMENT IS THE CLAIM, AND MEMBER COUNT IS NOT PART OF IT. How many
    // documents an operator has marked is curation state, not behaviour: today
    // none carry the kind, because the value cannot be set until the `doc_kind`
    // enum that xgd owns ships it (REQ-164; [[DOC-39]] §10), and the day it does
    // the count becomes whatever that week's curation says. A criterion that
    // demanded a non-empty member set would assert the corpus's *contents*
    // rather than the membership *rule* — and it would contradict AC-1300 in the
    // same story, which pins the empty-member-set store as a declared, tested
    // state. So what is guarded against vacuity here is the thing the rule needs
    // in order to have been exercised at all: real documents to decide about,
    // and a real decision reached on every one of them.
    await withRoot((root) => {
      const tickets = readDocTickets()
      const exported = exportCorpus(root)

      const shouldBeIn = tickets.filter(isMember).map((t) => t.id).sort()
      const shouldBeOut = tickets.filter((t) => !isMember(t)).map((t) => t.id).sort()

      // NOT VACUOUS: the store really does hold documents, the rule really was
      // applied to each of them, and every one reached a decision — so the
      // equalities below are agreement over a populated store rather than two
      // empty lists matching each other.
      expect(tickets.length).toBeGreaterThan(0)
      expect(shouldBeIn.length + shouldBeOut.length).toBe(tickets.length)
      expect(shouldBeOut.length).toBeGreaterThan(0)

      expect(exported.docs.map((d) => d.id).sort()).toEqual(shouldBeIn)
      expect(exported.skipped).toEqual(shouldBeOut)

      // EXACTLY the members have a file — an equality over the whole corpus
      // directory rather than an absence checked per excluded document, so a
      // file the rule never selected cannot survive there unnoticed either.
      const onDisk = corpusFiles(root)
      expect(onDisk).toEqual(shouldBeIn.map((id) => `${id}.md`))
      for (const id of shouldBeOut) expect(onDisk).not.toContain(`${id}.md`)
    })
  }, 300_000)

  it('test_UAT_AC1632_the_declarations_restrict_nothing_and_any_markdown_file_resolves', async () => {
    // At runtime the distribution IS the corpus: a directory of markdown served
    // through the ticket interface by a read-only store, whose every member
    // matched by construction when the export wrote it. Re-applying the export's
    // own selection as a query-time predicate can only ever SUBTRACT, and the
    // only thing it can subtract is a file whose frontmatter does not look the
    // way the predicate expects — which then disappears with no error at all.

    // The declaration that actually SHIPS in the repository.
    const shipped = JSON.parse(readFileSync(configPath(kbRoot()), 'utf8'))
    expect(shipped.knowledge_bases[SYSTEM_KB].corpus).toEqual({})

    // …and the one a fresh tree is scaffolded with. Both, because a declaration
    // is never written over an existing one: the two can drift apart with no
    // error, and a scaffold that restricted what the shipped file does not would
    // give a fresh checkout a quietly different knowledge base.
    await withRoot((root) => {
      ensureConfig(root)
      const scaffolded = JSON.parse(readFileSync(configPath(root), 'utf8'))
      expect(scaffolded.knowledge_bases[SYSTEM_KB].corpus).toEqual({})
      expect(scaffolded.knowledge_bases[SYSTEM_KB].source).toBe('shipped')
    })

    // The behavioural half, and the one that matters: three files a
    // `type=doc AND fields.<kind>=system_kb` predicate would each have dropped
    // for a different reason all resolve as documents of this knowledge base.
    await withRoot(async (root) => {
      const dir = corpusDir(root)
      mkdirSync(dir, { recursive: true })
      ensureConfig(root)

      writeFileSync(
        path.join(dir, 'DOC-FULL.md'),
        `---\nid: DOC-FULL\ntype: doc\ntitle: Full frontmatter\nfields:\n` +
          `  ${KIND_FIELD}: ${MEMBER_KIND}\n---\n# Full\n\nBody.\n`,
        'utf8',
      )
      // No `fields` block at all — the shape the old predicate silently dropped.
      writeFileSync(
        path.join(dir, 'DOC-THIN.md'),
        '---\nid: DOC-THIN\ntype: doc\ntitle: No fields\n---\n# Thin\n\nBody.\n',
        'utf8',
      )
      // No frontmatter whatsoever: bare markdown, hand-dropped into the corpus.
      writeFileSync(path.join(dir, 'DOC-BARE.md'), '# Bare\n\nJust prose.\n', 'utf8')

      const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
      const binding = await bindKb(root)
      const resolved = await lib.resolveCorpus(binding.store, binding.kb)

      expect(resolved.map((t: { uid: string }) => t.uid).sort()).toEqual([
        'DOC-BARE',
        'DOC-FULL',
        'DOC-THIN',
      ])
      // The predicate the corpus resolves through excludes nothing the directory
      // holds — structurally, not merely in this instance.
      expect([...binding.kb.corpus.terms.keys()]).toEqual([])
      expect([...binding.kb.corpus.types]).toEqual([])
    })
  }, 120_000)

  it('test_UAT_AC1633_the_listing_is_exhaustive_and_a_truncated_envelope_is_refused', async () => {
    // `xgd ticket list` pages by default and reports the rest in the envelope. A
    // reader that takes `items` and stops takes page one and calls it the
    // corpus, with no error and no warning. 60 > the 50-item default page on
    // purpose: a fixture smaller than one page passes vacuously, which is
    // exactly how this class of failure survives.
    const many = Array.from({ length: 60 }, (_, i) =>
      ticket(`DOC-${String(i + 1).padStart(3, '0')}`, `Doc ${i + 1}`, `# Doc ${i + 1}\n\nBody.`),
    )

    const read = await withStore(paging(many), () => readDocTickets())
    expect(read.length).toBe(60)
    expect(read.map((t) => t.id)).toContain('DOC-060')
    // The REQUEST asks for the whole store rather than for a page.
    expect(recordedArgv()).toContain('--no-limit')

    // …and every document past the page boundary reaches the corpus.
    await withRoot(async (root) => {
      const result = await withStore(paging(many), () => exportCorpus(root))
      expect(result.docs.length).toBe(60)
      expect(existsSync(path.join(corpusDir(root), 'DOC-060.md'))).toBe(true)
    })

    // Asking is not enough on its own. If a truncated envelope arrives anyway —
    // an older toolchain on PATH, an affordance that stops meaning what it means
    // — that is a loud failure naming the affordance and the count received, not
    // a quietly shorter corpus.
    const stubborn = () =>
      installStore(
        `const all = ${JSON.stringify(many)}\n` +
          `process.stdout.write(JSON.stringify({ items: all.slice(0, 50), next_cursor: 'page-2', truncated: true }))`,
      )
    await expect(withStore(stubborn, () => readDocTickets())).rejects.toThrow(/truncated/i)
    await expect(withStore(stubborn, () => readDocTickets())).rejects.toThrow(/--no-limit/)
    await expect(withStore(stubborn, () => readDocTickets())).rejects.toThrow(/50/)

    // …and no short corpus is written.
    await withRoot(async (root) => {
      await expect(withStore(stubborn, () => exportCorpus(root))).rejects.toThrow(/truncated/i)
      expect(existsSync(corpusDir(root)) ? corpusFiles(root) : []).toEqual([])
    })

    // An envelope carrying no continuation is accepted as complete, whether it
    // holds one page or many — the guard must not fire on the ordinary case.
    const few = [ticket('DOC-A', 'A', '# A'), ticket('DOC-B', 'B', '# B')]
    const whole = await withStore(paging(few), () => readDocTickets())
    expect(whole.map((t) => t.id)).toEqual(['DOC-A', 'DOC-B'])
  }, 120_000)
})

// ── AC-1297: the real document store, exported and read back ─────────────────

/**
 * One export of the REAL ticket store, asserted from two angles.
 *
 * Deliberately not a fixture here: what is being tested is that OUR documents,
 * as they actually are, survive the trip into the corpus format — and the
 * format's sharp edges are ones only real data reliably has. Reading the store
 * costs a minute, so both ACs share the one run rather than paying twice.
 *
 * What the real store may NOT do is decide the verdict. How many documents are
 * opted in is data no branch controls, and it has already been zero once — which
 * turned the read-back assertions below into a loop over nothing that passed for
 * that reason. So each AC is proven over a SEEDED corpus, which cannot degrade,
 * and the real store is asserted for AGREEMENT — a property that holds at any
 * size, zero included, and would still catch a rule and an export disagreeing.
 */
describe('story-c4f329d3 — the real document store, exported and read back', () => {
  let root: string
  let exported: ReturnType<typeof exportCorpus>

  beforeAll(() => {
    root = mkdtempSync(path.join(tmpdir(), 'kb-real-'))
    exported = exportCorpus(root)
  }, 300_000)

  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it('test_UAT_AC1295_only_a_genuine_boolean_true_opts_a_document_in', async () => {
    // Strictly the boolean, and every other shape is out. A value that merely
    // LOOKS like true is a document whose frontmatter did not parse the way its
    // author assumed; admitting it would hide exactly the failure worth seeing,
    // which is a document silently reaching a client-facing assistant.
    expect(optedIn({ fields: { system_kb: true } })).toBe(true)
    expect(optedIn({ fields: {} })).toBe(false)
    expect(optedIn({})).toBe(false)
    expect(optedIn({ fields: null })).toBe(false)
    expect(optedIn({ fields: { system_kb: false } })).toBe(false)
    expect(optedIn({ fields: { system_kb: 'true' } })).toBe(false)
    expect(optedIn({ fields: { system_kb: 1 } })).toBe(false)

    // The integration half, over a SEEDED store: each of the near-miss shapes
    // above put on an actual document and run through the real export, so the
    // rule is proven where it is applied and not only where it is defined. The
    // seed cannot degrade to nothing, so this half is the one that carries the
    // AC's weight.
    await withRoot(async (scratch) => {
      const seeded = await withStore(
        [
          ticket('DOC-IN', 'Genuinely opted in', '# In', { system_kb: true }),
          ticket('DOC-STR', 'The string true', '# Out', { system_kb: 'true' }),
          ticket('DOC-ONE', 'The number one', '# Out', { system_kb: 1 }),
          ticket('DOC-FALSE', 'Explicitly false', '# Out', { system_kb: false }),
          ticket('DOC-NONE', 'No opt-in at all', '# Out', {}),
        ],
        () => exportCorpus(scratch),
      )

      expect(seeded.docs.map((d) => d.id)).toEqual(['DOC-IN'])
      expect(seeded.skipped.sort()).toEqual(['DOC-FALSE', 'DOC-NONE', 'DOC-ONE', 'DOC-STR'])
      expect(corpusFiles(scratch)).toEqual(['DOC-IN.md'])
    })

    // …and against the real store, AGREEMENT: what the export produced is
    // exactly what the rule selects — nothing silently added, nothing silently
    // dropped, and no excluded document with a file in the corpus. This holds at
    // any corpus size, so live data cannot turn it red or make it vacuous.
    const shouldBeIn = tickets.filter(optedIn).map((t) => t.id).sort()
    const shouldBeOut = tickets.filter((t) => !optedIn(t)).map((t) => t.id).sort()

    expect(exported.docs.map((d) => d.id).sort()).toEqual(shouldBeIn)
    expect(exported.skipped).toEqual(shouldBeOut)

    const onDisk = corpusFiles(root)
    for (const id of shouldBeOut) expect(onDisk).not.toContain(`${id}.md`)
  }, 300_000)

  it('test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document', async () => {
    // The address is the HUMAN ID, never the title: a retitled document must
    // stay the same document, or every stored citation dangles.
    const { DocDirStore } = await import(/* @vite-ignore */ sharedModuleUrl('ticketing'))
    const { nodeDocReader } = await import(/* @vite-ignore */ sharedModuleUrl('ticketing', './node'))

    // The shape assertions run over a SEEDED corpus, so there is always
    // something for them to run over. A loop over an empty corpus asserts
    // nothing while reporting green, which is the one failure that survives a
    // passing suite.
    await withRoot(async (scratch) => {
      const seeded = await withStore(
        [
          ticket('DOC-901', 'Addressed by its id', '# One\n\nBody text.'),
          ticket('DOC-902', 'And so is this one', '# Two\n\nMore body text.'),
        ],
        () => exportCorpus(scratch),
      )
      expect(seeded.docs.length).toBe(2)

      const seededStore = new DocDirStore(nodeDocReader(corpusDir(scratch)), { type: 'doc' })
      const { tickets: seededBack } = await seededStore.query({ type: 'doc' })
      expect(seededBack.length).toBe(2)
      for (const doc of seededBack) {
        expect(doc.uid).toMatch(/^[A-Z]+-\d+$/)
        expect(doc.title).toBeTruthy()
        expect(doc.body.length).toBeGreaterThan(0)
        // The way back to the ticket it came from — the uid cannot survive as the
        // address, so it survives as provenance.
        expect(doc.fields.origin_uid).toMatch(/^doc-/)
      }
    })

    // The same properties over the real corpus — every document actually
    // exported reads back as a document, and the count round-trips.
    const store = new DocDirStore(nodeDocReader(corpusDir(root)), { type: 'doc' })
    const { tickets: readBack } = await store.query({ type: 'doc' })

    expect(readBack.length).toBeGreaterThan(0)
    expect(readBack.length).toBe(exported.docs.length)
    for (const doc of readBack) {
      expect(doc.uid).toMatch(/^[A-Z]+-\d+$/)
      expect(doc.title).toBeTruthy()
      expect(doc.body.length).toBeGreaterThan(0)
      expect(doc.fields.origin_uid).toMatch(/^doc-/)
    }

    // A retitle leaves the document at the same address.
    await withRoot(async (scratch) => {
      await withStore(paging([ticket('DOC-R', 'First title', '# Body')]), () =>
        exportCorpus(scratch),
      )
      const renamed = await withStore(
        paging([ticket('DOC-R', 'A completely different title', '# Body')]),
        () => exportCorpus(scratch),
      )
      expect(corpusFiles(scratch)).toEqual(['DOC-R.md'])
      expect(renamed.removed).toEqual([])
    })

    // A structured field is DROPPED rather than coerced: the corpus format holds
    // one level of fields, and `String({})` would sit there looking like data
    // while being neither the value nor an error. A title carrying punctuation
    // that would otherwise change how the document parses survives intact.
    const rendered = corpusDocument({
      uid: 'doc-1',
      id: 'DOC-99',
      title: 'Storage: the "why"',
      body: '# Has structure',
      created_at: null,
      updated_at: null,
      fields: { [KIND_FIELD]: MEMBER_KIND, references: { a: 1 }, tags: ['x'] },
    })
    expect(rendered).toContain(`${KIND_FIELD}: ${MEMBER_KIND}`)
    expect(rendered).not.toContain('[object Object]')
    expect(rendered).not.toContain('references:')
    expect(rendered).not.toContain('tags:')

    await withRoot(async (scratch) => {
      mkdirSync(corpusDir(scratch), { recursive: true })
      writeFileSync(path.join(corpusDir(scratch), 'DOC-99.md'), rendered, 'utf8')
      const punctuated = new DocDirStore(nodeDocReader(corpusDir(scratch)), { type: 'doc' })
      const { tickets: one } = await punctuated.query({ type: 'doc' })
      expect(one[0].uid).toBe('DOC-99')
      expect(one[0].title).toBe('Storage: the "why"')
    })
  }, 300_000)
})
