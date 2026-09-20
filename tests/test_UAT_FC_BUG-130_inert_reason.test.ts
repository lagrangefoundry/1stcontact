/**
 * BUG-130 — a held control and a working one are the same greyed button.
 *
 * The console disables a control for two unrelated reasons. A round is in
 * flight, and the machine is working: *wait* is the instruction, and a progress
 * cursor is the right word for it. Or the loop is held ([[REQ-272]] part 1,
 * behaviour 3) because the last round filed a ticket nobody has said landed yet:
 * nothing is working, the console is waiting on the OPERATOR, and the
 * instruction is the opposite one.
 *
 * `page.ts` had a single rule — `button[disabled] { cursor: progress }` — and so
 * said *wait* for both. An operator who came back to a held console reported it
 * as a hang and stopped, which is the expensive half: the sentence explaining
 * the hold and the button that lifts it were one element above the greyed
 * buttons being stared at, and the cursor had already told them not to read on.
 * The implementation the hold was waiting for had in fact landed. The loop
 * stalled on a press nobody knew was theirs to make.
 *
 * So these tests read the page for WHY a control is inert, and they read it in
 * both states — a round genuinely in flight, and a held loop with nothing
 * running — because a page that called everything busy and a page that called
 * everything held are each passable by half of this. They also run the console's
 * OWN poller against the console's OWN `/state`, since the poller re-computes
 * `disabled` every second between reloads and a reason computed only at render
 * time would be a lie one second after a round ends.
 *
 * And they re-assert, through the same page, that the hold itself has not moved:
 * what holds, when it lifts, and the `data-held="1" disabled` pair [[REQ-272]]
 * and [[BUG-120]] stand on are all unchanged.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT, on [[REQ-254]]'s terms: the console, its
 * HTTP surface, the page it serves and the poll script that page ships are the
 * real thing — the script under test is extracted FROM the served page, not
 * imported from a module the browser never sees. Substituted is what a test must
 * not have: a headless browser (`1c`), a billed model (`claude`), and the
 * commands the console asks the machine about.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { CAPTURE_SCHEMA } from '../tools/generate/src/cli/capture/schema'
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

/** A stand-in `1c` that writes what the real one writes, at the schema asked for. */
function fakeSteps(captureSchema: number): StepRunner {
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
            host: new URL(url).hostname,
            path: '/',
            capturedAt: '2026-09-18T09:00:00.000Z',
            captureSchema,
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
}

async function startConsole(
  opts: { captureSchema?: number; outcome?: AiOutcome; hold?: () => Promise<void> } = {},
): Promise<Fixture> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'bug130-'))
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps(opts.captureSchema ?? CAPTURE_SCHEMA),
    runAi: fakeAi(opts.outcome ?? { status: 'no-gap', summary: 'nothing to file' }, opts.hold),
    runCommand: fakeCommands,
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

async function reproduce(f: Fixture, url = SITE): Promise<void> {
  await post(f, '/run', new URLSearchParams({ url }).toString())
  await f.handle.console.settled()
}

async function diagnose(f: Fixture, n: number): Promise<void> {
  await post(f, `/iteration/${n}/diagnose`)
  await f.handle.console.settled()
}

// ── reading the markup ───────────────────────────────────────────────────────

/** The group [[BUG-120]] put the two continuations in. */
function continuation(html: string): string {
  const found = /<section class="continue">[\s\S]*?<\/section>/.exec(html)
  expect(found, 'the continuations are rendered as one group').not.toBeNull()
  return found![0]
}

/** Every `<button …>` open tag on the page, in document order. */
const buttonTags = (html: string): string[] => [...html.matchAll(/<button[^>]*>/g)].map(([tag]) => tag)

/** What each inert control on the page says its reason is. */
const reasons = (html: string): string[] =>
  buttonTags(html)
    .filter((tag) => tag.includes(' disabled'))
    .map((tag) => /data-inert="([^"]+)"/.exec(tag)?.[1] ?? '(none)')

