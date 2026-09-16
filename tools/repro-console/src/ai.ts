/**
 * The AI round (REQ-256).
 *
 * One iteration of loop 1 ([[EPIC-12]] §7.1): an AI process reads the evidence
 * a reproduction left on disk, names what the ENGINE cannot yet do, and hands
 * back a gap ticket. It writes no code — the console files the ticket, the
 * operator free-codes it in the ordinary way, and [run again] re-runs the
 * reproduction with whatever has landed since.
 *
 * THE ROUND HAS NO TOOL THAT CAN CHANGE ANYTHING (behavior 3, requirement 17).
 * {@link AI_ALLOWED_TOOLS} is reading and nothing else, and every tool that can
 * write a file, run a command, reach the network or spawn an agent whose tool
 * set is not this one is denied BY NAME in {@link AI_DISALLOWED_TOOLS} — which
 * removes it from the session's tool list outright rather than leaving it
 * available and merely unapproved.
 *
 * THE DENY LIST IS THE GATE, NOT THE ALLOW LIST. This was measured, not
 * assumed: with `Bash` merely absent from the allow list and the permission
 * mode left at its default, a round asked to run `echo` in a shell ran it and
 * reported no permission denial. An allow list that does not deny is a
 * description of intent, and behavior 3 needs a property. So the round cannot
 * run `xgd` either — which is why the DELIVERABLE IS THE TICKET'S CONTENT and
 * the console is what files it (see {@link GapTicketDraft}). That also makes
 * behavior 4's "never at a `ready_*` status" structural: the console writes the
 * status, so there is no status for a round to get wrong.
 *
 * WHY THE `claude` CLI AND NOT A CLIENT. The console spawns `1c` per step
 * already; spawning the CLI the operator is signed in to adds no dependency,
 * no credential handling and no bundled client. It is reached through an
 * injected {@link AiRunner}, the same seam {@link StepRunner} gives the
 * reproduction steps, so the console's whole surface is exercisable without
 * spending a token.
 */
import { readFileSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { GapEntry } from './gaps'
import type { RailRoundResult } from './rail-round'

/** How a round ended. `running` is the console's, never the AI's. */
export type AiStatus = 'running' | 'filed' | 'appended' | 'no-gap' | 'stopped' | 'failed'

/** The statuses a round may claim for itself in its outcome block. */
export const CLAIMABLE_STATUSES: readonly AiStatus[] = ['filed', 'appended', 'no-gap', 'stopped']

/**
 * The ticket a round hands back for the console to file (behavior 4).
 *
 * CONTENT, NOT A COMMAND. The round cannot run `xgd` — it cannot run anything —
 * so what it produces is the ticket's substance and the console turns that into
 * `xgd ticket create --fields '{"status":"draft"}'`. The five things behavior 4
 * requires a gap ticket to carry all live in `body`; `type` and `title` are
 * separate because xgd takes them separately.
 */
export interface GapTicketDraft {
  /** `bug` when the engine has a defect, `request` when it never had the capability. */
  type: 'bug' | 'request'
  /** Titled by AREA, not by type — the type is already in the ticket list. */
  title: string
  /** The residual class, the references, the evidence, the hypothesis, the change. */
  body: string
}

/**
 * What a round says it did.
 *
 * REPORTED, NOT MINED (requirement 20). The console does not read the
 * transcript for a diagnosis: what the round states in its outcome block is
 * what gets filed, and everything else it said is commentary on it.
 */
export interface AiOutcome {
  status: AiStatus
  /** The kind of gap, not the symptom on one site. See the brief, §5. */
  residualClass?: string
  /** Present on `filed`: the ticket the console is to create. */
  ticket?: GapTicketDraft
  /** Present on `appended`: the markdown to add to the class's existing ticket. */
  evidence?: string
  /** Filled in by the console once it has filed or appended. */
  ticketId?: string
  ticketUid?: string
  summary?: string
  /** Why a `stopped` or `failed` round did not file. */
  reason?: string
  /** Behaviours 3 and 4's falsifiers, filled in by the console after the round. */
  violations?: string[]
  /** The status the filed ticket actually carries, read back (behavior 4). */
  ticketStatus?: string
}

/** The part of `1c gate`'s report a round is handed inline. */
export interface GateSummary {
  verdict: string
  pass: boolean
  diagnosis: string
  nextStep: string
  meanDiff?: number
  pctOverThreshold?: number
  regions?: number
  valueDeltas?: number
  unreferencedImages?: string[]
}

/** The verdict that means the reference is wrong, not the engine (behavior 7). */
export const CAPTURE_INCOMPLETE = 'capture-incomplete'

/**
 * Read `gate.json` out of an iteration's evidence directory.
 *
 * Returns `null` when there is none or it cannot be read. The console treats
 * that as a reason to stop rather than as a reason to guess: behavior 7's stop
 * is decided from this file, so an unreadable one is the one case where
 * starting the AI anyway would be starting it blind.
 */
export function readGateReport(file: string): GateSummary | null {
  if (!existsSync(file)) return null
  try {
    const report = JSON.parse(readFileSync(file, 'utf8')) as {
      verdict?: string
      pass?: boolean
      diagnosis?: string
      nextStep?: string
      perceptual?: { meanDiff?: number; pctOverThreshold?: number; regions?: number }
      values?: { deltas?: number }
      coverage?: { unreferencedImages?: string[] }
    }
    if (typeof report.verdict !== 'string') return null
    return {
      verdict: report.verdict,
      pass: report.pass === true,
      diagnosis: typeof report.diagnosis === 'string' ? report.diagnosis : '',
      nextStep: typeof report.nextStep === 'string' ? report.nextStep : '',
      meanDiff: report.perceptual?.meanDiff,
      pctOverThreshold: report.perceptual?.pctOverThreshold,
      regions: report.perceptual?.regions,
      valueDeltas: report.values?.deltas,
      unreferencedImages: report.coverage?.unreferencedImages,
    }
  } catch {
    return null
  }
}

// ── the brief ────────────────────────────────────────────────────────────────

/**
 * The standing brief (behavior 11).
 *
 * A DOCUMENT, NOT A STRING BURIED IN THE CONSOLE. It is a file in the
 * repository, so changing what the AI is told is a diff somebody reviews — and
 * so the thing [[EPIC-12]] §8.5 calls a deliverable is one.
 */
export const BRIEF_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'brief',
  'DIAGNOSE-THE-GAP.md',
)

