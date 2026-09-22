/**
 * BUG-125 — a stored round written before REQ-276 takes the whole page down.
 *
 * [[REQ-276]] added `defectClasses` to `ReadTicket` as a REQUIRED field, and
 * `filingsOf` reads `.length` off it — correctly, for an object the type says
 * always has it. `readOutcome` restored `outcome.json` off disk with a bare
 * spread and an `as AiOutcome`, so the compiler agreed the field was there and
 * the disk disagreed: every round recorded before that commit carries
 * `ticketsRead` entries with four keys and none of them is the new one. The
 * operator clicked a stored site and got a bare 500 where the iteration list,
 * the verdict, the diff links and the reference line should have been.
 *
 * WHAT IS REAL HERE. The console, its HTTP surface, the artifacts on disk and
 * the read-back that restores them are the real thing — a real `node:http`
 * server on loopback, driven with real `fetch`, reading real files written by a
 * real round. Substituted: the browser (`1c`, through the injected
 * `StepRunner`), the billed model (`claude`, through the injected `AiRunner`)
 * and the machine the console asks about tickets (`xgd`, through the injected
 * `CommandRunner`).
 *
 * HOW THE OLD ARTIFACT IS MADE. A round is really run, and then its
 * `outcome.json` is edited on disk to the shape an earlier console wrote — the
 * same four keys the operator's own `storage/tmp/repro-console` holds. That is
 * the honest fixture: a hand-written file would prove the parser survives a
 * file this suite invented, where what has to be survived is a file the console
 * itself wrote a version ago.
 */
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { AiRunOptions, AiRunner } from '../tools/repro-console/src/ai'
import { DEFECT_CLASS_FIELD } from '../tools/repro-console/src/defect-class'
import { CONSOLE_WORKSPACE, slugForUrl } from '../tools/repro-console/src/console'
import type { CommandRunner } from '../tools/repro-console/src/run'
import type { IterationStep, StepResult, StepRunner } from '../tools/repro-console/src/iteration'
import { startReproConsole, type ConsoleHandle } from '../tools/repro-console/src/server'
import { xgdTicketGetJson } from './support/xgd-ticket-get'

const openHandles: ConsoleHandle[] = []

afterEach(async () => {
  while (openHandles.length) await openHandles.pop()!.close()
})

const SITE = 'https://gigabytealchemy.ai/'
const GAP_TICKET = 'REQ-269'
const BUG_TICKET = 'BUG-106'

// ── the stand-ins ────────────────────────────────────────────────────────────

/** A stand-in `1c` that writes what the real one writes, so a round can run. */
function fakeSteps(captures: StoredEntry[]): StepRunner {
  return async (step: IterationStep, cwd: string): Promise<StepResult> => {
    const out = (): string => step.argv[step.argv.indexOf('--out') + 1]
    switch (step.name) {
      case 'capture': {
        // `capture list` is what the blank page reads to offer stored sites —
        // the click this whole ticket is about goes through it.
        if (step.argv[1] === 'list') return { code: 0, stdout: JSON.stringify(captures), stderr: '' }
        const url = step.argv[2]
        const dir = path.join(cwd, 'storage', 'references', new URL(url).hostname, 'index')
        mkdirSync(dir, { recursive: true })
        writeFileSync(path.join(dir, 'capture.json'), JSON.stringify({ url }))
        writeFileSync(path.join(dir, 'raw.html'), '<!doctype html><h1>reference</h1>')
        captures.push({ name: `${new URL(url).hostname}/index`, dir, url, capturedAt: '2026-09-19T10:00:00.000Z' })
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

interface StoredEntry {
  name: string
  dir: string
  url: string
  capturedAt: string
}

/** What `xgd` answers about each ticket, keyed by id — the live read-back. */
function fakeCommands(tickets: Record<string, string[]>): CommandRunner {
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

function fakeAi(): AiRunner {
  return async (opts: AiRunOptions) => {
    opts.onLine('reading gate.json')
    return {
      status: 'filed' as const,
      residualClass: 'capture-drops-form-control-padding',
      summary: 'the capture records no padding for a form field',
      ticketId: GAP_TICKET,
      bugTickets: [BUG_TICKET],
    }
  }
}

// ── the fixture ──────────────────────────────────────────────────────────────

interface Fixture {
  handle: ConsoleHandle
  cwd: string
}

const post = (f: Fixture, route: string, body = ''): Promise<Response> =>
  fetch(new URL(route, f.handle.url), {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    redirect: 'manual',
  })

const get = (f: Fixture, route: string): Promise<Response> =>
  fetch(new URL(route, f.handle.url), { redirect: 'manual' })

const page = async (f: Fixture): Promise<Response> => get(f, '/')

/** Run one real round on a fresh console, leaving its artifacts on disk. */
async function roundOnDisk(tickets: Record<string, string[]>): Promise<{ cwd: string; captures: StoredEntry[] }> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'bug125-'))
  const captures: StoredEntry[] = []
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps(captures),
    runAi: fakeAi(),
    runCommand: fakeCommands(tickets),
    env: {},
    port: 0,
  })
  const f: Fixture = { handle, cwd }
  // [[REQ-299]] part 1 — `[recapture]` is the console's one verb.
  await post(f, '/recapture', new URLSearchParams({ url: SITE }).toString())
  await handle.console.settled()
  await post(f, '/iteration/1/diagnose')
  await handle.console.settled()
  await handle.close()
  return { cwd, captures }
}

