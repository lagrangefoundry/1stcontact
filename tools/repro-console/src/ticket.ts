/**
 * What the console still does about tickets ([[REQ-262]] D10).
 *
 * IT NO LONGER CREATES ANY. [[REQ-256]] behaviour 4 had the console file on the
 * round's behalf, for one stated reason — the round could not run a command.
 * D7 gave it `Bash` and D10 gave it the job, so `xgd ticket create` happens in
 * the round. `fileTicket`, `appendGapEvidence` and `parseTicketRef` went with
 * that change: a relay with nothing on the far end is worse than no relay,
 * because it looks like it is doing something.
 *
 * What remains is the checking. `status: draft` used to be structural — the
 * console wrote it — and is now an instruction the round is expected to keep,
 * so the console reads every ticket back (`console.ts`'s `confirm`) and watches
 * for anything reaching a dispatcher-trigger status while a round is running.
 */
import { parseJsonOutput, type CommandRunner } from './run'

/** The status every ticket a round creates is expected to carry, and the only one. */
export const TICKET_STATUS = 'draft'

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

/** The last few informative lines a refusal left behind. */
function lastWords(output: string, lines = 3): string {
  const informative = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /\w/.test(line))
  return informative.length ? informative.slice(-lines).join(' · ') : 'no output'
}
