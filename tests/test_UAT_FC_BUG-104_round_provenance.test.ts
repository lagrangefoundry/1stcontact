/**
 * BUG-104 — a round's ticket says a round filed it.
 *
 * [[REQ-265]] was written by a loop-1 round: an unattended subprocess that read
 * a reproduction's evidence and filed what it found. Its `created_by` reads
 * `martin-github@westhead.me`. So did every ticket any round had filed, because
 * `xgd ticket create` with no `--created-by` resolves the identity itself and
 * for a round the resolution falls through to the git config of the checkout —
 * the operator's. Nothing in the store separated an unreviewed machine
 * diagnosis from the operator's own words.
 *
 * TWO HALVES, AND THE SECOND IS WHAT MAKES IT HOLD. The brief asks the round to
 * name itself; the console reads every ticket the round claims back and reports
 * one that does not. That is the same move [[REQ-262]] D7 forced on the
 * `ready_*` rule — once the round holds `Bash`, what the brief asks for is
 * checked after the fact rather than guaranteed — so it is tested the same way:
 * in BOTH directions, because a check only ever observed passing is a check
 * nobody has seen work.
 *
 * WHAT IS REAL. The console, its HTTP surface, the read-back and the violation
 * report are the real thing. Substituted are the two things a test must not
 * have: a headless browser (`1c`) and a billed model (`claude`), plus the
 * commands the console asks the machine about (`git`, `xgd`) — each through the
 * seam the console already had.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readBrief, type AiOutcome, type AiRunner } from '../tools/repro-console/src/ai'
import { ROUND_CREATED_BY, filedByRound } from '../tools/repro-console/src/ticket'
import type { CommandRunner } from '../tools/repro-console/src/run'
import type { IterationStep, StepResult, StepRunner } from '../tools/repro-console/src/iteration'
import { startReproConsole, type ConsoleHandle } from '../tools/repro-console/src/server'
import { xgdTicketGetJson, type XgdTicketGetOptions } from './support/xgd-ticket-get'

const openHandles: ConsoleHandle[] = []
afterEach(async () => {
  while (openHandles.length) await openHandles.pop()!.close()
})

// ── the stand-ins ────────────────────────────────────────────────────────────

/**
 * A stand-in `1c` that writes just enough for one iteration to complete.
 *
 * DELIBERATELY THINNER than the sibling suites' copies. Those assert on the
 * evidence — the digest's census, the gate summary in the prompt — so their
 * stand-ins write realistic documents. Nothing here reads the evidence at all:
 * these tests are about what the console does with the ROUND'S ANSWER once the
 * iteration is behind it, so the iteration only has to happen.
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
        // The real `1c gate` exits non-zero whenever it does not pass.
        return { code: 1, stdout: '', stderr: '' }
      }
      default:
        return { code: 0, stdout: '', stderr: '' }
    }
  }
}

interface CommandOptions {
  /** What `xgd ticket get --json` reports about every ticket read back. */
  ticket?: XgdTicketGetOptions
  /** Make `xgd` refuse, so nothing can be read back at all. */
  ticketCode?: number
  /** `xgd` answering something that is not a JSON document. */
  ticketStdout?: string
  log?: string[][]
}

function fakeCommands(opts: CommandOptions = {}): CommandRunner {
  return async (command, args) => {
    opts.log?.push([command, ...args])
    if (command === 'git') return { code: 0, stdout: '', stderr: '' }
    if (command === 'xgd') {
      return {
        code: opts.ticketCode ?? 0,
        stdout: opts.ticketStdout ?? xgdTicketGetJson(opts.ticket),
        stderr: opts.ticketCode ? 'no such ticket' : '',
      }
    }
    return { code: 0, stdout: 'rail: no worse', stderr: '' }
  }
}

const fakeAi = (outcome: AiOutcome): AiRunner => async () => outcome

interface Fixture {
  handle: ConsoleHandle
  cwd: string
}

