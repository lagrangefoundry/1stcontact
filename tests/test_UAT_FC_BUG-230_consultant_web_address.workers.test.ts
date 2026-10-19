/**
 * BUG-230 — the consultant knows a site has no web address, and can send the
 * client straight to where they choose one.
 *
 * WHAT MAKES THIS EVIDENCE. Every case is a real chat turn through `route()` in
 * workerd, against real D1 and R2, with only the model scripted — so what is
 * asserted is what the consultant was actually sent and what the client's
 * builder actually received.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { NO_ADDRESS_LINE } from '../tools/generate/src/cli/ai/plan-core'
import { calls, says, scriptedClient, turnTailText, type ModelRequest, type ModelStep } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'
import { giveBusinessAnAddress } from './support/site-address'

/** One business per case: a business holds one address (REQ-238). */
let BUSINESS = 'bug230-consultant'
let businessSeq = 0

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

const deps: RouterDeps = { index: async () => async () => {} }

const post = (path: string, body: unknown): Promise<Response> =>
  route(
    new Request(`https://app.example${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    routerEnv(),
    { businessId: BUSINESS } as Scope,
    deps,
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

/** The last tool result a request carries — what the consultant was told — parsed. */
function toolResult(req: ModelRequest): Record<string, any> {
  const last = req.messages[req.messages.length - 1]
  const block = (last.content as Array<{ type?: string; content?: unknown }>).find((b) => b?.type === 'tool_result')
  const content = block?.content
  const text = typeof content === 'string' ? content : (content as Array<{ text?: string }>).map((c) => c.text ?? '').join('')
  return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
}

/** A site with an open conversation, and no web address. */
async function site(): Promise<string> {
  const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('bug230') })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  return ((await opened.json()) as { sessionId: string }).sessionId
}

/** One client message, the consultant scripted. */
async function turn(sessionId: string, steps: ModelStep[]): Promise<{ frames: Frame[]; seen: ModelRequest[] }> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post('/api/ai/prompt', {
    sessionId,
    text: 'Can we publish?',
    view: { width: 1280, height: 800, mode: 'desktop' },
  })
  expect(response.status).toBe(200)
  return { frames: await frames(response), seen: client.seen }
}

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  BUSINESS = `bug230-consultant-${(businessSeq += 1)}`
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('BUG-230 — show_client targets the web address section', () => {
  it('test_UAT_FC_BUG-230_show_client_link_to_web_address_is_a_line_to_paste', async () => {
    const sessionId = await site()
    const { frames: fs, seen } = await turn(sessionId, [
      calls('show_client', { target: 'web_address', how: 'link', label: 'Choose your web address' }),
      says('First, an address.'),
    ])

    expect(toolResult(seen[1])).toMatchObject({ how: 'link', link: '[Choose your web address](#show=web_address)' })
    expect(fs.filter((f) => f.kind === 'show_client')).toEqual([])
  })

  it('test_UAT_FC_BUG-230_show_client_switch_to_web_address_reaches_the_builder', async () => {
    const sessionId = await site()
    const { frames: fs, seen } = await turn(sessionId, [
      calls('show_client', { target: 'web_address', how: 'switch' }),
      says("I've opened where you choose your web address."),
    ])

    expect(toolResult(seen[1])).toMatchObject({ how: 'switch', shown: 'where you choose your web address' })
    expect(fs.filter((f) => f.kind === 'show_client').map((f) => f.meta?.href)).toEqual(['#show=web_address'])
  })
})

describe('BUG-230 — the plan entry says the site has no web address yet', () => {
  it('test_UAT_FC_BUG-230_the_plan_notice_names_a_missing_address_at_finishing_touches_and_drops_it_once_one_exists', async () => {
    const sessionId = await site()

    // BEFORE FINISHING TOUCHES the line is noise, so it is not there.
    const early = await turn(sessionId, [
      calls('set_stage', { stage: 'finishing_touches', state: 'in_progress' }),
      says('On to the finishing touches.'),
    ])
    expect(turnTailText(early.seen[0])).not.toContain(NO_ADDRESS_LINE)

    // AT FINISHING TOUCHES, WITH NO ADDRESS, the consultant is told.
    const near = await turn(sessionId, [says('Nearly there.')])
    expect(turnTailText(near.seen[0])).toContain(NO_ADDRESS_LINE)

    // ONCE AN ADDRESS EXISTS, the line goes.
    await giveBusinessAnAddress(BUSINESS)
    const addressed = await turn(sessionId, [says('Ready when you are.')])
    expect(turnTailText(addressed.seen[0])).toContain('### The site plan')
    expect(turnTailText(addressed.seen[0])).not.toContain(NO_ADDRESS_LINE)
  })
})
