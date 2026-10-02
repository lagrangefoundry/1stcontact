import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { captureDraft, draftChanges } from '../tools/generate/src/cli/ai/account-core'
import { fidelityOperations } from '../tools/generate/src/cli/ai/fidelity-core'
import {
  ledgerInstanceConfig,
  ledgerSurfaceFor,
  type LedgerDeps,
  type LedgerState,
} from '../tools/generate/src/cli/ai/ledger-core'
import {
  planInstanceConfig,
  planSurfaceFor,
  seedPlan,
  type Plan,
  type PlanDeps,
} from '../tools/generate/src/cli/ai/plan-core'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { editL1Set, editPageAdd } from '../tools/generate/src/cli/edit'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { fsSiteStore } from '../tools/generate/src/store'
import { canonicalJson } from '../tools/generate/src/store/revision-model'
import { guardedCaptureDeps } from './support/guarded-capture'
import { makeMemorySite } from './support/site-factory'

/**
 * [[REQ-361]] part B — **the three oversized results are slimmed at the source.**
 *
 * One session's consultant spent about $12 carrying old tool results forward,
 * and three result shapes did most of it: a delegation's account that copied
 * whole element trees, a capture that listed every refused `data:` URL in full,
 * and plan/ledger writes that echoed the whole document back on every call.
 *
 * WHAT IS REAL HERE. The account is derived from two real captures of a real
 * (memory-backed) site store around real edits. `capture_site` is the production
 * operation over the production egress guard, with the browser the one double
 * (BUG-127's). The plan and ledger writes go through the real Toolbox via
 * `box.run`, the call a model's tool use becomes; only the host's storage port is
 * in memory, as in REQ-356's and REQ-171's surface cases.
 */

/** A text band heavy enough that copying a tree of them would show. */
function band(text: string): Record<string, unknown> {
  return {
    kind: 'text',
    text,
    axes: { color: '#111827', fontSizePx: 32, fontWeight: 400, lineHeightPx: 40 },
  }
}

const PROSE = 'A sentence long enough to weigh something in a serialised tree. '.repeat(3)

function threeBandPage(name: string): Record<string, unknown> {
  const page = starterHomePage(name) as Record<string, unknown>
  const l1 = page.l1 as { root: { children: unknown[] } }
  l1.root.children = ['one', 'two', 'three'].map(band)
  return page
}

describe('REQ-361 — a delegation account names whole things rather than copying them', () => {
  it('test_UAT_FC_REQ-361_a_delegate_that_creates_a_page_returns_an_account_under_4kb', async () => {
    const site = makeMemorySite({ pages: { 'home.json': threeBandPage('acme') } })
    const from = await captureDraft(site.store, site.slug)
    await editPageAdd(site.slug, 'services', site.opts)
    const page = (await captureDraft(site.store, site.slug)).outline.pages.find((p) => p.name === 'services.json')
    const root = structuredClone((page?.page as { l1: { root: Record<string, unknown> } }).l1.root)
    root.children = Array.from({ length: 60 }, (_, i) => band(`${i}. ${PROSE}`))
    await editL1Set(site.slug, 'services', '0', root, site.opts)
    const to = await captureDraft(site.store, site.slug)

    const account = draftChanges(from, to)
    const tree = canonicalJson(root).length
    expect(tree).toBeGreaterThan(10_000)
    expect(canonicalJson(account).length).toBeLessThan(4096)

    // The page is its id, what happened to it, and how many elements it holds.
    const created = account.differences.find((d) => d.page === 'services')
    expect(created).toMatchObject({ page: 'services', field: '', op: 'created', elements: 61 })
    expect(created && 'after' in created).toBe(false)
    await site.dispose()
  })

  it('test_UAT_FC_REQ-361_a_restructured_box_is_named_and_a_field_keeps_its_values', async () => {
    const site = makeMemorySite({ pages: { 'home.json': threeBandPage('acme') } })
    const from = await captureDraft(site.store, site.slug)
    // Band 1 becomes a box of ten — a different kind at the same place.
    await editL1Set(
      site.slug,
      'home',
      '0.1',
      { kind: 'box', children: Array.from({ length: 10 }, (_, i) => band(`${i}. ${PROSE}`)) },
      site.opts,
    )
    // Band 2 changes one field.
    const capture = await captureDraft(site.store, site.slug)
    const root = (capture.outline.pages[0].page as { l1: { root: { children: Record<string, unknown>[] } } }).l1.root
    const third = structuredClone(root.children[2])
    ;(third.axes as Record<string, unknown>).fontSizePx = 56
    await editL1Set(site.slug, 'home', '0.2', third, site.opts)
    const to = await captureDraft(site.store, site.slug)

    const account = draftChanges(from, to)
    expect(account.differences).toEqual([
      { page: 'home', address: '0.1', field: '', op: 'replaced', kind: 'box', was: 'text', children: 10 },
      { page: 'home', address: '0.2', field: 'axes.fontSizePx', before: 32, after: 56 },
    ])
    await site.dispose()
  })
})

