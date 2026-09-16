/**
 * The reproduction console's state and its request handler (REQ-254).
 *
 * The handler is a pure-ish function of a request and the console's state —
 * `node:http` is wired to it in `server.ts` and nowhere else — so the whole
 * surface is exercisable without binding a socket, and the socket layer has
 * nothing in it worth a test of its own beyond "it binds to loopback".
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
// REUSED, NOT RESTATED. `resolveStaticFile` is the repo's single definition of
// how a URL path becomes a file inside a directory — confinement, directory
// index, extensionless fallback. A second copy here is exactly the shape its
// own note warns about: a traversal guard present on one served tree and
// missing on another. It is reached by relative path into `tools/generate/src`,
// the convention `apps/control-app` already follows for the same tree.
import { resolveStaticFile } from '../../generate/src/cli/static-file'
import { contentTypeOf } from '../../generate/src/store/content-type'
import { renderConsolePage, renderDiffPage, type IterationView, type PageState } from './page'
import {
  runIteration,
  spawnStepRunner,
  StepFailure,
  type IterationStep,
  type StepRunner,
} from './iteration'

/** Scratch space for every artifact the console produces. Gitignored (DOC-12). */
export const CONSOLE_WORKSPACE = path.join('storage', 'tmp', 'repro-console')

export interface ConsoleRequest {
  method: string
  /** Request path, no query string. */
  path: string
  /** Form body, for the two POSTs. */
  body?: string
}

export interface ConsoleResponse {
  status: number
  headers: Record<string, string>
  body: string | Uint8Array
}

/** A finished iteration and the artifacts it left behind. */
interface Iteration extends IterationView {
  siteOut: string
  diffOut: string
}

export interface ReproConsoleOptions {
  /** Repo root — every `1c` runs from there and every path is relative to it. */
  cwd: string
  /** Injectable so the suite can run an iteration without a browser. */
  runStep?: StepRunner
}

/**
 * Turn a typed address into something `1c` will accept as a site slug and a
 * directory name. The console owns one sandbox site per address; re-running
 * rebuilds it in place, which is what `1c repro` already does.
 *
 * `prefix` exists because the regression rail (REQ-255) reproduces the same
 * references the console does, and two tools sharing one sandbox slug would
 * have each rebuild the other's site underneath it — a rail run would silently
 * replace the iteration the operator was looking at, and vice versa. One
 * function, two namespaces, rather than a second slugifier that drifts.
 */
