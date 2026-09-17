import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  admit,
  type Admission,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'
import {
  DOMAIN_EMAIL_PATH,
  DOMAIN_PATH,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import type {
  CloudflareClient,
  DnsRecord,
  DnsRecordSpec,
  WorkerRoute,
} from '../apps/control-app/src/cloudflare'
import { recordZone } from '../apps/control-app/src/zones'
import { addressesOf, siteOf } from '../apps/control-app/src/hostname'
import { newId } from '../tools/generate/src/store/ids'
import type { DnsResolver, DomainSnapshot, RecordType } from '../apps/control-app/src/resolver'
import { ResendNotPermittedError, type ResendClient } from '../apps/control-app/src/resend'
import { sendingFor } from '../apps/control-app/src/sending'

/**
 * [[REQ-264]] — **a key that cannot manage domains is the same state as no key
 * at all, and the customer is never shown the provider's sentence.**
 *
 * WHY A RUNTIME HALF AT ALL. The deploy probe catches a wrongly-scoped key at
 * the moment it is supplied. It cannot catch one ROTATED to a narrower scope
 * afterwards, which is the same failure arriving later — so the surface has to
 * answer it too, and answer it as a STATE rather than as an error. `resend.ts`
 * had already written down what that answer is: *"a deployment that could send
 * but not manage domains would offer the toggle and refuse it, which is worse
 * than not offering it."*
 *
 * WHAT MAKES THIS EVIDENCE. Real D1 with the deployed migrations, the shipped
 * route table, the shipped domain module. Cloudflare and Resend are doubles for
 * [[REQ-259]]'s reasons exactly — a real zone credential would rewrite somebody's
 * DNS and a real Resend key would register test domains on the account this
 * product sends from.
 *
 * THE CLAIMS:
 *
 *  1. THE SECTION DOES NOT OFFER WHAT IT CANNOT DO. `GET /api/domain` reports
 *     `emailAvailable: false`, which is the same answer a deployment with no
 *     credential gives.
 *  2. THE WEBSITE IS UNAFFECTED. The attach succeeds, the records are written,
 *     and mail reports `off` — the ordinary state [[REQ-259]] already ruled.
 *  3. THE PROVIDER'S ENGLISH NEVER REACHES A CUSTOMER, on any of the three
 *     controls.
 *  4. TURNING SENDING OFF ALWAYS WORKS, even with a key that can no longer
 *     unregister the domain — the alternative strands a customer sending from a
 *     domain they have asked to stop sending from.
 */

const PLATFORM = 'tenant-1stcontact'
const RESEND_SAID = 'This API key is restricted to only send emails'

let seq = 0
const anEmail = (): string => `req264-${(seq += 1)}@example.test`
const anApex = (): string => `req264-${(seq += 1)}.example`

function identityEnv(): IdentityEnv {
  return { DB: env.DB, SITES: env.SITES, TENANT_ID: PLATFORM } as unknown as IdentityEnv
}

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_TEAM_DOMAIN: 'https://req264.cloudflareaccess.com',
    ACCESS_AUD: 'req264-aud',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    CLOUDFLARE_DNS_TOKEN: 'req264-token',
    // THE KEY IS PRESENT. That is the whole point — presence is what the deploy
    // used to check, and this deployment has a value that cannot do the job.
    RESEND_API_KEY: 'req264-sending-only',
  } as RouterEnv
}

