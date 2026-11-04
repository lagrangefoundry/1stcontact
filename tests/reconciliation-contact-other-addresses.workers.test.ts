import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { userEmailInsert, type IdentityEnv } from '../apps/control-app/src/identity'
import { invitePerson } from '../apps/control-app/src/people'
import { PERSON_DETAIL_PATH, route, type RouterEnv } from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'

/**
 * Reconciliation UAT — story-0034d937 (REQ-191): the server half of AC-2250.
 *
 * The Contacts panel draws its **Other addresses** section from the `emails`
 * array the person-detail route returns. The panel UAT mounts the real panel
 * against a transport double, so it cannot see a detail that drops or reorders
 * the non-primary addresses. This drives the shipped route itself: real router,
 * real D1 with the shipped baseline, a person invited through `invitePerson`.
 *
 * The second and third addresses are seeded through `userEmailInsert`, the
 * statement builder the invite writes the first one with, because no product
 * surface adds a second address yet.
 */

const BUSINESS = 'recon2250-business'

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: BUSINESS }
}

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: BUSINESS,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

async function detailOf(id: string): Promise<Response> {
  return route(
    new Request(`https://app.test${PERSON_DETAIL_PATH}?id=${encodeURIComponent(id)}`),
    routerEnv(),
    { businessId: BUSINESS },
    {},
  )
}

beforeAll(async () => {
  await applySchema()
})

describe('story-0034d937 — the person detail carries every address, primary first', () => {
  it('test_UAT_AC2250_person_detail_route_lists_every_address_primary_first', async () => {
    const primary = 'recon2250-primary@example.test'
    const second = 'recon2250-second@example.test'
    const third = 'recon2250-third@example.test'
    const invited = await invitePerson(identityEnv(), { businessId: BUSINESS }, { email: primary })
    // Seeded in an order that is NOT the order the route must answer in, so a
    // detail that returned insertion order would put a secondary first.
    for (const email of [third, second]) {
      await userEmailInsert(identityEnv(), {
        userId: invited.person.id,
        tenantId: BUSINESS,
        email,
        primary: false,
      }).run()
    }

    const response = await detailOf(invited.person.id)
    expect(response.status).toBe(200)
    const body = (await response.json()) as { emails: Array<{ email: string; isPrimary: boolean }> }

    // All three addresses, none dropped, the primary first and flagged as such.
    expect(body.emails).toHaveLength(3)
    expect(body.emails[0]).toMatchObject({ email: primary, isPrimary: true })
    expect(body.emails.slice(1).every((e) => e.isPrimary === false)).toBe(true)
    expect(new Set(body.emails.map((e) => e.email))).toEqual(new Set([primary, second, third]))
    expect(body.emails.filter((e) => e.isPrimary)).toHaveLength(1)

    // A person holding one address gets exactly that one — which is what makes
    // the panel's Other addresses section absent for them.
    const solo = await invitePerson(
      identityEnv(),
      { businessId: BUSINESS },
      { email: 'recon2250-solo@example.test' },
    )
    const soloResponse = await detailOf(solo.person.id)
    expect(soloResponse.status).toBe(200)
    const soloBody = (await soloResponse.json()) as { emails: Array<{ email: string; isPrimary: boolean }> }
    expect(soloBody.emails).toEqual([
      expect.objectContaining({ email: 'recon2250-solo@example.test', isPrimary: true }),
    ])
  })
})
