/**
 * REQ-255 — the regression rail.
 *
 * The safety rail for any change to the reproduction engine. It answers one
 * question — "is everything still as good as it was?" — and it must be able to
 * answer "no" convincingly, naming what broke ([[EPIC-12]] §8.4).
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The rail, its phase sequencing, its
 * baseline document and every judgement it makes are the real thing, driven
 * through a real temporary repo with real reference bundles on disk and a real
 * baseline file written and read back. What is substituted is the one thing a
 * test cannot have: a headless browser rendering three third-party sites. The
 * commands are reached through an injected `CommandRunner`, which is the same
 * seam the rail's own production runner plugs into, and the substitute prints
 * the documents `1c l1-gate --json` and `1c gate --json` really print.
 *
 * The contract with the real CLI — that those verbs accept the flags the rail
 * passes and print a document whose metric paths resolve — is checked unmocked
 * in `test_UAT_FC_REQ_255_the_probe_contract_holds_against_the_real_cli`,
 * against a stored bundle when the machine has one.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { oneC, spawnCommand, parseJsonOutput, type CommandResult, type CommandRunner } from '../tools/repro-console/src/run'
import {
  BASELINE_FILE,
  PROBES,
  compareProbe,
  extractMetrics,
  probeNamed,
  readMetric,
  type RailBaseline,
} from '../tools/repro-console/src/baseline'
import {
  PHASES,
  TYPECHECK_COMMANDS,
  VITEST_REPORT_FILE,
  discoverReferences,
  formatRailReport,
  parseRailArgs,
  preparationArgv,
  probeArgv,
  railSlug,
  recordRail,
  runRail,
  type RailOptions,
  type RailReport,
} from '../tools/repro-console/src/rail'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const REFERENCES = ['faelan.com', 'gigabytealchemy.ai', 'joyfulculinarycreations.com']

const scratchDirs: string[] = []
afterEach(() => {
  while (scratchDirs.length) rmSync(scratchDirs.pop()!, { recursive: true, force: true })
})

/** A temporary repo with the given references stored, and nothing else. */
function fakeRepo(references: string[] = REFERENCES): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'rail-'))
  scratchDirs.push(cwd)
  writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ version: '9.9.9' }))
  for (const name of references) {
    const bundle = path.join(cwd, 'storage', 'references', name, 'index')
    mkdirSync(bundle, { recursive: true })
    writeFileSync(path.join(bundle, 'capture.json'), '{}')
  }
  return cwd
}

/** What `1c l1-gate --json` prints, at whatever quality the test wants. */
function l1GateReport(over: { pass?: boolean; maxDelta?: number; unmatched?: number; findings?: number } = {}) {
  const pass = over.pass ?? true
  return {
    pass,
    sampleFidelity: {
      pass,
      tolerancePx: 2,
      maxDelta: over.maxDelta ?? 0.89,
      residuals: [],
      unmatched: Array.from({ length: over.unmatched ?? 0 }, (_, i) => ({ text: `t${i}`, width: 1280 })),
      mounted: [],
    },
    offSample: {
      pass: true,
      byWidth: [
        { width: 500, findings: Array.from({ length: over.findings ?? 0 }, () => ({ kind: 'overlap' })) },
        { width: 900, findings: [] },
      ],
    },
    contentRobustness: { pass: true, byWidth: [{ width: 1280, findings: [] }] },
    promoted: [],
    foldResiduals: [],
    forms: [],
  }
}

/** What `1c gate --json` prints. */
function gateReport(over: { meanDiff?: number; pct?: number; regions?: number; deltas?: number; matched?: number; l1Pass?: boolean } = {}) {
  return {
    pass: false,
    verdict: 'reproduction-wrong',
    diagnosis: 'both eyes agree',
    nextStep: 'work the values-diff deltas',
    floor: { mean: 8, pct: 25 },
    perceptualBreach: true,
    l1Pass: over.l1Pass ?? true,
    perceptual: { meanDiff: over.meanDiff ?? 12.3, pctOverThreshold: over.pct ?? 31.2, regions: over.regions ?? 7 },
    values: { deltas: over.deltas ?? 4, matched: over.matched ?? 88, unmatched: 12 },
    coverage: { mirroredImages: 9, referencedImages: 9, unreferencedImages: [], sections: 6, pageHeightPx: 5200, pxPerSection: 866, findings: [] },
  }
}

