/**
 * A stand-in for `rail.ts` that prints a document of a size the test chooses
 * (BUG-105).
 *
 * WHY THE RAIL ITSELF IS NOT THE FIXTURE. The thing under test is `boot.mjs`'s
 * exit: whether a document longer than one OS pipe buffer survives the process
 * ending. Producing that document from a real rail run means a whole-suite
 * vitest pass, two `pnpm -r` builds and a reproduction of every stored
 * reference — minutes of wall clock, a browser, and reference bundles that are
 * gitignored and therefore absent from a fresh checkout. None of that is the
 * behaviour under test, and all of it would make the test skip on the machines
 * most likely to regress it.
 *
 * `boot` takes the entry module as an argument, so a fixture entry is the whole
 * substitution: the launcher, its Vite server, its `ssrLoadModule` call and its
 * exit are all the real ones, and only what `main` prints is ours. The
 * companion claim — that the rail's OWN report can exceed a pipe buffer — is
 * asserted separately against the real `runRail`.
 *
 * `main(argv, repoRoot)` is the contract `boot` calls, so this file has the
 * same shape as `rail.ts` and `server.ts`.
 */

/**
 * Print `bytes` bytes of JSON to stdout and exit with `exitCode`.
 *
 * argv is `<bytes> <exitCode>`. The document is a real JSON array of padded
 * lines rather than one long string, so a truncated copy is a plausible-looking
 * prefix exactly as the rail's report is — a test that could only fail on
 * unparseable garbage would not be testing the bug.
 */
export async function main(argv: string[], _repoRoot: string): Promise<void> {
  const bytes = Number(argv[0] ?? 0)
  const exitCode = Number(argv[1] ?? 0)

  // The launcher's OTHER exit: an entry module that throws. `boot` catches it,
  // prints the message and fails — and that path carried the same defect, on
  // stderr. A non-numeric size is how the test reaches it.
  if (!Number.isFinite(bytes)) throw new Error(process.env.BUG105_THROW ?? `not a byte count: ${argv[0]}`)

  const lines: string[] = []
  let document = ''
  for (let i = 0; document.length <= bytes; i++) {
    lines.push(`line ${String(i).padStart(6, '0')} ${'x'.repeat(64)}`)
    document = JSON.stringify({ lines }, null, 2)
  }
  console.log(document)

  process.exitCode = exitCode
}
