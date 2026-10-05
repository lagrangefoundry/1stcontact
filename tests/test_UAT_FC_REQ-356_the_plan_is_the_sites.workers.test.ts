import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { productTypePack, ticketStoreFor, type Ticket, type TicketStore } from '../apps/control-app/src/tickets'
import { chatLedger } from '../apps/control-app/src/ledger'
import { createPlan, ensurePlan, findPlan, sitePlan } from '../apps/control-app/src/plan'
import { provisionBusiness, type IdentityEnv } from '../apps/control-app/src/identity'
import { inviteAccount } from './support/invite-account'
import { resetAiHost, sessionIdFor, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { renderEntry } from '../tools/generate/src/cli/ai/ledger-core'
import type { PlanFields } from '../tools/generate/src/cli/ai/plan-core'
import planSeed from '../tools/generate/src/cli/ai/plan-seed.json'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { calls, says, scriptedClient, turnTailText, type ModelRequest } from './support/scripted-model-client'

/**
 * REQ-356 — **one living plan per site**, in the ticket store, written by the
 * consultant's own tool calls and put in front of it every turn.
 *
 * WHAT IS REAL HERE. Every assertion runs inside workerd against a real D1
 * database: the ticket store and its type pack, the plan port, the ledger, the
 * session manager, the priming providers, the Toolbox and the capability gate
 * are production code. ONE double: the Anthropic client, which is the network.
 */

let businessSeq = 0
const nextBusiness = (): string => `req356-${(businessSeq += 1)}`

function workerEnv(tenant: string): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenant,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

const post = (tenant: string, path: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(tenant),
  )

const store = (tenant: string): Promise<TicketStore> =>
  ticketStoreFor(
    { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, BLOBS: env.BLOBS as R2Bucket },
    { businessId: tenant },
  )

/** A business with a site and an open conversation about it. */
async function conversation(): Promise<{ tenant: string; slug: string; sessionId: string }> {
  const tenant = nextBusiness()
  const seed = siteSeed({ slug: nextSlug('req356') })
  const imported = await post(tenant, '/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page: page as Record<string, unknown> })),
    assets: [] as { name: string; base64: string }[],
  })
  expect(imported.status).toBe(200)
  const slug = ((await imported.json()) as { site: string }).site
  const opened = await post(tenant, '/api/ai/session', { site: slug })
  expect(opened.status).toBe(200)
  const session = (await opened.json()) as { sessionId: string; ready: boolean }
  expect(session.ready).toBe(true)
  return { tenant, slug, sessionId: session.sessionId }
}

/** One turn, with the model scripted to do `steps`. Answers what it was sent. */
async function turn(
  ctx: { tenant: string; sessionId: string },
  text: string,
  steps: Parameters<typeof scriptedClient>[0],
): Promise<ModelRequest[]> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post(ctx.tenant, '/api/ai/prompt', { sessionId: ctx.sessionId, text })
  expect(response.status).toBe(200)
  await response.text()
  return client.seen
}

const fieldsOf = (plan: Ticket): PlanFields => plan.fields as unknown as PlanFields

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-356 — the type is `plan`, and `brief` is gone', () => {
  it('test_UAT_FC_REQ-356_the_brief_type_no_longer_exists', () => {
    const pack = productTypePack()
    expect(pack.has('plan')).toBe(true)
    expect(pack.has('brief')).toBe(false)
    expect(Object.keys(pack.schema('plan').fields ?? {}).sort()).toEqual(
      // `asks` is [[REQ-364]]'s extension of the schema: the plan panel's questions;
      // `milestones` is [[REQ-379]]'s: what the host has seen of the build;
      // `comps` is [[REQ-378]]'s: the comp board; `public_details` is [[REQ-389]]'s:
      // the contact details the client approved for the site.
      ['asks', 'brief', 'checks', 'comps', 'decisions', 'functionality', 'kind', 'milestones', 'phase', 'public_details', 'site_key', 'tasks'].sort(),
    )
  })
})

