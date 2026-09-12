import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/public-site/src/index'
import type { Env } from '../apps/public-site/src/index'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv as ControlEnv } from '../apps/control-app/src/lead'
import {
  FORM_INSTANCE_FIELD,
  TURNSTILE_FIELD,
} from '../packages/framework/src/modules/contact-form/fields'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[BUG-87]] — **a submission that writes nothing says so in the log.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives `worker.fetch` — `public-site`'s
 * real handler with its real route grammar — inside workerd, against a real D1
 * database and a real R2 bucket, with the REAL `captureLead` behind the service
 * binding. The lines asserted here are lines the deployed Worker would emit, not
 * lines a stand-in was told to emit. The only doubles are the two things a test
 * must never reach for itself: Cloudflare's siteverify endpoint and the rate
 * limiter. The fixtures are REQ-223's, reused rather than re-founded.
 *
 * THE STATE THIS FILLS. `captureLead` returns every outcome as data, and two of
 * them write nothing — a site key naming no row in `sites`, and a submission
 * carrying no address. A third writes the contact but not the download the form
 * promised. `public-site` awaited the call and discarded all three. The visitor
 * was told it worked, which is correct and stays; the running system said
 * nothing at all, which is the bug. `LeadRefusal` has carried the comment
 * "reaches a log; never a visitor" since it was written, and it reached no log.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a refusal that leaves no line* — the original bug, in any of its three
 *     shapes;
 *   - *a line per ordinary submission* — `not_offered` is set on every form
 *     that never promised an asset, and logging it would bury the skips that
 *     mean something under the ones that do not;
 *   - *a visitor's typed value in the log* — the diagnostic needs the field
 *     NAMES and turning it into a store of what strangers typed is a different,
 *     worse thing than the silence it replaced;
 *   - *a response that moved* — the acknowledgement is frozen, and a log that
 *     bought its legibility by making the endpoint an oracle would be a
 *     regression against the reason REQ-223 froze it.
 */

const TENANT = 'bug87-tenant'
const SECRET = 'turnstile-secret'
const SITEKEY = '0xBUG87SITEKEY'
const TOKEN = 'a-valid-token'
const ORIGIN = 'https://bug87.test'

/** Every structured line `console.warn` was given, already parsed. */
let warnings: Array<Record<string, unknown>>

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  warnings = []
  // THE LOG IS THE ARTIFACT UNDER TEST, so it is captured rather than stubbed:
  // the real `console.warn` still runs and a line that is not the house's
  // `JSON.stringify({ event, … })` shape is kept out of `warnings` rather than
  // silently counted, which is what lets "no line" be asserted honestly.
  vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    for (const arg of args) {
      if (typeof arg !== 'string') continue
      try {
        const parsed = JSON.parse(arg)
        if (parsed && typeof parsed === 'object' && 'event' in parsed) warnings.push(parsed)
      } catch {
        /* prose, not a structured line — not this file's business */
      }
    }
  })
  vi.stubGlobal('fetch', async (input: RequestInfo, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as Request).url
    if (!url.includes('siteverify')) throw new Error(`unexpected fetch: ${url}`)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/** The whole Worker environment, with the lead endpoint fully configured. */
function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    SESSION_COOKIE_NAME: '',
    SESSION_COOKIE_DOMAIN: '',
    TURNSTILE_SITEKEY: SITEKEY,
    TURNSTILE_SECRET: SECRET,
    LEAD_RATE_LIMIT: { limit: async () => ({ success: true }) } as unknown as RateLimit,
    LEAD_INTAKE: {
      captureLead: (spec) =>
        captureLead(
          {
            DB: env.DB as D1Database,
            SITES: env.SITES as R2Bucket,
            BLOBS: env.BLOBS as R2Bucket,
            MAIL_FROM: '1st Contact <no-reply@bug87.test>',
          } as ControlEnv,
          spec,
        ),
    },
  } as Env
}

/** A JSON submission, as `client.js` sends one. */
function post(path: string, fields: Record<string, string>): Request {
  return new Request(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(fields),
  })
}

function submission(instanceId: string, extra: Record<string, string> = {}) {
  return { [FORM_INSTANCE_FIELD]: instanceId, [TURNSTILE_FIELD]: TOKEN, ...extra }
}

async function send(path: string, fields: Record<string, string>): Promise<Response> {
  return worker.fetch(post(path, fields), workerEnv(), {} as ExecutionContext)
}

/** How many contacts this business holds. */
async function contactCount(tenantId: string): Promise<number> {
  const row = await (env.DB as D1Database)
    .prepare('SELECT COUNT(*) AS n FROM users WHERE tenant_id = ?')
    .bind(tenantId)
    .first<{ n: number }>()
  return row?.n ?? 0
}