export function readBrief(file: string = BRIEF_FILE): string {
  return readFileSync(file, 'utf8')
}

// ── the prompt ───────────────────────────────────────────────────────────────

/** Everything about one round the brief does not already say. */
export interface RoundContext {
  n: number
  slug: string
  /** The address the capture answered on. */
  originalUrl: string
  /** The reference bundle every step pointed `--ref` at — `raw.html` lives here. */
  bundleDir: string
  /** Where `1c gate` wrote `gate.json`, `values-diff.json`, `regions.json`. */
  evidenceDir: string
  /** This iteration's copy of the reproduction's own L1 document. */
  pageDocument: string
  /** This iteration's rendered reproduction. */
  siteDir: string
  gate: GateSummary | null
  rail: RailRoundResult
  /** The classes that already have tickets (behavior 6). */
  knownGaps: GapEntry[]
}

/**
 * The brief, then this round's evidence.
 *
 * PATHS, NOT CONTENTS, for everything but the gate summary. The one rule is
 * *transcribe from the captured DOM*, and a prompt that pasted the values in
 * would be doing the transcription for the round — which reads convenient and
 * is exactly the habit [[DOC-19]] says produces reconstructions. Handing it the
 * paths makes reading the file the cheapest way to answer, which is the
 * behaviour we want.
 */
