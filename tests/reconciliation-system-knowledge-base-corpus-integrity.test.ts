import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  bindKb,
  configPath,
  corpusDir,
  ensureConfig,
  exportCorpus,
  inSystemKb,
  kbRoot,
  kbStatus,
  readDocTickets,
  DOC_KIND_FIELD,
  MEMBER_KIND,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import { run } from '../tools/generate/src/cli'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'

/**
 * Reconciliation UATs for story-c4f329d3 — **the corpus-integrity half** of the
 * system knowledge base (AC-1500, AC-1501, and the two criteria the same
 * reconciliation strengthened: AC-1293's three status renderings and AC-1295's
 * retired boolean).
 *
 * Every failure asserted here has ONE SHAPE: the corpus quietly ends up smaller
 * than it should be. No error, no warning — an index that builds, works, and is
 * missing documents, with the symptom surfacing much later and several artefacts
 * downstream as *"the assistant doesn't seem to know about that"*. That is why
 * each of these is a loud failure at the point of the mistake rather than a
 * tolerated shortfall:
 *
 *   • a paged ticket list read as if it were the whole list (AC-1501)
 *   • a query-time corpus predicate re-applying a build-time filter (AC-1500)
 *   • a short corpus inferred rather than reported (AC-1293)
 *   • membership honoured on a marker nobody maintains any more (AC-1295)
 *
 * WHAT IS STOOD IN FOR, AND WHY ONLY THAT. The ticket store alone — the `xgd`
 * CLI `readDocTickets` shells out to, replaced on `PATH` by a shim that prints a
 * controlled envelope and records the argv it was called with. That is a
 * separate product invoked as a subprocess, not one of our modules, and standing
 * it in is what makes these assertable at all: the real store cannot be made to
 * return a truncated 50-item page on demand, and a store that fits in one page
 * passes AC-1501 vacuously — which is exactly how the original defect survived.
 * The export's own argv, JSON parsing, envelope check, membership filter,
 * rendering, incremental write and sweep all still run for real, as do the real
 * `DocDirStore`, the real declaration parsing and the real corpus resolution.
 */

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

/** A `doc` ticket carrying the membership kind, unless `fields` says otherwise. */
function ticket(
  id: string,
  fields: Record<string, unknown> | null = { [DOC_KIND_FIELD]: MEMBER_KIND },
): StoreTicket {
  return {
    uid: `doc-${id.toLowerCase()}`,
    id,
    title: `Title of ${id}`,
    body: `# ${id}\n\nA document about ${id}.`,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    fields,
  }
}

const shims: string[] = []

/** A stood-in store: how it answers, and what it was asked. */
interface Store {
  restore: () => void
  /** Every argv the shim was invoked with, in call order. */
  calls: () => string[][]
}

/**
 * Put an `xgd` on `PATH` whose stdout is produced by `body`, given its argv.
 *
 * The shim is handed the ARGV rather than a fixed payload, and records every
 * call. Both matter for AC-1501: whether the export actually asks for the whole
 * store is only observable from the flags it passes, and a shim that ignored
 * them would let a page-one-and-stop export pass.
 */
function installStore(body: string): Store {
  const dir = mkdtempSync(path.join(tmpdir(), 'kb-integrity-store-'))
  shims.push(dir)
  const log = path.join(dir, 'calls.jsonl')
  const shim = path.join(dir, 'xgd')
  writeFileSync(
    shim,
    `#!/usr/bin/env node\n` +
      `const argv = process.argv.slice(2)\n` +
      `require('node:fs').appendFileSync(${JSON.stringify(log)}, JSON.stringify(argv) + '\\n')\n` +
      `${body}\n`,
    'utf8',
  )
  chmodSync(shim, 0o755)
  const previous = process.env.PATH
  process.env.PATH = `${dir}${path.delimiter}${previous ?? ''}`
  return {
    restore: () => {
      if (previous === undefined) delete process.env.PATH
      else process.env.PATH = previous
    },
    calls: () =>
      (existsSync(log) ? readFileSync(log, 'utf8') : '')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as string[]),
  }
}

