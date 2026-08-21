import path from 'node:path'
import { defineConfig } from 'vitest/config'
import {
  WEBUI_PACKAGES,
  WEBUI_SCOPE,
  webuiExports,
  webuiPackageDir,
} from './tools/generate/src/cli/webui'

/**
 * The webui components resolved for VITE's transform-time resolution.
 *
 * The builder's browser sources import the components by bare specifier, and
 * Vite resolves those by walking up from the importing file — which reaches the
 * shared artifact store from the main checkout and, from a `git worktree`
 * checkout parked elsewhere, reaches nothing. `webuiPackageDir` already answers
 * this correctly for both, so the aliases are derived from it rather than from a
 * second guess at where the store lives: the resolution point stays single, and
 * the scope is still written exactly once.
 *
 * These point at the real installed packages — never a stand-in — so a suite
 * mounting them proves the same thing it proves in the main checkout. When the
 * out-of-band install has not been run there is nothing to alias, and the suites
 * report their skip exactly as before.
 */
function webuiAliases(): Array<{ find: string; replacement: string }> {
  const aliases: Array<{ find: string; replacement: string }> = []
  for (const name of WEBUI_PACKAGES) {
    let dir: string
    let exports: Record<string, string>
    try {
      dir = webuiPackageDir(name)
      exports = webuiExports(name)
    } catch {
      continue // not installed — WEBUI_INSTALLED is false and the suites skip
    }
    // Vite matches a string `find` as a PREFIX, so every subpath has to be
    // listed ahead of the bare root or `…/shell.css` would rewrite to the JS
    // entry plus a stray suffix.
    for (const [sub, target] of Object.entries(exports)) {
      if (sub === '.') continue
      aliases.push({
        find: `${WEBUI_SCOPE}/${name}/${sub.replace(/^\.\//, '')}`,
        replacement: path.join(dir, target.replace(/^\.\//, '')),
      })
    }
    aliases.push({
      find: `${WEBUI_SCOPE}/${name}`,
      replacement: path.join(dir, (exports['.'] ?? './index.js').replace(/^\.\//, '')),
    })
  }
  return aliases
}

// The node project — the repository's default runtime.
//
// This was `getViteConfig` from `astro/config`, which wired Astro's `.astro`
// transform plugin into Vitest so framework module components could be rendered
// through the container API. REQ-148 made every behavior module a plain
// TypeScript function and deleted the last `.astro` file, so the plugin had
// nothing left to transform; REQ-150 dropped it, and Astro with it. The split
// from the workerd project survives on its own terms — these tests touch a real
// filesystem, which workerd does not have.
//
// The include/exclude pair is the whole routing convention: `*.workers.test.ts`
// belongs to the sibling project, everything else runs here.
export default defineConfig({
  resolve: { alias: webuiAliases() },
  test: {
    name: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/**/*.workers.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
})