async function startConsole(opts: { ai?: AiRunner; commands?: CommandRunner } = {}): Promise<Fixture> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'bug104-'))
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
 * that every ticket a round names is read back and its provenance checked — is
 * about what happens once the round has run, which that change does not touch.
 * [[REQ-299]] part 1 left one verb, `[recapture]`, which is the press that
 * produces the iteration the round then runs on; that does not touch it either.
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

/** A round that filed a gap AND a secondary `1c` bug it tripped over. */
const FILED: AiOutcome = {
  status: 'filed',
  residualClass: 'fold-drops-background-gradient-direction',
  summary: 'the fold writes every gradient vertically',
  ticketId: 'REQ-263',
  bugTickets: ['BUG-96'],
}

// ── the brief asks ───────────────────────────────────────────────────────────

describe('BUG-104 the brief tells the round to name itself', () => {
  /**
   * Normalised, because these are assertions about PROSE — the same treatment
   * the sibling brief tests give it. Line wrapping is layout: a phrase that
   * moved across a line break has not been removed, and failing on that teaches
   * the next editor to fight the formatting rather than to keep the rule.
   */
  const brief = (): string =>
    readBrief()
      .replace(/^\s*>\s?/gm, '')
      .replace(/\s+/g, ' ')

  it('test_UAT_FC_BUG_104_the_create_example_carries_the_flag', () => {
    // The whole fix's first half, and the reason it is asserted statically: the
    // flag is one line in a worked example, and an example is exactly the thing
    // a later edit of §6 drops without noticing.
    const text = brief()
    expect(text).toContain('xgd ticket create --type request')
    expect(text).toContain(`--created-by '${ROUND_CREATED_BY}:<slug>#<iteration>'`)

    // And it says WHY, because a flag with no reason beside it reads as
    // ceremony and gets dropped by the next round that is in a hurry.
    expect(text).toMatch(/is not optional/i)
    expect(text).toMatch(/git config user\.email/i)
  })

  it('test_UAT_FC_BUG_104_the_secondary_bug_tickets_carry_it_too', () => {
    // §5's `1c` defects are filed by the same round through the same command
    // and are read back to the same standard, so a brief that named the flag
    // only in §6 would produce a round that got half of them right.
    const fifth = brief().split('Defects in `1c` are secondary')[1] ?? ''
    expect(fifth).toContain('--created-by')
    expect(fifth).toContain(ROUND_CREATED_BY)
  })
})

// ── the marker itself ────────────────────────────────────────────────────────

describe('BUG-104 what counts as a round having filed', () => {
  it('test_UAT_FC_BUG_104_the_marker_admits_a_run_qualifier_and_refuses_a_lookalike', () => {
    // A PREFIX, NOT THE EXACT RUN. An appended ticket was filed by an EARLIER
    // round, so its qualifier is legitimately a different one — demanding this
    // round's would report a violation on a round that did as it was told.
    expect(filedByRound(ROUND_CREATED_BY)).toBe(true)
    expect(filedByRound(`${ROUND_CREATED_BY}:gigabytealchemy-ai#1`)).toBe(true)
    expect(filedByRound(`${ROUND_CREATED_BY}:joyfulculinarycreations#7`)).toBe(true)

    // The bug itself, and the two shapes of nothing.
    expect(filedByRound('martin-github@westhead.me')).toBe(false)
    expect(filedByRound('')).toBe(false)
    expect(filedByRound('BUG-104')).toBe(false)

    // The separator is required, so a `created_by` that merely starts with the
    // marker is not one — otherwise the check is defeated by a hyphen.
    expect(filedByRound(`${ROUND_CREATED_BY}-operator@example.com`)).toBe(false)
  })
})

// ── the console checks ───────────────────────────────────────────────────────

