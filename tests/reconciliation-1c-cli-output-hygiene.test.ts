import { afterAll, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs, withCleanStdout } from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-e15a19ef — "1c CLI: boolean flags keep their
 * positionals and --json emits a clean scriptable document".
 *
 * Two CLI-correctness guarantees, reconciled from bundle-ab9e0cb6 (commits
 * 4f681c73 and a4323720):
 *
 *   1. `--multi-viewport` is a boolean toggle, so it never consumes the site slug
 *      as its value (AC-656) — verified at the `parseArgs` boundary.
 *   2. Render/bootstrap chatter is kept off stdout so `--json` is a single clean
 *      JSON document (AC-657/658), and stdout is always restored afterwards, even
 *      when the wrapped computation throws (AC-659).
 *
 * AC-657 and AC-658 are properties of the *command*, not of a helper, so they are
 * measured by spawning the real `1c` binary and reading the byte streams it
 * actually produces — the same `spawnSync` shape AC-738 and AC-1415 use. An
 * in-process harness cannot stand in for them: vitest reroutes `console.*`, so a
 * spy observes the arguments to a log call rather than the stdout stream a
 * downstream `| jq` reads, and would not see a stray `process.stdout.write`.
 *
 * The actual side is injected with `--actual <manifest.json>`, the one values-diff
 * shape that reaches both `--json` emit branches without rendering — so these run
 * everywhere, with no browser and no third-party site.
 */

// ── real-binary harness ──────────────────────────────────────────────────────

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const BIN = path.join(repoRoot, 'tools', 'generate', 'bin', '1c.mjs')

/**
 * Spawn the real `1c` binary and return its raw streams. Run from the repo root:
 * the launcher roots its bundler server there and the install preflight (AC-1013)
 * resolves declared dependencies against the cwd — the operator always invokes
 * `1c` in-repo.
 */
function cli(...args: string[]): { status: number | null; stdout: string; stderr: string } {
  const res = spawnSync('node', [BIN, ...args], { cwd: repoRoot, encoding: 'utf8' })
  return { status: res.status, stdout: res.stdout, stderr: res.stderr }
}

