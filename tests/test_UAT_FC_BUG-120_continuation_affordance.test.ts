/**
 * BUG-120 — [recapture] is a continuation verb, rendered in the restart position.
 *
 * The console has three verbs and two kinds. [run again] re-folds the reference
 * this chain already has; [recapture] re-hits the site, re-rolls the reference
 * and appends anyway, marking the seam ([[REQ-272]] part 2); [reproduce] is the
 * only one that can begin a list. The console has always KNOWN which two are
 * alike — both carry `data-held="1"` and both go inert under the hold, while
 * [reproduce] does not — and the page rendered them at opposite ends of itself
 * regardless: [recapture] pinned beside the address box above everything, where
 * position reads "start over", and [run again] alone under a history that grows
 * taller every round.
 *
 * The price is not cosmetic. A refold cannot recover an axis the stored oracle
 * never had, so against a bundle behind the extractor every [run again]
 * re-measures a residual whose fix has already landed — for as long as the
 * operator keeps pressing it, because the one button that would have shown the
 * fix looked like it would destroy the history.
 *
 * So these tests read the MARKUP: which controls share a container, what each
 * says about itself in text a reader can see without hovering, and what the page
 * says about the reference at the moment the choice is made. And they re-assert,
 * through the same page, that nothing the three verbs DO has moved — the POST
 * targets, the hold, and the `recaptured` seam are [[REQ-272]]'s and stay its.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT, on [[REQ-254]]'s terms: the console, its
 * HTTP surface, the page it serves and the manifests it writes are the real
 * thing. Substituted is what a test must not have — a headless browser (`1c`)
 * and the commands the console asks the machine about.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { CONSOLE_WORKSPACE, slugForUrl } from '../tools/repro-console/src/console'
import { MANIFEST_FILE, type IterationManifest } from '../tools/repro-console/src/iteration'
import { CAPTURE_SCHEMA, staleCaptureDetail } from '../tools/generate/src/cli/capture/schema'
import type { Capture } from '../tools/generate/src/cli/capture/types'
import type { AiOutcome, AiRunner } from '../tools/repro-console/src/ai'
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

/**
 * A stand-in `1c` whose capture step stamps a schema the test chooses.
 *
 * The stamp is the whole point of it here: "is the loaded reference behind the
 * extractor" is a fact about `captureSchema` and about nothing else on disk, and
 * a fake that always wrote the current one could not tell a console that never
 * looked from one that did. The bundle it writes is otherwise shaped like a real
 * one — sections carrying `content`, `items` and `fields` — because the axis
 * probe walks exactly those, and a thinner bundle would be answered by the
 * console's guard rather than by the registry.
 */
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

/** A round that answers instantly and spends nothing. */
function fakeAi(outcome: AiOutcome): AiRunner {
  return async (opts) => {
    opts.onLine?.(JSON.stringify({ type: 'result', subtype: 'success' }))
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
  opts: { captureSchema?: number; outcome?: AiOutcome } = {},
): Promise<Fixture> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'bug120-'))
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps(opts.captureSchema ?? CAPTURE_SCHEMA),
    runAi: fakeAi(opts.outcome ?? { status: 'no-gap', summary: 'nothing to file' }),
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

const page = async (f: Fixture): Promise<string> => (await fetch(new URL('/', f.handle.url))).text()

async function reproduce(f: Fixture, url = SITE): Promise<void> {
  await post(f, '/recapture', new URLSearchParams({ url }).toString())
  await f.handle.console.settled()
}

async function diagnose(f: Fixture, n: number): Promise<void> {
  await post(f, `/iteration/${n}/diagnose`)
  await f.handle.console.settled()
}

// ── reading the markup ───────────────────────────────────────────────────────

/** The container the two continuations are claimed to share, or nothing. */
function continuation(html: string): string | null {
  const found = /<section class="continue">[\s\S]*?<\/section>/.exec(html)
  return found ? found[0] : null
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

/**
 * The form a browser would submit when [recapture] is pressed, exactly as rendered.
 *
 * Read off the FORM rather than a `formaction=`: [[BUG-120]] put two submit
 * buttons in one form because they posted to different paths, and [[REQ-299]]
 * part 1 left one verb, so the group is now one form per control and the action
 * is the form's own. What the helper is for is unchanged — the request under
 * test is the one the page would really send.
 */
function recaptureSubmission(section: string): { action: string; body: string } {
  const form = /<form method="post" action="([^"]+)">([\s\S]*?)<\/form>/.exec(section)
  expect(form, 'the continuation group carries a form for [recapture]').not.toBeNull()
  expect(form![2], 'the first form in the group is [recapture]s').toContain('>recapture</button>')
  const fields = [...form![2].matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)]
  const body = new URLSearchParams(fields.map(([, name, value]) => [name, value] as [string, string])).toString()
  return { action: form![1], body }
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

