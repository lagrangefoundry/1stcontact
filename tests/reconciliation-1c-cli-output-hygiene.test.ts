import { describe, expect, it } from 'vitest'
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
 *      when the wrapped computation throws (AC-659) — verified at the
 *      `withCleanStdout` boundary that the CLI wraps every values-diff compute in.
 *
 * These are pure tests: both seams are synchronous/in-process argument-parsing
 * and stdout-plumbing primitives. No browser, no Astro, no third-party site.
 */

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
  it('test_UAT_AC657_json_is_exactly_one_parseable_document', async () => {
    // Faithful reproduction of run()'s `--json` path: the diff compute is wrapped
    // in withCleanStdout (which the in-process Astro/Vite render fills with
    // "Re-optimizing dependencies" / "Missing pages directory" chatter on stdout),
    // then the CLI emits exactly one JSON document on stdout. We assert against the
    // raw stdout stream — the byte channel withCleanStdout protects — so the write
    // goes through process.stdout.write directly (vitest reroutes console.*).
    // stdout captured on its own must parse as that single document, with no
    // diagnostic text interleaved or appended.
    const origOut = process.stdout.write.bind(process.stdout)
    const origErr = process.stderr.write.bind(process.stderr)
    const out: string[] = []
    const err: string[] = []
    process.stdout.write = ((c: unknown) => (out.push(String(c)), true)) as typeof process.stdout.write
    process.stderr.write = ((c: unknown) => (err.push(String(c)), true)) as typeof process.stderr.write
    try {
      const report = await withCleanStdout(async () => {
        // Render/bootstrap diagnostics the container would emit on stdout.
        process.stdout.write('\n  [vite] ✨ new dependencies optimized: sharp\n')
        process.stdout.write('[vite] Re-optimizing dependencies because lockfile changed\n')
        process.stdout.write('[WARN] Missing pages directory: src/pages\n')
        return { matched: 3, unmatched: 0, deltas: [] }
      })
      // The CLI's own machine-readable output — the only thing meant for stdout.
      process.stdout.write(JSON.stringify(report, null, 2) + '\n')
    } finally {
      process.stdout.write = origOut
      process.stderr.write = origErr
    }

    const stdout = out.join('')
    // stdout parses cleanly as exactly one JSON document that a downstream tool
    // (e.g. `| jq`) would accept — and it is the command's own diff document.
    const parsed = JSON.parse(stdout)
    expect(parsed).toEqual({ matched: 3, unmatched: 0, deltas: [] })
    // No render/bootstrap diagnostics leaked onto stdout to corrupt the document.
    expect(stdout).not.toContain('dependencies optimized')
    expect(stdout).not.toContain('Re-optimizing dependencies')
    expect(stdout).not.toContain('Missing pages directory')
    // The chatter was diverted to stderr instead, not simply dropped.
    expect(err.join('')).toContain('Missing pages directory')
  })
})

// ── AC-658: render & bootstrap diagnostics are emitted on stderr, not stdout ──

describe('story-e15a19ef — render/bootstrap diagnostics land on stderr', () => {
  it('test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr', async () => {
    // The three diagnostic classes named in the AC — a dependency re-optimization
    // notice, a deprecation warning, and the one-time "Missing pages directory"
    // bootstrap warning — are written to stdout by Astro/Vite. withCleanStdout is
    // the same stdout→stderr alias the bin applies during server bootstrap; every
    // one of these must come out on stderr and be absent from stdout.
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
