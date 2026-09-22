/**
 * REQ-261 — loop-1 rounds: parse what they hand back, resume them, and let them
 * file what they find.
 *
 * [[REQ-256]] put the AI into the console's loop. This is what the FIRST LIVE
 * ROUND taught us. It ran on `gigabytealchemy.ai`, read the evidence, named a
 * real defect in the engine's own gate, proved it from the captured files, and
 * handed back a 6,346-character gap ticket — and the console threw it away and
 * reported `the round produced no outcome block.`
 *
 * WHAT IS REAL HERE AND WHAT IS NOT, on [[REQ-256]]'s terms. The console, its
 * HTTP surface, the parse, the digest, the session record and everything served
 * are the real thing. What is substituted is what a test must not have: a
 * headless browser (`1c`), a billed model (`claude`), and the commands the
 * console asks the machine about (`git`, `xgd`) — each through the seam the
 * console already had.
 *
 * The one thing that is neither is the transcript of the round that motivated
 * this ticket. That is a FIXTURE, kept byte-for-byte, because the parse is only
 * worth anything if it recovers the answer a real round really produced.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  AI_ALLOWED_TOOLS,
  AI_DISALLOWED_TOOLS,
  AI_PERMISSION_MODE,
  AI_SETTING_SOURCES,
  claudeCommand,
  describeCost,
  formatStreamEvent,
  jsonObjectsFromEnd,
  parseOutcome,
  readCost,
  resumePreamble,
  type AiOutcome,
  type AiRunOptions,
  type AiRunner,
} from '../tools/repro-console/src/ai'
import { buildDigest, keyCensus, stringOccurrences, valueCensus } from '../tools/repro-console/src/digest'
import {
  briefFingerprint,
  readSession,
  RESUME_MAX_ROUNDS,
  resumableSession,
  type RoundSession,
} from '../tools/repro-console/src/session'
import {
  AI_DIGEST_FILE,
  AI_DIR,
  AI_OUTCOME_FILE,
  AI_PROMPT_FILE,
  AI_TRANSCRIPT_FILE,
  bugBodyFile,
  CONSOLE_WORKSPACE,
  slugForUrl,
} from '../tools/repro-console/src/console'
import type { CommandRunner } from '../tools/repro-console/src/run'
import { xgdTicketGetJson, type XgdTicketGetOptions } from './support/xgd-ticket-get'
import type { IterationStep, StepResult, StepRunner } from '../tools/repro-console/src/iteration'
import { startReproConsole, type ConsoleHandle } from '../tools/repro-console/src/server'

/** The round this whole ticket came out of, kept exactly as it was written. */
const OBSERVED_ROUND = fileURLToPath(
  new URL('./fixtures/repro-console/round-gigabytealchemy-ai-iteration-1.transcript.txt', import.meta.url),
)

const openHandles: ConsoleHandle[] = []

afterEach(async () => {
  while (openHandles.length) await openHandles.pop()!.close()
})

// ── the stand-ins ────────────────────────────────────────────────────────────

/**
 * A stand-in `1c` that writes what the real one writes.
 *
 * Richer than [[REQ-256]]'s in one place that matters here: the reference
 * bundle gets a real `multistate.json` carrying its imagery as
 * `backgroundImageUrl` and never as `src`, because that shape is exactly what
 * behavior 7's digest exists to count.
 */
