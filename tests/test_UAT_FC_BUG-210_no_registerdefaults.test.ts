import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { productConfig, SESSION_BUDGET_PROVIDER, SESSION_MEMORY_PROVIDER } from '../tools/generate/src/cli/ai/roles'

/**
 * [[BUG-210]] — nothing in this host reaches for what lagrange-framework BUG-83
 * deleted, and nothing it registers collides with a name the session-memory core
 * owns. Read against the REAL installed `@lagrangefoundry/ai`.
 */

const ROOT = join(__dirname, '..')
const SOURCE_DIRS = ['tools/generate/src', 'apps/control-app/src']

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (name === 'node_modules' || name === 'generated') return []
    if (statSync(path).isDirectory()) return sources(path)
    return /\.(ts|js|mjs)$/.test(name) ? [path] : []
  })
}

describe('BUG-210 — the host is written against the BUG-83 framework', () => {
  it('test_UAT_FC_BUG-210_no_source_file_calls_registerDefaults_or_defaultProduct', () => {
    const offenders = SOURCE_DIRS.flatMap((d) => sources(join(ROOT, d)))
      .filter((path) => /\b(registerDefaults|defaultProduct)\s*\(/.test(readFileSync(path, 'utf8')))
      .map((path) => relative(ROOT, path))
    expect(offenders).toEqual([])
  })

  it('test_UAT_FC_BUG-210_the_hosts_memory_providers_are_not_core_owned_names_and_the_product_loads', async () => {
    const lib = (await aiCore()) as any
    expect(lib.CORE_PROVIDERS).not.toContain(SESSION_MEMORY_PROVIDER)
    expect(lib.CORE_PROVIDERS).not.toContain(SESSION_BUDGET_PROVIDER)

    // The product tier loads against a registry holding this host's names, and its
    // `memory:` block is accepted by the framework's own parser (unknown keys are
    // refused there) with the charter kept and the replaced layers off.
    const providers = new lib.PrimingProviders()
    for (const name of ['memory.transcript_pointer', 'memory.work_log_note', 'memory.record', 'memory.budget']) {
      providers.register(name, async () => null)
    }
    const product = productConfig(lib, providers)
    expect(product.memory).toMatchObject({
      charter: true,
      summary: false,
      transcript: false,
      reminder: false,
      budget: false,
    })
    expect(product.priming.map((e: { provider?: string }) => e.provider)).toEqual([
      'memory.transcript_pointer',
      'memory.work_log_note',
      'memory.record',
      'memory.budget',
    ])
    expect(product.cacheBoundary).toBe(2)
  })
})
