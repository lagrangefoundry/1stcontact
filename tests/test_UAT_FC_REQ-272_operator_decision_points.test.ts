/**
 * REQ-272 — the two places the loop stops, and a re-capture that keeps the chain.
 *
 * The loop this console drives is expensive in two different currencies. A round
 * costs money — the observed ones run between two and eight dollars — and an
 * iteration costs the operator's attention. [[REQ-256]] spent both without
 * asking: the round started from the iteration finishing ("the links appearing
 * IS the trigger"), and [run again] would happily run the next iteration against
 * an implementation nobody had written yet. This ticket puts a decision in front
 * of each.
 *
 * Part 2 is the other half of the same waste. `1c refold` re-derives the fold
 * from the oracle the bundle already holds, which is exactly right for a FOLD
 * change and cannot work for a CAPTURE change — the axis a capture fix adds is
 * not in an oracle the old extractor wrote. A chain that could only refold
 * therefore re-measured landed fixes as outstanding residuals for as long as it
 * ran, and the only escape was [recapture], which reset the iteration list and
 * threw the chain away.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT, on [[REQ-256]]'s terms. The console, its
 * HTTP surface, the manifests it writes, the digest, the prompt, the session
 * record and every page it serves are the real thing. What is substituted is
 * what a test must not have: a headless browser (`1c`), a billed model
 * (`claude`), and the commands the console asks the machine about (`git`,
 * `xgd`) — each through the seam the console already had.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  AI_DIGEST_FILE,
  AI_DIR,
  AI_PROMPT_FILE,
  AI_RELEASE_FILE,
  CONSOLE_WORKSPACE,
  bundleLabel,
  slugForUrl,
} from '../tools/repro-console/src/console'
import { MANIFEST_FILE, type IterationManifest } from '../tools/repro-console/src/iteration'
import { readBundleProvenance } from '../tools/repro-console/src/bundle'
import { readSession } from '../tools/repro-console/src/session'
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

/** Every capture the fake `1c` has taken, so `capture list` can answer for them. */
interface CaptureLog {
  /** What the capture step stamped into `capture.json`, in order. */
  times: string[]
}

/**
 * A stand-in `1c` that writes what the real one writes.
 *
 * ITS CAPTURE STEP STAMPS A DIFFERENT TIME EVERY CALL, which is the whole point
 * of it here: the real one writes `capturedAt: new Date().toISOString()` and
 * overwrites the bundle in place, so "the reference moved" is a fact about that
 * field and about nothing else on disk. A fake that wrote a fixed time would let
 * a console that never noticed the move pass every assertion below.
 */
