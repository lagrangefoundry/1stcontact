import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  NETWORK_DELEGATION_PATH,
  NETWORK_GROUP_CHAT_PATH,
  resetChatHost,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import {
  calls,
  says,
  scriptedClient,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-413]] — **the consultant brings the right view to the client**: one
 * `show_client` operation that either switches the client's view as its message
 * arrives, or answers a link the consultant pastes into its reply.
 *
 * EVERY CASE DRIVES THE WORKER'S OWN ROUTES — `/api/ai/session` and
 * `/api/ai/prompt` — against a real D1, the real site and ticket stores and the
 * real session machinery. The one double is the Anthropic client. What is
 * asserted is what the client's browser is sent (the turn's frames), what the
 * conversation keeps (the transcript a reload opens), and what the consultant is
 * told (the call's own result, read off the next request — never the whole
 * transcript, which holds the call's input too).
 *
 * The browser's half — acting on the frame, following the link — is the jsdom
 * suite beside this one.
 */

const BUSINESS = 'req413-business'
const COORDINATOR_MODEL = (backendsDocument as Record<string, { model?: string }>).claude_coordinator
  .model as string

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

type Frame = { kind: string; content: string; meta?: Record<string, unknown> }

async function frames(response: Response): Promise<Frame[]> {
  const out: Frame[] = []
  for (const block of (await response.text()).split('\n\n')) {
    const line = block.split('\n').find((l) => l.startsWith('data: '))
    if (line) out.push(JSON.parse(line.slice('data: '.length)) as Frame)
  }
  return out
}

/** The last tool result a request carries — what the consultant was told — parsed. */
function toolResult(req: ModelRequest): Record<string, any> {
  const last = req.messages[req.messages.length - 1]
  const block = (last.content as Array<{ type?: string; content?: unknown }>).find((b) => b?.type === 'tool_result')
  const content = block?.content
  const text = typeof content === 'string' ? content : (content as Array<{ text?: string }>).map((c) => c.text ?? '').join('')
  const body = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  try {
    return JSON.parse(body)
  } catch {
    return { error: text }
  }
}

/** A home page whose headline says which version it is. */
const page = (slug: string, id: string, heading: string, extra: Record<string, unknown> = {}) => ({
  ...starterHomePage(slug, heading),
  id,
  slug: id,
  title: id === 'home' ? 'Home' : `Home — ${heading}`,
  ...extra,
})

/** A site whose home page has two looks, one of them set aside, and an open conversation. */
async function site(prefix = 'req413'): Promise<{ site: string; sessionId: string }> {
  const slug = nextSlug(prefix)
  const look = (id: string, label: string, order: number, extra: Record<string, unknown> = {}) =>
    page(slug, id, label, { alternative: { of: 'home', set: 'home-looks', label, description: `The ${label} look`, order, ...extra } })
  const { site } = await seedTenantSite(BUSINESS, {
    slug,
    pages: {
      'home.json': page(slug, 'home', 'The page as it was'),
      'home-coastal.json': look('home-coastal', 'Coastal', 0),
      'home-old.json': look('home-old', 'Old idea', 1, { archived: true }),
    },
  })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return { site, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

const VIEW = { width: 1280, height: 800, mode: 'desktop' }

/** One client message, the consultant scripted. Answers the frames and the requests sent. */
async function turn(
  sessionId: string,
  steps: ModelStep[],
  view: Record<string, unknown> = VIEW,
): Promise<{ frames: Frame[]; seen: ModelRequest[] }> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text: 'What next?', view })
  expect(response.status).toBe(200)
  return { frames: await frames(response), seen: client.seen }
}

const shows = (fs: Frame[]) => fs.filter((f) => f.kind === 'show_client')
const replyText = (fs: Frame[]) => fs.filter((f) => f.kind === 'text').map((f) => f.content).join('')

beforeAll(async () => {
  await applySchema()
})

