import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createExecutionContext, env } from 'cloudflare:test'
import { WorkerEntrypoint } from 'cloudflare:workers'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import { MAX_BODY_BYTES, MAX_FIELDS, MAX_FIELD_BYTES } from '../apps/public-site/src/lead'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlAppEnv } from '../apps/control-app/src/index'
import { LeadIntake } from '../apps/control-app/src/worker'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv as ControlEnv } from '../apps/control-app/src/lead'
import { capturingMailer, type CapturingMailer } from '../apps/control-app/src/mail'
import { BOUNCED, COMPLAINED, messagesFor } from '../apps/control-app/src/messages'
import { handleEmailWebhook, EMAIL_WEBHOOK_PATH, signWebhook } from '../apps/control-app/src/email-webhook'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { eventsOf } from '../apps/control-app/src/events'
import { ASSET_SENT, FORM_SUBMITTED } from '../apps/control-app/src/builder/contact-events.js'
import {
  FORM_INSTANCE_FIELD,
  HONEYPOT_FIELD,
  TURNSTILE_FIELD,
} from '../packages/framework/src/modules/contact-form/fields'
import { contactForm } from '../packages/framework/src/modules/contact-form/component'
import {
  TURNSTILE_SCRIPT_URL,
  TURNSTILE_VERIFY_URL,
} from '../packages/framework/src/modules/contact-form/turnstile'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { SiteStoreEnv } from '../tools/generate/src/store/d1r2-store'
import publicToml from '../apps/public-site/wrangler.toml?raw'
import controlToml from '../apps/control-app/wrangler.toml?raw'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'
import { nextSlug } from './support/site-seed'

/**
 * story-f2e5032c (BUNDLE-42, REQ-223) — **public forms accept a submission.**
 *
 * Reconciliation UATs for the story's acceptance criteria. Every endpoint case
 * drives `public-site`'s real `fetch` inside workerd, against a real D1 with the
 * deployed schema and a real R2 bucket holding a published revision. The
 * service binding is the REAL `captureLead` (the function the `LeadIntake`
 * entrypoint wraps), handed a recording mail port so a test can count what left.
 * The only other doubles are the external boundaries: Cloudflare's siteverify
 * endpoint (a stubbed global `fetch`) and the rate limiter.
 */

const SECRET = 'recon-turnstile-secret'
const SITEKEY = '0xRECONSITEKEY'
const TOKEN = 'recon-valid-token'
const ORIGIN = 'https://recon-lead.test'
const MAIL_FROM = '1st Contact <no-reply@recon-lead.test>'
const WEBHOOK_SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw'
const ACK = '{"ok":true}'
const CANNOT = 'This site cannot take messages at the moment.'

type VerifyMode = 'success' | 'fail' | 'http500' | 'throw'

/** Every siteverify call: the URL, the method, the content type and the form body. */
let verifications: Array<{ url: string; method: string; type: string; form: Record<string, string> }>
let verifyMode: VerifyMode
/** Every rate-limit key asked about. */
let limited: string[]
let allowRate: boolean
/** The recording mail port the binding hands `captureLead`. */
let mailer: CapturingMailer

let seq = 0
const aTenant = (): string => `recon-lead-${Date.now().toString(36)}-${(seq += 1)}`

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  verifications = []
  verifyMode = 'success'
  limited = []
  allowRate = true
  mailer = capturingMailer()
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (!url.includes('siteverify')) throw new Error(`unexpected fetch: ${url}`)
    const headers = new Headers(init?.headers)
    verifications.push({
      url,
      method: String(init?.method ?? 'GET'),
      type: headers.get('content-type') ?? '',
      form: Object.fromEntries(new URLSearchParams(String(init?.body ?? ''))),
    })
    if (verifyMode === 'throw') throw new Error('network down')
    if (verifyMode === 'http500') return new Response('oops', { status: 500 })
    return new Response(JSON.stringify({ success: verifyMode === 'success' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function controlEnv(): ControlEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM,
  } as ControlEnv
}

/**
 * A D1 binding whose database is unreachable: every statement is accepted and
 * every execution rejects, the way a D1 outage presents to a Worker. D1 is an
 * external boundary, so this is the one place a failing double is allowed.
 */
function unavailableD1(): D1Database {
  const down = async (): Promise<never> => {
    throw new Error('D1_ERROR: database unavailable')
  }
  const statement = {
    bind: () => statement,
    first: down,
    all: down,
    run: down,
    raw: down,
  }
  return {
    prepare: () => statement,
    batch: down,
    exec: down,
    dump: down,
  } as unknown as D1Database
}

/** The whole public-site environment, fully configured unless overridden. */
function workerEnv(overrides: Partial<PublicEnv> = {}): PublicEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    APEX_SITE_KEY: undefined,
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
    LEAD_INTAKE: {
      captureLead: (spec) => captureLead(controlEnv(), spec, { send: mailer.send }),
    },
    ...overrides,
  } as PublicEnv
}

const ctx = { waitUntil: () => {} } as unknown as ExecutionContext

function post(
  path: string,
  fields: Record<string, unknown>,
  init: { shape?: 'json' | 'form' | 'multipart'; ip?: string } = {},
): Request {
  const shape = init.shape ?? 'json'
  const headers: Record<string, string> = {}
  if (init.ip) headers['cf-connecting-ip'] = init.ip
  let body: BodyInit
  if (shape === 'json') {
    headers['content-type'] = 'application/json'
    body = JSON.stringify(fields)
  } else if (shape === 'form') {
    headers['content-type'] = 'application/x-www-form-urlencoded'
    body = new URLSearchParams(fields as Record<string, string>).toString()
  } else {
    const data = new FormData()
    for (const [k, v] of Object.entries(fields)) data.append(k, String(v))
    body = data
  }
  return new Request(`${ORIGIN}${path}`, { method: 'POST', headers, body })
}

const send = (request: Request, overrides: Partial<PublicEnv> = {}): Promise<Response> =>
  publicSite.fetch(request, workerEnv(overrides), ctx)

const leadPath = (siteKey: string): string => `/site/${siteKey}/api/lead`

