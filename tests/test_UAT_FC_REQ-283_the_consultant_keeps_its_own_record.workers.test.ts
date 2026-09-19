import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { Ticket } from '../apps/control-app/src/tickets'
import { FRAME_FIELD } from '../apps/control-app/src/ledger'
import { resetAiHost, sessionIdFor, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { LEDGER_DECLARATION } from '../tools/generate/src/cli/ai/ledger-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import {
  calls,
  says,
  scriptedClient,
  systemText,
  turnTailText,
  type ModelRequest,
} from './support/scripted-model-client'

/**
 * REQ-283 — **the consultant keeps and consults its own record**.
 *
 * WHAT WAS ACTUALLY WRONG, and it is not what the ticket first said. This host
 * was never without a memory: [[REQ-171]]'s engagement ledger has been writing
 * `### Decision N` entries into the chat ticket's BODY for a long time, and that
 * placement is load-bearing — the knowledge component indexes `title` and `body`,
 * and a comment is not indexed, so the ledger is the only part of a conversation
 * the client's own corpus can ever find.
 *
 * **The ledger was WRITE-ONLY.** Nothing in `priming.json` carried it, the surface
 * declared no read, and no provider delivered it. The consultant recorded a
 * decision and could not see it on the next turn — so it re-derived state it had
 * already settled, from the site, by looking. That is the defect, and delivery is
 * the fix.
 *
 * THREE THINGS LAND TOGETHER, and the cases below are grouped as they are:
 *
 *   1. **Delivery.** A provider puts the record in front of the session on every
 *      turn — the standing note whole, then the most recent decisions.
 *   2. **The standing note.** A bounded, rewritten-in-place paragraph, stored in
 *      the chat ticket's FRONTMATTER beside the ledger in its body. One object,
 *      two zones, and two writes that cannot clobber each other.
 *   3. **Self-inspection.** The framework's `agent` surface, so the consultant
 *      can read its own priming, its own reminder and its own past turns by id.
 *
 * AND THE PRODUCT TIER IS ADOPTED, which is what makes the transcript pointer
 * honest: it tells a session its turns are addressable, and until `AgentHistory`
 * was granted nothing here could address one.
 *
 * WHAT IS REAL HERE. Every assertion runs INSIDE workerd, through the Worker's
 * own `fetch`, against a real D1 database. The session manager, the role assembly,
 * the priming providers, the Toolbox, the capability gate, the ledger surface and
 * the ticket store are all production code. ONE double: the Anthropic client,
 * which is the network and the boundary the library's own backend is written to
 * have injected.
 */

let businessSeq = 0
const nextBusiness = (): string => `req283-${(businessSeq += 1)}`

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
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
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

/** Read an SSE body back into the events the chat panel would see. */
async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()))
}

/** A site made only of L1, imported through the Worker's own route. */
async function seedSite(tenant: string): Promise<string> {
  const seed = siteSeed({ slug: nextSlug('req283') })
  const res = await post(tenant, '/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  })
  expect(res.status).toBe(200)
  return ((await res.json()) as { site: string }).site
}

/** A business with a site and an open conversation about it. */
async function conversation(): Promise<{ tenant: string; slug: string; sessionId: string }> {
  const tenant = nextBusiness()
  const slug = await seedSite(tenant)
  const opened = await post(tenant, '/api/ai/session', { site: slug })
  expect(opened.status).toBe(200)
  const session = (await opened.json()) as { sessionId: string; ready: boolean; error?: string }
  expect(session.error).toBeUndefined()
  expect(session.ready).toBe(true)
  return { tenant, slug, sessionId: session.sessionId }
}

/** One turn, with the model scripted to do `steps`. Answers what it was sent. */
async function turn(
  ctx: { tenant: string; sessionId: string },
  text: string,
  steps: Parameters<typeof scriptedClient>[0],
): Promise<{ seen: ModelRequest[]; events: { kind: string; content?: string }[] }> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post(ctx.tenant, '/api/ai/prompt', { sessionId: ctx.sessionId, text })
  expect(response.status).toBe(200)
  const events = await frames(response)
  expect(events.at(-1)?.kind).toBe('done')
  return { seen: client.seen, events }
}

/** The `chat` ticket homing this conversation — both zones of the record. */
async function chatTicket(tenant: string, slug: string): Promise<Ticket> {
  const tickets = await ticketStoreFor(
    { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, BLOBS: env.BLOBS as R2Bucket },
    { businessId: tenant },
  )
  const { tickets: found } = await tickets.query({ predicate: 'type=chat', limit: 'all' })
  const chat = found.find(
    (t) => (t.fields as Record<string, unknown>)?.session_id === sessionIdFor(slug),
  )
  expect(chat).toBeDefined()
  return chat as Ticket
}

