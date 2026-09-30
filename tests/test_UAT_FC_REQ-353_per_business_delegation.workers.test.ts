import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  NETWORK_DELEGATION_PATH,
  resetChatHost,
  route,
  type RouterEnv,
} from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { L1_DECLARATION } from '../tools/generate/src/cli/ai/toolbox-core'
import { delegationMethod } from '../tools/generate/src/cli/ai/roles'
import {
  says,
  scriptedClient,
  sentText,
  type ModelRequest,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-353]] — **the switch is per business, and it is real**, inside the real
 * Worker.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the routes a request drives —
 * `GET`/`POST /api/network/delegation`, `POST /api/ai/session`, `POST
 * /api/ai/prompt` — through the same `route` the Worker's own `fetch` calls,
 * against a real D1 whose `business_network_settings` table comes from the
 * MIGRATION rather than from a fixture's idea of it. What the cases read for
 * evidence is the TOOL LIST THE MODEL WAS OFFERED and the prompt it was sent, not
 * a settings object on the way past: a value that resolved correctly while the
 * surface went on offering `Delegate` would pass a test of the resolution and
 * fail a customer. The one double is the Anthropic client, which is the network.
 *
 * IT ADDRESSES TWO BUSINESSES THROUGH TWO EXPLICIT SCOPES, the way the [[REQ-168]]
 * suite does, because that is the only way to construct the state the ticket's
 * sixth condition is about: one isolate, two businesses, one of them flipped. The
 * loopback dev-open branch ignores a `/b/<id>` target by design, so a prefixed
 * request could not have told the two apart.
 *
 * THE CONDITIONS THESE CASES SETTLE:
 *
 *   3. with nothing stored, the host composes exactly what it composes today —
 *      and the route says the value is inherited rather than chosen;
 *   4. off, then a NEW session for that business: no `Delegate`, no method
 *      prose, and the consultant's write groups restored;
 *   5. on again, and the deployment's arrangement is back;
 *   6. a second business, untouched, is unaffected by either flip;
 *   7. a malformed stored value is refused when the host is built, naming the
 *      business and the offending key — not at the first delegation in a
 *      customer's conversation;
 *   and the value SURVIVES, which is the whole reason it is a table.
 *
 * NOTHING ABOUT THE SURFACE IS RESTATED. Which tools are writes is read out of
 * the declaration and the method heading out of the template, so a tool added or
 * an entry reworded upstream is covered here without an edit — and a case cannot
 * quietly become an assertion about a string the repository no longer contains.
 */

/** Two businesses, and they are two tenants — the scope IS the tenant here. */
const FIRST = 'req353-first'
const SECOND = 'req353-second'

/** The model-facing name of the operation that hands work over. */
const DELEGATE_TOOL = 'Delegate'

/** The method entry's own heading, read off the words that ship ([[REQ-342]]). */
const METHOD_HEADING = (delegationMethod(true) as string).split('\n')[0]

/** Tool names the declaration groups under a WRITE, and under a READ. */
function toolsByEffect(effect: 'read' | 'write'): string[] {
  const groups = L1_DECLARATION.groups as Array<{ effect: string; operations: string[] }>
  const operations = L1_DECLARATION.operations as Array<{ op: string; tool: string }>
  const named = new Map(operations.map((entry) => [entry.op, entry.tool]))
  return groups
    .filter((group) => group.effect === effect)
    .flatMap((group) => group.operations)
    .map((op) => named.get(op) ?? op)
}

const WRITE_TOOLS = toolsByEffect('write')
const READ_TOOLS = toolsByEffect('read')

/**
 * The write tools the CONSULTANT could ever have been offered.
 *
 * `ManageAssets` and `Publish` are declared writes the consultant was never
 * granted — [[REQ-343]]'s suite makes the same point one file over — so the set
 * that matters here is the declaration's writes intersected with what a
 * delegating-off deployment actually offers. That intersection is COMPUTED from
 * two real turns in the case below rather than listed, so a tool added or
 * re-granted upstream is covered without an edit here.
 *
 * The four named below are the ones [[REQ-343]] names in prose, asserted by name
 * because a set-difference that happened to be empty would satisfy every claim
 * about it.
 */
