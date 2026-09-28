import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { L1_DECLARATION } from '../tools/generate/src/cli/ai/toolbox-core'
import {
  says,
  scriptedClient,
  sentText,
  systemText,
  turnTailText,
  type ModelRequest,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-343]] — **the consultant stops writing L1**, inside the real Worker.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the route a customer's turn drives:
 * `POST /api/ai/prompt`, the real session manager, the real Toolbox composed out of
 * the shared store, the real grant narrowing and the real priming assembly. What
 * it reads is the TOOL LIST THE MODEL WAS OFFERED and the prompt it was sent — not
 * a grant object on the way past — because the ticket's first behaviour is about
 * what the consultant can do, and a grant that narrowed while the surface went on
 * offering the tool would pass a test of the grant and fail a customer. The one
 * double is the Anthropic client, which is the network.
 *
 * THE SIBLING NODE SUITE settles the key, its refusals and the derivation. These
 * four cases are the ones that can only be answered by a composed session:
 *
 *   1. shipped — the consultant is offered every read and no write, and `delegate`;
 *   2. the prose it is sent describes commissioning rather than a choice;
 *   3. `primary_writes: true` puts every write tool back — the flip-back;
 *   4. and the two ways delegation can be absent BOTH leave it its hands, so a
 *      session that can neither write nor delegate is unreachable.
 *
 * NOTHING ABOUT THE SURFACE IS RESTATED. Which tools are writes is read out of the
 * declaration, so a tool added upstream is covered here without an edit.
 */

const TENANT = 'req343'

/** The switch as it ships: delegation on, and the consultant no longer writing. */
const SHIPPED = delegationDocument

/** The flip-back — the one edit that restores the consultant's hands. */
const WRITING = { ...delegationDocument, primary_writes: true }

/** The delegation rollback, which must still take the consultant's hands with it. */
const DISABLED = { ...delegationDocument, enabled: false }

/**
 * ON, BUT WITH NOTHING TO COMMISSION — the second way the surface can be absent.
 *
 * This is the configuration a narrowing tied to `enabled` alone would strand: the
 * switch says delegate, no worker role is bound, so no surface is composed and no
 * `delegate` tool exists. A consultant narrowed on `enabled` would have neither
 * hands nor anyone to ask.
 */
const NO_WORKERS = { ...delegationDocument, workers: {} }

/** The model-facing name of the operation that hands work over. */
const DELEGATE_TOOL = 'Delegate'

/** Tool names the declaration groups under a WRITE, and under a READ. */
function toolsByEffect(effect: 'read' | 'write'): string[] {
  const groups = L1_DECLARATION.groups as Array<{
    group: string
    effect: string
    operations: string[]
  }>
  const operations = L1_DECLARATION.operations as Array<{ op: string; tool: string }>
  const named = new Map(operations.map((entry) => [entry.op, entry.tool]))
  return groups
    .filter((group) => group.effect === effect)
    .flatMap((group) => group.operations)
    .map((op) => named.get(op) ?? op)
}

/**
 * The write tools the CONSULTANT could ever have been offered.
 *
 * `ManageAssets` and `Publish` are declared writes the consultant was never
 * granted — they were never in its grant and their absence says nothing about this
 * ticket — so the set this asserts against is the declaration's writes intersected
 * with what a writing deployment actually offers. That intersection is computed in
 * case 3 from a real turn rather than listed here.
 */
const WRITE_TOOLS = toolsByEffect('write')
const READ_TOOLS = toolsByEffect('read')

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
    undefined as unknown as ExecutionContext,
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

/** The tools a request offered, by name. */
function toolNames(req: ModelRequest): string[] {
  return req.tools.map((tool) => tool.name).sort()
}

/** One turn under `document`, and the request the consultant's model received. */
async function turnUnder(document: unknown, prefix: string): Promise<ModelRequest> {
  configureDelegation(document)
  resetAiHost()
  resetChatHost()
  const sessionId = await openSession(prefix)
  const client = scriptedClient([says('Looks fine to me.')])
  setModelClient(client)
  await drain(await post('/api/ai/prompt', { sessionId, text: 'How does it look?' }))
  const request = client.seen[0]
  expect(request).toBeDefined()
  return request
}