/**
 * A store that pages at `pageSize` and honours `--no-limit`, as `xgd` does.
 *
 * The honest store: asked for everything it answers with everything, asked
 * without the flag it answers with page one and says so.
 */
function installPagingStore(tickets: StoreTicket[], pageSize = 50): Store {
  return installStore(
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

/** A store that truncates whatever it was asked — an older `xgd` on `PATH`. */
function installStubbornlyTruncatingStore(tickets: StoreTicket[], pageSize = 50): Store {
  return installStore(
    `const all = ${JSON.stringify(tickets)}\n` +
      `process.stdout.write(JSON.stringify({\n` +
      `  items: all.slice(0, ${pageSize}),\n` +
      `  next_cursor: 'page-2',\n` +
      `  truncated: true,\n` +
      `}))`,
  )
}

/** Run `fn` against the store `install` provides, then take it off `PATH`. */
async function withStore<T>(install: () => Store, fn: (store: Store) => Promise<T> | T): Promise<T> {
  const store = install()
  try {
    return await fn(store)
  } finally {
    store.restore()
  }
}

/** A scratch KB tree, removed when `fn` returns. */
async function withRoot<T>(fn: (root: string) => Promise<T> | T): Promise<T> {
  const root = mkdtempSync(path.join(tmpdir(), 'kb-integrity-'))
  try {
    return await fn(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

/** The `1c` command line, with its two output streams captured separately. */
async function cli(argv: string[]): Promise<{ out: string; err: string }> {
  const out: string[] = []
  const err: string[] = []
  const log = vi.spyOn(console, 'log').mockImplementation((...p: unknown[]) => {
    out.push(p.map(String).join(' '))
  })
  const error = vi.spyOn(console, 'error').mockImplementation((...p: unknown[]) => {
    err.push(p.map(String).join(' '))
  })
  const before = process.exitCode
  try {
    await run(argv)
  } finally {
    log.mockRestore()
    error.mockRestore()
    process.exitCode = before
  }
  return { out: out.join('\n'), err: err.join('\n') }
}

/** Every `.md` in the corpus, the generated map excluded. */
function corpusFiles(root: string): string[] {
  const dir = corpusDir(root)
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => name.endsWith('.md') && name !== 'awareness.md')
        .sort()
    : []
}

afterEach(() => {
  while (shims.length) rmSync(shims.pop()!, { recursive: true, force: true })
})

// ── AC-1501: the listing the export reads is exhaustive ──────────────────────

describe('story-c4f329d3 — the ticket listing is read exhaustively', () => {
  it('test_UAT_AC1501_the_listing_is_exhaustive_and_a_truncated_listing_is_refused_by_name', async () => {
    // A store DELIBERATELY LARGER THAN ONE PAGE. `xgd ticket list` pages at 50
    // and reports the rest through `next_cursor`; a consumer that reads `items`
    // and stops takes page one and calls it the corpus. 60 > 50 on purpose —
    // a store that fits in a page passes this vacuously, which is how the
    // original defect survived.
    const many = Array.from({ length: 60 }, (_, i) =>
      ticket(`DOC-${String(i + 1).padStart(3, '0')}`),
    )

    // (1) THE REQUEST ITSELF ASKS FOR THE WHOLE STORE. Asking is the only half
    // that is observable from outside, so it is asserted from outside — on the
    // argv the subprocess was actually handed.
    const asked = await withStore(
      () => installPagingStore(many),
      (store) => {
        const read = readDocTickets()
        return { read, calls: store.calls() }
      },
    )
    expect(asked.calls.length).toBeGreaterThan(0)
    expect(asked.calls[0]).toContain('--no-limit')
    expect(asked.calls[0]).toContain('ticket')
    expect(asked.calls[0]).toContain('list')

    // (2) A STORE THAT RETURNS EVERYTHING IS ACCEPTED, and every matching
    // document reaches the corpus — none dropped at the page boundary.
    expect(asked.read.length).toBe(60)
    expect(asked.read.map((t) => t.id)).toContain('DOC-060')

    await withRoot(async (root) => {
      const result = await withStore(
        () => installPagingStore(many),
        () => exportCorpus(root),
      )
      expect(result.docs.length).toBe(60)
      expect(corpusFiles(root).length).toBe(60)
      expect(corpusFiles(root)).toContain('DOC-060.md')
      expect(corpusFiles(root)).toContain('DOC-051.md')
    })

    // (3) A STORE THAT TRUNCATES REGARDLESS is refused BY NAME. `--no-limit` is
    // upstream's promise; this is the assertion that it was kept. The refusal
    // says a truncated listing arrived, how many documents it carried, and that
    // the request had been for all of them — so the diagnosis does not need
    // this file.
    const message = await withStore(
      () => installStubbornlyTruncatingStore(many),
      () => {
        try {
          readDocTickets()
          return ''
        } catch (err) {
          return (err as Error).message
        }
      },
    )
    expect(message).toMatch(/truncated/i)
    expect(message).toContain('50 item(s)')
    expect(message).toContain('--no-limit')

    // …and the EXPORT fails with it rather than shortening the corpus to
    // whatever arrived. A 50-document corpus is the outcome that must not
    // happen: it builds, works, and is missing ten documents.
    await withRoot(async (root) => {
      await expect(
        withStore(() => installStubbornlyTruncatingStore(many), () => exportCorpus(root)),
      ).rejects.toThrow(/truncated/i)
      expect(corpusFiles(root)).toEqual([])
    })
  })
})

// ── AC-1500: the shipped corpus is unrestricted ──────────────────────────────

describe('story-c4f329d3 — the shipped corpus is unrestricted', () => {
  it('test_UAT_AC1500_a_corpus_file_is_resolved_whatever_its_frontmatter_and_both_declarations_say_so', async () => {
    // STRUCTURALLY, ON BOTH DECLARATIONS. A build never overwrites an existing
    // declaration, so the file a fresh checkout is scaffolded with and the file
    // committed to this repository can drift apart with nothing reporting it —
    // which is why both are asserted rather than only the shipped one.
    const shipped = JSON.parse(readFileSync(configPath(kbRoot()), 'utf8')) as {
      knowledge_bases: Record<string, { corpus?: Record<string, unknown> }>
    }
    expect(shipped.knowledge_bases[SYSTEM_KB].corpus).toEqual({})

    await withRoot((root) => {
      ensureConfig(root)
      const scaffolded = JSON.parse(readFileSync(configPath(root), 'utf8')) as {
        knowledge_bases: Record<string, { corpus?: Record<string, unknown>; source?: string }>
      }
      expect(scaffolded.knowledge_bases[SYSTEM_KB].corpus).toEqual({})
      // The same knowledge base in both, so "identically" is about one KB
      // rather than two files that happen to both contain an empty object.
      expect(scaffolded.knowledge_bases[SYSTEM_KB].corpus).toEqual(
        shipped.knowledge_bases[SYSTEM_KB].corpus,
      )
    })

    // BEHAVIOURALLY, which is the half that matters. Once the export has written
    // the corpus the DIRECTORY IS THE BOUNDARY: every member matched by
    // construction when it was written, so re-applying the export's own
    // selection at query time is a build-time filter re-run as a membership
    // rule. It can only ever subtract, and the only thing it can subtract is a
    // file whose frontmatter does not look the way the predicate expects — which
    // then disappears from the KB with no error at all.
    await withRoot(async (root) => {
      const dir = corpusDir(root)
      mkdirSync(dir, { recursive: true })
      ensureConfig(root)

      // Full frontmatter, carrying the membership marker.
      writeFileSync(
        path.join(dir, 'DOC-FULL.md'),
        `---\nid: DOC-FULL\ntype: doc\ntitle: Full frontmatter\nfields:\n` +
          `  ${DOC_KIND_FIELD}: ${MEMBER_KIND}\n---\n# Full\n\nBody.\n`,
        'utf8',
      )
      // Frontmatter with no `fields` block — dropped by a `fields.x` predicate.
      writeFileSync(
        path.join(dir, 'DOC-THIN.md'),
        '---\nid: DOC-THIN\ntype: doc\ntitle: No fields\n---\n# Thin\n\nBody.\n',
        'utf8',
      )
      // No frontmatter whatsoever — the case a query-time predicate drops
      // silently, and the reason this criterion is behavioural and not a
      // reading of the declaration.
      writeFileSync(path.join(dir, 'DOC-BARE.md'), '# Bare\n\nJust prose.\n', 'utf8')

      const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
      const binding = await bindKb(root)
      const resolved = await lib.resolveCorpus(binding.store, binding.kb)

      expect(resolved.map((t: { uid: string }) => t.uid).sort()).toEqual([
        'DOC-BARE',
        'DOC-FULL',
        'DOC-THIN',
      ])
      // The predicate actually in force is empty — no term to subtract by, and
      // no type to subtract by either.
      expect([...binding.kb.corpus.terms.keys()]).toEqual([])
      expect([...binding.kb.corpus.types]).toEqual([])
    })
  })
})

// ── AC-1293: the corpus is reported against what it should hold ──────────────

describe('story-c4f329d3 — a short corpus is visible, not inferred', () => {
  it('test_UAT_AC1293_status_reports_the_corpus_against_the_marked_tickets_in_three_distinguishable_outcomes', async () => {
    // The whole value of putting the two numbers on ONE LINE is that a
    // *disagreement* is what an operator sees. Collapsing "cannot check" into
    // either of the other two re-creates exactly the silent-shortfall failure
    // this report exists to close, so all three are asserted separately.

    // The structural half, over scratch trees: agreement, disagreement, and a
    // store that cannot be read at all.
    await withRoot(async (root) => {
      const store = [ticket('DOC-A'), ticket('DOC-B'), ticket('DOC-C')]

      // Agreement — the corpus holds what the store says it should.
      await withStore(
        () => installPagingStore(store),
        () => {
          exportCorpus(root)
          expect(kbStatus(root)).toMatchObject({ corpus: 3, projected: 0, tickets: 3 })
        },
      )

      // Disagreement — a fourth document was marked after the last export, so
      // the corpus is quietly one short. `tickets` is the number that makes
      // that visible; 3 documents looks exactly as healthy as 4 without it.
      const stale = await withStore(
        () => installPagingStore([...store, ticket('DOC-D')]),
        () => kbStatus(root),
      )
      expect(stale.corpus).toBe(3)
      expect(stale.tickets).toBe(4)

      // Unknown — the store could not be read. NULL, never zero: zero is a real
      // and alarming answer, and manufacturing it from an unrelated failure
      // would send an operator to rebuild a corpus that was never broken. The
      // rest of the report is still produced.
      const unreadable = await withStore(
        () => installStore('process.exit(3)'),
        () => kbStatus(root),
      )
      expect(unreadable.tickets).toBeNull()
      expect(unreadable.corpus).toBe(3)
      expect(unreadable.index).toBe(false)
      expect(unreadable.map).toBe(false)
    })

    // The rendering half, through the command itself — a discrepancy nobody
    // prints is not visible. The corpus side is whatever this checkout holds,
    // so it is READ FIRST and the store is then sized against it: that makes
    // each of the three outcomes reachable without touching the real corpus.
    const probe = await withStore(
      () => installPagingStore([]),
      () => cli(['kb', 'status']),
    )
    const line = probe.out.match(/corpus: (\d+) exported \+ (\d+) projected/)
    expect(line).not.toBeNull()
    const exported = Number(line![1])

    const marked = (n: number): StoreTicket[] =>
      Array.from({ length: n }, (_, i) => ticket(`DOC-M${String(i + 1).padStart(3, '0')}`))

    // Agreement: the line says so, and names the marker being counted.
    const agrees = await withStore(
      () => installPagingStore(marked(exported)),
      () => cli(['kb', 'status']),
    )
    expect(agrees.out).toContain(`(of ${exported} ticket(s) carrying ${DOC_KIND_FIELD}: ${MEMBER_KIND})`)
    expect(agrees.out).not.toContain('⚠')

    // Disagreement: warned, with how many carry the marker, and the remedy named.
    const disagrees = await withStore(
      () => installPagingStore(marked(exported + 1)),
      () => cli(['kb', 'status']),
    )
    expect(disagrees.out).toContain('⚠')
    expect(disagrees.out).toContain(
      `${exported + 1} ticket(s) carry ${DOC_KIND_FIELD}: ${MEMBER_KIND}`,
    )
    expect(disagrees.out).toContain('1c kb export')

    // Unknown: reported as itself, never as zero — and the three artefact lines
    // are still there, because status must survive a store it cannot reach and
    // still report the half it can see.
    const unknown = await withStore(
      () => installStore('process.exit(3)'),
      () => cli(['kb', 'status']),
    )
    expect(unknown.out).toContain('ticket store unreadable')
    expect(unknown.out).not.toMatch(/of 0 ticket/)
    expect(unknown.out).not.toContain('⚠')
    expect(unknown.out).toMatch(/index: {2}(built|missing)/)
    expect(unknown.out).toMatch(/chunks: (built|missing)/)
    expect(unknown.out).toMatch(/map: {4}(built|missing)/)
  }, 120_000)
})

// ── AC-1295: one membership rule, and the retired boolean is not it ──────────

describe('story-c4f329d3 — the retired boolean opt-in is not membership', () => {
  it('test_UAT_AC1295_the_retired_boolean_is_not_membership_in_any_spelling_it_ever_had', async () => {
    // ONE MEMBERSHIP RULE, NOT TWO. The boolean this pipeline used before is
    // RETIRED, not deprecated: honouring both would put a document in front of
    // a client-facing assistant on a marker nobody maintains any more, and
    // would leave two answers to "is this document in". Stated as a criterion
    // in its own right rather than as an absence, so a re-introduction of dual
    // membership fails a test rather than passing unnoticed.
    expect(inSystemKb({ fields: { [DOC_KIND_FIELD]: MEMBER_KIND } })).toBe(true)

    // Every shape the retired flag ever had.
    expect(inSystemKb({ fields: { system_kb: true } })).toBe(false)
    expect(inSystemKb({ fields: { system_kb: 'true' } })).toBe(false)
    expect(inSystemKb({ fields: { system_kb: 1 } })).toBe(false)

    // …and the rest of the spread, which fails safe in the same direction it
    // always did: a document carrying some other kind, or none, is out until
    // somebody says otherwise.
    expect(inSystemKb({ fields: { [DOC_KIND_FIELD]: 'architecture' } })).toBe(false)
    expect(inSystemKb({ fields: {} })).toBe(false)
    expect(inSystemKb({ fields: null })).toBe(false)
    expect(inSystemKb({})).toBe(false)

    // The integration half: what the export produced is exactly what the rule
    // selects — nothing silently added, nothing silently dropped, and no
    // excluded document with a file in the corpus.
    const mixed = [
      ticket('DOC-IN1'),
      ticket('DOC-IN2'),
      ticket('DOC-LEGACY-BOOL', { system_kb: true }),
      ticket('DOC-LEGACY-TEXT', { system_kb: 'true' }),
      ticket('DOC-LEGACY-ONE', { system_kb: 1 }),
      ticket('DOC-ARCH', { [DOC_KIND_FIELD]: 'architecture' }),
      ticket('DOC-BARE', {}),
      ticket('DOC-NONE', null),
    ]

    await withRoot(async (root) => {
      const result = await withStore(
        () => installPagingStore(mixed),
        () => exportCorpus(root),
      )

      expect(result.docs.map((d) => d.id)).toEqual(['DOC-IN1', 'DOC-IN2'])
      expect(result.skipped).toEqual(
        mixed
          .filter((t) => !inSystemKb(t))
          .map((t) => t.id)
          .sort(),
      )
      expect(corpusFiles(root)).toEqual(['DOC-IN1.md', 'DOC-IN2.md'])
      for (const id of result.skipped) {
        expect(existsSync(path.join(corpusDir(root), `${id}.md`))).toBe(false)
      }
    })
  })
})
