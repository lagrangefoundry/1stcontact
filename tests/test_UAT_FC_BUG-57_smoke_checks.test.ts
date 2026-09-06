import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import {
  runSmoke,
  // @ts-expect-error — plain JS with no type declarations, deliberately: it has
  // to run from a shell straight after a deploy with no transform available.
} from '../tools/generate/bin/smoke.mjs'

/**
 * BUG-57 — `bin/smoke` skipped nine of its eleven checks.
 *
 * Five of them addressed `/site/<slug>/draft/<sha>/…`, a channel REQ-149 D7
 * deleted along with the `1c deploy` that was its only producer. They could
 * never pass: without `--draft` they skipped forever, and with it they would
 * have failed against a route the grammar no longer has. The other four were
 * argument-gated, and two of those arguments were stale or derivable.
 *
 * WHAT IS ASSERTED HERE is the shape of the result rather than a count: no check
 * in the file may be unreachable, and every skip must name the one argument that
 * would make it run. A count would go stale the next time a check is added; the
 * property will not.
 */

const REPO = path.resolve(import.meta.dirname, '..')
const SMOKE = path.join(REPO, 'tools', 'generate', 'bin', 'smoke.mjs')

const SITE_KEY = 'site_a3f9c1d2e4b5f6a7'
const ORIGIN = 'https://example.test'
const ROOT = `${ORIGIN}/site/${SITE_KEY}`

interface Check {
  name: string
  status: 'pass' | 'fail' | 'skip'
  detail: string
}
interface Report {
  ok: boolean
  checks: Check[]
  failed: Check[]
}

