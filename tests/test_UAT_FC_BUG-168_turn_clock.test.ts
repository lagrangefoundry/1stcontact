import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
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
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import turnClockDocument from '../tools/generate/src/cli/ai/turn-clock.json'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import {
  calls,
  says,
  scriptedClient,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'

/**
 * BUG-168 — **a delegating turn is given the clock a delegation needs, and a
 * turn that still runs out says what it did**.
 *
 * THROUGH THE REAL HOST, the same way every chat-host suite does it:
 * `openSession` / `streamPrompt`, the real manager, the real tool loop, the real
 * delegation surface with a real worker session, and the real `ClaudeAPIBackend`.
 * Only two things are faked. The Anthropic client is faked because it is the
 * network. The wall clock is faked because the defect is a wall-clock limit, and
 * a suite that waited 30 real minutes to observe one would never be run.
 * `Date.now` advances only when the CALLER is asked for a reply, so the clock
 * stands for "time spent in this turn" and nothing else.
 */

let cwd: string
let ai: Record<string, unknown>
let now = 0

const SLUG = 'bug168'
const WORKER_MODEL = backendsDocument.claude_builder.model
const WORKER_SUMMARY = 'Built the About page with three sections.'

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

/**
 * A client that answers the caller from `caller` and the worker from `worker`.
 * Each caller request moves the fake clock on by `perCall` seconds.
 */
function clocked(perCall: number, caller: ModelStep[], worker: ModelStep[] = []): ScriptedClient {
  let atCaller = 0
  let atWorker = 0
  return scriptedClient([
    (req) => {
      if (req.model === WORKER_MODEL) return worker[Math.min(atWorker++, worker.length - 1)](req)
      const step = caller[Math.min(atCaller++, caller.length - 1)]
      now += perCall * 1000
      return step(req)
    },
  ])
}

/**
 * ONE HOST PER CASE. The junction and archive are in memory, so a second
 * `deps()` would be a second, empty conversation store, and a reload would find
 * nothing.
 */
/** One turn, drained: the prose the client saw and the terminal meta. */
async function turn(
  host: HostDeps,
  sessionId: string,
  text: string,
): Promise<{ prose: string; done: Record<string, unknown> | undefined }> {
  let prose = ''
  let done: Record<string, unknown> | undefined
  for await (const event of streamPrompt(sessionId, text, { cwd }, host)) {
    if (event.kind === 'text') prose += event.content
    if (event.kind === 'done') done = event.meta
  }
  return { prose, done }
}

beforeAll(async () => {
  ai = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Record<string, unknown>
  cwd = mkdtempSync(path.join(tmpdir(), 'bug168-'))
  cmdNew(SLUG, { cwd })
}, 180000)

afterAll(() => {
  rmSync(cwd, { recursive: true, force: true })
})

afterEach(() => {
  vi.restoreAllMocks()
  setModelClient(null)
  resetAiHost()
})

function startClock(): void {
  now = Date.UTC(2026, 8, 29, 3, 37, 20)
  vi.spyOn(Date, 'now').mockImplementation(() => now)
}

describe('BUG-168 — the turn clock', () => {
  it('test_UAT_FC_BUG-168_a_turn_runs_on_the_projects_clock_not_the_framework_default', async () => {
    // THE VALUE IS THIS PROJECT'S, AND IT IS STATED WITH ITS REASON. A number
    // with no reason is the "default nobody set" this ticket was filed about,
    // just moved into a file.
    expect(turnClockDocument.turn_timeout_seconds).toBe(1800)
    const reason = turnClockDocument.about.join(' ')
    expect(reason).toContain('600')
    expect(reason).toContain('CPU')

    // AND IT IS THE NUMBER IN FORCE. Three model calls, 700 s apart: at the
    // framework's 600 s the round would stop before its second call. On this
    // project's clock the turn finishes and answers.
    startClock()
    setModelClient(
      clocked(700, [calls('list_pages', {}), calls('list_pages', {}), says('All three pages look right.')]),
    )
    const host = deps()
    const { sessionId } = await openSession(SLUG, { cwd }, host)
    const { prose, done } = await turn(host, sessionId, 'Check the pages.')

    expect(prose).toContain('All three pages look right.')
    expect(done?.exhausted).toBeUndefined()
    // An ordinary turn gets no notice.
    expect(prose).not.toContain('before I could finish it')
  })

  it('test_UAT_FC_BUG-168_a_turn_out_of_time_says_what_it_did_and_the_next_turn_reads_it', async () => {
    // THE OBSERVED SHAPE: the consultant delegates, keeps working, and the
    // clock runs out between two of its calls.
    startClock()
    const client = clocked(
      1000,
      [
        calls('Delegate', {
          role: BUILDER_ROLE,
          goal: 'Lay out the About page as three sections: intro, team, contact.',
          accept: [],
        }),
        calls('list_pages', {}),
        says('This line is never reached.'),
      ],
      [calls('ReportResult', { summary: WORKER_SUMMARY, changed: ['about'] }), says('Reported.')],
    )
    setModelClient(client)
    const host = deps()
    const { sessionId } = await openSession(SLUG, { cwd }, host)
    const { prose, done } = await turn(host, sessionId, 'Build the About page.')

    // Reaching the clock is still an outcome and not an error ...
    expect(done?.exhausted).toBe(true)
    expect(done?.exhausted_by).toBe('time')
    expect(done?.status).not.toBe('error')
    expect(prose).not.toContain('This line is never reached.')
    // ... and now the reply says so, names the limit, and says what the turn
    // did. The worker's report is the part nothing else would have relayed.
    expect(prose).toContain('30-minute time limit')
    expect(prose).toContain('What I did is saved')
    // STILL FENCED. The Toolbox marked the delegation result as third-party
    // data, and recording it as the assistant's prose must not remove that
    // mark before the next turn reads it.
    expect(prose).toContain(`<<<untrusted>>> ${WORKER_SUMMARY} <<</untrusted>>>`)
    expect(prose).toContain('also ran list_pages')

    // RECORDED AS THE ASSISTANT'S OWN WORDS, so it survives a reload ...
    const reopened = await openSession(SLUG, { cwd }, host)
    const last = reopened.turns.at(-1) as { role: string; markdown: string }
    expect(last.role).toBe('assistant')
    expect(last.markdown).toContain(WORKER_SUMMARY)

    // ... and the next turn is sent it, so it does not have to re-read the
    // record to find out what its own previous turn did. The manager is rebuilt
    // first, as it is on every Worker request, so the history comes from the
    // recorded conversation. It does not come from a warm segment, which would
    // hold the raw tool results anyway.
    resetAiHost()
    const next = clocked(1, [says('Picking up.')])
    setModelClient(next)
    await turn(host, sessionId, 'Carry on.')
    expect(JSON.stringify(next.seen[0].messages)).toContain(WORKER_SUMMARY)
  })

  it('test_UAT_FC_BUG-168_a_turn_out_of_tool_calls_names_that_limit_instead', async () => {
    // The other budget, which asks for a different response and is named as
    // itself. No clock movement: this round only ever runs out of calls.
    startClock()
    setModelClient(clocked(0, [calls('list_pages', {})]))
    const host = deps()
    const { sessionId } = await openSession(SLUG, { cwd }, host)
    const { prose, done } = await turn(host, sessionId, 'Keep checking.')

    expect(done?.exhausted_by).toBe('calls')
    expect(prose).toContain('its limit on tool calls')
    expect(prose).not.toContain('time limit')
    expect(prose).toMatch(/also ran list_pages ×\d+/)
  })

  it('test_UAT_FC_BUG-168_the_worker_is_given_the_cpu_a_long_turn_needs', () => {
    // THE PLATFORM HALF. Wall-clock time does not bind a connected invocation.
    // CPU time does, and 30 s is the default a long, write-heavy turn can pass.
    // Declared at the top level and restated per environment, per this file's
    // own rule.
    const toml = readFileSync(path.join(__dirname, '../apps/control-app/wrangler.toml'), 'utf8')
    for (const header of ['[limits]', '[env.production.limits]', '[env.dev.limits]']) {
      const at = toml.indexOf(`\n${header}\n`)
      expect(at, header).toBeGreaterThan(-1)
      expect(toml.slice(at + header.length + 2).split('\n')[0]).toBe('cpu_ms = 300000')
    }
  })
})

