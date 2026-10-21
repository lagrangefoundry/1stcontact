import { afterEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { encodePng } from '../tools/generate/src/cli/png'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import { LAYOUT_SCRIPT } from '../tools/generate/src/cli/ai/layout-check'
import { CANNOT_LOOK_LINE } from '../tools/generate/src/cli/ai/plan-core'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { fakeBrowser } from './support/fake-puppeteer'
import { calls, says, scriptedClient, systemText, type ModelRequest, type ModelStep } from './support/scripted-model-client'

/**
 * [[BUG-235]] — the build-sooner and visual-check path, end to end: a stopped
 * round is never continued, a clean layout check says it is clean, and a
 * deployment with no browser can still close the publishing stages.
 *
 * The real route inside workerd — `POST /api/ai/prompt` and `POST /api/ai/stop`,
 * the real session manager, delegation surface, plan and session inbox, a real D1
 * and R2 — with two doubles at the network's edge: the Anthropic client and the
 * browser.
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'
const ENABLED = { ...delegationDocument, enabled: true }
const WORKER_MODEL = backendsDocument.claude_builder.model
const PHONE_FINDING = 'has a list built as 2 side-by-side columns, and its rows do not line up from row 1'
const CONTINUED = 'still have layout faults'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

async function png(): Promise<Uint8Array> {
  return encodePng({ data: new Uint8Array(8 * 8 * 3).fill(0x60), width: 8, height: 8, channels: 3 })
}

const post = (scope: Scope, deps: RouterDeps, path: string, body: unknown): Promise<Response> =>
  route(
    new Request(`${ORIGIN}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    routerEnv(),
    scope,
    deps,
  )

/** A business with one site holding a home page and a prices page, and a session on it. */
async function session(id: string, deps: RouterDeps): Promise<{ scope: Scope; sessionId: string }> {
  await APPLIED
  await ensureTenant(id)
  const scope = { businessId: id }
  const seed = siteSeed({ slug: `site-${id}` })
  const home = starterHomePage(seed.slug) as Record<string, unknown>
  const pages = { 'home.json': home, 'prices.json': { ...home, id: 'prices', slug: 'prices', title: 'Prices' } }
  const imported = await post(scope, deps, '/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson,
    pages: Object.entries(pages).map(([name, page]) => ({ name, page })),
    assets: [],
  })
  expect(imported.status).toBe(200)
  const slug = ((await imported.json()) as { site: string }).site
  const opened = await post(scope, deps, '/api/ai/session', { site: slug })
  return { scope, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

type Frame = { kind: string; content: string; meta?: Record<string, unknown> }

/** One client message, start to finish: its stream's frames. */
async function prompt(scope: Scope, sessionId: string, deps: RouterDeps, said = 'Please sort out the prices page.'): Promise<Frame[]> {
  const streamed = await post(scope, deps, '/api/ai/prompt', { sessionId, text: said })
  const out: Frame[] = []
  for (const block of (await streamed.text()).split('\n\n')) {
    const line = block.split('\n').find((l) => l.startsWith('data: '))
    if (line) out.push(JSON.parse(line.slice('data: '.length)) as Frame)
  }
  return out
}

/** Every word in a message's content, tool results included. */
const text = (content: unknown): string =>
  typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.map(text).join('\n')
      : content && typeof content === 'object'
        ? text((content as { text?: unknown; content?: unknown }).text ?? (content as { content?: unknown }).content ?? '')
        : ''

const said = (req: ModelRequest): string => req.messages.map((m) => text(m.content)).join('\n') + systemText(req)

/** A browser whose layout check finds `findings` on the phone layout and nothing on desktop. */
async function browser(findings: { section: string; kind: string; text: string }[]): Promise<ReturnType<typeof fakeBrowser>> {
  return fakeBrowser({
    png: await png(),
    evaluate: (script, viewport) => {
      if (script !== LAYOUT_SCRIPT) return []
      return { width: viewport?.width ?? 1280, findings: viewport?.width === 375 ? findings : [] }
    },
  })
}

/** The builder: rewrites the prices heading and reports. */
const BUILDER: ModelStep[] = [
  calls('set_l1', { page: 'prices', path: '0.0', node: { kind: 'text', text: 'Colour prices', axes: { fontSizePx: 40 } } }),
  calls('ReportResult', { summary: 'Rewrote the heading.', changed: ['prices'] }),
  says('Reported.'),
]

const DELEGATE = calls('Delegate', {
  scope: ['site.json', 'prices.json'],
  note: 'On it.',
  role: BUILDER_ROLE,
  goal: 'Rewrite the prices heading.',
})

/**
 * The consultant's script and the builder's, told apart by model. `hold` runs
 * inside the consultant's n-th request before it is answered.
 */
function client(consultant: ModelStep[], hold: (n: number) => Promise<void> = async () => {}) {
  let atCaller = 0
  let atWorker = 0
  const inner = scriptedClient([
    (req) => {
      const [script, index] = req.model === WORKER_MODEL ? [BUILDER, atWorker++] : [consultant, atCaller++]
      return script[Math.min(index, script.length - 1)](req)
    },
  ])
  let n = 0
  return {
    ...inner,
    messages: {
      create: async (req: ModelRequest) => {
        if (req.model !== WORKER_MODEL) await hold(n++)
        return inner.messages.create(req)
      },
    },
  } as typeof inner
}

const consultantRequests = (c: ReturnType<typeof scriptedClient>): ModelRequest[] =>
  c.seen.filter((req) => req.model !== WORKER_MODEL)

describe('BUG-235 build sooner: stops, clean checks and no browser', () => {
  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-235_a_clean_layout_check_says_it_found_no_faults', async () => {
    configureDelegation(ENABLED)
    const b = await browser([])
    const deps = { launch: b.launch }
    const { scope, sessionId } = await session('bug235-clean', deps)
    const c = client([DELEGATE, says('The prices page is done.')])
    setModelClient(c)
    await prompt(scope, sessionId, deps)
    const report = consultantRequests(c)
      .map(said)
      .join('\n')
    expect(report).toContain('The host looked at what the build you started wrote')
    expect(report).toContain('No layout faults at either width.')
    expect(report).not.toContain('The check finds faults')
    expect(report).not.toContain('THIS BUILD IS NOT DONE')
  }, 60000)

  it('test_UAT_FC_BUG-235_a_round_the_client_stopped_is_not_continued_for_owed_layout_faults', async () => {
    configureDelegation(ENABLED)
    const b = await browser([{ section: '0.0', kind: 'misaligned_rows', text: PHONE_FINDING }])
    const deps = { launch: b.launch }
    const { scope, sessionId } = await session('bug235-stopped', deps)
    let stopped: Response | null = null
    // THE CLIENT PRESSES STOP while the consultant reads the builder's result,
    // with the layout fault owed; held long enough for the round to take it.
    const c = client([DELEGATE, says('Fixed it.')], async (n) => {
      if (n !== 1) return
      stopped = await post(scope, deps, '/api/ai/stop', { sessionId })
      await new Promise((r) => setTimeout(r, 2_600))
    })
    setModelClient(c)
    const stream = await prompt(scope, sessionId, deps)
    expect(stopped!.status).toBe(200)
    // The fault was owed…
    expect(consultantRequests(c).map(said).join('\n')).toContain('THIS BUILD IS NOT DONE')
    // …and still no layout continuation ran: the request ended with the stop.
    expect(consultantRequests(c).some((req) => said(req).includes(CONTINUED))).toBe(false)
    expect(stream.at(-1)).toMatchObject({ kind: 'done' })
  }, 60000)

  it('test_UAT_FC_BUG-235_a_stop_the_round_never_looked_at_prevents_the_next_round', async () => {
    configureDelegation(ENABLED)
    const b = await browser([{ section: '0.0', kind: 'misaligned_rows', text: PHONE_FINDING }])
    const deps = { launch: b.launch }
    const { scope, sessionId } = await session('bug235-between', deps)
    // THE STOP LANDS AS THE ROUND'S LAST REPLY IS WRITTEN, after the round last
    // looked at the inbox: nothing in the round acts on it, so it falls between
    // this round and the continuation the owed fault would start.
    const c = client([DELEGATE, says('Fixed it.')], async (n) => {
      if (n === 1) await post(scope, deps, '/api/ai/stop', { sessionId })
    })
    setModelClient(c)
    await prompt(scope, sessionId, deps)
    expect(consultantRequests(c).map(said).join('\n')).toContain('THIS BUILD IS NOT DONE')
    expect(consultantRequests(c).some((req) => said(req).includes(CONTINUED))).toBe(false)

    // AND IT WAS TAKEN, so it does not stop the client's next message.
    const next = client([says('Noted.')])
    setModelClient(next)
    const frames = await prompt(scope, sessionId, deps, 'Thanks.')
    expect(frames.at(-1)?.meta?.status).toBe('complete')
  }, 60000)

  it('test_UAT_FC_BUG-235_with_no_browser_the_publishing_stages_close_and_the_plan_says_pages_could_not_be_looked_at', async () => {
    configureDelegation(ENABLED)
    const deps: RouterDeps = {}
    const { scope, sessionId } = await session('bug235-nobrowser', deps)
    const c = client([
      calls('set_stage', { stage: 'finishing_touches', state: 'in_progress' }),
      DELEGATE,
      calls('set_stage', { stage: 'finishing_touches', state: 'done' }),
      calls('set_stage', { stage: 'ready_to_publish', state: 'in_progress' }),
      says('Ready when you are.'),
    ])
    setModelClient(c)
    await prompt(scope, sessionId, deps)
    const last = said(consultantRequests(c).at(-1)!)
    // Neither publishing stage was refused for pages nobody could look at.
    expect(last).not.toContain('NOT_LOOKED')
    expect(last).toContain('ready_to_publish')

    // The next message's plan entry says the pages could not be looked at, and
    // lists none as unlooked.
    const second = client([says('Noted.')])
    setModelClient(second)
    await prompt(scope, sessionId, deps, 'Thanks.')
    const entry = said(second.seen[0])
    expect(entry).toContain(CANNOT_LOOK_LINE)
    expect(entry).not.toContain('Not looked at since they changed')
  }, 60000)
})
