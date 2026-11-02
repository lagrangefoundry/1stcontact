import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildControlAppAssets } from '../tools/generate/src/cli/assets'
import { SHARED_STORE_INSTALL_COMMAND, assertSharedStore } from '../tools/generate/src/cli/shared-store'

/**
 * Vitest globalSetup for the node project: the control app's generated shims
 * exist before any test file is collected.
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
const generatedDir = path.join(repoRoot, 'apps', 'control-app', 'src', 'generated')

/** Every generated module the control app imports. */
const REQUIRED = [
  'importmap.json',
  'ai-workers.js',
  'ticketing.js',
  'knowledge.js',
  'ai-knowledge.js',
  'kb.js',
]

export default async function setup(): Promise<void> {
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
