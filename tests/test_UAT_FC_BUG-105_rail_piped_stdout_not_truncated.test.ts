import { spawnSync } from 'node:child_process'
import { closeSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { recordRail, runRail } from '../tools/repro-console/src/rail'
import { VITEST_RECHECK_FILE, VITEST_REPORT_FILE } from '../tools/repro-console/src/rail'
import type { CommandResult, CommandRunner } from '../tools/repro-console/src/run'

/**
 * BUG-105 — `repro-rail`'s report survives a pipe.
 *
 * `tools/repro-console/bin/boot.mjs` is the launcher both dev tools in that
 * package are loaded through, and it ended its `keepAlive: false` path — the
 * rail's path — with `process.exit(process.exitCode ?? 0)`. That ends the
 * process with queued writes still queued. stdout is asynchronous when it is a
 * PIPE, so any document longer than the OS pipe buffer (65536 bytes on macOS)
 * reached its consumer cut to exactly that length, with no error and exit code
 * 0. `repro-rail --json` prints its entire report through that line, and the
 * reproduction console spawns the rail with `stdio: 'pipe'`. Redirecting to a
 * file hid the whole thing, because a file descriptor is synchronous.
 *
 * This is the same defect BUG-101 fixed in `tools/generate/bin/1c.mjs`. The two
 * launchers are deliberately not shared — `boot.mjs`'s own header explains that
 * reaching into `tools/generate` for a bootstrap is the import direction
 * EPIC-12 §8.6 forbids — so it is a second fix, and it carries its own
 * evidence.
 *
 * THE FILE MAKES TWO SEPARATE CLAIMS, because the fix rests on two facts and
 * only one of them is about the launcher:
 *
 *  1. The launcher carries a document past one pipe buffer, ends on its own and
 *     still delivers the command's exit status. Driven as a real subprocess:
 *     the truncation is a property of how a process ends relative to its own
 *     pending writes and does not exist in-process.
 *  2. The rail's own report can exceed a pipe buffer — so claim 1 is about this
 *     tool and not a hypothetical one. Driven through the real `runRail`.
 */

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

/**
 * One OS pipe buffer on macOS, and the exact length every truncated document
 * came back as.
 *
 * Asserted as a FLOOR rather than quoted in prose, for the reason BUG-101's
 * suite gives: a fixture that shrank below this would make the whole file pass
 * without ever exercising the bug. A failure here says "make the document
 * bigger", which is legible; a silent pass says nothing at all.
 */
const PIPE_BUFFER_BYTES = 65536

// ── claim 1: the launcher ────────────────────────────────────────────────────

/**
 * `repro-rail.mjs` with the rail swapped for a fixture entry.
 *
 * The launcher, its Vite server, its `ssrLoadModule` call and its exit are the
 * real ones; only what `main` prints is the fixture's. Running the real rail
 * here would mean a whole-suite vitest pass, two `pnpm -r` builds, a browser
 * and reference bundles that are gitignored — minutes of wall clock, none of it
 * the behaviour under test, and all of it absent from a fresh checkout.
 */
const BOOT_FIXTURE = path.join(repoRoot, 'tests', 'fixtures', 'bug105', 'boot-fixture.mjs')

/** Comfortably past one pipe buffer, and nowhere near a memory concern. */
const DOCUMENT_BYTES = 200_000

/** The document as it arrives through a pipe — the path the bug was on. */
let piped: Buffer
/** The same invocation's stdout written straight to a file descriptor. */
let redirected: Buffer
/** What the piped run exited with, and whether it got there on its own. */
let pipedRun: { status: number | null; signal: NodeJS.Signals | null }

let workDir: string

beforeAll(() => {
  workDir = mkdtempSync(path.join(tmpdir(), 'bug105-'))

  // stdio 'pipe' with no encoding, so stdout comes back as a Buffer and the
  // byte count is the real one rather than a decoded-string approximation. A
  // timeout, so the "it ends by itself" claim below can tell a process that
  // exited from one that had to be killed: removing a forced exit is only
  // correct if the process does still end.
  const pipedResult = spawnSync('node', [BOOT_FIXTURE, String(DOCUMENT_BYTES), '0'], {
    cwd: repoRoot,
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120_000,
  })
  piped = pipedResult.stdout
  pipedRun = { status: pipedResult.status, signal: pipedResult.signal }

  // The same invocation with stdout pointed at a file descriptor, which is
  // synchronous and therefore never lost anything even before the fix. This is
  // the control: it is what the document is supposed to be.
  const outPath = path.join(workDir, 'document.json')
  const fd = openSync(outPath, 'w')
  try {
    spawnSync('node', [BOOT_FIXTURE, String(DOCUMENT_BYTES), '0'], {
      cwd: repoRoot,
      stdio: ['ignore', fd, 'pipe'],
      timeout: 120_000,
    })
  } finally {
    closeSync(fd)
  }
  redirected = readFileSync(outPath)
}, 300_000)

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true })
})

