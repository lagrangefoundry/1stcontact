/**
 * Running a child process, and reading what it said (REQ-254, REQ-255).
 *
 * WHY THIS IS ITS OWN MODULE. Both dev tools in this package drive the repo by
 * spawning: the console runs one `1c` per reproduction step, and the regression
 * rail runs `1c`, `pnpm` and `vitest`. They need the same three things — spawn
 * and collect, quote the last informative lines of a failure, and read a JSON
 * document out of a command's stdout — and a second copy of any of them would
 * drift. The console's `iteration.ts` owned the first two before the rail
 * existed; they moved here rather than being restated.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** What a finished child process left behind. */
export interface CommandResult {
  code: number | null
  stdout: string
  stderr: string
}

/** Runs one command and resolves with what it said. Injectable for tests. */
export type CommandRunner = (cmd: string, args: string[], cwd: string) => Promise<CommandResult>

/** The real runner: spawn, collect both streams, resolve on close. */
export const spawnCommand: CommandRunner = (cmd, args, cwd) =>
  new Promise<CommandResult>((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()))
    // A command that cannot be spawned AT ALL resolves as a failure rather
    // than rejecting. "the rail is not installed" and "the rail said no" are
    // both answers, and only one of them is an exception — a caller reading
    // `code` gets the same shape either way (REQ-256).
    child.on('error', (err: Error) => resolve({ code: null, stdout, stderr: `${stderr}${err.message}` }))
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })

/**
 * Where `1c`'s launcher sits, resolved from THIS MODULE rather than from a cwd.
 *
 * THE TWO ARE NOT THE SAME THING. A caller's `cwd` is the tree the command
 * operates on — which `storage/` it reads and writes. The CLI's own location is
 * fixed by where these tools are installed. Deriving the second from the first
 * worked only because they coincide in normal use, and broke the moment
 * anything ran a command against a directory that was not this checkout.
 */
export const CLI_ENTRY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', // tools/repro-console/src → tools/repro-console
  '..', // → tools
  'generate',
  'bin',
  '1c.mjs',
)

/**
 * `1c <argv…>` as a command and its arguments.
 *
 * Node is invoked directly rather than through `bin/1c`, which is a bash script
 * whose entire body is this same `exec`. Going straight to the launcher module
 * costs a shell and an executable bit we would otherwise depend on, and buys
 * nothing.
 */
export function oneC(argv: string[], cliEntry: string = CLI_ENTRY): { cmd: string; args: string[] } {
  return { cmd: process.execPath, args: [cliEntry, ...argv] }
}

/**
 * The informative lines a process left behind, trimmed and de-decorated.
 *
 * Lines with no word character in them are dropped. That is not cosmetic:
 * Playwright prints its "browser is not installed" refusal inside a drawn box,
 * so the literal last line of the most common capture failure is `╚═══…╝` —
 * which told the operator that the run failed and nothing whatsoever about why.
 * ANSI colour is stripped for the same reason: these lines are re-quoted inside
 * the rail's own report, where a stray dim-on sequence bleeds into everything
 * printed after it.
 */
function informativeLines(result: CommandResult): string[] {
  return (result.stderr.trim() || result.stdout.trim())
    .split('\n')
    // eslint-disable-next-line no-control-regex
    .map((line) => line.replace(/\[[0-9;]*m/g, '').trim())
    .filter((line) => /\w/.test(line))
}

/** The last few informative lines a failed process left behind. */
export function tailOf(result: CommandResult, lines = 5): string {
  const informative = informativeLines(result)
  return informative.length ? informative.slice(-lines).join('\n').slice(-600) : 'no output'
}

/**
 * The first few informative lines a failed process left behind.
 *
 * The counterpart to {@link tailOf}, and it exists because the two halves of a
 * failure are not interchangeable. A test runner or a compiler builds toward its
 * verdict, so the tail is the summary; a thrown error puts its message first and
 * then unwinds, so the tail is teardown chatter and the head is the reason. The
 * rail quotes the head when a probe produced no report at all — the commonest
 * cause is a browser that would not launch, whose tail is three lines of
 * temporary-directory cleanup and whose first line is the actual refusal.
 */
export function headOf(result: CommandResult, lines = 3): string {
  const informative = informativeLines(result)
  return informative.length ? informative.slice(0, lines).join('\n').slice(0, 600) : 'no output'
}

/**
 * The JSON document a `--json` command printed, read out of its stdout.
 *
 * Tolerant of a prefix AND a suffix on purpose. Every `--json` verb this package
 * drives is meant to print nothing but its document, but they are reached
 * through a Vite SSR bootstrap that may say something first, and a rail that
 * fell over because a dependency logged a deprecation would be a rail nobody
 * trusts. `xgd` is the other case and it brackets its output: a `▶ xgd <version>`
 * banner before the document and a `◀ xgd <version>` one after it. Slicing only
 * from the first `{` handles the opening banner and chokes on the closing one,
 * which is a failure that looks exactly like malformed data and is not.
 *
 * So the document is the span from the first `{` to the LAST `}`. That is not a
 * parser — a `}` inside a trailing log line would still defeat it — but it is
 * the shape these two callers actually produce, and the alternative is a
 * brace-counting scan for a problem neither of them has.
 */
export function parseJsonOutput<T>(stdout: string, what: string): T {
  const start = stdout.indexOf('{')
  const end = stdout.lastIndexOf('}')
  if (start === -1 || end < start) {
    throw new Error(`${what} printed no JSON document:\n${stdout.trim().slice(-400)}`)
  }
  const document = stdout.slice(start, end + 1)
  try {
    return JSON.parse(document) as T
  } catch {
    throw new Error(`${what} printed a JSON document that would not parse:\n${document.slice(0, 400)}`)
  }
}

/**
 * The same slice, for the one `xgd --json` that prints an ARRAY ([[BUG-140]]).
 *
 * `xgd ticket comments <id> --json` answers with a bare `[…]` rather than the
 * document every other `--json` the console reads answers with, and
 * {@link parseJsonOutput} hunts for `{` and `}` — so on a populated list it
 * slices the braces off the first and last ELEMENT and parses neither, and on
 * an empty one it finds no brace at all. Both read as "the CLI is unreachable",
 * which on the append-evidence check would have reported every well-behaved
 * round as unverified.
 *
 * Kept as a second function rather than folded into the first: widening the
 * object parser to accept `[` would let a command that is supposed to answer
 * with a document quietly pass an array through.
 */
export function parseJsonArrayOutput<T>(stdout: string, what: string): T[] {
  const start = stdout.indexOf('[')
  const end = stdout.lastIndexOf(']')
  if (start === -1 || end < start) {
    throw new Error(`${what} printed no JSON array:\n${stdout.trim().slice(-400)}`)
  }
  const document = stdout.slice(start, end + 1)
  let parsed: unknown
  try {
    parsed = JSON.parse(document)
  } catch {
    throw new Error(`${what} printed a JSON array that would not parse:\n${document.slice(0, 400)}`)
  }
  if (!Array.isArray(parsed)) throw new Error(`${what} printed JSON that is not an array`)
  return parsed as T[]
}
