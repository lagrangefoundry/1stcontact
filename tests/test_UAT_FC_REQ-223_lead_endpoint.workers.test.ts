import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/public-site/src/index'
import type { Env } from '../apps/public-site/src/index'
import { MAX_BODY_BYTES, MAX_FIELDS, MAX_FIELD_BYTES } from '../apps/public-site/src/lead'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv as ControlEnv } from '../apps/control-app/src/lead'
import { eventsOf } from '../apps/control-app/src/events'
import { FORM_SUBMITTED } from '../apps/control-app/src/builder/contact-events.js'
import {
  FORM_INSTANCE_FIELD,
  HONEYPOT_FIELD,
  TURNSTILE_FIELD,
} from '../packages/framework/src/modules/contact-form/fields'
import { contactForm } from '../packages/framework/src/modules/contact-form/component'
import { TURNSTILE_SCRIPT_URL } from '../packages/framework/src/modules/contact-form/turnstile'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[REQ-223]] — **a public form accepts a submission, through the Worker's own
 * `fetch`.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives `worker.fetch` — `public-site`'s
 * real handler, with its real route grammar — inside workerd, against a real D1
 * database carrying the deployed schema and a real R2 bucket holding a published
 * revision. The service binding is the REAL `captureLead`, so a row asserted here
 * is a row `addContact` wrote; the only doubles are the two things a test must
 * never reach for itself, Cloudflare's siteverify endpoint and the rate limiter.
 *
 * THE STATE THIS FILLS. Every public form in the product was broken and none of
 * them by a bug: `public-site` answered every non-GET with `405` by construction
 * and `control-app` gates every request through Access, so `/api/lead` and
 * `/beta-apply` alike had never existed. The visitor saw *"Could not reach the
 * server."*
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a response that differs between a known and an unknown address* — an
 *     oracle for whether somebody is already a contact, to anybody with a form;
 *   - *a body field that can name a tenant* — a spammer writing into another
 *     business's contact list by editing what their browser posts;
 *   - *a submission accepted with no Turnstile token, or with Turnstile
 *     unconfigured* — verification that runs only when a token happens to be
 *     present is not verification;
 *   - *a second row for a resubmitted address* — the duplicate the one contacts
 *     table exists to prevent;
 *   - *any other method on any other path answering something other than `405`*
 *     — the amendment widening past the one doorway it was opened for.
 *
 * THE CALLER IS ASSUMED HOSTILE AND SCRIPTED. CORS constrains browsers and
 * nothing else, so nothing here is asserted through a browser rule.
 */

const TENANT = 'req223-tenant'
const OTHER_TENANT = 'req223-other'
const SECRET = 'turnstile-secret'
const SITEKEY = '0xREQ223SITEKEY'
const TOKEN = 'a-valid-token'
const ORIGIN = 'https://req223.test'

