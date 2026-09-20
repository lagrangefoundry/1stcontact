import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { sessionTicketSurface } from '../apps/control-app/src/ai'
import {
  CONFIDENTIALITY_NOTE,
  DevelopmentFailure,
  developmentFor,
  developmentSurface,
  httpProject,
  type DevelopmentProject,
} from '../apps/control-app/src/development'
import * as ticketBridge from '../apps/control-app/src/generated/ai-ticketing.js'
import * as aiLib from '../apps/control-app/src/generated/ai-workers.js'
import { applySchema } from './support/d1-site-factory'

/**
 * [[REQ-273]] — **the assistant can report a defect in this software**.
 *
 * WHAT WAS ACTUALLY WRONG. Nothing was missing from the design.
 * `@lagrangefoundry/ai-ticketing` has shipped a `development` declaration beside
 * its `tickets` one for a long time — `report_bug`, `request_capability`,
 * `add_ticket_detail`, one write group — and this product had never composed it.
 * So the builder assistant could read every ticket in the client's project and
 * had no way to file a defect in OUR software: three of them reached the
 * operator as prose in a chat pane and a person transcribed them by hand.
 *
 * THE SHAPE OF THE ANSWER, and it is the thing these cases exist to pin. The
 * obvious fix is one line — grant `WriteTickets` on the store already in hand —
 * and it is wrong, because that store is the CLIENT'S. What was built instead is
 * a second surface over a second store which is ours, reached through a handle
 * that has no way to name a tenant. So the claims below are as much about what
 * does NOT happen as about what does.
 *
 * WHAT IS REAL HERE. The bridge is the shipped one, resolved through the
 * generated shim wrangler bundles. The Toolbox is the real one, so parameter
 * validation, the capability gate and the manual projection are production code.
 * The client's store is real D1 behind a real `forTenant` handle. What is
 * scripted is the PROJECT — a handle recording what it was asked to do — because
 * the real one writes tickets into this repository, and a suite that filed a
 * real ticket every time it ran would be a defect rather than a test.
 *
 * THE CLAIMS:
 *
 *  1. THE FILING GROUP IS GRANTED, and the three verbs are the ones offered.
 *  2. A REPORT LANDS IN OUR PROJECT AS A DRAFT BUG, and the model chose neither
 *     the type nor the project — there is no parameter for either.
 *  3. NOTHING REACHES THE CLIENT. Their store gains no ticket, and the surface
 *     that reads their store still cannot write to it.
 *  4. THE CONFIDENTIALITY RULE IS IN WHAT THE MODEL READS, appended to the
 *     shipped overview rather than restating it.
 *  5. A SECOND REPORT OF A DEFECT ALREADY FILED IS AN APPEND, not a second
 *     ticket — the duplication answer, and the reason `add_ticket_detail` is in
 *     the grant.
 *  6. A DEPLOYMENT WITH NO PROJECT COMPOSES NO SURFACE, so the assistant has
 *     never heard of a tool it has not got.
 *  7. "COULD NOT REACH" AND "REFUSED" ARE DIFFERENT ANSWERS, because only one of
 *     them means nothing was filed.
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
  } as unknown as RouterEnv
}

const scopeOf = (businessId: string): Scope => ({ businessId })

/**
 * The tool names of the filing group, read off the shipped declaration.
 *
 * DERIVED RATHER THAN LISTED, for the reason [[REQ-228]]'s suite derives its
 * own: an operation renamed upstream must fail these cases loudly rather than
 * quietly stop being asserted. It also keeps the `op`/`tool` distinction in one
 * place — the model sees `ReportBug`, never `report_bug`, and a case asserting
 * the `op` fails as *"unknown tool"* and sends a reader hunting a grant that is
 * not missing.
 */
function toolsOf(group: string): string[] {
  const declaration = bridge.DEVELOPMENT_DECLARATION as {
    operations: { op: string; tool: string }[]
    groups: { group: string; operations: string[] }[]
  }
  const ops = new Set(declaration.groups.find((g) => g.group === group)?.operations ?? [])
  return declaration.operations.filter((o) => ops.has(o.op)).map((o) => o.tool)
}

const FILE_TOOLS = toolsOf(bridge.FILE_GROUP)

/** One call, and what came back — refusal included. */
async function called(box: Untyped, tool: string, args: Record<string, unknown>): Promise<string> {
  return String(await box.run(tool, args))
}

/** Whether what came back is a refusal rather than an answer. */
function refused(rendered: string): boolean {
  return /error|refus|not enabled|not granted|unknown tool|denied/i.test(rendered)
}

