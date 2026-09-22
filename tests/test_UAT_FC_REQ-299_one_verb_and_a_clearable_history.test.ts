/**
 * REQ-299 — one verb instead of three, and a way to clear the history.
 *
 * ## Part 1, the trap
 *
 * The console rendered three controls that all meant "produce the next
 * iteration": `[reproduce]` (`/run`), `[recapture]` (`/recapture`) and
 * `[run again]` (`/run-again`). Only one bit varied between them — whether the
 * reference bundle is re-rolled before the fold — and that bit is not one the
 * operator can answer from the page. Answering it correctly requires knowing the
 * capture schema the stored bundle was written at and the schema the extractor
 * is at now; when those differ, `[run again]` re-folds the stale bundle and the
 * iteration is blind to every axis added since the bundle was rolled, and
 * nothing on the page discloses it.
 *
 * A control whose correct use depends on a fact the page does not carry is not a
 * choice. So `[recapture]` is the only verb, it appears in both positions the
 * retired pair occupied, and `/run` and `/run-again` are gone from the HTTP
 * surface rather than merely unlinked.
 *
 * ## Part 2, the list that could not be put down
 *
 * The iteration list grew without bound and was never reset. `[clear history]`
 * ends the chain: the page returns to the blank state it opens in and the next
 * chain starts at Iteration 1. It ARCHIVES rather than deletes — the chain
 * directory holds AI transcripts, diffs, filed ticket ids and rail results, and
 * a press of a button on a page does not get to destroy that — and it does not
 * touch the captured reference, which is a separate artifact with a separate
 * lifecycle.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT, on [[REQ-254]]'s terms: the console, its
 * HTTP surface, the page it serves, and the directories it moves on disk are the
 * real thing — the archive assertions below read the actual filesystem, because
 * "it is recoverable" is a claim about disk and nothing else. Substituted is what
 * a test must not have: a headless browser (`1c`), a billed model (`claude`) and
 * the commands the console asks the machine about.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { AI_DIR, AI_TRANSCRIPT_FILE, CONSOLE_WORKSPACE, slugForUrl } from '../tools/repro-console/src/console'
import { MANIFEST_FILE } from '../tools/repro-console/src/iteration'
import { sessionFile } from '../tools/repro-console/src/session'
import type { AiOutcome, AiRunOptions, AiRunner } from '../tools/repro-console/src/ai'
import type { IterationStep, StepResult, StepRunner } from '../tools/repro-console/src/iteration'
import type { CommandRunner } from '../tools/repro-console/src/run'
import { startReproConsole, type ConsoleHandle } from '../tools/repro-console/src/server'
import { xgdTicketGetJson } from './support/xgd-ticket-get'

const openHandles: ConsoleHandle[] = []

afterEach(async () => {
  while (openHandles.length) await openHandles.pop()!.close()
})

const SITE = 'gigabytealchemy.ai'

// ── the stand-ins ────────────────────────────────────────────────────────────

/** What the capture step stamped, in order — so "the reference moved" is readable. */
interface CaptureLog {
  times: string[]
}

/**
 * A stand-in `1c` that writes what the real one writes.
 *
 * ITS CAPTURE STEP STAMPS A DIFFERENT TIME EVERY CALL, like the real one, and
 * counts its calls. Both matter here: part 1's whole claim is that every press
 * re-captures, and a fake that wrote a fixed time would let a console that
 * quietly kept refolding pass every assertion below.
 */
