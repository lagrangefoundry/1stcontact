/**
 * REQ-276 — a round says what KIND of thing it found.
 *
 * [[EPIC-19]] classified the 22 defects the first three rounds filed and found
 * two of them raised the product's ceiling while twenty made the ruler
 * trustworthy. That classification cost a human-directed audit of ten ticket
 * bodies, and the round that filed each one had the evidence in front of it at
 * the time and was never asked. So it is asked now, at filing time, and the
 * answer lands in a FIELD rather than in prose so that "show me the capability
 * queue" is a filter rather than a re-audit.
 *
 * WHAT IS REAL HERE. The console, its HTTP surface, the read-back of every
 * ticket a round names, the violation list and the page are the real thing — a
 * real `node:http` server on loopback, driven with real `fetch`. Substituted:
 * the browser (`1c`, through the injected `StepRunner`), the billed model
 * (`claude`, through the injected `AiRunner`) and the machine the console asks
 * about tickets (`xgd`, through the injected `CommandRunner`). The `xgd` stand-in
 * answers per ticket id, because "every ticket a round files carries a class"
 * is only observable when the gap ticket and the bug can differ.
 */
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { BRIEF_FILE, buildPrompt, readBrief, type AiRunOptions, type AiRunner } from '../tools/repro-console/src/ai'
import {
  DEFECT_CLASSES,
  DEFECT_CLASS_FIELD,
  describeSplit,
  groupByQueue,
} from '../tools/repro-console/src/defect-class'
import { CONSOLE_WORKSPACE, slugForUrl } from '../tools/repro-console/src/console'
import { readGaps } from '../tools/repro-console/src/gaps'
import type { CommandRunner } from '../tools/repro-console/src/run'
import type { IterationStep, StepResult, StepRunner } from '../tools/repro-console/src/iteration'
import { startReproConsole, type ConsoleHandle } from '../tools/repro-console/src/server'
import { xgdTicketGetJson } from './support/xgd-ticket-get'

const openHandles: ConsoleHandle[] = []

afterEach(async () => {
  while (openHandles.length) await openHandles.pop()!.close()
})

// ── the stand-ins ────────────────────────────────────────────────────────────

/** A stand-in `1c` that writes what the real one writes, so a round can run. */
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
        for (const name of ['diff.png', 'diff-blocks.png']) writeFileSync(path.join(dir, name), 'png')
        writeFileSync(path.join(dir, 'regions.json'), JSON.stringify({ meanDiff: 31.2, regions: [] }))
        writeFileSync(path.join(dir, 'values-diff.json'), JSON.stringify({ deltas: [{ field: 'color' }] }))
        writeFileSync(
          path.join(dir, 'gate.json'),
          JSON.stringify({
            pass: false,
            verdict: 'reproduction-wrong',
            diagnosis: 'the pixels disagree',
            nextStep: 'diagnose the fold',
            perceptual: { meanDiff: 31.2, pctOverThreshold: 18.4, regions: 3 },
            values: { deltas: 1 },
          }),
        )
        return { code: 1, stdout: '', stderr: '' }
      }
      default:
        return { code: 0, stdout: '', stderr: '' }
    }
  }
}

/**
 * What `xgd` answers about each ticket, keyed by id.
 *
 * PER TICKET, unlike the other suites' single answer: this behaviour is about
 * what EVERY ticket a round files carries, and a stand-in that gave the gap
 * ticket and the bug the same document could not tell the two apart.
 */
function fakeCommands(tickets: Record<string, string[] | undefined>): CommandRunner {
  return async (command, args) => {
    if (command === 'git') return { code: 0, stdout: '', stderr: '' }
    if (command === 'xgd' && args[1] === 'get') {
      const id = args[2]
      return { code: 0, stdout: xgdTicketGetJson({ id, defectClass: tickets[id] ?? [] }), stderr: '' }
    }
    if (command === 'xgd') return { code: 0, stdout: '{}', stderr: '' }
    return { code: 0, stdout: 'rail: no worse', stderr: '' }
  }
}

interface RoundReport {
  residualClass: string
  ticketId: string
  bugTickets?: string[]
}

function fakeAi(report: RoundReport, prompts: string[] = []): AiRunner {
  return async (opts: AiRunOptions) => {
    prompts.push(opts.prompt)
    opts.onLine('reading gate.json')
    return { status: 'filed' as const, summary: 'the fold writes every gradient vertically', ...report }
  }
}

interface Fixture {
  handle: ConsoleHandle
  cwd: string
}

async function startConsole(report: RoundReport, tickets: Record<string, string[] | undefined>): Promise<Fixture> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req276-'))
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps(),
    runAi: fakeAi(report),
    runCommand: fakeCommands(tickets),
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

const page = async (f: Fixture): Promise<string> => (await fetch(new URL('/', f.handle.url))).text()

