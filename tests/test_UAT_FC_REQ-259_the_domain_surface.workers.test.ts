import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  admit,
  provisionBusiness,
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
import type {
  DnsResolver,
  DomainSnapshot,
  RecordType,
  ResolvedRecord,
} from '../apps/control-app/src/resolver'
import type { ResendClient, SendingDomain } from '../apps/control-app/src/resend'
import { DMARC_POLICY, sendingFor, sendingFrom } from '../apps/control-app/src/sending'
import { ASK_THE_ACCOUNT_HOLDER } from '../apps/control-app/src/domains'

/**
 * [[REQ-259]] — **the whole customer-facing configuration for a domain we
 * already hold: three controls, and no records.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs against a real D1 database with the
 * deployed migration list — including `0010`'s `zones`, `0011`'s canonical index
 * and `0012`'s `sending_domains`, which several of these claims are ABOUT.
 * Accounts, businesses and sites come from the shipped provisioning path. Every
 * claim is made through the shipped route table rather than by calling a module,
 * because the ticket is about what a customer's browser can and cannot do.
 *
 * THE THREE EXTERNAL SYSTEMS ARE DOUBLES, and none of that is a convenience. A
 * real Cloudflare token would rewrite the DNS of every domain this deployment
 * manages; a real Resend key would register test domains on the account this
 * product actually sends from; a real resolver would make the verdict depend on
 * what somebody else's domain published this week. What is on THIS side of the
 * seams is the whole of what this ticket builds.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a customer-facing surface that shows a DNS record type, a record value,
 *     or a Cloudflare zone id*;
 *   - *a zone with `account_id` NULL, or `origin = 'platform'`, appearing in the
 *     selector*;
 *   - *a business member who is not the account holder attaching a domain*;
 *   - *a second implementation of external DNS reading, rather than ticket A's*;
 *   - *attaching a domain that already carries mail without saying so*;
 *   - *a confirmation dialog asking the customer to approve DNS records* — there
 *     is no gate on this path at all, which is asserted by attaching a live
 *     domain in one call;
 *   - *`_dmarc` written on a domain that already has one, or written at anything
 *     other than `p=none`*;
 *   - *any refusal to move or remove a `custom`-kind host*;
 *   - *a per-domain exclusivity rule*;
 *   - *Resend verification presented with no state of its own*.
 */

const PLATFORM = 'tenant-1stcontact'
const TEAM = 'https://req259.cloudflareaccess.com'
const AUD = 'req259-aud'

let seq = 0
const anEmail = (): string => `req259-${(seq += 1)}@example.test`
const anApex = (): string => `req259-${(seq += 1)}.example`

function identityEnv(): IdentityEnv {
  return { DB: env.DB, SITES: env.SITES, TENANT_ID: PLATFORM } as unknown as IdentityEnv
}

function routerEnv(overrides: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    CLOUDFLARE_DNS_TOKEN: 'req259-token',
    ...overrides,
  } as RouterEnv
}

/** A customer: an account, a business it owns, and the starter site. */
async function aCustomer(): Promise<{
  businessId: string
  siteKey: string
  admission: Admission
  email: string
}> {
  const email = anEmail()
  const invited = await inviteAccount(identityEnv(), {
    email,
    accountName: `Business ${seq}`,
    endsAt: null,
  })
  const siteKey = await siteOf(identityEnv(), invited.businessId)
  if (siteKey === null) throw new Error('the provisioned business has no site')
  return {
    businessId: invited.businessId,
    siteKey,
    admission: await admit(identityEnv(), email),
    email,
  }
}

/**
 * A SECOND business on the SAME account — one account, two businesses.
 *
 * THE CASE THE EXCLUSIVITY RULE IS ACTUALLY ABOUT. The pool belongs to the
 * account and is therefore shared between its businesses; the assignment belongs
 * to the site and is not. Provisioned through the shipped path, which writes a
 * membership for every person already on the account — so the same customer's
 * admission covers both, exactly as it would in production.
 */
async function aSecondBusinessFor(customer: {
  businessId: string
  email: string
}): Promise<{ businessId: string; siteKey: string; admission: Admission }> {
  const account = await accountOf(customer.businessId)
  const business = await provisionBusiness(identityEnv(), {
    accountId: account,
    name: `Second business ${(seq += 1)}`,
    endsAt: null,
  })
  if (business.siteKey === null) throw new Error('the second business has no site')
  return {
    businessId: business.businessId,
    siteKey: business.siteKey,
    admission: await admit(identityEnv(), customer.email),
  }
}

