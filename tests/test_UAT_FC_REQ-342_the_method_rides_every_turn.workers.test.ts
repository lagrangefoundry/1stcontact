import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import {
  delegationMethod,
  delegationReminder,
  primingText,
} from '../tools/generate/src/cli/ai/roles'
import {
  says,
  scriptedClient,
  systemText,
  turnTailText,
  type ModelRequest,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-342]] — **the standing instruction is in the tail of every turn**.
 *
 * THE SIBLING NODE SUITE SETTLES THE WORDS; this one settles the POSITION, and
 * the position is the whole ticket. DOC-60 §F4's finding is not that the method
 * was badly written — it is that the method was written once, in
 * `priming.json`'s first tier, which upstream marks cacheable and sends ahead of
 * the conversation. By the end of a sitting it is roughly 186k of prefix behind
 * the model. `act-rather-than-narrate` has always ridden the per-turn tail
 * instead, because a single line that must not decay is worth re-sending, and
 * commissioning construction is exactly that kind of line.
 *
 * "In the tail" is a claim about a FIELD, and it has moved once already:
 * [[BUG-83]] took the reminder out of `system` and appended it to the last user
 * message, so that no cache marker lands on a block guaranteed to differ next
 * turn. Eleven assertions across seven suites went red together. So these cases
 * read the two halves separately — {@link systemText} for the cached prefix and
 * {@link turnTailText} for what is re-sent — rather than through the
 * `sentText` reader that answers merely *was the model told this*, which is the
 * one question this suite is not asking.
 *
 * EVERY CASE DRIVES THE REAL ROUTE INSIDE WORKERD: `POST /api/ai/prompt`, the
 * real session manager, the real role assembly out of the shared store, the real
 * backend and its real request build. The one double is the Anthropic client —
 * it is the network — and it is the shared one, so what is asserted on is the
 * request production would have put on the wire.
 */

const TENANT = 'req342'

/** The switch as it ships, turned on — what a commissioning deployment installs. */
const ENABLED = { ...delegationDocument, enabled: true }

/** The rollback, installed explicitly because the bundled document ships ON. */
const DISABLED = { ...delegationDocument, enabled: false }

/** The words, read off what ships rather than restated. */
const METHOD = delegationMethod(true) as string
const STANDING_LINE = delegationReminder(true) as string

/** The tail's other standing line — the precedent this ticket cites, and the
 * neighbour a dropped entry must not take with it. */
const NEIGHBOUR = primingText('act-rather-than-narrate')

function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  } as unknown as Env
}

const post = (path: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
    undefined,
  )

async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

async function openSession(prefix: string): Promise<string> {
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(prefix) })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return ((await opened.json()) as { sessionId: string }).sessionId
}

/** Take a turn, and hand back what the model was sent for it. */
async function turn(sessionId: string, text: string, reply: string): Promise<ModelRequest> {
  const client = scriptedClient([says(reply)])
  setModelClient(client)
  await drain(await post('/api/ai/prompt', { sessionId, text }))
  expect(client.seen.length).toBeGreaterThan(0)
  return client.seen[client.seen.length - 1]
}

describe('REQ-342 — commissioning is said again on every turn', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    // The switch goes back, and the managers with it: a manager composes the
    // delegation surface when its Toolbox is built and holds it for its life.
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_REQ-342_the_standing_instruction_is_in_the_tail_of_a_turn_and_not_in_the_prefix', async () => {
    // BEHAVIOUR 4. The tail is the field that is re-assembled and re-sent on
    // every turn; the prefix is the field that is sent once and cached. An
    // instruction that must survive a long sitting has to be in the first, and
    // this is the assertion that says which one it actually landed in.
    configureDelegation(ENABLED)
    const sessionId = await openSession('tail')

    const request = await turn(sessionId, 'How does the About page look?', 'Fine as it stands.')

    expect(turnTailText(request)).toContain(STANDING_LINE)
    expect(systemText(request)).not.toContain(STANDING_LINE)
  })

  it('test_UAT_FC_REQ-342_the_method_stays_in_the_cached_prefix_and_the_tail_carries_one_line', async () => {
    // BEHAVIOUR 4's constraint, on the wire. The tail is paid for on every turn,
    // so it carries the standing instruction and NOT the method — the cheap fix
    // for F4 would have been to bind the tail entry to the method's own provider,
    // and that would have put two thousand characters on every turn for the life
    // of an engagement.
    configureDelegation(ENABLED)
    const sessionId = await openSession('prefix')

    const request = await turn(sessionId, 'Anything to do here?', 'Nothing pressing.')

    expect(systemText(request)).toContain(METHOD)
    expect(turnTailText(request)).not.toContain(METHOD)
  })

  it('test_UAT_FC_REQ-342_the_instruction_is_there_again_on_a_later_turn', async () => {
    // THE CLAIM THE TICKET ACTUALLY MAKES — that the method survives a sitting —
    // and the one a single-turn assertion cannot make. The priming tier is
    // assembled once per session; the reminder tier is assembled per turn, and
    // this is what tells the two apart.
    configureDelegation(ENABLED)
    const sessionId = await openSession('later')

    await turn(sessionId, 'Start me off.', 'Started.')
    const second = await turn(sessionId, 'And now the About page.', 'On it.')

    expect(turnTailText(second)).toContain(STANDING_LINE)
    // …and the prefix has not been rewritten to carry it, which would have cost
    // the cached prefix on every turn — the defect EPIC-20 exists to have fixed.
    expect(systemText(second)).not.toContain(STANDING_LINE)
  })

  it('test_UAT_FC_REQ-342_a_deployment_that_commissions_nothing_gets_neither_half', async () => {
    // BEHAVIOUR 4's last sentence, on the wire. With the surface never composed
    // there is no `delegate` tool, so an instruction to commission is an
    // instruction to reach for a capability the session has not got — and in the
    // tail it would be that instruction repeated on every turn. Both providers
    // render `null`, which drops each entry and its separator.
    configureDelegation(DISABLED)
    const sessionId = await openSession('off')

    const request = await turn(sessionId, 'How does it look?', 'Looks fine to me.')

    expect(turnTailText(request)).not.toContain(STANDING_LINE)
    expect(systemText(request)).not.toContain(METHOD)
    // The other lines in the tail are untouched: dropping an entry must not drop
    // the tier around it.
    expect(turnTailText(request)).toContain(NEIGHBOUR)
  })
})
