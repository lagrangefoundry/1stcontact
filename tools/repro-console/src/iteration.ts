/**
 * One reproduction iteration, as a sequence of fresh `1c` processes (REQ-254).
 *
 * WHY PROCESSES AND NOT IMPORTS. `1c` is TypeScript compiled on the fly: its
 * launcher boots a Vite SSR server and loads the CLI through `ssrLoadModule`
 * ([[REQ-150]]). A long-lived server that imported the engine once would hold
 * that module graph for its whole life, so an engine change landed between two
 * iterations would not be picked up — iteration N+1 would reproduce iteration
 * N's result, and nothing on the page could explain why. Spawning is what makes
 * "run it again with the fix in" mean what it says ([[EPIC-12]] §8.3).
 *
 * It is also the strongest reading of the one-way dependency rule (§8.6): the
 * console cannot drag the engine anywhere, because it never links against it.
 */
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'

/** One `1c` invocation. */
export interface IterationStep {
  /** Named in the failure line the page shows, so "what failed" is a verb. */
  name: 'capture' | 'refold' | 'repro' | 'render' | 'diff'
  /** argv after `1c`. */
  argv: string[]
  /**
   * A file the step must have produced, judged INSTEAD of its exit code.
   *
   * `1c diff` exits non-zero whenever it finds a region of interest, which is
   * the normal outcome for every reproduction worth looking at — grading it on
   * its exit code would report every real iteration as a failed run. What
   * separates "found differences" from "fell over" is whether it wrote its
   * report, so that is what is checked.
   */
  artifact?: string
}

export interface StepResult {
  code: number | null
  stdout: string
  stderr: string
}

/** Runs one step and resolves with what the process said. Injectable for tests. */
export type StepRunner = (step: IterationStep, cwd: string) => Promise<StepResult>

/** Where one iteration's artifacts live, and what the reproduction is called. */
export interface IterationPlan {
  /** The capture bundle every later step points `--ref` at. */
  bundleDir: string
  /** The sandbox slug the reproduction is imported as. */
  slug: string
  /** `1c render --out` — the rendered reproduction this iteration serves. */
  siteOut: string
  /** `1c diff --out` — this iteration's heatmaps, region triptychs and report. */
  diffOut: string
}

/** The capture step. Only the first iteration on a site runs one — see {@link REFOLD_NOTE}. */
export function captureStep(url: string): IterationStep {
  return { name: 'capture', argv: ['capture', 'page', url, '--json'] }
}

/**
 * Why a re-run refolds rather than re-captures.
 *
 * `1c refold` re-derives the bundle's `l1.json` from its OWN retained
 * `multistate.json` oracle, offline. That is what picks up an engine change
 * without re-hitting the site. Re-capturing would also re-roll the oracle, so
 * the reference would move at the same moment the fold did and the two changes
 * would be inseparable — which is the one comparison an iteration exists to
 * make.
 */
export const REFOLD_NOTE = 'refold from the retained oracle; never re-capture on a re-run'

/**
 * The steps that turn a captured bundle into a rendered, diffed reproduction.
 *
 * Order is the manual runbook's ([[DOC-19]]), unchanged: refold → repro →
 * render → diff. A step that fails ends the iteration; the ones after it do not
 * run, so a failure never leaves a half-built iteration on the page.
 */
export function reproductionSteps(plan: IterationPlan): IterationStep[] {
  return [
    { name: 'refold', argv: ['refold', '--ref', plan.bundleDir] },
    { name: 'repro', argv: ['repro', plan.slug, '--ref', plan.bundleDir, '--sandbox'] },
    { name: 'render', argv: ['render', plan.slug, '--sandbox', '--out', plan.siteOut] },
    {
      name: 'diff',
      argv: ['diff', plan.slug, '--ref', plan.bundleDir, '--sandbox', '--out', plan.diffOut, '--json'],
      artifact: path.join(plan.diffOut, 'regions.json'),
    },
  ]
}

/** What `1c capture page --json` says about the bundle it wrote. */
export interface CaptureReport {
  url: string
  name: string
  dir: string
}

/** Read the capture report out of a step's stdout, or explain why it could not be. */
export function parseCaptureReport(stdout: string): CaptureReport {
  let parsed: unknown
  try {
    parsed = JSON.parse(stdout.trim())
  } catch {
    throw new Error(`capture did not report where the bundle landed:\n${stdout.trim().slice(-400)}`)
  }
  const report = parsed as Partial<CaptureReport>
  if (typeof report.dir !== 'string' || typeof report.name !== 'string') {
    throw new Error(`capture report has no bundle directory: ${stdout.trim().slice(0, 400)}`)
  }
  return { url: typeof report.url === 'string' ? report.url : '', name: report.name, dir: report.dir }
}

