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
}

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
 * A rail that throws is reported as unavailable rather than as a regression.
 * The difference matters: "the rail could not run here" is a state of this
 * checkout, and "the rail says something is worse" is a state of the engine —
 * and only the second is a finding about the thing being diagnosed.
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
    return { available: true, pass: report.pass, partial: report.partial, summary: summarise(report) }
  } catch (err) {
    return {
      available: false,
      summary: `not available — ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}