function fakeSteps(verdict = 'reproduction-wrong'): StepRunner {
  return async (step: IterationStep, cwd: string): Promise<StepResult> => {
    const out = (): string => step.argv[step.argv.indexOf('--out') + 1]
    switch (step.name) {
      case 'capture': {
        if (step.argv[1] === 'list') return { code: 0, stdout: '[]', stderr: '' }
        const url = step.argv[2]
        const dir = path.join(cwd, 'storage', 'references', new URL(url).hostname, 'index')
        mkdirSync(dir, { recursive: true })
        writeFileSync(
          path.join(dir, 'capture.json'),
          JSON.stringify({
            url,
            sections: [{ index: 1, background: { kind: 'image', image: 'assets/hero.png' } }],
            assets: [{ id: 'hero', kind: 'image', src: `${url}/images/hero.png`, localPath: 'assets/hero.png' }],
          }),
        )
        writeFileSync(
          path.join(dir, 'multistate.json'),
          JSON.stringify({
            url,
            projections: [
              { width: 320, sections: [{ index: 1, backgroundImageUrl: `${url}/images/hero.png` }], elements: [{ role: 'heading' }] },
            ],
          }),
        )
        writeFileSync(path.join(dir, 'raw.html'), '<!doctype html><h1>reference</h1>')
        return { code: 0, stdout: JSON.stringify({ url, name: `${new URL(url).hostname}/index`, dir }), stderr: '' }
      }
      case 'page':
        return {
          code: 0,
          stdout: JSON.stringify({ ok: true, data: { page: { kind: 'box', children: [{ kind: 'text', text: 'hi' }] } } }),
          stderr: '',
        }
      case 'render': {
        mkdirSync(out(), { recursive: true })
        writeFileSync(path.join(out(), 'index.html'), '<!doctype html><title>reproduction</title>')
        return { code: 0, stdout: '', stderr: '' }
      }
      case 'gate': {
        const dir = out()
        mkdirSync(dir, { recursive: true })
        for (const name of ['diff.png', 'diff-blocks.png']) writeFileSync(path.join(dir, name), 'png')
        writeFileSync(
          path.join(dir, 'regions.json'),
          JSON.stringify({
            meanDiff: 0.69,
            pctOverThreshold: 0.31,
            regions: [{ id: 1, bbox: { x: 448, y: 96, w: 272, h: 64 }, score: 2194.43, meanDiff: 48.77 }],
          }),
        )
        writeFileSync(
          path.join(dir, 'values-diff.json'),
          JSON.stringify({
            matched: 59,
            unmatched: 0,
            deltas: [
              { text: 'Gigabyte Alchemy', role: 'gap', property: 'gap', expected: '142px', actual: '149px', tier: 'HIGH', severity: 3090.875 },
            ],
          }),
        )
        writeFileSync(
          path.join(dir, 'gate.json'),
          JSON.stringify({
            pass: false,
            verdict,
            diagnosis: 'the pixels disagree and the capture looks complete',
            nextStep: 'diagnose the fold',
            perceptual: { meanDiff: 0.69, pctOverThreshold: 0.31, regions: 1 },
            values: { deltas: 1 },
            coverage: { unreferencedImages: ['assets/hero.png'] },
          }),
        )
        return { code: 1, stdout: '', stderr: '' }
      }
      default:
        return { code: 0, stdout: '', stderr: '' }
    }
  }
}

/** Every round the console started, and what it was asked. */
interface AiLog {
  calls: number
  prompts: string[]
  resumes: Array<string | undefined>
}

function fakeAi(log: AiLog, outcome: AiOutcome | ((call: number) => AiOutcome), emit: string[] = ['reading gate.json']): AiRunner {
  return async (opts: AiRunOptions) => {
    log.calls += 1
    log.prompts.push(opts.prompt)
    log.resumes.push(opts.resume)
    for (const line of emit) opts.onLine(line)
    return typeof outcome === 'function' ? outcome(log.calls) : outcome
  }
}

interface CommandOptions {
  log?: string[][]
  ticket?: XgdTicketGetOptions
}

/** What the machine answers. Every `xgd ticket create` gets its own id. */
function fakeCommands(opts: CommandOptions = {}): CommandRunner {
  let created = 0
  return async (command, args) => {
    opts.log?.push([command, ...args])
    if (command === 'git') return { code: 0, stdout: '', stderr: '' }
    if (command === 'xgd' && args[1] === 'create') {
      created += 1
      return {
        code: 0,
        stdout: `▶ xgd\n{"uid":"bug-0000000${created}","id":"BUG-${92 + created}","type":"bug","title":"${args[args.indexOf('--title') + 1]}"}`,
        stderr: '',
      }
    }
    if (command === 'xgd' && args[1] === 'update') return { code: 0, stdout: 'Updated', stderr: '' }
    if (command === 'xgd') return { code: 0, stdout: xgdTicketGetJson(opts.ticket), stderr: '' }
    return { code: 0, stdout: 'rail: no worse', stderr: '' }
  }
}

interface Fixture {
  handle: ConsoleHandle
  cwd: string
}

async function startConsole(opts: { ai?: AiRunner; commands?: CommandRunner; verdict?: string } = {}): Promise<Fixture> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req261-'))
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps(opts.verdict),
    runAi: opts.ai ?? (async () => ({ status: 'no-gap' })),
    runCommand: opts.commands ?? fakeCommands(),
    env: {},
    port: 0,
  })
  openHandles.push(handle)
  return { handle, cwd }
}

