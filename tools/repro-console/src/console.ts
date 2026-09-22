/**
 * The reproduction console's state and its request handler (REQ-254).
 *
 * The handler is a pure-ish function of a request and the console's state —
 * `node:http` is wired to it in `server.ts` and nowhere else — so the whole
 * surface is exercisable without binding a socket, and the socket layer has
 * nothing in it worth a test of its own beyond "it binds to loopback".
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
// REUSED, NOT RESTATED. `resolveStaticFile` is the repo's single definition of
// how a URL path becomes a file inside a directory — confinement, directory
// index, extensionless fallback. A second copy here is exactly the shape its
// own note warns about: a traversal guard present on one served tree and
// missing on another. It is reached by relative path into `tools/generate/src`,
// the convention `apps/control-app` already follows for the same tree.
import { resolveStaticFile } from '../../generate/src/cli/static-file'
import { contentTypeOf } from '../../generate/src/store/content-type'
// REUSED, NOT RESTATED, for the same reason ([[BUG-120]] behaviour 4). The
// sentence a bundle behind the extractor deserves is already written, once, in
// the file that owns `CAPTURE_SCHEMA` and the axis registry — and it is the
// sentence that goes stale the day the extractor learns an axis. A second
// spelling of it here would be a second thing to bump.
import { staleCaptureDetail } from '../../generate/src/cli/capture/schema'
import type { Capture } from '../../generate/src/cli/capture/types'
import {
  renderConsolePage,
  renderDiffPage,
  renderTicketPage,
  type AiView,
  type HeldView,
  type IterationView,
  type FilingsView,
  type PageState,
  type PollState,
} from './page'
import {
  bareHost,
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
  normaliseOutcome,
  parseOutcome,
  readBrief,
  readGateReport,
  resumePreamble,
  spawnAiRunner,
  unreadTicket,
  type AiOutcome,
  type AiRunner,
  type GateSummary,
  type ReadTicket,
} from './ai'
import { readBundleProvenance } from './bundle'
// REQ-277 — the iteration's headline pair, ordered in one place.
import { measurementView } from './unmeasured'
import { DIGEST_FILE, digestFromDisk } from './digest'
import { briefFingerprint, readSession, recordSession, resumableSession } from './session'
import { parseJsonOutput, spawnCommand, type CommandRunner } from './run'
import { gapForClass, readGaps, recordGap } from './gaps'
import {
  DEFECT_CLASSES,
  DEFECT_CLASS_FIELD,
  describeSplit,
  groupByQueue,
  parseDefectClasses,
  unknownDefectClasses,
  type ClassifiedFiling,
} from './defect-class'
import {
  ROUND_CREATED_BY,
  TICKET_STATUS,
  filedByRound,
  readyStatusArrivals,
  readyStatusFindings,
  readyStatusSnapshot,
  type ReadyFindings,
  type ReadyTicket,
} from './ticket'
import { buildSessionKb, type SessionKbResult } from './session-kb'
import { NO_BASELINE_NOTICE, type RailRoundResult } from './rail-round'

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

/**
 * The operator's "the implementation has landed", written beside the round it
 * releases ([[REQ-272]] part 1, behaviour 3).
 *
 * ON DISK RATHER THAN IN MEMORY, for the reason every other part of an iteration
 * is: the hold exists so an operator who comes back to the page knows why the
 * button is inert, and "comes back" includes coming back to a console that has
 * been restarted since. A hold only this process remembered would evaporate at
 * exactly the moment it was most needed, and the loop would advance past a
 * ticket nobody had implemented.
 */
export const AI_RELEASE_FILE = 'implemented.json'

/**
 * How far back the console looks for what landed after a capture
 * ([[REQ-272]] part 2, item 3).
 *
 * A bound, not a judgement: the list is evidence that fixes exist, not the fix
 * list itself, and a round handed four hundred commits has been handed noise.
 */
const MAX_LANDED_COMMITS = 40

