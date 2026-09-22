/**
 * BUG-114 — two checks that reported alarming words for non-events.
 *
 * Both halves of this ticket are about the same failure: a report whose
 * strongest word is spent on something that did not happen. An operator who
 * learns to discount either one discounts the real thing when it arrives, and
 * the real thing is a round spending money unattended or an engine that got
 * worse without anybody noticing.
 *
 * PART 1 — the `ready_*` assertion was measured by difference, so it charged
 * the round with an arrival it had nothing to do with. [[BUG-104]] supplied the
 * missing half — a round's ticket now names the round in `created_by` — so an
 * arrival can be CHARGED by attribution while still being FOUND by difference.
 *
 * PART 2 — an unrecorded rail baseline is a setup step nobody has done. It now
 * says so in those words, and the console keeps saying so above the iteration
 * list until somebody records one.
 *
 * THE FILE MAKES BOTH DIRECTIONS OF EACH CLAIM. Suppressing the violation
 * everywhere would satisfy part 1's first half and destroy the check, so the
 * two shapes that must still be charged — a ticket the round filed, and one it
 * named and promoted — are asserted against the same console in the same file.
 *
 * WHAT IS REAL. The console, its HTTP surface, the snapshots, the read-back,
 * the attribution, the rail's own no-baseline path and both rendered pages are
 * the real thing. Substituted are the two things a test must not have — a
 * headless browser (`1c`) and a billed model (`claude`) — plus the commands the
 * console asks the machine about (`git`, `xgd`), each through the seam the
 * console already had.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { AiOutcome, AiRunner } from '../tools/repro-console/src/ai'
import {
  ROUND_CREATED_BY,
  readyStatusArrivals,
  readyStatusFindings,
  type ReadyTicket,
} from '../tools/repro-console/src/ticket'
import { NO_BASELINE_NOTICE, runRailRound } from '../tools/repro-console/src/rail-round'
import { renderConsolePage, type PageState } from '../tools/repro-console/src/page'
import type { CommandResult, CommandRunner } from '../tools/repro-console/src/run'
import type { IterationStep, StepResult, StepRunner } from '../tools/repro-console/src/iteration'
import { startReproConsole, type ConsoleHandle } from '../tools/repro-console/src/server'
import { xgdTicketGetJson } from './support/xgd-ticket-get'

const openHandles: ConsoleHandle[] = []
afterEach(async () => {
  while (openHandles.length) await openHandles.pop()!.close()
})

// ── the stand-ins ────────────────────────────────────────────────────────────

/**
 * A stand-in `1c` that writes just enough for one iteration to complete.
 *
 * Thin for the same reason BUG-104's is: nothing here reads the evidence. These
 * tests are about what the console does with an arrival at a trigger status and
 * with a rail that has no bar, so the iteration only has to happen.
 */
function fakeSteps(): StepRunner {
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
        writeFileSync(path.join(dir, 'regions.json'), JSON.stringify({ meanDiff: 31.2, pctOverThreshold: 18.4, regions: [] }))
        writeFileSync(path.join(dir, 'values-diff.json'), JSON.stringify({ deltas: [] }))
        writeFileSync(
          path.join(dir, 'gate.json'),
          JSON.stringify({
            pass: false,
            verdict: 'reproduction-wrong',
            diagnosis: 'the pixels disagree',
            nextStep: 'diagnose the fold',
            perceptual: { meanDiff: 31.2, pctOverThreshold: 18.4, regions: 3 },
            values: { deltas: 0 },
          }),
        )
        return { code: 1, stdout: '', stderr: '' }
      }
      default:
        return { code: 0, stdout: '', stderr: '' }
    }
  }
}

/** One ticket as `xgd ticket list --json` reports it. */
interface ListedTicket {
  uid: string
  id: string
  status: string
  /** What `xgd ticket get --json` says filed it, when the console asks. */
  createdBy: string
}

/**
 * An `xgd` that answers the two questions the check asks, and changes its mind
 * between them.
 *
 * THE POINT OF THE COUNTER. The console lists the trigger statuses once before
 * the round and once after, and the whole check lives in the difference. A
 * stand-in that answered identically both times could not express an arrival at
 * all — so the second list and every list after it carries `arrives` too.
 */
