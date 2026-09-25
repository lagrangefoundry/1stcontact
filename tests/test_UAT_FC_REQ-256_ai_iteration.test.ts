/**
 * REQ-256 — the AI round in the reproduction console.
 *
 * One iteration of loop 1 ([[EPIC-12]] §7.1): as soon as an iteration's links
 * appear an AI process starts, reviews the diff, and files a GAP TICKET against
 * the reproduction engine. It writes no code; the operator free-codes the
 * ticket in the ordinary way and presses [run again].
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The console, its HTTP surface, the round's
 * sequencing, the gap registry, the two falsifiers and everything served are the
 * real thing — a real `node:http` server on loopback, driven with real `fetch`,
 * reading and writing real files. What is substituted is what a test must not
 * have: a headless browser on the public internet (`1c`, through the injected
 * `StepRunner` [[REQ-254]] already had), a billed model (`claude`, through the
 * injected `AiRunner`), and the three commands the console asks the machine
 * about (the rail, `git status`, `xgd ticket get`, through the injected
 * `CommandRunner`). Each substitute writes what the real thing writes, so the
 * assertions are about the console rather than about the stand-in.
 *
 * The tool policy that makes "the AI writes no code" TRUE — rather than merely
 * asked for — is asserted on the real `claude` argv, which is a pure function
 * and needs no process.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  AI_ALLOWED_TOOLS,
  AI_DISALLOWED_TOOLS,
  BRIEF_FILE,
  buildPrompt,
  claudeCommand,
  formatStreamEvent,
  parseOutcome,
  readBrief,
  readGateReport,
  type AiRunOptions,
  type AiRunner,
} from '../tools/repro-console/src/ai'
import { unmeasuredOf } from '../tools/repro-console/src/unmeasured'
import { readGaps } from '../tools/repro-console/src/gaps'
import { parseTicketRef, ROUND_CREATED_BY } from '../tools/repro-console/src/ticket'
import { RAIL_ENV, ROUND_PHASES, runRailRound, summarise } from '../tools/repro-console/src/rail-round'
import type { RailReport } from '../tools/repro-console/src/rail'
import type { CommandRunner } from '../tools/repro-console/src/run'
import { xgdTicketGetJson, type XgdTicketGetOptions } from './support/xgd-ticket-get'
import type { IterationStep, StepResult, StepRunner } from '../tools/repro-console/src/iteration'
import {
  AI_DIR,
  AI_OUTCOME_FILE,
  AI_PROMPT_FILE,
  AI_TICKET_BODY_FILE,
  CONSOLE_WORKSPACE,
  slugForUrl,
} from '../tools/repro-console/src/console'
import { startReproConsole, type ConsoleHandle } from '../tools/repro-console/src/server'

const openHandles: ConsoleHandle[] = []

afterEach(async () => {
  while (openHandles.length) await openHandles.pop()!.close()
})

// ── the stand-ins ────────────────────────────────────────────────────────────

/** What the stand-in `1c gate` records — the one knob behaviours 4 and 7 turn. */
interface StepOptions {
  verdict?: string
}

/**
 * A stand-in `1c` that writes what the real one writes.
 *
 * `gate` is the step this ticket cares about: it writes `gate.json`,
 * `values-diff.json` and the same `regions.json` and heatmaps `1c diff` wrote,
 * all into the iteration's own evidence directory (requirement 15).
 */
function fakeSteps(opts: StepOptions = {}): StepRunner {
  return async (step: IterationStep, cwd: string): Promise<StepResult> => {
    const out = (): string => step.argv[step.argv.indexOf('--out') + 1]
    switch (step.name) {
      case 'capture': {
        if (step.argv[1] === 'list') return { code: 0, stdout: '[]', stderr: '' }
        const url = step.argv[2]
        const dir = path.join(cwd, 'storage', 'references', new URL(url).hostname, 'index')
        mkdirSync(dir, { recursive: true })
        writeFileSync(path.join(dir, 'capture.json'), JSON.stringify({ url }))
        writeFileSync(path.join(dir, 'raw.html'), '<!doctype html><h1>reference</h1>')
        return { code: 0, stdout: JSON.stringify({ url, name: `${new URL(url).hostname}/index`, dir }), stderr: '' }
      }
      case 'page':
        return { code: 0, stdout: JSON.stringify({ ok: true, data: { page: { id: 'home' } } }), stderr: '' }
      case 'render': {
        mkdirSync(out(), { recursive: true })
        writeFileSync(path.join(out(), 'index.html'), '<!doctype html><title>reproduction</title>')
        return { code: 0, stdout: '', stderr: '' }
      }
      case 'gate': {
        const dir = out()
        mkdirSync(dir, { recursive: true })
        for (const name of ['diff.png', 'diff-blocks.png']) writeFileSync(path.join(dir, name), 'png')
        writeFileSync(path.join(dir, 'regions.json'), JSON.stringify({ meanDiff: 31.2, pctOverThreshold: 18.4, regions: [] }))
        writeFileSync(path.join(dir, 'values-diff.json'), JSON.stringify({ deltas: [{ field: 'color' }] }))
        writeFileSync(
          path.join(dir, 'gate.json'),
          JSON.stringify({
            pass: false,
            verdict: opts.verdict ?? 'reproduction-wrong',
            diagnosis: 'the pixels disagree and the capture looks complete',
            nextStep: 'diagnose the fold',
            perceptual: { meanDiff: 31.2, pctOverThreshold: 18.4, regions: 3 },
            values: { deltas: 1 },
            coverage: { unreferencedImages: ['hero.jpg'] },
          }),
        )
        // The real `1c gate` exits non-zero whenever it does not pass.
        return { code: 1, stdout: '', stderr: '' }
      }
      default:
        return { code: 0, stdout: '', stderr: '' }
    }
  }
}