describe('REQ-356 — exactly one site plan per site', () => {
  it('test_UAT_FC_REQ-356_provisioning_a_business_creates_its_site_plan', async () => {
    // EVERY BUSINESS STARTS WITH A PLAN, before its first conversation: the
    // starter site's key, `kind: site`, `phase: intake`, and the generic list.
    const identity: IdentityEnv = {
      DB: env.DB as D1Database,
      SITES: env.SITES as R2Bucket,
      BLOBS: env.BLOBS as R2Bucket,
      TENANT_ID: 'req356-platform',
    }
    const account = await inviteAccount(identity, { email: `req356-${nextBusiness()}@example.test`, endsAt: null })
    const business = await provisionBusiness(identity, { accountId: account.user.account_id, name: 'Cole Bakery' })

    const plan = (await findPlan(await store(business.businessId), business.siteKey)) as Ticket
    expect(plan).not.toBeNull()
    expect(fieldsOf(plan)).toMatchObject({ kind: 'site', site_key: business.siteKey, phase: 'intake' })
    expect(fieldsOf(plan).decisions.map((d) => d.id)).toEqual(planSeed.decisions.map((d) => d.id))
    expect(fieldsOf(plan).checks.map((c) => c.id)).toEqual(planSeed.checks.map((c) => c.id))
    expect(plan.body).toBe('## Brief\n\n## Decision log\n\n## Notes')

  })

  it('test_UAT_FC_REQ-356_first_open_creates_a_missing_plan_once_even_when_raced', async () => {
    // A SITE FROM BEFORE THIS CHANGE has no plan. The first read creates it with
    // the same seed — and five opens racing produce exactly one live plan.
    const tickets = await store(nextBusiness())
    const opened = await Promise.all(Array.from({ length: 5 }, () => sitePlan(tickets, 'site_legacy').read()))
    expect(new Set(opened.map((p) => JSON.stringify(p?.fields))).size).toBe(1)
    const { tickets: plans } = await tickets.query({ predicate: 'type=plan', limit: 'all' })
    expect(plans.filter((t) => !t.archived)).toHaveLength(1)
    expect(fieldsOf((await findPlan(tickets, 'site_legacy')) as Ticket).site_key).toBe('site_legacy')

    // And opening it again finds that one rather than making another.
    expect((await ensurePlan(tickets, 'site_legacy')).uid).toBe((await findPlan(tickets, 'site_legacy'))?.uid)
  })

  it('test_UAT_FC_REQ-356_a_second_site_plan_for_the_same_site_is_refused', async () => {
    const tickets = await store(nextBusiness())
    const plan = await createPlan(tickets, 'site_a')
    await expect(createPlan(tickets, 'site_a')).rejects.toMatchObject({ code: 'PLAN_EXISTS' })
    // A business may one day run several sites, each with its own plan.
    const other = await createPlan(tickets, 'site_b')
    expect(other.uid).not.toBe(plan.uid)
    expect((await findPlan(tickets, 'site_a'))?.uid).toBe(plan.uid)
  })

  it('test_UAT_FC_REQ-356_the_rules_hold_on_every_write_to_the_store', async () => {
    // THE DATA RULE, ON ITS OWN. The tool declarations refuse a `bob` answer at
    // the enum first; this proves the stored plan refuses it whoever writes.
    const tickets = await store(nextBusiness())
    await createPlan(tickets, 'site_rules')
    const port = sitePlan(tickets, 'site_rules')
    const before = await findPlan(tickets, 'site_rules')

    await expect(
      port.write((plan) => {
        plan.fields.checks[0].answers.push({ by: 'bob', verdict: 'no' })
        return plan
      }),
    ).rejects.toMatchObject({ code: 'PLAN_INVALID' })
    await expect(
      port.write((plan) => {
        plan.fields.decisions[0].state = 'chosen'
        return plan
      }),
    ).rejects.toMatchObject({ code: 'PLAN_INVALID' })
    await expect(
      port.write((plan) => {
        Object.assign(plan.fields.decisions[0], { state: 'parked', answer: { quote: 'Later.', at: 'now' } })
        return plan
      }),
    ).rejects.toMatchObject({ code: 'PLAN_INVALID' })

    const after = await findPlan(tickets, 'site_rules')
    expect(after?.version).toBe(before?.version)
  })
})

describe("REQ-356 — the decision log is the site's, not the conversation's", () => {
  it('test_UAT_FC_REQ-356_record_decision_appends_to_the_plan_numbering_across_sessions', async () => {
    const ctx = await conversation()
    const tickets = await store(ctx.tenant)

    // AN EARLIER CONVERSATION about the same site already decided two things.
    const earlier = chatLedger(tickets, 'an-earlier-session', ctx.slug)
    await earlier.append((i) => renderEntry(i, { decision: 'The palette is oxblood.', because: 'The leather.' }))
    await earlier.append((i) => renderEntry(i, { decision: 'One page for now.', because: 'No copy yet.' }))

    await turn(ctx, 'Lead with the workshop photo.', [
      calls('record_decision', {
        decision: 'The home page leads with the workshop photograph.',
        because: 'The craft is the product.',
      }),
      says('Noted.'),
    ])

    const plan = (await findPlan(tickets, ctx.slug)) as Ticket
    // Numbered from the SITE's log, so this session continues at three.
    expect(plan.body).toMatch(/### Decision 3\n\nThe home page leads with the workshop photograph\./)
    expect(plan.body.indexOf('### Decision 3')).toBeLessThan(plan.body.indexOf('## Notes'))

    // And the conversation's chat ticket holds no decision at all.
    const { tickets: chats } = await tickets.query({ predicate: 'type=chat', limit: 'all' })
    const chat = chats.find((t) => (t.fields as Record<string, unknown>).session_id === sessionIdFor(ctx.slug))
    expect(chat?.body ?? '').not.toContain('### Decision')
  })
})

describe('REQ-356 — the consultant works from the plan', () => {
  it('test_UAT_FC_REQ-356_the_consultant_holds_its_plan_tools_and_reads_the_plan_every_turn', async () => {
    const ctx = await conversation()

    const first = await turn(ctx, 'We restore furniture in Bristol.', [
      calls('update_brief', { business: 'A Bristol furniture restorer', quality_bar: 'premium' }),
      calls('set_decision', { decision: 'typography', value: 'Georgia / Helvetica', state: 'defaulted' }),
      says('Got it.'),
    ])
    const offered = first[0].tools.map((t) => t.name)
    expect(offered).toEqual(expect.arrayContaining(['read_plan', 'update_brief', 'set_decision', 'set_task', 'answer_check']))
    // The coordinator's tools are not the consultant's — save the milestones,
    // which [[REQ-379]] gives both roles.
    expect(offered).not.toContain('record_client_answer')
    expect(offered).toEqual(expect.arrayContaining(['ask_check', 'record_check_answer', 'set_phase']))

    const plan = (await findPlan(await store(ctx.tenant), ctx.slug)) as Ticket
    expect(fieldsOf(plan).decisions.find((d) => d.id === 'typography')).toMatchObject({
      state: 'defaulted',
      value: 'Georgia / Helvetica',
    })

    // The next turn carries the plan — and names the default as a default.
    const second = await turn(ctx, 'What next?', [says('Next, the layout.')])
    const tail = turnTailText(second[0])
    expect(tail).toContain('### The site plan')
    expect(tail).toContain('quality bar: premium')
    expect(tail).toMatch(/Defaulted, never really chosen: Typography\./)
  })
})
