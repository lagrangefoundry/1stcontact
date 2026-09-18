import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/public-site/src/index'
import type { Env } from '../apps/public-site/src/index'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv as ControlEnv } from '../apps/control-app/src/lead'
import { capturingMailer } from '../apps/control-app/src/mail'
import { contactChangeHead, contactsChangedSince, peopleOf, personDetail } from '../apps/control-app/src/people'
import { CONTACT_CHANGE_START } from '../apps/control-app/src/people'
import { contactsWith } from '../apps/control-app/src/acceptances'
import { collectRun, ImplausibleHarvestError, sweepSynthetic } from '../apps/control-app/src/gutter'
import { signMark, MARK_WINDOW_MS } from '../packages/framework/src/gutter/marker'
import {
  FORM_INSTANCE_FIELD,
  MARK_FIELD,
  TURNSTILE_FIELD,
} from '../packages/framework/src/modules/contact-form/fields'
import { newId } from '../tools/generate/src/store/ids'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[REQ-268]] — **the test gutter**: manufactured traffic travels the product's
 * real code paths, lands marked, shows up nowhere a business can see, and can be
 * taken back.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives `worker.fetch` — `public-site`'s
 * real handler, its real route grammar — inside workerd, against a real D1
 * carrying the deployed schema, with the REAL `captureLead` behind the service
 * binding. The marker's verification is an EDGE behaviour and can only be proved
 * there: calling `captureLead` with `runId` already set would prove nothing at
 * all about forgery, because it would be asserting the thing a forger is trying
 * to assert. The only doubles are the two things a test must never reach for
 * itself — Cloudflare's siteverify endpoint and the rate limiter — plus the
 * mailer, which is `capturingMailer`, the adapter a deployment with no credential
 * already gets.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a marked submission that short-circuits* — a probe that skipped the
 *     honeypot, the rate limiter or Turnstile would be testing a path the product
 *     does not have ([[REQ-268]] §2);
 *   - *a record produced by marked traffic that reads as real* — the worst
 *     failure available here, because nothing downstream can ever find it again
 *     ([[DOC-54]] §2.9);
 *   - *a marked record appearing in any customer read* — the list, the contact,
 *     the change feed, the axes, or the query that eventually sends a newsletter;
 *   - *test status asserted without the secret* — a caller who could do that
 *     could hide a competitor's leads from their own dashboard;
 *   - *a submission DISCARDED because its marker did not verify* — a signing
 *     fault becoming lost customer data, which is the direction this must never
 *     fail in;
 *   - *a marked record the collector cannot reach*, by run or by sweep.
 */

const TENANT = 'req268-tenant'
const SECRET = 'turnstile-secret'
const SITEKEY = '0xREQ268SITEKEY'
const TOKEN = 'a-valid-token'
const ORIGIN = 'https://req268.test'

/** The platform secret the gutter marker is signed with. */
const GUTTER_SECRET = 'gutter-platform-secret'

/** An asset, so a marked submission also mints a grant to derive a mark onto. */
const ASSET = { key: 'whitepapers', name: 'both whitepapers', url: 'https://example.test/papers' }

/** The scope a customer surface reads under — no run named, so marked rows are excluded. */
const CUSTOMER = { businessId: TENANT }

/** What the next siteverify call answers, and every key the limiter was asked about. */
let allowRate: boolean
let limited: string[]

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  allowRate = true
  limited = []
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
})

/** Every message the capture path handed to the mailer, across one test. */
let mailer = capturingMailer()

function controlEnv(): ControlEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@req268.test>',
  } as ControlEnv
}