describe('BUG-105 — the rail launcher lets its output drain before the process ends', () => {
  it('test_UAT_FC_BUG-105_a_piped_document_arrives_whole', () => {
    // The floor first: without this the rest of the file could pass on a
    // document that never needed more than one pipe buffer.
    expect(redirected.byteLength).toBeGreaterThan(PIPE_BUFFER_BYTES)

    // The bug, stated as the number it always produced.
    expect(piped.byteLength).not.toBe(PIPE_BUFFER_BYTES)

    // The strong observation: the pipe and the file descriptor carry the same
    // bytes. Not "long enough" or "parses" — identical. A partial flush that
    // happened to land on a syntactically complete document would still fail
    // here, and that is the point.
    expect(piped.byteLength).toBe(redirected.byteLength)
    expect(piped.equals(redirected)).toBe(true)
  })

  it('test_UAT_FC_BUG-105_the_piped_document_still_parses', () => {
    // What a consumer does with the bytes. The fixture prints a padded array
    // rather than one long string precisely so that a truncated copy would be a
    // plausible-looking prefix, as the rail's own report is — a test that could
    // only fail on unparseable garbage would not be testing this bug.
    const parsed = JSON.parse(piped.toString('utf8')) as { lines?: string[] }
    expect(Array.isArray(parsed.lines)).toBe(true)
    expect(parsed.lines!.length).toBeGreaterThan(1)
  })

  it('test_UAT_FC_BUG-105_the_process_ends_on_its_own', () => {
    // Removing the forced exit trades a silent truncation for a possible hang,
    // so "it still terminates" is a claim this fix has to carry evidence for.
    // The rail spawns `1c`, `pnpm` and `vitest` children, which is why BUG-101
    // would not make this change blind. A process killed on the timeout comes
    // back with a signal and a null status; one that ended by itself comes back
    // with neither.
    expect(pipedRun.signal).toBeNull()
    expect(pipedRun.status).toBe(0)
  })

  it('test_UAT_FC_BUG-105_the_exit_status_is_still_the_commands', () => {
    // The status used to be delivered by the `process.exit` argument and is now
    // delivered by the exit code node derives from `process.exitCode`. 2 is not
    // a decoration: the rail exits 2 for "nothing regressed but the run covered
    // less than the whole rail", so a change that collapsed the status to a
    // boolean would turn a partial pass into a pass.
    for (const expected of [0, 1, 2]) {
      const run = spawnSync('node', [BOOT_FIXTURE, '16', String(expected)], {
        cwd: repoRoot,
        encoding: 'utf8',
        timeout: 120_000,
      })
      expect(run.signal).toBeNull()
      expect(run.status).toBe(expected)
    }
  })

  it('test_UAT_FC_BUG-105_a_failed_boot_still_reports_and_still_ends', () => {
    // The other exit in the launcher: an entry module that throws. It printed
    // its reason and then called `process.exit(1)`, with the same defect on
    // stderr. The reason must still arrive and the status must still be 1.
    const run = spawnSync('node', [BOOT_FIXTURE, 'not-a-number', '0'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, BUG105_THROW: 'the entry module refused' },
      timeout: 120_000,
    })
    expect(run.signal).toBeNull()
    expect(run.status).toBe(1)
    expect(run.stderr).toContain('the entry module refused')
  })

  it('test_UAT_FC_BUG-105_the_launcher_never_forces_an_exit', () => {
    // Comments stripped before the absence is asserted: the replacement
    // explains at length what it no longer does, and naming `process.exit` in
    // that explanation is the point of writing it. Only an executable line can
    // put the truncation back.
    const launcher = path.join(repoRoot, 'tools', 'repro-console', 'bin', 'boot.mjs')
    const executableLines = readFileSync(launcher, 'utf8')
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      .join('\n')

    expect(executableLines).not.toMatch(/process\.exit\s*\(/)
    expect(executableLines).toMatch(/process\.exitCode\s*=/)

    // And that the rail really is on the path that was fixed — the console's
    // `keepAlive: true` path never reaches the exit at all, so a rail that had
    // quietly moved to it would make every claim above true and irrelevant.
    const rail = readFileSync(path.join(repoRoot, 'tools', 'repro-console', 'bin', 'repro-rail.mjs'), 'utf8')
    expect(rail).toMatch(/keepAlive:\s*false/)
  })
})

