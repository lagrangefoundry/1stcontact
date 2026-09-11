import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { sessionTicketSurface } from '../apps/control-app/src/ai'
import * as ticketBridge from '../apps/control-app/src/generated/ai-ticketing.js'
import * as aiLib from '../apps/control-app/src/generated/ai-workers.js'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-228 Half A — **the assistant can read the project's own tickets**.
 *
 * WHAT WAS ACTUALLY WRONG. Nothing was missing from the design.
 * `@lagrangefoundry/ai-ticketing` has declared a `tickets` surface — `get`,
 * `query`, `comments`, `backlinks`, `history` in `ReadTickets`, the four writes
 * in `WriteTickets` — for a long time, and `ai/host.ts` has composed exactly
 * this shape for `ai-knowledge` since [[REQ-158]]. `instances.json` granted the
 * consultant `l1` and `fidelity` and nothing else, so **the assistant was the
 * only actor in this system that could not read the project's own tickets.**
 * This is the grant.
 *
 * **THE REACH INTO PAST CONVERSATIONS IS THE INTENTION** (operator decision,
 * 2026-09-11), and it is asserted here as a positive claim rather than tolerated
 * as a side effect. This store holds every `chat` ticket for the client, each
 * carrying a previous conversation in its `chat_transcript` comment, alongside
 * the engagement ledgers. An assistant that cannot read what it and this client
 * already worked out has no context, and context is most of what makes a
 * consultant worth talking to. A future change that narrows this grant to "the
 * picture catalogue only" must fail a test, not pass quietly.
 *
 * WHAT IS REAL HERE. The bridge is the shipped one, resolved through the
 * generated shim wrangler bundles. The Toolbox is the real one, so parameter
 * validation, the capability gate and the scope predicate are all production
 * code. The store is real D1 behind a real `forTenant` handle.
 *
 * THE CLAIMS:
 *
 *  1. THE READ GROUP IS GRANTED AND THE WRITE GROUP IS NOT — a separate decision
 *     nobody has made, and the ledger surface already carries the one narrow
 *     write verb this product wanted.
 *  2. A PAST CONVERSATION IS READABLE, both as a ticket and as its transcript
 *     comment. This is the capability, stated as a test.
 *  3. LOCAL-ONLY FALLS OUT OF THE UNSET AXES rather than being configured — every
 *     ticket in this session's store, and nothing in another project.
 *  4. THE GRANT TRAVELS WITH THE SURFACE, not in `instances.json`.
 *  5. THE TENANT HANDLE IS THE BARRIER. Another business's tickets are not
 *     reachable, because there is no argument on this path that could name one.
 */

const APPLIED = applySchema()
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const bridge = ticketBridge as unknown as Untyped
const lib = aiLib as unknown as Untyped

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

const scopeOf = (businessId: string): Scope => ({ businessId })

/**
 * The tool names of one group, read off the shipped declaration.
 *
 * DERIVED RATHER THAN LISTED, for the reason the group constants are read off
 * the bridge above: an operation renamed upstream must fail these cases loudly
 * rather than quietly stop being asserted. It also keeps the `op`/`tool`
 * distinction in one place — see the case below for why that distinction is
 * worth a paragraph.
 */
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

/**
 * One call, and what came back — refusal included.
 *
 * **`run` RENDERS A REFUSAL AS TEXT; IT DOES NOT THROW.** That is the Toolbox's
 * contract and it is the right one — a refusal is something the model READS and
 * corrects itself from, not an exception that ends a turn — but it means a case
 * written with `rejects.toThrow()` passes on a call that was quietly permitted.
 * So every case below asserts on the rendered text.
 */
async function called(box: Untyped, tool: string, args: Record<string, unknown>): Promise<string> {
  return String(await box.run(tool, args))
}

/** Whether what came back is a refusal rather than an answer. */
function refused(rendered: string): boolean {
  return /error|refus|not enabled|not granted|unknown tool|denied/i.test(rendered)
}

/**
 * The ticket surface as a session really gets it: the production wiring's
 * surface and grant, composed into a real Toolbox.
 *
 * THROUGH `sessionTicketSurface` AND NOT AROUND IT. The point of every claim
 * below is what the SHIPPED composition permits — a suite that built its own
 * `instanceConfig` here would prove the bridge works and say nothing about
 * whether this product granted it.
 */
async function session(tenant: string) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  const { surface, granted } = sessionTicketSurface(tickets)
  return { tickets, granted, box: new lib.Toolbox([surface], granted) }
}

beforeAll(async () => {
  await APPLIED
})

// ── AC1 — read is granted, write is not ─────────────────────────────────────

