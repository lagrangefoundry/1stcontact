import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route } from '../apps/control-app/src/router'
import type { RouterEnv } from '../apps/control-app/src/router'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv as ControlEnv } from '../apps/control-app/src/lead'
import { publicSiteUrl, PUBLIC_SITE_ORIGIN } from '../apps/control-app/src/public-url'
import { addressesOf, addressForLinks } from '../apps/control-app/src/hostname'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { capturingMailer } from '../apps/control-app/src/mail'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { FORM_INSTANCE_FIELD } from '../packages/framework/src/modules/contact-form/fields'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite, type SeededSite } from './support/lead-site'
import { giveSiteAnAddress } from './support/site-address'

/**
 * [[BUG-97]] — **a gated download link names the site's own address, and the
 * right channel.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the real `captureLead` inside
 * workerd, against a real D1 database carrying the deployed schema and a real R2
 * bucket, and the link under test is READ OUT OF THE MAIL rather than
 * reconstructed from the address table — which is the same discipline
 * [[REQ-244]]'s file keeps, and for the same reason: what has to be true is that
 * the recipient holds a usable link, and a URL recomposed from the database would
 * pass even if the mail carried something else.
 *
 * THE STATE THIS FILLS. `publicSiteUrl` composed every link from one constant,
 * `https://1stcontact.io`. That was written when the builder's own "view
 * published" click was the only consumer and its reasoning still holds for that
 * caller. It does not hold for a link mailed to a stranger: it names the wrong
 * host for the site they signed up on, it puts the site's internal key in front
 * of them, and in a development deployment it cannot be followed at all.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a recipient sent to a domain other than the one they signed up on* — the
 *     signal the `invite` seed's own comment is careful about, which is that a
 *     message with no relationship to its sender is what phishing looks like;
 *   - *a link read off the `platform` kind by matching `1stc.site`* — which is
 *     `if (!hostname) refuse` in another costume, and would put every gated mail
 *     back on the platform host the day [[EPIC-6]] lands;
 *   - *a draft submission minting a link into the published site* — on a site
 *     that has never been published that link cannot resolve, so the one surface
 *     an operator can press the button on is the one whose mail is useless;
 *   - *a mail sent carrying a link composed from a host nobody owns* — the
 *     recipient cannot tell, which is what makes silence the wrong answer;
 *   - *the operator-facing callers quietly moving* — the exact failure the
 *     constant's own comment exists to prevent, so it is asserted directly
 *     rather than left to be noticed.
 */

const APPLIED = applySchema()

const TENANT = 'bug97'
const ORIGIN = 'https://app.bug97.test'
/** A development builder, as `wrangler dev` actually serves one. */
const DEV_ORIGIN = 'http://127.0.0.1:8788'

const PAPER = { key: 'paper', name: 'the paper', url: 'papers/one.txt' }

beforeAll(async () => {
  await APPLIED
})

const controlEnv = () =>
  ({
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@bug97.test>',
  }) as ControlEnv

const identityEnv = () => controlEnv() as unknown as IdentityEnv

function routerEnv(): RouterEnv {
  return {
    ...controlEnv(),
    ASSETS: { fetch: async () => new Response('not found', { status: 404 }) } as unknown as Fetcher,
  } as unknown as RouterEnv
}

const scopeOf = (businessId = TENANT): Scope => ({ businessId })

/** A site whose form gates one paper, published unless told otherwise. */
const gatedSite = (over: Record<string, unknown> = {}): Promise<SeededSite> =>
  seedFormSite({
    tenantId: TENANT,
    assets: [PAPER],
    outFiles: { 'papers/one.txt': 'PAPER BYTES' },
    ...over,
  })

/**
 * Every message one contact holds, newest first, through the real reader.
 *
 * `messagesFor` AND NOT A QUERY. The record is what the operator's own pane
 * reads, so asserting through the same function is what makes a claim about the
 * mail a claim about what the product will show.
 */
async function messagesOf(contactId: string) {
  const store = await ticketStoreFor(controlEnv(), scopeOf())
  return messagesFor(store, contactId)
}