function fakeSteps(log: CaptureLog, verdict = 'reproduction-wrong', unstamped = false): StepRunner {
  return async (step: IterationStep, cwd: string): Promise<StepResult> => {
    const out = (): string => step.argv[step.argv.indexOf('--out') + 1]
    switch (step.name) {
      case 'capture': {
        // READ OFF THE DISK, like the real `1c capture list`. A list held in
        // this closure would be empty in a SECOND console started on the same
        // workspace, and "the console restarted and found its work again" is
        // one of the things under test.
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
            // A BUNDLE FROM BEFORE THE STAMP EXISTED. `unstamped` is how the
            // third of this file's three provenance states is reached now that
            // every press re-captures ([[REQ-299]] part 1): blanking the file
            // after a run no longer survives the next press, because the next
            // press rewrites it. Writing it unstamped in the first place is
            // also the more faithful fake — it is what an older `1c` produced.
            ...(unstamped ? {} : { capturedAt, captureSchema: 3 }),
            sections: [{ index: 1 }],
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
        writeFileSync(path.join(dir, 'values-diff.json'), JSON.stringify({ matched: 4, unmatched: 0, deltas: [] }))
        writeFileSync(
          path.join(dir, 'gate.json'),
          JSON.stringify({
            pass: false,
            verdict,
            diagnosis: 'the pixels disagree',
            nextStep: 'diagnose the fold',
            perceptual: { meanDiff: 0.7, pctOverThreshold: 0.3, regions: 0 },
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

/** Every round the console started, and what it was asked. */
interface AiLog {
  calls: number
  prompts: string[]
  resumes: Array<string | undefined>
}

function fakeAi(
  log: AiLog,
  outcome: AiOutcome | ((call: number) => AiOutcome),
  hold?: () => Promise<void>,
): AiRunner {
  return async (opts: AiRunOptions) => {
    log.calls += 1
    log.prompts.push(opts.prompt)
    log.resumes.push(opts.resume)
    opts.onLine('reading gate.json')
    if (hold) await hold()
    return typeof outcome === 'function' ? outcome(log.calls) : outcome
  }
}

/** What the machine answers. `git log` is the one that matters here. */
function fakeCommands(opts: { gitLog?: string; log?: string[][] } = {}): CommandRunner {
  return async (command, args) => {
    opts.log?.push([command, ...args])
    if (command === 'git' && args[0] === 'log') return { code: 0, stdout: opts.gitLog ?? '', stderr: '' }
    if (command === 'git') return { code: 0, stdout: '', stderr: '' }
    if (command === 'xgd' && args[1] === 'list') return { code: 0, stdout: '▶ xgd\n{"items":[]}\n◀ xgd', stderr: '' }
    if (command === 'xgd') return { code: 0, stdout: xgdTicketGetJson(), stderr: '' }
    return { code: 0, stdout: 'rail: no worse', stderr: '' }
  }
}

interface Fixture {
  handle: ConsoleHandle
  cwd: string
  ai: AiLog
  captures: CaptureLog
}

async function startConsole(
  opts: {
    outcome?: AiOutcome | ((call: number) => AiOutcome)
    verdict?: string
    gitLog?: string
    cwd?: string
    /** Holds the round open, so the page can be read — and pressed — mid-round. */
    hold?: () => Promise<void>
    /** Capture a bundle carrying no `capturedAt` — an older `1c`'s output. */
    unstamped?: boolean
  } = {},
): Promise<Fixture> {
  const cwd = opts.cwd ?? mkdtempSync(path.join(tmpdir(), 'req272-'))
  const ai: AiLog = { calls: 0, prompts: [], resumes: [] }
  const captures: CaptureLog = { times: [] }
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps(captures, opts.verdict, opts.unstamped ?? false),
    runAi: fakeAi(ai, opts.outcome ?? { status: 'no-gap', summary: 'nothing to file' }, opts.hold),
    runCommand: fakeCommands({ ...(opts.gitLog === undefined ? {} : { gitLog: opts.gitLog }) }),
    env: {},
    port: 0,
  })
  openHandles.push(handle)
  return { handle, cwd, ai, captures }
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
 * Press [recapture] and wait.
 *
 * [[REQ-299]] part 1 left one verb. `reproduce` and `again` are the same POST as
 * `recapture`, named for the position the press came from — the address row and
 * the control under the iteration list — because the tests below are about which
 * press the operator made, and that is still a real distinction even though the
 * request is now the same one.
 */
async function recapture(f: Fixture, url = SITE): Promise<void> {
  await post(f, '/recapture', new URLSearchParams({ url }).toString())
  await f.handle.console.settled()
}

const reproduce = recapture
const again = recapture

async function diagnose(f: Fixture, n: number): Promise<void> {
  await post(f, `/iteration/${n}/diagnose`)
  await f.handle.console.settled()
}

const siteDir = (f: Fixture): string => path.join(f.cwd, CONSOLE_WORKSPACE, slugForUrl(SITE))

function manifest(f: Fixture, n: number): IterationManifest {
  return JSON.parse(readFileSync(path.join(siteDir(f), `iteration-${n}`, MANIFEST_FILE), 'utf8')) as IterationManifest
}

/** A round that filed, which is the outcome that holds the loop. */
const FILED: AiOutcome = {
  status: 'filed',
  residualClass: 'capture-drops-control-padding',
  summary: 'the capture discards padding on form controls',
  ticketId: 'REQ-263',
  sessionId: 'session-aaaa',
}

// ── part 1, behaviours 1 and 2: the round starts from a button ───────────────

describe('REQ-272 a finished iteration is idle until the operator says otherwise', () => {
  it('test_UAT_FC_REQ_272_the_iteration_finishes_with_its_links_and_no_round_and_the_button_starts_one', async () => {
    // BOTH HALVES, WHICH IS WHAT THE TICKET ASKS FOR. Either alone is passable
    // by a broken console: one that never diagnoses passes the first, and one
    // that diagnoses twice passes the second.
    const f = await startConsole({ outcome: FILED })
    await reproduce(f)

    // Half one — the iteration is complete, every link is live, and no round
    // has been started by anything.
    const idle = await page(f)
    expect(idle).toContain('<h2>Iteration 1</h2>')
    expect(idle).toContain(`https://${SITE}`)
    expect(idle).toContain('/iteration/1/site/')
    expect(idle).toContain('/iteration/1/diff/')
    expect(idle).toContain('/iteration/1/page')
    expect(f.ai.calls).toBe(0)
    expect(idle).not.toContain('AI — ')
    expect(((await (await get(f, '/state')).json()) as { running: boolean }).running).toBe(false)

    // …and the console offers the press that starts one.
    expect(idle).toContain('action="/iteration/1/diagnose"')
    expect(idle).toContain('diagnose this')

    // Half two — pressing it runs exactly one round, and everything the round
    // already did it still does: the transcript, the outcome, the ticket link.
    await diagnose(f, 1)
    expect(f.ai.calls).toBe(1)
    const after = await page(f)
    expect(after).toContain('AI — filed')
    expect(after).toContain('capture-drops-control-padding')
    expect(after).toContain('the gap ticket (REQ-263)')
    expect(after).toContain('reading gate.json')
    // The button is gone from an iteration whose round reached an answer: there
    // is nothing left for a second round to find and it would cost the same.
    expect(after).not.toContain('action="/iteration/1/diagnose"')
  })

  it('test_UAT_FC_REQ_272_capture_incomplete_still_stops_and_a_second_press_starts_nothing', async () => {
    // Behaviour 4 — nothing already true of the round changes. The two parts of
    // it that a moved trigger could plausibly have broken are the ones asserted:
    // the verdict that must file nothing still files nothing (and it is the
    // CONSOLE that decides, so pressing the button harder cannot spend a round
    // on an invalid oracle), and a round still cannot start on top of another.
    const f = await startConsole({ outcome: FILED, verdict: 'capture-incomplete' })
    await reproduce(f)
    await diagnose(f, 1)

    expect(f.ai.calls).toBe(0)
    const html = await page(f)
    expect(html).toContain('AI — stopped')
    expect(html).toContain('re-capture the site')
    expect(html).not.toContain('the gap ticket')

    // Behaviour 10's interlock, unchanged: the round holds `running` for its
    // whole length, so the second press is refused rather than queued.
    let finish = (): void => {}
    const held = new Promise<void>((resolve) => (finish = resolve))
    const slow = await startConsole({ outcome: FILED, hold: () => held })
    await reproduce(slow)
    await post(slow, '/iteration/1/diagnose')
    const second = await post(slow, '/iteration/1/diagnose')
    expect(second.status).toBe(409)
    // …and so is the press that would advance the loop underneath it.
    expect((await post(slow, '/recapture', new URLSearchParams({ url: SITE }).toString())).status).toBe(409)
    finish()
    await slow.handle.console.settled()
    expect(slow.ai.calls).toBe(1)
  })
})

// ── part 1, behaviour 3: the hold ────────────────────────────────────────────

describe('REQ-272 the loop is held until the implementation lands', () => {
  it('test_UAT_FC_REQ_272_the_continuation_is_inert_after_a_filing_and_says_what_it_waits_for', async () => {
    const f = await startConsole({ outcome: FILED })
    await reproduce(f)
    await diagnose(f, 1)

    // It says what it is waiting for, by name, on the page.
    const held = await page(f)
    expect(held).toContain('REQ-263')
    expect(held).toMatch(/held until that implementation lands/)
    expect(held).toContain('the implementation has landed')
    // And the button is really inert, not merely styled as such: the poller
    // re-enables what `running` disabled, so the hold has to be on the wire too.
    expect(held).toMatch(/data-held="1" disabled/)
    expect(((await (await get(f, '/state')).json()) as { held: boolean }).held).toBe(true)

    // The press that lands in the gap starts nothing — the disabled button is a
    // courtesy and the refusal is the rule.
    await again(f)
    expect(await page(f)).not.toContain('<h2>Iteration 2</h2>')
    expect(await page(f)).toContain('Press [the implementation has landed] first')

    // Released, the next iteration runs.
    await post(f, '/release')
    const free = await page(f)
    expect(free).not.toMatch(/held until that implementation lands/)
    await again(f)
    expect(await page(f)).toContain('<h2>Iteration 2</h2>')
  })

  it('test_UAT_FC_REQ_272_the_hold_survives_a_restart_of_the_console', async () => {
    // The operator this is written for is the one who comes back later to a
    // button that does nothing, and "later" routinely includes a restart. A hold
    // only this process remembered would evaporate at exactly that moment and
    // the loop would advance past a ticket nobody had implemented.
    const first = await startConsole({ outcome: FILED })
    await reproduce(first)
    await diagnose(first, 1)
    await first.handle.close()
    openHandles.length = 0

    const second = await startConsole({ outcome: FILED, cwd: first.cwd })
    // The blank page is what asks `1c` which captures exist (requirement 31);
    // [open] picks from that answer, so it is a visit and then a press.
    await page(second)
    await post(second, '/open', new URLSearchParams({ url: SITE }).toString())
    const revived = await page(second)
    expect(revived).toContain('<h2>Iteration 1</h2>')
    expect(revived).toMatch(/held until that implementation lands/)
    await again(second)
    expect(await page(second)).not.toContain('<h2>Iteration 2</h2>')

    // The release is recorded beside the round it releases, for the same reason.
    await post(second, '/release')
    expect(existsSync(path.join(siteDir(second), 'iteration-1', AI_DIR, AI_RELEASE_FILE))).toBe(true)
    await again(second)
    expect(await page(second)).toContain('<h2>Iteration 2</h2>')
  })

  it('test_UAT_FC_REQ_272_a_round_that_filed_nothing_holds_nothing', async () => {
    // The hold is about an implementation that was ASKED FOR. A round that found
    // no gap asked for none, so holding after it would be the console inventing
    // a wait — which is worse than not holding at all, because the operator
    // would learn to press through the hold.
    const f = await startConsole({ outcome: { status: 'no-gap', summary: 'nothing the engine got wrong' } })
    await reproduce(f)
    await diagnose(f, 1)
    expect(await page(f)).not.toMatch(/held until that implementation lands/)
    await again(f)
    expect(await page(f)).toContain('<h2>Iteration 2</h2>')
  })
})

// ── part 2: a re-capture that keeps the chain ────────────────────────────────

describe('REQ-272 re-capture moves the reference and keeps the chain', () => {
  it('test_UAT_FC_REQ_272_recapture_appends_a_marked_iteration_and_keeps_the_earlier_ones', async () => {
    const f = await startConsole({ outcome: { status: 'no-gap', summary: 'looked' } })
    await reproduce(f)
    await again(f)
    expect(await page(f)).toContain('<h2>Iteration 2</h2>')

    // THE SEAM IS NOW THE NORM ([[REQ-299]] part 1). Two presses, two captures:
    // with [run again] retired there is no press that refolds, so the second
    // iteration already carries the mark that used to distinguish a re-capture
    // from an ordinary continuation. The marking is kept for exactly the reason
    // [[REQ-272]] part 2 introduced it — the numbers really are not comparable —
    // and a page that stopped marking it because it had become usual would be
    // claiming a comparability it cannot offer.
    expect(f.captures.times).toHaveLength(2)
    expect(manifest(f, 2).recaptured).toBe(true)
    expect(manifest(f, 2).bundleCapturedAt).toBe(f.captures.times[1])

    await recapture(f)

    // THE CHAIN CONTINUED. Iteration 3, with 1 and 2 still on the page and
    // still serving their own artifacts — which is the whole point: the
    // question "did the capture fix move the numbers" needs the iterations from
    // before the fix beside the one after it.
    const html = await page(f)
    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).toContain('<h2>Iteration 2</h2>')
    expect(html).toContain('<h2>Iteration 3</h2>')
    expect((await get(f, '/iteration/1/page')).status).toBe(200)

    // THE REFERENCE REALLY MOVED, and the new iteration says so — on the page,
    // and in its own `iteration.json`, because its numbers are not comparable
    // with iteration 2's the way a refold's are.
    expect(f.captures.times).toHaveLength(3)
    expect(manifest(f, 3).recaptured).toBe(true)
    expect(manifest(f, 3).bundleCapturedAt).toBe(f.captures.times[2])
    expect(html).toContain('re-captured')
    expect(html).toContain("not comparable with iteration 2's")

    // …and every iteration names the bundle it used and when that bundle was
    // taken, so the chain reads as one chain with a marked seam rather than as a
    // score that jumped for no reason.
    expect(html).toContain(bundleLabel(manifest(f, 1).bundleDir))
    expect(html).toContain(f.captures.times[0])
    expect(html).toContain(f.captures.times[1])
    expect(html).toContain(f.captures.times[2])
  })

  it('test_UAT_FC_REQ_272_every_continuation_cuts_the_resume_chain', async () => {
    // `session.ts`'s reset rule 1 has always said "a different bundle, OR THE
    // SAME SITE RE-CAPTURED", and until [[REQ-272]] part 2 the second half could
    // not fire: a bundle's name is URL-derived and overwriting, so `bundleDir`
    // is the same string either side of a re-capture. A round resumed across one
    // would be reasoning from remembered numbers about a page that no longer
    // exists, which is the brief's one rule turned against the mechanism.
    //
    // [[REQ-299]] part 1 makes the rule fire on EVERY continuation, because
    // every continuation now re-captures. That is a real cost — [[REQ-261]]'s
    // resume no longer reaches across iterations of a chain — and it is the
    // correct behaviour rather than a regression: the reason a resumed round
    // cannot be trusted across a moved reference does not weaken because the
    // reference now moves every time.
    const f = await startConsole({ outcome: { status: 'no-gap', summary: 'looked', sessionId: 'session-aaaa' } })
    await reproduce(f)
    await diagnose(f, 1)
    await again(f)
    await diagnose(f, 2)
    expect(f.ai.resumes[1]).toBeUndefined()

    await recapture(f)
    await diagnose(f, 3)
    expect(f.ai.resumes[2]).toBeUndefined()
    // The record still follows the reference the last round actually measured
    // against, so the mechanism is cutting the chain rather than being broken.
    expect(readSession(siteDir(f))?.capturedAt).toBe(f.captures.times[2])
  })

  it('test_UAT_FC_REQ_272_recapture_on_a_different_site_still_starts_a_new_chain', async () => {
    // [recapture] keeps the chain because the address names the site already on
    // the page. Typing a different one is a new reference for a new site, and
    // appending its first iteration to another site's chain would be a list of
    // two unrelated things. With one verb left ([[REQ-299]] part 1) the ADDRESS
    // is the whole of what decides this, which is what makes it worth asserting
    // on its own rather than as a property of a button nobody presses by
    // accident.
    const f = await startConsole({ outcome: { status: 'no-gap', summary: 'looked' } })
    await reproduce(f)
    await again(f)
    await recapture(f, 'example.com')

    const html = await page(f)
    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).not.toContain('<h2>Iteration 2</h2>')
    expect(html).toContain('example.com')
    expect(manifest(f, 1).recaptured).toBeUndefined()
  })
})

// ── part 2, item 3: the reference's own age ──────────────────────────────────

describe('REQ-272 a round can tell how old the reference it is measuring against is', () => {
  it('test_UAT_FC_REQ_272_the_round_is_handed_the_capture_time_and_what_landed_after_it', async () => {
    // The finding that made this a ticket cost one round $7.70 and 78 turns:
    // "the reference bundle was captured 70 minutes before the commit that fixed
    // the residuals measured against it". Both halves of that were on this disk
    // the whole time — the bundle's own `capturedAt`, and the engine's log — so
    // the console counts them once and hands the answer over.
    const f = await startConsole({
      outcome: { status: 'no-gap', summary: 'looked' },
      gitLog: 'abc1234 2026-09-16 fix(capture): keep form-control padding\ndef5678 2026-09-16 fix(capture): retain href',
    })
    await reproduce(f)
    await diagnose(f, 1)

    const round = path.join(siteDir(f), 'iteration-1', AI_DIR)
    const digest = readFileSync(path.join(round, AI_DIGEST_FILE), 'utf8')
    const prompt = readFileSync(path.join(round, AI_PROMPT_FILE), 'utf8')

    // FROM THE BUNDLE ITSELF. The capture time and the extractor schema are what
    // `1c capture page` stamped; nothing here was told them by an operator.
    const provenance = readBundleProvenance(manifest(f, 1).bundleDir)
    expect(provenance.capturedAt).toBe(f.captures.times[0])
    expect(digest).toContain(provenance.capturedAt as string)
    expect(digest).toContain('capture schema')
    expect(prompt).toContain(provenance.capturedAt as string)

    // …and what landed after it, so "is this residual already fixed" is a read
    // rather than a deduction from commit timestamps.
    expect(digest).toContain('fix(capture): keep form-control padding')
    expect(digest).toContain('2 commit(s) have landed')
    expect(prompt).toContain('2 commit(s) have landed')
    // The consequence is stated, because it is the part a round gets wrong: a
    // refold cannot pick a capture fix up, however many times it runs.
    expect(prompt).toMatch(/re-capture/i)
  })

  it('test_UAT_FC_REQ_272_a_quiet_engine_and_an_unstamped_bundle_each_say_which_they_are', async () => {
    // Three states, and the round must be able to tell them apart: nothing
    // landed, something landed, and the bundle cannot say when it was taken.
    // Collapsing the third into the first would be the console asserting a fact
    // it does not have — the dangerous direction, because "nothing landed since"
    // reads as permission to file.
    const quiet = await startConsole({ outcome: { status: 'no-gap', summary: 'looked' }, gitLog: '' })
    await reproduce(quiet)
    await diagnose(quiet, 1)
    const quietDigest = readFileSync(
      path.join(siteDir(quiet), 'iteration-1', AI_DIR, AI_DIGEST_FILE),
      'utf8',
    )
    expect(quietDigest).toContain('Nothing has landed in the engine since this reference was captured')

    // An older bundle: no `capturedAt`, no `captureSchema`. Both absences are
    // reported as absences rather than defaulted away.
    //
    // THE ABSENCE IS CAPTURED, NOT RETRO-FITTED. An iteration remembers the time
    // it really ran against, so blanking `capture.json` after a run cannot make
    // that run read as unstamped — and since [[REQ-299]] part 1 it cannot make
    // the NEXT run read that way either, because every press re-captures and
    // rewrites the file. So the fake writes the bundle unstamped to begin with,
    // which is what an older `1c` did.
    const blind = await startConsole({ outcome: { status: 'no-gap', summary: 'looked' }, unstamped: true })
    await reproduce(blind)
    await diagnose(blind, 1)
    const blindRound = path.join(siteDir(blind), 'iteration-1', AI_DIR)
    expect(readFileSync(path.join(blindRound, AI_DIGEST_FILE), 'utf8')).toContain('carries no capture time')
    expect(readFileSync(path.join(blindRound, AI_PROMPT_FILE), 'utf8')).toContain('carries no capture time')
    expect(readFileSync(path.join(blindRound, AI_DIGEST_FILE), 'utf8')).toContain('unstamped')
  })
})
