import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  awarenessDocument,
  bindKb,
  buildKb,
  corpusDir,
  kbStatus,
  resolveEmbedder,
  SHIPPED_SOURCE,
  SYSTEM_KB,
} from '../tools/generate/src/cli/kb'
import { run } from '../tools/generate/src/cli'
import { CommandError, EXIT_CODES } from '../tools/generate/src/cli/errors'
import {
  assertIndexSeam,
  checkIndexSeam,
  knowledgeSeamProbe,
  SHARED_STORE_INSTALL_COMMAND,
} from '../tools/generate/src/cli/shared-store'
import { sharedModuleUrl, webuiPackageDir } from '../tools/generate/src/cli/webui'

/**
 * Reconciliation UATs for story-c4f329d3 — **the knowledge read seam** (BUNDLE-37,
 * BUG-55): AC-2235 and AC-2236.
 *
 * Upstream REQ-112 moved the read half of the knowledge component from one index
 * per host to one index per SOURCE. The build's own validating search, inside the
 * awareness-map stage, is a read — so a build handing it a single unnamed index
 * died at its last stage with "reads from source 'shipped', which this host has
 * no index for". AC-2235 pins that all four stages complete; AC-2236 pins the
 * preflight that would have noticed the seam moving.
 *
 * Stood in for: the embedding and describing models (`LAGRANGE_KM_EMBEDDER` /
 * `LAGRANGE_KM_DESCRIBER`, the seams production reads) and the ticket store (an
 * `xgd` shim on PATH printing a controlled envelope). Everything else — export,
 * both index builds, clustering, access-point validation, `indexFor` — is real.
 *
 * The other criteria of this story are evidenced in the sibling
 * `reconciliation-system-knowledge-base*.test.ts` files.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')

interface StoreTicket {
  uid: string
  id: string
  title: string
  body: string
  created_at: string
  updated_at: string
  fields: Record<string, unknown>
}

function ticket(id: string, title: string, body: string): StoreTicket {
  return {
    uid: `doc-${id.toLowerCase()}`,
    id,
    title,
    body,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    fields: { doc_kind: 'system_kb' },
  }
}

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
    'Contact form and spam',
    `# Contact form and spam

## Anti-spam
A honeypot field and a Turnstile widget guard the public submission endpoint.

## Delivery
An accepted submission is delivered to the business inbox and recorded as a
lead.`,
  ),
  ticket(
    'DOC-D',
    'Uptime monitoring',
    `# Uptime monitoring

## Probes
A scheduled probe checks availability, certificate validity and DNS health.

## Alerting
A failing probe raises an internal event rather than paging anybody directly.`,
  ),
]

/** Put an `xgd` on PATH that answers every listing with `tickets`, complete. */
function installStore(tickets: StoreTicket[]): { dir: string; restore: () => void } {
  const dir = mkdtempSync(path.join(tmpdir(), 'kb-seam-store-'))
  const shim = path.join(dir, 'xgd')
  writeFileSync(
    shim,
    `#!/usr/bin/env node\n` +
      `process.stdout.write(JSON.stringify({ items: ${JSON.stringify(tickets)}, next_cursor: null, truncated: false }))\n`,
    'utf8',
  )
  chmodSync(shim, 0o755)
  const previous = process.env.PATH
  process.env.PATH = `${dir}${path.delimiter}${previous ?? ''}`
  return {
    dir,
    restore: () => {
      if (previous === undefined) delete process.env.PATH
      else process.env.PATH = previous
    },
  }
}

/** The `1c` command line, in process, with both streams and the exit code captured. */
async function cli(
  argv: string[],
  runner: (argv: string[]) => Promise<unknown> = run,
): Promise<{ out: string; err: string; code: number }> {
  const out: string[] = []
  const err: string[] = []
  const log = vi.spyOn(console, 'log').mockImplementation((...parts: unknown[]) => {
    out.push(parts.map(String).join(' '))
  })
  const error = vi.spyOn(console, 'error').mockImplementation((...parts: unknown[]) => {
    err.push(parts.map(String).join(' '))
  })
  const before = process.exitCode
  process.exitCode = 0
  try {
    await runner(argv)
  } finally {
    log.mockRestore()
    error.mockRestore()
  }
  const code = Number(process.exitCode ?? 0)
  process.exitCode = before
  return { out: out.join('\n'), err: err.join('\n'), code }
}