const post = (f: Fixture, route: string, body = ''): Promise<Response> =>
  fetch(new URL(route, f.handle.url), {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    redirect: 'manual',
  })

const get = (f: Fixture, route: string): Promise<Response> => fetch(new URL(route, f.handle.url))
const page = async (f: Fixture): Promise<string> => (await get(f, '/')).text()

const SITE = 'gigabytealchemy.ai'

/**
 * Press [reproduce], then press the round's own button, and wait for both.
 *
 * TWO PRESSES SINCE [[REQ-272]]. The round used to start from the iteration
 * finishing; it starts from `[diagnose this]` now. Every assertion below is
 * about what the round does once started, which that change does not touch.
 */
async function reproduce(f: Fixture): Promise<void> {
  await recapture(f)
  await diagnose(f, 1)
}

/** Press [recapture] and wait — the console's one verb ([[REQ-299]] part 1). */
async function recapture(f: Fixture): Promise<void> {
  await post(f, '/recapture', new URLSearchParams({ url: SITE }).toString())
  await f.handle.console.settled()
}

/** Press [diagnose this] on one iteration and wait for the round ([[REQ-272]]). */
async function diagnose(f: Fixture, n: number): Promise<void> {
  await post(f, `/iteration/${n}/diagnose`)
  await f.handle.console.settled()
}

/** Say the implementation landed, which is what lifts the hold ([[REQ-272]]). */
async function release(f: Fixture): Promise<void> {
  await post(f, '/release')
}

const roundDir = (f: Fixture, n = 1): string =>
  path.join(f.cwd, CONSOLE_WORKSPACE, slugForUrl(SITE), `iteration-${n}`, AI_DIR)

/** A round that filed a gap AND handed back a bug it tripped over on the way. */
const FILED_WITH_BUG: AiOutcome = {
  status: 'filed',
  residualClass: 'coverage-check-misses-section-background-images',
  summary: 'the coverage check reads a field background imagery cannot reach',
  // IDS, NOT DRAFTS ([[REQ-262]] D10). The round ran `xgd ticket create` itself
  // and reports what it made; the console reads these back rather than creating
  // anything of its own.
  ticketId: 'REQ-263',
  bugTickets: ['BUG-96'],
  sessionId: 'session-aaaa',
  cost: { model: 'claude-opus-5', costUsd: 0.42, durationMs: 195_000, turns: 21, inputTokens: 48_000, outputTokens: 9_100 },
}

// ── behavior 1: the parse ────────────────────────────────────────────────────