export function buildPrompt(brief: string, ctx: RoundContext): string {
  const gate = ctx.gate
    ? [
        `- verdict: **${ctx.gate.verdict}**${ctx.gate.pass ? ' (pass)' : ''}`,
        `- perceptual: mean ${ctx.gate.meanDiff ?? '?'}/255 · ${ctx.gate.pctOverThreshold ?? '?'}% of pixels over threshold · ${ctx.gate.regions ?? '?'} region(s)`,
        `- values-diff: ${ctx.gate.valueDeltas ?? '?'} delta(s)`,
        ...(ctx.gate.unreferencedImages?.length
          ? [`- mirrored images no manifest element references: ${ctx.gate.unreferencedImages.join(', ')}`]
          : []),
        `- diagnosis: ${ctx.gate.diagnosis}`,
        `- next step: ${ctx.gate.nextStep}`,
      ].join('\n')
    : '- no gate report was produced for this round.'

  const gaps = ctx.knownGaps.length
    ? ctx.knownGaps
        .map(
          (gap) =>
            `- \`${gap.residualClass}\` → **${gap.ticketId}** (\`${gap.ticketUid}\`) · seen on ${gap.references.join(', ')}\n  ${gap.summary}`,
        )
        .join('\n')
    : '- none yet. Anything you find this round is a new class.'

  return `${brief}

---

# This round

Iteration **${ctx.n}** of the reproduction of **${ctx.originalUrl}** (sandbox site \`${ctx.slug}\`).

## The gate

${gate}

## Where the evidence is

Every path is absolute and every file is already written. Read them.

- \`${path.join(ctx.evidenceDir, 'gate.json')}\` — the full reconciliation, including the coverage block.
- \`${path.join(ctx.evidenceDir, 'values-diff.json')}\` — the value deltas. **This is your strongest evidence.**
- \`${path.join(ctx.evidenceDir, 'regions.json')}\` — the ranked pixel regions. Read these before the mean; they point, they do not measure.
- \`${ctx.bundleDir}\` — the reference bundle: \`capture.json\`, \`raw.html\`, \`multistate.json\`, \`screenshot.full.png\`. **\`raw.html\` is the ground truth.**
- \`${ctx.pageDocument}\` — this iteration's copy of the reproduction's own L1 document, as \`1c page get … --json\` printed it.
- \`${ctx.siteDir}\` — the rendered reproduction.

The engine you are diagnosing is \`tools/generate/src/\` — the fold, the capture, the L1 substrate, the probes.

## The regression rail

${ctx.rail.summary}

## Classes that already have a ticket

If your diagnosis is one of these, **append to that ticket** and report \`"status": "appended"\` naming it. Do not file a second one.

${gaps}

---

Now do the round. Finish with the JSON block described in §7 of the brief, and nothing after it.
`
}

// ── the tool policy ──────────────────────────────────────────────────────────

/**
 * What the round may do (requirement 17): read, and nothing else.
 *
 * There is no tool here that can write a file, run a command, reach the
 * network or start another agent. That is the whole of behavior 3 — not a rule
 * the round is asked to keep, a shape the process has.
 */
export const AI_ALLOWED_TOOLS: readonly string[] = ['Read', 'Glob', 'Grep']

/**
 * What the round may not do, named rather than merely omitted.
 *
 * NAMING IS WHAT WORKS, AND THIS WAS MEASURED. A tool left off the allow list
 * is still IN the session — it is merely unapproved — and a round asked to run
 * `echo` through an unapproved `Bash` ran it and reported no denial. A tool
 * named here is removed from the session's tool list outright.
 *
 * Four families, and the reason for each:
 *
 *  - **authoring** — `Bash`, `Edit`, `Write`, `NotebookEdit`. The direct route.
 *  - **delegation** — `Task`, `Workflow`, `Skill`. An agent this round spawned
 *    would not inherit this list, so a spawner is an authoring tool wearing a
 *    different name.
 *  - **the network** — `WebFetch`, `WebSearch`, `RemoteTrigger`, `SendMessage`,
 *    `PushNotification`, `DesignSync`. Nothing about diagnosing a reproduction
 *    needs to leave this machine, and a round that can reach out is a round
 *    whose evidence could have come from somewhere other than the capture.
 *  - **the machine's own state** — `CronCreate`, `CronDelete`, `EnterWorktree`,
 *    `ExitWorktree`. A dev tool that can schedule work or move the checkout it
 *    is diagnosing is not a read-only round.
 *
 * The list is enumerated, which means it can go stale as the CLI grows tools.
 * That is an accepted cost rather than an oversight: the alternative is trusting
 * an allow list that was measured not to gate. When the CLI gains a tool that
 * can act, it belongs here — and the session's reported tool list, printed in
 * the transcript's first line, is where that would be noticed.
 */
export const AI_DISALLOWED_TOOLS: readonly string[] = [
  'Bash',
  'Edit',
  'Write',
  'NotebookEdit',
  'Task',
  'Workflow',
  'Skill',
  'WebFetch',
  'WebSearch',
  'RemoteTrigger',
  'SendMessage',
  'PushNotification',
  'DesignSync',
  'CronCreate',
  'CronDelete',
  'EnterWorktree',
  'ExitWorktree',
]

/**
 * The permission mode the round runs under.
 *
 * STATED, NEVER INHERITED. A settings file — the operator's, the project's —
 * may carry `defaultMode: auto`, and a round that inherited it would approve
 * its own tool calls. Defence in depth rather than the gate: what actually
 * stops a round acting is {@link AI_DISALLOWED_TOOLS}, because a tool merely
 * left unapproved was measured to run anyway.
 */
