import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { storeFor } from '../apps/control-app/src/store'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
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
 * [[REQ-423]] — **drawing stays with the consultant**, through the Worker's own
 * routes.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the real route inside workerd: a
 * real session, the real Library (material tickets in D1, bytes in R2), the real
 * site store, and — for the builder — a real delegated worker session whose
 * REQUEST is what is read. The double is the Anthropic client, a model boundary.
 *
 *  1. A delegated builder is offered no drawing tool; the commissioning
 *     consultant is offered `draw_image`.
 *  2. The consultant's drawing is a Library item — labelled, described, an SVG —
 *     handed back with the line that shows it, and NOT on the site until placed;
 *     placing it puts the very bytes on the site.
 *  3. A drawing carrying anything executable is refused whole: no Library item.
 */

const TENANT = 'req423'
const WORKER_MODEL = backendsDocument.claude_builder.model
const DELEGATE_TOOL = 'Delegate'
const REPORT_TOOL = 'ReportResult'
const ENABLED = { ...delegationDocument, enabled: true }

/** A drawing that passes the SVG envelope — shapes only, nothing executable. */
const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 10">' +
  '<rect x="1" y="1" width="38" height="8" fill="#1a3a6b"/></svg>'

const DEPS: RouterDeps = {
  knowledge: async () => null,
  index: async () => async () => {},
}

function workerEnv(): RouterEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
  } as unknown as RouterEnv
}

const post = (path: string, body: unknown): Promise<Response> =>
  route(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
    { businessId: TENANT },
    DEPS,
  )

async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

/** One double, both sides of the hand-off, routed by model — REQ-295's `twoSided`. */
function twoSided(caller: ModelStep[], worker: ModelStep[]): ScriptedClient {
  let atCaller = 0
  let atWorker = 0
  const step: ModelStep = (req) => {
    const [script, index] =
      req.model === WORKER_MODEL ? [worker, atWorker++] : [caller, atCaller++]
    return script[Math.min(index, script.length - 1)](req)
  }
  return scriptedClient([step])
}

const toolNames = (req: ModelRequest): string[] => req.tools.map((tool) => tool.name)

/** The text of every tool result the LAST request carries, in order. */
function toolResults(client: ScriptedClient): string[] {
  const last = client.seen[client.seen.length - 1]
  const out: string[] = []
  for (const message of last.messages) {
    if (!Array.isArray(message.content)) continue
    for (const block of message.content as { type?: string; content?: unknown }[]) {
      if (block?.type !== 'tool_result') continue
      out.push(typeof block.content === 'string' ? block.content : JSON.stringify(block.content))
    }
  }
  return out
}

/** Open a session on a fresh site and take one scripted consultant turn. */
async function consultantTurn(prefix: string, script: ModelStep[]): Promise<{ site: string; client: ScriptedClient }> {
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(prefix) })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const client = scriptedClient(script)
  setModelClient(client)
  await drain(await post('/api/ai/prompt', { sessionId, text: 'Draw us a mark.' }))
  return { site, client }
}

async function materials(): Promise<Record<string, unknown>[]> {
  const tickets = await ticketStoreFor(workerEnv(), { businessId: TENANT })
  const { tickets: rows } = await tickets.list({ type: 'material', limit: 'all' })
  return rows.map((t) => ({ uid: t.uid, body: t.body, ...t.fields }))
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-423 — who holds the pen', () => {
  it('test_UAT_FC_REQ-423_a_builder_is_offered_no_drawing_tool_and_the_consultant_is', async () => {
    configureDelegation(ENABLED)
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('pen') })
    const opened = await post('/api/ai/session', { site })
    const { sessionId } = (await opened.json()) as { sessionId: string }
    const client = twoSided(
      [
        calls(DELEGATE_TOOL, {
          scope: ['home.json'],
          note: 'Building the header.',
          role: BUILDER_ROLE,
          // The brief asks for a drawing — the grant, not the brief, is the answer.
          goal: 'Draw a logo for the header and put it there.',
          accept: ['the header shows a logo'],
        }),
        says('Handed over.'),
      ],
      [calls(REPORT_TOOL, { summary: 'Drawing is the consultant’s.', changed: [], decisions: [], passed: [] }), says('Reported.')],
    )
    setModelClient(client)
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Make us a logo.' }))

    const workerTurns = client.seen.filter((req) => req.model === WORKER_MODEL)
    const consultantTurns = client.seen.filter((req) => req.model !== WORKER_MODEL)
    expect(workerTurns.length).toBeGreaterThan(0)

    const builder = toolNames(workerTurns[0])
    expect(builder).not.toContain('draw_image')
    expect(builder).not.toContain('write_image')
    // It still reads the Library, so it can find what it is told to use.
    expect(builder).toContain('get_library_item')

    // The consultant commissions AND draws: drawing is not an L1 write.
    const consultant = toolNames(consultantTurns[0])
    expect(consultant).toContain(DELEGATE_TOOL)
    expect(consultant).toContain('draw_image')
    expect(consultant).not.toContain('set_l1')
  })
})