interface FakeOptions {
  /** Per-reference probe output overrides, keyed by reference then probe. */
  probes?: Record<string, { 'l1-gate'?: unknown; gate?: unknown }>
  /** Reference whose `1c refold` falls over. */
  refoldFails?: string
  /** Commands that should exit non-zero, matched on their joined argv. */
  failing?: string[]
  /** Test files vitest should report as not passing. */
  failingTests?: string[]
  /** Test files vitest should report at all. */
  ranTests?: string[]
  /** A reference whose `1c gate` prints something that is not a document. */
  garbageGate?: string
}

/** Every command the rail ran, joined, in order. */
type CommandLog = string[]

function fakeRunner(log: CommandLog, opts: FakeOptions = {}): CommandRunner {
  const ok = (stdout = ''): CommandResult => ({ code: 0, stdout, stderr: '' })
  return async (cmd, args, cwd): Promise<CommandResult> => {
    const line = [path.basename(cmd), ...args].join(' ')
    log.push(line)
    if (opts.failing?.some((f) => line.includes(f))) return { code: 1, stdout: '', stderr: 'it fell over\nbecause of reasons' }

    if (line.includes('vitest')) {
      const outFile = args[args.indexOf('--outputFile') + 1]
      const ran = opts.ranTests ?? ['tests/a.test.ts', 'tests/b.test.ts', 'tests/c.test.ts']
      const failing = new Set(opts.failingTests ?? [])
      mkdirSync(path.dirname(path.join(cwd, outFile)), { recursive: true })
      writeFileSync(
        path.join(cwd, outFile),
        JSON.stringify({
          success: failing.size === 0,
          testResults: ran.map((name) => ({ name: path.join(cwd, name), status: failing.has(name) ? 'failed' : 'passed' })),
        }),
      )
      return ok()
    }

    const verb = args[1]
    const refIndex = args.indexOf('--ref')
    const reference = refIndex === -1 ? '' : args[refIndex + 1].split(path.sep)[2]
    if (verb === 'refold' && opts.refoldFails === reference) {
      return { code: 1, stdout: '', stderr: 'No multistate.json in bundle — the bundle predates multi-state capture' }
    }
    if (verb === 'refold' || verb === 'repro') return ok('done')
    if (verb === 'l1-gate') return ok(JSON.stringify(opts.probes?.[reference]?.['l1-gate'] ?? l1GateReport()))
    if (verb === 'gate') {
      // Shaped like the real refusal this sandbox produces: a thrown error
      // leads with its reason and then unwinds into teardown chatter, wrapped
      // in ANSI dim. Quoting the TAIL of this says "temporary directories
      // cleanup" and nothing an operator can act on — which is the whole point
      // of the excerpt being taken from the head.
      if (opts.garbageGate === reference) {
        return {
          code: 1,
          stdout: '',
          stderr: [
            '[2mbrowserType.launch: Executable does not exist[22m',
            'Browser logs:',
            '<launched> pid=4242',
            '[pid=4242] <gracefully close start>',
            '[pid=4242] starting temporary directories cleanup',
            '[pid=4242] finished temporary directories cleanup',
          ].join('\n'),
        }
      }
      return ok(JSON.stringify(opts.probes?.[reference]?.gate ?? gateReport()))
    }
    return ok()
  }
}

/** Record a bar, then run a check against it with whatever changed. */
async function recordThenCheck(
  cwd: string,
  check: FakeOptions,
  record: FakeOptions = {},
  checkOptions: Partial<RailOptions> = {},
): Promise<{ report: RailReport; log: CommandLog }> {
  await recordRail({ cwd, runCommand: fakeRunner([], record) })
  const log: CommandLog = []
  const report = await runRail({ cwd, runCommand: fakeRunner(log, check), ...checkOptions })
  return { report, log }
}

function failuresOf(report: RailReport): string[] {
  return report.phases.flatMap((p) => p.failures)
}