describe('REQ-361 — capture_site summarises what it refused', () => {
  it('test_UAT_FC_REQ-361_a_capture_full_of_data_urls_reports_a_per_reason_summary_under_2kb', async () => {
    const dataUrls = Array.from(
      { length: 41 },
      (_, i) => `data:image/png;base64,${String(i).padStart(4, '0')}${'A'.repeat(6000)}`,
    )
    const d = guardedCaptureDeps({
      subresources: [...dataUrls, 'http://169.254.169.254/beacon.gif', 'https://cdn.example.test/app.js'],
    })

    const result = (await fidelityOperations(d).capture_site({ url: 'https://heavy.test/' })) as {
      bundle: string
      refusals: {
        total: number
        reasons: Record<string, number>
        examples: { url: string; reason: string; detail: string }[]
      }
    }

    expect(result.bundle).toBeTruthy()
    const { refusals } = result
    // Every refusal is counted, under a reason that names the scheme.
    expect(Object.keys(refusals.reasons).sort()).toEqual(['private-address', 'scheme: data:'])
    expect(refusals.reasons['scheme: data:'] % 41).toBe(0)
    expect(refusals.reasons['scheme: data:']).toBeGreaterThan(0)
    expect(refusals.total).toBe(refusals.reasons['scheme: data:'] + refusals.reasons['private-address'])
    // At most five examples, one of each reason among them, none carrying a payload.
    expect(refusals.examples.length).toBeLessThanOrEqual(5)
    expect(new Set(refusals.examples.map((e) => e.reason))).toEqual(new Set(['scheme', 'private-address']))
    for (const e of refusals.examples) expect(e.url.length).toBeLessThan(200)
    expect(JSON.stringify(refusals).length).toBeLessThan(2048)
  })
})

// ── plan and ledger writes ──────────────────────────────────────────────────

const SLUG = 'studio'
let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req361-'))
  cmdNew(SLUG, { cwd })
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

function memoryPlan(): PlanDeps {
  let plan: Plan | null = null
  const open = (): Plan => {
    plan ??= seedPlan(SLUG)
    return JSON.parse(JSON.stringify(plan)) as Plan
  }
  return {
    now: () => '2026-10-02T12:00:00.000Z',
    async read() {
      return open()
    },
    async write(change) {
      plan = change(open())
      return plan
    },
  }
}

function memoryLedger(): LedgerDeps {
  let body = ''
  let note = ''
  let title = 'chat-1'
  const state = (): LedgerState => ({ entries: (body.match(/^### Decision/gm) ?? []).length, title, note })
  return {
    async append(render) {
      body += `\n\n${render(state().entries + 1)}`
      return state()
    },
    async rename(name) {
      title = name
      return state()
    },
    async setNote(text) {
      note = text
      return state()
    },
    async read() {
      return { body, title, note }
    },
  }
}

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
}

async function toolbox(surfaces: { surface: unknown; granted: Record<string, unknown> }[]): Promise<Box> {
  const lib = await aiCore()
  const opts = { cwd }
  const store = fsSiteStore(ctxOf(opts))
  return createL1Toolbox(SLUG, opts, {
    session: `site-${SLUG}`,
    lib,
    store,
    extraOps: nodeOperations(SLUG, { ...opts, store } as never),
    extraSurfaces: surfaces as never,
  }) as Promise<Box>
}

const unwrap = (answer: string): string =>
  answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')

describe('REQ-361 — a plan or ledger write confirms what it wrote', () => {
  it('test_UAT_FC_REQ-361_each_plan_write_returns_under_1kb_and_read_plan_returns_the_document', async () => {
    const lib = await aiCore()
    const alice = await toolbox([
      { surface: await planSurfaceFor(lib, memoryPlan()), granted: planInstanceConfig('consultant') },
    ])
    // A plan grown to the size the real session's was.
    for (let i = 0; i < 30; i += 1) {
      await alice.run('set_decision', {
        decision: `d${i}`,
        title: `Decision ${i}`,
        area: 'style',
        tier: 'detail',
        value: PROSE,
        state: 'proposed',
      })
    }

    const writes: [string, Record<string, unknown>][] = [
      ['update_brief', { business: 'A Bristol plumber', quote: PROSE.repeat(10) }],
      ['add_note', { text: PROSE.repeat(30) }],
      ['set_decision', { decision: 'd3', state: 'defaulted' }],
      ['set_task', { title: 'Build the services page' }],
    ]
    for (const [tool, input] of writes) {
      const answer = unwrap(await alice.run(tool, input))
      expect(answer.length, tool).toBeLessThan(1024)
    }

    // What was written is named: the decision as it now stands.
    const decision = JSON.parse(unwrap(await alice.run('set_decision', { decision: 'd4', state: 'open' })))
    expect(decision.decision).toMatchObject({ id: 'd4', state: 'open' })
    expect(decision).not.toHaveProperty('plan')
    expect(decision).not.toHaveProperty('body')

    // The document is a read away.
    const plan = JSON.parse(unwrap(await alice.run('read_plan', {})))
    expect(plan.plan.decisions.length).toBeGreaterThanOrEqual(30)
    expect(plan.body).toContain('## Notes')
    expect(JSON.stringify(plan).length).toBeGreaterThan(5000)
  })

  it('test_UAT_FC_REQ-361_a_ledger_write_returns_the_note_length_not_the_note', async () => {
    const lib = await aiCore()
    const box = await toolbox([{ surface: await ledgerSurfaceFor(lib, memoryLedger()), granted: ledgerInstanceConfig() }])
    const note = `Building a site for Charlie's Plumbing. ${PROSE.repeat(15).trim()}`

    const noted = unwrap(await box.run('set_standing_note', { note }))
    expect(noted.length).toBeLessThan(1024)
    expect(noted).not.toContain(PROSE.trim())
    expect(JSON.parse(noted)).toEqual({ entries: 0, title: 'chat-1', note_bytes: Buffer.byteLength(note) })

    const recorded = unwrap(
      await box.run('record_decision', { decision: 'Navy and brass.', because: PROSE.repeat(10) }),
    )
    expect(recorded.length).toBeLessThan(1024)
    expect(JSON.parse(recorded)).toMatchObject({ entries: 1, note_bytes: Buffer.byteLength(note) })
  })
})
