import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  FINISHED_CUE,
  PLAN_ASK_PATH,
  PLAN_BOARD_PATH,
  PLAN_FOCUS_PATH,
  PLAN_PATH,
  resetChatHost,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { sitePlan } from '../apps/control-app/src/plan'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { finishedCue } from '../tools/generate/src/cli/ai/roles'
import { FOCUS_MAX_STORY_NOTES } from '../tools/generate/src/cli/ai/plan-core'
import { pinNotes } from '../tools/generate/src/cli/ai/story-core'
import {
  calls,
  says,
  scriptedClient,
  sentText,
  turnTailText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
  type WireEvent,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-424]] — **guided focus tasks: the host half.** The consultant starts a
 * task at a point it chooses, the task's surface is put in front of the client,
 * nothing new goes on that surface while it is open, the host knows when the
 * client has finished — every item done, or Done — and the consultant is told and
 * resumes on the host's cue.
 *
 * EVERY CASE DRIVES THE ROUTES A REQUEST DRIVES — `/api/ai/session`,
 * `/api/ai/prompt`, `/api/plan`, `/api/plan/ask`, `/api/plan/board`,
 * `/api/plan/focus` — through the Worker's own `route`, against a real D1 and the
 * real ticket store. One double: the Anthropic client (the network).
 */

const BUSINESS = 'req424-business'
const INTRO = 'Heart the notes that sound most like you.'
const VIEW = { width: 1280, height: 800, mode: 'desktop' }

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

async function site(): Promise<{ site: string; sessionId: string }> {
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('req424') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return { site, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

/** One client message, the consultant scripted. */
async function turn(sessionId: string, text: string, steps: ModelStep[]): Promise<{ frames: Frame[]; seen: ModelRequest[] }> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text, view: VIEW })
  expect(response.status).toBe(200)
  return { frames: await frames(response), seen: client.seen }
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

type FocusView = { kind: string; intro: string; total: number; closed: number; pending: string[] }
type View = {
  focus: FocusView | null
  focus_later: string[]
  focus_finished_at: string | null
  board: { themes: { notes: { id: string; text: string }[] }[] }
}
const planView = async (key: string): Promise<View> => {
  const res = await ask(`${PLAN_PATH}?site=${encodeURIComponent(key)}`)
  expect(res.status).toBe(200)
  return (await res.json()) as View
}

