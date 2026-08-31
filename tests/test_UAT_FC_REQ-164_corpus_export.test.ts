import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  chmodSync,
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
  bindKb,
  configPath,
  corpusDir,
  ensureConfig,
  exportCorpus,
  inSystemKb,
  kbRoot,
  kbStatus,
  readDocTickets,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import { run } from '../tools/generate/src/cli'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'

/**
 * REQ-164 — **corpus export correctness**: the three ways `1c kb export` could
 * quietly produce a smaller corpus than intended.
 *
 * They are one suite because they are one failure: no error, no warning, just an
 * index that builds, works, and is missing documents. The symptom surfaces much
 * later as "the assistant doesn't seem to know about that", several artefacts
 * downstream of the cause — which is precisely why each one needs a test that
 * fails LOUDLY at the point of the mistake.
 *
 *   1. membership read from a boolean flag instead of `doc_kind` (DOC-39 §3.3)
 *   2. a query-time corpus predicate re-applying a build-time filter
 *   3. a paged ticket list read as if it were the whole list
 *
 * WHAT IS STOOD IN FOR. The ticket store only — the `xgd` CLI `readDocTickets`
 * shells out to, replaced on `PATH` by a shim that prints a controlled envelope.
 * That is a separate product invoked as a subprocess, not one of our modules, and
 * standing it in is what makes truncation and mixed membership assertable at all:
 * the real store cannot be made to return a 60-item page on demand. The export's
 * own argv, JSON parsing, envelope check, membership filter, rendering and sweep
 * all still run for real, as does the real `DocDirStore` and the real corpus
 * resolution.
 */

// ── the controlled ticket store ──────────────────────────────────────────────

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
  fields: Record<string, unknown> | null = { doc_kind: 'system_kb' },
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

/**
 * Put an `xgd` on `PATH` whose stdout is produced by `body`, given its argv.
 *
 * The shim is handed the ARGV rather than a fixed payload, which is the whole
 * point for the pagination ACs: whether `readDocTickets` actually asks for every
 * page is only observable from the flags it passes, and a shim that ignored them
 * would let a truncating export pass.
 */