/** Every prompt the console handed a round, in order — behaviours 6 and 11. */
interface AiLog {
  prompts: string[]
  calls: number
}

/**
 * A stand-in AI round.
 *
 * `emit` is the transcript it streams (behavior 2); `outcome` is the block it
 * would have finished with. `hold` lets a test keep a round open so the page
 * can be read WHILE it is working, which is the only way behaviours 2 and 10
 * are observable at all.
 */
function fakeAi(
  log: AiLog,
  outcome: Awaited<ReturnType<AiRunner>>,
  emit: string[] = ['reading gate.json', '→ Read /x/values-diff.json'],
  hold?: () => Promise<void>,
): AiRunner {
  return async (opts: AiRunOptions) => {
    log.calls += 1
    log.prompts.push(opts.prompt)
    for (const line of emit) opts.onLine(line)
    if (hold) await hold()
    return outcome
  }
}

/** What the machine answers when the console asks it something. */
interface CommandOptions {
  /** `git status --porcelain`, in call order. The round runs between them. */
  git?: string[]
  /** What `xgd ticket get --json` reports about the ticket read back. */
  ticket?: XgdTicketGetOptions
  ticketCode?: number
  /** Make `xgd ticket create` / `--append-body-file` refuse. */
  createCode?: number
  appendCode?: number
  /** Calls the console made, for assertions about what it asked. */
  log?: string[][]
  /** The `<slug>#<n>` the stand-in comment is marked with ([[BUG-140]]). */
  appendedBy?: string
}

function fakeCommands(opts: CommandOptions = {}): CommandRunner {
  let gitCall = 0
  return async (command, args) => {
    opts.log?.push([command, ...args])
    if (command === 'git') {
      const answers = opts.git ?? ['']
      const stdout = answers[Math.min(gitCall, answers.length - 1)]
      gitCall += 1
      return { code: 0, stdout, stderr: '' }
    }
    if (command === 'xgd' && args[1] === 'create') {
      // What `xgd ticket create --json` prints, around its own log lines.
      return {
        code: opts.createCode ?? 0,
        stdout: `▶ xgd\n{"uid":"bug-1a2b3c4d","id":"BUG-93","type":"bug","title":"${args[args.indexOf('--title') + 1]}"}`,
        stderr: opts.createCode ? 'refused: nope' : '',
      }
    }
    if (command === 'xgd' && args[1] === 'update') return { code: opts.appendCode ?? 0, stdout: 'Updated', stderr: '' }
    /**
     * The comments hanging off a ticket, which is where an appended round's
     * evidence lands ([[BUG-140]]).
     *
     * A bare JSON array, because that is the one shape `xgd --json` uses here.
     * Answered by a well-behaved round's comment by default: the console now
     * looks for this round's marker on a ticket an `appended` round names, and
     * a fake with nothing to find would make every suite that models a correct
     * append report an unverified one.
     */
    if (command === 'xgd' && args[1] === 'comments') {
      return { code: 0, stdout: `▶ xgd\n${JSON.stringify([{ uid: 'comment-1', id: 'COMMENT-1' }])}\n◀ xgd`, stderr: '' }
    }
    if (command === 'xgd' && args[1] === 'get' && args[2] === 'comment-1') {
      const body = `${ROUND_CREATED_BY}:${opts.appendedBy ?? 'repro-joyfulculinarycreations-com#2'} — the re-measurement.`
      return { code: 0, stdout: `▶ xgd\n${JSON.stringify({ uid: 'comment-1', frontmatter: { uid: 'comment-1', id: 'COMMENT-1', type: 'comment', created_by: 'xgd', status: null }, fields: {}, body, links: [] })}\n◀ xgd`, stderr: '' }
    }
    if (command === 'xgd') {
      return { code: opts.ticketCode ?? 0, stdout: xgdTicketGetJson(opts.ticket), stderr: '' }
    }
    return { code: 0, stdout: 'rail: no worse', stderr: '' }
  }
}

interface Fixture {
  handle: ConsoleHandle
  cwd: string
}

interface ConsoleOptions {
  step?: StepOptions
  ai?: AiRunner
  commands?: CommandRunner
  env?: NodeJS.ProcessEnv
  cwd?: string
}

