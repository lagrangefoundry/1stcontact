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
import { COUNTER_KEYS, costMicros, type TurnCounters } from '../tools/generate/src/cli/ai/spend-core'
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
import { applySchema, seedTenantSite, splitStatements } from './support/d1-site-factory'
import retireAssistantSessions from '../db/migrations/0024_retire_assistant_sessions.sql?raw'
import restoreRetiredRooms from '../db/migrations/0025_restore_retired_rooms.sql?raw'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-357]] — a builder conversation as a group chat: one room in which the
 * client, the consultant and the coordinator all post, behind a per-business
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
 * `group-chat.json`; the coordinator's model out of `backends.json`.
 */

const BUSINESS = 'req357-business'
const NAMES = groupNames()
const COORDINATOR_MODEL = (backendsDocument as Record<string, { model?: string }>).claude_coordinator
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

/** Who a request was from: the coordinator runs on its own backend's model. */
const memberOf = (req: ModelRequest): 'consultant' | 'coordinator' =>
  req.model === COORDINATOR_MODEL ? 'coordinator' : 'consultant'

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
function roomClient(script: { consultant: Action[]; coordinator: Action[] }): ScriptedClient {
  const seen: ModelRequest[] = []
  const pending: Record<string, Action | null> = { consultant: null, coordinator: null }
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

    const client = roomClient({ consultant: [], coordinator: [] })
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
    expect(homed).toEqual([`site-${site}`, `coordinator-${site}`])

    // THE CONSULTANT'S CONVERSATION IS ITS PRIVATE SESSION NOW, UNCHANGED…
    const privateRead = await post('/api/ai/private', { site })
    expect(privateRead.status).toBe(200)
    const { members: sessions } = (await privateRead.json()) as {
      members: Array<{ role: string; name: string; turns: Opened['turns'] }>
    }
    expect(sessions.map((m) => [m.role, m.name])).toEqual([
      ['consultant', NAMES.consultant],
      ['coordinator', NAMES.coordinator],
    ])
    expect(sessions[0].turns).toEqual(history)

    // …AND SWITCHING OFF RETURNS THE BUILDER TO IT.
    await setGroupChat(false)
    const back = await open(site)
    expect(back.sessionId).toBe(`site-${site}`)
    expect(back.turns).toEqual(history)
  })

  it('test_UAT_FC_REQ-357_the_coordinator_reads_and_posts_and_cannot_write_delegate_draw_or_photograph', async () => {
    await setGroupChat(true)
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('manual') })
    const opened = await open(site)
    const client = roomClient({ consultant: [{ say: 'Noted.' }], coordinator: [{ say: 'Agreed.' }] })
    setModelClient(client)
    await frames(await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Hi both.' }))

    const coordinatorReq = client.seen.find((req) => memberOf(req) === 'coordinator')
    expect(coordinatorReq, 'the coordinator took a round').toBeDefined()
    const offered = toolNames(coordinatorReq!)
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
    expect(sentText(coordinatorReq!)).toContain('You are the coordinator in a group chat')
  })

  it('test_UAT_FC_BUG-177_after_an_exchange_both_members_private_sessions_are_readable_by_their_current_ids', async () => {
    await setGroupChat(true)
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('private') })
    const opened = await open(site)
    setModelClient(
      roomClient({ consultant: [{ say: 'Try amber.' }], coordinator: [{ say: 'Amber fits the brand.' }] }),
    )
    const stream = await frames(
      await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Warmer, please.' }),
    )
    // THE SIGNAL THE DEBUG TAB REDRAWS ON is on the wire, once per member round.
    const rounds = stream.filter((f) => f.kind === 'member_done').map((f) => f.meta?.member)
    expect(rounds).toContain(NAMES.consultant)
    expect(rounds).toContain(NAMES.coordinator)

    // BOTH MEMBERS' SESSIONS, homed under their current ids (REQ-358's rename)…
    const made = await rooms(site)
    const tickets = await ticketStoreFor(routerEnv() as never, scope)
    const homed = await Promise.all(
      (made[0].fields.members as string[]).map(
        async (uid) => (await tickets.get({ uid })).ticket.fields?.session_id,
      ),
    )
    expect(homed).toEqual([`site-${site}`, `coordinator-${site}`])

    // …and each one, read back for the Debug tab, holds the round it just took.
    const read = await post('/api/ai/private', { site })
    expect(read.status).toBe(200)
    const { members } = (await read.json()) as {
      members: Array<{ role: string; name: string; turns: Opened['turns'] }>
    }
    expect(members.map((m) => m.role)).toEqual(['consultant', 'coordinator'])
    for (const member of members) expect(member.turns.length).toBeGreaterThan(0)
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
      coordinator: [{ say: 'That matches what you asked for on Monday.' }],
    })
    setModelClient(client)
    const stream = await frames(
      await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Make it calmer.' }),
    )

    // BOTH MEMBERS WERE CALLED — neither recorded as skipped.
    expect(new Set(client.seen.map(memberOf))).toEqual(new Set(['consultant', 'coordinator']))
    const said = posts(stream).map((f) => [f.meta?.speaker, f.content])
    expect(said).toContainEqual([NAMES.client, 'Make it calmer.'])
    expect(said).toContainEqual([NAMES.consultant, 'A deeper blue would read as calmer.'])
    expect(said).toContainEqual([NAMES.coordinator, 'That matches what you asked for on Monday.'])
    expect(posts(stream).some((f) => /was skipped/.test(f.content))).toBe(false)

    // THE BRIEF IS WHAT A MEMBER RECEIVED — not the client's words relayed.
    const firstConsultant = client.seen.find((req) => memberOf(req) === 'consultant')!
    expect(turnTailText(firstConsultant)).toContain('You have a turn in room')

    // EACH MEMBER'S EVENTS ARE FORWARDED, tagged, and the exchange ends once.
    const memberDone = stream.filter((f) => f.kind === MEMBER_DONE).map((f) => f.meta?.member)
    expect(memberDone).toContain(NAMES.consultant)
    expect(memberDone).toContain(NAMES.coordinator)
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
      coordinator: [{ say: 'I should not be reached.' }],
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
    // The coordinator never got a round, and the room is free again.
    expect(base.seen.some((req) => memberOf(req) === 'coordinator')).toBe(false)
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
        coordinator: [],
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
      .bind(`site-${site}`, `coordinator-${site}`)
      .all<{ session_id: string; role: string }>()
    const rows = (results ?? []).map((r) => [r.session_id, r.role])
    expect(rows).toContainEqual([`site-${site}`, 'consultant'])
    expect(rows).toContainEqual([`coordinator-${site}`, 'coordinator'])
  })

  it('test_UAT_FC_REQ-362_each_member_rounds_spend_row_names_and_is_priced_at_its_own_backend', async () => {
    // [[REQ-362]] — the meter stamped the consultant's backend and model on
    // every role's row, so a coordinator round on Haiku was recorded, and
    // priced, as Opus. Each row must name the backend that ran.
    await setGroupChat(true)
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('meter') })
    const opened = await open(site)
    setModelClient(roomClient({ consultant: [{ say: 'Noted.' }], coordinator: [{ say: 'Agreed.' }] }))
    await frames(await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Hi both.' }))

    type Row = TurnCounters & { role: string; backend: string; model: string; cost_micros: number | null }
    const { results } = await env.DB.prepare(
      `SELECT role, backend, model, cost_micros, ${COUNTER_KEYS.join(', ')}
         FROM turn_spend WHERE session_id IN (?, ?)`,
    )
      .bind(`site-${site}`, `coordinator-${site}`)
      .all<Row>()
    const rows = results ?? []
    const documented = backendsDocument as Record<string, { model?: string }>
    const expected: Record<string, string> = { consultant: 'claude', coordinator: 'claude_coordinator' }
    for (const role of Object.keys(expected)) {
      const mine = rows.filter((r) => r.role === role)
      expect(mine.length, `${role} rounds were metered`).toBeGreaterThan(0)
      for (const row of mine) {
        expect([row.backend, row.model]).toEqual([expected[role], documented[expected[role]].model])
        expect(row.cost_micros).not.toBeNull()
        expect(row.cost_micros).toBe(costMicros(row, row.backend, row.model))
      }
    }
    // The pair is the consultant's Opus and the coordinator's Haiku, priced apart.
    expect(documented.claude.model).toBe('claude-opus-5-5')
    expect(documented.claude_coordinator.model).toBe('claude-haiku-4-5')
  })

  it('test_UAT_FC_REQ-357_the_room_transcript_replays_with_speaker_attribution', async () => {
    await setGroupChat(true)
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('replay') })
    const opened = await open(site)
    setModelClient(
      roomClient({
        consultant: [{ say: 'Here is my view.' }],
        coordinator: [{ say: 'And the brief says premium.' }],
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
      [NAMES.coordinator, 'assistant', 'And the brief says premium.'],
    ])
  })
  it('test_UAT_FC_REQ-358_both_members_are_primed_to_read_doc_64_and_only_in_a_room', async () => {
    // FINDING 13'S LESSON ([[REQ-358]]): a document nothing names is not read, so
    // both members' assembled priming names DOC-64 — the one that says what each
    // of them does and how a build runs — and the consultant's says it only where
    // the business runs a group chat.
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('doc64') })
    const solo = scriptedClient([says('Hello.')])
    setModelClient(solo)
    await frames(await post('/api/ai/prompt', { sessionId: (await open(site)).sessionId, text: 'Hi.' }))
    expect(sentText(solo.seen[0])).not.toContain('DOC-64')

    resetAiHost()
    resetChatHost()
    await setGroupChat(true)
    const opened = await open(site)
    const client = roomClient({ consultant: [{ say: 'Noted.' }], coordinator: [{ say: 'Agreed.' }] })
    setModelClient(client)
    await frames(await post('/api/ai/prompt', { sessionId: opened.sessionId, text: 'Hi both.' }))
    const consultantReq = client.seen.find((req) => memberOf(req) === 'consultant')
    const coordinatorReq = client.seen.find((req) => memberOf(req) === 'coordinator')
    expect(sentText(consultantReq!)).toMatch(/read DOC-64 in your knowledge base/)
    expect(sentText(coordinatorReq!)).toMatch(/DOC-64 in your knowledge base/)
    expect(sentText(consultantReq!)).toContain('you share with the coordinator')
    expect(sentText(consultantReq!)).not.toMatch(/your assistant/)
  })

  /** The consultant's transcript comment body — what must come through any fix byte-identical. */
  async function consultantTranscript(site: string): Promise<string> {
    const tickets = await ticketStoreFor(routerEnv() as never, scope)
    const { tickets: chats } = await tickets.query({ predicate: 'type=chat', limit: 'all' })
    const home = chats.find((t) => t.fields?.session_id === `site-${site}`)
    expect(home, 'the consultant conversation has a chat ticket').toBeDefined()
    const { comments } = await tickets.comments({ uid: home!.uid })
    const transcript = comments.filter((c) => c.fields?.kind === 'chat_transcript')
    expect(transcript).toHaveLength(1)
    return String(transcript[0].body)
  }

  /** A site with a consultant conversation already in it. */
  async function siteWithConversation(slug: string): Promise<{ site: string; transcript: string }> {
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug(slug) })
    setModelClient(scriptedClient([says('Darker it is.')]))
    await frames(
      await post('/api/ai/prompt', { sessionId: (await open(site)).sessionId, text: 'Darker.' }),
    )
    resetAiHost()
    resetChatHost()
    return { site, transcript: await consultantTranscript(site) }
  }

  it('test_UAT_FC_BUG-176_a_room_whose_member_is_replaced_keeps_its_ticket_and_contributions', async () => {
    // [[BUG-176]] supersedes REQ-358's "recreated": a room opened before the
    // rename keeps its ticket, junction and history; only its roster changes.
    const { site } = await siteWithConversation('replaced')
    await setGroupChat(true)
    const first = await open(site)
    setModelClient(
      roomClient({ consultant: [{ say: 'Here is my view.' }], coordinator: [{ say: 'Agreed.' }] }),
    )
    await frames(await post('/api/ai/prompt', { sessionId: first.sessionId, text: 'Thoughts?' }))
    resetAiHost()
    resetChatHost()

    // WHAT A DATABASE OPENED UNDER REQ-357 HOLDS: the second member homed as
    // `assistant-<site>`, listed in the room's roster.
    const tickets = await ticketStoreFor(routerEnv() as never, scope)
    const [room] = await rooms(site)
    const consultantUid = (room.fields.members as string[])[0]
    const { ticket: legacy } = await tickets.create({
      type: 'chat',
      title: `assistant-${site}`,
      body: '',
      fields: { session_id: `assistant-${site}`, backend: `claude_assistant+site:${site}` },
    })
    await tickets.update({ uid: room.uid, patch: { fields: { members: [consultantUid, legacy.uid] } } })
    // The consultant's conversation as it stands once its room rounds are in it.
    const transcript = await consultantTranscript(site)

    // THE MIGRATIONS AS A REAL DATABASE RUNS THEM: 0024 retires, 0025 restores.
    for (const sql of [retireAssistantSessions, restoreRetiredRooms]) {
      for (const statement of splitStatements(sql)) await env.DB.prepare(statement).run()
    }
    resetAiHost()
    resetChatHost()

    const reopened = await open(site)
    expect(reopened.ready, reopened.error).toBe(true)
    const after = await rooms(site)
    expect(after.map((r) => r.uid)).toEqual([room.uid])
    const members = after[0].fields.members as string[]
    expect(members).not.toContain(legacy.uid)
    const homed = await Promise.all(
      members.map(async (uid) => (await tickets.get({ uid })).ticket.fields?.session_id),
    )
    expect(homed).toEqual([`site-${site}`, `coordinator-${site}`])
    // THE CONTRIBUTIONS SURVIVE, and the consultant's conversation is untouched.
    const said = reopened.turns.map((t) => t.markdown)
    expect(said).toContain('Thoughts?')
    expect(said).toContain('Here is my view.')
    expect(await consultantTranscript(site)).toBe(transcript)
  })

  it('test_UAT_FC_BUG-176_an_archived_room_whose_junction_survives_is_created_afresh', async () => {
    const { site, transcript } = await siteWithConversation('orphan')
    await setGroupChat(true)
    expect((await open(site)).ready).toBe(true)
    const [room] = await rooms(site)

    // THE ROOM TICKET GOES; ITS JUNCTION, in the Durable Object, does not.
    const tickets = await ticketStoreFor(routerEnv() as never, scope)
    await tickets.archive({ uid: room.uid })
    resetAiHost()
    resetChatHost()

    const reopened = await open(site)
    expect(reopened.ready, reopened.error).toBe(true)
    expect(reopened.sessionId).toBe(`room-${site}`)
    const after = await rooms(site)
    expect(after).toHaveLength(1)
    expect(after[0].uid).not.toBe(room.uid)
    const homed = await Promise.all(
      (after[0].fields.members as string[]).map(
        async (uid) => (await tickets.get({ uid })).ticket.fields?.session_id,
      ),
    )
    expect(homed).toEqual([`site-${site}`, `coordinator-${site}`])
    // THE CONSULTANT'S CONVERSATION, byte-identical through all of it.
    expect(await consultantTranscript(site)).toBe(transcript)
  })

  it('test_UAT_FC_BUG-176_a_business_with_no_room_opens_one_around_its_existing_conversation', async () => {
    const { site, transcript } = await siteWithConversation('legacy')
    const tickets = await ticketStoreFor(routerEnv() as never, scope)
    const { tickets: chats } = await tickets.query({ predicate: 'type=chat', limit: 'all' })
    const consultantUid = chats.find((t) => t.fields?.session_id === `site-${site}`)!.uid

    await setGroupChat(true)
    const opened = await open(site)
    expect(opened.ready, opened.error).toBe(true)
    const made = await rooms(site)
    expect(made).toHaveLength(1)
    expect((made[0].fields.members as string[])[0]).toBe(consultantUid)
    expect(await consultantTranscript(site)).toBe(transcript)
  })
})
