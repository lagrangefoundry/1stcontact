import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import {
  calls,
  says,
  scriptedClient,
  systemText,
  turnTailText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'

/**
 * [[REQ-339]] — **a worker is not in the conversation, and is told nothing of it**.
 *
 * WHAT DOC-60 §F1 MEASURED. `host-core.ts` resolves the ledger per SITE and
 * registers the session-record provider on the single registry every role on that
 * site is assembled from — so the framework's product tier handed each worker the
 * CONSULTANT'S standing note and decisions. A worker read that as a resumption on
 * its first turn (*"Thank you for the standing note. I see I'm in the middle of a
 * multi-section spacing task"*) and restated its whole state at the head of every
 * turn afterwards: 14 times in one worker, 34 in another. One of them spent
 * 14,421 output tokens to make five element writes.
 *
 * WHY THIS RUNS THROUGH THE REAL ROUTE. The claim is about what reaches the MODEL
 * on each side of a hand-off, and the two sides are assembled by the same manager
 * from the same registry — which is the whole of the defect. A test calling the
 * provider directly proves a function answers `null` and says nothing about
 * whether a worker was told; the sibling node suite does that job, deliberately
 * and cheaply, and this one drives `POST /api/ai/prompt` through the real session
 * manager, the real delegation surface, the real tool loop on both sides and a
 * real D1-backed ticket store holding a real record. The one double is the
 * Anthropic client, which is the network, and it is shared by both sides — so a
 * worker that somehow reached the consultant's priming would be found here.
 *
 * THE FOUR BEHAVIOURS, one case each:
 *
 *   1. a worker is handed no standing note and no recorded decisions;
 *   2. its per-turn reminders tell it to act rather than narrate;
 *   3. the consultant's own delivery is untouched — on the very turn it delegates;
 *   4. it still gets the facts about the SITE: the site line and the page digest.
 */

const ENABLED = { ...delegationDocument, enabled: true }

const WORKER_MODEL = backendsDocument.claude_builder.model
const CALLER_MODEL = backendsDocument.claude.model

/** The two operations' MODEL-FACING names — pinned against the declaration by the config suite. */
const DELEGATE_TOOL = 'Delegate'
const REPORT_TOOL = 'ReportResult'

/**
 * The record the consultant keeps, and the words this suite looks for.
 *
 * Deliberately UNMISTAKABLE strings. The claim is an absence, and an absence
 * asserted against a phrase that could plausibly occur for another reason is an
 * assertion about nothing.
 */
const NOTE =
  'Building a one-page site for a Bristol furniture restorer. Out of scope: online sales.'
const DECISION = 'The accent colour across the site is oxblood.'
const BECAUSE = 'It picks up the leather the workshop actually uses.'
const REJECTED = 'A mid-green, which read as municipal against the timber.'

/** The heading the record is delivered under — read, never restated. */
const RECORD_HEADING = 'Your record of this engagement'

/** The two lines [[REQ-339]] added to the worker's reminder tier, read from the document. */
function builderLine(name: string): string {
  const entries = primingDocument.builder_reminders as { name?: string; text?: string }[]
  const found = entries.find((entry) => entry.name === name)
  expect(found, `no builder reminder named ${name}`).toBeDefined()
  return String(found!.text)
}

let businessSeq = 0
const nextBusiness = (): string => `req339-${(businessSeq += 1)}`

function workerEnv(tenant: string): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenant,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  } as unknown as Env
}

const post = (tenant: string, path: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(tenant),
  )