// ── AC-2235 ──────────────────────────────────────────────────────────────────

describe('story-c4f329d3 — the build reads its own index, keyed by source', () => {
  let root: string
  let store: { dir: string; restore: () => void }
  let built: Awaited<ReturnType<typeof buildKb>> | null = null
  /** Carried into the test rather than thrown from the hook, which would read as SKIPPED. */
  let buildFailure: unknown = null
  // Shaped exactly as a previous build would have left it, so the corpus
  // resolver excludes it as a map rather than indexing it as a document.
  const STALE_MAP = awarenessDocument('# stale awareness map written before this build', SYSTEM_KB)

  beforeAll(async () => {
    process.env.LAGRANGE_KM_EMBEDDER = STUB
    process.env.LAGRANGE_KM_DESCRIBER = STUB
    root = mkdtempSync(path.join(tmpdir(), 'kb-seam-'))
    // A map left by a previous build, so "a fresh map was written by THIS run"
    // is observable: a build that died at the map stage would leave this behind
    // and the status report would still say `map: built`.
    mkdirSync(corpusDir(root), { recursive: true })
    writeFileSync(path.join(corpusDir(root), 'awareness.md'), STALE_MAP, 'utf8')
    store = installStore(CORPUS)
    try {
      built = await buildKb(root)
    } catch (error) {
      buildFailure = error
    }
  }, 120_000)

  afterAll(() => {
    store.restore()
    rmSync(store.dir, { recursive: true, force: true })
    delete process.env.LAGRANGE_KM_EMBEDDER
    delete process.env.LAGRANGE_KM_DESCRIBER
    rmSync(root, { recursive: true, force: true })
  })

  it('test_UAT_AC2235_build_completes_all_four_stages_with_the_map_search_keyed_by_source', async () => {
    // The build did not die — and specifically not with the seam refusal that
    // BUG-55 produced at the last stage.
    const failure = buildFailure instanceof Error ? buildFailure.message : String(buildFailure ?? '')
    expect(failure).not.toMatch(/no index for/)
    expect(buildFailure).toBeNull()
    expect(built).not.toBeNull()

    // All four stages produced their artefact.
    const dir = corpusDir(root)
    for (const t of CORPUS) expect(existsSync(path.join(dir, `${t.id}.md`))).toBe(true)
    expect(existsSync(path.join(dir, 'index'))).toBe(true)
    expect(existsSync(path.join(dir, 'chunks'))).toBe(true)
    expect(built!.documents).toBe(CORPUS.length)
    expect(built!.chunks).toBeGreaterThan(0)

    // The map is THIS build's: the stale one is gone, replaced by a generated
    // map whose territories carry validated ways in — which only the map's own
    // search, resolving against the freshly built index, could have produced.
    const map = readFileSync(path.join(dir, 'awareness.md'), 'utf8')
    expect(map).not.toBe(STALE_MAP)
    expect(map).not.toContain('stale awareness map')
    expect(built!.territories).toBeGreaterThanOrEqual(1)
    expect(built!.accessPoints).toBeGreaterThan(0)
    expect(kbStatus(root).map).toBe(true)

    // And a search over the built system KB, keyed exactly as the build keys it
    // — by the source its declaration resolves to — returns the document a
    // description points at.
    const lib = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
    const { nodeIndexSource } = await import(/* @vite-ignore */ sharedModuleUrl('knowledge', './node'))
    const binding = await bindKb(root)
    const kb = (binding.kbs as Map<string, { source: string }>).get(SYSTEM_KB)
    expect(kb!.source).toBe(SHIPPED_SOURCE)
    expect(SHIPPED_SOURCE).toBe('shipped')

    const hits = await lib.search('what makes the slides rotate automatically on an interval', {
      indexes: { [SHIPPED_SOURCE]: nodeIndexSource(path.join(dir, 'index')) },
      store: binding.store,
      kbs: binding.kbs,
      kb: SYSTEM_KB,
      topK: 3,
      embedder: await resolveEmbedder(),
      sources: binding.sources,
    })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].uid).toBe('DOC-A')
  })
})