/**
 * A project handle that records rather than writes.
 *
 * IT ANSWERS IN UPSTREAM'S SHAPES, because the surface projects them: a create
 * answers `{ticket, humanId}` after its own read-back, and so does an append.
 * A stand-in that answered something flatter would make the surface's projection
 * untested and the cases below meaningless.
 */
function recordingProject(): DevelopmentProject & {
  created: Array<Record<string, unknown>>
  appended: Array<Record<string, unknown>>
} {
  const created: Array<Record<string, unknown>> = []
  const appended: Array<Record<string, unknown>> = []
  const filed = new Map<string, { type: string; title: string; body: string }>()
  let n = 0
  return {
    created,
    appended,
    async create(spec) {
      created.push({ ...spec })
      n += 1
      const uid = `${spec.type}-000000${n}`
      filed.set(uid, { type: spec.type, title: spec.title, body: spec.body ?? '' })
      return {
        ticket: { uid, type: spec.type, title: spec.title, status: spec.status ?? 'draft' },
        humanId: `${spec.type.toUpperCase()}-${n}`,
      }
    },
    async append(spec) {
      appended.push({ ...spec })
      const existing = filed.get(spec.uid)
      if (!existing) throw new DevelopmentFailure(`no ticket ${spec.uid}`, 'not_found')
      existing.body = `${existing.body}\n\n${spec.body}`
      return {
        ticket: { uid: spec.uid, type: existing.type, title: existing.title, status: 'draft' },
        humanId: null,
      }
    },
    async get({ uid }) {
      const existing = filed.get(uid)
      if (!existing) throw new DevelopmentFailure(`no ticket ${uid}`, 'not_found')
      return { ticket: { uid, ...existing, status: 'draft' }, humanId: null }
    },
  }
}

/**
 * The filing surface as a session really gets it.
 *
 * THROUGH `developmentSurface` AND NOT AROUND IT, for the reason [[REQ-228]]'s
 * suite goes through `sessionTicketSurface`: the point of every claim is what
 * the SHIPPED composition permits, and a case that built its own instance
 * configuration here would prove the bridge works and say nothing about whether
 * this product granted it.
 */
function filingSession() {
  const project = recordingProject()
  const { surface, granted } = developmentSurface(project)
  return { project, granted, box: new lib.Toolbox([surface], granted) }
}

beforeAll(async () => {
  await APPLIED
})

// ── AC1 — the filing group is granted, and it is the whole grant ────────────

describe('REQ-273 AC1 — FileDevelopmentTickets, and the three verbs', () => {
  it('test_UAT_FC_REQ-273_the_consultant_is_granted_the_filing_group', () => {
    // READ OFF THE BRIDGE'S OWN CONSTANTS rather than compared against the
    // literals. `FileDevelopmentTickets` is upstream's name to change, and an
    // assertion spelled as a string would keep passing the day it was renamed
    // while the grant silently began meaning something else.
    const { granted } = filingSession()
    expect(granted[bridge.DEVELOPMENT_SURFACE ?? 'development'].groups).toEqual([bridge.FILE_GROUP])
  })

  it('test_UAT_FC_REQ-273_the_three_filing_tools_are_offered', () => {
    // THE TOOLS A MODEL ACTUALLY SEES, which is a projection of the grant rather
    // than a second list — so this is the capability as the assistant
    // experiences it. Three and no more: there is no query, no list, no delete
    // and no way to reach anything in our project that was not filed from here.
    const { box } = filingSession()
    const tools = Object.keys(box.schemas())
    expect(FILE_TOOLS.length).toBe(3)
    for (const tool of FILE_TOOLS) expect(tools).toContain(tool)
  })

  it('test_UAT_FC_REQ-273_no_operation_lets_the_model_name_a_project_or_a_type', () => {
    // WHAT THE MODEL DOES NOT CHOOSE. The type follows from which verb was
    // called and the project is fixed when the handle is built, so a ticket
    // cannot be filed somewhere, or as something, unintended. That is a property
    // of the DECLARATION rather than of a check in our code, which is why it is
    // asserted against the parameter list the model is given.
    const { box } = filingSession()
    const schemas = box.schemas() as Record<string, { properties: Record<string, unknown> }>
    for (const tool of FILE_TOOLS) {
      const params = Object.keys(schemas[tool].properties)
      expect(params).not.toContain('project')
      expect(params).not.toContain('type')
      expect(params).not.toContain('status')
    }
  })
})

// ── AC2 — a report lands in our project as a draft ──────────────────────────

