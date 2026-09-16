/**
 * The regression rail (REQ-255, [[EPIC-12]] §8.4).
 *
 * One command, one pass/fail, and — when it fails — the name of what broke.
 *
 * WHAT IT IS FOR. The characteristic failure of iterative reproduction work is
 * that a fix aimed at the site in front of you breaks the two you cannot see.
 * A single-site UAT structurally cannot catch that: it proves the one gap
 * closed. This rail re-gates every stored reference against a recorded bar, so
 * "no worse than before" becomes computable.
 *
 * WHO RUNS IT. The free-coding session that implements a gap ticket, as its
 * gate. [[REQ-256]]'s console runs it read-only, to show cross-site state per
 * iteration — which is why the report is available as JSON as well as prose.
 *
 * WHY IT SPAWNS RATHER THAN IMPORTS. `1c` is TypeScript compiled on the fly
 * ([[REQ-150]]); a long-lived process that imported the engine would hold its
 * module graph and keep grading the code it started with. Spawning is what
 * makes "run it again with the fix in" mean what it says — the same reason the
 * console spawns, and the same runner.
 */
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { slugForUrl } from './console'
import { headOf, oneC, parseJsonOutput, spawnCommand, tailOf, type CommandRunner } from './run'
import {
  BASELINE_FILE,
  PROBES,
  RAIL_DIR,
  compareProbe,
  emptyBaseline,
  extractMetrics,
  readBaseline,
  writeBaseline,
  type Improvement,
  type ProbeSpec,
  type RailBaseline,
  type ReferenceBaseline,
  type Regression,
} from './baseline'

export type PhaseName = 'typecheck' | 'worker-build' | 'tests' | 'references'

/**
 * Every phase runs, and every failure is reported.
 *
 * Fail-fast was the cheaper design and it is the wrong one: a rail that stops
 * at the first failure hides the second, and requirement 4 is that the thing
 * being restrained can act on what it is told. Cheap phases run first anyway,
 * so the common failures arrive early in the output.
 */
export const PHASES: PhaseName[] = ['typecheck', 'worker-build', 'tests', 'references']

export interface PhaseResult {
  name: PhaseName
  pass: boolean
  ms: number
  /** What this phase actually covered — so a narrowed run is visible, never silent. */
  summary: string
  /** One line per thing that is wrong, each naming what it is. */
  failures: string[]
  /** One line per thing that is better than the bar. Never a failure. */
  improvements: string[]
  /**
   * One line per thing this phase deliberately did not cover.
   *
   * Not a failure and never silent. A reduced-coverage run must not read like a
   * full one, so these carry up into {@link RailReport.partial} and out through
   * the exit code — see {@link main}.
   */
  skipped: string[]
}

export interface RailReport {
  pass: boolean
  /**
   * True when nothing regressed but something was deliberately not gated.
   *
   * Distinct from `pass` because they answer different questions: `pass` is "is
   * anything worse", `partial` is "did this run actually look everywhere". A
   * caller that reads only the exit code gets the strict answer by default —
   * `main` exits 2 for a partial pass, so `exit == 0` still means what it looks
   * like it means.
   */
  partial: boolean
  ms: number
  phases: PhaseResult[]
  /** Set when the run was a `record`, listing what the bar moved from and to. */
  recorded?: string[]
}

export interface RailOptions {
  /** Repo root — every command runs from there. */
  cwd: string
  /** Injectable so the suite can exercise the whole rail without a browser. */
  runCommand?: CommandRunner
  /** Positional vitest patterns. Empty means the whole suite. */
  tests?: string[]
  /** Skip the browser probe. The report says so; coverage never shrinks silently. */
  noBrowser?: boolean
  /** Limit to these references by name. Empty means every stored one. */
  references?: string[]
  /** Limit to these phases. Empty means all of them. */
  only?: PhaseName[]
  /** Progress, so a five-minute run is not a blank terminal. */
  onProgress?: (line: string) => void
  /**
   * Set by {@link recordRail} only. Suppresses the "no recorded baseline" line
   * for a reference the run is in the middle of recording one for — which is
   * otherwise an instruction to do the thing you are already doing.
   */
  recording?: boolean
}

