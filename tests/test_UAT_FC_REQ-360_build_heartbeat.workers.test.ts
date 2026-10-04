import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import {
  configureDelegation,
  DelegationConfigError,
  delegationDocument,
  delegationFromMapping,
} from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import { calls, says, scriptedClient, type ModelStep, type ScriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-360]] — **a delegated build says it is still going, on the stream the
 * client is reading.**
 *
 * The framework (lagrange-framework REQ-205) records `still working, elapsed N
 * min` on the consultant's open round every interval a worker runs. These cases
 * show that it reaches the client: live, on `/api/ai/prompt`, while the
 * `Delegate` call is still running; on `/api/ai/reattach` for a client that
 * reloaded mid-build; and nowhere in the conversation's record afterwards.
 *
 * EVERY CASE DRIVES THE ROUTES A REQUEST DRIVES, through the Worker's own
 * `route`, against a real D1, the real session machinery and the real delegation
 * surface. The one double is the Anthropic client, which is the network — held
 * open on the worker's side so that "during a build" is a state the test is in.
 */

const BUSINESS = 'req360-business'
const WORKER_MODEL = backendsDocument.claude_builder.model
/** A heartbeat every 200 ms, so a build held for a second says so several times. */
const QUICK = { ...delegationDocument, enabled: true, progress_seconds: 0.2 }
const HEARTBEAT = /^still working, elapsed \d+ min$/

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
const deps: RouterDeps = {}