describe('REQ-273 AC2 — a defect reaches the project that builds this product', () => {
  it('test_UAT_FC_REQ-273_report_bug_files_a_draft_bug_and_names_it_back', async () => {
    const { box, project } = filingSession()
    const rendered = await called(box, 'ReportBug', {
      title: 'Placing a picture answers 500 when the site has no draft channel',
      body: 'Called `place_picture` with a material uid; expected the asset to land on the draft, got a 500.',
    })
    expect(refused(rendered)).toBe(false)

    // THE TYPE AND THE STATUS ARE THE SURFACE'S, not the caller's — a draft
    // arrives where new work is triaged rather than scheduled behind somebody's
    // back, which is upstream's rule and is asserted here because this product
    // is the one that would notice if it changed.
    expect(project.created).toHaveLength(1)
    expect(project.created[0].type).toBe('bug')
    expect(project.created[0].status).toBe('draft')
    expect(String(project.created[0].title)).toContain('no draft channel')

    // AND THE MODEL IS TOLD THE ID, which is the only part of the answer it
    // could not have predicted and the thing it has to pass on to whoever asked
    // for the ticket.
    expect(rendered).toContain('BUG-1')
  })

  it('test_UAT_FC_REQ-273_request_capability_files_a_request_not_a_bug', async () => {
    // TWO VERBS AND NOT ONE WITH A FLAG. A gap in the product and a defect in it
    // are different work and land as different types, and the model expresses
    // which by choosing the verb rather than by getting a parameter right.
    const { box, project } = filingSession()
    await called(box, 'RequestCapability', {
      title: 'No way to see which pictures a page already uses',
      body: 'Wanted to avoid placing a duplicate; there is no operation that answers it.',
    })
    expect(project.created[0].type).toBe('request')
  })
})

// ── AC3 — nothing reaches the client ────────────────────────────────────────

describe('REQ-273 AC3 — the client sees nothing of this', () => {
  it('test_UAT_FC_REQ-273_filing_a_defect_puts_nothing_in_the_clients_store', async () => {
    // THE QUESTION THE TICKET ASKED, answered against a REAL tenant store rather
    // than by inspection. A ticket filed here must not appear in the client's
    // ticket views, must not appear in their Library, and must not enter the
    // project knowledge base the consultant searches — and all three of those
    // are projections of this one store, so this is the claim that covers them.
    const tickets = await ticketStoreFor(routerEnv(), scopeOf('req273-barrier'))
    const before = (await tickets.query({ limit: 'all' })).tickets.length

    const { box } = filingSession()
    await called(box, 'ReportBug', {
      title: 'A defect hit while working for this client',
      body: 'The report goes to the people who build this product.',
    })

    expect((await tickets.query({ limit: 'all' })).tickets.length).toBe(before)
  })

  it('test_UAT_FC_REQ-273_the_clients_store_is_still_read_only_to_the_assistant', async () => {
    // THE DECISION THIS TICKET DID NOT OVERTURN, stated as a test so that a
    // later change that "just grants the write group" fails rather than passes
    // quietly. [[REQ-228]] settled that the assistant reads the client's tickets
    // and writes none of them; adding somewhere else to write does not reopen it.
    const tickets = await ticketStoreFor(routerEnv(), scopeOf('req273-readonly'))
    const { granted } = sessionTicketSurface(tickets)
    expect(granted[bridge.SURFACE ?? 'tickets'].groups).toEqual([bridge.READ_GROUP])
    expect(granted[bridge.SURFACE ?? 'tickets'].groups).not.toContain(bridge.WRITE_GROUP)
  })

  it('test_UAT_FC_REQ-273_the_two_surfaces_share_no_store', () => {
    // THE BARRIER IS THE HANDLE AND NOT A PREDICATE — the same rule `tickets.ts`
    // states for tenancy, applied in the other direction. The filing surface is
    // constructed from a project handle and nothing else, so there is no
    // argument anywhere on its path that could name a business, a tenant or a
    // ticket of theirs.
    const { box } = filingSession()
    const schemas = box.schemas() as Record<string, { properties: Record<string, unknown> }>
    for (const tool of FILE_TOOLS) {
      const params = Object.keys(schemas[tool].properties)
      expect(params).not.toContain('business')
      expect(params).not.toContain('tenant')
      expect(params).not.toContain('site')
    }
  })
})

// ── AC4 — the confidentiality rule is in what the model reads ───────────────

