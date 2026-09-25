/**
 * REQ-323 — the control and the progress report, at one end of the page.
 *
 * The console had its controls at both ends of itself. The address box and the
 * status line were pinned above everything; [recapture] and [clear history] were
 * under the iteration list where [[BUG-120]] correctly put them, and the ⏸ block
 * was under that. So the loop was WORKED at the bottom of the document and READ
 * at the top of it: press [recapture] under the newest iteration, then travel the
 * length of the page to find out whether anything is happening. Whichever end the
 * operator is looking at, the other one is off-screen.
 *
 * The fix is not a reordering of the list and not a choice of end. It is an
 * invariant: THE CONTROL AND THE PROGRESS REPORT MUST BE ADJACENT. The list stays
 * ascending and the continuation group keeps the position [[BUG-120]] gave it —
 * after the list it acts on, because position is the claim — and everything else
 * the operator touches or reads moves down to join it.
 *
 * WHICH MEANS THE REDIRECT HAD TO MOVE TOO, and that half is not cosmetic. Every
 * press answers `303 → /`, and a bare `/` lands the browser at the top of the
 * document. Moving the controls to the bottom without touching that would invert
 * the complaint rather than answer it: every press would return the operator to a
 * page with nothing actionable on it. So the cluster carries an `id` and the
 * presses redirect to it — a fragment, because it needs no script, survives a
 * manual reload, and leaves the `303`-instead-of-`200` property that stops a
 * reload re-running the round exactly as it was.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT, on [[REQ-254]]'s terms: the console, its
 * HTTP surface and the page it serves are the real thing — the document order
 * under test is read out of a page the real renderer wrote, and the redirect
 * targets are read off real `303` responses. Substituted is what a test must not
 * have: a headless browser (`1c`), a billed model (`claude`), and the commands
 * the console asks the machine about.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { CAPTURE_SCHEMA } from '../tools/generate/src/cli/capture/schema'
import type { AiOutcome, AiRunner } from '../tools/repro-console/src/ai'
import type { IterationStep, StepResult, StepRunner } from '../tools/repro-console/src/iteration'
import { CONTROLS_ID } from '../tools/repro-console/src/page'
import type { CommandRunner } from '../tools/repro-console/src/run'
import { startReproConsole, type ConsoleHandle } from '../tools/repro-console/src/server'
import { xgdTicketGetJson } from './support/xgd-ticket-get'

const openHandles: ConsoleHandle[] = []

afterEach(async () => {
  while (openHandles.length) await openHandles.pop()!.close()
})

const SITE = 'gigabytealchemy.ai'

// ── the stand-ins ────────────────────────────────────────────────────────────

/** A stand-in `1c` that writes what the real one writes, at the current schema. */
const fakeSteps: StepRunner = async (step: IterationStep, cwd: string): Promise<StepResult> => {
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
          capturedAt: '2026-09-25T09:00:00.000Z',
          captureSchema: CAPTURE_SCHEMA,
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

/** A round that filed, which is the outcome that holds the loop. */
const FILED: AiOutcome = {
  status: 'filed',
  residualClass: 'capture-drops-control-padding',
  summary: 'the capture discards padding on form controls',
  ticketId: 'REQ-263',
  sessionId: 'session-aaaa',
}

const fakeAi: AiRunner = async () => FILED

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

async function startConsole(): Promise<Fixture> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req323-'))
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps,
    runAi: fakeAi,
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

async function recapture(f: Fixture, url = SITE): Promise<void> {
  await post(f, '/recapture', new URLSearchParams({ url }).toString())
  await f.handle.console.settled()
}

async function diagnose(f: Fixture, n: number): Promise<void> {
  await post(f, `/iteration/${n}/diagnose`)
  await f.handle.console.settled()
}

// ── reading the markup ───────────────────────────────────────────────────────

/** Rendered markup as a reader sees it: no tags, no entities. */
const visible = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

/** Where the LAST iteration heading starts, which is the line the cluster is below. */
const lastIteration = (html: string): number => {
  const all = [...html.matchAll(/<h2>Iteration \d+<\/h2>/g)]
  expect(all.length, 'the history has at least one iteration').toBeGreaterThan(0)
  return all[all.length - 1].index!
}

/** The marks this ticket is about, by the string that identifies each in the page. */
const CONTROLS = {
  'the status line': '<p id="status"',
  'the address box': 'placeholder="site address"',
  'the restart sentence': '<p class="effect restart">',
  'the hold block': '<p class="held">',
  'the continuation group': '<section class="continue">',
} as const

// ── the list is not what moved ───────────────────────────────────────────────

describe('REQ-323 the iteration list is left exactly as it was', () => {
  it('test_UAT_FC_REQ_323_three_iterations_still_read_oldest_first', async () => {
    // THE DEFECT IS NOT THE ORDERING, and this is the assertion that says so.
    // The cheap reading of "the newest iteration is a long way from the status
    // line" is "reverse the list", which would move the seam [[REQ-272]] part 2
    // marks and renumber what the operator's eye tracks. The list is ascending
    // before and after; what moved is everything that is not the list.
    const f = await startConsole()
    await recapture(f)
    await recapture(f)
    await recapture(f)
    const html = await page(f)

    expect(html).toContain('<h2>Iteration 1</h2>')
    expect(html).toContain('<h2>Iteration 2</h2>')
    expect(html).toContain('<h2>Iteration 3</h2>')
    expect(html.indexOf('<h2>Iteration 1</h2>')).toBeLessThan(html.indexOf('<h2>Iteration 2</h2>'))
    expect(html.indexOf('<h2>Iteration 2</h2>')).toBeLessThan(html.indexOf('<h2>Iteration 3</h2>'))
  })
})

// ── one end, and the report on it ────────────────────────────────────────────

describe('REQ-323 every control and the one line reporting a press are at the same end', () => {
  it('test_UAT_FC_REQ_323_nothing_the_operator_presses_or_watches_renders_before_the_list', async () => {
    // The whole of the ask, as one sweep. Each of these used to be at one end or
    // the other; all of them are now after the last iteration, so an operator at
    // the foot of the list has every control and the progress report in view and
    // nothing to travel to.
    const f = await startConsole()
    await recapture(f)
    await recapture(f)
    await diagnose(f, 2)
    const html = await page(f)

    const last = lastIteration(html)
    for (const [what, mark] of Object.entries(CONTROLS)) {
      expect(html, `${what} is rendered`).toContain(mark)
      expect(html.indexOf(mark), `${what} renders after the last iteration`).toBeGreaterThan(last)
    }
  })

  it('test_UAT_FC_REQ_323_the_status_line_is_adjacent_to_the_controls_with_no_iteration_between', async () => {
    // ADJACENCY IS THE INVARIANT, not position. A status line that had merely
    // moved to the bottom of the page while an iteration section rendered between
    // it and the buttons would satisfy "at the bottom" and reproduce the defect
    // at a shorter distance, so the assertion is about what is BETWEEN them.
    const f = await startConsole()
    await recapture(f)
    await recapture(f)
    await recapture(f)
    await diagnose(f, 3)
    const html = await page(f)

    const cluster = new RegExp(`<div id="${CONTROLS_ID}">([\\s\\S]*)</div>`).exec(html)
    expect(cluster, 'the controls and the report are one element').not.toBeNull()
    expect(cluster![1], 'no iteration renders inside the control cluster').not.toMatch(/<h2>Iteration \d+<\/h2>/)
    for (const [what, mark] of Object.entries(CONTROLS)) {
      expect(cluster![1], `${what} is inside the cluster`).toContain(mark)
    }
    // …and the report is the last thing in it, under every control that writes it.
    const tail = cluster![1].slice(cluster![1].indexOf(CONTROLS['the status line']))
    expect(visible(tail.replace(/<p id="status"[^>]*>[\s\S]*?<\/p>/, ''))).toBe('')
  })

  it('test_UAT_FC_REQ_323_the_continuation_group_keeps_its_position_and_the_address_row_stays_outside_it', async () => {
    // [[BUG-120]]'s two surviving claims, re-asserted here because this ticket
    // moves things past them and a move that quietly folded the address row into
    // the group would pass every assertion above. The group is after the list it
    // acts on — position is the claim — and the address row, which starts
    // something rather than acting on the list, is not in it.
    const f = await startConsole()
    await recapture(f)
    const html = await page(f)

    const group = /<section class="continue">[\s\S]*?<\/section>/.exec(html)
    expect(group, 'the controls that act on the list are one group').not.toBeNull()
    expect(html.indexOf('<section class="continue">')).toBeGreaterThan(html.indexOf('<h2>Iteration 1</h2>'))
    expect(group![0]).toContain('>recapture</button>')
    expect(group![0]).toContain('>clear history</button>')
    expect(group![0], 'the address row is not in the group').not.toContain('placeholder="site address"')
  })
})

// ── the press lands where the controls are ───────────────────────────────────

describe('REQ-323 a press returns the operator to the control end', () => {
  it('test_UAT_FC_REQ_323_every_press_on_the_chain_redirects_to_the_fragment_the_page_renders', async () => {
    // WITHOUT THIS THE MOVE MAKES THINGS WORSE. A bare `/` lands the browser at
    // the top of the document, which is where nothing actionable is any more. The
    // id and the fragment are read from the same constant and checked against
    // each other, because a fragment naming an id the page does not render is a
    // silent no-op — the console would look like it had ignored the press.
    const f = await startConsole()
    await recapture(f)
    await diagnose(f, 1)

    const target = `/#${CONTROLS_ID}`
    expect((await page(f)), 'the page renders the id the redirect names').toContain(`<div id="${CONTROLS_ID}">`)

    const round = await post(f, '/iteration/1/diagnose')
    expect(round.status).toBe(303)
    expect(round.headers.get('location'), 'the AI round').toBe(target)
    await f.handle.console.settled()

    const released = await post(f, '/release')
    expect(released.status).toBe(303)
    expect(released.headers.get('location'), 'the hold release').toBe(target)

    const again = await post(f, '/recapture', new URLSearchParams({ url: SITE }).toString())
    expect(again.status).toBe(303)
    expect(again.headers.get('location'), '[recapture]').toBe(target)
    await f.handle.console.settled()

    const cleared = await post(f, '/clear')
    expect(cleared.status).toBe(303)
    expect(cleared.headers.get('location'), '[clear history]').toBe(target)

    // The fragment still resolves on the page clearing returns to: the cluster is
    // the address box and the status line, which a blank console still has.
    expect(await page(f)).toContain(`<div id="${CONTROLS_ID}">`)
  })
})

// ── the blank page is still blank ────────────────────────────────────────────

describe('REQ-323 the blank console is unchanged', () => {
  it('test_UAT_FC_REQ_323_with_no_site_loaded_nothing_renders_between_the_text_box_and_the_top', async () => {
    // [[REQ-254]] requirement 2 — a text box, a button, and nothing else — is
    // what the address row moving down could have broken, and the reason it does
    // not is that there is nothing between the two ends of a blank console. The
    // assertion is on what a reader SEES above the box, not on the markup order,
    // because the cluster's wrapper is above it and renders nothing.
    const f = await startConsole()
    const html = await page(f)

    const box = html.indexOf('placeholder="site address"')
    expect(box).toBeGreaterThan(-1)
    // From the end of the `<body>` tag to the start of the form holding the box,
    // so the slice never cuts a tag in half and read it back as text.
    const body = html.indexOf('>', html.indexOf('<body')) + 1
    expect(visible(html.slice(body, html.lastIndexOf('<form', box))), 'nothing is rendered above the text box').toBe('')
    expect(html).toContain('>recapture<')
    expect(html).not.toContain('Iteration')
    expect(html).not.toContain('clear history')
  })
})

// ── the prose the move falsified ─────────────────────────────────────────────

describe('REQ-323 the page does not describe an order it no longer has', () => {
  it('test_UAT_FC_REQ_323_the_restart_sentence_names_no_direction_the_new_order_makes_false', async () => {
    // The address row's sentence said a loaded address "appends the next
    // iteration to the chain BELOW". The chain is above it now. A page whose own
    // explanation points the wrong way is worse than one that explains nothing,
    // so the sentence names the chain rather than a direction — and it still says
    // both of the two things it is there to say.
    const f = await startConsole()
    await recapture(f)
    const html = await page(f)

    const restart = /<p class="effect restart">([\s\S]*?)<\/p>/.exec(html)
    expect(restart, 'the address row says what it does').not.toBeNull()
    const read = visible(restart![1])
    expect(read, 'no direction word the new order falsifies').not.toMatch(/\bbelow\b/)
    expect(read).toMatch(/new address starts a list numbered from 1/)
    expect(read).toMatch(/already loaded appends the next iteration/)

    // …and [clear history]'s sentence, which says the iterations are "above", is
    // still true and is deliberately left alone: they are above the group, and
    // now above the address box too.
    const group = /<section class="continue">[\s\S]*?<\/section>/.exec(html)!
    expect(visible(group[0])).toMatch(/above are moved aside on disk/)
  })
})