/** Everything the model was told on a turn — priming, reminder and seed. */
const told = (req: ModelRequest): string => `${systemText(req)}\n${turnTailText(req)}`

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

// ── AC1 — delivery: what it recorded comes back ─────────────────────────────

describe('REQ-283 AC1 — the record is put in front of the session, every turn', () => {
  it('test_UAT_FC_REQ-283_a_decision_recorded_on_one_turn_is_read_back_on_the_next', async () => {
    // THE DEFECT, STATED AS A TEST. `record_decision` wrote into a body nothing
    // ever read back, so the consultant could not see on turn two what it had
    // settled on turn one — and a session that cannot read its own decisions has
    // no choice but to re-derive them.
    const ctx = await conversation()

    await turn(ctx, 'Use oxblood for the buttons.', [
      calls('record_decision', {
        decision: 'The accent colour across the site is oxblood.',
        because: 'It picks up the leather the workshop actually uses.',
        rejected: 'A mid-green, which read as municipal against the timber.',
      }),
      says('Noted — oxblood it is.'),
    ])

    const second = await turn(ctx, 'What is next?', [says('Next is the contact page.')])
    const read = told(second.seen[0])

    // The decision, whole: what was settled, why, and what lost. The rejected
    // option matters as much as the chosen one — without it a later stretch of
    // the conversation re-proposes exactly what this client already turned down.
    expect(read).toContain('The accent colour across the site is oxblood.')
    expect(read).toContain('It picks up the leather the workshop actually uses.')
    expect(read).toContain('A mid-green, which read as municipal against the timber.')
  })

  it('test_UAT_FC_REQ-283_the_standing_note_is_delivered_whole_beside_the_decisions', async () => {
    // TWO ZONES WITH OPPOSITE POLARITY, and the seed treats them differently on
    // purpose: the note is bounded and rewritten in place, so it is delivered
    // COMPLETE; the ledger is unbounded and appended to, so it is delivered as a
    // tail. A tail-only view of the note would drop its earliest content, which
    // for a note is usually the most load-bearing part.
    const ctx = await conversation()

    await turn(ctx, 'Here is what we are doing.', [
      calls('set_standing_note', {
        note:
          'Building a one-page site for a Bristol furniture restorer. Settled: oxblood accent, ' +
          'photography over illustration. Out of scope: online sales. Rejected: a blog, because ' +
          'nobody will write it.',
      }),
      calls('record_decision', {
        decision: 'The home page leads with the workshop photograph.',
        because: 'It is the only picture that shows the work being done.',
      }),
      says('Written down.'),
    ])

    const read = told((await turn(ctx, 'Carry on.', [says('Carrying on.')])).seen[0])
    expect(read).toContain('Building a one-page site for a Bristol furniture restorer.')
    expect(read).toContain('Rejected: a blog, because nobody will write it.')
    expect(read).toContain('The home page leads with the workshop photograph.')
    // And it is framed as the session's OWN record rather than as a transcript,
    // because a session that reads it as "the conversation, abridged" will
    // distrust it — and the whole value is in it being trusted enough to stop the
    // re-deriving.
    expect(read).toContain('Your record of this engagement')
  })

  it('test_UAT_FC_REQ-283_a_conversation_that_has_decided_nothing_is_told_nothing', async () => {
    // A HEADING OVER NOTHING IS WORSE THAN NO HEADING. The provider answers
    // `null` when there is no note and no decision, which drops the entry and its
    // separator — so the first turn of every engagement costs nothing.
    const ctx = await conversation()
    const first = await turn(ctx, 'Hello.', [says('Hello — what are we building?')])
    expect(told(first.seen[0])).not.toContain('Your record of this engagement')
  })
})

// ── AC2 — one object, two zones, two writes that cannot clobber ─────────────

