import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import { editPageDecompose } from '../tools/generate/src/cli/edit'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { d1Leases } from '../tools/generate/src/store/d1-leases'
import { leasedStore } from '../tools/generate/src/store/leased-store'
import { asWriter, CLIENT_HOLDER, DraftFileRefusal } from '../tools/generate/src/store/leases'
import { concurrentSupported, scopeSupported } from '../tools/generate/src/cli/ai/lease-core'
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
 * [[REQ-397]] — **one agent per draft file at a time**, in the Worker.
 *
 * WHAT MAKES THIS EVIDENCE. The real routes inside workerd — `POST /api/copy`,
 * `GET /api/leases`, `POST /api/ai/prompt` with the real session manager, the
 * real delegation surface and its `claim` hook, the real tool loop — over a real
 * D1 holding the real `draft_leases` table. The one double is the Anthropic
 * client, which is the network. A builder holding a file is either a real
 * delegated builder or a lease taken through the same D1 adapter the claim hook
 * uses.
 *
 * NEEDS lagrange-framework REQ-207 in the installed `@lagrangefoundry/ai`: the
 * `scope` on Delegate and the `claim` hook on a worker config. The cases that go
 * through a delegation are skipped where the installed Delegate has no `scope`
 * (read the way the host reads it, at collection), because nothing in this repo
 * can make them pass there; the route, D1 and compare-and-set cases always run.
 */
const SCOPED = scopeSupported(aiLib) && concurrentSupported(aiLib)
const withScopes = it.skipIf(!SCOPED)

const TENANT = 'req397'
const WORKER_MODEL = backendsDocument.claude_builder.model
const HOLDER = 'worker-builder-held0001'

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

/** A page whose root stacks two sections, so it can be stored as sections. */
function twoSectionPage(): Record<string, unknown> {
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
  return page
}

/** A site in D1 with `home` stored as sections `hero` and `story`. */
async function sectionedSite(name: string): Promise<string> {
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(name), pages: { 'home.json': twoSectionPage() } })
  await editPageDecompose(site, 'home', { store: await tenantStore(TENANT) })
  return site
}