describe('REQ-273 AC4 — the information barrier runs the other way too', () => {
  it('test_UAT_FC_REQ-273_the_manual_tells_the_model_not_to_carry_the_clients_material', () => {
    // NOTHING THE ASSISTANT FILES MAY CARRY THE CLIENT'S MATERIAL, their brief
    // or their transcript — those are the client's, and a report that quotes
    // them has moved confidential material into our project store where every
    // barrier `tickets.ts` builds no longer reaches it.
    //
    // UPSTREAM CANNOT SAY THIS. Its surface knows nothing about tenants or
    // briefs; this product's whole barrier is built on them. So the sentence is
    // appended to the shipped overview, where the fact it states is true.
    const { box } = filingSession()
    const manual = String(box.manual())
    expect(manual).toContain(CONFIDENTIALITY_NOTE)
  })

  it('test_UAT_FC_REQ-273_the_shipped_overview_is_amended_and_not_replaced', () => {
    // THE UPSTREAM TEXT SURVIVES THE AMENDMENT. It carries the discipline this
    // ticket asked for in its own words — "filing is not something to do on your
    // own initiative. Someone asks for a ticket; your part is writing the good
    // version of it" — and a note that replaced the overview would have deleted
    // the very instruction it was added beside.
    const { box } = filingSession()
    const manual = String(box.manual())
    expect(manual).toContain('not something to do on your own initiative')
    expect(manual).toContain('the people who build this product')
  })
})

// ── AC5 — a defect already filed is appended to, not filed twice ────────────

describe('REQ-273 AC5 — one defect, one ticket', () => {
  it('test_UAT_FC_REQ-273_further_detail_appends_to_the_ticket_already_filed', async () => {
    // THE DUPLICATION ANSWER, and the reason the third verb is in the grant.
    // One defect hit in ten sessions must not be ten tickets — and the registry
    // that makes that possible is the CONVERSATION: the id came back when the
    // ticket was filed, the transcript is replayed into every later turn of the
    // session, and filing at all happens only when somebody asks. No second
    // bookkeeping store is needed and none is built.
    const { box, project } = filingSession()
    const filed = await called(box, 'ReportBug', {
      title: 'Placing a picture answers 500',
      body: 'First sighting.',
    })
    const uid = /(bug-\d+)/.exec(filed)?.[1]
    expect(uid).toBeTruthy()

    const added = await called(box, 'AddTicketDetail', {
      uid,
      body: 'Second sighting: it also happens on a site that has never been published.',
    })
    expect(refused(added)).toBe(false)

    // ONE TICKET, TWO PIECES OF EVIDENCE.
    expect(project.created).toHaveLength(1)
    expect(project.appended).toHaveLength(1)
    expect(String(project.appended[0].body)).toContain('never been published')
  })
})

// ── AC6 — a deployment with no project composes no surface ──────────────────

describe('REQ-273 AC6 — no project, no tool', () => {
  it('test_UAT_FC_REQ-273_a_deployment_with_no_address_composes_nothing', () => {
    // NULL IS ORDINARY, and here it is the DEPLOYED case rather than an edge: a
    // builder talking to a real client has no xgd project on the other end of
    // anything. It gets an assistant that has never heard of filing — DOC-20's
    // rule, and the honest alternative to a surface that refuses every call.
    expect(developmentFor({})).toBeNull()
    expect(developmentFor({ DEVELOPMENT_TICKETS_URL: '   ' })).toBeNull()
  })

  it('test_UAT_FC_REQ-273_an_address_composes_the_surface_and_its_grant', () => {
    // AND THE GRANT TRAVELS WITH IT, like the ticket surface's and the ledger's:
    // this declaration is upstream's, and `instances.json` is validated against
    // the declarations THIS repository holds, so a key there would be a grant
    // the validator could never check.
    const composed = developmentFor(
      { DEVELOPMENT_TICKETS_URL: 'http://127.0.0.1:9/', DEVELOPMENT_TICKETS_TOKEN: 't' },
      (async () => new Response('{}', { status: 200 })) as unknown as typeof fetch,
    )
    expect(composed).not.toBeNull()
    expect(composed?.granted?.[bridge.DEVELOPMENT_SURFACE ?? 'development']).toBeTruthy()
  })
})

// ── BUG-124 — the address arrives as configuration, and the tool arrives with it