describe('BUG-104 the console reads the provenance back', () => {
  it('test_UAT_FC_BUG_104_a_ticket_filed_under_the_operator_is_reported', async () => {
    // The falsifier. The round filed, the ticket exists and is at `draft` — so
    // every check that existed before this ticket passes — and it still claims
    // a human wrote it.
    const f = await startConsole({
      ai: fakeAi(FILED),
      commands: fakeCommands({ ticket: { createdBy: 'martin-github@westhead.me' } }),
    })
    await reproduce(f)

    const html = await page(f)
    // Named, so an operator reading the report knows which ticket to repair,
    // and quoting what it actually said rather than only that it was wrong.
    expect(html).toContain('REQ-263')
    expect(html).toContain('martin-github@westhead.me')
    expect(html).toMatch(/human&#39;s name|human's name/)

    // The secondary `1c` bug is read to the same standard — it is a peer as a
    // ticket even though it is secondary as a finding.
    expect(html).toContain('BUG-96')

    // And the round is not FAILED by it. The diagnosis is real and was done;
    // a console that threw it away over its own audit trail would be reporting
    // a violation by committing a worse one.
    expect(html).not.toContain('named no ticket id')
  })

  it('test_UAT_FC_BUG_104_a_ticket_filed_by_the_round_is_reported_as_nothing', async () => {
    // The other direction, which is the half that proves the check WORKS rather
    // than merely fires. Default provenance in the stand-in is a round's own.
    const f = await startConsole({ ai: fakeAi(FILED), commands: fakeCommands() })
    await reproduce(f)

    const html = await page(f)
    expect(html).toContain('REQ-263')
    expect(html).not.toContain('not as')
    expect(html).not.toMatch(/human&#39;s name|human's name/)
  })

  it('test_UAT_FC_BUG_104_an_unreadable_ticket_is_unverified_not_misattributed', async () => {
    // TWO DIFFERENT FINDINGS. "the console could not look" and "the round filed
    // under the wrong name" must not collapse into one line, because they ask
    // the reader for different things: one is a ticket to repair, the other is
    // a console that could not see. A read-back that failed has an EMPTY
    // `created_by`, which is exactly the value a naive provenance check would
    // report as a violation.
    const f = await startConsole({
      ai: fakeAi(FILED),
      commands: fakeCommands({ ticketCode: 1 }),
    })
    await reproduce(f)

    const html = await page(f)
    expect(html).toContain('could not read REQ-263 back')
    expect(html).toContain('unverified')
    expect(html).not.toMatch(/human&#39;s name|human's name/)
  })

  it('test_UAT_FC_BUG_104_the_read_back_parses_json_rather_than_scraping_it', async () => {
    // The read-back moved from a regex over `xgd`'s human rendering to its
    // `--json` document, because `created_by` is not in the human output at
    // all. Two things follow and both are asserted, because the first is what
    // the console asks and the second is what it does with the answer.
    const asked: string[][] = []
    const f = await startConsole({
      ai: fakeAi({ ...FILED, bugTickets: [] }),
      commands: fakeCommands({ log: asked, ticket: { status: 'ready_to_implement' } }),
    })
    await reproduce(f)

    expect(asked).toContainEqual(['xgd', 'ticket', 'get', 'REQ-263', '--json'])
    // The status came out of the parsed document, not out of a `Status:` line.
    expect(await page(f)).toContain("is at 'ready_to_implement', not 'draft'")

    // And `xgd` answering something that is not a document at all is the
    // unreadable case, never a crash and never a provenance failure: the
    // banner-slicing parse is tolerant by design and this is where it gives up.
    const g = await startConsole({
      ai: fakeAi({ ...FILED, bugTickets: [] }),
      commands: fakeCommands({ ticketStdout: '▶ xgd 0.17.50\nError: no such ticket\n◀ xgd 0.17.50\n' }),
    })
    await reproduce(g)
    const html = await page(g)
    expect(html).toContain('could not read REQ-263 back')
    expect(html).not.toMatch(/human&#39;s name|human's name/)
  })
})
