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
// none, logs "[WARN] Missing pages directory" through Astro's own logger (REQ-89).
// `logLevel: 'error'` on the *Vite* config (first arg) gates Vite's logger, not
// Astro's, so it never suppressed this. The fix is the second arg to
// `getViteConfig` — the inline *Astro* config — whose `logLevel: 'error'` gates
// Astro's logger and drops the WARN while still surfacing genuine errors.
//
// The stdout→stderr diversion below remains as defense in depth: any *other*
// bootstrap chatter would otherwise corrupt a `--json` command's single document.
// We restore stdout before `mod.run` prints the command's real output. (Render-time
// chatter *inside* a command is handled separately by withCleanStdout in the CLI.)
const originalStdoutWrite = process.stdout.write.bind(process.stdout)
process.stdout.write = (chunk, enc, cb) => process.stderr.write(chunk, enc, cb)

let server
try {
  const cfgFn = getViteConfig({ root: repoRoot, logLevel: 'error' }, { logLevel: 'error' })
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
  // `assets` IS THE BOOTSTRAP, so it must not load the CLI barrel (REQ-145).
  //
  // The barrel reaches the builder transport, which reaches the Worker's router
  // and its chrome document — and the chrome document imports the very import
  // map this command generates. That map is NOT committed: it names each webui
  // component's entry point, and a checked-in copy of a generator's output is a
  // second definition site for the component scope, which BUG-32's scan fails
  // on. So on a fresh checkout the barrel cannot load at all, and `1c assets`
  // could never run to fix it.
  //
  // (The other generated file, `module-assets.ts`, IS committed — it carries no
  // scope, so the same objection does not apply, and a UAT re-extracts it from
  // the `.astro` sources to catch drift.)
  //
  // Loading the one module it needs breaks the cycle. This is the only command
  // with that property: it is the one whose output everything else imports.
  const argv = process.argv.slice(2)
  if (argv[0] === 'assets') {
    const assets = await server.ssrLoadModule('/tools/generate/src/cli/assets.ts')
    const report = assets.cmdAssets({ cwd: process.cwd() })
    console.log(
      argv.includes('--json') ? JSON.stringify(report, null, 2) : assets.formatAssetReport(report),
    )
    exitCode = 0
  } else {
    const mod = await server.ssrLoadModule('/tools/generate/src/cli/index.ts')
    await mod.run(argv)
    exitCode = process.exitCode ?? 0
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err))
  exitCode = 1
} finally {
  await server.close()
}
process.exit(exitCode)
