import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { PLAN_BOARD_PATH, PLAN_PATH, resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'
import { calls, says, scriptedClient, sentText, type ModelRequest, type ModelStep, type ScriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-233]] — **a builder's brief is the consultant's, as written.** The host
 * appends nothing from the story board, whatever the board holds; the client's
 * words reach a builder only when the consultant quotes them in the brief, and
 * then they arrive intact. The consultant's delegation method says when to.
 *
 * The real route inside workerd — `POST /api/ai/prompt`, `/api/plan/board`, the
 * real session manager, the framework's real delegation surface with this host's
 * `account` hook, a real D1 and R2 holding the plan. The one double is the
 * Anthropic client, which is the network, so what the builder got is read off
 * what the builder's model was actually sent.
 */
const TENANT = 'bug233'
const ENABLED = { ...delegationDocument, enabled: true }
const WORKER_MODEL = backendsDocument.claude_builder.model
const HEARTED = 'Three generations of one family cut hair here'
const HEADLINE = 'Three generations on one corner'

function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as Env
}

const ask = (path: string, init: RequestInit = {}): Promise<Response> =>
  worker.fetch(new Request(`https://app.example${path}`, init), workerEnv())

const post = (path: string, body: unknown): Promise<Response> =>
  ask(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

async function turn(sessionId: string, text: string, client: ScriptedClient): Promise<ModelRequest[]> {
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text })
  expect(response.status).toBe(200)
  await response.text()
  return client.seen
}

/** One double, two conversations, told apart by the model they are addressed to. */
function twoSided(caller: ModelStep[], builder: ModelStep[]): ScriptedClient {
  let atCaller = 0
  let atWorker = 0
  const step: ModelStep = (req) => {
    const [script, index] = req.model === WORKER_MODEL ? [builder, atWorker++] : [caller, atCaller++]
    return script[Math.min(index, script.length - 1)](req)
  }
  return scriptedClient([step])
}

type BoardView = { themes: { notes: { id: string; text: string; reaction?: string }[] }[]; headline: { state: string; text?: string } }

/** A session on a site whose board has a chosen headline and a hearted note. */
async function boardedSession(slug: string): Promise<string> {
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(slug) })
  const opened = await post('/api/ai/session', { site })
  const { sessionId } = (await opened.json()) as { sessionId: string }
  await turn(sessionId, "My gran opened the salon in 1971, then my mum ran it, and now it's me.", scriptedClient([
    calls('pin_notes', {
      notes: [
        { text: HEARTED, quote: "My gran opened the salon in 1971, then my mum ran it, and now it's me.", emoji: '👪', theme: 'Family' },
        { text: 'A cup of tea with every cut', quote: 'Everyone gets a cup of tea.', emoji: '☕', theme: 'The chair' },
      ],
    }),
    says('Pinned.'),
  ]))
  const board = async (): Promise<BoardView> =>
    ((await (await ask(`${PLAN_PATH}?site=${encodeURIComponent(site)}`)).json()) as { board: BoardView }).board
  const generations = (await board()).themes[0].notes[0].id
  expect((await post(PLAN_BOARD_PATH, { site, action: 'react', note: generations, reaction: 'heart' })).status).toBe(200)
  await turn(sessionId, 'Done.', scriptedClient([
    calls('offer_headlines', { options: [HEADLINE, 'Cut by family since 1971'], pick: 0, from: [generations] }),
    says('Two to try.'),
  ]))
  expect((await post(PLAN_BOARD_PATH, { site, action: 'choose', option: HEADLINE })).status).toBe(200)
  const held = await board()
  expect(held.headline.text).toBe(HEADLINE)
  expect(held.themes[0].notes[0]).toMatchObject({ text: HEARTED, reaction: 'heart' })
  return sessionId
}

/** Delegates `goal` from a boarded session; what the consultant and the builder were sent. */
async function delegate(slug: string, goal: string): Promise<{ consultant: ModelRequest[]; builder: string }> {
  configureDelegation(ENABLED)
  const sessionId = await boardedSession(slug)
  const seen = await turn(sessionId, 'Go ahead.', twoSided(
    [calls('Delegate', { scope: ['home.json'], note: 'On it — a minute or two.', role: BUILDER_ROLE, goal, accept: ['the page still renders'] }), says('Done.')],
    [calls('ReportResult', { summary: 'Done.', changed: [], passed: ['the page still renders'] }), says('Reported.')],
  ))
  const builder = seen.filter((req) => req.model === WORKER_MODEL)
  expect(builder.length).toBeGreaterThan(0)
  return { consultant: seen.filter((req) => req.model !== WORKER_MODEL), builder: sentText(builder[0]) }
}

describe('BUG-233 builder briefs carry no story board', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-233_a_brief_not_about_words_reaches_the_builder_without_the_board', async () => {
    const goal = 'Make the logo in the header 20% smaller. Change nothing else.'
    const { consultant, builder } = await delegate('nowords', goal)
    // THE BOARD IS THERE: the consultant is shown it on the turn it delegates.
    expect(sentText(consultant[0])).toContain(`headline chosen: "${HEADLINE}"`)
    // THE BUILDER GETS THE GOAL AND NOTHING FROM IT.
    expect(builder).toContain(goal)
    expect(builder).not.toContain(HEADLINE)
    expect(builder).not.toContain(HEARTED)
    expect(builder).not.toContain('story board')
    expect(builder).not.toContain('write the copy from these')
  })

  it('test_UAT_FC_BUG-233_the_clients_words_the_consultant_quotes_arrive_intact', async () => {
    const goal =
      `Set the hero headline to the client's chosen headline, verbatim: "${HEADLINE}". ` +
      `Under it, one line in the client's own words: "${HEARTED}".`
    const { builder } = await delegate('quoted', goal)
    expect(builder).toContain(goal)
    // ONCE, AS THE CONSULTANT WROTE IT — not again in an appended block.
    expect(builder.split(HEADLINE)).toHaveLength(2)
    expect(builder).not.toContain('story board')
  })

  it('test_UAT_FC_BUG-233_the_consultants_delegation_method_says_when_to_quote_the_client', () => {
    const method = primingDocument.templates['delegation-method']
    expect(method).toContain('When a brief asks the builder to write or change words on the site, quote the')
    expect(method).toContain('verbatim, and say they\nare the client\'s own words')
    expect(method).toContain('When it\ndoes not, leave the board out')
    // AND THE STORY-BOARD SECTION NO LONGER PROMISES THE HOST DOES IT.
    const text = (primingDocument.priming as { text?: string[] }[]).map((p) => (p.text ?? []).join('\n')).join('\n')
    expect(text).not.toContain('Builders are given')
    expect(text).toContain("a builder sees the client's words only when you quote them in its brief.")
  })
})
