import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { fsSiteStore } from '../tools/generate/src/store'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import {
  openSession,
  resetAiHost,
  setModelClient,
  streamPrompt,
  type HostDeps,
} from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument, projectBackendBudgets } from '../tools/generate/src/cli/ai/backends'
import turnClockDocument from '../tools/generate/src/cli/ai/turn-clock.json'
import { BUILDER_ROLE, continuationCue, spendCeilingNotice } from '../tools/generate/src/cli/ai/roles'
import {
  calls,
  metered,
  says,
  scriptedClient,
  turnTailText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'

/**
 * REQ-409 — **give the client an outcome, not a half-finished reply that asks
 * permission to go on.**
 *
 * THROUGH THE REAL HOST, as every chat-host suite is: `openSession` /
 * `streamPrompt`, the real manager and tool loop, the real delegation surface with
 * real builder sessions, the real `ClaudeAPIBackend` and its real budgets. Only the
 * Anthropic client is scripted, because it is the network. It answers the
 * consultant and the builder apart by the model each request is addressed to.
 */

let cwd: string
let ai: Record<string, unknown>

const WORKER_MODEL = backendsDocument.claude_builder.model
const CALLS = backendsDocument.claude.max_iterations
const CUE = continuationCue()

function deps(): HostDeps {
  const lib = ai as { NullArchive: new () => unknown; memoryJunctions: () => unknown }
  return {
    lib: ai as HostDeps['lib'],
    store: fsSiteStore(ctxOf({ cwd })),
    archive: new lib.NullArchive(),
    junctions: lib.memoryJunctions(),
    audit: null,
    apiKey: 'test-key-not-a-real-one',
  }
}

/** One double, two sides: `caller(n)` answers the consultant's nth request, `builder` the builder's. */
function twoSided(caller: (n: number) => ModelStep, builder: (req: ModelRequest) => ModelStep): ScriptedClient {
  let atCaller = 0
  return scriptedClient([(req) => (req.model === WORKER_MODEL ? builder(req) : caller(atCaller++))(req)])
}

/** One client message, drained: what the client saw. */
async function message(host: HostDeps, sessionId: string, text: string) {
  let prose = ''
  const done: Record<string, unknown>[] = []
  for await (const event of streamPrompt(sessionId, text, { cwd }, host)) {
    if (event.kind === 'text') prose += event.content
    if (event.kind === 'done') done.push(event.meta ?? {})
  }
  return { prose, done }
}

/** The consultant's requests that open a continuation. */
function continuations(client: ScriptedClient): ModelRequest[] {
  return client.seen.filter((req) => req.model !== WORKER_MODEL && turnTailText(req).startsWith(CUE))
}

/** Every `tool_result` text the request carries, oldest first. */
function toolResults(req: ModelRequest): string[] {
  const out: string[] = []
  for (const m of req.messages) {
    if (!Array.isArray(m.content)) continue
    for (const block of m.content as { type?: string; content?: unknown }[]) {
      if (block?.type !== 'tool_result') continue
      out.push(typeof block.content === 'string' ? block.content : JSON.stringify(block.content))
    }
  }
  return out
}

/** A delegation result, out of its untrusted envelope. */
function parsed(text: string): Record<string, unknown> {
  const body = text.replace(/^[\s\S]*?\{/, '{').replace(/\}[^}]*$/, '}')
  return JSON.parse(body) as Record<string, unknown>
}

const DELEGATE = (goal: string) =>
  calls('Delegate', {
    scope: ['site.json', 'home.json'],
    note: 'Working on it now.',
    role: BUILDER_ROLE,
    goal,
    accept: [],
  })

beforeAll(async () => {
  ai = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Record<string, unknown>
  cwd = mkdtempSync(path.join(tmpdir(), 'req409-'))
}, 180000)

afterAll(() => {
  rmSync(cwd, { recursive: true, force: true })
})

