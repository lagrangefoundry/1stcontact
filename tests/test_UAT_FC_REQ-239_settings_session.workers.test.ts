import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  BUSINESS_SESSION_SCOPE,
  resetChatHost,
  route,
  type RouterEnv,
} from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { businessRecord } from '../apps/control-app/src/business'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import {
  businessSessionIdFor,
  resetAiHost,
  sessionIdFor,
  setModelClient,
} from '../tools/generate/src/cli/ai/host-core'
import { SETTINGS_ROLE, primingText } from '../tools/generate/src/cli/ai/roles'
import { SETTINGS_ROLE_ENTRY, ROLE_ENTRY, PRODUCT_ENTRY } from '../tools/generate/src/cli/ai/roles'
// THE BROWSER'S COPY OF THE WIRE VALUE ([[REQ-239]]). `api.js` cannot import the
// Worker's TypeScript, so the two literals are held equal by the case below
// rather than by an import — the same arrangement `SIGN_OUT_PATH` already has.
import { BUSINESS_SESSION_SCOPE as CLIENT_SCOPE } from '../apps/control-app/src/builder/api.js'
import { applySchema, ensureTenant, seedTenantSite } from './support/d1-site-factory'
import { calls, says, scriptedClient, systemText } from './support/scripted-model-client'
import type { ModelStep, ScriptedClient } from './support/scripted-model-client'

/**
 * [[REQ-239]] — **the settings assistant is a business-scoped conversation, and
 * it reaches the same operation the settings field does.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case takes a REAL TURN through the Worker's own
 * route table, over a real D1 database with the deployed schema, and then reads
 * the business's record back out of D1 with the shipped `businessRecord`. The one
 * double is the Anthropic client — the network, and the seam the library's backend
 * exists to have injected. The session manager, the role assembly, the priming,
 * the tool schemas, the Toolbox's capability gate and `business.ts`'s rename rule
 * are all the shipped things.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *   1. A CONVERSATION CAN BE ABOUT A BUSINESS. `/api/ai/session` opens one
 *      without naming a site, its id is the business's, and it does not collide
 *      with the site conversation that exists in the same business.
 *   2. THE ASSISTANT HOLDS THE SAME API THE PANE DOES. A turn that calls
 *      `rename_business` changes the record that `/api/business/name` changes —
 *      one rule, two callers, and the store read proves it rather than a mock.
 *   3. IT IS GRANTED THE SETTINGS SURFACE AND NOTHING ELSE. The tools on the wire
 *      are the settings surface's and the manual's; no site operation is offered,
 *      so the model cannot propose one, apologise for one or probe for one.
 *   4. IT IS TOLD IT IS A SETTINGS ROLE, NOT A CONSULTANT, and it is told which
 *      BUSINESS it is in rather than which site.
 *   5. A SESSION ID NAMING ANOTHER BUSINESS IS REFUSED — the check is against the
 *      scope the request already resolved to, not against mere existence.
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

/** A business with the schema applied, its tenant registered, and a name to change. */
async function business(id: string, name: string): Promise<Scope> {
  await APPLIED
  await ensureTenant(id)
  // THE NAME IS SET THROUGH THE COLUMN THE PRODUCT READS, because `ensureTenant`
  // names a tenant after its id and this suite is about a name a customer chose.
  await (env.DB as D1Database).prepare('UPDATE tenants SET name = ? WHERE id = ?').bind(name, id).run()
  return { businessId: id }
}

/** Open the settings conversation the way the browser does. */
async function openSettings(scope: Scope): Promise<{ sessionId: string; ready: boolean }> {
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
  return opened.json() as Promise<{ sessionId: string; ready: boolean }>
}

