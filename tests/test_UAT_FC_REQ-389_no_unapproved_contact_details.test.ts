import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { aiOptions } from '../tools/generate/src/cli/ai/host-core'
import { fsSiteStore } from '../tools/generate/src/store'
import {
  APPROVAL_OPTIONS,
  clientAnswer,
  planInstanceConfig,
  planSurfaceFor,
  seedPlan,
  type Plan,
  type PlanDeps,
} from '../tools/generate/src/cli/ai/plan-core'

/**
 * [[REQ-389]] — **no contact detail goes public without the client's yes.**
 *
 * The consultant put `office@…` from the client's letterhead into the published
 * contact section without asking. The host now refuses a site write that would
 * introduce an email address the plan does not record as approved, and the plan
 * records approval two ways: the consultant on the client's explicit say-so
 * (`approve_detail`, with the client's words), or the client answering yes to an
 * approval ask on their panel.
 *
 * WHAT IS REAL HERE. The Toolbox, the L1 and plan surfaces, `edit.ts`'s write
 * path, and `aiOptions` — the host's own binding of the plan to an AI write —
 * driven through `box.run`, the call a model's tool use becomes. ONE double: the
 * host's plan storage port, in memory, for REQ-364's reason.
 */

const SLUG = 'plumbing'
const EMAIL = 'office@charliesplumbing.example'
let cwd: string

const homePath = (): string => path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json')
const draftBytes = (): string => readFileSync(homePath(), 'utf8')

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req389-'))
  cmdNew(SLUG, { cwd })
  const home = JSON.parse(draftBytes())
  home.l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'container', layout: 'stack', children: [{ kind: 'text', text: 'Get in touch.' }] }],
  }
  home.modules = []
  writeFileSync(homePath(), JSON.stringify(home, null, 2))
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

function memoryPlan(): PlanDeps & { client: (input: Parameters<typeof clientAnswer>[1]) => void } {
  let plan: Plan | null = null
  const open = (): Plan => {
    plan ??= seedPlan(SLUG)
    return JSON.parse(JSON.stringify(plan)) as Plan
  }
  return {
    client: (input) => {
      plan = clientAnswer(open(), input, '2026-10-04T12:00:00.000Z')
    },
    now: () => '2026-10-04T11:00:00.000Z',
    async read() {
      return open()
    },
    async write(change) {
      plan = change(open())
      return plan
    },
  }
}

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
}

/** The consultant's toolbox, its writes held to the plan exactly as the host holds them. */
async function consultant(plan: PlanDeps): Promise<Box> {
  const lib = await aiCore()
  const opts = aiOptions({ cwd }, { plan: () => plan }, SLUG)
  const store = fsSiteStore(ctxOf(opts))
  return createL1Toolbox(SLUG, opts, {
    session: `site-${SLUG}`,
    lib,
    store,
    extraOps: nodeOperations(SLUG, { ...opts, store } as never),
    extraSurfaces: [
      { surface: await planSurfaceFor(lib, plan, 'consultant'), granted: planInstanceConfig('consultant') },
    ] as never,
  }) as Promise<Box>
}

/** The contact line, as a sentence and as a tap-to-write link. */
const contactLine = (box: Box, email = EMAIL): Promise<string> =>
  box.run('set_l1', {
    page: 'home',
    path: '0.0.0',
    node: { kind: 'text', text: `Email us at ${email}`, link: { href: `mailto:${email}` } },
  })

describe('REQ-389 — an email address goes on the site only once the client has approved it', () => {
  it('test_UAT_FC_REQ-389_an_unapproved_email_is_refused_and_written_once_the_consultant_records_the_clients_yes', async () => {
    const plan = memoryPlan()
    const box = await consultant(plan)
    const before = draftBytes()

    // REFUSED, NAMING THE RULE: the address, that the client has not approved it,
    // and that the client is to be asked first. Nothing was written.
    const refused = await contactLine(box)
    expect(refused).toContain('NOT_APPROVED')
    expect(refused).toContain(EMAIL)
    expect(refused).toMatch(/not approved/i)
    expect(refused).toMatch(/ask the client/i)
    expect(draftBytes()).toBe(before)

    // AN APPROVAL NEEDS THE CLIENT'S WORDS — the consultant's say-so alone is not one.
    expect(await box.run('approve_detail', { detail: EMAIL, quote: '' })).toMatch(/PLAN_INVALID|SCHEMA_INVALID/)

    // THE CLIENT SAYS YES, the consultant records it, and the same write lands.
    const approved = await box.run('approve_detail', { detail: EMAIL.toUpperCase(), quote: 'Yes, put the office email up.' })
    expect(approved).not.toMatch(/PLAN_INVALID|NOT_APPROVED/)
    expect(await contactLine(box)).not.toContain('NOT_APPROVED')
    expect(draftBytes()).toContain(`mailto:${EMAIL}`)

    // APPROVAL IS PER DETAIL: a different address is still refused.
    expect(await contactLine(box, 'charlie@home.example')).toContain('NOT_APPROVED')
  })

  it('test_UAT_FC_REQ-389_the_clients_yes_to_an_approval_ask_approves_the_detail', async () => {
    const plan = memoryPlan()
    const box = await consultant(plan)

    // AN APPROVAL ASK IS A YES OR NO whose answers the host words.
    const asked = await box.run('set_ask', {
      ask: 'show_email',
      prompt: `May we show ${EMAIL} on your site? It would be public.`,
      why: 'Customers could email you, but so could spammers.',
      approves: EMAIL,
    })
    expect(asked).toContain(APPROVAL_OPTIONS[0])
    expect(await contactLine(box)).toContain('NOT_APPROVED')

    // THE CONSULTANT FILLING IT IN IS NOT THE CLIENT'S YES.
    await box.run('fill_ask', { ask: 'show_email', answer: APPROVAL_OPTIONS[0], material: 'material-letterhead' })
    expect(await contactLine(box)).toContain('NOT_APPROVED')

    // THE CLIENT ANSWERS YES on their panel, and the write lands.
    plan.client({ ask: 'show_email', action: 'answer', answer: APPROVAL_OPTIONS[0] })
    expect(await contactLine(box)).not.toContain('NOT_APPROVED')
    expect(draftBytes()).toContain(EMAIL)
  })

  it('test_UAT_FC_REQ-389_an_address_the_site_already_shows_is_not_refused_and_a_person_editing_their_own_site_is_not_guarded', async () => {
    // INHERITED, NOT INTRODUCED: an address the site already showed before the
    // guard existed does not make every later edit of the page impossible.
    const home = JSON.parse(draftBytes())
    home.l1.root.children.push({ kind: 'text', text: `Write to ${EMAIL}` })
    writeFileSync(homePath(), JSON.stringify(home, null, 2))
    const box = await consultant(memoryPlan())
    expect(await contactLine(box)).not.toContain('NOT_APPROVED')

    // THE OWNER NEEDS NOBODY'S APPROVAL: a write without the AI's options is unguarded.
    const lib = await aiCore()
    const own = (await createL1Toolbox(SLUG, { cwd }, { session: `site-${SLUG}`, lib, store: fsSiteStore(ctxOf({ cwd })) })) as Box
    const written = await contactLine(own, 'charlie@home.example')
    expect(written).not.toMatch(/NOT_APPROVED|SCHEMA_INVALID|NOT_FOUND/)
    expect(draftBytes()).toContain('charlie@home.example')
  })
})