function fakeSteps(log: CaptureLog): StepRunner {
  return async (step: IterationStep, cwd: string): Promise<StepResult> => {
    const out = (): string => step.argv[step.argv.indexOf('--out') + 1]
    switch (step.name) {
      case 'capture': {
        // READ OFF THE DISK, like the real `1c capture list` — clearing must
        // leave the reference where it is, and a list held in this closure
        // could not tell a console that deleted it from one that did not.
        if (step.argv[1] === 'list') return { code: 0, stdout: JSON.stringify(storedCaptures(cwd)), stderr: '' }
        const url = step.argv[2]
        const dir = path.join(cwd, 'storage', 'references', new URL(url).hostname, 'index')
        mkdirSync(dir, { recursive: true })
        const capturedAt = `2026-09-1${log.times.length + 1}T09:00:00.000Z`
        log.times.push(capturedAt)
        writeFileSync(
          path.join(dir, 'capture.json'),
          JSON.stringify({
            url,
            host: new URL(url).hostname,
            path: '/',
            capturedAt,
            captureSchema: 3,
            sections: [{ index: 1, content: [{ text: 'hello' }], items: [], fields: [] }],
            assets: [],
          }),
        )
        writeFileSync(path.join(dir, 'multistate.json'), JSON.stringify({ url, projections: [{ width: 320 }] }))
        writeFileSync(path.join(dir, 'raw.html'), '<!doctype html><h1>reference</h1>')
        return { code: 0, stdout: JSON.stringify({ url, name: `${new URL(url).hostname}/index`, dir }), stderr: '' }
      }
      case 'page':
        return { code: 0, stdout: JSON.stringify({ ok: true, data: { page: { kind: 'box' } } }), stderr: '' }
      case 'render': {
        mkdirSync(out(), { recursive: true })
        writeFileSync(path.join(out(), 'index.html'), '<!doctype html><title>reproduction</title>')
        return { code: 0, stdout: '', stderr: '' }
      }
      case 'gate': {
        const dir = out()
        mkdirSync(dir, { recursive: true })
        for (const name of ['diff.png', 'diff-blocks.png']) writeFileSync(path.join(dir, name), 'png')
        writeFileSync(path.join(dir, 'regions.json'), JSON.stringify({ meanDiff: 0.7, pctOverThreshold: 0.3, regions: [] }))
        writeFileSync(path.join(dir, 'gate.json'), JSON.stringify({ verdict: 'reproduction-wrong', checks: [] }))
        return { code: 0, stdout: '', stderr: '' }
      }
      default:
        return { code: 0, stdout: '', stderr: '' }
    }
  }
}

/** The bundles on disk, as `1c capture list --json` reports them. */
function storedCaptures(cwd: string): Array<{ name: string; dir: string; url: string; capturedAt: string }> {
  const root = path.join(cwd, 'storage', 'references')
  if (!existsSync(root)) return []
  const found: Array<{ name: string; dir: string; url: string; capturedAt: string }> = []
  for (const host of readdirSync(root)) {
    const dir = path.join(root, host, 'index')
    const file = path.join(dir, 'capture.json')
    if (!existsSync(file)) continue
    const capture = JSON.parse(readFileSync(file, 'utf8')) as { url?: string; capturedAt?: string }
    found.push({ name: `${host}/index`, dir, url: capture.url ?? '', capturedAt: capture.capturedAt ?? '' })
  }
  return found
}

/** A round that answers when the test lets it, so the page can be read mid-round. */
function fakeAi(outcome: AiOutcome, hold?: () => Promise<void>): AiRunner {
  return async (opts: AiRunOptions) => {
    opts.onLine?.('reading gate.json')
    if (hold) await hold()
    return outcome
  }
}

const fakeCommands: CommandRunner = async (command, args) => {
  if (command === 'git') return { code: 0, stdout: '', stderr: '' }
  if (command === 'xgd' && args[1] === 'list') return { code: 0, stdout: '▶ xgd\n{"items":[]}\n◀ xgd', stderr: '' }
  if (command === 'xgd') return { code: 0, stdout: xgdTicketGetJson(), stderr: '' }
  return { code: 0, stdout: 'rail: no worse', stderr: '' }
}

interface Fixture {
  handle: ConsoleHandle
  cwd: string
  captures: CaptureLog
}