// ── references ───────────────────────────────────────────────────────────────

export interface DiscoveredReference {
  /** The host the bundle is stored under — what a failure line names. */
  name: string
  /** Repo-relative bundle directory, which is what `--ref` takes. */
  bundleDir: string
}

/**
 * Every stored reference whose home-page bundle is on disk.
 *
 * Discovered rather than listed. A hardcoded three would have to be edited by
 * whoever adds a fourth, and the failure mode of a hand-kept list is a
 * reference nobody gates. `index` is the home page, which is the whole scope
 * ([[EPIC-12]] §8).
 */
export function discoverReferences(cwd: string): DiscoveredReference[] {
  const root = path.join(cwd, 'storage', 'references')
  if (!existsSync(root)) return []
  const found: DiscoveredReference[] = []
  for (const name of readdirSync(root).sort()) {
    const bundleDir = path.join('storage', 'references', name, 'index')
    if (existsSync(path.join(cwd, bundleDir, 'capture.json'))) found.push({ name, bundleDir })
  }
  return found
}

/** The sandbox slug a rail run reproduces a reference into. */
export function railSlug(reference: string): string {
  return slugForUrl(reference, 'rail')
}

/** `1c <probe> …` for one reference. */
export function probeArgv(probe: ProbeSpec, reference: DiscoveredReference): string[] {
  const argv = [probe.name]
  if (probe.needsSlug) argv.push(railSlug(reference.name))
  argv.push('--ref', reference.bundleDir, '--json')
  if (probe.needsSlug) argv.push('--sandbox')
  return argv
}

/**
 * Re-derive the reference's L1 from its own retained oracle, then reproduce it.
 *
 * A re-run refolds rather than re-captures. Re-capturing would re-roll the
 * oracle, so the reference would move at the same moment the fold did and the
 * two changes would be inseparable — which is the one comparison this rail
 * exists to make. It is also why the rail never needs the network.
 */
export function preparationArgv(reference: DiscoveredReference): string[][] {
  return [
    ['refold', '--ref', reference.bundleDir],
    ['repro', railSlug(reference.name), '--ref', reference.bundleDir, '--sandbox'],
  ]
}

// ── one collected reference ──────────────────────────────────────────────────

/**
 * Quote a process's own output inside a failure line without it being mistaken
 * for one. Failure lines are already indented by the formatter, so a multi-line
 * one has to carry its own continuation indent or its second line reads as the
 * next finding.
 */
function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => `      │ ${line}`)
    .join('\n')
}

interface ReferenceObservation {
  name: string
  probes: Record<string, Record<string, number>>
  notes: Record<string, string>
  /** A probe that could not produce numbers, and why. */
  errors: string[]
  /** A probe deliberately not run — named so the shortfall is visible. */
  skipped: string[]
}