export function slugForUrl(url: string, prefix = 'repro'): string {
  const host = (() => {
    try {
      return new URL(url.includes('://') ? url : `https://${url}`).hostname
    } catch {
      return url
    }
  })()
  const cleaned = host.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${prefix}-${cleaned || 'site'}`
}

/** `https://` in front of a bare address, so the link and the capture agree. */
export function normalizeUrl(typed: string): string {
  const trimmed = typed.trim()
  return trimmed.includes('://') ? trimmed : `https://${trimmed}`
}

export class ReproConsole {
  private version = 0
  private running = false
  private message = ''
  private failed = false
  private url: string | null = null
  private slug = ''
  private bundleDir: string | undefined
  private readonly iterations: Iteration[] = []
  private readonly cwd: string
  private readonly runStep: StepRunner
  /** The run in flight, so `close()` and the suite can wait for it. */
  private inFlight: Promise<void> = Promise.resolve()

  constructor(opts: ReproConsoleOptions) {
    this.cwd = opts.cwd
    this.runStep = opts.runStep ?? spawnStepRunner()
  }

  /** Resolves when nothing is running. The suite's join point. */
  settled(): Promise<void> {
    return this.inFlight
  }

  state(): PageState {
    return {
      version: this.version,
      running: this.running,
      message: this.message,
      failed: this.failed,
      url: this.url,
      iterations: this.iterations.map(({ n, originalUrl, reproHref, diffHref }) => ({
        n,
        originalUrl,
        reproHref,
        diffHref,
      })),
    }
  }

  async handle(req: ConsoleRequest): Promise<ConsoleResponse> {
    const { method } = req
    const pathname = req.path

    if (method === 'GET' && pathname === '/') return html(200, renderConsolePage(this.state()))
    if (method === 'GET' && pathname === '/state') {
      return json(200, this.state())
    }
    if (method === 'POST' && (pathname === '/run' || pathname === '/run-again')) {
      return this.startRun(pathname === '/run' ? formField(req.body ?? '', 'url') : undefined)
    }
    if (pathname.startsWith('/iteration/')) return this.serveArtifact(pathname)
    return text(404, 'Not found')
  }

  /**
   * [reproduce] and [run again], which are different verbs.
   *
   * [reproduce] carries an address: it captures that site and starts the
   * iteration list over at Iteration 1. [run again] carries none: it re-runs
   * the site already loaded and appends the next iteration, so everything above
   * it stays on the page with its own artifacts.
   *
   * A second press while a run is in flight starts nothing and says so. The
   * page disables its buttons from the poller, so this is the backstop for the
   * press that lands in the gap rather than the thing a human normally meets.
   */
  private startRun(typedUrl: string | undefined): ConsoleResponse {
    if (this.running) return html(409, 'A run is already in progress. <a href="/">back</a>')

    if (typedUrl !== undefined) {
      const trimmed = typedUrl.trim()
      if (!trimmed) {
        this.message = 'Enter a site address first.'
        this.failed = true
        return seeOther('/')
      }
      this.url = normalizeUrl(trimmed)
      this.slug = slugForUrl(this.url)
      this.bundleDir = undefined
      this.iterations.length = 0
      this.version += 1
    } else if (this.url === null) {
      this.message = 'Enter a site address first.'
      this.failed = true
      return seeOther('/')
    }

    const n = this.iterations.length + 1
    const site = this.url as string
    const captureUrl = this.bundleDir === undefined ? site : undefined

    this.running = true
    this.failed = false
    this.message = `Running iteration ${n}…`
    this.inFlight = this.execute(n, captureUrl)
    return seeOther('/')
  }

  private async execute(n: number, captureUrl: string | undefined): Promise<void> {
    const dir = path.join(this.cwd, CONSOLE_WORKSPACE, this.slug, `iteration-${n}`)
    try {
      const outcome = await runIteration({
        cwd: this.cwd,
        captureUrl,
        bundleDir: this.bundleDir,
        slug: this.slug,
        dir,
        runStep: this.runStep,
        onStep: (step: IterationStep['name']) => {
          this.message = `Running iteration ${n} — ${step}…`
        },
      })
      this.bundleDir = outcome.bundleDir
      this.iterations.push({
        n,
        originalUrl: outcome.originalUrl || (this.url as string),
        reproHref: `/iteration/${n}/site/`,
        diffHref: `/iteration/${n}/diff/`,
        siteOut: outcome.siteOut,
        diffOut: outcome.diffOut,
      })
      this.message = `Iteration ${n} finished.`
      this.failed = false
      // The list changed, so the browser reloads and picks the new block up.
      this.version += 1
    } catch (err) {
      // A failed run leaves NO iteration on the page — `runIteration` stops at
      // the first step that did not do its job, so there is nothing half-built
      // to show, and the console is immediately usable again.
      this.message =
        err instanceof StepFailure
          ? `Iteration ${n} failed at ${err.step}.\n${err.message}`
          : `Iteration ${n} failed.\n${err instanceof Error ? err.message : String(err)}`
      this.failed = true
    } finally {
      this.running = false
    }
  }

  /** `/iteration/<n>/site/…` and `/iteration/<n>/diff/…`, confined to that iteration. */
  private async serveArtifact(pathname: string): Promise<ConsoleResponse> {
    const match = /^\/iteration\/(\d+)\/(site|diff)(\/.*)?$/.exec(pathname)
    if (!match) return text(404, 'Not found')
    const iteration = this.iterations.find((it) => it.n === Number(match[1]))
    if (!iteration) return text(404, 'No such iteration')
    const rest = match[3]
    // Without the trailing slash a page's relative asset references resolve one
    // level too high, so the reproduction would load with no CSS and no images.
    if (rest === undefined) return seeOther(`${pathname}/`)

    if (match[2] === 'diff' && rest === '/') return this.diffIndex(iteration)

    const root = match[2] === 'site' ? iteration.siteOut : iteration.diffOut
    const file = await resolveStaticFile(root, rest)
    if (file === 'forbidden') return text(403, 'Forbidden')
    if (!file) return text(404, 'Not found')
    return {
      status: 200,
      // Every byte here is rebuilt under the browser by the next iteration, so
      // a cached copy is a stale answer to a question about what just changed.
      headers: { 'content-type': contentTypeOf(file), 'cache-control': 'no-store, must-revalidate' },
      body: new Uint8Array(readFileSync(file)),
    }
  }

  /** The diff images, assembled from what `1c diff` wrote beside them. */
  private diffIndex(iteration: Iteration): ConsoleResponse {
    const reportFile = path.join(iteration.diffOut, 'regions.json')
    if (!existsSync(reportFile)) return text(404, 'No diff report for this iteration')
    const report = JSON.parse(readFileSync(reportFile, 'utf8')) as {
      meanDiff?: number
      pctOverThreshold?: number
      regions?: Array<{ id: number | string; crops?: { ref: string; actual: string; diff: string } }>
    }
    // `regions.json` records absolute paths, because `1c diff` wrote it for an
    // operator reading it on their own disk. The console serves the same files
    // by name out of the iteration's own directory.
    const regions = (report.regions ?? [])
      .filter((region) => region.crops !== undefined)
      .map((region) => ({
        id: region.id,
        ref: path.basename(region.crops!.ref),
        actual: path.basename(region.crops!.actual),
        diff: path.basename(region.crops!.diff),
      }))
    return html(
      200,
      renderDiffPage(iteration.n, `/iteration/${iteration.n}/diff/`, {
        meanDiff: report.meanDiff,
        pctOverThreshold: report.pctOverThreshold,
        regions,
      }),
    )
  }
}

/** One field out of an `application/x-www-form-urlencoded` body. */
export function formField(body: string, name: string): string | undefined {
  const value = new URLSearchParams(body).get(name)
  return value === null ? undefined : value
}

function html(status: number, body: string): ConsoleResponse {
  return { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }, body }
}

function json(status: number, value: unknown): ConsoleResponse {
  return {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    body: JSON.stringify(value),
  }
}

function text(status: number, body: string): ConsoleResponse {
  return { status, headers: { 'content-type': 'text/plain; charset=utf-8' }, body }
}

/**
 * Post/Redirect/Get. Both buttons are plain form posts — no client script is
 * required to start a run — and the redirect is what stops a reload from
 * starting a second one.
 */
function seeOther(location: string): ConsoleResponse {
  return { status: 303, headers: { location, 'content-type': 'text/plain; charset=utf-8' }, body: '' }
}
