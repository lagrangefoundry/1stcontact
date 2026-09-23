import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * REQ-307 — **the Durable Object is declared in the deployment, in both halves**.
 *
 * WHY THIS IS A SEPARATE FILE FROM THE BEHAVIOUR SUITE. The workers suite beside
 * this one proves what the object DOES, against a real Durable Object with its
 * own SQLite. It cannot prove what is DECLARED: inside workerd there is no
 * filesystem, and the bindings it sees are the ones `vitest.workers.config.mts`
 * hands it rather than the ones `wrangler.toml` does. So the two files assert the
 * two halves of one claim, and only together do they say the deployed Worker gets
 * what the suite exercises.
 *
 * WHAT IT IS GUARDING, and it is the failure mode this repository has already had
 * once ([[REQ-144]], and [[REQ-162]] asserts the same shape for the blob bucket):
 * a named wrangler environment inherits NEITHER vars NOR bindings, so every block
 * has to be restated under `[env.production]`. Forgetting it here fails QUIETLY
 * rather than loudly, which is worse than the usual case: `router.ts` treats an
 * absent binding as an ordinary state and falls back to `memoryJunctions()`. The
 * deployed Worker would boot, serve, and lose exactly the turns this ticket is
 * about — while local dev, which reads the top half, kept them. Nothing would
 * surface until a client lost a nine-minute turn in production.
 *
 * THE MIGRATION IS ASSERTED WITH THE BINDING because the two are not independent.
 * `new_sqlite_classes` is what provisions `ctx.storage.sql`, and that synchronous
 * SQL is the whole reason a Durable Object can satisfy the junction's synchronous
 * port at all. A class brought up under `new_classes` — key-value storage, no
 * synchronous SQL — would throw on its first statement, and a class cannot be
 * moved between the two afterwards.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')

const toml = readFileSync(WRANGLER, 'utf8')

/** The `[env.production]` half of the file, and everything before it. */
function split(source: string): { top: string; production: string } {
  const match = /^\[env\.production\]$/m.exec(source)
  expect(match, 'control-app declares an [env.production] environment').not.toBeNull()
  return { top: source.slice(0, match!.index), production: source.slice(match!.index) }
}

/** Every `[[…durable_objects.bindings]]` block in a half, as `name -> class_name`. */
function objects(half: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const block of half.split(/\[\[[^\]]*durable_objects\.bindings\]\]/).slice(1)) {
    const name = /name\s*=\s*"([^"]+)"/.exec(block)?.[1]
    const className = /class_name\s*=\s*"([^"]+)"/.exec(block)?.[1]
    if (name && className) out.set(name, className)
  }
  return out
}

/** Every class named by a `new_sqlite_classes` migration in a half. */
function sqliteClasses(half: string): Set<string> {
  const out = new Set<string>()
  for (const block of half.split(/\[\[[^\]]*migrations\]\]/).slice(1)) {
    const listed = /new_sqlite_classes\s*=\s*\[([^\]]*)\]/.exec(block)?.[1]
    if (!listed) continue
    for (const quoted of listed.matchAll(/"([^"]+)"/g)) out.add(quoted[1])
  }
  return out
}

describe('REQ-307 — the junction binding', () => {
  const { top, production } = split(toml)

  it('test_UAT_FC_REQ-307_the_session_junction_is_bound_for_local_development', () => {
    // The top half is what `wrangler dev` reads — and a `wrangler dev` reload is
    // the very event [[EPIC-19]] Finding 10 recorded losing three turns to.
    expect(objects(top).get('SESSION_JUNCTION')).toBe('SessionJunction')
  })

  it('test_UAT_FC_REQ-307_the_session_junction_is_repeated_under_env_production', () => {
    // THE QUIET FAILURE, stated as an assertion. See the file comment: an absent
    // binding is an ordinary state to `router.ts`, so production would degrade to
    // RAM without saying anything.
    expect(objects(production).get('SESSION_JUNCTION')).toBe('SessionJunction')
  })

  it('test_UAT_FC_REQ-307_both_halves_provision_the_class_with_sqlite_storage', () => {
    // `new_sqlite_classes` AND NOT `new_classes`, in both halves independently:
    // `ctx.storage.sql` is the synchronous API the junction's port requires, and
    // a class provisioned without it throws on its first statement.
    for (const half of [sqliteClasses(top), sqliteClasses(production)]) {
      expect(half.has('SessionJunction')).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-307_the_bound_class_is_exported_from_the_worker_entry', () => {
    // WRANGLER RESOLVES `class_name` AGAINST THE MAIN MODULE'S EXPORTS, so a
    // binding naming a class the entry does not export is a deploy-time failure —
    // and the class deliberately lives in `junction-do.ts`, which imports the
    // workerd built-in `cloudflare:workers` and so cannot be reached from the
    // node suites. The re-export in `worker.ts` is what joins the two, and this
    // is the assertion that it is still there.
    const entry = readFileSync(path.join(REPO, 'apps', 'control-app', 'src', 'worker.ts'), 'utf8')
    expect(entry).toMatch(/export\s*\{\s*SessionJunction\s*\}\s*from\s*'\.\/junction-do'/)
    const bound = new Set([
      ...objects(top).values(),
      ...objects(production).values(),
    ])
    for (const className of bound) {
      expect(entry).toContain(className)
    }
  })
})
