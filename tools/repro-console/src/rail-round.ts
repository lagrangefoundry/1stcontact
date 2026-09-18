/**
 * The regression rail, run read-only for one console round (REQ-256 behavior 8).
 *
 * THE RAIL ITSELF IS [[REQ-255]]'s, AND THIS DOES NOT REIMPLEMENT IT. That
 * module answers one question — "is everything still as good as it was?" —
 * across every stored reference, and it is the free-coding session implementing
 * a gap ticket that runs it as a GATE. This is the other caller it was built
 * for: the console runs it per iteration so each round shows the current
 * cross-site state rather than only this site's. `rail.ts`'s own header names
 * this consumer, which is why its report is available as data and not only as
 * prose.
 *
 * READ-ONLY MEANS ITS VERDICT NEVER FAILS THE ITERATION. A red rail is
 * information for the round — and for the diagnosis, which is handed it — not
 * this round's gate. The gated round is the free-coding one, later, and it is a
 * different session.
 *
 * WHY ONLY THE `references` PHASE. The rail's other three phases — typecheck,
 * worker build, the test suite — gate the CHECKOUT, and re-running them between
 * two console iterations that changed nothing would spend minutes per round to
 * re-answer a question no reproduction asked. The cross-site comparison is the
 * `references` phase, and it is the one behavior 8 is about. The narrowing is
 * never silent: the rail reports what it did not cover, and that carries onto
 * the page with everything else it said.
 */
import { BASELINE_FILE } from './baseline'
import { runRail, type RailReport, type PhaseName } from './rail'
import { spawnCommand, type CommandRunner } from './run'

/** Which phases a console round runs. See the header for why it is not all of them. */
export const ROUND_PHASES: PhaseName[] = ['references']

/** Lets an operator point the round at something else, or turn it off. */
export const RAIL_ENV = 'REPRO_CONSOLE_RAIL'

/** What the page shows and what the round's prompt is handed. */
export interface RailRoundResult {
  available: boolean
  /** Undefined when no rail ran — "unknown" is not "pass". */
  pass?: boolean
  /** True when nothing regressed but something was deliberately not gated. */
  partial?: boolean
  /** What the page shows: the rail's own findings, or why there are none. */
  summary: string
  /**
   * The rail has no bar to measure against ([[BUG-114]]).
   *
   * ONE PARTICULAR KIND OF UNAVAILABLE, NAMED. `available: false` covers a rail
   * the operator turned off, a rail that threw, and a rail with nothing
   * recorded — three states with three different responses. Only this one is
   * fixed by a command the operator can run, which is why the console can raise
   * it to a standing notice rather than a line under an iteration.
   */
  noBaseline?: boolean
}

/**
 * What the round is told when the checkout has never recorded a bar.
 *
 * Worded as a state of the checkout and an instruction, because that is what it
 * is. A round that reads this must not go looking for a regression: there is no
 * recorded number for anything to have moved away from.
 *
 * "NOT YET RECORDED", NOT "NOT AVAILABLE" ([[BUG-114]]). Unavailable is what a
 * rail that threw is; this one is a setup step nobody has done, and the words
 * that say so are the words that get it done.
 */
export const NO_BASELINE = `not yet recorded — no baseline at ${BASELINE_FILE}; record one with \`repro-rail record\``

/**
 * The standing notice a console shows while the rail has never been recorded
 * ([[BUG-114]]).
 *
 * WHY IT IS NOT THE SUMMARY. {@link NO_BASELINE} answers "what did the rail say
 * this round" and lives under the iteration with everything else the round
 * produced. Three rounds ran on one site with that line showing and nobody
 * noticed the rail was inert, because a line under an iteration is a result and
 * results are skimmed. This one says what it COSTS to leave it unrecorded, and
 * the console puts it above the iteration list where a result never goes.
 */
export const NO_BASELINE_NOTICE =
  'the regression rail has no recorded baseline, so nothing is checking that a change made here has not ' +
  'made another site worse. Record one with `repro-rail record` — until then every round runs with the ' +
  'rail inert.'

/** `off` / `0` / `false` — the operator who does not want to wait for it. */
function disabled(env: NodeJS.ProcessEnv): boolean {
  const configured = env[RAIL_ENV]?.trim().toLowerCase()
  return configured === 'off' || configured === '0' || configured === 'false'
}

/**
 * The rail's report as one block of prose.
 *
 * Failures first, because they are what a round acts on; then what improved,
 * which is never a failure; then what was not covered, which is why `partial`
 * exists as a separate answer from `pass`.
 */
export function summarise(report: RailReport): string {
  // A rail with nothing to compare against has said nothing, and saying nothing
  // is not saying "worse". Reported before the phase loop because the phase the
  // rail returns in that case carries the explanation as a *failure*, and every
  // failure below renders with a `REGRESSED ·` prefix.
  if (report.noBaseline) return `the regression rail — ${NO_BASELINE}`
  const lines: string[] = []
  for (const phase of report.phases) {
    for (const failure of phase.failures) lines.push(`REGRESSED · ${phase.name}: ${failure}`)
    for (const better of phase.improvements) lines.push(`improved · ${phase.name}: ${better}`)
    for (const skipped of phase.skipped) lines.push(`not covered · ${phase.name}: ${skipped}`)
  }
  const verdict = report.pass ? (report.partial ? 'no worse, partially covered' : 'no worse') : 'REGRESSED'
  return [`the regression rail — ${verdict}`, ...lines].join('\n')
}

/**
 * Run the rail for one round and report what it said.
 *
 * A rail that throws — or that has no baseline to compare against — is reported
 * as unavailable rather than as a regression. The difference matters: "the rail
 * could not run here" is a state of this checkout, and "the rail says something
 * is worse" is a state of the engine — and only the second is a finding about
 * the thing being diagnosed.
 */
export async function runRailRound(
  cwd: string,
  run: CommandRunner = spawnCommand,
  env: NodeJS.ProcessEnv = process.env,
): Promise<RailRoundResult> {
  if (disabled(env)) {
    return { available: false, summary: `not run — $${RAIL_ENV} is set to off` }
  }
  try {
    const report = await runRail({ cwd, runCommand: run, only: ROUND_PHASES })
    // Same shape as the throw path below, for the same reason: the rail could
    // not run here. `pass` is left undefined rather than passed through as
    // `false` — "unknown" is not "pass", and it is not "regressed" either.
    if (report.noBaseline) return { available: false, noBaseline: true, summary: summarise(report) }
    return { available: true, pass: report.pass, partial: report.partial, summary: summarise(report) }
  } catch (err) {
    return {
      available: false,
      summary: `not available — ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}
