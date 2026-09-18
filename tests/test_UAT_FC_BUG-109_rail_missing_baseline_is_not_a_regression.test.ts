/**
 * BUG-109 — a missing baseline is a state of the checkout, not a regression.
 *
 * `runRail` answers "is anything worse than the recorded bar" with `pass:
 * false` when there is no recorded bar, which is right — a rail that returned
 * green against nothing would be worse than no rail at all. What was wrong is
 * that the one `false` carried no way to tell the two causes apart, so the
 * console's round renderer, which maps `!pass` to the verdict `REGRESSED` and
 * prefixes every phase failure with `REGRESSED ·`, told every round of every
 * site that the engine had got worse before the round had done anything.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT, on the same terms as the REQ-255 suite
 * this sits beside: the rail, its baseline document written and read back off
 * disk, its comparison against the bar, the round renderer, and the round
 * prompt builder are all the real thing. What is substituted is the one thing a
 * test cannot have — a headless browser rendering a third-party site — reached
 * through the injected `CommandRunner` the rail's own production runner plugs
 * into.
 *
 * THE FILE MAKES BOTH HALVES OF THE CLAIM. Suppressing the word everywhere
 * would satisfy the first half and destroy the rail, so the control — a
 * recorded number that really did move the wrong way — is asserted in the same
 * file and against the same renderer.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { BASELINE_FILE } from '../tools/repro-console/src/baseline'
import { formatRailReport, recordRail, runRail, type RailOptions } from '../tools/repro-console/src/rail'
import { runRailRound, summarise, type RailRoundResult } from '../tools/repro-console/src/rail-round'
import { buildPrompt, readBrief, type RoundContext } from '../tools/repro-console/src/ai'
import type { CommandResult, CommandRunner } from '../tools/repro-console/src/run'

const REFERENCE = 'gigabytealchemy.ai'

const scratchDirs: string[] = []
afterEach(() => {
  while (scratchDirs.length) rmSync(scratchDirs.pop()!, { recursive: true, force: true })
})

/** A temporary repo with one stored reference and no `storage/rail` at all. */
function fakeRepo(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'bug109-'))
  scratchDirs.push(cwd)
  writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ version: '9.9.9' }))
  const bundle = path.join(cwd, 'storage', 'references', REFERENCE, 'index')
  mkdirSync(bundle, { recursive: true })
  writeFileSync(path.join(bundle, 'capture.json'), '{}')
  return cwd
}

/** What `1c l1-gate --json` prints. */
function l1GateReport() {
  return {
    pass: true,
    sampleFidelity: { pass: true, tolerancePx: 2, maxDelta: 0.89, residuals: [], unmatched: [], mounted: [] },
    offSample: { pass: true, byWidth: [{ width: 900, findings: [] }] },
    contentRobustness: { pass: true, byWidth: [{ width: 1280, findings: [] }] },
    promoted: [],
    foldResiduals: [],
    forms: [],
  }
}

/** What `1c gate --json` prints, at whatever quality the test wants. */
function gateReport(meanDiff: number) {
  return {
    pass: false,
    verdict: 'reproduction-wrong',
    diagnosis: 'both eyes agree',
    nextStep: 'work the values-diff deltas',
    floor: { mean: 8, pct: 25 },
    perceptualBreach: true,
    l1Pass: true,
    perceptual: { meanDiff, pctOverThreshold: 31.2, regions: 7 },
    values: { deltas: 4, matched: 88, unmatched: 12 },
    coverage: { mirroredImages: 9, referencedImages: 9, unreferencedImages: [], sections: 6, pageHeightPx: 5200, pxPerSection: 866, findings: [] },
  }
}

/** The probe seam. `log` is every command the rail actually ran, in order. */
function fakeRunner(log: string[], meanDiff = 12.3): CommandRunner {
  return async (cmd, args): Promise<CommandResult> => {
    log.push([path.basename(cmd), ...args].join(' '))
    const verb = args[1]
    if (verb === 'l1-gate') return { code: 0, stdout: JSON.stringify(l1GateReport()), stderr: '' }
    if (verb === 'gate') return { code: 0, stdout: JSON.stringify(gateReport(meanDiff)), stderr: '' }
    return { code: 0, stdout: '', stderr: '' }
  }
}

/** Only the `references` phase, which is the one a console round runs. */
const ROUND: Partial<RailOptions> = { only: ['references'] }

