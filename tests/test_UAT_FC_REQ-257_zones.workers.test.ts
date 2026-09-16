import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
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
import { isOpaqueId } from '../tools/generate/src/store/ids'
import {
  ADMIN_DNS_PATH,
  ADMIN_ZONES_PATH,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import type { CloudflareClient, CloudflareZone } from '../apps/control-app/src/cloudflare'
import type { DnsResolver } from '../apps/control-app/src/resolver'
import {
  PLATFORM_APEXES,
  PlatformZoneError,
  UnknownZoneError,
  ZoneApexTakenError,
  allZones,
  attributeZone,
  driftCheck,
  isPlatformApex,
  mirrorStatus,
  normaliseApex,
  recordZone,
  syncZoneStatus,
  zoneByApex,
  zonesForAccount,
} from '../apps/control-app/src/zones'

/**
 * [[REQ-257]] — **`zones`: whose a domain is, recorded once, and selectable by
 * nobody until somebody says.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs against a real D1 database with the
 * deployed schema — the migration list this product actually applies, including
 * `0010`'s unique index on `apex`, which is what several of these claims are
 * ABOUT. Accounts are made by the shipped `inviteAccount` path and the operator
 * by `ensurePlatformOperator`, which is the production route `PLATFORM_ADMINS`
 * takes. The route cases drive the shipped route table, and the gate case drives
 * the WORKER'S OWN `fetch` inside workerd with a real RS256 Access token
 * verified against a real JWKS — because the authorisation happens in
 * `index.ts` ahead of routing, and a suite that only called `route()` would
 * prove the `if` and say nothing about the half that can silently not exist.
 *
 * THE CLOUDFLARE CLIENT IS A DOUBLE AND THAT IS NOT A CONVENIENCE. The real one
 * can DELETE A ZONE; a suite holding a live credential would not fail against
 * the real API, it would succeed, against whatever account the credential
 * belongs to. What is on this side of the seam is the whole of what this ticket
 * builds: the guards, the provenance, the mirroring, the diff and the rows.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. `zones` PER THE TICKET — an opaque `zon_…` key that is never Cloudflare's,
 *     `apex` with a UNIQUE INDEX, `origin`, `status`, the assigned pair, and the
 *     two timestamps.
 *  2. **`origin` IS WRITTEN ONCE AND NEVER DERIVED.** Nothing read back from
 *     Cloudflare decides whose a zone is; the operator decides, and the row
 *     records it.
 *  3. **`status` MIRRORS CLOUDFLARE'S** rather than inventing a parallel one.
 *  4. GUARD ONE — `1stc.site` AND `1stcontact.io` ARE PERMANENTLY
 *     UNATTRIBUTABLE, from both directions, in code and not by convention.
 *  5. GUARD TWO — **A ZONE WITH NO `account_id` IS SELECTABLE BY NOBODY.**
 *  6. THE UNIQUE INDEX ON `apex` IS THE AUTHORITY, on `0008`'s reasoning.
 *  7. THE BACKFILL IS NOT A FLOW — no deletion, no re-add, no new pair.
 *  8. THE DRIFT CHECK REPORTS AND RECONCILES NOTHING.
 *  9. NO TOKEN IS A REFUSAL AND NOT AN EMPTY REPORT — a drift check assembled
 *     from no upstream data says everything is fine, which is the one answer it
 *     must never give by accident.
 * 10. THE OPERATOR SURFACE IS THE OPERATOR'S — 404 to everybody else.
 */

const PLATFORM = 'req257-platform'
const TEAM = 'https://req257-team.cloudflareaccess.com'
const AUD = 'a'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

function routerEnv(overrides: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    CLOUDFLARE_DNS_TOKEN: 'req257-token',
    ...overrides,
  } as RouterEnv
}

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...overrides,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A REAL Access token, minted against the key the stubbed JWKS publishes. */
async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req257-key', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600, email }
  const signed = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signing.privateKey,
    new TextEncoder().encode(signed) as unknown as BufferSource,
  )
  return `${signed}.${b64url(new Uint8Array(signature))}`
}

function stubJwks(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url === certsUrl(TEAM)) {
        return new Response(JSON.stringify(jwks), {
          headers: { 'content-type': 'application/json' },
        })
      }
      throw new Error(`unexpected fetch to ${url}`)
    }),
  )
}

