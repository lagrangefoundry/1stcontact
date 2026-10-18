import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE, primingConfig } from '../tools/generate/src/cli/ai/roles'
import { concurrentSupported, draftClaims, scopeSupported } from '../tools/generate/src/cli/ai/lease-core'
import { editPageDecompose } from '../tools/generate/src/cli/edit'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { d1Leases } from '../tools/generate/src/store/d1-leases'
import * as aiLib from '../apps/control-app/src/generated/ai-workers.js'
import {
  calls,
  says,
  scriptedClient,
  systemText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite, tenantStore } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-410]] — **builders may run together, and every builder names its files.**
 *
 * Two changes. The consultant's conduct no longer forbids several builders at
 * once — it forbids only CLAIMING work overlaps when it was not started that
 * way — so the delegation paragraph alone says what may run together. And a
 * `Delegate` that names no files in `scope` is refused by the host's `claim`
 * hook before its builder opens, at no cost.
 *
 * EVIDENCE: the real routes inside workerd, the real session manager, the real
 * delegation surface and `claim` hook, over a real D1 with the real
 * `draft_leases` table. The one double is the Anthropic client. Delegation cases
 * are skipped where the installed Delegate has no `scope` (REQ-207), read the way
 * the host reads it.
 */
const SCOPED = scopeSupported(aiLib) && concurrentSupported(aiLib)
const withScopes = it.skipIf(!SCOPED)

const TENANT = 'req410'
const WORKER_MODEL = backendsDocument.claude_builder.model

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
    SESSION_JUNCTION: (env as Record<string, unknown>).SESSION_JUNCTION,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as Env
}

const request = (method: string, path: string, body?: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
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

/** A site in D1 with `home` stored as sections `hero` and `story`. */
async function sectionedSite(name: string): Promise<string> {
  const page = starterHomePage('acme') as Record<string, unknown>
  ;(page.l1 as Record<string, unknown>).root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'text', id: 'hero', text: 'Hero words', axes: { fontSizePx: 32 } },
      { kind: 'text', id: 'story', text: 'Story words', axes: { fontSizePx: 16 } },
    ],
  }
  page.modules = []
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(name), pages: { 'home.json': page } })
  await editPageDecompose(site, 'home', { store: await tenantStore(TENANT) })
  return site
}

async function textOf(site: string, section: string): Promise<string> {
  const page = (await (await tenantStore(TENANT)).readPages(site))[0].page as {
    l1: { root: { children: Array<{ id: string; text: string }> } }
  }
  return page.l1.root.children.find((c) => c.id === section)!.text
}

/** The text of every tool result a request carried, in order. */
function toolResults(req: ModelRequest): string[] {
  const out: string[] = []
  for (const message of req.messages) {
    if (!Array.isArray(message.content)) continue
    for (const block of message.content as { type?: string; content?: unknown }[]) {
      if (block?.type === 'tool_result') out.push(typeof block.content === 'string' ? block.content : JSON.stringify(block.content))
    }
  }
  return out
}

/** Several tool calls in one reply, each its own block with its own id, as the wire sends them. */
function callsAll(entries: Array<[string, Record<string, unknown>]>): ModelStep {
  return (req) =>
    entries.flatMap(([name, input], index) =>
      calls(name, input)(req).map((event) => ({
        ...event,
        index,
        ...(event.content_block
          ? { content_block: { ...(event.content_block as object), id: `call-${name}-${index}` } }
          : {}),
      })),
    )
}

type BuilderStep = (req: ModelRequest) => ReturnType<ModelStep> | Promise<ReturnType<ModelStep>>

/**
 * One consultant turn whose first reply commissions every one of `delegations`.
 * The double is {@link scriptedClient}'s shape with an ASYNCHRONOUS builder side,
 * so a builder's model call can wait on another builder's.
 */
async function commission(site: string, delegations: Record<string, unknown>[], builder: BuilderStep): Promise<ScriptedClient> {
  const opened = await request('POST', '/api/ai/session', { site })
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const script: ModelStep[] = [callsAll(delegations.map((d) => ['Delegate', d])), says('Noted.')]
  let atCaller = 0
  const seen: ModelRequest[] = []
  const client: ScriptedClient = {
    seen,
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        const events =
          req.model === WORKER_MODEL ? await builder(req) : script[Math.min(atCaller++, script.length - 1)](req)
        return (async function* () {
          for (const event of events) yield event
        })()
      },
    },
  } as ScriptedClient
  setModelClient(client)
  await drain(await request('POST', '/api/ai/prompt', { sessionId, text: 'Go ahead.' }))
  return client
}

