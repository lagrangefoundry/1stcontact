import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { claimHostname } from '../apps/control-app/src/hostname'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { newId } from '../tools/generate/src/store/ids'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * REQ-238 — **publication is the gate.**
 *
 * *"To go live a business needs a `1stc.site` hostname, a custom domain, or
 * both. At least one address, or there is nothing for `publish` to make
 * reachable."*
 *
 * WHAT MAKES THIS EVIDENCE. The refusal is driven through `POST /api/publish` on
 * the deployed Worker's own `fetch`, inside workerd, against a real D1 database
 * and a real R2 bucket — so what is asserted is the route a customer's toolbar
 * button actually presses, not a function called with the right arguments.
 *
 * THE THREE CLAIMS:
 *
 *  1. A SITE WITH NO ADDRESS IS REFUSED, and **nothing is written** — no
 *     revision, no history entry, no rendered byte. The refusal belongs under
 *     `publishSite`'s rule 1 alongside the invalid draft, not beside it.
 *  2. THE REFUSAL SAYS WHICH TWO THINGS WOULD FIX IT. A message naming only the
 *     hostname would be wrong the day [[EPIC-6]] lands; one naming neither
 *     leaves the customer with a button that says no.
 *  3. **THE CHECK IS WRITTEN OVER ADDRESS KINDS, NOT OVER THIS ONE.** This is
 *     the ticket's own falsifier — *"a publish check that names the `1stc.site`
 *     hostname rather than asking whether any address exists"* — so a site whose
 *     only address is a `custom` one publishes, even though nothing in the
 *     product can yet create one.
 */

/**
 * ONE BUSINESS PER CASE. A business holds ONE address, bound to the site it was
 * claimed for, so a shared business would make the second case's draft a draft
 * that cannot publish for a reason the case is not about.
 */
let TENANT = 'req238gate'
let businessSeq = 0

function controlEnv(): ControlEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as ControlEnv
}

const identityEnv = (): IdentityEnv =>
  ({ DB: env.DB, SITES: env.SITES, TENANT_ID: TENANT }) as unknown as IdentityEnv

/** A valid draft in this case's business, with one page and no pictures. */
async function draft(): Promise<string> {
  const platform = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
  await platform.createTenant({ id: TENANT, name: TENANT, status: 'active' })
  const store = await platform.forTenant(TENANT)
  const seed = siteSeed({ slug: nextSlug('req238gate') })
  const site = await store.createDraft()
  await store.write(site, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: [],
  })
  return site
}

const publish = (site: string): Promise<Response> =>
  controlApp.fetch(
    new Request('https://app.example/api/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site, message: 'go' }),
    }),
    controlEnv(),
  )

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  TENANT = `req238gate-${(businessSeq += 1)}`
})

describe('REQ-238 — publish refuses a business with no address', () => {
  it('test_UAT_FC_REQ-238_a_site_with_no_address_cannot_be_published', async () => {
    // THE REQUIREMENT BELONGS AT THE MOMENT OF PUBLICATION rather than at the
    // moment of provision, because until a site is published it has no public
    // address and needs none — the customer may take as long as they like over
    // the choice.
    const site = await draft()

    const response = await publish(site)

    expect(response.status).toBe(409)
    const body = (await response.json()) as { error: string; code: string }
    expect(body.code).toBe('NO_PUBLIC_ADDRESS')
    // IT SAYS WHICH TWO THINGS WOULD FIX IT.
    expect(body.error).toContain('1stc.site')
    expect(body.error).toMatch(/domain you own/i)

    // AND NOTHING WAS WRITTEN. Inside rule 1's promise, beside the invalid
    // draft: no revision, no history entry, not a byte of output.
    const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(TENANT)
    expect(await store.revisions(site)).toEqual([])
    expect(await env.SITES.get(`sites/${site}/rev/0001/out/index.html`)).toBeNull()
  })

  it('test_UAT_FC_REQ-238_the_same_site_publishes_once_it_has_a_hostname', async () => {
    // THE FRICTION IS ONE ADDED STEP AND NOT A BROKEN PUBLISH PATH. The claim is
    // made through the shipped operation, so what unblocks the publish is what a
    // customer choosing a hostname would have done.
    const site = await draft()
    expect((await publish(site)).status).toBe(409)

    await claimHostname(identityEnv(), TENANT, `req238gate${businessSeq}`)

    const response = await publish(site)
    expect(response.status).toBe(200)
    expect((await response.json()) as { published: boolean }).toMatchObject({
      published: true,
      id: 1,
    })
    const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(TENANT)
    expect(await store.revisions(site)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-238_the_check_asks_for_any_address_and_not_for_this_one', async () => {
    // THE FALSIFIER, RUN. `if (!hostname) refuse` passes every other case in this
    // file and fails this one: the site's only address is a `custom` row, which
    // is [[EPIC-6]]'s kind and which nothing in the product can create yet — so
    // the row is written directly, because the point is precisely that the gate
    // does not know what kinds exist.
    const site = await draft()
    expect((await publish(site)).status).toBe(409)

    await env.DB.prepare(
      "INSERT INTO site_domains (id, site_id, host, kind, status, created_at) " +
        "VALUES (?, ?, ?, 'custom', 'active', ?)",
    )
      .bind(newId('dom'), site, `req238gate${businessSeq}.example.com`, new Date().toISOString())
      .run()

    expect((await publish(site)).status).toBe(200)
  })

  it('test_UAT_FC_REQ-238_a_revoked_address_stops_the_site_publishing_again', async () => {
    // EVERY READ IS FILTERED TO `active`, and this is where that filter is worth
    // having: the column without it is decoration. A site whose only address has
    // been withdrawn is a site with no address.
    const site = await draft()
    const claimed = await claimHostname(identityEnv(), TENANT, `req238gate${businessSeq}`)
    expect((await publish(site)).status).toBe(200)

    await env.DB.prepare("UPDATE site_domains SET status = 'revoked' WHERE host = ?")
      .bind(claimed.host)
      .run()

    // A SECOND PUBLISH OF THE SAME DRAFT WOULD OTHERWISE BE A NO-OP AND ANSWER
    // 200, so the refusal here is the gate and not the diff.
    const response = await publish(site)
    expect(response.status).toBe(409)
    expect((await response.json()) as { code: string }).toMatchObject({
      code: 'NO_PUBLIC_ADDRESS',
    })
  })
})