function installStore(body: string): () => void {
  const dir = mkdtempSync(path.join(tmpdir(), 'kb164-store-'))
  shims.push(dir)
  const shim = path.join(dir, 'xgd')
  writeFileSync(
    shim,
    `#!/usr/bin/env node\nconst argv = process.argv.slice(2)\n${body}\n`,
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

/** A store that answers with `tickets`, honouring `--no-limit` as xgd does. */
function installPagingStore(tickets: StoreTicket[], pageSize = 50): () => void {
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
  const root = mkdtempSync(path.join(tmpdir(), 'kb164-'))
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

/**
 * Run `fn` with the repository's own corpus directory moved out of the way, and
 * put it back afterwards — including when `fn` throws.
 *
 * Only for the two ACs that assert what the COMMAND prints, since `1c kb export`
 * and `1c kb status` take no root argument and are therefore the real thing or
 * nothing. Every other AC here drives the functions directly, against a scratch
 * tree, and needs none of this.
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

afterEach(() => {
  while (shims.length) rmSync(shims.pop()!, { recursive: true, force: true })
})

// ── 1. membership is the kind, not the flag ──────────────────────────────────

describe('REQ-164 — membership is `doc_kind: system_kb`', () => {
  it('test_UAT_FC_REQ-164_the_export_selects_exactly_the_documents_carrying_the_kind', async () => {
    // A KIND, not a flag (DOC-39 §3.3). The retired boolean is the sharp case:
    // a document still carrying `system_kb: true` from before the change is NOT
    // a member, because honouring it would put a document in front of a
    // client-facing assistant on a marker nobody maintains any more.
    const mixed = [
      ticket('DOC-IN1'),
      ticket('DOC-IN2'),
      ticket('DOC-ARCH', { doc_kind: 'architecture' }),
      ticket('DOC-POLICY', { doc_kind: 'security_policy' }),
      ticket('DOC-LEGACY', { system_kb: true }),
      ticket('DOC-BARE', {}),
      ticket('DOC-NONE', null),
    ]

    await withRoot(async (root) => {
      const result = await withStore(
        () => installPagingStore(mixed),
        () => exportCorpus(root),
      )

      expect(result.docs.map((d) => d.id)).toEqual(['DOC-IN1', 'DOC-IN2'])
      // Named, never counted: every non-member is reported individually, so an
      // operator can see WHICH document is missing rather than that one is.
      expect(result.skipped).toEqual([
        'DOC-ARCH',
        'DOC-BARE',
        'DOC-LEGACY',
        'DOC-NONE',
        'DOC-POLICY',
      ])
      for (const id of result.skipped) {
        expect(existsSync(path.join(corpusDir(root), `${id}.md`))).toBe(false)
      }
      expect(existsSync(path.join(corpusDir(root), 'DOC-IN1.md'))).toBe(true)
    })
  })

  it('test_UAT_FC_REQ-164_the_command_names_the_kind_that_would_admit_a_skipped_document', async () => {
    // The skip line has to say what to DO about it. "not in the KB" alone sends
    // an operator looking for a list somewhere; naming the field and the value
    // makes the fix a one-line ticket edit.
    //
    // `kb export` takes no root, so it writes to the repository's own corpus.
    // That is correct for the command and unacceptable for a test — the run
    // would sweep every real document out as unrecognised — so the real corpus
    // is moved aside and put back. Restoring rather than rebuilding, because a
    // rebuild would depend on the machine's ticket store being reachable.
    const { out } = await withRealCorpusAside(() =>
      withStore(
        () =>
          installPagingStore([ticket('DOC-IN1'), ticket('DOC-OUT', { doc_kind: 'architecture' })]),
        () => cli(['kb', 'export']),
      ),
    )
    expect(out).toContain('doc_kind: system_kb')
    expect(out).toContain('DOC-OUT')
    expect(out).not.toContain('DOC-IN1')
  })
})

// ── 2. the shipped corpus is unrestricted ────────────────────────────────────

describe('REQ-164 — the shipped KB declares an unrestricted corpus', () => {
  it('test_UAT_FC_REQ-164_a_scaffolded_declaration_restricts_nothing', async () => {
    // At runtime the distribution IS the corpus. Re-applying the export's own
    // selection as a query-time predicate can only subtract, and the only thing
    // it can subtract is a file whose frontmatter does not look the way the
    // predicate expects — which disappears from the KB with no error at all.
    await withRoot((root) => {
      ensureConfig(root)
      const declared = JSON.parse(readFileSync(configPath(root), 'utf8'))
      expect(declared.knowledge_bases[SYSTEM_KB].corpus).toEqual({})
      expect(declared.knowledge_bases[SYSTEM_KB].source).toBe('shipped')
    })
  })

  it('test_UAT_FC_REQ-164_the_shipped_declaration_in_the_repository_restricts_nothing', () => {
    // The declaration that actually ships, not just the one a fresh checkout
    // would scaffold. `ensureConfig` never overwrites an existing file, so these
    // two can drift apart silently — and it is this one the product reads.
    const declared = JSON.parse(readFileSync(configPath(kbRoot()), 'utf8'))
    expect(declared.knowledge_bases[SYSTEM_KB].corpus).toEqual({})
  })

  it('test_UAT_FC_REQ-164_a_markdown_file_in_the_corpus_is_resolved_whatever_its_frontmatter', async () => {
    // The behavioural half, and the one that matters: three files that a
    // `type=doc AND fields.system_kb=true` predicate would each have dropped for
    // a different reason are all resolved by the corpus as it now stands.
    await withRoot(async (root) => {
      const dir = corpusDir(root)
      mkdirSync(dir, { recursive: true })
      ensureConfig(root)

      writeFileSync(
        path.join(dir, 'DOC-FULL.md'),
        '---\nid: DOC-FULL\ntype: doc\ntitle: Full frontmatter\nfields:\n' +
          '  doc_kind: system_kb\n---\n# Full\n\nBody.\n',
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
      // The predicate the corpus resolves through is unrestricted, so it is a
      // membership rule that no longer excludes anything the directory holds.
      expect([...binding.kb.corpus.terms.keys()]).toEqual([])
      expect([...binding.kb.corpus.types]).toEqual([])
    })
  })
})

// ── 3. the export lists exhaustively ─────────────────────────────────────────

describe('REQ-164 — the ticket list is read exhaustively', () => {
  it('test_UAT_FC_REQ-164_every_ticket_past_the_default_page_is_read', async () => {
    // `xgd ticket list` pages at 50 and reports the rest through `next_cursor`.
    // A consumer that reads `items` and stops takes page one and calls it the
    // corpus. 60 > 50 on purpose: the fixture has to be larger than one page or
    // the assertion is vacuous — which is exactly how the bug survived.
    const many = Array.from({ length: 60 }, (_, i) => ticket(`DOC-${String(i + 1).padStart(3, '0')}`))

    const read = await withStore(() => installPagingStore(many), () => readDocTickets())
    expect(read.length).toBe(60)
    expect(read.map((t) => t.id)).toContain('DOC-060')

    // And the export carries all of them through to the corpus directory.
    await withRoot(async (root) => {
      const result = await withStore(() => installPagingStore(many), () => exportCorpus(root))
      expect(result.docs.length).toBe(60)
      expect(existsSync(path.join(corpusDir(root), 'DOC-060.md'))).toBe(true)
    })
  })

  it('test_UAT_FC_REQ-164_a_truncated_page_is_refused_rather_than_silently_short', async () => {
    // `--no-limit` is upstream's promise; this is the assertion that it was
    // kept. If a truncated envelope arrives anyway — an older `xgd` on `PATH`, a
    // flag that stops meaning what it means — a quietly shorter corpus is the
    // one outcome that must not happen, so it is a loud failure instead.
    const many = Array.from({ length: 60 }, (_, i) => ticket(`DOC-${String(i + 1).padStart(3, '0')}`))
    const stubborn = () =>
      installStore(
        `const all = ${JSON.stringify(many)}\n` +
          `process.stdout.write(JSON.stringify({ items: all.slice(0, 50), next_cursor: 'page-2', truncated: true }))`,
      )

    await expect(
      withStore(stubborn, () => readDocTickets()),
    ).rejects.toThrow(/truncated/i)

    // The refusal names the flag, so the diagnosis does not need this file.
    await expect(withStore(stubborn, () => readDocTickets())).rejects.toThrow(/--no-limit/)
  })

  it('test_UAT_FC_REQ-164_a_complete_single_page_envelope_is_accepted', async () => {
    // The guard must not fire on the ordinary case: a store whose whole answer
    // fits in one page reports no cursor, and that is success, not truncation.
    const few = [ticket('DOC-A'), ticket('DOC-B')]
    const read = await withStore(() => installPagingStore(few), () => readDocTickets())
    expect(read.map((t) => t.id)).toEqual(['DOC-A', 'DOC-B'])
  })
})

// ── 4. a short corpus is visible, not inferred ───────────────────────────────

describe('REQ-164 — status reports the corpus against the ticket count', () => {
  it('test_UAT_FC_REQ-164_status_counts_the_tickets_carrying_the_marker', async () => {
    const members = [ticket('DOC-A'), ticket('DOC-B'), ticket('DOC-C')]
    const store = [...members, ticket('DOC-OTHER', { doc_kind: 'architecture' })]

    await withRoot(async (root) => {
      await withStore(
        () => installPagingStore(store),
        () => {
          exportCorpus(root)
          // Both sides of the comparison, from one status call: what is on disk
          // and what the store says should be. Agreement is the healthy case.
          expect(kbStatus(root)).toMatchObject({ corpus: 3, tickets: 3 })
        },
      )
    })
  })

  it('test_UAT_FC_REQ-164_a_stale_corpus_is_reported_rather_than_inferred', async () => {
    // The failure this whole ticket is about, made visible: 2 documents on disk
    // looks exactly as healthy as 3 unless something says what the number was
    // supposed to be. So status says it, and says what to do about it.
    await withRoot(async (root) => {
      await withStore(
        () => installPagingStore([ticket('DOC-A'), ticket('DOC-B')]),
        () => exportCorpus(root),
      )

      const status = await withStore(
        () => installPagingStore([ticket('DOC-A'), ticket('DOC-B'), ticket('DOC-C')]),
        () => kbStatus(root),
      )
      expect(status.corpus).toBe(2)
      expect(status.tickets).toBe(3)
    })

    // And the command SAYS so — a discrepancy nobody prints is not visible.
    // With the real corpus aside there are zero documents on disk against three
    // in the store, which is the discrepancy case whatever this machine holds.
    const { out } = await withRealCorpusAside(() =>
      withStore(
        () => installPagingStore([ticket('DOC-A'), ticket('DOC-B'), ticket('DOC-C')]),
        () => cli(['kb', 'status']),
      ),
    )
    expect(out).toMatch(/ticket\(s\) carry doc_kind: system_kb/)
    expect(out).toContain('1c kb export')
  })

  it('test_UAT_FC_REQ-164_an_unreadable_store_is_unknown_and_never_zero', async () => {
    // Zero is a real and alarming answer. A status command that manufactures it
    // out of an unrelated failure sends an operator to rebuild a corpus that was
    // never broken, so "cannot check" is reported as itself.
    const broken = () => installStore(`process.exit(3)`)

    await withRoot(async (root) => {
      const status = await withStore(broken, () => kbStatus(root))
      expect(status.tickets).toBeNull()
      expect(status.corpus).toBe(0)
    })

    const { out } = await withStore(broken, () => cli(['kb', 'status']))
    expect(out).toContain('ticket store unreadable')
    expect(out).not.toMatch(/of 0 ticket/)
  })

  it('test_UAT_FC_REQ-164_the_real_store_agrees_with_the_membership_rule', () => {
    // Against the REAL ticket store, unstubbed: the four documents chosen for the
    // starting corpus carry the kind, so the export has something to export. A
    // count rather than a list of ids — which documents are members is a decision
    // that will change as the corpus is rewritten (DOC-39 §3.5), and pinning the
    // ids here would make every such decision a test failure.
    const tickets = readDocTickets()
    expect(tickets.length).toBeGreaterThan(0)
    expect(tickets.filter(inSystemKb).length).toBeGreaterThan(0)
  }, 300_000)
})