/** The lines this run produced for one event name. */
function linesFor(event: string): Array<Record<string, unknown>> {
  return warnings.filter((line) => line.event === event)
}

describe('BUG-87 — a lead outcome that writes nothing reaches the log', () => {
  it('test_UAT_FC_BUG-87_an_unknown_site_key_is_logged_not_swallowed', async () => {
    // A well-formed submission naming a site key that is in no `sites` row —
    // a renamed, deleted or mistyped site, which `captureLead` refuses with
    // `unknown_site` and which wrote nothing and said nothing.
    const stranger = '0'.repeat(32)
    const before = await contactCount(TENANT)

    const response = await send(
      `/site/${stranger}/api/lead`,
      submission('some-form', { email: 'nobody@example.com' }),
    )

    // The acknowledgement does not move: the visitor is told one frozen thing
    // because a response that varied by outcome would say which site keys exist.
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"ok":true}')
    expect(await contactCount(TENANT)).toBe(before)

    // ...and the operator can now find out, from the Worker's own output.
    const lines = linesFor('lead_not_captured')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      event: 'lead_not_captured',
      reason: 'unknown_site',
      site: stranger,
      form: 'some-form',
    })
  })

  it('test_UAT_FC_BUG-87_a_submission_with_no_address_logs_its_field_names_only', async () => {
    // A form whose address field was authored WITHOUT `type: 'email'` and whose
    // value is not email-shaped either — the shape that makes a live form take
    // submissions forever and record none of them.
    const site = await seedFormSite({
      tenantId: TENANT,
      fields: [
        { name: 'your_email', label: 'Your email', type: 'text' },
        { name: 'building', label: 'What are you building?', type: 'textarea' },
      ],
    })
    const before = await contactCount(TENANT)

    const response = await send(
      `/site/${site.siteKey}/api/lead`,
      submission(site.instanceId, {
        your_email: 'not-an-address',
        building: 'a small catering site',
      }),
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"ok":true}')
    expect(await contactCount(TENANT)).toBe(before)

    const lines = linesFor('lead_not_captured')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      reason: 'no_email',
      site: site.siteKey,
      form: site.instanceId,
      // WHICH FIELDS THE FORM ACTUALLY SENT — the question an operator staring
      // at a form that captures nothing needs answered.
      submittedFields: ['building', 'your_email'],
    })

    // AND NOT WHAT ANYBODY TYPED INTO THEM. The values are absent from the whole
    // line, not merely from the field the assertion above names.
    const serialised = JSON.stringify(lines[0])
    expect(serialised).not.toContain('not-an-address')
    expect(serialised).not.toContain('a small catering site')
  })

  it('test_UAT_FC_BUG-87_a_promised_asset_that_does_not_go_is_logged', async () => {
    // A form that PROMISES a download. The first submission sends it; the second
    // from the same address is refused by the at-most-once rule, so the visitor
    // is told it worked and no second copy goes.
    const site = await seedFormSite({
      tenantId: TENANT,
      asset: { key: 'paper', name: 'The paper', url: 'https://bug87.test/paper.pdf' },
    })
    const path = `/site/${site.siteKey}/api/lead`
    const fields = submission(site.instanceId, { email: 'asset@example.com' })

    const first = await send(path, fields)
    expect(first.status).toBe(200)
    // The first submission delivers, so it is not the subject of a skip line.
    expect(linesFor('lead_asset_not_sent')).toHaveLength(0)

    warnings = []
    const second = await send(path, fields)

    expect(second.status).toBe(200)
    expect(await second.text()).toBe('{"ok":true}')

    const lines = linesFor('lead_asset_not_sent')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      event: 'lead_asset_not_sent',
      reason: 'already_sent',
      site: site.siteKey,
      form: site.instanceId,
      business: TENANT,
    })
    // Named by id, so the line opens the person's pane without repeating the
    // address into a second place.
    expect(typeof lines[0].contact).toBe('string')
    expect(String(lines[0].contact)).not.toContain('@')
  })

  it('test_UAT_FC_BUG-87_an_ordinary_accepted_submission_is_quiet', async () => {
    // The common case: a form that promises no asset, submitted correctly. It
    // carries `assetSkipped: 'not_offered'`, which is not news — and quiet is
    // what makes the three lines above worth reading.
    const site = await seedFormSite({ tenantId: TENANT })

    const response = await send(
      `/site/${site.siteKey}/api/lead`,
      submission(site.instanceId, { email: 'quiet@example.com' }),
    )

    expect(response.status).toBe(200)
    expect(linesFor('lead_not_captured')).toHaveLength(0)
    expect(linesFor('lead_asset_not_sent')).toHaveLength(0)
  })
})
