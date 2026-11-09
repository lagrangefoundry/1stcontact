import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { storeFor } from '../apps/control-app/src/store'
import { sessionTicketSurface, workerHost } from '../apps/control-app/src/ai'
import * as ticketBridge from '../apps/control-app/src/generated/ai-ticketing.js'
import * as aiLib from '../apps/control-app/src/generated/ai-workers.js'
import {
  openSession,
  resetAiHost,
  setModelClient,
  streamPrompt,
} from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { says, scriptedClient, type ModelRequest } from './support/scripted-model-client'

/**
 * story-a58a0974 — **the consultant reads, and never writes, this business's
 * tickets on the deployed host** (AC-2586), and **the ticket surface is composed
 * on that host whatever else is absent** (AC-2587, Worker half; the command-line
 * half is in `test_reconciliation_assistant_ticket_read.test.ts`, because the
 * `1c` host needs a filesystem workerd does not have).
 *
 * Everything runs inside workerd against real D1: the ticket store is
 * `ticketStoreFor`'s tenant-bound handle, the surface and grant are the shipped
 * `sessionTicketSurface`, the Toolbox and the host are the real ones. The model
 * client is the one double — it is the network.
 */

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const bridge = ticketBridge as unknown as Untyped
const lib = aiLib as unknown as Untyped
const SURFACE: string = bridge.SURFACE ?? 'tickets'

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

const scopeOf = (businessId: string): Scope => ({ businessId })

/** The tool names of one group, read off the shipped declaration rather than listed. */
function toolsOf(group: string): string[] {
  const declaration = bridge.DECLARATION as {
    operations: { op: string; tool: string }[]
    groups: { group: string; operations: string[] }[]
  }
  const ops = new Set(declaration.groups.find((g) => g.group === group)?.operations ?? [])
  return declaration.operations.filter((o) => ops.has(o.op)).map((o) => o.tool)
}

const READ_TOOLS = toolsOf(bridge.READ_GROUP)
const WRITE_TOOLS = toolsOf(bridge.WRITE_GROUP)

/** `run` renders a refusal as text rather than throwing, so refusal is read off the text. */
function refused(rendered: string): boolean {
  return /error|refus|not enabled|not granted|unknown tool|denied/i.test(rendered)
}

async function called(box: Untyped, tool: string, args: Record<string, unknown>): Promise<string> {
  return String(await box.run(tool, args))
}

/** The ticket surface exactly as the Worker host composes it, in a real Toolbox. */
async function session(tenant: string) {
  const tickets = await ticketStoreFor(workerEnv(), scopeOf(tenant))
  const { surface, granted } = sessionTicketSurface(tickets)
  return { tickets, granted, box: new lib.Toolbox([surface], granted) }
}

function post(tenant: string, path: string, body: unknown, deps: RouterDeps): Promise<Response> {
  return route(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
    scopeOf(tenant),
    deps,
  )
}

const NO_CORPUS = (): RouterDeps => ({ knowledge: async () => null }) as RouterDeps

async function seedSite(tenant: string, slug: string): Promise<void> {
  const seed = siteSeed({ slug })
  const res = await post(
    tenant,
    '/api/import',
    {
      slug: seed.slug,
      siteJson: seed.siteJson as Record<string, unknown>,
      pages: Object.entries(seed.pages).map(([name, page]) => ({
        name,
        page: page as Record<string, unknown>,
      })),
      assets: [] as { name: string; base64: string }[],
    },
    NO_CORPUS(),
  )
  expect(res.status, await res.clone().text()).toBe(200)
}

async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  return (await response.text())
    .split('\n\n')
    .map((frame) => frame.trim())
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => JSON.parse(frame.slice(5).trim()))
}