/** A fake origin serving one published site correctly. */
function publishedOrigin(overrides: Record<string, () => Response> = {}) {
  const html =
    '<!doctype html><html><head>' +
    '<link rel="stylesheet" href="./theme.css">' +
    '</head><body><img src="./assets/logo.svg" alt=""></body></html>'
  const css = '@font-face{font-family:X;src:url("./fonts/x.woff2") format("woff2")}'

  const ok = (body: string, type: string) =>
    new Response(body, {
      status: 200,
      headers: { 'content-type': type, 'cache-control': 'public, max-age=60' },
    })
  const notFound = () =>
    new Response('Not Found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })

  const table: Record<string, () => Response> = {
    [`${ORIGIN}/`]: () =>
      new Response('Hello', {
        status: 200,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      }),
    [ROOT]: () => new Response(null, { status: 301, headers: { location: `/site/${SITE_KEY}/` } }),
    [`${ROOT}/`]: () => ok(html, 'text/html; charset=utf-8'),
    [`${ROOT}/theme.css`]: () => ok(css, 'text/css; charset=utf-8'),
    [`${ROOT}/assets/logo.svg`]: () => ok('<svg/>', 'image/svg+xml'),
    [`${ROOT}/fonts/x.woff2`]: () => ok('font-bytes', 'font/woff2'),
    ...overrides,
  }

  return async (input: string | URL) => (table[String(input)] ?? notFound)()
}

const smoke = (opts: Record<string, unknown>): Promise<Report> =>
  runSmoke({ origin: ORIGIN, fetch: publishedOrigin(), ...opts }) as Promise<Report>

/** Run the real script as a process, so an argument error is the operator's. */
function runCli(args: string[]): { code: number; all: string } {
  try {
    const out = execFileSync('node', [SMOKE, ...args], {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { code: 0, all: out }
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string }
    return { code: e.status ?? 1, all: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}

describe('BUG-57 — every smoke check is reachable', () => {
  /**
   * The defect itself, as a property rather than a count.
   *
   * A check that cannot run under ANY arguments proves nothing while looking
   * like coverage, which is exactly how five checks for a deleted channel
   * survived. Supplying every input the script takes must leave nothing skipped.
   */
  it('test_UAT_FC_BUG-57_no_check_can_only_ever_skip', async () => {
    const report = await smoke({
      siteKey: SITE_KEY,
      controlOrigin: 'https://control.example.test',
      workersDevOrigin: 'https://control.example.workers.dev',
      fetch: publishedOrigin({
        'https://control.example.test/': () =>
          new Response(null, {
            status: 302,
            headers: { location: 'https://team.cloudflareaccess.com/cdn-cgi/access/login' },
          }),
        'https://control.example.workers.dev/': () => new Response('Not Found', { status: 404 }),
      }),
    })

    expect(report.checks.length).toBeGreaterThan(0)
    expect(report.checks.filter((c) => c.status === 'skip').map((c) => c.name)).toEqual([])
    expect(report.failed.map((c) => c.name)).toEqual([])
    expect(report.ok).toBe(true)
  })

  /** Every skip names the ONE argument that would make that check run. */
  it('test_UAT_FC_BUG-57_every_skip_names_the_argument_that_would_run_it', async () => {
    const report = await smoke({})
    const flagFor: Record<string, string> = {
      unpublished_site_indistinguishable: '--site-key',
      published_root_redirects: '--site-key',
      published_index_serves_html: '--site-key',
      published_cache_policy: '--site-key',
      published_miss_is_404: '--site-key',
      published_assets_resolve: '--site-key',
      control_app_challenges_unauthenticated: '--control-origin',
      control_app_workers_dev_closed: '--workers-dev-origin',
    }

    for (const check of report.checks.filter((c) => c.status === 'skip')) {
      const flag = flagFor[check.name]
      expect(flag, `${check.name} skipped but no argument is known to run it`).toBeDefined()
      expect(check.detail, `${check.name}'s skip does not name ${flag}`).toContain(flag)
    }
    // A skip never fails the run.
    expect(report.ok).toBe(true)
  })

  /**
   * The draft channel leaves the script WITH the channel.
   *
   * Not stubbed, not left skipping: `--draft` is an unknown argument now, so an
   * operator running the old invocation is told rather than handed a green run
   * that quietly tested nothing.
   */
  it('test_UAT_FC_BUG-57_the_draft_channel_checks_and_flag_are_gone', async () => {
    const report = await smoke({ siteKey: SITE_KEY })
    expect(report.checks.map((c) => c.name).filter((n) => n.startsWith('draft_'))).toEqual([])

    const rejected = runCli(['--origin', ORIGIN, '--draft', 'abc123def456'])
    expect(rejected.code).toBe(1)
    expect(rejected.all).toContain("unknown argument '--draft'")
  })

  /**
   * What the draft checks were worth, on the channel that exists.
   *
   * Table-driven on the FAILURE, because a check that passes against a correct
   * origin and also passes against a broken one is not a check.
   */
  it.each([
    {
      what: 'an index served as something other than HTML',
      at: `${ROOT}/`,
      reply: () =>
        new Response('hello', {
          status: 200,
          headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=60' },
        }),
      check: 'published_index_serves_html',
    },
    {
      what: 'a published page cached as if it were immutable',
      at: `${ROOT}/`,
      reply: () =>
        new Response('<html><img src="./assets/logo.svg"></html>', {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'public, max-age=31536000, immutable',
          },
        }),
      check: 'published_cache_policy',
    },
    {
      what: 'a miss that answers with a listing',
      at: `${ROOT}/smoke-no-such-directory/`,
      reply: () =>
        new Response('<html>index of /</html>', {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
      check: 'published_miss_is_404',
    },
    {
      what: 'a font reached from inside the stylesheet served as generic bytes',
      at: `${ROOT}/fonts/x.woff2`,
      reply: () =>
        new Response('font', {
          status: 200,
          headers: { 'content-type': 'application/octet-stream' },
        }),
      check: 'published_assets_resolve',
    },
  ])(
    'test_UAT_FC_BUG-57_the_published_channel_carries_the_draft_checks_coverage — $what',
    async ({ at, reply, check }) => {
      const healthy = await smoke({ siteKey: SITE_KEY })
      expect(healthy.checks.find((c) => c.name === check)?.status, `${check} did not run`).toBe(
        'pass',
      )

      const broken = await smoke({
        siteKey: SITE_KEY,
        fetch: publishedOrigin({ [at]: reply }),
      })
      expect(broken.ok).toBe(false)
      expect(broken.failed.map((c) => c.name)).toContain(check)
      const failure = broken.failed.find((c) => c.name === check)!
      expect(failure.detail.length, 'a failure must say what it expected').toBeGreaterThan(0)
    },
  )

  /**
   * REQ-190 — the first path segment is the site's own key, not a chosen name.
   *
   * The rename is loud rather than aliased. `--slug` silently accepted would go
   * on smoking whatever the operator typed while the word said something the
   * URL grammar stopped meaning.
   */
  it('test_UAT_FC_BUG-57_the_url_segment_is_a_site_key_not_a_slug', async () => {
    const report = await smoke({ siteKey: SITE_KEY })
    const names = report.checks.map((c) => c.name)
    expect(names).toContain('unknown_site_not_found')
    expect(names).toContain('unpublished_site_indistinguishable')
    expect(names.filter((n) => n.includes('slug'))).toEqual([])

    const rejected = runCli(['--origin', ORIGIN, '--slug', 'acme'])
    expect(rejected.code).toBe(1)
    expect(rejected.all).toContain("unknown argument '--slug'")

    // The key reaches the URL it addresses, so a run names the site it tested.
    const seen: string[] = []
    await runSmoke({
      origin: ORIGIN,
      siteKey: SITE_KEY,
      fetch: async (input: string | URL) => {
        seen.push(String(input))
        return publishedOrigin()(input)
      },
    })
    expect(seen).toContain(`${ROOT}/`)
  })

  /**
   * The control app's gate is checked without being told where it is.
   *
   * Its hostname is not an operator choice for the apex this repo deploys —
   * control-app declares exactly one route, `app.1stcontact.io/*`. Requiring it
   * on the command line is what left the REQ-147 assertion skipped on every
   * default run.
   */
  it('test_UAT_FC_BUG-57_control_origin_is_derived_from_the_default_apex', async () => {
    const asked: string[] = []
    const challenge = async (input: string | URL) => {
      asked.push(String(input))
      return new Response(null, {
        status: 302,
        headers: { location: 'https://lagrangefoundry.cloudflareaccess.com/cdn-cgi/access/login' },
      })
    }

    const derived = (await runSmoke({ fetch: challenge })) as Report
    const gate = derived.checks.find((c) => c.name === 'control_app_challenges_unauthenticated')!
    expect(gate.status).toBe('pass')
    expect(asked).toContain('https://app.1stcontact.io/')

    // An explicit origin still wins over the derivation.
    const named: string[] = []
    await runSmoke({
      controlOrigin: 'https://control.example.test',
      fetch: async (input: string | URL) => {
        named.push(String(input))
        return challenge(input)
      },
    })
    expect(named).toContain('https://control.example.test/')
    expect(named).not.toContain('https://app.1stcontact.io/')
  })

  /**
   * The derivation does NOT generalise, and that is the point.
   *
   * `app.<host>` of an arbitrary `--origin` would reach a hostname that is not
   * the control app — usually one that does not resolve — and report a FAILING
   * gate for it. A false alarm on the assertion that says "the builder is not
   * public" is worse than a skip, so anything but the known apex must be named.
   */
  it('test_UAT_FC_BUG-57_a_non_default_origin_derives_nothing_and_skips', async () => {
    const asked: string[] = []
    const report = (await runSmoke({
      origin: 'https://staging.example',
      fetch: async (input: string | URL) => {
        asked.push(String(input))
        return String(input) === 'https://staging.example/'
          ? new Response('Hello', {
              status: 200,
              headers: { 'content-type': 'text/plain; charset=utf-8' },
            })
          : new Response('Not Found', { status: 404 })
      },
    })) as Report

    const gate = report.checks.find((c) => c.name === 'control_app_challenges_unauthenticated')!
    expect(gate.status).toBe('skip')
    expect(gate.detail).toContain('--control-origin')
    expect(asked.some((u) => u.startsWith('https://app.'))).toBe(false)
    // A skip, not a failure: the run is still green.
    expect(report.ok).toBe(true)
  })

  /**
   * The workers.dev hostname stays explicit, because it cannot be derived: it
   * embeds the account subdomain, which is nowhere in this repo. Guessing it
   * would assert against a hostname belonging to somebody else.
   */
  it('test_UAT_FC_BUG-57_workers_dev_origin_stays_explicit', async () => {
    const report = await smoke({ siteKey: SITE_KEY })
    const check = report.checks.find((c) => c.name === 'control_app_workers_dev_closed')!
    expect(check.status).toBe('skip')
    expect(check.detail).toContain('--workers-dev-origin')

    const given = await smoke({
      siteKey: SITE_KEY,
      workersDevOrigin: 'https://control.example.workers.dev',
      fetch: publishedOrigin({
        'https://control.example.workers.dev/': () => new Response('Not Found', { status: 404 }),
      }),
    })
    expect(given.checks.find((c) => c.name === 'control_app_workers_dev_closed')?.status).toBe(
      'pass',
    )
  })

  /**
   * The published cache policy stated here and the one the Worker sets are the
   * same value — restated across a deployment boundary, so pinned rather than
   * hoped at, the arrangement the content-type table already documents.
   */
  it('test_UAT_FC_BUG-57_the_published_cache_policy_matches_the_worker', async () => {
    const worker = execFileSync(
      'node',
      [
        '-e',
        "const s=require('fs').readFileSync('apps/public-site/src/index.ts','utf8');" +
          "const m=/const PUBLISHED_CACHE = '([^']+)'/.exec(s);process.stdout.write(m?m[1]:'')",
      ],
      { cwd: REPO, encoding: 'utf8' },
    )
    expect(worker).not.toBe('')

    // Serving under the Worker's own value passes; serving under anything else
    // fails — which is what makes this a pin and not a restatement.
    const agreeing = await smoke({
      siteKey: SITE_KEY,
      fetch: publishedOrigin({
        [`${ROOT}/`]: () =>
          new Response('<html><img src="./assets/logo.svg"></html>', {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': worker },
          }),
      }),
    })
    expect(agreeing.failed.map((c) => c.name)).toEqual([])
  })
})
