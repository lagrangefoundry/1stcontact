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
 * the console is what files it (see {@link TicketDraft}). That also makes
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
 * A ticket a round hands back for the console to file (behavior 4).
 *
 * CONTENT, NOT A COMMAND. The round cannot run `xgd` — it cannot run anything —
 * so what it produces is the ticket's substance and the console turns that into
 * `xgd ticket create --fields '{"status":"draft"}'`. The five things behavior 4
 * requires a gap ticket to carry all live in `body`; `type` and `title` are
 * separate because xgd takes them separately.
 *
 * ONE SHAPE FOR BOTH DELIVERABLES ([[REQ-261]] behavior 2). A round produces the
 * one gap ticket against the reproduction engine, and — separately — any bugs it
 * tripped over on the way there: in L1, in its own brief, anywhere in `1c`.
 * Those are the same shape because they are filed the same way, by the same
 * console, at the same `draft` status. What differs is only which of the two
 * lists in {@link AiOutcome} they arrive in.
 *
 * NEITHER IS BOUNDED. A gap ticket describing five related residuals is one
 * ticket, not five rounds' worth of deferral — see the brief, §6.
 */
export interface TicketDraft {
  /** `bug` when the engine has a defect, `request` when it never had the capability. */
  type: 'bug' | 'request'
  /** Titled by AREA, not by type — the type is already in the ticket list. */
  title: string
  /** The residual class, the references, the evidence, the hypothesis, the change. */
  body: string
}

/** A ticket the console really created, as xgd named it. */
export interface FiledTicket {
  id: string
  uid: string
  title: string
}

/**
 * What the round cost and what ran it ([[REQ-261]] behavior 6).
 *
 * READ OFF THE STREAM, NOT GUESSED. The `system` init event names the model the
 * CLI actually chose — which matters because `REPRO_CONSOLE_AI_MODEL` is
 * optional, so with it unset the round runs on whatever the CLI defaults to that
 * week — and the `result` event carries the cost and the usage. Both were being
 * discarded. This loop is meant to run many times and its per-round cost is what
 * decides how many, so it is recorded beside the outcome and answerable from the
 * artifacts rather than from impression.
 */
export interface RoundCost {
  model?: string
  costUsd?: number
  durationMs?: number
  turns?: number
  inputTokens?: number
  outputTokens?: number
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
  ticket?: TicketDraft
  /**
   * Bugs found on the way to the diagnosis ([[REQ-261]] behavior 2).
   *
   * Independent of `status`: a round that found no engine gap at all may still
   * have tripped over a defect in L1 or in its own instructions, and the whole
   * point of this list is that such a finding no longer has to be folded into a
   * gap ticket it does not belong in — or dropped.
   */
  bugs?: TicketDraft[]
  /** Present on `appended`: the markdown to add to the class's existing ticket. */
  evidence?: string
  /** Filled in by the console once it has filed or appended. */
  ticketId?: string
  ticketUid?: string
  /** What the console made of {@link bugs} — one entry per bug it really filed. */
  bugTickets?: FiledTicket[]
  summary?: string
  /** Why a `stopped` or `failed` round did not file. */
  reason?: string
  /** Behaviours 3 and 4's falsifiers, filled in by the console after the round. */
  violations?: string[]
  /** The status the filed ticket actually carries, read back (behavior 4). */
  ticketStatus?: string
  /** The model, the cost and the shape of the round ([[REQ-261]] behavior 6). */
  cost?: RoundCost
  /** The CLI session this round ran in — what the next round on this site resumes. */
  sessionId?: string
  /** The tool list the session reported, checked rather than trusted (behavior 8). */
  tools?: string[]
  /** Set when this outcome was read back off a finished round's artifacts (behavior 5). */
  recovered?: boolean
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
  /**
   * The derived facts the console computed while writing the evidence
   * ([[REQ-261]] behavior 7). An ADDITION to the files below, never a
   * replacement for them — the prompt says so, because the one rule is that a
   * claim comes from the captured file and a digest is a console's arithmetic.
   */
  digestFile?: string
  gate: GateSummary | null
  rail: RailRoundResult
  /** The classes that already have tickets (behavior 6). */
  knownGaps: GapEntry[]
  /** True when this round resumed the previous round's session (behavior 3). */
  resumed?: boolean
}

/**
 * What a resumed round is told INSTEAD of the brief ([[REQ-261]] behavior 3).
 *
 * The brief is already in the resumed session, so restating it would grow the
 * context by its own length every iteration — which is half of what makes a long
 * resume chain dangerous. The other half is what this text exists to say out
 * loud: a resumed round remembers a page that has since been refolded, so its
 * memory is a pointer and never a source. That is the brief's one rule
 * (transcribe, do not reconstruct) turned against the mechanism that would
 * otherwise quietly break it.
 */