describe('REQ-261 the outcome block survives the ticket body', () => {
  it('test_UAT_FC_REQ_261_the_observed_round_parses_with_its_fenced_evidence_intact', () => {
    // Requirement 2, and the reason the whole ticket exists. The round that
    // motivated it quoted `gate.json` and `capture.json` in fenced blocks —
    // exactly as the brief demands — and the lazy fence regex stopped at the
    // first of them, truncating 7,500 characters to 1,130. The transcript is
    // kept byte-for-byte so the parse is proved against what a real round
    // really wrote, not against a shape invented to suit it.
    // ASSERTED ON THE SCANNER, NOT ON `parseOutcome`. [[REQ-262]] D10 changed
    // what an outcome block CONTAINS — a round files its own tickets now and
    // reports an id, so this transcript's `ticket` draft is last season's
    // shape. What it is kept for is untouched by that: it is the real text that
    // really broke the real parser, and `jsonObjectsFromEnd` is the thing that
    // has to survive it. Reasserting it through `parseOutcome` would be
    // testing the new contract against an old fixture and would prove neither.
    const transcript = readFileSync(OBSERVED_ROUND, 'utf8')
    const blocks = [...jsonObjectsFromEnd(transcript)] as Array<Record<string, unknown>>
    const answer = blocks.find((block) => typeof block.residualClass === 'string')

    expect(answer?.status).toBe('filed')
    expect(answer?.residualClass).toBe('coverage-check-misses-section-background-images')
    // Whole, and with the evidence that broke the old parse still in it.
    const body = (answer?.ticket as { body?: string } | undefined)?.body ?? ''
    expect(body.length).toBeGreaterThan(6000)
    expect(body).toContain('```json')
    expect(body).toContain('unreferenced-image')
    expect(body).toContain('## Proposed change')
    // The old regex is what this replaces — it really does truncate this text.
    const lazy = [...transcript.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/g)]
    expect(lazy.length).toBeGreaterThan(0)
    expect(() => JSON.parse(lazy[lazy.length - 1][1])).toThrow()
  })

  it('test_UAT_FC_REQ_261_the_parse_does_not_depend_on_fences_at_all', () => {
    // The scan is for BRACES, string-aware, from the end. So: an example block
    // before the answer still loses to the answer; a body carrying fences is
    // data; and a block with no fence around it at all is still read.
    const withFences = parseOutcome(
      'Here is the shape:\n```json\n{"status":"no-gap","summary":"the example"}\n```\n' +
        'And mine:\n```json\n{"status":"filed","residualClass":"fold-x","ticketId":"REQ-263",' +
        '"summary":"see:\\n```json\\n{\\"a\\":1}\\n```\\ndone"}\n```\n',
    )
    expect(withFences).toMatchObject({ status: 'filed', residualClass: 'fold-x', ticketId: 'REQ-263' })
    // Fences inside a STRING are data, wherever that string lives. The body
    // moved into the ticket the round files itself ([[REQ-262]] D10), so the
    // summary is what carries them here — the parser never cared which key.
    expect(withFences.summary).toContain('```json\n{"a":1}\n```')

    // No fence at all.
    expect(parseOutcome('{"status":"no-gap","summary":"bare"}')).toMatchObject({ status: 'no-gap', summary: 'bare' })
    // A stray brace in the prose neither swallows the answer nor becomes it.
    expect(
      parseOutcome('I looked at `const x = {` and then at }.\n{"status":"stopped","reason":"nothing to work"}'),
    ).toMatchObject({ status: 'stopped', reason: 'nothing to work' })
    // And a round that said nothing of the shape still produced no answer.
    expect(parseOutcome('It all looks fine to me.')).toMatchObject({ status: 'failed' })
  })
})

// ── behavior 2: one unbounded gap ticket, plus bugs ──────────────────────────

describe('REQ-261 a round files bugs beside its gap ticket', () => {
  it('test_UAT_FC_REQ_261_bugs_are_filed_as_their_own_draft_tickets', async () => {
    // Requirement 4. The first round found a defect in the INSTRUMENT — the
    // gate mis-routing its own verdict — which is not a gap in the engine being
    // judged, and it had no shape in which to report it except folding it into
    // the gap ticket. It has one now: its own ticket, beside the gap.
    //
    // WHO CREATES IT CHANGED ([[REQ-262]] D10). It used to be the console,
    // because the round could not run a command. The round runs `xgd` now and
    // files both itself, so what is asserted here is the other half: the
    // console creates NOTHING, and reads back everything the round says it made.
    const asked: string[][] = []
    const f = await startConsole({ ai: fakeAi({ calls: 0, prompts: [], resumes: [] }, FILED_WITH_BUG), commands: fakeCommands({ log: asked }) })
    await reproduce(f)

    expect(asked.filter((call) => call[0] === 'xgd' && call[2] === 'create')).toHaveLength(0)

    // Both ids were fetched, which is what makes the round's claim checkable
    // rather than merely stated.
    const gets = asked.filter((call) => call[0] === 'xgd' && call[1] === 'ticket' && call[2] === 'get').map((c) => c[3])
    expect(gets).toContain('REQ-263')
    expect(gets).toContain('BUG-96')

    // Both are on the page, as peers, and the bug's own page is served.
    const html = await page(f)
    const labels = [...html.matchAll(/<a href="([^"]+)" target="_blank"[^>]*>([^<]+)<\/a>/g)].map((m) => m[2])
    expect(labels).toContain('the gap ticket (REQ-263)')
    expect(labels).toContain('a bug it found (BUG-96)')
    expect((await get(f, '/iteration/1/ticket/BUG-96')).status).toBe(200)
    // The console is not a ticket browser: an id this round did not report is
    // not readable through it.
    expect((await get(f, '/iteration/1/ticket/BUG-99999')).status).toBe(404)
  })

  it('test_UAT_FC_REQ_261_a_round_that_found_no_gap_can_still_file_a_bug', async () => {
    // The bugs list is independent of the status — that is the point of it
    // being a separate list rather than a section of the gap ticket. A round
    // that found no engine gap may still have tripped over a defect in L1, in
    // its own instructions, or elsewhere in `1c`.
    const asked: string[][] = []
    const f = await startConsole({
      ai: fakeAi({ calls: 0, prompts: [], resumes: [] }, {
        status: 'no-gap',
        summary: 'nothing the engine got wrong',
        bugTickets: ['BUG-97'],
      }),
      commands: fakeCommands({ log: asked }),
    })
    await reproduce(f)

    const html = await page(f)
    expect(html).toContain('AI — found no engine gap')
    expect(html).toContain('a bug it found (BUG-97)')
    // The console still created nothing; the round did ([[REQ-262]] D10).
    expect(asked.filter((call) => call[0] === 'xgd' && call[2] === 'create')).toHaveLength(0)
  })

  it('test_UAT_FC_REQ_261_the_brief_asks_for_one_unbounded_ticket_and_for_bugs', async () => {
    // Requirement 3 lives in what the round is TOLD, because the size of a
    // ticket is not something the console can enforce. "Deferring is losing" is
    // the sentence the first round needed and did not have: it wrote "candidate
    // classes for a later round", and the later round starts from zero.
    const log: AiLog = { calls: 0, prompts: [], resumes: [] }
    const f = await startConsole({ ai: fakeAi(log, { status: 'no-gap' }) })
    await reproduce(f)

    const prompt = log.prompts[0]
    expect(prompt).toContain('Deferring is losing')
    expect(prompt).toMatch(/not bounded|no size limit|no bound/i)
    // [[BUG-108]]: this used to assert `` `bugs` ``, which was satisfied only by
    // the round context's "hand it back in `bugs`" — naming a field the closing
    // block has never had. The list the round really reports into is
    // `bugTickets`, and it holds ids of tickets the round filed itself.
    expect(prompt).toContain('`bugTickets`')
    // …and it is an artifact of the round, like everything else here.
    expect(readFileSync(path.join(roundDir(f), AI_PROMPT_FILE), 'utf8')).toContain('Deferring is losing')
  })
})

