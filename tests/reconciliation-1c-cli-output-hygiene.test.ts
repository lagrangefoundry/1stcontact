import { afterEach, describe, expect, it } from 'vitest'
import { createServer } from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  parseArgs,
  run,
  withCleanStdout,
  writeMultiState,
  VIEWPORTS,
  type Capture,
  type ContentRun,
  type MultiStateCapture,
  type Section,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'
import { cmdNew } from '../tools/generate/src/cli/commands'

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
 * AC-657's subject is a COMMAND ("when a `values-diff` command … is run with
 * `--json`"), so its evidence runs the command: both its tests go through the real
 * `run(argv)` dispatcher over real on-disk bundles and read the stdout bytes an
 * operator's `| jq` would read. AC-658 and AC-659 are about `withCleanStdout`
 * itself — the helper's contract IS their subject — so those stay at the helper.
 */

// ── shared temp-dir plumbing ─────────────────────────────────────────────────

const tmpDirs: string[] = []
function tmp(prefix = 'hygiene-'): string {
  const d = mkdtempSync(path.join(tmpdir(), prefix))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

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

/** What a run of the real CLI produced, on the channels the operator sees. */
interface CliRun {
  /** `process.exitCode` the command left behind. */
  code: number
  /** Every byte the command put on stdout, in order. */
  out: string
  /** Every byte that reached stderr. */
  err: string
  /**
   * The stdout seam's own timeline: `divert` when the command aliases stdout away,
   * `restore` when it puts it back, `stdout` for each write that landed on stdout.
   */
  events: Array<'divert' | 'restore' | 'stdout'>
}

/**
 * Run the real `1c` dispatcher and capture stdout as the BYTE STREAM — the channel
 * `withCleanStdout` protects and the channel a downstream `| jq` reads.
 *
 * Two harness facts, both restoring what the real binary has and vitest replaces:
 *  - stdout/stderr are captured at `process.stdout.write` / `process.stderr.write`,
 *    not through vitest's console capture, so a write the command makes directly
 *    (as the in-process Astro/Vite render does) is measured on the same stream as
 *    the command's own output.
 *  - `console.log`/`console.error` are re-pointed at those streams, which is how
 *    node wires the global console for the real binary; vitest swaps in its own
 *    Console that never reaches `process.stdout`.
 *
 * `chatter` is written through whatever `process.stdout.write` the command has
 * installed AT THE MOMENT it diverts stdout — i.e. inside the compute window the
 * render occupies — so the diversion is proved by where those bytes come out
 * rather than asserted about.
 */
async function runCliRaw(argv: string[], opts: { chatter?: string[] } = {}): Promise<CliRun> {
  const out: string[] = []
  const err: string[] = []
  const events: CliRun['events'] = []

  const outDesc = Object.getOwnPropertyDescriptor(process.stdout, 'write')
  const errDesc = Object.getOwnPropertyDescriptor(process.stderr, 'write')
  const stdoutSink = ((chunk: unknown) => (out.push(String(chunk)), events.push('stdout'), true)) as
    typeof process.stdout.write
  let current: typeof process.stdout.write = stdoutSink
  let installs = 0

  // An accessor on `process.stdout.write` observes the seam itself: withCleanStdout
  // sets the alias, then sets the original back. Nothing here changes the command's
  // behaviour — the alias it installs is the one every stdout write goes through.
  Object.defineProperty(process.stdout, 'write', {
    configurable: true,
    get: () => current,
    set: (fn: typeof process.stdout.write) => {
      current = fn
      installs += 1
      if (installs % 2 === 1) {
        events.push('divert')
        for (const line of opts.chatter ?? []) current(line)
      } else {
        events.push('restore')
      }
    },
  })
  process.stderr.write = ((chunk: unknown) => (err.push(String(chunk)), true)) as typeof process.stderr.write

  const log = console.log
  const error = console.error
  console.log = (...a: unknown[]) => void process.stdout.write(a.map(String).join(' ') + '\n')
  console.error = (...a: unknown[]) => void process.stderr.write(a.map(String).join(' ') + '\n')

  const prev = process.exitCode
  process.exitCode = 0
  try {
    await run(argv)
    const code = typeof process.exitCode === 'number' ? process.exitCode : 0
    return { code, out: out.join(''), err: err.join(''), events }
  } finally {
    console.log = log
    console.error = error
    if (outDesc) Object.defineProperty(process.stdout, 'write', outDesc)
    else delete (process.stdout as unknown as { write?: unknown }).write
    if (errDesc) Object.defineProperty(process.stderr, 'write', errDesc)
    else delete (process.stderr as unknown as { write?: unknown }).write
    process.exitCode = prev
  }
}

/** The diagnostics the in-process Astro/Vite render writes to stdout mid-compute. */
const RENDER_CHATTER = [
  '\n  [vite] ✨ new dependencies optimized: sharp\n',
  '[vite] Re-optimizing dependencies because lockfile changed\n',
  '[WARN] Missing pages directory: src/pages\n',
]

/** A single-section reference capture bundle carrying `content`. */
function writeRefBundle(content: ContentRun[]): string {
  const dir = tmp('hygiene-ref-')
  const section: Section = {
    box: { x: 0, y: 0, width: 1280, height: 800 },
    screenshot: { x: 0, y: 0, width: 1280, height: 800 },
    background: { kind: 'color', color: '#ffffff' },
    layout: {
      textOverImage: false,
      contentAlign: 'left',
      arrangement: 'stack',
      columns: 1,
      contentMaxWidthPx: null,
      contentAnchorRatio: null,
    },
    content,
    items: [],
    fields: [],
  }
  const capture: Capture = {
    url: 'https://ref.example/',
    host: 'ref.example',
    path: '/',
    capturedAt: '2026-08-19T00:00:00.000Z',
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null, subScales: {} },
    sections: [section],
    assets: [],
  }
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
  return dir
}