export function resumePreamble(previousRounds: number): string {
  return `# You are being resumed

This is round ${previousRounds + 1} on this reproduction, and you are continuing the
session that ran ${previousRounds === 1 ? 'the previous round' : `the previous ${previousRounds} rounds`}.

**The standing brief you were given at the start of this chain still binds you in
full.** It is not restated here — re-read it in your own context if you need it.

**What you remember is a pointer, never evidence.** The engine has changed
underneath you: this iteration refolded the same reference through whatever
landed since, so every number you remember may now be wrong. Your memory is good
for knowing WHERE to look and what you already ruled out. It is not good for
anything you are about to assert. Every claim in this round's ticket must be read
out of THIS iteration's files, listed below — and anything you cannot re-read
this round, you cannot state this round.

Say plainly in your summary what you carried forward and what you re-read.`
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
${
    ctx.digestFile
      ? `- \`${ctx.digestFile}\` — **derived facts, computed by the console from the four files above.** Asset attribution, the key census of the reference manifest, every value delta and every ranked region, already counted. It is a shortcut to the questions rounds keep spending reads on; it is NOT a source. Anything you quote in a ticket, quote from the file it came from.\n`
      : ''
}
The engine you are diagnosing is \`tools/generate/src/\` — the fold, the capture, the L1 substrate, the probes.

## The regression rail

${ctx.rail.summary}

## Classes that already have a ticket

If your diagnosis is one of these, **append to that ticket** and report \`"status": "appended"\` naming it. Do not file a second one.

${gaps}

---

## What you hand back

**One gap ticket, and it is not bounded.** If you found five related residuals, the ticket describes five. Do not defer a finding to "a later round": a later round starts from your absence and will never know you saw it. Deferring is losing.

**Anything else you tripped over goes back as a bug.** A defect in L1, in your own brief, in this console, anywhere in \`1c\` that is not a gap in the reproduction engine — hand it back in \`bugs\`, to the same standard of evidence, and the console files each one separately at \`draft\`. That list is independent of your status: a round that found no engine gap may still have found a bug.

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
 * The policy, checked against what the session actually reported (behavior 8).
 *
 * {@link AI_DISALLOWED_TOOLS} is enumerated, and its own note says the list "can
 * go stale as the CLI grows tools" — an accepted cost, because the alternative is
 * an allow list that was measured not to gate. What makes the staleness visible
 * rather than silent is this: the `system` init event reports the tool list the
 * session really has, and anything in it that the policy did not allow is named
 * on the page. A round that gains resume and a wider filing surface makes that
 * check worth more, not less.
 *
 * One line, not one per tool: the finding is "the session is wider than the
 * policy", and the names are the evidence for it.
 */
export function toolPolicyViolations(reported: readonly string[] | undefined): string[] {
  if (!reported?.length) return []
  const unexpected = reported.filter((tool) => !AI_ALLOWED_TOOLS.includes(tool.split('(')[0]))
  if (!unexpected.length) return []
  return [
    `the session reported ${unexpected.length} tool(s) the policy did not allow: ${unexpected.join(', ')}` +
      ' — check whether any of them can act, and name it in AI_DISALLOWED_TOOLS if so.',
  ]
}

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

/** Everything about one invocation that is not fixed by the policy. */
export interface AiCommandOptions {
  /** Continue this CLI session rather than starting a new one (behavior 3). */
  resume?: string
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
export function claudeCommand(env: NodeJS.ProcessEnv = process.env, opts: AiCommandOptions = {}): AiCommand {
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
      /**
       * RESUME IS A FLAG, NOT A SECOND MODE ([[REQ-261]] behavior 3).
       *
       * Everything above it — the permission mode, the empty settings sources,
       * both tool lists — is identical on a resumed round, so behavior 3 is the
       * same property on iteration 7 as on iteration 1. A resumed round inherits
       * nothing from its predecessor except the conversation.
       */
      ...(opts.resume ? ['--resume', opts.resume] : []),
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
    /**
     * ONLY `init` IS A SESSION STARTING ([[REQ-261]] behavior 4).
     *
     * Every `system` event used to print `— session started`, and the observed
     * round printed that line 74 times in a 175-line transcript because the CLI
     * emits `system` for its own bookkeeping too. A bookkeeping event is worth
     * one line naming what it was — a compaction boundary matters to a resumed
     * round — and is worth nothing at all when it names nothing.
     */
    if (event.subtype !== undefined && event.subtype !== 'init') {
      return typeof event.subtype === 'string' ? [`— ${event.subtype}`] : []
    }
    if (event.subtype === undefined && typeof event.model !== 'string') return []
    return [`— session started${modelOf(event) ? ` (${modelOf(event)})` : ''}`]
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
    /**
     * THE RESULT IS NOT REPRINTED ([[REQ-261]] behavior 4).
     *
     * `result.result` is the assistant's final message, which has already been
     * printed as an `assistant` event — so echoing it put every round's whole
     * diagnosis in the transcript twice, half of the observed round's 22KB. What
     * this event uniquely knows is what the round COST (behavior 6), so that is
     * what its one line says.
     */
    return [`— round finished${describeCost(readCost(event)) ? ` · ${describeCost(readCost(event))}` : ''}`]
  }
  return []
}

/** The model an init event names, wherever that CLI version puts it. */
function modelOf(event: Record<string, unknown>): string {
  if (typeof event.model === 'string') return event.model
  const info = event.modelInfo as { id?: unknown; name?: unknown } | undefined
  if (typeof info?.name === 'string') return info.name
  return typeof info?.id === 'string' ? info.id : ''
}

/** The cost and shape of a round, out of its `result` event (behavior 6). */
export function readCost(event: Record<string, unknown>): RoundCost {
  const usage = (event.usage ?? {}) as Record<string, unknown>
  const num = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) ? value : undefined)
  return {
    costUsd: num(event.total_cost_usd) ?? num(event.cost_usd),
    durationMs: num(event.duration_ms),
    turns: num(event.num_turns),
    inputTokens: num(usage.input_tokens),
    outputTokens: num(usage.output_tokens),
  }
}

/**
 * The round's cost as one line, for the transcript and for the page.
 *
 * Empty when nothing is known rather than a row of dashes: a console that
 * printed `$— · —` would be claiming to have measured something it did not.
 */
export function describeCost(cost: RoundCost | undefined): string {
  if (!cost) return ''
  const parts: string[] = []
  if (cost.model) parts.push(cost.model)
  if (cost.costUsd !== undefined) parts.push(`$${cost.costUsd.toFixed(2)}`)
  if (cost.durationMs !== undefined) parts.push(formatDuration(cost.durationMs))
  if (cost.turns !== undefined) parts.push(`${cost.turns} turn${cost.turns === 1 ? '' : 's'}`)
  if (cost.inputTokens !== undefined || cost.outputTokens !== undefined) {
    parts.push(`${thousands(cost.inputTokens)}→${thousands(cost.outputTokens)} tok`)
  }
  return parts.join(' · ')
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000)
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`
}