function fakeCommands(opts: { before?: ListedTicket[]; arrives?: ListedTicket[]; log?: string[][] } = {}): CommandRunner {
  const before = opts.before ?? []
  const known = [...before, ...(opts.arrives ?? [])]
  let lists = 0
  return async (command, args): Promise<CommandResult> => {
    opts.log?.push([command, ...args])
    if (command === 'git') return { code: 0, stdout: '', stderr: '' }
    // Only the TRIGGER-STATUS list is the check's; the console asks `xgd` other
    // list questions too (the session KB's `--type doc`), and counting those as
    // snapshots would hand the round's "before" the wrong answer.
    if (command === 'xgd' && args[0] === 'ticket' && args[1] === 'list' && args.includes('--status')) {
      lists += 1
      const items = lists === 1 ? before : known
      return { code: 0, stdout: JSON.stringify({ items, truncated: false, next_cursor: null }), stderr: '' }
    }
    if (command === 'xgd' && args[0] === 'ticket' && args[1] === 'list') {
      return { code: 0, stdout: JSON.stringify({ items: [], truncated: false, next_cursor: null }), stderr: '' }
    }
    if (command === 'xgd' && args[0] === 'ticket' && args[1] === 'get') {
      const wanted = known.find((t) => t.uid === args[2] || t.id === args[2])
      if (!wanted) return { code: 0, stdout: xgdTicketGetJson(), stderr: '' }
      return {
        code: 0,
        stdout: xgdTicketGetJson({ id: wanted.id, status: wanted.status, createdBy: wanted.createdBy }),
        stderr: '',
      }
    }
    return { code: 0, stdout: '', stderr: '' }
  }
}

const fakeAi = (outcome: AiOutcome): AiRunner => async () => outcome

interface Fixture {
  handle: ConsoleHandle
  cwd: string
}

async function startConsole(opts: { ai?: AiRunner; commands?: CommandRunner } = {}): Promise<Fixture> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'bug114-'))
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps(),
    runAi: opts.ai ?? (async () => ({ status: 'no-gap' })),
    runCommand: opts.commands ?? fakeCommands(),
    env: {},
    port: 0,
  })
  openHandles.push(handle)
  return { handle, cwd }
}

const SITE = 'gigabytealchemy.ai'

/**
 * Press [recapture], then press the round's own button, and wait for both.
 *
 * TWO PRESSES SINCE [[REQ-272]]. The round used to start from the iteration
 * finishing; it starts from `[diagnose this]` now. What this suite asserts —
 * which of the two checks cries wolf and which does not — is about what the
 * console reports once the round has run, which that change does not touch.
 * [[REQ-299]] part 1 left one verb, `[recapture]`, and that does not touch it
 * either: the press produces the iteration; the checks are about the round.
 */
async function reproduce(f: Fixture): Promise<void> {
  await fetch(new URL('/recapture', f.handle.url), {
    method: 'POST',
    body: new URLSearchParams({ url: SITE }).toString(),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    redirect: 'manual',
  })
  await f.handle.console.settled()
  await fetch(new URL('/iteration/1/diagnose', f.handle.url), { method: 'POST', redirect: 'manual' })
  await f.handle.console.settled()
}

const page = async (f: Fixture): Promise<string> => (await fetch(new URL('/', f.handle.url))).text()

/** Something already at a trigger status, so the "before" snapshot is not empty. */
const STANDING: ListedTicket = {
  uid: 'request-9999',
  id: 'REQ-171',
  status: 'ready_to_reconcile',
  createdBy: 'martin-github@westhead.me',
}

/** The ticket BUG-114 was filed about: promoted by the operator, mid-round. */
const OPERATOR_PROMOTED: ListedTicket = {
  uid: 'bug-14025216',
  id: 'BUG-100',
  status: 'ready_to_reconcile',
  createdBy: 'REQ-261',
}