async function observeReference(
  reference: DiscoveredReference,
  opts: RailOptions,
  run: CommandRunner,
): Promise<ReferenceObservation> {
  const observation: ReferenceObservation = { name: reference.name, probes: {}, notes: {}, errors: [], skipped: [] }

  for (const argv of preparationArgv(reference)) {
    opts.onProgress?.(`  ${reference.name}: 1c ${argv[0]}`)
    const { cmd, args } = oneC(argv)
    const result = await run(cmd, args, opts.cwd)
    if (result.code !== 0) {
      observation.errors.push(`${reference.name}: \`1c ${argv[0]}\` failed —\n${indent(headOf(result, 3))}`)
      return observation
    }
  }

  for (const probe of PROBES) {
    if (probe.needsBrowser && opts.noBrowser) {
      observation.skipped.push(`${reference.name}: ${probe.name} not run (--no-browser) — ${probe.covers}`)
      continue
    }
    opts.onProgress?.(`  ${reference.name}: 1c ${probe.name}`)
    const argv = probeArgv(probe, reference)
    const { cmd, args } = oneC(argv)
    const result = await run(cmd, args, opts.cwd)
    try {
      const report = parseJsonOutput<Record<string, unknown>>(result.stdout, `1c ${probe.name} on ${reference.name}`)
      observation.probes[probe.name] = extractMetrics(probe, report)
      if (typeof report.verdict === 'string') observation.notes[probe.name] = report.verdict
    } catch (err) {
      // The probe's own exit code is NOT the signal. `1c gate` exits non-zero
      // whenever the reconciliation fails, which is the ordinary state of every
      // reference today; what separates "graded it and it is bad" from "fell
      // over" is whether a report came back.
      //
      // What the process said is quoted alongside the parse failure, because
      // the parse failure alone says nothing actionable. The commonest way a
      // probe falls over is a browser that will not launch, and that refusal is
      // printed on stderr — so a message built only from stdout reads as an
      // empty document and leaves the operator with a named reference and no
      // reason. Requirement 4 is that a failure can be acted on.
      //
      // The HEAD, not the tail: a thrown error leads with its message and then
      // unwinds, so this class of failure ends in teardown chatter and begins
      // with the reason. See `headOf`.
      observation.errors.push(
        `${reference.name}: ${probe.name} produced no report — ` +
          `${err instanceof Error ? err.message.split('\n')[0] : String(err)}\n` +
          indent(headOf(result, 3)),
      )
    }
  }
  return observation
}

// ── phases ───────────────────────────────────────────────────────────────────

function elapsed(from: number): number {
  return Date.now() - from
}

/**
 * Run one or more commands and fail the phase if any of them does.
 *
 * Plural because "the typecheck" is two commands in this repo and neither alone
 * is it — see {@link TYPECHECK_COMMANDS}. Every command runs even after one has
 * failed, for the same reason every phase does: a report that stops at the
 * first failure hides the second.
 */
async function commandPhase(
  name: PhaseName,
  argvs: string[][],
  summary: string,
  opts: RailOptions,
  run: CommandRunner,
): Promise<PhaseResult> {
  const started = Date.now()
  const failures: string[] = []
  for (const argv of argvs) {
    opts.onProgress?.(`${name}: ${argv.join(' ')}`)
    const result = await run(argv[0], argv.slice(1), opts.cwd)
    if (result.code !== 0) {
      failures.push(`\`${argv.join(' ')}\` failed (exit ${result.code}) —\n${indent(tailOf(result, 4))}`)
    }
  }
  return {
    name,
    pass: failures.length === 0,
    ms: elapsed(started),
    summary,
    failures,
    improvements: [],
    skipped: [],
  }
}

/**
 * What "it typechecks" means here, and why it is two commands.
 *
 * The repo splits its packages across two script names. `apps/*` and the two
 * placeholder UI packages typecheck under `build`, which is the stage `bin/build`
 * calls the typecheck; `packages/framework`, `packages/site-schema`,
 * `tools/generate` and `tools/repro-console` typecheck under `typecheck` and are
 * not reached by `build` at all.
 *
 * Running only the first — which is what this phase did at first, on the
 * reasoning that the rail should mean by "typecheck" what the build means —
 * left `tools/generate` UNCHECKED. That is the reproduction engine: the one
 * package this whole rail exists to guard. A typecheck that cannot see the code
 * under change is not a rail, so both run and the phase fails if either does.
 */
export const TYPECHECK_COMMANDS: string[][] = [
  ['pnpm', '-r', 'build'],
  ['pnpm', '-r', 'typecheck'],
]

/** Where the vitest JSON report lands. Scratch, beside the baseline. */
export const VITEST_REPORT_FILE = path.join(RAIL_DIR, 'vitest.json')

