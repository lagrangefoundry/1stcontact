/**
 * The reproduction console's state and its request handler (REQ-254).
 *
 * The handler is a pure-ish function of a request and the console's state —
 * `node:http` is wired to it in `server.ts` and nowhere else — so the whole
 * surface is exercisable without binding a socket, and the socket layer has
 * nothing in it worth a test of its own beyond "it binds to loopback".
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
// REUSED, NOT RESTATED. `resolveStaticFile` is the repo's single definition of
// how a URL path becomes a file inside a directory — confinement, directory
// index, extensionless fallback. A second copy here is exactly the shape its
// own note warns about: a traversal guard present on one served tree and
// missing on another. It is reached by relative path into `tools/generate/src`,
// the convention `apps/control-app` already follows for the same tree.
import { resolveStaticFile } from '../../generate/src/cli/static-file'
import { contentTypeOf } from '../../generate/src/store/content-type'
import {
  renderConsolePage,
  renderDiffPage,
  renderTicketPage,
  type AiView,
  type IterationView,
  type PageState,
  type PollState,
} from './page'
import {
  captureListStep,
  findStoredCapture,
  parseCaptureList,
  readIterations,
  readRail,
  runIteration,
  spawnStepRunner,
  StepFailure,
  type IterationStep,
  type StepRunner,
  type StoredCapture,
} from './iteration'
import {
  buildPrompt,
  CAPTURE_INCOMPLETE,
  describeCost,
  parseOutcome,
  readBrief,
  readGateReport,
  resumePreamble,
  spawnAiRunner,
  type AiOutcome,
  type AiRunner,
  type FiledTicket,
  type GateSummary,
  type TicketDraft,
} from './ai'
import { DIGEST_FILE, digestFromDisk } from './digest'
import { briefFingerprint, readSession, recordSession, resumableSession } from './session'
import { spawnCommand, type CommandRunner } from './run'
import { gapForClass, readGaps, recordGap } from './gaps'
import { appendGapEvidence, fileTicket, readyStatusSnapshot, readyStatusViolations,
  type ReadyTicket } from './ticket'
import { buildSessionKb, type SessionKbResult } from './session-kb'
import type { RailRoundResult } from './rail-round'

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

/** Where an AI round's own artifacts live, inside the iteration's directory. */
export const AI_DIR = 'ai'
export const AI_PROMPT_FILE = 'prompt.md'
export const AI_TICKET_BODY_FILE = 'ticket-body.md'
export const AI_TRANSCRIPT_FILE = 'transcript.txt'
export const AI_OUTCOME_FILE = 'outcome.json'
/** The derived facts the console computed for the round ([[REQ-261]] b7). */
export const AI_DIGEST_FILE = DIGEST_FILE

/** One body file per bug, so a filed body is reviewable beside the round. */
export function bugBodyFile(index: number): string {
  return `bug-${index + 1}-body.md`
}

/** A finished iteration and the artifacts it left behind. */
interface Iteration extends IterationView {
  /** The iteration's own directory — everything below is inside it. */
  dir: string
  siteOut: string
  diffOut: string
  pageOut: string
  /** The bundle this round reproduced, so the AI round can be handed it. */
  bundleDir: string
  gate: GateSummary | null
  railResult: RailRoundResult | null
  outcome: AiOutcome | null
}

export interface ReproConsoleOptions {
  /** Repo root — every `1c` runs from there and every path is relative to it. */
  cwd: string
  /** Injectable so the suite can run an iteration without a browser. */
  runStep?: StepRunner
  /**
   * Injectable so the suite can run a round without spending a token.
   *
   * The same seam {@link StepRunner} is, and for the same reason: the console's
   * whole surface — behaviours 1, 2, 5, 6, 7 and 10 — is about what it does
   * AROUND the AI, and none of it should need one to be exercised.
   */
  runAi?: AiRunner
  /** Runs the rail, `git status` and `xgd ticket get`. Injectable likewise. */
  runCommand?: CommandRunner
  /** Where the rail and the AI executable are looked for. */
  env?: NodeJS.ProcessEnv
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
  /** The captures on disk, as of the last time the page was built. */
  private stored: StoredCapture[] = []
  private readonly cwd: string
  private readonly runStep: StepRunner
  private readonly runAi: AiRunner
  private readonly runCommand: CommandRunner
  private readonly env: NodeJS.ProcessEnv
  /**
   * The round currently talking, and what it has said (behavior 2).
   *
   * The ONLY thing streamed. Every finished round is rendered from its own
   * `ai/transcript.txt` on the next page build, so this holds one round at a
   * time and is cleared the moment it ends.
   */
  private live: { n: number; text: string } | null = null
  /** The run in flight, so `close()` and the suite can wait for it. */
  private inFlight: Promise<void> = Promise.resolve()

  constructor(opts: ReproConsoleOptions) {
    this.cwd = opts.cwd
    this.runStep = opts.runStep ?? spawnStepRunner()
    this.runAi = opts.runAi ?? spawnAiRunner(opts.env)
    this.runCommand = opts.runCommand ?? spawnCommand
    this.env = opts.env ?? process.env
  }

