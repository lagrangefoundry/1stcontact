import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { draftAccount } from '../tools/generate/src/cli/ai/account-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import {
  calls,
  says,
  scriptedClient,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite, tenantStore } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-354]] — **a containment check the host's own record answers is settled by
 * the host, and never sent to the worker.**
 *
 * WHAT MAKES THIS EVIDENCE. The real route inside workerd — `POST /api/ai/prompt`,
 * the real session manager, the framework's real delegation surface with this
 * host's `account` hook, a real D1 and R2. The one double is the Anthropic client,
 * which is the network. So a settled verdict is derived from what the store
 * actually held across the delegation, and "never sent to the worker" is read off
 * the request the worker's model was actually sent.
 */

const TENANT = 'req354'
const ENABLED = { ...delegationDocument, enabled: true }
const WORKER_MODEL = backendsDocument.claude_builder.model
const DELEGATE_TOOL = 'Delegate'
const REPORT_TOOL = 'ReportResult'

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

const post = (path: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )

async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

/** One double, two conversations, told apart by the model they are addressed to. */
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

/** The delegation's result as the CALLER received it, parsed out of its envelope. */
function delegationResult(req: ModelRequest): Record<string, unknown> {
  for (const message of req.messages) {
    if (!Array.isArray(message.content)) continue
    for (const block of message.content as { type?: string; content?: string }[]) {
      if (block?.type !== 'tool_result' || typeof block.content !== 'string') continue
      const body = block.content.replace(/^[\s\S]*?\n/, '').replace(/\n<<<\/untrusted>>>\s*$/, '')
      return JSON.parse(body) as Record<string, unknown>
    }
  }
  throw new Error('the caller was handed no tool result')
}

/** A home page whose first band is a known text run, so a write's diff is exact. */
const BAND = {
  kind: 'text',
  text: 'Welcome',
  axes: { color: '#111827', fontSizePx: 32, fontWeight: 400, lineHeightPx: 40 },
}

function homePage(): Record<string, unknown> {
  const page = starterHomePage('acme') as Record<string, unknown>
  ;(page.l1 as { root: { children: unknown[] } }).root.children = [
    structuredClone(BAND),
    { ...structuredClone(BAND), text: 'Second' },
  ]
  return page
}

/** The worker's one write: the first band's words, and nothing else about it. */
const REWRITE = { page: 'home', path: '0.0', node: { ...BAND, text: 'Built for the trades' } }

/** Five host-shaped checks the write above answers deterministically, and one near miss. */
const PAGE_BROKEN = 'page home has no changes'
const PAGE_HELD = 'Page `elsewhere` has no changes.'
const FIELDS_HELD = 'No element changed any field other than text.'
const FIELDS_BROKEN = 'no element changed any field other than axes.color'
const ADDRESSES_HELD = 'only the elements at 0.0 on page home changed'
const ADDRESSES_BROKEN = 'Only the elements at 0.1 changed.'
const NEAR_MISS = 'page home has no visible changes'

interface Verdict {
  check: string
  verdict: string
  reason?: string
  by?: string
}

interface Run {
  result: Record<string, unknown>
  /** Everything the worker's model was ever sent, as one string. */
  workerSaw: string
}

/** One delegation of the rewrite, asking `accept`, the worker reporting `report`. */
async function delegate(slug: string, accept: string[], report: Record<string, unknown>): Promise<Run> {
  configureDelegation(ENABLED)
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(slug), pages: { 'home.json': homePage() } })
  const opened = await post('/api/ai/session', { site })
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const client = twoSided(
    [calls(DELEGATE_TOOL, { note: 'Working on it now — a few minutes.', role: BUILDER_ROLE, goal: 'Rewrite the hero headline.', accept }), says('Checked.')],
    [calls('set_l1', REWRITE), calls(REPORT_TOOL, report), says('Reported.')],
  )
  setModelClient(client)
  await drain(await post('/api/ai/prompt', { sessionId, text: 'Rewrite the headline.' }))
  const answered = client.seen.filter((req) => req.model !== WORKER_MODEL)
  const workerSaw = JSON.stringify(client.seen.filter((req) => req.model === WORKER_MODEL).map((r) => r.messages))
  return { result: delegationResult(answered[answered.length - 1]), workerSaw }
}

function verdictOf(result: Record<string, unknown>, check: string): Verdict {
  const found = (result.checks as Verdict[]).find((v) => v.check === check)
  if (found === undefined) throw new Error(`no verdict for ${check}`)
  return found
}