describe('REQ-255 a baseline is recorded per stored reference', () => {
  it('test_UAT_FC_REQ_255_a_baseline_is_recorded_per_reference', async () => {
    // Requirement 1 — the baseline says what each reference currently scores,
    // in enough detail that a later run can be judged better, same, or worse.
    const cwd = fakeRepo()
    await recordRail({ cwd, runCommand: fakeRunner([]) })

    const doc = JSON.parse(readFileSync(path.join(cwd, BASELINE_FILE), 'utf8')) as RailBaseline
    expect(Object.keys(doc.references).sort()).toEqual([...REFERENCES].sort())
    for (const name of REFERENCES) {
      const probes = doc.references[name].probes
      expect(Object.keys(probes).sort()).toEqual(['gate', 'l1-gate'])
      // Enough detail to judge: the numbers a later run moves, not just a verdict word.
      expect(probes.gate['perceptual.meanDiff']).toBe(12.3)
      expect(probes.gate['values.matched']).toBe(88)
      expect(probes['l1-gate']['sampleFidelity.maxDelta']).toBe(0.89)
      expect(doc.references[name].notes?.gate).toBe('reproduction-wrong')
    }
  })

  it('test_UAT_FC_REQ_255_with_no_baseline_the_rail_refuses_rather_than_passes', async () => {
    // "No worse than before" is not computable against nothing, and a rail that
    // returned green here would be worse than no rail at all.
    const report = await runRail({ cwd: fakeRepo(), runCommand: fakeRunner([]) })
    expect(report.pass).toBe(false)
    expect(failuresOf(report).join('\n')).toContain('repro-rail record')
  })

  it('test_UAT_FC_REQ_255_a_check_run_never_moves_the_bar', async () => {
    // Requirement 7 — baselines are updated deliberately, never silently. An
    // automated run may not move the bar it is being measured against, so a run
    // that is BETTER than the bar must leave the file byte-identical.
    const cwd = fakeRepo()
    await recordRail({ cwd, runCommand: fakeRunner([]) })
    const before = readFileSync(path.join(cwd, BASELINE_FILE), 'utf8')

    const improved = { probes: Object.fromEntries(REFERENCES.map((r) => [r, { gate: gateReport({ meanDiff: 1 }) }])) }
    const report = await runRail({ cwd, runCommand: fakeRunner([], improved) })

    expect(readFileSync(path.join(cwd, BASELINE_FILE), 'utf8')).toBe(before)
    expect(report.phases.flatMap((p) => p.improvements).length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ_255_re_recording_says_what_moved', async () => {
    // Requirement 7 again, from the other side: the explicit act shows the
    // person what they are accepting rather than swallowing it.
    const cwd = fakeRepo()
    await recordRail({ cwd, runCommand: fakeRunner([]) })
    const second = await recordRail({
      cwd,
      runCommand: fakeRunner([], { probes: { 'faelan.com': { gate: gateReport({ meanDiff: 40 }) } } }),
    })
    expect(second.recorded?.join('\n')).toContain('faelan.com: gate.perceptual.meanDiff 12.3 → 40')
  })
})

describe('REQ-255 one command, one pass/fail, over every phase', () => {
  it('test_UAT_FC_REQ_255_one_command_reports_one_pass_fail_over_every_phase', async () => {
    // Requirement 2 — an automated caller has exactly one thing to check.
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, {})
    expect(report.pass).toBe(true)
    expect(report.phases.map((p) => p.name)).toEqual(PHASES)
  })

  it('test_UAT_FC_REQ_255_the_bare_invocation_runs_every_phase', async () => {
    // Driven through the argument parser rather than a hand-built options
    // object, because that is what `bin/repro-rail` does and the difference is
    // not cosmetic: the parser builds its lists by pushing, so a no-flag run
    // arrives with empty ones, and reading an empty list as "none of them"
    // produced a rail that passed in no time at all having checked nothing.
    const cwd = fakeRepo()
    await recordRail({ cwd, runCommand: fakeRunner([]) })
    const report = await runRail({ ...parseRailArgs([], cwd), runCommand: fakeRunner([]) })
    expect(report.phases.map((p) => p.name)).toEqual(PHASES)
    expect(report.pass).toBe(true)
    expect(report.partial).toBe(false)
  })

  it('test_UAT_FC_REQ_255_the_rail_runs_the_suite_the_typecheck_and_a_worker_build', async () => {
    // Requirements 5 and 6. The Worker build check is here because
    // `apps/control-app` imports the engine straight out of `tools/generate/src`,
    // so an engine edit is an edit to deployed code.
    const cwd = fakeRepo()
    const { log } = await recordThenCheck(cwd, {})
    expect(log).toContain('pnpm dryrun:control')
    expect(log.some((line) => line.includes('vitest run'))).toBe(true)
    // "the typecheck" is BOTH of this repo's two script names. `build` reaches
    // `apps/*`; `typecheck` reaches `packages/framework`, `packages/site-schema`
    // and `tools/generate` — and that last one is the reproduction engine, the
    // package this whole rail exists to guard. Running only `build` left it
    // unchecked by anything.
    for (const argv of TYPECHECK_COMMANDS) expect(log).toContain(argv.join(' '))
    expect(TYPECHECK_COMMANDS.map((a) => a.join(' '))).toContain('pnpm -r typecheck')
  })

  it('test_UAT_FC_REQ_255_the_engine_typecheck_failing_fails_the_rail', async () => {
    // The half of the typecheck that reaches `tools/generate`. Before it was
    // added the phase was green whatever the engine did, which is the one thing
    // a rail guarding the engine may not be.
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, { failing: ['-r typecheck'] })
    expect(report.pass).toBe(false)
    expect(report.phases.find((p) => p.name === 'typecheck')!.pass).toBe(false)
    expect(failuresOf(report).join('\n')).toContain('pnpm -r typecheck')
  })

  it('test_UAT_FC_REQ_255_a_failing_typecheck_or_worker_build_fails_the_rail_by_name', async () => {
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, { failing: ['dryrun:control'] })
    expect(report.pass).toBe(false)
    expect(report.phases.find((p) => p.name === 'worker-build')!.pass).toBe(false)
    expect(failuresOf(report).join('\n')).toContain('dryrun:control')
    // and the phases either side are untouched — a named failure, not a blanket one
    expect(report.phases.find((p) => p.name === 'typecheck')!.pass).toBe(true)
    expect(report.phases.find((p) => p.name === 'references')!.pass).toBe(true)
  })

  it('test_UAT_FC_REQ_255_every_phase_runs_so_a_second_failure_is_not_hidden', async () => {
    // Requirement 4 — a rail that stopped at the first failure would hide the
    // second, and the thing it is restraining cannot act on what it is not told.
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, {
      failing: ['-r build'],
      probes: { 'faelan.com': { gate: gateReport({ meanDiff: 40 }) } },
    })
    expect(report.pass).toBe(false)
    const text = failuresOf(report).join('\n')
    expect(text).toContain('pnpm -r build')
    expect(text).toContain('faelan.com')
  })

  it('test_UAT_FC_REQ_255_the_report_times_every_phase_and_the_run', () => {
    // Requirement 8 — the rail sits in the inner loop, so its runtime is a
    // design constraint. It is reported on every run so the constraint is
    // measurable rather than asserted.
    const report: RailReport = {
      pass: true,
      partial: false,
      ms: 1234,
      phases: PHASES.map((name) => ({ name, pass: true, ms: 100, summary: 's', failures: [], improvements: [], skipped: [] })),
    }
    const text = formatRailReport(report)
    expect(text).toContain('1.2s')
    for (const phase of PHASES) expect(text).toContain(phase)
  })
})

