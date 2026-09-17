/**
 * Filing the gap ticket a round handed back (REQ-256 behavior 4).
 *
 * THE CONSOLE FILES IT, NOT THE ROUND. The round has no tool that can run a
 * command — see `AI_DISALLOWED_TOOLS` and the measurement recorded beside it —
 * so what it produces is the ticket's CONTENT and this is what turns that into
 * a ticket. Two consequences worth stating, because they are the point rather
 * than a side effect:
 *
 *  - **`status: draft` is written here**, so behavior 4's "never at any
 *    `ready_*` status" is structural. A `ready_*` status is a dispatcher
 *    trigger — it spawns an autonomous pipeline against the ticket within about
 *    thirty seconds — and there is now no status for a round to get wrong.
 *  - **One ticket per gap class** (behavior 6) is enforced by the console too:
 *    a round that names a class already in the registry appends to that class's
 *    ticket, and the append is an `xgd ticket update --append-body-file`
 *    against the uid the registry holds.
 */
import { writeFileSync } from 'node:fs'
import { parseJsonOutput, type CommandRunner } from './run'
import type { TicketDraft } from './ai'

/**
 * The status every ticket this console creates is created at, and the only one.
 *
 * Gap tickets and the bugs a round trips over on the way ([[REQ-261]] behavior
 * 2) are filed through the same call for exactly this reason: one place writes
 * the status, so widening WHAT a round may report never widens what it may
 * trigger. A `ready_*` status is a dispatcher trigger.
 */
export const TICKET_STATUS = 'draft'

/** What xgd calls the ticket it just wrote. */
export interface TicketRef {
  id: string
  uid: string
}

/**
 * Read the ticket xgd says it created.
 *
 * `--json` prints `{uid, id, type, title}`, but the CLI also prints its own log
 * lines around it, so the document is looked for INSIDE the output rather than
 * parsed from the whole of it. The prose form is the fallback, because a
 * version of xgd that printed only that would otherwise lose the ticket it had
 * just successfully created — the one failure here that cannot be retried
 * safely, since retrying files a second ticket.
 */
export function parseTicketRef(stdout: string): TicketRef | null {
  const uid = /"uid"\s*:\s*"([^"]+)"/.exec(stdout)?.[1]
  const id = /"id"\s*:\s*"([^"]+)"/.exec(stdout)?.[1]
  if (uid && id) return { id, uid }
  const prose = /Created\s+\w+:\s+(\S+)\s+\(([^)]+)\)/.exec(stdout)
  return prose ? { id: prose[1], uid: prose[2] } : null
}

export interface FileTicketOptions {
  cwd: string
  run: CommandRunner
  draft: TicketDraft
  /** Where the body is written before `--body-file` is pointed at it. */
  bodyFile: string
}

/**
 * Create the ticket, at `draft`, and report what xgd called it.
 *
 * The body goes through a FILE rather than `--body`. A gap ticket's body is
 * multi-line markdown quoting values out of `values-diff.json`, and passing
 * that as one argument makes its correctness a question about argument length
 * and quoting rather than about what the round found.
 */
export async function fileTicket(opts: FileTicketOptions): Promise<TicketRef | string> {
  writeFileSync(opts.bodyFile, opts.draft.body)
  const result = await opts.run(
    'xgd',
    [
      'ticket',
      'create',
      '--type',
      opts.draft.type,
      '--title',
      opts.draft.title,
      '--fields',
      JSON.stringify({ status: TICKET_STATUS }),
      '--body-file',
      opts.bodyFile,
      '--json',
    ],
    opts.cwd,
  )
  if (result.code !== 0) return `xgd refused to create the ticket: ${lastWords(result.stderr || result.stdout)}`
  const ref = parseTicketRef(result.stdout)
  return ref ?? `xgd created a ticket but did not say which: ${lastWords(result.stdout)}`
}

export interface AppendEvidenceOptions {
  cwd: string
  run: CommandRunner
  /** The ticket the class already has. */
  uid: string
  evidence: string
  evidenceFile: string
}

