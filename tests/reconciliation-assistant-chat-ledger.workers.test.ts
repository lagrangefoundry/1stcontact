import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { chatLedger } from '../apps/control-app/src/ledger'
import { ticketStoreFor, type Ticket, type TicketStore } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { LEDGER_DECLARATION } from '../tools/generate/src/cli/ai/ledger-core'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import {
  calls,
  says,
  scriptedClient,
  type ModelRequest,
  type ModelStep,
} from './support/scripted-model-client'

/**
 * **The engagement record, on the deployed host** (story-a58a0974 — AC-2110,
 * AC-2111, and AC-1792 as restated by REQ-171).
 *
 * Every assertion runs inside workerd, through the Worker's own route table,
 * against a real D1 database: the chat ticket is minted by the Worker's own
 * archive on a real turn, the ledger operations are reached by the model
 * calling them through the real tool loop, and the body is read back out of the
 * account's own ticket store built by `ticketStoreFor`. The Anthropic client is
 * the one double, because it is the network.
 *
 * The failure cases (a clash, an unrelated failure, no ticket yet) drive the
 * Worker's own `chatLedger` port over that same real store. Where a failure has
 * to be provoked, the store is wrapped by a pass-through that delegates every
 * call to the real one and adds exactly one thing — a competing real write, or
 * a thrown error — so the clash a test observes is the store's own.
 */

const TENANT = 'ac2110'

/** The business every request here is scoped to, as the Worker's `fetch` resolves it. */
const SCOPE: Scope = { businessId: TENANT }

function workerEnv(): RouterEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
  } as unknown as RouterEnv
}

/** No corpus: the ledger is unconditional and does not depend on one. */
const deps = (): RouterDeps => ({ knowledge: async () => null }) as RouterDeps

const post = (path: string, body: unknown): Promise<Response> =>
  route(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
    SCOPE,
    deps(),
  )

async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  return (await response.text())
    .split('\n\n')
    .map((frame) => frame.trim())
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => JSON.parse(frame.slice(5).trim()))
}

async function seedSite(slug: string): Promise<void> {
  const seed = siteSeed({ slug })
  const res = await post('/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  })
  expect(res.status).toBe(200)
}

const store = (): Promise<TicketStore> => ticketStoreFor(workerEnv(), SCOPE)

async function chatTickets(sessionId: string): Promise<Ticket[]> {
  const { tickets } = await (await store()).query({ predicate: 'type=chat', limit: 'all' })
  return tickets.filter((t) => (t.fields ?? {}).session_id === sessionId)
}

async function chatTicket(sessionId: string): Promise<Ticket> {
  const found = await chatTickets(sessionId)
  expect(found).toHaveLength(1)
  return found[0]
}

async function transcriptComment(uid: string): Promise<Ticket | undefined> {
  const { comments } = await (await store()).comments({ uid })
  return comments.find((c) => (c.fields ?? {}).kind === 'chat_transcript')
}

async function open(slug: string): Promise<string> {
  const res = await post('/api/ai/session', { slug })
  expect(res.status, await res.clone().text()).toBe(200)
  return ((await res.json()) as { sessionId: string }).sessionId
}

/** One turn answered by a scripted model; returns the stream and what it was sent. */
async function speak(sessionId: string, text: string, steps: ModelStep[]) {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text })
  const body = await response.clone().text()
  const events = await frames(response)
  expect(events.at(-1)?.kind, body).toBe('done')
  expect(client.seen.length, body).toBeGreaterThan(0)
  return { events, seen: client.seen }
}

/** Everything a request carried, tool results included. */
const wire = (req: ModelRequest): string => JSON.stringify(req)

/** The system text of a request, flattened. */
function systemOf(req: ModelRequest): string {
  const s = req.system
  return typeof s === 'string' ? s : s.map((block) => block.text ?? '').join('\n')
}