// ── behaviours 1 and 2: the grouping is structural ───────────────────────────

describe('BUG-120 the page groups the verbs by what they are', () => {
  it('test_UAT_FC_BUG_120_the_controls_that_act_on_the_list_share_a_container_below_it', async () => {
    // THE CLAIM POSITION MAKES. [[BUG-120]]'s defect was a continuation rendered
    // above the history, where position reads "start over" whatever the tooltip
    // says. [[REQ-299]] part 1 retired one of the two continuations and part 2
    // added a control that ends the chain, so the group's membership changed and
    // the claim did not: what acts on the list is rendered under the list.
    const f = await startConsole()
    await reproduce(f)
    const html = await page(f)

    const section = continuation(html)
    expect(section, 'the controls that act on the list are rendered as one group').not.toBeNull()
    expect(section!).toContain('>recapture</button>')
    expect(section!).toContain('>clear history</button>')
    // The retired verb is not somewhere else on the page either.
    expect(html).not.toContain('>run again</button>')
    expect(html).not.toContain('>reproduce</button>')

    // The address row is outside the group and above the history, which is where
    // an address is typed…
    expect(html).toMatch(/<form method="post" action="\/recapture">\s*<input name="url"[\s\S]*?<\/form>/)
    expect(html.indexOf('placeholder="site address"')).toBeLessThan(html.indexOf('<h2>Iteration 1</h2>'))
    // …and the group is where the eye already is: after the history it acts on.
    expect(html.indexOf('<section class="continue">')).toBeGreaterThan(html.indexOf('<h2>Iteration 1</h2>'))
  })

  it('test_UAT_FC_BUG_120_each_control_says_what_it_will_do_to_the_list_in_visible_text', async () => {
    const f = await startConsole()
    await reproduce(f)
    const html = await page(f)
    const section = continuation(html)!
    const read = visible(section)

    // Behaviour 3 — the effect on the LIST, before the press, as words. Each
    // control says what it will do to the list and names the number involved.
    expect(read).toMatch(/appends iteration 2/)
    expect(read).toMatch(/ends this chain/)
    // …and behaviour 1 — what each does to the REFERENCE, stated rather than
    // positional. [recapture] re-rolls it; [clear history] leaves it alone,
    // which is the fact that makes clearing safe to press ([[REQ-299]] part 2).
    expect(read).toMatch(/re-hits the site and re-rolls the reference first/)
    expect(read).toMatch(/moved aside on disk, not deleted/)
    expect(read).toMatch(/captured reference is left where it is/)
    // The consequence of re-rolling, which is the reason the seam exists.
    expect(read).toMatch(/not comparable with iteration 1's/)

    // NOT A TOOLTIP. [recapture]'s continuation-ness used to be a `title=`,
    // which is invisible on a touch device and to anyone not hovering — the
    // wrong channel for the fact that decides whether a round measures
    // anything. It is text now, and the tooltip is gone rather than doubled.
    expect(section).not.toContain('title=')

    // Behaviour 2 — the address row says its two cases, outside the group and
    // equally without hovering.
    const restart = /<p class="effect restart">([\s\S]*?)<\/p>/.exec(html)
    expect(restart, 'the address row says what it does').not.toBeNull()
    expect(visible(restart![1])).toMatch(/new address starts a list numbered from 1/)
    expect(visible(restart![1])).toMatch(/already loaded appends the next iteration/)
  })
})

// ── behaviour 4: the reference the choice is about ───────────────────────────

describe('BUG-120 a reference behind the extractor is named where the choice is made', () => {
  it('test_UAT_FC_BUG_120_a_stale_bundle_names_itself_beside_the_chain_it_explains', async () => {
    // A bundle behind the extractor cannot see an axis it never had, so the
    // iterations measured against it are reading a residual whose fix may have
    // landed commits ago. [[BUG-120]] put that sentence where the choice between
    // the two continuations was made; with one verb left ([[REQ-299]] part 1) it
    // stays where it is because it is still true about the rows above it.
    const f = await startConsole({ captureSchema: 1 })
    await reproduce(f)
    const section = continuation(await page(f))!

    expect(section).toContain('class="stale-reference"')
    // THE SAME SENTENCE, NOT A SECOND SPELLING OF IT. `staleCaptureDetail` owns
    // the schema stamp and the axis registry, and it is what goes stale the day
    // the extractor learns an axis; a copy here would be a second thing to bump.
    const bundle = path.join(f.cwd, 'storage', 'references', SITE, 'index', 'capture.json')
    const expected = staleCaptureDetail(JSON.parse(readFileSync(bundle, 'utf8')) as Capture)
    expect(expected, 'a schema-1 bundle is behind the extractor').not.toBeNull()
    expect(visible(section)).toContain(expected!.replace(/`/g, '').replace(/\s+/g, ' '))
    // …and it says the two versions, which is the half the choice turns on.
    expect(visible(section)).toContain(`schema 1`)
    expect(visible(section)).toContain(`${CAPTURE_SCHEMA} today`)
  })

  it('test_UAT_FC_BUG_120_a_current_bundle_says_nothing_at_all', async () => {
    // The converse, and it is load-bearing: a warning that is always on the page
    // is the next thing an operator learns to ignore, and this one has to still
    // be readable on the round where it matters.
    const f = await startConsole({ captureSchema: CAPTURE_SCHEMA })
    await reproduce(f)
    const html = await page(f)
    expect(continuation(html)).not.toBeNull()
    // The class, not the word: the stylesheet names it unconditionally, and a
    // test that could not tell a rule from an element would pass on a page that
    // warned every round.
    expect(html).not.toContain('class="stale-reference"')
  })
})

// ── behaviour 5: nothing the three verbs DO has moved ────────────────────────

describe('BUG-120 the verbs are REQ-272s and stay exactly as they are', () => {
  it('test_UAT_FC_BUG_120_recapture_pressed_from_its_new_home_still_appends_and_marks_the_seam', async () => {
    // Pressed AS THE PAGE WOULD SEND IT — the request is built from the group's
    // own rendered form rather than from a route this test knows by heart, so a
    // group that moved the button but broke its wiring cannot pass.
    const f = await startConsole()
    await reproduce(f)
    const { action, body } = recaptureSubmission(continuation(await page(f))!)
    expect(action).toBe('/recapture')
    expect(new URLSearchParams(body).get('url')).toBe(`https://${SITE}`)

    await post(f, action, body)
    await f.handle.console.settled()

    // [[REQ-272]] part 2, unchanged: it APPENDS, the earlier iteration survives,
    // and the seam is marked so the two are not read as one comparison.
    const html = await page(f)
    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).toContain('<h2>Iteration 2</h2>')
    expect(manifest(f, 1).recaptured).toBeUndefined()
    expect(manifest(f, 2).recaptured).toBe(true)
    expect(html).toContain('re-captured')
  })

  it('test_UAT_FC_BUG_120_the_hold_gates_the_whole_group_and_not_the_address_row', async () => {
    // The console classifies what the hold catches with `data-held="1"`, and
    // that classification is what this ticket rendered as a group. [[REQ-299]]
    // changed the membership — [recapture] and [clear history] now — and must
    // not quietly change which side of the line anything sits on: the address
    // row stays outside, because beginning a list for a different site is not
    // advancing this one.
    const f = await startConsole({ outcome: FILED })
    await reproduce(f)
    await diagnose(f, 1)
    const html = await page(f)
    const section = continuation(html)!

    expect([...section.matchAll(/data-held="1" disabled/g)]).toHaveLength(2)
    // The address row is not held: beginning a new list is not advancing this one.
    const address = /<form method="post" action="\/recapture">\s*<input name="url"[\s\S]*?<\/form>/.exec(html)![0]
    expect(address).not.toContain('data-held')
    expect(address).not.toContain('disabled')
    expect(((await (await fetch(new URL('/state', f.handle.url))).json()) as { held: boolean }).held).toBe(true)
  })
})