/** A round context that is entirely unremarkable apart from its rail result. */
function roundContext(rail: RailRoundResult): RoundContext {
  return {
    n: 2,
    slug: `repro-${REFERENCE.replace(/\./g, '-')}`,
    originalUrl: `https://${REFERENCE}/`,
    bundleDir: 'storage/references/gigabytealchemy.ai/index',
    evidenceDir: 'storage/tmp/evidence',
    pageDocument: 'storage/tmp/page.json',
    siteDir: 'storage/tmp/site',
    gate: null,
    rail,
    knownGaps: [],
  }
}

describe('BUG-109 — the rail reports a missing baseline as unavailable, not as a regression', () => {
  it('test_UAT_FC_BUG-109_a_missing_baseline_is_reported_as_unavailable', async () => {
    // The state the ticket was filed from: a checkout where the rail has never
    // been recorded. Not a fixture detail — `storage/rail` is gitignored, so
    // this is what every fresh checkout is.
    const log: string[] = []
    const round = await runRailRound(fakeRepo(), fakeRunner(log))

    // The rail measured nothing, so it cannot have found anything worse: no
    // probe was spawned at all.
    expect(log).toEqual([])

    // Reported exactly as the throw path reports itself, because it is the same
    // kind of answer — the rail could not run here.
    expect(round.available).toBe(false)

    // `pass` is ABSENT, not `false`. Asserted through the serialiser because
    // `rail.json` is what the page and the round read, and "unknown" and "no"
    // are only distinguishable there if the key is missing.
    expect(Object.keys(JSON.parse(JSON.stringify(round)))).not.toContain('pass')

    // What it says instead: a state, and the command that changes it.
    expect(round.summary).toContain('not available')
    expect(round.summary).toContain(BASELINE_FILE)
    expect(round.summary).toContain('repro-rail record')

    // And the claim it must no longer make. Twice in the shipped artifact: once
    // as the verdict, once as the `REGRESSED ·` prefix on the phase failure.
    expect(round.summary).not.toContain('REGRESSED')
  })

  it('test_UAT_FC_BUG-109_the_round_prompt_never_claims_an_unmeasured_regression', async () => {
    // The artifact the defect actually cost something in: the prompt a round is
    // handed. Built by the real `buildPrompt` from the real brief, so a line
    // that reintroduced the claim anywhere in the prompt would fail here.
    const round = await runRailRound(fakeRepo(), fakeRunner([]))
    const prompt = buildPrompt(readBrief(), roundContext(round))

    expect(prompt).not.toContain('REGRESSED')
    expect(prompt).toContain('## The regression rail')
    expect(prompt).toContain(`not available — no baseline at ${BASELINE_FILE}`)
  })

  it('test_UAT_FC_BUG-109_a_recorded_metric_that_got_worse_is_still_a_regression', async () => {
    // The control, and the reason the fix is a discriminator rather than a
    // deletion. A bar recorded at 12.3, then the same probe reporting 40: a
    // real regression, through the same renderer, must still say so.
    const cwd = fakeRepo()
    await recordRail({ cwd, ...ROUND, runCommand: fakeRunner([]) })
    const round = await runRailRound(cwd, fakeRunner([], 40))

    expect(round.available).toBe(true)
    expect(round.pass).toBe(false)
    expect(round.summary).toContain('REGRESSED')
    expect(round.summary).toContain(REFERENCE)
  })

  it('test_UAT_FC_BUG-109_the_terminal_report_says_not_available_and_still_exits_non_zero', async () => {
    // The same distinction in the report a person reads. `repro-rail` must
    // still exit non-zero — it could not do its job — so `pass` stays `false`
    // and only the prose changes.
    const report = await runRail({ cwd: fakeRepo(), ...ROUND, runCommand: fakeRunner([]) })

    expect(report.noBaseline).toBe(true)
    expect(report.pass).toBe(false)

    const printed = formatRailReport(report)
    expect(printed).toContain('NOT AVAILABLE')
    expect(printed).toContain('repro-rail record')
    // Not filed under the heading that asserts a comparison was made.
    expect(printed).not.toContain('what is worse than the recorded bar')
    expect(printed).not.toMatch(/regression rail: FAIL/)
  })

  it('test_UAT_FC_BUG-109_summarise_reports_the_state_from_the_report_alone', async () => {
    // The renderer is exported and the console is not its only caller, so the
    // discriminator is honoured in `summarise` itself rather than only at the
    // one call site that happens to exist today.
    const report = await runRail({ cwd: fakeRepo(), ...ROUND, runCommand: fakeRunner([]) })
    expect(summarise(report)).toBe(
      `the regression rail — not available — no baseline at ${BASELINE_FILE}; record one with \`repro-rail record\``,
    )
  })
})