/** Append this round's evidence to the class's existing ticket (behavior 6). */
export async function appendGapEvidence(opts: AppendEvidenceOptions): Promise<string | null> {
  writeFileSync(opts.evidenceFile, `\n${opts.evidence.trim()}\n`)
  const result = await opts.run(
    'xgd',
    ['ticket', 'update', opts.uid, '--append-body-file', opts.evidenceFile],
    opts.cwd,
  )
  return result.code === 0 ? null : `xgd refused to append to ${opts.uid}: ${lastWords(result.stderr || result.stdout)}`
}

/** The last few informative lines a refusal left behind. */
function lastWords(output: string, lines = 3): string {
  const informative = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /\w/.test(line))
  return informative.length ? informative.slice(-lines).join(' · ') : 'no output'
}

// ── the `ready_*` assertion ([[REQ-262]] requirement 11) ─────────────────────

/**
 * The statuses that are dispatcher TRIGGERS rather than descriptions.
 *
 * A ticket moved to one of these spawns an autonomous pipeline against it
 * within about thirty seconds. That is the whole reason this file has an
 * assertion in it at all.
 */
export const READY_STATUSES: readonly string[] = [
  'ready_to_implement',
  'ready_to_reconcile',
  'ready_to_reimplement',
  'ready_frontier',
]

/** A ticket sitting at a trigger status, as the report names it. */
export interface ReadyTicket {
  uid: string
  id: string
  status: string
}

/**
 * WHY THIS EXISTS NOW AND DID NOT BEFORE.
 *
 * [[REQ-256]] made "the round never files at a `ready_*` status" STRUCTURAL: the
 * round had no shell, so it could not run `xgd`, so the console wrote every
 * status and there was none for a round to get wrong. [[REQ-262]] D7 grants
 * `Bash` — measured to be ungrantable narrowly — and that structural guarantee
 * becomes an instruction in the brief instead.
 *
 * An instruction is not nothing, but it is not a property either, and the
 * failure it guards against is the one mistake in this loop that spends real
 * money while nobody is watching. So it is CHECKED rather than trusted.
 *
 * A CHECK THAT REPORTS, NEVER ONE THAT PROMPTS. The console runs unattended by
 * design; an operator who has to answer a question mid-round is an operator
 * babysitting a loop built so they would not have to. What this produces is a
 * line in the round's violations, which is already how the page says a round
 * misbehaved.
 *
 * MEASURED BY DIFFERENCE, NOT BY AUTHORSHIP. The ticket store does not record
 * which process moved a status, so this compares before with after: any ticket
 * at a trigger status now that was not at one when the round started. That
 * catches a ticket the round CREATED at `ready_*` and a ticket it PROMOTED,
 * which are the same hazard wearing different clothes. It also means an
 * operator promoting a ticket in another window during a round shows up here —
 * a false positive that costs one line of report and is strictly the safer way
 * to be wrong.
 */
export async function readyStatusSnapshot(cwd: string, run: CommandRunner): Promise<Map<string, ReadyTicket>> {
  const args = ['ticket', 'list', '--json', '--no-limit']
  for (const status of READY_STATUSES) args.push('--status', status)
  const result = await run('xgd', args, cwd)
  if (result.code !== 0) throw new Error(`xgd refused to list ready tickets: ${lastWords(result.stderr || result.stdout)}`)
  const parsed = parseJsonOutput<{ items?: Array<{ uid?: string; id?: string; status?: string }> }>(
    result.stdout,
    'xgd ticket list --status',
  )
  const snapshot = new Map<string, ReadyTicket>()
  for (const item of parsed.items ?? []) {
    if (!item.uid) continue
    snapshot.set(item.uid, { uid: item.uid, id: item.id ?? item.uid, status: item.status ?? '' })
  }
  return snapshot
}

/**
 * What arrived at a trigger status during the round.
 *
 * Returns the violation lines the round's report carries — empty when the round
 * behaved, which is the ordinary case and says nothing.
 */
export function readyStatusViolations(
  before: Map<string, ReadyTicket>,
  after: Map<string, ReadyTicket>,
): string[] {
  const lines: string[] = []
  for (const [uid, ticket] of after) {
    if (before.has(uid)) continue
    lines.push(
      `a ticket reached a dispatcher-trigger status during this round: ${ticket.id} (\`${uid}\`) is at ` +
        `\`${ticket.status}\`. The round files through the console at \`draft\` and must never set a ` +
        `\`ready_*\` status — see REQ-256 behaviour 4.`,
    )
  }
  return lines
}
