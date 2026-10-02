import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  NETWORK_DELEGATION_PATH,
  NETWORK_GROUP_CHAT_PATH,
  resetChatHost,
  route,
  type RouterEnv,
} from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { EXCHANGE_BUSY, resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { L1_DECLARATION } from '../tools/generate/src/cli/ai/toolbox-core'
import { groupNames, ROOM_POST, MEMBER_DONE } from '../tools/generate/src/cli/ai/group-core'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import {
  calls,
  metered,
  says,
  scriptedClient,
  sentText,
  turnTailText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-357]] — a builder conversation as a group chat: one room in which the
 * client, the consultant and the assistant all post, behind a per-business
 * switch.
 *
 * EVERY CASE DRIVES THE ROUTES A REQUEST DRIVES — the switch, `/api/ai/session`,
 * `/api/ai/prompt`, `/api/ai/stop`, `/api/ai/private` — through the Worker's own
 * `route`, against a real D1 (the switch's column comes from the migration), the
 * real ticket store the room is homed in, and the real junction Durable Object.
 * The one double is the Anthropic client, which is the network. It is ROOM-AWARE
 * rather than a fixed script: it reads the room id out of the brief the
 * orchestrator sent and answers with the room's own `GroupSay` tool, so a member
 * "speaks" only by going through the surface the ticket granted it.
 *
 * NOTHING ABOUT THE SURFACES IS RESTATED. Which L1 tools are reads and which
 * writes is read out of the declaration; the display names out of
 * `group-chat.json`; the assistant's model out of `backends.json`.
 */

const BUSINESS = 'req357-business'
const NAMES = groupNames()
const ASSISTANT_MODEL = (backendsDocument as Record<string, { model?: string }>).claude_assistant
  .model as string

/** Tool names the L1 declaration groups under a READ, and under a WRITE. */
function toolsByEffect(effect: 'read' | 'write'): string[] {
  const groups = L1_DECLARATION.groups as Array<{ effect: string; operations: string[] }>
  const operations = L1_DECLARATION.operations as Array<{ op: string; tool: string }>
  const named = new Map(operations.map((entry) => [entry.op, entry.tool]))
  return groups
    .filter((group) => group.effect === effect)
    .flatMap((group) => group.operations)
    .map((op) => named.get(op) ?? op)
}
const READ_TOOLS = toolsByEffect('read')
const WRITE_TOOLS = toolsByEffect('write')
const ROOM_TOOLS = ['GroupPull', 'GroupSay']

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

const ask = (path: string, init: RequestInit = {}): Promise<Response> =>
  route(
    new Request(`https://app.example${path}`, init),
    routerEnv(),
    scope,
    {},
    { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
  )

const post = (path: string, body: unknown): Promise<Response> =>
  ask(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

type Frame = { kind: string; content: string; meta?: Record<string, unknown> }

/** Read an event-stream response to its end, frame by frame. */
async function frames(response: Response): Promise<Frame[]> {
  const out: Frame[] = []
  const text = await response.text()
  for (const block of text.split('\n\n')) {
    const line = block.split('\n').find((l) => l.startsWith('data: '))
    if (line) out.push(JSON.parse(line.slice('data: '.length)) as Frame)
  }
  return out
}

async function setGroupChat(enabled: boolean): Promise<void> {
  const response = await post(NETWORK_GROUP_CHAT_PATH, { enabled })
  expect(response.status).toBe(200)
  expect(((await response.json()) as { groupChat: boolean }).groupChat).toBe(enabled)
}

interface Opened {
  sessionId: string
  turns: Array<{ role: string; markdown: string; speaker?: string; passed?: boolean }>
  ready: boolean
  error?: string
  group?: { names: Record<string, string> }
}

async function open(site: string): Promise<Opened> {
  const response = await post('/api/ai/session', { site })
  expect(response.status).toBe(200)
  return (await response.json()) as Opened
}

/** Who a request was from: the assistant runs on its own backend's model. */
const memberOf = (req: ModelRequest): 'consultant' | 'assistant' =>
  req.model === ASSISTANT_MODEL ? 'assistant' : 'consultant'

/** Whether the request is the tool loop's second leg (the tool result is back). */
function afterTool(req: ModelRequest): boolean {
  const last = req.messages[req.messages.length - 1]
  return (
    Array.isArray(last?.content) &&
    (last.content as Array<{ type?: string }>).some((block) => block?.type === 'tool_result')
  )
}

/** One member action in a round: post, decline, or any scripted step of its own. */
type Action =
  | { say: string }
  | { decline: true }
  | { step: ModelStep; then?: Action }

/**
 * A model double that plays both room members.
 *
 * Each ROUND a member is called for is answered from that member's script: the
 * first request of the round performs the action, and every request after a tool
 * result posts (or declines) as the script says, then closes the round with a
 * plain reply. Out of script, a member declines — which is what settles the
 * exchange.
 */
function roomClient(script: { consultant: Action[]; assistant: Action[] }): ScriptedClient {
  const seen: ModelRequest[] = []
  const pending: Record<string, Action | null> = { consultant: null, assistant: null }
  return {
    seen,
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        const who = memberOf(req)
        const room = /You have a turn in room (\S+?)\./.exec(
          JSON.stringify(req.messages),
        )?.[1]
        let action: Action | null
        if (!afterTool(req)) {
          action = script[who].shift() ?? { decline: true }
        } else {
          action = pending[who]
          pending[who] = null
        }
        let step: ModelStep
        if (action === null) {
          step = says('Done.')
        } else if ('step' in action) {
          step = action.step
          pending[who] = action.then ?? null
        } else if ('say' in action) {
          step = calls('GroupSay', { group: room, text: action.say })
        } else {
          step = calls('GroupSay', { group: room, decline: true, text: 'Nothing from me.' })
        }
        const events = metered({ input_tokens: 500, output_tokens: 20 }, step)(req)
        return (async function* () {
          for (const event of events) yield event
        })()
      },
    },
  }
}

/**
 * The chat tickets this business holds that are rooms — for one site's room
 * when `site` is given, since every case shares the business.
 */
async function rooms(
  site?: string,
): Promise<Array<{ uid: string; fields: Record<string, unknown> }>> {
  const tickets = await ticketStoreFor(routerEnv() as never, scope)
  const { tickets: chats } = await tickets.query({ predicate: 'type=chat', limit: 'all' })
  return chats
    .filter((t) => (t.fields as Record<string, unknown>)?.is_group === true)
    .filter((t) => site === undefined || t.fields?.session_id === `room-${site}`)
    .map((t) => ({ uid: t.uid, fields: t.fields as Record<string, unknown> }))
}

const toolNames = (req: ModelRequest): string[] => req.tools.map((tool) => tool.name)

const posts = (stream: Frame[]): Frame[] => stream.filter((f) => f.kind === ROOM_POST)

describe('REQ-357 — the builder conversation as a group chat', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(async () => {
    setModelClient(null)
    await env.DB.prepare('DELETE FROM business_network_settings').run()
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_REQ-357_switch_off_leaves_the_builder_conversation_unchanged', async () => {
    // NOTHING STORED AND NOTHING CHOSEN: the switch reads off, and the
    // conversation is the site's own, exactly as before group chat existed.
    const view = await ask(NETWORK_GROUP_CHAT_PATH)
    expect(await view.json()).toEqual({ groupChat: false, stored: null })

    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('off') })
    const opened = await open(site)
    expect(opened.sessionId).toBe(`site-${site}`)
    expect(opened.group).toBeUndefined()

    const client = roomClient({ consultant: [], assistant: [] })
    setModelClient(client)
    await frames(await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Hello.' }))
    // ONE MODEL, NO ROOM TOOLS, NO ROOM PROSE, NO ROOM.
    expect(client.seen.length).toBeGreaterThan(0)
    for (const req of client.seen) {
      expect(memberOf(req)).toBe('consultant')
      for (const tool of ROOM_TOOLS) expect(toolNames(req)).not.toContain(tool)
      expect(sentText(req)).not.toContain('GroupSay')
    }
    expect(await rooms(site)).toEqual([])
  })

  it('test_UAT_FC_REQ-357_switch_on_creates_a_room_with_both_members_and_keeps_the_consultant_conversation', async () => {
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('on') })
    // A CONVERSATION BEFORE THE SWITCH, which is what must survive it.
    const before = await open(site)
    setModelClient(scriptedClient([says('Darker it is.')]))
    await frames(
      await post('/api/ai/prompt', { sessionId: before.sessionId, text: 'Make the hero darker.' }),
    )
    const history = (await open(site)).turns
    expect(history.map((t) => t.markdown).join('\n')).toContain('Make the hero darker.')

    await setGroupChat(true)
    const opened = await open(site)
    expect(opened.ready).toBe(true)
    expect(opened.sessionId).toBe(`room-${site}`)
    expect(opened.turns).toEqual([])
    expect(opened.group?.names).toEqual(NAMES)

    // ONE ROOM, ITS OWN CHAT TICKET, THE TWO MEMBERS' CHAT TICKETS AS ITS ROSTER.
    const made = await rooms(site)
    expect(made).toHaveLength(1)
    expect(made[0].fields.session_id).toBe(`room-${site}`)
    const members = made[0].fields.members as string[]
    expect(members).toHaveLength(2)
    const tickets = await ticketStoreFor(routerEnv() as never, scope)
    const homed = await Promise.all(
      members.map(async (uid) => (await tickets.get({ uid })).ticket.fields?.session_id),
    )
    expect(homed).toEqual([`site-${site}`, `assistant-${site}`])

    // THE CONSULTANT'S CONVERSATION IS ITS PRIVATE SESSION NOW, UNCHANGED…
    const privateRead = await post('/api/ai/private', { site })
    expect(privateRead.status).toBe(200)
    const { members: sessions } = (await privateRead.json()) as {
      members: Array<{ role: string; name: string; turns: Opened['turns'] }>
    }
    expect(sessions.map((m) => [m.role, m.name])).toEqual([
      ['consultant', NAMES.consultant],
      ['assistant', NAMES.assistant],
    ])
    expect(sessions[0].turns).toEqual(history)

    // …AND SWITCHING OFF RETURNS THE BUILDER TO IT.
    await setGroupChat(false)
    const back = await open(site)
    expect(back.sessionId).toBe(`site-${site}`)
    expect(back.turns).toEqual(history)
  })

  it('test_UAT_FC_REQ-357_the_assistant_reads_and_posts_and_cannot_write_delegate_draw_or_photograph', async () => {
    await setGroupChat(true)
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('manual') })
    const opened = await open(site)
    const client = roomClient({ consultant: [{ say: 'Noted.' }], assistant: [{ say: 'Agreed.' }] })
    setModelClient(client)
    await frames(await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Hi both.' }))

    const assistantReq = client.seen.find((req) => memberOf(req) === 'assistant')
    expect(assistantReq, 'the assistant took a round').toBeDefined()
    const offered = toolNames(assistantReq!)
    for (const tool of [...READ_TOOLS, ...ROOM_TOOLS]) expect(offered).toContain(tool)
    for (const tool of WRITE_TOOLS) expect(offered).not.toContain(tool)
    // No delegation, no image generation or editing, no camera.
    for (const tool of ['Delegate', 'CreateImage', 'edit_image', 'capture_site', 'screenshot']) {
      expect(offered).not.toContain(tool)
    }
    // AND THE CONSULTANT KEEPS ITS OWN TOOLS, WITH THE ROOM'S ADDED.
    const consultantReq = client.seen.find((req) => memberOf(req) === 'consultant')!
    for (const tool of ROOM_TOOLS) expect(toolNames(consultantReq)).toContain(tool)
    expect(toolNames(consultantReq)).toContain('Delegate')
    // THE MANUAL NAMES THE ROLE, NOT A DISPLAY NAME.
    expect(sentText(assistantReq!)).toContain('You are the assistant in a group chat')
  })

  it('test_UAT_FC_REQ-357_a_client_message_posts_to_the_room_and_both_members_are_called_on_a_cold_isolate', async () => {
    await setGroupChat(true)
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('cold') })
    const opened = await open(site)
    // A COLD ISOLATE: every host, manager and junction mirror is dropped, so the
    // prompt request finds neither member's junction loaded.
    resetAiHost()
    resetChatHost()

    const client = roomClient({
      consultant: [{ say: 'A deeper blue would read as calmer.' }],
      assistant: [{ say: 'That matches what you asked for on Monday.' }],
    })
    setModelClient(client)
    const stream = await frames(
      await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Make it calmer.' }),
    )

    // BOTH MEMBERS WERE CALLED — neither recorded as skipped.
    expect(new Set(client.seen.map(memberOf))).toEqual(new Set(['consultant', 'assistant']))
    const said = posts(stream).map((f) => [f.meta?.speaker, f.content])
    expect(said).toContainEqual([NAMES.client, 'Make it calmer.'])
    expect(said).toContainEqual([NAMES.consultant, 'A deeper blue would read as calmer.'])
    expect(said).toContainEqual([NAMES.assistant, 'That matches what you asked for on Monday.'])
    expect(posts(stream).some((f) => /was skipped/.test(f.content))).toBe(false)

    // THE BRIEF IS WHAT A MEMBER RECEIVED — not the client's words relayed.
    const firstConsultant = client.seen.find((req) => memberOf(req) === 'consultant')!
    expect(turnTailText(firstConsultant)).toContain('You have a turn in room')

    // EACH MEMBER'S EVENTS ARE FORWARDED, tagged, and the exchange ends once.
    const memberDone = stream.filter((f) => f.kind === MEMBER_DONE).map((f) => f.meta?.member)
    expect(memberDone).toContain(NAMES.consultant)
    expect(memberDone).toContain(NAMES.assistant)
    const ends = stream.filter((f) => f.kind === 'done')
    expect(ends).toHaveLength(1)
    expect(ends[0].meta?.status).toBe('complete')
  })

  it('test_UAT_FC_REQ-357_a_second_run_against_a_live_room_is_refused_and_a_stop_ends_the_exchange', async () => {
    await setGroupChat(true)
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('stop') })
    const opened = await open(site)

    // THE CONSULTANT'S FIRST ROUND IS HELD OPEN until the case says so.
    let release = (): void => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let arrived = (): void => {}
    const reached = new Promise<void>((resolve) => {
      arrived = resolve
    })
    const held: ModelStep = () => []
    const base = roomClient({
      consultant: [{ step: held }],
      assistant: [{ say: 'I should not be reached.' }],
    })
    const client: ScriptedClient = {
      seen: base.seen,
      messages: {
        create: async (req) => {
          if (memberOf(req) === 'consultant' && base.seen.length === 0) {
            base.seen.push(req)
            arrived()
            return (async function* () {
              yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
              yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Thinking' } }
              await gate
              yield { type: 'content_block_stop', index: 0 }
            })()
          }
          return base.messages.create(req)
        },
      },
    }
    setModelClient(client)

    const running = post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Take a look.' })
    await reached

    // A SECOND RUN WHILE ONE IS LIVE IS REFUSED, in words, without a model call.
    const second = await frames(
      await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'And another thing.' }),
    )
    expect(second.map((f) => f.content).join('')).toContain(EXCHANGE_BUSY)
    expect(second.at(-1)?.meta?.status).toBe('refused')
    // AND THE GUARD IS A FIELD ON THE ROOM'S TICKET, not a flag in memory.
    const [room] = await rooms(site)
    expect(JSON.parse(String(room.fields.exchange)).calling).toBe(`site-${site}`)

    // STOP IS RECORDED DURABLY, then the held round is let go.
    const stop = await post('/api/ai/stop', { sessionId: opened.sessionId })
    expect(await stop.json()).toEqual({ stopping: true })
    release()
    const first = await frames(await running)

    const ends = first.filter((f) => f.kind === 'done')
    expect(ends).toHaveLength(1)
    expect(ends[0].meta?.status).toBe('aborted')
    // The assistant never got a round, and the room is free again.
    expect(base.seen.some((req) => memberOf(req) === 'assistant')).toBe(false)
    const [after] = await rooms(site)
    expect(after.fields.exchange ?? '').toBe('')
    expect(await (await post('/api/ai/stop', { sessionId: opened.sessionId })).json()).toEqual({
      stopping: false,
    })
  })

  it('test_UAT_FC_REQ-357_a_member_round_that_writes_raises_site_changed_and_its_spend_is_recorded', async () => {
    // THE CONSULTANT HOLDS ITS OWN WRITE GROUPS where the business does not
    // delegate, which is the simplest way for a member round to write.
    expect((await post(NETWORK_DELEGATION_PATH, { enabled: false })).status).toBe(200)
    await setGroupChat(true)
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('write') })
    const opened = await open(site)
    setModelClient(
      roomClient({
        consultant: [
          {
            step: calls('add_page', { page: 'services', title: 'Services' }),
            then: { say: 'I added a services page.' },
          },
        ],
        assistant: [],
      }),
    )
    const stream = await frames(
      await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Add a services page.' }),
    )
    const changed = stream.filter((f) => f.kind === 'site_changed')
    expect(changed.length).toBeGreaterThan(0)
    expect(changed[0].meta?.member).toBe(NAMES.consultant)

    // EVERY MEMBER ROUND IS METERED under its own session and role.
    const { results } = await env.DB.prepare(
      'SELECT session_id, role FROM turn_spend WHERE session_id IN (?, ?)',
    )
      .bind(`site-${site}`, `assistant-${site}`)
      .all<{ session_id: string; role: string }>()
    const rows = (results ?? []).map((r) => [r.session_id, r.role])
    expect(rows).toContainEqual([`site-${site}`, 'consultant'])
    expect(rows).toContainEqual([`assistant-${site}`, 'assistant'])
  })

  it('test_UAT_FC_REQ-357_the_room_transcript_replays_with_speaker_attribution', async () => {
    await setGroupChat(true)
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('replay') })
    const opened = await open(site)
    setModelClient(
      roomClient({
        consultant: [{ say: 'Here is my view.' }],
        assistant: [{ say: 'And the brief says premium.' }],
      }),
    )
    const live = posts(
      await frames(await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Thoughts?' })),
    ).map((f) => [f.meta?.speaker, f.meta?.role, f.content])

    resetAiHost()
    resetChatHost()
    const replayed = (await open(site)).turns.map((t) => [t.speaker, t.role, t.markdown])
    // IDENTICAL ON RELOAD to what streamed live, in order, attributed.
    expect(replayed).toEqual(live)
    expect(replayed.slice(0, 3)).toEqual([
      [NAMES.client, 'user', 'Thoughts?'],
      [NAMES.consultant, 'assistant', 'Here is my view.'],
      [NAMES.assistant, 'assistant', 'And the brief says premium.'],
    ])
  })
})