/** The gate link a mail carries, whatever scheme or host it is on. */
function gateLinkIn(body: string): string {
  const match = /https?:\/\/[^\s"'<>]*\/api\/download\/gate_[0-9a-f]{32}/.exec(body)
  if (!match) throw new Error(`no gate link in the mail: ${body}`)
  return match[0]
}

/** One submission through `captureLead`, and what the mail it produced says. */
async function submit(
  site: SeededSite,
  email: string,
  extra: { channel?: 'draft' | 'published'; origin?: string } = {},
) {
  const mailer = capturingMailer()
  const outcome = await captureLead(
    controlEnv(),
    {
      siteKey: site.siteKey,
      formHandle: site.formHandle,
      fields: { email },
      ...extra,
    },
    { send: mailer.send },
  )
  expect(outcome.accepted).toBe(true)
  const records = await messagesOf(outcome.contactId as string)
  return { outcome, mailer, records }
}

/** Every live grant row for one contact — a link minted is a row written. */
async function grantsFor(contactId: string): Promise<number> {
  const row = await (env.DB as D1Database)
    .prepare('SELECT COUNT(*) AS n FROM asset_grants WHERE contact_id = ? AND revoked_at IS NULL')
    .bind(contactId)
    .first<{ n: number }>()
  return row?.n ?? 0
}

describe('BUG-97 — the link names the address the site has', () => {
  /**
   * The whole symptom, in one case: the mail names the site's own host, and the
   * site's internal key is not in the authority the recipient reads.
   */
  it('test_UAT_FC_BUG-97_a_published_site_mails_a_link_on_its_own_host', async () => {
    const site = await gatedSite()
    const { records } = await submit(site, 'platform@example.com')

    const link = new URL(gateLinkIn(records[0].body))
    // THE ADDRESS THE PRODUCT ACTUALLY GAVE THE SITE, read back through the one
    // module that reads `site_domains` — never a spelling written here.
    const address = addressForLinks(await addressesOf(identityEnv(), site.siteKey))
    expect(address).not.toBeNull()
    expect(link.host).toBe(address!.host)

    // AND NOT THE CONSTANT, which is the defect stated as an assertion.
    expect(link.origin).not.toBe(PUBLIC_SITE_ORIGIN)
    // THE KEY IS NOT IN THE AUTHORITY. It is what the recipient reads in their
    // client's address bar, and it was `1stcontact.io` with the key one segment
    // later on a host the site does not answer to.
    expect(link.host).not.toContain(site.siteKey)
  })

  /**
   * A custom domain wears the custom domain — asserted through `kind`, so
   * [[EPIC-6]] lands without moving every gated mail back to the platform host.
   */
  it('test_UAT_FC_BUG-97_a_site_with_a_custom_address_mails_a_link_on_it', async () => {
    const site = await gatedSite()
    const custom = await giveSiteAnAddress(site.siteKey, 'custom')
    const { records } = await submit(site, 'custom@example.com')

    const link = new URL(gateLinkIn(records[0].body))
    expect(link.host).toBe(custom.host)
    // THE CLAIM IS ABOUT THE KIND AND NOT ABOUT A SUFFIX. Nothing here matches
    // `1stc.site`: what is asserted is that the address the link wears is the
    // one whose `kind` is `custom`, which is a statement that survives a second
    // kind and a different apex.
    const wearing = (await addressesOf(identityEnv(), site.siteKey)).find(
      (a) => a.host === link.host,
    )
    expect(wearing?.kind).toBe('custom')
  })

  /**
   * And when a site holds both, the custom one wins. A business that pointed its
   * own domain at us has said which address it wants to be seen at, and a mail to
   * a stranger is where being seen at the other one costs most.
   */
  it('test_UAT_FC_BUG-97_a_site_holding_both_kinds_mails_the_custom_one', async () => {
    const site = await gatedSite()
    const platform = await addressesOf(identityEnv(), site.siteKey)
    expect(platform.map((a) => a.kind)).toEqual(['platform'])
    const custom = await giveSiteAnAddress(site.siteKey, 'custom')

    const { records } = await submit(site, 'both@example.com')
    const link = new URL(gateLinkIn(records[0].body))
    expect(link.host).toBe(custom.host)
    expect(link.host).not.toBe(platform[0].host)
  })
})

describe('BUG-97 — the link names the channel the submission came from', () => {
  /**
   * A draft submission's link points at the draft, and a published one at the
   * published site. THE SAME FORM, TWO URLS — which is the claim, because one
   * link cannot be right for both.
   */
  it('test_UAT_FC_BUG-97_a_draft_and_a_published_submission_mail_different_links', async () => {
    const site = await gatedSite()

    const draft = await submit(site, 'draft-vs@example.com', {
      channel: 'draft',
      origin: ORIGIN,
    })
    const live = await submit(site, 'published-vs@example.com', { channel: 'published' })

    const draftLink = new URL(gateLinkIn(draft.records[0].body))
    const liveLink = new URL(gateLinkIn(live.records[0].body))

    // THE DRAFT LINK RESOLVES AGAINST THE DRAFT: the builder's origin, the
    // site's preview channel, and the `draft` channel named in the path.
    expect(draftLink.origin).toBe(ORIGIN)
    expect(draftLink.pathname).toContain(`/preview/${site.siteKey}/draft/api/download/`)
    // AND IT NAMES THE BUSINESS, so a mail read days later in whatever tab is
    // open cannot resolve against whichever business sorted first ([[REQ-217]]).
    expect(draftLink.pathname.startsWith(`/b/${TENANT}/`)).toBe(true)

    // THE PUBLISHED LINK RESOLVES AGAINST THE PUBLISHED SITE, on its own host.
    const address = addressForLinks(await addressesOf(identityEnv(), site.siteKey))
    expect(liveLink.host).toBe(address!.host)
    expect(liveLink.pathname).toContain(`/site/${site.siteKey}/api/download/`)

    expect(draftLink.href).not.toBe(liveLink.href)
  })

  /**
   * A site that has NEVER been published takes a preview submission and mails a
   * link anyway — which is the case the draft half exists for. It asks for no
   * public address, because [[REQ-238]] does not give a site one until it goes
   * live.
   */
  it('test_UAT_FC_BUG-97_a_never_published_site_mails_a_draft_link_with_no_address', async () => {
    const site = await gatedSite({ publish: false })
    expect(await addressesOf(identityEnv(), site.siteKey)).toEqual([])

    const { outcome, records } = await submit(site, 'unpublished@example.com', {
      channel: 'draft',
      origin: ORIGIN,
    })
    expect(outcome.assets).toEqual([{ key: PAPER.key, sent: true }])
    const link = new URL(gateLinkIn(records[0].body))
    expect(link.pathname).toContain(`/preview/${site.siteKey}/draft/api/download/`)
  })

  /**
   * The development symptom, stated as the property that fixes it: the link a
   * recipient receives names THE SERVER THAT TOOK THE SUBMISSION, so on a
   * developer's machine it is an address that machine answers to.
   *
   * WHY THE ORIGIN AND NOT A VAR. It arrives from the request, which is why no
   * deployment has to be configured for this to hold — and why nothing here could
   * be set wrongly. The route that supplies it is asserted below.
   */
  it('test_UAT_FC_BUG-97_a_development_submission_mails_a_link_on_the_development_origin', async () => {
    const site = await gatedSite({ publish: false })
    const { records } = await submit(site, 'devbox@example.com', {
      channel: 'draft',
      origin: DEV_ORIGIN,
    })

    const link = gateLinkIn(records[0].body)
    expect(link.startsWith(`${DEV_ORIGIN}/`)).toBe(true)
    // NOT `https://1stcontact.io`, which is what could not be followed from a
    // development machine, and not the site's eventual public hostname either —
    // which on a developer's box resolves to nothing at all.
    expect(link).not.toContain(PUBLIC_SITE_ORIGIN)
  })

  /**
   * And the origin is really taken from the request rather than passed in by a
   * test: a submission through the REAL preview route mails a link back to the
   * host that route was reached on.
   */
  it('test_UAT_FC_BUG-97_the_preview_route_supplies_its_own_origin', async () => {
    const site = await gatedSite({ publish: false })

    const response = await route(
      new Request(`${DEV_ORIGIN}/preview/${site.siteKey}/draft/api/lead`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          [FORM_INSTANCE_FIELD]: site.formHandle,
          email: 'through-the-route@example.com',
        }),
      }),
      routerEnv(),
      scopeOf(),
    )
    expect(response.status).toBe(200)

    const rows = await (env.DB as D1Database)
      .prepare(
        'SELECT u.id AS id FROM users u JOIN user_emails e ON e.user_id = u.id ' +
          'WHERE u.tenant_id = ? AND e.email = ?',
      )
      .bind(TENANT, 'through-the-route@example.com')
      .all<{ id: string }>()
    const records = await messagesOf((rows.results ?? [])[0].id)
    expect(gateLinkIn(records[0].body).startsWith(`${DEV_ORIGIN}/`)).toBe(true)
  })
})