describe('REQ-283 AC2 — the note is a field on the ticket the ledger is the body of', () => {
  it('test_UAT_FC_REQ-283_the_note_is_frontmatter_and_the_ledger_is_the_body', async () => {
    // THE OPERATOR'S PLACEMENT, AND THE INVARIANT IT PRESERVES. `summary.js`
    // splits its two zones across a field and a body so the two writes cannot
    // clobber each other. That invariant is what matters and the comment is
    // incidental — so the note goes in the frontmatter of the ticket this host
    // already keeps the ledger in, and the whole of a session's memory is one
    // object.
    const ctx = await conversation()

    await turn(ctx, 'Note this and record that.', [
      calls('set_standing_note', { note: 'A one-page site for a furniture restorer.' }),
      calls('record_decision', {
        decision: 'The site is one page.',
        because: 'There is not enough material for more, and there does not need to be.',
      }),
      says('Both written.'),
    ])

    const chat = await chatTicket(ctx.tenant, ctx.slug)
    // The note is in the frontmatter…
    expect((chat.fields as Record<string, unknown>)[FRAME_FIELD]).toBe(
      'A one-page site for a furniture restorer.',
    )
    // …and the ledger is in the body, which is what the knowledge component
    // indexes. [[REQ-171]]'s reason for that placement survives this ticket
    // intact: a conversation whose body is empty is unfindable.
    expect(chat.body).toContain('### Decision 1')
    expect(chat.body).toContain('The site is one page.')
    // The note is NOT in the body. Indexing a paragraph that is rewritten many
    // times in one session would feed the corpus a stream of vectors that
    // supersede themselves.
    expect(chat.body).not.toContain('A one-page site for a furniture restorer.')
  })

  it('test_UAT_FC_REQ-283_rewriting_the_note_leaves_every_decision_byte_identical', async () => {
    // THE CLOBBER TEST. A field patch merges, so it never touches the body; the
    // ledger's append never reads the field. Structurally unable to collide
    // rather than merely unlikely to.
    const ctx = await conversation()

    await turn(ctx, 'Start.', [
      calls('record_decision', { decision: 'Oxblood.', because: 'The leather.' }),
      calls('set_standing_note', { note: 'First version of the note.' }),
      says('Done.'),
    ])
    const before = (await chatTicket(ctx.tenant, ctx.slug)).body

    await turn(ctx, 'Rewrite the note.', [
      calls('set_standing_note', { note: 'Second version, entirely different.' }),
      says('Rewritten.'),
    ])

    const after = await chatTicket(ctx.tenant, ctx.slug)
    expect(after.body).toBe(before)
    expect((after.fields as Record<string, unknown>)[FRAME_FIELD]).toBe(
      'Second version, entirely different.',
    )
  })

  it('test_UAT_FC_REQ-283_an_oversized_note_is_refused_and_nothing_is_stored', async () => {
    // AN ERROR, NEVER A TRUNCATION — the rule that had to survive not adopting
    // `SummaryStore`. Upstream states why and it is the whole point of the zone: a
    // silently shortened note loses the rejections first, and a consultant whose
    // record of what the client already turned down was quietly trimmed will
    // re-propose it, in front of that client.
    const ctx = await conversation()

    await turn(ctx, 'Keep a note.', [
      calls('set_standing_note', { note: 'A short, storable note.' }),
      says('Kept.'),
    ])

    const refused = await turn(ctx, 'Now a very long one.', [
      calls('set_standing_note', { note: 'x'.repeat(5000) }),
      says('I will shorten it.'),
    ])

    // The refusal is rendered for the model to correct itself from rather than
    // thrown: that is the Toolbox's contract, so the evidence is the text.
    const refusal = JSON.stringify(refused.seen.at(-1)?.messages ?? [])
    expect(refusal).toMatch(/NOTE_TOO_LONG/)
    // It names both sizes, because `host_detail` is left at its default — so the
    // model can shorten by a known amount instead of guessing.
    expect(refusal).toMatch(/5000 bytes/)
    // And nothing was stored: the earlier note is exactly as it was.
    const chat = await chatTicket(ctx.tenant, ctx.slug)
    expect((chat.fields as Record<string, unknown>)[FRAME_FIELD]).toBe('A short, storable note.')
  })

  it('test_UAT_FC_REQ-283_the_note_verb_is_on_the_ledger_surface_beside_the_decisions', async () => {
    // A NARROW VERB ON THE SURFACE THAT ALREADY OWNS THIS TICKET, rather than a
    // generic ticket write clawed back by a scope predicate — which is the
    // argument `ledger-core.ts` already makes for `record_decision` itself. And
    // the surface version moved with the surface.
    const decl = LEDGER_DECLARATION as unknown as {
      surface_version: number
      operations: Array<{ op: string; tool: string; effect: string }>
      groups: Array<{ group: string; effect: string; operations: string[] }>
    }
    const op = decl.operations.find((o) => o.op === 'set_standing_note')
    expect(op).toBeDefined()
    expect(op?.effect).toBe('write')
    // In `KeepLedger`, which is where a session's grant over its own record
    // already is — and the group stays effect-homogeneous.
    const group = decl.groups.find((g) => g.group === 'KeepLedger')
    expect(group?.operations).toContain('set_standing_note')
    expect(group?.effect).toBe('write')
    expect(decl.surface_version).toBeGreaterThan(1)
  })
})

// ── AC3 — self-inspection, and only what can be answered ───────────────────