/** `n` sayings the consultant pinned, as `pin_notes` leaves them. */
async function pinned(key: string, n: number): Promise<void> {
  const notes = Array.from({ length: n }, (_, i) => ({
    text: `Saying ${i + 1}`,
    quote: `I always say saying ${i + 1}.`,
    emoji: '💬',
    theme: i % 2 ? 'The work' : 'Beginnings',
  }))
  await sitePlan(await ticketStoreFor(routerEnv() as never, scope), key).write((current) => {
    const next = JSON.parse(JSON.stringify(current))
    pinNotes(next.fields, { notes }, new Date().toISOString())
    return next
  })
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-424 — the consultant starts a focus task, and its surface is put in front of the client', () => {
  it('test_UAT_FC_REQ-424_a_story_task_covers_the_first_batch_switches_to_story_and_tells_the_consultant_to_say_one_line', async () => {
    const ctx = await site()
    await pinned(ctx.site, FOCUS_MAX_STORY_NOTES + 2)

    let answered = ''
    const { frames: fs } = await turn(ctx.sessionId, 'Go on then.', [
      calls('start_focus', { kind: 'story', intro: INTRO }),
      (req) => {
        answered = toolResult(req)
        return says("While I build, have a look at the story board and heart the notes that sound most like you. I've put it in front of you.")(req)
      },
    ])

    // THE SURFACE IS PUT IN FRONT OF THE CLIENT, the way show_client's switch is.
    expect(fs.filter((f) => f.kind === 'show_client').map((f) => f.meta?.href)).toEqual(['#show=story'])
    expect(answered).toMatch(/"how": "switch"/)
    // ONE LINE, AND NOTHING ELSE ASKED.
    expect(answered).toContain('ONE line')
    expect(answered).toContain('Ask nothing else in this message')

    // THE TASK IS SMALL: the first batch of new notes; the rest wait, marked new.
    const shown = await planView(ctx.site)
    expect(shown.focus).toMatchObject({ kind: 'story', intro: INTRO, total: FOCUS_MAX_STORY_NOTES, closed: 0 })
    expect(shown.focus!.pending).toHaveLength(FOCUS_MAX_STORY_NOTES)
    expect(shown.focus_later).toHaveLength(2)
    expect(shown.focus_later.some((id) => shown.focus!.pending.includes(id))).toBe(false)
  })

  it('test_UAT_FC_REQ-424_while_a_task_is_open_nothing_new_goes_on_its_surface_and_the_reminder_says_so', async () => {
    const ctx = await site()
    await pinned(ctx.site, 3)
    await turn(ctx.sessionId, 'Ready.', [calls('start_focus', { kind: 'story', intro: INTRO }), says('Have a look at the story board.')])

    const results: string[] = []
    const keep = (req: ModelRequest) => results.push(toolResult(req))
    const { seen } = await turn(ctx.sessionId, 'My dad always said measure twice.', [
      calls('pin_notes', { notes: [{ text: 'Measure twice', quote: 'My dad always said measure twice.', emoji: '📏', theme: 'Beginnings' }] }),
      (req) => (keep(req), calls('start_focus', { kind: 'questions', intro: 'Answer these.' })(req)),
      (req) => (keep(req), calls('set_ask', { ask: 'hours', prompt: 'What are your hours?', why: 'For the footer.', input: 'text' })(req)),
      (req) => (keep(req), says('Noted — I will put that on the board once you are done.')(req)),
    ])
    // NO NEW NOTE while they react, and no second task.
    expect(results[0]).toContain('FOCUS_OPEN')
    expect(results[1]).toContain('FOCUS_OPEN')
    // ANOTHER SURFACE IS NOT HELD UP.
    expect(results[2]).not.toContain('FOCUS_OPEN')
    // THE CONSULTANT IS TOLD THE TASK IS OPEN, every turn.
    expect(turnTailText(seen[0])).toContain('Focus task open: your client is reacting to notes on the story board (0 of 3 done')

    // A QUESTIONS TASK HOLDS THE PANEL IN THE SAME WAY — once the story task is ended.
    const after: string[] = []
    await turn(ctx.sessionId, 'Let us do the questions.', [
      calls('end_focus', {}),
      calls('start_focus', { kind: 'questions', intro: 'A few quick ones.' }),
      (req) => (after.push(toolResult(req)), calls('set_ask', { ask: 'prices', prompt: 'Your prices?', why: 'For the services page.', input: 'text' })(req)),
      (req) => (after.push(toolResult(req)), says('Over to you.')(req)),
    ])
    expect(after[0]).toMatch(/"kind": "questions"/)
    expect(after[1]).toContain('FOCUS_OPEN')
    expect((await planView(ctx.site)).focus).toMatchObject({ kind: 'questions', total: 1 })
  })
})

