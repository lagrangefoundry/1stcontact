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
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { fakeBrowser } from './support/fake-puppeteer'
import { calls, says, scriptedClient, systemText, type ModelRequest, type ModelStep } from './support/scripted-model-client'

/**
 * [[REQ-415]] — the host looks after every build, and the end of the build waits
 * for the consultant to have looked.
 *
 * WHAT MAKES THIS EVIDENCE. The real route inside workerd — `POST /api/ai/prompt`,
 * the real session manager, the real delegation surface, the real plan stored in
 * the business's ticket store, a real D1 and R2 — with two doubles at the
 * network's edge: the Anthropic client, and the browser. The browser's layout
 * answer is scripted, because what is under test here is what the HOST does with
 * a finding; the check itself is proved in a real Chromium by
 * `test_UAT_FC_REQ-415_layout_check`.
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'
const ENABLED = { ...delegationDocument, enabled: true }
const WORKER_MODEL = backendsDocument.claude_builder.model
const PHONE_FINDING = 'has a list built as 2 side-by-side columns, and its rows do not line up from row 1'

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
  const data = new Uint8Array(8 * 8 * 3).fill(0x60)
  return encodePng({ data, width: 8, height: 8, channels: 3 })
}

/** A business with one site holding a home page and a prices page. */
async function business(id: string): Promise<{ scope: Scope; slug: string }> {
  await APPLIED
  await ensureTenant(id)
  const scope = { businessId: id }
  const seed = siteSeed({ slug: `site-${id}` })
  const home = starterHomePage(seed.slug) as Record<string, unknown>
  const pages = { 'home.json': home, 'prices.json': { ...home, id: 'prices', slug: 'prices', title: 'Prices' } }
  const imported = await route(
    new Request(`${ORIGIN}/api/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: seed.slug,
        siteJson: seed.siteJson,
        pages: Object.entries(pages).map(([name, page]) => ({ name, page })),
        assets: [],
      }),
    }),
    routerEnv(),
    scope,
    {},
  )
  expect(imported.status).toBe(200)
  return { scope, slug: ((await imported.json()) as { site: string }).site }
}

/** One client message, start to finish. */
async function prompt(scope: Scope, slug: string, client: ReturnType<typeof scriptedClient>, deps: RouterDeps): Promise<void> {
  const opened = await route(
    new Request(`${ORIGIN}/api/ai/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site: slug }),
    }),
    routerEnv(),
    scope,
    deps,
  )
  const { sessionId } = (await opened.json()) as { sessionId: string }
  setModelClient(client)
  const streamed = await route(
    new Request(`${ORIGIN}/api/ai/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, text: 'Please sort out the prices page.' }),
    }),
    routerEnv(),
    scope,
    deps,
  )
  await streamed.text()
}

/**
 * Every tool result the consultant was handed, in order, by tool name — read off
 * its last request, which carries the whole conversation. Paired by position: a
 * scripted call's id is not unique.
 */
function toolResults(requests: ModelRequest[]): { name: string; content: unknown }[] {
  const out: { name: string; content: unknown }[] = []
  let pending: string[] = []
  for (const message of requests.at(-1)!.messages) {
    if (!Array.isArray(message.content)) continue
    const blocks = message.content as { type?: string; name?: string; content?: unknown }[]
    if (message.role === 'assistant') pending = blocks.filter((b) => b.type === 'tool_use').map((b) => String(b.name))
    for (const b of blocks.filter((x) => x.type === 'tool_result')) out.push({ name: pending.shift() ?? '?', content: b.content })
  }
  return out
}

const text = (content: unknown): string =>
  typeof content === 'string'
    ? content
    : (content as { type: string; text?: string }[]).filter((b) => b.type === 'text').map((b) => b.text).join('\n')

/** A browser whose layout check finds one fault on the phone layout. */
async function browserFindingAFault(): Promise<ReturnType<typeof fakeBrowser>> {
  return fakeBrowser({
    png: await png(),
    evaluate: (script, viewport) => {
      if (script !== LAYOUT_SCRIPT) return []
      return viewport?.width === 375
        ? { width: 375, findings: [{ section: '0.0', kind: 'misaligned_rows', text: PHONE_FINDING }] }
        : { width: viewport?.width ?? 1280, findings: [] }
    },
  })
}

describe('REQ-415 the host looks, and the end of the build waits for a look', () => {
  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_REQ-415_a_builders_result_carries_the_hosts_picture_and_layout_report', async () => {
    configureDelegation(ENABLED)
    const { scope, slug } = await business('req415-look')
    const browser = await browserFindingAFault()
    let atCaller = 0
    let atWorker = 0
    const caller: ModelStep[] = [
      calls('Delegate', { scope: ['site.json', 'prices.json'], note: 'On it.', role: BUILDER_ROLE, goal: 'Rewrite the prices heading.' }),
      says('The prices page is done.'),
    ]
    const builder: ModelStep[] = [
      calls('set_l1', { page: 'prices', path: '0.0', node: { kind: 'text', text: 'Colour prices', axes: { fontSizePx: 40 } } }),
      calls('ReportResult', { summary: 'Rewrote the heading.', changed: ['prices'] }),
      says('Reported.'),
    ]
    const client = scriptedClient([
      (req) => {
        const [script, index] = req.model === WORKER_MODEL ? [builder, atWorker++] : [caller, atCaller++]
        return script[Math.min(index, script.length - 1)](req)
      },
    ])
    await prompt(scope, slug, client, { launch: browser.launch })

    const consultant = client.seen.filter((req) => req.model !== WORKER_MODEL)
    const delegated = toolResults(consultant).find((r) => r.name === 'Delegate')
    expect(delegated, 'the consultant was handed the Delegate result').toBeDefined()
    // THE PICTURE ARRIVED WITHOUT BEING ASKED FOR: content blocks, an image among them.
    expect(Array.isArray(delegated!.content)).toBe(true)
    const blocks = delegated!.content as { type: string; text?: string }[]
    expect(blocks.some((b) => b.type === 'image')).toBe(true)
    // The builder's own result is first and whole, fence and all.
    expect(blocks[0].text).toMatch(/^<<<untrusted>>>/)
    expect(blocks[0].text).toContain('Rewrote the heading.')
    // And the host's report names the page, the width and the section.
    const report = blocks[1].text!
    expect(report).toContain('The host looked at what the build you started wrote')
    expect(report).toContain(`prices, phone (375px): section 0.0 ${PHONE_FINDING}`)
    expect(report).toContain('THIS BUILD IS NOT DONE')
    // The check ran at both widths, and the picture is low detail.
    expect(browser.log.viewports.some((v) => v?.width === 375)).toBe(true)
    expect(browser.log.viewports.some((v) => v?.width === 1280)).toBe(true)

    // A REPLY THAT ENDED WITH THE FAULT STILL THERE WAS CONTINUED BY THE HOST,
    // with the finding in front of the consultant.
    const cue = consultant.find((req) => req.messages.some((m) => text(m.content).includes('still have layout faults')))
    expect(cue, 'the host carried the request on').toBeDefined()
    const said = cue!.messages.map((m) => text(m.content)).join('\n')
    expect(said).toContain(PHONE_FINDING)
  }, 60000)

  it('test_UAT_FC_REQ-415_ready_to_publish_waits_until_every_changed_page_is_looked_at_on_desktop_and_phone', async () => {
    configureDelegation(ENABLED)
    const { scope, slug } = await business('req415-gate')
    const browser = fakeBrowser({ png: await png() })
    const look = (page: string, viewport: string) => calls('screenshot', { of: { kind: 'draft', page, viewport } })
    let atCaller = 0
    let atWorker = 0
    const caller: ModelStep[] = [
      look('/', 'desktop'),
      look('/', 'mobile'),
      look('/prices', 'desktop'),
      look('/prices', 'mobile'),
      calls('Delegate', { scope: ['site.json', 'prices.json'], note: 'On it.', role: BUILDER_ROLE, goal: 'Rewrite the prices heading.' }),
      calls('set_stage', { stage: 'ready_to_publish', state: 'in_progress' }),
      look('/prices', 'mobile'),
      calls('set_stage', { stage: 'ready_to_publish', state: 'in_progress' }),
      says('Ready when you are.'),
    ]
    const builder: ModelStep[] = [
      calls('set_l1', { page: 'prices', path: '0.0', node: { kind: 'text', text: 'Colour prices', axes: { fontSizePx: 40 } } }),
      calls('ReportResult', { summary: 'Rewrote the heading.', changed: ['prices'] }),
      says('Reported.'),
    ]
    const client = scriptedClient([
      (req) => {
        const [script, index] = req.model === WORKER_MODEL ? [builder, atWorker++] : [caller, atCaller++]
        return script[Math.min(index, script.length - 1)](req)
      },
    ])
    await prompt(scope, slug, client, { launch: browser.launch })

    const consultant = client.seen.filter((req) => req.model !== WORKER_MODEL)
    const stages = toolResults(consultant).filter((r) => r.name === 'set_stage').map((r) => text(r.content))
    expect(stages).toHaveLength(2)
    // Refused after the builder wrote prices, naming that page and the width not
    // seen since — and not home, which has not changed. The host's own look at
    // the builder's work was at desktop width, so that one already counts.
    expect(stages[0]).toContain('NOT_LOOKED')
    expect(stages[0]).toContain('prices (phone)')
    expect(stages[0]).not.toMatch(/\bhome \(/)
    // After a fresh look at the width still owed, it goes through.
    expect(stages[1]).not.toContain('NOT_LOOKED')
    expect(stages[1]).toContain('ready_to_publish')
  }, 60000)

  it('test_UAT_FC_REQ-415_near_publishing_the_plan_entry_names_the_pages_not_looked_at', async () => {
    configureDelegation(ENABLED)
    const { scope, slug } = await business('req415-entry')
    const browser = fakeBrowser({ png: await png() })
    let atCaller = 0
    let atWorker = 0
    const caller: ModelStep[] = [
      calls('set_stage', { stage: 'finishing_touches', state: 'in_progress' }),
      calls('Delegate', { scope: ['site.json', 'prices.json'], note: 'On it.', role: BUILDER_ROLE, goal: 'Rewrite the prices heading.' }),
      says('Done.'),
    ]
    const builder: ModelStep[] = [
      calls('set_l1', { page: 'prices', path: '0.0', node: { kind: 'text', text: 'Colour prices', axes: { fontSizePx: 40 } } }),
      calls('ReportResult', { summary: 'Rewrote the heading.', changed: ['prices'] }),
      says('Reported.'),
    ]
    const first = scriptedClient([
      (req) => {
        const [script, index] = req.model === WORKER_MODEL ? [builder, atWorker++] : [caller, atCaller++]
        return script[Math.min(index, script.length - 1)](req)
      },
    ])
    await prompt(scope, slug, first, { launch: browser.launch })

    // The next message's plan entry: home never looked at, prices looked at by
    // the host only at desktop width since the builder changed it.
    const second = scriptedClient([says('Noted.')])
    await prompt(scope, slug, second, { launch: browser.launch })
    const entry = second.seen[0].messages.map((m) => text(m.content)).join('\n') + systemText(second.seen[0])
    expect(entry).toContain('Not looked at since they changed: home (desktop, phone); prices (phone).')
  }, 60000)

  it('test_UAT_FC_REQ-415_the_page_map_carries_the_layout_findings', async () => {
    const { scope, slug } = await business('req415-map')
    const browser = await browserFindingAFault()
    const client = scriptedClient([calls('describe_page', { page: 'prices' }), says('Seen.')])
    await prompt(scope, slug, client, { launch: browser.launch })
    const map = toolResults(client.seen).find((r) => r.name === 'describe_page')
    expect(text(map!.content)).toContain('"warnings"')
    expect(text(map!.content)).toContain(`prices, phone (375px): section 0.0 ${PHONE_FINDING}`)
  }, 60000)
})