function systemOf(req: ModelRequest): string {
  const s = req.system
  return typeof s === 'string' ? s : s.map((block) => block.text ?? '').join('\n')
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('AC-2586 — the consultant reads, never writes, this business tickets', () => {
  it('test_UAT_AC2586_worker_consultant_reads_this_business_tickets_and_transcripts_never_writes_and_reaches_no_other_business', async () => {
    const tenant = 'ac2586-mine'
    const { box, granted, tickets } = await session(tenant)

    // THE GRANT IS EXACTLY THE READ GROUP, carried by the surface itself.
    expect(READ_TOOLS.length).toBeGreaterThan(0)
    expect(WRITE_TOOLS.length).toBeGreaterThan(0)
    const grant = granted[SURFACE] as { groups: string[]; scope?: unknown }
    expect(grant.groups).toEqual([bridge.READ_GROUP])

    // THE OFFERED TOOLS: every read, no write.
    const tools = Object.keys(box.schemas())
    for (const read of READ_TOOLS) expect(tools).toContain(read)
    for (const write of WRITE_TOOLS) expect(tools).not.toContain(write)

    // AN EARLIER CONVERSATION: its chat ticket, title and ledger body…
    const { ticket: chat } = await tickets.create({
      type: 'chat',
      title: 'Website for a Bristol furniture restorer',
      fields: { session_id: 'site:ac2586-earlier' },
      body: '### Decision 1\n\nThe palette is walnut and brass.\n\n**Why:** it matches the workshop.',
    })
    const read = await called(box, 'TicketGet', { uid: chat.uid })
    expect(refused(read), read).toBe(false)
    expect(read).toContain('Bristol furniture restorer')
    expect(read).toContain('walnut and brass')

    // …and its transcript, held as a `chat_transcript` comment.
    await tickets.comment({
      uid: chat.uid,
      kind: 'chat_transcript',
      body: 'client: we settled on the gold wordmark last time.',
    })
    const comments = await called(box, 'TicketComments', { uid: chat.uid })
    expect(refused(comments), comments).toBe(false)
    expect(comments).toContain('gold wordmark')

    // A PREDICATE QUERY returns this business's material — no narrower allow-list.
    await tickets.create({
      type: 'material',
      title: 'A photograph of the shopfront',
      fields: {
        kind: 'image',
        rights: 'owned',
        republishable: true,
        exportable: false,
        origin: 'uploaded',
        role: 'site',
        filename: 'shopfront.png',
        content_type: 'image/png',
      },
    })
    const found = await called(box, 'TicketQuery', { predicate: 'type=material', limit: 10 })
    expect(refused(found), found).toBe(false)
    expect(found).toContain('shopfront')

    // A WRITE NAMED EXPLICITLY is refused, readably, and the ticket does not move.
    const write = await called(box, 'TicketUpdate', { uid: chat.uid, patch: { title: 'rewritten' } })
    expect(refused(write), write).toBe(true)
    expect((await tickets.get({ uid: chat.uid })).ticket.title).toBe(
      'Website for a Bristol furniture restorer',
    )

    // REACH STOPS AT THE BUSINESS: another tenant's ticket is readable only from
    // its own session, even with the correct uid…
    const theirs = await session('ac2586-theirs')
    const { ticket: foreign } = await theirs.tickets.create({
      type: 'chat',
      title: "Another business's conversation",
      fields: { session_id: 'site:ac2586-theirs' },
    })
    const theirRead = await called(theirs.box, 'TicketGet', { uid: foreign.uid })
    expect(refused(theirRead), theirRead).toBe(false)
    expect(theirRead).toContain("Another business's conversation")
    const myRead = await called(box, 'TicketGet', { uid: foreign.uid })
    expect(refused(myRead), myRead).toBe(true)
    expect(myRead).not.toContain("Another business's conversation")

    // …and a reference naming another project is refused.
    const project = await called(box, 'TicketGet', { uid: 'ticket://lagrangefoundry/xgd/REQ-52' })
    expect(refused(project), project).toBe(true)

    // THE GRANT IS NOT WRITTEN INTO instances.json: the consultant holds l1 and fidelity only.
    const instances = (await import('../tools/generate/src/cli/ai/instances.json')).default as Record<
      string,
      Record<string, unknown>
    >
    expect(Object.keys(instances.consultant).sort()).toEqual(['fidelity', 'l1'])

    // AND THE MODEL, through the deployed route, is offered the reads and no write.
    const slug = nextSlug('ac2586')
    await seedSite(tenant, slug)
    const opened = await post(tenant, '/api/ai/session', { slug }, NO_CORPUS())
    expect(opened.status, await opened.clone().text()).toBe(200)
    const { sessionId } = (await opened.json()) as { sessionId: string }
    const client = scriptedClient([says('Hello.')])
    setModelClient(client)
    const events = await frames(await post(tenant, '/api/ai/prompt', { sessionId, text: 'Hi.' }, NO_CORPUS()))
    expect(events.at(-1)?.kind).toBe('done')
    const offered = client.seen[0].tools.map((t) => t.name)
    for (const read of READ_TOOLS) expect(offered).toContain(read)
    for (const write of WRITE_TOOLS) expect(offered).not.toContain(write)
  })
})

describe('AC-2587 — the deployed host always composes the ticket surface', () => {
  it('test_UAT_AC2587_worker_host_with_no_knowledge_images_renderer_or_catalogue_still_offers_ticket_reads', async () => {
    const tenant = 'ac2587-bare'
    const slug = nextSlug('ac2587')
    await seedSite(tenant, slug)

    // THE WORKER HOST WITH EVERY OPTIONAL WIRE ABSENT: no knowledge base, no
    // looking surface, no image surface, no renderer, no asset URL, no catalogue.
    const scope = scopeOf(tenant)
    const store = await storeFor(workerEnv(), scope)
    const tickets = await ticketStoreFor(workerEnv(), scope)
    const host = workerHost(workerEnv(), store, tenant, tickets, null, null, null, null, null, null)

    const opened = await openSession(slug, {}, host.deps)
    expect(opened.ready, opened.error).toBe(true)

    const client = scriptedClient([says('Hello — what shall we change?')])
    setModelClient(client)
    const events: { kind: string }[] = []
    for await (const event of streamPrompt(opened.sessionId, 'Hi.', {}, host.deps)) events.push(event)
    expect(events.filter((e) => e.kind === 'done')).toHaveLength(1)

    // THE TICKET READS ARE OFFERED, and no ticket write.
    const offered = client.seen[0].tools.map((t) => t.name)
    for (const read of READ_TOOLS) expect(offered).toContain(read)
    for (const write of WRITE_TOOLS) expect(offered).not.toContain(write)
    // …and they are in the tool guide the session was primed with.
    const primed = systemOf(client.seen[0])
    for (const read of READ_TOOLS) expect(primed).toContain(read)
  })
})