// ── behavior 3: resume ───────────────────────────────────────────────────────

describe('REQ-261 rounds carry context forward', () => {
  it('test_UAT_FC_REQ_261_a_second_iteration_resumes_the_first_rounds_session', async () => {
    // Requirement 6. Every round used to be a fresh `claude -p`, so a second
    // iteration on the same site knew nothing of what the first diagnosed.
    const log: AiLog = { calls: 0, prompts: [], resumes: [] }
    const f = await startConsole({ ai: fakeAi(log, { status: 'no-gap', summary: 'looked', sessionId: 'session-aaaa' }) })
    await reproduce(f)
    await recapture(f)
    await diagnose(f, 2)

    expect(log.calls).toBe(2)
    expect(log.resumes[0]).toBeUndefined()
    expect(log.resumes[1]).toBe('session-aaaa')
    // A resumed round is NOT re-sent the brief: re-sending it would grow the
    // session by the brief's own length every iteration, and unbounded context
    // growth is half of what makes a long chain dangerous.
    expect(log.prompts[0]).toContain('Transcribe from the captured DOM')
    expect(log.prompts[1]).not.toContain('Transcribe from the captured DOM')
    expect(log.prompts[1]).toContain('You are being resumed')
    // The other half is stated to the round in as many words: what it remembers
    // is a pointer, and the evidence underneath it has moved.
    expect(log.prompts[1]).toMatch(/pointer, never evidence/i)
    expect(log.prompts[1]).toContain('this iteration')
    // …and this round's own evidence is still handed over in full.
    expect(log.prompts[1]).toContain('gate.json')
    expect(log.prompts[1]).toContain('values-diff.json')

    const session = readSession(path.join(f.cwd, CONSOLE_WORKSPACE, slugForUrl(SITE)))
    expect(session).toMatchObject({ sessionId: 'session-aaaa', rounds: 2 })
  })

  it('test_UAT_FC_REQ_261_the_chain_is_cut_on_a_moved_reference_a_changed_brief_or_length', () => {
    // The scope is one session per reproduction chain; these are the three
    // things that end one, and each is a way the memory would otherwise become
    // a reconstruction rather than a pointer.
    const saved: RoundSession = { sessionId: 'session-aaaa', bundleDir: '/refs/a', briefHash: 'abc123', rounds: 1 }
    expect(resumableSession(saved, { bundleDir: '/refs/a', briefHash: 'abc123' })).toBe('session-aaaa')
    // 1. the reference moved — the remembered numbers describe a page that is gone.
    expect(resumableSession(saved, { bundleDir: '/refs/b', briefHash: 'abc123' })).toBeNull()
    // 2. the brief changed — a resumed round is never re-sent it, so it would
    //    be running the old instructions invisibly.
    expect(resumableSession(saved, { bundleDir: '/refs/a', briefHash: 'def456' })).toBeNull()
    // 3. the chain is long enough — the bound on context growth and on how long
    //    one hypothesis keeps its grip.
    expect(
      resumableSession({ ...saved, rounds: RESUME_MAX_ROUNDS }, { bundleDir: '/refs/a', briefHash: 'abc123' }),
    ).toBeNull()
    expect(resumableSession(null, { bundleDir: '/refs/a', briefHash: 'abc123' })).toBeNull()
    // The fingerprint is of the brief's own text, so an edit to it is the reset.
    expect(briefFingerprint('one')).not.toBe(briefFingerprint('two'))
    expect(resumePreamble(1)).toContain('the previous round')
    expect(resumePreamble(3)).toContain('the previous 3 rounds')
  })

  it('test_UAT_FC_REQ_261_resume_never_widens_what_a_round_may_do', () => {
    // Requirements 5 and 6, which are one assertion here.
    //
    // Resume is A FLAG ON THE SAME INVOCATION: the resumed argv is the fresh
    // argv plus `--resume <id>` and NOTHING else, so [[REQ-256]] behaviours 3
    // and 4 hold on iteration 7 exactly as on iteration 1.
    const fresh = claudeCommand({})
    const resumed = claudeCommand({}, { resume: 'session-aaaa' })
    expect(fresh.args).not.toContain('--resume')
    expect(resumed.args).toEqual([...fresh.args, '--resume', 'session-aaaa'])

    /**
     * ASSERTED AGAINST THE CONSTANTS, NEVER AGAINST THEIR VALUES.
     *
     * Requirement 6: the policy belongs to [[REQ-262]] and this ticket changes
     * none of it. A UAT here that pinned `'manual'` or named `Bash` would make
     * this file a SECOND place [[REQ-262]] has to edit to do its own job — the
     * cross-session coupling behaviour 8 was rewritten to prevent. What this
     * ticket owns is that the argv still says whatever the four constants say,
     * on a resumed round as on a fresh one; what they say is not its business.
     */
    const policy = [
      '--permission-mode',
      AI_PERMISSION_MODE,
      '--setting-sources',
      AI_SETTING_SOURCES,
      '--allowedTools',
      ...AI_ALLOWED_TOOLS,
      '--disallowedTools',
      ...AI_DISALLOWED_TOOLS,
    ]
    for (const args of [fresh.args, resumed.args]) {
      const at = args.indexOf('--permission-mode')
      expect(at).toBeGreaterThan(-1)
      expect(args.slice(at, at + policy.length)).toEqual(policy)
    }
  })
})

