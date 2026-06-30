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

const cfgFn = getViteConfig({ root: repoRoot, logLevel: 'error' })
const cfg = typeof cfgFn === 'function' ? await cfgFn({ command: 'serve', mode: 'development' }) : cfgFn

const server = await createServer({
  ...cfg,
  root: repoRoot,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
})

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