async function startConsole(opts: { outcome?: AiOutcome; hold?: () => Promise<void> } = {}): Promise<Fixture> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req299-'))
  const captures: CaptureLog = { times: [] }
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps(captures),
    runAi: fakeAi(opts.outcome ?? { status: 'no-gap', summary: 'nothing to file' }, opts.hold),
    runCommand: fakeCommands,
    env: {},
    port: 0,
  })
  openHandles.push(handle)
  return { handle, cwd, captures }
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

/** Press [recapture] and wait — the console's one verb. */
async function recapture(f: Fixture, url = SITE): Promise<void> {
  await post(f, '/recapture', new URLSearchParams({ url }).toString())
  await f.handle.console.settled()
}

async function diagnose(f: Fixture, n: number): Promise<void> {
  await post(f, `/iteration/${n}/diagnose`)
  await f.handle.console.settled()
}

// ── reading the markup and the disk ──────────────────────────────────────────

/** The group under the iteration list — what acts on the history. */
function group(html: string): string {
  const found = /<section class="continue">[\s\S]*?<\/section>/.exec(html)
  expect(found, 'the controls that act on the list are rendered as one group').not.toBeNull()
  return found![0]
}

/** Rendered markup as a reader sees it: no tags, no entities. */
function visible(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

const workspace = (f: Fixture): string => path.join(f.cwd, CONSOLE_WORKSPACE)
const siteDir = (f: Fixture): string => path.join(workspace(f), slugForUrl(SITE))

/** Every archived chain in the workspace, by directory name. */
function archives(f: Fixture): string[] {
  if (!existsSync(workspace(f))) return []
  return readdirSync(workspace(f)).filter((name) => name.startsWith(`${slugForUrl(SITE)}.cleared-`))
}

/** A round that filed, which is the outcome that holds the loop. */
const FILED: AiOutcome = {
  status: 'filed',
  residualClass: 'capture-drops-control-padding',
  summary: 'the capture discards padding on form controls',
  ticketId: 'REQ-263',
  sessionId: 'session-aaaa',
}

// ── part 1: one verb, in both positions ──────────────────────────────────────

describe('REQ-299 the console offers one verb for producing the next iteration', () => {
  it('test_UAT_FC_REQ_299_recapture_is_the_only_verb_and_stands_in_both_positions', async () => {
    const f = await startConsole()

    // BLANK, and already down to one control: the word is `recapture` here too
    // rather than `capture`, because two labels for one act would put back the
    // which-one-do-I-want question this ticket exists to remove.
    const blank = await page(f)
    expect(blank).toContain('>recapture<')
    expect(blank).not.toContain('reproduce')
    expect(blank).not.toContain('run again')

    // …and the address row really is [recapture]'s: the form that carries the
    // text box posts to the one route.
    expect(blank).toMatch(/<form method="post" action="\/recapture">\s*<input name="url"/)

    // WITH A CHAIN ON SCREEN, the same verb appears again under the list, and
    // the retired pair appears in neither position.
    await recapture(f)
    const html = await page(f)
    expect(group(html)).toContain('>recapture</button>')
    expect(html).not.toContain('>run again</button>')
    expect(html).not.toContain('>reproduce</button>')
    // Two positions, one route.
    expect([...html.matchAll(/action="\/recapture"/g)]).toHaveLength(2)
  })

  it('test_UAT_FC_REQ_299_the_retired_routes_are_gone_from_the_http_surface', async () => {
    // RETIRED, NOT MERELY UNLINKED. A route left answering is a second way to do
    // the thing the page stopped offering — reachable from a bookmark, a
    // back-button re-post or a script — and the whole of part 1 is that there is
    // one way. The console is asked with a chain loaded, which is the state in
    // which both retired routes used to do something.
    const f = await startConsole()
    await recapture(f)
    expect(await page(f)).toContain('<h2>Iteration 1</h2>')

    for (const route of ['/run', '/run-again']) {
      const answer = await post(f, route, new URLSearchParams({ url: SITE }).toString())
      expect(answer.status, route).toBe(404)
    }
    // …and nothing ran: the chain is exactly where it was.
    await f.handle.console.settled()
    expect(await page(f)).not.toContain('<h2>Iteration 2</h2>')
  })

  it('test_UAT_FC_REQ_299_every_press_re_rolls_the_reference_from_either_position', async () => {
    // THE POINT OF THE COLLAPSE. There is no longer any way to fold a stored
    // bundle from the page, so every iteration the console produces is measured
    // at the current capture schema — which is the fact `[run again]` could not
    // disclose and the operator could not check.
    const f = await startConsole()
    await recapture(f) // the address row: begins the chain
    await recapture(f) // under the list: continues it
    await recapture(f)

    const html = await page(f)
    expect(html).toContain('<h2>Iteration 3</h2>')
    // Three presses, three captures, three distinct references.
    expect(f.captures.times).toHaveLength(3)
    expect(new Set(f.captures.times).size).toBe(3)

    // …and each iteration records the reference it really used, so the claim is
    // readable from the artifacts and not only from the call log.
    const stamps = [1, 2, 3].map(
      (n) =>
        (JSON.parse(readFileSync(path.join(siteDir(f), `iteration-${n}`, MANIFEST_FILE), 'utf8')) as {
          bundleCapturedAt?: string
        }).bundleCapturedAt,
    )
    expect(stamps).toEqual(f.captures.times)
  })
})

// ── part 2: clearing the history ─────────────────────────────────────────────

describe('REQ-299 the history can be put down', () => {
  it('test_UAT_FC_REQ_299_clearing_empties_the_page_and_the_next_chain_starts_at_one', async () => {
    const f = await startConsole()
    await recapture(f)
    await recapture(f)
    expect(await page(f)).toContain('<h2>Iteration 2</h2>')

    await post(f, '/clear')

    // THE BLANK STATE THE CONSOLE OPENS IN — a text box and [recapture], and
    // nothing else. Not merely "the rows are gone": the controls that act on a
    // history are gone with it, because a control for a list that does not exist
    // is a control for nothing.
    const cleared = await page(f)
    expect(cleared).not.toContain('Iteration')
    expect(cleared).not.toContain('clear history')
    expect(cleared).not.toContain('<section class="continue">')
    expect(cleared).toContain('>recapture<')

    // …and the next chain begins at 1 rather than resuming the numbering.
    await recapture(f)
    const fresh = await page(f)
    expect(fresh).toContain('<h2>Iteration 1</h2>')
    expect(fresh).not.toContain('<h2>Iteration 3</h2>')
  })

  it('test_UAT_FC_REQ_299_clearing_archives_the_chain_rather_than_deleting_it', async () => {
    // THE PROMISE THE BUTTON MAKES, read off the disk. The chain directory holds
    // the round's transcript, the diffs, the filed ticket ids and the rail
    // results — real evidence — and a press of a button on a page must not
    // destroy it.
    const f = await startConsole({ outcome: FILED })
    await recapture(f)
    await diagnose(f, 1)
    await post(f, '/release')

    const transcript = path.join(siteDir(f), 'iteration-1', AI_DIR, AI_TRANSCRIPT_FILE)
    const before = readFileSync(transcript, 'utf8')
    expect(before).not.toBe('')

    await post(f, '/clear')

    // Moved aside, beside itself, so an operator who opens the workspace
    // directory finds it without being told a second location.
    expect(existsSync(siteDir(f))).toBe(false)
    expect(archives(f)).toHaveLength(1)
    const archived = path.join(workspace(f), archives(f)[0])
    expect(readFileSync(path.join(archived, 'iteration-1', AI_DIR, AI_TRANSCRIPT_FILE), 'utf8')).toBe(before)
    expect(existsSync(path.join(archived, 'iteration-1', MANIFEST_FILE))).toBe(true)
    // The round session travels with the chain, which is right: the next chain
    // is a new chain and its first round starts unresumed.
    expect(existsSync(sessionFile(archived))).toBe(true)

    // AND THE PAGE SAYS WHERE IT WENT. A control whose whole promise is "this is
    // recoverable" has to say what it is recoverable from.
    const read = visible(await page(f))
    expect(read).toContain('History cleared')
    expect(read).toContain(archives(f)[0])

    // A SECOND CHAIN CLEARED IS A SECOND ARCHIVE, not an overwrite of the first.
    await recapture(f)
    await post(f, '/clear')
    expect(archives(f)).toHaveLength(2)
  })

  it('test_UAT_FC_REQ_299_clearing_leaves_the_captured_reference_where_it_is', async () => {
    // A SEPARATE ARTIFACT WITH A SEPARATE LIFECYCLE — the regression rail
    // baselines against it, and the blank page offers it back. Clearing the
    // history is a statement about this page, not about that bundle.
    const f = await startConsole()
    await recapture(f)
    const bundle = path.join(f.cwd, 'storage', 'references', SITE, 'index', 'capture.json')
    const captured = readFileSync(bundle, 'utf8')

    await post(f, '/clear')

    expect(readFileSync(bundle, 'utf8')).toBe(captured)
    // …and it is still offered back on the blank page, which is the operator's
    // way to it (requirement 31): the console asks `1c` on every blank view, so
    // this reads the answer rather than a remembered list.
    const cleared = await page(f)
    expect(cleared).toContain('captured already')
    expect(cleared).toContain(`${SITE}/index`)
  })

  it('test_UAT_FC_REQ_299_clear_is_inert_while_a_round_runs_and_while_the_chain_is_held', async () => {
    // THE SAME INERT RULES AS EVERY OTHER CONTROL ([[REQ-272]] part 1 b3,
    // [[BUG-130]]). Read as markup AND as a refusal, because the disabled
    // attribute is a courtesy and the console's own check is the rule.
    let finish = (): void => {}
    const blocked = new Promise<void>((resolve) => (finish = resolve))
    const f = await startConsole({ outcome: FILED, hold: () => blocked })
    await recapture(f)

    // ── a round is in flight ──────────────────────────────────────────────
    await post(f, '/iteration/1/diagnose')
    const busy = group(await page(f))
    expect(busy).toMatch(/>clear history<\/button>/)
    expect(/<button data-held="1" disabled data-inert="running">clear history<\/button>/.test(busy)).toBe(true)
    expect((await post(f, '/clear')).status).toBe(409)

    // ── the round filed, so the chain is held on the operator ─────────────
    finish()
    await f.handle.console.settled()
    const held = await page(f)
    expect(/<button data-held="1" disabled data-inert="held">clear history<\/button>/.test(group(held))).toBe(true)
    // …and it is named in the sentence that explains the hold, so a greyed
    // control is never one the explanation beside it passes over ([[BUG-130]]).
    expect(visible(/<p class="held">[\s\S]*?<\/p>/.exec(held)![0])).toContain('[clear history]')

    // The refusal is the rule: a press that lands anyway clears nothing and says
    // what to press first.
    await post(f, '/clear')
    const after = await page(f)
    expect(after).toContain('<h2>Iteration 1</h2>')
    expect(archives(f)).toEqual([])
    expect(visible(after)).toContain('Press [the implementation has landed] first')

    // Released, it clears.
    await post(f, '/release')
    await post(f, '/clear')
    expect(await page(f)).not.toContain('Iteration')
    expect(archives(f)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ_299_clearing_a_blank_console_is_a_no_op_that_says_so', async () => {
    // The press that lands on nothing. It must not invent an archive, and it
    // must not read as a failure — there was simply nothing to put down.
    const f = await startConsole()
    await post(f, '/clear')
    const html = await page(f)
    expect(visible(html)).toContain('Nothing to clear')
    expect(html).not.toContain('class="failed"')
    expect(archives(f)).toEqual([])
  })
})