describe('REQ-423 — a drawing is a Library item, placed like any other', () => {
  it('test_UAT_FC_REQ-423_the_consultant_draws_a_labelled_described_library_item_and_places_it', async () => {
    const before = (await materials()).length
    const { site, client } = await consultantTurn('draw', [
      calls('draw_image', {
        name: 'ariels-sign',
        svg: MARK,
        description: 'The ARIEL’S AR WELDING wordmark rule, navy.',
      }),
      calls('place_on_site', { item: 'ariels-sign.svg' }),
      says('Here it is.'),
    ])

    // THE LIBRARY ITEM: labelled, described, the SVG, placeable.
    const drawn = (await materials()).filter((row) => row.filename === 'ariels-sign.svg')
    expect((await materials()).length).toBe(before + 1)
    expect(drawn).toHaveLength(1)
    const item = drawn[0]
    expect(String(item.label)).toMatch(/^IMAGE-\d+$/)
    expect(item.body).toBe('The ARIEL’S AR WELDING wordmark rule, navy.')
    expect(item.content_type).toBe('image/svg+xml')
    expect(item.kind).toBe('image')
    expect(item.role).toBe('site')
    expect(item.republishable).toBe(true)

    // THE RESULT the model read: its label, and the line that shows the client.
    const results = toolResults(client)
    const drawResult = results.find((r) => r.includes(String(item.uid)) && r.includes('display'))!
    expect(drawResult, results.join('\n')).toBeTruthy()
    expect(drawResult).toContain(String(item.label))
    expect(drawResult).toMatch(/!\[ariels-sign\]\([^)]*\/api\/material\/file\?uid=/)

    // PLACED: the very bytes on the site, and the placement recorded.
    const sites = await storeFor(workerEnv(), { businessId: TENANT })
    const bytes = await sites.readAsset(site, 'ariels-sign.svg')
    expect(new TextDecoder().decode(bytes!)).toBe(MARK)
    const placed = (await materials()).find((row) => row.uid === item.uid)!
    expect(placed.placed_on).toEqual([site])
  })

  it('test_UAT_FC_REQ-423_drawing_does_not_put_it_on_the_site', async () => {
    const { site } = await consultantTurn('unplaced', [
      calls('draw_image', { name: 'divider', svg: MARK, description: 'A thin navy divider.' }),
      says('Drawn.'),
    ])
    const sites = await storeFor(workerEnv(), { businessId: TENANT })
    expect(await sites.listAssets(site)).not.toContain('divider.svg')
    const item = (await materials()).find((row) => row.filename === 'divider.svg')!
    expect(item.placed_on ?? []).toEqual([])
  })

  it('test_UAT_FC_REQ-423_a_drawing_carrying_anything_executable_is_refused_and_nothing_is_stored', async () => {
    const before = (await materials()).length
    const { client } = await consultantTurn('hostile', [
      calls('draw_image', {
        name: 'attack',
        svg: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        description: 'Not a drawing.',
      }),
      calls('draw_image', {
        name: 'attack-two',
        svg: '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.example/x.png"/></svg>',
        description: 'Not a drawing either.',
      }),
      says('Refused.'),
    ])
    const results = toolResults(client).join('\n')
    expect(results).toContain('SCHEMA_INVALID')
    expect(results).toMatch(/refused and nothing was stored/)
    expect((await materials()).length).toBe(before)
  })
})
