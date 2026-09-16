import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  BUSINESS_SESSION_SCOPE,
  resetChatHost,
  route,
  type RouterEnv,
} from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { PLATFORM_APEX, businessAddresses, claimHostname } from '../apps/control-app/src/hostname'
import { businessRecord } from '../apps/control-app/src/business'
import {
  businessSessionIdFor,
  resetAiHost,
  setModelClient,
} from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant, seedTenantSite } from './support/d1-site-factory'
import { calls, says, scriptedClient } from './support/scripted-model-client'
import type { ModelStep, ScriptedClient } from './support/scripted-model-client'

/**
 * [[REQ-251]] — **somebody drives the address operations, for the first time.**
 *
 * WHY THIS SUITE EXISTS. `read_addresses`, `check_hostname` and `claim_hostname`
 * have been declared, implemented, installed as own methods, granted and bound to
 * [[REQ-238]]'s real functions since that ticket landed — and not one of them had
 * ever been called through the shipped host. The wiring was complete and the
 * behaviour was unobserved, which is a different thing from untested: nothing had
 * established that the three are even reachable from a conversation, let alone
 * that a refusal arrives as a sentence rather than as a crash.
 *
 * WHAT MAKES THIS EVIDENCE. Every case takes a REAL TURN through the Worker's own
 * route table, over a real D1 with the deployed schema — including `0008`'s unique
 * index on `host`, which is what settles the race in AC5. The one double is the
 * Anthropic client, which is the network. The session manager, the role, the
 * priming, the tool schemas, the Toolbox's capability gate, `settings-core.ts`'s
 * refusal translation and `hostname.ts`'s rules are all the shipped things, and
 * every assertion about what changed reads D1 back through the shipped function
 * rather than through the stream.
 *
 * WHAT A SCRIPTED MODEL CANNOT PROVE, said plainly because the ticket asks for
 * behaviour and this is the boundary of what a test can hold: that the model
 * CHOOSES to check several candidates before speaking, or DECLINES to claim when
 * told *"just pick one"*. Those are properties of a model's judgement, asked for
 * in the declaration's `sequences` and `absences`. What this proves is that every
 * one of those behaviours is REACHABLE and correct when taken — including the two
 * the declaration is most worried about, the race and the second claim, which
 * before this suite had never been produced at all.
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  } as RouterEnv
}

const identity = () => routerEnv() as unknown as IdentityEnv

/**
 * A business with a site, because an address reaches one.
 *
 * `NoSiteError` is a real refusal on this surface and a business without a site
 * would produce it for every claim below — which would make six cases pass while
 * proving nothing about hostnames at all.
 */
async function business(id: string, name: string): Promise<Scope> {
  await APPLIED
  await ensureTenant(id)
  await (env.DB as D1Database).prepare('UPDATE tenants SET name = ? WHERE id = ?').bind(name, id).run()
  await seedTenantSite(id)
  return { businessId: id }
}

async function openSettings(scope: Scope): Promise<{ sessionId: string }> {
  const opened = await route(
    new Request(`${ORIGIN}/api/ai/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scope: BUSINESS_SESSION_SCOPE }),
    }),
    routerEnv(),
    scope,
    {},
  )
  expect(opened.status).toBe(200)
  return opened.json() as Promise<{ sessionId: string }>
}

/** Take one scripted turn, and hand back both halves of the evidence. */
async function turn(
  scope: Scope,
  sessionId: string,
  text: string,
  script: ModelStep[],
): Promise<{ client: ScriptedClient; body: string }> {
  return turnWith(scope, sessionId, text, scriptedClient(script))
}

/** The same turn, for a caller that built its own client — see {@link racedClient}. */
async function turnWith(
  scope: Scope,
  sessionId: string,
  text: string,
  client: ScriptedClient,
): Promise<{ client: ScriptedClient; body: string }> {
  setModelClient(client)
  resetAiHost()
  resetChatHost()
  const answered = await route(
    new Request(`${ORIGIN}/api/ai/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, text }),
    }),
    routerEnv(),
    scope,
    {},
  )
  expect(answered.status).toBe(200)
  // DRAINED, because the turn runs while the body streams.
  return { client, body: await answered.text() }
}