// ── AC-2236 ──────────────────────────────────────────────────────────────────

describe('story-c4f329d3 — the preflight asks compatible as well as present', () => {
  it('test_UAT_AC2236_preflight_checks_the_index_seam_and_reports_it_on_its_own_line', async () => {
    // COMPATIBLE, against the store as installed: the real probe resolves a KB
    // through the component's own `indexFor` and gets the index under its key.
    //
    // It is a single pure call: with the embedder seam pointing nowhere and the
    // network refusing, the real probe still answers, and nothing was fetched.
    const embedderBefore = process.env.LAGRANGE_KM_EMBEDDER
    process.env.LAGRANGE_KM_EMBEDDER = path.join(tmpdir(), 'no-such-embedder.mjs')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('network is not available to the seam probe')
    })
    try {
      expect(await checkIndexSeam()).toEqual({ ok: true })
      await expect(assertIndexSeam()).resolves.toBeUndefined()
      // The same real probe built around the real loader agrees.
      expect(
        await checkIndexSeam({
          probe: knowledgeSeamProbe(() => import(/* @vite-ignore */ sharedModuleUrl('knowledge'))),
        }),
      ).toEqual({ ok: true })
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      fetchSpy.mockRestore()
      if (embedderBefore === undefined) delete process.env.LAGRANGE_KM_EMBEDDER
      else process.env.LAGRANGE_KM_EMBEDDER = embedderBefore
    }

    // INCOMPATIBLE — the REAL detection, run against component doubles. Only the
    // module the probe loads is substituted; the checks are the production ones.
    const real = (await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))) as Record<string, unknown>
    const withIndexFor = (indexFor: unknown) => async () => ({ ...real, indexFor })

    // (a) The old shape: no `indexFor` at all.
    const failureText = 'the knowledge component exports no `indexFor`'
    const { indexFor: _dropped, ...withoutIndexFor } = real
    void _dropped
    const noIndexFor = knowledgeSeamProbe(async () => withoutIndexFor)
    const report = await checkIndexSeam({ probe: noIndexFor })
    expect(report.ok).toBe(false)
    expect(report.detail).toBe(failureText)

    // (b) A component that ignores the map — the singular signature, which hands
    // back whatever it was given as "the index".
    const ignoresMap = await checkIndexSeam({
      probe: knowledgeSeamProbe(withIndexFor((_kb: unknown, index: unknown) => index)),
    })
    expect(ignoresMap.ok).toBe(false)
    expect(ignoresMap.detail).toMatch(/did not return the index named by the KB's source/)

    // (c) A component that resolves, but to the wrong index.
    const wrongIndex = await checkIndexSeam({
      probe: knowledgeSeamProbe(withIndexFor(() => ({ not: 'the sentinel' }))),
    })
    expect(wrongIndex.ok).toBe(false)
    expect(wrongIndex.detail).toMatch(/did not return the index named by the KB's source/)

    // (d) A component that refuses the map outright: its own words are carried.
    const refusesMap = await checkIndexSeam({
      probe: knowledgeSeamProbe(
        withIndexFor(() => {
          throw new Error('expected a single source, got an object')
        }),
      ),
    })
    expect(refusesMap).toEqual({ ok: false, detail: 'expected a single source, got an object' })

    const refuses = noIndexFor

    let refusal: unknown = null
    try {
      await assertIndexSeam({ probe: refuses })
    } catch (err) {
      refusal = err
    }
    expect(refusal).toBeInstanceOf(CommandError)
    const error = refusal as CommandError
    // The environment exit code, like its presence neighbour.
    expect(error.code).toBe('ENVIRONMENT')
    expect(EXIT_CODES[error.code]).toBe(6)
    // The component's own words, and the expected shape: one index per source.
    expect(error.message).toContain(failureText)
    expect(error.message).toMatch(/one index per source/i)
    expect(error.message).toContain('indexes')
    expect(error.message).toMatch(/map from source/)
    // The remedy: the shared-store install command, and the call sites if current.
    expect(error.hint).toContain(SHARED_STORE_INSTALL_COMMAND)
    expect(error.hint).toContain('kb.ts')

    // THE REPORT, through the real command: the seam result sits on its own line,
    // after the presence summary, and neither line claims the other's subject.
    const result = await cli(['preflight'])
    expect(result.code, result.err).toBe(0)
    const lines = result.out.split('\n')
    const countIndex = lines.findIndex((l) => l.startsWith('Preflight passed:'))
    const seamIndex = lines.findIndex((l) => l.startsWith('Index seam:'))
    expect(countIndex).toBeGreaterThanOrEqual(0)
    expect(seamIndex).toBeGreaterThan(countIndex)
    expect(lines[countIndex]).toMatch(/shared components, \d+ declared packages\.$/)
    expect(lines[countIndex]).not.toMatch(/seam|indexes/i)
    expect(lines[seamIndex]).toContain('installed knowledge component takes `indexes`')
    expect(lines[seamIndex]).not.toMatch(/components,|packages/)
  })

  it('test_UAT_AC2236_missing_component_is_reported_as_missing_and_the_seam_is_never_probed', async () => {
    // PRESENT, THEN COMPATIBLE. The knowledge component is made to not resolve
    // through the presence check's own resolver seam; everything else resolves
    // exactly as installed. The seam check is the real one, wrapped only so the
    // test can see whether the command ever reached it.
    const seamCalls: unknown[] = []
    vi.resetModules()
    vi.doMock('../tools/generate/src/cli/shared-store', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../tools/generate/src/cli/shared-store')>()
      const knowledgeMissing = (component: string): string | undefined => {
        if (component === 'knowledge') return undefined
        try {
          return webuiPackageDir(component)
        } catch {
          return undefined
        }
      }
      return {
        ...actual,
        checkSharedStore: () => actual.checkSharedStore({ resolve: knowledgeMissing }),
        assertSharedStore: () => actual.assertSharedStore({ resolve: knowledgeMissing }),
        assertIndexSeam: async (...args: Parameters<typeof actual.assertIndexSeam>) => {
          seamCalls.push(args)
          return actual.assertIndexSeam(...args)
        },
        checkIndexSeam: async (...args: Parameters<typeof actual.checkIndexSeam>) => {
          seamCalls.push(args)
          return actual.checkIndexSeam(...args)
        },
      }
    })
    try {
      const fresh = await import('../tools/generate/src/cli')
      const result = await cli(['preflight'], fresh.run)

      // Refused as an environment failure (exit 6), naming the missing
      // component and the command that installs it.
      expect(result.code).toBe(EXIT_CODES.ENVIRONMENT)
      expect(result.code).toBe(6)
      expect(result.out).toMatch(/MISS\s+shared\/server\s+knowledge/)
      expect(result.err).toMatch(/shared component store is incomplete/)
      expect(result.err).toMatch(/\/knowledge \(server\) does not resolve/)
      expect(result.err).toContain(SHARED_STORE_INSTALL_COMMAND)

      // Reported as MISSING, never as incompatible: the seam was not probed,
      // and neither the success summary nor the seam line was printed.
      expect(seamCalls).toEqual([])
      expect(result.out).not.toMatch(/^Index seam:/m)
      expect(result.out).not.toMatch(/Preflight passed:/)
      expect(result.err).not.toMatch(/does not take the index seam/)
    } finally {
      vi.doUnmock('../tools/generate/src/cli/shared-store')
      vi.resetModules()
    }
  })
})