afterEach(() => {
  vi.restoreAllMocks()
  setModelClient(null)
  resetAiHost()
})

let sites = 0
async function freshSession(host: HostDeps): Promise<string> {
  const slug = `req409-${++sites}`
  cmdNew(slug, { cwd })
  return (await openSession(slug, { cwd }, host)).sessionId
}

describe('REQ-409 — an outcome, not a question', () => {
  it('test_UAT_FC_REQ-409_the_budgets_are_raised_and_both_backends_are_built_with_them', async () => {
    expect(backendsDocument.claude.max_iterations).toBe(200)
    expect(backendsDocument.claude_builder.max_iterations).toBe(200)
    expect(backendsDocument.claude_builder.turn_timeout).toBe(1200)
    expect(backendsDocument.claude_builder.model).toBe('claude-haiku-4-5')
    expect(turnClockDocument.turn_timeout_seconds).toBe(3600)
    expect(turnClockDocument.max_continuations).toBe(2)
    expect(turnClockDocument.max_builder_replacements).toBe(2)
    expect(turnClockDocument.spend_ceiling_usd).toBe(10)
    // AND THEY ARE THE SETTINGS IN FORCE once the host has started.
    setModelClient(scriptedClient([says('Hello.')]))
    const host = deps()
    await freshSession(host)
    const lib = ai as Parameters<typeof projectBackendBudgets>[0]
    expect(projectBackendBudgets(lib, 'claude')).toEqual({ calls: 200 })
    expect(projectBackendBudgets(lib, 'claude_builder')).toEqual({ calls: 200, seconds: 1200 })
  })

  it('test_UAT_FC_REQ-409_a_turn_out_of_tool_calls_is_continued_by_the_host_and_finishes', async () => {
    // The first turn spends every call on its own checks; the host continues it,
    // and the continuation finishes.
    const client = twoSided(
      (n) => (n < CALLS ? calls('list_pages', {}) : says('Done: the headline is in and every page checks out.')),
      () => says(''),
    )
    setModelClient(client)
    const host = deps()
    const sessionId = await freshSession(host)
    const { prose, done } = await message(host, sessionId, 'Build my first draft.')

    // ONE CONTINUATION, STARTED BY THE HOST, with no client message.
    expect(continuations(client)).toHaveLength(1)
    // The client reads that the work goes on, never a question.
    expect(prose).toContain('Still working on it')
    expect(prose).not.toContain('Ask me to carry on')
    expect(prose).not.toContain('Send me any message')
    expect(prose).toContain('Done: the headline is in')
    // One reply on the client's stream, ending once, not exhausted.
    expect(done).toHaveLength(1)
    expect(done[0].exhausted).toBeUndefined()

    // THE CUE IS THE HOST'S, NOT THE CLIENT'S, and is not shown as theirs.
    const reopened = await openSession(`req409-${sites}`, { cwd }, host)
    const users = reopened.turns.filter((t) => t.role === 'user')
    expect(users.map((t) => t.markdown)).toEqual(['Build my first draft.'])
  }, 120000)

  it('test_UAT_FC_REQ-409_a_third_continuation_never_starts', async () => {
    const client = twoSided(() => calls('list_pages', {}), () => says(''))
    setModelClient(client)
    const host = deps()
    const sessionId = await freshSession(host)
    const { prose, done } = await message(host, sessionId, 'Keep checking.')

    expect(continuations(client)).toHaveLength(turnClockDocument.max_continuations)
    const consultant = client.seen.filter((req) => req.model !== WORKER_MODEL)
    expect(consultant).toHaveLength(CALLS * (turnClockDocument.max_continuations + 1))
    expect(prose.split('Still working on it').length - 1).toBe(2)
    // Only after the last one does the reply say it stopped, and it asks nothing.
    expect(prose).toContain('That is as far as I can take this in one go.')
    expect(done).toHaveLength(1)
    expect(done[0].exhausted_by).toBe('calls')
  }, 180000)

  it('test_UAT_FC_REQ-409_a_builder_out_of_context_is_replaced_by_a_fresh_one_briefed_from_the_host_record', async () => {
    const GOAL = 'Lay out the About page as three sections.'
    const SUMMARY = 'Laid out the three sections.'
    const briefs: string[] = []
    const client = twoSided(
      (n) => (n === 0 ? DELEGATE(GOAL) : says('The About page is built.')),
      (req) => {
        const first = req.messages.length === 1
        if (first) briefs.push(JSON.stringify(req.messages[0].content))
        // The first builder fills its window on its first call; the fresh one reports.
        if (briefs.length === 1) return metered({ input_tokens: 200_000 }, calls('list_pages', {}))
        return first ? calls('ReportResult', { summary: SUMMARY, changed: ['about'] }) : says('Reported.')
      },
    )
    setModelClient(client)
    const host = deps()
    const sessionId = await freshSession(host)
    await message(host, sessionId, 'Build the About page.')

    // A FRESH BUILDER, a new session, briefed with the host's record and the original brief.
    expect(briefs).toHaveLength(2)
    expect(briefs[1]).toContain(GOAL)
    expect(briefs[1]).toContain('A builder before you started this brief and stopped before finishing: its context filled up.')
    expect(briefs[1]).toContain("The host's record shows it wrote nothing to the draft.")

    // THE CONSULTANT GETS ONE RESULT, covering both runs.
    const consultant = client.seen.filter((req) => req.model !== WORKER_MODEL)
    const results = toolResults(consultant[consultant.length - 1])
    expect(results).toHaveLength(1)
    const result = parsed(results[0])
    expect(result.outcome).toBe('reported')
    expect(result.summary).toBe(SUMMARY)
    expect(result.replaced).toBe(1)
    expect(result.sessions as string[]).toHaveLength(2)
    expect(result).not.toHaveProperty('ended')
  }, 120000)

  it('test_UAT_FC_REQ-409_the_spend_ceiling_ends_the_work_cleanly_counting_the_builders_spend', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // One builder spends more than the ceiling on its own: $5 per million output
    // tokens, so 2.1M is $10.50.
    let builders = 0
    const client = twoSided(
      (n) =>
        n === 0
          ? DELEGATE('Lay out the About page.')
          : n === 1
            ? DELEGATE('Now the gallery.')
            : n < 5
              ? calls('list_pages', {})
              : says('The About page is done. The gallery is still to do.'),
      (req) => {
        if (req.messages.length === 1) builders++
        return req.messages.length === 1
          ? metered({ output_tokens: 2_100_000 }, calls('ReportResult', { summary: 'Laid out.', changed: ['about'] }))
          : says('Reported.')
      },
    )
    setModelClient(client)
    const host = deps()
    const sessionId = await freshSession(host)
    const { prose, done } = await message(host, sessionId, 'Build the About page and the gallery.')

    // NO NEW BUILDER once the ceiling is crossed: the second delegation was refused.
    expect(builders).toBe(1)
    const consultant = client.seen.filter((req) => req.model !== WORKER_MODEL)
    const second = toolResults(consultant[2])
    expect(second[second.length - 1]).toContain('spend_ceiling')
    // THE CONSULTANT IS TOLD TO FINISH on every request after the crossing ...
    for (const req of consultant.slice(1)) expect(JSON.stringify(req)).toContain(spendCeilingNotice())
    expect(JSON.stringify(consultant[0])).not.toContain(spendCeilingNotice())
    // ... and finishes, cleanly, saying what is left — and the client never hears of cost.
    expect(prose).toContain('The gallery is still to do.')
    expect(prose).not.toMatch(/\$|spend|cost/i)
    expect(done).toHaveLength(1)
    // THE OPERATOR DOES.
    expect(warn.mock.calls.some((c) => String(c[0]).includes('spend ceiling reached'))).toBe(true)
  }, 120000)
})