describe('REQ-255 every stored reference is re-gated', () => {
  it('test_UAT_FC_REQ_255_every_stored_reference_is_regated', async () => {
    // Requirement 3 — the three stored today, discovered rather than listed, so
    // a fourth is gated the moment it exists.
    const cwd = fakeRepo()
    const { log } = await recordThenCheck(cwd, {})
    for (const name of REFERENCES) {
      const bundle = path.join('storage', 'references', name, 'index')
      // The verb and its arguments are the contract; WHERE `1c.mjs` sits is an
      // installation detail, resolved from the module rather than from a cwd.
      expect(log.some((line) => line.startsWith('node') && line.endsWith(` refold --ref ${bundle}`))).toBe(true)
      expect(log.some((line) => line.startsWith('node') && line.includes(` l1-gate --ref ${bundle} --json`))).toBe(true)
      expect(log.some((line) => line.includes(` gate ${railSlug(name)} --ref ${bundle} --json --sandbox`))).toBe(true)
    }
  })

  it('test_UAT_FC_REQ_255_a_re_run_refolds_and_never_re_captures', async () => {
    // Re-capturing would re-roll the oracle, so the reference would move at the
    // same moment the fold did and the two changes would be inseparable —
    // which is the one comparison the rail exists to make.
    const cwd = fakeRepo()
    const { log } = await recordThenCheck(cwd, {})
    expect(log.some((line) => line.includes(' refold '))).toBe(true)
    expect(log.some((line) => line.includes(' capture '))).toBe(false)
  })

  it('test_UAT_FC_REQ_255_gating_nothing_is_a_failure_not_a_pass', async () => {
    // The bundles are gitignored, so a fresh checkout or worktree has none. A
    // green rail that gated nothing is the exact shape of the failure this
    // whole ticket exists to prevent.
    const cwd = fakeRepo([])
    await recordRail({ cwd, runCommand: fakeRunner([]) })
    const report = await runRail({ cwd, runCommand: fakeRunner([]) })
    expect(report.pass).toBe(false)
    expect(failuresOf(report).join('\n')).toContain('no stored reference was gated')
  })

  it('test_UAT_FC_REQ_255_a_baselined_reference_with_no_bundle_is_named', async () => {
    const cwd = fakeRepo()
    await recordRail({ cwd, runCommand: fakeRunner([]) })
    rmSync(path.join(cwd, 'storage', 'references', 'faelan.com'), { recursive: true, force: true })
    const report = await runRail({ cwd, runCommand: fakeRunner([]) })
    expect(report.pass).toBe(false)
    expect(failuresOf(report).join('\n')).toContain('faelan.com: on the recorded bar and no bundle is stored')
  })
})