/** The console the operator starts tomorrow, looking at yesterday's disk. */
async function reopen(cwd: string, captures: StoredEntry[], tickets: Record<string, string[]>): Promise<Fixture> {
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps(captures),
    runAi: fakeAi(),
    runCommand: fakeCommands(tickets),
    env: {},
    port: 0,
  })
  openHandles.push(handle)
  const f: Fixture = { handle, cwd }
  // The blank page is what lists the stored sites, and the click is the POST.
  expect((await page(f)).status).toBe(200)
  expect((await post(f, '/open', new URLSearchParams({ url: SITE }).toString())).status).toBe(303)
  return f
}

const outcomeFile = (cwd: string, n = 1): string =>
  path.join(cwd, CONSOLE_WORKSPACE, slugForUrl(SITE), `iteration-${n}`, 'ai', 'outcome.json')

function editOutcome(cwd: string, edit: (outcome: Record<string, unknown>) => void): void {
  const file = outcomeFile(cwd)
  const outcome = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
  edit(outcome)
  writeFileSync(file, JSON.stringify(outcome, null, 2))
}

/** The four keys a `ticketsRead` entry carried before [[REQ-276]] existed. */
function asPreReq276(outcome: Record<string, unknown>): void {
  outcome.ticketsRead = (outcome.ticketsRead as Array<Record<string, unknown>>).map((entry) => ({
    id: entry.id,
    status: entry.status,
    createdBy: entry.createdBy,
    found: entry.found,
  }))
}

// ── the behaviours ───────────────────────────────────────────────────────────