function submission(instanceId: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { [FORM_INSTANCE_FIELD]: instanceId, [TURNSTILE_FIELD]: TOKEN, ...extra }
}

/** The contact ids a business holds for `email`. */
async function contactsFor(tenantId: string, email: string): Promise<string[]> {
  const { results } = await (env.DB as D1Database)
    .prepare(
      'SELECT u.id AS id FROM users u JOIN user_emails e ON e.user_id = u.id ' +
        'WHERE u.tenant_id = ? AND e.email = ?',
    )
    .bind(tenantId, email)
    .all<{ id: string }>()
  return (results ?? []).map((r) => r.id)
}

async function contactCount(tenantId: string): Promise<number> {
  const row = await (env.DB as D1Database)
    .prepare('SELECT COUNT(*) AS n FROM users WHERE tenant_id = ?')
    .bind(tenantId)
    .first<{ n: number }>()
  return row?.n ?? 0
}

async function eventCount(tenantId: string): Promise<number> {
  const row = await (env.DB as D1Database)
    .prepare('SELECT COUNT(*) AS n FROM contact_events WHERE business_id = ?')
    .bind(tenantId)
    .first<{ n: number }>()
  return row?.n ?? 0
}

async function anyAddress(email: string): Promise<number> {
  const row = await (env.DB as D1Database)
    .prepare('SELECT COUNT(*) AS n FROM user_emails WHERE email = ?')
    .bind(email)
    .first<{ n: number }>()
  return row?.n ?? 0
}

const eventsFor = (tenantId: string, contactId: string) =>
  eventsOf(controlEnv(), { businessId: tenantId }, contactId)

async function messagesOf(tenantId: string, contactId: string) {
  const store = await ticketStoreFor(controlEnv(), { businessId: tenantId })
  return messagesFor(store, contactId)
}

/** A response's status, full header set and body, comparable with `toEqual`. */
async function snapshot(response: Response) {
  return {
    status: response.status,
    headers: [...response.headers.entries()].sort(([a], [b]) => a.localeCompare(b)),
    body: await response.text(),
  }
}

