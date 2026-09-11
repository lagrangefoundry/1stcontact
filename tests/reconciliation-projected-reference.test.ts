import { afterEach, describe, expect, it, vi } from 'vitest'
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
  bindKb,
  configPath,
  corpusDir,
  corpusMembership,
  exportCorpus,
  kbStatus,
  projectedDocument,
  resolveEmbedder,
  writeProjections,
  SHIPPED_SOURCE,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import {
  isProjected,
  projectBehaviorCatalogue,
  projectControlSurface,
  projectL1Vocabulary,
  projections,
  PROJECTED_PREFIX,
} from '../tools/generate/src/cli/kb-projection'
import { run } from '../tools/generate/src/cli'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
// Relative rather than by package specifier: pnpm gives each workspace package
// its own `node_modules`, so `@1stcontact/*` resolves from inside a package and
// not from `tests/`. The symlinks under `tools/generate/node_modules` point back
// at these same directories, so the module instances reached here are the ones
// the projector imports — which is what makes the "change the source and
// regenerate" halves below real rather than staged.
import { CATALOG } from '../packages/framework/src/modules/catalog'
import { l1NodeSchema, l1TextAxesSchema } from '../packages/site-schema/src/l1/schema'
import { L1_ENVELOPE } from '../packages/site-schema/src/l1/validate'
import l1Surface from '../tools/generate/src/cli/ai/l1-surface.json'

/**
 * Reconciliation UATs for story-5836022a — **the projected reference**: the
 * product's own facts, generated from their sources into the shipped corpus
 * (AC-1634 … AC-1646).
 *
 * WHAT IS STOOD IN FOR, AND WHY ONLY THAT. Three external boundaries, each
 * doubled at the seam production already ships:
 *
 *   • the embedding model — `LAGRANGE_KM_EMBEDDER` (`tests/fixtures/kb-stub-model.mjs`,
 *     a deterministic hashing embedder, so a search assertion is checkable at all);
 *   • the describing model — `LAGRANGE_KM_DESCRIBER`, the same shape;
 *   • the ticket store — the `xgd` CLI `readDocTickets` shells out to, replaced on
 *     `PATH` by a shim printing a controlled envelope. A separate product invoked
 *     as a subprocess, not one of our modules.
 *
 * Everything else is real: the real generator, the real corpus directory, the
 * real `DocDirStore`, the real index and chunk builds, the real search.
 *
 * ALMOST NOTHING HERE IS ASSERTED AGAINST AN EXPECTED STRING. The property the
 * capability exists for is that the assistant's account of the product is
 * DERIVED from the product and therefore cannot be stale — so the expectations
 * are read from the sources themselves (the live catalogue, the live schema
 * union, the surface declaration). A snapshot would go stale in exactly the way
 * the projection is built to prevent, and a test that let it would be evidence
 * of nothing.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

/** The three files a build is expected to leave behind — one per declared source. */
const REFERENCES = ['REF-behaviors.md', 'REF-l1.md', 'REF-surface.md']

/** The same three, as the ids the index addresses them by. */
const REFERENCE_IDS = REFERENCES.map((file) => file.replace(/\.md$/, ''))

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

/**
 * A ticket that belongs to the KB.
 *
 * Both membership markers are carried deliberately: the boolean the export
 * reads today and the `doc_kind` the declaration is moving to. Which one decides
 * is the neighbouring story's subject, and none of the ACs here turn on it —
 * carrying both keeps these tests about the GENERATED half of the corpus.
 */
function ticket(id: string, title: string, body: string): StoreTicket {
  return {
    uid: `doc-${id.toLowerCase()}`,
    id,
    title,
    body,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    fields: { system_kb: true, doc_kind: 'system_kb' },
  }
}

/** Two small documents, so the exported half of the corpus is never empty. */
const EXPORTED: StoreTicket[] = [
  ticket(
    'DOC-A',
    'Storage and revisions',
    '# Storage and revisions\n\n## Publishing\nPublishing snapshots the draft into a numbered revision.',
  ),
  ticket(
    'DOC-B',
    'Magic link sign in',
    '# Magic link sign in\n\n## Issuing\nA single-use token is mailed to a verified mailbox.',
  ),
]

const shims: string[] = []