async function textOf(site: string, section: string): Promise<string> {
  const page = (await (await tenantStore(TENANT)).readPages(site))[0].page as {
    l1: { root: { children: Array<{ id: string; text: string }> } }
  }
  return page.l1.root.children.find((c) => c.id === section)!.text
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

/** Run one consultant turn that commissions a builder with `scope`; return the client. */
async function delegate(site: string, scope: string[], builder: ModelStep[]): Promise<ScriptedClient> {
  const opened = await request('POST', '/api/ai/session', { site })
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const client = twoSided(
    [
      calls('Delegate', {
        note: 'Working on the story now.',
        role: BUILDER_ROLE,
        goal: 'Rewrite the story section.',
        accept: [],
        scope,
      }),
      says('Noted.'),
    ],
    builder,
  )
  setModelClient(client)
  await drain(await request('POST', '/api/ai/prompt', { sessionId, text: 'Have the story rewritten.' }))
  return client
}

const caller = (client: ScriptedClient) => client.seen.filter((req) => req.model !== WORKER_MODEL)
const builderRequests = (client: ScriptedClient) => client.seen.filter((req) => req.model === WORKER_MODEL)

const REPORT = calls('ReportResult', { summary: 'Done what I could.', changed: [], decisions: [], passed: [], failed: [] })

describe('REQ-397 draft-file leases in the Worker', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_REQ-397_a_copy_save_on_a_builder_held_section_is_409_naming_the_holder', async () => {
    const site = await sectionedSite('copy')
    await d1Leases(env.DB).acquire(site, ['home.json#hero'], HOLDER, 5 * 60_000)

    // The modal is told before it opens a form...
    const got = await request('GET', `/api/copy?site=${site}&page=home&path=0.0`)
    expect(got.status).toBe(200)
    const busy = ((await got.json()) as { busy?: { file: string; holder: string; line: string } }).busy
    expect(busy?.file).toBe('home.json#hero')
    expect(busy?.line).toMatch(/^Your AI assistant is updating this section right now \(started /)

    // ...and a Save is refused, 409, naming who holds it. Nothing is written.
    const saved = await request('POST', '/api/copy', { site, page: 'home', path: '0.0', values: { text: 'Client words' } })
    expect(saved.status).toBe(409)
    const body = (await saved.json()) as Record<string, unknown>
    expect(body.code).toBe('FILE_HELD')
    expect(body.holder).toBe(`builder ${HOLDER}`)
    expect(String(body.error)).toContain('`home.json#hero` is held by')
    expect(await textOf(site, 'hero')).toBe('Hero words')

    // The section beside it is the client's to edit.
    const free = await request('POST', '/api/copy', { site, page: 'home', path: '0.1', values: { text: 'Client story' } })
    expect(free.status).toBe(200)
    expect(await textOf(site, 'story')).toBe('Client story')

    // And what is held is readable.
    const listed = (await (await request('GET', `/api/leases?site=${site}`)).json()) as {
      leases: Array<{ file: string; holder: string; who: string }>
    }
    expect(listed.leases.map((l) => [l.file, l.who])).toEqual([['home.json#hero', `builder ${HOLDER}`]])
  })

  withScopes('test_UAT_FC_REQ-397_a_delegation_naming_a_held_file_is_refused_before_any_worker_opens', async () => {
    configureDelegation({ ...delegationDocument, enabled: true })
    const site = await sectionedSite('claim')
    await d1Leases(env.DB).acquire(site, ['home.json#story'], HOLDER, 5 * 60_000)

    const client = await delegate(site, ['home.json#story'], [says('I should never be asked.')])

    // No builder session ever received a request: refused before it opened.
    expect(builderRequests(client)).toEqual([])
    const answer = toolResults(caller(client).at(-1)!).join('\n')
    expect(answer).toContain('scope_held')
    expect(answer).toContain(`\`home.json#story\` is held by builder ${HOLDER}`)
    expect(answer).toContain('this builder was not started and nothing was spent')
  })

  withScopes('test_UAT_FC_REQ-397_a_delegated_builder_writing_outside_its_scope_is_refused_and_its_files_are_released_on_report', async () => {
    configureDelegation({ ...delegationDocument, enabled: true })
    const site = await sectionedSite('scope')
    const node = (id: string, text: string) => ({ kind: 'text', id, text, axes: { fontSizePx: 16 } })

    const client = await delegate(site, ['home.json#story'], [
      calls('set_l1', { page: 'home', section: 'hero', path: '0', node: node('hero', 'Builder hero') }),
      calls('set_l1', { page: 'home', section: 'story', path: '0', node: node('story', 'Builder story') }),
      REPORT,
      says(''),
    ])

    const seen = builderRequests(client)
    expect(toolResults(seen[1]).join('\n')).toContain("`home.json#hero` is not in this session's scope (home.json#story)")
    expect(await textOf(site, 'hero')).toBe('Hero words')
    expect(await textOf(site, 'story')).toBe('Builder story')

    // The builder reported; the framework's `finally` ran the release.
    expect(await d1Leases(env.DB).held(site)).toEqual([])
  })

  withScopes('test_UAT_FC_REQ-397_a_builder_that_fails_releases_its_files', async () => {
    configureDelegation({ ...delegationDocument, enabled: true })
    const site = await sectionedSite('error')
    await delegate(site, ['home.json#story'], [
      () => {
        throw new Error('the provider fell over')
      },
    ])
    expect(await d1Leases(env.DB).held(site)).toEqual([])
    // The file is claimable again at once.
    await d1Leases(env.DB).acquire(site, ['home.json#story'], HOLDER, 60_000)
  })

  it('test_UAT_FC_REQ-397_an_expired_lease_in_d1_is_reclaimable_and_acquire_is_all_or_nothing', async () => {
    const site = await sectionedSite('expiry')
    let t = Date.parse('2026-10-15T14:02:00Z')
    const leases = d1Leases(env.DB, () => t)
    await leases.acquire(site, ['home.json#hero'], 'worker-builder-dead', 5 * 60_000)

    await expect(leases.acquire(site, ['home.json#story', 'home.json#hero'], HOLDER, 60_000)).rejects.toThrow(
      '`home.json#hero` is held by builder worker-builder-dead since 14:02 UTC (0 min)',
    )
    expect((await leases.held(site)).map((l) => l.file)).toEqual(['home.json#hero'])

    t += 5 * 60_000 + 1
    await leases.acquire(site, ['home.json#story', 'home.json#hero'], HOLDER, 60_000)
    expect((await leases.held(site)).map((l) => [l.file, l.holder])).toEqual([
      ['home.json#hero', HOLDER],
      ['home.json#story', HOLDER],
    ])
  })

  it('test_UAT_FC_REQ-397_a_stale_write_in_d1_loses_the_compare_and_set', async () => {
    const site = await sectionedSite('cas')
    const store = leasedStore(await tenantStore(TENANT), d1Leases(env.DB))
    const unit = (text: string) => ({ node: { kind: 'text', id: 'hero', text, axes: { fontSizePx: 16 } } })
    const err = await asWriter({ holder: CLIENT_HOLDER, scope: null }, async () => {
      await store.readPages(site)
      await asWriter({ holder: 'site-other', scope: null }, () =>
        store.write(site, { sections: [{ page: 'home.json', id: 'hero', unit: unit('Got there first') }] }),
      )
      return store.write(site, { sections: [{ page: 'home.json', id: 'hero', unit: unit('Stale') }] }).then(
        () => null,
        (e: unknown) => e,
      )
    })
    expect(err).toBeInstanceOf(DraftFileRefusal)
    expect((err as DraftFileRefusal).code).toBe('FILE_CHANGED')
    expect(await textOf(site, 'hero')).toBe('Got there first')
  })

  withScopes('test_UAT_FC_REQ-397_the_consultant_is_told_the_overlap_rules_when_builders_can_run_together', async () => {
    const site = await sectionedSite('priming')
    for (const [cap, expected, absent] of [
      [3, 'Up to 3 builders run at once.', 'Builders run one at a time.'],
      [1, 'Builders run one at a time.', 'builders run at once'],
    ] as const) {
      configureDelegation({ ...delegationDocument, enabled: true, max_concurrent: cap })
      resetAiHost()
      resetChatHost()
      const opened = await request('POST', '/api/ai/session', { site })
      const { sessionId } = (await opened.json()) as { sessionId: string }
      const client = scriptedClient([says('Hello.')])
      setModelClient(client)
      await drain(await request('POST', '/api/ai/prompt', { sessionId, text: 'Hi.' }))
      const system = systemText(client.seen[0])
      expect(system).toContain('Every builder names the files it will write, in `scope`')
      expect(system).toContain(expected)
      expect(system).not.toContain(absent)
    }
  })
})
