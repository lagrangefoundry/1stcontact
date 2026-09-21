import { spawnSync } from 'node:child_process'
import { closeSync, cpSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { L1_CORPUS_SITES } from './fixtures/l1-corpus/corpus'

/**
 * BUG-101 — a `--json` document survives a pipe.
 *
 * The launcher used to end with `process.exit(exitCode)`, which ends the process
 * with queued writes still queued. stdout is asynchronous when it is a pipe, so
 * every consumer that spawned `1c` with `stdio: 'pipe'` received at most one
 * pipe buffer — 65536 bytes on macOS — of any document larger than that, with no
 * error and exit code 0. The reproduction console writes a step's stdout
 * straight to disk, so a round's copy of the L1 page was a byte-identical prefix
 * of the real document that `json.load` could not parse, and the digest built on
 * it reported a hero image as unreferenced and the page as having no `kind`
 * fields. Both statements were false.
 *
 * EVERY CLAIM HERE DRIVES THE REAL BINARY AS A SUBPROCESS. The launcher is an
 * entry point: it configures a Vite server, loads the CLI through
 * `ssrLoadModule` and exits, and none of that is observable in-process. The
 * truncation in particular is a property of how the child ends relative to its
 * own pending writes, so it only exists across a process boundary.
 *
 * WHY `gigabytealchemy/home` IS THE FIXTURE. The bug was found on the
 * `repro-gigabytealchemy-ai` sandbox site, which no checkout has until something
 * captures it. The L1 conformance corpus carries
 * `gigabytealchemy/draft/pages/home.json` and is committed, so this needs no
 * capture and no browser — and its `--json` document is comfortably past one
 * pipe buffer, which is the only property the bug cares about.
 *
 * THE CORPUS IS COPIED INTO A SANDBOX TREE FIRST (REQ-290). This suite drives the
 * real binary, and the CLI now resolves the `sandbox` root for every command, so
 * `<cwd>/storage/sandbox/<slug>` is the only place it looks. Copying is also the
 * honest shape for a corpus its README calls read-only: `page get` does not write,
 * but nothing about running a CLI at a fixture directory would stop the next
 * command from doing so.
 */

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const LAUNCHER = path.join(repoRoot, 'tools', 'generate', 'bin', '1c.mjs')

/**
 * One OS pipe buffer on macOS, and the exact length every truncated document
 * came back as.
 *
 * Asserted against as a FLOOR rather than quoted in prose. A fixture that shrank
 * below this would make the whole file pass without ever exercising the bug —
 * the test would still be green and would no longer be evidence of anything. A
 * failure here means "pick a bigger page", which is a legible instruction; a
 * silent pass means nothing at all.
 */
const PIPE_BUFFER_BYTES = 65536

const SLUG = 'gigabytealchemy'
const ARGV = ['page', 'get', SLUG, 'home', '--json']

/** The document as it arrives through a pipe — the path the bug was on. */
let piped: Buffer
/** The same invocation's stdout written straight to a file descriptor. */
let redirected: Buffer
/** What the piped run exited with, and whether it got there on its own. */
let pipedRun: { status: number | null; signal: NodeJS.Signals | null }

let workDir: string

beforeAll(() => {
  workDir = mkdtempSync(path.join(tmpdir(), 'bug101-'))

  // The site the CLI is pointed at, in the tree the CLI reads.
  const sandbox = path.join(workDir, 'storage', 'sandbox')
  mkdirSync(sandbox, { recursive: true })
  cpSync(path.join(L1_CORPUS_SITES, SLUG), path.join(sandbox, SLUG), { recursive: true })

  // stdio 'pipe' with no encoding, so stdout comes back as a Buffer and the
  // byte count is the real one rather than a decoded-string approximation.
  // A timeout, so that the "it ends by itself" claim below can distinguish a
  // process that exited from one that had to be killed: letting the process end
  // naturally is only correct if it does end.
  const pipedResult = spawnSync('node', [LAUNCHER, ...ARGV], {
    cwd: workDir,
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120_000,
  })
  piped = pipedResult.stdout
  pipedRun = { status: pipedResult.status, signal: pipedResult.signal }

  // The same command with stdout pointed at a file descriptor, which is
  // synchronous and therefore never lost anything even before the fix. This is
  // the control: it is what the document is supposed to be.
  const outPath = path.join(workDir, 'page.json')
  const fd = openSync(outPath, 'w')
  try {
    spawnSync('node', [LAUNCHER, ...ARGV], {
      cwd: workDir,
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

describe('BUG-101 — the launcher lets its output drain before the process ends', () => {
  it('test_UAT_FC_BUG-101_a_piped_json_document_arrives_whole', () => {
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

  it('test_UAT_FC_BUG-101_the_piped_document_parses_as_the_l1_page', () => {
    // What every consumer actually does with the bytes, and what failed before:
    // `JSONDecodeError: Unterminated string`. Asserting on the document's own
    // structure rather than on its length — a prefix of this document parses as
    // nothing at all.
    const parsed = JSON.parse(piped.toString('utf8')) as {
      ok?: boolean
      data?: { page?: { blocks?: unknown } }
    }
    expect(parsed.ok).toBe(true)
    expect(parsed.data?.page).toBeTruthy()

    // The digest's second false statement was "no `kind` fields — check the
    // document really is the L1 page." They are there, and they are only
    // countable if the whole document arrived: the truncated prefix stopped
    // mid-string and parsed to nothing.
    const kinds = piped.toString('utf8').match(/"kind"/g) ?? []
    expect(kinds.length).toBeGreaterThan(1)
  })

  it('test_UAT_FC_BUG-101_the_process_ends_on_its_own', () => {
    // Removing the forced exit trades a silent truncation for a possible hang,
    // so "it still terminates" is a claim this fix has to carry its own evidence
    // for. A process killed on the timeout comes back with a signal and a null
    // status; one that ended by itself comes back with neither.
    expect(pipedRun.signal).toBeNull()
    expect(pipedRun.status).toBe(0)
  })

  it('test_UAT_FC_BUG-101_the_exit_status_is_still_the_commands', () => {
    // The status used to be delivered by the `process.exit` argument and is now
    // delivered by the exit code node derives from `process.exitCode`. Both ends
    // of the range, so a change that hard-wired one of them would fail.
    const ok = spawnSync('node', [LAUNCHER, 'list'], {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 120_000,
    })
    expect(ok.signal).toBeNull()
    expect(ok.status).toBe(0)

    const refused = spawnSync('node', [LAUNCHER, 'no-such-verb'], {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 120_000,
    })
    expect(refused.signal).toBeNull()
    expect(refused.status).toBe(1)
  })

  it('test_UAT_FC_BUG-101_the_launcher_never_forces_an_exit', () => {
    // Comments stripped before the absence is asserted: the line's replacement
    // explains at length what it no longer does, and naming `process.exit` in
    // that explanation is the point of writing it. Only an executable line can
    // put the truncation back. (`test_UAT_FC_REQ-150_plain_vite_bootstrap`
    // strips comments for the same reason.)
    const executableLines = readFileSync(LAUNCHER, 'utf8')
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      .join('\n')

    expect(executableLines).not.toMatch(/process\.exit\s*\(/)
    expect(executableLines).toMatch(/process\.exitCode\s*=\s*exitCode/)
  })
})