// ── behavior 4: the transcript shows the round once ──────────────────────────

describe('REQ-261 the transcript reads once', () => {
  it('test_UAT_FC_REQ_261_the_diagnosis_is_not_printed_twice_and_the_session_names_its_model', () => {
    // Requirement 7. `result.result` IS the assistant's final message, already
    // printed as an `assistant` event, so echoing it put every round's whole
    // diagnosis in the transcript twice — half of the observed round's 22KB.
    // What the result event uniquely knows is what the round cost.
    const result = formatStreamEvent(
      JSON.stringify({
        type: 'result',
        result: '# The diagnosis\n\n```json\n{"status":"filed"}\n```',
        total_cost_usd: 0.4213,
        duration_ms: 195_000,
        num_turns: 21,
        usage: { input_tokens: 48_000, output_tokens: 9_100 },
      }),
    )
    expect(result).toHaveLength(1)
    expect(result[0]).not.toContain('The diagnosis')
    expect(result[0]).toContain('$0.42')
    expect(result[0]).toContain('3m 15s')
    expect(result[0]).toContain('21 turns')

    // The session line names the model, and ONLY an init event is a session
    // starting: the observed round printed `— session started` 74 times in a
    // 175-line transcript because every `system` event matched.
    expect(formatStreamEvent(JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-opus-5' }))).toEqual([
      '— session started (claude-opus-5)',
    ])
    expect(formatStreamEvent(JSON.stringify({ type: 'system', subtype: 'compact_boundary' }))).toEqual([
      '— compact_boundary',
    ])
    expect(formatStreamEvent(JSON.stringify({ type: 'system' }))).toEqual([])
    // A model reported under another name is still the model.
    expect(
      formatStreamEvent(JSON.stringify({ type: 'system', subtype: 'init', modelInfo: { name: 'claude-opus-5' } })),
    ).toEqual(['— session started (claude-opus-5)'])
  })
})

