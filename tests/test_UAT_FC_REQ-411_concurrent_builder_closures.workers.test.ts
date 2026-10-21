import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import { concurrentSupported, scopeSupported } from '../tools/generate/src/cli/ai/lease-core'
import { editPageDecompose } from '../tools/generate/src/cli/edit'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { d1Leases } from '../tools/generate/src/store/d1-leases'
import * as aiLib from '../apps/control-app/src/generated/ai-workers.js'
import {
  calls,
  says,
  systemText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite, tenantStore } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-411]] — **builders commissioned together run together.**
 *
 * The host hands the consultant every tool as a `lib.Tool` closure, so each call
 * runs as a known writer of draft files. A closure now carries the concurrency
 * of the operation it wraps (lagrange-framework REQ-208), so two `Delegate`
 * calls in one reply overlap, up to `max_concurrent`, while every other tool
 * still runs alone. Each builder writes as itself: its leases are its own.
 *
 * EVIDENCE: the real routes inside workerd, the real session manager, the real
 * delegation surface and `claim` hook, over a real D1 with the real
 * `draft_leases` table. The one double is the Anthropic client, whose builder
 * side waits at a barrier: a builder that is open at the same time as the other
 * meets it there; one that runs alone waits out the barrier and is recorded as
 * not having overlapped.
 */
const PARALLEL = scopeSupported(aiLib) && concurrentSupported(aiLib)
const whenParallel = it.skipIf(!PARALLEL)

const TENANT = 'req411'
const WORKER_MODEL = backendsDocument.claude_builder.model
const BARRIER_MS = 1500

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

const node = (id: string, text: string) => ({ kind: 'text', id, text, axes: { fontSizePx: 16 } })
const REPORT = calls('ReportResult', { summary: 'Done.', changed: [], decisions: [], passed: [], failed: [] })
const brief = (section: string) => ({
  note: `Fixing the ${section}.`,
  role: BUILDER_ROLE,
  goal: `Rewrite the ${section} section.`,
  accept: [],
  scope: [`home.json#${section}`],
})

/** What happened on the builder side, in order. */
interface Timeline {
  events: string[]
  /** Whether each builder, on its first call, found the other already open. */
  met: Record<string, boolean>
}

/**
 * A builder double. Each builder is told apart by its goal; on its first call it
 * waits up to {@link BARRIER_MS} for the other builder's first call, then plays
 * its own script.
 */
function builders(scripts: Record<string, ModelStep[]>) {
  const timeline: Timeline = { events: [], met: {} }
  const step: Record<string, number> = {}
  const arrived = new Map<string, () => void>()
  const waiting = new Map<string, Promise<void>>()
  for (const name of Object.keys(scripts)) {
    let release!: () => void
    waiting.set(name, new Promise<void>((resolve) => (release = resolve)))
    arrived.set(name, release)
  }
  const who = (req: ModelRequest) => {
    const first = JSON.stringify(req.messages[0] ?? '')
    return Object.keys(scripts).find((name) => first.includes(`Rewrite the ${name} section.`))!
  }
  const run = async (req: ModelRequest) => {
    const name = who(req)
    const at = step[name] ?? 0
    step[name] = at + 1
    if (at === 0) {
      timeline.events.push(`open ${name}`)
      arrived.get(name)!()
      const others = [...waiting.entries()].filter(([n]) => n !== name).map(([, p]) => p)
      const timeout = new Promise<'alone'>((resolve) => setTimeout(() => resolve('alone'), BARRIER_MS))
      timeline.met[name] = (await Promise.race([Promise.all(others).then(() => 'met' as const), timeout])) === 'met'
    }
    const script = scripts[name]
    if (at >= script.length - 1) timeline.events.push(`finish ${name}`)
    return script[Math.min(at, script.length - 1)](req)
  }
  return { timeline, run }
}