const post = (path: string, body: unknown): Promise<Response> =>
  route(
    new Request(`https://app.example${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    routerEnv(),
    scope,
    deps,
    { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
  )

type Frame = { kind: string; content: string; meta?: Record<string, unknown> }

/** The frames of a streaming response, one at a time, as they arrive. */
function frameReader(response: Response): { next(): Promise<Frame | null>; drain(): Promise<Frame[]> } {
  const body = response.body!.getReader()
  const decoder = new TextDecoder()
  const queue: Frame[] = []
  let buffer = ''
  async function next(): Promise<Frame | null> {
    while (queue.length === 0) {
      const { value, done } = await body.read()
      if (done) return null
      buffer += decoder.decode(value, { stream: true })
      let end = buffer.indexOf('\n\n')
      while (end >= 0) {
        const line = buffer.slice(0, end).split('\n').find((l) => l.startsWith('data: '))
        if (line) queue.push(JSON.parse(line.slice('data: '.length)) as Frame)
        buffer = buffer.slice(end + 2)
        end = buffer.indexOf('\n\n')
      }
    }
    return queue.shift()!
  }
  async function drain(): Promise<Frame[]> {
    const out: Frame[] = []
    for (let frame = await next(); frame; frame = await next()) out.push(frame)
    return out
  }
  return { next, drain }
}

/** Read frames until `count` heartbeats have arrived. Answers everything read. */
async function untilHeartbeats(reader: ReturnType<typeof frameReader>, count: number): Promise<Frame[]> {
  const seen: Frame[] = []
  while (seen.filter((f) => f.kind === 'progress').length < count) {
    const frame = await reader.next()
    if (!frame) throw new Error(`the stream ended after ${seen.length} frames without ${count} heartbeats`)
    seen.push(frame)
  }
  return seen
}

/** A site and an open one-to-one conversation about it. */
async function site(): Promise<{ site: string; sessionId: string }> {
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('req360') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return { site, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

/**
 * One double for both sides of the hand-off, with the worker held at its first
 * request until `release` — so the build is running for exactly as long as the
 * test wants it to.
 */
function heldBuild(caller: ModelStep[], builder: ModelStep[]): ScriptedClient & { release(): void } {
  let atCaller = 0
  let atWorker = 0
  const step: ModelStep = (req) => {
    const [script, index] = req.model === WORKER_MODEL ? [builder, atWorker++] : [caller, atCaller++]
    return script[Math.min(index, script.length - 1)](req)
  }
  const inner = scriptedClient([step])
  let release = (): void => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let held = false
  return {
    ...inner,
    release: () => release(),
    messages: {
      create: async (req) => {
        if (req.model === WORKER_MODEL && !held) {
          held = true
          await gate
        }
        return inner.messages.create(req)
      },
    },
  }
}

const BUILDS: ModelStep[] = [calls('ReportResult', { summary: 'Built the home page.', changed: [] }), says('Reported.')]
const DELEGATES: ModelStep[] = [
  calls('Delegate', { role: BUILDER_ROLE, goal: 'Build the home page.', note: 'Building your home page now.' }),
  says('The home page is built.'),
]

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-360 — the build heartbeat reaches the client', () => {
  it('test_UAT_FC_REQ-360_a_running_build_streams_heartbeats_before_its_delegate_returns', async () => {
    configureDelegation(QUICK)
    const { sessionId } = await site()
    const client = heldBuild(DELEGATES, BUILDS)
    setModelClient(client)

    const turn = frameReader(await post('/api/ai/prompt', { sessionId, text: 'Build my site.' }))
    // THREE HEARTBEATS WHILE THE WORKER IS STILL HELD — which is the whole claim:
    // the build has not returned, so nothing but this could be on the stream.
    const during = await untilHeartbeats(turn, 3)
    expect(during.some((f) => f.kind === 'tool_activity' && f.meta?.name === 'Delegate')).toBe(false)
    client.release()
    const frames = [...during, ...(await turn.drain())]

    const beats = frames.filter((f) => f.kind === 'progress')
    expect(beats.length).toBeGreaterThanOrEqual(3)
    for (const beat of beats) {
      expect(beat.content).toMatch(HEARTBEAT)
      expect(typeof beat.meta?.elapsed_s).toBe('number')
    }
    // EVERY ONE AHEAD OF THE HAND-OFF'S RESULT, and the turn still ends normally.
    const lastBeat = frames.map((f) => f.kind).lastIndexOf('progress')
    const handedBack = frames.findIndex((f) => f.kind === 'tool_activity' && f.meta?.name === 'Delegate')
    expect(handedBack).toBeGreaterThan(lastBeat)
    expect(frames.filter((f) => f.kind === 'text').map((f) => f.content).join('')).toContain('The home page is built.')
    expect(frames.at(-1)?.kind).toBe('done')
  })

  it('test_UAT_FC_REQ-360_heartbeats_are_not_part_of_the_conversation', async () => {
    configureDelegation(QUICK)
    const { site: key, sessionId } = await site()
    const client = heldBuild(DELEGATES, BUILDS)
    setModelClient(client)
    const turn = frameReader(await post('/api/ai/prompt', { sessionId, text: 'Build my site.' }))
    await untilHeartbeats(turn, 2)
    client.release()
    await turn.drain()

    // THE TRANSCRIPT A RELOAD PAINTS holds what was said and nothing of the signal.
    const reopened = (await (await post('/api/ai/session', { site: key })).json()) as {
      turns: { role: string; markdown: string }[]
    }
    const painted = reopened.turns.map((t) => t.markdown).join('\n')
    expect(painted).toContain('The home page is built.')
    expect(painted).not.toContain('still working')
  })

  it('test_UAT_FC_REQ-360_a_client_that_reloads_mid_build_is_shown_the_heartbeat', async () => {
    configureDelegation(QUICK)
    const { site: key, sessionId } = await site()
    const client = heldBuild(DELEGATES, BUILDS)
    setModelClient(client)
    const turn = frameReader(await post('/api/ai/prompt', { sessionId, text: 'Build my site.' }))
    await untilHeartbeats(turn, 1)

    // A RELOAD: paint the transcript, then rejoin the turn from its cursor.
    const painted = (await (await post('/api/ai/session', { site: key })).json()) as { cursor: number }
    const tail = frameReader(await post('/api/ai/reattach', { sessionId, cursor: painted.cursor }))
    const rejoined = await untilHeartbeats(tail, 1)
    expect(rejoined.at(-1)?.content).toMatch(HEARTBEAT)

    client.release()
    const rest = await tail.drain()
    expect(rest.at(-1)?.kind).toBe('done')
    await turn.drain()
  })

  it('test_UAT_FC_REQ-360_a_build_inside_one_interval_says_nothing', async () => {
    // THE SHIPPED CADENCE — a minute — against a build that returns at once.
    configureDelegation({ ...delegationDocument, enabled: true })
    const { sessionId } = await site()
    const client = heldBuild(DELEGATES, BUILDS)
    client.release()
    setModelClient(client)
    const frames = await frameReader(await post('/api/ai/prompt', { sessionId, text: 'Build my site.' })).drain()
    expect(frames.some((f) => f.kind === 'tool_activity' && f.meta?.name === 'Delegate')).toBe(true)
    expect(frames.filter((f) => f.kind === 'progress')).toEqual([])
  })
})

describe('REQ-360 — the cadence is configuration', () => {
  it('test_UAT_FC_REQ-360_progress_seconds_ships_at_a_minute_and_refuses_a_non_number', () => {
    expect(delegationFromMapping(delegationDocument).progressSeconds).toBe(60)
    expect(delegationFromMapping({ enabled: true }).progressSeconds).toBe(60)
    expect(delegationFromMapping({ enabled: true, progress_seconds: 0 }).progressSeconds).toBe(0)
    for (const bad of ['60', -1, null]) {
      expect(() => delegationFromMapping({ enabled: true, progress_seconds: bad })).toThrow(DelegationConfigError)
    }
    expect(() => delegationFromMapping({ enabled: true, progress_seconds: '60' })).toThrow(/progress_seconds/)
  })

  it('test_UAT_FC_REQ-360_progress_seconds_zero_turns_the_heartbeat_off', async () => {
    configureDelegation({ ...QUICK, progress_seconds: 0 })
    const { sessionId } = await site()
    const client = heldBuild(DELEGATES, BUILDS)
    setModelClient(client)
    const turn = frameReader(await post('/api/ai/prompt', { sessionId, text: 'Build my site.' }))
    // Held for several of what would have been intervals.
    await new Promise((resolve) => setTimeout(resolve, 800))
    client.release()
    const frames = await turn.drain()
    expect(frames.some((f) => f.kind === 'tool_activity' && f.meta?.name === 'Delegate')).toBe(true)
    expect(frames.filter((f) => f.kind === 'progress')).toEqual([])
  })
})