/** A round that filed a gap ticket and nothing else. */
const FILED: AiOutcome = {
  status: 'filed',
  residualClass: 'fold-drops-background-gradient-direction',
  summary: 'the fold writes every gradient vertically',
  ticketId: 'REQ-263',
}

/** The violation's own words — the sentence that must not be spent on a non-event. */
const ACCUSATION = 'must never set a'

// ── part 1: who the arrival is charged to ────────────────────────────────────

describe('BUG-114 an arrival is charged by attribution, not by difference', () => {
  it('test_UAT_FC_BUG-114_an_operator_promotion_during_a_round_is_not_a_violation', async () => {
    // The report that started this. BUG-100 was promoted to `ready_to_reconcile`
    // by the operator in another window while a round ran; the round never
    // touched it, and the console accused the round of it in the language of a
    // violation. It is an observation now — reported, because a trigger status
    // nobody meant to set is still worth a look, and charged to nobody.
    const f = await startConsole({
      ai: fakeAi({ status: 'no-gap' }),
      commands: fakeCommands({ before: [STANDING], arrives: [OPERATOR_PROMOTED] }),
    })
    await reproduce(f)

    const html = await page(f)
    expect(html).toContain('BUG-100')
    expect(html).toContain('Nothing ties it to the round')
    expect(html).toContain('observations')
    // The half that matters: not the violation's words, and not the red list.
    expect(html).not.toContain(ACCUSATION)
    expect(html).not.toContain('<ul class="violations">')
    // …and the round is not reported as having misbehaved on the status line.
    expect(html).not.toContain('See the violations under it')
  })

  it('test_UAT_FC_BUG-114_a_ticket_the_round_filed_at_a_trigger_status_is_still_a_violation', async () => {
    // The hazard the check exists for, undiminished. `created_by` carries the
    // marker BUG-104 added, so the store itself says a round made this one —
    // and a round's ticket at a trigger status spawns a paid pipeline against a
    // diagnosis nobody has read.
    const f = await startConsole({
      ai: fakeAi({ status: 'no-gap' }),
      commands: fakeCommands({
        before: [STANDING],
        arrives: [
          {
            uid: 'request-abcd',
            id: 'REQ-900',
            status: 'ready_to_implement',
            createdBy: `${ROUND_CREATED_BY}:gigabytealchemy-ai#1`,
          },
        ],
      }),
    })
    await reproduce(f)

    const html = await page(f)
    // The sentence is the one it always was, in the red list where it belongs.
    expect(html).toContain('a ticket reached a dispatcher-trigger status during this round')
    expect(html).toContain('REQ-900')
    expect(html).toContain(ACCUSATION)
    expect(html).toContain('<ul class="violations">')
    // And it says WHY it is the round's, so the operator is not left to guess.
    expect(html).toContain('filed by one')
  })

  it('test_UAT_FC_BUG-114_a_ticket_the_round_named_and_promoted_is_still_a_violation', async () => {
    // The other shape of the same hazard, and the one `created_by` cannot see:
    // the ticket predates the round, so its provenance is a human's, and only
    // the round's own outcome connects the two. Promoting what it filed is
    // exactly as expensive as filing at `ready_*`.
    const f = await startConsole({
      ai: fakeAi(FILED),
      commands: fakeCommands({
        before: [STANDING],
        arrives: [
          { uid: 'request-0badc0de', id: 'REQ-263', status: 'ready_to_reconcile', createdBy: 'martin-github@westhead.me' },
        ],
      }),
    })
    await reproduce(f)

    const html = await page(f)
    expect(html).toContain('REQ-263')
    expect(html).toContain(ACCUSATION)
    expect(html).toContain('the round named it in its own outcome')
    expect(html).not.toContain('Nothing ties it to the round')
  })

  it('test_UAT_FC_BUG-114_an_arrival_the_console_could_not_read_back_is_not_charged', () => {
    // "The console could not look" and "the round did this" are different
    // findings, and the first must never render as the second — the same rule
    // BUG-104 set for the ticket read-back. An arrival missing from the
    // provenance map is one nobody could look at, so it is observed.
    const arrivals = readyStatusArrivals(
      new Map<string, ReadyTicket>([['request-9999', { uid: 'request-9999', id: 'REQ-171', status: 'ready_to_reconcile' }]]),
      new Map<string, ReadyTicket>([
        ['request-9999', { uid: 'request-9999', id: 'REQ-171', status: 'ready_to_reconcile' }],
        ['bug-dead', { uid: 'bug-dead', id: 'BUG-77', status: 'ready_to_implement' }],
      ]),
    )
    expect(arrivals.map((a) => a.uid)).toEqual(['bug-dead'])

    const findings = readyStatusFindings(arrivals, { named: new Set(), createdBy: new Map() })
    expect(findings.violations).toEqual([])
    expect(findings.observations).toHaveLength(1)
    expect(findings.observations[0]).toContain('BUG-77')
    expect(findings.observations[0]).not.toContain(ACCUSATION)
  })

  it('test_UAT_FC_BUG-114_a_round_that_disturbed_nothing_reports_nothing_at_all', async () => {
    // The ordinary case, which is what makes either list worth reading when one
    // does appear: no arrival, so neither a violation nor an observation.
    const f = await startConsole({
      ai: fakeAi({ status: 'no-gap' }),
      commands: fakeCommands({ before: [STANDING] }),
    })
    await reproduce(f)

    const html = await page(f)
    expect(html).not.toContain(ACCUSATION)
    expect(html).not.toContain('Nothing ties it to the round')
    expect(html).not.toContain('<ul class="observations">')
  })
})