/** Press [recapture] ([[REQ-299]]), then press [diagnose this], and wait for both. */
async function round(f: Fixture, url = 'joyfulculinarycreations.com'): Promise<void> {
  await post(f, '/recapture', new URLSearchParams({ url }).toString())
  await f.handle.console.settled()
  await post(f, '/iteration/1/diagnose')
  await f.handle.console.settled()
}

const violations = (f: Fixture): string[] =>
  f.handle.console.state().iterations.flatMap((it) => it.ai?.violations ?? [])

// ── the behaviours ───────────────────────────────────────────────────────────

describe('REQ-276 where the defect sits', () => {
  it('test_UAT_FC_REQ_276_every_ticket_a_round_files_carries_a_class_from_the_closed_set', async () => {
    // Behaviour 1 — the gap ticket AND the secondary bug each land with a class
    // field from the closed set, and a round that did that is reported clean.
    const f = await startConsole(
      { residualClass: 'fold-drops-gradient-direction', ticketId: 'REQ-263', bugTickets: ['BUG-96'] },
      { 'REQ-263': ['fold-wrong'], 'BUG-96': ['instrument-blind'] },
    )
    await round(f)

    expect(violations(f)).toEqual([])
    const ai = f.handle.console.state().iterations[0].ai
    expect(ai?.status).toBe('filed')
    // The class is read off the ticket, not off the round's closing block.
    expect(ai?.classSplit).toContain('fold-wrong')
    expect(ai?.classSplit).toContain('instrument-blind')

    // …and it travels with the class registry, so the next round's prompt
    // carries where a known class sits as well as what it is.
    const gaps = readGaps(path.join(f.cwd, CONSOLE_WORKSPACE))
    expect(gaps[0].defectClasses).toEqual(['fold-wrong'])
  })

  it('test_UAT_FC_REQ_276_a_ticket_that_carries_no_class_is_reported_as_a_violation', async () => {
    // Behaviour 1's teeth. An unclassified ticket is one somebody has to audit
    // later, and "later" was measured at ten ticket bodies read by hand — so it
    // is a violation in the same list as a wrong status, not a silent absence.
    const f = await startConsole(
      { residualClass: 'fold-drops-gradient-direction', ticketId: 'REQ-263' },
      { 'REQ-263': [] },
    )
    await round(f)

    const found = violations(f)
    expect(found).toHaveLength(1)
    expect(found[0]).toContain('REQ-263')
    expect(found[0]).toContain(DEFECT_CLASS_FIELD)
    // The line names the set, so the round is told what it should have said
    // rather than only that it said nothing — and that "I cannot tell" is real.
    expect(found[0]).toContain('l1-cannot-express')
    expect(found[0]).toContain('cannot-tell')
    // The split is absent rather than empty: a round that classified nothing
    // must not read on the page as one that bought nothing.
    expect(f.handle.console.state().iterations[0].ai?.classSplit).toBeUndefined()
  })

  it('test_UAT_FC_REQ_276_a_class_outside_the_closed_set_is_reported_as_a_violation', async () => {
    // "A small CLOSED set" — a value outside it filters as nothing at all, which
    // is indistinguishable from the absence the field exists to end.
    const f = await startConsole(
      { residualClass: 'fold-drops-gradient-direction', ticketId: 'REQ-263' },
      { 'REQ-263': ['probably-the-fold'] },
    )
    await round(f)

    const found = violations(f)
    expect(found).toHaveLength(1)
    expect(found[0]).toContain("'probably-the-fold'")
    expect(found[0]).toContain('fold-wrong')
  })

  it('test_UAT_FC_REQ_276_a_secondary_bug_is_classified_to_the_same_standard', async () => {
    // "EVERY ticket a round files." Nine of EPIC-19's twenty-two defects were
    // instrument defects, and an instrument defect arrives as a secondary `1c`
    // bug rather than as the gap ticket — checking only the gap ticket would
    // leave the largest block of findings sorted by nothing.
    const f = await startConsole(
      { residualClass: 'fold-drops-gradient-direction', ticketId: 'REQ-263', bugTickets: ['BUG-96'] },
      { 'REQ-263': ['fold-wrong'], 'BUG-96': [] },
    )
    await round(f)

    const found = violations(f)
    expect(found).toHaveLength(1)
    expect(found[0]).toContain('BUG-96')
    expect(found[0]).toContain(DEFECT_CLASS_FIELD)
  })

  it('test_UAT_FC_REQ_276_the_round_summary_line_says_what_it_filed_and_in_which_classes', async () => {
    // Behaviour 3 — the operator sees at a glance whether the round bought
    // ruler repair or ceiling, on the line they already read.
    const f = await startConsole(
      { residualClass: 'l1-has-no-letter-spacing-axis', ticketId: 'REQ-263', bugTickets: ['BUG-96'] },
      { 'REQ-263': ['l1-cannot-express'], 'BUG-96': ['instrument-no-axis'] },
    )
    await round(f)

    const { message } = f.handle.console.state()
    expect(message).toContain('filed REQ-263')
    // Ceiling first, because it is the queue the operator is looking for.
    expect(message).toContain('1 ceiling (l1-cannot-express)')
    expect(message).toContain('1 ruler (instrument-no-axis)')
    expect(message.indexOf('ceiling')).toBeLessThan(message.indexOf('ruler'))
    expect(await page(f)).toContain('1 ceiling (l1-cannot-express)')
  })

  it('test_UAT_FC_REQ_276_the_console_lists_the_loop_filings_grouped_by_class', async () => {
    // Behaviour 4 / acceptance 3 — "show me the capability queue" ends in ticket
    // ids somebody can open, not in a count that still needs an audit behind it.
    const f = await startConsole(
      { residualClass: 'l1-has-no-letter-spacing-axis', ticketId: 'REQ-263', bugTickets: ['BUG-96'] },
      { 'REQ-263': ['l1-cannot-express'], 'BUG-96': ['instrument-no-axis'] },
    )
    await round(f)

    const filings = f.handle.console.state().filings
    expect(filings?.groups.map((group) => group.queue)).toEqual(['ceiling', 'ruler'])
    expect(filings?.groups[0].classes).toEqual([{ id: 'l1-cannot-express', tickets: ['REQ-263'] }])
    expect(filings?.groups[1].classes).toEqual([{ id: 'instrument-no-axis', tickets: ['BUG-96'] }])

    const html = await page(f)
    expect(html).toContain('what this loop has filed')
    expect(html).toContain('l1-cannot-express')
    expect(html).toContain('BUG-96')
  })

  it('test_UAT_FC_REQ_276_a_ticket_carrying_two_classes_is_read_into_both_queues', async () => {
    // Why the field is a LIST. One gap ticket carries every residual a round
    // found, ordered by dependency: a scalar keyed to the leading issue would
    // hide a ceiling finding sitting at position three from exactly the filter
    // this behaviour exists to make possible.
    const f = await startConsole(
      { residualClass: 'fold-drops-gradient-direction', ticketId: 'REQ-263' },
      { 'REQ-263': ['fold-wrong', 'l1-cannot-express'] },
    )
    await round(f)

    expect(violations(f)).toEqual([])
    const filings = f.handle.console.state().filings
    expect(filings?.groups.map((group) => group.queue)).toEqual(['ceiling', 'ruler'])
    expect(filings?.groups[0].classes[0].tickets).toEqual(['REQ-263'])
    expect(filings?.groups[1].classes[0].tickets).toEqual(['REQ-263'])
    // One ticket, counted once in each queue it really sits in.
    expect(filings?.groups.map((group) => group.tickets)).toEqual([1, 1])
  })

  it('test_UAT_FC_REQ_276_the_brief_tells_the_round_what_every_class_means', async () => {
    // Acceptance 4, and the drift guard that keeps it true: the set is declared
    // in one place, and a class the code accepts but the brief never explains is
    // a class a round can only guess at.
    const brief = readBrief(BRIEF_FILE)
    for (const entry of DEFECT_CLASSES) expect(brief).toContain(`\`${entry.id}\``)
    expect(brief).toContain(DEFECT_CLASS_FIELD)
    // "I cannot tell" is a permitted answer — a forced choice would produce
    // confident noise, which is the failure this behaviour cannot afford.
    expect(brief).toMatch(/`cannot-tell` is a real answer/)
  })

  it('test_UAT_FC_REQ_276_the_prompt_hands_the_round_the_closed_set_and_the_field', async () => {
    // The brief explains; the prompt carries the list GENERATED FROM THE CODE,
    // so a round is never told a class the console will not accept.
    const prompt = buildPrompt('BRIEF', {
      n: 1,
      slug: 'repro-example',
      originalUrl: 'https://example.test',
      evidenceDir: '/tmp/evidence',
      bundleDir: '/tmp/bundle',
      siteDir: '/tmp/site',
      pageDocument: '/tmp/page.json',
      gate: null,
      knownGaps: [],
      rail: { summary: 'no rail' },
    })
    expect(prompt).toContain(`--fields '{"status":"draft","${DEFECT_CLASS_FIELD}":["fold-wrong"]}'`)
    for (const entry of DEFECT_CLASSES) expect(prompt).toContain(`\`${entry.id}\``)
    expect(prompt).toContain('cannot-tell')
  })

  it('test_UAT_FC_REQ_276_the_split_is_the_same_grouping_wherever_it_is_shown', async () => {
    // The status line's clause and the panel's groups are one function, so the
    // two readings of "what did this buy" can never disagree.
    const filings = [
      { id: 'REQ-263', classes: ['fold-wrong'] },
      { id: 'BUG-96', classes: ['l1-cannot-express'] },
    ]
    expect(describeSplit(filings)).toBe('1 ceiling (l1-cannot-express), 1 ruler (fold-wrong)')
    expect(groupByQueue(filings).map((group) => group.queue)).toEqual(['ceiling', 'ruler'])
    expect(describeSplit([])).toBe('')
  })
})
