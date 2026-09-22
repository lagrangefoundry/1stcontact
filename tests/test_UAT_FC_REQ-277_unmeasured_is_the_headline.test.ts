/**
 * REQ-277 — the unmeasured set is the headline; the delta count is not progress.
 *
 * [[EPIC-19]]'s audit closed on one sentence: *stop reading delta count as
 * progress*. [[BUG-107]] added `role`/`a11yRole` comparison and took one
 * reproduction from **1 delta to 14** — eleven lost headings that had been
 * reading as zero — with nothing about the page having changed. An operator
 * reading the delta count as a score saw a 14× regression on a pure
 * improvement, and every axis the capture-completeness work adds queues the
 * same inversion up again.
 *
 * The quantity that moves the right way already exists: [[BUG-106]] and
 * [[BUG-111]] established that an unmeasured axis is not a clean one, and
 * [[REQ-274]] named the axes only one side of the projection can read. What was
 * missing is that nobody reads it. These tests are about which of the numbers
 * the gate already produces is treated as the score — on the page, in the
 * digest, and in what the round is told.
 *
 * WHAT IS REAL HERE. The console, its HTTP surface, the page it serves, the
 * digest it writes and the prompt it builds are the real thing — a real
 * `node:http` server on loopback, driven with real `fetch`. Substituted: the
 * headless browser (`1c`, through the injected `StepRunner`), the billed model
 * (`claude`, through the injected `AiRunner`) and the machine the console asks
 * about commits and tickets (`git`, `xgd`, through the injected
 * `CommandRunner`). The gate reports the fake `1c` writes are the ONLY thing
 * varying between the cases below, because that is exactly the input this
 * behaviour is a function of.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { AI_DIGEST_FILE, AI_DIR, CONSOLE_WORKSPACE, slugForUrl } from '../tools/repro-console/src/console'
import { BRIEF_FILE, readBrief, type AiRunOptions, type AiRunner } from '../tools/repro-console/src/ai'
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

/** The `values` block of one iteration's `gate.json` — the whole of the input. */
interface ValuesBlock {
  deltas: number
  matched?: number
  unmatched?: number
  unpairedActual?: number
  unpairedSections?: number
  unpairedActualSections?: number
  unmeasuredAxes?: Array<{ axis: string; scope: string; side: string; reason: string }>
  sectionsNotComparable?: string
}

/** What the fake `1c` has done, so a test can assert against it. */
interface OneCLog {
  /** `capturedAt` stamps written, in order — a new one every capture. */
  times: string[]
  /** The `values` block each successive `gate` step wrote. */
  gates: ValuesBlock[]
}

/**
 * A stand-in `1c` that writes what the real one writes.
 *
 * Its capture step stamps a DIFFERENT time on every call, like the real one,
 * because "the reference moved" is a fact about that field and nothing else on
 * disk — and the delta axis being marked not-comparable turns on it.
 */