/** One consultant turn whose first reply is `reply`; builders answer through `builder`. */
async function turn(site: string, reply: ModelStep, builder: (req: ModelRequest) => Promise<ReturnType<ModelStep>>) {
  const opened = await request('POST', '/api/ai/session', { site })
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const script: ModelStep[] = [reply, says('Noted.')]
  let atCaller = 0
  const seen: ModelRequest[] = []
  const client = {
    seen,
    messages: {
      create: async (req: ModelRequest) => {
        seen.push(req)
        const events = req.model === WORKER_MODEL ? await builder(req) : script[Math.min(atCaller++, script.length - 1)](req)
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

const consultantAnswer = (client: ScriptedClient) =>
  toolResults(client.seen.filter((req) => req.model !== WORKER_MODEL).at(-1)!).join('\n')

describe('REQ-411 — builders commissioned together run together', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  whenParallel(
    'test_UAT_FC_REQ-411_two_delegations_on_different_sections_run_concurrently_and_each_writes_only_its_own',
    async () => {
      configureDelegation({ ...delegationDocument, enabled: true, max_concurrent: 3 })
      const site = await sectionedSite('overlap')
      const { timeline, run } = builders({
        hero: [
          // A write to the other builder's section is refused by its lease…
          calls('set_l1', { page: 'home', section: 'story', path: '0', node: node('story', 'Hero builder was here') }),
          // …and its own goes through.
          calls('set_l1', { page: 'home', section: 'hero', path: '0', node: node('hero', 'Builder hero') }),
          REPORT,
          says(''),
        ],
        story: [
          calls('set_l1', { page: 'home', section: 'story', path: '0', node: node('story', 'Builder story') }),
          REPORT,
          says(''),
        ],
      })
      await turn(site, callsAll([['Delegate', brief('hero')], ['Delegate', brief('story')]]), run)

      // Both builders were open before either finished.
      expect(timeline.met).toEqual({ hero: true, story: true })
      expect(timeline.events.slice(0, 2).sort()).toEqual(['open hero', 'open story'])
      // Each wrote its own section, and only that.
      expect(await textOf(site, 'hero')).toBe('Builder hero')
      expect(await textOf(site, 'story')).toBe('Builder story')
      expect(await d1Leases(env.DB).held(site)).toEqual([])
    },
  )

  whenParallel('test_UAT_FC_REQ-411_two_delegations_on_the_same_file_the_second_is_refused_at_claim', async () => {
    configureDelegation({ ...delegationDocument, enabled: true, max_concurrent: 3 })
    const site = await sectionedSite('samefile')
    const opened: string[] = []
    let step = 0
    const script = [
      calls('set_l1', { page: 'home', section: 'hero', path: '0', node: node('hero', 'Builder hero') }),
      REPORT,
      says(''),
    ]
    const client = await turn(site, callsAll([['Delegate', brief('hero')], ['Delegate', brief('hero')]]), async (req) => {
      if (step === 0) opened.push('builder')
      return script[Math.min(step++, script.length - 1)](req)
    })
    // One builder ran; the other was refused before it opened, at no cost.
    expect(opened).toEqual(['builder'])
    const answer = consultantAnswer(client)
    expect(answer).toContain('scope_held')
    expect(answer).toContain('so this builder was not started and nothing was spent')
    expect(await textOf(site, 'hero')).toBe('Builder hero')
    expect(await d1Leases(env.DB).held(site)).toEqual([])
  })

  whenParallel('test_UAT_FC_REQ-411_a_non_concurrent_tool_in_the_same_reply_still_runs_alone', async () => {
    configureDelegation({ ...delegationDocument, enabled: true, max_concurrent: 3 })
    const site = await sectionedSite('alone')
    const { timeline, run } = builders({
      // A recorded report ends a builder's turn ([[BUG-243]]): it is the last request.
      hero: [REPORT],
      story: [REPORT],
    })
    // `list_pages` is declared non-concurrent: it waits for the hero builder to
    // finish and runs before the story builder can start.
    await turn(
      site,
      callsAll([['Delegate', brief('hero')], ['list_pages', {}], ['Delegate', brief('story')]]),
      run,
    )
    // The hero builder waited out the barrier alone, and the story builder
    // opened only after it had finished.
    expect(timeline.met.hero).toBe(false)
    expect(timeline.events).toEqual(['open hero', 'finish hero', 'open story', 'finish story'])
  })

  whenParallel('test_UAT_FC_REQ-411_the_consultant_is_told_the_configured_cap_where_closures_can_overlap', async () => {
    configureDelegation({ ...delegationDocument, enabled: true, max_concurrent: 2 })
    const site = await sectionedSite('priming')
    const client = await turn(site, says('Hello.'), async (req) => says('')(req))
    const system = systemText(client.seen[0]).replace(/\s+/g, ' ')
    expect(system).toContain('Up to 2 builders run at once.')
    expect(system).not.toContain('Builders run one at a time.')
  })

  it('test_UAT_FC_REQ-411_a_framework_whose_Tool_cannot_be_concurrent_is_not_offered_parallel_builders', () => {
    // The installed framework (REQ-208) registers a closure as concurrent…
    expect(concurrentSupported(aiLib)).toBe(true)
    // …and one whose `Tool` ignores the option — every framework before REQ-208 —
    // is not, though its Delegate is still declared concurrent: the host would
    // run its builders one at a time, so the consultant is told so.
    class SerialTool {
      concurrent: undefined
      constructor(public name: string) {}
    }
    expect(concurrentSupported({ ...aiLib, Tool: SerialTool })).toBe(false)
  })
})