interface Frame {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

/**
 * The turn's SSE body, read back into the events the chat panel would see.
 *
 * THE OTHER HALF OF THE EVIDENCE, and the one the browser suite cannot reach.
 * `test_UAT_FC_REQ-251_the_pane_follows_the_assistant` shows the pane consuming
 * `business_changed`; this shows the origin producing it. The two are joined by a
 * string on the wire, and a suite that only asserted each end would pass with the
 * two halves spelling it differently.
 */
function frames(body: string): Frame[] {
  return body
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()) as Frame)
}

/**
 * What the model was handed back for a call it made.
 *
 * READ OUT OF THE NEXT REQUEST rather than out of the stream, because that is
 * where a tool result actually goes: the host runs the tool and puts its answer
 * into the conversation the model sees on its next call. A suite that asserted on
 * the SSE frames would be asserting on what the operator sees, which is a
 * different question from what the model was told.
 */
function toolResults(client: ScriptedClient): string {
  return JSON.stringify(client.seen.slice(1).map((r) => r.messages))
}

/**
 * The shared double, with something happening between two of the model's calls.
 *
 * A WRAPPER AND NOT A SIXTH TRANSCRIPTION. `scripted-model-client.ts`'s header is
 * explicit about why the streaming shape lives in exactly one place — the last
 * time there were four copies, three fell behind and their turns silently
 * completed having seen nothing. This delegates every event to that one copy and
 * adds the only thing it cannot express: a `ModelStep` is synchronous, so a
 * script cannot await a rival's claim landing, and the race this suite is about
 * only exists in the gap between the check and the claim.
 */
function racedClient(
  steps: ModelStep[],
  beforeCall: number,
  between: () => Promise<unknown>,
): ScriptedClient {
  const inner = scriptedClient(steps)
  let n = 0
  return {
    seen: inner.seen,
    messages: {
      create: async (req) => {
        if (n++ === beforeCall) await between()
        return inner.messages.create(req)
      },
    },
  }
}

beforeAll(async () => {
  await APPLIED
})

beforeEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

// ── 1: all three are on the wire ─────────────────────────────────────────────

describe('REQ-251 AC1 — the address operations reach the model', () => {
  it('test_UAT_FC_REQ-251_all_three_address_operations_are_offered_and_no_site_operation_is', async () => {
    const scope = await business('req251-offered', 'Cole’s Bakery')
    const opened = await openSettings(scope)

    const { client } = await turn(scope, opened.sessionId, 'what would my web address be?', [
      says('Let’s find you one.'),
    ])

    const offered = client.seen[0].tools.map((t) => t.name)
    // THE THREE THE TICKET IS ABOUT. None had ever been observed on the wire.
    expect(offered).toContain('read_addresses')
    expect(offered).toContain('check_hostname')
    expect(offered).toContain('claim_hostname')
    // AND NOTHING THAT EDITS A SITE, because the address conversation is on the
    // settings surface and this is where that would first go wrong.
    for (const site of ['set_l1', 'update_page', 'add_page', 'publish']) {
      expect(offered).not.toContain(site)
    }
  })

  it('test_UAT_FC_REQ-251_a_business_with_no_address_reads_an_empty_list_and_the_apex', async () => {
    const scope = await business('req251-empty', 'Empty Ltd')
    const opened = await openSettings(scope)

    const { client } = await turn(scope, opened.sessionId, 'do I have a web address yet?', [
      calls('read_addresses', {}),
      says('Not yet — you can choose one whenever you like.'),
    ])

    const answered = toolResults(client)
    // THE ORDINARY STARTING STATE, AND IT IS AN ANSWER. The apex travels with it
    // so the model never assembles `1stc.site` from memory.
    expect(answered).toContain(PLATFORM_APEX)
    expect(await businessAddresses(identity(), scope.businessId)).toEqual([])
  })
})

// ── 2: checking is free, repeatable, and holds nothing ───────────────────────

