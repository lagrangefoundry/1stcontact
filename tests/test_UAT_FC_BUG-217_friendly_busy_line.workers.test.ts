import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { editPageDecompose } from '../tools/generate/src/cli/edit'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { d1Leases } from '../tools/generate/src/store/d1-leases'
import { CLIENT_HOLDER } from '../tools/generate/src/store/leases'
import { applySchema, seedTenantSite, tenantStore } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-217]] — the site owner who clicks a section a builder holds reads who is
 * on it in their own words and how long ago it started: never a session id like
 * `worker-builder-7-y326gs`, never a UTC wall clock.
 *
 * WHAT MAKES THIS EVIDENCE. The real `GET /api/copy` route inside workerd over a
 * real D1 `draft_leases` table; the lease is taken through the same D1 adapter
 * the delegation claim hook uses, backdated by handing it an earlier clock.
 */
const TENANT = 'bug217'
const HOLDER = 'worker-builder-7-y326gs'

function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as Env
}

async function busyOf(site: string): Promise<{ line: string } | undefined> {
  const got = await worker.fetch(new Request(`https://app.example/api/copy?site=${site}&page=home&path=0.0`), workerEnv())
  expect(got.status).toBe(200)
  return ((await got.json()) as { busy?: { line: string } }).busy
}

/** A site in D1 with `home` stored as sections `hero` and `story`. */
async function sectionedSite(name: string): Promise<string> {
  const page = starterHomePage('acme') as Record<string, unknown>
  ;(page.l1 as Record<string, unknown>).root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'text', id: 'hero', text: 'Hero words', axes: { fontSizePx: 32 } },
      { kind: 'text', id: 'story', text: 'Story words', axes: { fontSizePx: 16 } },
    ],
  }
  page.modules = []
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(name), pages: { 'home.json': page } })
  await editPageDecompose(site, 'home', { store: await tenantStore(TENANT) })
  return site
}

describe('BUG-217 the "being updated" line is written for the site owner', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_BUG-217_a_builder_held_section_names_the_assistant_and_a_relative_start', async () => {
    const site = await sectionedSite('builder')
    const threeMinutesAgo = Date.now() - 3 * 60_000
    await d1Leases(env.DB, () => threeMinutesAgo).acquire(site, ['home.json#hero'], HOLDER, 60 * 60_000)

    const line = (await busyOf(site))?.line ?? ''
    expect(line).toBe('Your AI assistant is updating this section right now (started 3 minutes ago).')
    expect(line).not.toContain('worker-')
    expect(line).not.toContain('UTC')
  })

  it('test_UAT_FC_BUG-217_a_section_held_just_now_says_started_just_now', async () => {
    const site = await sectionedSite('fresh')
    await d1Leases(env.DB).acquire(site, ['home.json#hero'], HOLDER, 5 * 60_000)

    expect((await busyOf(site))?.line).toBe('Your AI assistant is updating this section right now (started just now).')
  })

  it("test_UAT_FC_BUG-217_the_client's_own_save_is_named_as_theirs", async () => {
    const site = await sectionedSite('client')
    await d1Leases(env.DB).acquire(site, ['home.json#hero'], `${CLIENT_HOLDER}~1`, 5 * 60_000)

    expect((await busyOf(site))?.line).toBe("You're already saving a change to this section (started just now).")
  })
})