/**
 * Where the re-check's report lands. A second file, not the first one again.
 *
 * The first report is what {@link readVitestOutcome} read `ran` out of, and
 * `ran` is what decides which bar entries are eligible to be called improved.
 * Overwriting it with a report covering three files would shrink that set to
 * three and silently stop reporting every improvement outside them.
 */
export const VITEST_RECHECK_FILE = path.join(RAIL_DIR, 'vitest-recheck.json')

/**
 * How many newly-failing files are still worth re-running to check for flakes.
 *
 * A re-check costs a second suite run, so it is bounded by the thing it is
 * looking for. One file that fails under parallel load and passes alone is a
 * flake; forty are a broken engine, and re-running forty files to be told so
 * again doubles the runtime of a rail whose runtime is a stated design
 * constraint (requirement 8).
 */
export const RECHECK_LIMIT = 10

export function vitestArgv(patterns: string[], outputFile: string = VITEST_REPORT_FILE): string[] {
  return ['pnpm', 'exec', 'vitest', 'run', ...patterns, '--reporter=json', '--outputFile', outputFile]
}

interface VitestReport {
  success?: boolean
  testResults?: Array<{ name: string; status: string }>
}

/** Test files that did not pass, repo-relative and sorted, plus everything that ran. */
export function readVitestOutcome(cwd: string, reportFile: string = VITEST_REPORT_FILE): { ran: string[]; failing: string[] } {
  const file = path.join(cwd, reportFile)
  if (!existsSync(file)) throw new Error(`vitest wrote no report at ${reportFile}`)
  const report = JSON.parse(readFileSync(file, 'utf8')) as VitestReport
  const results = report.testResults ?? []
  const rel = (name: string): string => path.relative(cwd, name) || name
  return {
    ran: results.map((r) => rel(r.name)).sort(),
    failing: results.filter((r) => r.status !== 'passed').map((r) => rel(r.name)).sort(),
  }
}

async function testsPhase(
  opts: RailOptions,
  baseline: RailBaseline,
  run: CommandRunner,
): Promise<{ result: PhaseResult; failing: string[] }> {
  const started = Date.now()
  const patterns = opts.tests ?? []
  const argv = vitestArgv(patterns)
  opts.onProgress?.(`tests: ${argv.join(' ')}`)
  rmSync(path.join(opts.cwd, VITEST_REPORT_FILE), { force: true })
  const result = await run(argv[0], argv.slice(1), opts.cwd)

  let outcome: { ran: string[]; failing: string[] }
  try {
    outcome = readVitestOutcome(opts.cwd)
  } catch (err) {
    return {
      result: {
        name: 'tests',
        pass: false,
        ms: elapsed(started),
        summary: 'the suite did not run',
        failures: [
          `the test suite produced no report — ${err instanceof Error ? err.message : String(err)}`,
          tailOf(result, 4),
        ],
        improvements: [],
        skipped: [],
      },
      failing: [],
    }
  }

  const known = new Set(baseline.failingTests)
  const candidates = outcome.failing.filter((file) => !known.has(file))
  const ran = new Set(outcome.ran)
  const nowPassing = baseline.failingTests.filter((file) => ran.has(file) && !outcome.failing.includes(file))

  const { confirmed: newlyFailing, unreliable } = await recheckFailures(candidates, opts, run)

  const skipped = patterns.length
    ? [`the suite ran only the files matching ${patterns.join(' ')} — the rest of it was not run`]
    : []
  // An unreliable file is reported as NOT GATED, not as passing and not as
  // failing. It failed once and passed once, so the rail has no verdict on it
  // to give — and `skipped` is the slot that already means exactly that, which
  // carries it into `partial` and out through exit code 2. A caller checking
  // `exit == 0` still never gets a green it has not earned.
  skipped.push(...unreliable.map((file) => `${file} failed in the suite and passed on its own — not gated, rerun it`))

  return {
    result: {
      name: 'tests',
      pass: newlyFailing.length === 0,
      ms: elapsed(started),
      summary:
        `${outcome.ran.length} test file(s)${patterns.length ? ` matching ${patterns.join(' ')}` : ' (whole suite)'}` +
        `, ${outcome.failing.length} failing, ${known.size} of them already on the recorded bar` +
        (unreliable.length ? `, ${unreliable.length} unreliable` : ''),
      failures: newlyFailing.map(
        (file) => `${file} fails and was not failing when the baseline was recorded (confirmed on a rerun)`,
      ),
      improvements: nowPassing.map((file) => `${file} was on the recorded bar as failing and now passes`),
      skipped,
    },
    // The bar must not learn a flake. A file that passes when rerun is not
    // reliably failing, so recording it would lower the bar on the strength of
    // one bad roll and stop the rail ever reporting it again.
    failing: outcome.failing.filter((file) => !unreliable.includes(file)),
  }
}

