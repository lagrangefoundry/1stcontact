import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildControlAppAssets } from '../tools/generate/src/cli/assets'
import { SHARED_STORE_INSTALL_COMMAND, assertSharedStore } from '../tools/generate/src/cli/shared-store'

/**
 * Vitest globalSetup for BOTH projects (node and workers): the control app's
 * generated shims exist before any test file is collected.
 *
 * `apps/control-app/src/generated/` is gitignored and written only by `1c assets`.
 * The control app imports it statically (`./generated/ai-workers.js`,
 * `./generated/knowledge`, `./generated/kb.js`, …), so on a checkout where
 * nobody has run `1c assets` every suite that reaches the control app fails to
 * IMPORT. Vitest reports that as a file that never loaded, and its ACs read as
 * orphaned rather than failing — the failure is invisible in the place you
 * would look for it.
 *
 * So the shims are generated here with the REAL generator, never a stub: a
 * hand-written shim would prove the stub instead of the resolution `1c assets`
 * performs. Missing shims mean the generator runs; if it cannot (most often the
 * out-of-band shared store is not installed), the run fails loudly with the
 * install command rather than skipping. The directory stays untracked and
 * ignored, the same as after `1c assets`.
 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appSrcDir = path.join(repoRoot, 'apps', 'control-app', 'src')
const generatedDir = path.join(appSrcDir, 'generated')

/** Import specifiers in a source file (`from '…'`, `import '…'`, `import('…')`). */
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (full !== generatedDir) out.push(...sourceFiles(full))
    } else if (/\.(?:m?[jt]sx?)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      out.push(full)
    }
  }
  return out
}

/**
 * Every generated module the control app imports — DERIVED, never restated.
 *
 * A hand-kept list went stale the moment a new shim was added (`ai-ticketing.js`,
 * `ai-imagegen.js`, `auth-passwordless.js` were all missing from it), and a
 * checkout holding the older shims was then never regenerated: the suites that
 * import the new one failed to load. So the list is read from the control app's
 * own imports: whatever resolves into `src/generated/` must exist. An
 * extensionless specifier names the `.js` module the generator writes.
 */
function requiredGeneratedFiles(): string[] {
  const required = new Set<string>()
  for (const file of sourceFiles(appSrcDir)) {
    const text = fs.readFileSync(file, 'utf8')
    for (const match of text.matchAll(SPECIFIER)) {
      const spec = match[1]
      if (!spec.startsWith('.')) continue
      const target = path.resolve(path.dirname(file), spec)
      if (path.dirname(target) !== generatedDir) continue
      const name = path.basename(target)
      required.add(path.extname(name) ? name : `${name}.js`)
    }
  }
  return [...required].sort()
}

export default async function setup(): Promise<void> {
  const REQUIRED = requiredGeneratedFiles()
  if (REQUIRED.length === 0) {
    throw new Error(
      `Found no imports of ${path.relative(repoRoot, generatedDir)}/ in the control app; ` +
        `the scan that derives the required shims is broken.`,
    )
  }
  const missing = REQUIRED.filter((f) => !fs.existsSync(path.join(generatedDir, f)))
  if (missing.length === 0) return
  try {
    assertSharedStore()
    await buildControlAppAssets(repoRoot)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Cannot generate the control app's shims (${missing.join(', ')} missing from ` +
        `${path.relative(repoRoot, generatedDir)}/), so every suite that imports the ` +
        `control app would fail to load. The generator (\`1c assets\`) failed: ${reason}\n` +
        `If the shared component store is not installed, run \`${SHARED_STORE_INSTALL_COMMAND}\` ` +
        `(it is installed out of band; \`pnpm install\` cannot supply it), then retry.`,
    )
  }
  const still = REQUIRED.filter((f) => !fs.existsSync(path.join(generatedDir, f)))
  if (still.length > 0) {
    throw new Error(`\`1c assets\` ran but did not write: ${still.join(', ')}`)
  }
}