let seq = 0
const anEmail = (): string => `req257-${(seq += 1)}@example.test`
/** An apex nothing else in the suite will ask for — `apex` is UNIQUE. */
const anApex = (): string => `req257-${(seq += 1)}.example`

/** An ordinary account, through the shipped path. */
async function anAccount() {
  const email = anEmail()
  const invited = await inviteAccount(identityEnv(), { email, accountName: 'A business', endsAt: null })
  await acceptTerms(identityEnv(), invited.user.id)
  return { ...invited, email, accountId: invited.user.account_id as string }
}

/** An owner of the 1st Contact business — what the operator gate asks for. */
async function anOperator() {
  const email = anEmail()
  await ensurePlatformOperator(identityEnv(), email)
  const person = await personByEmail(identityEnv(), PLATFORM, email)
  if (!person) throw new Error('the seeded operator was not readable back')
  await acceptTerms(identityEnv(), person.id)
  const admission = await admit(identityEnv(), email)
  return { email, admission }
}

/** A Cloudflare account, as a double over a list of zones. */
function cloudflareHolding(zones: CloudflareZone[]): CloudflareClient & { deleted: string[] } {
  const deleted: string[] = []
  const refuse = () => {
    throw new Error('this case must not have reached Cloudflare')
  }
  return {
    deleted,
    accountId: async () => 'cf-account',
    listZones: async () => zones,
    readZone: async (id) => zones.find((z) => z.id === id) ?? null,
    createZone: refuse,
    deleteZone: async (id) => {
      deleted.push(id)
    },
    listRecords: refuse,
    createRecord: refuse,
    updateRecord: refuse,
    deleteRecord: refuse,
    createRoute: refuse,
    deleteRoute: refuse,
  } as unknown as CloudflareClient & { deleted: string[] }
}