export const AI_PERMISSION_MODE = 'manual'

/**
 * No settings sources at all.
 *
 * The other half of the same argument: an `allow` rule in any settings file
 * would widen what the round may do, and the console cannot assert behavior 3
 * about a tool set that a file outside this repository can extend. Loading none
 * makes the argv the whole of the policy — which is the only version of it a
 * test can check.
 */
export const AI_SETTING_SOURCES = ''

/** The executable, and the model, both overridable by an operator. */
export const AI_COMMAND_ENV = 'REPRO_CONSOLE_AI'
export const AI_MODEL_ENV = 'REPRO_CONSOLE_AI_MODEL'

export interface AiCommand {
  command: string
  args: string[]
}

/**
 * The `claude -p` invocation.
 *
 * A pure function of the environment so the tool policy is assertable without
 * spawning anything — which is the only way a test can prove that the process
 * the console starts cannot write code.
 *
 * `--output-format stream-json` is what makes behavior 2's streaming transcript
 * possible at all; `--verbose` is required alongside it, and the prompt arrives
 * on stdin rather than in the argv because it carries the whole brief.
 */
export function claudeCommand(env: NodeJS.ProcessEnv = process.env): AiCommand {
  const model = env[AI_MODEL_ENV]?.trim()
  return {
    command: env[AI_COMMAND_ENV]?.trim() || 'claude',
    args: [
      '-p',
      '--output-format',
      'stream-json',
      '--verbose',
      '--permission-mode',
      AI_PERMISSION_MODE,
      '--setting-sources',
      AI_SETTING_SOURCES,
      '--allowedTools',
      ...AI_ALLOWED_TOOLS,
      '--disallowedTools',
      ...AI_DISALLOWED_TOOLS,
      ...(model ? ['--model', model] : []),
    ],
  }
}

// ── the transcript ───────────────────────────────────────────────────────────

/** One-line-per-thing, for a `<pre>` a human reads while it happens. */
export function formatStreamEvent(raw: string): string[] {
  let event: Record<string, unknown>
  try {
    event = JSON.parse(raw) as Record<string, unknown>
  } catch {
    // Not every line a CLI prints is its protocol. Keeping it is better than
    // dropping it: the commonest reason for a round to produce nothing useful
    // is a refusal printed in plain text.
    return raw.trim() ? [raw.trimEnd()] : []
  }
  const type = event.type
  if (type === 'system') {
    const model = typeof event.model === 'string' ? ` (${event.model})` : ''
    return [`— session started${model}`]
  }
  if (type === 'assistant' || type === 'user') {
    const message = event.message as { content?: unknown } | undefined
    const content = Array.isArray(message?.content) ? message.content : []
    const lines: string[] = []
    for (const block of content as Array<Record<string, unknown>>) {
      if (block.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
        lines.push(block.text.trimEnd())
      } else if (block.type === 'tool_use') {
        lines.push(`→ ${String(block.name)} ${summariseToolInput(block.input)}`)
      } else if (block.type === 'tool_result') {
        lines.push(`← ${block.is_error === true ? 'refused' : 'ok'}`)
      }
    }
    return lines
  }
  if (type === 'result') {
    const result = typeof event.result === 'string' ? event.result : ''
    return result.trim() ? [result.trimEnd()] : ['— round finished']
  }
  return []
}

/** A tool call in one line — enough to follow, not enough to drown the pane. */
function summariseToolInput(input: unknown): string {
  if (typeof input !== 'object' || input === null) return ''
  const record = input as Record<string, unknown>
  const first = record.command ?? record.file_path ?? record.pattern ?? record.path
  const text = typeof first === 'string' ? first : JSON.stringify(record)
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > 160 ? `${flat.slice(0, 160)}…` : flat
}

// ── the outcome block ────────────────────────────────────────────────────────

/**
 * The JSON block the round finishes with (requirement 20).
 *
 * The LAST parseable fenced block wins: a round that shows an example of the
 * shape before filling it in — which they do — must not have its example read
 * as its answer, and a malformed final block falls through to the one before it
 * rather than losing the round outright.
 *
 * A claim that does not carry what its status requires is a FAILED round, not a
 * partly-honoured one. `filed` without a ticket body would file an empty
 * ticket; `appended` without evidence would append nothing. Either is worse
 * than saying the round did not produce an answer.
 */
