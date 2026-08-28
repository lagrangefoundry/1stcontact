import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * REQ-154 — the two claims about this change that only a structural test can
 * make, because both are about what is ABSENT.
 *
 * AC1: no `playwright` import is reachable from the Worker bundle. That cannot
 * be asserted by running anything — a Worker that imported Playwright would
 * fail at *bundle* time, in a deploy, long after every test had passed. So the
 * import graph is walked from the Worker's real entry point and the answer is
 * read off it.
 *
 * The binding parity: `[browser]` is declared for BOTH the default environment
 * and `[env.production]`, because a named wrangler environment inherits neither
 * vars nor bindings. Forgetting the production repeat is not a silent
 * degradation — the deployed Worker sees no binding at all — and it is exactly
 * the failure this file's siblings already pin for D1, R2 and the assets binding.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const read = (rel: string): string => fs.readFileSync(path.join(REPO, rel), 'utf8')

/** Every relative specifier a module imports or re-exports, resolved to a file. */
function localImports(file: string): string[] {
  const src = fs.readFileSync(file, 'utf8')
  const out: string[] = []
  const pattern = /(?:from|import)\s*(?:\(\s*)?['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = pattern.exec(src)) !== null) {
    const spec = m[1]
    if (!spec.startsWith('.')) continue
    const base = path.resolve(path.dirname(file), spec.replace(/\?raw$/, ''))
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.js`,
      path.join(base, 'index.ts'),
      path.join(base, 'index.js'),
    ]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        out.push(candidate)
        break
      }
    }
  }
  return out
}

/** Every bare (package) specifier a module imports. */
function packageImports(file: string): string[] {
  const src = fs.readFileSync(file, 'utf8')
  const out: string[] = []
  const pattern = /(?:from|import)\s*(?:\(\s*)?['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = pattern.exec(src)) !== null) {
    if (!m[1].startsWith('.')) out.push(m[1])
  }
  return out
}

/** Every `.ts` file under `dir`, excluding declaration files. */
function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) out.push(full)
  }
  return out.sort()
}

/** Transitive closure of local modules reachable from `entry`. */
function reachable(entry: string): Set<string> {
  const seen = new Set<string>()
  const stack = [entry]
  while (stack.length > 0) {
    const file = stack.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    for (const next of localImports(file)) stack.push(next)
  }
  return seen
}

describe('REQ-154 AC1 — the Worker bundle cannot reach Playwright', () => {
  const entries = [
    'apps/control-app/src/index.ts',
    // The screenshot capability itself, entered directly, so its own graph is
    // checked even before a route reaches it.
    'apps/control-app/src/shot.ts',
  ]

  it('test_UAT_FC_REQ_154_no_playwright_reachable_from_the_worker', () => {
    for (const entry of entries) {
      const graph = reachable(path.join(REPO, entry))
      const offenders: string[] = []
      for (const file of graph) {
        if (packageImports(file).some((p) => p === 'playwright' || p.startsWith('playwright/'))) {
          offenders.push(path.relative(REPO, file))
        }
      }
      expect(offenders, `${entry} reaches Playwright through: ${offenders.join(', ')}`).toEqual([])
    }
  })

  it('test_UAT_FC_REQ_154_worker_never_imports_the_capture_barrel', () => {
    // The barrel re-exports `playwright-driver`, so importing it is how
    // Playwright would arrive without anyone naming it. Deep paths are the
    // convention `router.ts` already follows for every tools/generate import.
    for (const entry of entries) {
      for (const file of reachable(path.join(REPO, entry))) {
        if (!file.startsWith(path.join(REPO, 'apps'))) continue
        const rel = path.relative(REPO, file)
        const src = fs.readFileSync(file, 'utf8')
        expect(src, rel).not.toMatch(/from\s+['"][^'"]*cli\/capture['"]/)
      }
    }
  })

  it('test_UAT_FC_REQ_154_puppeteer_is_named_in_exactly_one_place', () => {
    // ONE composition root, across the whole repo. A second
    // `@cloudflare/puppeteer` import would be a second place deciding how a
    // browser is acquired, which is how a lease stops being the only lease.
    //
    // Swept over every source file rather than over a reachability graph on
    // purpose: `shot.ts` is deliberately not yet reached from `index.ts` — no
    // route answers it, because exposing a metered session over HTTP is a
    // decision about rate limiting and belongs to [[REQ-157]] — so a graph walk
    // from the Worker's entry point would pass vacuously.
    const namers: string[] = []
    for (const dir of ['apps', 'tools', 'packages']) {
      for (const file of walk(path.join(REPO, dir))) {
        if (packageImports(file).some((p) => p.startsWith('@cloudflare/puppeteer'))) {
          namers.push(path.relative(REPO, file))
        }
      }
    }
    expect(namers).toEqual(['apps/control-app/src/shot.ts'])
  })

  it('test_UAT_FC_REQ_154_the_cf_driver_names_no_browser_library', () => {
    // The driver is pure: it declares the puppeteer-shaped surface it uses and
    // the host supplies the library. That is what lets a test drive the real
    // driver, and what keeps the CLI's bundle free of a Worker-only dependency.
    const src = read('tools/generate/src/cli/capture/cf-driver.ts')
    expect(src).not.toMatch(/['"]@cloudflare\/puppeteer['"]/)
    expect(src).not.toMatch(/['"]playwright['"]/)
  })
})

describe('REQ-154 — the browser binding is declared on both sides', () => {
  it('test_UAT_FC_REQ_154_browser_binding_declared_for_dev_and_production', () => {
    const toml = read('apps/control-app/wrangler.toml')
    expect(toml).toMatch(/^\[browser\]$/m)
    expect(toml).toMatch(/^\[env\.production\.browser\]$/m)
    // Both name the same binding, or the deployed Worker reads a key the code
    // never looks for.
    expect(toml.match(/binding = "BROWSER"/g) ?? []).toHaveLength(2)
  })

  it('test_UAT_FC_REQ_154_puppeteer_is_a_declared_dependency', () => {
    // pnpm is strict: an undeclared import resolves in the repo root and fails
    // in a deploy, which is the worst place to find out.
    const pkg = JSON.parse(read('apps/control-app/package.json')) as {
      dependencies?: Record<string, string>
    }
    expect(pkg.dependencies?.['@cloudflare/puppeteer']).toBeTruthy()
  })
})

describe('REQ-154 AC5 — one copy of the capture preconditions', () => {
  it('test_UAT_FC_REQ_154_page_scripts_have_a_single_source', () => {
    // The scripts moved out of the Playwright driver so the second driver could
    // share them rather than grow a second copy. A duplicate would not fail —
    // it would drift, and a drifted capture succeeds while measuring the wrong
    // page, which is the failure shape this whole ticket is about.
    const scripts = read('tools/generate/src/cli/capture/page-scripts.ts')
    expect(scripts).toContain('animation-delay:0s!important')
    expect(scripts).toContain('document.createTreeWalker')

    for (const driver of ['playwright-driver', 'cf-driver']) {
      const src = read(`tools/generate/src/cli/capture/${driver}.ts`)
      expect(src, driver).toContain("from './page-scripts'")
      // The literals themselves, not the prose about them: both drivers still
      // explain what settle and the font barrier are for, and should.
      expect(src, driver).not.toContain('animation-delay:0s!important')
      expect(src, driver).not.toContain('document.createTreeWalker')
    }
  })
})