describe('BUG-97 — a site with no address refuses rather than composes', () => {
  /**
   * A published site with no address is a state publishing forbids. If one is
   * reached anyway, the delivery is refused AND SAYS WHY — the alternative being
   * a mail whose button points into a domain nobody owns, sent to somebody with
   * no way to tell.
   */
  it('test_UAT_FC_BUG-97_a_site_with_no_address_refuses_the_delivery_and_says_why', async () => {
    // Published, and then stripped of the address a publish would have required
    // — the shape a revocation leaves behind ([[REQ-238]]'s safety valve).
    const site = await gatedSite()
    await (env.DB as D1Database)
      .prepare('DELETE FROM site_domains WHERE site_id = ?')
      .bind(site.siteKey)
      .run()
    expect(await addressesOf(identityEnv(), site.siteKey)).toEqual([])

    const { outcome, mailer, records } = await submit(site, 'noaddress@example.com')

    // THE LEAD IS STILL A LEAD. The contact is written and the press recorded;
    // a submission is not worth less because we cannot address the follow-up.
    expect(outcome.accepted).toBe(true)
    expect(outcome.contactId).toBeTruthy()

    // AND THE DELIVERY NAMES ITS REASON.
    expect(outcome.assets).toEqual([{ key: PAPER.key, sent: false, skipped: 'no_site_address' }])

    // NO MAIL AT ALL — not one carrying a composed-from-nothing link, and not
    // one carrying an empty button either.
    expect(mailer.sent).toEqual([])
    expect(records).toEqual([])

    // AND NO GRANT. Minting is a write, and a row for a link nobody can be given
    // is noise that outlives the submission.
    expect(await grantsFor(outcome.contactId as string)).toBe(0)
  })

  /**
   * A form that promises no artifact still sends its message, address or no
   * address — because that message carries no link to compose. Refusing it would
   * be this fix taking away a delivery that was never broken.
   */
  it('test_UAT_FC_BUG-97_a_form_promising_no_artifact_still_delivers_with_no_address', async () => {
    const site = await seedFormSite({ tenantId: TENANT, template: 'welcome' })
    await (env.DB as D1Database)
      .prepare('DELETE FROM site_domains WHERE site_id = ?')
      .bind(site.siteKey)
      .run()

    const { outcome, mailer } = await submit(site, 'welcome-no-address@example.com')
    expect(outcome.message).toEqual({ sent: true })
    expect(mailer.sent).toHaveLength(1)
  })
})