async function aCustomer(): Promise<{
  businessId: string
  siteKey: string
  admission: Admission
  apex: string
}> {
  const email = anEmail()
  const invited = await inviteAccount(identityEnv(), {
    email,
    accountName: `Business ${seq}`,
    endsAt: null,
  })
  const siteKey = await siteOf(identityEnv(), invited.businessId)
  if (siteKey === null) throw new Error('the provisioned business has no site')
  const account = await env.DB.prepare('SELECT owner_account_id FROM tenants WHERE id = ?')
    .bind(invited.businessId)
    .first<{ owner_account_id: string }>()
  const apex = anApex()
  await recordZone(identityEnv(), {
    apex,
    cfZoneId: `cf-${apex}`,
    assignedNs: ['aria.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
    origin: 'operator',
    status: 'active',
    accountId: account?.owner_account_id ?? null,
    activatedAt: '2026-09-16T00:00:00.000Z',
  })
  return {
    businessId: invited.businessId,
    siteKey,
    admission: await admit(identityEnv(), email),
    apex,
  }
}

/** Cloudflare, as a double that keeps state — [[REQ-259]]'s, kept to one zone. */
function cloudflare(): { records: DnsRecord[]; routes: WorkerRoute[]; client: CloudflareClient } {
  const records: DnsRecord[] = []
  const routes: WorkerRoute[] = []
  const client = {
    listZones: async () => [],
    readZone: async () => null,
    listRecords: async () => records,
    createRecord: async (_z: string, spec: DnsRecordSpec) => {
      const made = { id: newId('rec'), ...spec } as DnsRecord
      records.push(made)
      return made
    },
    updateRecord: async (_z: string, id: string, spec: DnsRecordSpec) => {
      const at = records.findIndex((r) => r.id === id)
      const made = { id, ...spec } as DnsRecord
      if (at >= 0) records[at] = made
      return made
    },
    deleteRecord: async (_z: string, id: string) => {
      const at = records.findIndex((r) => r.id === id)
      if (at >= 0) records.splice(at, 1)
    },
    listRoutes: async () => routes,
    createRoute: async (_z: string, pattern: string, script: string) => {
      const made = { id: newId('rt'), pattern, script }
      routes.push(made)
      return made
    },
    deleteRoute: async (_z: string, id: string) => {
      const at = routes.findIndex((r) => r.id === id)
      if (at >= 0) routes.splice(at, 1)
    },
  } as unknown as CloudflareClient
  return { records, routes, client }
}

/**
 * A Resend key scoped to SENDING ONLY — the key that actually shipped.
 *
 * Every domain operation refuses with the provider's own sentence, which is what
 * makes claim 3 checkable: if any of it reaches a response body, the surface is
 * showing our configuration to somebody who has none.
 */
function sendingOnlyResend(): ResendClient {
  const refuse = () => {
    throw new ResendNotPermittedError(RESEND_SAID, 401)
  }
  return {
    createDomain: async () => refuse(),
    verifyDomain: async () => refuse(),
    readDomain: async () => refuse(),
    deleteDomain: async () => refuse(),
    canManageDomains: async () => false,
  } as unknown as ResendClient
}

function resolver(): DnsResolver {
  const empty: Record<RecordType, never[]> = { A: [], AAAA: [], CNAME: [], MX: [], TXT: [], NS: [] }
  return {
    resolve: async () => [],
    probeDkim: async () => [],
    snapshot: async (domain: string): Promise<DomainSnapshot> =>
      ({ domain, records: empty, nameservers: [] }) as unknown as DomainSnapshot,
  } as unknown as DnsResolver
}

const callRoute = (
  path: string,
  businessId: string,
  deps: RouterDeps,
  init: RequestInit = {},
): Promise<Response> =>
  route(
    new Request(`https://app.test${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    }),
    routerEnv(),
    { businessId },
    deps,
  )

const deps = (customer: { admission: Admission }, zone: CloudflareClient): RouterDeps => ({
  admission: customer.admission,
  cloudflare: () => zone,
  resend: () => sendingOnlyResend(),
  resolver: () => resolver(),
})

beforeAll(async () => {
  await applySchema()
})

describe('REQ-264 — a deployment that cannot configure sending says so as a state', () => {
  it('test_UAT_FC_REQ-264_the_section_reports_sending_as_unavailable', async () => {
    const customer = await aCustomer()
    const zone = cloudflare()
    const answer = await callRoute(DOMAIN_PATH, customer.businessId, deps(customer, zone.client))
    const state = await answer.json<{ emailAvailable: boolean; email: string; mayAttach: boolean }>()

    expect(answer.status).toBe(200)
    // THE SAME ANSWER A DEPLOYMENT WITH NO KEY GIVES. The two are one state to a
    // customer and must arrive as one.
    expect(state.emailAvailable).toBe(false)
    // AND THE REST OF THE SECTION IS UNTOUCHED — this costs a feature, not the
    // section ([[REQ-259]]'s axis, kept).
    expect(state.mayAttach).toBe(true)
    expect(state.email).toBe('off')
    expect(JSON.stringify(state)).not.toContain('API key')
  })

  it('test_UAT_FC_REQ-264_a_deployment_with_no_key_at_all_answers_identically', async () => {
    // THE CLAIM IS THAT THESE ARE ONE STATE, so the absent case is asserted
    // beside the refused one rather than assumed to agree with it.
    const customer = await aCustomer()
    const zone = cloudflare()
    const answer = await callRoute(DOMAIN_PATH, customer.businessId, {
      admission: customer.admission,
      cloudflare: () => zone.client,
      resend: () => null,
      resolver: () => resolver(),
    })
    const state = await answer.json<{ emailAvailable: boolean; email: string }>()
    expect(state.emailAvailable).toBe(false)
    expect(state.email).toBe('off')
  })

  it('test_UAT_FC_REQ-264_the_attach_still_gives_the_customer_their_website', async () => {
    const customer = await aCustomer()
    const zone = cloudflare()
    const answer = await callRoute(
      DOMAIN_PATH,
      customer.businessId,
      deps(customer, zone.client),
      // SENDING ON BY DEFAULT, which is what makes this the dangerous path: the
      // customer asked for their domain and did not ask about mail.
      { method: 'POST', body: JSON.stringify({ domain: customer.apex }) },
    )
    const said = await answer.json<{ domain: string; email: string }>()

    expect(answer.status).toBe(200)
    expect(said.email).toBe('off')
    // THE WEBSITE IS THE THING THEY ASKED FOR AND IT IS WORKING. Refusing the
    // whole attach over a sending credential would take it away to punish a
    // configuration the customer has no part in.
    expect((await addressesOf(identityEnv(), customer.siteKey)).map((a) => a.host)).toContain(
      customer.apex,
    )
    expect(zone.routes.map((r) => r.pattern).join(' ')).toContain(customer.apex)
    // AND NO MAIL ROW WAS WRITTEN, so nothing later reads this business as
    // sending from its own domain.
    expect(await sendingFor(identityEnv(), customer.businessId)).toBeNull()
    expect(JSON.stringify(said)).not.toContain('API key')
  })

  it('test_UAT_FC_REQ-264_pressing_the_toggle_is_refused_in_our_words_and_not_the_providers', async () => {
    const customer = await aCustomer()
    const zone = cloudflare()
    await callRoute(DOMAIN_PATH, customer.businessId, deps(customer, zone.client), {
      method: 'POST',
      body: JSON.stringify({ domain: customer.apex, email: false }),
    })

    const answer = await callRoute(
      DOMAIN_EMAIL_PATH,
      customer.businessId,
      deps(customer, zone.client),
      { method: 'POST', body: JSON.stringify({ enabled: true }) },
    )
    const said = await answer.json<{ error: string }>()

    // 409 AND NOT 502. A 502 says *it went wrong upstream and might work if you
    // press it again*, and this will not.
    expect(answer.status).toBe(409)
    expect(said.error).not.toContain(RESEND_SAID)
    expect(said.error).not.toMatch(/API key/i)
    expect(said.error).not.toMatch(/Resend/)
    expect(said.error).toMatch(/not available on this deployment/)
    // AND IT SAYS WHAT IS UNAFFECTED, because the fear the sentence is answering
    // is *have I broken my website*.
    expect(said.error).toMatch(/website is unaffected/i)
  })

  it('test_UAT_FC_REQ-264_turning_sending_off_still_works', async () => {
    // TURNING IT OFF MUST ALWAYS WORK. A key narrowed after the domain was
    // registered cannot unregister it, and refusing the whole operation would
    // leave a customer sending from a domain they have asked to stop sending
    // from — with the records already down, which is the worst of the states.
    const customer = await aCustomer()
    const zone = cloudflare()
    await callRoute(DOMAIN_PATH, customer.businessId, deps(customer, zone.client), {
      method: 'POST',
      body: JSON.stringify({ domain: customer.apex, email: false }),
    })
    const answer = await callRoute(
      DOMAIN_EMAIL_PATH,
      customer.businessId,
      deps(customer, zone.client),
      { method: 'POST', body: JSON.stringify({ enabled: false }) },
    )
    expect(answer.status).toBe(200)
    expect(await answer.json()).toEqual({ email: 'off' })
  })

  it('test_UAT_FC_REQ-264_release_is_never_blocked_by_a_credential_that_cannot_unregister', async () => {
    const customer = await aCustomer()
    const zone = cloudflare()
    await callRoute(DOMAIN_PATH, customer.businessId, deps(customer, zone.client), {
      method: 'POST',
      body: JSON.stringify({ domain: customer.apex, email: false }),
    })
    const answer = await callRoute(DOMAIN_PATH, customer.businessId, deps(customer, zone.client), {
      method: 'DELETE',
    })
    expect(answer.status).toBe(200)
    expect(await answer.json()).toEqual({ released: customer.apex })
    expect((await addressesOf(identityEnv(), customer.siteKey)).map((a) => a.host)).not.toContain(
      customer.apex,
    )
  })
})