describe('REQ-228 Half A AC1 — ReadTickets, and deliberately not WriteTickets', () => {
  it('test_UAT_FC_REQ-228_the_consultant_is_granted_the_read_group_only', async () => {
    // READ OFF THE BRIDGE'S OWN CONSTANTS rather than compared against the
    // literals. The group names are upstream's to change, and an assertion
    // spelled `'ReadTickets'` would keep passing the day one was renamed — while
    // the grant silently began meaning something else.
    const { granted } = await session('req228a-grant')
    expect(granted[bridge.SURFACE ?? 'tickets'].groups).toEqual([bridge.READ_GROUP])
    expect(granted[bridge.SURFACE ?? 'tickets'].groups).not.toContain(bridge.WRITE_GROUP)
  })

  it('test_UAT_FC_REQ-228_the_five_reads_are_offered_and_the_four_writes_are_not', async () => {
    // THE TOOLS A MODEL ACTUALLY SEES, which is a projection of the grant rather
    // than a second list. A capability the instance does not grant is never
    // offered — so this is the claim as the assistant experiences it.
    //
    // **NAMED BY THEIR `tool`, NOT BY THEIR `op`.** The declaration carries both
    // and they differ on this surface — `get` is offered as `TicketGet` — so the
    // model, and therefore `run`, sees the `tool`. Asserting the `op` here looks
    // right and fails as *"unknown tool"*, which sends a reader hunting for a
    // missing grant that is not missing.
    const { box } = await session('req228a-tools')
    const tools = Object.keys(box.schemas())
    for (const read of READ_TOOLS) expect(tools).toContain(read)
    for (const write of WRITE_TOOLS) expect(tools).not.toContain(write)
  })

  it('test_UAT_FC_REQ-228_a_write_is_refused_even_when_it_is_asked_for_by_name', async () => {
    // THE GATE AND NOT MERELY THE MENU. A tool that is not offered can still be
    // named by a model that learned it elsewhere, so `run` must refuse it again.
    const { box, tickets } = await session('req228a-write')
    const { ticket } = await tickets.create({
      type: 'chat',
      title: 'An engagement',
      fields: { session_id: 'site:req228a-write' },
    })
    const rendered = await called(box, 'TicketUpdate', {
      uid: ticket.uid,
      patch: { title: 'rewritten' },
    })
    expect(refused(rendered)).toBe(true)

    // AND THE TICKET DID NOT MOVE, which is the half that matters — the
    // assertion the rendered refusal alone would not give, since a permitted
    // call that happened to render an error string would read the same.
    expect((await tickets.get({ uid: ticket.uid })).ticket.title).toBe('An engagement')
  })
})

// ── AC2 — the reach into past conversations is the point ────────────────────

describe('REQ-228 Half A AC2 — a past conversation is readable', () => {
  it('test_UAT_FC_REQ-228_an_earlier_engagement_is_readable_as_a_ticket', async () => {
    // THE CAPABILITY THE OPERATOR ASKED FOR, stated as a test so that narrowing
    // it later is a decision somebody makes rather than a regression nobody
    // notices. A `chat` ticket is where a previous conversation lives, and its
    // body is the AI-maintained summary ([[REQ-171]]).
    const tenant = 'req228a-recall'
    const { box, tickets } = await session(tenant)
    const { ticket } = await tickets.create({
      type: 'chat',
      title: 'Website for a Bristol furniture restorer',
      fields: { session_id: 'site:earlier' },
      body: '### Decision 1\n\nThe palette is walnut and brass.\n\n**Why:** it matches the workshop.',
    })

    const read = await called(box, 'TicketGet', { uid: ticket.uid })
    expect(refused(read)).toBe(false)
    expect(read).toContain('Bristol furniture restorer')
    expect(read).toContain('walnut and brass')
  })

  it('test_UAT_FC_REQ-228_the_transcript_of_an_earlier_conversation_is_reachable', async () => {
    // THE TRANSCRIPT ITSELF, which lives in a `chat_transcript` comment rather
    // than in the ticket body ([[REQ-160]], [[DOC-10]] §8). `comments` is in the
    // read group precisely so that reading a conversation is possible and not
    // merely reading its title.
    const tenant = 'req228a-transcript'
    const { box, tickets } = await session(tenant)
    const { ticket } = await tickets.create({
      type: 'chat',
      title: 'An earlier session',
      fields: { session_id: 'site:earlier-2' },
    })
    await tickets.comment({
      uid: ticket.uid,
      kind: 'chat_transcript',
      body: 'client: we settled on the gold wordmark last time.',
    })

    const comments = await called(box, 'TicketComments', { uid: ticket.uid })
    expect(refused(comments)).toBe(false)
    expect(comments).toContain('gold wordmark')
  })

  it('test_UAT_FC_REQ-228_the_clients_material_is_queryable_as_tickets_too', async () => {
    // The catalogue surface is the picture-shaped view and is what the assistant
    // should normally reach for. This asserts the OTHER half of Half A: the same
    // records are reachable as tickets, which is what makes the grant a general
    // context capability rather than a second spelling of the catalogue.
    const tenant = 'req228a-query'
    const { box, tickets } = await session(tenant)
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
    expect(refused(found)).toBe(false)
    expect(found).toContain('shopfront')
  })
})

