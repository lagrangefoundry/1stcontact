import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { NETWORK_GROUP_CHAT_PATH, resetChatHost, route, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { groupNames } from '../tools/generate/src/cli/ai/group-core'
import { calls, says, scriptedClient, type ModelRequest, type ModelStep, type ScriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-205]] — **the working line names no one in a one-to-one conversation**
 * (DOC-66): with one AI in the conversation it has no personal name, so the
 * line reads "Your consultant is …". The group chat, where two AIs are visible,
 * keeps the display names `group-chat.json` gives them.
 *
 * Through the Worker's own `route` — `/api/ai/session`, `/api/ai/prompt` and the
 * group-chat switch — against a real D1, the real ticket store and the real
 * session machinery. The one double is the Anthropic client.
 */

const BUSINESS = 'bug205-business'
const NAMES = groupNames()
const COORDINATOR_MODEL = (backendsDocument as Record<string, { model?: string }>).claude_coordinator.model as string
/** A capture the guard refuses at once: a private address. Slow tool, fast failure. */
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

const post = (path: string, body: unknown): Promise<Response> =>
  route(
    new Request(`https://app.example${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    routerEnv(),
    scope,
    {},
    { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
  )

type Frame = { kind: string; content: string; meta?: Record<string, unknown> }

async function frames(response: Response): Promise<Frame[]> {
  const out: Frame[] = []
  for (const block of (await response.text()).split('\n\n')) {
    const line = block.split('\n').find((l) => l.startsWith('data: '))
    if (line) out.push(JSON.parse(line.slice('data: '.length)) as Frame)
  }
  return out
}

async function prompt(site: string, text: string, client: ScriptedClient): Promise<Frame[]> {
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text })
  expect(response.status).toBe(200)
  return frames(response)
}

/**
 * Both room members, as the group chat calls them: the consultant captures a
 * site and then declines to post; the coordinator declines. A member speaks
 * only through the room's own `GroupSay`, whose room id is read off the brief.
 */
function roomClient(): ScriptedClient {
  let captured = false
  const afterTool = (req: ModelRequest): boolean => {
    const last = req.messages[req.messages.length - 1]
    return Array.isArray(last?.content) && (last.content as Array<{ type?: string }>).some((b) => b?.type === 'tool_result')
  }
  const step: ModelStep = (req) => {
    const room = /You have a turn in room (\S+?)\./.exec(JSON.stringify(req.messages))?.[1]
    if (afterTool(req) && !/GroupSay/.test(JSON.stringify(req.messages[req.messages.length - 1]))) {
      return calls('GroupSay', { group: room, decline: true, text: 'Nothing from me.' })(req)
    }
    if (afterTool(req)) return says('Done.')(req)
    if (req.model !== COORDINATOR_MODEL && !captured) {
      captured = true
      return calls('capture_site', { url: BAD_URL })(req)
    }
    return calls('GroupSay', { group: room, decline: true, text: 'Nothing from me.' })(req)
  }
  return scriptedClient([step])
}

describe('BUG-205 — the working line names no one', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(async () => {
    setModelClient(null)
    await env.DB.prepare('DELETE FROM business_network_settings').run()
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-205_a_one_to_one_working_line_says_your_consultant_and_no_display_name', async () => {
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('bug205') })
    const stream = await prompt(
      site,
      'Look at this site.',
      scriptedClient([calls('capture_site', { url: BAD_URL }), says('That one is private.')]),
    )
    const working = stream.filter((f) => f.kind === 'working')
    expect(working).toHaveLength(1)
    expect(working[0].content).toBe(`Your consultant is capturing ${BAD_URL}`)
    for (const name of [NAMES.consultant, NAMES.coordinator]) expect(working[0].content).not.toContain(name)
  })

  it('test_UAT_FC_BUG-205_in_the_group_chat_the_working_line_keeps_the_configured_name', async () => {
    const switched = await post(NETWORK_GROUP_CHAT_PATH, { enabled: true })
    expect(switched.status).toBe(200)
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('bug205room') })
    const stream = await prompt(site, 'Look at this site.', roomClient())
    const working = stream.filter((f) => f.kind === 'working')
    expect(working.length).toBeGreaterThan(0)
    expect(working[0].content).toBe(`${NAMES.consultant} is capturing ${BAD_URL}`)
    expect(working[0].content).not.toContain('Your consultant')
  })
})
