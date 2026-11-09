import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import { route } from '../apps/control-app/src/router'
import type { RouterEnv } from '../apps/control-app/src/router'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import { MAX_FIELDS, MAX_FIELD_BYTES } from '../apps/public-site/src/lead'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv as ControlEnv } from '../apps/control-app/src/lead'
import { eventsOf } from '../apps/control-app/src/events'
import { FORM_SUBMITTED } from '../apps/control-app/src/builder/contact-events.js'
import {
  FORM_INSTANCE_FIELD,
  HONEYPOT_FIELD,
  TURNSTILE_FIELD,
} from '../packages/framework/src/modules/contact-form/fields'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { SiteStoreEnv } from '../tools/generate/src/store/d1r2-store'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'
import { CONTACT_FORM_CONFIG, contactFormSeed } from './support/behavior-site'

/**
 * story-f2e5032c (BUNDLE-43, BUG-78) — **the builder's draft preview submits
 * for real.**
 *
 * Reconciliation UATs for the preview-endpoint ACs and the preview half of the
 * ACs BUG-78 generalised. Every preview case drives `control-app`'s own
 * `route()` inside workerd against a real D1 (deployed schema) and a real R2
 * bucket; the write is the real `captureLead`. Every published case drives
 * `public-site`'s real `fetch` with the real `captureLead` behind its binding.
 * The only doubles are the external boundaries: Cloudflare's siteverify (a
 * stubbed global `fetch` that records every call) and the rate limiter.
 */

const SECRET = 'recon-preview-secret'
const TOKEN = 'recon-preview-token'
const PREVIEW_ORIGIN = 'https://app.recon-preview.test'
const PUBLIC_ORIGIN = 'https://recon-preview-site.test'
const MAIL_FROM = '1st Contact <no-reply@recon-preview.test>'
const ACK = '{"ok":true}'

let verifications: string[]
let verifyOk: boolean
let limited: string[]

let seq = 0
const aTenant = (): string => `recon-prev-${Date.now().toString(36)}-${(seq += 1)}`

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  verifications = []
  verifyOk = true
  limited = []
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    verifications.push(url)
    if (!url.includes('siteverify')) throw new Error(`unexpected fetch: ${url}`)
    void init
    return new Response(JSON.stringify({ success: verifyOk }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const controlEnv = (): ControlEnv =>
  ({
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM,
  }) as ControlEnv

/** The control app's env: deliberately NO `TURNSTILE_SECRET` and NO `LEAD_RATE_LIMIT`. */
function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM,
    ASSETS: {
      fetch: async () => new Response('not found', { status: 404 }),
    } as unknown as Fetcher,
  } as unknown as RouterEnv
}

/** The published-site env, fully configured. */
function publicEnv(): PublicEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    APEX_SITE_KEY: undefined,
    SESSION_COOKIE_NAME: '',
    SESSION_COOKIE_DOMAIN: '',
    TURNSTILE_SITEKEY: '0xRECONPREVIEW',
    TURNSTILE_SECRET: SECRET,
    LEAD_RATE_LIMIT: {
      limit: async ({ key }: { key: string }) => {
        limited.push(key)
        return { success: true }
      },
    } as unknown as RateLimit,
    // No form here declares an asset, so no mail port is needed.
    LEAD_INTAKE: { captureLead: (spec) => captureLead(controlEnv(), spec) },
  } as unknown as PublicEnv
}

const ctx = { waitUntil: () => {} } as unknown as ExecutionContext

type Shape = 'json' | 'form'

function body(fields: Record<string, string>, shape: Shape): { type: string; body: string } {
  return shape === 'json'
    ? { type: 'application/json', body: JSON.stringify(fields) }
    : { type: 'application/x-www-form-urlencoded', body: new URLSearchParams(fields).toString() }
}

function previewRequest(
  slug: string,
  channel: string,
  fields: Record<string, string>,
  shape: Shape = 'json',
): Request {
  const b = body(fields, shape)
  return new Request(`${PREVIEW_ORIGIN}/preview/${slug}/${channel}/api/lead`, {
    method: 'POST',
    headers: { 'content-type': b.type },
    body: b.body,
  })
}