/** The engine the console diagnoses — the tree whose commits could move a residual. */
const ENGINE_PATH = path.join('tools', 'generate', 'src')

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
  /**
   * That bundle's `capturedAt` AS THIS ITERATION SAW IT ([[REQ-272]] part 2).
   *
   * Held per iteration rather than read from the bundle on demand, because a
   * bundle is overwritten in place by a re-capture: read later, it would answer
   * for the reference the CHAIN has now, not the one this iteration measured.
   */
  bundleCapturedAt?: string
  /** This iteration moved the reference rather than refolding the old one. */
  recaptured?: boolean
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
      // REQ-277 — each iteration is viewed WITH the one above it, because its
      // headline is a movement: "unmeasured 7" alone says nothing about whether
      // this loop is winning, and the direction is the whole finding.
      iterations: this.iterations.map((it, i) => this.view(it, this.iterations[i - 1])),
      stored: this.stored.map(({ name, url }) => ({ name, url })),
      held: this.heldView(),
      ...(this.staleReference() ? { staleReference: this.staleReference() as string } : {}),
      ...(this.notice() ? { notice: this.notice() as string } : {}),
      ...(this.filingsView() ? { filings: this.filingsView() as FilingsView } : {}),
    }
  }

  /**
   * WHAT THIS LOOP HAS FILED, BY QUEUE ([[REQ-276]] behaviour 4).
   *
   * The per-round split answers "what did this round buy"; this answers the
   * question [[EPIC-19]] had to run an audit to answer — over every round on the
   * loaded site, how much of this was ruler repair and how much raised the
   * ceiling. It is the same grouping as the status line's, so the two can never
   * disagree, and it is derived rather than stored: the tickets are already in
   * each round's read-back, and a second record of them would be a second thing
   * to keep true.
   *
   * ONE ENTRY PER TICKET, NOT PER ROUND. A class a later round appended to is
   * the same ticket, and counting it twice would make a recurring gap look like
   * two findings — the opposite of what the frequency signal is for.
   */
  private filingsView(): FilingsView | null {
    const byTicket = new Map<string, ClassifiedFiling>()
    for (const it of this.iterations) {
      if (!it.outcome) continue
      for (const filing of filingsOf(it.outcome)) {
        const seen = byTicket.get(filing.id)
        if (!seen) byTicket.set(filing.id, { id: filing.id, classes: [...filing.classes] })
        else for (const cls of filing.classes) if (!seen.classes.includes(cls)) seen.classes.push(cls)
      }
    }
    const filings = [...byTicket.values()]
    if (!filings.length) return null
    return { split: describeSplit(filings), groups: groupByQueue(filings) }
  }

  /**
   * THE LOADED REFERENCE, WHEN IT IS BEHIND THE EXTRACTOR ([[BUG-120]] b4).
   *
   * READ FROM THE BUNDLE ON EVERY PAGE BUILD, not remembered: a re-capture
   * overwrites the bundle in place, so a remembered answer would still be
   * warning about a reference that has since been re-taken — which is the one
   * moment the warning is wrong and the operator has just paid to make it wrong.
   *
   * It is a fact about a REFERENCE, not about a round. `1c gate` already reports
   * it as a coverage finding, but that is downstream of a press: the finding
   * explains an iteration that has already been paid for, and this is the same
   * sentence put beside the iterations that were measured against it.
   *
   * It no longer decides anything ([[REQ-299]] part 1): there was a choice here
   * while [run again] existed, because a refold cannot recover an axis the
   * stored oracle never had, and now every press re-rolls. It stays because it
   * is still TRUE — the rows above it were folded against a reference this far
   * back — and a page that stopped saying so the moment nobody had to act on it
   * would be hiding the reason those numbers are what they are.
   */
  private staleReference(): string | undefined {
    if (this.bundleDir === undefined) return undefined
    const file = path.join(this.bundleDir, 'capture.json')
    if (!existsSync(file)) return undefined
    try {
      return staleCaptureDetail(JSON.parse(readFileSync(file, 'utf8')) as Capture) ?? undefined
    } catch {
      // A bundle that cannot be parsed or cannot be walked axis by axis says
      // nothing here. The page is not the place that reports a broken bundle —
      // the run that reads it fails loudly and says which step — and a console
      // that refused to render over one would have hidden the history too.
      return undefined
    }
  }

  /**
   * A condition of the checkout the operator should not be able to miss
   * ([[BUG-114]]).
   *
   * THE MOST RECENT RAIL DECIDES, and only it: an earlier iteration's answer is
   * about a checkout that may since have had a baseline recorded, and a notice
   * that outlived its cause is the next thing an operator learns to ignore.
   * Iterations that ran no rail at all are passed over rather than treated as an
   * answer, because they are not one.
   */
  private notice(): string | undefined {
    for (let i = this.iterations.length - 1; i >= 0; i -= 1) {
      const rail = this.iterations[i].railResult
      if (!rail) continue
      return rail.noBaseline ? NO_BASELINE_NOTICE : undefined
    }
    return undefined
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
      // The hold rides on the poller as well as on the page ([[REQ-272]] part 1,
      // behaviour 3): the poller is what keeps the buttons honest between
      // reloads, and a poller that only knew about `running` would re-enable
      // [run again] a second after the round that held it finished.
      held: this.heldView() !== null,
    }
  }

  /**
   * THE ITERATION HOLDING THE LOOP, OR NONE ([[REQ-272]] part 1, behaviour 3).
   *
   * Derived, never stored. A round that filed a ticket has asked for an
   * implementation, and the next iteration measures whether that implementation
   * worked — so running one before the implementation lands measures the same
   * thing twice and pays for it twice, which is the loop's whole cost. The hold
   * lifts when the operator says it has landed, and the saying is a file beside
   * the round ({@link AI_RELEASE_FILE}) so it survives a restart.
   *
   * Only the LAST iteration can hold: an earlier filing was either released or
   * has already been answered by the iteration that followed it.
   */
  private heldBy(): Iteration | null {
    const last = this.iterations[this.iterations.length - 1]
    if (!last) return null
    const filed = last.outcome?.status === 'filed' || last.outcome?.status === 'appended'
    if (!filed) return null
    return existsSync(path.join(last.dir, AI_DIR, AI_RELEASE_FILE)) ? null : last
  }

  /** What the page says about the hold — what it is waiting for, and how to lift it. */
  private heldView(): HeldView | null {
    const held = this.heldBy()
    if (!held) return null
    const what = held.outcome?.ticketId
      ? `${held.outcome.ticketId}${held.outcome.status === 'appended' ? ' (appended to)' : ''}`
      : 'the ticket it filed'
    return {
      n: held.n,
      /**
       * EVERY HELD CONTROL, NAMED ([[BUG-130]] behaviour 3).
       *
       * The rule is that sentence's, not the list's: an operator meeting a
       * disabled button has to find it in the sentence that explains the hold,
       * or the explanation reads as being about some other button. [[BUG-130]]
       * applied it to [run again] and [recapture]; [[REQ-299]] applies it to the
       * controls that now exist. [recapture] is held because the next iteration
       * exists to measure the implementation that has not landed yet;
       * [clear history] is held with it because it carries `data-held="1"` and
       * goes inert on the same poll, and a disabled control the sentence beside
       * it does not mention is the defect [[BUG-130]] was.
       */
      waitingFor:
        `Iteration ${held.n} filed ${what}. [recapture] is held until that implementation lands: the next ` +
        `iteration exists to measure it, so running one before it lands measures nothing new. ` +
        `[clear history] is held with it.`,
      releaseHref: '/release',
    }
  }

  /** One iteration as the page shows it, including the round beneath it. */
  private view(it: Iteration, previous?: Iteration): IterationView {
    const ai = this.aiView(it)
    return {
      /**
       * THE TWO NUMBERS, HEADLINE FIRST ([[REQ-277]]).
       *
       * The seam is read from the same two facts the reference line is rendered
       * from ([[REQ-272]] part 2): an iteration that re-captured, or one whose
       * bundle carries a different `capturedAt` from the iteration above it —
       * the second catches a reference re-rolled outside the console, which
       * moves the oracle just as completely and leaves no flag behind.
       */
      ...(it.gate
        ? {
            measurement: measurementView({
              n: it.n,
              unmeasured: it.gate.unmeasured,
              deltas: it.gate.valueDeltas ?? null,
              ...(previous?.gate
                ? {
                    previous: {
                      n: previous.n,
                      unmeasured: previous.gate.unmeasured,
                      deltas: previous.gate.valueDeltas ?? null,
                    },
                  }
                : {}),
              ...(previous && (it.recaptured === true || it.bundleCapturedAt !== previous.bundleCapturedAt)
                ? { seam: true }
                : {}),
            }),
          }
        : {}),
      n: it.n,
      originalUrl: it.originalUrl,
      reproHref: it.reproHref,
      diffHref: it.diffHref,
      pageHref: it.pageHref,
      /**
       * WHICH REFERENCE THIS ITERATION MEASURED AGAINST ([[REQ-272]] part 2).
       *
       * On every iteration, not only a re-captured one, because the fact is a
       * comparison: `re-captured` means nothing to a reader who cannot see what
       * the iterations either side of it used. A chain whose reference moved
       * half way through then reads as one chain with a marked seam, rather than
       * as a score that jumped for no reason anybody can see.
       */
      reference: {
        bundle: bundleLabel(it.bundleDir),
        ...(it.bundleCapturedAt ? { capturedAt: it.bundleCapturedAt } : {}),
        ...(it.recaptured ? { recaptured: true } : {}),
      },
      /**
       * THE BUTTON THAT STARTS THE ROUND ([[REQ-272]] part 1, behaviour 2).
       *
       * Offered while no round is in flight and this iteration has no round
       * worth keeping — none yet, or one that failed. A round that reached an
       * answer is not re-offered: `read it again` re-files from what it already
       * said, for free, and is the cheaper of the two by the whole cost of a
       * round.
       */
      ...(!this.running && (!it.outcome || it.outcome.status === 'failed')
        ? { diagnoseHref: `/iteration/${it.n}/diagnose`, diagnoseLabel: it.outcome ? 'diagnose again' : 'diagnose this' }
        : {}),
      // The fifth link exists only when a round really filed or appended
      // something (behavior 5) — a link to a ticket that does not exist would
      // be worse than the absence it is standing in for.
      ...(it.outcome?.ticketId
        ? { ticketHref: `/iteration/${it.n}/ticket`, ticketLabel: `the gap ticket (${it.outcome.ticketId})` }
        : {}),
      // …and one more per `1c` defect the round filed on the way ([[REQ-261]]
      // behaviour 2). Peers of the gap link because they are peers as tickets:
      // same round, same status, created the same way.
      ...(it.outcome?.bugTickets?.length
        ? {
            extraTickets: it.outcome.bugTickets.map((id) => ({
              href: `/iteration/${it.n}/ticket/${id}`,
              label: `a bug it found (${id})`,
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
    // The same split as the status line ([[REQ-276]] behaviour 3), kept under
    // the round it belongs to so it is still there once the status line has
    // moved on to the next iteration.
    const classSplit = live || !outcome ? '' : describeSplit(filingsOf(outcome))
    return {
      status: live ? 'running' : (outcome?.status ?? 'failed'),
      summary: live ? '' : (outcome?.summary ?? outcome?.reason ?? ''),
      ...(outcome?.residualClass ? { residualClass: outcome.residualClass } : {}),
      ...(outcome?.ticketId ? { ticketId: outcome.ticketId } : {}),
      // What it cost and what ran it ([[REQ-261]] behavior 6) — on the page
      // rather than only in the artifact, because "can we afford to run this
      // often" is a question the operator asks while looking at it.
      ...(cost ? { cost } : {}),
      // The same split as the status line ([[REQ-276]] behaviour 3), kept under
      // the round it belongs to so it is still there when the status line has
      // moved on to the next iteration.
      ...(classSplit ? { classSplit } : {}),
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
      observations: live ? [] : (outcome?.observations ?? []),
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
        // [[REQ-272]] part 2 — which reference this iteration used, back from
        // its own manifest. Absent on an iteration written before the field
        // existed, which reads as a refold, which is what it was.
        ...(manifest.bundleCapturedAt ? { bundleCapturedAt: manifest.bundleCapturedAt } : {}),
        ...(manifest.recaptured ? { recaptured: true } : {}),
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
    /**
     * THE ONLY VERB ([[REQ-299]] part 1).
     *
     * `/run` and `/run-again` were retired with the buttons that posted to them
     * and are GONE rather than left answering: a retired route that still works
     * is a second way to do the thing the page stopped offering, and the whole
     * of part 1 is that there is one way. A POST to either now falls through to
     * the 404 at the bottom of this function.
     */
    if (method === 'POST' && pathname === '/recapture') {
      return this.startRun(formField(req.body ?? '', 'url'))
    }
    // [[REQ-299]] part 2 — the chain put down, and kept.
    if (method === 'POST' && pathname === '/clear') return this.clear()
    /**
     * THE FIRST DECISION POINT ([[REQ-272]] part 1, behaviour 2).
     *
     * The round used to start from the iteration finishing. It starts from here
     * now, and from nowhere else in this file — which is the whole of part 1's
     * first half: the operator sees the reproduction, the diff images and the L1
     * document, and only then decides whether the gap in front of them is worth
     * a round's money.
     */
    const diagnose = /^\/iteration\/(\d+)\/diagnose$/.exec(pathname)
    if (method === 'POST' && diagnose) return this.startDiagnose(Number(diagnose[1]))
    /**
     * THE SECOND ([[REQ-272]] part 1, behaviour 3) — the operator saying the
     * implementation has landed, which is what lifts the hold on [run again].
     */
    if (method === 'POST' && pathname === '/release') return this.release()
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
      : `Loaded ${this.url}. Press [recapture] to reproduce it.`
    this.failed = false
    return seeOther('/')
  }

  /**
   * [recapture], which is now the only verb ([[REQ-299]] part 1).
   *
   * It always carries an address, from whichever of its two positions was
   * pressed — the text box on the address row, or the hidden field under the
   * iteration list — and it always re-hits that site and re-rolls the oracle
   * before folding. What varies is only what the address names: the site
   * already on the page, in which case the next iteration is APPENDED to the
   * chain ([[REQ-272]] part 2), or a different one, in which case the list
   * starts over at Iteration 1.
   *
   * THERE IS NO LONGER A PRESS THAT REUSES THE BUNDLE ON DISK. [[REQ-254]]
   * requirement 29 made reuse the default so the reference and the fold would
   * not move together, and [run again] made it the whole act — but whether that
   * is the right call depends on the schema the stored bundle was written at
   * against the schema the extractor is at now, which is not a fact the page
   * carries. So the choice is gone and re-rolling is unconditional: every
   * iteration the console produces is measured at the current capture schema.
   * The stored bundle is still ADOPTED without running anything, by the
   * `captured already` list (requirement 31) — adopting is not folding.
   *
   * A second press while a run is in flight starts nothing and says so. The
   * page disables its buttons from the poller, so this is the backstop for the
   * press that lands in the gap rather than the thing a human normally meets —
   * and the same is true of the hold: {@link heldBy} is checked here because the
   * disabled button is a courtesy and this is the rule.
   */
  private startRun(typedUrl: string | undefined): ConsoleResponse {
    if (this.running) return html(409, 'A run is already in progress. <a href="/">back</a>')

    const trimmed = typedUrl?.trim()
    if (typedUrl !== undefined && !trimmed) {
      this.message = 'Enter a site address first.'
      this.failed = true
      return seeOther('/')
    }
    if (typedUrl === undefined && this.url === null) {
      this.message = 'Enter a site address first.'
      this.failed = true
      return seeOther('/')
    }

    /**
     * IS THIS PRESS THE SAME CHAIN, OR A NEW ONE ([[REQ-272]] part 2)?
     *
     * The one question both of this ticket's halves turn on. A press with no
     * address is the loaded site by definition; a press with one is the loaded
     * site when the addresses name the same host, which is {@link bareHost}'s
     * comparison and not a second spelling of it. Everything else — the hold,
     * whether [recapture] appends or resets — follows from the answer.
     */
    const continuing = trimmed === undefined || (this.url !== null && bareHost(trimmed) === bareHost(this.url))

    const held = continuing ? this.heldBy() : null
    if (held) {
      this.message = `${this.heldView()?.waitingFor ?? ''} Press [the implementation has landed] first.`
      this.failed = true
      return seeOther('/')
    }

    let recaptured = false
    if (continuing) {
      /**
       * A RE-CAPTURE THAT KEEPS THE CHAIN ([[REQ-272]] part 2, item 1).
       *
       * The old [recapture] reset the list, which made it unusable for the one
       * thing it is for: a capture-side fix landed, and the question is whether
       * it moved the numbers. Answering that needs the iterations BEFORE the fix
       * still on the page beside the one after it. So the list, the slug and the
       * site are left exactly as they are, and only the bundle is dropped —
       * which is what makes {@link execute} capture instead of refold.
       *
       * `recaptured` is false on a first iteration: there is nothing above it
       * whose numbers this one is not comparable with, so marking it would be
       * saying something about a comparison that does not exist.
       */
      recaptured = this.iterations.length > 0
      this.bundleDir = undefined
    } else if (trimmed !== undefined) {
      /**
       * A DIFFERENT SITE IS A DIFFERENT CHAIN ([[REQ-299]] part 1).
       *
       * The address row's press, when the address is not the one on the page.
       * The bundle is dropped rather than looked for on disk — requirement 29's
       * reuse is retired with [run again], and for the same reason: a fold
       * against a stored bundle is measured at whatever schema that bundle was
       * written at, which is not a fact this page carries.
       */
      this.url = normalizeUrl(trimmed)
      this.slug = slugForUrl(this.url)
      this.bundleDir = undefined
      this.iterations.length = 0
      this.version += 1
    }

    const n = this.iterations.length + 1
    const site = this.url as string
    const captureUrl = this.bundleDir === undefined ? site : undefined

    this.running = true
    this.failed = false
    this.message = `Running iteration ${n}${recaptured ? ' — re-capturing the reference' : ''}…`
    this.inFlight = this.execute(n, captureUrl, recaptured)
    return seeOther('/')
  }

  /**
   * THE HOLD LIFTED ([[REQ-272]] part 1, behaviour 3).
   *
   * The operator asserting a fact the console cannot check — that the ticket the
   * last round filed has been implemented. Recorded beside that round rather
   * than in memory, so the assertion survives a restart exactly as the round it
   * answers does.
   *
   * A POST, like every other verb here, and for the same reason: it changes what
   * the console will do next, and a GET that did would be a back-button away
   * from doing it again.
   */
  private release(): ConsoleResponse {
    const held = this.heldBy()
    if (!held) {
      this.message = 'Nothing is held.'
      this.failed = false
      return seeOther('/')
    }
    const aiDir = path.join(held.dir, AI_DIR)
    mkdirSync(aiDir, { recursive: true })
    writeFileSync(
      path.join(aiDir, AI_RELEASE_FILE),
      JSON.stringify({ releasedAt: new Date().toISOString(), ticketId: held.outcome?.ticketId ?? null }, null, 2),
    )
    this.message = `Iteration ${held.n}'s implementation is marked as landed — [recapture] to measure it.`
    this.failed = false
    this.version += 1
    return seeOther('/')
  }

  /**
   * THE CHAIN PUT DOWN, AND KEPT ([[REQ-299]] part 2).
   *
   * The iteration list is the record of what this chain has learned, and it is
   * also several screens of rows about runs the operator finished reasoning
   * about two rounds ago. So this ends the chain — the page goes back to the
   * blank state it opens in, and the next chain starts at Iteration 1 — without
   * ending the evidence.
   *
   * IT ARCHIVES, IT DOES NOT DELETE. The chain directory holds the AI
   * transcripts, the diffs, the ids of the gap tickets the rounds filed and what
   * the rail said about each one. A press of a button on a page does not get to
   * destroy that. So the directory is RENAMED, beside itself, and the operator
   * who wants an iteration back finds it one `ls` away rather than in a location
   * they would have to be told about. The console reads a chain at its exact
   * slug, so the archive is invisible to the page without any filtering rule
   * that would have to be kept true.
   *
   * THE REFERENCE IS NOT TOUCHED. `storage/references/<site>/` is a separate
   * artifact with a separate lifecycle — the regression rail baselines against
   * it, and it is what the `captured already` list offers back. Clearing the
   * history is a statement about this page, not about that bundle.
   *
   * The gap registry is not touched either, and for the same kind of reason: it
   * lives at the workspace root, above the site directory, because it is what
   * the loop has learned across every chain rather than what this one did.
   */
  private clear(): ConsoleResponse {
    if (this.running) return html(409, 'A run is already in progress. <a href="/">back</a>')
    // The hold is checked here for the same reason it is checked in
    // {@link startRun}: the disabled button is a courtesy and this is the rule.
    const held = this.heldBy()
    if (held) {
      this.message = `${this.heldView()?.waitingFor ?? ''} Press [the implementation has landed] first.`
      this.failed = true
      return seeOther('/')
    }
    if (this.url === null) {
      this.message = 'Nothing to clear.'
      this.failed = false
      return seeOther('/')
    }

    const moved = this.iterations.length
    const live = this.siteDir
    let archive: string | null = null
    if (existsSync(live)) {
      archive = this.archiveName()
      // BEFORE the state is reset, so a rename that cannot happen leaves the
      // page exactly as it was rather than reading empty over a chain still on
      // disk. The throw becomes a 500 naming the OS error, which is the honest
      // answer to "this is recoverable" turning out not to be.
      renameSync(live, path.join(this.workspace, archive))
    }

    this.url = null
    this.slug = ''
    this.bundleDir = undefined
    this.iterations.length = 0
    this.live = null
    this.failed = false
    // WHERE IT WENT, ON THE PAGE. A control whose whole promise is "this is
    // recoverable" has to say what it is recoverable from, or the promise is
    // one the operator has to take on faith at the moment they are least able
    // to check it.
    this.message = archive
      ? `History cleared — ${moved} iteration(s) moved to ${path.join(CONSOLE_WORKSPACE, archive)}. The captured reference is untouched.`
      : 'History cleared.'
    this.version += 1
    return seeOther('/')
  }

  /**
   * A free name for the chain being archived, beside the chain itself.
   *
   * The timestamp is what makes one clearing distinguishable from the next, and
   * the counter is what makes two clearings within the same millisecond two
   * archives rather than a rename onto an existing directory. Cheap, and the
   * alternative is an operator losing a chain to a collision they could not
   * have anticipated.
   */
  private archiveName(): string {
    const stamp = `${this.slug}.cleared-${new Date().toISOString().replace(/[:.]/g, '-')}`
    let name = stamp
    for (let n = 2; existsSync(path.join(this.workspace, name)); n += 1) name = `${stamp}-${n}`
    return name
  }

  /**
   * START THE ROUND UNDER ONE ITERATION ([[REQ-272]] part 1, behaviour 2).
   *
   * Everything the round then does is unchanged — {@link diagnose} is the same
   * function it always was, with the same `capture-incomplete` stop, the same
   * streaming transcript and the same filing checks. What changed is only who
   * calls it, and the answer is now: the operator, once, having looked.
   *
   * `running` is held for the length of the round, which is what stops a second
   * press starting a second one on top of it — the same interlock [run again]
   * has always been under.
   */
  private startDiagnose(n: number): ConsoleResponse {
    if (this.running) return html(409, 'A run is already in progress. <a href="/">back</a>')
    const it = this.iterations.find((entry) => entry.n === n)
    if (!it) return text(404, 'No such iteration')
    this.running = true
    this.failed = false
    this.message = `Iteration ${n} — starting the round…`
    this.version += 1
    this.inFlight = this.diagnose(it).finally(() => {
      this.running = false
    })
    return seeOther('/')
  }

  private async execute(n: number, captureUrl: string | undefined, recaptured = false): Promise<void> {
    const dir = path.join(this.cwd, CONSOLE_WORKSPACE, this.slug, `iteration-${n}`)
    try {
      const outcome = await runIteration({
        cwd: this.cwd,
        captureUrl,
        bundleDir: this.bundleDir,
        recaptured,
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
        ...(outcome.bundleCapturedAt ? { bundleCapturedAt: outcome.bundleCapturedAt } : {}),
        ...(recaptured ? { recaptured: true } : {}),
        gate: outcome.gate,
        railResult: outcome.rail,
        outcome: null,
      }
      this.iterations.push(iteration)
      /**
       * THE ITERATION ENDS HERE, AND NOTHING FOLLOWS IT ([[REQ-272]] part 1,
       * behaviour 1).
       *
       * [[REQ-256]] behaviour 1 started the round from this line — "the links
       * appearing IS the trigger" — which put the AI's budget on the far side of
       * a decision nobody was asked to make. The operator needs to SEE the
       * reproduction first: the original, the reproduction, the diff images and
       * the L1 document are all live at this moment, and what they show is
       * routinely enough to know a round is not worth running. So the console
       * goes idle with the links up, and {@link startDiagnose} is the only way a
       * round ever starts.
       *
       * What this does NOT change is the interlock: a round holds `running` for
       * its whole length, so [run again] still cannot start an iteration on top
       * of a diagnosis in flight ([[REQ-256]] behaviour 10, requirement 23).
       */
      this.message = `Iteration ${n} finished — read it, then press [diagnose this] if it is worth a round.`
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
    /**
     * HOW OLD THE ORACLE IS, AND WHAT LANDED SINCE ([[REQ-272]] part 2, item 3).
     *
     * Computed before the digest because the digest carries it, and computed by
     * the CONSOLE because the console is the thing with a shell and a clock. The
     * observed round that made this a ticket spent $7.70 and 78 turns arriving
     * at "the reference was captured 70 minutes before the commit that fixed the
     * residuals measured against it" — an answer that was two cheap reads away
     * the whole time: the bundle's own `capturedAt` and the engine's own log.
     */
    const reference = await this.referenceProvenance(it)

    const digestFile = path.join(aiDir, AI_DIGEST_FILE)
    try {
      writeFileSync(
        digestFile,
        digestFromDisk({
          n: it.n,
          bundleDir: it.bundleDir,
          landedSince: reference.landedSince,
          evidenceDir: it.diffOut,
          pageDocument: it.pageOut,
        }),
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
    // The capture time is part of the resume key ([[REQ-272]] part 2): reset
    // rule 1's "or the same site re-captured" half, which could not fire while
    // a bundle's name was the only thing identifying the reference.
    const resumeCtx = {
      bundleDir: it.bundleDir,
      capturedAt: reference.capturedAt ?? '',
      briefHash: briefFingerprint(brief),
    }
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
      reference,
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
    const ready = await this.readyFindings(readyBefore, outcome)
    const roundViolations = [...(await this.codeViolations(before)), ...ready.violations]
    this.live = null

    await this.settle(it, aiDir, outcome, roundViolations, ready.observations)
  }

  /**
   * Everything the console does with a round's answer, wherever it came from.
   *
   * Shared by {@link diagnose} and {@link recover} ([[REQ-261]] behavior 5),
   * because a diagnosis read back off a transcript must be filed by exactly the
   * same path as one handed over live — otherwise "recovered" would be a second,
   * weaker kind of filing, with its own rules to go stale.
   */
  private async settle(
    it: Iteration,
    aiDir: string,
    outcome: AiOutcome,
    roundViolations: string[],
    observations: string[] = [],
  ): Promise<void> {
    outcome.violations = [...roundViolations, ...(await this.confirm(it, outcome))]
    // Kept apart from the violations all the way to the page ([[BUG-114]]):
    // merging them here would be the whole bug again, one layer lower.
    outcome.observations = observations
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
   * Read back what the round says it filed ([[REQ-262]] D10, requirement 17).
   *
   * THE CONSOLE NO LONGER FILES. [[REQ-256]] behaviour 4 had it create the
   * ticket because the round could not run a command; D7 gave the round `Bash`
   * and D10 gave it the job, so `xgd ticket create` happens in the round and
   * this is what checks the result. What used to be a relay — hand back
   * `type`/`title`/`body`, shell out, parse the uid, write the body through a
   * temp file — is gone, along with `fileTicket`, `fileBugs` and
   * `appendGapEvidence` on this path.
   *
   * READ BACK, NOT TRUSTED. `status: draft` used to be structural: the console
   * wrote the status, so there was no status for a round to get wrong. Now
   * there is one, and the mitigation is that every id the round reports is
   * fetched and the status it REALLY carries is recorded. A `ready_*` status is
   * a dispatcher trigger and gets said so in as many words.
   *
   * NOTHING HERE FAILS A ROUND THAT DID THE WORK. The tickets exist already —
   * the round made them — so a console that marked the round failed because it
   * could not read one back would be reporting its own blindness as the round's
   * error, and would hide a real diagnosis behind it. Everything it finds is a
   * violation line instead, which is how the page already says a round
   * misbehaved.
   */
  private async confirm(it: Iteration, outcome: AiOutcome): Promise<string[]> {
    if (outcome.status !== 'filed' && outcome.status !== 'appended') return []
    /**
     * A CLAIM WITH NO ID IS A FAILED ROUND, and it is caught here as well as in
     * the parser. `parseOutcome` rejects it for a round that reported through a
     * transcript, but an outcome can also arrive from a runner directly, and a
     * console that then asked `xgd` about `undefined` would turn an unverifiable
     * claim into a confusing one. There is nothing to read back, so there is
     * nothing to put on the page except that fact.
     */
    if (!outcome.ticketId) {
      outcome.status = 'failed'
      outcome.reason = `the round claimed to have filed but named no ticket id, so there is nothing to read back.`
      return [outcome.reason]
    }
    const problems: string[] = []
    const read: ReadTicket[] = []

    const gap = await this.readTicket(outcome.ticketId)
    read.push(gap)
    outcome.ticketStatus = gap.status
    if (!gap.found) problems.push(`could not read ${gap.id} back, so its status is unverified.`)
    else {
      if (gap.status !== TICKET_STATUS) problems.push(wrongStatus(gap))
      problems.push(...wrongProvenance(gap))
      problems.push(...wrongDefectClass(gap))
    }

    // Secondary `1c` defects, read back the same way and to the same standard —
    // they are peers as tickets even though they are secondary as findings.
    for (const id of outcome.bugTickets ?? []) {
      const bug = await this.readTicket(id)
      read.push(bug)
      if (!bug.found) problems.push(`could not read ${bug.id} back, so its status is unverified.`)
      else {
        if (bug.status !== TICKET_STATUS) problems.push(wrongStatus(bug))
        problems.push(...wrongProvenance(bug))
        // EVERY TICKET, NOT ONLY THE GAP ONE ([[REQ-276]]). Nine of the
        // twenty-two defects EPIC-19 classified were instrument defects, and an
        // instrument defect arrives here — as a secondary `1c` bug — not as the
        // gap ticket. Checking only the gap ticket would leave the largest
        // block of findings sorted by nothing, which is the state this fixes.
        problems.push(...wrongDefectClass(bug))
      }
    }
    outcome.ticketsRead = read

    /**
     * ONE TICKET PER GAP CLASS (behaviour 6), now observed rather than enforced.
     *
     * The console used to decide this — a class already in the registry got an
     * append whatever the round asked for. It cannot any more: by the time it
     * sees the outcome the ticket is already created. So a round that filed a
     * SECOND ticket for a class that had one is reported, with both ids, for a
     * human to merge. Saying nothing would let the registry quietly hold one id
     * while two tickets described one class.
     */
    const known = gapForClass(readGaps(this.workspace), outcome.residualClass as string)
    if (known?.ticketId && known.ticketId !== outcome.ticketId) {
      problems.push(
        `'${outcome.residualClass}' already had ${known.ticketId}, and this round filed ` +
          `${outcome.ticketId} for the same class. One of them should be merged into the other.`,
      )
    }

    /**
     * Recorded whether the round filed or appended: an appended round's
     * contribution is the new reference and the new iteration, which is the
     * evidence that the class recurs — the frequency signal [[EPIC-12]] §7.3
     * wanted, arriving here for free.
     */
    recordGap(this.workspace, {
      residualClass: outcome.residualClass as string,
      ticketId: outcome.ticketId ?? '',
      ticketUid: outcome.ticketId ?? '',
      summary: outcome.summary ?? '',
      // The class travels with the class registry as well as with the ticket
      // ([[REQ-276]]): a later round is handed the known classes in its prompt,
      // and where a class sits is part of knowing it.
      defectClasses: gap.defectClasses,
      reference: it.bundleDir,
      iteration: `${this.slug}#${it.n}`,
    })
    return problems
  }

  /**
   * One ticket, as `xgd` reports it. Never throws — see {@link confirm}.
   *
   * PARSED, NOT SCRAPED ([[BUG-104]]). This read `Status:` out of the human
   * rendering with a regex, which worked and was never going to reach
   * `created_by` — that field is not in the human output at all. `--json` puts
   * both in one document under `frontmatter`, so the provenance check arrives
   * and the status check stops depending on the shape of a log line.
   *
   * UNREADABLE IS ITS OWN ANSWER. A refusal, a parse failure and a document
   * with no status in it all come back `found: false` with empty fields, which
   * {@link confirm} reports as unverified. It must never read as a provenance
   * failure: "the console could not look" and "the round filed under the wrong
   * name" are different findings and a reader has to be able to tell them
   * apart.
   */
  private async readTicket(id: string): Promise<ReadTicket> {
    const unread = unreadTicket(id)
    const result = await this.runCommand('xgd', ['ticket', 'get', id, '--json'], this.cwd).catch(() => null)
    if (!result || result.code !== 0) return unread
    try {
      const doc = parseJsonOutput<{
        frontmatter?: { status?: string; created_by?: string; fields?: Record<string, unknown> }
        fields?: Record<string, unknown>
      }>(result.stdout, 'xgd ticket get --json')
      const status = doc.frontmatter?.status
      if (!status) return unread
      /**
       * WHERE THE DEFECT SITS, READ OFF THE TICKET ([[REQ-276]]).
       *
       * `xgd` prints the fields twice — once inside `frontmatter` and once
       * beside it — and either is the same document. Both are read so that the
       * check is about what the round wrote rather than about which of the two
       * shapes this version of the CLI happens to lead with.
       */
      const fields = doc.fields ?? doc.frontmatter?.fields
      return {
        id,
        status,
        createdBy: doc.frontmatter?.created_by ?? '',
        defectClasses: parseDefectClasses(fields?.[DEFECT_CLASS_FIELD]),
        found: true,
      }
    } catch {
      return unread
    }
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
    /**
     * WHAT THE ROUND BOUGHT, ON THE LINE THE OPERATOR ALREADY READS
     * ([[REQ-276]] behaviour 3).
     *
     * A round costs several dollars and the question after it is not "did it
     * file" — the line already answered that — but "did that buy ruler repair
     * or ceiling". The split is the answer, and it is one clause rather than a
     * panel because it has to survive being read at a glance.
     */
    const split = describeSplit(filingsOf(outcome))
    this.message =
      `Iteration ${it.n} finished — AI ${what}${split ? ` — ${split}` : ''}.` +
      `${outcome.violations?.length ? ' See the violations under it.' : ''}`
    this.failed = false
    this.live = null
    this.version += 1
  }

  /**
   * WHEN THIS ITERATION'S REFERENCE WAS TAKEN, AND WHAT LANDED AFTER IT
   * ([[REQ-272]] part 2, item 3).
   *
   * The timestamp is the iteration's own — recorded in its manifest when it ran
   * — falling back to the bundle on disk for an iteration written before the
   * field existed. It cannot simply be read from the bundle now: a bundle's name
   * is URL-derived and overwriting, so a later [recapture] replaces it in place
   * and a read today would answer for a reference this iteration never saw.
   *
   * The commit list is bounded and never fatal. A checkout with no git, a git
   * that refuses, a bundle with no capture time: all produce an empty list,
   * which reads on the page and in the prompt as "nothing is claimed" rather
   * than as "nothing landed" — the digest and the prompt both say which of the
   * two they have.
   */
  private async referenceProvenance(it: Iteration): Promise<{
    capturedAt?: string
    captureSchema?: number
    landedSince: string[]
  }> {
    const onDisk = readBundleProvenance(it.bundleDir)
    const capturedAt = it.bundleCapturedAt ?? onDisk.capturedAt
    const landedSince = capturedAt ? await this.landedSince(capturedAt) : []
    return {
      ...(capturedAt ? { capturedAt } : {}),
      ...(onDisk.captureSchema === undefined ? {} : { captureSchema: onDisk.captureSchema }),
      landedSince,
    }
  }

  /** The engine commits since an instant, newest first, one line each. */
  private async landedSince(capturedAt: string): Promise<string[]> {
    const result = await this.runCommand(
      'git',
      [
        'log',
        `--since=${capturedAt}`,
        `--max-count=${MAX_LANDED_COMMITS}`,
        '--date=short',
        '--format=%h %ad %s',
        '--',
        ENGINE_PATH,
      ],
      this.cwd,
    ).catch(() => null)
    if (!result || result.code !== 0) return []
    return result.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
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

  /**
   * What reached a trigger status while the round ran, and who is answerable
   * for it ([[BUG-114]]).
   *
   * THE ARRIVAL IS FOUND BY DIFFERENCE AND CHARGED BY ATTRIBUTION. Finding one
   * needs two snapshots because the store records no process against a status
   * change. Charging one needs `created_by`, which the LIST does not carry — so
   * each arrival, and only an arrival, is read back individually. That costs one
   * `xgd ticket get` per arrival and the ordinary round has none.
   */
  private async readyFindings(before: Map<string, ReadyTicket>, outcome: AiOutcome): Promise<ReadyFindings> {
    const nothing: ReadyFindings = { violations: [], observations: [] }
    // An unavailable "before" makes every existing ready ticket look new, which
    // would report dozens of arrivals that are nothing to do with the round.
    // Saying nothing is the honest answer when the comparison cannot be made.
    if (!before.size) return nothing
    let arrivals: ReadyTicket[]
    try {
      arrivals = readyStatusArrivals(before, await readyStatusSnapshot(this.cwd, this.runCommand))
    } catch {
      return nothing
    }
    if (!arrivals.length) return nothing
    const createdBy = new Map<string, string>()
    for (const arrival of arrivals) {
      const read = await this.readTicket(arrival.uid)
      // Only a ticket that was really read is recorded. An unreadable one stays
      // out of the map, so it is unattributed rather than falsely innocent —
      // `createdBy: ''` would read as a ticket the console looked at.
      if (read.found) createdBy.set(arrival.uid, read.createdBy)
    }
    // What the round said it filed, by both id and uid — the round reports ids,
    // the snapshot carries uids, and a round PROMOTING a ticket it filed is
    // exactly the case only its own words can connect.
    const named = new Set(
      [outcome.ticketId, ...(outcome.bugTickets ?? [])].filter((id): id is string => Boolean(id)),
    )
    return readyStatusFindings(arrivals, { named, createdBy })
  }

  
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
    const id = wanted ? bugs.find((bug) => bug === wanted) : iteration.outcome?.ticketId
    if (!id) return text(404, 'This round filed no such ticket.')
    const result = await this.runCommand('xgd', ['ticket', 'get', id], this.cwd).catch(() => null)
    const body = result?.code === 0 ? result.stdout : (result?.stderr || `could not read ${id}`)
    return html(result?.code === 0 ? 200 : 502, renderTicketPage(iteration.n, id, body))
  }

  /** The diff images, assembled from what `1c diff` wrote beside them. */
  private diffIndex(iteration: Iteration): ConsoleResponse {
    const reportFile = path.join(iteration.diffOut, 'regions.json')
    if (!existsSync(reportFile)) return text(404, 'No diff report for this iteration')
    const report = JSON.parse(readFileSync(reportFile, 'utf8')) as RegionReportFile
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
        caption: regionCaption(region),
      }))
    return html(
      200,
      renderDiffPage(iteration.n, `/iteration/${iteration.n}/diff/`, {
        meanDiff: report.meanDiff,
        pctOverThreshold: report.pctOverThreshold,
        rankedBy: report.rankedBy,
        regions,
      }),
    )
  }
}

/**
 * BUG-99 — the part of `regions.json` this page reads.
 *
 * Every field is optional, because the console must render a report written by
 * any version of `1c diff` it is pointed at. A missing `bbox` costs the caption,
 * not the page.
 */
interface RegionReportFile {
  meanDiff?: number
  pctOverThreshold?: number
  rankedBy?: string
  regions?: Array<{
    id: number | string
    bbox?: { x: number; y: number; w: number; h: number }
    score?: number
    meanDiff?: number
    crops?: { ref: string; actual: string; diff: string }
    nodes?: { ref?: RegionLeadFile[]; actual?: RegionLeadFile[] }
  }>
}

interface RegionLeadFile {
  kind?: string
  text?: string
  role?: string
  src?: string
  overlap?: { ofRegion?: number }
}

/** One lead in one phrase, or `nothing` — which is itself the finding. */
function leadPhrase(lead: RegionLeadFile | undefined): string {
  if (!lead) return 'nothing'
  const what = lead.text ? `“${lead.text}”` : (lead.src ?? lead.role ?? lead.kind ?? 'node')
  const pct = lead.overlap?.ofRegion
  return pct === undefined ? what : `${what} (${Math.round(pct * 100)}%)`
}

/**
 * The caption above a triptych: where the region is, how hard it disagrees, and
 * what each side has under it.
 *
 * Built from whatever the report carries — a pre-BUG-99 report with no `bbox`
 * gets no caption, and the three images are exactly what they were.
 */
export function regionCaption(region: NonNullable<RegionReportFile['regions']>[number]): string | undefined {
  const parts: string[] = []
  if (region.bbox) parts.push(`${region.bbox.x},${region.bbox.y} ${region.bbox.w}×${region.bbox.h}`)
  if (region.score !== undefined) parts.push(`score ${region.score}`)
  if (region.meanDiff !== undefined) parts.push(`mean ${region.meanDiff}`)
  if (region.nodes) parts.push(`ref: ${leadPhrase(region.nodes.ref?.[0])} · ours: ${leadPhrase(region.nodes.actual?.[0])}`)
  return parts.length ? parts.join(' · ') : undefined
}

/**
 * A bundle directory as the page names it ([[REQ-272]] part 2, item 1).
 *
 * The last two segments — `<host>/<pathSlug>`, which is the bundle's own name
 * and the tail an operator types after `--ref`. The absolute prefix is this
 * machine's and says nothing about which reference was used.
 */
export function bundleLabel(bundleDir: string): string {
  const parts = bundleDir.split(/[\\/]/).filter(Boolean)
  return parts.slice(-2).join('/') || bundleDir
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

/**
 * The outcome an iteration's AI round recorded, or none.
 *
 * NORMALISED, NOT ASSERTED ([[BUG-125]]). What comes back here was written by
 * whichever version of the console ran that round, which is not this one — so
 * it is handed to {@link normaliseOutcome} rather than cast, in the same way
 * {@link readIterations} normalises the manifest and {@link readGateReport} the
 * verdict. A file that is not JSON at all, or holds no status, is the same
 * answer as no file: this iteration has no round.
 */
function readOutcome(dir: string): AiOutcome | null {
  const file = path.join(dir, AI_DIR, AI_OUTCOME_FILE)
  if (!existsSync(file)) return null
  try {
    return normaliseOutcome(JSON.parse(readFileSync(file, 'utf8')))
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

/**
 * A read-back whose `created_by` does not say a round filed it ([[BUG-104]]).
 *
 * Returns nothing in the ordinary case, so it composes into the problem list
 * without a conditional at every call site. Only reached for a ticket that was
 * READ — an unreadable one is already reported as unverified, and reporting it
 * twice under two different headings would say the console found two problems
 * where it found one.
 */
function wrongProvenance(ticket: ReadTicket): string[] {
  if (filedByRound(ticket.createdBy)) return []
  return [
    `${ticket.id} was filed as '${ticket.createdBy || '(nothing)'}', not as '${ROUND_CREATED_BY}:<slug>#<n>'. ` +
      `A round's ticket that carries the operator's identity is an unreviewed machine diagnosis wearing a ` +
      `human's name — pass \`--created-by\` to \`xgd ticket create\`, see the brief §6.`,
  ]
}

/**
 * The tickets a round filed, each with where it said the defect sits
 * ([[REQ-276]]).
 *
 * Off the READ-BACK rather than off the outcome block, because the read-back is
 * what the store actually holds — and a class that is only in the block is a
 * class no filter will ever find. Tickets the console could not read at all are
 * dropped: they are already reported as unverified, and counting them in the
 * split would put a queue on the page that nothing in the store backs.
 */
export function filingsOf(outcome: AiOutcome): ClassifiedFiling[] {
  return (outcome.ticketsRead ?? [])
    .filter((ticket) => ticket.found && ticket.defectClasses.length)
    .map((ticket) => ({ id: ticket.id, classes: ticket.defectClasses }))
}

/**
 * A read-back carrying no class, or one that is not in the set ([[REQ-276]]).
 *
 * A VIOLATION, PEER OF THE STATUS AND THE PROVENANCE CHECKS. The class is the
 * deliverable of this behaviour in the same way the ticket is the deliverable
 * of the round: an unclassified ticket is one somebody has to audit later, and
 * "later" was measured at ten ticket bodies read by hand. Reported rather than
 * corrected — the console cannot know where the defect sits, which is the whole
 * reason the round is asked.
 */
function wrongDefectClass(ticket: ReadTicket): string[] {
  if (!ticket.defectClasses.length) {
    return [
      `${ticket.id} carries no \`${DEFECT_CLASS_FIELD}\`, so it cannot be read as ruler repair or as ceiling ` +
        `without somebody re-deriving the diagnosis from its body. Pass it in \`--fields\` — one of ` +
        `${DEFECT_CLASSES.map((entry) => `\`${entry.id}\``).join(', ')}, and \`cannot-tell\` is a real answer.`,
    ]
  }
  const unknown = unknownDefectClasses(ticket.defectClasses)
  if (!unknown.length) return []
  return [
    `${ticket.id} carries ${DEFECT_CLASS_FIELD} ${unknown.map((id) => `'${id}'`).join(', ')}, which ` +
      `${unknown.length === 1 ? 'is not one' : 'are not'} of the set. A class outside it filters as nothing at all — ` +
      `use one of ${DEFECT_CLASSES.map((entry) => `\`${entry.id}\``).join(', ')}.`,
  ]
}

/** One read-back that came out at the wrong status, said in one line. */
function wrongStatus(ticket: ReadTicket): string {
  return (
    `${ticket.id} is at '${ticket.status}', not '${TICKET_STATUS}'` +
    (ticket.status.startsWith('ready_')
      ? ' — a ready_* status is a dispatcher trigger and will spawn an automated pipeline against it.'
      : '.')
  )
}