afterEach(async () => {
  setModelClient(null)
  await env.DB.prepare('DELETE FROM business_network_settings').run()
  resetAiHost()
  resetChatHost()
})

describe('REQ-413 — switch', () => {
  it('test_UAT_FC_REQ-413_switch_to_story_changes_the_view_once_and_the_transcript_records_it', async () => {
    const { site: key, sessionId } = await site()
    const { frames: fs, seen } = await turn(sessionId, [
      calls('show_client', { target: 'story', how: 'switch' }),
      says("Your sayings are on the story board. I've put it in front of you."),
    ])

    // The browser is told to switch, once, to the story board.
    expect(shows(fs).map((f) => f.meta?.href)).toEqual(['#show=story'])
    // The consultant is told it was switched.
    expect(toolResult(seen[1])).toMatchObject({ how: 'switch', shown: 'the story board' })
    // The reply carries the line, BEFORE what the consultant said next.
    const reply = replyText(fs)
    expect(reply.indexOf('[Showing you the story board](#show=story)')).toBeGreaterThanOrEqual(0)
    expect(reply.indexOf('[Showing you the story board](#show=story)')).toBeLessThan(reply.indexOf('Your sayings'))

    // A RELOAD shows the view was changed — the line is in the stored turn — and
    // reopening the conversation sends no switch: there is no stream to carry one.
    resetAiHost()
    resetChatHost()
    const reopened = await post('/api/ai/session', { site: key })
    const body = (await reopened.json()) as { turns: { role: string; markdown: string }[] }
    const assistant = body.turns.filter((t) => t.role === 'assistant').map((t) => t.markdown).join('\n')
    expect(assistant).toContain('[Showing you the story board](#show=story)')
    expect(JSON.stringify(body)).not.toContain('"show_client"')
  })

  it('test_UAT_FC_REQ-413_switch_while_the_client_is_editing_becomes_a_link_and_says_so', async () => {
    const { sessionId } = await site()
    const { frames: fs, seen } = await turn(
      sessionId,
      [
        calls('show_client', { target: 'story', how: 'switch' }),
        says("When you've saved that, [Open the story board](#show=story)."),
      ],
      { ...VIEW, busy: 'editing' },
    )
    // Nothing is switched under them.
    expect(shows(fs)).toEqual([])
    expect(replyText(fs)).not.toContain('Showing you')
    // The consultant is told why, and handed the link to paste instead.
    const result = toolResult(seen[1])
    expect(result.how).toBe('link')
    expect(result.link).toBe('[Open the story board](#show=story)')
    expect(result.not_switched).toContain('editing')
  })

  it('test_UAT_FC_REQ-413_a_second_switch_before_the_client_does_anything_becomes_a_link', async () => {
    const { sessionId } = await site()
    const { frames: fs, seen } = await turn(sessionId, [
      calls('show_client', { target: 'story', how: 'switch' }),
      calls('show_client', { target: 'looks', look: 'home-coastal', how: 'switch' }),
      says('Have a look.'),
    ])
    expect(shows(fs).map((f) => f.meta?.href)).toEqual(['#show=story'])
    expect(toolResult(seen[2])).toMatchObject({ how: 'link' })
    expect(toolResult(seen[2]).not_switched).toContain('already changed their view')

    // The client's next message is something done in between: switching is allowed again.
    const next = await turn(sessionId, [calls('show_client', { target: 'looks', look: 'home-coastal', how: 'switch' }), says('There.')])
    expect(shows(next.frames).map((f) => f.meta?.href)).toEqual(['#show=looks&set=home-looks&look=home-coastal'])
  })
})