describe('REQ-343 — the consultant reads the whole site and writes no part of it', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    // THE DOCUMENT GOES BACK, and the managers with it: a manager composes its
    // Toolbox once and holds the grant for its life, so a cached one would carry
    // the previous case's answer.
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  // ── behaviour 1 ────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-343_the_consultant_is_offered_every_read_and_no_write', async () => {
    // "The consultant can read the whole site and write no part of its L1. It
    // keeps every read, every measurement and every camera; it loses the
    // authority to replace an element, author a page, write configuration or
    // change the palette." Read off the wire: this is the tool list the model was
    // actually handed under the document as it ships.
    const offered = toolNames(await turnUnder(SHIPPED, 'shipped'))

    for (const tool of WRITE_TOOLS) expect(offered).not.toContain(tool)
    for (const tool of READ_TOOLS) expect(offered).toContain(tool)
    // Named once, because the ticket names them.
    expect(offered).not.toContain('set_l1')
    expect(offered).not.toContain('add_page')
    expect(offered).not.toContain('set_config')
    expect(offered).not.toContain('set_palette_color')
    expect(offered).not.toContain('write_image')
    expect(offered).toContain('get_l1')
    expect(offered).toContain('measure_drawing')

    // ── behaviour 2 ──────────────────────────────────────────────────────────
    //
    // "Construction is commissioned. The consultant's route to a change in the
    // site is a brief to a worker and nothing else." The route exists, which is
    // the half that makes the first one liveable.
    expect(offered).toContain(DELEGATE_TOOL)
  })

  it('test_UAT_FC_REQ-343_the_prose_it_is_sent_describes_commissioning_and_not_a_choice', async () => {
    // The prose follows the grant, because a session told to weigh handing work
    // over against doing it itself — holding no write group — will offer the side
    // it has not got, apologise for it, or probe for it.
    const request = await turnUnder(SHIPPED, 'prose')
    const primed = systemText(request)

    expect(primed).toContain('Commissioning construction')
    expect(primed).toContain('commissioned here, not performed')
    // The framing that would be false is GONE rather than outweighed.
    expect(primed).not.toContain('choosing between them is yours')
    // …and the method behind it still arrived: how to brief, and what to check.
    expect(primed).toContain('Write the brief')
    // AND THE STANDING LINE IN THE TAIL AGREES WITH IT ([[REQ-342]] put it there,
    // and it is re-sent on every turn, so a tail against the grant is the
    // contradiction that would repeat for the life of the engagement). Read off
    // the TAIL and not the prefix, because that is the field it rides — see the
    // REQ-342 suite's header for why the two halves are read separately.
    expect(turnTailText(request)).toContain('Construction is commissioned, not performed')
    expect(sentText(request)).not.toContain('set_l1')
  })

  // ── behaviour 4: the flip-back ─────────────────────────────────────────────

  it('test_UAT_FC_REQ-343_primary_writes_true_puts_every_write_tool_back', async () => {
    // "Flipping it back is one edit." One key, one redeploy — and what comes back
    // is the grant `instances.json` still states, which is why nothing had to
    // remember what was taken away.
    const narrowed = toolNames(await turnUnder(SHIPPED, 'back-narrowed'))
    const writing = toolNames(await turnUnder(WRITING, 'back-writing'))

    // Every write tool this deployment can offer at all comes back…
    const restored = writing.filter((tool) => WRITE_TOOLS.includes(tool))
    expect(restored.length).toBeGreaterThan(0)
    for (const tool of restored) expect(narrowed).not.toContain(tool)
    // …and nothing the narrowed session had is lost: it is the same set plus the
    // writes, which is what makes this a flip-back rather than a third state.
    for (const tool of narrowed) expect(writing).toContain(tool)
    // The route to a worker is still there either way — the key moves the hands,
    // not the delegation.
    expect(writing).toContain(DELEGATE_TOOL)
    // AND THE PROSE COMES BACK WITH THE GRANT — both halves of it: the framing
    // stated once at priming, and the standing line the tail repeats every turn.
    const back = await turnUnder(WRITING, 'back-prose')
    expect(systemText(back)).toContain('choosing between them is yours')
    expect(systemText(back)).not.toContain('commissioned here, not performed')
    expect(turnTailText(back)).not.toContain('Construction is commissioned, not performed')
    expect(turnTailText(back)).toContain('Hand building work over')
  })

  // ── behaviour 3: the rollback still works ──────────────────────────────────

  it('test_UAT_FC_REQ-343_turning_delegation_off_leaves_the_consultant_its_hands', async () => {
    // "With delegation disabled in configuration the surface is not composed at
    // all, so this ticket must not leave a state in which the consultant can
    // neither write nor delegate. Turning delegation off must remain a true
    // rollback." So `enabled: false` dominates the second key: the consultant
    // gets its whole grant back and no `delegate`, which is what this repository
    // was before delegation existed.
    const offered = toolNames(await turnUnder(DISABLED, 'rollback'))

    expect(offered).not.toContain(DELEGATE_TOOL)
    expect(offered).toContain('set_l1')
    expect(offered).toContain('add_page')
    expect(offered).toContain('set_config')
    expect(offered).toContain('set_palette_color')
    expect(offered).toContain('write_image')
    // And no prose about a tool it has not got.
    expect(sentText(await turnUnder(DISABLED, 'rollback-prose'))).not.toContain(
      'Handing construction over',
    )
  })

  it('test_UAT_FC_REQ-343_a_switch_on_with_no_worker_bound_also_leaves_it_its_hands', async () => {
    // THE OTHER WAY THE SURFACE CAN BE ABSENT, and the reason the narrowing is
    // tied to the composed runtime rather than to `enabled`. Here the switch says
    // delegate and no worker role is bound, so there is nothing to commission —
    // and a consultant narrowed on `enabled` alone would have neither hands nor
    // anyone to ask. There is no reachable configuration of these two keys that
    // produces that deployment.
    const offered = toolNames(await turnUnder(NO_WORKERS, 'no-workers'))

    expect(offered).not.toContain(DELEGATE_TOOL)
    expect(offered).toContain('set_l1')
    expect(offered).toContain('add_page')
  })
})