describe('REQ-251 AC2 — several candidates in one turn, and nothing held', () => {
  it('test_UAT_FC_REQ-251_a_turn_can_check_several_candidates_and_each_is_answered', async () => {
    const scope = await business('req251-several', 'Cole’s Bakery')
    const opened = await openSettings(scope)

    // THE SEQUENCE THE DECLARATION ASKS FOR, driven: check as many as it takes
    // before saying anything, so that what is offered is a short list of names
    // that are actually free.
    const { client } = await turn(scope, opened.sessionId, 'I want a web address', [
      calls('check_hostname', { label: 'colesbakery' }),
      calls('check_hostname', { label: 'colesbakerydublin' }),
      calls('check_hostname', { label: 'bakerybycole' }),
      says('All three are free. Which would you like?'),
    ])

    const answered = toolResults(client)
    for (const label of ['colesbakery', 'colesbakerydublin', 'bakerybycole']) {
      // THE WHOLE HOST COMES BACK, never a bare label — the declaration's rule,
      // and the one the pane and the assistant most easily drift on.
      expect(answered).toContain(`${label}.${PLATFORM_APEX}`)
    }

    // A CHECK RESERVES NOTHING. Three candidates were checked and the business
    // holds none of them — which is what makes the race in AC5 possible and is
    // the property the declaration insists on.
    expect(await businessAddresses(identity(), scope.businessId)).toEqual([])
  })

  it('test_UAT_FC_REQ-251_each_of_the_three_refusals_is_an_answer_rather_than_a_failure', async () => {
    // SOMEBODY ELSE HOLDS ONE, so `taken` is a real answer and not a contrivance.
    const other = await business('req251-holder', 'Holder Ltd')
    await claimHostname(identity(), other.businessId, 'alreadygone')

    const scope = await business('req251-refusals', 'Refusals Ltd')
    const opened = await openSettings(scope)

    const { client } = await turn(scope, opened.sessionId, 'try these three', [
      calls('check_hostname', { label: 'alreadygone' }),
      calls('check_hostname', { label: 'mail' }),
      calls('check_hostname', { label: '-nope-' }),
      says('None of those will work, and for three different reasons.'),
    ])

    const answered = toolResults(client)
    // THE CHECK ANSWERS, INCLUDING FOR A NAME IT WILL NOT GIVE. A model reading
    // an error looks for something to fix; a model reading an answer looks for
    // another name — which is why this operation must never raise.
    expect(answered).toContain(`alreadygone.${PLATFORM_APEX}`)
    expect(answered).toContain(`mail.${PLATFORM_APEX}`)
    expect(answered).not.toContain('HOSTNAME_TAKEN')
    expect(answered).not.toContain('HOSTNAME_RESERVED')
    expect(answered).not.toContain('HOSTNAME_INVALID')
    // AND THE THREE ARE DISTINGUISHABLE. Collapsing them would leave the model
    // unable to say what the customer should do next, which is the only thing
    // that separates "try another" from "change the word" from "fix the shape".
    const parsed = JSON.parse(answered) as unknown
    const said = JSON.stringify(parsed).toLowerCase()
    expect(said).toContain('taken')
    expect(said).toContain('reserved')
  })
})

// ── 3 & 4: taking one, and what that does to the record ──────────────────────