async function startConsole(opts: ConsoleOptions = {}): Promise<Fixture> {
  const cwd = opts.cwd ?? mkdtempSync(path.join(tmpdir(), 'req256-'))
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps(opts.step),
    runAi: opts.ai ?? (async () => ({ status: 'no-gap', summary: 'nothing to file' })),
    runCommand: opts.commands ?? fakeCommands(),
    env: opts.env ?? {},
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

/**
 * Press [reproduce], then press the round's own button, and wait for both.
 *
 * TWO PRESSES SINCE [[REQ-272]]. The round used to start from the iteration
 * finishing; it starts from `[diagnose this]` now, so every test here that is
 * about what the round DOES has to press it. What those tests assert is
 * untouched — the round, its evidence, its filing and its checks are the same
 * ones — which is the point: [[REQ-272]] moved the trigger and nothing else.
 */
async function reproduce(f: Fixture, url = 'joyfulculinarycreations.com'): Promise<void> {
  await recapture(f, url)
  await diagnose(f, 1)
}

/**
 * Press [recapture] and wait — the console's one verb ([[REQ-299]] part 1).
 *
 * It takes the address from whichever position it was pressed in; continuing
 * the chain is pressing it with the address already on the page.
 */
async function recapture(f: Fixture, url = 'joyfulculinarycreations.com'): Promise<void> {
  await post(f, '/recapture', new URLSearchParams({ url }).toString())
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

/** Poll until `predicate` holds, so a test can read the page mid-round. */
async function until<T>(read: () => Promise<T>, predicate: (value: T) => boolean): Promise<T> {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const value = await read()
    if (predicate(value)) return value
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error('condition never held')
}

const pollState = async (f: Fixture): Promise<{ running: boolean; message: string; live: { n: number; text: string } | null }> =>
  (await get(f, '/state')).json() as Promise<{ running: boolean; message: string; live: { n: number; text: string } | null }>

/**
 * What a round hands back: the ticket's CONTENT, never a command.
 *
 * The round cannot run `xgd` — it has no tool that can run anything — so the
 * console is what files this, at `draft`. `ticketId` and `ticketUid` are the
 * console's to fill in afterwards, which is why they are not here.
 */
const FILED = {
  status: 'filed' as const,
  residualClass: 'fold-drops-gradient-direction',
  summary: 'the fold writes every gradient vertically',
  // AN ID, NOT A DRAFT ([[REQ-262]] D10). The round ran `xgd ticket create`
  // itself; this is what it reports having made, and the console reads it back.
  ticketId: 'REQ-263',
}

// ── the round ────────────────────────────────────────────────────────────────

describe('REQ-256 the AI round', () => {
  it('test_UAT_FC_REQ_256_the_round_starts_with_the_links_and_streams_its_transcript', async () => {
    // Behaviour 2 — the round's transcript streams onto the page UNDER its
    // iteration while it works. Held open so the page can be read mid-round,
    // which is the only state in which that is observable.
    //
    // BEHAVIOUR 1 IS [[REQ-272]]'S NOW. It used to read "the links appearing IS
    // the trigger"; the trigger is `[diagnose this]` since, so the round is
    // started here by pressing it. What behaviour 2 asserts is untouched, which
    // is the whole of that change: the trigger moved and the round did not.
    let finish = (): void => {}
    const held = new Promise<void>((resolve) => (finish = resolve))
    const log: AiLog = { prompts: [], calls: 0 }
    const f = await startConsole({
      ai: fakeAi(log, FILED, ['reading gate.json', '→ Read values-diff.json'], () => held),
    })

    await post(f, '/recapture', new URLSearchParams({ url: 'joyfulculinarycreations.com' }).toString())
    await f.handle.console.settled()
    await post(f, '/iteration/1/diagnose')

    // The iteration is on the page — with its links — while the round is still
    // talking.
    const live = await until(
      () => pollState(f),
      (state) => state.live !== null,
    )
    expect(live.live?.n).toBe(1)
    expect(live.live?.text).toContain('reading gate.json')
    // Behavior 10 — nothing advances while a round is in flight.
    expect(live.running).toBe(true)

    const during = await page(f)
    expect(during).toContain('<h2>Iteration 1</h2>')
    expect(during).toContain('/iteration/1/site/')
    expect(during).toContain('id="ai-transcript-1"')
    expect(during).toContain('diagnosing…')

    finish()
    await f.handle.console.settled()

    // …and the finished round's transcript is rendered from its own file, so it
    // survives the reload the version bump causes.
    const after = await page(f)
    expect(after).toContain('→ Read values-diff.json')
    expect((await pollState(f)).running).toBe(false)
    const transcript = path.join(
      f.cwd,
      CONSOLE_WORKSPACE,
      slugForUrl('joyfulculinarycreations.com'),
      'iteration-1',
      AI_DIR,
      'transcript.txt',
    )
    expect(readFileSync(transcript, 'utf8')).toContain('reading gate.json')
  })

  it('test_UAT_FC_REQ_256_the_gap_ticket_is_the_fifth_link', async () => {
    // Behavior 5 — the ticket the round filed appears beside the original, the
    // reproduction, the diff images and the L1 document. Five links, and the
    // fifth reaches the real ticket.
    const log: AiLog = { prompts: [], calls: 0 }
    const asked: string[][] = []
    const f = await startConsole({
      ai: fakeAi(log, FILED),
      commands: fakeCommands({ log: asked, ticket: { status: 'draft', title: 'fold: gradient direction is dropped' } }),
    })
    await reproduce(f)

    const html = await page(f)
    const links = [...html.matchAll(/<a href="([^"]+)" target="_blank"[^>]*>([^<]+)<\/a>/g)]
    expect(links.map((m) => m[2])).toEqual([
      'the original site',
      'the reproduction',
      'the diff images',
      'the L1 document',
      'the gap ticket (REQ-263)',
    ])
    expect(links[4][1]).toBe('/iteration/1/ticket')

    // …and it serves the ticket as xgd itself prints it (requirement 24) —
    // asked for by id, not read out of `.xgd/tickets/`.
    const ticket = await get(f, '/iteration/1/ticket')
    expect(ticket.status).toBe(200)
    expect(await ticket.text()).toContain('fold: gradient direction is dropped')
    expect(asked).toContainEqual(['xgd', 'ticket', 'get', 'REQ-263', '--json'])

    // The round's claim, and the class it named, are on the page too.
    expect(html).toContain('fold-drops-gradient-direction')
    expect(html).toContain('the fold writes every gradient vertically')
    // And the round's outcome is an artifact of the round (requirement 19).
    const dir = path.join(f.cwd, CONSOLE_WORKSPACE, slugForUrl('joyfulculinarycreations.com'), 'iteration-1', AI_DIR)
    expect(JSON.parse(readFileSync(path.join(dir, AI_OUTCOME_FILE), 'utf8')).ticketId).toBe('REQ-263')
  })

  it('test_UAT_FC_REQ_256_capture_incomplete_stops_the_round_and_files_nothing', async () => {
    // Behavior 7, decided by the console (requirement 16). `capture-incomplete`
    // means the REFERENCE is wrong, not the engine — filing it against the
    // engine would be a false report, and working its deltas would spend the
    // round against an invalid oracle. So no AI process is started at all: the
    // rule cannot be got wrong by the one thing that could get it wrong.
    const log: AiLog = { prompts: [], calls: 0 }
    const f = await startConsole({
      step: { verdict: 'capture-incomplete' },
      ai: fakeAi(log, FILED),
    })
    await reproduce(f)

    expect(log.calls).toBe(0)
    const html = await page(f)
    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).toContain('capture-incomplete')
    expect(html).toContain('AI — stopped')
    // Nothing filed: no fifth link, and nothing in the gap registry.
    expect(html).not.toContain('the gap ticket')
    expect(readGaps(path.join(f.cwd, CONSOLE_WORKSPACE))).toEqual([])
    expect((await get(f, '/iteration/1/ticket')).status).toBe(404)
  })

  it('test_UAT_FC_REQ_256_a_repeated_class_appends_rather_than_filing_again', async () => {
    // Behavior 6 — one ticket per gap class, not per iteration. The next round
    // is TOLD what already has a ticket (requirement 21), which is the only way
    // it can honour the rule, and what it appends is the new evidence: the new
    // reference and the new iteration.
    const log: AiLog = { prompts: [], calls: 0 }
    let outcome: Awaited<ReturnType<AiRunner>> = FILED
    const f = await startConsole({
      ai: async (opts) => {
        log.calls += 1
        log.prompts.push(opts.prompt)
        opts.onLine('…')
        return outcome
      },
    })
    await reproduce(f)

    // Round 1 was told there was nothing filed yet.
    expect(log.prompts[0]).toContain('none yet')

    outcome = { ...FILED, status: 'appended' }
    // Round 1 filed, so the loop is held until the operator says the fix landed
    // ([[REQ-272]] part 1, behaviour 3).
    await release(f)
    await recapture(f)
    await diagnose(f, 2)

    // Round 2 was handed the class and its ticket, and told to append to it.
    expect(log.prompts[1]).toContain('fold-drops-gradient-direction')
    expect(log.prompts[1]).toContain('REQ-263')
    expect(log.prompts[1]).toContain('append to that ticket')

    // One entry, not two — carrying both rounds as the evidence it recurs.
    const gaps = readGaps(path.join(f.cwd, CONSOLE_WORKSPACE))
    expect(gaps).toHaveLength(1)
    expect(gaps[0].residualClass).toBe('fold-drops-gradient-direction')
    expect(gaps[0].ticketId).toBe('REQ-263')
    expect(gaps[0].iterations).toHaveLength(2)

    // Both iterations link the same ticket — behavior 9's continuation appended.
    const html = await page(f)
    expect(html).toContain('<h2>Iteration 2</h2>')
    expect([...html.matchAll(/the gap ticket \(REQ-263\)/g)]).toHaveLength(2)
  })

  it('test_UAT_FC_REQ_256_the_round_has_no_way_to_author_anything', async () => {
    // Behavior 3 as a property of the PROCESS (requirement 17), asserted on the
    // real `claude` argv — a pure function of the environment, so this proves
    // what the console really spawns without spawning it.
    const { command, args } = claudeCommand({})
    expect(command).toBe('claude')
    expect(args).toContain('-p')
    expect(args).toContain('stream-json')

    // The permission mode and the settings sources are STATED, never inherited.
    // A settings file carrying `defaultMode: auto` would have the round approve
    // its own tool calls, and an `allow` rule in one would widen what it may do
    // — either way behavior 3 would rest on a file this repository does not own.
    expect(args[args.indexOf('--permission-mode') + 1]).toBe('manual')
    expect(args[args.indexOf('--setting-sources') + 1]).toBe('')

    // Reading, and `xgd`.
    //
    // NARROWED BY [[REQ-262]] D7, DELIBERATELY. This assertion used to read
    // `['Read', 'Glob', 'Grep']` and to require `Bash` in the deny list, and
    // that was behaviour 3 as originally shipped. A round needs the ticket
    // store — the first live round went looking for prior art on its own defect
    // and found it — `xgd` is how this project exposes that, and running `xgd`
    // needs a shell. REQ-262 D5 then measured whether the shell could be given
    // narrowly and found it cannot: a `Bash(xgd ticket get:*)` prefix rule
    // ADMITS `Bash` whole and does not enforce the prefix. So there was no
    // half-measure available and the operator chose the grant.
    //
    // What is tested here is therefore the NEW policy, and the old one is
    // recorded rather than erased so this is legible as a decision.
    const allowed = args.slice(args.indexOf('--allowedTools') + 1, args.indexOf('--disallowedTools'))
    expect(allowed).toEqual(['Read', 'Glob', 'Grep', 'Bash'])
    expect(AI_ALLOWED_TOOLS).toEqual(allowed)

    // THE DENY LIST IS THE GATE, NOT THE ALLOW LIST — measured, not assumed: a
    // tool merely left off the allow list is still in the session and was seen
    // to run. So every tool that can author, delegate, reach the network or
    // move this machine's state is still named, and the grant above is the one
    // exception to it.
    const denied = args.slice(args.indexOf('--disallowedTools') + 1)
    for (const tool of ['Edit', 'Write', 'NotebookEdit', 'Task', 'Workflow', 'Skill', 'WebFetch', 'WebSearch']) {
      expect(AI_DISALLOWED_TOOLS, tool).toContain(tool)
      expect(denied, tool).toContain(tool)
    }
    // `Bash` is NOT among them, and that is the change. What it costs — "the
    // round writes no code" becoming an instruction rather than a property — is
    // covered where it is now enforced: REQ-262's `readyStatusFindings`, and
    // the console's existing working-tree falsifier.
    expect(denied).not.toContain('Bash')

    // An operator may point it at another executable or another model.
    expect(claudeCommand({ REPRO_CONSOLE_AI: 'my-claude' }).command).toBe('my-claude')
    expect(claudeCommand({ REPRO_CONSOLE_AI_MODEL: 'opus' }).args).toContain('opus')
  })

  it('test_UAT_FC_REQ_256_the_console_files_the_ticket_and_writes_draft_itself', async () => {
    // Behaviour 4, REVERSED BY [[REQ-262]] D10 and kept here under its old name
    // so the reversal is legible rather than silently absent.
    //
    // It used to read: the console runs `xgd ticket create --fields
    // '{"status":"draft"}'`, so the status is structural and there is no status
    // for a round to get wrong. Its whole justification was that the round
    // could not run a command. D7 gave it `Bash`, D10 gave it the job, and the
    // relay was deleted.
    //
    // `draft` is therefore an INSTRUCTION now, and this asserts the two things
    // that replaced the guarantee: the console creates NOTHING, and it reads
    // back every id the round reports so the status it really carries is on the
    // record rather than assumed.
    const asked: string[][] = []
    const f = await startConsole({
      ai: fakeAi({ prompts: [], calls: 0 }, FILED),
      commands: fakeCommands({ log: asked, ticket: { status: 'draft', title: 'fold: gradient direction is dropped' } }),
    })
    await reproduce(f)

    expect(asked.filter((call) => call[0] === 'xgd' && call[2] === 'create')).toHaveLength(0)
    expect(asked).toContainEqual(['xgd', 'ticket', 'get', 'REQ-263', '--json'])
    expect(await page(f)).toContain('the gap ticket (REQ-263)')

    // A ticket the round named but that cannot be read back is a violation, not
    // a ticket the page pretends exists: an unverifiable claim to have filed is
    // the failure mode the read-back is for.
    const g = await startConsole({
      ai: fakeAi({ prompts: [], calls: 0 }, FILED),
      commands: fakeCommands({ ticketCode: 1 }),
    })
    await reproduce(g)
    expect(await page(g)).toContain('could not read REQ-263 back')
  })

  it('test_UAT_FC_REQ_256_a_round_that_touched_the_tree_is_reported_as_a_violation', async () => {
    // Behavior 3's falsifier (requirement 18). The allowlist is what makes an
    // edit impossible; this is what makes an edit VISIBLE if it ever becomes
    // possible again — and it is compared against what the tree already looked
    // like, so an operator's own dirty tree is never reported as the AI's.
    const log: AiLog = { prompts: [], calls: 0 }
    const f = await startConsole({
      ai: fakeAi(log, FILED),
      commands: fakeCommands({
        git: [' M docs/NOTES.md', ' M docs/NOTES.md\n M tools/generate/src/l1/fold.ts'],
      }),
    })
    await reproduce(f)

    const html = await page(f)
    expect(html).toContain('changed the working tree')
    expect(html).toContain('tools/generate/src/l1/fold.ts')
    // The operator's own pre-existing edit is not attributed to the round.
    expect(html).not.toContain('docs/NOTES.md')
  })

  it('test_UAT_FC_REQ_256_a_ticket_that_is_not_draft_is_reported_as_a_violation', async () => {
    // Behavior 4's falsifier (requirement 18). A `ready_*` status is a
    // dispatcher trigger: it spawns an automated pipeline against the ticket
    // within seconds. The permission grammar cannot express "may append a body
    // but not change a status", so the rule is enforced by reading the status
    // back and naming it on the page.
    const log: AiLog = { prompts: [], calls: 0 }
    const f = await startConsole({
      ai: fakeAi(log, FILED),
      commands: fakeCommands({ ticket: { status: 'ready_to_implement' } }),
    })
    await reproduce(f)

    const html = await page(f)
    expect(html).toContain("is at 'ready_to_implement', not 'draft'")
    expect(html).toContain('dispatcher trigger')

    // A round that claims to have filed without naming the ticket cannot be
    // checked at all, which is itself the finding. Since [[REQ-262]] D10 the
    // parser catches it — there is no id to read back, so there is nothing for
    // the console to do but say the round failed.
    const g = await startConsole({ ai: fakeAi({ prompts: [], calls: 0 }, { status: 'filed', summary: 'done' }) })
    await reproduce(g)
    expect(await page(g)).toContain('named no ticket id')
  })

  it('test_UAT_FC_REQ_256_the_rail_runs_read_only_and_its_result_is_shown', async () => {
    // Behavior 8 — each round shows the CROSS-SITE state, not only this site's,
    // and the rail's verdict never fails the iteration: a red rail is
    // information for this round and a gate for the free-coding session later.
    //
    // The rail is [[REQ-255]]'s and is not reimplemented here. What this round
    // adds is the READ-ONLY caller: it runs the `references` phase — the
    // cross-site comparison, which is the one behavior 8 is about — and shows
    // what came back. The checkout-wide phases are the free-coding session's.
    expect(ROUND_PHASES).toEqual(['references'])

    const f = await startConsole()
    await reproduce(f)

    const html = await page(f)
    expect(html).toContain('regression rail:')
    expect(html).toContain('the regression rail —')
    // Read-only: the iteration is on the page and was not failed by it.
    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).not.toContain('failed at')
    // …and it came back from disk with the rest of the round's artifacts.
    const railFile = path.join(
      f.cwd,
      CONSOLE_WORKSPACE,
      slugForUrl('joyfulculinarycreations.com'),
      'iteration-1',
      'rail.json',
    )
    expect(existsSync(railFile)).toBe(true)

    // An operator who does not want to wait for it says so, and the page says
    // it did not run — which is honest, where a green line nothing produced
    // would not be.
    const off = await startConsole({ env: { [RAIL_ENV]: 'off' } })
    await reproduce(off)
    const quiet = await page(off)
    expect(quiet).toContain('is set to off')
    expect(quiet).toContain('<h2>Iteration 1</h2>')

    // Requirement 22's rule, in the world where the rail has LANDED: what the
    // round must never show is a green line nothing produced. A checkout with
    // no recorded bar cannot say "no worse" — it says so, and says what to do
    // about it, rather than passing by default.
    //
    // It does NOT say "REGRESSED", which is what this assertion used to pin and
    // what BUG-109 supersedes: nothing was measured, so nothing can have got
    // worse. "The rail could not run here" is the same answer the disabled and
    // the thrown paths above give, and it is reported the same way — see
    // `test_UAT_FC_BUG-109_*` for that claim in full.
    const bare = await runRailRound('/nowhere', async () => ({ code: 0, stdout: '', stderr: '' }), {})
    expect(bare.available).toBe(false)
    expect(bare.pass).toBeUndefined()
    expect(bare.summary).toContain('no baseline')
    expect(bare.summary).toContain('repro-rail record')
    expect(bare.summary).not.toContain('REGRESSED')
  })

  it('test_UAT_FC_REQ_256_the_rail_s_findings_are_what_the_page_and_the_round_are_told', () => {
    // Behavior 8 — what carries onto the page is the rail's FINDINGS, and a
    // narrowed run is visible rather than silent: `pass` answers "is anything
    // worse", `partial` answers "did this run look everywhere", and the two are
    // different questions.
    const report: RailReport = {
      pass: true,
      partial: true,
      ms: 12,
      phases: [
        {
          name: 'references',
          pass: true,
          ms: 12,
          summary: '2 references',
          failures: [],
          improvements: ['faelan.com meanDiff 31.2 → 22.9'],
          skipped: ['gigabytealchemy.ai — no recorded baseline'],
        },
      ],
    }
    const prose = summarise(report)
    expect(prose).toContain('no worse, partially covered')
    expect(prose).toContain('improved · references: faelan.com meanDiff 31.2 → 22.9')
    expect(prose).toContain('not covered · references: gigabytealchemy.ai — no recorded baseline')

    // A regression names what broke, and says so first — it is what a round acts on.
    const red = summarise({
      ...report,
      pass: false,
      partial: false,
      phases: [{ ...report.phases[0], pass: false, failures: ['faelan.com meanDiff 22.9 → 41.0'], improvements: [], skipped: [] }],
    })
    expect(red.split('\n')[0]).toContain('REGRESSED')
    expect(red).toContain('REGRESSED · references: faelan.com meanDiff 22.9 → 41.0')
  })

  it('test_UAT_FC_REQ_256_the_continuation_reproduces_with_whatever_landed_and_appends', async () => {
    // Behavior 9 — the continuation does not require that anything was
    // free-coded. A round that produced no landed change simply reproduces the
    // same numbers, which is itself information; and behavior 12's fresh `1c`
    // per iteration is what makes a change that DID land take effect. The verb
    // that continues is [recapture] now ([[REQ-299]] part 1); behavior 9 is
    // about what the press PRODUCES, and that is unmoved.
    const steps: IterationStep['name'][] = []
    const f = await startConsole({
      ai: fakeAi({ prompts: [], calls: 0 }, { status: 'no-gap', summary: 'nothing to file' }),
    })
    const handle = f.handle
    // Re-wrap the step runner so the sequence is observable.
    const base = fakeSteps()
    ;(handle.console as unknown as { runStep: StepRunner }).runStep = async (step, cwd) => {
      if (!(step.name === 'capture' && step.argv[1] === 'list')) steps.push(step.name)
      return base(step, cwd)
    }
    await reproduce(f)
    await recapture(f)
    await diagnose(f, 2)

    const html = await page(f)
    expect(html).toContain('<h2>Iteration 2</h2>')
    expect(html).toContain('AI — found no engine gap')
    // Every press re-captures ([[REQ-299]] part 1 retires REQ-254 requirement
    // 15's refold), and the second round really did run the whole sequence
    // again — which is behavior 12 and is what this test is for.
    expect(steps.filter((s) => s === 'capture')).toHaveLength(2)
    expect(steps.filter((s) => s === 'gate')).toHaveLength(2)
  })

  it('test_UAT_FC_REQ_256_the_round_comes_back_from_disk_after_a_restart', async () => {
    // Requirement 19 — what the round was asked and what it did are artifacts
    // of the round, so restarting the console shows the rounds it already ran
    // rather than an empty page beside a full `storage/tmp/`.
    const first = await startConsole({ ai: fakeAi({ prompts: [], calls: 0 }, FILED) })
    await reproduce(first, 'example.com')
    await first.handle.close()
    openHandles.length = 0

    const second = await startReproConsole({
      cwd: first.cwd,
      runStep: async (step) =>
        step.name === 'capture' && step.argv[1] === 'list'
          ? {
              code: 0,
              stdout: JSON.stringify([
                {
                  name: 'example.com/index',
                  dir: path.join(first.cwd, 'storage', 'references', 'example.com', 'index'),
                  url: 'https://example.com/',
                  capturedAt: '2026-09-16T10:00:00.000Z',
                },
              ]),
              stderr: '',
            }
          : { code: 0, stdout: '', stderr: '' },
      runAi: async () => ({ status: 'no-gap' }),
      runCommand: fakeCommands(),
      env: {},
      port: 0,
    })
    openHandles.push(second)
    const revived: Fixture = { handle: second, cwd: first.cwd }
    await page(revived)
    await post(revived, '/open', new URLSearchParams({ url: 'https://example.com/' }).toString())

    const recovered = await page(revived)
    expect(recovered).toContain('<h2>Iteration 1</h2>')
    expect(recovered).toContain('AI — filed')
    expect(recovered).toContain('fold-drops-gradient-direction')
    expect(recovered).toContain('the gap ticket (REQ-263)')
    expect(recovered).toContain('reading gate.json')
    // …and the verdict it was decided on came back too.
    expect(recovered).toContain('reproduction-wrong')
  })
})