/** A step ran and did not do its job. Carries the step name the page shows. */
export class StepFailure extends Error {
  constructor(
    readonly step: IterationStep['name'],
    readonly result: StepResult,
  ) {
    super(`${step} failed${result.code === null ? '' : ` (exit ${result.code})`}:\n${tail(result)}`)
    this.name = 'StepFailure'
  }
}

/**
 * The last few informative lines a failed process left behind.
 *
 * Lines with no word character in them are dropped before the tail is taken.
 * That is not cosmetic: Playwright prints its "browser is not installed"
 * refusal inside a drawn box, so the literal last line of the most common
 * capture failure is `╚═══…╝` — which told the operator that the run failed
 * and nothing whatsoever about why.
 */
function tail(result: StepResult, lines = 5): string {
  const informative = (result.stderr.trim() || result.stdout.trim())
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /\w/.test(line))
  return informative.length ? informative.slice(-lines).join('\n').slice(-600) : 'no output'
}

/** Did this step do its job? See {@link IterationStep.artifact}. */
export function stepSucceeded(step: IterationStep, result: StepResult): boolean {
  return step.artifact ? existsSync(step.artifact) : result.code === 0
}

export interface RunIterationOptions {
  /** Repo root — every `1c` runs from there. */
  cwd: string
  /** Present on the first iteration for a site; absent on a re-run. */
  captureUrl?: string
  /** Present on a re-run; absent on the first iteration for a site. */
  bundleDir?: string
  slug: string
  /** This iteration's own directory; wiped before the run so nothing stale survives. */
  dir: string
  runStep: StepRunner
  /** Called as each step starts, so the page can say what is happening. */
  onStep?: (step: IterationStep['name']) => void
}

export interface IterationOutcome {
  /** The bundle used — newly captured, or the one carried from the first iteration. */
  bundleDir: string
  /** The URL the capture actually answered on (the host may have been corrected). */
  originalUrl: string
  siteOut: string
  diffOut: string
}

/**
 * Run one iteration end to end. Throws {@link StepFailure} at the first step
 * that does not do its job, having run none of the steps after it.
 */
export async function runIteration(opts: RunIterationOptions): Promise<IterationOutcome> {
  rmSync(opts.dir, { recursive: true, force: true })
  mkdirSync(opts.dir, { recursive: true })
  const siteOut = path.join(opts.dir, 'site')
  const diffOut = path.join(opts.dir, 'diff')

  let bundleDir = opts.bundleDir
  let originalUrl = opts.captureUrl ?? ''

  if (opts.captureUrl !== undefined) {
    const step = captureStep(opts.captureUrl)
    opts.onStep?.(step.name)
    const result = await opts.runStep(step, opts.cwd)
    if (!stepSucceeded(step, result)) throw new StepFailure(step.name, result)
    const report = parseCaptureReport(result.stdout)
    bundleDir = report.dir
    originalUrl = report.url || opts.captureUrl
  }

  if (bundleDir === undefined) {
    throw new Error('nothing to reproduce yet — capture a site first')
  }

  for (const step of reproductionSteps({ bundleDir, slug: opts.slug, siteOut, diffOut })) {
    opts.onStep?.(step.name)
    const result = await opts.runStep(step, opts.cwd)
    if (!stepSucceeded(step, result)) throw new StepFailure(step.name, result)
  }

  return { bundleDir, originalUrl, siteOut, diffOut }
}

/**
 * The real runner: `node tools/generate/bin/1c.mjs …`, one process per step.
 *
 * Node is invoked directly rather than through `bin/1c`, which is a bash script
 * whose entire body is this same `exec`. Going straight to the launcher module
 * costs a shell and an executable bit we would otherwise depend on, and buys
 * nothing — the repo-root resolution `bin/1c` performs is the `cwd` we already
 * hand every step.
 */
export function spawnStepRunner(): StepRunner {
  return (step, cwd) =>
    new Promise<StepResult>((resolve, reject) => {
      const child = spawn(process.execPath, [path.join('tools', 'generate', 'bin', '1c.mjs'), ...step.argv], {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      let stdout = ''
      let stderr = ''
      child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()))
      child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()))
      child.on('error', reject)
      child.on('close', (code) => resolve({ code, stdout, stderr }))
    })
}
