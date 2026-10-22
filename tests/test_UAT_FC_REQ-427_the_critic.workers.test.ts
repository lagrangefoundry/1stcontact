import { afterEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { PLAN_PATH, resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { sitePlan } from '../apps/control-app/src/plan'
import { encodePng } from '../tools/generate/src/cli/png'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { fakeBrowser } from './support/fake-puppeteer'
import { calls, says, scriptedClient, systemText, type ModelRequest, type ModelStep } from './support/scripted-model-client'

/**
 * [[REQ-427]] — the critic: an independent review of the work, due at the end of
 * each big build and before publishing, holding the consultant's hand-back until
 * every finding has an answer.
 *
 * WHAT MAKES THIS EVIDENCE. The real route inside workerd — `POST /api/ai/prompt`,
 * the real session manager (which opens the critic's own session), the real
 * delegation surface, the real plan in the business's ticket store, a real D1 and
 * R2 — with two doubles at the network's edge: the Anthropic client and the
 * browser. The critic is told apart from the consultant by its priming, because
 * both run on the same model; what it was handed is read off the request its
 * model was actually sent.
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'
const ENABLED = { ...delegationDocument, enabled: true }
const WORKER_MODEL = backendsDocument.claude_builder.model
const CLIENT_SAID = 'Please sort out the prices page.'
const CONSULTANT_BRIEF = 'Rewrite the prices heading as a plain list.'
const CONSULTANT_SAID = 'The prices page is done.'
const HELD = 'the review of the site still owed'

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
  // A SITE WITH NOTHING STRUCTURALLY WRONG ([[REQ-422]]): no placeholder heading,
  // and each page linked to the other, so the only thing owed is the review.
  const page = (id: string, title: string, href: string): Record<string, unknown> => {
    const starter = starterHomePage(seed.slug) as { l1: { root: Record<string, unknown> } } & Record<string, unknown>
    const root = {
      ...starter.l1.root,
      children: [
        { kind: 'text', id: 'title', text: title },
        { kind: 'text', id: 'next', text: 'More', link: { href } },
      ],
    }
    return { ...starter, id, slug: id, title, l1: { ...starter.l1, root } }
  }
  const pages = { 'home.json': page('home', 'Colour by Ana', '/prices'), 'prices.json': page('prices', 'Prices', '/') }
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
      body: JSON.stringify({ sessionId, text: CLIENT_SAID }),
    }),
    routerEnv(),
    scope,
    deps,
  )
  await streamed.text()
}

const isCritic = (req: ModelRequest): boolean => systemText(req).includes('You review a small business')

/** The critic's reply: its report, in the fence its priming asks for. */
const report = (findings: Record<string, unknown>[], verdict = 'Mostly there.'): ModelStep =>
  says('```json\n' + JSON.stringify({ verdict, findings }) + '\n```')

const HEADLINE_FINDING = {
  lens: 'messaging',
  severity: 'medium',
  page: 'home',
  width: 'phone',
  seen: 'The headline is an adage any trade could use.',
  fix: 'Say what the business is known for.',
}

/** Route each request to the consultant's, the critic's or the builder's script. */
function routed(consultant: ModelStep[], critic: ModelStep[], builder: ModelStep[] = []): ReturnType<typeof scriptedClient> {
  const at = { consultant: 0, critic: 0, builder: 0 }
  return scriptedClient([
    (req) => {
      const [script, who] = req.model === WORKER_MODEL ? [builder, 'builder' as const] : isCritic(req) ? [critic, 'critic' as const] : [consultant, 'consultant' as const]
      return script[Math.min(at[who]++, script.length - 1)](req)
    },
  ])
}

const textOf = (content: unknown): string =>
  typeof content === 'string'
    ? content
    : (content as { type: string; text?: string; content?: unknown }[])
        .map((b) => (b.type === 'text' ? b.text : b.type === 'tool_result' ? textOf(b.content) : ''))
        .join('\n')

/** The last tool result in a request: what the tool answered, and nothing the model asked. */
const lastToolResult = (req: ModelRequest): string => {
  for (const message of [...req.messages].reverse()) {
    if (!Array.isArray(message.content)) continue
    const result = (message.content as { type: string; content?: unknown }[]).filter((b) => b.type === 'tool_result').at(-1)
    if (result) return textOf(result.content)
  }
  return ''
}

async function storedPlan(scope: Scope, slug: string): Promise<Record<string, any>> {
  return (await sitePlan(await ticketStoreFor(routerEnv(), scope), slug).read())!.fields as Record<string, any>
}

describe('REQ-427 the critic', () => {
  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_REQ-427_a_first_draft_holds_the_hand_back_until_it_is_reviewed_and_every_finding_answered', async () => {
    configureDelegation(ENABLED)
    const { scope, slug } = await business('req427-draft')
    const browser = fakeBrowser({ png: await png() })
    const client = routed(
      [
        calls('Delegate', { scope: ['site.json', 'prices.json'], note: 'On it.', role: BUILDER_ROLE, goal: CONSULTANT_BRIEF }),
        says(CONSULTANT_SAID),
        calls('critique', {}),
        calls('answer_finding', { finding: 'C1.1', answer: 'decision', decision: 'headline_sells', title: 'What the headline says they are known for' }),
        says('Here is your first draft.'),
      ],
      [report([HEADLINE_FINDING])],
      [
        calls('set_l1', { page: 'prices', path: '0.0', node: { kind: 'text', text: 'Colour prices', axes: { fontSizePx: 40 } } }),
        calls('ReportResult', { summary: 'Rewrote the heading.', changed: ['prices'] }),
      ],
    )
    await prompt(scope, slug, client, { launch: browser.launch })

    const consultant = client.seen.filter((req) => req.model !== WORKER_MODEL && !isCritic(req))
    // THE FIRST DRAFT FINISHING MADE A REVIEW DUE, and the reply that ended there
    // was carried on by the host with the review owed in front of the consultant.
    const held = consultant.findIndex((req) => req.messages.some((m) => textOf(m.content).includes(HELD)))
    expect(held, 'the hand-back was held').toBeGreaterThan(0)
    expect(consultant[held].messages.map((m) => textOf(m.content)).join('\n')).toContain('A review of the site is due (the first draft is built)')

    // The critic's report came back as the critique tool's result.
    const critiqued = lastToolResult(consultant[held + 1])
    expect(critiqued).toContain('C1.1')
    expect(critiqued).toContain('The headline is an adage any trade could use.')

    // ANSWERED, THE HOLD LIFTS: the reply after the answer is the last request,
    // and no further continuation was started.
    expect(consultant).toHaveLength(held + 3)
    expect(lastToolResult(consultant.at(-1)!)).toMatch(/"still_owed": 0/)

    // THE ANSWER IS RECORDED AGAINST THE FINDING, and `decision` opened one on the plan.
    const plan = await storedPlan(scope, slug)
    const run = plan.critique.runs[0]
    expect(run.trigger).toBe('first_pass_complete')
    expect(run.findings[0]).toMatchObject({ id: 'C1.1', lens: 'messaging', severity: 'medium', page: 'home', width: 'phone' })
    expect(run.findings[0].answer).toMatchObject({ kind: 'decision', decision: 'headline_sells' })
    expect(plan.critique.due).toBeUndefined()
    expect(plan.decisions.find((d: { id: string }) => d.id === 'headline_sells')).toMatchObject({ state: 'open', area: 'messaging' })

    // NOTHING CALLED A CRITIC REACHES THE CLIENT: not their panel, and not the
    // conversation they reopen — the host's cue that carried the reply on is kept off it.
    const panel = await route(new Request(`${ORIGIN}${PLAN_PATH}?site=${encodeURIComponent(slug)}`), routerEnv(), scope, {})
    expect(JSON.stringify(await panel.json())).not.toMatch(/critiq|critic/i)
    const reopened = await route(
      new Request(`${ORIGIN}/api/ai/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ site: slug }) }),
      routerEnv(),
      scope,
      { launch: browser.launch },
    )
    const shown = JSON.stringify(((await reopened.json()) as { turns?: unknown[] }).turns ?? [])
    expect(shown).toContain(CLIENT_SAID)
    expect(shown).not.toContain(HELD)
    expect(shown).not.toMatch(/critique|answer_finding/)
  }, 60000)

  it('test_UAT_FC_REQ-427_the_critic_is_handed_the_brief_and_pictures_at_three_widths_as_images_never_the_conversation', async () => {
    configureDelegation(ENABLED)
    const { scope, slug } = await business('req427-handed')
    const browser = fakeBrowser({ png: await png() })
    const client = routed(
      [
        calls('Delegate', { scope: ['site.json', 'prices.json'], note: 'On it.', role: BUILDER_ROLE, goal: CONSULTANT_BRIEF }),
        calls('critique', { focus: 'prices' }),
        calls('answer_finding', { finding: 'C1.1', answer: 'dismissed', note: 'The client chose that line.' }),
        says(CONSULTANT_SAID),
      ],
      [report([HEADLINE_FINDING])],
      [
        calls('set_l1', { page: 'prices', path: '0.0', node: { kind: 'text', text: 'Colour prices', axes: { fontSizePx: 40 } } }),
        calls('ReportResult', { summary: 'Rewrote the heading.', changed: ['prices'] }),
      ],
    )
    await prompt(scope, slug, client, { launch: browser.launch })

    const critic = client.seen.filter(isCritic)
    expect(critic).toHaveLength(1)
    // ONE TURN, ITS OWN: the critic's request carries its first message and nothing else.
    expect(critic[0].messages).toHaveLength(1)
    expect(critic[0].tools ?? []).toHaveLength(0)
    const blocks = critic[0].messages[0].content as { type: string; text?: string }[]
    // THE PICTURES ARRIVE AS IMAGES — at desktop, tablet and phone, for each page pictured.
    expect(Array.isArray(blocks)).toBe(true)
    expect(blocks.filter((b) => b.type === 'image').length).toBeGreaterThanOrEqual(3)
    const said = blocks.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
    for (const label of ['prices at desktop (1280px):', 'prices at tablet (768px):', 'prices at phone (375px):']) {
      expect(said).toContain(label)
    }
    expect(browser.log.viewports.some((v) => v?.width === 768)).toBe(true)
    // The page it was asked to focus on is pictured first.
    expect(said.indexOf('prices at desktop')).toBeLessThan(said.indexOf('home at desktop') === -1 ? Infinity : said.indexOf('home at desktop'))
    // THE BRIEF, FROM THE PLAN — and none of the conversation that built the site.
    expect(said).toContain('# The brief')
    expect(said).toContain('# Positioning card')
    expect(said).toContain('None written.')
    expect(said).toContain('look hardest at: prices')
    for (const conversation of [CLIENT_SAID, CONSULTANT_BRIEF, 'On it.']) expect(said).not.toContain(conversation)
    // It runs on its own backend entry, not the builder's.
    expect(critic[0].model).toBe(backendsDocument.claude_critic.model)
  }, 60000)

  it('test_UAT_FC_REQ-427_an_unanswered_finding_keeps_the_hold_and_one_recheck_carries_the_previous_findings', async () => {
    configureDelegation(ENABLED)
    const { scope, slug } = await business('req427-recheck')
    const browser = fakeBrowser({ png: await png() })
    const client = routed(
      [
        calls('critique', {}),
        says('All good.'),
        calls('answer_finding', { finding: 'C1.1', answer: 'fixed', note: 'Put the phone number in the first screen.' }),
        says('All good.'),
        calls('critique', {}),
        says('Done.'),
      ],
      [
        report([{ lens: 'purpose', severity: 'high', page: 'home', width: 'phone', seen: 'No way to call in the first screen.', fix: 'Put the phone number at the top.' }]),
        report([], 'Good enough.'),
      ],
    )
    await prompt(scope, slug, client, { launch: browser.launch })

    const consultant = client.seen.filter((req) => !isCritic(req))
    const cues = consultant.map((req) => textOf(req.messages.at(-1)!.content)).filter((t) => t.includes(HELD))
    // An unanswered finding held the first hand-back, naming the finding…
    expect(cues[0]).toContain('C1.1 [high, purpose] home at phone: No way to call in the first screen.')
    // …and, fixed, the high-severity finding made ONE re-check due, which held the second.
    expect(cues[1]).toContain('A review of the site is due (a high-severity finding was fixed)')
    expect(cues).toHaveLength(2)

    // The re-check was handed its previous findings and the answers they got.
    const critic = client.seen.filter(isCritic)
    expect(critic).toHaveLength(2)
    const second = (critic[1].messages[0].content as { type: string; text?: string }[]).map((b) => b.text ?? '').join('\n')
    expect(second).toContain('# Your previous review (C1)')
    expect(second).toContain('C1.1 [high, purpose] home at phone: No way to call in the first screen.')
    expect(second).toContain('→ fixed: Put the phone number in the first screen.')

    const plan = await storedPlan(scope, slug)
    expect(plan.critique.runs.map((r: { trigger: string; of?: string }) => [r.trigger, r.of])).toEqual([
      ['asked', undefined],
      ['recheck', 'C1'],
    ])
    expect(plan.critique.due).toBeUndefined()
  }, 60000)

  it('test_UAT_FC_REQ-427_ready_to_publish_waits_for_the_review_before_publishing', async () => {
    const { scope, slug } = await business('req427-publish')
    const browser = fakeBrowser({ png: await png() })
    const look = (page: string, viewport: string) => calls('screenshot', { of: { kind: 'draft', page, viewport } })
    const client = routed(
      [
        look('/', 'desktop'),
        look('/', 'mobile'),
        look('/prices', 'desktop'),
        look('/prices', 'mobile'),
        calls('set_stage', { stage: 'ready_to_publish', state: 'in_progress' }),
        calls('critique', {}),
        calls('set_stage', { stage: 'ready_to_publish', state: 'in_progress' }),
        says('Ready when you are.'),
      ],
      [report([], 'Good enough.')],
    )
    await prompt(scope, slug, client, { launch: browser.launch })

    const consultant = client.seen.filter((req) => !isCritic(req))
    const staged = consultant.map(lastToolResult).filter((t) => t.includes('ready_to_publish') || t.includes('NOT_CRITIQUED'))
    expect(staged[0]).toContain('NOT_CRITIQUED')
    expect(staged.at(-1)).not.toContain('NOT_CRITIQUED')
    expect(staged.at(-1)).toContain('ready_to_publish')
    const plan = await storedPlan(scope, slug)
    // The refusal made the review due; the review discharged it as the pre-publishing one.
    expect(plan.critique.runs[0].trigger).toBe('before_publish')
    expect(plan.stages.find((s: { id: string }) => s.id === 'ready_to_publish').state).toBe('in_progress')
  }, 60000)
})
