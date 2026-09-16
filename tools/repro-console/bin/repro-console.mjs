#!/usr/bin/env node
/**
 * `repro-console` entrypoint (REQ-254).
 *
 * The console is TypeScript, so node cannot import it directly. It is compiled
 * on the fly by a Vite SSR server and loaded through `ssrLoadModule` — the same
 * bootstrap `bin/1c` uses, and for the same reason ([[REQ-150]]).
 *
 * THE DUPLICATION IS DELIBERATE. Reaching into `tools/generate` for a shared
 * bootstrap would put the console into the import graph of the package the
 * deployable Worker reads its engine out of, which is the one direction
 * [[EPIC-12]] §8.6 forbids. Forty lines of server construction is the cheaper
 * side of that trade.
 *
 * Note this bootstrap serves the console's OWN code only. Each reproduction
 * step is a separate `1c` process with its own Vite server, so an engine change
 * is picked up by the next iteration without restarting the console.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const here = path.dirname(fileURLToPath(import.meta.url))
// tools/repro-console/bin → repo root
const repoRoot = path.resolve(here, '..', '..', '..')

const server = await createServer({
  root: repoRoot,
  configFile: false,
  // `ws: false` keeps this SSR server off Vite's HMR port, which a running
  // `1c serve`/`1c builder` may already hold. The console never needs HMR.
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
  logLevel: 'error',
})

try {
  const mod = await server.ssrLoadModule('/tools/repro-console/src/server.ts')
  await mod.main(process.argv.slice(2), repoRoot)
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err))
  await server.close()
  process.exit(1)
}
// The Vite server stays up because the console's own modules are loaded through
// it; the HTTP server keeps the process alive until the operator stops it.
