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
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { CLI_ENTRY, oneC, spawnCommand, tailOf, type CommandResult } from './run'

/** One `1c` invocation. */
export interface IterationStep {
  /** Named in the failure line the page shows, so "what failed" is a verb. */
  name: 'capture' | 'refold' | 'repro' | 'page' | 'render' | 'diff'
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
  /**
   * Write this step's stdout to a file in the iteration's directory.
   *
   * How the reproduction's own L1 document is kept per iteration
   * (requirement 34). The step is `1c page get … --json`, which PRINTS the
   * document rather than writing it anywhere, so the console is what puts it on
   * disk. Doing it this way rather than copying out of `storage/sandbox/…`
   * keeps the site tree's layout where it belongs: the console knows a command
   * that yields a page, not a path where one is kept.
   */
  saveStdoutAs?: string
}

/**
 * What a step's process said. An alias, not a second shape: the rail spawns the
 * same way and the two tools share one runner (`run.ts`).
 */
export type StepResult = CommandResult

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
  /** Where this iteration's copy of the reproduction's L1 document is kept. */
  pageOut: string
}

/**
 * The page every iteration reproduces.
 *
 * Home pages only (requirement 8), and `1c repro` names the page it writes
 * `home`. Stated once here rather than spelled into the step's argv, so the day
 * this ticket's successor reproduces a second page there is one place holding
 * the assumption rather than a string to go hunting for.
 */
export const HOME_PAGE_ID = 'home'

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
    /**
     * The reproduction's own L1, kept before anything renders it
     * (requirement 34).
     *
     * `1c repro` rebuilds the sandbox site IN PLACE, so this document is
     * overwritten by the next iteration. It is where a fold change actually
     * lives — the rendered pixels and the diff images downstream of it are the
     * symptom. Keeping only those was keeping the evidence and discarding the
     * cause, which is the exact question "how much are we changing" asks.
     */
    {
      name: 'page',
      argv: ['page', 'get', plan.slug, HOME_PAGE_ID, '--sandbox', '--json'],
      saveStdoutAs: plan.pageOut,
    },
    { name: 'render', argv: ['render', plan.slug, '--sandbox', '--out', plan.siteOut] },
    {
      name: 'diff',
      argv: ['diff', plan.slug, '--ref', plan.bundleDir, '--sandbox', '--out', plan.diffOut, '--json'],
      artifact: path.join(plan.diffOut, 'regions.json'),
    },
  ]
}

/** The step that asks which captures are already on disk (requirement 32). */
export function captureListStep(): IterationStep {
  return { name: 'capture', argv: ['capture', 'list', '--json'] }
}

/** One stored capture, as `1c capture list --json` reports it. */
export interface StoredCapture {
  name: string
  dir: string
  url: string
  capturedAt: string
}

/**
 * Read the stored-capture list, or treat an unreadable answer as "none".
 *
 * Softer than {@link parseCaptureReport} deliberately. That one is parsing the
 * result of work that just ran and whose output every later step depends on, so
 * a garbled answer has to stop the run. This one is asking a question before
 * any work has started, and the honest fallback for "I could not tell what you
 * already have" is to offer nothing rather than to refuse to start.
 */
export function parseCaptureList(stdout: string): StoredCapture[] {
  try {
    const parsed = JSON.parse(stdout.trim()) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is StoredCapture =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as StoredCapture).dir === 'string' &&
        typeof (entry as StoredCapture).url === 'string',
    )
  } catch {
    return []
  }
}

/**
 * The stored capture for a typed address, if there is one (requirement 29).
 *
 * MATCHED ON HOST, AND ON THE `www.` PAIR. A capture is named after the host
 * that answered, which may not be the one that was typed — that is requirement
 * 19's whole point, and it applies just as hard in reverse: someone who typed
 * `example.com` yesterday and `www.example.com` today means the same site and
 * must be offered the same bundle, or they silently re-capture and re-roll the
 * oracle they were trying to hold still.
 */
