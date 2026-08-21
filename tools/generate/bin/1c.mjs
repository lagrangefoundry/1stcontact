#!/usr/bin/env node
/**
 * `1c` entrypoint.
 *
 * The CLI is TypeScript, so node cannot import it directly. We compile it on the
 * fly with a Vite SSR server and load it through `ssrLoadModule` — the same
 * transform path the UATs use under Vitest. Vite is rooted at the repo (where the
 * workspace packages live); data/dist paths follow the user's working directory.
 *
 * WHY THIS IS PLAIN VITE (REQ-150). It used to be Astro's `getViteConfig()`,
 * for exactly one reason: the render path imported `.astro` module components,
 * which only Astro's transform can parse. REQ-148 made every behavior module a
 * plain TypeScript function and deleted the last `.astro` file in the repo, so
 * the plugin was transforming nothing — while still scanning for `src/pages`,
 * still dragging Astro's logger in, and still being the only reason `vite`
 * had to be located through `astro`'s own module graph. Astro is now absent
 * from the repository; `vite` is a direct dependency and is imported as one.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const here = path.dirname(fileURLToPath(import.meta.url))
// tools/generate/bin → repo root
const repoRoot = path.resolve(here, '..', '..', '..')

// Bootstrap chatter goes to stderr, never stdout, so a `--json` command's single
// document survives whatever the server decides to say while it starts. This is
// deliberately NOT tied to any one source of noise: Astro's "Missing pages
// directory" WARN (REQ-89) was merely the loudest, and Vite has its own
// (dependency re-optimization, plugin notices) that appear on cache-cold boots
// and under future config changes. We restore stdout before `mod.run` prints the
// command's real output. (Render-time chatter *inside* a command is handled
// separately by withCleanStdout in the CLI.)
const originalStdoutWrite = process.stdout.write.bind(process.stdout)
process.stdout.write = (chunk, enc, cb) => process.stderr.write(chunk, enc, cb)

let server
try {
  server = await createServer({
    root: repoRoot,
    // Take the config from here and nowhere else. Vite would otherwise search
    // the root for a `vite.config.*`, making the launcher's behaviour depend on
    // a file that exists for some other purpose entirely.
    configFile: false,
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
  // the module sources to catch drift.)
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
