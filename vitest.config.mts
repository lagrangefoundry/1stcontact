import path from 'node:path'
import { getViteConfig } from 'astro/config'
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

// Astro's `getViteConfig` wires the `.astro` transform plugin into Vitest so
// framework module components can be imported and rendered via the container
// API. Plain `.ts` UATs (site-schema, naming) are unaffected.
export default getViteConfig({
  resolve: { alias: webuiAliases() },
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
})