function fakeSteps(log: OneCLog, gates: ValuesBlock[]): StepRunner {
  let gateCall = 0
  return async (step: IterationStep, cwd: string): Promise<StepResult> => {
    const out = (): string => step.argv[step.argv.indexOf('--out') + 1]
    switch (step.name) {
      case 'capture': {
        if (step.argv[1] === 'list') return { code: 0, stdout: JSON.stringify(storedCaptures(cwd)), stderr: '' }
        const url = step.argv[2]
        const dir = path.join(cwd, 'storage', 'references', new URL(url).hostname, 'index')
        mkdirSync(dir, { recursive: true })
        const capturedAt = `2026-09-1${log.times.length + 1}T09:00:00.000Z`
        log.times.push(capturedAt)
        writeFileSync(
          path.join(dir, 'capture.json'),
          JSON.stringify({ url, host: new URL(url).hostname, path: '/', capturedAt, captureSchema: 3, assets: [] }),
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
        const values = gates[Math.min(gateCall, gates.length - 1)]
        gateCall += 1
        log.gates.push(values)
        writeFileSync(path.join(dir, 'values-diff.json'), JSON.stringify({ matched: 4, unmatched: 0, deltas: [] }))
        writeFileSync(
          path.join(dir, 'gate.json'),
          JSON.stringify({
            pass: false,
            verdict: 'reproduction-wrong',
            diagnosis: 'the pixels disagree',
            nextStep: 'diagnose the fold',
            perceptual: { meanDiff: 0.7, pctOverThreshold: 0.3, regions: 0 },
            values,
            coverage: { mirroredImages: 0, referencedImages: 0, unreferencedImages: [], sections: 1, findings: [] },
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

/** What each round was asked, so the prompt can be read back. */
interface AiLog {
  prompts: string[]
}

function fakeAi(log: AiLog): AiRunner {
  return async (opts: AiRunOptions) => {
    log.prompts.push(opts.prompt)
    opts.onLine('reading gate.json')
    return { status: 'no-gap' as const, summary: 'nothing to file this round' }
  }
}

function fakeCommands(): CommandRunner {
  return async (command, args) => {
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
  oneC: OneCLog
}

async function startConsole(gates: ValuesBlock[]): Promise<Fixture> {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req277-'))
  const ai: AiLog = { prompts: [] }
  const oneC: OneCLog = { times: [], gates: [] }
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps(oneC, gates),
    runAi: fakeAi(ai),
    runCommand: fakeCommands(),
    env: {},
    port: 0,
  })
  openHandles.push(handle)
  return { handle, cwd, ai, oneC }
}

const post = (f: Fixture, route: string, body = ''): Promise<Response> =>
  fetch(new URL(route, f.handle.url), {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    redirect: 'manual',
  })

const page = async (f: Fixture): Promise<string> => (await fetch(new URL('/', f.handle.url))).text()

/**
 * Press [recapture] and wait — the one verb the console has ([[REQ-299]] part 1).
 *
 * `reproduce` and `again` name the POSITION the press came from, which is still
 * a real distinction even though the request is now the same one.
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

/** One iteration's section of the page, so "above" can be asserted within it. */
function section(markup: string, n: number): string {
  const start = markup.indexOf(`<h2>Iteration ${n}</h2>`)
  expect(start).toBeGreaterThan(-1)
  const next = markup.indexOf('<h2>Iteration', start + 1)
  return markup.slice(start, next === -1 ? undefined : next)
}

/** An axis the projection can only read on one side — [[REQ-274]]'s shape. */
const axis = (name: string): { axis: string; scope: string; side: string; reason: string } => ({
  axis: name,
  scope: 'element',
  side: 'reference',
  reason: 'the extractor does not record it',
})

// ── the behaviours ───────────────────────────────────────────────────────────

describe('REQ-277 the unmeasured set is the headline number', () => {
  it('test_UAT_FC_REQ_277_the_console_shows_an_unmeasured_count_per_iteration_with_its_breakdown', async () => {
    // Behaviour 1 and 2 — one number, the breakdown behind it, and the delta
    // count still present but no longer the thing the eye lands on first.
    const f = await startConsole([
      {
        deltas: 3,
        matched: 59,
        unmatched: 2,
        unpairedActual: 3,
        unpairedSections: 1,
        unpairedActualSections: 1,
        unmeasuredAxes: [axis('paddingTopPx'), axis('letterSpacingPx')],
        sectionsNotComparable: 'the reference bands could not be paired at all',
      },
    ])
    await reproduce(f)

    const first = section(await page(f), 1)
    // 2 axes + 2 bands + 5 populations + 1 probe.
    expect(first).toContain('unmeasured 10')
    expect(first).toContain('2 axes')
    expect(first).toContain('2 bands')
    expect(first).toContain('5 populations')
    expect(first).toContain('1 probe (the reference bands could not be paired at all)')
    // The breakdown names the axes, so the number can be taken back to which.
    expect(first).toContain('element.paddingTopPx')
    // The delta count stays — it is demoted, not removed.
    expect(first).toContain('3 delta(s)')
    // …and it is BELOW the headline, which is the whole of behaviour 2.
    expect(first.indexOf('unmeasured 10')).toBeLessThan(first.indexOf('3 delta(s)'))
  })

  it('test_UAT_FC_REQ_277_an_added_axis_moves_unmeasured_down_and_deltas_up_and_reads_as_progress', async () => {
    // Behaviour 3, and the ticket's own acceptance criterion. The second
    // iteration is BUG-107 landing: an axis the instrument used to skip becomes
    // measurable, so the unmeasured count falls and the delta count rises. The
    // page must render that as the instrument sharpening.
    const f = await startConsole([
      { deltas: 1, unmatched: 0, unpairedActual: 0, unpairedSections: 0, unpairedActualSections: 0, unmeasuredAxes: [axis('role'), axis('a11yRole'), axis('paddingTopPx')] },
      { deltas: 14, unmatched: 0, unpairedActual: 0, unpairedSections: 0, unpairedActualSections: 0, unmeasuredAxes: [axis('paddingTopPx')] },
    ])
    await reproduce(f)
    await again(f)

    // A CHAIN WRITTEN BEFORE [[REQ-299]], READ BACK.
    //
    // The delta count only moves between two iterations that measured against
    // the SAME reference, and since [[REQ-299]] part 1 every press the console
    // offers re-captures — so a chain built by pressing has a seam at every
    // step and the comparison is suppressed by design (the test below this one
    // is what that looks like). The reading is not dead, though: chains already
    // on disk were built when [run again] existed, and re-opening one must still
    // render them correctly rather than re-labelling history it did not make.
    //
    // So the two manifests are re-written to the shape a refold left — no
    // `recaptured`, the same `bundleCapturedAt` — and the chain is re-opened
    // through the real entry point, which is the one an operator restarting the
    // console uses.
    const dir = path.join(f.cwd, CONSOLE_WORKSPACE, slugForUrl(SITE))
    for (const n of [1, 2]) {
      const file = path.join(dir, `iteration-${n}`, 'iteration.json')
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
      delete parsed.recaptured
      parsed.bundleCapturedAt = f.oneC.times[0]
      writeFileSync(file, JSON.stringify(parsed))
    }
    await page(f)
    await post(f, '/open', new URLSearchParams({ url: SITE }).toString())

    const second = section(await page(f), 2)
    expect(second).toContain('unmeasured 1')
    expect(second).toContain('↓ 2 from iteration 1')
    expect(second).toContain('14 delta(s)')
    expect(second).toContain('↑ 13 from iteration 1')
    // The sentence an operator who has never read this ticket needs.
    expect(second).toMatch(/instrument sharpened/i)
    expect(second).toContain('progress, not a regression')
    expect(second).toContain('the unmeasured set is the number to drive down')
  })

  it('test_UAT_FC_REQ_277_a_recaptured_iteration_is_not_comparable_on_the_delta_axis', async () => {
    // Behaviour 4 — [[REQ-272]] already marks the seam; this is what the seam
    // MEANS for the numbers. The oracle moved, so the delta count either side
    // is two different measurements sharing a name. The unmeasured set is not
    // in that position: a re-capture is the main way it falls, and the page
    // must still say which way it went.
    const f = await startConsole([
      { deltas: 2, unmatched: 0, unpairedActual: 0, unpairedSections: 0, unpairedActualSections: 0, unmeasuredAxes: [axis('role'), axis('a11yRole')] },
      { deltas: 9, unmatched: 0, unpairedActual: 0, unpairedSections: 0, unpairedActualSections: 0, unmeasuredAxes: [] },
    ])
    await reproduce(f)
    await recapture(f)

    const second = section(await page(f), 2)
    // REQ-272's seam is still marked…
    expect(second).toContain('re-captured')
    // …and the delta count says what the seam means for it, by name.
    expect(second).toContain('not comparable with iteration 1')
    expect(second).toContain('the reference moved')
    expect(second).not.toContain('↑ 7 from iteration 1')
    // The unmeasured set crosses the seam, and falling is what a re-capture is for.
    expect(second).toContain('unmeasured 0')
    expect(second).toContain('↓ 2 from iteration 1')
  })

  it('test_UAT_FC_REQ_277_a_report_that_cannot_say_is_not_counted_as_a_clean_one', async () => {
    // The discipline BUG-106 and BUG-111 established, one layer out. A gate
    // report written before REQ-274 carries no `unmeasuredAxes` and no unpaired
    // band counts, and reading that silence as "none" would manufacture exactly
    // the clean bill this ticket exists to refuse.
    const f = await startConsole([{ deltas: 0, matched: 59, unmatched: 0 }])
    await reproduce(f)

    const first = section(await page(f), 1)
    expect(first).toContain('unmeasured ≥ 0')
    expect(first).toContain('this report does not carry axes, bands, populations')
    expect(first).toContain('not counted, and not zero')
  })

  it('test_UAT_FC_REQ_277_the_round_is_told_to_drive_the_unmeasured_set_not_the_delta_count', async () => {
    // Behaviour 5 — a round optimising for fewer deltas will avoid adding an
    // axis, which is exactly backwards. The brief says so, and every round's
    // own prompt and digest lead with the number to drive.
    const f = await startConsole([
      { deltas: 14, unmatched: 0, unpairedActual: 0, unpairedSections: 1, unpairedActualSections: 0, unmeasuredAxes: [axis('role')] },
    ])
    await reproduce(f)
    await diagnose(f, 1)

    const prompt = f.ai.prompts[0]
    expect(prompt).toContain('unmeasured 2')
    expect(prompt).toContain('This is the number to drive down')
    // …and the delta count is named as what it is, above nothing.
    expect(prompt).toContain('It is not a score.')
    expect(prompt.indexOf('unmeasured 2')).toBeLessThan(prompt.indexOf('values-diff:'))

    // The digest the console computes leads with the same number, from the same
    // definition — three surfaces, one total.
    const digest = readFileSync(
      path.join(f.cwd, CONSOLE_WORKSPACE, slugForUrl(SITE), 'iteration-1', AI_DIR, AI_DIGEST_FILE),
      'utf8',
    )
    expect(digest).toContain('## unmeasured 2')
    expect(digest).toContain('This is the number to drive down')
    expect(digest.indexOf('## unmeasured 2')).toBeLessThan(digest.indexOf('## Value deltas'))

    // The standing brief says it too, so a round is told before it reads a file.
    const brief = readBrief(BRIEF_FILE)
    expect(brief).toContain('The delta count is not a score')
    expect(brief).toMatch(/1 delta to 14/)
    expect(brief).toContain('Never report a rising delta count as a regression')
  })
})