// ── the brief, the prompt and the outcome ────────────────────────────────────

describe('REQ-256 the brief is a document', () => {
  it('test_UAT_FC_REQ_256_the_brief_carries_the_rules_it_must_carry', () => {
    // Behavior 11 — a durable, reviewable artifact, not a string buried in the
    // console, and it must carry six things at minimum.
    expect(BRIEF_FILE.endsWith(path.join('brief', 'DIAGNOSE-THE-GAP.md'))).toBe(true)
    expect(existsSync(BRIEF_FILE)).toBe(true)
    // NORMALISED, because these are assertions about PROSE. The brief is a
    // hand-wrapped markdown document, and a phrase that moves across a line
    // break when a paragraph is re-flowed has not been removed — failing on
    // that teaches the next editor to fight the wrap rather than to keep the
    // rule.
    const brief = readBrief()
      .replace(/^\s*>\s?/gm, '')
      .replace(/\s+/g, ' ')

    // The one rule, and that it binds the DIAGNOSIS.
    expect(brief).toContain('Transcribe from the captured DOM')
    expect(brief).toMatch(/do not reconstruct/i)
    // Regions before the mean.
    expect(brief).toMatch(/Read `regions` before `meanDifference`/i)
    // Every verdict, and that capture-incomplete means stop.
    for (const verdict of ['pass', 'reproduction-wrong', 'structural-failure', 'unexplained-disagreement', 'capture-incomplete']) {
      expect(brief).toContain(verdict)
    }
    expect(brief).toMatch(/stop\. file nothing/i)
    // Content completeness before pixels.
    expect(brief).toMatch(/content completeness first/i)
    // Diagnose the engine, never the site.
    expect(brief).toContain('diagnose the engine, never the site'.toLowerCase())
    // The xgd rules that bind ticket creation.
    expect(brief).toContain('xgd ticket create')
    expect(brief).toMatch(/never at any `ready_\*` status/i)
    expect(brief).toMatch(/title by area, not by type/i)
    expect(brief).toMatch(/one ticket per gap class/i)
  })

  it('test_UAT_FC_REQ_256_the_prompt_is_the_brief_plus_this_round_s_evidence', () => {
    // The prompt hands over PATHS, not contents, for everything but the gate
    // summary. Pasting the values in would be doing the transcription for the
    // round — which reads convenient and is exactly the habit that produces
    // reconstructions (behavior 11's first rule).
    const prompt = buildPrompt('BRIEF-BODY', {
      n: 2,
      slug: 'repro-faelan-com',
      originalUrl: 'https://faelan.com/',
      bundleDir: '/refs/faelan.com/index',
      evidenceDir: '/it/2/diff',
      pageDocument: '/it/2/page.json',
      siteDir: '/it/2/site',
      gate: {
        verdict: 'reproduction-wrong',
        pass: false,
        diagnosis: 'the pixels disagree',
        nextStep: 'diagnose the fold',
        meanDiff: 31.2,
        pctOverThreshold: 18.4,
        regions: 3,
        valueDeltas: 7,
        unreferencedImages: ['hero.jpg'],
        // REQ-277 — the prompt's headline. Carried by every real
        // `readGateReport`; spelled out here because this context is built by
        // hand, and a summary without it is one the round could not be told
        // what to drive from.
        unmeasured: unmeasuredOf({
          values: { unmeasuredAxes: [], unpairedSections: 0, unpairedActualSections: 0, unmatched: 0, unpairedActual: 0 },
        }),
      },
      rail: { available: true, pass: true, summary: 'bin/rail — no worse' },
      knownGaps: [
        {
          residualClass: 'capture-misses-nested-backdrop',
          ticketId: 'BUG-27',
          ticketUid: 'bug-27',
          summary: 'nested backdrops are not captured',
          references: ['/refs/gigabytealchemy.ai/index'],
          iterations: ['repro-gigabytealchemy-ai#1'],
        },
      ],
    })

    expect(prompt.startsWith('BRIEF-BODY')).toBe(true)
    expect(prompt).toContain('Iteration **2**')
    expect(prompt).toContain('https://faelan.com/')
    // The evidence, by path — every one of the three the ticket names.
    expect(prompt).toContain(path.join('/it/2/diff', 'gate.json'))
    expect(prompt).toContain(path.join('/it/2/diff', 'values-diff.json'))
    expect(prompt).toContain(path.join('/it/2/diff', 'regions.json'))
    expect(prompt).toContain('/refs/faelan.com/index')
    expect(prompt).toContain('raw.html')
    expect(prompt).toContain('/it/2/page.json')
    // The verdict, the numbers and the coverage finding, inline.
    expect(prompt).toContain('reproduction-wrong')
    expect(prompt).toContain('31.2')
    expect(prompt).toContain('hero.jpg')
    // The cross-site state, and what already has a ticket.
    expect(prompt).toContain('bin/rail — no worse')
    expect(prompt).toContain('capture-misses-nested-backdrop')
    expect(prompt).toContain('BUG-27')
  })

  it('test_UAT_FC_REQ_256_the_prompt_is_written_beside_the_round_it_drove', async () => {
    // Requirement 19 — reviewable after the fact, and recoverable after a
    // restart, like every other artifact of an iteration.
    const f = await startConsole({ ai: fakeAi({ prompts: [], calls: 0 }, FILED) })
    await reproduce(f, 'faelan.com')
    const promptFile = path.join(
      f.cwd,
      CONSOLE_WORKSPACE,
      slugForUrl('faelan.com'),
      'iteration-1',
      AI_DIR,
      AI_PROMPT_FILE,
    )
    const written = readFileSync(promptFile, 'utf8')
    expect(written).toContain('Transcribe from the captured DOM')
    expect(written).toContain('gate.json')
  })
})

