import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/public-site/src/index'
import type { Env } from '../apps/public-site/src/index'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv as ControlEnv } from '../apps/control-app/src/lead'
import { openGate, takeAsset } from '../apps/control-app/src/gate'
import { resolveGrant, revokeGrant } from '../apps/control-app/src/grants'
import { capturingMailer } from '../apps/control-app/src/mail'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { eventsOf } from '../apps/control-app/src/events'
import type { ContactEvent } from '../apps/control-app/src/events'
import {
  ASSET_DOWNLOADED,
  ASSET_SENT,
  PAGE_ACCESSED,
} from '../apps/control-app/src/builder/contact-events.js'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[REQ-244]] — **the gated page: a per-contact link, and what they did with it.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives `worker.fetch` — `public-site`'s
 * real handler, with its real route grammar — inside workerd, against a real D1
 * database carrying the deployed schema and a real R2 bucket holding a published
 * revision. The `ASSET_GATE` binding is the REAL `openGate`/`takeAsset`, and the
 * link under test is read OUT OF THE MAIL rather than reconstructed from the
 * grant table: what has to be true is that the recipient can reach the page, and
 * a token asserted from the database would pass even if the mail carried
 * something else.
 *
 * THE STATE THIS FILLS. `asset.sent` said we sent it. Whether anybody opened it,
 * came back, or took one paper and not the other was not recorded anywhere — and
 * could not be, because a single link to an artifact is the same link for
 * everybody who was sent it and cannot say WHO followed it.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *two contacts sent the same form receiving the same link* — the
 *     attribution the whole change exists for, gone;
 *   - *an arrival recorded once and not every time* — "they came back on
 *     Thursday" is the signal, and a deduplicated summary cannot hold it;
 *   - *a download event that does not name which paper* — with a set, that is
 *     the only thing that says which they wanted;
 *   - *a refusal that differs between unknown, malformed and revoked* — an
 *     oracle for which tokens exist, to anybody with a script;
 *   - *a valid token reaching another business's artifact*, or granting a
 *     session — the two things §2 says this link is not;
 *   - *a stored duration* — the interval is derivable from two timestamps and
 *     nothing measures it;
 *   - *any other method on any other path answering something other than `405`*
 *     — the GET-only amendment widening past the doorway it was opened for.
 *
 * THE CALLER IS ASSUMED HOSTILE AND SCRIPTED, on [[REQ-223]]'s reasoning: CORS
 * constrains browsers and nothing else.
 */

const TENANT = 'req244-tenant'
const OTHER_TENANT = 'req244-other'
const ORIGIN = 'https://req244.test'

/** A paper that lives in the site's own published output ([[REQ-244]] §5). */
const PAPER_A = { key: 'paper-a', name: 'the first paper', url: 'papers/first.txt' }
/** A second, so "which one did they take" is a question with two answers. */
const PAPER_B = { key: 'paper-b', name: 'the second paper', url: 'papers/second.txt' }
/** A paper an author pointed off-site, which is every one in the stores today. */
const PAPER_AWAY = { key: 'paper-away', name: 'the elsewhere paper', url: 'https://example.test/p' }

const PUBLISHED = {
  'papers/first.txt': 'FIRST PAPER BYTES',
  'papers/second.txt': 'SECOND PAPER BYTES',
}

function controlEnv(): ControlEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@req244.test>',
  } as ControlEnv
}

/**
 * The whole Worker environment, with the gate wired to the REAL record.
 *
 * Nothing about the contact path is simulated: `openGate` and `takeAsset` are
 * `control-app`'s own functions, over the shape the service binding exposes.
 */
function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    SESSION_COOKIE_NAME: '',
    SESSION_COOKIE_DOMAIN: '',
    ASSET_GATE: {
      openGate: (siteKey: string, token: string) => openGate(controlEnv(), siteKey, token),
      takeAsset: (siteKey: string, token: string, assetKey: string) =>
        takeAsset(controlEnv(), siteKey, token, assetKey),
    },
  } as Env
}

