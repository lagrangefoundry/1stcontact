import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BOOLEAN_FLAGS,
  chromiumAvailable,
  cmdCapturePage,
  cmdValuesDiffMultiViewport,
  diffMultiState,
  formatMultiViewportReport,
  parseArgs,
  readMultiState,
  withCleanStdout,
  runMultiStateCapture,
  type MultiStateCapture,
  type StateDiff,
  type ValueDelta,
  type ValuesDiffReport,
  type Viewport,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-58 (T2) — the multi-viewport values-diff.
 *
 * The gigabytealchemy re-import surfaced a delta class every gate is blind to: a
 * %-vs-fixed reflow. The wordmark tracks the hero text at the 1280 width every
 * gate checks, but drifts horizontally on a narrow phone. The matrix machinery
 * (runMultiStateCapture / diffMultiState / writeMultiState / readMultiState) was
 * built and unit-tested (REQ-48) but never wired into any command. T2 wires it:
 * capture persists the reference across the viewport ladder, and
 * `values-diff --multi-viewport` pairs the draft against it cell-for-cell.
 *
 * The real-browser tests drive a headless Chromium against committed fixtures over
 * a loopback server — no third-party site is contacted. The pure tests (the STALE
 * REFERENCE guard, the formatter) need no browser.
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/multi-viewport', import.meta.url))
const REST_FIXTURE = fileURLToPath(new URL('./fixtures/capture', import.meta.url))

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
}

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// ── pure: the STALE REFERENCE guard ──────────────────────────────────────────

describe('REQ-58 T2 — multi-viewport terminal-fails on a reference with no ladder', () => {
  it('test_UAT_FC_REQ-58_multiviewport_guard_stale_reference', async () => {
    // A bundle captured before T2 has capture.json but no multistate.json. The
    // multi-viewport diff cannot compare across widths, so it must halt with a
    // re-capture instruction — never silently pass a comparison it cannot make.
    const emptyBundle = mkdtempSync(path.join(tmpdir(), 'req58-nomulti-'))
    try {
      await expect(
        cmdValuesDiffMultiViewport({ slug: 'whatever', refBundleDir: emptyBundle }),
      ).rejects.toThrow(/multistate\.json/)
    } finally {
      rmSync(emptyBundle, { recursive: true, force: true })
    }
  })
})

// ── pure: --multi-viewport is a boolean flag, not a value-taking one ─────────

const CLI_SOURCES = ['../tools/generate/src/cli/index.ts'].map((rel) =>
  fileURLToPath(new URL(rel, import.meta.url)),
)

/**
 * Every flag name the CLI reads in a boolean context, derived from its source.
 *
 * A read is boolean if the name is compared to `true`, negated, coerced with
 * `Boolean(...)`, used as the whole condition of an `if`, or short-circuited /
 * used as a ternary condition. Reads that are `typeof`-guarded as strings or
 * handed to a parser (`parseSize(flags.size)`) are value-taking and excluded.
 */