/**
 * Rerun the files that look newly broken, so a FAIL means something.
 *
 * WHY THIS EXISTS. Requirement 4 is that the thing being restrained can act on
 * what the rail tells it, and a rail that cries wolf is one the caller learns
 * to ignore — which costs more than no rail at all. This suite has files that
 * pass alone and fail under the parallel load of a whole-suite run (fixture
 * directories shared between projects, chiefly). Reported as regressions they
 * send a session hunting a break in code it never touched.
 *
 * WHY RERUNNING IS THE HONEST TEST AND NOT A RETRY-UNTIL-GREEN. A file that
 * passes the second time is not thereby declared fine: it is declared
 * UNGATED — see the caller. The rerun distinguishes "reliably broken" from "no
 * verdict available"; it never manufactures a pass.
 */
async function recheckFailures(
  candidates: string[],
  opts: RailOptions,
  run: CommandRunner,
): Promise<{ confirmed: string[]; unreliable: string[] }> {
  if (candidates.length === 0) return { confirmed: [], unreliable: [] }
  if (candidates.length > RECHECK_LIMIT) return { confirmed: candidates, unreliable: [] }

  const argv = vitestArgv(candidates, VITEST_RECHECK_FILE)
  opts.onProgress?.(`tests: rerunning ${candidates.length} newly-failing file(s) to tell a break from a flake`)
  rmSync(path.join(opts.cwd, VITEST_RECHECK_FILE), { force: true })
  await run(argv[0], argv.slice(1), opts.cwd)

  let recheck: { ran: string[]; failing: string[] }
  try {
    recheck = readVitestOutcome(opts.cwd, VITEST_RECHECK_FILE)
  } catch {
    // No report means the rerun itself did not run. Trust the first result
    // rather than downgrading a real regression on the strength of a command
    // that failed to start.
    return { confirmed: candidates, unreliable: [] }
  }

  const failedAgain = new Set(recheck.failing)
  const reran = new Set(recheck.ran)
  return {
    confirmed: candidates.filter((file) => failedAgain.has(file) || !reran.has(file)),
    unreliable: candidates.filter((file) => reran.has(file) && !failedAgain.has(file)),
  }
}