export function parseOutcome(finalText: string): AiOutcome {
  const fences = [...finalText.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/g)]
  for (let i = fences.length - 1; i >= 0; i -= 1) {
    let parsed: unknown
    try {
      parsed = JSON.parse(fences[i][1])
    } catch {
      continue
    }
    if (typeof parsed !== 'object' || parsed === null) continue
    const outcome = parsed as Record<string, unknown>
    if (typeof outcome.status !== 'string') continue
    if (!CLAIMABLE_STATUSES.includes(outcome.status as AiStatus)) {
      return {
        status: 'failed',
        reason: `the round claimed a status it may not claim: '${outcome.status}'`,
      }
    }
    const status = outcome.status as AiStatus
    const base: AiOutcome = {
      status,
      residualClass: str(outcome.residualClass),
      summary: str(outcome.summary),
      reason: str(outcome.reason),
    }
    if (status === 'filed') {
      const ticket = readTicketDraft(outcome.ticket)
      if (!ticket) return { status: 'failed', reason: 'the round claimed to have filed but handed back no ticket.' }
      if (!base.residualClass) {
        return { status: 'failed', reason: 'the round handed back a ticket without naming its residual class.' }
      }
      return { ...base, ticket }
    }
    if (status === 'appended') {
      const evidence = str(outcome.evidence)
      if (!evidence || !base.residualClass) {
        return {
          status: 'failed',
          reason: 'the round claimed to have appended without naming a class and the evidence to add.',
        }
      }
      return { ...base, evidence }
    }
    return base
  }
  return { status: 'failed', reason: 'the round produced no outcome block.' }
}

/** A ticket draft, or nothing — a half-filled one is not a ticket. */
function readTicketDraft(value: unknown): GapTicketDraft | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const draft = value as Record<string, unknown>
  const title = str(draft.title)
  const body = str(draft.body)
  if (!title || !body) return undefined
  // `bug` when the engine has a defect, `request` when it never had the
  // capability. Anything else is a type this project does not free-code
  // against, so it is normalised rather than passed through to xgd.
  const type = draft.type === 'request' ? 'request' : 'bug'
  return { type, title, body }
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

// ── running it ───────────────────────────────────────────────────────────────

export interface AiRunOptions {
  /** Repo root — the round reads the engine and the evidence from here. */
  cwd: string
  /** The whole prompt: the brief plus this round's evidence. */
  prompt: string
  /** Called with each transcript line as it arrives (behavior 2). */
  onLine: (line: string) => void
}

/** Runs one AI round and resolves with what it claims it did. Injectable. */
export type AiRunner = (opts: AiRunOptions) => Promise<AiOutcome>

/**
 * The real runner: `claude -p`, one process per round.
 *
 * The prompt goes in on stdin and the transcript comes back as NDJSON on
 * stdout, line by line, so the page can show the round working rather than only
 * its result. A round that dies without a result is a failed round, not a
 * thrown exception — the console has an iteration on the page either way and
 * has to say something under it.
 */
export function spawnAiRunner(env: NodeJS.ProcessEnv = process.env): AiRunner {
  return (opts) =>
    new Promise<AiOutcome>((resolve) => {
      const { command, args } = claudeCommand(env)
      const child = spawn(command, args, { cwd: opts.cwd, stdio: ['pipe', 'pipe', 'pipe'] })
      let pending = ''
      let finalText = ''
      let stderr = ''

      const consume = (chunk: string, flush = false): void => {
        pending += chunk
        const lines = pending.split('\n')
        pending = flush ? '' : (lines.pop() ?? '')
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const event = JSON.parse(line) as Record<string, unknown>
            if (event.type === 'result' && typeof event.result === 'string') finalText = event.result
          } catch {
            // Not protocol — still shown, see formatStreamEvent.
          }
          for (const formatted of formatStreamEvent(line)) opts.onLine(formatted)
        }
      }

      child.stdout.on('data', (chunk: Buffer) => consume(chunk.toString()))
      child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()))
      child.on('error', (err: Error) => {
        opts.onLine(`— could not start ${command}: ${err.message}`)
        resolve({ status: 'failed', reason: `could not start ${command}: ${err.message}` })
      })
      child.on('close', () => {
        consume('', true)
        if (!finalText.trim()) {
          const why = stderr.trim().split('\n').filter((l) => /\w/.test(l)).slice(-3).join('\n')
          resolve({ status: 'failed', reason: why || 'the round produced no final message.' })
          return
        }
        resolve(parseOutcome(finalText))
      })

      child.stdin.write(opts.prompt)
      child.stdin.end()
    })
}
