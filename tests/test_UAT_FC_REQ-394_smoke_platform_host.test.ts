import { describe, expect, it } from 'vitest'
import { runSmoke } from '../tools/generate/bin/smoke.mjs'

/**
 * [[REQ-394]] — **`bin/smoke` checks a claimed platform hostname**, so every
 * `1stc.site` address going dark cannot happen silently again.
 *
 * Driven through `runSmoke` with a fake origin, as the other smoke UATs are:
 * the failure path is the point, and it cannot be produced by breaking a real
 * deploy.
 */

interface Check {
  name: string
  status: string
  detail: string
}

const APEX = 'https://1stcontact.io'

/** A deployment where the platform namespace is routed — or, with `dark`, is not. */
function deployment(opts: { dark?: boolean; serveInsteadOfRedirect?: boolean } = {}) {
  return async (input: string): Promise<Response> => {
    const url = new URL(input)
    if (url.hostname.endsWith('.1stc.site')) {
      if (opts.dark) throw new TypeError('fetch failed: getaddrinfo ENOTFOUND')
      if (url.hostname === '1stcontact.1stc.site') {
        if (opts.serveInsteadOfRedirect) return new Response('<html>', { status: 200 })
        return new Response(null, { status: 301, headers: { location: `${APEX}${url.pathname}${url.search}` } })
      }
      return new Response('Not Found', { status: 404 })
    }
    return new Response('Not Found', { status: 404 })
  }
}

const platformChecks = (checks: Check[]) => checks.filter((c) => c.name.startsWith('platform_host_'))

describe('REQ-394 — smoke checks a platform hostname', () => {
  it('test_UAT_FC_REQ-394_smoke_passes_when_the_apex_sites_platform_hostname_301s_to_the_apex', async () => {
    const report = await runSmoke({ fetch: deployment() })
    expect(report.platformHost).toBe('1stcontact.1stc.site')
    expect(platformChecks(report.checks).map((c: Check) => [c.name, c.status])).toEqual([
      ['platform_host_reaches_its_site', 'pass'],
      ['platform_host_unclaimed_not_found', 'pass'],
    ])
  })

  it('test_UAT_FC_REQ-394_smoke_fails_when_platform_hostnames_do_not_reach_the_worker', async () => {
    const dark = await runSmoke({ fetch: deployment({ dark: true }) })
    expect(dark.ok).toBe(false)
    expect(dark.failed.map((c: Check) => c.name)).toContain('platform_host_reaches_its_site')

    // Served rather than redirected is the second half of the bug, and fails too.
    const served = await runSmoke({ fetch: deployment({ serveInsteadOfRedirect: true }) })
    expect(served.failed.map((c: Check) => c.name)).toContain('platform_host_reaches_its_site')
  })

  it('test_UAT_FC_REQ-394_smoke_takes_any_claimed_platform_hostname_and_skips_when_underivable', async () => {
    const given = await runSmoke({
      origin: 'https://staging.example',
      platformHost: 'alice.1stc.site',
      fetch: async (input: string) =>
        new URL(input).hostname === 'alice.1stc.site'
          ? new Response('<html>', { status: 200 })
          : new Response('Not Found', { status: 404 }),
    })
    expect(platformChecks(given.checks).map((c: Check) => c.status)).toEqual(['pass', 'pass'])

    const other = await runSmoke({ origin: 'https://staging.example', fetch: deployment() })
    expect(platformChecks(other.checks).map((c: Check) => c.status)).toEqual(['skip', 'skip'])
  })
})