describe('REQ-255 a failure names which reference regressed, and on what', () => {
  it('test_UAT_FC_REQ_255_a_regressed_reference_is_named_and_so_is_what_regressed', async () => {
    // Requirement 4, and the ticket's own acceptance test: break the engine for
    // one reference and the rail must say which one and on which number.
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, {
      probes: { 'gigabytealchemy.ai': { gate: gateReport({ meanDiff: 106.84, pct: 80.3 }) } },
    })
    expect(report.pass).toBe(false)
    const text = failuresOf(report).join('\n')
    expect(text).toContain('gigabytealchemy.ai')
    expect(text).toContain('perceptual.meanDiff')
    expect(text).toContain('12.30 → 106.84')
    // and the two it did not break are not accused
    expect(text).not.toContain('faelan.com')
    expect(text).not.toContain('joyfulculinarycreations.com')
  })

  it('test_UAT_FC_REQ_255_a_structural_gate_that_stops_passing_is_a_regression', async () => {
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, {
      probes: { 'faelan.com': { 'l1-gate': l1GateReport({ pass: false }) } },
    })
    expect(report.pass).toBe(false)
    expect(failuresOf(report).join('\n')).toContain('faelan.com: the 3-probe structural gate was passing')
  })

  it('test_UAT_FC_REQ_255_losing_matched_elements_is_a_regression', async () => {
    // `values.matched` is the one metric where higher is better: fewer matched
    // elements means the reproduction stopped producing page substance, which
    // a delta count alone would read as an improvement.
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, {
      probes: { 'faelan.com': { gate: gateReport({ matched: 40, deltas: 0 }) } },
    })
    expect(report.pass).toBe(false)
    expect(failuresOf(report).join('\n')).toContain('values.matched')
  })

  it('test_UAT_FC_REQ_255_an_improvement_passes_and_is_reported', async () => {
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, {
      probes: { 'faelan.com': { gate: gateReport({ meanDiff: 3 }) } },
    })
    expect(report.pass).toBe(true)
    expect(report.phases.flatMap((p) => p.improvements).join('\n')).toContain('faelan.com')
  })

  it('test_UAT_FC_REQ_255_noise_under_tolerance_is_not_a_regression', async () => {
    // The perceptual numbers come from rasterising a page in a real browser and
    // are reproducible to about a decimal place. A rail that failed on the
    // third would cry wolf every run and be switched off.
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, {
      probes: { 'faelan.com': { gate: gateReport({ meanDiff: 12.4 }) } },
    })
    expect(report.pass).toBe(true)
  })

  it('test_UAT_FC_REQ_255_a_reference_that_cannot_be_gated_is_named_not_skipped', async () => {
    // `faelan.com` is stored in the pre-multistate format and cannot be
    // refolded at all. Whatever the cause, a reference the rail could not grade
    // is a hole in its coverage and must be said out loud.
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, { refoldFails: 'faelan.com' })
    expect(report.pass).toBe(false)
    const text = failuresOf(report).join('\n')
    expect(text).toContain('faelan.com: `1c refold` failed')
    expect(text).toContain('predates multi-state capture')
  })

  it('test_UAT_FC_REQ_255_a_probe_that_reports_nothing_is_a_failure_not_a_pass', async () => {
    // The probe's exit code is NOT the signal — `1c gate` exits non-zero
    // whenever the reconciliation fails, which is the ordinary state of every
    // reference today. What separates "graded it and it is bad" from "fell
    // over" is whether a report came back.
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, { garbageGate: 'joyfulculinarycreations.com' })
    expect(report.pass).toBe(false)
    expect(failuresOf(report).join('\n')).toContain('joyfulculinarycreations.com: gate produced no report')
  })

  it('test_UAT_FC_REQ_255_a_probe_that_fell_over_says_why_not_only_that_it_did', async () => {
    // Naming the reference and the probe is half of requirement 4. A failure a
    // caller can act on has to carry the reason too, and for a probe that
    // produced nothing the reason is whatever the process said — otherwise the
    // line reads "printed no JSON document:" followed by nothing at all, which
    // is what it did before this was fixed.
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, { garbageGate: 'joyfulculinarycreations.com' })
    const text = failuresOf(report).join('\n')
    expect(text).toContain('browserType.launch: Executable does not exist')
    // the HEAD of the output, not its tail: a thrown error ends in teardown
    expect(text).not.toContain('temporary directories cleanup')
    // and the process's own ANSI colour does not bleed into the rail's report
    expect(text).not.toMatch(/\[\d+m/)
  })

  it('test_UAT_FC_REQ_255_a_preparation_step_that_fell_over_says_why', async () => {
    // Same requirement, the other place a reference can fail to be graded: the
    // refold/repro steps that run before any probe does.
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, { refoldFails: 'faelan.com' })
    expect(failuresOf(report).join('\n')).toContain('predates multi-state capture')
  })

  it('test_UAT_FC_REQ_255_skipping_the_browser_probe_is_reported_not_silent', async () => {
    // --no-browser is there because the rendered probe cannot run everywhere
    // (this sandbox cannot launch Chromium at all). It shrinks what was gated,
    // so the run is PARTIAL, never plain green: `pass` says nothing regressed,
    // `partial` says the run did not look everywhere, and the two are reported
    // separately because they answer different questions.
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, {}, {}, { noBrowser: true })
    expect(report.pass).toBe(true)
    expect(report.partial).toBe(true)
    const text = report.phases.flatMap((p) => p.skipped).join('\n')
    for (const name of REFERENCES) expect(text).toContain(`${name}: gate not run (--no-browser)`)
    // and the operator read says so in the verdict line, not in a footnote
    expect(formatRailReport(report)).toContain('PASS (partial')
  })

  it('test_UAT_FC_REQ_255_a_full_run_is_not_partial', async () => {
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, {})
    expect(report.pass).toBe(true)
    expect(report.partial).toBe(false)
    expect(formatRailReport(report)).toContain('regression rail: PASS  ')
  })

  it('test_UAT_FC_REQ_255_narrowing_to_one_reference_is_a_partial_run', async () => {
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, {}, {}, { references: ['faelan.com'] })
    expect(report.partial).toBe(true)
    expect(report.phases.flatMap((p) => p.skipped).join('\n')).toContain('only faelan.com was gated')
  })
})