/** Every siteverify call this suite made, so a test can prove it happened. */
let verifications: Array<Record<string, string>>
/** What the next siteverify call answers. */
let verifyOutcome: boolean
/** Every rate-limit key this suite was asked about. */
let limited: string[]
/** What the rate limiter answers. */
let allowRate: boolean

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  verifications = []
  verifyOutcome = true
  limited = []
  allowRate = true
  // THE ONE DOUBLE ON THE VERIFY PATH. A test that reached Cloudflare would
  // either fail without a secret or, far worse, pass with one.
  vi.stubGlobal('fetch', async (input: RequestInfo, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as Request).url
    if (!url.includes('siteverify')) throw new Error(`unexpected fetch: ${url}`)
    verifications.push(Object.fromEntries(new URLSearchParams(String(init?.body ?? ''))))
    return new Response(JSON.stringify({ success: verifyOutcome }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** The whole Worker environment, with the lead endpoint fully configured. */
function workerEnv(apexSiteKey?: string): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    APEX_SITE_KEY: apexSiteKey,
    SESSION_COOKIE_NAME: '',
    SESSION_COOKIE_DOMAIN: '',
    TURNSTILE_SITEKEY: SITEKEY,
    TURNSTILE_SECRET: SECRET,
    LEAD_RATE_LIMIT: {
      limit: async ({ key }: { key: string }) => {
        limited.push(key)
        return { success: allowRate }
      },
    } as unknown as RateLimit,
    // THE REAL WRITE, over the shape the service binding exposes. Nothing about
    // the contact path is simulated: this is `control-app`'s own function.
    LEAD_INTAKE: {
      captureLead: (spec) =>
        captureLead(
          {
            DB: env.DB as D1Database,
            SITES: env.SITES as R2Bucket,
            BLOBS: env.BLOBS as R2Bucket,
            MAIL_FROM: '1st Contact <no-reply@req223.test>',
          } as ControlEnv,
          spec,
        ),
    },
  } as Env
}

/** A JSON submission, as `client.js` sends one. */
function post(
  path: string,
  fields: Record<string, string>,
  init: { shape?: 'json' | 'form'; ip?: string } = {},
): Request {
  const shape = init.shape ?? 'json'
  const headers: Record<string, string> = {
    'content-type':
      shape === 'json' ? 'application/json' : 'application/x-www-form-urlencoded',
  }
  if (init.ip) headers['cf-connecting-ip'] = init.ip
  return new Request(`${ORIGIN}${path}`, {
    method: 'POST',
    headers,
    body: shape === 'json' ? JSON.stringify(fields) : new URLSearchParams(fields).toString(),
  })
}

/** The fields a well-formed submission carries, for a given form instance. */
function submission(instanceId: string, extra: Record<string, string> = {}) {
  return {
    [FORM_INSTANCE_FIELD]: instanceId,
    [TURNSTILE_FIELD]: TOKEN,
    ...extra,
  }
}

/** The `users` rows this business holds for `email`. */
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

describe('REQ-223 — POST /api/lead', () => {
  it('test_UAT_FC_REQ-223_accepts_a_submission_and_records_the_contact', async () => {
    const site = await seedFormSite({
      tenantId: TENANT,
      submitLabel: 'Send me both papers',
      fields: [
        { name: 'email', label: 'Your email', type: 'email', required: true },
        { name: 'building', label: 'What are you building?', type: 'textarea' },
        { name: 'list', label: 'Email me occasionally about new papers', type: 'checkbox' },
      ],
    })

    const response = await worker.fetch(
      post(`/site/${site.siteKey}/api/lead`, submission(site.instanceId, {
        email: 'Alice@Example.com',
        building: 'a small catering site',
        list: 'yes',
      })),
      workerEnv(),
      {} as ExecutionContext,
    )

    // AC-1 — one frozen acknowledgement, on the page's own origin.
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"ok":true}')

    // AC-4 — exactly one contact, at `lead`, casefolded so a second submission
    // of `alice@` finds the same person rather than making a second one.
    const rows = await rowsFor(TENANT, 'alice@example.com')
    expect(rows).toHaveLength(1)
    const stage = await (env.DB as D1Database)
      .prepare('SELECT pipeline_stage AS s FROM users WHERE id = ?')
      .bind(rows[0].id)
      .first<{ s: string }>()
    expect(stage?.s).toBe('lead')

    // AC-6 — the provenance: which site, which page, which form, what the button
    // said, what else they typed, and the wording the tick box carried.
    const events = await eventsOf(
      { DB: env.DB as D1Database } as ControlEnv,
      { businessId: TENANT },
      rows[0].id,
    )
    const submitted = events.find((e) => e.kind === FORM_SUBMITTED)
    expect(submitted).toBeTruthy()
    expect(submitted?.detail.site).toBe(site.siteKey)
    expect(submitted?.detail.page).toBe('home.json')
    expect(submitted?.detail.form).toBe(site.instanceId)
    expect(submitted?.detail.submitLabel).toBe('Send me both papers')
    expect(submitted?.detail.fields).toMatchObject({ building: 'a small catering site' })
    expect(submitted?.detail.consent).toEqual([
      { field: 'list', wording: 'Email me occasionally about new papers', answer: true },
    ])
  })

  it('test_UAT_FC_REQ-223_the_same_address_twice_is_one_contact', async () => {
    const site = await seedFormSite({ tenantId: TENANT })
    const send = () =>
      worker.fetch(
        post(`/site/${site.siteKey}/api/lead`, submission(site.instanceId, {
          email: 'twice@example.com',
        })),
        workerEnv(),
        {} as ExecutionContext,
      )

    const first = await send()
    const second = await send()

    // AC-2 — byte-identical, so the endpoint cannot be used to ask whether an
    // address is already here.
    expect(await first.text()).toBe(await second.text())
    expect(first.status).toBe(second.status)
    // AC-4 — the second submission creates no row.
    expect(await rowsFor(TENANT, 'twice@example.com')).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-223_every_outcome_answers_the_same_bytes', async () => {
    const site = await seedFormSite({ tenantId: TENANT })
    const acks: string[] = []
    const statuses: number[] = []

    const record = async (fields: Record<string, string>) => {
      const response = await worker.fetch(
        post(`/site/${site.siteKey}/api/lead`, fields),
        workerEnv(),
        {} as ExecutionContext,
      )
      statuses.push(response.status)
      acks.push(await response.text())
    }

    // A new address.
    await record(submission(site.instanceId, { email: 'frozen-a@example.com' }))
    // An address already a contact.
    await record(submission(site.instanceId, { email: 'frozen-a@example.com' }))
    // A filled honeypot — AC-7.
    await record(
      submission(site.instanceId, {
        email: 'frozen-b@example.com',
        [HONEYPOT_FIELD]: 'https://spam.example',
      }),
    )
    // A rate-limited submission — AC-9.
    allowRate = false
    await record(submission(site.instanceId, { email: 'frozen-c@example.com' }))
    allowRate = true

    // AC-2 — one acknowledgement, byte for byte, for every one of them.
    expect(new Set(acks).size).toBe(1)
    expect(new Set(statuses)).toEqual(new Set([200]))

    // AC-7 / AC-9 — and neither the honeypot nor the rate-limited submission
    // wrote anything, which is what the identical answer is hiding.
    expect(await rowsFor(TENANT, 'frozen-b@example.com')).toHaveLength(0)
    expect(await rowsFor(TENANT, 'frozen-c@example.com')).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-223_a_body_cannot_name_another_tenant', async () => {
    const mine = await seedFormSite({ tenantId: TENANT })
    await seedFormSite({ tenantId: OTHER_TENANT })

    await worker.fetch(
      post(`/site/${mine.siteKey}/api/lead`, submission(mine.instanceId, {
        email: 'steered@example.com',
        // Every shape a caller might hope names somebody else's list.
        siteKey: 'anything',
        tenant: OTHER_TENANT,
        tenant_id: OTHER_TENANT,
        business: OTHER_TENANT,
      })),
      workerEnv(),
      {} as ExecutionContext,
    )

    // AC-5 — the tenant came from the path, and the claim in the body is one
    // more answer the visitor typed.
    expect(await rowsFor(TENANT, 'steered@example.com')).toHaveLength(1)
    expect(await rowsFor(OTHER_TENANT, 'steered@example.com')).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-223_turnstile_is_required_and_fails_closed', async () => {
    const site = await seedFormSite({ tenantId: TENANT })
    const path = `/site/${site.siteKey}/api/lead`

    // AC-8 — no token at all.
    const missing = await worker.fetch(
      post(path, { [FORM_INSTANCE_FIELD]: site.instanceId, email: 'no-token@example.com' }),
      workerEnv(),
      {} as ExecutionContext,
    )
    expect(missing.status).toBe(400)
    expect(await rowsFor(TENANT, 'no-token@example.com')).toHaveLength(0)

    // AC-8 — a token Cloudflare refuses.
    verifyOutcome = false
    const invalid = await worker.fetch(
      post(path, submission(site.instanceId, { email: 'bad-token@example.com' })),
      workerEnv(),
      {} as ExecutionContext,
    )
    expect(invalid.status).toBe(403)
    expect(await rowsFor(TENANT, 'bad-token@example.com')).toHaveLength(0)
    // The secret went to Cloudflare and never to the caller.
    expect(verifications.at(-1)).toMatchObject({ secret: SECRET, response: TOKEN })

    // AC-8 — unconfigured refuses rather than accepts.
    verifyOutcome = true
    const unconfigured = { ...workerEnv(), TURNSTILE_SECRET: '' } as Env
    const refused = await worker.fetch(
      post(path, submission(site.instanceId, { email: 'unconfigured@example.com' })),
      unconfigured,
      {} as ExecutionContext,
    )
    expect(refused.status).toBe(503)
    expect(await rowsFor(TENANT, 'unconfigured@example.com')).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-223_rate_limiting_is_keyed_on_site_and_source_ip', async () => {
    const site = await seedFormSite({ tenantId: TENANT })
    await worker.fetch(
      post(
        `/site/${site.siteKey}/api/lead`,
        submission(site.instanceId, { email: 'keyed@example.com' }),
        { ip: '203.0.113.7' },
      ),
      workerEnv(),
      {} as ExecutionContext,
    )
    // AC-9 — the two things the caller cannot vary, and nothing from the body.
    expect(limited).toContain(`${site.siteKey}:203.0.113.7`)
  })

  it('test_UAT_FC_REQ-223_oversized_and_overlong_submissions_are_refused', async () => {
    const site = await seedFormSite({ tenantId: TENANT })
    const path = `/site/${site.siteKey}/api/lead`

    // AC-10 — a body past the cap, refused before it is parsed.
    const huge = await worker.fetch(
      post(path, submission(site.instanceId, {
        email: 'huge@example.com',
        building: 'x'.repeat(MAX_BODY_BYTES + 100),
      })),
      workerEnv(),
      {} as ExecutionContext,
    )
    expect(huge.status).toBe(413)

    // AC-10 — too many fields.
    const many: Record<string, string> = submission(site.instanceId, { email: 'many@example.com' })
    for (let i = 0; i < MAX_FIELDS + 5; i += 1) many[`f${i}`] = 'x'
    const crowded = await worker.fetch(post(path, many), workerEnv(), {} as ExecutionContext)
    expect(crowded.status).toBe(400)

    // AC-10 — one answer past the per-field cap, inside an acceptable body.
    const long = await worker.fetch(
      post(path, submission(site.instanceId, {
        email: 'long@example.com',
        building: 'y'.repeat(MAX_FIELD_BYTES + 10),
      })),
      workerEnv(),
      {} as ExecutionContext,
    )
    expect(long.status).toBe(400)

    // None of the three wrote anything.
    expect(await rowsFor(TENANT, 'huge@example.com')).toHaveLength(0)
    expect(await rowsFor(TENANT, 'many@example.com')).toHaveLength(0)
    expect(await rowsFor(TENANT, 'long@example.com')).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-223_a_form_post_without_javascript_lands_and_gets_html', async () => {
    const site = await seedFormSite({ tenantId: TENANT })
    const response = await worker.fetch(
      post(
        `/site/${site.siteKey}/api/lead`,
        submission(site.instanceId, { email: 'nojs@example.com' }),
        { shape: 'form' },
      ),
      workerEnv(),
      {} as ExecutionContext,
    )

    // AC-3 — an ordinary form POST gets a page, not JSON.
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const body = await response.text()
    expect(body).toContain('<!doctype html>')
    expect(body).not.toContain('{"ok"')
    // …and lands the same row.
    expect(await rowsFor(TENANT, 'nojs@example.com')).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-223_the_apex_endpoint_writes_into_the_apex_site', async () => {
    const site = await seedFormSite({ tenantId: TENANT })
    const response = await worker.fetch(
      post('/api/lead', submission(site.instanceId, { email: 'apex@example.com' })),
      workerEnv(site.siteKey),
      {} as ExecutionContext,
    )
    expect(response.status).toBe(200)
    expect(await rowsFor(TENANT, 'apex@example.com')).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-223_everything_else_still_answers_405', async () => {
    const site = await seedFormSite({ tenantId: TENANT })
    const paths = [
      '/',
      '/index.html',
      '/api/leads',
      '/api/lead/extra',
      `/site/${site.siteKey}/`,
      `/site/${site.siteKey}/api/leads`,
    ]
    for (const path of paths) {
      for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
        const response = await worker.fetch(
          new Request(`${ORIGIN}${path}`, { method, body: method === 'DELETE' ? null : '{}' }),
          workerEnv(site.siteKey),
          {} as ExecutionContext,
        )
        // AC-13 — the amendment is one path and one method wide.
        expect([path, method, response.status]).toEqual([path, method, 405])
      }
    }
    // And the one doorway is not opened by a different verb either.
    const put = await worker.fetch(
      new Request(`${ORIGIN}/site/${site.siteKey}/api/lead`, { method: 'PUT', body: '{}' }),
      workerEnv(site.siteKey),
      {} as ExecutionContext,
    )
    expect(put.status).toBe(405)
  })

  it('test_UAT_FC_REQ-223_a_served_page_carries_the_widget', async () => {
    // THE STAMP HAPPENS ON THE WAY OUT OF THE BUCKET, not at publish time: the
    // sitekey is deployment configuration and a revision is an immutable record
    // of what a site said, so baking it in makes a key rotation a republish of
    // every site that has ever carried a form.
    const form = contactForm({
      instanceId: 'served',
      config: { action: '/api/lead', fields: [{ name: 'email', label: 'E', type: 'email' }] },
      slots: { form: { kind: 'container', layout: 'stack', children: [] } },
    })
    const site = await seedFormSite({
      tenantId: TENANT,
      outHtml: `<!doctype html><html><body>${form}</body></html>`,
    })

    const page = await worker.fetch(
      new Request(`${ORIGIN}/site/${site.siteKey}/`),
      workerEnv(),
      { waitUntil: () => {} } as unknown as ExecutionContext,
    )
    expect(page.status).toBe(200)
    const html = await page.text()
    expect(html).toContain(`data-sitekey="${SITEKEY}"`)
    expect(html).toContain(TURNSTILE_SCRIPT_URL)
    // The hidden instance handle travelled with the published bytes, which is
    // what gives the receiver a non-forgeable route to the form's own definition.
    expect(html).toContain(`name="${FORM_INSTANCE_FIELD}" value="served"`)

    // A deployment with no sitekey serves exactly what it published — the mount
    // is inert, and the refusal happens at the endpoint where it is loud.
    //
    // A SECOND SITE RATHER THAN A SECOND REQUEST FOR THE FIRST. The edge cache is
    // keyed on the request, and the sitekey is a property of the deployment
    // rather than of the caller — so re-fetching the same URL would be answered
    // from the cache, which is correct behaviour and useless as evidence.
    const other = await seedFormSite({
      tenantId: TENANT,
      outHtml: `<!doctype html><html><body>${form}</body></html>`,
    })
    const bare = await worker.fetch(
      new Request(`${ORIGIN}/site/${other.siteKey}/`),
      { ...workerEnv(), TURNSTILE_SITEKEY: '' } as Env,
      { waitUntil: () => {} } as unknown as ExecutionContext,
    )
    const bareHtml = await bare.text()
    expect(bareHtml).not.toContain('data-sitekey')
    expect(bareHtml).not.toContain(TURNSTILE_SCRIPT_URL)
  })

  it('test_UAT_FC_REQ-223_an_unwritable_deployment_refuses_rather_than_thanking', async () => {
    const site = await seedFormSite({ tenantId: TENANT })
    const noBinding = { ...workerEnv(), LEAD_INTAKE: undefined } as Env
    const response = await worker.fetch(
      post(`/site/${site.siteKey}/api/lead`, submission(site.instanceId, {
        email: 'nowhere@example.com',
      })),
      noBinding,
      {} as ExecutionContext,
    )
    // Acknowledging a submission nothing can record is the silent failure this
    // whole ticket exists to remove.
    expect(response.status).toBe(503)
    expect(await rowsFor(TENANT, 'nowhere@example.com')).toHaveLength(0)
  })
})