/** The whole Worker environment, with the lead endpoint and the gutter configured. */
function workerEnv(options: { gutterSecret?: string } = {}): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    SESSION_COOKIE_NAME: '',
    SESSION_COOKIE_DOMAIN: '',
    TURNSTILE_SITEKEY: SITEKEY,
    TURNSTILE_SECRET: SECRET,
    GUTTER_SECRET: 'gutterSecret' in options ? options.gutterSecret : GUTTER_SECRET,
    LEAD_RATE_LIMIT: {
      limit: async ({ key }: { key: string }) => {
        limited.push(key)
        return { success: allowRate }
      },
    } as unknown as RateLimit,
    // THE REAL WRITE, over the shape the service binding exposes.
    LEAD_INTAKE: {
      captureLead: (spec) => captureLead(controlEnv(), spec, { send: mailer.send }),
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

/** Submit to a seeded site, optionally carrying a mark. */
async function submit(
  siteKey: string,
  formHandle: string,
  email: string,
  extra: Record<string, string> = {},
  workerOptions: { gutterSecret?: string } = {},
): Promise<Response> {
  return worker.fetch(
    post(`/site/${siteKey}/api/lead`, {
      [FORM_INSTANCE_FIELD]: formHandle,
      [TURNSTILE_FIELD]: TOKEN,
      email,
      ...extra,
    }),
    workerEnv(workerOptions),
    {} as ExecutionContext,
  )
}

/** The gutter columns of the one contact holding `email`, read raw. */
async function contactRow(email: string) {
  return (env.DB as D1Database)
    .prepare(
      'SELECT u.id AS id, u.synthetic AS synthetic, u.run_id AS run_id, ' +
        'u.account_id AS account_id, u.created_at AS created_at ' +
        'FROM users u JOIN user_emails e ON e.user_id = u.id ' +
        'WHERE u.tenant_id = ? AND e.email = ?',
    )
    .bind(TENANT, email)
    .first<{
      id: string
      synthetic: number
      run_id: string | null
      account_id: string
      created_at: string
    }>()
}

/** Every row of one child table for one contact, with its gutter columns. */
async function childRows(table: string, contactId: string) {
  const { results } = await (env.DB as D1Database)
    .prepare(`SELECT synthetic, run_id FROM ${table} WHERE contact_id = ?`)
    .bind(contactId)
    .all<{ synthetic: number; run_id: string | null }>()
  return results ?? []
}

/**
 * How many rows one child table holds for one contact.
 *
 * THE COLUMN IS NAMED BECAUSE THE TABLES DISAGREE ABOUT IT. The three the gutter
 * marks say `contact_id`; `user_emails` and `user_names` predate that vocabulary
 * and say `user_id`. Both cascade from the same row, which is the fact under
 * test.
 */
async function rowCount(table: string, column: string, contactId: string): Promise<number> {
  const row = await (env.DB as D1Database)
    .prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`)
    .bind(contactId)
    .first<{ n: number }>()
  return row?.n ?? 0
}

/** A site whose form gates a download and names an acceptance, so all four tables are written. */
async function seedSite() {
  return seedFormSite({
    tenantId: TENANT,
    assets: [ASSET],
    fields: [
      { name: 'email', label: 'Your email', type: 'email', required: true },
      { name: 'list', label: 'Email me occasionally', type: 'checkbox', acceptance: 'newsletter' },
    ],
  })
}

describe('REQ-268 — the test gutter', () => {
  beforeEach(() => {
    mailer = capturingMailer()
  })

  it('test_UAT_FC_REQ-268_a_marked_submission_runs_the_full_path_lands_marked_and_is_invisible', async () => {
    const site = await seedSite()
    const runId = newId('run')
    const mark = await signMark(GUTTER_SECRET, runId, Date.now())

    // A REAL SUBMISSION FIRST, as the control. Every exclusion asserted below is
    // worth nothing unless something IS visible, and a list that is empty for the
    // wrong reason would pass every one of them.
    const real = await submit(site.siteKey, site.formHandle, 'real@example.com', { list: 'yes' })
    expect(real.status).toBe(200)

    const response = await submit(site.siteKey, site.formHandle, 'probe@example.com', {
      list: 'yes',
      [MARK_FIELD]: mark,
    })

    // §1 — THE ONE FROZEN ACKNOWLEDGEMENT, unchanged by the mark. A response that
    // differed for marked traffic would be a probe for whether the secret is
    // configured, offered to anybody with a form.
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"ok":true}')

    // §2 — THE FULL REAL PATH RAN. The rate limiter was asked about the marked
    // submission exactly as it was about the real one, and Turnstile was verified
    // — nothing branched on the mark before the write.
    expect(limited).toHaveLength(2)

    // §2 — THE CONTACT IS MARKED, and carries the run that produced it.
    const probe = await contactRow('probe@example.com')
    expect(probe?.synthetic).toBe(1)
    expect(probe?.run_id).toBe(runId)

    // §2 — AND THE REAL ONE IS NOT. `NOT NULL DEFAULT 0` is the safe direction,
    // asserted rather than assumed.
    const ordinary = await contactRow('real@example.com')
    expect(ordinary?.synthetic).toBe(0)
    expect(ordinary?.run_id).toBeNull()

    // §2 — THE CHILDREN ARE MARKED WITHOUT ANY CALLER HAVING PASSED A FLAG. The
    // event, the acceptance and the grant are each written by a different module
    // and none of them takes a `synthetic` argument: every one derives its mark
    // from the contact, in the same `SELECT` that already derives the business.
    for (const table of ['contact_events', 'user_acceptances', 'asset_grants']) {
      const rows = await childRows(table, probe?.id as string)
      expect(rows.length).toBeGreaterThan(0)
      for (const row of rows) {
        expect(row.synthetic).toBe(1)
        expect(row.run_id).toBe(runId)
      }
    }

    // §1 — THE MARKER ITSELF IS NOT STORED. It is a reserved field, stripped with
    // the honeypot and the Turnstile response before anything is recorded — a
    // replayable token in a contact's provenance would be a machine artefact
    // beside the words a person typed.
    const detail = await (env.DB as D1Database)
      .prepare("SELECT detail FROM contact_events WHERE contact_id = ? AND kind = 'form.submitted'")
      .bind(probe?.id as string)
      .first<{ detail: string }>()
    expect(detail?.detail).not.toContain(mark)
    expect(detail?.detail).not.toContain(MARK_FIELD)

    // §3 — THE CONTACT LIST DOES NOT SHOW IT, and the axes are drawn from exactly
    // this array (`builder/people-axes.js` renders `peopleOf`'s output), so this
    // is the assertion that covers them.
    const listed = await peopleOf(controlEnv(), CUSTOMER)
    expect(listed.map((p) => p.email)).toContain('real@example.com')
    expect(listed.map((p) => p.email)).not.toContain('probe@example.com')
    expect(listed.map((p) => p.id)).not.toContain(probe?.id)

    // §3 — NOR DOES THE INDIVIDUAL CONTACT READ, even holding the id. Not found
    // and not-in-this-business are already one answer here; marked is a third
    // input to the same answer.
    expect(await personDetail(controlEnv(), CUSTOMER, probe?.id as string)).toBeNull()
    expect(await personDetail(controlEnv(), CUSTOMER, ordinary?.id as string)).not.toBeNull()

    // §3 — NOR DOES THE CHANGE FEED, which is the surface an operator watches
    // live while a probe is running.
    const changed = await contactsChangedSince(controlEnv(), CUSTOMER, CONTACT_CHANGE_START)
    expect(changed.map((c) => c.person.id)).toContain(ordinary?.id)
    expect(changed.map((c) => c.person.id)).not.toContain(probe?.id)

    // §3 — NOR DOES THE QUERY THAT EVENTUALLY SENDS A NEWSLETTER. Both submissions
    // ticked the same named box, so this is the sharpest exclusion in the set: a
    // marked contact here is manufactured traffic receiving a customer's mail.
    const subscribers = await contactsWith(controlEnv(), CUSTOMER, 'newsletter')
    expect(subscribers).toContain(ordinary?.id)
    expect(subscribers).not.toContain(probe?.id)

    // §2 — A SECOND SUBMISSION IN THE SAME RUN IS THE SAME CONTACT, and a
    // submission from a REAL visitor at that same address is a different person
    // entirely. This is what the run-scoped find-or-create lookup buys: a probe
    // that resubmits does not duplicate itself, and — the half that matters — a
    // marked submission can never resolve the customer's own contact and hang its
    // events on them.
    await submit(site.siteKey, site.formHandle, 'probe@example.com', {
      list: 'yes',
      [MARK_FIELD]: await signMark(GUTTER_SECRET, runId, Date.now()),
    })
    const again = await peopleOf(controlEnv(), { businessId: TENANT, runId })
    expect(again.map((p) => p.id)).toEqual([probe?.id])

    // §2 — AND A MARKED SUBMISSION AT AN ADDRESS A REAL CONTACT ALREADY HOLDS
    // TOUCHES NOTHING OF THEIRS. The run-scoped lookup cannot see them, so the
    // capture refuses on the address index the contacts table already carries
    // rather than hanging a probe's event on a customer's own person. Loud is
    // the correct direction: the alternative is silent, and it is the one
    // failure [[DOC-54]] §2.9 says nothing downstream can ever find again.
    //
    // WHICH IS WHY MANUFACTURED TRAFFIC ADDRESSES ITSELF IN THE RESERVED
    // NAMESPACE — `reservedAddressFor(runId, domain)`, which is unique per run by
    // construction and can therefore never collide with a customer's own person.
    const held = await contactRow('real@example.com')
    const eventsBefore = await rowCount('contact_events', 'contact_id', held?.id as string)
    const refused = await submit(site.siteKey, site.formHandle, 'real@example.com', {
      [MARK_FIELD]: await signMark(GUTTER_SECRET, runId, Date.now()),
    })
    expect(refused.status).toBe(503)
    const realAfter = await contactRow('real@example.com')
    expect(realAfter?.id).toBe(held?.id)
    expect(realAfter?.synthetic).toBe(0)
    expect(realAfter?.run_id).toBeNull()
    expect(await rowCount('contact_events', 'contact_id', held?.id as string)).toBe(eventsBefore)

    // §3 — AND NAMING THE RUN IS HOW THEY ARE SEEN. Absence means exclude; seeing
    // marked records requires asking for them by name, which is what this is.
    const inRun = await peopleOf(controlEnv(), { businessId: TENANT, runId })
    expect(inRun.map((p) => p.id)).toEqual([probe?.id])
  })

  it('test_UAT_FC_REQ-268_a_forged_or_expired_marker_is_refused_and_the_submission_is_kept', async () => {
    const site = await seedSite()
    const now = Date.now()

    // A SIGNATURE MINTED UNDER ANOTHER SECRET. This is the attack worth closing:
    // a caller who could assert test status could make a competitor's leads
    // vanish from their own dashboard, silently, because a hidden lead looks
    // exactly like a lead nobody sent.
    const forged = await signMark('not-the-platform-secret', newId('run'), now)
    expect(
      (await submit(site.siteKey, site.formHandle, 'forged@example.com', { [MARK_FIELD]: forged }))
        .status,
    ).toBe(200)

    // A GENUINE SIGNATURE, OUTSIDE ITS WINDOW. Time-bounded means a mark that
    // leaked cannot be replayed a day later against the business it was minted
    // for.
    const stale = await signMark(GUTTER_SECRET, newId('run'), now - MARK_WINDOW_MS - 1000)
    expect(
      (await submit(site.siteKey, site.formHandle, 'stale@example.com', { [MARK_FIELD]: stale }))
        .status,
    ).toBe(200)

    // A TOKEN THAT IS NOT ONE AT ALL, which is what a caller who has read the
    // field name and nothing else can compose.
    expect(
      (
        await submit(site.siteKey, site.formHandle, 'garbage@example.com', {
          [MARK_FIELD]: 'g1.run_deadbeef.0.notasignature',
        })
      ).status,
    ).toBe(200)

    // A VALID MARK AGAINST A DEPLOYMENT HOLDING NO SECRET. Absent configuration
    // cannot mark anything, which is the opposite of `TURNSTILE_SECRET`'s
    // fail-closed rule and deliberately so: the only direction in which a
    // configuration mistake cannot lose a visitor's message.
    const honest = await signMark(GUTTER_SECRET, newId('run'), now)
    expect(
      (
        await submit(
          site.siteKey,
          site.formHandle,
          'unconfigured@example.com',
          { [MARK_FIELD]: honest },
          { gutterSecret: undefined },
        )
      ).status,
    ).toBe(200)

    // ALL FOUR WROTE A **REAL** RECORD. Both halves matter: the record exists, so
    // a signing fault did not become lost customer data; and it is unmarked, so
    // test status was not asserted without the secret.
    for (const address of [
      'forged@example.com',
      'stale@example.com',
      'garbage@example.com',
      'unconfigured@example.com',
    ]) {
      const row = await contactRow(address)
      expect(row, address).not.toBeNull()
      expect(row?.synthetic, address).toBe(0)
      expect(row?.run_id, address).toBeNull()
    }

    // AND THEY ARE ALL VISIBLE, which is what "written real" means on the surface
    // the business actually reads.
    const listed = (await peopleOf(controlEnv(), CUSTOMER)).map((p) => p.email)
    expect(listed).toContain('forged@example.com')
    expect(listed).toContain('stale@example.com')
    expect(listed).toContain('garbage@example.com')
    expect(listed).toContain('unconfigured@example.com')
  })

  it('test_UAT_FC_REQ-268_collection_removes_marked_records_and_leaves_real_ones', async () => {
    const site = await seedSite()
    const runId = newId('run')
    const otherRun = newId('run')
    const mark = await signMark(GUTTER_SECRET, runId, Date.now())
    const otherMark = await signMark(GUTTER_SECRET, otherRun, Date.now())

    await submit(site.siteKey, site.formHandle, 'keep@example.com', { list: 'yes' })
    await submit(site.siteKey, site.formHandle, 'collect@example.com', {
      list: 'yes',
      [MARK_FIELD]: mark,
    })
    await submit(site.siteKey, site.formHandle, 'other-run@example.com', {
      list: 'yes',
      [MARK_FIELD]: otherMark,
    })

    const kept = await contactRow('keep@example.com')
    const doomed = await contactRow('collect@example.com')
    const survivor = await contactRow('other-run@example.com')

    // §4 — COLLECTION BY RUN takes the contact and, by the cascade the schema
    // already declares, everything filed under them. The account goes too: the
    // foreign key points the other way, so the cascade cannot reach it and a
    // parentless account would accumulate where nothing would ever notice.
    const harvest = await collectRun(controlEnv(), runId)
    expect(harvest.contacts).toBe(1)
    expect(harvest.accounts).toBe(1)

    expect(await contactRow('collect@example.com')).toBeNull()
    // THE CASCADE IS ASSERTED ON EVERY TABLE THAT HANGS OFF A CONTACT, including
    // the two that carry no gutter columns of their own. `user_emails` is where a
    // "we deleted them but kept the history" mistake would hide in the most
    // damaging form — an address left behind resolves the person it was meant to
    // stop resolving.
    for (const [table, column] of [
      ['contact_events', 'contact_id'],
      ['user_acceptances', 'contact_id'],
      ['asset_grants', 'contact_id'],
      ['user_emails', 'user_id'],
      ['user_names', 'user_id'],
    ]) {
      expect(await rowCount(table, column, doomed?.id as string), table).toBe(0)
    }
    const account = await (env.DB as D1Database)
      .prepare('SELECT id FROM accounts WHERE id = ?')
      .bind(doomed?.account_id as string)
      .first<{ id: string }>()
    expect(account).toBeNull()

    // §4 — REAL RECORDS ARE UNTOUCHED, and so is the other run: a run is named,
    // and naming one does not collect the rest.
    expect(await contactRow('keep@example.com')).not.toBeNull()
    expect(await rowCount('contact_events', 'contact_id', kept?.id as string)).toBeGreaterThan(0)
    expect(await contactRow('other-run@example.com')).not.toBeNull()

    // §4 — THE SWEEP IS KEYED ON THE ROW ALONE and never on a registry of known
    // runs, which is exactly what lets it collect a run nobody remembers. The
    // surviving marked contact is aged past the horizon and swept without its run
    // id ever being mentioned.
    const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    await (env.DB as D1Database)
      .prepare('UPDATE users SET created_at = ? WHERE id IN (?, ?)')
      .bind(old, survivor?.id as string, kept?.id as string)
      .run()

    // AND IT REFUSES AN IMPLAUSIBLE HARVEST RATHER THAN PERFORMING IT. Asserted
    // BEFORE the sweep that succeeds, so the refusal is proved against a database
    // that really does hold something to take.
    await expect(sweepSynthetic(controlEnv(), { max: 0 })).rejects.toBeInstanceOf(
      ImplausibleHarvestError,
    )
    expect(await contactRow('other-run@example.com')).not.toBeNull()

    const swept = await sweepSynthetic(controlEnv())
    expect(swept.contacts).toBe(1)
    expect(await contactRow('other-run@example.com')).toBeNull()

    // THE REAL CONTACT IS OLDER THAN THE HORIZON TOO AND IS NOT TAKEN. That is
    // the assertion that makes the sweep a collector rather than an incident.
    expect(await contactRow('keep@example.com')).not.toBeNull()

    // §4 — AND A SWEPT-CLEAN STATE YIELDS A HARVEST OF ZERO. This is the state
    // the sweep is in every ordinary day, and a non-zero count is a bug report
    // saying a run leaked rather than routine hygiene.
    expect(await sweepSynthetic(controlEnv())).toEqual({ contacts: 0, accounts: 0 })

    // THE CUSTOMER'S LIST IS EXACTLY WHAT IT WAS BEFORE ANY OF THIS, which is the
    // whole promise: manufactured traffic came, ran the real path, and left.
    const remaining = (await peopleOf(controlEnv(), CUSTOMER)).map((p) => p.email)
    expect(remaining).toContain('keep@example.com')
    expect(remaining).not.toContain('collect@example.com')
    expect(remaining).not.toContain('other-run@example.com')
    expect(await contactChangeHead(controlEnv(), CUSTOMER)).not.toBe(CONTACT_CHANGE_START)
  })
})