// ── AC3 — local-only, by the unset axes ─────────────────────────────────────

describe('REQ-228 Half A AC3 — every local ticket, and nothing in another project', () => {
  it('test_UAT_FC_REQ-228_the_grant_names_no_projects_so_local_only_falls_out', async () => {
    // *"A grant is a per-session allow-set rather than a blanket one."* The
    // `project` and `project_write` axes are `when_unset: deny`, which upstream's
    // policy reads as an EMPTY ALLOW SET — and a local uid projects to no
    // authority, which is unconstrained. So local-only is a consequence of
    // naming nothing, not a predicate somebody has to keep correct forever.
    const { granted } = await session('req228a-scope')
    const grant = granted[bridge.SURFACE ?? 'tickets'] as Record<string, unknown>
    expect(grant.scope).toBeUndefined()
  })

  it('test_UAT_FC_REQ-228_a_reference_naming_another_project_is_refused', async () => {
    // THE OTHER SIDE OF THE SAME COIN, and the reason the empty allow set is
    // safe: a fully-qualified reference DOES project to an authority, and an
    // empty allow set admits none of them.
    const { box } = await session('req228a-foreign')
    const rendered = await called(box, 'TicketGet', {
      uid: 'ticket://lagrangefoundry/xgd/REQ-52',
    })
    expect(refused(rendered)).toBe(true)
  })

  it('test_UAT_FC_REQ-228_every_ticket_in_this_sessions_own_store_is_readable', async () => {
    // The `ticket` axis is `when_unset: allow`, and the grant leaves it unset —
    // which its declaration reads as *"this session's store, all of it"*. That
    // is the reach the operator asked for, so it is asserted rather than assumed:
    // a chat, a material and a reference are all reachable through one handle.
    const tenant = 'req228a-all'
    const { box, tickets } = await session(tenant)
    const made = []
    for (const spec of [
      { type: 'chat', title: 'A conversation', fields: { session_id: 'site:all' } },
      {
        type: 'material',
        title: 'A logo',
        fields: {
          kind: 'image',
          rights: 'owned',
          republishable: true,
          exportable: false,
          origin: 'uploaded',
          role: 'site',
          filename: 'logo.png',
          content_type: 'image/png',
        },
      },
    ]) {
      made.push((await tickets.create(spec as never)).ticket.uid)
    }
    for (const uid of made) {
      expect(refused(await called(box, 'TicketGet', { uid }))).toBe(false)
    }
  })
})

// ── AC4/AC5 — where the grant lives, and what bounds it ─────────────────────

describe('REQ-228 Half A AC4 — the grant travels with the surface', () => {
  it('test_UAT_FC_REQ-228_the_ticket_grant_is_not_written_in_instances_json', async () => {
    // *"The grant must travel with the surface rather than sitting in
    // `instances.json` — the in-repo declaration validator only knows about
    // surfaces this repository holds, and a grant there for a framework surface
    // is a grant nothing can check."*
    const instances = (await import('../tools/generate/src/cli/ai/instances.json')).default as
      Record<string, Record<string, unknown>>
    expect(instances.consultant).not.toHaveProperty('tickets')
    expect(Object.keys(instances.consultant).sort()).toEqual(['fidelity', 'l1'])
  })

  it('test_UAT_FC_REQ-228_the_tenant_handle_is_the_barrier_and_not_a_predicate', async () => {
    // *"There is no argument anywhere on this path that could name another"* —
    // the store is `forTenant`-bound before the surface is built, so one
    // business's session cannot address another's tickets even with a
    // correctly-formed uid.
    const mine = await session('req228a-mine')
    const theirs = await session('req228a-theirs')
    const { ticket } = await theirs.tickets.create({
      type: 'chat',
      title: "Another business's conversation",
      fields: { session_id: 'site:theirs' },
    })

    // Readable through its OWN session…
    const theirRead = await called(theirs.box, 'TicketGet', { uid: ticket.uid })
    expect(refused(theirRead)).toBe(false)
    expect(theirRead).toContain("Another business's conversation")
    // …and not through anybody else's, by the handle rather than by a check.
    const myRead = await called(mine.box, 'TicketGet', { uid: ticket.uid })
    expect(refused(myRead)).toBe(true)
    expect(myRead).not.toContain("Another business's conversation")
  })
})