describe('BUG-125 a stored round the console wrote a version ago', () => {
  it('test_UAT_FC_BUG_125_a_round_recorded_before_the_class_field_still_renders', async () => {
    // Behaviour 1 / acceptance 1. The whole page, not the ticket row: one
    // unreadable field in one round's artifact used to take down the iteration
    // list, the verdict, the diff links and the reference line with it.
    const { cwd, captures } = await roundOnDisk({ [GAP_TICKET]: ['fold-wrong'], [BUG_TICKET]: ['instrument-blind'] })
    editOutcome(cwd, asPreReq276)
    const f = await reopen(cwd, captures, {})

    const view = await page(f)
    expect(view.status).toBe(200)
    const html = await view.text()
    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).toContain('AI — filed')
    // The verdict and the round's own diagnosis came back with it.
    expect(html).toContain('reproduction-wrong')
    expect(html).toContain(GAP_TICKET)

    // …and every route the page links to answers rather than 500s.
    expect((await get(f, '/state')).status).toBe(200)
    expect((await get(f, '/iteration/1/page')).status).toBe(200)
    expect((await get(f, '/iteration/1/ticket')).status).toBe(200)
    expect((await get(f, '/iteration/1/diff/')).status).toBe(200)
  })

  it('test_UAT_FC_BUG_125_a_round_with_no_classes_reads_as_having_none', async () => {
    // Behaviour 2 / acceptance 2. Those tickets carry no class, so the split
    // clause is DROPPED — not rendered empty, not defaulted to a queue — and no
    // violation is manufactured against a round that predates the field.
    const { cwd, captures } = await roundOnDisk({ [GAP_TICKET]: ['fold-wrong'], [BUG_TICKET]: ['instrument-blind'] })
    editOutcome(cwd, asPreReq276)
    const f = await reopen(cwd, captures, {})

    const state = f.handle.console.state()
    expect(state.iterations).toHaveLength(1)
    expect(state.iterations[0].ai?.classSplit).toBeUndefined()
    // No loop-wide filings block either: a round that classified nothing must
    // not read on the page as one that bought nothing under an empty heading.
    expect(state.filings).toBeUndefined()
    expect(state.iterations[0].ai?.violations).toEqual([])
    const html = await (await page(f)).text()
    expect(html).not.toContain(DEFECT_CLASS_FIELD)
  })

  it('test_UAT_FC_BUG_125_a_round_recorded_today_still_renders_its_split', async () => {
    // Acceptance 3 — the read side is normalised, not weakened. A round whose
    // read-back really carries classes comes back off disk with them, in the
    // same split and the same queue order the live page showed.
    const { cwd, captures } = await roundOnDisk({
      [GAP_TICKET]: ['l1-cannot-express'],
      [BUG_TICKET]: ['instrument-blind'],
    })
    const f = await reopen(cwd, captures, {})

    const state = f.handle.console.state()
    expect(state.iterations[0].ai?.classSplit).toContain('l1-cannot-express')
    expect(state.iterations[0].ai?.classSplit).toContain('instrument-blind')
    // Ceiling before ruler, as the queue order has it.
    expect(state.filings?.groups.map((group) => group.queue)).toEqual(['ceiling', 'ruler'])
    expect(state.filings?.groups[0].classes[0].tickets).toEqual([GAP_TICKET])
    expect(await (await page(f)).text()).toContain('l1-cannot-express')
  })

  it('test_UAT_FC_BUG_125_a_malformed_entry_costs_itself_not_its_neighbours', async () => {
    // Behaviour 3 / acceptance 4. An entry that is not an object, or whose id
    // or status is the wrong type, is normalised to the same unread shape a
    // ticket the console could not read already has — and the good entry beside
    // it still renders.
    const { cwd, captures } = await roundOnDisk({
      [GAP_TICKET]: ['fold-wrong'],
      [BUG_TICKET]: ['instrument-blind'],
    })
    editOutcome(cwd, (outcome) => {
      const read = outcome.ticketsRead as Array<Record<string, unknown>>
      const good = read.find((entry) => entry.id === GAP_TICKET)
      outcome.ticketsRead = ['not an object', null, { id: 7, status: 'draft' }, { id: BUG_TICKET }, good]
    })
    const f = await reopen(cwd, captures, {})

    const view = await page(f)
    expect(view.status).toBe(200)
    const state = f.handle.console.state()
    // The good one is the only filing, carrying the class it really had.
    expect(state.filings?.groups.flatMap((group) => group.classes.flatMap((cls) => cls.tickets))).toEqual([GAP_TICKET])
    expect(state.iterations[0].ai?.classSplit).toContain('fold-wrong')
    // The unreadable ones are not invented into a queue of their own.
    expect(await view.text()).not.toContain('not an object')
  })

  it('test_UAT_FC_BUG_125_the_unclassified_check_stays_on_the_live_path', async () => {
    // Behaviour 4. Nothing about what a LIVE round records changes: a ticket
    // filed today with no class is still a violation, reported by the
    // confirmation path where the console can still see the store. Reading that
    // same round back off disk reports the violation it recorded and does not
    // add a second one — the read side never manufactures the finding.
    const { cwd, captures } = await roundOnDisk({ [GAP_TICKET]: [], [BUG_TICKET]: ['instrument-blind'] })
    const live = JSON.parse(readFileSync(outcomeFile(cwd), 'utf8')) as { violations: string[] }
    expect(live.violations).toHaveLength(1)
    expect(live.violations[0]).toContain(GAP_TICKET)
    expect(live.violations[0]).toContain(DEFECT_CLASS_FIELD)

    const f = await reopen(cwd, captures, {})
    expect(f.handle.console.state().iterations[0].ai?.violations).toEqual(live.violations)
  })
})