async function referencesPhase(
  opts: RailOptions,
  baseline: RailBaseline,
  run: CommandRunner,
): Promise<{ result: PhaseResult; observed: ReferenceObservation[] }> {
  const started = Date.now()
  const wanted = new Set(opts.references ?? [])
  const discovered = discoverReferences(opts.cwd).filter((r) => wanted.size === 0 || wanted.has(r.name))

  const failures: string[] = []
  const improvements: string[] = []
  const skipped: string[] = []
  const observed: ReferenceObservation[] = []

  for (const reference of discovered) {
    const observation = await observeReference(reference, opts, run)
    observed.push(observation)
    failures.push(...observation.errors)
    // A skipped probe is a shortfall in what was gated. It is reported on every
    // run rather than only when something else fails, because the coverage of
    // the rail is exactly the thing a reader of a green rail is entitled to.
    skipped.push(...observation.skipped)

    const recorded = baseline.references[reference.name]
    if (!recorded) {
      if (!opts.recording) {
        failures.push(`${reference.name}: no recorded baseline — run \`repro-rail record\` to set the bar`)
      }
      continue
    }
    for (const probe of PROBES) {
      const before = recorded.probes[probe.name]
      if (!before) continue
      const now = observation.probes[probe.name]
      if (!now) {
        if (!observation.skipped.some((line) => line.startsWith(`${reference.name}: ${probe.name} `))) {
          failures.push(`${reference.name}: ${probe.name} is on the recorded bar and produced nothing this run`)
        }
        continue
      }
      const comparison = compareProbe(reference.name, probe, before, now)
      failures.push(...comparison.regressions.map((r: Regression) => r.detail))
      improvements.push(...comparison.improvements.map((i: Improvement) => i.detail))
      failures.push(
        ...comparison.missing.map(
          (key) => `${reference.name}: ${probe.name}.${key} is on the recorded bar and this run did not report it`,
        ),
      )
    }
  }

  // A rail that gated nothing is not a rail that passed. This is the one place
  // a green result could otherwise mean "there was nothing here to check" —
  // which is exactly what a run from a fresh worktree, where the reference
  // bundles are gitignored and therefore absent, would produce.
  const baselined = Object.keys(baseline.references).length
  if (wanted.size > 0) {
    skipped.push(`only ${[...wanted].join(', ')} was gated — every other stored reference was not`)
  }
  if (discovered.length === 0) {
    failures.push(
      'no stored reference was gated: `storage/references/*/index` is empty here. ' +
        'The bundles are gitignored, so a fresh checkout or worktree has none — run the rail where they live.',
    )
  }
  for (const name of Object.keys(baseline.references)) {
    if (wanted.size === 0 && !discovered.some((r) => r.name === name)) {
      failures.push(`${name}: on the recorded bar and no bundle is stored for it — the rail did not gate it`)
    }
  }

  return {
    result: {
      name: 'references',
      pass: failures.length === 0,
      ms: elapsed(started),
      summary: `${discovered.length} reference(s) gated${baselined ? `, ${baselined} on the recorded bar` : ', nothing recorded yet'}`,
      failures,
      improvements,
      skipped,
    },
    observed,
  }
}

// ── the rail ─────────────────────────────────────────────────────────────────

interface Collected {
  phases: PhaseResult[]
  failingTests?: string[]
  observed: ReferenceObservation[]
}

async function collect(opts: RailOptions, baseline: RailBaseline): Promise<Collected> {
  const run = opts.runCommand ?? spawnCommand
  // An empty `only` means "all of them", not "none of them": `parseRailArgs`
  // builds the list by pushing, so the no-flag case arrives here as `[]`.
  const selected = new Set(opts.only?.length ? opts.only : PHASES)
  const phases: PhaseResult[] = []
  let failingTests: string[] | undefined
  let observed: ReferenceObservation[] = []

  if (selected.has('typecheck')) {
    phases.push(
      await commandPhase(
        'typecheck',
        TYPECHECK_COMMANDS,
        'every workspace package’s own typecheck, under both script names',
        opts,
        run,
      ),
    )
  }
  if (selected.has('worker-build')) {
    // `apps/control-app` imports the reproduction engine straight out of
    // `tools/generate/src`, so an engine edit is an edit to deployed code. The
    // dry run is how "the control app no longer builds" surfaces in the round
    // that caused it rather than at the next deploy ([[EPIC-12]] §8.6).
    phases.push(
      await commandPhase(
        'worker-build',
        [['pnpm', 'dryrun:control']],
        'the control Worker still bundles (`wrangler deploy --dry-run`)',
        opts,
        run,
      ),
    )
  }
  if (selected.has('tests')) {
    const tests = await testsPhase(opts, baseline, run)
    phases.push(tests.result)
    failingTests = tests.failing
  }
  if (selected.has('references')) {
    const references = await referencesPhase(opts, baseline, run)
    phases.push(references.result)
    observed = references.observed
  }
  return { phases, failingTests, observed }
}

