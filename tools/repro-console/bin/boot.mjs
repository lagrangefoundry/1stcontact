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
    await server.close()
    process.exit(1)
  }
  if (!keepAlive) {
    await server.close()
    process.exit(process.exitCode ?? 0)
  }
}
