import { describe, it, expect } from 'vitest'
import { execFileSync, } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  runSmoke,
  formatReport,
  // @ts-expect-error — plain JS with no type declarations, deliberately: it has
  // to run from a shell straight after a deploy with no transform available.
} from '../tools/generate/bin/smoke.mjs'

/**
 * BUG-136 — `bin/smoke` skipped seven of ten checks, and four needed no argument.
 *
 * Six of the seven skipped for one reason: no `--site-key`. A check that only
 * runs when an operator remembers a flag is a check that will not run, and this
 * is the assertion surface for *did the deploy actually serve anything* — the one
 * moment it exists for is the moment nobody is in a position to supply an
 * argument.
 *
 * FOUR OF THE SIX NEVER NEEDED A KEY. `APEX_SITE_KEY` names a published site
 * served at the ROOT of the host, and `apps/public-site/src/index.ts` routes
 * `apex` and `asset` through one branch into one `serve()` — so on a deployment
 * that has published its apex, `/` IS a published site root with the same
 * headers, the same 404-on-miss and the same assets to crawl. Those four now run
 * with no flag; the two that assert the `/site/<key>/` grammar itself still need
 * one and say so in those words.
 *
 * AND WHAT DOES NOT RUN SAYS WHY IN ONE OF TWO WORDS — `skip` for *nobody gave
 * me an argument*, `n/a` for *this deployment has nothing for me to assert
 * against*, which is also what a check reports instead of a pass when it
 * compared nothing.
 */

const REPO = path.resolve(import.meta.dirname, '..')
const SMOKE = path.join(REPO, 'tools', 'generate', 'bin', 'smoke.mjs')

const ORIGIN = 'https://apex.test'
const SITE_KEY = 'site_a3f9c1d2e4b5f6a7'

interface Check {
  name: string
  status: 'pass' | 'fail' | 'skip' | 'na'
  detail: string
}
interface Report {
  ok: boolean
  checks: Check[]
  failed: Check[]
}

/** The four assertions that need only a published ROOT, in report order. */
const ROOT_ONLY_CHECKS = [
  'published_index_serves_html',
  'published_cache_policy',
  'published_miss_is_404',
  'published_assets_resolve',
]

/** The two that assert the `/site/<key>/` grammar and genuinely need a key. */
const KEY_ONLY_CHECKS = ['unpublished_site_indistinguishable', 'published_root_redirects']

const INDEX_HTML =
  '<!doctype html><html><head><link rel="stylesheet" href="./theme.css"></head>' +
  '<body><img src="./assets/logo.svg" alt=""></body></html>'
const THEME_CSS = '@font-face{font-family:X;src:url("./fonts/x.woff2") format("woff2")}'

function served(body: string, type: string, extra: Record<string, string> = {}): Response {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': type, 'cache-control': 'public, max-age=60', ...extra },
  })
}

const notFound = (): Response =>
  new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } })

/**
 * An origin that HAS published its apex — the deployment the ticket's "done
 * looks like" describes.
 *
 * The site lives at the root of the host, so the index, the stylesheet, the
 * image and the font hang off `/` rather than off any `/site/<key>/` prefix.
 * `rootAt` builds the same site under an arbitrary prefix, which is how the
 * `--site-key` case below gets a second target on the same fake origin.
 */
function siteUnder(prefix: string): Record<string, () => Response> {
  return {
    [`${ORIGIN}${prefix}/`]: () => served(INDEX_HTML, 'text/html; charset=utf-8'),
    [`${ORIGIN}${prefix}/theme.css`]: () => served(THEME_CSS, 'text/css; charset=utf-8'),
    [`${ORIGIN}${prefix}/assets/logo.svg`]: () => served('<svg/>', 'image/svg+xml'),
    [`${ORIGIN}${prefix}/fonts/x.woff2`]: () => served('font-bytes', 'font/woff2'),
  }
}

function publishedApex(overrides: Record<string, () => Response> = {}) {
  const table: Record<string, () => Response> = { ...siteUnder(''), ...overrides }
  const seen: string[] = []
  const fetchImpl = async (input: string | URL) => {
    seen.push(String(input))
    return (table[String(input)] ?? notFound)()
  }
  return { fetchImpl, seen }
}

const named = (report: Report, name: string): Check => report.checks.find((c) => c.name === name)!

