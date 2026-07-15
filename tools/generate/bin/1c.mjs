#!/usr/bin/env node
/**
 * `1c` entrypoint.
 *
 * The render path imports the framework's Astro module components, so the CLI
 * must run through a build that compiles `.astro` (and the TypeScript sources).
 * We do that with a Vite SSR server wired with Astro's plugin (`getViteConfig`),
 * loading the CLI through `ssrLoadModule` — the same transform path the UATs use
 * under Vitest. Vite is rooted at the repo (where the workspace packages and
 * Astro config live); data/dist paths follow the user's working directory.
 */
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getViteConfig } from 'astro/config'

const here = path.dirname(fileURLToPath(import.meta.url))
// tools/generate/bin → repo root
const repoRoot = path.resolve(here, '..', '..', '..')

const require = createRequire(import.meta.resolve('astro/package.json'))
const { createServer } = await import(require.resolve('vite'))

// Astro's Vite plugin scans for `src/pages` during server setup and, finding
// none, logs "[WARN] Missing pages directory" through Astro's own logger — which
// routes WARN to console.info, i.e. *stdout*. `logLevel: 'error'` gates Vite's
// logger, not Astro's, so it doesn't suppress this. Any stdout write during
// bootstrap corrupts a `--json` command's single document, so we divert stdout
// to stderr for the whole setup phase and restore it before `mod.run` prints the
// command's real output. (Render-time chatter *inside* a command is handled
// separately by withCleanStdout in the CLI itself.)
const originalStdoutWrite = process.stdout.write.bind(process.stdout)
process.stdout.write = (chunk, enc, cb) => process.stderr.write(chunk, enc, cb)

let server
try {
  const cfgFn = getViteConfig({ root: repoRoot, logLevel: 'error' })
  const cfg = typeof cfgFn === 'function' ? await cfgFn({ command: 'serve', mode: 'development' }) : cfgFn

  server = await createServer({
    ...cfg,
    root: repoRoot,
    // `ws: false` returns a no-op WebSocket stub so the SSR server never binds
    // Vite's HMR port (24678). Under Vite 8, `hmr: false` alone no longer
    // suppresses the ws server — it is now gated on `server.ws` — so a running
    // `1c serve` (which holds 24678) would otherwise make every other `1c`
    // invocation log "Port 24678 is already in use". The CLI never needs HMR.
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
  })
} finally {
  process.stdout.write = originalStdoutWrite
}

let exitCode = 0
try {
  const mod = await server.ssrLoadModule('/tools/generate/src/cli/index.ts')
  await mod.run(process.argv.slice(2))
  exitCode = process.exitCode ?? 0
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err))
  exitCode = 1
} finally {
  await server.close()
}
process.exit(exitCode)