/**
 * A second person, on a DIFFERENT account, who may operate this business.
 *
 * ROLE `owner`, DELIBERATELY. The gate this ticket adds is over the ACCOUNT and
 * not over the role, and the only way to assert that is a caller whose role is
 * the strongest one available and whose account is somebody else's. A `support`
 * member would pass the same assertion for the wrong reason.
 *
 * THE MEMBERSHIP IS INSERTED DIRECTLY because there is no shipped path that adds
 * a second person to an existing business ([[DOC-42]] §1's second level is not
 * built). The row is exactly the one `provisionBusiness` writes, and the
 * business's own capacity grant — whose subject is NULL — is what admits them,
 * so nothing here invents an authorisation the product does not have.
 */
async function aColleagueOf(businessId: string): Promise<Admission> {
  const email = anEmail()
  const invited = await inviteAccount(identityEnv(), { email, accountName: `Other ${seq}` })
  await env.DB.prepare(
    'INSERT INTO memberships (id, user_id, business_id, role, status, granted_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(newId('mem'), invited.user.id, businessId, 'owner', 'active', new Date().toISOString())
    .run()
  return admit(identityEnv(), email)
}

/** A zone in the account's pool, recorded and attributed exactly as REQ-257 does. */
async function aZone(
  apex: string,
  over: { accountId?: string | null; status?: 'active' | 'pending'; origin?: 'operator' | 'platform' } = {},
): Promise<void> {
  await recordZone(identityEnv(), {
    apex,
    cfZoneId: `cf-${apex}`,
    assignedNs: ['aria.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
    origin: over.origin ?? 'operator',
    status: over.status ?? 'active',
    accountId: over.accountId === undefined ? 'acct-req259' : over.accountId,
    activatedAt: '2026-09-16T00:00:00.000Z',
  })
}

/** The account key a provisioned business belongs to, so a zone can name it. */
async function accountOf(businessId: string): Promise<string> {
  const row = await env.DB.prepare('SELECT owner_account_id FROM tenants WHERE id = ?')
    .bind(businessId)
    .first<{ owner_account_id: string }>()
  if (!row?.owner_account_id) throw new Error('that business has no owner account')
  return row.owner_account_id
}

interface Zone {
  records: DnsRecord[]
  routes: WorkerRoute[]
  client: CloudflareClient
}

/** Cloudflare, as a double that KEEPS STATE — REQ-258's, kept to one zone set. */
function cloudflare(seed: DnsRecord[] = []): Zone {
  const records: DnsRecord[] = [...seed]
  const routes: WorkerRoute[] = []
  let minted = 0
  const refuse = () => {
    throw new Error('this case must not have reached that operation')
  }
  const client = {
    accountId: async () => 'cf-account',
    listZones: refuse,
    readZone: refuse,
    createZone: refuse,
    deleteZone: refuse,
    listRecords: async () => records.map((r) => ({ ...r })),
    createRecord: async (_z: string, spec: DnsRecordSpec) => {
      const made: DnsRecord = { id: `rec-${(minted += 1)}`, ttl: 1, ...spec }
      records.push(made)
      return made
    },
    updateRecord: async (_z: string, id: string, spec: DnsRecordSpec) => {
      const made: DnsRecord = { id, ttl: 1, ...spec }
      const at = records.findIndex((r) => r.id === id)
      if (at >= 0) records[at] = made
      return made
    },
    deleteRecord: async (_z: string, id: string) => {
      const at = records.findIndex((r) => r.id === id)
      if (at >= 0) records.splice(at, 1)
    },
    listRoutes: async () => routes.map((r) => ({ ...r })),
    createRoute: async (_z: string, pattern: string, script: string) => {
      const made: WorkerRoute = { id: `route-${routes.length + 1}`, pattern, script }
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

/** Resend, as a double that mints one registration and remembers its state. */
function resend(over: { status?: SendingDomain['status'] } = {}): {
  client: ResendClient
  registered: string[]
  deleted: string[]
  verified: string[]
  setStatus: (status: SendingDomain['status']) => void
} {
  const registered: string[] = []
  const deleted: string[] = []
  const verified: string[] = []
  let status: SendingDomain['status'] = over.status ?? 'pending'
  const held = new Map<string, SendingDomain>()
  return {
    registered,
    deleted,
    verified,
    setStatus: (next) => {
      status = next
      for (const [id, domain] of held) held.set(id, { ...domain, status: next })
    },
    client: {
      createDomain: async (domain: string) => {
        registered.push(domain)
        const made: SendingDomain = {
          id: `rsd-${registered.length}`,
          name: domain,
          status,
          // EXACTLY THE THREE RESEND ACTUALLY RETURNS, at the names it actually
          // returns them at. `_dmarc` is NOT among them — it is ours to decide,
          // which is the whole of why this ticket has a rule about it.
          records: [
            { type: 'TXT', name: `send.${domain}`, value: 'v=spf1 include:amazonses.com ~all' },
            {
              type: 'MX',
              name: `send.${domain}`,
              value: 'feedback-smtp.us-east-1.amazonses.com',
              priority: 10,
            },
            { type: 'TXT', name: `resend._domainkey.${domain}`, value: 'p=MIGfMA0GCSq' },
          ],
        }
        held.set(made.id, made)
        return made
      },
      verifyDomain: async (id: string) => {
        verified.push(id)
      },
      readDomain: async (id: string) => held.get(id) ?? null,
      deleteDomain: async (id: string) => {
        deleted.push(id)
        held.delete(id)
      },
      // A KEY THAT CAN DO ALL FOUR CAN OBVIOUSLY MANAGE DOMAINS ([[REQ-264]]).
      // The double answers what its own behaviour already implies; the case
      // where it cannot is REQ-264's own suite, where refusing is the subject.
      canManageDomains: async () => true,
    } as ResendClient,
  }
}

/** A snapshot with nothing living on it — the clean case. */
function clean(domain: string): DomainSnapshot {
  const empty: Record<RecordType, ResolvedRecord[]> = {
    A: [],
    AAAA: [],
    CNAME: [],
    MX: [],
    TXT: [],
    NS: [],
  }
  return {
    domain,
    records: empty,
    www: [],
    dkim: [],
    mail: null,
    web: null,
    senders: [],
    hasLiveMail: false,
    hasLiveWeb: false,
    live: false,
    takenAt: '2026-09-16T00:00:00.000Z',
  }
}

/**
 * The resolver, as a double.
 *
 * IT IS [[REQ-257]]'S INTERFACE AND NOT A SECOND READER. Everything this ticket
 * knows about a domain's current state arrives through `DnsResolver`, so a
 * second implementation of DNS reading would show up here as a double nothing
 * consults.
 */
function resolver(over: { snapshot?: DomainSnapshot; txt?: Record<string, string[]> } = {}): {
  client: DnsResolver
  asked: string[]
} {
  const asked: string[] = []
  return {
    asked,
    client: {
      resolve: async (name: string, type: RecordType) => {
        asked.push(`${type} ${name}`)
        return (over.txt?.[name] ?? []).map((data) => ({ type, name, data, ttl: 300 }))
      },
      probeDkim: async () => [],
      snapshot: async (domain: string) => {
        asked.push(`snapshot ${domain}`)
        return over.snapshot ?? clean(domain)
      },
    },
  }
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

beforeAll(async () => {
  await applySchema()
})

describe('REQ-259 AC1 — the selector is the account pool, minus what is taken', () => {
  it('test_UAT_FC_REQ-259_the_pool_is_the_accounts_active_zones', async () => {
    const customer = await aCustomer()
    const account = await accountOf(customer.businessId)
    const mine = anApex()
    const pending = anApex()
    const somebody = anApex()
    const unattributed = anApex()
    await aZone(mine, { accountId: account })
    // `status = 'active'` IS PART OF THE QUERY, because a zone whose nameserver
    // change has not landed cannot serve whatever is written into it — offering
    // it would be offering a domain that attaches and then does not work.
    await aZone(pending, { accountId: account, status: 'pending' })
    await aZone(somebody, { accountId: 'acct-someone-else' })
    // A ZONE WITH NO ACCOUNT IS SELECTABLE BY NOBODY — [[REQ-257]]'s second
    // guard, and this ticket's second falsifier.
    await aZone(unattributed, { accountId: null })

    const answer = await (
      await callRoute(DOMAIN_PATH, customer.businessId, { admission: customer.admission })
    ).json<{ pool: { domain: string; available: boolean }[] }>()
    const offered = answer.pool.map((option) => option.domain)
    expect(offered).toContain(mine)
    expect(offered).not.toContain(pending)
    expect(offered).not.toContain(somebody)
    expect(offered).not.toContain(unattributed)
  })

  it('test_UAT_FC_REQ-259_a_domain_on_another_site_is_listed_and_not_offered', async () => {
    const first = await aCustomer()
    // ONE ACCOUNT, TWO BUSINESSES — which is exactly the case the exclusivity
    // rule is about: the pool is shared and the assignment is not.
    const second = await aSecondBusinessFor(first)
    const account = await accountOf(first.businessId)
    const apex = anApex()
    await aZone(apex, { accountId: account })

    const zone = cloudflare()
    const mail = resend()
    await callRoute(DOMAIN_PATH, first.businessId, {
      admission: first.admission,
      cloudflare: () => zone.client,
      resend: () => mail.client,
      resolver: () => resolver().client,
    }, { method: 'POST', body: JSON.stringify({ domain: apex }) })

    const answer = await (
      await callRoute(DOMAIN_PATH, second.businessId, { admission: second.admission })
    ).json<{ pool: { domain: string; available: boolean; refusal: string | null }[] }>()
    const entry = answer.pool.find((option) => option.domain === apex)
    // LISTED AND DISABLED RATHER THAN OMITTED: a customer who bought two domains
    // and can only see one has been shown a bug.
    expect(entry?.available).toBe(false)
    // AND THE REFUSAL NAMES NO OTHER SITE, no key and no host.
    expect(entry?.refusal).toBe('This domain is already in use on another site.')
    expect(entry?.refusal).not.toContain(second.siteKey)
  })

  it('test_UAT_FC_REQ-259_exclusivity_is_per_host_and_not_per_domain', async () => {
    const first = await aCustomer()
    const second = await aSecondBusinessFor(first)
    const account = await accountOf(first.businessId)
    const apex = anApex()
    await aZone(apex, { accountId: account })

    const zone = cloudflare()
    const mail = resend()
    const deps = (admission: Admission): RouterDeps => ({
      admission,
      cloudflare: () => zone.client,
      resend: () => mail.client,
      resolver: () => resolver().client,
    })
    await callRoute(DOMAIN_PATH, first.businessId, deps(first.admission), {
      method: 'POST',
      body: JSON.stringify({ domain: apex, email: false }),
    })
    // A SUBDOMAIN OF A DOMAIN WHOSE APEX IS IN USE IS STILL ATTACHABLE, which is
    // the natural way to trial a new site on a domain whose apex runs the old
    // one ([[DOC-45]] §2.3). A per-domain rule would forbid it, and that is this
    // ticket's falsifier.
    const answer = await callRoute(DOMAIN_PATH, second.businessId, deps(second.admission), {
      method: 'POST',
      body: JSON.stringify({ domain: `shop.${apex}`, email: false }),
    })
    expect(answer.status).toBe(200)
    const live = await addressesOf(identityEnv(), second.siteKey)
    expect(live.map((address) => address.host)).toContain(`shop.${apex}`)
  })
})

describe('REQ-259 AC2 — authorisation is the thing the selector hides', () => {
  it('test_UAT_FC_REQ-259_a_member_who_is_not_the_account_holder_is_told_to_ask', async () => {
    const customer = await aCustomer()
    const account = await accountOf(customer.businessId)
    const apex = anApex()
    await aZone(apex, { accountId: account })
    const colleague = await aColleagueOf(customer.businessId)

    const answer = await (
      await callRoute(DOMAIN_PATH, customer.businessId, { admission: colleague })
    ).json<{ pool: unknown[]; mayAttach: boolean; refusal: string }>()
    // NO POOL AT ALL, not a disabled one: it is a list of things somebody else
    // paid for, and showing it invites a conversation about their assets.
    expect(answer.pool).toEqual([])
    expect(answer.mayAttach).toBe(false)
    expect(answer.refusal).toBe(ASK_THE_ACCOUNT_HOLDER)
    // AND IT NAMES WHO TO ASK rather than what they lack.
    expect(answer.refusal).toContain('account owner')
  })

  it('test_UAT_FC_REQ-259_a_member_who_is_not_the_account_holder_cannot_attach_or_release', async () => {
    const customer = await aCustomer()
    const account = await accountOf(customer.businessId)
    const apex = anApex()
    await aZone(apex, { accountId: account })
    const colleague = await aColleagueOf(customer.businessId)
    const zone = cloudflare()
    const deps: RouterDeps = {
      admission: colleague,
      cloudflare: () => zone.client,
      resend: () => null,
      resolver: () => resolver().client,
    }

    const attach = await callRoute(DOMAIN_PATH, customer.businessId, deps, {
      method: 'POST',
      body: JSON.stringify({ domain: apex }),
    })
    expect(attach.status).toBe(403)
    const release = await callRoute(DOMAIN_PATH, customer.businessId, deps, { method: 'DELETE' })
    expect(release.status).toBe(403)
    const email = await callRoute(DOMAIN_EMAIL_PATH, customer.businessId, deps, {
      method: 'POST',
      body: JSON.stringify({ enabled: true }),
    })
    expect(email.status).toBe(403)
    // NOTHING WAS WRITTEN. The refusal is before the mechanism, not inside it.
    expect(zone.records).toEqual([])
    expect(await addressesOf(identityEnv(), customer.siteKey)).toEqual([])
  })

  it('test_UAT_FC_REQ-259_the_account_holder_cannot_name_another_accounts_domain', async () => {
    const customer = await aCustomer()
    const theirs = anApex()
    // A ZONE ON SOMEBODY ELSE'S ACCOUNT. It never appears in this customer's
    // selector, so the only way to reach it is to name it in the body — which is
    // exactly what an authorisation that lived only in the selector would miss.
    await aZone(theirs, { accountId: 'acct-somebody-else' })
    const zone = cloudflare()
    const answer = await callRoute(
      DOMAIN_PATH,
      customer.businessId,
      {
        admission: customer.admission,
        cloudflare: () => zone.client,
        resend: () => null,
        resolver: () => resolver().client,
      },
      { method: 'POST', body: JSON.stringify({ domain: theirs }) },
    )
    expect(answer.status).toBe(404)
    expect(zone.records).toEqual([])
    expect(await addressesOf(identityEnv(), customer.siteKey)).toEqual([])
  })

  it('test_UAT_FC_REQ-259_the_account_holder_may_attach', async () => {
    const customer = await aCustomer()
    await aZone(anApex(), { accountId: await accountOf(customer.businessId) })
    const answer = await (
      await callRoute(DOMAIN_PATH, customer.businessId, { admission: customer.admission })
    ).json<{ mayAttach: boolean; refusal: string | null }>()
    expect(answer.mayAttach).toBe(true)
    expect(answer.refusal).toBeNull()
  })
})

describe('REQ-259 AC3 — the check before the attach, said in their language', () => {
  it('test_UAT_FC_REQ-259_a_live_domain_says_what_is_there_and_attaches_anyway', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await aZone(apex, { accountId: await accountOf(customer.businessId) })
    const snapshot = {
      ...clean(apex),
      mail: { host: 'alice-com.mail.protection.outlook.com', provider: 'Microsoft 365' },
      web: { host: 'ext-cust.squarespace.com', provider: 'Squarespace' },
      hasLiveMail: true,
      hasLiveWeb: true,
      live: true,
    }
    const zone = cloudflare()
    const seen = resolver({ snapshot })

    const answer = await callRoute(
      DOMAIN_PATH,
      customer.businessId,
      {
        admission: customer.admission,
        cloudflare: () => zone.client,
        resend: () => null,
        resolver: () => seen.client,
      },
      { method: 'POST', body: JSON.stringify({ domain: apex, email: false }) },
    )
    // IT NOTIFIES; IT DOES NOT ASK. One call, 200, domain attached — there is no
    // shape in this answer a caller could turn into a confirmation gate.
    expect(answer.status).toBe(200)
    const said = await answer.json<{ liveUse: { live: boolean; notes: string[] } }>()
    expect(said.liveUse.live).toBe(true)
    expect(said.liveUse.notes[0]).toBe("Your email is with Microsoft 365 — I'll keep that working.")
    expect(said.liveUse.notes[1]).toContain('Squarespace')
    // READ THROUGH [[REQ-257]]'S RESOLVER AND NOT A SECOND IMPLEMENTATION.
    expect(seen.asked).toContain(`snapshot ${apex}`)
    const live = await addressesOf(identityEnv(), customer.siteKey)
    expect(live.map((address) => address.host)).toContain(apex)
  })

  it('test_UAT_FC_REQ-259_a_clean_domain_says_nothing_at_all', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await aZone(apex, { accountId: await accountOf(customer.businessId) })
    const zone = cloudflare()
    const said = await (
      await callRoute(
        DOMAIN_PATH,
        customer.businessId,
        {
          admission: customer.admission,
          cloudflare: () => zone.client,
          resend: () => null,
          resolver: () => resolver().client,
        },
        { method: 'POST', body: JSON.stringify({ domain: apex, email: false }) },
      )
    ).json<{ liveUse: { live: boolean; notes: string[] } }>()
    // A WARNING ABOUT A RISK THAT DOES NOT EXIST is how customers learn to
    // dismiss warnings.
    expect(said.liveUse).toEqual({ live: false, notes: [] })
  })

  it('test_UAT_FC_REQ-259_no_answer_on_this_path_names_a_record_or_a_zone_id', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await aZone(apex, { accountId: await accountOf(customer.businessId) })
    const zone = cloudflare()
    const mail = resend()
    const deps: RouterDeps = {
      admission: customer.admission,
      cloudflare: () => zone.client,
      resend: () => mail.client,
      resolver: () => resolver().client,
    }
    const attached = await (
      await callRoute(DOMAIN_PATH, customer.businessId, deps, {
        method: 'POST',
        body: JSON.stringify({ domain: apex }),
      })
    ).text()
    const state = await (await callRoute(DOMAIN_PATH, customer.businessId, deps)).text()

    // THE FIRST FALSIFIER, over the WIRE rather than over the screen: a surface
    // cannot show a record type it was never sent. `cf-<apex>` is the zone id
    // this deployment holds for the domain, and `p=none` is the one record value
    // the mechanism composes itself.
    for (const body of [attached, state]) {
      expect(body).not.toContain(`cf-${apex}`)
      expect(body).not.toContain('v=spf1')
      expect(body).not.toContain('_domainkey')
      expect(body).not.toContain('_dmarc')
      expect(body).not.toContain(DMARC_POLICY)
      expect(body).not.toMatch(/"(A|AAAA|CNAME|MX|TXT|NS)"/)
      expect(body.toLowerCase()).not.toContain('dkim')
      expect(body.toLowerCase()).not.toContain('nameserver')
    }
  })
})

describe('REQ-259 AC4 — the email toggle, and the one dangerous record', () => {
  it('test_UAT_FC_REQ-259_sending_writes_only_the_names_nothing_else_occupies', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await aZone(apex, { accountId: await accountOf(customer.businessId) })
    // THE DOMAIN ALREADY CARRIES MAIL: an apex SPF and an `MX`, which is the
    // ordinary shape of a live small business. Neither may be touched.
    const zone = cloudflare([
      { id: 'their-mx', type: 'MX', name: apex, content: 'mail.protection.outlook.com', ttl: 1, priority: 10 },
      { id: 'their-spf', type: 'TXT', name: apex, content: 'v=spf1 include:spf.protection.outlook.com -all', ttl: 1 },
    ])
    const mail = resend()

    await callRoute(
      DOMAIN_PATH,
      customer.businessId,
      {
        admission: customer.admission,
        cloudflare: () => zone.client,
        resend: () => mail.client,
        resolver: () => resolver().client,
      },
      { method: 'POST', body: JSON.stringify({ domain: apex }) },
    )

    expect(mail.registered).toEqual([apex])
    const at = (name: string, type: string) =>
      zone.records.filter((r) => r.name === name && r.type === type)
    // RESEND'S RETURN PATH IS ON `send.`, WHICH IS WHY THIS SHIPS HERE. Three
    // records under names nothing else occupies.
    expect(at(`send.${apex}`, 'TXT')).toHaveLength(1)
    expect(at(`send.${apex}`, 'MX')).toHaveLength(1)
    expect(at(`resend._domainkey.${apex}`, 'TXT')).toHaveLength(1)
    // THEIR OWN MAIL IS EXACTLY AS IT WAS.
    expect(at(apex, 'MX')[0].content).toBe('mail.protection.outlook.com')
    expect(at(apex, 'TXT')[0].content).toBe('v=spf1 include:spf.protection.outlook.com -all')
    // AND MAIL RECORDS ARE NEVER PROXIED — a `TXT` or `MX` behind the HTTP proxy
    // verifies nothing while looking present.
    for (const record of zone.records.filter((r) => r.name.startsWith('send.'))) {
      expect(record.proxied).toBe(false)
    }
  })

  it('test_UAT_FC_REQ-259_dmarc_is_written_only_when_absent_and_only_at_p_none', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await aZone(apex, { accountId: await accountOf(customer.businessId) })
    const zone = cloudflare()
    const mail = resend()
    await callRoute(
      DOMAIN_PATH,
      customer.businessId,
      {
        admission: customer.admission,
        cloudflare: () => zone.client,
        resend: () => mail.client,
        resolver: () => resolver().client,
      },
      { method: 'POST', body: JSON.stringify({ domain: apex }) },
    )
    const dmarc = zone.records.filter((r) => r.name === `_dmarc.${apex}`)
    expect(dmarc).toHaveLength(1)
    // MONITORING AND NEVER ENFORCEMENT. `p=none` changes what receivers REPORT
    // and never what they DELIVER, which is the strongest statement that cannot
    // break a domain we did not start from zero.
    expect(dmarc[0].content).toBe('v=DMARC1; p=none')
    expect(dmarc[0].content).not.toContain('p=quarantine')
    expect(dmarc[0].content).not.toContain('p=reject')
  })

  it('test_UAT_FC_REQ-259_an_existing_dmarc_is_never_touched', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await aZone(apex, { accountId: await accountOf(customer.businessId) })
    // THEIRS, AT `p=quarantine`, because they already send from somewhere and
    // tightened it themselves. Publishing ours over it can start binning THEIR
    // mail — the direction the apex-SPF worry misses.
    const zone = cloudflare([
      { id: 'their-dmarc', type: 'TXT', name: `_dmarc.${apex}`, content: 'v=DMARC1; p=quarantine; rua=mailto:them@example.com', ttl: 1 },
    ])
    const mail = resend()
    await callRoute(
      DOMAIN_PATH,
      customer.businessId,
      {
        admission: customer.admission,
        cloudflare: () => zone.client,
        resend: () => mail.client,
        resolver: () => resolver().client,
      },
      { method: 'POST', body: JSON.stringify({ domain: apex }) },
    )
    const dmarc = zone.records.filter((r) => r.name === `_dmarc.${apex}`)
    expect(dmarc).toHaveLength(1)
    expect(dmarc[0].content).toBe('v=DMARC1; p=quarantine; rua=mailto:them@example.com')

    // AND IT SURVIVES RELEASE. Removing a policy the customer's other provider
    // depends on is the same silent, delayed harm as publishing one, which is
    // what `sending_domains.dmarc_ours` exists to prevent.
    await callRoute(
      DOMAIN_PATH,
      customer.businessId,
      {
        admission: customer.admission,
        cloudflare: () => zone.client,
        resend: () => mail.client,
        resolver: () => resolver().client,
      },
      { method: 'DELETE' },
    )
    expect(zone.records.filter((r) => r.name === `_dmarc.${apex}`)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-259_a_dmarc_only_the_world_can_see_is_enough_to_stop_us', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await aZone(apex, { accountId: await accountOf(customer.businessId) })
    // NOTHING IN THE ZONE, AND A POLICY IN THE WORLD — the shape a domain has
    // while its delegation is still moving to us. A record that exists in either
    // reading is a record somebody is relying on.
    const zone = cloudflare()
    const mail = resend()
    await callRoute(
      DOMAIN_PATH,
      customer.businessId,
      {
        admission: customer.admission,
        cloudflare: () => zone.client,
        resend: () => mail.client,
        resolver: () =>
          resolver({ txt: { [`_dmarc.${apex}`]: ['v=DMARC1; p=reject'] } }).client,
      },
      { method: 'POST', body: JSON.stringify({ domain: apex }) },
    )
    expect(zone.records.filter((r) => r.name === `_dmarc.${apex}`)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-259_the_toggle_is_separately_reversible', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await aZone(apex, { accountId: await accountOf(customer.businessId) })
    const zone = cloudflare()
    const mail = resend()
    const deps: RouterDeps = {
      admission: customer.admission,
      cloudflare: () => zone.client,
      resend: () => mail.client,
      resolver: () => resolver().client,
    }
    await callRoute(DOMAIN_PATH, customer.businessId, deps, {
      method: 'POST',
      body: JSON.stringify({ domain: apex }),
    })

    const off = await (
      await callRoute(DOMAIN_EMAIL_PATH, customer.businessId, deps, {
        method: 'POST',
        body: JSON.stringify({ enabled: false }),
      })
    ).json<{ email: string }>()
    expect(off.email).toBe('off')
    expect(zone.records.filter((r) => r.name.startsWith('send.'))).toHaveLength(0)
    expect(mail.deleted).toHaveLength(1)
    // THE WEBSITE ADDRESS SURVIVES THE TOGGLE. A customer who wants their old
    // From address back must not have to give up the address on their van.
    const live = await addressesOf(identityEnv(), customer.siteKey)
    expect(live.map((address) => address.host)).toContain(apex)

    const on = await (
      await callRoute(DOMAIN_EMAIL_PATH, customer.businessId, deps, {
        method: 'POST',
        body: JSON.stringify({ enabled: true }),
      })
    ).json<{ email: string }>()
    expect(on.email).toBe('pending')
    expect(zone.records.filter((r) => r.name === `send.${apex}`)).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-259_a_deployment_with_no_sending_key_still_attaches_the_website', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await aZone(apex, { accountId: await accountOf(customer.businessId) })
    const zone = cloudflare()
    const answer = await (
      await callRoute(
        DOMAIN_PATH,
        customer.businessId,
        {
          admission: customer.admission,
          cloudflare: () => zone.client,
          // THE SEAM AND THE DEFAULT ANSWER THE SAME WAY, so this is the real
          // no-key behaviour rather than a simulation of it.
          resend: () => null,
          resolver: () => resolver().client,
        },
        { method: 'POST', body: JSON.stringify({ domain: apex }) },
      )
    ).json<{ email: string }>()
    expect(answer.email).toBe('off')
    const live = await addressesOf(identityEnv(), customer.siteKey)
    expect(live.map((address) => address.host)).toContain(apex)
  })
})

describe('REQ-259 AC5 — Resend verification is a wait with a state of its own', () => {
  it('test_UAT_FC_REQ-259_the_third_wait_is_pending_and_then_verified', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await aZone(apex, { accountId: await accountOf(customer.businessId) })
    const zone = cloudflare()
    const mail = resend()
    const deps: RouterDeps = {
      admission: customer.admission,
      cloudflare: () => zone.client,
      resend: () => mail.client,
      resolver: () => resolver().client,
    }
    const attached = await (
      await callRoute(DOMAIN_PATH, customer.businessId, deps, {
        method: 'POST',
        body: JSON.stringify({ domain: apex }),
      })
    ).json<{ email: string }>()
    // ITS OWN STATE, SEPARATE FROM THE ROUTE AND THE CERTIFICATE. The website is
    // already serving; a surface that folded this into "attaching…" would tell a
    // customer their domain was not ready when it was.
    expect(attached.email).toBe('pending')
    expect(mail.verified).toHaveLength(1)

    const waiting = await (
      await callRoute(DOMAIN_PATH, customer.businessId, deps)
    ).json<{ email: string; attached: string }>()
    expect(waiting.email).toBe('pending')
    expect(waiting.attached).toBe(apex)

    // MINUTES LATER, RESEND HAS LOOKED. The read is what moves the state; there
    // is no second poll route and nothing the customer has to press.
    mail.setStatus('verified')
    const done = await (
      await callRoute(DOMAIN_PATH, customer.businessId, deps)
    ).json<{ email: string }>()
    expect(done.email).toBe('verified')
    // AND IT IS RECORDED, so the next read does not ask again.
    expect((await sendingFor(identityEnv(), customer.businessId))?.status).toBe('verified')
  })

  it('test_UAT_FC_REQ-259_mail_goes_out_from_the_domain_only_once_it_is_verified', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await aZone(apex, { accountId: await accountOf(customer.businessId) })
    const zone = cloudflare()
    const mail = resend()
    const deps: RouterDeps = {
      admission: customer.admission,
      cloudflare: () => zone.client,
      resend: () => mail.client,
      resolver: () => resolver().client,
    }
    await callRoute(DOMAIN_PATH, customer.businessId, deps, {
      method: 'POST',
      body: JSON.stringify({ domain: apex }),
    })
    // UNSIGNED MAIL IS BINNED MAIL, which is indistinguishable from mail that was
    // never sent — so nothing changes about what recipients see until the records
    // are live.
    expect(await sendingFrom(identityEnv(), customer.businessId)).toBeNull()

    mail.setStatus('verified')
    await callRoute(DOMAIN_PATH, customer.businessId, deps)
    const from = await sendingFrom(identityEnv(), customer.businessId)
    expect(from).toContain(`<no-reply@${apex}>`)
    // IT CARRIES THE BUSINESS'S NAME, because an anonymous From is most of what
    // makes a message from a domain with no reputation look like phishing.
    expect(from?.startsWith('<')).toBe(false)
  })
})