describe('REQ-256 the outcome block', () => {
  it('test_UAT_FC_REQ_256_the_last_fenced_block_is_the_answer', () => {
    // Requirement 20 — the console reads what the round STATES, and does not
    // mine the transcript for it. The LAST block wins, because a round that
    // shows the shape before filling it in must not have its example read as
    // its answer.
    const outcome = parseOutcome(
      'Here is the shape:\n```json\n{"status":"filed","residualClass":"example","ticketId":"REQ-1"}\n```\n' +
        'And here is mine:\n```json\n{"status":"filed","residualClass":"fold-x","summary":"s",' +
        '"ticketId":"REQ-263","bugTickets":["BUG-96"]}\n```\n',
    )
    expect(outcome).toMatchObject({
      status: 'filed',
      residualClass: 'fold-x',
      ticketId: 'REQ-263',
      bugTickets: ['BUG-96'],
    })

    // A round that produced no block produced no answer — which is a failed
    // round, not an assumed one.
    expect(parseOutcome('I had a look and it seems fine.')).toMatchObject({ status: 'failed' })
    // …and a round may not claim a status that is the console's to set.
    expect(parseOutcome('```json\n{"status":"running"}\n```')).toMatchObject({ status: 'failed' })
    expect(parseOutcome('```json\n{"status":"no-gap","summary":"checked all four"}\n```')).toMatchObject({
      status: 'no-gap',
      summary: 'checked all four',
    })

    // A claim that does not carry what its status REQUIRES is a failed round,
    // not a partly-honoured one: `filed` without a ticket body would file an
    // empty ticket, and `filed` without a class would break one-per-class from
    // the other side. Neither is recoverable by guessing.
    expect(
      parseOutcome('```json\n{"status":"filed","residualClass":"fold-x","summary":"s"}\n```'),
    ).toMatchObject({ status: 'failed' })
    // A claim to have filed, with no class named, cannot be recorded against a
    // gap class and is a failed round.
    expect(
      parseOutcome('```json\n{"status":"filed","ticketId":"REQ-263"}\n```'),
    ).toMatchObject({ status: 'failed' })
    // THE ID IS NOW THE ROUND'S TO REPORT ([[REQ-262]] D10), and it is what
    // makes the claim checkable. This assertion used to read the other way —
    // the id was the console's to fill in and a round naming one was not
    // trusted, because it had no tool that could have created a ticket. It has
    // one now, so a claim with NO id is the failure: there is nothing to read
    // back, and an unverifiable claim to have filed is worse than an honest one
    // to have failed.
    expect(
      parseOutcome('```json\n{"status":"filed","residualClass":"fold-x","summary":"s"}\n```'),
    ).toMatchObject({ status: 'failed' })
    // `appended` is the same shape: the round appended to a ticket it names.
    expect(
      parseOutcome('```json\n{"status":"appended","residualClass":"fold-x","ticketId":"REQ-241"}\n```'),
    ).toMatchObject({ status: 'appended', ticketId: 'REQ-241' })
    expect(parseOutcome('```json\n{"status":"appended","residualClass":"fold-x"}\n```')).toMatchObject({
      status: 'failed',
    })
  })

  it('test_UAT_FC_REQ_256_the_transcript_reads_as_a_transcript', () => {
    // Behavior 2 — what streams onto the page is what a human can follow, not
    // the protocol. A tool call is one line; a refusal says so.
    expect(formatStreamEvent(JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-opus-5' }))).toEqual([
      '— session started (claude-opus-5)',
    ])
    expect(
      formatStreamEvent(
        JSON.stringify({
          type: 'assistant',
          message: { content: [{ type: 'text', text: 'The gradient is vertical.' }, { type: 'tool_use', name: 'Read', input: { file_path: '/x/gate.json' } }] },
        }),
      ),
    ).toEqual(['The gradient is vertical.', '→ Read /x/gate.json'])
    expect(
      formatStreamEvent(JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', is_error: true }] } })),
    ).toEqual(['← refused'])
    // A line that is not the protocol is kept — the commonest reason a round
    // produces nothing useful is a refusal printed in plain text.
    expect(formatStreamEvent('Invalid API key')).toEqual(['Invalid API key'])
  })

  it('test_UAT_FC_REQ_256_the_gate_report_is_what_the_stop_is_decided_from', () => {
    // Requirement 16 — an unreadable report is not a reason to guess, because
    // this file is where behavior 7's stop comes from.
    const dir = mkdtempSync(path.join(tmpdir(), 'req256-gate-'))
    expect(readGateReport(path.join(dir, 'gate.json'))).toBeNull()
    writeFileSync(path.join(dir, 'gate.json'), 'not json')
    expect(readGateReport(path.join(dir, 'gate.json'))).toBeNull()
    writeFileSync(
      path.join(dir, 'gate.json'),
      JSON.stringify({
        pass: false,
        verdict: 'capture-incomplete',
        diagnosis: 'the reference is wrong',
        nextStep: 're-capture',
        perceptual: { meanDiff: 106.84, pctOverThreshold: 80.3, regions: 9 },
        values: { deltas: 0 },
        coverage: { unreferencedImages: ['a.png'] },
      }),
    )
    expect(readGateReport(path.join(dir, 'gate.json'))).toMatchObject({
      verdict: 'capture-incomplete',
      meanDiff: 106.84,
      valueDeltas: 0,
      unreferencedImages: ['a.png'],
    })
  })
})
