import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { ADMIN_SITES_PATH, route } from '../apps/control-app/src/router'
import type { RouterEnv } from '../apps/control-app/src/router'
import {
  admit,
  ensurePlatformOperator,
  type Admission,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { claimHostname, siteOf } from '../apps/control-app/src/hostname'
import { platformSites } from '../apps/control-app/src/directory'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'
import { newId } from '../tools/generate/src/store/ids'

/**
 * [[REQ-298]] — **`GET /api/admin/sites`: every site on the platform, with whose
 * it is and where it is**.
 *
 * WHAT MAKES THIS EVIDENCE. Every business, account and site below is written by
 * the SHIPPED provisioning path — `inviteAccount`, `provisionBusiness` — into a
 * real D1 inside workerd with the deployed migrations applied, and every address
 * is taken by the shipped `claimHostname`. The route cases go through `route()`
 * itself with a real `Admission` minted from real rows, so the gate that decides
 * who may read a directory of every customer's sites is the deployed one.
 *
 * WHY THIS ROUTE EXISTS SEPARATELY FROM THE METER, which is the claim most worth
 * falsifying: `/api/admin/spend/businesses` answers only businesses with a
 * measured turn, so a console built on it alone would omit exactly the customer
 * nobody has looked at. This route is the directory, and the cases below include
 * a business that has never spent anything and a site that has never been
 * published.
 *
 * THE FALSIFIERS:
 *
 *   - *anyone but an owner of the platform business reading it*, and a refusal
 *     that is not the ordinary 404;
 *   - *a site dropped by an inner join* because its owning account row has gone
 *     — exactly the row worth noticing;
 *   - *a blank where "this is 1st Contact's own site" belongs*, which is a
 *     different absence from a missing record and must read as one;
 *   - *a second read of `site_domains`* disagreeing with `hostname.ts` about
 *     which host a link should wear;
 *   - *a portal listed as a site*, which would put a permanent "no public
 *     address" row beside every business;
 *   - *a period parameter*, which would be a parameter that changed no answer.
 */

const PLATFORM = 'req298-platform'

let seq = 0
const anEmail = (): string => `req298-${(seq += 1)}@example.test`

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as RouterEnv
}

const ask = async (path: string, admission: Admission | null): Promise<Response> =>
  route(new Request(`https://app.example${path}`), routerEnv(), { businessId: PLATFORM }, {
    admission,
  })

async function operator(): Promise<Extract<Admission, { ok: true }>> {
  const email = 'req298-operator@example.test'
  await ensurePlatformOperator(identityEnv(), email)
  const admission = await admit(identityEnv(), email)
  if (!admission.ok) throw new Error(`expected an admitted operator, got ${admission.reason}`)
  return admission
}

interface Row {
  site: string
  business: string
  businessName: string | null
  ownerAccount: string | null
  ownerAccountName: string | null
  ownerAccountStatus: string | null
  address: string | null
  createdAt: string
}

/** The four businesses this suite is about, and what makes each one interesting. */
let published: { businessId: string; siteKey: string; host: string }
let unpublished: { businessId: string; siteKey: string }
let twoSites: { businessId: string; first: string; second: string }
let accountGone: { businessId: string; siteKey: string; accountId: string }
let platformOwned: { businessId: string; siteKey: string }