/** Put an `xgd` on `PATH` whose stdout is the envelope `tickets` describes. */
function installStore(tickets: StoreTicket[]): () => void {
  const dir = mkdtempSync(path.join(tmpdir(), 'kb-store-'))
  shims.push(dir)
  const shim = path.join(dir, 'xgd')
  writeFileSync(
    shim,
    '#!/usr/bin/env node\n' +
      `process.stdout.write(JSON.stringify({ items: ${JSON.stringify(tickets)}, next_cursor: null, truncated: false }))\n`,
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

/** Run `fn` against a controlled ticket store. */
async function withStore<T>(tickets: StoreTicket[], fn: () => Promise<T> | T): Promise<T> {
  const restore = installStore(tickets)
  try {
    return await fn()
  } finally {
    restore()
  }
}

/** A scratch KB tree, removed when `fn` returns. */
async function withRoot<T>(fn: (root: string) => Promise<T> | T): Promise<T> {
  const root = mkdtempSync(path.join(tmpdir(), 'kb-projected-'))
  try {
    return await fn(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

/** Run `fn` with the two model seams stubbed, then put the environment back. */
async function withModels<T>(fn: () => Promise<T> | T): Promise<T> {
  const saved = [process.env.LAGRANGE_KM_EMBEDDER, process.env.LAGRANGE_KM_DESCRIBER]
  process.env.LAGRANGE_KM_EMBEDDER = STUB
  process.env.LAGRANGE_KM_DESCRIBER = STUB
  try {
    return await fn()
  } finally {
    if (saved[0] === undefined) delete process.env.LAGRANGE_KM_EMBEDDER
    else process.env.LAGRANGE_KM_EMBEDDER = saved[0]
    if (saved[1] === undefined) delete process.env.LAGRANGE_KM_DESCRIBER
    else process.env.LAGRANGE_KM_DESCRIBER = saved[1]
  }
}

/**
 * Run `fn` with the repository's own corpus directory out of the way, and
 * restore it afterwards — including when `fn` throws.
 *
 * Only for the ACs that assert what the COMMAND prints: `1c kb export` and
 * `1c kb status` take no root argument, so they are the real tree or nothing.
 * Whatever the command leaves at the real path is removed; if a real corpus was
 * there before, it comes back byte for byte.
 */
async function withRealCorpus<T>(fn: () => Promise<T>): Promise<T> {
  const real = corpusDir()
  const aside = existsSync(real) ? `${real}.aside-${process.pid}` : null
  if (aside !== null) renameSync(real, aside)
  try {
    return await fn()
  } finally {
    rmSync(real, { recursive: true, force: true })
    if (aside !== null) renameSync(aside, real)
  }
}

/** The `1c` command line, with its two output streams captured separately. */
async function cli(argv: string[]): Promise<{ out: string; err: string }> {
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
  process.exitCode = before
  return { out: out.join('\n'), err: err.join('\n') }
}

// ── reading what the generator wrote ─────────────────────────────────────────

/** Declare a system KB whose corpus predicate is `corpus`. */
function declareKb(root: string, corpus: Record<string, unknown>): void {
  mkdirSync(corpusDir(root), { recursive: true })
  writeFileSync(
    configPath(root),
    JSON.stringify({
      knowledge_bases: {
        [SYSTEM_KB]: {
          description: 'Test system knowledge.',
          corpus,
          landscape: 'authored',
          source: SHIPPED_SOURCE,
          weight: 1,
        },
      },
    }),
    'utf8',
  )
}

/** A corpus document's frontmatter, flattened, as `DocDirStore` would read it. */
function frontmatter(text: string): Record<string, string> {
  const end = text.indexOf('\n---', 4)
  const fields: Record<string, string> = {}
  for (const line of text.slice(4, end).split('\n')) {
    const at = line.indexOf(':')
    if (at === -1) continue
    const value = line.slice(at + 1).trim()
    if (value !== '') fields[line.slice(0, at).trim()] = value
  }
  return fields
}

/** Everything after the frontmatter. */
function bodyOf(text: string): string {
  const end = text.indexOf('\n---', 4)
  return text.slice(end + '\n---\n'.length)
}

/** Every `.md` in the corpus, the generated map excluded. */
function corpusFiles(root: string): string[] {
  return readdirSync(corpusDir(root))
    .filter((name) => name.endsWith('.md') && name !== 'awareness.md')
    .sort()
}

/**
 * The slice of a document under `heading`, up to the next heading of the same
 * level or shallower. What a section does NOT say is half of what several of
 * these ACs claim, and that is only checkable inside a bounded section.
 */
function section(body: string, heading: string, maxLevel: number): string {
  const at = body.indexOf(heading)
  expect(at, `missing heading: ${heading}`).toBeGreaterThanOrEqual(0)
  const rest = body.slice(at)
  const next = rest.search(new RegExp(`\\n#{2,${maxLevel}} `))
  return next === -1 ? rest : rest.slice(0, next)
}

// ── reading the schema the layout reference is projected from ────────────────

/** Zod's internal definition, which is where introspection lives. */
type ZodLike = { def?: Record<string, unknown> }

function zdef(schema: unknown): Record<string, unknown> {
  return ((schema as ZodLike | null)?.def ?? {}) as Record<string, unknown>
}

/** Unwrap the wrappers that carry no vocabulary of their own. */
function unwrap(schema: unknown): unknown {
  let current = schema
  for (let hop = 0; hop < 12; hop += 1) {
    const d = zdef(current)
    if (d.type === 'optional' || d.type === 'nullable' || d.type === 'readonly' || d.type === 'default') {
      current = d.innerType
    } else if (d.type === 'lazy' && typeof d.getter === 'function') {
      current = (d.getter as () => unknown)()
    } else return current
  }
  return current
}

/** Every element kind the node union declares, read off the union itself. */
function elementKinds(): string[] {
  const options = (zdef(unwrap(l1NodeSchema)).options ?? []) as unknown[]
  return options.map((option) => {
    const shape = (zdef(unwrap(option)).shape ?? {}) as Record<string, unknown>
    const values = (zdef(unwrap(shape.kind)).values ?? []) as unknown[]
    return String(values[0])
  })
}

/** A field's closed value set, or `null` when it has none. */
function enumValues(schema: unknown): string[] | null {
  const d = zdef(unwrap(schema))
  if (d.type !== 'enum') return null
  return Object.keys((d.entries ?? {}) as Record<string, unknown>)
}

// ── the surface declaration, read as data rather than trusted as a type ──────

interface SurfaceDeclaration {
  errors: Record<string, { message?: string }>
  operations: Array<{
    op: string
    tool?: string
    params?: Record<string, { type?: string; required?: boolean }>
    returns?: { shape?: string }
    errors?: string[]
  }>
  groups: Array<{ group: string; title?: string; operations?: string[] }>
  absences: Array<{ name: string; note?: string }>
}

const SURFACE = l1Surface as unknown as SurfaceDeclaration

afterEach(() => {
  while (shims.length) rmSync(shims.pop()!, { recursive: true, force: true })
})

// ── AC-1634 / AC-1635: what the build writes, and what it reports ────────────

describe('story-5836022a — the reference reaches the shipped corpus', () => {
  it('test_UAT_AC1634_a_reference_is_written_for_every_source_on_export_and_on_build', async () => {
    // One reference per declared source, landing beside the exported documents,
    // under reserved names that identify them as generated. Asserted as the
    // WHOLE SET rather than one member: a reference that silently stops being
    // written leaves the assistant articulate about design and unable to say
    // what a component is, which looks like nothing at all from one assertion.
    const sources = projections().map((doc) => doc.source)
    expect(new Set(sources).size).toBe(3)
    expect(projections().map((doc) => `${doc.id}.md`).sort()).toEqual([...REFERENCES].sort())

    await withModels(() =>
      withRoot(async (root) => {
        declareKb(root, { type: ['doc'], 'fields.system_kb': true })

        // Exactly what `1c kb export` runs, in its order.
        const written = writeProjections(root)
        const exported = await withStore(EXPORTED, () => exportCorpus(root))

        expect(written.projected.sort()).toEqual([...REFERENCE_IDS].sort())
        const onDisk = readdirSync(corpusDir(root))
        for (const file of REFERENCES) {
          expect(onDisk).toContain(file)
          // The reserved namespace is what keeps the two producers separable.
          expect(isProjected(file)).toBe(true)
          expect(file.startsWith(PROJECTED_PREFIX)).toBe(true)
        }
        // Beside the ticket export's own output, in one directory.
        for (const doc of exported.docs) expect(onDisk).toContain(`${doc.id}.md`)

        // The index build reads the corpus the generator already settled, so the
        // references are indexed like any other member rather than skipped —
        // they are corpus members, not a second retrieval path.
        //
        // Driven through the two index builds `buildKb` itself calls, rather
        // than through `buildKb`, because its THIRD step — the awareness map —
        // currently throws on this tree for a reason that has nothing to do
        // with the generated references: `buildMap` calls the shared library's
        // `search` with a `source`, and the library now takes an `indexes` map.
        // That is the neighbouring KB story's code and its suite, and routing
        // around it here would hide it; asserting the index through it would
        // test the drift rather than this story.
        const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
        const { nodeIndexSource } = await import(
          /* @vite-ignore */ sharedModuleUrl('knowledge', './node')
        )
        const binding = await bindKb(root)
        const embedder = await resolveEmbedder()
        const stats = await lib.buildIndex(
          binding.store,
          binding.kbs,
          nodeIndexSource(path.join(corpusDir(root), 'index')),
          { embedder, sources: binding.sources },
        )
        expect(stats.total).toBe(corpusFiles(root).length)
        // Every corpus file was newly embedded on this first build — so none of
        // the three references was passed over.
        expect(stats.added).toBe(EXPORTED.length + REFERENCES.length)

        const resolved = (await lib.resolveCorpus(binding.store, binding.kb)).map(
          (doc: { uid: string }) => doc.uid,
        )
        for (const id of REFERENCE_IDS) expect(resolved).toContain(id)
      }),
    )

    // The export's own report NAMES each generated document it wrote — named,
    // never counted, because a generated document has no ticket for an operator
    // to go looking for.
    const { out } = await withRealCorpus(() =>
      withStore(EXPORTED, () => cli(['kb', 'export'])),
    )
    expect(out).toMatch(/^projected: /m)
    for (const id of REFERENCE_IDS) expect(out).toContain(id)
  }, 180_000)

  it('test_UAT_AC1635_status_reports_the_generated_references_separately_from_the_exported_documents', async () => {
    // Two producers, one directory: a single total no longer says how much of
    // the corpus came from the ticket store, and a corpus whose references are
    // missing has exactly the shape of one that is merely small.
    await withRoot(async (root) => {
      declareKb(root, { type: ['doc'], 'fields.system_kb': true })
      writeProjections(root)
      await withStore(EXPORTED, () => exportCorpus(root))

      const status = kbStatus(root)
      expect(status.projected).toBe(REFERENCES.length)
      expect(status.corpus - status.projected).toBe(EXPORTED.length)
      // The two counts account for the whole corpus, and nothing else.
      expect(status.corpus).toBe(corpusFiles(root).length)

      // With the references gone the generated count is zero and the exported
      // count is untouched — the distinction the single total could not make.
      for (const file of REFERENCES) rmSync(path.join(corpusDir(root), file))
      const after = kbStatus(root)
      expect(after.projected).toBe(0)
      expect(after.corpus - after.projected).toBe(EXPORTED.length)
    })

    // What ASKING actually prints: the corpus line names its two producers.
    const { out } = await withRealCorpus(() =>
      withStore(EXPORTED, async () => {
        await cli(['kb', 'export'])
        return cli(['kb', 'status'])
      }),
    )
    expect(out).toMatch(
      new RegExp(`^corpus: ${EXPORTED.length} exported \\+ ${REFERENCES.length} projected$`, 'm'),
    )
  }, 120_000)
})

// ── AC-1636 / AC-1637 / AC-1638: a corpus member like any other ──────────────

describe('story-5836022a — a generated document lives in the corpus on its own terms', () => {
  it('test_UAT_AC1636_a_reference_asserts_membership_derived_from_the_declaration', async () => {
    await withRoot((root) => {
      // A predicate asking for one type and one field value.
      declareKb(root, { type: ['reference'], 'fields.in_the_kb': true })
      expect(corpusMembership(root)).toEqual({ type: 'reference', fields: { in_the_kb: true } })
      writeProjections(root)

      for (const file of REFERENCES) {
        const fields = frontmatter(readFileSync(path.join(corpusDir(root), file), 'utf8'))
        expect(fields.type).toBe('reference')
        expect(fields.in_the_kb).toBe('true')
        // Generated, and saying where it came from.
        expect(fields.projected).toBe('true')
        expect(fields.source).toBeTruthy()
        // A document written for the assistant, never an engineering record.
        expect(fields.doc_kind).toBe('system_kb')
      }

      // A DIFFERENT predicate — a different type and a different field — and
      // nothing edited by hand. Hardcoding today's predicate would drop the
      // references out of the knowledge base the day it changed, which is the
      // one failure a generated document is supposed to be incapable of.
      declareKb(root, { type: ['doc'], 'fields.system_kb': true })
      writeProjections(root)
      for (const file of REFERENCES) {
        const fields = frontmatter(readFileSync(path.join(corpusDir(root), file), 'utf8'))
        expect(fields.type).toBe('doc')
        expect(fields.system_kb).toBe('true')
        expect(fields.in_the_kb).toBeUndefined()
        expect(fields.doc_kind).toBe('system_kb')
      }

      // …including a predicate that asks for nothing at all, which is what the
      // shipped declaration became once the distribution itself was the boundary.
      declareKb(root, {})
      expect(corpusMembership(root)).toEqual({ type: 'doc', fields: {} })
      const unrestricted = frontmatter(
        projectedDocument(projectBehaviorCatalogue(), corpusMembership(root)),
      )
      expect(unrestricted.type).toBe('doc')
      expect(unrestricted.doc_kind).toBe('system_kb')
      expect(unrestricted.system_kb).toBeUndefined()
    })
  })

  it('test_UAT_AC1637_each_producer_removes_only_its_own_stale_output_in_either_order', async () => {
    // Get this wrong in either direction and the corpus rots: a spared stale
    // file stays searchable and confidently wrong forever, and a swept live one
    // leaves the assistant silently missing part of what it knows.
    async function planted(root: string): Promise<void> {
      declareKb(root, { type: ['doc'], 'fields.system_kb': true })
      writeProjections(root)
      await withStore(EXPORTED, () => exportCorpus(root))
      // A reference no source produces any more…
      writeFileSync(
        path.join(corpusDir(root), 'REF-gone.md'),
        '---\nid: REF-gone\ntype: doc\ntitle: Withdrawn reference\n---\n# Gone\n',
        'utf8',
      )
      // …and a document whose ticket has been withdrawn since the last build.
      writeFileSync(
        path.join(corpusDir(root), 'DOC-GONE.md'),
        '---\nid: DOC-GONE\ntype: doc\ntitle: Withdrawn\n---\n# Withdrawn\n',
        'utf8',
      )
    }

    function assertSwept(root: string, generated: string[], exportedAway: string[]): void {
      // Each run reported removing exactly its own stale file and no other.
      expect(generated).toEqual(['REF-gone.md'])
      expect(exportedAway).toEqual(['DOC-GONE.md'])
      const onDisk = readdirSync(corpusDir(root))
      expect(onDisk).not.toContain('REF-gone.md')
      expect(onDisk).not.toContain('DOC-GONE.md')
      // …and every live document of BOTH producers is still there.
      for (const file of REFERENCES) expect(onDisk).toContain(file)
      for (const doc of EXPORTED) expect(onDisk).toContain(`${doc.id}.md`)
    }

    // Generate, then export.
    await withRoot(async (root) => {
      await planted(root)
      const generated = writeProjections(root).removed
      const swept = await withStore(EXPORTED, () => exportCorpus(root))
      assertSwept(root, generated, swept.removed)
    })

    // Export, then generate — the same outcome, because neither producer can
    // reach the other's namespace whatever order they run in.
    await withRoot(async (root) => {
      await planted(root)
      const swept = await withStore(EXPORTED, () => exportCorpus(root))
      const generated = writeProjections(root).removed
      assertSwept(root, generated, swept.removed)
    })
  }, 120_000)

  it('test_UAT_AC1638_an_unchanged_reference_keeps_its_timestamp_and_a_changed_source_advances_one', async () => {
    // `DocDirStore` derives a document's timestamp from its file stamp and the
    // index keys its incremental manifest on that stamp, so rewriting an
    // identical file every build would re-embed the whole reference every build,
    // at cost, while telling the ranker every document had just changed.
    await withRoot((root) => {
      declareKb(root, { type: ['doc'], 'fields.system_kb': true })
      writeProjections(root)

      const files = REFERENCES.map((file) => path.join(corpusDir(root), file))
      // Backdated, so "unchanged" is provable rather than a same-millisecond
      // coincidence.
      const old = new Date(Date.now() - 10_000)
      for (const file of files) utimesSync(file, old, old)
      const before = files.map((file) => statSync(file).mtimeMs)

      writeProjections(root)
      expect(files.map((file) => statSync(file).mtimeMs)).toEqual(before)

      // Now change a SOURCE — a real one, the live catalogue the component
      // reference is generated from — and regenerate. Only the document that
      // source feeds moves.
      const carousel = CATALOG.find((meta) => meta.id === 'carousel')
      expect(carousel, 'the catalogue no longer carries a carousel').toBeDefined()
      const autoplay = (carousel!.config as Record<string, { values?: string[] }>).autoplay
      autoplay.values = ['on-load', 'on-view']
      try {
        writeProjections(root)
        const after = files.map((file) => statSync(file).mtimeMs)
        expect(after[0]).toBeGreaterThan(before[0]) // REF-behaviors — its source changed
        expect(after[1]).toBe(before[1]) // REF-l1 — untouched
        expect(after[2]).toBe(before[2]) // REF-surface — untouched
      } finally {
        delete autoplay.values
      }
    })
  })
})

// ── AC-1639 / AC-1640: the component reference ───────────────────────────────

describe('story-5836022a — the component reference says what the catalogue says', () => {
  it('test_UAT_AC1639_every_component_is_described_with_its_settings_values_slots_and_obligations', () => {
    // Exhaustive against the LIVE catalogue rather than a fixture: every
    // component, its version, every setting with its permitted values, every
    // part of the page it holds, every obligation it is declared to satisfy.
    const { body } = projectBehaviorCatalogue()
    expect(CATALOG.length).toBeGreaterThan(0)

    for (const meta of CATALOG) {
      // Each component's facts arrive under that component's OWN heading, so a
      // retrieved passage always says which component it is about.
      const own = section(body, `## ${meta.id}\n`, 2)
      expect(own).toContain(`The \`${meta.id}\` component, version ${meta.version}.`)
      for (const [name, spec] of Object.entries(meta.config)) {
        expect(own).toContain(`\`${name}\``)
        for (const value of spec.values ?? []) expect(own).toContain(`\`${value}\``)
        // Whether the setting must be supplied is part of what it is.
        expect(own).toMatch(new RegExp(`\`${name}\`[^\\n]*${spec.required ? 'required' : 'optional'}`))
      }
      for (const slot of Object.keys(meta.slots)) expect(own).toContain(`\`${slot}\``)
      for (const obligation of meta.conformance.obligations) expect(own).toContain(`\`${obligation}\``)
    }

    // The property, stated as a test rather than as a hope: change a setting's
    // permitted values in the catalogue, regenerate, and the document states the
    // new values — with no document edited by hand.
    const carousel = CATALOG.find((meta) => meta.id === 'carousel')
    expect(carousel).toBeDefined()
    const autoplay = (carousel!.config as Record<string, { values?: string[] }>).autoplay
    expect(projectBehaviorCatalogue().body).not.toContain('`on-view`')
    autoplay.values = ['on-load', 'on-view']
    try {
      const regenerated = section(projectBehaviorCatalogue().body, '## carousel\n', 2)
      expect(regenerated).toContain('`on-load`')
      expect(regenerated).toContain('`on-view`')
    } finally {
      delete autoplay.values
    }
    expect(projectBehaviorCatalogue().body).not.toContain('`on-view`')
  })

  it('test_UAT_AC1640_the_component_reference_describes_no_component_the_catalogue_does_not_carry', () => {
    // The half a snapshot cannot give: the document says what the catalogue says
    // and NOTHING more. A reference that could name a component the framework
    // does not ship would be inventing capability, which is worse for the person
    // asking than saying nothing.
    const { body } = projectBehaviorCatalogue()
    const documented = [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1])
    expect(documented.sort()).toEqual(CATALOG.map((meta) => meta.id).sort())

    // Set equality is the claim, so removing a component from the catalogue
    // removes it from the document.
    const removed = (CATALOG as unknown as Array<{ id: string }>).pop()!
    try {
      const shrunk = [...projectBehaviorCatalogue().body.matchAll(/^## (.+)$/gm)].map((m) => m[1])
      expect(shrunk).not.toContain(removed.id)
      expect(shrunk.sort()).toEqual(CATALOG.map((meta) => meta.id).sort())
    } finally {
      ;(CATALOG as unknown as Array<{ id: string }>).push(removed)
    }
  })
})

// ── AC-1641 / AC-1642: the layout reference ──────────────────────────────────

describe('story-5836022a — the layout reference is read off the schemas', () => {
  it('test_UAT_AC1641_every_element_kind_its_closed_value_sets_and_the_page_limits_are_named', () => {
    // Read off the schema union rather than listed here, so a kind declared
    // tomorrow is covered by this test the moment it is declared — and a reader
    // is never told about a value the validator stopped accepting.
    const { body } = projectL1Vocabulary()
    const kinds = elementKinds()
    expect(kinds.length).toBeGreaterThan(3)
    for (const kind of kinds) expect(body).toContain(`### \`${kind}\``)

    // A closed value set is most of what an axis means, so the document carries
    // the values themselves rather than a type name alone — and the values are
    // the schema's, read from it here rather than transcribed.
    const alignment = enumValues(
      (zdef(l1TextAxesSchema).shape as Record<string, unknown>).textAlign,
    )
    expect(alignment).not.toBeNull()
    expect(alignment!.length).toBeGreaterThan(1)
    expect(body).toContain(alignment!.map((value) => `\`${value}\``).join(' | '))

    // The limits every page is held to, each named with its bound, and the
    // refusal stated as whole-document rather than a silent clamp.
    const limits = section(body, '## The limits every page is held to', 2)
    for (const key of Object.keys(L1_ENVELOPE)) expect(limits).toContain(`\`${key}\``)
    expect(limits).toMatch(/refused whole/)
    expect(limits).toMatch(/nothing is clamped silently/)
    // A bound, not just a name: the numeric envelope entries carry theirs.
    expect(limits).toContain(`\`maxNodes\` — ${L1_ENVELOPE.maxNodes}`)
    expect(limits).toContain(
      `\`fontSizePx\` — ${L1_ENVELOPE.fontSizePx.min}–${L1_ENVELOPE.fontSizePx.max}`,
    )
  })

  it('test_UAT_AC1642_a_harvested_definition_appears_only_against_the_shape_it_was_written_for', () => {
    // `color` is documented once, on the pointer-accent shape, and appears
    // undocumented on a dozen others. A flat field-to-prose map would file "the
    // colour the texture is redrawn in" against a border's colour and read as
    // authoritative — a confidently wrong sentence in a generated reference,
    // which is the one thing it must never contain.
    const { body } = projectL1Vocabulary()
    /** The `color` entry inside one section, or `''` when it has none. */
    const colorLine = (part: string): string =>
      part.split('\n').find((line) => line.startsWith('- `color` —')) ?? ''

    const accent = colorLine(section(body, '### pointer accent', 3))
    expect(accent).toContain('redrawn')
    // The definition the shape that declares it owns — read from the document
    // rather than transcribed, so this stays true when the comment is reworded.
    const definition = accent.slice(accent.indexOf('. ') + 2).trim()
    expect(definition.length).toBeGreaterThan(10)

    // Every OTHER documented shape that has a `color` field lists it — with its
    // type and whether it may be omitted — and carries no definition borrowed
    // from elsewhere. Asserted on the `color` ENTRY, not on the section: a
    // section may legitimately carry the pointer-accent field itself, with its
    // own definition, and that is the composition working rather than a leak.
    const headings = [...body.matchAll(/^### (.+)$/gm)].map((match) => match[1])
    let checked = 0
    for (const heading of headings) {
      if (heading === 'pointer accent') continue
      const line = colorLine(section(body, `### ${heading}\n`, 3))
      if (line === '') continue
      checked += 1
      expect(line, `\`color\`'s definition leaked into ${heading}`).not.toContain(definition)
      expect(line, `\`color\`'s definition leaked into ${heading}`).not.toContain('redrawn')
      // Still listed, with its type — losing the field would be the opposite
      // failure and just as wrong.
      expect(line).toMatch(/^- `color` — \S/)
    }
    // Non-vacuous: several other shapes really do carry a `color` field.
    expect(checked).toBeGreaterThan(1)

    // A shape that COMPOSES another's fields does own that group's definitions,
    // because sharing them is what the source means by the composition. Every
    // element kind spreads the shared node-axis group, and `geometry` is
    // documented there and nowhere else.
    const text = section(body, '### `text`', 3)
    expect(text).toContain('`geometry`')
    expect(text).toMatch(/`geometry`[^\n]*Per-width absolute placement/)
  })
})

// ── AC-1643: the control-surface reference ───────────────────────────────────

describe('story-5836022a — the control-surface reference covers the whole declared surface', () => {
  it('test_UAT_AC1643_every_operation_group_refusal_and_declared_absence_is_named', () => {
    // Checked against the DECLARATION itself, not a list here, so an operation
    // added, renamed or withdrawn moves this document without anybody
    // remembering to — and the whole surface is described rather than the subset
    // any one session was granted.
    const { body } = projectControlSurface()
    expect(SURFACE.operations.length).toBeGreaterThan(0)

    for (const op of SURFACE.operations) {
      const name = op.tool ?? op.op
      const own = section(body, `#### \`${name}\`\n`, 4)
      // What it takes, and whether each input is required.
      for (const [param, spec] of Object.entries(op.params ?? {})) {
        expect(own, `${name} omits the input ${param}`).toContain(`\`${param}\``)
        expect(own).toMatch(
          new RegExp(`\`${param}\`[^\\n]*${spec.required ? 'required' : 'optional'}`),
        )
      }
      // What it returns, and how it can refuse.
      if (op.returns?.shape) expect(own).toContain(`Returns: \`${op.returns.shape}\`.`)
      for (const code of op.errors ?? []) expect(own).toContain(`\`${code}\``)
    }

    // Grouped as the declaration groups them — each group a section of its own,
    // holding the operations the declaration puts in it.
    let grouped = 0
    for (const group of SURFACE.groups) {
      const own = section(body, `### ${group.title ?? group.group}\n`, 3)
      for (const name of group.operations ?? []) {
        const op = SURFACE.operations.find((candidate) => candidate.op === name)
        if (!op) continue
        grouped += 1
        expect(own, `${name} is not under ${group.title ?? group.group}`).toContain(
          `#### \`${op.tool ?? op.op}\``,
        )
      }
    }
    // Non-vacuous: the declaration really does place every operation in a group,
    // so "grouped as the declaration groups them" is asserted over all of them
    // rather than over whichever ones happened to resolve.
    expect(grouped).toBe(SURFACE.operations.length)

    // Every declared refusal, named with what it means.
    const refusals = section(body, '## How a change is refused', 2)
    for (const code of Object.keys(SURFACE.errors)) expect(refusals).toContain(`\`${code}\``)

    // The declared absences are the load-bearing half: an assistant that does
    // not know a thing is deliberately impossible spends the conversation trying
    // to route around it and apologising. Each is stated as a DECISION.
    const impossible = section(body, '## What is deliberately not possible', 2)
    expect(impossible).toMatch(/a decision, not a gap/)
    expect(SURFACE.absences.length).toBeGreaterThan(0)
    for (const absence of SURFACE.absences) {
      expect(impossible).toContain(`### ${absence.name}`)
      if (absence.note) expect(impossible).toContain(absence.note.trim().split('\n')[0])
    }
  })
})

// ── AC-1644 / AC-1645: what a reference says about itself ────────────────────

describe('story-5836022a — a reference stands on its own for the reader it was written for', () => {
  it('test_UAT_AC1644_no_definition_sends_the_assistant_to_an_internal_ticket', () => {
    // The engineering record is written for a different reader, and a
    // client-facing reference that ends in a ticket reference is a dead end for
    // the reader it WAS written for.
    for (const doc of projections()) {
      expect(doc.body, `${doc.id} cites an internal work item`).not.toMatch(
        /\b(?:REQ|BUG|EPIC|DOC)-\d+/,
      )
    }

    // By omission, not by luck. The envelope's own comments are full of the
    // record: three of its bounds are documented only in terms of a ticket, and
    // those definitions are DROPPED — while the limit itself is still listed
    // with its bound. A neighbouring limit whose comment stands on its own keeps
    // its definition, so this is the rule working rather than prose going
    // missing wholesale.
    const limits = section(projectL1Vocabulary().body, '## The limits every page is held to', 2)
    const line = (key: string): string =>
      limits.split('\n').find((text) => text.startsWith(`- \`${key}\``)) ?? ''

    // Documented only via a ticket reference → listed, undefined.
    expect(line('effectPx')).toBe(
      `- \`effectPx\` — ${L1_ENVELOPE.effectPx.min}–${L1_ENVELOPE.effectPx.max}`,
    )
    expect(line('rotateDeg')).toBe(
      `- \`rotateDeg\` — ${L1_ENVELOPE.rotateDeg.min}–${L1_ENVELOPE.rotateDeg.max}`,
    )
    // Documented in its own terms → listed, and defined.
    expect(line('maxNodes')).toContain('Max total node count in a document.')
    // A leading ticket reference is stripped rather than taking the sentence
    // down with it, so the definition survives without the citation.
    expect(line('paddingPx')).toMatch(/Per-side box-model padding/)
    expect(line('paddingPx')).not.toMatch(/BUG-\d+/)
  })

  it('test_UAT_AC1645_a_reference_names_its_source_in_its_body_and_says_it_is_rebuilt', async () => {
    // Retrieval hands back passages, and a passage carries none of the
    // document's declared attributes — so a reader handed a fragment
    // mid-conversation must still be able to say where the fact came from, and
    // an operator who wants a fact changed must be told that editing the
    // document is not how.
    await withRoot((root) => {
      declareKb(root, { type: ['doc'], 'fields.system_kb': true })
      writeProjections(root)

      for (const file of REFERENCES) {
        const text = readFileSync(path.join(corpusDir(root), file), 'utf8')
        const declared = frontmatter(text).source
        expect(declared).toBeTruthy()

        const body = bodyOf(text)
        // Near the top, ahead of the facts themselves. The blockquote markers
        // are dropped first so the assertion is about the sentence rather than
        // about where the line happens to wrap.
        const opening = body.slice(0, 500).replace(/\n>[ \t]?/g, ' ').replace(/\s+/g, ' ')
        expect(opening).toContain(`Generated from ${declared}`)
        expect(opening).toMatch(/Do not edit/)
        expect(opening).toMatch(/rebuilt from its source on every build/)
        expect(opening).toMatch(/an edit here is lost/)

        // The body and the declared attributes name the SAME source, so the two
        // cannot disagree.
        expect(body).toContain(declared)
      }
    })
  })
})

// ── AC-1646: the reference answers a question asked in ordinary words ────────

describe('story-5836022a — the reference is reachable through ordinary retrieval', () => {
  it('test_UAT_AC1646_asking_what_a_component_supports_returns_a_passage_from_the_reference', async () => {
    // The criterion the whole capability exists for: an asker who does not know
    // the reference exists, asking in words for a fact only the catalogue
    // carries, is handed the reference. Nothing in the question names a
    // document, a filename or a source.
    await withModels(() =>
      withRoot(async (root) => {
        declareKb(root, { type: ['doc'], 'fields.system_kb': true })
        writeProjections(root)
        await withStore(EXPORTED, () => exportCorpus(root))

        const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
        const { nodeIndexSource } = await import(
          /* @vite-ignore */ sharedModuleUrl('knowledge', './node')
        )
        const binding = await bindKb(root)
        const embedder = await resolveEmbedder()
        const chunks = nodeIndexSource(path.join(corpusDir(root), 'chunks'))
        await lib.buildChunkIndex(binding.store, binding.kbs, chunks, {
          embedder,
          sources: binding.sources,
        })

        // Chunk search, because that is the path a question like this actually
        // takes: a reference document is far too coarse a unit to hand back, and
        // what the asker needs is the passage that answers the question.
        const hits = await lib.searchChunks('does the carousel component support autoplay', {
          indexes: { [SHIPPED_SOURCE]: chunks },
          store: binding.store,
          kbs: binding.kbs,
          kb: SYSTEM_KB,
          topK: 5,
          embedder,
          sources: binding.sources,
        })

        // The claim is that the reference ANSWERS the question — the passage
        // handed back carries both the component asked about and the setting
        // asked about. Rank is deliberately not asserted: the stub is a
        // bag-of-words embedder, and pinning an ordering to that artefact would
        // be evidence about the double rather than about the corpus.
        const reference = hits.find((hit: { uid: string }) => hit.uid === 'REF-behaviors')
        expect(reference, 'the generated component reference was not returned').toBeDefined()
        const passages = (reference.chunks as Array<{ text_snippet: string }>).map(
          (chunk) => chunk.text_snippet,
        )
        expect(
          passages.some((text) => text.includes('carousel') && text.includes('autoplay')),
        ).toBe(true)
      }),
    )
  }, 120_000)
})