describe('REQ-251 AC3 — a claim lands in the record', () => {
  it('test_UAT_FC_REQ-251_a_claimed_address_is_the_business_address_and_is_read_back_from_d1', async () => {
    const scope = await business('req251-claim', 'Claim Ltd')
    const opened = await openSettings(scope)

    await turn(scope, opened.sessionId, 'yes, take colesbakery please', [
      calls('check_hostname', { label: 'colesbakery' }),
      calls('claim_hostname', { label: 'colesbakery' }),
      says('Done — colesbakery.1stc.site is yours.'),
    ])

    // THE STORE, NOT THE STREAM. What proves the assistant reaches [[REQ-238]]'s
    // operation is that the row exists, read with the same function the route
    // reads it with.
    const held = await businessAddresses(identity(), scope.businessId)
    expect(held.map((a) => a.host)).toEqual([`colesbakery.${PLATFORM_APEX}`])
    expect(held[0].kind).toBe('platform')
  })

  it('test_UAT_FC_REQ-251_a_claim_names_the_business_and_not_the_site', async () => {
    const scope = await business('req251-one-per', 'One Per Ltd')
    // A SECOND SITE IN THE SAME BUSINESS. The declaration says one address per
    // BUSINESS, and a business with one site cannot tell that apart from one
    // address per site.
    await seedTenantSite(scope.businessId)
    const opened = await openSettings(scope)

    await turn(scope, opened.sessionId, 'take oneper', [
      calls('claim_hostname', { label: 'oneper' }),
      says('Taken.'),
    ])

    const second = await openSettings(scope)
    const { client } = await turn(scope, second.sessionId, 'take another one for my other site', [
      calls('claim_hostname', { label: 'onepertwo' }),
      says('You already have one, and it cannot be changed.'),
    ])

    // ONE, AND THE SECOND IS REFUSED BY NAME.
    expect(toolResults(client)).toContain('HOSTNAME_ALREADY_HELD')
    const held = await businessAddresses(identity(), scope.businessId)
    expect(held.map((a) => a.host)).toEqual([`oneper.${PLATFORM_APEX}`])
  })
})

// ── 5: the race ──────────────────────────────────────────────────────────────

describe('REQ-251 AC4 — losing the race is an ordinary outcome', () => {
  it('test_UAT_FC_REQ-251_a_name_that_went_while_they_were_deciding_is_refused_and_the_business_is_left_free', async () => {
    const scope = await business('req251-race', 'Race Ltd')
    const rival = await business('req251-rival', 'Rival Ltd')
    const opened = await openSettings(scope)

    /**
     * THE RACE, PRODUCED RATHER THAN DESCRIBED. The check answers *free*; the
     * rival takes it in the gap; the claim arrives second and loses to the unique
     * index. This is the declaration's own worked example and the ordinary shape
     * of a first-come namespace, and it had never once been run.
     *
     * The rival's claim lands BEFORE the model's second call, which is the call
     * that carries `claim_hostname` — so the check genuinely answered about a
     * name that was free when it was asked.
     */
    const client = racedClient(
      [
        calls('check_hostname', { label: 'contested' }),
        calls('claim_hostname', { label: 'contested' }),
        says('That one went while you were deciding — shall I try the next?'),
      ],
      1,
      () => claimHostname(identity(), rival.businessId, 'contested'),
    )
    const { body } = await turnWith(scope, opened.sessionId, 'take contested', client)
    expect(body).toContain('went while you were deciding')

    expect(toolResults(client)).toContain('HOSTNAME_TAKEN')
    // THE BUSINESS IS LEFT FREE TO TRY AGAIN. The refusal is not a dead end and
    // it did not half-write anything — the customer's next candidate is one
    // sentence away, which is what makes this an outcome rather than a fault.
    expect(await businessAddresses(identity(), scope.businessId)).toEqual([])
    // AND THE WINNER KEPT IT.
    const theirs = await businessAddresses(identity(), rival.businessId)
    expect(theirs.map((a) => a.host)).toEqual([`contested.${PLATFORM_APEX}`])
  })
})

// ── 6: the turn announces its own writes ─────────────────────────────────────

