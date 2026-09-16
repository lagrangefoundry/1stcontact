import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  admit,
  ensurePlatformOperator,
  type Admission,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { acceptTerms } from '../apps/control-app/src/terms'
import { personByEmail } from './support/person'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'
import {
  ADMIN_DOMAINS_PATH,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import { CloudflareApiError } from '../apps/control-app/src/cloudflare'
import type {
  CloudflareClient,
  DnsRecord,
  DnsRecordSpec,
  WorkerRoute,
} from '../apps/control-app/src/cloudflare'
import { recordZone } from '../apps/control-app/src/zones'
import {
  addressesOf,
  canonicalAddress,
  claimHostname,
  siteOf,
} from '../apps/control-app/src/hostname'
import {
  PUBLIC_SITE_SCRIPT,
  SERVING_IPV4,
  SERVING_IPV6,
  routePatternFor,
  servedHosts,
  servingPlan,
  servingRecords,
} from '../apps/control-app/src/serving'

/**
 * [[REQ-258]] — **the mechanism: records, then the route, then the row.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs against a real D1 database with the
 * deployed migration list — including `0010`'s `zones` and `0011`'s partial
 * unique index on `canonical`, which several of these claims are ABOUT. Accounts
 * and their sites come from the shipped `inviteAccount` path and the operator
 * from `ensurePlatformOperator`, which is the production route `PLATFORM_ADMINS`
 * takes. The attachment is driven through the shipped route table rather than by
 * calling the module, because every claim here is a claim about a request
 * arriving somewhere.
 *
 * THE CLOUDFLARE CLIENT IS A DOUBLE AND THAT IS NOT A CONVENIENCE, on
 * [[REQ-257]]'s reasoning exactly: the real one can rewrite the DNS of every
 * domain this deployment manages, and a suite holding a live credential would
 * not fail against the real API — it would succeed, against whatever account the
 * credential belongs to. What is on this side of the seam is the whole of what
 * this ticket builds: the ordering, the guards, the rollback and the rows.
 *
 * THE DOUBLE RECORDS THE ORDER IT WAS CALLED IN, which is the only way the
 * ordering claim is assertable at all. *"A Worker route created without the DNS
 * record that makes it reachable"* and *"a `site_domains` row whose host resolves
 * nowhere after the mechanism reports success"* are both statements about
 * sequence, and a double that only recorded WHAT happened could not tell them
 * apart from a mechanism that did everything in the wrong order and got away
 * with it.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a `site_domains` row with `kind = 'custom'` whose host resolves nowhere
 *     after the mechanism reports success*;
 *   - *a customer domain added by editing `wrangler.toml`* — the routes here are
 *     created through the API, at runtime, and the companion node suite holds
 *     the config side;
 *   - *a Worker route created without the DNS record that makes it reachable*;
 *   - *two hosts reaching one site with nothing recording which is canonical*;
 *   - *serving on a custom host gated on any [[TODO-6]] item* — nothing below
 *     reads a wildcard record, a wildcard certificate or a public-suffix entry.
 */

const PLATFORM = 'tenant-1stcontact'
const TEAM = 'https://req258.cloudflareaccess.com'
const AUD = 'req258-aud'

let seq = 0
const anEmail = (): string => `req258-${(seq += 1)}@example.test`
/** An apex nothing else in the suite will ask for — `apex` is UNIQUE. */
const anApex = (): string => `req258-${(seq += 1)}.example`

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
    CLOUDFLARE_DNS_TOKEN: 'req258-token',
    ...overrides,
  } as RouterEnv
}

/** An owner of the 1st Contact business — what the operator gate asks for. */
async function anOperator(): Promise<{ email: string; admission: Admission }> {
  const email = anEmail()
  await ensurePlatformOperator(identityEnv(), email)
  const person = await personByEmail(identityEnv(), PLATFORM, email)
  if (!person) throw new Error('the seeded operator was not readable back')
  await acceptTerms(identityEnv(), person.id)
  return { email, admission: await admit(identityEnv(), email) }
}