function thousands(value: number | undefined): string {
  if (value === undefined) return '?'
  return value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value)
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
 * Every balanced JSON object in a text, latest first ([[REQ-261]] behavior 1).
 *
 * THE PARSE MUST NOT DEPEND ON FENCE DISCIPLINE. It used to: the outcome block
 * was found with a lazy ```…``` regex, and a gap ticket that quotes
 * `gate.json` inside its own body — exactly what the brief demands — carries
 * those fences as literal characters inside a JSON string. The lazy match
 * stopped at the first of them, and the first live round's 7,500-character
 * answer was truncated at 1,130 and thrown away. The better the ticket, the more
 * certainly that fired.
 *
 * So the scan is for BRACES and it is string-aware: a `{`, `}` or a fence inside
 * a JSON string is data, and only an escape-aware walk can tell the difference.
 *
 * FROM THE END, AND WITHOUT SKIPPING. Every `{` is tried as a start, in reverse,
 * so a stray brace in the round's prose can neither swallow the real block nor
 * hide it: a start that does not parse is simply not a candidate. The nested
 * objects inside the answer (`ticket`, each `bugs` entry) are reached first and
 * rejected for carrying no `status`, which is what makes the outermost one win.
 */
export function* jsonObjectsFromEnd(text: string): Generator<unknown> {
  const starts: number[] = []
  for (let i = 0; i < text.length; i += 1) if (text[i] === '{') starts.push(i)
  for (let i = starts.length - 1; i >= 0; i -= 1) {
    const end = balancedEnd(text, starts[i])
    if (end === -1) continue
    try {
      yield JSON.parse(text.slice(starts[i], end + 1))
    } catch {
      // Not JSON from here. A `{` in prose, or one inside a string this scan
      // started in the middle of — either way, not the round's answer.
    }
  }
}