describe('REQ-255 the suite is judged against a recorded bar too', () => {
  it('test_UAT_FC_REQ_255_a_newly_failing_test_file_fails_the_rail', async () => {
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, { failingTests: ['tests/b.test.ts'] })
    expect(report.pass).toBe(false)
    expect(failuresOf(report).join('\n')).toContain('tests/b.test.ts fails and was not failing when the baseline was recorded')
  })

  it('test_UAT_FC_REQ_255_a_test_file_already_failing_when_the_bar_was_set_does_not_fail_the_rail', async () => {
    // The suite is not green on every machine — a missing native dependency
    // fails three dozen files here and has nothing to do with the engine. The
    // rail's contract is "no worse", so that is the contract for the suite too.
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, { failingTests: ['tests/b.test.ts'] }, { failingTests: ['tests/b.test.ts'] })
    expect(report.pass).toBe(true)
    const tests = report.phases.find((p) => p.name === 'tests')!
    expect(tests.summary).toContain('1 of them already on the recorded bar')
  })

  it('test_UAT_FC_REQ_255_a_test_file_that_starts_passing_is_an_improvement', async () => {
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, {}, { failingTests: ['tests/b.test.ts'] })
    expect(report.pass).toBe(true)
    expect(report.phases.find((p) => p.name === 'tests')!.improvements.join('\n')).toContain('tests/b.test.ts')
  })

  it('test_UAT_FC_REQ_255_a_suite_that_produces_no_report_is_a_failure', async () => {
    const cwd = fakeRepo()
    const { report } = await recordThenCheck(cwd, { failing: ['vitest'] })
    expect(report.pass).toBe(false)
    expect(failuresOf(report).join('\n')).toContain('produced no report')
  })

  it('test_UAT_FC_REQ_255_narrowing_the_suite_is_visible_in_the_report', async () => {
    // Requirement 8 makes runtime a design constraint, so the scope can be
    // narrowed for an inner loop — but a narrowed run must never read like a
    // whole one.
    const cwd = fakeRepo()
    const { report, log } = await recordThenCheck(cwd, {}, {}, { tests: ['tests/req88'] })
    expect(log.some((line) => line.includes('vitest run tests/req88'))).toBe(true)
    expect(report.phases.find((p) => p.name === 'tests')!.summary).toContain('matching tests/req88')
    expect(report.partial).toBe(true)
  })
})