describe('REQ-424 — the host knows when the client has finished, and the consultant resumes', () => {
  it('test_UAT_FC_REQ-424_every_note_reacted_finishes_the_task_and_the_cued_turn_names_what_they_hearted', async () => {
    const ctx = await site()
    await pinned(ctx.site, 3)
    await turn(ctx.sessionId, 'Ready.', [calls('start_focus', { kind: 'story', intro: INTRO }), says('Have a look at the story board.')])
    const [first, second, third] = (await planView(ctx.site)).focus!.pending

    await post(PLAN_BOARD_PATH, { site: ctx.site, action: 'react', note: first, reaction: 'heart' })
    let shown = (await (await post(PLAN_BOARD_PATH, { site: ctx.site, action: 'react', note: second, reaction: 'up' })).json()) as View
    expect(shown.focus).toMatchObject({ closed: 2, total: 3, pending: [third] })
    expect(shown.focus_finished_at).toBeNull()
    shown = (await (await post(PLAN_BOARD_PATH, { site: ctx.site, action: 'react', note: third, reaction: 'down' })).json()) as View
    // THE LAST REACTION FINISHES IT.
    expect(shown.focus).toBeNull()
    expect(typeof shown.focus_finished_at).toBe('string')

    // THE CONSULTANT RESUMES ON THE HOST'S CUE, told what the client did.
    const client = scriptedClient([says('You hearted Saying 1 — that leads the home page.')])
    setModelClient(client)
    const cued = await post('/api/ai/prompt', { sessionId: ctx.sessionId, cue: FINISHED_CUE })
    expect(cued.status).toBe(200)
    await cued.text()
    const told = turnTailText(client.seen[0])
    expect(told).toContain('Your client has finished the focus task you started — reacting to notes on the story board (every item is done)')
    expect(told).toContain('❤️ "Saying 1"')
    expect(told).toContain('Resume the conversation now, without being asked')
    // ONCE: a second cue is refused and starts no turn.
    expect((await post('/api/ai/prompt', { sessionId: ctx.sessionId, cue: FINISHED_CUE })).status).toBe(409)
    // THE CUE IS NOT THE CLIENT'S: a reload shows the consultant's reply alone.
    const replay = (await (await post('/api/ai/session', { site: ctx.site })).json()) as { turns: { role: string; markdown: string }[] }
    expect(replay.turns.some((t) => t.markdown === finishedCue())).toBe(false)
    expect(replay.turns.at(-1)).toMatchObject({ role: 'assistant', markdown: 'You hearted Saying 1 — that leads the home page.' })
  })

  it('test_UAT_FC_REQ-424_done_ends_a_questions_task_with_items_left_and_the_next_turn_is_told_how', async () => {
    const ctx = await site()
    await turn(ctx.sessionId, 'Ask me things.', [
      calls('set_ask', { ask: 'hours', prompt: 'What are your hours?', why: 'For the footer.', input: 'text' }),
      calls('set_ask', { ask: 'area', prompt: 'Which towns do you cover?', why: 'For the services page.', input: 'text' }),
      calls('set_ask', { ask: 'phone', prompt: 'Your phone number?', why: 'So customers can call.', input: 'phone' }),
      calls('start_focus', { kind: 'questions', intro: 'Three quick ones while I build.' }),
      says('While I build, answer the three questions on your panel.'),
    ])
    expect((await planView(ctx.site)).focus).toMatchObject({ kind: 'questions', total: 3, closed: 0 })

    const answered = (await (await post(PLAN_ASK_PATH, { site: ctx.site, ask: 'hours', action: 'answer', answer: '8 to 5' })).json()) as View
    expect(answered.focus).toMatchObject({ closed: 1, total: 3 })
    // DONE ENDS THE TASK, items left and all; a second Done has nothing to end.
    const done = await post(PLAN_FOCUS_PATH, { site: ctx.site, action: 'done' })
    expect(done.status).toBe(200)
    const after = (await done.json()) as View
    expect(after.focus).toBeNull()
    expect(typeof after.focus_finished_at).toBe('string')
    expect((await post(PLAN_FOCUS_PATH, { site: ctx.site, action: 'done' })).status).toBe(409)

    const { seen } = await turn(ctx.sessionId, 'That is all I know for now.', [says('Thanks — 8 to 5 it is.')])
    const told = turnTailText(seen[0])
    expect(told).toContain('answering the questions on the panel (they pressed Done with 2 of 3 left); they answered 1 and skipped 0 of 3 questions')
    // The task is over: the panel takes new questions again.
    expect(told).not.toContain('Focus task open')
  })

  it('test_UAT_FC_REQ-424_a_later_reaction_task_covers_only_the_notes_that_are_new', async () => {
    const ctx = await site()
    await pinned(ctx.site, FOCUS_MAX_STORY_NOTES + 2)
    await turn(ctx.sessionId, 'Ready.', [calls('start_focus', { kind: 'story', intro: INTRO }), says('Have a look.')])
    const firstBatch = (await planView(ctx.site)).focus!.pending
    const left = (await planView(ctx.site)).focus_later
    await post(PLAN_FOCUS_PATH, { site: ctx.site, action: 'done' })

    await turn(ctx.sessionId, 'More?', [calls('start_focus', { kind: 'story', intro: 'Two more.' }), says('Two more on the board.')])
    const second = await planView(ctx.site)
    expect(second.focus).toMatchObject({ kind: 'story', total: 2 })
    expect([...second.focus!.pending].sort()).toEqual([...left].sort())
    expect(second.focus!.pending.some((id) => firstBatch.includes(id))).toBe(false)
    expect(second.focus_later).toEqual([])
  })
})

