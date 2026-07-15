/**
 * stdout hygiene for machine-readable command output.
 *
 * The values-diff commands render the draft through an in-process Astro
 * container, which boots Vite. Both write diagnostics — "Re-optimizing
 * dependencies", deprecation notices, a "Missing pages directory" warning — to
 * *stdout*. In `--json` mode that chatter is interleaved with the single JSON
 * document the command promises, so a downstream `| jq` chokes on it.
 *
 * `withCleanStdout` runs `fn` with `process.stdout.write` temporarily aliased to
 * `process.stderr.write`, then restores it. Diagnostics belong on stderr
 * regardless of mode, so this is correct for the human report too: the only
 * thing left on stdout is whatever the CLI itself prints after `fn` returns.
 */
export async function withCleanStdout<T>(fn: () => Promise<T>): Promise<T> {
  const original = process.stdout.write.bind(process.stdout)
  // Forward every stdout write to stderr while fn runs. The signature is the
  // union node exposes ((chunk, cb) | (chunk, enc, cb)); pass through verbatim.
  process.stdout.write = ((chunk: unknown, enc?: unknown, cb?: unknown) =>
    (process.stderr.write as (...a: unknown[]) => boolean)(chunk, enc, cb)) as typeof process.stdout.write
  try {
    return await fn()
  } finally {
    process.stdout.write = original
  }
}