/** A customer with a business and the starter site a provision mints. */
async function aCustomer(): Promise<{ businessId: string; siteKey: string }> {
  const email = anEmail()
  const invited = await inviteAccount(identityEnv(), {
    email,
    accountName: `Business ${seq}`,
    endsAt: null,
  })
  const siteKey = await siteOf(identityEnv(), invited.businessId)
  if (siteKey === null) throw new Error('the provisioned business has no site')
  return { businessId: invited.businessId, siteKey }
}

/** One call this deployment made to Cloudflare, in the order it made it. */
type Call =
  | { op: 'listRecords' }
  | { op: 'createRecord'; spec: DnsRecordSpec }
  | { op: 'updateRecord'; id: string; spec: DnsRecordSpec }
  | { op: 'deleteRecord'; id: string }
  | { op: 'listRoutes' }
  | { op: 'createRoute'; pattern: string; script: string }
  | { op: 'deleteRoute'; id: string }

interface Recorder extends CloudflareClient {
  calls: Call[]
  records: DnsRecord[]
  routes: WorkerRoute[]
}

/**
 * A Cloudflare zone, as a double that KEEPS STATE AND KEEPS ORDER.
 *
 * It holds a record set and a route list the way the real API does, so a
 * rollback case can assert that the zone was left exactly as it was found rather
 * than that the right calls were made — which is a weaker statement and the one
 * that passes when the restore writes the wrong content.
 */
function cloudflareZone(options: { seed?: DnsRecord[]; failRouteAt?: number } = {}): Recorder {
  const calls: Call[] = []
  const records: DnsRecord[] = [...(options.seed ?? [])]
  const routes: WorkerRoute[] = []
  let minted = 0
  let routeAttempts = 0
  const refuse = () => {
    throw new Error('this case must not have reached that operation')
  }
  return {
    calls,
    records,
    routes,
    accountId: async () => 'cf-account',
    listZones: refuse,
    readZone: refuse,
    createZone: refuse,
    deleteZone: refuse,
    listRecords: async () => {
      calls.push({ op: 'listRecords' })
      return records.map((r) => ({ ...r }))
    },
    createRecord: async (_zone: string, spec: DnsRecordSpec) => {
      calls.push({ op: 'createRecord', spec })
      const made: DnsRecord = { id: `rec-${(minted += 1)}`, ttl: 1, ...spec }
      records.push(made)
      return made
    },
    updateRecord: async (_zone: string, id: string, spec: DnsRecordSpec) => {
      calls.push({ op: 'updateRecord', id, spec })
      const at = records.findIndex((r) => r.id === id)
      const made: DnsRecord = { id, ttl: 1, ...spec }
      if (at >= 0) records[at] = made
      return made
    },
    deleteRecord: async (_zone: string, id: string) => {
      calls.push({ op: 'deleteRecord', id })
      const at = records.findIndex((r) => r.id === id)
      if (at >= 0) records.splice(at, 1)
    },
    listRoutes: async () => {
      calls.push({ op: 'listRoutes' })
      return routes.map((r) => ({ ...r }))
    },
    createRoute: async (_zone: string, pattern: string, script: string) => {
      calls.push({ op: 'createRoute', pattern, script })
      routeAttempts += 1
      if (options.failRouteAt === routeAttempts) {
        // THE REAL ERROR TYPE, because the route's refusal-to-status mapping is
        // part of what is under test: the shipped client raises
        // `CloudflareApiError` for every non-2xx, and a double throwing a plain
        // `Error` would prove the 500 fall-through instead of the 502.
        throw new CloudflareApiError(
          'Cloudflare refused POST /zones/cf/workers/routes (403).',
          403,
        )
      }
      const made: WorkerRoute = { id: `route-${routeAttempts}`, pattern, script }
      routes.push(made)
      return made
    },
    deleteRoute: async (_zone: string, id: string) => {
      calls.push({ op: 'deleteRoute', id })
      const at = routes.findIndex((r) => r.id === id)
      if (at >= 0) routes.splice(at, 1)
    },
  } as unknown as Recorder
}