describe('REQ-255 the comparison itself', () => {
  it('test_UAT_FC_REQ_255_a_metric_path_reads_counts_flags_and_summed_arrays', () => {
    const report = l1GateReport({ unmatched: 3, findings: 2 })
    expect(readMetric(report, 'sampleFidelity.maxDelta')).toBe(0.89)
    expect(readMetric(report, 'sampleFidelity.unmatched')).toBe(3)
    expect(readMetric(report, 'pass')).toBe(1)
    expect(readMetric(report, 'offSample.byWidth[].findings')).toBe(2)
    // A path that does not resolve is absent, never a silent zero.
    expect(readMetric(report, 'nothing.here')).toBeUndefined()
  })

  it('test_UAT_FC_REQ_255_a_metric_on_the_bar_that_this_run_did_not_report_is_a_failure', () => {
    // Coverage that quietly shrinks is the failure the whole rail is built
    // against, so a report that stopped carrying a number counts as one.
    const probe = probeNamed('gate')!
    const before = extractMetrics(probe, gateReport())
    const after = { ...before }
    delete after['perceptual.meanDiff']
    const comparison = compareProbe('faelan.com', probe, before, after)
    expect(comparison.missing).toContain('perceptual.meanDiff')
  })

  it('test_UAT_FC_REQ_255_a_metric_added_since_the_bar_was_set_is_not_a_regression', () => {
    // Otherwise every change to the metric table would be an emergency.
    const probe = probeNamed('gate')!
    const after = extractMetrics(probe, gateReport({ meanDiff: 999 }))
    expect(compareProbe('faelan.com', probe, {}, after).regressions).toEqual([])
  })
})