/** Take one scripted turn in an already-open session. */
async function turn(
  scope: Scope,
  sessionId: string,
  script: ModelStep[],
): Promise<ScriptedClient> {
  const client = scriptedClient(script)
  setModelClient(client)
  resetAiHost()
  resetChatHost()
  const answered = await route(
    new Request(`${ORIGIN}/api/ai/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, text: 'my business name is wrong' }),
    }),
    routerEnv(),
    scope,
    {},
  )
  expect(answered.status).toBe(200)
  // DRAINED, because the turn runs while the body streams: asserting on what the
  // model was sent before the stream is consumed is asserting on a turn that has
  // not happened.
  await answered.text()
  return client
}

beforeAll(async () => {
  await APPLIED
})

beforeEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

// ── 1: a conversation about a business ───────────────────────────────────────

describe('REQ-239 AC1 — the settings session is business-scoped', () => {
  it('test_UAT_FC_REQ-239_the_session_names_the_business_and_no_site', async () => {
    const scope = await business('req239-scoped', 'Cole’s Bakery')
    // A SITE EXISTS IN THIS BUSINESS, deliberately: the claim is that the settings
    // conversation is a SECOND conversation rather than the site one under another
    // name, and a business with no site could not tell those apart.
    const { site: siteKey } = await seedTenantSite(scope.businessId)

    const opened = await openSettings(scope)

    expect(opened.sessionId).toBe(businessSessionIdFor(scope.businessId))
    expect(opened.sessionId).not.toBe(sessionIdFor(siteKey))
    expect(opened.ready).toBe(true)
  })

  it('test_UAT_FC_REQ-239_the_client_and_the_route_agree_on_the_wire_value', () => {
    expect(CLIENT_SCOPE).toBe(BUSINESS_SESSION_SCOPE)
  })

  it('test_UAT_FC_REQ-239_the_request_carries_no_business_and_still_resolves_to_one', async () => {
    // THE BODY NAMES NOTHING. The request has already resolved to exactly one
    // business, so a body that carried an id would be offering the caller a choice
    // it does not have — and would be the one value it could get wrong.
    const a = await business('req239-a', 'Business A')
    const b = await business('req239-b', 'Business B')

    expect((await openSettings(a)).sessionId).toBe(businessSessionIdFor(a.businessId))
    expect((await openSettings(b)).sessionId).toBe(businessSessionIdFor(b.businessId))
  })
})

// ── 2 & 3: one API, two callers; and nothing else granted ────────────────────

describe('REQ-239 AC2 — the assistant reaches the settings operations', () => {
  it('test_UAT_FC_REQ-239_a_turn_renames_the_business_in_the_store', async () => {
    const scope = await business('req239-rename', 'Unnamed business')
    await seedTenantSite(scope.businessId)
    const opened = await openSettings(scope)

    const client = await turn(scope, opened.sessionId, [
      calls('rename_business', { name: 'Cole’s Bakery' }),
      says('Done — your site still says the old name.'),
    ])

    // THE STORE, NOT THE STREAM. What proves the assistant and the pane are two
    // callers of one operation is that the record actually moved, read back with
    // the same function `/api/business/name` reads.
    const record = await businessRecord(routerEnv() as unknown as IdentityEnv, scope.businessId)
    expect(record?.name).toBe('Cole’s Bakery')
    expect(client.seen.length).toBeGreaterThan(1)
  })

  it('test_UAT_FC_REQ-239_the_tools_are_the_settings_surface_and_nothing_else', async () => {
    const scope = await business('req239-grant', 'Grant Co')
    await seedTenantSite(scope.businessId)
    const opened = await openSettings(scope)

    const client = await turn(scope, opened.sessionId, [says('What would you like to change?')])

    const offered = client.seen[0].tools.map((t) => t.name)
    expect(offered).toContain('read_business')
    expect(offered).toContain('rename_business')
    // NOT A SAMPLE OF SITE OPERATIONS — every one of them. A session is never told
    // about a capability it was not granted, and the failure this guards is a
    // settings conversation that can quietly edit a page.
    for (const site of ['set_l1', 'update_page', 'add_page', 'publish', 'write_image', 'screenshot']) {
      expect(offered).not.toContain(site)
    }
  })
})

// ── 4: what it is told about itself ──────────────────────────────────────────

describe('REQ-239 AC3 — the settings role, and the business it is in', () => {
  it('test_UAT_FC_REQ-239_the_priming_is_the_settings_role_and_not_the_consultants', async () => {
    const scope = await business('req239-priming', 'Priming Ltd')
    await seedTenantSite(scope.businessId)
    const opened = await openSettings(scope)

    const client = await turn(scope, opened.sessionId, [says('Hello.')])
    const system = systemText(client.seen[0])

    // THE WORDS THAT SHIP, read out of the file rather than restated here — so a
    // rewrite of the role text is still proved to reach the model.
    expect(system).toContain(primingText(SETTINGS_ROLE_ENTRY).split('\n')[0])
    // AND NOT THE CONSULTANT'S. Both of its static entries are about building a
    // site, which this session cannot do.
    expect(system).not.toContain(primingText(ROLE_ENTRY).split('\n')[0])
    expect(system).not.toContain(primingText(PRODUCT_ENTRY).split('\n')[0])
  })

  it('test_UAT_FC_REQ-239_it_is_told_which_business_and_never_which_site', async () => {
    const scope = await business('req239-line', 'Line & Co')
    const { site: siteKey } = await seedTenantSite(scope.businessId)
    const opened = await openSettings(scope)

    const client = await turn(scope, opened.sessionId, [says('Hello.')])
    const sent = JSON.stringify(client.seen[0])

    // THE FRAMING IS THE BUSINESS'S NAME — the thing the customer would recognise,
    // and the thing this conversation is most likely to change.
    expect(sent).toContain('Line & Co')
    // AND THERE IS NO SITE LINE. `siteLine` is unconditional for the consultant
    // because acting on the wrong site has no signal to wait for; naming a site
    // here would name a thing this session has no tool to touch.
    expect(sent).not.toContain(siteKey)
    expect(sent).not.toContain('Every tool you have acts on that site and no other')
  })

  it('test_UAT_FC_REQ-239_the_role_recorded_on_the_session_is_the_settings_one', async () => {
    const scope = await business('req239-role', 'Role Ltd')
    await seedTenantSite(scope.businessId)
    const opened = await openSettings(scope)
    await turn(scope, opened.sessionId, [says('Hello.')])

    // THE ROLE NAME IS DURABLE — it is written into the archived transcript's
    // header and the junction's `session_start`, and a session whose role cannot
    // be resolved refuses to reopen. Re-opening is therefore the assertion.
    const reopened = await openSettings(scope)
    expect(reopened.ready).toBe(true)
    expect(SETTINGS_ROLE).toBe('settings')
  })
})

// ── 5: the scope check ───────────────────────────────────────────────────────

describe('REQ-239 AC4 — a settings session belongs to one business', () => {
  it('test_UAT_FC_REQ-239_an_id_naming_another_business_is_refused', async () => {
    const mine = await business('req239-mine', 'Mine Ltd')
    const theirs = await business('req239-theirs', 'Theirs Ltd')
    await seedTenantSite(mine.businessId)
    await openSettings(theirs)

    const client = scriptedClient([calls('rename_business', { name: 'Stolen Ltd' })])
    setModelClient(client)
    resetAiHost()
    resetChatHost()
    const answered = await route(
      new Request(`${ORIGIN}/api/ai/prompt`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // A REAL, OPEN CONVERSATION — just not this request's. The check is against
        // the scope the request resolved to rather than against existence, which is
        // strictly stronger than asking a store whether the id names anything.
        body: JSON.stringify({
          sessionId: businessSessionIdFor(theirs.businessId),
          text: 'rename it',
        }),
      }),
      routerEnv(),
      mine,
      {},
    )

    // THE REFUSAL IS A FRAME AND NOT A STATUS, because the turn is a stream and
    // the response head is written before the session is resolved — the same
    // shape an unknown SITE session already refuses in. What matters is that the
    // conversation is refused and the model is never reached.
    expect(await answered.text()).toContain('no longer open')
    expect(client.seen).toEqual([])
    // AND NOTHING MOVED IN EITHER BUSINESS.
    const env2 = routerEnv() as unknown as IdentityEnv
    expect((await businessRecord(env2, theirs.businessId))?.name).toBe('Theirs Ltd')
    expect((await businessRecord(env2, mine.businessId))?.name).toBe('Mine Ltd')
  })
})