/** The index of the `}` closing the object that opens at `start`, or -1. */
function balancedEnd(text: string, start: number): number {
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

/**
 * The JSON block the round finishes with (requirement 20).
 *
 * The LAST parseable object carrying a `status` wins: a round that shows an
 * example of the shape before filling it in — which they do — must not have its
 * example read as its answer.
 *
 * A claim that does not carry what its status requires is a FAILED round, not a
 * partly-honoured one. `filed` without a ticket body would file an empty
 * ticket; `appended` without evidence would append nothing. Either is worse
 * than saying the round did not produce an answer.
 */
export function parseOutcome(finalText: string): AiOutcome {
  for (const parsed of jsonObjectsFromEnd(finalText)) {
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) continue
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
      // Carried on EVERY status ([[REQ-261]] behavior 2). A round that found no
      // engine gap may still have tripped over a defect in L1 or in its own
      // brief, and the bugs list is the only shape it has to report one in.
      ...(readTicketDrafts(outcome.bugs).length ? { bugs: readTicketDrafts(outcome.bugs) } : {}),
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

/**
 * The bug drafts a round handed back, dropping any that is not a ticket.
 *
 * DROPPED, NOT FAILED — unlike the gap ticket. A malformed gap draft fails the
 * round because the gap IS the deliverable and an empty one would be filed in
 * its place. A malformed bug is an aside: losing it costs one aside, and failing
 * the whole round over it would throw away the diagnosis as well.
 */
function readTicketDrafts(value: unknown): TicketDraft[] {
  if (!Array.isArray(value)) return []
  return value.map(readTicketDraft).filter((draft): draft is TicketDraft => draft !== undefined)
}

/** A ticket draft, or nothing — a half-filled one is not a ticket. */
function readTicketDraft(value: unknown): TicketDraft | undefined {
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
  /**
   * The session a previous round on this reproduction left ([[REQ-261]] b3).
   *
   * Absent on the first round of a chain, and on any round whose chain was
   * reset — see `session.ts`, which owns when that happens and why.
   */
  resume?: string
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
  /**
   * A RESUME THAT WILL NOT START IS NOT A FAILED ROUND ([[REQ-261]] b3).
   *
   * The session id is the console's memory of something the CLI owns and prunes.
   * When the conversation it names has gone, the round must not die with it — so
   * a resumed attempt that produced nothing is retried once from scratch, and
   * the transcript says so rather than leaving an unexplained empty round.
   */
  const runner: AiRunner = async (opts) => {
    const first = await attempt(env, opts, opts.resume)
    // RETRIED ONLY WHEN THE SESSION NEVER STARTED. `sessionId` comes from the
    // init event, so its absence means the CLI refused before the round began —
    // which is the one failure a fresh session fixes. A round that ran and then
    // failed to produce a usable answer is NOT retried: that would pay for the
    // same round twice, and behavior 5 recovers it from its transcript for free.
    if (!opts.resume || first.status !== 'failed' || first.sessionId !== undefined) return first
    opts.onLine(`— could not resume ${opts.resume}; starting a fresh session`)
    return attempt(env, opts, undefined)
  }
  return runner
}

/** One `claude -p` process, resumed or not. */
function attempt(env: NodeJS.ProcessEnv, opts: AiRunOptions, resume: string | undefined): Promise<AiOutcome> {
  return new Promise<AiOutcome>((resolve) => {
    const { command, args } = claudeCommand(env, { resume })
    const child = spawn(command, args, { cwd: opts.cwd, stdio: ['pipe', 'pipe', 'pipe'] })
    let pending = ''
    let finalText = ''
    let stderr = ''
    // Read off the stream rather than guessed at (behavior 6 and behavior 8):
    // what the CLI chose, what the round cost, and what it could actually do.
    let cost: RoundCost = {}
    let sessionId: string | undefined
    let tools: string[] | undefined

    const consume = (chunk: string, flush = false): void => {
      pending += chunk
      const lines = pending.split('\n')
      pending = flush ? '' : (lines.pop() ?? '')
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const event = JSON.parse(line) as Record<string, unknown>
          if (event.type === 'result') {
            if (typeof event.result === 'string') finalText = event.result
            cost = { ...readCost(event), model: cost.model }
          }
          if (event.type === 'system' && event.subtype === 'init') {
            if (typeof event.session_id === 'string') sessionId = event.session_id
            if (typeof event.model === 'string') cost.model = event.model
            if (Array.isArray(event.tools)) tools = event.tools.filter((t): t is string => typeof t === 'string')
          }
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
      const observed = { cost, ...(sessionId ? { sessionId } : {}), ...(tools ? { tools } : {}) }
      if (!finalText.trim()) {
        const why = stderr.trim().split('\n').filter((l) => /\w/.test(l)).slice(-3).join('\n')
        resolve({ status: 'failed', reason: why || 'the round produced no final message.', ...observed })
        return
      }
      resolve({ ...parseOutcome(finalText), ...observed })
    })

    child.stdin.write(opts.prompt)
    child.stdin.end()
  })
}