const sendPreview = (tenant: string, req: Request): Promise<Response> =>
  route(req, routerEnv(), { businessId: tenant } as Scope)

function publicRequest(
  siteKey: string,
  fields: Record<string, string>,
  init: { shape?: Shape; query?: string; headers?: Record<string, string> } = {},
): Request {
  const b = body(fields, init.shape ?? 'json')
  return new Request(`${PUBLIC_ORIGIN}/site/${siteKey}/api/lead${init.query ?? ''}`, {
    method: 'POST',
    headers: { 'content-type': b.type, 'cf-connecting-ip': '203.0.113.9', ...(init.headers ?? {}) },
    body: b.body,
  })
}

const sendPublic = (req: Request): Promise<Response> => publicSite.fetch(req, publicEnv(), ctx)

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

async function stageOf(contactId: string): Promise<string | undefined> {
  const row = await (env.DB as D1Database)
    .prepare('SELECT pipeline_stage AS s FROM users WHERE id = ?')
    .bind(contactId)
    .first<{ s: string }>()
  return row?.s
}

async function submissionsOf(tenantId: string, email: string) {
  const ids = await contactsFor(tenantId, email)
  expect([email, ids.length]).toEqual([email, 1])
  const events = await eventsOf(controlEnv(), { businessId: tenantId }, ids[0])
  return events.filter((e) => e.kind === FORM_SUBMITTED).map((e) => e.detail as Record<string, unknown>)
}

async function snapshot(response: Response) {
  return {
    status: response.status,
    headers: [...response.headers.entries()].sort(([a], [b]) => a.localeCompare(b)),
    body: await response.text(),
  }
}

/** Overwrite a site's draft with one `contact-form` instance carrying `config`. */
async function writeDraft(tenantId: string, slug: string, instanceId: string, config: Record<string, unknown>) {
  const store = await d1r2SiteStore(env as unknown as SiteStoreEnv).forTenant(tenantId)
  await store.write(slug, {
    siteJson: { name: slug, config: { businessName: 'Fixture' } },
    pages: [
      {
        name: 'home.json',
        page: {
          slug: 'home',
          title: 'Home',
          modules: [{ id: instanceId, type: 'contact-form', version: 4, config, slots: {} }],
        },
      },
    ],
    assets: [],
  })
}