// ── part 2: the rail that has never been recorded ────────────────────────────

describe('BUG-114 an unrecorded rail is a setup step, not a regression', () => {
  it('test_UAT_FC_BUG-114_a_missing_baseline_is_reported_as_not_yet_recorded', async () => {
    // The word REGRESSED is reserved for a comparison that was made and came
    // out worse. Three rounds ran on one site with the rail inert and the page
    // saying REGRESSED each time, which is the wrong word for a command nobody
    // has run.
    const cwd = mkdtempSync(path.join(tmpdir(), 'bug114-rail-'))
    const round = await runRailRound(cwd, async () => ({ code: 0, stdout: '', stderr: '' }), {})

    expect(round.available).toBe(false)
    expect(round.noBaseline).toBe(true)
    expect(round.summary).toContain('not yet recorded')
    expect(round.summary).toContain('repro-rail record')
    expect(round.summary).not.toContain('REGRESSED')
    // Not "unknown dressed as pass" either — there is no verdict to report.
    expect(round.pass).toBeUndefined()
  })

  it('test_UAT_FC_BUG-114_the_console_carries_a_standing_notice_while_the_rail_is_unrecorded', async () => {
    // Behaviour 2. The per-iteration line said the right thing and was skimmed
    // past three times, because a line under an iteration is a RESULT. This is
    // a condition of the checkout, so it goes above the list and stays there
    // until somebody runs the command it names.
    const f = await startConsole({ commands: fakeCommands({ before: [STANDING] }) })
    await reproduce(f)

    const html = await page(f)
    expect(html).toContain('class="notice"')
    expect(html).toContain('has no recorded baseline')
    // The command is typed by a person, so it is rendered as one.
    expect(html).toContain('<code>repro-rail record</code>')
    // And the alarming word appears nowhere on the page, in either place the
    // rail speaks.
    expect(html).not.toContain('REGRESSED')
  })

  it('test_UAT_FC_BUG-114_a_console_with_nothing_to_report_shows_no_notice', () => {
    // The notice is conditional, not decoration: a page state without one
    // renders no banner at all. A notice that is always there is a notice
    // nobody reads, which is the failure this whole ticket is about.
    const base: PageState = {
      version: 1,
      running: false,
      message: '',
      failed: false,
      url: null,
      iterations: [],
      stored: [],
    }
    expect(renderConsolePage(base)).not.toContain('class="notice"')
    expect(renderConsolePage({ ...base, notice: NO_BASELINE_NOTICE })).toContain('class="notice"')
  })
})