describe('REQ-255 the rail is a dev tool and cannot be deployed', () => {
  it('test_UAT_FC_REQ_255_the_rail_has_its_own_launcher_and_the_cli_does_not_reach_it', () => {
    // Same reasoning as the console's ([[EPIC-12]] §8.6): `apps/control-app`
    // imports the engine straight out of `tools/generate/src`, so a `1c`
    // subcommand here would put a dev tool into the import graph of the package
    // a deployed Worker reads from.
    const launcher = path.join(REPO_ROOT, 'bin', 'repro-rail')
    expect(readFileSync(launcher, 'utf8')).toContain('tools/repro-console/bin/repro-rail.mjs')
    expect(existsSync(path.join(REPO_ROOT, 'tools', 'repro-console', 'bin', 'repro-rail.mjs'))).toBe(true)

    const cli = readFileSync(path.join(REPO_ROOT, 'tools', 'generate', 'src', 'cli', 'index.ts'), 'utf8')
    expect(cli.includes('repro-rail')).toBe(false)

    // And it is still in the package `pnpm -r build` visits as a no-op.
    const manifest = JSON.parse(
      readFileSync(path.join(REPO_ROOT, 'tools', 'repro-console', 'package.json'), 'utf8'),
    ) as { scripts?: Record<string, string> }
    expect(Object.keys(manifest.scripts ?? {})).not.toContain('build')
  })

  it('test_UAT_FC_REQ_255_the_baseline_and_the_rails_scratch_are_not_committed', () => {
    // The numbers come from gitignored third-party bundles, and the perceptual
    // ones from whatever browser this machine has. A committed baseline would
    // be a claim about one laptop that every other machine fails.
    const ignore = readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf8')
    expect(ignore).toContain('/storage/rail/')
    expect(BASELINE_FILE.startsWith(path.join('storage', 'rail'))).toBe(true)
    expect(VITEST_REPORT_FILE.startsWith(path.join('storage', 'rail'))).toBe(true)
  })

  it('test_UAT_FC_REQ_255_the_arguments_are_what_the_launcher_documents', () => {
    const args = parseRailArgs(['record', '--json', '--no-browser', '--tests', 'tests/x', '--reference', 'faelan.com', '--only', 'references'], '/repo')
    expect(args).toMatchObject({ record: true, json: true, noBrowser: true, tests: ['tests/x'], references: ['faelan.com'], only: ['references'] })
    expect(() => parseRailArgs(['--nope'], '/repo')).toThrow(/unknown argument/)
    expect(() => parseRailArgs(['--only', 'everything'], '/repo')).toThrow(/--only expects one of/)
  })
})

describe('REQ-255 the probe contract against the real CLI', () => {
  const stored = discoverReferences(REPO_ROOT).filter((r) =>
    existsSync(path.join(REPO_ROOT, r.bundleDir, 'multistate.json')),
  )

  it.skipIf(stored.length === 0)(
    'test_UAT_FC_REQ_255_the_probe_contract_holds_against_the_real_cli',
    async () => {
      // The one leg with no substitute in it. It proves the thing most likely
      // to drift silently: that `1c l1-gate` still accepts the flags the rail
      // passes, still prints a document, and that every metric path the
      // baseline is built from still resolves against it. The browser-driven
      // probe is not reachable from a test and is covered above through the
      // same seam the real runner plugs into.
      const reference = stored[0]
      const { cmd, args } = oneC(probeArgv(probeNamed('l1-gate')!, reference))
      expect(args).toContain('--json')
      const result = await spawnCommand(cmd, args, REPO_ROOT)
      const report = parseJsonOutput<Record<string, unknown>>(result.stdout, '1c l1-gate')
      const metrics = extractMetrics(probeNamed('l1-gate')!, report)
      for (const metric of probeNamed('l1-gate')!.metrics) {
        expect(metrics, `${metric.key} no longer resolves against a real l1-gate report`).toHaveProperty(metric.key)
      }
      // and the preparation steps the rail runs first are the offline ones
      expect(preparationArgv(reference).map((a) => a[0])).toEqual(['refold', 'repro'])
      expect(PROBES.map((p) => p.name)).toEqual(['l1-gate', 'gate'])
    },
    120_000,
  )
})
