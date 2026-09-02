import { mkdtempSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { KNOWLEDGE_EXPORTS } from '../tools/generate/src/cli/assets'
import { configPath, ensureConfig } from '../tools/generate/src/cli/kb'
import { sharedModuleUrl, webuiPackageDir } from '../tools/generate/src/cli/webui'

/**
 * REQ-159 — the project KB's configuration, pinned.
 *
 * THREE CLAIMS, and each is a one-line mistake production would not announce.
 *
 * 1. THE DECLARATION SAYS WHAT THE KB IS. `kb/knowledge_bases.json` is the one
 *    place both knowledge bases are declared, and the corpus predicate there is
 *    the thing actually queried — `kb.ts` records at length why a hand-
 *    constructed KB beside a declaration nobody reads is worse than no
 *    declaration. What that argument leaves unprotected is the FILE: dropping a
 *    type from the corpus, or adding a `source`, or narrowing it to one site,
 *    changes what the assistant can know with nothing to notice. So the shape is
 *    asserted here, in the terms [[DOC-38]] §8 and §9 state it.
 *
 * 2. BOTH HALVES DECLARE THE AI BINDING. A named wrangler environment inherits
 *    neither vars nor bindings — REQ-144 paid for that lesson on a var, REQ-143
 *    and REQ-162 pinned it for the store's bindings, and this is the same
 *    assertion for the embedder. Missing the production repeat is not a
 *    degradation: the deployed Worker raises `AiNotConfiguredError` and the
 *    client's knowledge base quietly stops being searchable.
 *
 * 2b. THE SCAFFOLD AND THE COMMITTED FILE AGREE. `ensureConfig` writes the
 *    starting-point declaration when none exists, so a fresh checkout gets a
 *    complete file rather than half of one — which means the same declaration is
 *    spelled twice, and the copy that only runs on an empty checkout is the copy
 *    nobody would notice going stale.
 *
 * 3. THE SHIM NAMES REAL EXPORTS. The generated `knowledge.d.ts` types every
 *    name as `any`, so — unlike a mis-typed argument — an upstream RENAME does
 *    not surface as a typecheck failure. It surfaces as `undefined is not a
 *    function` at the first index build. This is the check that makes the
 *    "listed rather than wildcarded" rule pay for itself.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')
const DECLARATION = path.join(REPO, 'kb', 'knowledge_bases.json')

const toml = readFileSync(WRANGLER, 'utf8')
const declaration = JSON.parse(readFileSync(DECLARATION, 'utf8')) as {
  knowledge_bases: Record<string, Record<string, unknown>>
}

/** The `[env.production]` half of the file, and everything before it. */
function split(source: string): { top: string; production: string } {
  const match = /^\[env\.production\]$/m.exec(source)
  expect(match, 'control-app declares an [env.production] environment').not.toBeNull()
  return { top: source.slice(0, match!.index), production: source.slice(match!.index) }
}

/** The binding named by an `[ai]`-shaped table in a half of the file. */
function aiBinding(half: string, header: string): string | undefined {
  const at = half.indexOf(`${header}\n`)
  if (at === -1) return undefined
  return /binding\s*=\s*"([^"]+)"/.exec(half.slice(at))?.[1]
}

/** Whether the knowledge component is installed in the shared artifact store. */
function installed(): boolean {
  try {
    webuiPackageDir('knowledge')
    return true
  } catch {
    return false
  }
}

describe('REQ-159 — the declaration', () => {
  const project = declaration.knowledge_bases.project

  it('UAT_FC_REQ-159 the project KB is declared, and its corpus is the four material types', () => {
    expect(project, 'kb/knowledge_bases.json declares a `project` knowledge base').toBeDefined()
    // [[DOC-38]] §8: the client's conversations, their uploads, the captures made
    // on their behalf, and the brief recording what was decided.
    expect((project.corpus as { type: string[] }).type.slice().sort()).toEqual([
      'brief',
      'chat',
      'material',
      'reference',
    ])
  })

  it('UAT_FC_REQ-159 it reads the tenant’s own store, and the system KB does not', () => {
    // NO `source` KEY AT ALL. Declaring one — even `"project"`, which is the
    // default — would invite a later edit to point it at a mounted store and
    // silently make the client's own knowledge someone else's.
    expect(Object.keys(project)).not.toContain('source')
    // And the other half is unchanged: `system` still reads the shipped corpus.
    // The two hosts each name the KBs they serve, so a `system` that quietly
    // became project-store-backed would be resolved against a store holding no
    // design documents and would report as an empty knowledge base.
    expect(declaration.knowledge_bases.system.source).toBe('shipped')
  })

  it('UAT_FC_REQ-159 the map is derived, and the corpus is tenant-wide rather than per-site', () => {
    // `derived` is what permits a rebuild; `authored` would make the awareness
    // pipeline refuse, which is right for a release artefact and wrong here.
    expect(project.landscape).toBe('derived')
    // The tenant is a hard barrier and the site is a predicate — deliberately, so
    // two sites belonging to one client share what has been learned about that
    // client. A `fields.placed_on` term would undo that with no other symptom
    // than an assistant that had forgotten the last site it built.
    expect(Object.keys(project.corpus as Record<string, unknown>)).toEqual(['type'])
  })
})

describe('REQ-159 — the scaffold', () => {
  it('UAT_FC_REQ-159 a fresh checkout scaffolds the same project KB the repository ships', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'req159-kbconfig-'))
    ensureConfig(root)
    const scaffolded = JSON.parse(readFileSync(configPath(root), 'utf8')) as typeof declaration
    // Every field, not just the name: a scaffold declaring a narrower corpus, or
    // a `source`, would give a fresh checkout a different knowledge base under
    // the same name — and the divergence would only ever be visible on a machine
    // that had deleted the file.
    expect(scaffolded.knowledge_bases.project).toEqual(declaration.knowledge_bases.project)
  })
})

describe('REQ-159 — the AI binding', () => {
  const { top, production } = split(toml)

  it('UAT_FC_REQ-159 control-app declares the AI binding for local development', () => {
    expect(aiBinding(top, '[ai]')).toBe('AI')
  })

  it('UAT_FC_REQ-159 the AI binding is repeated under [env.production]', () => {
    // The claim REQ-144's incident makes worth asserting: a named environment
    // inherits nothing, so the production half must restate all of it.
    expect(aiBinding(production, '[env.production.ai]')).toBe('AI')
  })
})

describe('REQ-159 — the knowledge shim', () => {
  it.skipIf(!installed())(
    'UAT_FC_REQ-159 every name the Worker reaches for exists in the component',
    async () => {
      const component = (await import(sharedModuleUrl('knowledge'))) as Record<string, unknown>
      const missing = KNOWLEDGE_EXPORTS.filter((name) => component[name] === undefined)
      expect(
        missing,
        'the generated knowledge.d.ts types every name as `any`, so an upstream ' +
          'rename shows up here or not at all',
      ).toEqual([])
    },
  )

  it.skipIf(!installed())(
    'UAT_FC_REQ-159 the component root reaches no filesystem, which is why the Worker may import it',
    async () => {
      // The component guarantees this and the Worker depends on it: every
      // filesystem seam lives behind `./node`. Asserted rather than trusted,
      // because the failure is a deploy that builds and a Worker that throws.
      const dir = webuiPackageDir('knowledge')
      const root = readFileSync(path.join(dir, 'src', 'index.js'), 'utf8')
      expect(root).not.toMatch(/from\s+['"]node:/)
      expect(root).not.toMatch(/from\s+['"][^'"]*\/node\.js['"]/)
    },
  )
})
