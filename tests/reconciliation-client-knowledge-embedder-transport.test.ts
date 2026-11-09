import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Reconciliation UATs for story-5281f009 — the **file-reading half** of how the
 * control application reaches the embedding model ([[BUG-73]], reconciled in
 * BUNDLE-42: AC-2471, AC-2475).
 *
 * Both claims are about what is COMMITTED rather than about a request: that one
 * module is the only place deciding how to embed, and that the deployment
 * declaration never names the REST credential. Both need a filesystem, so they
 * live in the node project; the behavioural half runs inside workerd in
 * `reconciliation-client-knowledge-embedder-transport.workers.test.ts`.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const APP = path.join(REPO, 'apps', 'control-app')
const SRC = path.join(APP, 'src')

/** Every `.ts` under the control app's `src`, excluding the generated upstream shims. */
function controlAppSources(): string[] {
  const out: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'generated') continue
        walk(full)
      } else if (entry.name.endsWith('.ts')) out.push(full)
    }
  }
  walk(SRC)
  return out.sort()
}

/** Source text with comment lines removed, so prose about `env.AI` is not code. */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => {
      const t = line.trimStart()
      return !t.startsWith('*') && !t.startsWith('//') && !t.startsWith('/*')
    })
    .join('\n')
}

describe('story-5281f009 — one place decides how to reach the model', () => {
  it('test_UAT_AC2471_one_module_decides_how_to_embed_and_nothing_else_builds_an_embedder_or_reads_the_ai_binding', () => {
    const sources = controlAppSources()
    expect(sources.length, 'the control app has sources to scan').toBeGreaterThan(10)
    const rel = (f: string): string => path.relative(SRC, f)

    // WORKERS AI EMBEDDERS ARE CONSTRUCTED IN EXACTLY ONE MODULE.
    const constructing = sources.filter((f) => /new\s+WorkersAiEmbedder\s*\(/.test(code(f)))
    expect(constructing.map(rel)).toEqual(['embedder.ts'])

    // NO OTHER FILE READS THE AI BINDING TO DECIDE ANYTHING. Declaring it in an
    // env interface (`AI?: …`) is a type, not a decision, and is allowed; reading
    // `env.AI` — as a gate, a truthiness test, or a constructor argument — is not.
    // Nor is DESTRUCTURING it out of an env (`const { AI } = env`,
    // `const { AI: binding, … } = this.env`), which reads the same binding
    // without ever spelling `env.AI`.
    const destructuresAi = /\{[^{}]*\bAI\b[^{}]*\}\s*=\s*(?:[\w$]+\.)*env\b/
    const reading = sources.filter((f) => {
      if (path.basename(f) === 'embedder.ts') return false
      const text = code(f)
      return (
        /\benv\.AI\b/.test(text) ||
        /\bbinding\s*:\s*\w+\.AI\b/.test(text) ||
        destructuresAi.test(text)
      )
    })
    expect(reading.map(rel)).toEqual([])
    // The destructuring check is live: it catches both spellings it exists for,
    // and leaves a type declaration of the binding alone.
    expect(destructuresAi.test('const { AI } = env')).toBe(true)
    expect(destructuresAi.test('const { DB, AI: binding } = this.env')).toBe(true)
    expect(destructuresAi.test('interface Env { AI?: Ai }')).toBe(false)

    // AND THE FOUR CALLERS GET THEIR ANSWER FROM IT: both knowledge bases, the
    // session gate and the upload indexer all import the resolver.
    const asks: Record<string, RegExp> = {
      'knowledge.ts': /\bembedderFor\s*\(/,
      'system-knowledge.ts': /\bembedderFor\s*\(/,
      'session-knowledge.ts': /\bcanEmbed\s*\(/,
      'router.ts': /\bcanEmbed\s*\(/,
    }
    for (const [file, call] of Object.entries(asks)) {
      const text = code(path.join(SRC, file))
      expect(text, `${file} imports the resolver`).toMatch(/from '\.\/embedder'/)
      expect(text, `${file} asks the resolver`).toMatch(call)
    }
  })

  it('test_UAT_AC2475_neither_rest_credential_variable_is_named_in_the_committed_wrangler_toml', () => {
    const toml = readFileSync(path.join(APP, 'wrangler.toml'), 'utf8')
    // The declaration is the real one — it has a production environment and the
    // vars tables a leak would land in — so an absence below is not vacuous.
    expect(toml).toMatch(/^\[env\.production\]$/m)
    expect(toml).toMatch(/^\[vars\]$/m)
    // Neither name anywhere: not in [vars], not in [env.production.vars], not in
    // a comment that invites someone to fill it in.
    expect(toml).not.toContain('CLOUDFLARE_ACCOUNT_ID')
    expect(toml).not.toContain('CLOUDFLARE_API_TOKEN')
  })
})