// ── claim 2: the report really can be that big ───────────────────────────────

/**
 * A temporary repo with no references and a package version, which is all the
 * tests phase reads off disk.
 */
function fakeRepo(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'bug105-rail-'))
  scratch.push(cwd)
  writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ version: '9.9.9' }))
  return cwd
}

const scratch: string[] = []

/**
 * Every test file this repo actually has.
 *
 * Real names, because the report's size is the sum of its lines and a line is
 * mostly a path. A synthetic `file-0001.test.ts` would answer a question about
 * a repo that does not exist.
 */
function realTestFiles(): string[] {
  return readdirSync(path.join(repoRoot, 'tests'))
    .filter((name) => name.endsWith('.test.ts'))
    .map((name) => path.join('tests', name))
    .sort()
}

/**
 * The command seam the rail's own production runner plugs into, substituted for
 * the one thing a test cannot have: a real whole-suite vitest run. Everything
 * that turns a vitest report into a rail report — the phase, the comparison
 * against the bar, the report document — is the real code.
 */
function vitestRunner(files: string[], failing: string[]): CommandRunner {
  const failingSet = new Set(failing)
  return async (_cmd, args, cwd): Promise<CommandResult> => {
    const outFile = args.includes('--outputFile') ? args[args.indexOf('--outputFile') + 1] : VITEST_REPORT_FILE
    // A re-check run covers only the files named on its argv.
    const patterns = args.slice(args.indexOf('run') + 1).filter((a) => !a.startsWith('--') && a !== outFile)
    const ran = outFile === VITEST_RECHECK_FILE ? files.filter((f) => patterns.includes(f)) : files
    mkdirSync(path.dirname(path.join(cwd, outFile)), { recursive: true })
    writeFileSync(
      path.join(cwd, outFile),
      JSON.stringify({
        success: failing.length === 0,
        testResults: ran.map((name) => ({ name: path.join(cwd, name), status: failingSet.has(name) ? 'failed' : 'passed' })),
      }),
    )
    return { code: failing.length === 0 ? 0 : 1, stdout: '', stderr: '' }
  }
}

describe('BUG-105 — the rail report is a document that can cross a pipe buffer', () => {
  afterAll(() => {
    while (scratch.length) rmSync(scratch.pop()!, { recursive: true, force: true })
  })

  it('test_UAT_FC_BUG-105_a_suite_wide_regression_makes_the_report_exceed_a_pipe_buffer', async () => {
    // WHY THIS CLAIM IS HERE. BUG-101 recorded the rail's report as "under 64
    // KiB today", which was an inference from its shape rather than a
    // measurement, and left this launcher alone on the strength of it. The
    // report is not fixed-size: the tests phase prints one line per file that
    // is failing and was not on the recorded bar, so its length is bounded by
    // the size of the suite and not by the number of references on the rail.
    //
    // The scenario is the ordinary one this rail exists for: a bar recorded
    // with the suite green, then an engine change that breaks it. Both halves
    // run through the real `recordRail`/`runRail` and a real baseline file
    // written and read back.
    const files = realTestFiles()
    expect(files.length).toBeGreaterThan(100)

    const cwd = fakeRepo()
    await recordRail({ cwd, only: ['tests'], runCommand: vitestRunner(files, []) })
    const report = await runRail({ cwd, only: ['tests'], runCommand: vitestRunner(files, files) })

    const tests = report.phases.find((p) => p.name === 'tests')!
    expect(tests.failures.length).toBe(files.length)

    // The measurement, on the exact bytes `repro-rail --json` prints.
    const document = JSON.stringify(report, null, 2)
    expect(Buffer.byteLength(document)).toBeGreaterThan(PIPE_BUFFER_BYTES)
  })
})
