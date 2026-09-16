/**
 * [[REQ-252]] UAT — **`POST /api/pages/subject`**, the seam between the field and
 * the store.
 *
 * WHY THIS SUITE EXISTS AND THE OTHER TWO ARE NOT ENOUGH. The jsdom suite proves
 * the control sends the right three values; the node suite proves that command
 * changes what the send reads. Neither of them crosses the wire, and the wire is
 * exactly where a thin transport goes wrong — a path nobody calls, a body shape
 * the handler reads differently from the client that writes it. Both are silent:
 * the field works in every test and does nothing in the product.
 *
 * So this runs inside workerd, through the Worker's own `fetch`, against the
 * real D1 the deployed Worker uses — and reads the result back through the store
 * rather than out of the response, because "the subject changed" is a claim
 * about what is stored and not about what was answered.
 *
 * Acceptance covered:
 *
 *   AC-2  the operator's change reaches the page, for the page they were on
 *   AC-3  clearing it stores the title instead, and says so in its answer
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { applySchema, ensureTenant, tenantStore } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

const TENANT = 'req252'

function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    // Loopback dev-open, as every other workerd suite here does it.
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

const call = (path: string, init?: RequestInit): Promise<Response> =>
  worker.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`, init), workerEnv())

const setSubject = (body: Record<string, unknown>): Promise<Response> =>
  call('/api/pages/subject', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

/**
 * A site holding one served page and one message.
 *
 * SEEDED ONCE, because a business in v1 holds exactly one site and a second
 * import is refused — which is the product rule, not a fixture limitation. The
 * three cases below are independent writes to one message, so a shared site is
 * honest here rather than merely convenient.
 */
async function siteWithMessage(): Promise<string> {
  const slug = nextSlug()
  const seed = siteSeed({ slug })
  const res = await call('/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      slug,
      siteJson: seed.siteJson,
      pages: [
        ...Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
        {
          name: 'papers.json',
          page: {
            id: 'papers',
            slug: 'papers',
            title: 'Your two XGD papers',
            kind: 'email',
            email: { subject: 'Your two XGD papers' },
            modules: [],
            l1: {
              widths: [600],
              root: {
                kind: 'container',
                layout: 'stack',
                children: [{ kind: 'text', text: 'Here they are.' }],
              },
            },
          },
        },
      ],
      assets: [],
    }),
  })
  expect(res.status, 'seeding the message through /api/import').toBe(200)
  return ((await res.json()) as { site: string }).site
}

/** The message as the store now holds it. */
async function storedSubject(site: string): Promise<string> {
  const pages = await tenantStore(TENANT).then((s) => s.readPages(site))
  const papers = pages.find((p) => String(p.page.id) === 'papers')
  expect(papers, 'the message in the store').toBeDefined()
  return String((papers!.page.email as { subject?: unknown } | undefined)?.subject ?? '')
}

let site: string

beforeAll(async () => {
  await applySchema()
  await ensureTenant(TENANT)
  site = await siteWithMessage()
})

describe('REQ-252 — POST /api/pages/subject', () => {
  it('test_UAT_FC_REQ-252_the_route_writes_the_subject_the_field_sent', async () => {
    const res = await setSubject({ site, page: 'papers', subject: 'The papers you asked for' })
    expect(res.status).toBe(200)

    // AC-2 — read back through the store, because that is where the send will
    // read it from.
    expect(await storedSubject(site)).toBe('The papers you asked for')
  })

  it('test_UAT_FC_REQ-252_the_route_answers_a_cleared_subject_with_the_title', async () => {
    const res = await setSubject({ site, page: 'papers', subject: '' })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { page: { email: { subject: string } } }

    // AC-3 — the answer carries what was STORED, not what was sent, which is
    // what the field redraws itself from.
    expect(body.page.email.subject).toBe('Your two XGD papers')
    expect(await storedSubject(site)).toBe('Your two XGD papers')
  })

  it('test_UAT_FC_REQ-252_the_route_refuses_a_subject_on_a_page_that_is_not_a_message', async () => {
    // A served page has no subject and never will. The command already says so;
    // this is the route carrying that refusal out as the 400 it is rather than
    // reporting "the builder broke" for a request the operator could correct.
    const res = await setSubject({ site, page: 'home', subject: 'Nope' })
    expect(res.status).toBe(400)
    expect(JSON.stringify(await res.json())).toContain('not an email page')
  })
})
