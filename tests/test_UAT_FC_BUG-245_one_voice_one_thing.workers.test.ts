import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  COMPS_FINISHED_CUE,
  PLAN_COMP_PATH,
  PLAN_PATH,
  resetChatHost,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { sitePlan } from '../apps/control-app/src/plan'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { compsFinishedCue } from '../tools/generate/src/cli/ai/roles'
import { addComp, CLIENT, CLIENT_COMPS_FINISHED_LINE, COMPS_BOARD_LINK } from '../tools/generate/src/cli/ai/plan-core'
import { calls, says, scriptedClient, turnTailText, type ModelRequest, type ModelStep } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-245]] — **one voice, one thing at a time: the host half.**
 *
 * EVERY CASE DRIVES THE ROUTES A REQUEST DRIVES — `/api/plan`, `/api/plan/comp`,
 * `/api/ai/session`, `/api/ai/prompt`, `/api/ai/absorbed` — through the Worker's
 * own `route`, against a real D1 and the real ticket store. One double: the
 * Anthropic client (the network). A comp is a capture's `reference` ticket, made
 * here directly, which is exactly what `capture_site` leaves behind.
 */

const BUSINESS = 'bug245-business'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: BUSINESS,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    SESSION_JUNCTION: (env as Record<string, unknown>).SESSION_JUNCTION,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as RouterEnv
}

const scope: Scope = { businessId: BUSINESS }
const deps: RouterDeps = { index: async () => async () => {} }

