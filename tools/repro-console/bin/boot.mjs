/**
 * The Vite SSR bootstrap both dev tools in this package are loaded through
 * (REQ-254, REQ-255).
 *
 * They are TypeScript, so node cannot import them directly. Each launcher boots
 * a Vite SSR server and loads its entry module through `ssrLoadModule` — the
 * same bootstrap `bin/1c` uses, and for the same reason ([[REQ-150]]).
 *
 * THE DUPLICATION OF `bin/1c`'s BOOTSTRAP IS DELIBERATE. Reaching into
 * `tools/generate` for a shared one would put these tools into the import graph
 * of the package the deployable Worker reads its engine out of, which is the one
 * direction [[EPIC-12]] §8.6 forbids. Forty lines of server construction is the
 * cheaper side of that trade. What is NOT duplicated is this file between the
 * two tools here — they are in the same package and share it.
 *
 * Note this bootstrap serves this package's OWN code only. Every step either
 * tool runs is a separate `1c` process with its own Vite server, so an engine
 * change is picked up by the next step without restarting anything.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

/**
 * Load `entry` through a Vite SSR server rooted at the repo and call its
 * `main(argv, repoRoot)`.
 *
 * `keepAlive` is the difference between the two tools. The console's HTTP
 * server keeps the process alive until the operator stops it, and closing the
 * Vite server would pull the console's own modules out from under it. The rail
 * finishes and must exit with its verdict, so its server is closed and its exit
 * code preserved.
 */
export async function boot(entry, { keepAlive }) {
  const here = path.dirname(fileURLToPath(import.meta.url))
  // tools/repro-console/bin → repo root
  const repoRoot = path.resolve(here, '..', '..', '..')

  const server = await createServer({
    root: repoRoot,
    configFile: false,
    // `ws: false` keeps this SSR server off Vite's HMR port, which a running
    // `1c serve`/`1c builder` may already hold. Neither tool needs HMR.
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
  })

  try {
    const mod = await server.ssrLoadModule(entry)
    await mod.main(process.argv.slice(2), repoRoot)
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    process.exitCode = 1
    await server.close()
    return
  }
  // NATURAL EXIT, NOT `process.exit` (BUG-105, after BUG-101 in `bin/1c.mjs`).
  // Both lines here used to be `process.exit(...)`, which ends the process with
  // queued writes still queued. stdout is asynchronous when it is a PIPE, so
  // any document longer than the OS pipe buffer (65536 bytes on macOS) reached
  // a consumer cut to exactly that length — no error, exit code 0, and a prefix
  // that still looks like a JSON document. `repro-rail --json` prints its whole
  // report through here, and the console spawns it with `stdio: 'pipe'`.
  // Redirecting to a file hid it, because a file descriptor is synchronous.
  //
  // Setting the status and returning lets node flush both streams before the
  // event loop empties. `rail.ts`'s `main` already assigns `process.exitCode`
  // and calls `process.exit` nowhere, so this line is not dropping a verdict —
  // it is getting out of the way of the one already set.
  //
  // THE TRADE IS DELIBERATE, AND IT WAS MEASURED HERE RATHER THAN ASSUMED. A
  // forced exit ends the process whatever is still open; this one does not, so
  // a tool that ever leaves a live handle after `server.close()` will hang here
  // instead of exiting fast. The rail spawns `1c`, `pnpm` and `vitest`, which
  // is why BUG-101 would not make this change blind: with the forced exit
  // removed and a real `repro-rail record --only typecheck` run through it, the
  // only handle left after `server.close()` resolves is a `ProcessWrap` for an
  // already-closed child, and node ends the process in the same millisecond
  // `main` returns. A hang is also the better failure: it names itself and is
  // diagnosable from `process.getActiveResourcesInfo()`, while the behaviour it
  // replaces was a truncated report that claimed to have succeeded.
  if (!keepAlive) await server.close()
}