export function findStoredCapture(stored: StoredCapture[], url: string): StoredCapture | undefined {
  const bare = (value: string): string => {
    try {
      return new URL(value.includes('://') ? value : `https://${value}`).hostname.replace(/^www\./, '').toLowerCase()
    } catch {
      return value.replace(/^www\./, '').toLowerCase()
    }
  }
  const wanted = bare(url)
  return stored.find((entry) => bare(entry.url) === wanted || bare(entry.name.split('/')[0]) === wanted)
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

/** The file whose presence marks an iteration directory complete. */
export const MANIFEST_FILE = 'iteration.json'

/**
 * What an iteration directory records about itself (requirement 33).
 *
 * Small on purpose: everything else about an iteration is derivable from the
 * directory it sits in, and a field duplicated here would be a second answer
 * waiting to disagree with the first. What cannot be derived is which site this
 * was, which URL to link back to, and which bundle it used — the bundle in
 * particular, because a capture is named after the host that ANSWERED and the
 * directory is named after the slug (requirement 19, again).
 */
export interface IterationManifest {
  n: number
  originalUrl: string
  bundleDir: string
  slug: string
}

/**
 * The completed iterations already on disk for a site, in order.
 *
 * THE CONSOLE'S MEMORY OF A SITE IS THE DISK'S, NOT THE PROCESS'S
 * (requirement 33). The artifacts outlive any one run of the console, so
 * holding the list only in memory meant restarting it showed an empty page
 * beside a full `storage/tmp/` — and made "come back tomorrow and see how far
 * this has moved" impossible for the one tool whose whole purpose is that
 * comparison.
 *
 * A directory without a readable manifest is skipped: it is a failed or
 * interrupted run, and those never became an iteration on the page in the first
 * place.
 */
export function readIterations(siteDir: string): IterationManifest[] {
  if (!existsSync(siteDir)) return []
  const found: IterationManifest[] = []
  for (const entry of readdirSync(siteDir)) {
    if (!/^iteration-\d+$/.test(entry)) continue
    const file = path.join(siteDir, entry, MANIFEST_FILE)
    if (!existsSync(file)) continue
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<IterationManifest>
      if (typeof parsed.n !== 'number' || typeof parsed.bundleDir !== 'string') continue
      found.push({
        n: parsed.n,
        originalUrl: typeof parsed.originalUrl === 'string' ? parsed.originalUrl : '',
        bundleDir: parsed.bundleDir,
        slug: typeof parsed.slug === 'string' ? parsed.slug : '',
      })
    } catch {
      // Unreadable manifest — same as none. Not a reason to hide its neighbours.
    }
  }
  return found.sort((a, b) => a.n - b.n)
}

/** A step ran and did not do its job. Carries the step name the page shows. */
export class StepFailure extends Error {
  constructor(
    readonly step: IterationStep['name'],
    readonly result: StepResult,
  ) {
    super(`${step} failed${result.code === null ? '' : ` (exit ${result.code})`}:\n${tailOf(result)}`)
    this.name = 'StepFailure'
  }
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
  /** Which iteration this is — recorded in the manifest so disk can say so later. */
  n: number
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
  pageOut: string
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
  const pageOut = path.join(opts.dir, 'page.json')

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

  for (const step of reproductionSteps({ bundleDir, slug: opts.slug, siteOut, diffOut, pageOut })) {
    opts.onStep?.(step.name)
    const result = await opts.runStep(step, opts.cwd)
    if (!stepSucceeded(step, result)) throw new StepFailure(step.name, result)
    // Written BEFORE the step is judged done for the next one, so a step whose
    // whole output is its stdout cannot be counted as having produced nothing.
    if (step.saveStdoutAs) writeFileSync(step.saveStdoutAs, result.stdout)
  }

  /**
   * The manifest, written LAST (requirement 33).
   *
   * Last because its presence is what marks the iteration complete. A run that
   * failed part-way leaves a directory with some artifacts in it and no
   * manifest, and {@link readIterations} skips exactly those — so a failure
   * cannot come back from disk as a half-built iteration on the page, which is
   * requirement 10 surviving a restart rather than holding only in memory.
   */
  const manifest: IterationManifest = { n: opts.n, originalUrl, bundleDir, slug: opts.slug }
  writeFileSync(path.join(opts.dir, MANIFEST_FILE), JSON.stringify(manifest, null, 2))

  return { bundleDir, originalUrl, siteOut, diffOut, pageOut }
}

/**
 * The real runner: `node …/tools/generate/bin/1c.mjs …`, one process per step.
 *
 * The spawn itself is `run.ts`'s, shared with the regression rail — this is the
 * step-shaped adapter onto it and nothing more. `cliEntry` stays injectable,
 * and stays resolved from the module rather than from a cwd: a step's `cwd` is
 * the tree it operates on, the CLI's own location is where the console is
 * installed, and deriving the second from the first broke the moment anything
 * ran a step against a directory that was not this checkout.
 */
export function spawnStepRunner(cliEntry: string = CLI_ENTRY): StepRunner {
  return (step, cwd) => {
    const { cmd, args } = oneC(step.argv, cliEntry)
    return spawnCommand(cmd, args, cwd)
  }
}