// ── behaviours 5 and 6: recovery, and what it cost ───────────────────────────

describe('REQ-261 a round is recoverable and priced', () => {
  it('test_UAT_FC_REQ_261_a_failed_round_names_its_transcript_and_can_be_filed_from_it', async () => {
    // Requirements 8 and 9. The observed round's work was never lost — it was
    // in `transcript.txt` — but the only way to get a ticket out of it was to
    // run the round again and pay for it again. And the failure text said `the
    // round produced no outcome block.`, which does not mention that the whole
    // diagnosis is sitting in the file beside the message.
    const log: AiLog = { calls: 0, prompts: [], resumes: [] }
    // The REAL round's prose, with the block a round would write today appended
    // ([[REQ-262]] D10 — it files its own tickets and reports ids). The prose is
    // the part that matters here: it is thousands of characters of fenced
    // evidence, and recovering an answer from the far side of it is exactly
    // what this path exists to do. Rewriting the fixture's own block would have
    // tested the recovery against a shape no round produces any more.
    const said = [
      ...readFileSync(OBSERVED_ROUND, 'utf8').split('\n'),
      '```json',
      JSON.stringify({
        status: 'filed',
        residualClass: 'coverage-check-misses-section-background-images',
        ticketId: 'REQ-263',
        summary: 'the coverage check reads a field background imagery cannot reach',
      }),
      '```',
    ]
    const f = await startConsole({
      ai: fakeAi(log, { status: 'failed', reason: 'the round produced no outcome block.' }, said),
    })
    await reproduce(f)

    const before = await page(f)
    expect(before).toContain('AI — failed')
    expect(before).toContain(path.join(roundDir(f), AI_TRANSCRIPT_FILE))
    expect(before).toContain('read it again')
    expect(before).not.toContain('the gap ticket')

    await post(f, '/iteration/1/recover')

    // Nothing was spawned: the second filing cost no model call at all.
    expect(log.calls).toBe(1)
    const after = await page(f)
    expect(after).toContain('AI — filed')
    expect(after).toContain('coverage-check-misses-section-background-images')
    expect(after).toContain('the gap ticket (REQ-263)')
    // The console wrote no body file, because it filed nothing — the ticket was
    // already there. What recovery salvages is the round's ANSWER, read from the
    // far side of thousands of characters of fenced evidence.
    expect(existsSync(path.join(roundDir(f), 'ticket-body.md'))).toBe(false)
    // The recovered outcome is recorded as recovered, so the artifact says
    // where it came from rather than claiming to be a round that ran.
    expect(JSON.parse(readFileSync(path.join(roundDir(f), AI_OUTCOME_FILE), 'utf8')).recovered).toBe(true)
  })

  it('test_UAT_FC_REQ_261_the_model_and_the_cost_are_recorded_beside_the_outcome', async () => {
    // Requirement 10. This loop is meant to run many times and its per-round
    // cost is what decides how many, so "is this affordable to run often" must
    // be answerable from the artifacts rather than from impression.
    const f = await startConsole({ ai: fakeAi({ calls: 0, prompts: [], resumes: [] }, FILED_WITH_BUG) })
    await reproduce(f)

    const outcome = JSON.parse(readFileSync(path.join(roundDir(f), AI_OUTCOME_FILE), 'utf8'))
    expect(outcome.cost).toMatchObject({ model: 'claude-opus-5', costUsd: 0.42, turns: 21 })
    expect(outcome.sessionId).toBe('session-aaaa')
    const html = await page(f)
    expect(html).toContain('claude-opus-5 · $0.42 · 3m 15s')

    // Read off the `result` event rather than guessed at, and a round that
    // reported nothing says nothing rather than printing a row of dashes.
    expect(readCost({ total_cost_usd: 1.5, duration_ms: 1000, usage: { input_tokens: 10 } })).toMatchObject({
      costUsd: 1.5,
      durationMs: 1000,
      inputTokens: 10,
    })
    expect(describeCost({})).toBe('')
    expect(describeCost(undefined)).toBe('')
  })
})

