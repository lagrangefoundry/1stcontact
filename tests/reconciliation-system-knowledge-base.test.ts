import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
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
  optedIn,
  readDocTickets,
  resolveDescriber,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import { run } from '../tools/generate/src/cli'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'

/**
 * Reconciliation UATs for story-c4f329d3 — **the system knowledge base**: the
 * pipeline that turns our own `doc` tickets into something an assistant can
 * search (AC-1291 … AC-1306).
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
 *     on `PATH` by a shim that prints a controlled ticket list. This is a
 *     separate product invoked as a subprocess, not one of our modules: the
 *     export's own JSON parsing, opt-in filtering, rendering, incremental write
 *     and sweep all still run for real.
 *
 * Everything else is the real thing — the real `DocDirStore`, the real index and
 * chunk builds, the real cosine search and ranker, the real clustering, the real
 * access-point validation, and `buildKb` itself as the entry point.
 *
 * Controlling the store is what makes the harder ACs assertable rather than
 * vacuous: the real store has every document opted in, so exclusions, removals
 * and the nothing-opted-in refusal have nothing to demonstrate against it. Where
 * an AC asks specifically for the real store (AC-1295's integration half,
 * AC-1297's read-back) it gets the real store, in one shared export.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

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

/** A ticket that has opted into the KB, unless `fields` says otherwise. */
function ticket(id: string, title: string, body: string, fields: Record<string, unknown> | null = { system_kb: true }): StoreTicket {
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

/**
 * Put an `xgd` that answers with `tickets` at the front of `PATH`.
 *
 * The export reads the store through the ticketing CLI as a subprocess, so the
 * subprocess is where it is stood in for — the export's own code path is
 * untouched, down to the JSON it has to parse.
 */
function installStubStore(tickets: StoreTicket[]): () => void {
  const dir = mkdtempSync(path.join(tmpdir(), 'kb-store-'))
  const payload = path.join(dir, 'tickets.json')
  writeFileSync(payload, JSON.stringify({ items: tickets }), 'utf8')
  const shim = path.join(dir, 'xgd')
  writeFileSync(
    shim,
    `#!/usr/bin/env node\nprocess.stdout.write(require('node:fs').readFileSync(${JSON.stringify(payload)}, 'utf8'))\n`,
    'utf8',
  )
  chmodSync(shim, 0o755)
  const previous = process.env.PATH
  process.env.PATH = `${dir}${path.delimiter}${previous ?? ''}`
  return () => {
    if (previous === undefined) delete process.env.PATH
    else process.env.PATH = previous
    rmSync(dir, { recursive: true, force: true })
  }
}

/** Run `fn` against a store holding exactly `tickets`. */
async function withStore<T>(tickets: StoreTicket[], fn: () => Promise<T> | T): Promise<T> {
  const restore = installStubStore(tickets)
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
  let map: string

  beforeAll(async () => {
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    process.env.LAGRANGE_KM_DESCRIBER = STUB
    root = mkdtempSync(path.join(tmpdir(), 'kb-built-'))
    built = await withStore(CORPUS, () => buildKb(root))
    map = readFileSync(path.join(corpusDir(root), 'awareness.md'), 'utf8')
  }, 120_000)

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    delete process.env.LAGRANGE_KM_DESCRIBER
    rmSync(root, { recursive: true, force: true })
  })

  it('test_UAT_AC1291_build_runs_the_whole_pipeline_and_reports_what_it_produced', () => {
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
      source: nodeIndexSource(path.join(corpusDir(root), 'index')),
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
    // A whole design document is far too coarse a unit to hand back as an
    // answer. A passage hit must be a SECTION, and must carry the document it
    // came from so a citation resolves back to a source.
    const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
    const { nodeIndexSource } = await import(/* @vite-ignore */ sharedModuleUrl('knowledge', './node'))
    const binding = await bindKb(root)

    const hits = await lib.searchChunks('which swatch is the text colour picked from', {
      source: nodeIndexSource(path.join(corpusDir(root), 'chunks')),
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
      const result = await withStore(unreachable, () => buildKb(scratch))
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
          withStore(store, () => {
            // Exactly what `1c kb export` runs: the declaration too, so the tree
            // is coherent, then the corpus.
            ensureConfig(root)
            return exportCorpus(root)
          }),
      )

      expect(result.docs.length).toBe(CORPUS.length)
      expect(result.dir).toBe(corpusDir(root))
      expect(result.skipped).toEqual(['DOC-OUT'])

      // One file per opted-in document, and the declaration beside them.
      expect(corpusFiles(root)).toEqual(CORPUS.map((t) => `${t.id}.md`).sort())
      expect(existsSync(configPath(root))).toBe(true)

      // Nothing that would have needed a model.
      expect(existsSync(path.join(corpusDir(root), 'index'))).toBe(false)
      expect(existsSync(path.join(corpusDir(root), 'chunks'))).toBe(false)
      expect(existsSync(path.join(corpusDir(root), 'awareness.md'))).toBe(false)
    })
  })

  it('test_UAT_AC1296_every_excluded_document_is_named_individually', async () => {
    // A bare count tells an operator something is missing without telling them
    // what, which is the version of the message that generates a support
    // question. So: named, never counted, never silent.
    const mixed: StoreTicket[] = [
      ticket('DOC-IN1', 'In one', '# In one'),
      ticket('DOC-IN2', 'In two', '# In two'),
      ticket('DOC-OUT1', 'Out one', '# Out one', {}),
      ticket('DOC-OUT2', 'Out two', '# Out two', { system_kb: false }),
      ticket('DOC-OUT3', 'Out three', '# Out three', null),
    ]

    await withRoot(async (root) => {
      const result = await withStore(mixed, () => exportCorpus(root))

      expect(result.skipped).toEqual(['DOC-OUT1', 'DOC-OUT2', 'DOC-OUT3'])

      // Exclusions and exports are disjoint, and together account for the store.
      const exported = result.docs.map((d) => d.id)
      expect(exported.filter((id) => result.skipped.includes(id))).toEqual([])
      expect([...exported, ...result.skipped].sort()).toEqual(mixed.map((t) => t.id).sort())
    })

    // With nothing excluded there is no exclusion line at all — the CLI prints
    // one only when this set is non-empty.
    await withRoot(async (root) => {
      const clean = await withStore(CORPUS, () => exportCorpus(root))
      expect(clean.skipped).toEqual([])
    })
  })

  it('test_UAT_AC1298_a_document_that_leaves_the_knowledge_base_is_deleted_from_the_corpus', async () => {
    // Withdrawal has to be a DELETION rather than a stop-refreshing: a stale
    // file would stay searchable, and confidently wrong, forever. Both ways of
    // leaving travel the same path, and the generated map travels neither.
    const pair = [ticket('DOC-P', 'Stays', '# Stays'), ticket('DOC-Q', 'Goes', '# Goes')]

    await withRoot(async (root) => {
      await withStore(pair, () => exportCorpus(root))
      expect(corpusFiles(root)).toEqual(['DOC-P.md', 'DOC-Q.md'])

      // The map is written by the index step, and an export must never sweep it.
      writeFileSync(
        path.join(corpusDir(root), 'awareness.md'),
        awarenessDocument('# Awareness map: system\n\nA map.', SYSTEM_KB),
        'utf8',
      )

      // (1) The ticket no longer exists.
      const gone = await withStore([pair[0]], () => exportCorpus(root))
      expect(gone.removed).toContain('DOC-Q.md')
      expect(readdirSync(corpusDir(root))).not.toContain('DOC-Q.md')
      expect(gone.removed).not.toContain('awareness.md')
      expect(readdirSync(corpusDir(root))).toContain('awareness.md')

      // (2) The ticket still exists but has opted back out.
      const out = await withStore(
        [ticket('DOC-P', 'Stays', '# Stays', { system_kb: false })],
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
      const before = [ticket('DOC-S', 'Same', '# Same\n\nUnchanged body.'), ticket('DOC-T', 'Touched', '# Touched\n\nOriginal body.')]
      await withStore(before, () => exportCorpus(root))

      // Backdate both files, so "unchanged" is provable rather than a same-
      // millisecond coincidence.
      const old = new Date(Date.now() - 10_000)
      const stable = path.join(corpusDir(root), 'DOC-S.md')
      const changing = path.join(corpusDir(root), 'DOC-T.md')
      utimesSync(stable, old, old)
      utimesSync(changing, old, old)
      const stampBefore = statSync(stable).mtimeMs

      const after = [before[0], ticket('DOC-T', 'Touched', '# Touched\n\nRewritten body.')]
      await withStore(after, () => exportCorpus(root))

      // The untouched document kept its stamp; the edited one did not.
      expect(statSync(stable).mtimeMs).toBe(stampBefore)
      expect(statSync(changing).mtimeMs).toBeGreaterThan(stampBefore)
    })

    // And a rebuild over a corpus nothing changed embeds nothing at all.
    await withRoot(async (root) => {
      const first = await withStore(CORPUS, () => buildKb(root))
      expect(first.embedded).toBe(CORPUS.length)

      const second = await withStore(CORPUS, () => buildKb(root))
      expect(second.documents).toBe(first.documents)
      expect(second.embedded).toBe(0)
    })
  }, 120_000)

  it('test_UAT_AC1300_a_build_with_nothing_opted_in_is_refused_and_reaches_no_model', async () => {
    // "No documents" would send an operator looking in the wrong place
    // entirely; the cause is the opt-in flag, so the refusal names it. Run with
    // no embedder configured at all, so reaching the model would raise the
    // CREDENTIALS error instead — the opt-in message is therefore proof the
    // refusal happened first.
    const nobody = [
      ticket('DOC-N1', 'Absent flag', '# Absent flag', {}),
      ticket('DOC-N2', 'False flag', '# False flag', { system_kb: false }),
    ]

    await withRoot(async (root) => {
      await withoutEnv(
        ['LAGRANGE_KM_EMBEDDER', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'], async () => {
          await expect(withStore(nobody, () => buildKb(root))).rejects.toThrow(/system_kb/)
        },
      )

      const message = await withoutEnv(
        ['LAGRANGE_KM_EMBEDDER', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'],
        () => withStore(nobody, () => buildKb(root)).then(() => '', (err: Error) => err.message),
      )
      expect(message).toContain('opt-in')
      expect(message).toContain('doc')
      expect(message).not.toMatch(/no documents/i)

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
              corpus: { type: ['doc'], 'fields.system_kb': true },
              landscape: 'authored',
              source: 'shipped',
              weight: 2.5,
            },
          },
        }),
        'utf8',
      )

      const binding = await bindKb(root)
      expect(binding.kb.prompt).toBe('Declared prompt, not a hard-coded one.')
      expect(binding.kb.weight).toBe(2.5)
      expect([...binding.kb.corpus.terms.keys()]).toContain('fields.system_kb')

      // Authored data: a build never overwrites it, so a tuned prompt or an
      // adjusted weight survives every rebuild.
      const bytes = readFileSync(configPath(root))
      await withStore(CORPUS, () => buildKb(root))
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
        () => withStore(CORPUS, () => buildKb(root)).then(() => '', (err: Error) => err.message),
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
      withoutEnv(['ANTHROPIC_API_KEY'], () => withStore(CORPUS, () => buildKb(root))),
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
  it('test_UAT_AC1293_status_reports_the_corpus_size_and_each_artefact', async () => {
    // Four facts, over three trees: how many documents, and whether each of the
    // three artefacts is built or missing.
    await withRoot((root) => {
      // Nothing built at all — reports zeros rather than failing.
      expect(kbStatus(root)).toEqual({ corpus: 0, index: false, chunks: false, map: false })
    })

    await withRoot(async (root) => {
      process.env.LAGRANGE_KM_EMBEDDER = STUB
      process.env.LAGRANGE_KM_DESCRIBER = STUB
      try {
        await withStore(CORPUS, () => exportCorpus(root))
        expect(kbStatus(root)).toEqual({
          corpus: CORPUS.length,
          index: false,
          chunks: false,
          map: false,
        })

        await withStore(CORPUS, () => buildKb(root))
        // The generated map sits in the corpus directory but is not one of the
        // documents, so the count is unchanged by it.
        expect(readdirSync(corpusDir(root))).toContain('awareness.md')
        expect(kbStatus(root)).toEqual({
          corpus: CORPUS.length,
          index: true,
          chunks: true,
          map: true,
        })
      } finally {
        delete process.env.LAGRANGE_KM_EMBEDDER
        delete process.env.LAGRANGE_KM_DESCRIBER
      }
    })

    // Naming no form at all reports the same thing, so the bare command is safe:
    // it answers rather than acting.
    const expected = kbStatus()
    const bare = await cli(['kb'])
    expect(bare.code).toBeUndefined()
    expect(bare.out).toContain(`corpus: ${expected.corpus} document(s)`)
    expect(bare.out).toContain(`index:  ${expected.index ? 'built' : 'missing'}`)
    expect(bare.out).toContain(`chunks: ${expected.chunks ? 'built' : 'missing'}`)
    expect(bare.out).toContain(`map:    ${expected.map ? 'built' : 'missing'}`)
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

// ── AC-1295 / 1297: the real document store ──────────────────────────────────

/**
 * One export of the REAL ticket store, asserted from two angles.
 *
 * Deliberately not a fixture here: what is being tested is that OUR documents,
 * as they actually are, survive the trip into the corpus format — and the
 * format's sharp edges are ones only real data reliably has. Reading the store
 * costs a minute, so both ACs share the one run rather than paying twice.
 */
describe('story-c4f329d3 — the real document store, exported and read back', () => {
  let root: string
  let exported: ReturnType<typeof exportCorpus>
  let tickets: ReturnType<typeof readDocTickets>

  beforeAll(() => {
    root = mkdtempSync(path.join(tmpdir(), 'kb-real-'))
    exported = exportCorpus(root)
    tickets = readDocTickets()
  }, 300_000)

  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it('test_UAT_AC1295_only_a_genuine_boolean_true_opts_a_document_in', () => {
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

    // The integration half, against the real store: what the export produced is
    // exactly what the rule selects — nothing silently added, nothing silently
    // dropped, and no excluded document with a file in the corpus.
    const shouldBeIn = tickets.filter(optedIn).map((t) => t.id).sort()
    const shouldBeOut = tickets.filter((t) => !optedIn(t)).map((t) => t.id).sort()

    expect(shouldBeIn.length).toBeGreaterThan(0)
    expect(exported.docs.map((d) => d.id).sort()).toEqual(shouldBeIn)
    expect(exported.skipped).toEqual(shouldBeOut)

    const onDisk = corpusFiles(root)
    for (const id of shouldBeOut) expect(onDisk).not.toContain(`${id}.md`)
  })

  it('test_UAT_AC1297_a_document_is_addressed_by_its_human_id_and_reads_back_as_a_document', async () => {
    // The address is the HUMAN ID, never the title: a retitled document must
    // stay the same document, or every stored citation dangles.
    const { DocDirStore } = await import(/* @vite-ignore */ sharedModuleUrl('ticketing'))
    const { nodeDocReader } = await import(/* @vite-ignore */ sharedModuleUrl('ticketing', './node'))
    const store = new DocDirStore(nodeDocReader(corpusDir(root)), { type: 'doc' })
    const { tickets: readBack } = await store.query({ type: 'doc' })

    expect(readBack.length).toBe(exported.docs.length)
    for (const doc of readBack) {
      expect(doc.uid).toMatch(/^[A-Z]+-\d+$/)
      expect(doc.title).toBeTruthy()
      expect(doc.body.length).toBeGreaterThan(0)
      // The way back to the ticket it came from — the uid cannot survive as the
      // address, so it survives as provenance.
      expect(doc.fields.origin_uid).toMatch(/^doc-/)
    }

    // A retitle leaves the document at the same address.
    await withRoot(async (scratch) => {
      await withStore([ticket('DOC-R', 'First title', '# Body')], () => exportCorpus(scratch))
      const renamed = await withStore(
        [ticket('DOC-R', 'A completely different title', '# Body')],
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
      fields: { doc_kind: 'architecture', references: { a: 1 }, tags: ['x'] },
    })
    expect(rendered).toContain('doc_kind: architecture')
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