async function drain(response: Response): Promise<void> {
  expect(response.status).toBe(200)
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

/** A business with a site and an open conversation about it. */
async function conversation(): Promise<{ tenant: string; slug: string; sessionId: string }> {
  const tenant = nextBusiness()
  const seed = siteSeed({ slug: nextSlug('req339') })
  const imported = await post(tenant, '/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  })
  expect(imported.status).toBe(200)
  const slug = ((await imported.json()) as { site: string }).site

  const opened = await post(tenant, '/api/ai/session', { site: slug })
  expect(opened.status).toBe(200)
  const session = (await opened.json()) as { sessionId: string; ready: boolean }
  expect(session.ready).toBe(true)
  return { tenant, slug, sessionId: session.sessionId }
}

/**
 * One double, two conversations, told apart by the model they are addressed to.
 *
 * The host injects ONE client and has to — the caller's backend and the worker's
 * are both built from it, which is itself part of what is under test here: a
 * worker that reached the caller's backend would be running the caller's model
 * and reading the caller's priming, and this would find out.
 */
function twoSided(caller: ModelStep[], builder: ModelStep[]): ScriptedClient {
  let atCaller = 0
  let atWorker = 0
  const step: ModelStep = (req) => {
    const [script, index] =
      req.model === WORKER_MODEL ? [builder, atWorker++] : [caller, atCaller++]
    return script[Math.min(index, script.length - 1)](req)
  }
  return scriptedClient([step])
}

/** Everything the model was told on a request — priming, seed and per-turn tail. */
const told = (req: ModelRequest): string => `${systemText(req)}\n${turnTailText(req)}`

const workerRequests = (client: ScriptedClient): ModelRequest[] =>
  client.seen.filter((req) => req.model === WORKER_MODEL)

const callerRequests = (client: ScriptedClient): ModelRequest[] =>
  client.seen.filter((req) => req.model === CALLER_MODEL)

/**
 * A conversation that has written a record, then delegated a piece of work.
 *
 * TWO TURNS, because the record has to exist before the delegation for the
 * question to mean anything: the provider reads the ledger as the turn is
 * assembled, so a worker opened on a conversation that had settled nothing would
 * be handed nothing whatever the fix was.
 */
async function delegatedAfterRecording(): Promise<{
  worker: ModelRequest[]
  caller: ModelRequest[]
  slug: string
}> {
  const ctx = await conversation()

  const first = scriptedClient([
    calls('set_standing_note', { note: NOTE }),
    calls('record_decision', { decision: DECISION, because: BECAUSE, rejected: REJECTED }),
    says('Written down.'),
  ])
  setModelClient(first)
  await drain(await post(ctx.tenant, '/api/ai/prompt', { sessionId: ctx.sessionId, text: 'Here is what we are doing.' }))

  const second = twoSided(
    [
      calls(DELEGATE_TOOL, {
        role: BUILDER_ROLE,
        goal: 'Lay out the About page as three sections: intro, team, contact.',
        accept: ['every section has a heading'],
      }),
      says('I had the About page built.'),
    ],
    [
      calls(REPORT_TOOL, {
        summary: 'Built the About page with three sections.',
        changed: ['about'],
        passed: ['every section has a heading'],
      }),
      says('Reported.'),
    ],
  )
  setModelClient(second)
  await drain(await post(ctx.tenant, '/api/ai/prompt', { sessionId: ctx.sessionId, text: 'Build out the About page.' }))

  const worker = workerRequests(second)
  expect(worker.length).toBeGreaterThan(0)
  return { worker, caller: callerRequests(second), slug: ctx.slug }
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  // THE SWITCH GOES BACK, AND THE MANAGERS WITH IT: a manager composes the
  // delegation surface when its Toolbox is built and holds it for its life, so a
  // cached one would carry the previous case's answer.
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-339 — a worker is handed no part of the consultant’s record', () => {
  it('test_UAT_FC_REQ-339_a_worker_is_told_no_standing_note_and_no_recorded_decisions', async () => {
    // BEHAVIOUR 1, AND THE WHOLE OF THE DEFECT. Every one of these strings was
    // in the worker's priming before this ticket, delivered under a heading that
    // calls it the session's OWN record — which is what made a worker open by
    // picking up work it had never started.
    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const { worker } = await delegatedAfterRecording()
    const read = told(worker[0])

    expect(read).not.toContain(RECORD_HEADING)
    expect(read).not.toContain(NOTE)
    expect(read).not.toContain(DECISION)
    expect(read).not.toContain(BECAUSE)
    expect(read).not.toContain(REJECTED)
    // Nor the standing note's own sub-heading, which is the part a model quoted
    // back verbatim when it announced it was picking up mid-engagement.
    expect(read).not.toContain('Your standing note')
  })

  it('test_UAT_FC_REQ-339_no_later_turn_of_the_worker_recovers_it_either', async () => {
    // THE ENTRY IS AFTER THE PRODUCT TIER'S CACHE BOUNDARY, which means it is
    // re-assembled on EVERY turn rather than delivered once with the prefix. A
    // gate applied only on the cold-start assembly would leave the record
    // arriving on the worker's second turn — later than the opening line DOC-60
    // quotes, and harder to see.
    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const { worker } = await delegatedAfterRecording()
    expect(worker.length).toBeGreaterThan(1)

    for (const req of worker) {
      expect(told(req)).not.toContain(RECORD_HEADING)
      expect(told(req)).not.toContain(NOTE)
    }
  })

  it('test_UAT_FC_REQ-339_the_consultant_still_receives_its_record_on_the_turn_it_delegates', async () => {
    // BEHAVIOUR 3, asserted on the SAME turn as behaviour 1 rather than in a
    // separate conversation — because one registry serves both roles, and the
    // only interesting version of this claim is the one where both renderings
    // happen milliseconds apart off the same binding. Delivering the record every
    // turn is what stopped the consultant re-deriving settled state ([[REQ-283]]);
    // a fix that caught the consultant too would trade one expensive session for
    // another.
    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const { caller } = await delegatedAfterRecording()
    const read = told(caller[0])

    expect(read).toContain(RECORD_HEADING)
    expect(read).toContain(NOTE)
    expect(read).toContain(DECISION)
    // …and what LOST, which is the half a session most needs: without it a later
    // stretch of the conversation re-proposes what this client already refused.
    expect(read).toContain(REJECTED)
  })
})

describe('REQ-339 — a worker is told to act rather than narrate', () => {
  it('test_UAT_FC_REQ-339_the_workers_turn_carries_the_instruction_to_act', async () => {
    // BEHAVIOUR 2. Two lines, in the reminder tier so they ride the per-turn tail
    // and cannot spoil the prefix every worker shares. The first is the
    // consultant's own sentence; the second is the half only a worker needs,
    // because only a worker has a report at the end that makes a running
    // commentary redundant.
    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const { worker } = await delegatedAfterRecording()
    const read = told(worker[0])

    expect(read).toContain(builderLine('act-rather-than-narrate'))
    expect(read).toContain(builderLine('no-status-narration'))
  })

  it('test_UAT_FC_REQ-339_a_worker_still_gets_the_facts_about_the_site', async () => {
    // BEHAVIOUR 4. The site line and the page digest are facts about the SITE and
    // not about the consultant's conversation, and a worker made to discover them
    // by reading would pay back more than the record ever cost it. This is the
    // regression the fix could most easily have caused: all three entries were
    // arriving by the same route.
    configureDelegation(ENABLED)
    resetAiHost()
    resetChatHost()

    const { worker, slug } = await delegatedAfterRecording()
    const read = told(worker[0])

    expect(read).toContain(`You are working on the site "${slug}"`)
    expect(read).toContain('The site as it stands')
  })
})