/** An active zone in this deployment's account, recorded and attributed. */
async function anActiveZone(
  apex: string,
  over: { accountId?: string | null; status?: 'active' | 'pending' } = {},
): Promise<void> {
  await recordZone(identityEnv(), {
    apex,
    cfZoneId: `cf-${apex}`,
    assignedNs: ['aria.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
    origin: 'operator',
    status: over.status ?? 'active',
    accountId: over.accountId === undefined ? 'acct-req258' : over.accountId,
    activatedAt: '2026-09-15T00:00:00.000Z',
  })
}

const callRoute = (
  path: string,
  deps: RouterDeps,
  init: RequestInit = {},
  envOver: Partial<RouterEnv> = {},
): Promise<Response> =>
  route(
    new Request(`https://app.test${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    }),
    routerEnv(envOver),
    { businessId: PLATFORM },
    deps,
  )

beforeAll(async () => {
  await applySchema()
})

describe('REQ-258 — what an attachment writes', () => {
  it('test_UAT_FC_REQ-258_the_plan_serves_the_apex_and_redirects_www', () => {
    // `www` IS NOT A QUESTION WE ASK ANYBODY. Both records are written because a
    // visitor who types `www.` must not meet a certificate error; the apex is
    // the address and `www` 301s to it. Somebody who names the `www` form is
    // naming the same website, so it resolves to the same plan rather than to an
    // inverted one: decide once.
    expect(servingPlan('alicesplumbing.com', 'alicesplumbing.com')).toEqual({
      canonicalHost: 'alicesplumbing.com',
      aliases: ['www.alicesplumbing.com'],
    })
    expect(servingPlan('https://WWW.AlicesPlumbing.com/', 'alicesplumbing.com')).toEqual({
      canonicalHost: 'alicesplumbing.com',
      aliases: ['www.alicesplumbing.com'],
    })
    // A deeper label is a deliberate choice of host, and `www.shop.…` is nothing
    // anybody would type.
    expect(servingPlan('shop.alicesplumbing.com', 'alicesplumbing.com')).toEqual({
      canonicalHost: 'shop.alicesplumbing.com',
      aliases: [],
    })
  })

  it('test_UAT_FC_REQ-258_the_records_are_proxied_and_point_nowhere_reachable', () => {
    const plan = servingPlan('alicesplumbing.com', 'alicesplumbing.com')
    const specs = servingRecords(plan)
    expect(specs).toHaveLength(4)
    // PROXIED IS THE LOAD-BEARING FLAG. A Worker route only intercepts a
    // hostname whose record is proxied; unproxied, the visitor goes straight to
    // the placeholder address, which is deliberately nothing.
    expect(specs.every((s) => s.proxied === true)).toBe(true)
    expect(specs.map((s) => `${s.type} ${s.name}`)).toEqual([
      'A alicesplumbing.com',
      'AAAA alicesplumbing.com',
      'A www.alicesplumbing.com',
      'AAAA www.alicesplumbing.com',
    ])
    // RFC 5737 TEST-NET-1 and RFC 6666's discard prefix. Neither is an origin
    // and neither can become one by accident: if the proxy were ever bypassed a
    // request must fail rather than arrive at whoever owns a real address
    // somebody picked as a placeholder.
    expect(new Set(specs.map((s) => s.content))).toEqual(new Set([SERVING_IPV4, SERVING_IPV6]))

    // `/ *` AND NOT `/`. A zone route matches a pattern, so `…com/` would route
    // the front page and nothing beneath it.
    expect(servedHosts(plan).map(routePatternFor)).toEqual([
      'alicesplumbing.com/*',
      'www.alicesplumbing.com/*',
    ])
  })
})

describe('REQ-258 — the mechanism', () => {
  it('test_UAT_FC_REQ-258_records_then_routes_then_the_row', async () => {
    const { admission } = await anOperator()
    const customer = await aCustomer()
    const apex = anApex()
    await anActiveZone(apex)
    const client = cloudflareZone()

    const response = await callRoute(
      ADMIN_DOMAINS_PATH,
      { admission, cloudflare: () => client } as RouterDeps,
      { method: 'POST', body: JSON.stringify({ host: apex, businessId: customer.businessId }) },
    )
    expect(response.status).toBe(200)

    // THE ORDER IS THE CONTRACT. Every record is written before the first route,
    // because a route without the record that makes it reachable is a hostname
    // Cloudflare routes and nothing answers.
    const firstRoute = client.calls.findIndex((c) => c.op === 'createRoute')
    const lastRecord = client.calls.map((c) => c.op).lastIndexOf('createRecord')
    expect(lastRecord).toBeGreaterThan(-1)
    expect(firstRoute).toBeGreaterThan(lastRecord)

    // AND THE ROUTES NAME `public-site`, because a route naming a script that
    // does not exist resolves, presents a valid certificate, and serves nothing.
    expect(client.routes.map((r) => r.pattern)).toEqual([`${apex}/*`, `www.${apex}/*`])
    expect(client.routes.every((r) => r.script === PUBLIC_SITE_SCRIPT)).toBe(true)

    // THE ROW LAST, and it says which host is the address.
    const live = await addressesOf(identityEnv(), customer.siteKey)
    expect(live.map((a) => a.host).sort()).toEqual([apex, `www.${apex}`].sort())
    expect(live.every((a) => a.kind === 'custom')).toBe(true)
    expect(canonicalAddress(live)?.host).toBe(apex)
  })

  it('test_UAT_FC_REQ-258_a_failed_route_leaves_no_row_and_no_records', async () => {
    const { admission } = await anOperator()
    const customer = await aCustomer()
    const apex = anApex()
    await anActiveZone(apex)
    // A pre-existing apex `A` — the ordinary shape of a domain that already runs
    // somebody's site — so the rollback has something to RESTORE rather than
    // only something to delete.
    const prior: DnsRecord = {
      id: 'rec-prior',
      type: 'A',
      name: apex,
      content: '203.0.113.7',
      ttl: 3600,
      proxied: false,
    }
    const client = cloudflareZone({ seed: [prior], failRouteAt: 2 })

    const response = await callRoute(
      ADMIN_DOMAINS_PATH,
      { admission, cloudflare: () => client } as RouterDeps,
      { method: 'POST', body: JSON.stringify({ host: apex, businessId: customer.businessId }) },
    )
    expect(response.status).toBe(502)

    // NO ROW. The row is written last precisely because every other part of the
    // product reads one as *"this address works"* — `publish` lets a site go live
    // on the strength of one, and a mailed link is composed from one.
    expect(await addressesOf(identityEnv(), customer.siteKey)).toHaveLength(0)

    // NO ROUTE, including the one that succeeded before the refusal.
    expect(client.routes).toHaveLength(0)

    // AND THE ZONE IS AS IT WAS FOUND — the record this operation created is
    // gone, and the one it replaced is back with its own content, its own TTL
    // and its own proxy setting.
    expect(client.records).toEqual([prior])
  })

  it('test_UAT_FC_REQ-258_an_existing_record_is_replaced_and_the_operator_is_told', async () => {
    const { admission } = await anOperator()
    const customer = await aCustomer()
    const apex = anApex()
    await anActiveZone(apex)
    const prior: DnsRecord = {
      id: 'rec-live',
      type: 'A',
      name: apex,
      content: '198.51.100.20',
      ttl: 3600,
      proxied: false,
    }
    const client = cloudflareZone({ seed: [prior] })

    const response = await callRoute(
      ADMIN_DOMAINS_PATH,
      { admission, cloudflare: () => client } as RouterDeps,
      { method: 'POST', body: JSON.stringify({ host: apex, businessId: customer.businessId }) },
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { replaced: DnsRecord[] }

    // REPORTED RATHER THAN SWALLOWED. Pointing a domain at us IS replacing
    // whatever its apex pointed at, so refusing would refuse the operation — but
    // an operator who has just taken a live site off the air is owed the list
    // rather than a surprise. Deciding whether a domain is SAFE to take over is
    // the pre-cutover sweep and is a different ticket.
    expect(body.replaced).toHaveLength(1)
    expect(body.replaced[0].content).toBe('198.51.100.20')

    // And the record now in the zone is ours, and proxied.
    const live = client.records.find((r) => r.name === apex && r.type === 'A')
    expect(live?.content).toBe(SERVING_IPV4)
    expect(live?.proxied).toBe(true)
  })

  it('test_UAT_FC_REQ-258_a_second_attachment_of_the_same_records_writes_nothing', async () => {
    const { admission } = await anOperator()
    const first = await aCustomer()
    const apex = anApex()
    await anActiveZone(apex)
    const client = cloudflareZone()
    const deps = { admission, cloudflare: () => client } as RouterDeps

    await callRoute(ADMIN_DOMAINS_PATH, deps, {
      method: 'POST',
      body: JSON.stringify({ host: apex, businessId: first.businessId }),
    })
    const writes = client.calls.filter((c) => c.op === 'createRecord' || c.op === 'updateRecord')
    expect(writes).toHaveLength(4)

    // THE HOST IS ALREADY POINTED AT A SITE, which the unique index decides and
    // this reports. What matters beside the refusal is that the zone was not
    // churned on the way to it: the records were already exactly right, so
    // nothing was written.
    const second = await aCustomer()
    const again = await callRoute(ADMIN_DOMAINS_PATH, deps, {
      method: 'POST',
      body: JSON.stringify({ host: apex, businessId: second.businessId }),
    })
    expect(again.status).toBe(409)
    const total = client.calls.filter((c) => c.op === 'createRecord' || c.op === 'updateRecord')
    expect(total).toHaveLength(4)
    expect(await addressesOf(identityEnv(), second.siteKey)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-258_the_guards_run_before_anything_is_written', async () => {
    const { admission } = await anOperator()
    const customer = await aCustomer()
    const deps = (client: Recorder) =>
      ({ admission, cloudflare: () => client } as RouterDeps)

    const attach = async (host: string, client: Recorder) =>
      callRoute(ADMIN_DOMAINS_PATH, deps(client), {
        method: 'POST',
        body: JSON.stringify({ host, businessId: customer.businessId }),
      })

    // A domain this deployment holds no zone for is a step not yet taken.
    const noZone = cloudflareZone()
    expect((await attach('nobody.example', noZone)).status).toBe(404)
    expect(noZone.calls).toHaveLength(0)

    // A zone with no account is [[REQ-257]]'s second guard — selectable by
    // nobody — restated where it bites.
    const unattributedApex = anApex()
    await anActiveZone(unattributedApex, { accountId: null })
    const unattributed = cloudflareZone()
    expect((await attach(unattributedApex, unattributed)).status).toBe(409)
    expect(unattributed.calls).toHaveLength(0)

    // A zone Cloudflare has not reported active cannot serve what we write into
    // it: the nameserver change has not landed.
    const pendingApex = anApex()
    await anActiveZone(pendingApex, { status: 'pending' })
    const pending = cloudflareZone()
    expect((await attach(pendingApex, pending)).status).toBe(409)
    expect(pending.calls).toHaveLength(0)

    // UNIVERSAL SSL COVERS THE APEX AND ONE LABEL BENEATH IT. A deeper host
    // would get records, get a route, resolve, and then present a certificate
    // the browser refuses — which reads to a customer as *"you broke my domain"*
    // and is unfixable without a paid certificate product.
    const deepApex = anApex()
    await anActiveZone(deepApex)
    const deep = cloudflareZone()
    const refused = await attach(`a.b.${deepApex}`, deep)
    expect(refused.status).toBe(400)
    expect(((await refused.json()) as { error: string }).error).toMatch(/one level/)
    expect(deep.calls).toHaveLength(0)

    // And the platform's own namespace is not reachable through this door: a
    // `1stc.site` hostname is chosen in settings, with its reserved list, its
    // finality and its one-per-business rule.
    const ours = cloudflareZone()
    const platform = await attach('alice.1stc.site', ours)
    expect(platform.status).toBe(400)
    expect(ours.calls).toHaveLength(0)

    // Nothing above left a row behind.
    expect(await addressesOf(identityEnv(), customer.siteKey)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-258_a_custom_domain_is_not_final_and_the_platform_hostname_gets_the_title_back', async () => {
    const { admission } = await anOperator()
    const customer = await aCustomer()
    const platformHost = (
      await claimHostname(identityEnv(), customer.businessId, `req258-${(seq += 1)}`)
    ).host
    const apex = anApex()
    await anActiveZone(apex)
    const client = cloudflareZone()
    const deps = { admission, cloudflare: () => client } as RouterDeps

    await callRoute(ADMIN_DOMAINS_PATH, deps, {
      method: 'POST',
      body: JSON.stringify({ host: apex, businessId: customer.businessId }),
    })
    expect(canonicalAddress(await addressesOf(identityEnv(), customer.siteKey))?.host).toBe(apex)

    // A `platform` HOSTNAME IS FINAL AND A CUSTOMER'S OWN DOMAIN IS NOT. It is
    // theirs: they may take it off this site and point it somewhere else
    // tomorrow, so the rows are DELETED rather than tombstoned — the opposite of
    // what revocation does on the scarce namespace, and deliberately.
    const released = await callRoute(`${ADMIN_DOMAINS_PATH}?host=${apex}`, deps, {
      method: 'DELETE',
    })
    expect(released.status).toBe(200)
    expect(((await released.json()) as { released: string[] }).released.sort()).toEqual(
      [apex, `www.${apex}`].sort(),
    )
    expect(client.routes).toHaveLength(0)
    expect(client.records).toHaveLength(0)

    // AND THE SITE STILL HAS AN ADDRESS. A site whose canonical row has gone
    // would otherwise hold rows that all 301 to a host with no row — a redirect
    // to nothing, on every address it has left.
    const left = await addressesOf(identityEnv(), customer.siteKey)
    expect(left.map((a) => a.host)).toEqual([platformHost])
    expect(canonicalAddress(left)?.host).toBe(platformHost)

    // IDEMPOTENT, on `revokeHostname`'s reasoning: an operator repeating a
    // command should get the same answer twice.
    const again = await callRoute(`${ADMIN_DOMAINS_PATH}?host=${apex}`, deps, { method: 'DELETE' })
    expect(again.status).toBe(200)
    expect(((await again.json()) as { released: string[] }).released).toEqual([])
  })

  it('test_UAT_FC_REQ-258_no_token_is_a_refusal_and_never_a_row', async () => {
    const { admission } = await anOperator()
    const customer = await aCustomer()
    const apex = anApex()
    await anActiveZone(apex)

    // THE FAIL-CLOSED RULE, and here it has teeth in the direction that matters:
    // a deployment that cannot reach Cloudflare cannot write a record or a
    // route, and attaching the row anyway would produce this ticket's first
    // falsifier — a row whose host resolves nowhere — rather than a refusal.
    const response = await callRoute(
      ADMIN_DOMAINS_PATH,
      { admission } as RouterDeps,
      { method: 'POST', body: JSON.stringify({ host: apex, businessId: customer.businessId }) },
      { CLOUDFLARE_DNS_TOKEN: '' },
    )
    expect(response.status).toBe(503)
    expect(((await response.json()) as { error: string }).error).toMatch(/CLOUDFLARE_DNS_TOKEN/)
    expect(await addressesOf(identityEnv(), customer.siteKey)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-258_nobody_else_can_see_that_the_surface_exists', async () => {
    const customer = await aCustomer()
    const apex = anApex()
    await anActiveZone(apex)
    const client = cloudflareZone()

    // 404 AND NOT 403. A caller asking whether an administrative surface exists
    // is owed nothing — 403 answers that question with *yes*.
    for (const init of [
      { method: 'POST', body: JSON.stringify({ host: apex, businessId: customer.businessId }) },
      { method: 'DELETE' },
    ]) {
      const response = await callRoute(
        ADMIN_DOMAINS_PATH,
        { admission: undefined, cloudflare: () => client } as unknown as RouterDeps,
        init,
      )
      expect(response.status).toBe(404)
    }
    expect(client.calls).toHaveLength(0)
    expect(await addressesOf(identityEnv(), customer.siteKey)).toHaveLength(0)
  })
})