const ask = (path: string, init: RequestInit = {}): Promise<Response> =>
  route(
    new Request(`https://app.example${path}`, init),
    routerEnv(),
    scope,
    deps,
    { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
  )
const post = (path: string, body: unknown): Promise<Response> =>
  ask(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

const tickets = (): Promise<TicketStore> => ticketStoreFor(routerEnv() as never, scope)

async function site(): Promise<{ site: string; sessionId: string }> {
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('bug245') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return { site, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

async function turn(sessionId: string, text: string, steps: ModelStep[]): Promise<ModelRequest[]> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text })
  expect(response.status).toBe(200)
  await response.text()
  return client.seen
}

/** What the last tool call answered, as the model was sent it on the next request. */
function toolResult(req: ModelRequest): string {
  const last = req.messages.at(-1)?.content
  const block = (Array.isArray(last) ? last : []).find((b: { type?: string }) => b?.type === 'tool_result') as
    | { content?: unknown }
    | undefined
  const content = block?.content
  return typeof content === 'string' ? content : JSON.stringify(content ?? '')
}

/** A comparable site, as `capture_site` leaves it: a capture reference ticket. */
async function capture(title: string, url: string): Promise<string> {
  const { ticket } = await (await tickets()).create({
    type: 'reference',
    title,
    fields: { kind: 'capture', origin: 'captured', source_url: url, rights: 'third_party', republishable: false, exportable: false },
  })
  return ticket.uid
}

/** Put captures on a site's board, as the consultant's `add_comp` does. */
async function onBoard(key: string, comps: { reference: string; title: string; url: string }[]): Promise<void> {
  const plan = sitePlan(await tickets(), key)
  for (const c of comps) await plan.write((current) => addComp(current, c, 'consultant', new Date().toISOString()).plan)
}

type View = { comps: Record<string, unknown>[]; comps_finished: boolean; comps_note: string }
const view = async (res: Response): Promise<View> => {
  expect(res.status).toBe(200)
  return (await res.json()) as View
}
const session = async (sessionId: string, key: string) =>
  (await (await post('/api/ai/session', { site: key })).json()) as { sessionId: string; turns: { role: string; markdown: string }[]; news?: boolean }

beforeAll(async () => {
  await applySchema()
})

afterEach(async () => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('BUG-245 — comps are announced in one line, and each card carries why it was chosen', () => {
  it('test_UAT_FC_BUG-245_add_comp_keeps_why_and_hands_one_line_with_the_board_link_never_a_tile', async () => {
    const ctx = await site()
    const reference = await capture('JDS Custom Ironworks', 'https://jds-ironworks.test/')
    let answered = ''
    await turn(ctx.sessionId, 'Show me some shops like mine.', [
      calls('ask_comps', { note: 'A range: a big regional shop, two local independents and one premium outlier.' }),
      calls('add_comp', { reference, why: 'A local independent with clear prices — the plain end of the range.' }),
      (req) => {
        answered = toolResult(req)
        return says('Done.')(req)
      },
    ])
    // ONE LINE FOR THE BOARD, with its link — and no picture, address or site link.
    expect(answered).toContain('ONE line')
    expect(answered).toContain(COMPS_BOARD_LINK)
    expect(answered).not.toContain('![')
    expect(answered).not.toContain('Open the real site')
    // THE CARD CARRIES THE CONSULTANT'S WHY, and the board its header note.
    const shown = await view(await ask(`${PLAN_PATH}?site=${encodeURIComponent(ctx.site)}`))
    expect(shown.comps[0]).toMatchObject({ reference, why: 'A local independent with clear prices — the plain end of the range.' })
    expect(shown.comps_note).toBe('A range: a big regional shop, two local independents and one premium outlier.')
  })

  it('test_UAT_FC_BUG-245_a_comp_the_client_adds_is_named_on_the_next_turn_once_with_no_tile', async () => {
    const ctx = await site()
    await turn(ctx.sessionId, 'Hello.', [says('Hello.')])
    const reference = await capture('Bay Fab', 'https://bayfab.test/')
    const plan = sitePlan(await tickets(), ctx.site)
    await plan.write((current) => addComp(current, { reference, title: 'Bay Fab', url: 'https://bayfab.test/' }, CLIENT, new Date().toISOString()).plan)

    const told = turnTailText((await turn(ctx.sessionId, 'I added one.', [says('Thanks.')]))[0])
    expect(told).toContain('Your client added 1 site to the comparison board')
    expect(told).toContain(`Bay Fab [${reference}]`)
    expect(told).not.toContain('![')
    expect(told).not.toContain('Open the real site')
    const again = turnTailText((await turn(ctx.sessionId, 'And now?', [says('Still here.')]))[0])
    expect(again).not.toContain('Your client added')
  })
})

describe('BUG-245 — each card is open or closed, and the board knows when it is finished', () => {
  it('test_UAT_FC_BUG-245_a_draft_is_kept_and_never_told_send_and_skip_close_cards_and_reopening_opens_them', async () => {
    const ctx = await site()
    const a = await capture('JDS Custom Ironworks', 'https://jds.test/')
    const b = await capture('Bay Fab', 'https://bayfab.test/')
    await onBoard(ctx.site, [
      { reference: a, title: 'JDS Custom Ironworks', url: 'https://jds.test/' },
      { reference: b, title: 'Bay Fab', url: 'https://bayfab.test/' },
    ])
    await turn(ctx.sessionId, 'Hello.', [says('Hello.')])

    // A DRAFT IS KEPT — and the consultant hears nothing of it.
    let shown = await view(await post(PLAN_COMP_PATH, { site: ctx.site, action: 'draft', reference: a, note: 'Love the gates' }))
    expect(shown.comps[0]).toMatchObject({ note: 'Love the gates' })
    expect(shown.comps[0].state).toBeUndefined()
    const quiet = turnTailText((await turn(ctx.sessionId, 'Thinking.', [says('Sure.')]))[0])
    expect(quiet).not.toContain('Love the gates')

    // SENT: the note as sent, and when.
    shown = await view(await post(PLAN_COMP_PATH, { site: ctx.site, action: 'send', reference: a, note: 'Love the gates, hate the font' }))
    expect(shown.comps[0]).toMatchObject({ state: 'sent', sent: 'Love the gates, hate the font', note: 'Love the gates, hate the font' })
    expect(typeof shown.comps[0].sent_at).toBe('string')
    expect(shown.comps_finished).toBe(false)
    // Nothing to send is refused.
    expect((await post(PLAN_COMP_PATH, { site: ctx.site, action: 'send', reference: b, note: '  ' })).status).toBe(400)

    // THE LAST CARD CLOSED FINISHES THE BOARD.
    shown = await view(await post(PLAN_COMP_PATH, { site: ctx.site, action: 'skip_site', reference: b }))
    expect(shown.comps[1]).toMatchObject({ state: 'skipped' })
    expect(shown.comps_finished).toBe(true)

    // Reopening a card — un-skipping, or editing a sent note — opens the board again.
    shown = await view(await post(PLAN_COMP_PATH, { site: ctx.site, action: 'reopen_site', reference: b }))
    expect(shown.comps[1].state).toBeUndefined()
    expect(shown.comps_finished).toBe(false)
    await post(PLAN_COMP_PATH, { site: ctx.site, action: 'skip_site', reference: b })
    shown = await view(await post(PLAN_COMP_PATH, { site: ctx.site, action: 'draft', reference: a, note: 'Love the gates, hate the font. Also' }))
    expect(shown.comps_finished).toBe(false)
  })

  it('test_UAT_FC_BUG-245_a_finished_board_is_told_on_the_next_turn_once', async () => {
    const ctx = await site()
    const a = await capture('JDS Custom Ironworks', 'https://jds.test/')
    await onBoard(ctx.site, [{ reference: a, title: 'JDS Custom Ironworks', url: 'https://jds.test/' }])
    await turn(ctx.sessionId, 'Hello.', [says('Hello.')])

    await post(PLAN_COMP_PATH, { site: ctx.site, action: 'send', reference: a, note: 'Love the gates' })
    // THE SENT NOTE IS THE CLIENT'S OWN MESSAGE; the turn it starts is told the board is finished.
    const told = turnTailText((await turn(ctx.sessionId, 'On JDS Custom Ironworks: Love the gates', [says('Gates it is.')]))[0])
    expect(told).toContain(CLIENT_COMPS_FINISHED_LINE)
    expect(told).toContain('visual_concept')
    const again = turnTailText((await turn(ctx.sessionId, 'Anything else?', [says('No.')]))[0])
    expect(again).not.toContain(CLIENT_COMPS_FINISHED_LINE)
  })

  it('test_UAT_FC_BUG-245_a_board_finished_on_a_skip_starts_a_cued_turn_once_and_the_cue_is_never_shown', async () => {
    const ctx = await site()
    const a = await capture('Bay Fab', 'https://bayfab.test/')
    await onBoard(ctx.site, [{ reference: a, title: 'Bay Fab', url: 'https://bayfab.test/' }])
    await turn(ctx.sessionId, 'Hello.', [says('Hello.')])
    await post(PLAN_COMP_PATH, { site: ctx.site, action: 'skip_site', reference: a })

    const client = scriptedClient([says('From what you said: plain and direct, no clutter.')])
    setModelClient(client)
    const cued = await post('/api/ai/prompt', { sessionId: ctx.sessionId, cue: COMPS_FINISHED_CUE })
    expect(cued.status).toBe(200)
    await cued.text()
    // THE CONSULTANT WAS CUED — the client said nothing.
    expect(JSON.stringify(client.seen[0].messages)).toContain('the comparison board, so the board is finished')
    // ONCE: told now, so a second cue is refused and starts no turn.
    expect((await post('/api/ai/prompt', { sessionId: ctx.sessionId, cue: COMPS_FINISHED_CUE })).status).toBe(409)
    // THE CUE IS NOT THE CLIENT'S, so a reload does not show it; the reply is shown.
    const replay = await session(ctx.sessionId, ctx.site)
    expect(replay.turns.some((t) => t.markdown === compsFinishedCue())).toBe(false)
    expect(replay.turns.at(-1)).toMatchObject({ role: 'assistant', markdown: 'From what you said: plain and direct, no clutter.' })
  })
})

describe("BUG-245 — the work's news, absorbed into the next reply", () => {
  it('test_UAT_FC_BUG-245_an_absorbed_result_is_not_replayed_and_the_next_turn_is_told_it_once', async () => {
    const ctx = await site()
    const RESULT = "I've put four Bay Area shops on the comparison board."
    await turn(ctx.sessionId, 'Find me some shops.', [says(`On it. ${RESULT}`)])

    // The browser withheld the result: the client was writing.
    const kept = await post('/api/ai/absorbed', { sessionId: ctx.sessionId, turnId: '', text: RESULT })
    expect(kept.status).toBe(200)

    // A RELOAD SHOWS WHAT THE CLIENT SAW, and that news is waiting.
    let replay = await session(ctx.sessionId, ctx.site)
    expect(replay.turns.at(-1)).toMatchObject({ role: 'assistant', markdown: 'On it.' })
    expect(replay.turns.some((t) => t.markdown.includes(RESULT))).toBe(false)
    expect(replay.news).toBe(true)

    // THE NEXT REPLY CARRIES IT, after answering what the client said — told once.
    const told = turnTailText((await turn(ctx.sessionId, 'It started in my mum’s garage.', [says('A garage start!')]))[0])
    expect(told).toContain('was not shown to them')
    expect(told).toContain(RESULT)
    expect(told).toContain('First respond to what they just said')
    const again = turnTailText((await turn(ctx.sessionId, 'Yes.', [says('Good.')]))[0])
    expect(again).not.toContain(RESULT)
    replay = await session(ctx.sessionId, ctx.site)
    expect(replay.news).toBeUndefined()
    expect(replay.turns.some((t) => t.markdown.includes(RESULT))).toBe(false)
  })
})