function writeActualManifest(elements: ValueElement[]): string {
  const p = path.join(tmp('hygiene-actual-'), 'actual.json')
  writeFileSync(p, JSON.stringify({ source: 'draft:hygiene', elements, sections: [] } satisfies ValueManifest, null, 2))
  return p
}

/**
 * Can this runner bind the local listener the command's own serve step needs?
 *
 * `values-diff --multi-viewport` renders the draft and serves it over a loopback
 * port before projecting it across the ladder, so on a runner whose sandbox denies
 * `listen` (EPERM) the command cannot run at all. Probed the same way
 * `chromiumAvailable()` is: ask the environment, and gate honestly on the answer.
 */
async function canServeLocally(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const probe = createServer()
    probe.once('error', () => resolve(false))
    probe.listen(0, () => probe.close(() => resolve(true)))
  })
}
const serveOk = await canServeLocally()
const itServe = it.runIf(serveOk)

const HEADLINE = 'Stay in the loop.'
const refRun: ContentRun = {
  role: 'heading',
  text: HEADLINE,
  color: '#101820',
  fontFamily: 'Inter',
  fontSizePx: 40,
  fontWeight: 700,
}

describe('story-e15a19ef — values-diff --json stdout is exactly one clean JSON document', () => {
  it('test_UAT_AC657_json_is_exactly_one_parseable_document', async () => {
    // A real reference bundle and a real actual manifest, differing on one axis so
    // the command has a non-trivial document to emit. The command is then run
    // exactly as an operator would run it, and stdout is read as bytes.
    const ref = writeRefBundle([refRun])
    const actual = writeActualManifest([{ ...refRun, color: '#c026d3' }])
    const out = path.join(tmp('hygiene-out-'), 'report.json')

    const res = await runCliRaw(['values-diff', '--ref', ref, '--actual', actual, '--out', out, '--json'], {
      chatter: RENDER_CHATTER,
    })

    // stdout parses — in its ENTIRETY — as exactly one JSON document. Any leading,
    // interleaved or trailing diagnostic byte makes this throw, which is precisely
    // what a downstream `| jq` would do.
    const doc = JSON.parse(res.out) as { expectedSource: string; deltas: Array<{ text: string; property: string }> }
    expect(res.out.trim().startsWith('{')).toBe(true)
    expect(res.out.trim().endsWith('}')).toBe(true)

    // …and it is the COMMAND's own diff document, not something the test composed:
    // it is byte-identical to the report the same run wrote through `--out`, a file
    // the test never touched.
    expect(doc).toEqual(JSON.parse(readFileSync(out, 'utf8')))
    expect(doc.expectedSource).toBe('ref.example/')
    expect(doc.deltas.some((d) => d.text === HEADLINE && d.property === 'color')).toBe(true)
    // A non-empty diff is a fidelity failure the operator must clear.
    expect(res.code).toBe(1)

    // No render/bootstrap diagnostic reached stdout …
    for (const diag of ['dependencies optimized', 'Re-optimizing dependencies', 'Missing pages directory']) {
      expect(res.out, diag).not.toContain(diag)
      // … each was diverted to stderr instead of dropped.
      expect(res.err, diag).toContain(diag)
    }

    // The composition, read off the seam's own timeline: the command diverted
    // stdout for its compute, wrote nothing to stdout while diverted, restored it,
    // and only then emitted the document. Drop either half and this goes red.
    expect(res.events).toContain('divert')
    const divert = res.events.indexOf('divert')
    const restore = res.events.indexOf('restore')
    expect(restore).toBeGreaterThan(divert)
    expect(res.events.slice(divert, restore)).not.toContain('stdout')
    expect(res.events.lastIndexOf('stdout')).toBeGreaterThan(restore)
  })

  itServe(
    'test_UAT_AC657_multi_viewport_json_is_exactly_one_parseable_document',
    async () => {
      // The Criterion names `--multi-viewport` explicitly, and it is a separate
      // emission path (`selectMultiViewportPayload` over the cell matrix, printed
      // from its own call site). It is exercised end-to-end here: a real starter
      // site is rendered and served by the command itself, and paired against a
      // real one-rung reference ladder on disk.
      //
      // **Evidence gating.** The command serves the rendered draft over loopback,
      // so this runs only where the runner may bind a port; the single-width test
      // above carries the Criterion ungated on every runner.
      const home = tmp('hygiene-home-')
      cmdNew('hygiene', { cwd: home })

      const ref = path.join(home, 'bundle')
      mkdirSync(ref, { recursive: true })
      const projection: StateProjection = {
        engine: 'chromium',
        viewport: VIEWPORTS.desktop,
        state: 'rest',
        manifest: {
          source: `ref@chromium:${VIEWPORTS.desktop.width}:rest`,
          elements: [
            {
              role: 'heading',
              text: HEADLINE,
              color: '#101820',
              fontFamily: 'Inter',
              fontSizePx: 40,
              fontWeight: 700,
            },
          ],
          sections: [],
          viewport: VIEWPORTS.desktop,
        },
      }
      writeMultiState(ref, { url: 'https://ref.example/', projections: [projection], notes: [] } satisfies MultiStateCapture)

      // The command resolves its site store from the working directory, so run it
      // from the temp home the site was created in (restored immediately after).
      const prevCwd = process.cwd()
      process.chdir(home)
      let res: CliRun
      try {
        res = await runCliRaw(['values-diff', 'hygiene', '--multi-viewport', '--ref', ref, '--json'], {
          chatter: RENDER_CHATTER,
        })
      } finally {
        process.chdir(prevCwd)
      }

      // One document again — the cell matrix this time — and nothing else on stdout.
      const cells = JSON.parse(res.out) as Array<{ viewportWidth: number; engine: string; state: string }>
      expect(Array.isArray(cells)).toBe(true)
      expect(cells.length).toBeGreaterThan(0)
      // It is the command's own matrix: one cell per width the reference ladder carries.
      expect(cells.map((c) => c.viewportWidth)).toEqual([VIEWPORTS.desktop.width])
      expect(cells[0].state).toBe('rest')

      for (const diag of ['dependencies optimized', 'Re-optimizing dependencies', 'Missing pages directory']) {
        expect(res.out, diag).not.toContain(diag)
        expect(res.err, diag).toContain(diag)
      }
      // Same composition on this path: divert → compute (silent on stdout) →
      // restore → the single document.
      const divert = res.events.indexOf('divert')
      const restore = res.events.indexOf('restore')
      expect(divert).toBeGreaterThanOrEqual(0)
      expect(restore).toBeGreaterThan(divert)
      expect(res.events.slice(divert, restore)).not.toContain('stdout')
      expect(res.events.lastIndexOf('stdout')).toBeGreaterThan(restore)
    },
    180_000,
  )
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
    let report: { matched: number } | null = null
    try {
      report = await withCleanStdout(async () => {
        process.stdout.write('[vite] Re-optimizing dependencies because lockfile changed\n')
        process.stdout.write('The `compilerOptions` option is deprecated and will be removed\n')
        process.stdout.write('[WARN] Missing pages directory: src/pages\n')
        return { matched: 3 }
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
    // The wrapped compute's return value passes through untouched — the diversion
    // is a stream concern, never a filter on what the command computed.
    expect(report).toEqual({ matched: 3 })
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
