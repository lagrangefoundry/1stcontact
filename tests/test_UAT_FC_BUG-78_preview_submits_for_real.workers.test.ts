import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route } from '../apps/control-app/src/router'
import type { RouterEnv } from '../apps/control-app/src/router'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv as ControlEnv } from '../apps/control-app/src/lead'
import { eventsOf } from '../apps/control-app/src/events'
import { FORM_SUBMITTED } from '../apps/control-app/src/builder/contact-events.js'
import {
  FORM_INSTANCE_FIELD,
  TURNSTILE_FIELD,
} from '../packages/framework/src/modules/contact-form/fields'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { SiteStoreEnv } from '../tools/generate/src/store/d1r2-store'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[BUG-78]] — **the draft preview submits for real.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives `control-app`'s own `route()`
 * inside workerd, against a real D1 database carrying the deployed schema and a
 * real R2 bucket. The write is the real `captureLead`, so a contact asserted
 * here is a row `addContact` wrote. Nothing on the submit path is doubled: there
 * is no Turnstile double because the preview does not challenge, which is itself
 * one of the things under test.
 *
 * THE STATE THIS FILLS. A rendered form's `action` is root-relative, so it
 * resolves against whichever host served the document. Published, that is
 * `public-site`, where [[REQ-223]] built the endpoint. In the preview it is
 * `control-app`, which had no such route — so the ONE surface an operator can
 * press the button on was the one surface where the button could not work, and
 * it answered `404` where it used to answer "Could not reach the server". A
 * different error, not a working form.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a preview submission that writes nothing* — the operator asked for test
 *     rows in the CRM, so a preview that acknowledges without writing is the
 *     failure, not the safe default;
 *   - *a lead indistinguishable from a public enquiry* — a row that reads as a
 *     visitor when nobody outside the business saw the page is a lie the CRM
 *     carries permanently;
 *   - *a definition read from the published revision* — the form an operator is
 *     testing is usually the one they just changed, and often one no revision
 *     has ever contained;
 *   - *a body field that can name a tenant or waive the challenge* — the site
 *     key comes from the slug through the store, and `identified` is set in code
 *     at one call site, never read off a request;
 *   - *the public endpoint quietly widened* — the seam that lets the preview skip
 *     Turnstile must leave an anonymous caller on `public-site` challenged
 *     exactly as before.
 */

const APPLIED = applySchema()

const TENANT = 'bug78'
const ORIGIN = 'https://app.bug78.test'

beforeAll(async () => {
  await APPLIED
})

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@bug78.test>',
    ASSETS: {
      fetch: async () => new Response('not found', { status: 404 }),
    } as unknown as Fetcher,
  } as unknown as RouterEnv
}

const controlEnv = () =>
  ({
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@bug78.test>',
  }) as ControlEnv

const scopeOf = (businessId = TENANT): Scope => ({ businessId })

/** A submission as `client.js` sends one, at a preview channel's own root. */
function previewPost(
  slug: string,
  channel: string,
  fields: Record<string, string>,
): Request {
  return new Request(`${ORIGIN}/preview/${slug}/${channel}/api/lead`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(fields),
  })
}

async function rowsFor(tenantId: string, email: string): Promise<Array<{ id: string }>> {
  const { results } = await (env.DB as D1Database)
    .prepare(
      'SELECT u.id AS id FROM users u JOIN user_emails e ON e.user_id = u.id ' +
        'WHERE u.tenant_id = ? AND e.email = ?',
    )
    .bind(tenantId, email)
    .all<{ id: string }>()
  return results ?? []
}

/** The `form_submitted` provenance recorded for an address. */
async function provenanceFor(tenantId: string, email: string) {
  const rows = await rowsFor(tenantId, email)
  expect(rows).toHaveLength(1)
  const events = await eventsOf(controlEnv(), { businessId: tenantId }, rows[0].id)
  const submitted = events.find((e) => e.kind === FORM_SUBMITTED)
  expect(submitted).toBeTruthy()
  return submitted!.detail as Record<string, unknown>
}