async function get(path: string): Promise<Response> {
  return worker.fetch(new Request(`${ORIGIN}${path}`), workerEnv(), {} as ExecutionContext)
}

/** One submission, and the link the mail it produced actually carries. */
async function submitAndRead(
  site: { siteKey: string; instanceId: string },
  email: string,
  tenantId: string = TENANT,
): Promise<{ contactId: string; link: string; path: string }> {
  const mailer = capturingMailer()
  const outcome = await captureLead(
    controlEnv(),
    { siteKey: site.siteKey, instanceId: site.instanceId, fields: { email } },
    { send: mailer.send },
  )
  expect(outcome.accepted).toBe(true)
  const contactId = outcome.contactId as string
  const store = await ticketStoreFor(controlEnv(), { businessId: tenantId })
  const records = await messagesFor(store, contactId)
  const match = /https:\/\/[^\s"'<>]*\/api\/download\/[A-Za-z0-9_]+/.exec(records[0]?.body ?? '')
  if (!match) throw new Error(`no gate link in the mail: ${records[0]?.body}`)
  return { contactId, link: match[0], path: new URL(match[0]).pathname }
}

/** One contact's history, filtered to a kind. */
async function eventsOfKind(
  contactId: string,
  kind: string,
  tenantId: string = TENANT,
): Promise<ContactEvent[]> {
  const events = await eventsOf(controlEnv(), { businessId: tenantId }, contactId)
  return events.filter((event) => event.kind === kind)
}

/** A response reduced to the bytes and headers a caller can actually compare. */
async function shapeOf(response: Response): Promise<string> {
  const headers = [...response.headers.entries()].sort().map(([k, v]) => `${k}: ${v}`)
  return JSON.stringify([response.status, headers, await response.text()])
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-244 — the gated page', () => {
  it('test_UAT_FC_REQ-244_the_link_opens_a_page_listing_exactly_what_the_form_promised', async () => {
    // AC-1. A second form on the same page promising something else is what
    // makes "and no others" a real assertion rather than a tautology.
    const site = await seedFormSite({
      tenantId: TENANT,
      assets: [PAPER_A, PAPER_B],
      outFiles: PUBLISHED,
      alsoForms: [{ instanceId: 'other-form', assets: [PAPER_AWAY], template: 'asset' }],
    })
    const { path } = await submitAndRead(site, 'lists@example.com')

    const page = await get(path)
    expect(page.status).toBe(200)
    expect(page.headers.get('content-type')).toBe('text/html; charset=utf-8')
    const html = await page.text()
    expect(html).toContain(PAPER_A.name)
    expect(html).toContain(PAPER_B.name)
    // …and nothing the OTHER form on the same page promised.
    expect(html).not.toContain(PAPER_AWAY.name)
    // Each artifact is reachable from the page, under this token and no other.
    expect(html).toContain(`${path}/${PAPER_A.key}`)
    expect(html).toContain(`${path}/${PAPER_B.key}`)

    // §6 — the page is `noindex`, and unlinked is not a control.
    expect(html).toContain('name="robots" content="noindex"')
    expect(page.headers.get('x-robots-tag')).toBe('noindex')
    // …and it is minted for one person, so it is nobody else's to cache.
    expect(page.headers.get('cache-control')).toBe('private, no-store')
  })

  it('test_UAT_FC_REQ-244_every_arrival_is_recorded_and_not_only_the_first', async () => {
    // AC-2. Three visits are three rows: the spine holds facts, not a summary.
    const site = await seedFormSite({ tenantId: TENANT, assets: [PAPER_A], outFiles: PUBLISHED })
    const { contactId, path } = await submitAndRead(site, 'thrice@example.com')

    expect(await eventsOfKind(contactId, PAGE_ACCESSED)).toHaveLength(0)
    for (let visit = 0; visit < 3; visit += 1) expect((await get(path)).status).toBe(200)

    const arrivals = await eventsOfKind(contactId, PAGE_ACCESSED)
    expect(arrivals).toHaveLength(3)
    // WHAT THEY WERE OFFERED, which is what makes an arrival that took nothing
    // legible — no download event could ever report a paper nobody fetched.
    for (const arrival of arrivals) {
      expect(arrival.detail).toMatchObject({
        site: site.siteKey,
        form: site.instanceId,
        assets: [PAPER_A.key],
      })
    }
  })

  it('test_UAT_FC_REQ-244_taking_each_paper_records_which_one', async () => {
    // AC-3, and the whole reason a set needs per-artifact events.
    const site = await seedFormSite({
      tenantId: TENANT,
      assets: [PAPER_A, PAPER_B],
      outFiles: PUBLISHED,
    })
    const { contactId, path } = await submitAndRead(site, 'both@example.com')
    await get(path)

    const first = await get(`${path}/${PAPER_A.key}`)
    expect(first.status).toBe(200)
    expect(await first.text()).toBe(PUBLISHED['papers/first.txt'])

    let taken = await eventsOfKind(contactId, ASSET_DOWNLOADED)
    expect(taken).toHaveLength(1)
    expect(taken[0].detail).toMatchObject({ asset: PAPER_A.key, name: PAPER_A.name })

    // …and the second, later, is a SECOND row naming the other one.
    const second = await get(`${path}/${PAPER_B.key}`)
    expect(second.status).toBe(200)
    expect(await second.text()).toBe(PUBLISHED['papers/second.txt'])

    taken = await eventsOfKind(contactId, ASSET_DOWNLOADED)
    expect(taken).toHaveLength(2)
    expect(taken.map((event) => (event.detail as { asset: string }).asset).sort()).toEqual([
      PAPER_A.key,
      PAPER_B.key,
    ])

    // WE SENT IT AND THEY CAME AND GOT IT ARE TWO DIFFERENT FACTS, and both are
    // in the one history — which is the gap neither could report on its own.
    expect(await eventsOfKind(contactId, ASSET_SENT)).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-244_a_site_asset_is_served_and_an_off_site_url_redirects', async () => {
    // §5 — the bytes are site assets. §8.4 — an authored off-site URL still
    // works, and taking it is still recorded, because every asset in the stores
    // today points somewhere else.
    const site = await seedFormSite({
      tenantId: TENANT,
      assets: [PAPER_A, PAPER_AWAY],
      outFiles: PUBLISHED,
    })
    const { contactId, path } = await submitAndRead(site, 'bytes@example.com')

    const own = await get(`${path}/${PAPER_A.key}`)
    expect(own.status).toBe(200)
    // OUT OF THE PUBLISHED REVISION, not out of a fixture's imagination.
    expect(await own.text()).toBe(PUBLISHED['papers/first.txt'])
    expect(own.headers.get('cache-control')).toBe('private, no-store')

    const away = await get(`${path}/${PAPER_AWAY.key}`)
    expect(away.status).toBe(302)
    expect(away.headers.get('location')).toBe(PAPER_AWAY.url)

    // RECORDED WHICHEVER WAY THE BYTES WENT. A redirect is still a download.
    const taken = await eventsOfKind(contactId, ASSET_DOWNLOADED)
    expect(taken.map((event) => (event.detail as { asset: string }).asset).sort()).toEqual([
      PAPER_AWAY.key,
      PAPER_A.key,
    ].sort())
  })

  it('test_UAT_FC_REQ-244_two_contacts_sent_the_same_form_get_different_links', async () => {
    // AC-4 — the attribution the whole change exists for.
    const site = await seedFormSite({ tenantId: TENANT, assets: [PAPER_A], outFiles: PUBLISHED })
    const alice = await submitAndRead(site, 'alice@example.com')
    const bob = await submitAndRead(site, 'bob@example.com')

    expect(alice.contactId).not.toBe(bob.contactId)
    expect(alice.link).not.toBe(bob.link)

    await get(alice.path)
    await get(`${bob.path}/${PAPER_A.key}`)

    expect(await eventsOfKind(alice.contactId, PAGE_ACCESSED)).toHaveLength(1)
    expect(await eventsOfKind(alice.contactId, ASSET_DOWNLOADED)).toHaveLength(0)
    expect(await eventsOfKind(bob.contactId, PAGE_ACCESSED)).toHaveLength(0)
    expect(await eventsOfKind(bob.contactId, ASSET_DOWNLOADED)).toHaveLength(1)

    // A SECOND SUBMISSION REUSES THE LINK. The page is the same page, and two
    // tokens for it would be two answers to the question the token answers.
    const again = await submitAndRead(site, 'alice@example.com')
    expect(again.contactId).toBe(alice.contactId)
    expect(again.link).toBe(alice.link)
  })

  it('test_UAT_FC_REQ-244_unknown_malformed_and_revoked_are_one_refusal', async () => {
    // AC-5 — and one step further than the AC asks: the refusal is the SAME
    // response any unknown path gets, so a caller cannot learn that a gate path
    // is a gate path at all.
    const site = await seedFormSite({ tenantId: TENANT, assets: [PAPER_A], outFiles: PUBLISHED })
    const { contactId, path } = await submitAndRead(site, 'revoked@example.com')
    const root = path.slice(0, path.lastIndexOf('/'))

    const unknown = await get(`${root}/gate_${'0'.repeat(32)}`)
    const malformed = await get(`${root}/not-a-token`)

    const grant = (await resolveGrant(controlEnv(), path.slice(path.lastIndexOf('/') + 1)))!
    expect(grant.contactId).toBe(contactId)
    expect(await revokeGrant(controlEnv(), { businessId: TENANT }, grant.id)).toBe(true)
    const revoked = await get(path)

    const ordinary = await get(`/site/${site.siteKey}/nothing-here.txt`)
    expect(ordinary.status).toBe(404)

    const shapes = await Promise.all([unknown, malformed, revoked, ordinary].map(shapeOf))
    expect(new Set(shapes).size).toBe(1)

    // A REVOKED LINK RECORDS NOTHING, which is what makes revocation a refusal
    // rather than a flag every reader has to remember to check.
    expect(await eventsOfKind(contactId, PAGE_ACCESSED)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-244_a_token_grants_no_session_and_reaches_nothing_but_its_own', async () => {
    // AC-6. Two sideways moves, and the credential question.
    const site = await seedFormSite({
      tenantId: TENANT,
      assets: [PAPER_A],
      outFiles: PUBLISHED,
    })
    const other = await seedFormSite({
      tenantId: OTHER_TENANT,
      assets: [PAPER_B],
      outFiles: PUBLISHED,
    })
    const { contactId, path } = await submitAndRead(site, 'sideways@example.com')
    const token = path.slice(path.lastIndexOf('/') + 1)

    // THE SITE KEY IN THE URL IS A CHECK AND NEVER A SOURCE: a valid token
    // presented against another business's site reaches nothing.
    const acrossSite = await get(`/site/${other.siteKey}/api/download/${token}`)
    expect(acrossSite.status).toBe(404)
    const acrossAsset = await get(`/site/${other.siteKey}/api/download/${token}/${PAPER_B.key}`)
    expect(acrossAsset.status).toBe(404)

    // …and a SIBLING SITE OF THE SAME BUSINESS carrying a form with the same
    // instance id, which is what duplicating a page produces. The business
    // comparison cannot catch this one — only the grant's own site key can, and
    // without it a token minted for one site would open the other site's
    // version of the form and offer ITS artifacts.
    const sibling = await seedFormSite({
      tenantId: TENANT,
      instanceId: site.instanceId,
      assets: [PAPER_B],
      outFiles: PUBLISHED,
    })
    const acrossSibling = await get(`/site/${sibling.siteKey}/api/download/${token}`)
    expect(acrossSibling.status).toBe(404)

    // …and an asset key this form does not promise, on its OWN site.
    const notPromised = await get(`${path}/${PAPER_B.key}`)
    expect(notPromised.status).toBe(404)

    // NO EVENT LANDED ANYWHERE for any of the three, in either business.
    expect(await eventsOfKind(contactId, PAGE_ACCESSED)).toHaveLength(0)
    expect(await eventsOfKind(contactId, ASSET_DOWNLOADED)).toHaveLength(0)

    // IT IS NOT A CREDENTIAL. The page issues no cookie, so nothing about
    // following this link makes the browser carrying it anybody.
    const page = await get(path)
    expect(page.status).toBe(200)
    expect(page.headers.get('set-cookie')).toBeNull()
  })

  it('test_UAT_FC_REQ-244_the_interval_is_derivable_and_no_duration_is_stored', async () => {
    // AC-7 — §3's "the server timestamps what it receives, which is enough".
    const site = await seedFormSite({ tenantId: TENANT, assets: [PAPER_A], outFiles: PUBLISHED })
    const { contactId, path } = await submitAndRead(site, 'interval@example.com')

    await get(path)
    await get(`${path}/${PAPER_A.key}`)

    const [arrival] = await eventsOfKind(contactId, PAGE_ACCESSED)
    const [download] = await eventsOfKind(contactId, ASSET_DOWNLOADED)
    const interval = Date.parse(download.occurredAt) - Date.parse(arrival.occurredAt)
    expect(Number.isFinite(interval)).toBe(true)
    expect(interval).toBeGreaterThanOrEqual(0)

    // NOTHING MEASURED IT. A stored duration would be a second answer to a
    // question two timestamps already answer, and a lower bound at that.
    for (const event of [arrival, download]) {
      for (const key of Object.keys(event.detail)) {
        expect(key).not.toMatch(/duration|dwell|elapsed|seconds|ms$/i)
      }
    }
  })

  it('test_UAT_FC_REQ-244_the_additions_are_GET_only', async () => {
    // AC-8 — the amendment is a doorway and not a change of character.
    const site = await seedFormSite({ tenantId: TENANT, assets: [PAPER_A], outFiles: PUBLISHED })
    const { contactId, path } = await submitAndRead(site, 'methods@example.com')

    for (const target of [path, `${path}/${PAPER_A.key}`]) {
      for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
        const response = await worker.fetch(
          new Request(`${ORIGIN}${target}`, {
            method,
            body: method === 'DELETE' ? null : '{}',
            headers: { 'content-type': 'application/json' },
          }),
          workerEnv(),
          {} as ExecutionContext,
        )
        expect(response.status).toBe(405)
      }
      // A `HEAD` IS NOT AN ARRIVAL. Prefetchers and unfurlers send one, and
      // recording it would put a visit in the history for a request that
      // displayed nothing — so it meets the ordinary 404 instead.
      const head = await worker.fetch(
        new Request(`${ORIGIN}${target}`, { method: 'HEAD' }),
        workerEnv(),
        {} as ExecutionContext,
      )
      expect(head.status).toBe(404)
    }

    expect(await eventsOfKind(contactId, PAGE_ACCESSED)).toHaveLength(0)
    expect(await eventsOfKind(contactId, ASSET_DOWNLOADED)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-244_a_deployment_with_no_binding_refuses', async () => {
    // §8.5 — absent is a refusal. Serving the paper anyway would be the
    // tracking silently switching itself off, with nothing saying so.
    const site = await seedFormSite({ tenantId: TENANT, assets: [PAPER_A], outFiles: PUBLISHED })
    const { path } = await submitAndRead(site, 'unbound@example.com')

    const unbound = { ...workerEnv(), ASSET_GATE: undefined } as Env
    const response = await worker.fetch(
      new Request(`${ORIGIN}${path}`),
      unbound,
      {} as ExecutionContext,
    )
    expect(response.status).toBe(404)
  })
})