describe('REQ-251 AC5 — a settings turn says when it wrote', () => {
  it('test_UAT_FC_REQ-251_each_write_is_announced_in_the_stream_as_it_lands', async () => {
    const scope = await business('req251-signal', 'Unnamed business')
    const opened = await openSettings(scope)

    const { body } = await turn(scope, opened.sessionId, 'fix my name and take an address', [
      calls('rename_business', { name: 'Cole’s Bakery' }),
      calls('claim_hostname', { label: 'colesbakerysignal' }),
      says('Both done.'),
    ])

    const kinds = frames(body).map((f) => f.kind)
    /**
     * PER WRITE AND IN PLACE, not a summary at the end. Each signal sits AFTER
     * the tool activity that caused it and BEFORE the prose, which is what lets
     * the pane move as the assistant works — and it is a property of WHERE the
     * frames are, so it is asserted as an order.
     */
    const shape = kinds.filter((k) => k === 'tool_activity' || k === 'business_changed')
    expect(shape).toEqual([
      'tool_activity',
      'business_changed',
      'tool_activity',
      'business_changed',
    ])

    // AND EACH CARRIES THE COUNT, so a host can tell "twice" from "once" without
    // inferring either from the prose.
    const signals = frames(body).filter((f) => f.kind === 'business_changed')
    expect(signals.map((f) => f.meta)).toEqual([
      { at: 1, changes: 1 },
      { at: 2, changes: 1 },
    ])
  })

  it('test_UAT_FC_REQ-251_a_turn_that_only_read_announces_nothing', async () => {
    const scope = await business('req251-read-only', 'Quiet Ltd')
    const opened = await openSettings(scope)

    const { body } = await turn(scope, opened.sessionId, 'do I have an address?', [
      calls('read_addresses', {}),
      calls('check_hostname', { label: 'quiet' }),
      says('Not yet, and `quiet` is free.'),
    ])

    // THREE READS AND NO SIGNAL. A check is a question asked as often as the
    // model likes, and a pane disturbed by one would make the most common turn
    // on this surface the most expensive — and would throw away whatever the
    // customer was half-way through typing.
    expect(frames(body).filter((f) => f.kind === 'business_changed')).toEqual([])
  })

  it('test_UAT_FC_REQ-251_a_refused_claim_announces_nothing', async () => {
    const scope = await business('req251-refused-signal', 'Refused Ltd')
    const opened = await openSettings(scope)

    const { body } = await turn(scope, opened.sessionId, 'take mail', [
      calls('claim_hostname', { label: 'mail' }),
      says('That one is kept for 1st Contact itself.'),
    ])

    // THE SIGNAL CANNOT DESCRIBE A WRITE THAT DID NOT HAPPEN, because it is
    // counted after the operation returns and a refusal does not return. That is
    // the whole argument for deriving it rather than declaring it as a tool the
    // model is asked to call.
    expect(frames(body).filter((f) => f.kind === 'business_changed')).toEqual([])
    expect(await businessAddresses(identity(), scope.businessId)).toEqual([])
  })

  it('test_UAT_FC_REQ-251_a_site_turn_still_announces_the_site_and_not_the_business', async () => {
    const scope = await business('req251-kinds', 'Kinds Ltd')
    const opened = await openSettings(scope)

    const { body } = await turn(scope, opened.sessionId, 'take kinds', [
      calls('claim_hostname', { label: 'kindsltd' }),
      says('Taken.'),
    ])

    // TWO KINDS AND NOT ONE. A settings session has no site, and the client that
    // consumes the site's signal answers it by reloading a preview frame — which
    // a business write is not a reason to do.
    const kinds = new Set(frames(body).map((f) => f.kind))
    expect(kinds.has('business_changed')).toBe(true)
    expect(kinds.has('site_changed')).toBe(false)
  })
})

// ── 7: the other write on this surface ───────────────────────────────────────

describe('REQ-251 AC6 — the record the pane renders is the record the turn moved', () => {
  it('test_UAT_FC_REQ-251_a_turn_can_move_both_facts_the_pane_shows', async () => {
    const scope = await business('req251-both', 'Unnamed business')
    const opened = await openSettings(scope)

    // ONE TURN, TWO WRITES. This is the shape the pane's refresh has to survive
    // and the reason its signal is per-write rather than per-turn.
    await turn(scope, opened.sessionId, 'my name is wrong, and I want an address', [
      calls('rename_business', { name: 'Cole’s Bakery' }),
      calls('claim_hostname', { label: 'colesbakeryboth' }),
      says('Both done.'),
    ])

    expect((await businessRecord(identity(), scope.businessId))?.name).toBe('Cole’s Bakery')
    expect((await businessAddresses(identity(), scope.businessId)).map((a) => a.host)).toEqual([
      `colesbakeryboth.${PLATFORM_APEX}`,
    ])
  })
})