const aZone = (apex: string, status = 'active'): CloudflareZone => ({
  id: `cf-${apex}`,
  apex,
  status,
  nameServers: ['aria.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
  accountId: 'cf-account',
})

/** Drive the shipped route table as an operator, with the seams injected. */
function asOperator(
  admission: Admission,
  businessId: string,
  over: Partial<RouterDeps> = {},
): RouterDeps {
  return { admission, ...over } as RouterDeps & { businessId?: string }
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
  const params = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }
  signing = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'req257-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-257 — the zone table', () => {
  it('test_UAT_FC_REQ-257_a_zone_is_keyed_by_ours_and_never_by_cloudflares', async () => {
    const account = await anAccount()
    const apex = anApex()
    const zone = await recordZone(identityEnv(), {
      apex,
      cfZoneId: 'cf-zone-abc123',
      assignedNs: ['aria.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
      origin: 'operator',
      status: 'active',
      accountId: account.accountId,
      activatedAt: '2026-09-15T00:00:00.000Z',
    })

    // 128 BITS FROM A CSPRNG BEHIND A TYPE PREFIX ([[REQ-190]]). Cloudflare's id
    // is a perfectly good unique value and using it as the key would be
    // data-as-key wearing a vendor's badge: it changes when a zone is deleted
    // and re-added, which is exactly what the trap on-ramp requires.
    expect(isOpaqueId(zone.id, 'zon')).toBe(true)
    expect(zone.id).not.toContain('cf-zone-abc123')

    // AND EVERY COLUMN ROUND-TRIPS, including the pair, which is JSON because
    // Cloudflare assigns two today and the number is theirs to change.
    const read = await zoneByApex(identityEnv(), apex)
    expect(read).toEqual(zone)
    expect(read?.assignedNs).toEqual(['aria.ns.cloudflare.com', 'bob.ns.cloudflare.com'])
    expect(read?.origin).toBe('operator')
    expect(read?.activatedAt).toBe('2026-09-15T00:00:00.000Z')
  })

  it('test_UAT_FC_REQ-257_the_unique_index_on_apex_is_the_authority', async () => {
    const account = await anAccount()
    const apex = anApex()
    const spec = {
      apex,
      cfZoneId: 'cf-1',
      origin: 'operator' as const,
      status: 'active' as const,
      accountId: account.accountId,
    }
    await recordZone(identityEnv(), spec)

    // CLOUDFLARE ALLOWS ONE ZONE PER APEX PER ACCOUNT, so two rows for one apex
    // is a state the upstream this mirrors cannot be in. The refusal comes from
    // the database rather than from a check that raced — this code attempts the
    // insert and reports what the index decided.
    const second = anAccount()
    await expect(
      recordZone(identityEnv(), { ...spec, cfZoneId: 'cf-2', accountId: (await second).accountId }),
    ).rejects.toThrow(ZoneApexTakenError)

    // And the first row is untouched: the loser is refused, not merged over.
    expect((await zoneByApex(identityEnv(), apex))?.cfZoneId).toBe('cf-1')
  })

  it('test_UAT_FC_REQ-257_the_platform_apexes_can_never_belong_to_an_account', async () => {
    // `1stc.site` CARRIES EVERY CUSTOMER'S ADDRESS. Attributing it to one
    // account would hand that account the whole namespace — every other
    // customer's hostname, to redirect or to take down.
    expect([...PLATFORM_APEXES].sort()).toEqual(['1stc.site', '1stcontact.io'])
    const account = await anAccount()

    // BEFORE ANYTHING IS RECORDED: a platform zone Cloudflare holds and this
    // table has not heard of is flagged as ours in the drift report. *"Either a
    // platform zone or a mistake"*, made legible — the two will be in every
    // report forever if nobody records them, and flagging them is what stops an
    // operator reading past two permanent entries and missing the third.
    const holding = cloudflareHolding([aZone('1stc.site'), aZone('1stcontact.io')])
    const beforeAnyRow = await driftCheck(identityEnv(), holding)
    for (const apex of PLATFORM_APEXES) {
      const entry = beforeAnyRow.unrecorded.find((z) => z.apex === apex)
      expect(entry?.platform, `${apex} was not flagged as this product's own`).toBe(true)
    }

    for (const apex of PLATFORM_APEXES) {
      // FROM BOTH DIRECTIONS, because either half alone is bypassable.
      await expect(
        recordZone(identityEnv(), {
          apex,
          cfZoneId: 'cf-platform',
          origin: 'operator',
          status: 'active',
          accountId: account.accountId,
        }),
      ).rejects.toThrow(PlatformZoneError)

      await expect(
        recordZone(identityEnv(), {
          apex,
          cfZoneId: 'cf-platform',
          origin: 'platform',
          status: 'active',
          accountId: account.accountId,
        }),
      ).rejects.toThrow(PlatformZoneError)

      // A PLATFORM ZONE MAY BE RECORDED, belonging to nobody. That is the only
      // shape admitted, and the guard is in code rather than being a list an
      // operator is trusted to observe.
      const recorded = await recordZone(identityEnv(), {
        apex,
        cfZoneId: `cf-${apex}`,
        origin: 'platform',
        status: 'active',
        accountId: null,
      })
      expect(recorded.accountId).toBeNull()
    }

    // AND THE BACKFILL REFUSES THEM TOO, even when the zone really is in the
    // account — which it always is, since that is where they live.
    const client = cloudflareHolding([aZone('1stc.site')])
    await expect(
      attributeZone(identityEnv(), client, { apex: '1stc.site', accountId: account.accountId }),
    ).rejects.toThrow(PlatformZoneError)

    // The refusal is about the apex and survives the shapes an operator types.
    expect(isPlatformApex('HTTPS://1stc.site/')).toBe(true)
    expect(normaliseApex('  HTTPS://Alice.Example/settings ')).toBe('alice.example')
  })

  it('test_UAT_FC_REQ-257_a_zone_with_no_account_is_selectable_by_nobody', async () => {
    const account = await anAccount()
    const theirs = anApex()
    const orphan = anApex()

    await recordZone(identityEnv(), {
      apex: theirs,
      cfZoneId: 'cf-theirs',
      origin: 'operator',
      status: 'active',
      accountId: account.accountId,
    })
    // An unattributed row — the shape a claim flow writes before anybody has
    // said whose it is, and the shape the drift check exists to notice.
    await recordZone(identityEnv(), {
      apex: orphan,
      cfZoneId: 'cf-orphan',
      origin: 'nameserver',
      status: 'pending',
      accountId: null,
    })

    const pool = await zonesForAccount(identityEnv(), account.accountId)
    expect(pool.map((z) => z.apex)).toEqual([theirs])

    // DEFAULT CLOSED, AND IT IS A PROPERTY OF THE SQL RATHER THAN OF THE CALLER.
    // A caller that passed `null` through — from an unauthenticated session,
    // from a field that was absent in a body — must not be handed every
    // unattributed zone on the deployment.
    expect(await zonesForAccount(identityEnv(), null)).toEqual([])
    expect(await zonesForAccount(identityEnv(), '')).toEqual([])

    // The status filter narrows and never widens: it cannot reach the orphan.
    const active = await zonesForAccount(identityEnv(), account.accountId, { status: 'active' })
    expect(active.map((z) => z.apex)).toEqual([theirs])
    expect(await zonesForAccount(identityEnv(), account.accountId, { status: 'pending' })).toEqual([])
  })

  it('test_UAT_FC_REQ-257_the_backfill_records_the_operators_decision_and_mirrors_the_rest', async () => {
    const account = await anAccount()
    const apex = anApex()
    const client = cloudflareHolding([aZone(apex), aZone(anApex(), 'pending')])

    const zone = await attributeZone(identityEnv(), client, { apex, accountId: account.accountId })

    // WHOSE IT IS CAME FROM THE OPERATOR. `origin` records that, once, and
    // nothing read back from Cloudflare decided it — which is this ticket's
    // first falsifier.
    expect(zone.origin).toBe('operator')
    expect(zone.accountId).toBe(account.accountId)

    // EVERYTHING ELSE IS CLOUDFLARE'S AND IS MIRRORED: the id every later API
    // call is addressed by, the pair we would show them, and the status.
    expect(zone.cfZoneId).toBe(`cf-${apex}`)
    expect(zone.assignedNs).toEqual(['aria.ns.cloudflare.com', 'bob.ns.cloudflare.com'])
    expect(zone.status).toBe('active')
    expect(zone.activatedAt).not.toBeNull()

    // NOT A FLOW: nothing was deleted and nothing was re-added, so there is no
    // window in which the operator's own site is dark.
    expect(client.deleted).toEqual([])

    // AND IT REFUSES AN APEX THE ACCOUNT DOES NOT HOLD, rather than writing a
    // row naming a Cloudflare zone that resolves to nothing.
    await expect(
      attributeZone(identityEnv(), client, { apex: 'notours.example', accountId: account.accountId }),
    ).rejects.toThrow(UnknownZoneError)
  })

  it('test_UAT_FC_REQ-257_status_mirrors_cloudflares_and_is_never_computed_here', async () => {
    // CLOUDFLARE RUNS THE STATE MACHINE and observes the delegation from a
    // position we do not have. A second, independently computed notion of
    // activeness is a second thing that can be wrong, and the one that would be
    // wrong is ours.
    expect(mirrorStatus('active')).toBe('active')
    expect(mirrorStatus('ACTIVE')).toBe('active')
    expect(mirrorStatus('pending')).toBe('pending')
    expect(mirrorStatus('initializing')).toBe('pending')
    // AND IT NEVER INVENTS OUR OWN TWO. `released` and `revoked` are decisions
    // about a zone that Cloudflare has no opinion about.
    expect(mirrorStatus('moved')).toBe('pending')

    const account = await anAccount()
    const apex = anApex()
    const pending = cloudflareHolding([aZone(apex, 'pending')])
    const zone = await attributeZone(identityEnv(), pending, {
      apex,
      accountId: account.accountId,
    })
    expect(zone.status).toBe('pending')
    expect(zone.activatedAt).toBeNull()

    // The customer pastes the pair; Cloudflare observes it and flips. We follow.
    const active = cloudflareHolding([aZone(apex, 'active')])
    const synced = await syncZoneStatus(identityEnv(), active, apex)
    expect(synced?.status).toBe('active')
    expect(synced?.activatedAt).not.toBeNull()
    // AND ONLY STATUS MOVED. Provenance is ours and Cloudflare cannot change it.
    expect(synced?.origin).toBe('operator')
    expect(synced?.accountId).toBe(account.accountId)

    // `activated_at` IS WRITTEN ONCE AND NEVER CLEARED: it records that this
    // zone HAS served, which stays true after a later status change.
    const backToPending = cloudflareHolding([aZone(apex, 'pending')])
    const later = await syncZoneStatus(identityEnv(), backToPending, apex)
    expect(later?.status).toBe('pending')
    expect(later?.activatedAt).toBe(synced?.activatedAt)
  })

  it('test_UAT_FC_REQ-257_the_drift_check_asks_a_question_and_reconciles_nothing', async () => {
    const account = await anAccount()
    const known = anApex()
    const byHand = anApex()
    const gone = anApex()
    const orphan = anApex()

    await recordZone(identityEnv(), {
      apex: known,
      cfZoneId: `cf-${known}`,
      origin: 'operator',
      status: 'active',
      accountId: account.accountId,
    })
    await recordZone(identityEnv(), {
      apex: gone,
      cfZoneId: `cf-${gone}`,
      origin: 'operator',
      status: 'active',
      accountId: account.accountId,
    })
    await recordZone(identityEnv(), {
      apex: orphan,
      cfZoneId: `cf-${orphan}`,
      origin: 'nameserver',
      status: 'pending',
      accountId: null,
    })

    const before = await allZones(identityEnv())
    const client = cloudflareHolding([
      aZone(known, 'pending'),
      aZone(byHand),
      aZone(orphan, 'pending'),
    ])
    const drift = await driftCheck(identityEnv(), client)

    // SOMEBODY ADDING A ZONE BY HAND IN THE DASHBOARD IS A THING THAT WILL
    // HAPPEN, and the alternative to noticing is a zone nobody can offboard
    // because nothing recorded how it arrived. It is flagged as NOT one of ours,
    // which is the half of *"either a platform zone or a mistake"* that needs
    // somebody to act. (The platform half is pinned in the guard case above,
    // before anything has recorded them.)
    expect(drift.unrecorded.map((z) => z.apex)).toEqual(expect.arrayContaining([byHand]))
    expect(drift.unrecorded.find((z) => z.apex === byHand)?.platform).toBe(false)

    // A zone we recorded that Cloudflare no longer holds.
    expect(drift.missing.map((z) => z.apex)).toEqual(expect.arrayContaining([gone]))

    // Both know it and they disagree about where it is.
    expect(drift.statusDrift).toEqual(
      expect.arrayContaining([{ apex: known, recorded: 'active', cloudflare: 'pending' }]),
    )

    // Rows nobody has claimed — the question addressed to a person.
    expect(drift.unattributed.map((z) => z.apex)).toEqual(expect.arrayContaining([orphan]))
    // A `platform` row is not unattributed, it is unattributABLE, and asking an
    // operator to decide would be asking for a decision they must not make.
    expect(drift.unattributed.some((z) => z.origin === 'platform')).toBe(false)

    // **IT WROTE NOTHING.** `origin` is a human decision and there is no way to
    // derive it, so a check that reconciled would be inventing the one fact this
    // whole table exists to record.
    expect(await allZones(identityEnv())).toEqual(before)
  })
})

describe('REQ-257 — the operator surface', () => {
  it('test_UAT_FC_REQ-257_the_report_and_the_backfill_are_reachable_by_the_operator', async () => {
    const { admission } = await anOperator()
    const account = await anAccount()
    const apex = anApex()
    const strayApex = anApex()
    const client = cloudflareHolding([aZone(apex), aZone(strayApex)])
    const deps = asOperator(admission, PLATFORM, { cloudflare: () => client })

    // THE BACKFILL: an operator names the apex and the account, by address,
    // because an operator knows who somebody is by their address and has no
    // reason to hold an `acct_…`.
    const written = await callRoute(ADMIN_ZONES_PATH, deps, {
      method: 'POST',
      body: JSON.stringify({ apex, accountEmail: account.email }),
    })
    expect(written.status).toBe(200)
    const created = (await written.json()) as { zone: { origin: string; accountId: string } }
    expect(created.zone.origin).toBe('operator')
    expect(created.zone.accountId).toBe(account.accountId)

    // THE REPORT: the rows and the drift together, because the question an
    // operator has is "what is the state of this" and the drift is only readable
    // against the rows it is a diff of.
    const report = await callRoute(ADMIN_ZONES_PATH, deps)
    expect(report.status).toBe(200)
    const body = (await report.json()) as {
      zones: { apex: string }[]
      drift: {
        unrecorded: { apex: string; platform: boolean }[]
        missing: unknown[]
        statusDrift: unknown[]
        unattributed: unknown[]
      }
    }
    expect(body.zones.map((z) => z.apex)).toContain(apex)
    // THE ROWS AND THE DRIFT TOGETHER, and the drift carries all four questions
    // — a report missing one of them is one an operator would read as an all
    // clear it never gave.
    expect(Object.keys(body.drift).sort()).toEqual([
      'missing',
      'statusDrift',
      'unattributed',
      'unrecorded',
    ])
    expect(body.drift.unrecorded.find((z) => z.apex === strayApex)?.platform).toBe(false)

    // A SECOND BACKFILL OF THE SAME APEX IS THE INDEX'S REFUSAL, reported as one.
    const again = await callRoute(ADMIN_ZONES_PATH, deps, {
      method: 'POST',
      body: JSON.stringify({ apex, accountEmail: account.email }),
    })
    expect(again.status).toBe(409)

    // A PLATFORM APEX IS REFUSED THROUGH THE ROUTE TOO, not only in the module.
    const refused = await callRoute(ADMIN_ZONES_PATH, deps, {
      method: 'POST',
      body: JSON.stringify({ apex: '1stcontact.io', accountEmail: account.email }),
    })
    expect(refused.status).toBe(403)
    expect(((await refused.json()) as { error: string }).error).toMatch(/cannot belong to an account/)

    // An apex Cloudflare does not hold is a step not yet taken, not a conflict.
    const unknown = await callRoute(ADMIN_ZONES_PATH, deps, {
      method: 'POST',
      body: JSON.stringify({ apex: 'nobody.example', accountEmail: account.email }),
    })
    expect(unknown.status).toBe(404)
  })

  it('test_UAT_FC_REQ-257_no_token_is_a_refusal_and_never_an_empty_report', async () => {
    const { admission } = await anOperator()
    // THE FAIL-CLOSED RULE, AND IT HAS TEETH IN AN UNOBVIOUS DIRECTION. A drift
    // check assembled from no upstream data reports NO DRIFT, which is the one
    // answer it must never give by accident.
    const response = await callRoute(
      ADMIN_ZONES_PATH,
      { admission } as RouterDeps,
      {},
      { CLOUDFLARE_DNS_TOKEN: '' },
    )
    expect(response.status).toBe(503)
    expect(((await response.json()) as { error: string }).error).toMatch(/CLOUDFLARE_DNS_TOKEN/)
  })

  it('test_UAT_FC_REQ-257_the_resolver_has_a_real_entry_point', async () => {
    const { admission } = await anOperator()
    const resolver: DnsResolver = {
      resolve: async () => [],
      probeDkim: async () => [],
      snapshot: async (domain) => ({
        domain,
        records: { A: [], AAAA: [], CNAME: [], MX: [], TXT: [], NS: [] },
        www: [],
        dkim: [{ selector: 'selector1', provider: 'Microsoft 365', value: 'p=x' }],
        mail: { host: 'alice-com.mail.protection.outlook.com', provider: 'Microsoft 365' },
        web: null,
        senders: [],
        hasLiveMail: true,
        hasLiveWeb: false,
        live: true,
        takenAt: '2026-09-15T00:00:00.000Z',
      }),
    }
    const deps = asOperator(admission, PLATFORM, { resolver: () => resolver })

    const response = await callRoute(`${ADMIN_DNS_PATH}?domain=alice.example`, deps)
    expect(response.status).toBe(200)
    const snapshot = (await response.json()) as { live: boolean; mail: { provider: string } }
    // **IS THERE A LIVE BUSINESS ON THIS DOMAIN TODAY** — the question the epic
    // says decides the work, answered for the person about to attribute a zone.
    expect(snapshot.live).toBe(true)
    expect(snapshot.mail.provider).toBe('Microsoft 365')

    const named = await callRoute(ADMIN_DNS_PATH, deps)
    expect(named.status).toBe(400)
  })

  it('test_UAT_FC_REQ-257_nobody_else_can_see_that_the_surface_exists', async () => {
    // DRIVEN THROUGH THE WORKER'S OWN `fetch`, because the authorisation happens
    // in `index.ts` ahead of routing and a suite calling `route()` with an
    // admission it built itself would prove the `if` and say nothing about the
    // half that can silently not exist.
    stubJwks()
    const customer = await anAccount()
    const token = await mint(customer.email)

    for (const path of [ADMIN_ZONES_PATH, `${ADMIN_DNS_PATH}?domain=alice.example`]) {
      const response = await worker.fetch(
        new Request(`https://app.example${path}`, {
          headers: { 'cf-access-jwt-assertion': token },
        }),
        workerEnv(),
      )
      // 404 AND NOT 403. This caller asked whether an administrative surface
      // exists, and 403 answers that question with *yes* — a fact about the
      // system rather than about them.
      expect(response.status).toBe(404)
    }

    // And an anonymous caller gets no further.
    const anonymous = await worker.fetch(
      new Request(`https://app.example${ADMIN_ZONES_PATH}`),
      workerEnv(),
    )
    expect(anonymous.status).not.toBe(200)
  })
})