describe('BUG-78 — the preview submits for real', () => {
  /**
   * The endpoint exists on the preview's own origin, and a submission from it
   * lands as an ordinary contact — the whole of the operator's complaint.
   */
  it('test_UAT_FC_BUG-78_a_preview_submission_writes_a_real_contact', async () => {
    const site = await seedFormSite({ tenantId: TENANT, publish: false })

    const response = await route(
      previewPost(site.slug, 'draft', {
        [FORM_INSTANCE_FIELD]: site.instanceId,
        email: 'Preview@Example.com',
      }),
      routerEnv(),
      scopeOf(),
    )

    // The frozen acknowledgement `public-site` gives — the same one, because it
    // is the same `handleLead`. Emphatically not the `404` this bug records.
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"ok":true}')

    // A REAL ROW IN THE REAL TENANT. Test submissions in the CRM are what was
    // asked for; a preview that acknowledged without writing would be the bug.
    const rows = await rowsFor(TENANT, 'preview@example.com')
    expect(rows).toHaveLength(1)
  })

  /**
   * A preview lead is still a lead, and says so. `channel` sits with the rest of
   * the provenance because it is the same kind of fact: where this came from.
   */
  it('test_UAT_FC_BUG-78_a_preview_lead_is_marked_as_one', async () => {
    const site = await seedFormSite({ tenantId: TENANT, publish: false })

    await route(
      previewPost(site.slug, 'draft', {
        [FORM_INSTANCE_FIELD]: site.instanceId,
        email: 'marked@example.com',
      }),
      routerEnv(),
      scopeOf(),
    )

    const detail = await provenanceFor(TENANT, 'marked@example.com')
    expect(detail.channel).toBe('draft')
  })

  /**
   * The default is unchanged, and it is RECORDED rather than left absent — a
   * reader must be able to tell a live lead from one written before the field
   * existed.
   */
  it('test_UAT_FC_BUG-78_a_published_lead_still_reads_published', async () => {
    const site = await seedFormSite({ tenantId: TENANT })

    await captureLead(controlEnv(), {
      siteKey: site.siteKey,
      instanceId: site.instanceId,
      fields: { email: 'live@example.com' },
    })

    const detail = await provenanceFor(TENANT, 'live@example.com')
    expect(detail.channel).toBe('published')
  })

  /**
   * THE SHARPEST FALSIFIER. The form is published saying one thing and the draft
   * edited to say another; a preview submission must evidence what the operator
   * was actually shown. Reading the live revision here would quote a sentence
   * that is no longer on the page they pressed the button on.
   */
  it('test_UAT_FC_BUG-78_the_definition_comes_from_the_draft_not_the_live_revision', async () => {
    const site = await seedFormSite({
      tenantId: TENANT,
      submitLabel: 'The published wording',
      fields: [
        { name: 'email', label: 'Your email', type: 'email', required: true },
        { name: 'list', label: 'The published consent sentence', type: 'checkbox' },
      ],
    })

    // The operator edits the draft. Nothing is published, so the live revision
    // still carries the wording above.
    const store = await d1r2SiteStore(env as unknown as SiteStoreEnv).forTenant(TENANT)
    await store.write(site.slug, {
      siteJson: { name: site.slug, config: { businessName: 'Fixture' } },
      pages: [
        {
          name: 'home.json',
          page: {
            slug: 'home',
            title: 'Home',
            modules: [
              {
                id: site.instanceId,
                type: 'contact-form',
                version: 4,
                config: {
                  action: '/api/lead',
                  submitLabel: 'The draft wording',
                  fields: [
                    { name: 'email', label: 'Your email', type: 'email', required: true },
                    { name: 'list', label: 'The draft consent sentence', type: 'checkbox' },
                  ],
                },
                slots: {},
              },
            ],
          },
        },
      ],
      assets: [],
    })

    await route(
      previewPost(site.slug, 'draft', {
        [FORM_INSTANCE_FIELD]: site.instanceId,
        email: 'draftwording@example.com',
        list: 'yes',
      }),
      routerEnv(),
      scopeOf(),
    )

    const detail = await provenanceFor(TENANT, 'draftwording@example.com')
    expect(detail.submitLabel).toBe('The draft wording')
    expect(detail.consent).toEqual([
      { field: 'list', wording: 'The draft consent sentence', answer: true },
    ])
  })

  /**
   * A form that exists ONLY in the draft resolves — the common case, since the
   * operator is usually testing something they have just added.
   */
  it('test_UAT_FC_BUG-78_a_never_published_form_still_resolves_its_definition', async () => {
    const site = await seedFormSite({
      tenantId: TENANT,
      publish: false,
      submitLabel: 'Join the waitlist',
    })

    await route(
      previewPost(site.slug, 'draft', {
        [FORM_INSTANCE_FIELD]: site.instanceId,
        email: 'unpublished@example.com',
      }),
      routerEnv(),
      scopeOf(),
    )

    const detail = await provenanceFor(TENANT, 'unpublished@example.com')
    // Resolved, not fallen back to: the page and the button text are facts only
    // the definition holds, and the published path would have found neither.
    expect(detail.page).toBe('home.json')
    expect(detail.submitLabel).toBe('Join the waitlist')
  })

  /**
   * The site key comes from the SLUG through the store, against the store already
   * scoped to this operator's business. A body field naming another site is one
   * more answer the submitter typed, and is stored as that.
   */
  it('test_UAT_FC_BUG-78_the_body_cannot_name_a_tenant', async () => {
    const mine = await seedFormSite({ tenantId: TENANT, publish: false })
    const theirs = await seedFormSite({ tenantId: 'bug78-other', publish: false })

    await route(
      previewPost(mine.slug, 'draft', {
        [FORM_INSTANCE_FIELD]: mine.instanceId,
        email: 'steered@example.com',
        siteKey: theirs.siteKey,
        site: theirs.siteKey,
      }),
      routerEnv(),
      scopeOf(),
    )

    // It landed in the slug's business and nowhere else.
    expect(await rowsFor(TENANT, 'steered@example.com')).toHaveLength(1)
    expect(await rowsFor('bug78-other', 'steered@example.com')).toHaveLength(0)

    const detail = await provenanceFor(TENANT, 'steered@example.com')
    expect(detail.site).toBe(mine.siteKey)
  })

  /**
   * The site is not intended to be functional in edit mode. The edit render emits
   * no `action`, no `method` and no client script, so nothing can submit from it
   * today — this keeps that true if the renderer ever changes.
   */
  it('test_UAT_FC_BUG-78_the_edit_channel_refuses', async () => {
    const site = await seedFormSite({ tenantId: TENANT, publish: false })

    const response = await route(
      previewPost(site.slug, 'edit', {
        [FORM_INSTANCE_FIELD]: site.instanceId,
        email: 'editmode@example.com',
      }),
      routerEnv(),
      scopeOf(),
    )

    expect(response.status).toBe(404)
    expect(await rowsFor(TENANT, 'editmode@example.com')).toHaveLength(0)
  })

  /**
   * No widget is rendered in the preview — `public-site` stamps the sitekey and
   * `control-app` does not — so there is no token to send. Demanding one would
   * mean an operator solving a puzzle to test their own form. The identity that
   * replaces it is the Access gate in front of `/preview/*`.
   */
  it('test_UAT_FC_BUG-78_no_turnstile_token_is_required', async () => {
    const site = await seedFormSite({ tenantId: TENANT, publish: false })

    const response = await route(
      previewPost(site.slug, 'draft', {
        [FORM_INSTANCE_FIELD]: site.instanceId,
        email: 'notoken@example.com',
      }),
      routerEnv(),
      scopeOf(),
    )

    expect(response.status).toBe(200)
    expect(await rowsFor(TENANT, 'notoken@example.com')).toHaveLength(1)
  })

  /**
   * THE SEAM DID NOT WIDEN THE PUBLIC ENDPOINT. `identified` is set in code, at
   * one call site, by the Worker that knows what gate its route sits behind —
   * so an anonymous caller on `public-site` is challenged exactly as before, and
   * no field a submission can carry changes that.
   */
  it('test_UAT_FC_BUG-78_the_public_endpoint_still_challenges_an_anonymous_caller', async () => {
    const site = await seedFormSite({ tenantId: TENANT })

    const publicEnv = {
      DB: env.DB as D1Database,
      SITES: env.SITES as R2Bucket,
      SESSION_COOKIE_NAME: '',
      SESSION_COOKIE_DOMAIN: '',
      TURNSTILE_SITEKEY: '0xBUG78',
      TURNSTILE_SECRET: 'bug78-secret',
      LEAD_RATE_LIMIT: { limit: async () => ({ success: true }) } as unknown as RateLimit,
      LEAD_INTAKE: { captureLead: (spec) => captureLead(controlEnv(), spec) },
    } as unknown as PublicEnv

    // No token, and a body that tries to claim the exemption for itself.
    const response = await publicSite.fetch(
      new Request(`https://bug78.test/site/${site.siteKey}/api/lead`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          [FORM_INSTANCE_FIELD]: site.instanceId,
          [TURNSTILE_FIELD]: '',
          email: 'anon@example.com',
          identified: 'true',
        }),
      }),
      publicEnv,
      {} as ExecutionContext,
    )

    expect(response.status).toBe(400)
    expect(await rowsFor(TENANT, 'anon@example.com')).toHaveLength(0)
  })
})