const NAMED_WRITES = ['set_l1', 'add_page', 'set_config', 'set_palette_color']

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: FIRST,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  } as unknown as RouterEnv
}

const scopeOf = (businessId: string): Scope => ({ businessId })

const ask = (
  businessId: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> =>
  route(
    new Request(`https://app.example${path}`, init),
    routerEnv(),
    scopeOf(businessId),
    {},
    undefined as never,
  )

const post = (businessId: string, path: string, body: unknown): Promise<Response> =>
  ask(businessId, path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

/** What the delegation route answers — the three values the tab draws from. */
interface DelegationView {
  delegateToolCalls: boolean
  stored: boolean | null
  deployment: boolean
}

async function readSetting(businessId: string): Promise<DelegationView> {
  const response = await ask(businessId, NETWORK_DELEGATION_PATH)
  expect(response.status).toBe(200)
  return (await response.json()) as DelegationView
}

async function setSetting(businessId: string, enabled: boolean): Promise<DelegationView> {
  const response = await post(businessId, NETWORK_DELEGATION_PATH, { enabled })
  expect(response.status).toBe(200)
  return (await response.json()) as DelegationView
}

/**
 * Open a NEW session for a business and take one turn, handing back the request
 * the consultant's model received.
 *
 * A NEW SITE PER CALL, so every observation is of a session composed AFTER
 * whatever the case just wrote. That is the semantics the ticket states — a flip
 * reaches the business's next session, because a manager holds its backend for
 * its whole life — and a helper that reused a site would be asserting against the
 * manager the previous half of the case built.
 */
async function turnFor(businessId: string, prefix: string): Promise<ModelRequest> {
  const { site } = await seedTenantSite(businessId, { slug: nextSlug(prefix) })
  const opened = await post(businessId, '/api/ai/session', { site })
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const client = scriptedClient([says('Looks fine to me.')])
  setModelClient(client)
  await drain(await post(businessId, '/api/ai/prompt', { sessionId, text: 'How does it look?' }))
  const request = client.seen[0]
  expect(request, 'the consultant took a turn').toBeDefined()
  return request
}

/** The tools a request offered, by name. */
const toolNames = (req: ModelRequest): string[] => req.tools.map((tool) => tool.name).sort()

describe('REQ-353 — a business decides whether its consultant delegates', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(async () => {
    setModelClient(null)
    // THE ROW GOES BACK, and the hosts with it. A manager composes the delegation
    // surface once and holds it for its life, so a cached one would carry the
    // previous case's answer — which is the very staleness the ticket names as the
    // semantics and which a suite must not mistake for the value.
    await env.DB.prepare('DELETE FROM business_network_settings').run()
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  // ── condition 3 ────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-353_a_business_with_nothing_stored_inherits_the_deployment_and_composes_what_it_composes_today', async () => {
    // THE WHOLE SAFETY PROPERTY OF SHIPPING THIS. A business nobody has touched
    // must be indistinguishable from the same business before the table existed,
    // so the route reports the deployment's own value as INHERITED rather than as
    // a decision, and the session composes the shipped arrangement: `Delegate`
    // present, and — since [[REQ-343]] — the consultant holding no write groups.
    const view = await readSetting(FIRST)
    expect(view).toEqual({
      delegateToolCalls: delegationDocument.enabled,
      stored: null,
      deployment: delegationDocument.enabled,
    })

    const offered = toolNames(await turnFor(FIRST, 'inherit'))
    expect(offered).toContain(DELEGATE_TOOL)
    for (const tool of NAMED_WRITES) expect(offered).not.toContain(tool)
    for (const tool of READ_TOOLS) expect(offered).toContain(tool)
  })

  // ── conditions 4 and 5 ─────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-353_turning_it_off_leaves_the_next_session_with_no_delegate_and_its_hands_back', async () => {
    // THE INHERITING SESSION FIRST, so what follows is a comparison against this
    // deployment's real arrangement rather than against a list somebody typed.
    const on = toolNames(await turnFor(FIRST, 'off-before'))

    const stored = await setSetting(FIRST, false)
    expect(stored).toEqual({ delegateToolCalls: false, stored: false, deployment: true })
    resetAiHost()
    resetChatHost()

    const request = await turnFor(FIRST, 'off')
    const offered = toolNames(request)

    // OFF MEANS THE SURFACE IS NEVER COMPOSED — not composed-and-refusing. No
    // `Delegate` tool, and the method prose is a provider that renders nothing,
    // so the model cannot propose, apologise for or probe for an operation it has
    // not got. That structural absence is what makes this a rollback rather than
    // a new state to debug, and it is [[REQ-295]]'s absence reached per business.
    expect(offered).not.toContain(DELEGATE_TOOL)
    expect(sentText(request)).not.toContain(METHOD_HEADING)
    expect(sentText(request)).not.toContain(DELEGATE_TOOL)

    // AND THE CONSULTANT HAS ITS WRITE GROUPS BACK. `enabled` dominates
    // `primary_writes` STRUCTURALLY — the narrowing is applied at the point the
    // surface is composed — so a consultant that has lost its hands and has no
    // worker to commission is unreachable. This is that domination, per business.
    //
    // READ AS A SET DIFFERENCE AGAINST THE INHERITING SESSION: everything the off
    // run GAINED is a declared write, and the only thing it LOST is `Delegate`.
    // That is the whole of the exchange the switch makes, stated without a list
    // of tool names that could go stale in either direction.
    const gained = offered.filter((tool) => !on.includes(tool))
    const lost = on.filter((tool) => !offered.includes(tool))
    expect(gained.length).toBeGreaterThan(0)
    for (const tool of gained) expect(WRITE_TOOLS).toContain(tool)
    expect(lost).toEqual([DELEGATE_TOOL])
    // Named, because the ticket names them, and because an empty difference would
    // satisfy every claim above.
    for (const tool of NAMED_WRITES) {
      expect(on).not.toContain(tool)
      expect(offered).toContain(tool)
    }
    for (const tool of READ_TOOLS) expect(offered).toContain(tool)
  })

  it('test_UAT_FC_REQ-353_turning_it_on_again_restores_the_deployments_arrangement', async () => {
    await setSetting(FIRST, false)
    expect(toolNames(await turnFor(FIRST, 'off-first'))).not.toContain(DELEGATE_TOOL)

    // THE FLIP BACK, AND IT IS A FLIP BACK RATHER THAN A THIRD STATE. `on` means
    // whatever this deployment means by on — today [[REQ-343]]'s shipped
    // arrangement — so what returns is the shipped shape and not merely the tool.
    const back = await setSetting(FIRST, true)
    expect(back).toEqual({ delegateToolCalls: true, stored: true, deployment: true })
    resetAiHost()
    resetChatHost()

    const request = await turnFor(FIRST, 'on-again')
    const offered = toolNames(request)
    expect(offered).toContain(DELEGATE_TOOL)
    expect(sentText(request)).toContain(METHOD_HEADING)
    for (const tool of NAMED_WRITES) expect(offered).not.toContain(tool)
  })

  // ── condition 6 ────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-353_a_second_business_is_unaffected_by_either_flip', async () => {
    // TWO BUSINESSES IN ONE ISOLATE, AND ONE OF THEM FLIPPED. This is the state
    // [[EPIC-22]] named the trap for: a per-business value installed through
    // `configureDelegation` would be a module-level global feeding a manager
    // cache keyed per store-and-site, and the business resolved second would
    // inherit the first one's setting. The value travels on `deps` instead, which
    // is what makes the crossing structurally unreachable rather than merely
    // untested.
    await setSetting(FIRST, false)

    expect(await readSetting(SECOND)).toEqual({
      delegateToolCalls: true,
      stored: null,
      deployment: true,
    })

    const flipped = toolNames(await turnFor(FIRST, 'cross-off'))
    const untouched = toolNames(await turnFor(SECOND, 'cross-on'))

    expect(flipped).not.toContain(DELEGATE_TOOL)
    expect(untouched).toContain(DELEGATE_TOOL)
    // …and the untouched business still has the shipped narrowing, which is the
    // half that would go missing if it had picked up the other's document.
    for (const tool of NAMED_WRITES) {
      expect(untouched).not.toContain(tool)
      expect(flipped).toContain(tool)
    }
    // AND THE FIRST ONE'S ROW IS STILL ITS OWN after the second has been served.
    expect((await readSetting(FIRST)).stored).toBe(false)
    expect((await readSetting(SECOND)).stored).toBeNull()
  })

  // ── the value survives, which is why it is a table ─────────────────────────

  it('test_UAT_FC_REQ-353_the_stored_value_is_a_row_that_outlives_every_isolate', async () => {
    await setSetting(FIRST, false)

    // READ BACK OUT OF THE DATABASE and not out of the route, because the claim
    // is about WHERE the value is: an in-memory answer would satisfy every
    // assertion above and none of this one, and would evaporate on the next
    // deploy. One row per business, per the primary key.
    const { results } = await env.DB.prepare(
      'SELECT business_id, delegate_tool_calls, updated_at FROM business_network_settings',
    ).all<{ business_id: string; delegate_tool_calls: number; updated_at: string }>()
    expect(results).toHaveLength(1)
    expect(results![0].business_id).toBe(FIRST)
    expect(results![0].delegate_tool_calls).toBe(0)
    expect(results![0].updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)

    // AND A SECOND WRITE REPLACES IT rather than adding a second opinion.
    await setSetting(FIRST, true)
    const again = await env.DB.prepare(
      'SELECT delegate_tool_calls FROM business_network_settings WHERE business_id = ?',
    )
      .bind(FIRST)
      .all<{ delegate_tool_calls: number }>()
    expect(again.results).toHaveLength(1)
    expect(again.results![0].delegate_tool_calls).toBe(1)

    // EVERY HOST IN THE ISOLATE IS DROPPED, so the read below is a genuinely new
    // manager reading a genuinely new row rather than a cache agreeing with
    // itself.
    resetAiHost()
    resetChatHost()
    expect((await readSetting(FIRST)).delegateToolCalls).toBe(true)
  })

  // ── condition 7 ────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ-353_a_malformed_stored_value_is_refused_naming_the_business_and_the_key', async () => {
    // WRITTEN THE WAY IT COULD ACTUALLY GET THERE. The route refuses anything but
    // a boolean, so this is the state a hand-run `wrangler d1 execute`, a repair
    // script or a future writer with a bug produces — and SQLite carries an
    // affinity rather than a type, so a word sits happily in a column declared
    // INTEGER. The reader passes it through rather than coercing it, precisely so
    // that it fails here instead of resolving to a `true` nobody chose.
    await env.DB.prepare(
      'INSERT INTO business_network_settings (business_id, delegate_tool_calls, updated_at) ' +
        'VALUES (?, ?, ?)',
    )
      .bind(FIRST, 'maybe', new Date().toISOString())
      .run()

    // THE ROUTE REFUSES THE READ, so the tab cannot draw a working switch over a
    // row the host would reject the moment a session opened.
    const view = await ask(FIRST, NETWORK_DELEGATION_PATH)
    expect(view.status).toBe(500)

    // AND THE SESSION REFUSES TO OPEN, naming the business and the key. That is
    // the point of the placement: a configuration mistake discovered at the first
    // delegation is a configuration mistake discovered by a customer, in the
    // middle of their conversation, on the one path nobody exercises before
    // shipping.
    const { site } = await seedTenantSite(FIRST, { slug: nextSlug('malformed') })
    const opened = await post(FIRST, '/api/ai/session', { site })
    expect(opened.status).toBe(200)
    const session = (await opened.json()) as { ready: boolean; error?: string }
    expect(session.ready).toBe(false)
    expect(session.error).toContain(FIRST)
    expect(session.error).toContain('enabled')

    // THE ROUTE STILL REFUSES A BAD WRITE BY NAME, which is what keeps the row
    // above unreachable through the product.
    const refused = await post(FIRST, NETWORK_DELEGATION_PATH, { enabled: 'maybe' })
    expect(refused.status).toBe(400)
    expect(((await refused.json()) as { error: string }).error).toContain('enabled')
  })
})