describe('REQ-354 the host settles containment checks from its own record', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_REQ-354_each_phrasing_is_settled_by_the_host_and_never_reaches_the_worker', async () => {
    // Behaviours 2, 3 and 4. Each of the three phrasings, once held and once broken,
    // against a real write. Every one is the host's verdict, and none of them is in
    // anything the worker's model was sent — that is the whole saving.
    const accept = [PAGE_BROKEN, PAGE_HELD, FIELDS_HELD, FIELDS_BROKEN, ADDRESSES_HELD, ADDRESSES_BROKEN]
    const { result, workerSaw } = await delegate('phrasings', accept, { summary: 'Rewrote it.', changed: ['home'] })

    expect(verdictOf(result, PAGE_HELD)).toMatchObject({ verdict: 'passed', by: 'account' })
    expect(verdictOf(result, FIELDS_HELD)).toMatchObject({ verdict: 'passed', by: 'account' })
    expect(verdictOf(result, ADDRESSES_HELD)).toMatchObject({ verdict: 'passed', by: 'account' })

    // A failure names what the diff showed: the page, the element and the field.
    const page = verdictOf(result, PAGE_BROKEN)
    expect(page).toMatchObject({ verdict: 'failed', by: 'account' })
    expect(page.reason).toContain('field text changed on page home, element 0.0')
    const fields = verdictOf(result, FIELDS_BROKEN)
    expect(fields).toMatchObject({ verdict: 'failed', by: 'account' })
    expect(fields.reason).toContain('field text')
    const addresses = verdictOf(result, ADDRESSES_BROKEN)
    expect(addresses).toMatchObject({ verdict: 'failed', by: 'account' })
    expect(addresses.reason).toContain('element 0.0')

    for (const check of accept) expect(workerSaw).not.toContain(check)
    // Every check was answered, by the party that cannot be mistaken about it.
    expect(result.accepted).toBe(false)
  })

  it('test_UAT_FC_REQ-354_a_near_miss_phrasing_is_not_claimed_and_reaches_the_worker', async () => {
    // Behaviour 2's last sentence: a check that is not one of the phrasings, whole,
    // goes to the worker unchanged and comes back as the worker's verdict.
    const { result, workerSaw } = await delegate('near-miss', [NEAR_MISS, FIELDS_HELD], {
      summary: 'Rewrote it.',
      changed: ['home'],
      passed: [NEAR_MISS],
    })

    expect(workerSaw).toContain(NEAR_MISS)
    expect(workerSaw).not.toContain(FIELDS_HELD)
    expect(verdictOf(result, NEAR_MISS)).toMatchObject({ verdict: 'passed', by: 'worker' })
    expect(verdictOf(result, FIELDS_HELD)).toMatchObject({ verdict: 'passed', by: 'account' })
    expect(result.accepted).toBe(true)
  })

  it('test_UAT_FC_REQ-354_the_account_is_the_same_record_as_before_the_subclass_was_removed', async () => {
    // Behaviour 1. The bracket is now the framework's, on this host's hook, and the
    // caller reads exactly what it read before: two change-counter integers and the
    // field-level difference, with `wrote` beside them.
    const { result } = await delegate('account', [], { summary: 'Rewrote it.', changed: ['home'] })

    const account = result.account as { from: unknown; to: unknown; changed: unknown }
    expect(Number.isInteger(account.from)).toBe(true)
    expect(Number.isInteger(account.to)).toBe(true)
    expect(account.to as number).toBeGreaterThan(account.from as number)
    expect(account.changed).toEqual({
      differences: [
        { page: 'home', address: '0.0', field: 'text', before: 'Welcome', after: 'Built for the trades' },
      ],
    })
    expect(result.wrote).toBe(true)
    expect(result).not.toHaveProperty('activity')
  })

  it('test_UAT_FC_REQ-354_a_claimed_check_without_both_marks_is_unsettled_never_passed', async () => {
    // Behaviour 3's last sentence, at the host's half of the contract: asked to
    // settle against a bracket it holds no captures for — the shape a failed mark
    // leaves — the host answers nothing rather than a pass. The framework reports
    // that as `unreported`.
    const store = await tenantStore(TENANT)
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('unmarked') })
    const account = draftAccount(store, site)
    const ctx = {}

    expect(await account.claims(ctx, PAGE_HELD)).toBe(true)
    expect(await account.settle(ctx, PAGE_HELD, null, null)).toBeNull()

    // One mark taken and the other not: still nothing to settle against.
    const from = await account.mark(ctx)
    expect(await account.settle(ctx, PAGE_HELD, from, null)).toBeNull()
    expect(await account.changes(ctx, from, null)).toBeNull()

    // Both taken: settled.
    const to = await account.mark(ctx)
    expect(await account.settle(ctx, PAGE_HELD, from, to)).toMatchObject({ settled: true })
  })
})