/**
 * Run the rail and judge it against the recorded bar. WRITES NOTHING.
 *
 * That is the enforcement of requirement 7, not a remark about it: this path
 * has no call to `writeBaseline`, so an automated caller cannot move the bar it
 * is being measured against however it is invoked.
 */
export async function runRail(opts: RailOptions): Promise<RailReport> {
  const started = Date.now()
  const baseline = readBaseline(opts.cwd)
  if (!baseline) {
    return {
      pass: false,
      ms: elapsed(started),
      partial: false,
      phases: [
        {
          name: 'references',
          pass: false,
          ms: 0,
          summary: 'nothing recorded',
          failures: [
            `no baseline at ${BASELINE_FILE}. The rail cannot say "no worse" against nothing — ` +
              'record one with `repro-rail record`.',
          ],
          improvements: [],
          skipped: [],
        },
      ],
    }
  }
  const { phases } = await collect(opts, baseline)
  return {
    pass: phases.every((p) => p.pass),
    partial: phases.some((p) => p.skipped.length > 0),
    ms: elapsed(started),
    phases,
  }
}

/**
 * Run the rail and write what it saw as the new bar. THE ONLY WRITER.
 *
 * Reached from `repro-rail record` and nowhere else — re-recording is an
 * explicit act by a person, so the report says what moved rather than moving it
 * quietly. A probe that could not produce numbers keeps the bar it had: a
 * record run is allowed to lower the bar deliberately, never to erase it by
 * accident.
 */
export async function recordRail(opts: RailOptions): Promise<RailReport> {
  const started = Date.now()
  const previous = readBaseline(opts.cwd) ?? emptyBaseline()
  const { phases, failingTests, observed } = await collect({ ...opts, recording: true }, previous)

  const references: Record<string, ReferenceBaseline> = { ...previous.references }
  const recorded: string[] = []
  for (const observation of observed) {
    const before = previous.references[observation.name]
    const probes = { ...before?.probes }
    for (const [probe, metrics] of Object.entries(observation.probes)) {
      for (const [key, value] of Object.entries(metrics)) {
        const was = before?.probes[probe]?.[key]
        if (was !== value) {
          recorded.push(`${observation.name}: ${probe}.${key} ${was === undefined ? 'recorded at' : `${was} →`} ${value}`)
        }
      }
      probes[probe] = metrics
    }
    references[observation.name] = { probes, notes: { ...before?.notes, ...observation.notes } }
  }

  const next: RailBaseline = {
    version: 1,
    recordedAt: new Date().toISOString(),
    recordedAtVersion: packageVersion(opts.cwd),
    failingTests: failingTests ?? previous.failingTests,
    references,
  }
  if (failingTests) {
    const was = new Set(previous.failingTests)
    for (const file of failingTests) if (!was.has(file)) recorded.push(`tests: ${file} recorded as already failing`)
    const now = new Set(failingTests)
    for (const file of previous.failingTests) if (!now.has(file)) recorded.push(`tests: ${file} no longer failing`)
  }
  writeBaseline(opts.cwd, next)

  return {
    pass: phases.every((p) => p.pass),
    partial: phases.some((p) => p.skipped.length > 0),
    ms: elapsed(started),
    phases,
    recorded,
  }
}

function packageVersion(cwd: string): string | undefined {
  try {
    return (JSON.parse(readFileSync(path.join(cwd, 'package.json'), 'utf8')) as { version?: string }).version
  } catch {
    return undefined
  }
}