/** Rendered markup as a reader sees it: no tags, no entities. */
function visible(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/** A round that filed, which is the outcome that holds the loop. */
const FILED: AiOutcome = {
  status: 'filed',
  residualClass: 'capture-drops-control-padding',
  summary: 'the capture discards padding on form controls',
  ticketId: 'REQ-263',
  sessionId: 'session-aaaa',
}

// ── behaviours 1 and 2: the two ways a control can be inert ──────────────────

describe('BUG-130 the page says WHY a control is inert, and the two reasons differ', () => {
  it('test_UAT_FC_BUG_130_a_round_in_flight_and_a_held_loop_are_different_states_in_the_markup', async () => {
    // BOTH STATES IN ONE TEST, because either alone is passable by a page that
    // learned one word: a console that stamped `running` on everything passes
    // the first half, and one that stamped `held` on everything passes the
    // second. The defect was exactly a page with one word for two states.
    let finish = (): void => {}
    const blocked = new Promise<void>((resolve) => (finish = resolve))
    const f = await startConsole({ outcome: FILED, hold: () => blocked })
    await reproduce(f)

    // ── the machine is working ────────────────────────────────────────────
    await post(f, '/iteration/1/diagnose')
    const busy = await page(f)
    expect(((await (await get(f, '/state')).json()) as { running: boolean }).running).toBe(true)

    // Every inert control says the same true thing: something is running.
    expect(reasons(busy).length).toBeGreaterThan(0)
    expect(new Set(reasons(busy))).toEqual(new Set(['running']))
    // …including [reproduce], which the hold never touches and a round does.
    expect(/<form method="post" action="\/run">[\s\S]*?<button disabled data-inert="running">/.test(busy)).toBe(true)

    // ── the machine is waiting on the operator ────────────────────────────
    finish()
    await f.handle.console.settled()
    const held = await page(f)
    expect(((await (await get(f, '/state')).json()) as { running: boolean; held: boolean })).toMatchObject({
      running: false,
      held: true,
    })

    // Nothing is working, and no control on the page claims to be. Read off the
    // BUTTONS rather than the document: the stylesheet names both reasons on
    // every page by construction, and a test that could not tell a rule from an
    // element would pass on a console that never stopped saying `running`.
    expect(new Set(reasons(held))).toEqual(new Set(['held']))
    expect(buttonTags(held).filter((tag) => tag.includes('data-inert="running"'))).toEqual([])
    // The two controls the hold gates are the two the group holds, and both say so.
    const group = continuation(held)
    expect([...group.matchAll(/data-inert="held"/g)]).toHaveLength(2)
    // [[REQ-272]] and [[BUG-120]] read this pair as contiguous text. Adding a
    // fact to the markup does not get to invalidate the evidence standing on it.
    expect([...group.matchAll(/data-held="1" disabled/g)]).toHaveLength(2)

    // AND THE ONE PRESS THAT IS AVAILABLE IS NOT GREYED. The whole failure was
    // an operator concluding the page was stuck; a release button that looked
    // inert alongside the rest would have left them exactly as stuck.
    const release = /<form method="post" action="\/release">[\s\S]*?<\/form>/.exec(held)
    expect(release, 'the release is on the page while the loop is held').not.toBeNull()
    expect(release![0]).not.toContain('disabled')
    expect(release![0]).not.toContain('data-inert')
  })

  it('test_UAT_FC_BUG_130_the_stylesheet_says_wait_only_for_the_state_that_is_working', async () => {
    // THE DEFECT ITSELF, in the one place it lived. The operator never read the
    // markup — they read a spinning cursor on a console that was idle, which is
    // the console's word for "the machine is working", and stopped.
    const f = await startConsole({ outcome: FILED })
    await reproduce(f)
    const css = /<style>([\s\S]*?)<\/style>/.exec(await page(f))![1]

    // `progress` is reachable only through the busy reason…
    const progress = css.match(/^.*cursor: progress.*$/gm) ?? []
    expect(progress).toHaveLength(1)
    expect(progress[0]).toContain('[data-inert="running"]')
    // …and the blanket rule for a disabled control no longer claims to be busy.
    expect(css).toMatch(/button\[disabled\] \{ cursor: not-allowed/)
    expect(css).not.toMatch(/button\[disabled\] \{ cursor: progress/)
  })
})

// ── behaviour 1, the clause the poller owns ──────────────────────────────────

describe('BUG-130 the reason survives a poll tick, like the hold it explains', () => {
  it('test_UAT_FC_BUG_130_the_consoles_own_poll_script_re_computes_the_reason_with_the_state', async () => {
    // A reason computed only at render time goes stale one second after a round
    // ends: the poller re-enables what `running` disabled, leaves the held
    // control inert — and, without this, leaves it still claiming to be busy.
    // That is the exact moment the reported operator arrived at.
    //
    // So the script under test is the one the page SHIPS, pulled out of the
    // served HTML rather than imported, and it is run against the console's real
    // `/state`. The DOM is the only stand-in: a button is the two fields the
    // script touches.
    const f = await startConsole({ outcome: FILED })
    await reproduce(f)
    await diagnose(f, 1)
    const html = await page(f)
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1]
    const version = Number(/data-version="(\d+)"/.exec(html)![1])

    // Two buttons, as the page renders them: a continuation the hold gates, and
    // the release it does not.
    const continuations = { dataset: { held: '1' } as Record<string, string>, disabled: false }
    const release = { dataset: {} as Record<string, string>, disabled: false }
    // Stale on purpose — the round that just ended left this behind, and the
    // tick has to correct it rather than merely leave it disabled.
    continuations.dataset.inert = 'running'

    let ticked = (): void => {}
    const tick = new Promise<void>((resolve) => (ticked = resolve))
    const doc = {
      body: { dataset: { version: String(version) } },
      getElementById: (): Record<string, unknown> => ({}),
      querySelectorAll: (): unknown[] => [continuations, release],
    }
    const relative = (input: string): Promise<Response> => fetch(new URL(input, f.handle.url))
    new Function('fetch', 'document', 'location', 'setTimeout', script)(
      relative,
      doc,
      { reload: (): void => expect.unreachable('the version did not move, so the poller must not reload') },
      () => ticked(),
    )
    await tick

    // The gated control stays inert — [[REQ-272]] part 1, behaviour 3, which
    // this must not break — and now says the true reason rather than the stale one.
    expect(continuations.disabled).toBe(true)
    expect(continuations.dataset.inert).toBe('held')
    // The ungated one is released by the same tick, and carries no leftover reason.
    expect(release.disabled).toBe(false)
    expect(release.dataset.inert).toBeUndefined()
  })
})

// ── behaviour 3: the sentence names both controls it holds ───────────────────

describe('BUG-130 the hold names both continuations it holds', () => {
  it('test_UAT_FC_BUG_130_the_hold_sentence_names_run_again_and_recapture_together', async () => {
    // [recapture] was always held — it carries `data-held="1"`, the poller keys
    // on that, and [[BUG-120]] grouped the two because they are the same kind of
    // act — and the sentence named only [run again], predating the grouping.
    const f = await startConsole({ outcome: FILED })
    await reproduce(f)
    await diagnose(f, 1)
    const notice = /<p class="held">[\s\S]*?<\/p>/.exec(await page(f))
    expect(notice, 'the hold says what it is waiting for').not.toBeNull()
    const read = visible(notice![0])

    expect(read).toContain('[run again] and [recapture]')
    // What it is waiting for, by name, and how to lift it — [[REQ-272]]'s, unchanged.
    expect(read).toContain('REQ-263')
    expect(read).toMatch(/held until that implementation lands/)
    expect(read).toContain('the implementation has landed')
  })

  it('test_UAT_FC_BUG_130_a_stale_reference_and_the_hold_do_not_point_at_different_buttons', async () => {
    // The state the report came from, and the reason the omission was not
    // cosmetic. Against a bundle behind the extractor, [recapture] is the control
    // that can move the numbers and [run again] provably cannot: the page warned
    // about the reference, offered two controls, and then explained the hold in
    // terms of the one that is not the answer.
    const f = await startConsole({ captureSchema: 1, outcome: FILED })
    await reproduce(f)
    await diagnose(f, 1)
    const html = await page(f)

    expect(continuation(html)).toContain('class="stale-reference"')
    expect(visible(html)).toContain('[run again] and [recapture]')
    // Both are held, both say so, and neither is described as busy.
    expect(new Set(reasons(html))).toEqual(new Set(['held']))
  })
})