describe('BUG-124 — a Worker reading .dev.vars is offered the filing tools', () => {
  /**
   * THE NAMES, SPELLED OUT ON THE READING SIDE ON PURPOSE.
   *
   * `filing.ts` declares them as constants because it is the side that WRITES
   * them; this suite runs in workerd and cannot import that module (it opens a
   * `node:http` listener), so here they are literals — which is also the honest
   * shape, since a Worker reads whatever `.dev.vars` happened to say. The two
   * sides are pinned together by
   * `test_UAT_FC_REQ-273_the_vars_are_the_names_the_worker_reads`.
   */
  const DEV_VARS = {
    DEVELOPMENT_TICKETS_URL: 'http://127.0.0.1:8790/',
    DEVELOPMENT_TICKETS_TOKEN: 'minted-once',
  }

  it('test_UAT_FC_BUG-124_an_address_from_dev_vars_projects_report_bug_into_the_tool_list', () => {
    // THE DEFECT, STATED AS THE CONSULTANT EXPERIENCED IT. Asked to file a bug it
    // re-read its own tool definitions and found the CLIENT's five read
    // operations and no create of any kind — because the address had been a
    // `--var` minted by a command that was not the one that launched the dev
    // server. A value in `.dev.vars` is read whatever launched it, so what is
    // asserted here is the TOOL LIST rather than the composition: what the model
    // can actually see is the thing that was missing.
    const composed = developmentFor(
      DEV_VARS,
      (async () => new Response('{}', { status: 200 })) as unknown as typeof fetch,
    )
    expect(composed).not.toBeNull()
    const tools = Object.keys(new lib.Toolbox([composed!.surface], composed!.granted).schemas())
    expect(tools).toContain('ReportBug')
    for (const tool of FILE_TOOLS) expect(tools).toContain(tool)
  })

  it('test_UAT_FC_BUG-124_with_the_address_absent_none_of_the_three_are_projected', async () => {
    // AND THE OTHER HALF IS UNCHANGED AND MUST STAY SO. Making the address a
    // setting must not make it a COMMITTED setting: `.dev.vars` is gitignored and
    // per-clone, a deployed builder carries neither var, and an assistant that
    // has never heard of filing is the correct thing for it to be.
    expect(developmentFor({})).toBeNull()
    const client = sessionTicketSurface(await ticketStoreFor(routerEnv(), scopeOf('bug124-absent')))
    const tools = Object.keys(new lib.Toolbox([client.surface], client.granted).schemas())
    for (const tool of FILE_TOOLS) expect(tools).not.toContain(tool)
  })
})

// ── AC7 — "could not reach" and "refused" are different answers ─────────────

describe('REQ-273 AC7 — a failure says whether anything was filed', () => {
  it('test_UAT_FC_REQ-273_an_unreachable_project_reads_as_nothing_filed', async () => {
    // THE DISTINCTION IS LOAD-BEARING. `project_unreachable` declares that
    // nothing was filed and that one retry is reasonable; a refusal wearing that
    // code would invite the model to file the same ticket twice. So a transport
    // failure — and only a transport failure — carries it.
    const project = httpProject('http://127.0.0.1:9/', 'tok', (async () => {
      throw new Error('connection refused')
    }) as unknown as typeof fetch)
    const { surface, granted } = developmentSurface(project)
    const box = new lib.Toolbox([surface], granted)
    const rendered = await called(box, 'ReportBug', { title: 'x', body: 'y' })
    expect(rendered).toContain('project_unreachable')
    expect(rendered).toContain('Nothing was filed')
  })

  it('test_UAT_FC_REQ-273_a_project_refusal_keeps_its_own_declared_code', async () => {
    // A REFUSAL IS ABOUT THE TICKET, and it arrives as a 200 carrying the code
    // the project itself produced. Rendering it as an access failure would tell
    // the model to retry something the project had just declined.
    const project = httpProject('http://127.0.0.1:9/', 'tok', (async () =>
      new Response(
        JSON.stringify({
          ok: false,
          error: { code: 'validation', message: 'title is required', detail: 'title is required' },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )) as unknown as typeof fetch)
    const { surface, granted } = developmentSurface(project)
    const box = new lib.Toolbox([surface], granted)
    const rendered = await called(box, 'ReportBug', { title: 'x', body: 'y' })
    expect(rendered).toContain('validation')
    expect(rendered).toContain('title is required')
  })

  it('test_UAT_FC_REQ-273_a_bad_bearer_is_a_setup_fault_and_not_a_refusal', async () => {
    // A WRONG TOKEN IS THIS PRODUCT BEING SET UP WRONG, which is exactly what
    // `project_unreachable`'s declared message says — and it means nothing was
    // filed, which is the fact the model needs in order to say so rather than
    // retry into a duplicate.
    const project = httpProject('http://127.0.0.1:9/', 'wrong', (async () =>
      new Response('{"ok":false,"error":"bad token"}', { status: 401 })) as unknown as typeof fetch)
    await expect(project.create({ type: 'bug', title: 't', body: 'b' })).rejects.toMatchObject({
      code: 'project_unreachable',
    })
  })
})