const tmpDirs: string[] = []
function tmp(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), prefix))
  tmpDirs.push(d)
  return d
}
afterAll(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** A reference bundle carrying the single-width capture the default path reads. */
function refBundle(): string {
  const dir = tmp('ac657-ref-')
  writeFileSync(
    path.join(dir, 'capture.json'),
    JSON.stringify({
      url: 'http://ref.test/',
      host: 'ref.test',
      path: '/',
      capturedAt: '2020-01-01T00:00:00.000Z',
      viewport: { width: 1280, height: 800 },
      theme: {},
      sections: [],
      assets: [],
    }),
  )
  return dir
}

/** A pre-extracted actual-side manifest, so no render or browser is needed. */
function actualManifest(): string {
  const file = path.join(tmp('ac657-actual-'), 'actual.json')
  writeFileSync(file, JSON.stringify({ source: 'draft:x', elements: [], sections: [] }))
  return file
}

/** The diagnostic classes the AC names as forbidden on stdout. */
const DIAGNOSTICS = ['dependencies optimized', 'Re-optimizing dependencies', 'Missing pages directory']

// ── AC-656: --multi-viewport keeps the slug positional in either flag order ───

describe('story-e15a19ef — --multi-viewport does not swallow the slug positional', () => {
  it('test_UAT_AC656_multi_viewport_keeps_slug_positional', () => {
    // A boolean flag must not take a value: `values-diff --multi-viewport <slug>`
    // would otherwise consume <slug> as the flag's value, leaving no positional
    // and aborting with "Missing required <slug>". The slug must survive as the
    // command's positional whether the flag precedes or follows it, and any
    // value-taking option (--ref) must keep its own value.
    const SLUG = 'gigabytealchemy'
    const orderings: Record<string, string[]> = {
      'flag before slug': ['values-diff', '--multi-viewport', SLUG, '--ref', 'bundle/dir'],
      'flag after slug': ['values-diff', SLUG, '--ref', 'bundle/dir', '--multi-viewport'],
    }

    for (const [label, argv] of Object.entries(orderings)) {
      const parsed = parseArgs(argv)
      // The slug is retained as the positional (alongside the command word) in
      // either ordering — the flag did not eat it.
      expect(parsed.positionals, label).toEqual(['values-diff', SLUG])
      // The multi-viewport toggle is on.
      expect(parsed.flags['multi-viewport'], label).toBe(true)
      // The value-taking --ref keeps its own value rather than being disturbed.
      expect(parsed.flags.ref, label).toBe('bundle/dir')
    }
  })
})

// ── AC-657: values-diff --json prints exactly one parseable JSON document ─────

describe('story-e15a19ef — --json stdout is exactly one clean JSON document', () => {
  it('test_UAT_AC657_json_is_exactly_one_parseable_document', () => {
    // The real `1c values-diff … --json` command, observed at its byte streams.
    const ref = refBundle()
    const actual = actualManifest()

    const res = cli('values-diff', '--ref', ref, '--actual', actual, '--json')

    // The command ran to completion on a clean diff.
    expect(res.status).toBe(0)
    // EVERYTHING on stdout is exactly one well-formed JSON document: JSON.parse
    // rejects both a truncated document and any trailing content after the first
    // one, so a second `console.log` in the emit branch — the failure this AC
    // exists to prevent — fails right here.
    const parsed = JSON.parse(res.stdout)
    // …and the document is the command's own diff report, not some other payload.
    expect(parsed).toMatchObject({
      expectedSource: 'ref.test/',
      actualSource: 'draft:x',
      deltas: [],
    })
    // Belt and braces on "exactly one": the stream opens with the document and
    // ends with it — nothing is prepended or appended around the braces.
    expect(res.stdout.trimStart().startsWith('{')).toBe(true)
    expect(res.stdout.trimEnd().endsWith('}')).toBe(true)
    // No render/bootstrap diagnostic text is interleaved with or appended to it.
    for (const diag of DIAGNOSTICS) expect(res.stdout, diag).not.toContain(diag)
  }, 120_000)

  it('test_UAT_AC657_multi_viewport_json_stdout_carries_no_partial_document', () => {
    // The AC's Criterion spans BOTH emit branches — "single-width or
    // `--multi-viewport`". The multi-viewport branch cannot produce a document
    // without a browser (it renders, serves and re-shoots the draft across the
    // ladder), so the reachable half of its stdout contract is measured here: when
    // it refuses, it writes NOTHING to stdout, so a downstream `| jq` reads an
    // empty stream rather than a half-written or diagnostic-prefixed document.
    const res = cli('values-diff', 'acme', '--ref', tmp('ac657-noladder-'), '--multi-viewport', '--json')

    expect(res.status).not.toBe(0)
    // Not one byte on stdout — in particular, no partial document.
    expect(res.stdout).toBe('')
    // The refusal itself went to stderr, so it was reported and not merely dropped.
    expect(res.stderr).toContain('multistate.json')
  }, 120_000)

  it('test_UAT_AC657_without_json_stdout_is_the_human_report_not_a_document', () => {
    // The guard on the two legs above: `--json` must be a real branch. Without it
    // the same command prints its human report, which is NOT parseable JSON — so a
    // mutant that emitted the document unconditionally could not pass all three.
    const res = cli('values-diff', '--ref', refBundle(), '--actual', actualManifest())

    expect(res.status).toBe(0)
    expect(res.stdout).toContain('values-diff: ref.test/')
    expect(() => JSON.parse(res.stdout)).toThrow()
  }, 120_000)
})

// ── AC-658: render & bootstrap diagnostics are emitted on stderr, not stdout ──

describe('story-e15a19ef — render/bootstrap diagnostics land on stderr', () => {
  it('test_UAT_AC658_command_streams_are_split_stdout_carries_only_its_own_output', () => {
    // The stream split, asserted on the real command rather than on the helper it
    // uses. Two directions, both of which a one-line plumbing slip would break:

    // (a) On the success path, stdout carries the command's own document and
    //     stderr is silent — nothing bled from stdout into stderr either.
    const ok = cli('values-diff', '--ref', refBundle(), '--actual', actualManifest(), '--json')
    expect(ok.status).toBe(0)
    expect(() => JSON.parse(ok.stdout)).not.toThrow()
    expect(ok.stderr).toBe('')

    // (b) On the failure path, the diagnostic is on stderr and absent from stdout —
    //     stdout stays reserved for the command's own output, which in this case is
    //     nothing at all.
    const bad = cli('values-diff', 'acme', '--ref', tmp('ac658-noladder-'), '--multi-viewport', '--json')
    expect(bad.stderr).toContain('multistate.json')
    expect(bad.stdout).not.toContain('multistate.json')
    expect(bad.stdout).toBe('')
  }, 120_000)

  it('test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr', async () => {
    // The diversion mechanism the command wraps its render phase in, exercised
    // directly. This is the one clause the real binary cannot demonstrate here:
    // genuine render chatter is only produced on the slug-driven path, which
    // renders, serves and drives a real browser — so the diagnostics are injected
    // at the wrapper instead. The clause that the CLI still *applies* this wrapper
    // is covered by the stream-split legs above; the bootstrap phase being quiet at
    // source is AC-738's (`reconciliation-1c-astro-free-render.test.ts`), which
    // spawns the real binary and asserts the warning appears on NEITHER stream.
    //
    // The three diagnostic classes named in the AC — a dependency re-optimization
    // notice, a deprecation warning, and the one-time "Missing pages directory"
    // bootstrap warning — are written to stdout by the bundler. Every one of them
    // must come out on stderr and be absent from stdout.
    const origOut = process.stdout.write.bind(process.stdout)
    const origErr = process.stderr.write.bind(process.stderr)
    const out: string[] = []
    const err: string[] = []
    process.stdout.write = ((c: unknown) => (out.push(String(c)), true)) as typeof process.stdout.write
    process.stderr.write = ((c: unknown) => (err.push(String(c)), true)) as typeof process.stderr.write
    try {
      await withCleanStdout(async () => {
        process.stdout.write('[vite] Re-optimizing dependencies because lockfile changed\n')
        process.stdout.write('The `compilerOptions` option is deprecated and will be removed\n')
        process.stdout.write('[WARN] Missing pages directory: src/pages\n')
        return null
      })
    } finally {
      process.stdout.write = origOut
      process.stderr.write = origErr
    }

    const stdout = out.join('')
    const stderr = err.join('')
    for (const diag of ['Re-optimizing dependencies', 'deprecated', 'Missing pages directory']) {
      // Present on stderr…
      expect(stderr, diag).toContain(diag)
      // …and absent from stdout.
      expect(stdout, diag).not.toContain(diag)
    }
  })
})

// ── AC-659: stdout is restored after the phase, including when it throws ──────

describe('story-e15a19ef — stdout is restored after success and after failure', () => {
  it('test_UAT_AC659_stdout_restored_after_success_and_failure', async () => {
    const origOut = process.stdout.write.bind(process.stdout)
    const origErr = process.stderr.write.bind(process.stderr)
    const out: string[] = []
    process.stdout.write = ((c: unknown) => (out.push(String(c)), true)) as typeof process.stdout.write
    // stderr is a no-op sink so the diverted-during-render writes are not counted.
    process.stderr.write = (() => true) as typeof process.stderr.write
    try {
      // Success case: writes inside the phase are diverted; once the phase returns,
      // a write lands on stdout again.
      await withCleanStdout(async () => {
        process.stdout.write('diverted-during-render\n')
        return 'ok'
      })
      process.stdout.write('after-success\n')
      expect(out.join('')).toBe('after-success\n')

      // Failure case: the phase throws — the error propagates, AND stdout is still
      // restored, so a subsequent write lands on stdout (never left permanently
      // aliased to stderr).
      out.length = 0
      await expect(
        withCleanStdout(async () => {
          process.stdout.write('diverted-before-throw\n')
          throw new Error('render blew up')
        }),
      ).rejects.toThrow('render blew up')
      process.stdout.write('after-failure\n')
      expect(out.join('')).toBe('after-failure\n')
    } finally {
      process.stdout.write = origOut
      process.stderr.write = origErr
    }
  })
})