function booleanFlagReadsInCliSource(): Set<string> {
  const names = new Set<string>()
  for (const file of CLI_SOURCES) {
    const src = readFileSync(file, 'utf8')
    const read = /flags(?:\.([A-Za-z][\w-]*)|\['([^']+)'\])/g
    for (let m = read.exec(src); m !== null; m = read.exec(src)) {
      const name = m[1] ?? m[2]
      const before = src.slice(0, m.index)
      const after = src.slice(m.index + m[0].length)
      const isBoolean =
        /^\s*(===|!==)\s*true\b/.test(after) || // flags.x === true
        (/\bif\s*\(\s*$/.test(before) && /^\s*\)/.test(after)) || // if (flags.x)
        /!\s*$/.test(before) || // !flags.x
        /\bBoolean\(\s*$/.test(before) || // Boolean(flags.x)
        /^\s*(&&|\|\|)/.test(after) || // flags.x && …
        /^\s*\?[^?]/.test(after) // flags.x ? … : …
      if (isBoolean) names.add(name)
    }
  }
  return names
}

describe('REQ-58 T2 — --multi-viewport does not swallow the slug positional', () => {
  it('test_UAT_FC_REQ-58_multiviewport_flag_is_boolean', () => {
    // `values-diff --multi-viewport <slug> --ref <dir>`: unless the parser knows
    // --multi-viewport is boolean it consumes <slug> as the flag's value, leaving
    // no positional and failing with "Missing required <slug>". The slug must
    // survive as a positional regardless of whether it precedes or follows the flag.
    const before = parseArgs(['values-diff', '--multi-viewport', 'gigabytealchemy', '--ref', 'bundle/dir'])
    expect(before.flags['multi-viewport']).toBe(true)
    expect(before.positionals).toEqual(['values-diff', 'gigabytealchemy'])
    expect(before.flags.ref).toBe('bundle/dir')

    const after = parseArgs(['values-diff', 'gigabytealchemy', '--ref', 'bundle/dir', '--multi-viewport'])
    expect(after.flags['multi-viewport']).toBe(true)
    expect(after.positionals).toEqual(['values-diff', 'gigabytealchemy'])
    expect(after.flags.ref).toBe('bundle/dir')
  })

  it('test_UAT_FC_REQ-58_boolean_flag_set_is_pinned_entire', () => {
    // The guarantee is CLI-wide, not `--multi-viewport`-shaped: it is implemented
    // once, as this allowlist, ahead of the command switch. Pinning the set entire
    // is what makes a boolean flag added to a verb without registering it here a
    // visible regression rather than a silent reopening of REQ-58's hole — the
    // same discipline REQ-44 applies to the gated command set.
    expect([...BOOLEAN_FLAGS].sort()).toEqual([
      'apply',
      'assign',
      'classify',
      'clusters',
      'collapse',
      'compare-years',
      'dry-run',
      'edit',
      'force',
      'json',
      'multi-viewport',
      'prune',
      'sandbox',
      'tolerant',
    ])
  })

  it('test_UAT_FC_REQ-58_boolean_flag_set_is_derived_from_the_cli_source', () => {
    // The literal above pins the registry to itself: it goes red when someone
    // edits the registry, and stays green in the failure mode that actually
    // happens — a boolean flag added to a verb and never registered. That is how
    // `--collapse`/`--clusters`/`--edit`/`--dry-run`/`--prune`/`--apply` drifted
    // six behind, and how `--assign` then survived a sweep that searched only for
    // `flags.x === true`. So the set is derived from the CLI source instead, over
    // *every* truthiness form, and asserted equal to the registry.
    const booleanReads = booleanFlagReadsInCliSource()
    expect([...booleanReads].sort()).toEqual([...BOOLEAN_FLAGS].sort())
  })

  it.each([...BOOLEAN_FLAGS])('test_UAT_FC_REQ-58_boolean_flag_never_swallows_the_slug — --%s', (flag) => {
    // Every command reached by these flags takes `slug = requireSlug(rest[0])`, so
    // a flag parsed as value-taking eats the slug and the command dies with the
    // exact `Missing required <slug>` signature REQ-58 fixed. Proved for each
    // member in both orders, so the guarantee holds for whichever verb was named.
    const before = parseArgs(['verb', `--${flag}`, 'gigabytealchemy', '--ref', 'bundle/dir'])
    expect(before.flags[flag]).toBe(true)
    expect(before.positionals).toEqual(['verb', 'gigabytealchemy'])
    expect(before.flags.ref).toBe('bundle/dir')

    const after = parseArgs(['verb', 'gigabytealchemy', '--ref', 'bundle/dir', `--${flag}`])
    expect(after.flags[flag]).toBe(true)
    expect(after.positionals).toEqual(['verb', 'gigabytealchemy'])
    expect(after.flags.ref).toBe('bundle/dir')
  })
})

// ── pure: --json stays a clean document even when render chatters ────────────

describe('REQ-58 T2 — withCleanStdout keeps render chatter off stdout', () => {
  it('test_UAT_FC_REQ-58_multiviewport_json_stdout_clean', async () => {
    // The Astro/Vite render writes diagnostics ("Re-optimizing dependencies",
    // "Missing pages directory") to stdout. In --json mode that corrupts the
    // single JSON document. withCleanStdout must divert those writes to stderr
    // for the duration of the compute, then restore stdout so the CLI's own
    // JSON print lands cleanly — and it must restore even if the body throws.
    const origOut = process.stdout.write.bind(process.stdout)
    const origErr = process.stderr.write.bind(process.stderr)
    const outSeen: string[] = []
    const errSeen: string[] = []
    process.stdout.write = ((c: unknown) => (outSeen.push(String(c)), true)) as typeof process.stdout.write
    process.stderr.write = ((c: unknown) => (errSeen.push(String(c)), true)) as typeof process.stderr.write
    try {
      const result = await withCleanStdout(async () => {
        process.stdout.write('[vite] Re-optimizing dependencies\n')
        process.stdout.write('[WARN] Missing pages directory: src/pages\n')
        return 42
      })
      // The wrapped body's return value passes straight through.
      expect(result).toBe(42)
      // Nothing the body wrote to stdout leaked to stdout…
      expect(outSeen.join('')).toBe('')
      // …it was diverted to stderr instead.
      expect(errSeen.join('')).toContain('Re-optimizing dependencies')
      expect(errSeen.join('')).toContain('Missing pages directory')
      // stdout is restored: a write after the helper lands on stdout again.
      process.stdout.write('{"clean":true}\n')
      expect(outSeen.join('')).toBe('{"clean":true}\n')
    } finally {
      process.stdout.write = origOut
      process.stderr.write = origErr
    }

    // The restore must survive a throwing body too.
    process.stdout.write = ((c: unknown) => (outSeen.push(String(c)), true)) as typeof process.stdout.write
    try {
      await expect(
        withCleanStdout(async () => {
          throw new Error('boom')
        }),
      ).rejects.toThrow('boom')
    } finally {
      process.stdout.write = origOut
    }
    // After a throw, stdout.write is the real one again (not still aliased to stderr).
    expect(process.stdout.write).toBe(origOut)
  })
})

// ── pure: the worst-cell-first formatter ─────────────────────────────────────

const delta = (over: Partial<ValueDelta> = {}): ValueDelta => ({
  text: 'ACME',
  role: 'body',
  property: 'position',
  expected: 'x=256',
  actual: 'x=75',
  kind: 'position',
  tier: 'HIGH',
  magnitude: 181,
  severity: 100,
  ...over,
})

const report = (deltas: ValueDelta[]): ValuesDiffReport => ({
  expectedSource: 'ref',
  actualSource: 'repro',
  matched: 1,
  unmatched: 0,
  deltas,
  suppressed: 0,
  objects: [],
  unpairedActual: [],
})

describe('REQ-58 T2 — formatMultiViewportReport renders worst cell first', () => {
  it('test_UAT_FC_REQ-58_multiviewport_formatter_missing_fail_clean', () => {
    // diffMultiState hands cells worst-first: a missing cell, then a failing cell,
    // then a clean cell. The formatter must render a missing cell loudly, a failing
    // cell with its top delta, and collapse a clean cell to a single ✓ line.
    const cells: StateDiff[] = [
      { engine: 'chromium', viewportWidth: 320, state: 'rest', report: null, missing: true },
      { engine: 'chromium', viewportWidth: 375, state: 'rest', report: report([delta()]), missing: false },
      { engine: 'chromium', viewportWidth: 1280, state: 'rest', report: report([]), missing: false },
    ]
    const out = formatMultiViewportReport(cells)
    // Header counts every delta and every missing cell.
    expect(out).toMatch(/1 delta\(s\), 1 missing cell\(s\)/)
    // The missing cell is loud, not silent.
    expect(out).toMatch(/@320 chromium:rest {2}MISSING/)
    // The failing cell names its worst delta reference→repro.
    expect(out).toMatch(/@375 chromium:rest {2}1 delta\(s\).*position "ACME"/)
    expect(out).toContain('x=256')
    expect(out).toContain('x=75')
    // The clean cell collapses to one ✓ line.
    expect(out).toMatch(/@1280 chromium:rest {2}clean/)
    // Order is preserved: 320 (missing) before 375 (fail) before 1280 (clean).
    expect(out.indexOf('@320')).toBeLessThan(out.indexOf('@375'))
    expect(out.indexOf('@375')).toBeLessThan(out.indexOf('@1280'))
  })
})

// ── real browser: capture persists the reference across the ladder ───────────

describe('REQ-58 T2 — capture persists a multi-viewport reference', () => {
  let server: { origin: string; close: () => Promise<void> }
  let cwd: string

  beforeAll(async () => {
    if (!browserOk) return
    server = await serveDir(REST_FIXTURE)
    cwd = mkdtempSync(path.join(tmpdir(), 'req58-cap-'))
  }, 120000)

  afterAll(async () => {
    await server?.close()
    if (cwd) rmSync(cwd, { recursive: true, force: true })
  })

  itB(
    'test_UAT_FC_REQ-58_multiviewport_capture_persists_ladder',
    async () => {
      const res = await cmdCapturePage(`${server.origin}/rich.html`, { cwd })
      // multistate.json is written into the bundle and read back with the ladder.
      expect(existsSync(path.join(res.bundleDir, 'multistate.json'))).toBe(true)
      const persisted = readMultiState(res.bundleDir) as MultiStateCapture
      const widths = new Set(persisted.projections.map((p) => p.viewport.width))
      // The reference spans several widths — not a single desktop shot.
      expect(widths.size).toBeGreaterThanOrEqual(2)
      // The return value carries the same matrix that was persisted.
      expect(res.multiState.projections.length).toBe(persisted.projections.length)
      // Sanity: the bundle still has its single-viewport artifacts too.
      expect(readdirSync(res.bundleDir)).toContain('capture.json')
    },
    120000,
  )
})

// ── real browser: the drift the single-width diff misses is now caught ───────

describe('REQ-58 T2 — the multi-viewport diff catches a wordmark %-drift', () => {
  let server: { origin: string; close: () => Promise<void> }

  beforeAll(async () => {
    if (!browserOk) return
    server = await serveDir(FIXTURES)
  }, 60000)

  afterAll(async () => {
    await server?.close()
  })

  const LADDER: Viewport[] = [
    { width: 375, height: 800 },
    { width: 1280, height: 800 },
  ]

  itB(
    'test_UAT_FC_REQ-58_multiviewport_catches_wordmark_drift',
    async () => {
      // The wordmark is fixed at 256px in the reference and 20% (= 256px at 1280,
      // 75px at 375) in the repro: identical at desktop, drifted at mobile.
      const reference = await runMultiStateCapture(`${server.origin}/reference.html`, {
        viewports: LADDER,
        states: ['rest'],
      })
      const repro = await runMultiStateCapture(`${server.origin}/repro.html`, {
        viewports: LADDER,
        states: ['rest'],
      })
      const cells = diffMultiState(reference, repro)

      const mobile = cells.find((c) => c.viewportWidth === 375)!
      const desktop = cells.find((c) => c.viewportWidth === 1280)!
      // Desktop reads clean — the single-width gate would stop here and pass.
      expect(desktop.report!.deltas.some((d) => d.kind === 'position')).toBe(false)
      // Mobile surfaces the reflow the single-width gate is blind to.
      expect(mobile.report!.deltas.some((d) => d.kind === 'position')).toBe(true)
      // The worst cell (mobile) sorts first.
      expect(cells[0].viewportWidth).toBe(375)
    },
    120000,
  )
})