/** Deliver the provider's own signed event for a recorded message. */
async function providerEvent(providerId: string, address: string, type: string): Promise<void> {
  const payload = JSON.stringify({
    type,
    created_at: '2026-11-08T10:00:00.000Z',
    data: { email_id: providerId, to: [address] },
  })
  const id = `msg_recon_${crypto.randomUUID()}`
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = await signWebhook(WEBHOOK_SECRET, id, timestamp, payload)
  const result = await handleEmailWebhook(
    new Request(`https://app.example${EMAIL_WEBHOOK_PATH}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'webhook-id': id,
        'webhook-timestamp': timestamp,
        'webhook-signature': `v1,${signature}`,
      },
      body: payload,
    }),
    { ...controlEnv(), EMAIL_WEBHOOK_SECRET: WEBHOOK_SECRET },
  )
  expect(result.outcome?.matched).toBe(true)
}

/**
 * A published site whose single `contact-form` carries exactly `config` — for
 * shapes `seedFormSite` cannot express (a half-declared asset).
 */
async function seedRawForm(tenantId: string, config: Record<string, unknown>) {
  const root = d1r2SiteStore(env as unknown as SiteStoreEnv)
  await root.createTenant({ id: tenantId, name: tenantId })
  const store = await root.forTenant(tenantId)
  const slug = nextSlug('reconlead')
  const instanceId = `form-${slug}`
  const page = {
    slug: 'home',
    title: 'Home',
    modules: [{ id: instanceId, type: 'contact-form', version: 4, config, slots: {} }],
  }
  const siteJson = { name: slug, config: { businessName: 'Fixture' } }
  await store.createDraft(slug)
  await store.write(slug, { siteJson, pages: [{ name: 'home.json', page }], assets: [] })
  await store.writeRevision(
    slug,
    {
      id: 1,
      publishedAt: '2026-11-08T00:00:00.000Z',
      message: 'fixture',
      by: null,
      basedOn: null,
      changes: { added: ['home.json'], modified: [], removed: [] },
      sha: 'fixture',
    },
    {
      source: { siteJson, pages: [{ name: 'home.json', page }], assets: [] },
      out: new Map([['index.html', '<!doctype html><title>Home</title>']]),
    },
  )
  const siteKey = await store.siteKey(slug)
  if (!siteKey) throw new Error('fixture site has no key')
  return { siteKey, instanceId }
}

const ASSET = { key: 'recon-papers', name: 'both whitepapers', url: 'https://example.test/papers' }

describe('story-f2e5032c — public lead capture', () => {
  it('test_UAT_AC2500_json_submission_is_acknowledged_and_lands_one_lead_in_the_url_tenant', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant })

    // A non-browser caller: no Origin, no cookies.
    const response = await send(
      post(leadPath(site.siteKey), submission(site.instanceId, { email: 'Keyed@Example.com' })),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.text()).toBe(ACK)

    const ids = await contactsFor(tenant, 'keyed@example.com')
    expect(ids).toHaveLength(1)
    const stage = await (env.DB as D1Database)
      .prepare('SELECT pipeline_stage AS s FROM users WHERE id = ?')
      .bind(ids[0])
      .first<{ s: string }>()
    expect(stage?.s).toBe('lead')

    // The bare path writes into the deployment's apex site.
    const apexTenant = aTenant()
    const apex = await seedFormSite({ tenantId: apexTenant })
    const bare = await send(
      post('/api/lead', submission(apex.instanceId, { email: 'apex@example.com' })),
      { APEX_SITE_KEY: apex.siteKey },
    )
    expect(bare.status).toBe(200)
    expect(await bare.text()).toBe(ACK)
    expect(await contactsFor(apexTenant, 'apex@example.com')).toHaveLength(1)

    // No apex site: the bare path is the ordinary 405, and nothing is written.
    const none = await send(
      post('/api/lead', submission(apex.instanceId, { email: 'noapex@example.com' })),
      { APEX_SITE_KEY: '' },
    )
    expect(none.status).toBe(405)
    expect(await anyAddress('noapex@example.com')).toBe(0)
  })

  it('test_UAT_AC2501_resubmitting_the_same_address_in_any_case_creates_no_second_contact', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant })

    const first = await send(
      post(leadPath(site.siteKey), submission(site.instanceId, { email: 'again@example.com' })),
    )
    const second = await send(
      post(leadPath(site.siteKey), submission(site.instanceId, { email: '  AGAIN@Example.COM ' })),
    )
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)

    const ids = await contactsFor(tenant, 'again@example.com')
    expect(ids).toHaveLength(1)
    expect(await contactCount(tenant)).toBe(1)
    const submitted = (await eventsFor(tenant, ids[0])).filter((e) => e.kind === FORM_SUBMITTED)
    expect(submitted).toHaveLength(2)
  })

  it('test_UAT_AC2502_every_identity_dependent_outcome_answers_one_byte_identical_acknowledgement', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant, asset: ASSET })
    const other = await seedFormSite({
      tenantId: tenant,
      asset: { key: 'recon-guide', name: 'the guide', url: 'https://example.test/guide' },
    })
    const path = leadPath(site.siteKey)
    const outcomes: Record<string, Awaited<ReturnType<typeof snapshot>>> = {}

    // A new address (and it receives the asset).
    outcomes.newAddress = await snapshot(
      await send(post(path, submission(site.instanceId, { email: 'ack-new@example.com' }))),
    )
    // An address already a contact, which has also already had this form's asset.
    outcomes.alreadyContactAndAssetSent = await snapshot(
      await send(post(path, submission(site.instanceId, { email: 'ack-new@example.com' }))),
    )
    // A suppressed address: its delivered message bounced, and it asks for a new asset.
    const contactId = (await contactsFor(tenant, 'ack-new@example.com'))[0]
    const delivered = (await messagesOf(tenant, contactId))[0]
    await providerEvent(delivered.providerId as string, 'ack-new@example.com', 'email.bounced')
    outcomes.suppressed = await snapshot(
      await send(
        post(leadPath(other.siteKey), submission(other.instanceId, { email: 'ack-new@example.com' })),
      ),
    )
    // A filled honeypot.
    outcomes.honeypot = await snapshot(
      await send(
        post(path, submission(site.instanceId, { email: 'ack-trap@example.com', [HONEYPOT_FIELD]: 'x' })),
      ),
    )
    // Over the rate limit.
    allowRate = false
    outcomes.rateLimited = await snapshot(
      await send(post(path, submission(site.instanceId, { email: 'ack-limited@example.com' }))),
    )
    allowRate = true
    // A site key that names no site.
    outcomes.unknownSite = await snapshot(
      await send(
        post(leadPath('site_recon_no_such_key'), submission('anything', { email: 'ack-ghost@example.com' })),
      ),
    )
    // A submission with no email-shaped value.
    outcomes.noEmail = await snapshot(
      await send(post(path, submission(site.instanceId, { name: 'No Address Given' }))),
    )

    expect(outcomes.newAddress.status).toBe(200)
    expect(outcomes.newAddress.body).toBe(ACK)
    for (const [name, outcome] of Object.entries(outcomes)) {
      expect([name, outcome]).toEqual([name, outcomes.newAddress])
    }

    // The native form shape has its own single acknowledgement, the same for a
    // new address and a honeypot hit.
    const htmlNew = await snapshot(
      await send(
        post(path, submission(site.instanceId, { email: 'ack-html@example.com' }), { shape: 'form' }),
      ),
    )
    const htmlTrap = await snapshot(
      await send(
        post(path, submission(site.instanceId, { email: 'ack-html-trap@example.com', [HONEYPOT_FIELD]: 'x' }), {
          shape: 'form',
        }),
      ),
    )
    expect(htmlTrap).toEqual(htmlNew)
    expect(htmlNew.body).toContain('Thank you')
  })

  it('test_UAT_AC2503_a_no_javascript_form_post_is_captured_identically_and_gets_an_html_page', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({
      tenantId: tenant,
      submitLabel: 'Join the list',
      fields: [
        { name: 'email', label: 'Your email', type: 'email', required: true },
        { name: 'building', label: 'What are you building?', type: 'textarea' },
      ],
    })
    const path = leadPath(site.siteKey)

    const viaJson = await send(
      post(path, submission(site.instanceId, { email: 'js@example.com', building: 'a bakery' })),
    )
    expect(viaJson.status).toBe(200)

    // The published form is a plain `<form method="post">` with no `enctype`, so a
    // browser without JavaScript submits it URL-encoded: that is the ordinary
    // form POST REQ-223 asks to land the same row.
    const publishedForm = contactForm({
      instanceId: site.instanceId,
      config: { action: '/api/lead', fields: [{ name: 'email', label: 'E', type: 'email' }] },
      slots: { form: { kind: 'container', layout: 'stack', children: [] } },
    })
    expect(publishedForm).toMatch(/<form[^>]*method="post"/)
    expect(publishedForm).not.toMatch(/enctype=/i)

    const results: Array<{ address: string; response: Response }> = []
    for (const shape of ['form'] as const) {
      const address = `nojs-${shape}@example.com`
      results.push({
        address,
        response: await send(
          post(path, submission(site.instanceId, { email: address, building: 'a bakery' }), { shape }),
        ),
      })
    }

    const jsId = (await contactsFor(tenant, 'js@example.com'))[0]
    const jsEvent = (await eventsFor(tenant, jsId)).find((e) => e.kind === FORM_SUBMITTED)

    for (const { address, response } of results) {
      expect([address, response.status]).toEqual([address, 200])
      expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(response.headers.get('x-robots-tag')).toBe('noindex')
      const body = await response.text()
      expect(body).toContain('<h1>Thank you</h1>')
      expect(body).toContain('Your message has been received.')
      expect(body).toContain('<meta name="robots" content="noindex">')
      expect(body).not.toContain('{"ok"')

      const ids = await contactsFor(tenant, address)
      expect([address, ids.length]).toEqual([address, 1])
      const event = (await eventsFor(tenant, ids[0])).find((e) => e.kind === FORM_SUBMITTED)
      // The same provenance a JSON submission leaves.
      expect(event?.detail).toEqual(jsEvent?.detail)
    }

    // A refusal of a native form submission is HTML too.
    const refused = await send(
      post(
        path,
        submission(site.instanceId, { email: 'nojs-long@example.com', building: 'z'.repeat(MAX_FIELD_BYTES + 1) }),
        { shape: 'form' },
      ),
    )
    expect(refused.status).toBe(400)
    expect(refused.headers.get('content-type')).toContain('text/html')
  })

  it('test_UAT_AC2504_the_tenant_comes_only_from_the_url_and_a_body_claim_is_an_answer', async () => {
    const tenantA = aTenant()
    const tenantB = aTenant()
    const siteA = await seedFormSite({ tenantId: tenantA })
    const siteB = await seedFormSite({ tenantId: tenantB })
    const beforeB = await contactCount(tenantB)

    const response = await send(
      post(
        leadPath(siteA.siteKey),
        submission(siteA.instanceId, {
          email: 'steer@example.com',
          siteKey: siteB.siteKey,
          business: tenantB,
          tenant_id: tenantB,
        }),
      ),
    )
    expect(response.status).toBe(200)

    const ids = await contactsFor(tenantA, 'steer@example.com')
    expect(ids).toHaveLength(1)
    expect(await contactsFor(tenantB, 'steer@example.com')).toHaveLength(0)
    expect(await contactCount(tenantB)).toBe(beforeB)
    expect(await eventCount(tenantB)).toBe(0)

    const event = (await eventsFor(tenantA, ids[0])).find((e) => e.kind === FORM_SUBMITTED)
    expect(event?.detail.site).toBe(siteA.siteKey)
    expect(event?.detail.fields).toMatchObject({
      siteKey: siteB.siteKey,
      business: tenantB,
      tenant_id: tenantB,
    })
  })

  it('test_UAT_AC2505_each_submission_records_provenance_from_the_published_definition', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({
      tenantId: tenant,
      submitLabel: 'Send me both papers',
      asset: ASSET,
      fields: [
        { name: 'email', label: 'Your email', type: 'email', required: true },
        { name: 'building', label: 'What are you building?', type: 'textarea' },
        { name: 'list', label: 'Email me occasionally about new papers', type: 'checkbox' },
      ],
    })
    const path = leadPath(site.siteKey)
    const forged = {
      page: 'forged.json',
      submitLabel: 'Forged label',
      wording: 'I agree to everything',
      consent: 'forged consent wording',
      asset: 'forged-asset',
    }

    await send(
      post(
        path,
        submission(site.instanceId, {
          email: 'prov@example.com',
          building: 'a catering site',
          list: 'yes',
          [HONEYPOT_FIELD]: '',
          ...forged,
        }),
      ),
    )
    await send(
      post(path, submission(site.instanceId, { email: 'prov@example.com', building: 'still catering' })),
    )

    const id = (await contactsFor(tenant, 'prov@example.com'))[0]
    const submitted = (await eventsFor(tenant, id))
      .filter((e) => e.kind === FORM_SUBMITTED)
      .sort((a, b) => String(a.detail.fields && (a.detail.fields as Record<string, string>).building).localeCompare(
        String(b.detail.fields && (b.detail.fields as Record<string, string>).building),
      ))
    expect(submitted).toHaveLength(2)
    const [ticked, unticked] = submitted

    for (const event of submitted) {
      expect(event.detail.site).toBe(site.siteKey)
      expect(event.detail.page).toBe('home.json')
      expect(event.detail.form).toBe(site.instanceId)
      expect(event.detail.submitLabel).toBe('Send me both papers')
      expect(event.detail.asset).toBe(ASSET.key)
      const fields = event.detail.fields as Record<string, string>
      for (const reserved of [HONEYPOT_FIELD, TURNSTILE_FIELD, FORM_INSTANCE_FIELD]) {
        expect(Object.keys(fields)).not.toContain(reserved)
      }
      expect(Object.keys(fields)).not.toContain('email')
      expect(Object.values(fields)).not.toContain('prov@example.com')
      expect(Object.keys(fields)).not.toContain('list')
    }

    expect(ticked.detail.fields).toMatchObject({ building: 'a catering site', ...forged })
    expect(ticked.detail.consent).toEqual([
      { field: 'list', wording: 'Email me occasionally about new papers', answer: true },
    ])
    expect(unticked.detail.fields).toEqual({ building: 'still catering' })
    expect(unticked.detail.consent).toEqual([
      { field: 'list', wording: 'Email me occasionally about new papers', answer: false },
    ])

    // An instance the published definition does not hold is still captured.
    await send(
      post(path, submission('no-such-instance', { email: 'orphan@example.com', note: 'hello' })),
    )
    const orphanId = (await contactsFor(tenant, 'orphan@example.com'))[0]
    expect(orphanId).toBeTruthy()
    const orphan = (await eventsFor(tenant, orphanId)).find((e) => e.kind === FORM_SUBMITTED)
    expect(orphan?.detail.site).toBe(site.siteKey)
    expect(orphan?.detail.form).toBe('no-such-instance')
    expect(orphan?.detail.fields).toEqual({ note: 'hello' })
  })

  it('test_UAT_AC2506_a_filled_honeypot_is_acknowledged_and_writes_sends_and_verifies_nothing', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant, asset: ASSET })
    const path = leadPath(site.siteKey)

    const reference = await snapshot(
      await send(post(path, submission(site.instanceId, { email: 'hp-ref@example.com' }))),
    )
    verifications = []
    const mailsBefore = mailer.sent.length
    const contactsBefore = await contactCount(tenant)
    const eventsBefore = await eventCount(tenant)

    const trapped = await snapshot(
      await send(
        post(path, submission(site.instanceId, { email: 'hp-bot@example.com', [HONEYPOT_FIELD]: 'https://spam' })),
      ),
    )
    expect(trapped).toEqual(reference)
    expect(trapped.body).toBe(ACK)
    expect(await contactCount(tenant)).toBe(contactsBefore)
    expect(await eventCount(tenant)).toBe(eventsBefore)
    expect(await anyAddress('hp-bot@example.com')).toBe(0)
    expect(mailer.sent.length).toBe(mailsBefore)
    expect(verifications).toHaveLength(0)

    // Whitespace alone is not a filled honeypot.
    await send(post(path, submission(site.instanceId, { email: 'hp-blank@example.com', [HONEYPOT_FIELD]: '   ' })))
    expect(await contactsFor(tenant, 'hp-blank@example.com')).toHaveLength(1)
  })

  it('test_UAT_AC2507_a_missing_or_unconfirmed_turnstile_token_is_refused_and_no_secret_fails_closed', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant })
    const path = leadPath(site.siteKey)

    const attempt = async (
      label: string,
      fields: Record<string, unknown>,
      expected: number,
      overrides: Partial<PublicEnv> = {},
    ) => {
      const response = await send(post(path, fields, { ip: '198.51.100.9' }), overrides)
      const body = await response.text()
      expect([label, response.status]).toEqual([label, expected])
      expect(body).not.toBe(ACK)
    }

    // No token, and a blank one.
    await attempt('no token', { [FORM_INSTANCE_FIELD]: site.instanceId, email: 'tt-none@example.com' }, 400)
    await attempt(
      'blank token',
      { [FORM_INSTANCE_FIELD]: site.instanceId, [TURNSTILE_FIELD]: '   ', email: 'tt-blank@example.com' },
      400,
    )
    // The verifier says no, answers non-OK, or cannot be reached.
    verifyMode = 'fail'
    await attempt('rejected', submission(site.instanceId, { email: 'tt-fail@example.com' }), 403)
    verifyMode = 'http500'
    await attempt('non-ok', submission(site.instanceId, { email: 'tt-500@example.com' }), 403)
    verifyMode = 'throw'
    await attempt('network', submission(site.instanceId, { email: 'tt-throw@example.com' }), 403)
    // No secret, even with a token present.
    verifyMode = 'success'
    await attempt('secret unset', submission(site.instanceId, { email: 'tt-unset@example.com' }), 503, {
      TURNSTILE_SECRET: undefined,
    })
    await attempt('secret blank', submission(site.instanceId, { email: 'tt-blankkey@example.com' }), 503, {
      TURNSTILE_SECRET: '  ',
    })

    for (const address of [
      'tt-none',
      'tt-blank',
      'tt-fail',
      'tt-500',
      'tt-throw',
      'tt-unset',
      'tt-blankkey',
    ]) {
      expect([address, await anyAddress(`${address}@example.com`)]).toEqual([address, 0])
    }
    expect(await eventCount(tenant)).toBe(0)
    expect(mailer.sent).toHaveLength(0)

    // What verification sends: secret, token and source IP, form-encoded, to siteverify.
    verifications = []
    await send(post(path, submission(site.instanceId, { email: 'tt-ok@example.com' }), { ip: '198.51.100.9' }))
    expect(verifications).toHaveLength(1)
    expect(verifications[0].url).toBe(TURNSTILE_VERIFY_URL)
    expect(verifications[0].method).toBe('POST')
    expect(verifications[0].type).toBe('application/x-www-form-urlencoded')
    expect(verifications[0].form).toEqual({ secret: SECRET, response: TOKEN, remoteip: '198.51.100.9' })
    expect(await contactsFor(tenant, 'tt-ok@example.com')).toHaveLength(1)
  })

  it('test_UAT_AC2508_rate_limiting_is_keyed_on_site_and_source_ip_and_a_refusal_is_indistinguishable', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant, asset: ASSET })
    const path = leadPath(site.siteKey)

    const reference = await snapshot(
      await send(post(path, submission(site.instanceId, { email: 'rl-a@example.com' }), { ip: '203.0.113.7' })),
    )
    await send(
      post(
        path,
        submission(site.instanceId, { email: 'rl-b@example.com', siteKey: 'other', ip: '10.0.0.1', note: 'x' }),
        { ip: '203.0.113.7' },
      ),
    )
    expect(limited).toEqual([`${site.siteKey}:203.0.113.7`, `${site.siteKey}:203.0.113.7`])

    allowRate = false
    verifications = []
    const mailsBefore = mailer.sent.length
    const contactsBefore = await contactCount(tenant)
    const eventsBefore = await eventCount(tenant)
    const refused = await snapshot(
      await send(post(path, submission(site.instanceId, { email: 'rl-c@example.com' }), { ip: '203.0.113.7' })),
    )
    expect(refused).toEqual(reference)
    expect(await anyAddress('rl-c@example.com')).toBe(0)
    expect(await contactCount(tenant)).toBe(contactsBefore)
    expect(await eventCount(tenant)).toBe(eventsBefore)
    expect(mailer.sent.length).toBe(mailsBefore)
    expect(verifications).toHaveLength(0)
  })

  it('test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant })
    const url = `${ORIGIN}${leadPath(site.siteKey)}`
    const valid = (extra: Record<string, unknown> = {}) =>
      JSON.stringify(submission(site.instanceId, { email: 'mal@example.com', ...extra }))

    // A declared over-size length, refused without the body being read.
    // `highWaterMark: 0` so the stream is only pulled when somebody reads it.
    let pulled = false
    const lazy = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          pulled = true
          controller.enqueue(new TextEncoder().encode(valid()))
          controller.close()
        },
      },
      { highWaterMark: 0 },
    )
    const declared = new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': String(MAX_BODY_BYTES + 1) },
      body: lazy,
    })

    // A chunked body with no declared length that is too large once read.
    const big = new TextEncoder().encode(valid({ building: 'x'.repeat(MAX_BODY_BYTES) }))
    const chunked = new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(big.slice(0, 4000))
          controller.enqueue(big.slice(4000))
          controller.close()
        },
      }),
    })

    const many: Record<string, unknown> = submission(site.instanceId, { email: 'mal@example.com' })
    for (let i = 0; Object.keys(many).length <= MAX_FIELDS; i += 1) many[`f${i}`] = 'x'

    const cases: Array<[string, Request, number]> = [
      ['declared length', declared, 413],
      ['chunked body', chunked, 413],
      [
        '25 fields',
        new Request(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(many) }),
        400,
      ],
      [
        '4001-byte field',
        new Request(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: valid({ building: 'y'.repeat(MAX_FIELD_BYTES + 1) }),
        }),
        400,
      ],
      [
        'json array',
        new Request(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '["mal@example.com"]' }),
        400,
      ],
      [
        'text/plain',
        new Request(url, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: valid() }),
        415,
      ],
    ]
    expect(Object.keys(many)).toHaveLength(MAX_FIELDS + 1)

    for (const [label, request, status] of cases) {
      const response = await send(request)
      expect([label, response.status]).toEqual([label, status])
      expect([label, await response.text()]).not.toEqual([label, ACK])
    }
    expect(pulled).toBe(false)

    // A body with no declared length that never ends: the read is capped while
    // it happens (REQ-223 §6, "a large body must be rejected rather than read"),
    // so the stream is cancelled once the cap is passed rather than buffered.
    const CHUNK = 1024
    let pulledBytes = 0
    let cancelled = false
    const endless = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          pulledBytes += CHUNK
          controller.enqueue(new Uint8Array(CHUNK).fill(0x20))
        },
        cancel() {
          cancelled = true
        },
      },
      { highWaterMark: 0 },
    )
    const unending = await send(
      new Request(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: endless }),
    )
    expect(unending.status).toBe(413)
    expect(await unending.text()).not.toEqual(ACK)
    expect(cancelled).toBe(true)
    expect(pulledBytes).toBeLessThanOrEqual(MAX_BODY_BYTES + CHUNK)

    expect(limited).toHaveLength(0)
    expect(verifications).toHaveLength(0)
    expect(await anyAddress('mal@example.com')).toBe(0)
    expect(await eventCount(tenant)).toBe(0)

    // Non-string JSON values are dropped rather than stored.
    const accepted = await send(
      post(
        leadPath(site.siteKey),
        submission(site.instanceId, {
          email: 'mal-ok@example.com',
          note: 'kept',
          nested: { a: 1 },
          list: ['a', 'b'],
          nothing: null,
        }),
      ),
    )
    expect(accepted.status).toBe(200)
    const id = (await contactsFor(tenant, 'mal-ok@example.com'))[0]
    const event = (await eventsFor(tenant, id)).find((e) => e.kind === FORM_SUBMITTED)
    expect(event?.detail.fields).toEqual({ note: 'kept' })
  })

  it('test_UAT_AC2510_a_deployment_that_cannot_record_refuses_with_503', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant })
    const path = leadPath(site.siteKey)

    const variants: Array<[string, Partial<PublicEnv>]> = [
      ['no write binding', { LEAD_INTAKE: undefined }],
      ['no rate limiter', { LEAD_RATE_LIMIT: undefined }],
      [
        'limiter throws',
        {
          LEAD_RATE_LIMIT: {
            limit: async () => {
              throw new Error('limiter down')
            },
          } as unknown as RateLimit,
        },
      ],
      [
        // The REAL captureLead, against a database binding that is down: the write
        // throws from inside control-app's own code, not from a stub of it.
        'write throws',
        {
          LEAD_INTAKE: {
            captureLead: (spec) =>
              captureLead({ ...controlEnv(), DB: unavailableD1() } as ControlEnv, spec, {
                send: mailer.send,
              }),
          },
        },
      ],
    ]
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      for (const [label, overrides] of variants) {
        const address = `down-${label.replace(/\s+/g, '-')}@example.com`
        const response = await send(post(path, submission(site.instanceId, { email: address })), overrides)
        const body = await response.text()
        expect([label, response.status]).toEqual([label, 503])
        expect(body).not.toBe(ACK)
        expect(body).toContain(CANNOT)
        expect([label, await anyAddress(address)]).toEqual([label, 0])
      }
      // The real write's failure was logged where the operator is, not swallowed.
      expect(
        errors.mock.calls.some((args) => String(args[0]).includes('lead_capture_failed')),
      ).toBe(true)
    } finally {
      errors.mockRestore()
    }
    expect(await eventCount(tenant)).toBe(0)
    expect(mailer.sent).toHaveLength(0)
  })

  it('test_UAT_AC2511_an_asset_is_delivered_at_most_once_per_address_with_authored_content_only', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({
      tenantId: tenant,
      asset: ASSET,
      fields: [
        { name: 'email', label: 'Your email', type: 'email', required: true },
        { name: 'building', label: 'What are you building?', type: 'textarea' },
      ],
    })
    const path = leadPath(site.siteKey)
    const MARKER = 'VISITOR-TYPED-7f3a'
    const fields = submission(site.instanceId, {
      email: 'asset-once@example.com',
      building: `${MARKER}\r\nBcc: victim@example.com`,
      name: MARKER,
    })

    const first = await snapshot(await send(post(path, fields)))
    const second = await snapshot(await send(post(path, fields)))
    expect(second).toEqual(first)

    const id = (await contactsFor(tenant, 'asset-once@example.com'))[0]
    const forAsset = (await messagesOf(tenant, id)).filter((m) => m.asset === ASSET.key)
    expect(forAsset).toHaveLength(1)
    const message = forAsset[0]
    expect(message.to).toBe('asset-once@example.com')
    expect(message.templateKey).toBe('asset')
    expect(message.body).toContain(ASSET.url)
    expect(message.body).toContain(ASSET.name)
    expect(message.subject).not.toContain(MARKER)
    expect(message.body).not.toContain(MARKER)
    expect(message.body).not.toContain('victim@example.com')
    expect(mailer.sent).toHaveLength(1)
    expect(mailer.sent[0].to).toBe('asset-once@example.com')

    const assetEvents = (await eventsFor(tenant, id)).filter((e) => e.kind === ASSET_SENT)
    expect(assetEvents).toHaveLength(1)
    expect(assetEvents[0].detail).toMatchObject({ asset: ASSET.key, status: message.status })

    // A form promising no asset, or only half of one, sends nothing.
    const noAsset = await seedFormSite({ tenantId: tenant })
    const keyOnly = await seedRawForm(tenant, {
      action: '/api/lead',
      fields: [{ name: 'email', label: 'Your email', type: 'email' }],
      asset: 'half-key',
      assetName: 'half',
    })
    const urlOnly = await seedRawForm(tenant, {
      action: '/api/lead',
      fields: [{ name: 'email', label: 'Your email', type: 'email' }],
      assetUrl: 'https://example.test/half',
      assetName: 'half',
    })
    for (const [label, target] of [
      ['no asset', noAsset],
      ['key only', keyOnly],
      ['url only', urlOnly],
    ] as const) {
      const address = `asset-${label.replace(' ', '-')}@example.com`
      const response = await send(post(leadPath(target.siteKey), submission(target.instanceId, { email: address })))
      expect(response.status).toBe(200)
      const contact = (await contactsFor(tenant, address))[0]
      expect([label, (await messagesOf(tenant, contact)).length]).toEqual([label, 0])
    }
    expect(mailer.sent).toHaveLength(1)

    // The email field is the ONE visitor-typed value that reaches a To header. A
    // value carrying CRLF (a header-injection attempt) or whitespace inside the
    // address is not an address: it is refused as one — nothing is added, nothing
    // is sent — while the caller still gets the frozen acknowledgement.
    const ackRef = await snapshot(
      await send(post(path, submission(site.instanceId, { email: 'asset-ack-ref@example.com' }))),
    )
    const sentBefore = mailer.sent.length
    const contactsBefore = await contactCount(tenant)
    const eventsBefore = await eventCount(tenant)
    for (const [label, email] of [
      ['crlf header injection', 'crlf-inject@example.com\r\nBcc: victim@example.com'],
      ['bare lf', 'lf-inject@example.com\nCc: victim@example.com'],
      ['space in local part', 'space inside@example.com'],
      ['tab in domain', 'tab-inside@exam\tple.com'],
    ] as const) {
      const response = await snapshot(await send(post(path, submission(site.instanceId, { email }))))
      expect([label, response]).toEqual([label, ackRef])
    }
    expect(mailer.sent.length).toBe(sentBefore)
    expect(mailer.sent.map((m) => m.to)).not.toContain('victim@example.com')
    expect(await contactCount(tenant)).toBe(contactsBefore)
    expect(await eventCount(tenant)).toBe(eventsBefore)
    for (const address of [
      'crlf-inject@example.com',
      'lf-inject@example.com',
      'victim@example.com',
      'inside@example.com',
      'tab-inside@example.com',
    ]) {
      expect([address, await anyAddress(address)]).toEqual([address, 0])
    }
  })

  it('test_UAT_AC2512_an_address_with_a_bounced_or_complained_message_is_never_sent_an_asset', async () => {
    for (const [label, type, status] of [
      ['complained', 'email.complained', COMPLAINED],
      ['bounced', 'email.bounced', BOUNCED],
    ] as const) {
      const tenant = aTenant()
      const first = await seedFormSite({ tenantId: tenant, asset: ASSET })
      const fresh = await seedFormSite({
        tenantId: tenant,
        asset: { key: `recon-new-${label}`, name: 'a new guide', url: 'https://example.test/new' },
      })
      const address = `suppress-${label}@example.com`

      await send(post(leadPath(first.siteKey), submission(first.instanceId, { email: address })))
      const id = (await contactsFor(tenant, address))[0]
      const delivered = (await messagesOf(tenant, id))[0]
      // The real signed provider webhook records the outcome against the message.
      await providerEvent(delivered.providerId as string, address, type)
      expect((await messagesOf(tenant, id))[0].status).toBe(status)

      const sentBefore = mailer.sent.length
      const response = await send(post(leadPath(fresh.siteKey), submission(fresh.instanceId, { email: address })))
      expect(response.status).toBe(200)
      expect(await response.text()).toBe(ACK)

      const messages = await messagesOf(tenant, id)
      expect([label, messages.length]).toEqual([label, 1])
      expect(messages.some((m) => m.asset === `recon-new-${label}`)).toBe(false)
      expect(mailer.sent.length).toBe(sentBefore)
      const submitted = (await eventsFor(tenant, id)).filter((e) => e.kind === FORM_SUBMITTED)
      expect(submitted).toHaveLength(2)
      expect(submitted.some((e) => e.detail.form === fresh.instanceId)).toBe(true)
    }
  })

  it('test_UAT_AC2513_the_write_seam_is_a_bound_rpc_entrypoint_reachable_by_no_url', async () => {
    // The control app exposes the write as a named WorkerEntrypoint.
    expect(LeadIntake.prototype).toBeInstanceOf(WorkerEntrypoint)
    expect(typeof LeadIntake.prototype.captureLead).toBe('function')
    expect(controlToml).toMatch(/^name = "1stcontact-control-app"$/m)
    expect(controlToml).toMatch(/^main = "src\/worker\.ts"$/m)

    // public-site binds that entrypoint in both environments.
    const block = (header: string): string => {
      const start = publicToml.indexOf(`[[${header}]]`)
      expect([header, start]).not.toEqual([header, -1])
      const rest = publicToml.slice(start + header.length + 4)
      const end = rest.search(/\n\[/)
      return end === -1 ? rest : rest.slice(0, end)
    }
    for (const header of ['services', 'env.production.services']) {
      const body = block(header)
      expect(body).toMatch(/binding\s*=\s*"LEAD_INTAKE"/)
      expect(body).toMatch(/service\s*=\s*"1stcontact-control-app"/)
      expect(body).toMatch(/entrypoint\s*=\s*"LeadIntake"/)
    }

    // No Turnstile secret in any committed config; only the public sitekey.
    for (const [name, toml] of [
      ['public-site', publicToml],
      ['control-app', controlToml],
    ] as const) {
      expect([name, /TURNSTILE_SECRET\s*=/.test(toml)]).toEqual([name, false])
    }
    expect(publicToml).toMatch(/^TURNSTILE_SITEKEY = /m)

    // THE SHIPPED ENTRYPOINT ITSELF CARRIES A SUBMISSION. Every other case binds the
    // function `LeadIntake` wraps; here the binding IS a `LeadIntake` instance,
    // constructed the way the runtime constructs it (an execution context and the
    // control app's own env), so a broken wrapper — the wrong `this.env`, a lost
    // argument — fails here. It is given no mail port: it must pick its own.
    const intakeTenant = aTenant()
    const intakeSite = await seedFormSite({ tenantId: intakeTenant, asset: ASSET })
    const intakeEnv = { ...controlEnv(), TENANT_ID: intakeTenant } as ControlAppEnv
    const intake = new LeadIntake(createExecutionContext(), intakeEnv)
    const sentBeforeIntake = mailer.sent.length
    const logs = vi.spyOn(console, 'log').mockImplementation(() => {})
    let viaEntrypoint: Response
    try {
      viaEntrypoint = await send(
        post(
          leadPath(intakeSite.siteKey),
          submission(intakeSite.instanceId, { email: 'Via-Entrypoint@Example.com', note: 'through the seam' }),
        ),
        { LEAD_INTAKE: intake },
      )
    } finally {
      logs.mockRestore()
    }
    expect(viaEntrypoint.status).toBe(200)
    expect(await viaEntrypoint.text()).toBe(ACK)
    const intakeIds = await contactsFor(intakeTenant, 'via-entrypoint@example.com')
    expect(intakeIds).toHaveLength(1)
    const intakeEvent = (await eventsFor(intakeTenant, intakeIds[0])).find((e) => e.kind === FORM_SUBMITTED)
    expect(intakeEvent?.detail.site).toBe(intakeSite.siteKey)
    expect(intakeEvent?.detail.form).toBe(intakeSite.instanceId)
    expect(intakeEvent?.detail.fields).toEqual({ note: 'through the seam' })
    // The asset went out through the entrypoint's OWN mailer (no credential here,
    // so the recording adapter), recorded on the contact — not through this
    // file's port, which the entrypoint was never handed.
    const intakeMessages = await messagesOf(intakeTenant, intakeIds[0])
    expect(intakeMessages.filter((m) => m.asset === ASSET.key)).toHaveLength(1)
    expect(mailer.sent.length).toBe(sentBeforeIntake)

    // Called directly, it reports the outcome to its caller.
    const direct = await intake.captureLead({
      siteKey: intakeSite.siteKey,
      instanceId: intakeSite.instanceId,
      fields: { email: 'via-entrypoint@example.com' },
    })
    expect(direct).toMatchObject({ accepted: true, businessId: intakeTenant, contactId: intakeIds[0], created: false })
    expect(await contactsFor(intakeTenant, 'via-entrypoint@example.com')).toHaveLength(1)

    // Probe the control app's HTTP surface: nothing on it captures a contact,
    // with Access configured or in the loopback dev-open mode.
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant })
    const address = 'probe-seam@example.com'
    const body = JSON.stringify({
      siteKey: site.siteKey,
      instanceId: site.instanceId,
      fields: { email: address },
      email: address,
      [FORM_INSTANCE_FIELD]: site.instanceId,
      [TURNSTILE_FIELD]: TOKEN,
    })
    const controlEnvs: ControlAppEnv[] = [
      {
        ...controlEnv(),
        TENANT_ID: tenant,
        ACCESS_DEV_OPEN: '',
        ACCESS_TEAM_DOMAIN: 'https://recon-seam.cloudflareaccess.com',
        ACCESS_AUD: 'f'.repeat(64),
        SESSION_COOKIE_NAME: 'session',
        ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
      } as ControlAppEnv,
      {
        ...controlEnv(),
        TENANT_ID: tenant,
        ACCESS_DEV_OPEN: '1',
        ACCESS_TEAM_DOMAIN: '',
        ACCESS_AUD: '',
        SESSION_COOKIE_NAME: 'session',
        ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
      } as ControlAppEnv,
    ]
    const paths = [
      '/api/lead',
      '/internal/lead',
      '/lead',
      '/api/leads',
      '/captureLead',
      '/LeadIntake',
      `/b/${tenant}/api/lead`,
      `/site/${site.siteKey}/api/lead`,
    ]
    const quiet = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      for (const controlAppEnv of controlEnvs) {
        for (const p of paths) {
          await controlApp.fetch(
            new Request(`https://app.example${p}`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body,
            }),
            controlAppEnv,
            ctx,
          )
          expect([p, await anyAddress(address)]).toEqual([p, 0])
        }
      }
    } finally {
      quiet.mockRestore()
    }
    expect(await eventCount(tenant)).toBe(0)
  })

  it('test_UAT_AC2516_served_pages_with_a_form_carry_the_sitekey_on_every_mount_and_the_script_once', async () => {
    const tenant = aTenant()
    const form = (id: string) =>
      contactForm({
        instanceId: id,
        config: { action: '/api/lead', fields: [{ name: 'email', label: 'E', type: 'email' }] },
        slots: { form: { kind: 'container', layout: 'stack', children: [] } },
      })
    const twoForms = `<!doctype html><html><body>${form('one')}${form('two')}</body></html>`
    const plain = '<!doctype html><html><body><p>No form here</p></body></html>'

    const get = async (siteKey: string, overrides: Partial<PublicEnv> = {}) => {
      const response = await publicSite.fetch(
        new Request(`${ORIGIN}/site/${siteKey}/`),
        workerEnv(overrides),
        ctx,
      )
      expect(response.status).toBe(200)
      return response.text()
    }

    const withForms = await seedFormSite({ tenantId: tenant, outHtml: twoForms })
    const html = await get(withForms.siteKey)
    const stampedMount =
      `class="contact-form__turnstile cf-turnstile" data-fc-invariant data-turnstile-target data-sitekey="${SITEKEY}"`
    expect(html.split(stampedMount)).toHaveLength(3)
    expect(html.split(TURNSTILE_SCRIPT_URL)).toHaveLength(2)
    expect(html.indexOf(TURNSTILE_SCRIPT_URL)).toBeLessThan(html.indexOf('</body>'))
    expect(html.indexOf(TURNSTILE_SCRIPT_URL)).toBeGreaterThan(html.lastIndexOf(stampedMount))

    const noForm = await seedFormSite({ tenantId: tenant, outHtml: plain })
    expect(await get(noForm.siteKey)).toBe(plain)

    // No sitekey configured: the form page is exactly the published bytes. A
    // fresh site, because the edge cache is keyed on the request URL.
    const unconfigured = await seedFormSite({ tenantId: tenant, outHtml: twoForms })
    expect(await get(unconfigured.siteKey, { TURNSTILE_SITEKEY: '' })).toBe(twoForms)
  })
})