beforeAll(async () => {
  await applySchema()

  // A CUSTOMER WHO IS LIVE — one site, one taken hostname.
  const live = await inviteAccount(identityEnv(), {
    email: anEmail(),
    accountName: 'Published Ltd',
    endsAt: null,
  })
  const liveSite = await siteOf(identityEnv(), live.businessId)
  if (liveSite === null) throw new Error('the provisioned business has no site')
  const address = await claimHostname(identityEnv(), live.businessId, 'req298published')
  published = { businessId: live.businessId, siteKey: liveSite, host: address.host }

  // A CUSTOMER WHO HAS NEVER PUBLISHED. The row this route exists for: the
  // meter has never heard of them and their site has no address, so a console
  // built on the league alone would never show them at all.
  const quiet = await inviteAccount(identityEnv(), {
    email: anEmail(),
    accountName: 'Quiet Ltd',
    endsAt: null,
  })
  const quietSite = await siteOf(identityEnv(), quiet.businessId)
  if (quietSite === null) throw new Error('the provisioned business has no site')
  unpublished = { businessId: quiet.businessId, siteKey: quietSite }

  // A BUSINESS WITH TWO SITES, because the list is one row per SITE and not per
  // business. The second is inserted directly: provisioning mints exactly one
  // ([[REQ-236]]) and nothing in the product adds a second yet, but the route
  // must already be right about it.
  twoSites = {
    businessId: quiet.businessId,
    first: quietSite,
    second: newId('site'),
  }
  await env.DB.prepare(
    'INSERT INTO sites (id, tenant_id, kind, version, counter, created_at, updated_at) ' +
      "VALUES (?, ?, 'site', 0, 0, ?, ?)",
  )
    .bind(twoSites.second, quiet.businessId, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z')
    .run()

  // A PORTAL, which must NOT be listed. It is authored under the same business
  // ([[REQ-236]]'s `kind`) and is not the thing a public hostname reaches, so
  // listing it would put a permanent "no public address" row beside a business
  // that has published perfectly well.
  await env.DB.prepare(
    'INSERT INTO sites (id, tenant_id, kind, version, counter, created_at, updated_at) ' +
      "VALUES (?, ?, 'portal', 0, 0, ?, ?)",
  )
    .bind(newId('site'), live.businessId, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z')
    .run()

  // A BUSINESS NAMING AN ACCOUNT THAT NO LONGER ANSWERS.
  //
  // CONSTRUCTIBLE BECAUSE `tenants.owner_account_id` CARRIES NO FOREIGN KEY, and
  // `0001_baseline.sql` argues that deliberately — the pair would be a cycle,
  // since an account belongs to a tenant too. So the column can name a row that
  // is not there, which is exactly the row an inner join would drop and the one
  // an operator most needs to see.
  //
  // WRITTEN AS A RE-POINT RATHER THAN AS A DELETE because the account itself is
  // referenced by its `users` row, which IS a foreign key: deleting it would
  // require unpicking the person as well, and the state under test is the
  // tenants row, not the way it got there.
  const stray = await inviteAccount(identityEnv(), {
    email: anEmail(),
    accountName: 'Orphaned Ltd',
    endsAt: null,
  })
  const straySite = await siteOf(identityEnv(), stray.businessId)
  if (straySite === null) throw new Error('no site')
  const vanished = newId('acct')
  await env.DB.prepare('UPDATE tenants SET owner_account_id = ? WHERE id = ?')
    .bind(vanished, stray.businessId)
    .run()
  accountGone = { businessId: stray.businessId, siteKey: straySite, accountId: vanished }

  // 1st CONTACT'S OWN SITE. `tenants.owner_account_id` is NULL for the platform
  // business and for nothing else, which is a DIFFERENT absence from a missing
  // account record — the console words the two differently and the route has to
  // be able to tell them apart. Inserted directly because provisioning always
  // writes an owner, which is the point: only the platform row lacks one.
  const ours = `${PLATFORM}-owned`
  await env.DB.prepare(
    "INSERT INTO tenants (id, name, status, owner_account_id, created_at) " +
      "VALUES (?, '1st Contact', 'active', NULL, ?)",
  )
    .bind(ours, '2026-01-01T00:00:00.000Z')
    .run()
  const ourSite = newId('site')
  await env.DB.prepare(
    'INSERT INTO sites (id, tenant_id, kind, version, counter, created_at, updated_at) ' +
      "VALUES (?, ?, 'site', 0, 0, ?, ?)",
  )
    .bind(ourSite, ours, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')
    .run()
  platformOwned = { businessId: ours, siteKey: ourSite }
})

async function accountOf(businessId: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT owner_account_id FROM tenants WHERE id = ?')
    .bind(businessId)
    .first<{ owner_account_id: string | null }>()
  return row?.owner_account_id ?? null
}

const read = async (): Promise<Row[]> => {
  const response = await ask(ADMIN_SITES_PATH, await operator())
  expect(response.status).toBe(200)
  return ((await response.json()) as { sites: Row[] }).sites
}

describe('REQ-298 — the directory behind the console', () => {
  it('test_UAT_FC_REQ-298_only_an_owner_of_the_platform_business_may_read_the_directory', async () => {
    // 404 AND NOT 403, on every other `/api/admin/` route's reasoning: somebody
    // asking whether an administrative surface exists is owed nothing. What this
    // one would otherwise hand over is every customer we have, who owns them and
    // where their sites are — which is not less than the meter declines to give.
    const refused = await ask(ADMIN_SITES_PATH, null)
    expect(refused.status).toBe(404)
    expect(await refused.text()).toBe('Not found.')

    // AND A REAL CUSTOMER IS REFUSED THE SAME WAY. They are admitted, they own a
    // business, and they own the wrong one — which is the case a gate written as
    // "is anybody there" would pass.
    const customer = await admit(identityEnv(), anEmail())
    expect((await ask(ADMIN_SITES_PATH, customer)).status).toBe(404)

    expect((await ask(ADMIN_SITES_PATH, await operator())).status).toBe(200)
  })

  it('test_UAT_FC_REQ-298_one_row_per_site_naming_its_business_and_its_owner_account', async () => {
    const sites = await read()
    const live = sites.find((row) => row.site === published.siteKey)!

    expect(live.business).toBe(published.businessId)
    expect(live.businessName).toBe('Published Ltd')
    expect(live.ownerAccount).toBe(await accountOf(published.businessId))
    expect(live.ownerAccountStatus).toBe('active')
    expect(live.createdAt).toBeTruthy()

    // ONE ROW PER SITE AND NOT PER BUSINESS. The business with two sites
    // contributes two rows, and the question the console asks starts from
    // something an operator can see published.
    const quiet = sites.filter((row) => row.business === twoSites.businessId)
    expect(quiet.map((row) => row.site).sort()).toEqual(
      [twoSites.first, twoSites.second].sort(),
    )
  })

  it('test_UAT_FC_REQ-298_the_address_is_hostname_ts_own_answer_and_absent_when_there_is_none', async () => {
    const sites = await read()

    // THE ADDRESS IS RESOLVED THROUGH `hostname.ts` AND IS NOT A SECOND READ OF
    // `site_domains`. Asserted against the host the shipped `claimHostname`
    // actually took, so a hand-written query here that disagreed with
    // `addressForLinks` would fail rather than quietly answer something else.
    expect(sites.find((row) => row.site === published.siteKey)!.address).toBe(published.host)

    // A SITE WITH NO ADDRESS IS PRESENT WITH `null`, never dropped and never an
    // empty string. This is the same fact `POST /api/publish` refuses on with
    // `NO_PUBLIC_ADDRESS`, so the console and the refusal cannot disagree about
    // whether a site is reachable.
    expect(sites.find((row) => row.site === unpublished.siteKey)!.address).toBeNull()
    expect(sites.find((row) => row.site === twoSites.second)!.address).toBeNull()
  })

  it('test_UAT_FC_REQ-298_a_business_whose_account_row_is_gone_is_present_and_says_which', async () => {
    // AN INNER JOIN WOULD DROP EXACTLY THE ROW WORTH NOTICING, which is the
    // reasoning [[REQ-297]]'s league already gives about its own left join. A
    // business whose account record has gone is a fact an operator can act on; a
    // site that silently vanished from a directory is not.
    const sites = await read()
    const stray = sites.find((row) => row.site === accountGone.siteKey)

    expect(stray).toBeTruthy()
    expect(stray!.businessName).toBe('Orphaned Ltd')
    // THE KEY SURVIVES AND THE RECORD DOES NOT, which is what makes this
    // actionable rather than merely blank: the operator is told WHICH account is
    // missing.
    expect(stray!.ownerAccount).toBe(accountGone.accountId)
    expect(stray!.ownerAccountName).toBeNull()
    expect(stray!.ownerAccountStatus).toBeNull()
  })

  it('test_UAT_FC_REQ-298_the_platform_business_has_no_owner_account_and_that_is_not_a_gap', async () => {
    // A SECOND KIND OF ABSENCE, AND THE ROUTE KEEPS THEM APART. `NULL` here is
    // 1st Contact's own site — it is nobody's customer — where the case above is
    // a record that has gone. Collapsing the two would make the console word an
    // ordinary fact as a fault, to the one person who could act on either.
    const sites = await read()
    const ours = sites.find((row) => row.site === platformOwned.siteKey)

    expect(ours).toBeTruthy()
    expect(ours!.businessName).toBe('1st Contact')
    expect(ours!.ownerAccount).toBeNull()
    expect(ours!.ownerAccountName).toBeNull()
  })

  it('test_UAT_FC_REQ-298_a_portal_is_not_a_site_and_is_not_listed', async () => {
    // `kind = 'site'` AND NOT EVERY ROW IN THE TABLE, which is the line `siteOf`
    // already draws. A portal is authored under the same business and is not the
    // thing a public hostname reaches; listing it would put a permanent "no
    // public address" row beside every business and bury the one signal the
    // column exists to carry.
    const sites = await read()
    const portals = await env.DB.prepare("SELECT id FROM sites WHERE kind = 'portal'").all<{
      id: string
    }>()
    expect((portals.results ?? []).length).toBeGreaterThan(0)
    for (const portal of portals.results ?? []) {
      expect(sites.map((row) => row.site)).not.toContain(portal.id)
    }
  })

  it('test_UAT_FC_REQ-298_the_route_is_the_read_and_takes_no_period', async () => {
    // THE ROUTE ADDS NOTHING TO THE READ, asserted by computing both and
    // comparing — which is what makes "the handler is the gate and the read is
    // the answer" a property rather than a description.
    const overTheWire = await read()
    expect(overTheWire).toEqual(await platformSites(identityEnv()))

    // AND NOTHING THIS ROUTE ANSWERS IS MEASURED OVER A WINDOW. A `from`/`to`
    // that changed the answer would be a second period for the console to
    // believe something different about; one that is accepted and ignored would
    // be a parameter that lies. It is neither: unknown query is simply not read.
    const windowed = await ask(
      `${ADMIN_SITES_PATH}?from=2026-09-01T00:00:00.000Z&to=2026-09-02T00:00:00.000Z`,
      await operator(),
    )
    expect(windowed.status).toBe(200)
    expect(((await windowed.json()) as { sites: Row[] }).sites).toEqual(overTheWire)
  })
})