// ── behavior 7: the digest ───────────────────────────────────────────────────

describe('REQ-261 the evidence is pre-digested', () => {
  it('test_UAT_FC_REQ_261_the_digest_counts_what_a_round_would_spend_reads_counting', () => {
    // The first live round spent four tool calls establishing that `"src"`
    // occurs zero times in the reference manifest, and three more establishing
    // that the one mirrored image IS named there — as `backgroundImageUrl`.
    // Both are arithmetic over files the console already has parsed.
    const digest = buildDigest({
      n: 1,
      gate: { coverage: { unreferencedImages: ['assets/hero.png'] } },
      valuesDiff: { matched: 59, unmatched: 0, deltas: [{ text: 'Gigabyte', property: 'gap', expected: '142px', actual: '149px', tier: 'HIGH', severity: 3090 }] },
      regions: { meanDiff: 0.69, pctOverThreshold: 0.31, regions: [{ id: 1, bbox: { x: 448, y: 96, w: 272, h: 64 }, score: 2194, meanDiff: 48.7 }] },
      capture: {
        sections: [{ index: 1, background: { kind: 'image', image: 'assets/hero.png' } }],
        assets: [{ kind: 'image', src: 'https://x/images/hero.png', localPath: 'assets/hero.png' }],
      },
      manifest: { projections: [{ sections: [{ backgroundImageUrl: 'https://x/images/hero.png' }] }] },
      page: { data: { page: { kind: 'box', children: [{ kind: 'text' }, { kind: 'text' }] } } },
    })

    // The asset IS attributed, and the digest says exactly where — which is the
    // finding the gate got wrong.
    expect(digest).toContain('projections[].sections[].backgroundImageUrl')
    expect(digest).toContain('sections[].background.image')
    // The census answers "does this document have such a field at all", which
    // is the question that cost four reads. `src` is not in the manifest.
    expect(digest).toContain('`backgroundImageUrl` × 1')
    expect(digest.split('## Key census — the reference manifest')[1].split('## Key census — the capture')[0]).not.toContain('`src`')
    // The deltas and the regions, counted and ranked, with their real numbers.
    expect(digest).toContain('**HIGH** `gap`')
    expect(digest).toContain('142px')
    expect(digest).toContain('#1 (448, 96) 272×64')
    expect(digest).toContain('`kind`')
    expect(digest).toContain('`text` × 2')
    // An ADDITION, never a replacement: it says so, in the round's own terms.
    expect(digest).toMatch(/arithmetic, not a source/i)

    // The helpers it is built from are general, not shaped to one manifest.
    expect(keyCensus({ a: [{ b: 1 }, { b: 2 }] })).toEqual([['b', 2], ['a', 1]])
    expect(valueCensus({ xs: [{ kind: 'box' }, { kind: 'box' }, { kind: 'text' }] }, 'kind')).toEqual([
      ['box', 2],
      ['text', 1],
    ])
    expect(stringOccurrences({ a: { b: ['x/hero.png'] } }, 'hero.png')).toEqual([['a.b[]', 1]])
    // A mirrored image nothing names is the other half of the same answer.
    expect(
      buildDigest({ n: 1, capture: { assets: [{ kind: 'image', localPath: 'assets/orphan.png' }] } }),
    ).toContain('**nowhere**')
  })

  it('test_UAT_FC_REQ_261_the_digest_is_written_beside_the_round_and_named_in_its_prompt', async () => {
    const log: AiLog = { calls: 0, prompts: [], resumes: [] }
    const f = await startConsole({ ai: fakeAi(log, { status: 'no-gap' }) })
    await reproduce(f)

    const digestFile = path.join(roundDir(f), AI_DIGEST_FILE)
    expect(existsSync(digestFile)).toBe(true)
    expect(readFileSync(digestFile, 'utf8')).toContain('backgroundImageUrl')
    // Named in the prompt, and named as arithmetic rather than as evidence —
    // and the files it derives from are still handed over in full.
    expect(log.prompts[0]).toContain(digestFile)
    expect(log.prompts[0]).toMatch(/NOT a source/i)
    expect(log.prompts[0]).toContain('multistate.json')
    expect(log.prompts[0]).toContain('**`raw.html` is the ground truth.**')
  })
})