// ── the talker, while the build runs ─────────────────────────────────────────

/** The talker is told it is one, every exchange (the framework's reminder). */
const isTalker = (req: ModelRequest): boolean => sentText(req).includes('You are the talker.')

/** A worker held inside its `hold`-th request while the talker answers ([[REQ-416]]'s harness). */
function forked(
  worker: Array<(req: ModelRequest) => WireEvent[]>,
  talker: Array<(req: ModelRequest) => WireEvent[]>,
  hold: (n: number) => Promise<void>,
): ScriptedClient & { talker: ModelRequest[] } {
  const seen: ModelRequest[] = []
  const workerSeen: ModelRequest[] = []
  const talkerSeen: ModelRequest[] = []
  return {
    seen,
    talker: talkerSeen,
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        let events: WireEvent[]
        if (isTalker(req)) {
          talkerSeen.push(req)
          events = talker[Math.min(talkerSeen.length - 1, talker.length - 1)](req)
        } else {
          workerSeen.push(req)
          const n = workerSeen.length - 1
          await hold(n)
          events = worker[Math.min(n, worker.length - 1)](req)
        }
        return (async function* () {
          for (const event of events) yield event
        })()
      },
    },
  } as ScriptedClient & { talker: ModelRequest[] }
}

const until = async (ok: () => boolean, ms = 8_000): Promise<void> => {
  const end = Date.now() + ms
  while (!ok()) {
    if (Date.now() > end) throw new Error('timed out waiting')
    await new Promise((r) => setTimeout(r, 25))
  }
}

describe('REQ-424 — the talker leaves the client to the task', () => {
  it('test_UAT_FC_REQ-424_a_talker_while_a_task_is_open_opens_no_new_topic_and_pins_nothing_there', async () => {
    const ctx = await site()
    await pinned(ctx.site, 2)
    const client = forked(
      [
        // The work starts the task while it builds, then goes on working.
        calls('start_focus', { kind: 'story', intro: INTRO }),
        calls('capture_site', { url: 'http://127.0.0.1/admin' }),
        says('While I build, have a look at the story board.'),
      ],
      [
        calls('pin_notes', { notes: [{ text: 'Forty years welding', quote: 'I have welded for forty years.', emoji: '🔥', theme: 'The work' }] }),
        says('Forty years! It will go on the board once you are done there.'),
      ],
      async (n) => {
        if (n !== 2) return
        // THE WORK IS RUNNING, the task open: the client writes now.
        await post('/api/ai/interpose', { sessionId: ctx.sessionId, text: 'I have welded for forty years.' })
        await until(() => client.talker.length >= 2)
        await new Promise((r) => setTimeout(r, 300))
      },
    )
    setModelClient(client)
    await frames(await post('/api/ai/prompt', { sessionId: ctx.sessionId, text: 'Build it.' }))

    // THE TALKER IS TOLD THE CLIENT IS WORKING THROUGH THE TASK — not to go discovering.
    const first = sentText(client.talker[0])
    expect(first).toContain('reacting to notes on the story board — a focus task the consultant started (0 of 2 done)')
    expect(first).toContain('open no new topic, ask no new question and pin nothing new')
    expect(first).not.toContain('Your standing job')
    // …and the board takes nothing new from it.
    expect(toolResult(client.talker[1])).toContain('FOCUS_OPEN')
    const notes = (await planView(ctx.site)).board.themes.flatMap((t) => t.notes)
    expect(notes.map((n) => n.text)).not.toContain('Forty years welding')
  })
})