describe('REQ-259 AC6 — release, and the rule that must not be inherited', () => {
  it('test_UAT_FC_REQ-259_a_custom_domain_can_be_taken_off_and_put_back', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await aZone(apex, { accountId: await accountOf(customer.businessId) })
    const zone = cloudflare()
    const mail = resend()
    const deps: RouterDeps = {
      admission: customer.admission,
      cloudflare: () => zone.client,
      resend: () => mail.client,
      resolver: () => resolver().client,
    }
    await callRoute(DOMAIN_PATH, customer.businessId, deps, {
      method: 'POST',
      body: JSON.stringify({ domain: apex }),
    })

    const released = await (
      await callRoute(DOMAIN_PATH, customer.businessId, deps, { method: 'DELETE' })
    ).json<{ released: string | null }>()
    expect(released.released).toBe(apex)
    // THE RECORDS AND THE ROUTE COME DOWN, and the sending registration with
    // them — a domain left registered is one nobody else can ever register.
    expect(zone.routes).toEqual([])
    expect(zone.records).toEqual([])
    expect(mail.deleted).toHaveLength(1)
    expect(await sendingFor(identityEnv(), customer.businessId)).toBeNull()
    // THE HOST IS GONE FROM THE TABLE ENTIRELY rather than tombstoned: a
    // customer's own domain is not the scarce first-come namespace `1stc.site`
    // is, and a tombstone would make us the reason they cannot move it.
    expect(await addressesOf(identityEnv(), customer.siteKey)).toEqual([])

    // THE ZONE STAYS IN THE ACCOUNT AND STAYS IN THE POOL. Taking it out of our
    // account entirely is offboarding, which is not this.
    const pool = await (
      await callRoute(DOMAIN_PATH, customer.businessId, deps)
    ).json<{ pool: { domain: string; available: boolean }[]; attached: string | null }>()
    expect(pool.attached).toBeNull()
    expect(pool.pool.find((option) => option.domain === apex)?.available).toBe(true)

    // AND IT GOES STRAIGHT BACK ON. **Finality is a `platform` rule and is not
    // inherited**: any refusal to move or remove a `custom` host is this
    // ticket's falsifier.
    const again = await callRoute(DOMAIN_PATH, customer.businessId, deps, {
      method: 'POST',
      body: JSON.stringify({ domain: apex }),
    })
    expect(again.status).toBe(200)
    expect((await addressesOf(identityEnv(), customer.siteKey)).map((a) => a.host)).toContain(apex)
  })

  it('test_UAT_FC_REQ-259_releasing_nothing_is_not_an_error', async () => {
    const customer = await aCustomer()
    const zone = cloudflare()
    const answer = await callRoute(
      DOMAIN_PATH,
      customer.businessId,
      {
        admission: customer.admission,
        cloudflare: () => zone.client,
        resend: () => null,
        resolver: () => resolver().client,
      },
      { method: 'DELETE' },
    )
    // A CUSTOMER WHO PRESSED IT TWICE, or whose browser did not hear the first
    // answer, gets the same answer both times.
    expect(answer.status).toBe(200)
    expect(await answer.json()).toEqual({ released: null })
  })

  it('test_UAT_FC_REQ-259_a_domain_this_account_does_not_hold_is_refused', async () => {
    const customer = await aCustomer()
    const zone = cloudflare()
    const answer = await callRoute(
      DOMAIN_PATH,
      customer.businessId,
      {
        admission: customer.admission,
        cloudflare: () => zone.client,
        resend: () => null,
        resolver: () => resolver().client,
      },
      { method: 'POST', body: JSON.stringify({ domain: 'somebody-elses.example' }) },
    )
    expect(answer.status).toBe(404)
    expect(zone.records).toEqual([])
  })
})