  /** The console's own scratch directory — where the gap registry lives. */
  private get workspace(): string {
    return path.join(this.cwd, CONSOLE_WORKSPACE)
  }

  /** The loaded site's own directory — its iterations and its resume record. */
  private get siteDir(): string {
    return path.join(this.workspace, this.slug)
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
      iterations: this.iterations.map((it) => this.view(it)),
      stored: this.stored.map(({ name, url }) => ({ name, url })),
    }
  }

  /**
   * What the poller gets, once a second.
   *
   * Small on purpose — see {@link PollState}. The page state carries every
   * round's whole transcript; this carries one round's, and only while it is
   * still moving, and only its tail: a long round would otherwise put its whole
   * transcript on the wire every second for as long as it ran. The file keeps
   * all of it, and the next page build renders all of it.
   */
  pollState(): PollState {
    return {
      version: this.version,
      running: this.running,
      message: this.message,
      failed: this.failed,
      live: this.live ? { n: this.live.n, text: tail(this.live.text) } : null,
    }
  }

  /** One iteration as the page shows it, including the round beneath it. */
  private view(it: Iteration): IterationView {
    const ai = this.aiView(it)
    return {
      n: it.n,
      originalUrl: it.originalUrl,
      reproHref: it.reproHref,
      diffHref: it.diffHref,
      pageHref: it.pageHref,
      // The fifth link exists only when a round really filed or appended
      // something (behavior 5) — a link to a ticket that does not exist would
      // be worse than the absence it is standing in for.
      ...(it.outcome?.ticketUid && it.outcome.ticketId
        ? { ticketHref: `/iteration/${it.n}/ticket`, ticketLabel: `the gap ticket (${it.outcome.ticketId})` }
        : {}),
      // …and one more per bug the round tripped over ([[REQ-261]] behavior 2).
      // Peers of the gap link because they are peers as tickets: filed by the
      // same console, at the same status, from the same round.
      ...(it.outcome?.bugTickets?.length
        ? {
            extraTickets: it.outcome.bugTickets.map((bug) => ({
              href: `/iteration/${it.n}/ticket/${bug.uid}`,
              label: `a bug it found (${bug.id})`,
            })),
          }
        : {}),
      ...(it.gate ? { verdict: it.gate.verdict } : {}),
      ...(it.railResult ? { rail: it.railResult.summary } : {}),
      ...(ai ? { ai } : {}),
    }
  }

  /**
   * The AI block under an iteration, read from the round's own artifacts.
   *
   * The live round is the exception: its transcript is the in-memory buffer,
   * because the file is being appended to as this renders and a half-flushed
   * read would show the operator less than the poller already has.
   */
  private aiView(it: Iteration): AiView | undefined {
    const live = this.live?.n === it.n
    if (!live && !it.outcome) return undefined
    const transcript = live
      ? (this.live?.text ?? '')
      : readIfPresent(path.join(it.dir, AI_DIR, AI_TRANSCRIPT_FILE))
    const outcome = it.outcome
    const cost = live ? '' : describeCost(outcome?.cost)
    return {
      status: live ? 'running' : (outcome?.status ?? 'failed'),
      summary: live ? '' : (outcome?.summary ?? outcome?.reason ?? ''),
      ...(outcome?.residualClass ? { residualClass: outcome.residualClass } : {}),
      ...(outcome?.ticketId ? { ticketId: outcome.ticketId } : {}),
      // What it cost and what ran it ([[REQ-261]] behavior 6) — on the page
      // rather than only in the artifact, because "can we afford to run this
      // often" is a question the operator asks while looking at it.
      ...(cost ? { cost } : {}),
      /**
       * THE WAY BACK INTO A ROUND THAT ALREADY RAN ([[REQ-261]] behavior 5).
       *
       * Offered only on a round that failed and left a transcript — which is
       * exactly the round whose whole diagnosis is sitting on disk next to a
       * message saying it produced nothing. Re-running it would pay for the same
       * reading twice; re-reading it is free.
       */
      ...(!live && outcome?.status === 'failed' && transcript.trim()
        ? { recoverHref: `/iteration/${it.n}/recover` }
        : {}),
      violations: live ? [] : (outcome?.violations ?? []),
      transcript,
    }
  }

  /**
   * Adopt a site whose capture is already on disk (requirements 29, 31, 33).
   *
   * No capture runs and no iteration runs — this is the console REMEMBERING a
   * site, which is a different act from reproducing one. The iterations come
   * back from disk with their links live, so the page it lands on is the page
   * the operator left rather than an empty one beside a full `storage/tmp/`.
   */
  private adopt(url: string, bundleDir: string): void {
    this.url = url
    this.slug = slugForUrl(url)
    this.bundleDir = bundleDir
    this.iterations.length = 0
    for (const manifest of readIterations(path.join(this.cwd, CONSOLE_WORKSPACE, this.slug))) {
      const dir = path.join(this.cwd, CONSOLE_WORKSPACE, this.slug, `iteration-${manifest.n}`)
      const diffOut = path.join(dir, 'diff')
      this.iterations.push({
        n: manifest.n,
        originalUrl: manifest.originalUrl || url,
        reproHref: `/iteration/${manifest.n}/site/`,
        diffHref: `/iteration/${manifest.n}/diff/`,
        pageHref: `/iteration/${manifest.n}/page`,
        dir,
        siteOut: path.join(dir, 'site'),
        diffOut,
        pageOut: path.join(dir, 'page.json'),
        bundleDir: manifest.bundleDir,
        // The verdict, the rail and the round are all read back from the
        // iteration's own artifacts, so a restart of the console shows the
        // rounds it already ran — requirement 33 extended to what [[REQ-256]]
        // added, rather than a second memory that only holds in this process.
        gate: readGateReport(path.join(diffOut, 'gate.json')),
        railResult: readRail(dir),
        outcome: readOutcome(dir),
      })
    }
    this.version += 1
  }

  /** Ask `1c` which captures exist, and remember the answer for the page. */
  private async refreshStored(): Promise<StoredCapture[]> {
    const step = captureListStep()
    const result = await this.runStep(step, this.cwd).catch(() => null)
    this.stored = result ? parseCaptureList(result.stdout) : []
    return this.stored
  }

  async handle(req: ConsoleRequest): Promise<ConsoleResponse> {
    const { method } = req
    const pathname = req.path

    if (method === 'GET' && pathname === '/') {
      // The captured sites are listed from disk on every view of the blank page
      // (requirement 31), so a capture taken in another console — or in a plain
      // `1c capture page` at a terminal — shows up here without a restart.
      if (!this.running) await this.refreshStored()
      return html(200, renderConsolePage(this.state()))
    }
    if (method === 'GET' && pathname === '/state') {
      return json(200, this.pollState())
    }
    if (method === 'POST' && pathname === '/open') {
      return this.open(formField(req.body ?? '', 'url') ?? '')
    }
    if (method === 'POST' && (pathname === '/run' || pathname === '/recapture' || pathname === '/run-again')) {
      return this.startRun(
        pathname === '/run-again' ? undefined : formField(req.body ?? '', 'url'),
        pathname === '/recapture',
      )
    }
    // Behavior 5 — file from a finished round's artifacts, spawning nothing.
    const recover = /^\/iteration\/(\d+)\/recover$/.exec(pathname)
    if (method === 'POST' && recover) return this.recover(Number(recover[1]))
    if (pathname.startsWith('/iteration/')) return this.serveArtifact(pathname)
    return text(404, 'Not found')
  }

  /**
   * Load a stored site without running anything (requirement 31).
   *
   * The link on the blank page. It is a POST rather than a GET because it
   * changes what the console is looking at, and a GET that mutated would be a
   * back-button away from doing it again.
   */
  private open(typedUrl: string): ConsoleResponse {
    if (this.running) return html(409, 'A run is already in progress. <a href="/">back</a>')
    const found = findStoredCapture(this.stored, typedUrl)
    if (!found) {
      this.message = `No stored capture for ${typedUrl}.`
      this.failed = true
      return seeOther('/')
    }
    this.adopt(found.url || normalizeUrl(typedUrl), found.dir)
    this.message = this.iterations.length
      ? `Loaded ${this.url} — ${this.iterations.length} iteration(s) already on disk.`
      : `Loaded ${this.url}. Press [run again] to reproduce it.`
    this.failed = false
    return seeOther('/')
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
  private startRun(typedUrl: string | undefined, forceCapture: boolean): ConsoleResponse {
    if (this.running) return html(409, 'A run is already in progress. <a href="/">back</a>')

    if (typedUrl !== undefined) {
      const trimmed = typedUrl.trim()
      if (!trimmed) {
        this.message = 'Enter a site address first.'
        this.failed = true
        return seeOther('/')
      }
      /**
       * A CAPTURE ALREADY ON DISK IS REUSED, NOT RE-TAKEN (requirement 29).
       *
       * This is requirement 15's reasoning applied to the first press rather
       * than the second. Re-capturing re-rolls the acceptance oracle, so the
       * reference moves at the same instant the fold does and the two become
       * inseparable — which is the single comparison an iteration exists to
       * make. Reusing is therefore the default; [recapture] (requirement 30) is
       * how someone says they meant to move the reference, and it has to be a
       * thing they CHOSE rather than something that happened because they
       * pressed the ordinary button a second time.
       */
      const reuse = forceCapture ? undefined : findStoredCapture(this.stored, trimmed)
      if (reuse) {
        this.adopt(reuse.url || normalizeUrl(trimmed), reuse.dir)
      } else {
        this.url = normalizeUrl(trimmed)
        this.slug = slugForUrl(this.url)
        this.bundleDir = undefined
        this.iterations.length = 0
        this.version += 1
      }
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
        n,
        dir,
        runStep: this.runStep,
        runCommand: this.runCommand,
        env: this.env,
        onStep: (step: IterationStep['name']) => {
          this.message = `Running iteration ${n} — ${step}…`
        },
      })
      this.bundleDir = outcome.bundleDir
      const iteration: Iteration = {
        n,
        originalUrl: outcome.originalUrl || (this.url as string),
        reproHref: `/iteration/${n}/site/`,
        diffHref: `/iteration/${n}/diff/`,
        pageHref: `/iteration/${n}/page`,
        dir,
        siteOut: outcome.siteOut,
        diffOut: outcome.diffOut,
        pageOut: outcome.pageOut,
        bundleDir: outcome.bundleDir,
        gate: outcome.gate,
        railResult: outcome.rail,
        outcome: null,
      }
      this.iterations.push(iteration)
      this.message = `Iteration ${n} finished.`
      this.failed = false
      // The list changed, so the browser reloads and picks the new block up.
      this.version += 1
      /**
       * THE ROUND STARTS AS SOON AS THE LINKS APPEAR (behavior 1).
       *
       * Not on a button — the links appearing IS the trigger, which is what
       * makes the diagnosis a part of the iteration rather than a second thing
       * a human has to remember to do. The version bump above is what puts the
       * iteration on the page first, so the operator watches the round work
       * (behavior 2) rather than waiting at a blank status line for it.
       *
       * Awaited inside the try, so `running` stays true until the round ends
       * and [run again] cannot start a second one on top of a diagnosis still
       * in flight (behavior 10, requirement 23).
       */
      await this.diagnose(iteration)
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

  /**
   * The AI round under one iteration ([[REQ-256]]).
   *
   * Never throws. The iteration is already on the page by the time this runs,
   * so every way this can end has to be something the page can SAY — a failure
   * that escaped here would be reported as a failed iteration, which it is not.
   */
  private async diagnose(it: Iteration): Promise<void> {
    const aiDir = path.join(it.dir, AI_DIR)
    mkdirSync(aiDir, { recursive: true })

    /**
     * BEHAVIOR 7, DECIDED BY THE CONSOLE (requirement 16).
     *
     * `capture-incomplete` means the REFERENCE is wrong, not the engine. Filing
     * it against the engine would be a false report and working its deltas
     * would spend the round against an invalid oracle — so no AI process is
     * started at all. The brief carries the rule too, because the round has to
     * understand what it is looking at; it is enforced here because a rule the
     * model is merely told is a rule it can get wrong on exactly the round
     * where getting it wrong costs the most.
     *
     * A round with NO readable gate report stops for the same reason: that file
     * is where the decision comes from, so starting without it is starting
     * blind.
     */
    if (!it.gate) {
      this.finishRound(it, { status: 'stopped', reason: 'no gate report — nothing to diagnose from.' })
      return
    }
    if (it.gate.verdict === CAPTURE_INCOMPLETE) {
      this.finishRound(it, {
        status: 'stopped',
        reason:
          `${CAPTURE_INCOMPLETE} — the reference itself is wrong, which is not an engine gap. ` +
          'Nothing filed; re-capture the site before reproducing it again.',
      })
      return
    }

    /**
     * THE DIGEST, WRITTEN BEFORE THE PROMPT NAMES IT ([[REQ-261]] behavior 7).
     *
     * The console has every evidence file parsed already, so the counting a
     * round would otherwise spend reads on is arithmetic it can do once. An
     * ADDITION to the evidence: every file it derives from is still handed over
     * below, and the prompt says the digest is not a source.
     */
    const digestFile = path.join(aiDir, AI_DIGEST_FILE)
    try {
      writeFileSync(
        digestFile,
        digestFromDisk({ n: it.n, bundleDir: it.bundleDir, evidenceDir: it.diffOut, pageDocument: it.pageOut }),
      )
    } catch {
      // A digest that could not be computed is a round that reads the files
      // itself, which is the round we had before. Never a reason not to run.
    }

    /**
     * RESUME ([[REQ-261]] behavior 3) — the scope and the reset rules are
     * `session.ts`'s, stated there beside the reasoning. What is decided here is
     * only the consequence: a resumed round is NOT re-sent the brief, because
     * re-sending it would grow the session by the brief's own length every
     * iteration, and that growth is half of what makes a long chain dangerous.
     */
    /**
     * THE SESSION KB, BUILT BEFORE THE PROMPT NAMES IT ([[REQ-262]] behaviour 2).
     *
     * Rebuilt every round so it cannot go stale, and in the WORKSPACE rather
     * than in this iteration's directory: it is identical across iterations of a
     * site, and a per-iteration copy would write close to 900 KB per round to
     * say the same thing.
     *
     * It never fails the round. A KB that could not be built leaves the round
     * reading the engine directly, which is the round we had before this ticket
     * and was a working one.
     */
    const kb = await buildSessionKb({ cwd: this.cwd, run: this.runCommand, workspace: this.workspace })

    const brief = readBrief()
    const resumeCtx = { bundleDir: it.bundleDir, briefHash: briefFingerprint(brief) }
    const saved = readSession(this.siteDir)
    const resume = resumableSession(saved, resumeCtx)

    const gaps = readGaps(this.workspace)
    const prompt = buildPrompt(resume ? resumePreamble(saved?.rounds ?? 1) : brief, {
      n: it.n,
      slug: this.slug,
      originalUrl: it.originalUrl,
      bundleDir: it.bundleDir,
      evidenceDir: it.diffOut,
      pageDocument: it.pageOut,
      siteDir: it.siteOut,
      digestFile,
      kb,
      gate: it.gate,
      rail: it.railResult ?? { available: false, summary: 'not run' },
      knownGaps: gaps,
      resumed: resume !== null,
    })
    // Written before the process starts (requirement 19): what the round was
    // asked is an artifact of the round, reviewable after the fact and
    // recoverable after a restart, like everything else in this directory.
    const promptFile = path.join(aiDir, AI_PROMPT_FILE)
    writeFileSync(promptFile, prompt)

    const transcriptFile = path.join(aiDir, AI_TRANSCRIPT_FILE)
    writeFileSync(transcriptFile, '')
    this.live = { n: it.n, text: '' }
    this.message = `Iteration ${it.n} — the AI is reviewing the diff…`
    this.version += 1

    // Behavior 3's falsifier, taken BEFORE the round so the comparison is
    // against what the operator's tree already looked like rather than against
    // clean — a console run on a dirty tree must not report the operator's own
    // work as the AI's.
    const before = await this.workingTree()
    // REQUIREMENT 11's falsifier, taken at the same moment and for the same
    // reason: measured by difference, so a ticket an operator promoted in
    // another window before the round started is not attributed to the round.
    const readyBefore = await this.readySnapshot()

    let outcome: AiOutcome
    try {
      outcome = await this.runAi({
        cwd: this.cwd,
        prompt,
        ...(resume ? { resume } : {}),
        onLine: (line) => {
          if (this.live?.n !== it.n) return
          this.live.text = this.live.text ? `${this.live.text}\n${line}` : line
          appendLine(transcriptFile, line)
        },
      })
    } catch (err) {
      outcome = { status: 'failed', reason: err instanceof Error ? err.message : String(err) }
    }
    // What the next round on this site may continue. Written from the session
    // the round REPORTED, never one the console chose — the CLI owns session
    // identity and a console that minted one would be asserting a fact about a
    // conversation it is not in.
    recordSession(this.siteDir, resumeCtx, outcome.sessionId, resume !== null)
    // The round's answer belongs to the round. Everything below fills in what
    // the CONSOLE did with it — the ticket it filed, the status it read back,
    // the violations it found — so it works on a copy: a runner that hands back
    // a value it also holds must not find it rewritten underneath it.
    outcome = { ...outcome }

    // Behavior 3's falsifier is measured on the ROUND, before the console does
    // any filing of its own — otherwise the console's own ticket write would be
    // the thing the check reported.
    const roundViolations = [...(await this.codeViolations(before)), ...(await this.readyViolations(readyBefore))]
    this.live = null

    await this.settle(it, aiDir, outcome, roundViolations)
  }

  /**
   * Everything the console does with a round's answer, wherever it came from.
   *
   * Shared by {@link diagnose} and {@link recover} ([[REQ-261]] behavior 5),
   * because a diagnosis read back off a transcript must be filed by exactly the
   * same path as one handed over live — otherwise "recovered" would be a second,
   * weaker kind of filing, with its own rules to go stale.
   */
  private async settle(it: Iteration, aiDir: string, outcome: AiOutcome, roundViolations: string[]): Promise<void> {
    const filing = await this.file(it, aiDir, outcome)
    const bugs = await this.fileBugs(aiDir, outcome)
    outcome.violations = [
      ...roundViolations,
      ...filing,
      ...bugs,
      ...(await this.ticketViolations(outcome)),
    ]
    /**
     * A FAILED ROUND SAYS WHERE ITS WORDS ARE ([[REQ-261]] behavior 5).
     *
     * `the round produced no outcome block.` gave the operator nothing to act
     * on and did not mention that the round's entire diagnosis was sitting in
     * the file beside the message. It is named here rather than in the parser
     * because the parser is handed a string and knows no paths.
     */
    if (outcome.status === 'failed' && !outcome.recovered) {
      const transcript = path.join(aiDir, AI_TRANSCRIPT_FILE)
      if (readIfPresent(transcript).trim()) {
        outcome.reason = `${outcome.reason ?? 'the round failed.'} What it said is in ${transcript} — press [read it again] to file from that rather than re-running the round.`
      }
    }
    this.finishRound(it, outcome)
  }

  /**
   * File the bugs a round tripped over ([[REQ-261]] behavior 2).
   *
   * SEPARATE TICKETS, NOT A SECTION OF THE GAP. A defect in L1, in the round's
   * own brief, or anywhere else in `1c` is not a gap in the reproduction engine,
   * and folding it into the gap ticket is what the first round had to do for
   * want of anywhere else to put it. Each is created exactly as the gap ticket
   * is — `xgd ticket create`, by the console, at `draft` — so widening what a
   * round may REPORT has not widened what it may trigger.
   *
   * Filed on every status: a round that found no engine gap may still have
   * found a bug, and that is the case this list exists for.
   */
  private async fileBugs(aiDir: string, outcome: AiOutcome): Promise<string[]> {
    const drafts: TicketDraft[] = outcome.bugs ?? []
    if (!drafts.length) return []
    const problems: string[] = []
    const filed: FiledTicket[] = []
    for (const [index, draft] of drafts.entries()) {
      const result = await fileTicket({
        cwd: this.cwd,
        run: this.runCommand,
        draft,
        bodyFile: path.join(aiDir, bugBodyFile(index)),
      })
      if (typeof result === 'string') problems.push(`the bug '${draft.title}' was not filed: ${result}`)
      else filed.push({ id: result.id, uid: result.uid, title: draft.title })
    }
    if (filed.length) outcome.bugTickets = filed
    return problems
  }

  /**
   * Turn what the round handed back into a ticket (behavior 4, requirement 17).
   *
   * THE CONSOLE FILES IT. The round has no tool that can run a command, so this
   * is where `xgd ticket create --fields '{"status":"draft"}'` happens — which
   * is what makes behavior 4's "never at a `ready_*` status" structural rather
   * than a rule to be checked afterwards.
   *
   * ONE TICKET PER GAP CLASS (behavior 6, requirement 21) is decided here too:
   * a class already in the registry gets an append, not a second ticket, and it
   * gets one even when the round asked to file — the registry is what knows,
   * and the round only knows what it was told.
   */
  private async file(it: Iteration, aiDir: string, outcome: AiOutcome): Promise<string[]> {
    if (outcome.status !== 'filed' && outcome.status !== 'appended') return []
    const residualClass = outcome.residualClass as string
    const known = gapForClass(readGaps(this.workspace), residualClass)

    if (known?.ticketUid) {
      const evidence =
        outcome.evidence ??
        `\n### ${it.originalUrl} — iteration ${it.n}\n\n${outcome.ticket?.body ?? outcome.summary ?? ''}`
      const failure = await appendGapEvidence({
        cwd: this.cwd,
        run: this.runCommand,
        uid: known.ticketUid,
        evidence,
        evidenceFile: path.join(aiDir, AI_TICKET_BODY_FILE),
      })
      outcome.status = 'appended'
      outcome.ticketId = known.ticketId
      outcome.ticketUid = known.ticketUid
      if (failure) return [failure]
    } else if (outcome.ticket) {
      const filed = await fileTicket({
        cwd: this.cwd,
        run: this.runCommand,
        draft: outcome.ticket,
        bodyFile: path.join(aiDir, AI_TICKET_BODY_FILE),
      })
      if (typeof filed === 'string') {
        outcome.status = 'failed'
        outcome.reason = filed
        return [filed]
      }
      outcome.status = 'filed'
      outcome.ticketId = filed.id
      outcome.ticketUid = filed.uid
    } else if (outcome.status === 'filed') {
      // A round that claims to have filed but hands back no ticket has made a
      // claim nothing can check — requirement 18's falsifier has no ticket to
      // read back, and the page would otherwise show a green `filed` standing
      // for nothing. Being unable to check it IS the finding.
      outcome.status = 'failed'
      outcome.reason = 'the round claimed to have filed without naming the ticket, so nothing can be checked.'
      return [outcome.reason]
    } else {
      // An append against a class with no ticket on record — there is nothing
      // to append to, and inventing one would break the one-per-class rule from
      // the other side.
      outcome.status = 'failed'
      outcome.reason = `the round asked to append to '${residualClass}', which has no ticket on record.`
      return [outcome.reason]
    }

    /**
     * Recorded whether the round filed or appended: an appended round's
     * contribution to the registry is the new reference and the new iteration,
     * which is the evidence that the class recurs — the frequency signal
     * [[EPIC-12]] §7.3 wanted, arriving here for free.
     */
    recordGap(this.workspace, {
      residualClass,
      ticketId: outcome.ticketId ?? '',
      ticketUid: outcome.ticketUid ?? '',
      summary: outcome.summary ?? '',
      reference: it.bundleDir,
      iteration: `${this.slug}#${it.n}`,
    })
    return []
  }

  /**
   * Read a finished round's answer back off its transcript ([[REQ-261]] b5).
   *
   * The first live round's work was never lost — it was in `transcript.txt` the
   * whole time — but the only way to get a ticket out of it was to run the round
   * again and pay for it again. It is a POST for the same reason [open] is: it
   * files tickets, and a GET that filed would be a back-button away from filing
   * twice.
   *
   * NOTHING IS SPAWNED. No prompt, no model, no cost. The transcript already
   * holds the round's final message, and {@link parseOutcome} is the same parse
   * a live round's answer goes through — so what this recovers is what the
   * console would have had, not a weaker reading of it.
   */
  private async recover(n: number): Promise<ConsoleResponse> {
    if (this.running) return html(409, 'A run is already in progress. <a href="/">back</a>')
    const it = this.iterations.find((entry) => entry.n === n)
    if (!it) return text(404, 'No such iteration')
    const aiDir = path.join(it.dir, AI_DIR)
    const transcript = readIfPresent(path.join(aiDir, AI_TRANSCRIPT_FILE))
    if (!transcript.trim()) {
      this.message = `Iteration ${n} left no transcript to read.`
      this.failed = true
      this.version += 1
      return seeOther('/')
    }
    const outcome: AiOutcome = { ...parseOutcome(transcript), recovered: true }
    // The round's own measurements survive the re-read: they were the round's,
    // not the parse's, and re-deriving them from a transcript would be a guess.
    if (it.outcome?.cost) outcome.cost = it.outcome.cost
    if (it.outcome?.sessionId) outcome.sessionId = it.outcome.sessionId
    this.running = true
    try {
      // No tree comparison: the round that wrote this transcript finished long
      // ago, so anything in the tree now is somebody else's and attributing it
      // to the round would be the false report behavior 3's check exists to
      // avoid. The filing checks in `settle` still apply: they are about what
      // was FILED, which this act really did.
      await this.settle(it, aiDir, outcome, [])
    } finally {
      this.running = false
    }
    return seeOther('/')
  }

  /** Write the round's outcome beside its transcript and say so on the page. */
  private finishRound(it: Iteration, outcome: AiOutcome): void {
    it.outcome = outcome
    writeFileSync(path.join(it.dir, AI_DIR, AI_OUTCOME_FILE), JSON.stringify(outcome, null, 2))
    const what =
      outcome.status === 'filed' || outcome.status === 'appended'
        ? `${outcome.status} ${outcome.ticketId ?? 'a ticket'}`
        : outcome.status
    this.message = `Iteration ${it.n} finished — AI ${what}.${outcome.violations?.length ? ' See the violations under it.' : ''}`
    this.failed = false
    this.live = null
    this.version += 1
  }

  /**
   * The working tree, as `git status --porcelain` sees it.
   *
   * Behavior 3's falsifier. A checkout with no git — a tarball, a test's
   * scratch directory — reports nothing, which makes the comparison vacuous
   * rather than wrong: there is no claim being made that could be false.
   */
  private async workingTree(): Promise<Set<string>> {
    const result = await this.runCommand('git', ['status', '--porcelain'], this.cwd).catch(() => null)
    if (!result || result.code !== 0) return new Set()
    return new Set(result.stdout.split('\n').map((line) => line.trim()).filter(Boolean))
  }

  /** Anything the round left in the tree that was not there before (behavior 3). */
  private async codeViolations(before: Set<string>): Promise<string[]> {
    const after = await this.workingTree()
    const added = [...after].filter((entry) => !before.has(entry))
    if (!added.length) return []
    return [
      `the round changed the working tree, which it must not (behavior 3): ${added.slice(0, 8).join('; ')}${
        added.length > 8 ? `; …+${added.length - 8} more` : ''
      }`,
    ]
  }

  /**
   * Which tickets sit at a dispatcher-trigger status right now
   * ([[REQ-262]] requirement 11).
   *
   * A snapshot that cannot be taken is EMPTY rather than fatal. The check is a
   * safety net over an instruction the round is expected to keep anyway, and a
   * console that refused to diagnose because `xgd` was slow would have turned a
   * safety net into a new way to fail.
   */
  private async readySnapshot(): Promise<Map<string, ReadyTicket>> {
    try {
      return await readyStatusSnapshot(this.cwd, this.runCommand)
    } catch {
      return new Map()
    }
  }

  /** What reached a trigger status while the round ran. */
  private async readyViolations(before: Map<string, ReadyTicket>): Promise<string[]> {
    // An unavailable "before" makes every existing ready ticket look new, which
    // would report dozens of violations that are nothing to do with the round.
    // Saying nothing is the honest answer when the comparison cannot be made.
    if (!before.size) return []
    try {
      return readyStatusViolations(before, await readyStatusSnapshot(this.cwd, this.runCommand))
    } catch {
      return []
    }
  }

  /**
   * The status the filed ticket actually carries, read back (requirement 18).
   *
   * The console wrote `draft` when it created the ticket, so this is a
   * CONFIRMATION rather than a gate — and it is worth the one command anyway,
   * because `xgd ticket create` reporting success is not the same claim as the
   * ticket existing at the status that was asked for, and a `ready_*` status is
   * a dispatcher trigger: it spawns an autonomous pipeline against the ticket
   * within seconds. A claim the console can check, it checks.
   */
  private async ticketViolations(outcome: AiOutcome): Promise<string[]> {
    if (outcome.status !== 'filed' && outcome.status !== 'appended') return []
    if (!outcome.ticketUid) return []
    const result = await this.runCommand('xgd', ['ticket', 'get', outcome.ticketUid], this.cwd).catch(() => null)
    if (!result || result.code !== 0) {
      return [`could not read ${outcome.ticketUid} back, so its status is unverified.`]
    }
    const status = /Status:\s*(\S+)/.exec(result.stdout)?.[1]
    outcome.ticketStatus = status
    if (!status) return [`${outcome.ticketUid} reported no status, so it is unverified.`]
    if (status === 'draft') return []
    return [
      `${outcome.ticketId ?? outcome.ticketUid} is at '${status}', not 'draft'` +
        (status.startsWith('ready_')
          ? ' — a ready_* status is a dispatcher trigger and will spawn an automated pipeline against it.'
          : '.'),
    ]
  }

  /** `/iteration/<n>/site/…` and `/iteration/<n>/diff/…`, confined to that iteration. */
  private async serveArtifact(pathname: string): Promise<ConsoleResponse> {
    const match = /^\/iteration\/(\d+)\/(site|diff|page|ticket)(\/.*)?$/.exec(pathname)
    if (!match) return text(404, 'Not found')
    const iteration = this.iterations.find((it) => it.n === Number(match[1]))
    if (!iteration) return text(404, 'No such iteration')
    const rest = match[3]
    /**
     * The fifth link: the gap ticket this round filed (behavior 5, req 24).
     *
     * Rendered by asking xgd for it rather than by reading `.xgd/tickets/`.
     * That layout is xgd's — it tiers tickets and it moves them — and a second
     * reader of it here would go stale the first time it did.
     */
    if (match[2] === 'ticket') return this.serveTicket(iteration, rest?.replace(/^\//, ''))
    /**
     * The reproduction's own L1 document (requirement 34).
     *
     * One file, not a tree, so it is served here rather than through the static
     * resolver, and WITHOUT a trailing-slash redirect — there is no directory
     * below it for relative references to resolve against.
     */
    if (match[2] === 'page') {
      if (!existsSync(iteration.pageOut)) return text(404, 'No page document for this iteration')
      return {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store, must-revalidate' },
        body: readFileSync(iteration.pageOut, 'utf8'),
      }
    }
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

  /**
   * `xgd ticket get <uid>`, as the operator would see it at their terminal.
   *
   * With no uid in the path this is the gap ticket; with one it is one of the
   * bugs the round filed ([[REQ-261]] behavior 2). CHECKED AGAINST WHAT THIS
   * ROUND FILED rather than passed through: the console is not a ticket browser,
   * and a route that read any uid a visitor typed would be one.
   */
  private async serveTicket(iteration: Iteration, wanted?: string): Promise<ConsoleResponse> {
    const bugs = iteration.outcome?.bugTickets ?? []
    const uid = wanted ? bugs.find((bug) => bug.uid === wanted)?.uid : iteration.outcome?.ticketUid
    if (!uid) return text(404, 'This round filed no such ticket.')
    const result = await this.runCommand('xgd', ['ticket', 'get', uid], this.cwd).catch(() => null)
    const body = result?.code === 0 ? result.stdout : (result?.stderr || `could not read ${uid}`)
    const label = wanted ? (bugs.find((bug) => bug.uid === uid)?.id ?? uid) : (iteration.outcome?.ticketId ?? uid)
    return html(result?.code === 0 ? 200 : 502, renderTicketPage(iteration.n, label, body))
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

/** A file's contents, or empty — used where absence and emptiness mean the same. */
function readIfPresent(file: string): string {
  return existsSync(file) ? readFileSync(file, 'utf8') : ''
}

/** The outcome an iteration's AI round recorded, or none. */
function readOutcome(dir: string): AiOutcome | null {
  const file = path.join(dir, AI_DIR, AI_OUTCOME_FILE)
  if (!existsSync(file)) return null
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<AiOutcome>
    if (typeof parsed.status !== 'string') return null
    return { ...parsed, status: parsed.status, violations: parsed.violations ?? [] } as AiOutcome
  } catch {
    return null
  }
}

/**
 * Append one transcript line to the round's own file (behavior 2, req 19).
 *
 * Written as it arrives rather than at the end, so a round that is killed
 * part-way still leaves behind what it had said — which is exactly the round a
 * human wants to read.
 */
function appendLine(file: string, line: string): void {
  try {
    appendFileSync(file, `${line}\n`)
  } catch {
    // The transcript is what the round said, not what it did. Losing a line to
    // a full disk must not take the round's outcome down with it.
  }
}

/** How much of a running round's transcript the poller is sent each second. */
const LIVE_TAIL_CHARS = 20_000

function tail(text: string): string {
  return text.length <= LIVE_TAIL_CHARS ? text : `…\n${text.slice(-LIVE_TAIL_CHARS)}`
}