describe('REQ-283 AC3 — the consultant can read its own context', () => {
  it('test_UAT_FC_REQ-283_it_is_offered_the_reads_on_its_own_conversation', async () => {
    const ctx = await conversation()
    const { seen } = await turn(ctx, 'Hello.', [says('Hello.')])
    const offered = seen[0].tools.map((t) => t.name)

    // What it was primed with, what it is reminded of, the composite, and the
    // turns themselves by position or by id.
    expect(offered).toContain('AgentPriming')
    expect(offered).toContain('AgentReminder')
    expect(offered).toContain('AgentContext')
    expect(offered).toContain('AgentHistory')
  })

  it('test_UAT_FC_REQ-283_it_is_not_offered_a_read_this_host_cannot_answer', async () => {
    // A SESSION IS NEVER TOLD ABOUT A CAPABILITY IT WAS NOT GRANTED, and the
    // corollary bites here: `AgentSummary`, `AgentSummaryFrame` and
    // `AgentSummaryLog` all read or write a `SummaryStore`, and this host has
    // none — its note is a field on the chat ticket and its log is that ticket's
    // body. Upstream's own handler raises `not_found` without a store, and a
    // granted operation that always refuses is the exact shape this repository
    // keeps refusing to ship. The note is written with `set_standing_note`.
    const ctx = await conversation()
    const offered = (await turn(ctx, 'Hello.', [says('Hello.')])).seen[0].tools.map((t) => t.name)

    expect(offered).not.toContain('AgentSummary')
    expect(offered).not.toContain('AgentSummaryFrame')
    expect(offered).not.toContain('AgentSummaryLog')
    // Nor the two upstream says belong to somebody working ON a session rather
    // than in one: an unbounded paste read back into a live conversation
    // displaces everything else in it.
    expect(offered).not.toContain('AgentHistoryFull')
    expect(offered).not.toContain('AgentRolePriming')
    // The verb it does have for the note is the ledger's.
    expect(offered).toContain('set_standing_note')
  })

  it('test_UAT_FC_REQ-283_it_can_read_a_turn_of_its_own_conversation_back', async () => {
    // THE CAPABILITY, STATED AS A TEST. This is the reader REQ-126's window
    // design assumes exists — what falls outside the window is reachable because
    // the session can address its own turns — and until now nothing on this host
    // could address one.
    const ctx = await conversation()
    await turn(ctx, 'The workshop is in Bedminster.', [says('Noted — Bedminster.')])

    const chat = await chatTicket(ctx.tenant, ctx.slug)
    const recalled = await turn(ctx, 'Where did I say the workshop was?', [
      calls('AgentHistory', { session: chat.uid, first: 4 }),
      says('Bedminster.'),
    ])

    // The earlier exchange came back through the real surface, gate and store.
    const results = JSON.stringify(recalled.seen.at(-1)?.messages ?? [])
    expect(results).toContain('Bedminster')
    expect(results).not.toMatch(/not enabled|no_addressing|not granted/)
  })
})

// ── AC4 — the product tier, adopted, and honest entry by entry ─────────────

describe('REQ-283 AC4 — the shipped product tier is adopted, not declined', () => {
  it('test_UAT_FC_REQ-283_the_session_is_told_where_the_rest_of_its_conversation_is', async () => {
    // `session.transcript_pointer` was declined because "this host grants no
    // operation that reads them". `AgentHistory` is that operation, so the entry
    // is now true — and the tier and the grant land together, which is what the
    // rule requires.
    const ctx = await conversation()
    await turn(ctx, 'First.', [says('First.')])
    const read = told((await turn(ctx, 'Second.', [says('Second.')])).seen[0])

    expect(read).toContain('Reaching the rest of this conversation')
    expect(read).toMatch(/turn id/i)
  })

  it('test_UAT_FC_REQ-283_it_is_not_pointed_at_a_tool_transcript_it_cannot_read', async () => {
    // THE THIRD ENTRY IS DECLINED ON ITS OWN MERITS, by binding no reader.
    // Nothing this host grants reads the persisted TOOL record stream, so
    // pointing a session at one would be a hand-written claim about a tool it
    // does not have — and upstream's own answer to that is the conditional
    // provider, which renders nothing with no reader bound.
    const ctx = await conversation()
    await turn(ctx, 'Look at the pages.', [calls('list_pages', {}), says('Looked.')])
    const read = told((await turn(ctx, 'And again.', [says('Again.')])).seen[0])

    expect(read).not.toContain('recorded separately from the conversation')
  })

  it('test_UAT_FC_REQ-283_the_per_turn_reminder_nudges_it_to_keep_the_record_current', async () => {
    // THE NUDGE IS WHAT MAKES THE RECORD GET WRITTEN, and it is this host's own
    // words rather than the framework's: upstream's trigger says to append to a
    // log, and both verbs here belong to the ledger surface. It names the
    // property that earns the note its keep — that it is what survives when the
    // recent exchanges do not.
    const ctx = await conversation()
    const { seen } = await turn(ctx, 'Hello.', [says('Hello.')])
    const reminder = turnTailText(seen[0])

    expect(reminder).toContain('Keep your record current as you work')
    expect(reminder).toContain('what survives when the recent exchanges do not')
  })
})