const caller = (client: ScriptedClient) => client.seen.filter((req) => req.model !== WORKER_MODEL)
const builderRequests = (client: ScriptedClient) => client.seen.filter((req) => req.model === WORKER_MODEL)

const node = (id: string, text: string) => ({ kind: 'text', id, text, axes: { fontSizePx: 16 } })
const REPORT = calls('ReportResult', { summary: 'Done.', changed: [], decisions: [], passed: [], failed: [] })

describe('REQ-410 — builders may run together, and every builder names its files', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_REQ-410_both_consultant_primings_say_what_is_running_and_never_forbid_overlap', () => {
    for (const withCorpus of [true, false]) {
      const priming = (primingConfig(withCorpus).priming as { text?: string }[])
        .map((e) => e.text ?? '')
        .join('\n')
        .replace(/\s+/g, ' ')
      expect(priming).toContain('## Saying what is running')
      expect(priming).toContain(
        'Never tell your client that work is running at the same time unless you started it that way.',
      )
      expect(priming).toContain('add up whatever runs one after another, and count work that overlaps once.')
      expect(priming).not.toMatch(/never several at once/i)
      expect(priming).not.toContain('## One thing at a time')
    }
  })

  withScopes('test_UAT_FC_REQ-410_with_parallel_builders_the_consultant_is_not_told_to_build_one_at_a_time', async () => {
    configureDelegation({ ...delegationDocument, enabled: true, max_concurrent: 3 })
    const site = await sectionedSite('priming')
    const opened = await request('POST', '/api/ai/session', { site })
    const { sessionId } = (await opened.json()) as { sessionId: string }
    const client = scriptedClient([says('Hello.')])
    setModelClient(client)
    await drain(await request('POST', '/api/ai/prompt', { sessionId, text: 'Hi.' }))
    const system = systemText(client.seen[0]).replace(/\s+/g, ' ')
    expect(system).toContain('Up to 3 builders run at once.')
    expect(system).toContain('## Saying what is running')
    expect(system).not.toMatch(/one piece at a time|never several at once|builders run one at a time/i)
  })

  withScopes('test_UAT_FC_REQ-410_a_delegation_naming_no_files_is_refused_before_its_builder_opens', async () => {
    configureDelegation({ ...delegationDocument, enabled: true })
    const site = await sectionedSite('noscope')
    for (const scope of [undefined, []]) {
      resetAiHost()
      resetChatHost()
      const client = await commission(
        site,
        [{ note: 'Fixing the hero.', role: BUILDER_ROLE, goal: 'Rewrite the hero.', accept: [], ...(scope ? { scope } : {}) }],
        (req) => says('I should never be asked.')(req),
      )
      // No builder session ever received a request: refused before it opened.
      expect(builderRequests(client)).toEqual([])
      const answer = toolResults(caller(client).at(-1)!).join('\n')
      expect(answer).toContain('scope_held')
      expect(answer).toContain('names no files in `scope`, so it was not started and nothing was spent')
      expect(answer).toContain('`home.json#hero`')
      expect(await d1Leases(env.DB).held(site)).toEqual([])
    }
  })

  withScopes('test_UAT_FC_REQ-410_a_delegation_naming_its_section_proceeds_and_writes_it', async () => {
    configureDelegation({ ...delegationDocument, enabled: true })
    const site = await sectionedSite('scoped')
    let step = 0
    const builder = [
      calls('set_l1', { page: 'home', section: 'hero', path: '0', node: node('hero', 'Builder hero') }),
      REPORT,
      says(''),
    ]
    const client = await commission(
      site,
      [{ note: 'Fixing the hero.', role: BUILDER_ROLE, goal: 'Rewrite the hero.', accept: [], scope: ['home.json#hero'] }],
      (req) => builder[Math.min(step++, builder.length - 1)](req),
    )
    expect(builderRequests(client).length).toBeGreaterThan(0)
    expect(await textOf(site, 'hero')).toBe('Builder hero')
    expect(await d1Leases(env.DB).held(site)).toEqual([])
  })

  it('test_UAT_FC_REQ-410_where_the_store_is_not_leased_there_is_no_claim_and_nothing_is_refused', async () => {
    // Without leases the host registers no `claim` hook at all, so an unscoped
    // Delegate reaches its builder exactly as before this ticket.
    expect(draftClaims(await tenantStore(TENANT), 'any', 60_000)).toBeNull()
  })
})
