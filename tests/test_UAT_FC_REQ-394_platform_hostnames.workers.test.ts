import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/public-site/src/index'
import type { Env } from '../apps/public-site/src/index'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[REQ-394]] — **a platform hostname reaches its site, and the apex site's
 * reaches the apex.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives `public-site`'s real `fetch`
 * inside workerd, against a real D1 carrying the deployed migrations and a real
 * R2 holding published revisions. The platform hostnames are the ones
 * `seedFormSite` claims through the shipped claim path, so the `site_domains`
 * rows resolved here are the rows production holds.
 *
 * THE APEX SITE IS CONFIGURED, NOT BOUND — exactly as production's is: its key
 * is `APEX_SITE_KEY`, its only row is its `<label>.1stc.site`, and that row is
 * canonical in the data. `APEX_HOST` is what makes the apex its address.
 */

const APEX_HOST = 'req394-apex.test'
const APEX_ORIGIN = `https://${APEX_HOST}`
const PLATFORM_APEX = '1stc.site'

interface Seeded {
  apexKey: string
  apexPlatformHost: string
  otherKey: string
  otherPlatformHost: string
}

let seeded: Seeded

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    APEX_SITE_KEY: seeded.apexKey,
    APEX_HOST,
    SESSION_COOKIE_NAME: '',
    SESSION_COOKIE_DOMAIN: '',
  } as Env
}

async function call(origin: string, path: string): Promise<Response> {
  return worker.fetch(
    new Request(`${origin}${path}`),
    workerEnv(),
    { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
  )
}

beforeAll(async () => {
  await applySchema()
  const apex = await seedFormSite({ tenantId: 'req394-apex', outHtml: '<!doctype html>APEX-HOME' })
  const other = await seedFormSite({ tenantId: 'req394-other', outHtml: '<!doctype html>OTHER-HOME' })
  seeded = {
    apexKey: apex.siteKey,
    apexPlatformHost: apex.host as string,
    otherKey: other.siteKey,
    otherPlatformHost: other.host as string,
  }
  // The fixture's addresses are platform hostnames — the case this ticket is about.
  expect(seeded.apexPlatformHost.endsWith(`.${PLATFORM_APEX}`)).toBe(true)
  expect(seeded.otherPlatformHost.endsWith(`.${PLATFORM_APEX}`)).toBe(true)
})

describe('REQ-394 — platform hostnames', () => {
  it('test_UAT_FC_REQ-394_the_apex_sites_platform_hostname_301s_to_the_apex_preserving_path_and_query', async () => {
    const res = await call(`https://${seeded.apexPlatformHost}`, '/about?ref=van')
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe(`${APEX_ORIGIN}/about?ref=van`)

    const root = await call(`https://${seeded.apexPlatformHost}`, '/')
    expect(root.status).toBe(301)
    expect(root.headers.get('location')).toBe(`${APEX_ORIGIN}/`)

    // An old prefixed link on that host lands on the apex in one hop.
    const prefixed = await call(`https://${seeded.apexPlatformHost}`, `/site/${seeded.apexKey}/about`)
    expect(prefixed.status).toBe(301)
    expect(prefixed.headers.get('location')).toBe(`${APEX_ORIGIN}/about`)
  })

  it('test_UAT_FC_REQ-394_the_apex_still_serves_its_site_and_the_prefix_grammar', async () => {
    const home = await call(APEX_ORIGIN, '/')
    expect(home.status).toBe(200)
    expect(await home.text()).toContain('APEX-HOME')

    // The apex is not a bound host, so every other site is still under /site/<key>/.
    const other = await call(APEX_ORIGIN, `/site/${seeded.otherKey}/`)
    expect(other.status).toBe(200)
    expect(await other.text()).toContain('OTHER-HOME')
  })

  it('test_UAT_FC_REQ-394_another_sites_claimed_platform_hostname_serves_that_site', async () => {
    const res = await call(`https://${seeded.otherPlatformHost}`, '/')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('OTHER-HOME')
  })

  it('test_UAT_FC_REQ-394_an_unclaimed_platform_hostname_is_a_404_like_an_unpublished_site', async () => {
    const unclaimed = await call(`https://req394-nobody-claimed-this.${PLATFORM_APEX}`, '/')
    const unknownSite = await call(APEX_ORIGIN, '/site/req394-no-such-site/')
    expect(unclaimed.status).toBe(404)
    expect(unknownSite.status).toBe(404)
    expect(await unclaimed.text()).toBe(await unknownSite.text())
  })
})
