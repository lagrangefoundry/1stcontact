import { accessSync, constants, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * REQ-143 — the store's bindings and its migration hook, pinned.
 *
 * WHY THESE ARE UATs AND NOT A README LINE. A named wrangler environment
 * inherits neither vars nor bindings, and REQ-144 already paid for learning that
 * the hard way: control-app deployed without `BUILDER_ORIGIN` and answered every
 * production request with its own 503. The same omission on a *binding* is
 * worse, because the failure is not a clean message — the Worker sees
 * `env.DB === undefined` and throws somewhere inside a store call.
 *
 * So the two halves of the config are asserted to agree, and the migration hook
 * is asserted to be a thing `bin/deploy` will actually run. Both are one line to
 * get wrong and invisible until production.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')
const MIGRATIONS = path.join(REPO, 'db', 'migrations')
const HOOKS = path.join(REPO, 'bin', 'deploy.d', 'migrate')

const toml = readFileSync(WRANGLER, 'utf8')

/** The `[env.production]` half of the file, and everything before it. */
function split(source: string): { top: string; production: string } {
  // Anchored to the start of a line, because the file *discusses*
  // `[env.production]` in a comment above the table it names — matching the
  // prose would cut the file in the wrong place and quietly assert nothing.
  const match = /^\[env\.production\]$/m.exec(source)
  expect(match, 'control-app declares an [env.production] environment').not.toBeNull()
  const at = match!.index
  return { top: source.slice(0, at), production: source.slice(at) }
}

describe('REQ-143 — the store bindings', () => {
  const { top, production } = split(toml)

  it('UAT_FC_REQ-143 control-app declares the D1 and R2 bindings for local development', () => {
    expect(top).toMatch(/\[\[d1_databases\]\]/)
    expect(top).toMatch(/binding\s*=\s*"DB"/)
    expect(top).toMatch(/database_name\s*=\s*"1stcontact"/)
    // A real id, not a placeholder: `wrangler deploy` resolves the binding by id
    // and a `<uuid>`-shaped stub fails at upload rather than at edit time.
    expect(top).toMatch(/database_id\s*=\s*"[0-9a-f-]{36}"/)
    expect(top).toMatch(/\[\[r2_buckets\]\]/)
    expect(top).toMatch(/bucket_name\s*=\s*"1stcontact-sites"/)
  })

  it('UAT_FC_REQ-143 every binding is repeated under [env.production]', () => {
    // The claim REQ-144's incident makes worth asserting: a named environment
    // inherits nothing, so the production half must restate all of it.
    expect(production).toMatch(/\[\[env\.production\.d1_databases\]\]/)
    expect(production).toMatch(/binding\s*=\s*"DB"/)
    expect(production).toMatch(/database_name\s*=\s*"1stcontact"/)
    expect(production).toMatch(/\[\[env\.production\.r2_buckets\]\]/)
    expect(production).toMatch(/binding\s*=\s*"SITES"/)
    expect(production).toMatch(/bucket_name\s*=\s*"1stcontact-sites"/)
  })

  it('UAT_FC_REQ-143 the two halves name the same database and bucket', () => {
    // Not a duplicate of the two above: those check each half in isolation and
    // would both pass if production pointed at a different database.
    const ids = [...toml.matchAll(/database_id\s*=\s*"([0-9a-f-]{36})"/g)].map((m) => m[1])
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(1)

    const buckets = [...toml.matchAll(/bucket_name\s*=\s*"([^"]+)"/g)].map((m) => m[1])
    expect(buckets).toHaveLength(2)
    expect(new Set(buckets).size).toBe(1)
  })

  it('UAT_FC_REQ-143 migrations_dir points at a directory that holds the schema', () => {
    const match = /migrations_dir\s*=\s*"([^"]+)"/.exec(toml)
    expect(match, 'control-app declares migrations_dir').not.toBeNull()
    const resolved = path.resolve(path.dirname(WRANGLER), match![1])
    expect(resolved).toBe(MIGRATIONS)
    // And something is actually in it — a correct path to an empty directory
    // applies zero migrations and reports success.
    expect(readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).length).toBeGreaterThan(0)
  })
})

describe('REQ-143 — the migration hook', () => {
  const hooks = readdirSync(HOOKS).filter((name) => !name.endsWith('.md'))

  it('UAT_FC_REQ-143 a migrate hook exists and is executable', () => {
    expect(hooks.length).toBeGreaterThan(0)
    for (const name of hooks) {
      // `bin/deploy` runs EXECUTABLE files and ignores the rest, so a hook
      // committed without the bit is a hook that silently never runs — the
      // deploy would go green having applied no migration at all.
      expect(() => accessSync(path.join(HOOKS, name), constants.X_OK), name).not.toThrow()
    }
  })

  it('UAT_FC_REQ-143 the hook gates on its app, applies remotely, and changes nothing on a dry run', () => {
    const source = readFileSync(path.join(HOOKS, '10-d1-site-store'), 'utf8')

    // Hooks run for every app; each is responsible for knowing which is its own.
    expect(source).toMatch(/DEPLOY_APP.*control-app/)
    // The deployed database, not the local miniflare one.
    expect(source).toMatch(/wrangler d1 migrations apply .*--remote/)
    // A rehearsal must make no change — `bin/deploy`'s contract for every hook.
    expect(source).toMatch(/DEPLOY_DRY_RUN/)
    const dryRunBlock = source.slice(source.indexOf('DEPLOY_DRY_RUN'), source.indexOf('\nfi'))
    expect(dryRunBlock).not.toMatch(/migrations apply/)
    expect(source).toMatch(/set -euo pipefail/)
  })
})