describe('BUG-136 — every check that can run against a deployment does', () => {
  /**
   * THE DEFECT, as the ticket states it: no arguments, an apex that serves, and
   * the four checks that have never run against this product run.
   *
   * Asserted as passes rather than as "not skipped", because a check reported
   * without having made its request is the thing being fixed.
   */
  it('test_UAT_FC_BUG-136_the_root_only_checks_run_with_no_arguments', async () => {
    const { fetchImpl, seen } = publishedApex()
    const report = (await runSmoke({ origin: ORIGIN, fetch: fetchImpl })) as Report

    for (const name of ROOT_ONLY_CHECKS) {
      const check = named(report, name)
      expect(check.status, `${name}: ${check.detail}`).toBe('pass')
    }
    expect(report.ok).toBe(true)

    // They addressed the APEX and not a `/site/<key>/` prefix — the crawl, the
    // miss and the index are all requests against `/`.
    expect(seen).toContain(`${ORIGIN}/`)
    expect(seen).toContain(`${ORIGIN}/theme.css`)
    expect(seen).toContain(`${ORIGIN}/fonts/x.woff2`)
    expect(seen).toContain(`${ORIGIN}/smoke-no-such-asset.css`)
    expect(seen.filter((u) => u.includes('/site/'))).toEqual([
      // Only the fixed absent key, which is `unknown_site_not_found`'s business.
      `${ORIGIN}/site/smoke-absent-site-do-not-deploy/`,
    ])

    // The asset crawl reports what it verified rather than claiming a pass over
    // nothing — the stylesheet, the image and the font reached from inside it.
    expect(named(report, 'published_assets_resolve').detail).toMatch(/3 assets/)
    expect(named(report, 'published_assets_resolve').detail).toContain('apex')
  })

  /**
   * And each of the four FAILS against an apex broken in the way it owns.
   *
   * Table-driven on the breakage, because a check that passes against a correct
   * origin and also against a broken one is not a check.
   */
  it.each([
    {
      // NOT `text/plain` — an apex answering something that is not a page at all
      // is an origin with no published apex rather than a broken one, and the
      // check skips instead (the case below owns that). What a BROKEN published
      // apex looks like is HTML served with the wrong type, which is what a
      // Worker that stopped setting the charset would produce.
      what: 'an index whose content type lost its charset',
      at: `${ORIGIN}/`,
      reply: () => served(INDEX_HTML, 'text/html'),
      check: 'published_index_serves_html',
      also: [],
    },
    {
      what: 'an apex cached as if it were immutable',
      at: `${ORIGIN}/`,
      reply: () =>
        served(INDEX_HTML, 'text/html; charset=utf-8', {
          'cache-control': 'public, max-age=31536000, immutable',
        }),
      check: 'published_cache_policy',
      also: [],
    },
    {
      what: 'a miss that answers with a directory listing',
      at: `${ORIGIN}/smoke-no-such-directory/`,
      reply: () => served('<html>index of /</html>', 'text/html; charset=utf-8'),
      check: 'published_miss_is_404',
      also: [],
    },
    {
      what: 'a font reached from inside the stylesheet served as generic bytes',
      at: `${ORIGIN}/fonts/x.woff2`,
      reply: () => served('font', 'application/octet-stream'),
      check: 'published_assets_resolve',
      also: [],
    },
  ])(
    'test_UAT_FC_BUG-136_a_broken_apex_fails_the_check_that_owns_it — $what',
    async ({ at, reply, check, also }) => {
      const { fetchImpl } = publishedApex({ [at]: reply })
      const report = (await runSmoke({ origin: ORIGIN, fetch: fetchImpl })) as Report

      expect(report.ok).toBe(false)
      expect(report.failed.map((c) => c.name).sort()).toEqual([check, ...also].sort())
      expect(named(report, check).detail.length, 'a failure must say what it expected').toBeGreaterThan(0)
    },
  )

  /**
   * `--site-key` still names the target, and still wins.
   *
   * An operator who names a site wants THAT site smoked; a run that quietly
   * asserted against the apex instead would be answering a question nobody
   * asked. The apex serves here too, so this is the case where the two could
   * have been confused.
   */
  it('test_UAT_FC_BUG-136_an_explicit_site_key_is_the_target_the_checks_address', async () => {
    const { fetchImpl, seen } = publishedApex({
      ...siteUnder(`/site/${SITE_KEY}`),
      [`${ORIGIN}/site/${SITE_KEY}`]: () =>
        new Response(null, { status: 301, headers: { location: `/site/${SITE_KEY}/` } }),
    })
    const report = (await runSmoke({ origin: ORIGIN, siteKey: SITE_KEY, fetch: fetchImpl })) as Report

    for (const name of ROOT_ONLY_CHECKS) {
      expect(named(report, name).status, `${name}: ${named(report, name).detail}`).toBe('pass')
      expect(named(report, name).detail).toContain(`/site/${SITE_KEY}/`)
    }
    expect(named(report, 'published_root_redirects').status).toBe('pass')
    // The crawl walked the keyed root rather than the apex.
    expect(seen).toContain(`${ORIGIN}/site/${SITE_KEY}/theme.css`)
    expect(seen).not.toContain(`${ORIGIN}/theme.css`)
  })

  /**
   * The two that genuinely need a key report that they were NOT ASKED TO RUN —
   * distinguishably from checks that could have run against this deployment and
   * did not.
   */
  it('test_UAT_FC_BUG-136_the_two_key_only_checks_say_a_key_is_what_they_need', async () => {
    const { fetchImpl } = publishedApex()
    const report = (await runSmoke({ origin: ORIGIN, fetch: fetchImpl })) as Report

    for (const name of KEY_ONLY_CHECKS) {
      const check = named(report, name)
      expect(check.status, `${name} should be skipped without a key`).toBe('skip')
      expect(check.detail).toContain('--site-key')
    }
    // Each says what only a key has, rather than sharing one generic reason.
    expect(named(report, 'published_root_redirects').detail).toContain('/site/<key>')
    expect(named(report, 'unpublished_site_indistinguishable').detail).toContain('published nothing')
    // A skip never fails the run.
    expect(report.ok).toBe(true)
  })

  /**
   * A check that asserts nothing does not report `pass`.
   *
   * `unpublished_site_indistinguishable` guards a cross-tenant leak and used to
   * report green, with an explanatory detail line, on the branch where it
   * compared nothing at all.
   */
  it('test_UAT_FC_BUG-136_a_check_that_compared_nothing_reports_na_not_pass', async () => {
    const { fetchImpl } = publishedApex({
      ...siteUnder(`/site/${SITE_KEY}`),
      [`${ORIGIN}/site/${SITE_KEY}`]: () =>
        new Response(null, { status: 301, headers: { location: `/site/${SITE_KEY}/` } }),
    })
    const live = (await runSmoke({ origin: ORIGIN, siteKey: SITE_KEY, fetch: fetchImpl })) as Report
    const check = named(live, 'unpublished_site_indistinguishable')

    expect(check.status).toBe('na')
    expect(check.detail).toContain('asserted nothing')
    // Not a failure either — the deployment is not broken.
    expect(live.ok).toBe(true)

    // Given a key that exists and has published nothing, it asserts and passes.
    // The four root-only checks address the apex here, which is why this fixture
    // can hold an unpublished key and a serving root at the same time.
    const unpublished = publishedApex()
    const clean = (await runSmoke({
      origin: ORIGIN,
      siteKey: SITE_KEY,
      fetch: unpublished.fetchImpl,
    })) as Report
    expect(named(clean, 'unpublished_site_indistinguishable').status).toBe('pass')
    expect(named(clean, 'unpublished_site_indistinguishable').detail).toContain('identical bodies')
  })

  /**
   * The summary gives the two non-outcomes DIFFERENT WORDS.
   *
   * "Skipped" for both is how seven unrun checks read as one uniform kind of
   * debt: one is answered by supplying an argument and the other by deploying
   * something, and an operator cannot tell which to do from a single count.
   */
  it('test_UAT_FC_BUG-136_the_summary_counts_skips_and_not_applicable_apart', async () => {
    const { fetchImpl } = publishedApex({
      ...siteUnder(`/site/${SITE_KEY}`),
      [`${ORIGIN}/site/${SITE_KEY}`]: () =>
        new Response(null, { status: 301, headers: { location: `/site/${SITE_KEY}/` } }),
    })
    const report = (await runSmoke({ origin: ORIGIN, siteKey: SITE_KEY, fetch: fetchImpl })) as Report
    const text = formatReport(report) as string

    expect(text).toContain('not applicable to this deployment')
    expect(text).toMatch(/\d+ passed, \d+ skipped, 1 not applicable to this deployment\./)
    // The per-check line uses its own mark, so the two are distinguishable in
    // the body as well as in the count.
    expect(text).toContain('n/a  unpublished_site_indistinguishable')

    // With nothing n/a the clause is absent rather than reading ", 0 ...".
    const plain = publishedApex()
    const noNa = (await runSmoke({ origin: ORIGIN, fetch: plain.fetchImpl })) as Report
    expect(formatReport(noNa) as string).not.toContain('not applicable')
  })

  /**
   * An origin whose `/` is NOT a published site index skips rather than failing
   * four checks about a deployment that never claimed to publish an apex.
   *
   * A false alarm is worse than a skip — the script's own rule for
   * `--control-origin` — and the reason names BOTH halves of what would run it.
   */
  it('test_UAT_FC_BUG-136_an_apex_that_is_not_a_site_skips_and_says_what_would_run_it', async () => {
    const table: Record<string, () => Response> = {
      [`${ORIGIN}/`]: () => served('Hello', 'text/plain; charset=utf-8'),
    }
    const report = (await runSmoke({
      origin: ORIGIN,
      fetch: async (input: string | URL) => (table[String(input)] ?? notFound)(),
    })) as Report

    for (const name of ROOT_ONLY_CHECKS) {
      const check = named(report, name)
      expect(check.status, `${name} should not have run`).toBe('skip')
      expect(check.detail, `${name} does not name --site-key`).toContain('--site-key')
      // And it names what the apex actually answered, so the operator can see
      // why the no-flag path did not apply.
      expect(check.detail).toContain('text/plain')
    }
    expect(report.ok).toBe(true)
  })

  /**
   * Against the apex this repo deploys, the reason reaches for the FILE that
   * decides it — `APEX_SITE_KEY` empty is the whole explanation for a 404 at
   * `/`, and an explanation is what turns a skip into an instruction.
   *
   * A line match in the repository this script ships in, not a TOML parser and
   * not a question to D1: the dependency rule the header argues for is about
   * what `bin/smoke` needs INSTALLED to run, and `node:fs` is not that.
   */
  it('test_UAT_FC_BUG-136_the_default_apex_reports_why_it_publishes_nothing', async () => {
    const declared = [
      ...readFileSync(path.join(REPO, 'apps', 'public-site', 'wrangler.toml'), 'utf8').matchAll(
        /^\s*APEX_SITE_KEY\s*=\s*"([^"]*)"/gm,
      ),
    ].map((m) => m[1])
    expect(declared.length, 'public-site declares no APEX_SITE_KEY at all').toBeGreaterThan(0)

    const report = (await runSmoke({
      // No `origin` — the default apex, which is the one the hint is about.
      fetch: async () => notFound(),
    })) as Report
    const detail = named(report, 'published_assets_resolve').detail

    if (declared.every((value) => value === '')) {
      expect(detail).toContain('APEX_SITE_KEY is empty')
      expect(detail).toContain('apps/public-site/wrangler.toml')
    } else {
      // Once an apex key IS configured, the hint would be false, so it is gone.
      expect(detail).not.toContain('APEX_SITE_KEY is empty')
    }

    // The apex failing to resolve is NOT made quieter by any of this.
    expect(named(report, 'apex_resolves').status).toBe('fail')
    expect(report.ok).toBe(false)
  })

  /**
   * The workers.dev check says it is NOT DERIVABLE rather than skipping silently.
   *
   * `--control-origin` is derived for the known apex; this hostname embeds the
   * account's workers.dev subdomain, which is nowhere in this repository, so
   * deriving it would mean asserting against a hostname that may belong to
   * somebody else. The declaration it guards is pinned statically meanwhile —
   * `apps/control-app/wrangler.toml` must say `workers_dev = false`.
   */
  it('test_UAT_FC_BUG-136_the_workers_dev_skip_says_it_cannot_be_derived', async () => {
    const { fetchImpl } = publishedApex()
    const report = (await runSmoke({ origin: ORIGIN, fetch: fetchImpl })) as Report
    const check = named(report, 'control_app_workers_dev_closed')

    expect(check.status).toBe('skip')
    expect(check.detail).toContain('--workers-dev-origin')
    expect(check.detail).toMatch(/cannot be derived/)
    expect(check.detail).toContain('workers_dev = false')

    // The static declaration the message points at is true of the file.
    const toml = readFileSync(path.join(REPO, 'apps', 'control-app', 'wrangler.toml'), 'utf8')
    const declarations = [...toml.matchAll(/^\s*workers_dev\s*=\s*(\w+)/gm)].map((m) => m[1])
    expect(declarations.length).toBeGreaterThan(0)
    expect(declarations.every((v) => v === 'false')).toBe(true)
  })

  /**
   * THE CACHE POLICY HAS TWO LEGAL ANSWERS, and which applies is the response's
   * own — a technical consequence of running this check at the apex.
   *
   * `serve()` rewrites a page carrying account chrome per visitor and marks it
   * `private, no-store` with `vary: cookie`. That is a property of the PAGE, so
   * it is the same at `/` and at `/site/<key>/` — but the apex is this product's
   * front door and therefore the page most likely to carry chrome. A check that
   * knew only the shared policy would report a FAILING cache policy for a
   * correctly-served apex, which is the false alarm this ticket must not create.
   */
  it('test_UAT_FC_BUG-136_a_session_dependent_apex_is_not_a_cache_policy_failure', async () => {
    const worker = readFileSync(path.join(REPO, 'apps', 'public-site', 'src', 'index.ts'), 'utf8')
    const published = /const PUBLISHED_CACHE = '([^']+)'/.exec(worker)?.[1]
    const session = /const SESSION_CACHE = '([^']+)'/.exec(worker)?.[1]
    expect(published, 'the Worker no longer names PUBLISHED_CACHE').toBeTruthy()
    expect(session, 'the Worker no longer names SESSION_CACHE').toBeTruthy()

    // Both constants are restated in the script across a deployment boundary, so
    // both are pinned rather than hoped at.
    const script = readFileSync(SMOKE, 'utf8')
    expect(script).toContain(`const PUBLISHED_CACHE = '${published}'`)
    expect(script).toContain(`const SESSION_CACHE = '${session}'`)

    const chromed = publishedApex({
      [`${ORIGIN}/`]: () =>
        served(INDEX_HTML, 'text/html; charset=utf-8', {
          'cache-control': session!,
          vary: 'cookie',
        }),
    })
    const ok = (await runSmoke({ origin: ORIGIN, fetch: chromed.fetchImpl })) as Report
    expect(named(ok, 'published_cache_policy').status).toBe('pass')
    expect(named(ok, 'published_cache_policy').detail).toContain('vary: cookie')

    // WITHOUT `vary: cookie` the same private policy is a FAILURE: it is what
    // makes every cache downstream agree, and session bytes in a shared cache
    // without it is the leak the private policy exists to prevent.
    const unvaried = publishedApex({
      [`${ORIGIN}/`]: () =>
        served(INDEX_HTML, 'text/html; charset=utf-8', { 'cache-control': session! }),
    })
    const bad = (await runSmoke({ origin: ORIGIN, fetch: unvaried.fetchImpl })) as Report
    expect(bad.failed.map((c) => c.name)).toContain('published_cache_policy')
    expect(named(bad, 'published_cache_policy').detail).toContain(published!)
  })

  /**
   * NO NEW DEPENDENCY, as a fact about the file rather than a promise in its
   * header. `bin/smoke` runs straight after a deploy on whatever Node is there,
   * and a package or a bundler in that path is a new way for the diagnostic to
   * be unavailable at the one moment it is needed.
   */
  it('test_UAT_FC_BUG-136_the_script_imports_only_node_builtins_and_its_own_repo', () => {
    const script = readFileSync(SMOKE, 'utf8')
    const specifiers = [...script.matchAll(/^import\s[^'"]*from\s+'([^']+)'/gm)].map((m) => m[1])
    expect(specifiers.length, 'the script imports nothing at all — has it been rewritten?')
      .toBeGreaterThan(0)
    for (const spec of specifiers) {
      expect(
        spec.startsWith('node:') || spec.startsWith('./') || spec.startsWith('../'),
        `${spec} is a package — bin/smoke must run with no install`,
      ).toBe(true)
    }

    // And it still runs as a process with no arguments beyond an origin, which
    // is the invocation the ticket is about.
    const run = execFileSync('node', [SMOKE, '--help'], { cwd: REPO, encoding: 'utf8' })
    expect(run).toContain('--site-key')
    expect(run).toContain('an n/a means this deployment had')
  })
})
