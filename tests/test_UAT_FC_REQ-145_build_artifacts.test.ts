import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { MODULE_CSS, MODULE_CLIENT_JS } from '../packages/framework/src/modules/module-assets'
import { composeModuleAssets } from '../tools/generate/src/cli/module-assets'
import { readWranglerConfig } from './support/wrangler-toml'

/**
 * REQ-145 — the build artifacts, and the configuration that has to agree with them.
 *
 * TWO KINDS OF CLAIM LIVE HERE, and both are about things that fail SILENTLY.
 *
 * A generated file that goes stale serves last week's bytes with nothing to
 * signal it — the module chrome would simply stop matching the `.astro` sources
 * it was extracted from, and the first symptom would be a page styled slightly
 * wrong. So it is re-extracted and compared, rather than trusted.
 *
 * And a `wrangler.toml` key in the wrong place is accepted, ignored, and then
 * absent: `migrations_dir` sat at the top level since REQ-143, where wrangler
 * warns and looks somewhere else, so `d1 migrations apply` had never once run.
 * The same class of mistake in `[env.production.vars]` would be a security hole
 * rather than an inconvenience.
 */

const REPO = path.resolve(__dirname, '..')
const WRANGLER = path.join(REPO, 'apps/control-app/wrangler.toml')
// The repo's own reader (REQ-144), rather than a TOML dependency added for one
// file: it reports declared vars and bindings per environment, which is exactly
// what the inheritance claims below are about.
const config = readWranglerConfig(WRANGLER)
const toml = readFileSync(WRANGLER, 'utf8')

describe('REQ-145 — build artifacts and the config that must match them', () => {
  it('test_UAT_FC_REQ-145_precompiled_module_chrome_matches_its_sources', async () => {
    // The drift guard. `1c assets` writes `module-assets.ts` from the modules'
    // `styles.css` and `client.js` (REQ-148 moved the chrome out of an `.astro`
    // `<style>` block and deleted the scanner); this re-reads the same sources
    // and demands the same bytes. Editing a module and
    // forgetting to rebuild fails HERE rather than in a render nobody inspects.
    const fresh = composeModuleAssets(REPO)
    expect(MODULE_CSS).toBe(fresh.css)
    expect(MODULE_CLIENT_JS).toBe(fresh.clientJs)

    // Non-vacuous: the catalog does ship chrome, so an empty generated file
    // would not quietly satisfy the comparison above.
    expect(MODULE_CSS.length).toBeGreaterThan(0)
    expect(MODULE_CLIENT_JS.length).toBeGreaterThan(0)
    expect(fresh.cssIds).toContain('contact-form')
  })

  it('test_UAT_FC_REQ-145_the_render_reaches_no_astro_and_no_filesystem', async () => {
    // The property the whole ticket rests on, asserted against the SOURCE rather
    // than against a successful run: `render.ts` is bundled into a Worker, and a
    // bundler resolves a static specifier whether or not the branch executes. So
    // naming `astro/container` or the framework BARREL anywhere in this file —
    // even inside a dynamic `import()` behind an untaken `if` — puts them in the
    // Worker's bundle. That is exactly how it failed the first time.
    //
    // REQ-148 removed the reason the registry was on this list (its components
    // were `.astro`); `render.ts` reaches `getModule` through the worker entry
    // now, so the registry assertion below holds for a different reason — the
    // direct path is simply not the one it uses.
    const render = readFileSync(path.join(REPO, 'tools/generate/src/render/render.ts'), 'utf8')
    const runtime = render
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      .filter((line) => !/^import type /.test(line))
      .join('\n')

    expect(runtime).not.toMatch(/import\(['"]astro/)
    expect(runtime).not.toMatch(/from ['"]astro\/container['"]/)
    expect(runtime).not.toMatch(/framework\/registry/)
    expect(runtime).not.toMatch(/node:fs|node:path/)
    // And the barrel, which re-exports the registry, is not reachable either.
    expect(runtime).not.toMatch(/from ['"]@1stcontact\/framework['"]/)
  })

  it('test_UAT_FC_REQ-145_production_vars_do_not_carry_the_dev_access_bypass', async () => {
    // THE SECURITY CONTROL, and it is an ABSENCE — which is why it needs a test:
    // nothing about the file's shape would announce its return. `ACCESS_DEV_OPEN`
    // opens an unconfigured gate, and a named environment inherits no vars, so
    // the top-level declaration cannot reach production. Restating it here would.
    expect(config.topLevel.vars).toContain('ACCESS_DEV_OPEN')
    expect(config.envs.production.vars).not.toContain('ACCESS_DEV_OPEN')
  })

  it('test_UAT_FC_REQ-145_every_var_and_binding_is_repeated_under_production', async () => {
    // A named environment inherits NEITHER vars nor bindings, so an omission is
    // not a degradation — the deployed Worker sees the key as simply absent.
    // This is the same pin REQ-144 put on BUILDER_ORIGIN after that exact bug.
    for (const key of ['TENANT_ID', 'ACCESS_TEAM_DOMAIN', 'ACCESS_AUD']) {
      expect(config.envs.production.vars, key).toContain(key)
    }
    for (const binding of ['d1_databases:DB', 'r2_buckets:SITES', 'assets:ASSETS']) {
      expect(config.envs.production.bindings, binding).toContain(binding)
    }
  })

  it('test_UAT_FC_REQ-145_the_worker_runs_before_the_assets_binding', async () => {
    // Not a routing preference. The Access gate lives in `fetch`, so bytes the
    // assets binding serves BEFORE the Worker are bytes served to anyone —
    // `/builder/*` and `/webui/*` among them. Running the Worker first is what
    // puts every asset behind the same verified identity as every route.
    // Both blocks, because a named environment inherits neither.
    expect(toml.match(/^run_worker_first = true$/gm)).toHaveLength(2)
    expect(toml.match(/^directory = "\.\/dist-assets"$/gm)).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-145_migrations_dir_sits_on_the_database_not_the_top_level', async () => {
    // Declared at the top level it is an unknown key: wrangler warns, ignores it,
    // and looks in `apps/control-app/migrations`, which does not exist — so
    // `d1 migrations apply` silently did nothing from REQ-143 until this ticket.
    // The key must never appear before the first table header, which is what
    // "top level" means to wrangler.
    const beforeFirstTable = toml.slice(0, toml.search(/^\[/m))
    expect(beforeFirstTable).not.toMatch(/^migrations_dir/m)
    expect(toml.match(/^migrations_dir = "\.\.\/\.\.\/db\/migrations"$/gm)).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-145_the_proxy_and_its_origin_var_are_gone', async () => {
    // AC-4. Deleted, not disabled — `CLAUDE.md`: when replacing an approach,
    // delete the old one rather than leaving it behind a flag.
    const worker = readFileSync(path.join(REPO, 'apps/control-app/src/index.ts'), 'utf8')
    expect(worker).not.toMatch(/BUILDER_ORIGIN/)
    expect(toml).not.toMatch(/BUILDER_ORIGIN/)
  })
})
