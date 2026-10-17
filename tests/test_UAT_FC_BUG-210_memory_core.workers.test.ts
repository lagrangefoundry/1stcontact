import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { BUSINESS_SESSION_SCOPE, resetChatHost, route, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { Ticket } from '../apps/control-app/src/tickets'
import {
  businessSessionIdFor,
  resetAiHost,
  sessionIdFor,
  setModelClient,
} from '../tools/generate/src/cli/ai/host-core'
import { placeholderHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { applySchema, ensureTenant, tenantStore } from './support/d1-site-factory'
import {
  calls,
  metered,
  says,
  scriptedClient,
  systemText,
  turnTailText,
  type ModelRequest,
  type ModelStep,
} from './support/scripted-model-client'

/**
 * [[BUG-210]] — **this host runs on lagrange-framework BUG-83's session-memory
 * core.** BUG-83 deleted `registerDefaults` and the shipped product tier, so every
 * conversation failed to open with `lib.registerDefaults is not a function`. The
 * host now passes its own product tier with a `memory:` block: the core's charter
 * on, its summary / transcript / reminder / budget layers off by name, and this
 * host's record, transcript pointer, work-log note and durable gauge under its own
 * `memory.*` names.
 *
 * WHAT IS REAL HERE. Every case goes through the Worker's own route table, against
 * a real D1 database and the REAL installed `@lagrangefoundry/ai` (the generated
 * `ai-workers.js` re-exports the shared store) — not a staged pre-BUG-83 copy. One
 * double: the Anthropic client.
 */

let seq = 0
const nextBusiness = (): string => `bug210-${(seq += 1)}`
const ORIGIN = 'https://app.test'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

const post = (scope: Scope, path: string, body: unknown): Promise<Response> =>
  route(
    new Request(`${ORIGIN}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    routerEnv(),
    scope,
    {},
  )

/** A brand-new business: its starter site, exactly as provisioning leaves it. */
async function newBusiness(): Promise<{ scope: Scope; site: string }> {
  const id = nextBusiness()
  await ensureTenant(id)
  const store = await tenantStore(id)
  const site = await store.createDraft('site')
  await store.write(site, {
    siteJson: starterSiteJson(site, 'Cole’s Bakery'),
    pages: [{ name: 'home.json', page: placeholderHomePage('Cole’s Bakery') }],
  })
  return { scope: { businessId: id }, site }
}

interface Opened {
  sessionId: string
  ready: boolean
  opening?: boolean
  error?: string
}

async function open(scope: Scope, body: unknown): Promise<Opened> {
  const res = await post(scope, '/api/ai/session', body)
  expect(res.status).toBe(200)
  return (await res.json()) as Opened
}

/** One scripted turn, drained, on a freshly built host — the Worker's per-request shape. */
async function turn(scope: Scope, sessionId: string, text: string, steps: ModelStep[]): Promise<ModelRequest[]> {
  const client = scriptedClient(steps)
  setModelClient(client)
  resetAiHost()
  resetChatHost()
  const res = await post(scope, '/api/ai/prompt', { sessionId, text })
  expect(res.status).toBe(200)
  const body = await res.text()
  expect(body).not.toContain('registerDefaults')
  return client.seen
}

/** The `chat` ticket homing a session. */
async function chatTicket(scope: Scope, sessionId: string): Promise<Ticket> {
  const tickets = ticketStoreFor(
    { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, BLOBS: env.BLOBS as R2Bucket },
    scope,
  )
  const { tickets: found } = await (await tickets).query({ predicate: 'type=chat', limit: 'all' })
  const chat = found.find((t) => (t.fields as Record<string, unknown>)?.session_id === sessionId)
  expect(chat).toBeDefined()
  return chat as Ticket
}

const told = (req: ModelRequest): string => `${systemText(req)}\n${turnTailText(req)}`

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('BUG-210 — conversations open on the session-memory core', () => {
  it('test_UAT_FC_BUG-210_a_new_business_opens_its_builder_conversation_and_is_offered_the_start', async () => {
    // THE SYMPTOM. Opening threw `lib.registerDefaults is not a function`, so the
    // conversation never got as far as offering REQ-403's start.
    const { scope, site } = await newBusiness()
    const opened = await open(scope, { site })

    expect(opened.error).toBeUndefined()
    expect(opened.ready).toBe(true)
    expect(opened.sessionId).toBe(sessionIdFor(site))
    expect(opened.opening).toBe(true)
  })

  it('test_UAT_FC_BUG-210_a_consultant_turn_carries_the_memory_charter_naming_its_chat_ticket', async () => {
    const { scope, site } = await newBusiness()
    const { sessionId } = await open(scope, { site })
    await turn(scope, sessionId, 'Hello.', [says('Hello — what are we building?')])
    const chat = await chatTicket(scope, sessionId)

    const read = told((await turn(scope, sessionId, 'A bakery site.', [says('Lovely.')]))[0])

    // The core's charter, naming this conversation's own ticket…
    expect(read).toContain('Your memory of this conversation')
    expect(read).toContain(`This conversation is ticket ${chat.uid}`)
    // …with the window line this host overrides: nothing about a "summary" it
    // does not keep in the core's store.
    expect(read).not.toContain('they are in your summary and your transcript')
    // This host's own transcript pointer, under its own name.
    expect(read).toContain('Reaching the rest of this conversation')
    // And none of the core's switched-off layers: no core summary heading, no core
    // reminder naming summary verbs this host does not grant.
    expect(read).not.toContain('Your summary of this session')
    expect(read).not.toContain('Keep your summary current')
  })

  it('test_UAT_FC_BUG-210_the_consultant_still_reads_back_its_standing_note_and_decisions', async () => {
    // [[REQ-283]] SURVIVES THE ADOPTION: the record is delivered by this host's
    // provider, read late from the chat ticket's frame and the decisions ledger.
    const { scope, site } = await newBusiness()
    const { sessionId } = await open(scope, { site })
    await turn(scope, sessionId, 'Here is the plan.', [
      calls('set_standing_note', { note: 'A one-page site for a Bristol bakery. Rejected: online orders.' }),
      calls('record_decision', {
        decision: 'The accent colour is a warm crust brown.',
        because: 'It matches the shopfront.',
      }),
      says('Written down.'),
    ])

    const read = told((await turn(scope, sessionId, 'Carry on.', [says('Carrying on.')]))[0])

    expect(read).toContain('Your record of this engagement')
    expect(read).toContain('A one-page site for a Bristol bakery. Rejected: online orders.')
    expect(read).toContain('The accent colour is a warm crust brown.')
  })

  it('test_UAT_FC_BUG-210_the_settings_assistant_gets_its_gauge_and_is_not_told_its_turns_are_addressable', async () => {
    const { scope } = await newBusiness()
    const opened = await open(scope, { scope: BUSINESS_SESSION_SCOPE })
    expect(opened.error).toBeUndefined()
    expect(opened.sessionId).toBe(businessSessionIdFor(scope.businessId))

    await turn(scope, opened.sessionId, 'Hello.', [metered({ input_tokens: 50_000 }, says('Hi.'))])
    const read = told((await turn(scope, opened.sessionId, 'Again.', [says('Ok.')]))[0])

    // [[REQ-296]]'s gauge, from the durable figure — the manager was rebuilt
    // between the two turns, so the framework's in-memory occupancy is gone.
    expect(read).toContain('Your context budget')
    expect(read).toContain('50,000 tokens')
    // And nothing telling it its turns can be read back by id.
    expect(read).not.toMatch(/turn id/i)
    expect(read).not.toContain('Reaching the rest of this conversation')
  })
})
