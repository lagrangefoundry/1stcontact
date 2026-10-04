import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { sitePlan } from '../apps/control-app/src/plan'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { planOperations } from '../tools/generate/src/cli/ai/plan-core'
import { SLOW_TOOLS } from '../tools/generate/src/cli/ai/cadence-core'
import { HINTS_SCRIPT } from '../tools/generate/src/cli/capture/hints'
import { encodePng } from '../tools/generate/src/cli/png'
import { calls, says, scriptedClient, type ModelRequest, type ModelStep } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'
import { fakeBrowser } from './support/fake-puppeteer'
import { CANNED_HINTS, signalsFor } from './support/fake-capture-driver'

/**
 * [[REQ-386]] — **the client is told before the consultant goes quiet on a slow
 * tool, with a rough duration, and told when a failed call is being tried again.**
 *
 * EVERY CASE DRIVES THE WORKER'S OWN ROUTES — `/api/ai/session` and
 * `/api/ai/prompt` — against a real D1, the real ticket store, the real session
 * machinery and the real capture pipeline. Two doubles, both at genuinely
 * external boundaries: the Anthropic client, and the browser (a fake Puppeteer).
 * The failing capture is a private address, which the capture's own guard refuses.
 */

const BUSINESS = 'req386-business'
const GOOD_URL = 'https://joes-plumbing.test/'
const BAD_URL = 'http://127.0.0.1/admin'

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

const browser = fakeBrowser({
  png: encodePng({ data: new Uint8Array(8 * 8 * 3).fill(0x40), width: 8, height: 8, channels: 3 }),
  network: { [GOOD_URL]: { body: '<html><head><title>Joe</title></head><body><h1>Joe</h1></body></html>', contentType: 'text/html' } },
  evaluate: (script, viewport) => (script === HINTS_SCRIPT ? CANNED_HINTS : signalsFor(viewport?.width ?? 1280)),
})

const deps: RouterDeps = {
  launch: browser.launch,
  index: async () => async () => {},
  describeImage: async () => ({ text: 'A plumber.', model: 'stub/vision-1' }),
}

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

const tickets = (): Promise<TicketStore> => ticketStoreFor(routerEnv() as never, scope)

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
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('req386') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return { site, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

async function turn(sessionId: string, steps: ModelStep[]): Promise<{ frames: Frame[]; seen: ModelRequest[] }> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text: 'Let us look at plumbers near me.' })
  expect(response.status).toBe(200)
  return { frames: await frames(response), seen: client.seen }
}

/** Where in the stream the first text frame containing `text` sits. */
const textAt = (all: Frame[], text: string, from = 0): number =>
  all.findIndex((f, i) => i >= from && f.kind === 'text' && f.content.includes(text))

/** Where the n-th (0-based) finished call to `tool` sits. */
function callAt(all: Frame[], tool: string, n: number): number {
  let seen = -1
  return all.findIndex((f) => f.kind === 'tool_activity' && f.meta?.name === tool && ++seen === n)
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-386 — slow work is announced before it runs, with a rough duration', () => {
  it('test_UAT_FC_REQ-386_each_slow_call_is_announced_with_an_estimate_and_a_failed_one_retried_says_which_attempt', async () => {
    const { site: key, sessionId } = await site()
    await planOperations(sitePlan(await tickets(), key)).set_ask({
      ask: 'phone',
      prompt: 'Your phone number?',
      why: 'Every visitor needs it.',
      input: 'phone',
    })

    const out = await turn(sessionId, [
      calls('capture_site', { url: BAD_URL }),
      calls('capture_site', { url: BAD_URL }),
      calls('capture_site', { url: GOOD_URL }),
      calls('list_references', {}),
      says('Joe’s is captured.'),
    ])

    // The capture of a private address really failed — the guard refused it — which is
    // what makes the second call a retry.
    const firstBad = out.frames[callAt(out.frames, 'capture_site', 0)]
    expect(String(firstBad.meta?.output)).toMatch(/^Error:/)

    // FIRST CALL: announced before it runs, with the 5-minute estimate and the
    // panel's count — two open asks, the one added here and the features ask
    // every new plan starts with.
    const first = textAt(out.frames, `Capturing ${BAD_URL} — about 5 minutes.`)
    expect(first).toBeGreaterThan(-1)
    expect(first).toBeLessThan(callAt(out.frames, 'capture_site', 0))
    expect(out.frames[first].content).toContain('Meanwhile, 2 questions above need you.')

    // SECOND CALL, THE SAME ONE AGAIN: said to be a retry, and which attempt.
    const retry = textAt(out.frames, `Capturing ${BAD_URL} again (attempt 2; the last try failed) — about 5 minutes.`)
    expect(retry).toBeGreaterThan(callAt(out.frames, 'capture_site', 0))
    expect(retry).toBeLessThan(callAt(out.frames, 'capture_site', 1))

    // THIRD CALL, A DIFFERENT SITE: a first attempt, announced like the first.
    const good = textAt(out.frames, `Capturing ${GOOD_URL} — about 5 minutes.`)
    expect(good).toBeGreaterThan(callAt(out.frames, 'capture_site', 1))
    expect(good).toBeLessThan(callAt(out.frames, 'capture_site', 2))

    // THE PANEL COUNT RIDES ON THE TURN'S FIRST LINE ONLY, and a fast tool gets
    // no line at all: three lines, one per capture.
    const said = out.frames.filter((f) => f.kind === 'text').map((f) => f.content).join('')
    expect(said.match(/Meanwhile/g)).toHaveLength(1)
    expect(said.match(/— about (a minute|\d+ minutes)\./g)).toHaveLength(3)
    expect(callAt(out.frames, 'list_references', 0)).toBeGreaterThan(-1)

    // AND THE LINES ARE THE ASSISTANT'S OWN WORDS in the transcript the next turn
    // reads back. The estimate is the host's phrase and appears in no tool input,
    // so finding it there means the line itself was kept.
    const next = await turn(sessionId, [says('Anything else?')])
    const carried = JSON.stringify(next.seen[0].messages)
    expect(carried).toContain(`Capturing ${GOOD_URL} — about 5 minutes.`)
  })

  it('test_UAT_FC_REQ-386_every_listed_slow_tool_estimates_one_five_or_thirty_minutes', () => {
    expect([...SLOW_TOOLS.keys()].sort()).toEqual(
      ['CreateImage', 'EditImage', 'capture_site', 'check_fidelity', 'compare', 'screenshot'].sort(),
    )
    for (const slow of SLOW_TOOLS.values()) expect([1, 5, 30]).toContain(slow.minutes)
  })

  it('test_UAT_FC_REQ-386_the_consultant_is_told_the_20_second_rule_every_turn', async () => {
    const { sessionId } = await site()
    const out = await turn(sessionId, [says('Hello.')])
    const sent = JSON.stringify(out.seen[0])
    expect(sent).toContain('Busy for more than about 20 seconds? Tell your client first')
    expect(sent).toContain('about a minute, 5 minutes or 30 minutes')
    expect(sent).toContain('They see what you write before a tool call as you write it')
  })
})