/** A pass-through store that changes one thing about `update`. */
function wrapUpdate(
  real: TicketStore,
  update: (a: Record<string, unknown>, delegate: (a: unknown) => Promise<unknown>) => Promise<unknown>,
): TicketStore {
  const untyped = real as unknown as Record<string, (a: unknown) => Promise<unknown>>
  return new Proxy(real, {
    get(target, prop, receiver) {
      if (prop === 'update') {
        return (a: Record<string, unknown>) => update(a, (x) => untyped.update.call(real, x))
      }
      const value = Reflect.get(target, prop, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    },
  }) as TicketStore
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

// ── AC-2110: the ledger writes this conversation's ticket and nothing else ───

describe('the consultant writes the ledger into its own chat ticket', () => {
  it('test_UAT_AC2110_record_decision_and_name_engagement_write_only_this_conversations_chat_ticket', async () => {
    const slug = nextSlug('ledger')
    await seedSite(slug)
    const sessionId = await open(slug)

    // The first turn mints the chat ticket.
    const first = await speak(sessionId, 'Hello.', [says('Hello — tell me about the business.')])

    // THE SURFACE IS OFFERED, and no ledger operation can name a site, ticket or path.
    const offered = first.seen[0].tools
    const ledgerTools = offered.filter((t) => ['record_decision', 'name_engagement'].includes(t.name))
    expect(ledgerTools.map((t) => t.name).sort()).toEqual(['name_engagement', 'record_decision'])
    for (const tool of ledgerTools) {
      const props = Object.keys((tool.input_schema.properties ?? {}) as Record<string, unknown>)
      expect(props.filter((p) => /site|slug|ticket|uid|path|session/i.test(p)), tool.name).toEqual([])
    }
    const decl = LEDGER_DECLARATION as unknown as {
      surface: string
      operations: Array<{ op: string; params: Record<string, { required?: boolean }> }>
    }
    expect(decl.surface).toBe('ledger')
    for (const op of decl.operations) {
      expect(Object.keys(op.params).filter((p) => /site|slug|ticket|uid|path/i.test(p))).toEqual([])
    }
    const record = decl.operations.find((o) => o.op === 'record_decision')!
    expect(record.params.decision.required).toBe(true)
    expect(record.params.because.required).toBe(true)

    const before = await chatTicket(sessionId)
    expect((before.body ?? '').trim()).toBe('')
    expect(before.title).toBe(sessionId)

    // FIRST DECISION → `### Decision 1`, with its Why line, and the state reported.
    const one = await speak(sessionId, 'Lead with the workshop photo.', [
      calls('record_decision', {
        decision: 'The Bristol furniture restorer site leads with the workshop photograph.',
        because: 'The craft is the product.',
      }),
      says('Recorded.'),
    ])
    let chat = await chatTicket(sessionId)
    expect(chat.body.startsWith('### Decision 1')).toBe(true)
    expect(chat.body).toContain('workshop photograph')
    expect(chat.body).toContain('**Why:** The craft is the product.')
    expect(chat.body).not.toContain('**Considered and rejected:**')
    expect(chat.body).not.toContain('Open — expected')
    const reported = wire(one.seen[1])
    expect(reported).toMatch(/entries\\?"?:\s*1/)
    expect(reported).toContain(sessionId)

    // SECOND, APPENDED AFTER THE FIRST — with rejected alternatives and open marker.
    await speak(sessionId, 'Palette?', [
      calls('record_decision', {
        decision: 'The palette is oxblood and bone. We wrote "### Decision 9" on the wall.',
        because: 'It is the leather.',
        rejected: 'Navy, which read as a bank.',
        open: true,
      }),
      says('Recorded.'),
    ])
    chat = await chatTicket(sessionId)
    expect(chat.body.indexOf('### Decision 1')).toBeLessThan(chat.body.indexOf('### Decision 2'))
    expect(chat.body).toContain('**Considered and rejected:** Navy, which read as a bank.')
    expect(chat.body).toContain('*Open — expected to be revisited.*')

    // NUMBERED FROM LINE-START HEADINGS ONLY: the prose `### Decision 9` does not count.
    await speak(sessionId, 'Two pages.', [
      calls('record_decision', { decision: 'Two pages, for now.', because: 'The copy is not written.' }),
      says('Recorded.'),
    ])
    chat = await chatTicket(sessionId)
    expect(chat.body).toMatch(/^### Decision 3$/m)
    expect(chat.body).not.toMatch(/^### Decision (4|10)$/m)

    // NAME THE ENGAGEMENT → the title is the given name, no longer the session id.
    await speak(sessionId, 'That is us.', [
      calls('name_engagement', { name: 'Website for a Bristol furniture restorer' }),
      says('Named.'),
    ])
    chat = await chatTicket(sessionId)
    expect(chat.title).toBe('Website for a Bristol furniture restorer')
    expect(chat.body).toMatch(/^### Decision 3$/m)
    // Safe to call again.
    await speak(sessionId, 'Actually.', [
      calls('name_engagement', { name: 'Website for Hart & Sons, Bristol furniture restorers' }),
      says('Renamed.'),
    ])
    expect((await chatTicket(sessionId)).title).toBe('Website for Hart & Sons, Bristol furniture restorers')

    // A CLASH TO RETRY: a competing real body write lands between read and write.
    const COMPETING = '\n\nA note somebody else wrote.'
    const racing = wrapUpdate(await store(), async (a, delegate) => {
      const current = (await chatTicket(sessionId)).body
      await delegate({ uid: a.uid, patch: { body: current + COMPETING } })
      return delegate(a)
    })
    await expect(
      chatLedger(racing, sessionId).append((i) => `### Decision ${i}\n\nLost to the race.`),
    ).rejects.toMatchObject({ code: 'CONFLICT' })
    chat = await chatTicket(sessionId)
    expect(chat.body).toContain('A note somebody else wrote.')
    expect(chat.body).toMatch(/^### Decision 1$/m)
    expect(chat.body).toMatch(/^### Decision 3$/m)
    expect(chat.body).not.toContain('Lost to the race.')

    // ANY OTHER FAILURE is reported as itself.
    const broken = wrapUpdate(await store(), async () => {
      throw Object.assign(new Error('the database is unreachable'), { code: 'STORE_DOWN' })
    })
    await expect(
      chatLedger(broken, sessionId).append((i) => `### Decision ${i}\n\nx`),
    ).rejects.toMatchObject({ code: 'STORE_DOWN' })

    // NO CHAT TICKET YET → refused by name.
    const fresh = nextSlug('noledger')
    await expect(
      chatLedger(await store(), `site-${fresh}`).append((i) => `### Decision ${i}\n\nx`),
    ).rejects.toMatchObject({ code: 'NO_LEDGER' })
    const noLedger = (LEDGER_DECLARATION as unknown as { errors: Record<string, { message: string }> })
      .errors.NO_LEDGER.message
    expect(noLedger).toMatch(/say what you decided in your reply/)

    // NOTHING ON THE LEDGER SURFACE CHANGED THE SITE: still one chat ticket.
    expect(await chatTickets(sessionId)).toHaveLength(1)
  })
})

// ── AC-2111: the stated trigger ──────────────────────────────────────────────

describe('the ledger is maintained on a stated trigger', () => {
  it('test_UAT_AC2111_ledger_guidance_states_settled_one_per_call_rejected_and_rename_once_known', async () => {
    const slug = nextSlug('trigger')
    await seedSite(slug)
    const sessionId = await open(slug)
    await speak(sessionId, 'Hello.', [says('Hello.')])

    // Ask for the full entries through DescribeTools, as a session would.
    const probe = scriptedClient([says('x')])
    setModelClient(probe)
    await frames(await post('/api/ai/prompt', { sessionId, text: 'probe' }))
    const describe = probe.seen[0].tools.find((t) => t.name === 'DescribeTools')
    expect(describe, 'DescribeTools is offered').toBeDefined()
    const props = (describe!.input_schema.properties ?? {}) as Record<string, { type?: string }>
    const listParam = Object.entries(props).find(([, p]) => p.type === 'array')?.[0]
    expect(listParam, JSON.stringify(describe!.input_schema)).toBeDefined()

    const turn = await speak(sessionId, 'What does the ledger do?', [
      calls('DescribeTools', { [listParam!]: ['record_decision', 'name_engagement'] }),
      says('Understood.'),
    ])

    // THE SUMMARY GUIDE the session is primed with carries the ledger group.
    const primed = systemOf(turn.seen[0])
    expect(primed).toContain('Keeping the record')
    expect(primed).toContain('record_decision')
    expect(primed).toContain('name_engagement')
    expect(primed).toMatch(/one settled decision/i)
    expect(primed).toMatch(/once you know whose it is/i)

    // THE FULL ENTRIES, as DescribeTools returned them into the next request.
    const returned = wire(turn.seen[1])
    expect(returned).toMatch(/when something is \*\*settled\*\*, not when it is raised/)
    expect(returned).toMatch(/One call is one decision/)
    expect(returned).toMatch(/Do not batch a session/)
    expect(returned).toMatch(/what was considered and rejected/)
    expect(returned).toMatch(/as soon as you know what the business is/)
    expect(returned).toMatch(/how the next session knows anything/i)
    expect(returned).toMatch(/Write for someone searching/)
    expect(returned).toMatch(/the business, the trade, the town, the audience, the colours/)

    // NO CLOCK OR SIZE THRESHOLD names the trigger anywhere in the ledger's guidance.
    const guidance = JSON.stringify(LEDGER_DECLARATION)
    expect(guidance).not.toMatch(/every \d+|\b\d+\s*(turns?|minutes?|seconds?|hours?|characters?|chars|tokens?)\b/i)
    expect(guidance).not.toMatch(/\b(turn count|interval|threshold)\b/i)
  })
})

// ── AC-1792: the body is the ledger, never written by the fold ───────────────

describe('a turn leaves one chat ticket whose body the fold never writes', () => {
  it('test_UAT_AC1792_folding_turns_never_writes_the_body_which_keeps_the_ledger_entry_exactly', async () => {
    const slug = nextSlug('fold')
    await seedSite(slug)
    const sessionId = await open(slug)

    const SAID = 'Say something I can find again.'
    const ANSWERED = 'Noted, and kept.'
    await speak(sessionId, SAID, [says(ANSWERED)])

    const chat = await chatTicket(sessionId)
    expect(chat.type).toBe('chat')
    expect((chat.fields ?? {}).session_id).toBe(sessionId)
    expect((chat.body ?? '').trim()).toBe('')
    const transcript = await transcriptComment(chat.uid)
    expect(transcript!.body).toContain(SAID)
    expect(transcript!.body).toContain(ANSWERED)

    // A LEDGER ENTRY, written through the ledger operation.
    await speak(sessionId, 'Settle the palette.', [
      calls('record_decision', { decision: 'The palette is oxblood and bone.', because: 'It is the leather.' }),
      says('Recorded.'),
    ])
    const ledger = (await chatTicket(sessionId)).body
    expect(ledger).toMatch(/^### Decision 1$/m)

    // A FURTHER TURN folds onto the same ticket and comment; the body is untouched.
    await speak(sessionId, 'And another thing.', [says('Still the same conversation.')])
    const again = await chatTickets(sessionId)
    expect(again).toHaveLength(1)
    expect(again[0].uid).toBe(chat.uid)
    expect(again[0].body).toBe(ledger)
    const folded = await transcriptComment(chat.uid)
    expect(folded!.uid).toBe(transcript!.uid)
    for (const said of [SAID, ANSWERED, 'And another thing.', 'Still the same conversation.']) {
      expect(folded!.body).toContain(said)
    }
  })
})