describe('BUG-97 — the operator-facing callers are untouched', () => {
  /**
   * ASSERTED DIRECTLY, and this is the test the constant's own comment asks for.
   * Its warning was that a per-environment origin's *"only reachable effect would
   * be to send an operator's 'view published' click somewhere else"* — so the fix
   * is only correct if that click has not moved.
   */
  it('test_UAT_FC_BUG-97_view_published_still_points_at_the_products_own_origin', async () => {
    expect(PUBLIC_SITE_ORIGIN).toBe('https://1stcontact.io')
    expect(publicSiteUrl('site_abc')).toBe('https://1stcontact.io/site/site_abc/')
    expect(publicSiteUrl('site_abc', '/whitepapers')).toBe(
      'https://1stcontact.io/site/site_abc/whitepapers',
    )
  })

  /**
   * And the preview channel's redirect to the live site, through the real route
   * — the second of the two callers the audience table names.
   */
  it('test_UAT_FC_BUG-97_the_published_preview_redirect_still_goes_to_the_same_place', async () => {
    const site = await gatedSite()
    const response = await route(
      new Request(`${ORIGIN}/preview/${site.siteKey}/published/whitepapers`),
      routerEnv(),
      scopeOf(),
    )
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe(
      `https://1stcontact.io/site/${site.siteKey}/whitepapers`,
    )
  })
})