describe('REQ-413 — link', () => {
  it('test_UAT_FC_REQ-413_a_link_to_a_look_is_a_line_to_paste_and_switches_nothing', async () => {
    const { sessionId } = await site()
    const { frames: fs, seen } = await turn(sessionId, [
      calls('show_client', { target: 'looks', look: 'home-coastal', how: 'link' }),
      says('Ok.'),
    ])
    expect(toolResult(seen[1])).toEqual({
      how: 'link',
      link: '[Open the Coastal look](#show=looks&set=home-looks&look=home-coastal)',
    })
    expect(shows(fs)).toEqual([])
  })

  it('test_UAT_FC_REQ-413_a_question_raised_this_turn_can_be_shown_and_a_set_aside_look_cannot', async () => {
    const { sessionId } = await site()
    const { seen } = await turn(sessionId, [
      calls('set_ask', { ask: 'phone', prompt: 'Your phone number?', why: 'Every visitor needs it.', input: 'phone' }),
      calls('show_client', { target: 'ask', ask: 'phone', how: 'link', label: 'Answer this one' }),
      calls('show_client', { target: 'looks', look: 'home-old', how: 'link' }),
      says('Ok.'),
    ])
    expect(toolResult(seen[2])).toEqual({ how: 'link', link: '[Answer this one](#show=ask&ask=phone)' })
    expect(toolResult(seen[3]).error).toContain('UNKNOWN_LOOK')
  })
})

describe('REQ-413 — group chat', () => {
  it('test_UAT_FC_REQ-413_in_a_group_chat_the_consultants_switch_reaches_the_client', async () => {
    expect((await post(NETWORK_DELEGATION_PATH, { enabled: false })).status).toBe(200)
    expect((await post(NETWORK_GROUP_CHAT_PATH, { enabled: true })).status).toBe(200)
    const { sessionId } = await site('room413')

    const room = roomClient({
      consultant: [
        { step: calls('show_client', { target: 'story', how: 'switch' }), then: { say: "I've put the story board in front of you." } },
      ],
      coordinator: [{ decline: true }],
    })
    setModelClient(room)
    const exchange = await frames(await post('/api/ai/prompt', { sessionId, text: 'Hello both.', view: VIEW }))
    expect(shows(exchange).map((f) => f.meta?.href)).toEqual(['#show=story'])
    // In a room the record is what the members post, so the consultant is handed
    // the line to carry there.
    const told = room.seen.filter((r) => memberOf(r) === 'consultant' && afterTool(r)).map(toolResult)
    expect(told[0]).toMatchObject({ how: 'switch', say_in_room: '[Showing you the story board](#show=story)' })
  })
})

// ── the room double (REQ-364's, trimmed to what this case needs) ─────────────

const memberOf = (req: ModelRequest): 'consultant' | 'coordinator' =>
  req.model === COORDINATOR_MODEL ? 'coordinator' : 'consultant'

function afterTool(req: ModelRequest): boolean {
  const last = req.messages[req.messages.length - 1]
  return Array.isArray(last?.content) && (last.content as Array<{ type?: string }>).some((b) => b?.type === 'tool_result')
}

type Action = { say: string } | { decline: true } | { step: ModelStep; then?: Action }

function roomClient(script: { consultant: Action[]; coordinator: Action[] }): ScriptedClient {
  const seen: ModelRequest[] = []
  const pending: Record<string, Action | null> = { consultant: null, coordinator: null }
  return {
    seen,
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        const who = memberOf(req)
        const roomId = /You have a turn in room (\S+?)\./.exec(JSON.stringify(req.messages))?.[1]
        let action: Action | null
        if (!afterTool(req)) action = script[who].shift() ?? { decline: true }
        else {
          action = pending[who]
          pending[who] = null
        }
        let step: ModelStep
        if (action === null) step = says('Done.')
        else if ('step' in action) {
          step = action.step
          pending[who] = action.then ?? null
        } else if ('say' in action) step = calls('GroupSay', { group: roomId, text: action.say })
        else step = calls('GroupSay', { group: roomId, decline: true, text: 'Nothing from me.' })
        const events = step(req)
        return (async function* () {
          for (const event of events) yield event
        })()
      },
    },
  }
}