describe('story-f2e5032c — the draft preview submits for real', () => {
  it('test_UAT_AC2560_a_draft_preview_submission_lands_one_lead_through_the_same_handler', async () => {
    const tenant = aTenant()
    // A draft-only site: nothing has ever been published.
    const draft = await seedFormSite({ tenantId: tenant, publish: false })
    // A published site in another tenant, for the published endpoint's answers.
    const pubTenant = aTenant()
    const pub = await seedFormSite({ tenantId: pubTenant })

    const fields = (email: string, extra: Record<string, string> = {}) => ({
      [FORM_INSTANCE_FIELD]: draft.instanceId,
      email,
      ...extra,
    })
    const pubFields = (email: string, extra: Record<string, string> = {}) => ({
      [FORM_INSTANCE_FIELD]: pub.instanceId,
      [TURNSTILE_FIELD]: TOKEN,
      email,
      ...extra,
    })

    // JSON and native form POST, both through the preview.
    const viaJson = await snapshot(
      await sendPreview(tenant, previewRequest(draft.slug, 'draft', fields('Preview@Example.com'))),
    )
    const viaForm = await snapshot(
      await sendPreview(tenant, previewRequest(draft.slug, 'draft', fields('preview@example.com'), 'form')),
    )
    const pubJson = await snapshot(await sendPublic(publicRequest(pub.siteKey, pubFields('p1@example.com'))))
    const pubForm = await snapshot(
      await sendPublic(publicRequest(pub.siteKey, pubFields('p2@example.com'), { shape: 'form' })),
    )

    // The same frozen acknowledgement and the same confirmation page, byte for
    // byte. (The control app stamps its own blanket `no-store, must-revalidate`
    // on every response it serves — `uncacheable()` in its router — so the cache
    // header is compared as "still forbids storing" rather than verbatim.)
    const essence = (s: Awaited<ReturnType<typeof snapshot>>) => ({
      status: s.status,
      type: s.headers.find(([k]) => k === 'content-type')?.[1],
      robots: s.headers.find(([k]) => k === 'x-robots-tag')?.[1],
      body: s.body,
    })
    const noStore = (s: Awaited<ReturnType<typeof snapshot>>) =>
      s.headers.find(([k]) => k === 'cache-control')?.[1] ?? ''
    expect(viaJson.status).toBe(200)
    expect(viaJson.body).toBe(ACK)
    expect(essence(viaJson)).toEqual(essence(pubJson))
    expect(noStore(viaJson)).toContain('no-store')
    expect(viaForm.status).toBe(200)
    expect(viaForm.body).toContain('Thank you')
    expect(essence(viaForm)).toEqual(essence(pubForm))
    expect(noStore(viaForm)).toContain('no-store')

    // Exactly one `lead` contact in the slug's tenant, idempotent on the address.
    const ids = await contactsFor(tenant, 'preview@example.com')
    expect(ids).toHaveLength(1)
    expect(await stageOf(ids[0])).toBe('lead')
    expect(await contactCount(tenant)).toBe(1)

    // An unknown slug is a 404 that writes nothing.
    const unknown = await sendPreview(
      tenant,
      previewRequest('no-such-slug-recon', 'draft', fields('ghost@example.com')),
    )
    expect(unknown.status).toBe(404)
    expect(await contactsFor(tenant, 'ghost@example.com')).toHaveLength(0)

    // The same limits and the same refusal statuses as the published endpoint.
    const long = 'z'.repeat(MAX_FIELD_BYTES + 1)
    const many: Record<string, string> = {}
    for (let i = 0; i <= MAX_FIELDS; i += 1) many[`f${i}`] = 'x'
    const cases: Array<[string, Record<string, string>, Record<string, string>]> = [
      ['over-long field', fields('long@example.com', { note: long }), pubFields('long@example.com', { note: long })],
      ['too many fields', fields('many@example.com', many), pubFields('many@example.com', many)],
    ]
    for (const [name, previewBody, publicBody] of cases) {
      const p = await sendPreview(tenant, previewRequest(draft.slug, 'draft', previewBody))
      const q = await sendPublic(publicRequest(pub.siteKey, publicBody))
      expect([name, p.status]).toEqual([name, q.status])
      expect([name, p.status]).toEqual([name, 400])
    }
    expect(await contactCount(tenant)).toBe(1)

    // Honeypot: acknowledged, nothing written.
    const trapped = await sendPreview(
      tenant,
      previewRequest(draft.slug, 'draft', fields('trap@example.com', { [HONEYPOT_FIELD]: 'x' })),
    )
    expect(await trapped.text()).toBe(ACK)
    expect(await contactsFor(tenant, 'trap@example.com')).toHaveLength(0)
  })

  it('test_UAT_AC2561_a_preview_submission_resolves_its_form_definition_from_the_draft', async () => {
    const tenant = aTenant()
    // Never published: the form exists only on the draft.
    const site = await seedFormSite({ tenantId: tenant, publish: false, submitLabel: 'Draft only label' })

    const response = await sendPreview(
      tenant,
      previewRequest(site.slug, 'draft', { [FORM_INSTANCE_FIELD]: site.instanceId, email: 'draftonly@example.com' }),
    )
    expect(response.status).toBe(200)
    const [detail] = await submissionsOf(tenant, 'draftonly@example.com')
    expect(detail.page).toBe('home.json')
    expect(detail.submitLabel).toBe('Draft only label')
    const ids = await contactsFor(tenant, 'draftonly@example.com')
    expect(await stageOf(ids[0])).toBe('lead')

    // The published endpoint resolves against the live revision, of which there
    // is none, so nothing is taken from the draft.
    await sendPublic(
      publicRequest(site.siteKey, {
        [FORM_INSTANCE_FIELD]: site.instanceId,
        [TURNSTILE_FIELD]: TOKEN,
        email: 'publiconly@example.com',
      }),
    )
    const [pubDetail] = await submissionsOf(tenant, 'publiconly@example.com')
    expect(pubDetail.page).not.toBe('home.json')
    expect(pubDetail.submitLabel).not.toBe('Draft only label')

    // A published site whose draft has since gained a different label: preview
    // reads the draft, the published endpoint still reads the live revision.
    const live = await seedFormSite({ tenantId: tenant, submitLabel: 'Live label' })
    await writeDraft(tenant, live.slug, live.instanceId, {
      action: '/api/lead',
      submitLabel: 'Edited draft label',
      fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
    })
    await sendPreview(
      tenant,
      previewRequest(live.slug, 'draft', { [FORM_INSTANCE_FIELD]: live.instanceId, email: 'edited@example.com' }),
    )
    await sendPublic(
      publicRequest(live.siteKey, {
        [FORM_INSTANCE_FIELD]: live.instanceId,
        [TURNSTILE_FIELD]: TOKEN,
        email: 'livepub@example.com',
      }),
    )
    expect((await submissionsOf(tenant, 'edited@example.com'))[0].submitLabel).toBe('Edited draft label')
    expect((await submissionsOf(tenant, 'livepub@example.com'))[0].submitLabel).toBe('Live label')
  })

  it('test_UAT_AC2562_every_captured_lead_records_its_channel_set_by_the_server', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant })

    await sendPreview(
      tenant,
      previewRequest(site.slug, 'draft', {
        [FORM_INSTANCE_FIELD]: site.instanceId,
        email: 'viapreview@example.com',
        channel: 'published',
      }),
    )
    await sendPublic(
      publicRequest(site.siteKey, {
        [FORM_INSTANCE_FIELD]: site.instanceId,
        [TURNSTILE_FIELD]: TOKEN,
        email: 'viapublic@example.com',
        channel: 'draft',
      }),
    )

    const [preview] = await submissionsOf(tenant, 'viapreview@example.com')
    const [published] = await submissionsOf(tenant, 'viapublic@example.com')
    expect(preview.channel).toBe('draft')
    expect(published.channel).toBe('published')
    // The claimed value is only an answer.
    expect(preview.fields).toMatchObject({ channel: 'published' })
    expect(published.fields).toMatchObject({ channel: 'draft' })

    // Both are ordinary `lead` contacts in the same tenant's list.
    for (const email of ['viapreview@example.com', 'viapublic@example.com']) {
      const ids = await contactsFor(tenant, email)
      expect(await stageOf(ids[0])).toBe('lead')
    }
    expect(await contactCount(tenant)).toBe(2)
  })

  it('test_UAT_AC2563_preview_skips_turnstile_and_rate_limit_and_no_request_can_obtain_the_bypass', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant, publish: false })

    // Beyond the published limit (20/60s), with no token, no secret and no limiter.
    const count = 22
    for (let i = 0; i < count; i += 1) {
      const response = await sendPreview(
        tenant,
        previewRequest(site.slug, 'draft', { [FORM_INSTANCE_FIELD]: site.instanceId, email: `burst${i}@example.com` }),
      )
      expect([i, response.status, await response.text()]).toEqual([i, 200, ACK])
    }
    expect(await contactCount(tenant)).toBe(count)
    expect(verifications).toEqual([])

    // The honeypot still applies.
    await sendPreview(
      tenant,
      previewRequest(site.slug, 'draft', {
        [FORM_INSTANCE_FIELD]: site.instanceId,
        email: 'previewtrap@example.com',
        [HONEYPOT_FIELD]: 'bot',
      }),
    )
    expect(await contactsFor(tenant, 'previewtrap@example.com')).toHaveLength(0)

    // The published endpoint: `identified` in body, query and header buys nothing.
    const pubTenant = aTenant()
    const pub = await seedFormSite({ tenantId: pubTenant })
    const claim = { query: '?identified=true', headers: { identified: 'true' } }

    const noToken = await sendPublic(
      publicRequest(pub.siteKey, { [FORM_INSTANCE_FIELD]: pub.instanceId, email: 'claim1@example.com', identified: 'true' }, claim),
    )
    expect(noToken.status).toBe(400)
    expect(limited).toHaveLength(1)
    expect(await contactsFor(pubTenant, 'claim1@example.com')).toHaveLength(0)

    verifyOk = false
    const failing = await sendPublic(
      publicRequest(
        pub.siteKey,
        { [FORM_INSTANCE_FIELD]: pub.instanceId, [TURNSTILE_FIELD]: TOKEN, email: 'claim2@example.com', identified: 'true' },
        claim,
      ),
    )
    expect(failing.status).toBe(403)
    expect(limited).toHaveLength(2)
    expect(await contactsFor(pubTenant, 'claim2@example.com')).toHaveLength(0)

    verifyOk = true
    const verified = await sendPublic(
      publicRequest(
        pub.siteKey,
        { [FORM_INSTANCE_FIELD]: pub.instanceId, [TURNSTILE_FIELD]: TOKEN, email: 'claim3@example.com', identified: 'true' },
        claim,
      ),
    )
    expect(verified.status).toBe(200)
    expect(limited).toHaveLength(3)
    expect(verifications.filter((u) => u.includes('siteverify'))).toHaveLength(2)
    const [detail] = await submissionsOf(pubTenant, 'claim3@example.com')
    expect(detail.fields).toMatchObject({ identified: 'true' })
  })

  it('test_UAT_AC2504_a_preview_body_naming_another_tenant_writes_nothing_there', async () => {
    const tenantA = aTenant()
    const tenantB = aTenant()
    const siteA = await seedFormSite({ tenantId: tenantA, publish: false })
    const siteB = await seedFormSite({ tenantId: tenantB, publish: false })
    const beforeB = await contactCount(tenantB)

    const response = await sendPreview(
      tenantA,
      previewRequest(siteA.slug, 'draft', {
        [FORM_INSTANCE_FIELD]: siteA.instanceId,
        email: 'previewsteer@example.com',
        siteKey: siteB.siteKey,
        business: tenantB,
      }),
    )
    expect(response.status).toBe(200)
    expect(await contactsFor(tenantB, 'previewsteer@example.com')).toHaveLength(0)
    expect(await contactCount(tenantB)).toBe(beforeB)
    const [detail] = await submissionsOf(tenantA, 'previewsteer@example.com')
    expect(detail.site).toBe(siteA.siteKey)
    expect(detail.fields).toMatchObject({ siteKey: siteB.siteKey, business: tenantB })
  })

  it('test_UAT_AC2505_a_preview_submission_records_the_draft_consent_wording', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({
      tenantId: tenant,
      fields: [
        { name: 'email', label: 'Your email', type: 'email', required: true },
        { name: 'list', label: 'Published consent wording', type: 'checkbox' },
      ],
    })
    await writeDraft(tenant, site.slug, site.instanceId, {
      action: '/api/lead',
      submitLabel: 'Send',
      fields: [
        { name: 'email', label: 'Your email', type: 'email', required: true },
        { name: 'list', label: 'Draft consent wording', type: 'checkbox' },
      ],
    })

    await sendPreview(
      tenant,
      previewRequest(site.slug, 'draft', {
        [FORM_INSTANCE_FIELD]: site.instanceId,
        email: 'consentdraft@example.com',
        list: 'yes',
        wording: 'forged wording',
      }),
    )
    await sendPublic(
      publicRequest(site.siteKey, {
        [FORM_INSTANCE_FIELD]: site.instanceId,
        [TURNSTILE_FIELD]: TOKEN,
        email: 'consentlive@example.com',
      }),
    )

    const [draft] = await submissionsOf(tenant, 'consentdraft@example.com')
    expect(draft.channel).toBe('draft')
    expect(draft.consent).toEqual([{ field: 'list', wording: 'Draft consent wording', answer: true }])
    const [live] = await submissionsOf(tenant, 'consentlive@example.com')
    expect(live.channel).toBe('published')
    expect(live.consent).toEqual([{ field: 'list', wording: 'Published consent wording', answer: false }])
  })

  it('test_UAT_AC2515_a_lead_post_to_any_preview_channel_other_than_draft_is_404', async () => {
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant })
    for (const channel of ['edit', 'published']) {
      const response = await sendPreview(
        tenant,
        previewRequest(site.slug, channel, { [FORM_INSTANCE_FIELD]: site.instanceId, email: `ch-${channel}@example.com` }),
      )
      expect([channel, response.status]).toEqual([channel, 404])
    }
    expect(await contactCount(tenant)).toBe(0)
  })

  it('test_UAT_AC2515_the_rendered_draft_preview_form_resolves_to_the_preview_lead_route_and_lands_a_lead', async () => {
    // END TO END: the form the operator actually sees in the draft preview, its
    // `action` resolved the way a browser resolves it against the page URL, and
    // a submission sent THERE. A form that resolved to the builder's own
    // `/api/lead` would fail here, though every route-level test would still pass.
    const tenant = aTenant()
    const site = await seedFormSite({ tenantId: tenant, publish: false })

    // The draft becomes a real L1 page with the form mounted at a declared seam,
    // its `action` the document-relative `api/lead` — the one value that resolves
    // to `/site/<key>/api/lead` published and `/preview/<slug>/draft/api/lead` here.
    const seed = contactFormSeed(site.slug)
    const home = seed.pages['home.json'] as { modules: Array<Record<string, unknown>> }
    home.modules = home.modules.map((m) => ({
      ...m,
      id: site.instanceId,
      config: { ...CONTACT_FORM_CONFIG, action: 'api/lead' },
    }))
    const store = await d1r2SiteStore(env as unknown as SiteStoreEnv).forTenant(tenant)
    await store.write(site.slug, {
      siteJson: seed.siteJson,
      pages: [{ name: 'home.json', page: home }],
      assets: [],
    })

    const pageUrl = `${PREVIEW_ORIGIN}/preview/${site.slug}/draft/`
    const page = await route(new Request(pageUrl), routerEnv(), { businessId: tenant } as Scope)
    expect(page.status).toBe(200)
    const html = await page.text()

    const formTag = /<form\b[^>]*>/.exec(html)?.[0]
    expect(formTag, 'the draft preview renders a form').toBeTruthy()
    expect(formTag).toMatch(/method="post"/)
    const action = /\saction="([^"]*)"/.exec(formTag!)?.[1]
    expect(action, 'the form carries an action').toBeTruthy()
    const resolved = new URL(action!.replace(/&amp;/g, '&'), pageUrl)
    expect(resolved.origin).toBe(PREVIEW_ORIGIN)
    expect(resolved.pathname).toBe(`/preview/${site.slug}/draft/api/lead`)

    // The instance id the form carries, read off the rendered hidden input.
    const instanceInput = new RegExp(`<input\\b[^>]*name="${FORM_INSTANCE_FIELD}"[^>]*>`).exec(html)?.[0]
    expect(instanceInput, 'the rendered form carries its instance id').toBeTruthy()
    expect(instanceInput).toContain(`value="${site.instanceId}"`)

    // A native submission to exactly where the form points lands one lead.
    const submitted = await route(
      new Request(resolved.href, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          [FORM_INSTANCE_FIELD]: site.instanceId,
          name: 'Preview Visitor',
          email: 'rendered-form@example.com',
          message: 'Sent from the rendered preview form',
        }).toString(),
      }),
      routerEnv(),
      { businessId: tenant } as Scope,
    )
    expect(submitted.status).toBe(200)
    expect(await contactsFor(tenant, 'rendered-form@example.com')).toHaveLength(1)

    // The edit channel renders the same instance with no action and no method,
    // so nothing there can submit.
    const edit = await route(
      new Request(`${PREVIEW_ORIGIN}/preview/${site.slug}/edit/`),
      routerEnv(),
      { businessId: tenant } as Scope,
    )
    expect(edit.status).toBe(200)
    const editForm = /<form\b[^>]*>/.exec(await edit.text())?.[0] ?? ''
    expect(editForm).not.toMatch(/\saction=/)
    expect(editForm).not.toMatch(/method="post"/)
  })
})