// ── the operator read ────────────────────────────────────────────────────────

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * The report a person reads. Worst first: the verdict, then every failure with
 * the reference it belongs to, then what merely got better, then the timings —
 * which are here because the rail sits in the inner loop and its runtime is a
 * design constraint rather than trivia ([[EPIC-12]] §9 Q7).
 */
export function formatRailReport(report: RailReport): string {
  const verdict = report.pass ? (report.partial ? 'PASS (partial — see what was not gated)' : 'PASS') : 'FAIL'
  const lines: string[] = [`regression rail: ${verdict}  (${seconds(report.ms)})`, '']
  for (const phase of report.phases) {
    lines.push(`  ${phase.pass ? '✓' : '✗'} ${phase.name.padEnd(13)} ${seconds(phase.ms).padStart(7)}  ${phase.summary}`)
  }
  const failures = report.phases.flatMap((p) => p.failures.map((f) => ({ phase: p.name, line: f })))
  if (failures.length) {
    lines.push('', '  what is worse than the recorded bar:')
    for (const { phase, line } of failures) lines.push(`    ✗ [${phase}] ${line}`)
  }
  const skipped = report.phases.flatMap((p) => p.skipped)
  if (skipped.length) {
    lines.push('', '  not gated by this run:')
    for (const line of skipped) lines.push(`    – ${line}`)
  }
  const improvements = report.phases.flatMap((p) => p.improvements)
  if (improvements.length) {
    lines.push('', '  better than the recorded bar (not a failure — re-record to bank it):')
    for (const line of improvements) lines.push(`    ↑ ${line}`)
  }
  if (report.recorded) {
    lines.push('', `  recorded into ${BASELINE_FILE}:`)
    if (report.recorded.length === 0) lines.push('    (nothing moved)')
    for (const line of report.recorded) lines.push(`    • ${line}`)
  }
  return lines.join('\n')
}

// ── the command ──────────────────────────────────────────────────────────────

export interface RailArgs extends RailOptions {
  record: boolean
  json: boolean
}

/** Parse `repro-rail`'s argv. Exported so the suite can hold it to its word. */
export function parseRailArgs(argv: string[], cwd: string): RailArgs {
  const args: RailArgs = { cwd, record: false, json: false, tests: [], references: [], only: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === 'record') args.record = true
    else if (arg === '--json') args.json = true
    else if (arg === '--no-browser') args.noBrowser = true
    else if (arg === '--tests') args.tests!.push(expect(argv[++i], '--tests <pattern>'))
    else if (arg === '--reference') args.references!.push(expect(argv[++i], '--reference <name>'))
    else if (arg === '--only') args.only!.push(expectPhase(argv[++i]))
    else throw new Error(`repro-rail: unknown argument '${arg}'`)
  }
  return args
}

function expect(value: string | undefined, what: string): string {
  if (value === undefined || value.startsWith('--')) throw new Error(`repro-rail: ${what} expects a value`)
  return value
}

function expectPhase(value: string | undefined): PhaseName {
  if (value !== undefined && (PHASES as string[]).includes(value)) return value as PhaseName
  throw new Error(`repro-rail: --only expects one of ${PHASES.join(', ')}, got '${value ?? ''}'`)
}

/** `bin/repro-rail`'s entry point. Exit code IS the single pass/fail. */
export async function main(argv: string[], cwd: string): Promise<void> {
  const args = parseRailArgs(argv, cwd)
  const opts: RailOptions = { ...args, onProgress: args.json ? undefined : (line) => console.error(line) }
  const report = args.record ? await recordRail(opts) : await runRail(opts)
  console.log(args.json ? JSON.stringify(report, null, 2) : formatRailReport(report))
  // 0 nothing is worse and everything was gated · 1 something regressed ·
  // 2 nothing regressed but the run covered less than the whole rail. An
  // automated caller checking `exit == 0` therefore gets the strict answer
  // without having to know that partial runs exist.
  process.exitCode = report.pass ? (report.partial ? 2 : 0) : 1
}
