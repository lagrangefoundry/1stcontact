import { env } from 'cloudflare:test'
import { admit, type Admission, type IdentityEnv } from '../../apps/control-app/src/identity'
import { inviteAccount } from './invite-account'
import { newId } from '../../tools/generate/src/store/ids'
import {
  DOMAIN_PATH,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../../apps/control-app/src/router'
import type {
  CloudflareClient,
  DnsRecord,
  DnsRecordSpec,
  WorkerRoute,
} from '../../apps/control-app/src/cloudflare'
import { recordZone, zoneByApex } from '../../apps/control-app/src/zones'
import { siteOf } from '../../apps/control-app/src/hostname'
import type {
  DnsResolver,
  DomainSnapshot,
  RecordType,
  ResolvedRecord,
} from '../../apps/control-app/src/resolver'
import { businessDns } from '../../apps/control-app/src/dns-assistant'

/**
 * The fixtures [[REQ-260]]'s suites share: a customer with a domain attached
 * through the shipped route, Cloudflare and the resolver as doubles, and the
 * assistant's own port composed the way `router.ts` composes it.
 *
 * SHARED BECAUSE THE SUITES ARE TWO HALVES OF ONE STORY. The operations file
 * asserts what each change does; the undo file asserts what it takes to put one
 * back. Both need a domain that was really attached, and two copies of that
 * fixture would be two things that could drift from the shipped attach path.
 *
 * NEITHER DOUBLE IS A CONVENIENCE. A real Cloudflare token would rewrite the DNS
 * of every domain this deployment manages; a real resolver would make the
 * verdict depend on what somebody else's domain published this week.
 */
const PLATFORM = 'tenant-1stcontact'
const TEAM = 'https://req260.cloudflareaccess.com'
const AUD = 'req260-aud'

let seq = 0
const anEmail = (): string => `req260-${(seq += 1)}@example.test`
const anApex = (): string => `req260-${(seq += 1)}.example`

/** The identity environment, over the pool's real D1 and R2 bindings. */
export function identityEnv(): IdentityEnv {
  return { DB: env.DB, SITES: env.SITES, TENANT_ID: PLATFORM } as unknown as IdentityEnv
}

/** The router's environment, naming a zone credential so the routes are live. */
export function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    CLOUDFLARE_DNS_TOKEN: 'req260-token',
  } as RouterEnv
}

/** Cloudflare, as a double that KEEPS STATE — [[REQ-259]]'s, unchanged. */
export function cloudflare(seed: DnsRecord[] = []): {
  records: DnsRecord[]
  client: CloudflareClient
} {
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
  return { records, client }
}

/** A snapshot with nothing living on it — the clean case. */
export function clean(domain: string): DomainSnapshot {
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
    takenAt: '2026-09-17T00:00:00.000Z',
  }
}

/** The resolver, as a double. [[REQ-257]]'s interface and never a second reader. */
export function resolver(
  over: { snapshot?: DomainSnapshot; txt?: Record<string, string[]> } = {},
): { client: DnsResolver; asked: string[] } {
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

/** A customer: an account, a business it owns, and the starter site. */
export async function aCustomer(): Promise<{
  businessId: string
  siteKey: string
  admission: Admission
  email: string
  accountId: string
}> {
  const email = anEmail()
  const invited = await inviteAccount(identityEnv(), {
    email,
    accountName: `Business ${seq}`,
    endsAt: null,
  })
  const siteKey = await siteOf(identityEnv(), invited.businessId)
  if (siteKey === null) throw new Error('the provisioned business has no site')
  const row = await env.DB.prepare('SELECT owner_account_id FROM tenants WHERE id = ?')
    .bind(invited.businessId)
    .first<{ owner_account_id: string }>()
  return {
    businessId: invited.businessId,
    siteKey,
    admission: await admit(identityEnv(), email),
    email,
    accountId: String(row?.owner_account_id),
  }
}

/**
 * A customer with a domain attached, through the shipped route.
 *
 * THROUGH THE ROUTE AND NOT BY WRITING THE ROW. Which domain a business's
 * conversation is about is derived from the attachment, so a fixture that wrote
 * the mapping by hand would prove the derivation against its own invention.
 */
export async function aCustomerWithADomain(
  seed: DnsRecord[] = [],
): Promise<{
  businessId: string
  admission: Admission
  domain: string
  zone: ReturnType<typeof cloudflare>
  cfZoneId: string
}> {
  const customer = await aCustomer()
  const apex = anApex()
  await recordZone(identityEnv(), {
    apex,
    cfZoneId: `cf-${apex}`,
    assignedNs: ['aria.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
    origin: 'operator',
    status: 'active',
    accountId: customer.accountId,
    activatedAt: '2026-09-17T00:00:00.000Z',
  })
  const zone = cloudflare(seed)
  const deps: RouterDeps = {
    admission: customer.admission,
    cloudflare: () => zone.client,
    resolver: () => resolver().client,
    // NO SENDING. The mail toggle is [[REQ-259]]'s and is not what this ticket
    // changes; attaching without it keeps the zone holding exactly the records
    // these cases write, so an assertion about the zone is about them.
    resend: () => null,
  }
  const answer = await route(
    new Request(`https://app.test${DOMAIN_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ domain: apex, email: false }),
    }),
    routerEnv(),
    { businessId: customer.businessId },
    deps,
  )
  if (answer.status !== 200) throw new Error(`attaching the domain answered ${answer.status}`)
  const recorded = await zoneByApex(identityEnv(), apex)
  return {
    businessId: customer.businessId,
    admission: customer.admission,
    domain: apex,
    zone,
    cfZoneId: String(recorded?.cfZoneId),
  }
}

/** The assistant's port, as `router.ts` composes it. */
export function dnsFor(
  held: { businessId: string; zone: ReturnType<typeof cloudflare> },
  over: { resolver?: DnsResolver } = {},
) {
  return businessDns(
    identityEnv(),
    held.zone.client,
    over.resolver ?? resolver().client,
    held.businessId,
  )
}


/**
 * A second person, on a DIFFERENT account, who may operate this business.
 *
 * ROLE `owner`, DELIBERATELY — [[REQ-259]]'s fixture, unchanged and for its
 * reason: the gate is over the ACCOUNT and not over the role, and the only way
 * to assert that is a caller whose role is the strongest available and whose
 * account is somebody else's.
 */
export async function aColleagueOf(businessId: string): Promise<Admission> {
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

/**
 * Call one of the domain routes as this customer, through the shipped table.
 *
 * THE SHIPPED ROUTE AND NOT THE MODULE, because the claims these suites make are
 * about what a client's browser can and cannot do — including the two
 * authorisation answers, which live in the route and nowhere else.
 */
export function callDnsRoute(
  path: string,
  held: { businessId: string; admission: Admission; zone: { client: CloudflareClient } },
  init: RequestInit = {},
  as?: Admission,
): Promise<Response> {
  return route(
    new Request(`https://app.test${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    }),
    routerEnv(),
    { businessId: held.businessId },
    {
      admission: as ?? held.admission,
      cloudflare: () => held.zone.client,
      resolver: () => resolver().client,
      resend: () => null,
    } as RouterDeps,
  )
}
