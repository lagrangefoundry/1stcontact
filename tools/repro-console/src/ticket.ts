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

// ── the provenance assertion ([[BUG-104]]) ───────────────────────────────────

/**
 * The marker every ticket a round files carries in `created_by`.
 *
 * WHY THERE IS A MARKER AT ALL. `xgd ticket create` with no `--created-by`
 * resolves the identity itself, and for a round the resolution falls all the way
 * through to `git config user.email` — the operator's. So every ticket any round
 * has filed reads as though a human wrote it, and nothing in the store separates
 * an unattended machine diagnosis from the operator's own words. That is the one
 * place this loop's authority is invisible, and it is invisible in the direction
 * that matters.
 *
 * The brief (§6) asks for `repro-console:<slug>#<iteration>`, which is strictly
 * more useful in a ticket list than the bare marker and costs the round nothing
 * — it is handed both in its own prompt.
 */
export const ROUND_CREATED_BY = 'repro-console'

/**
 * Was this ticket filed by a round?
 *
 * A PREFIX, NOT THE EXACT RUN. The console knows this round's slug and
 * iteration and could demand the literal string back — and deliberately does
 * not, for two reasons. An APPENDED ticket was filed by some EARLIER round, so
 * its run qualifier is legitimately a different one; demanding this round's
 * would report a violation on a round that did exactly as it was told. And the
 * qualifier is free text an LLM types, so an abbreviated slug would fail an
 * exact match while being no kind of provenance failure. The boundary worth
 * checking is machine-versus-human, and the marker is that boundary exactly.
 *
 * The separator is required so that a `created_by` which merely STARTS with the
 * marker — `repro-console-operator@example.com` — does not pass as one.
 */
export function filedByRound(createdBy: string): boolean {
  return createdBy === ROUND_CREATED_BY || createdBy.startsWith(`${ROUND_CREATED_BY}:`)
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
 * line in the round's report, which is already how the page says a round
 * misbehaved.
 *
 * FOUND BY DIFFERENCE, CHARGED BY ATTRIBUTION ([[BUG-114]]). The snapshot is
 * still how an arrival is FOUND — the store records no process against a status
 * change, so there is no other way to notice one. It is no longer how an
 * arrival is CHARGED: see {@link readyStatusFindings}.
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
 * What arrived at a trigger status while the round was running.
 *
 * The difference between the two snapshots, and nothing else — who moved it is
 * {@link readyStatusFindings}'s question. A ticket that was already at a
 * trigger status before the round started is not an arrival: nothing happened
 * to it here.
 */
export function readyStatusArrivals(
  before: Map<string, ReadyTicket>,
  after: Map<string, ReadyTicket>,
): ReadyTicket[] {
  return [...after.values()].filter((ticket) => !before.has(ticket.uid))
}

/**
 * What ties an arrival to the round that was running when it arrived.
 *
 * `named` holds every ticket the round reported in its own outcome — its gap
 * ticket and the `1c` defects beside it — by BOTH id and uid, because the round
 * reports ids and the snapshot carries uids and neither side should have to
 * know which the other used.
 *
 * `createdBy` holds the provenance of the arrivals the console could read back.
 * An arrival missing from it is one the console could not look at, which is a
 * different fact from one it looked at and found innocent — see
 * {@link readyStatusFindings}.
 */
export interface ReadyAttribution {
  named: ReadonlySet<string>
  createdBy: ReadonlyMap<string, string>
}

/** What the round's report says about the arrivals, split by who is answerable. */
export interface ReadyFindings {
  /** Charged to the round. Empty when it behaved, which is the ordinary case. */
  violations: string[]
  /** Noticed, charged to nobody. Never phrased as a thing the round did. */
  observations: string[]
}

/**
 * Split the arrivals into what the round did and what merely happened.
 *
 * WHY THIS IS NOT THE DIFFERENCE ANY MORE ([[BUG-114]]). The check was written
 * when the console could not tell a round-filed ticket from a human-filed one,
 * so it charged the round with every arrival and accepted the false positives:
 * "a false positive that costs one line of report and is strictly the safer way
 * to be wrong." It was not. It fired on a ticket an operator promoted in
 * another window and accused the round of it in the language of a violation,
 * and a report that cries wolf is one an operator learns to discount — which
 * costs exactly the real report this check exists to deliver.
 *
 * [[BUG-104]] supplied what was missing: a round's ticket now names the round in
 * `created_by`. So an arrival is charged to the round when either the store says
 * the round filed it, or the round itself named it in its outcome — which is the
 * promoting case, where the ticket predates the round and only the round's own
 * words connect the two.
 *
 * WHAT IS DELIBERATELY NOT CAUGHT. A round that promotes a ticket it neither
 * filed nor named is indistinguishable, from here, from an operator doing the
 * same thing. It is reported as an observation. That is the price of not
 * accusing the operator, and the hazard this check was built for — a round
 * filing at `ready_*`, or promoting what it filed — is charged in full.
 */
export function readyStatusFindings(
  arrivals: readonly ReadyTicket[],
  attribution: ReadyAttribution,
): ReadyFindings {
  const findings: ReadyFindings = { violations: [], observations: [] }
  for (const ticket of arrivals) {
    // Read back and found to carry the marker: the store itself says a round
    // made this. Absent from the map means the console could not read it, which
    // is not evidence of anything and must not read as evidence of this.
    const filed = filedByRound(attribution.createdBy.get(ticket.uid) ?? '')
    const named = attribution.named.has(ticket.uid) || attribution.named.has(ticket.id)
    if (filed || named) {
      findings.violations.push(
        `a ticket reached a dispatcher-trigger status during this round: ${ticket.id} (\`${ticket.uid}\`) is at ` +
          `\`${ticket.status}\`. The round files through the console at \`draft\` and must never set a ` +
          `\`ready_*\` status — see REQ-256 behaviour 4. ` +
          (filed
            ? `It is charged to the round because it was filed by one (\`created_by\`).`
            : `It is charged to the round because the round named it in its own outcome.`),
      )
      continue
    }
    findings.observations.push(
      `${ticket.id} (\`${ticket.uid}\`) reached \`${ticket.status}\` while this round was running. ` +
        `Nothing ties it to the round — it carries no round marker and the round did not name it — so it is ` +
        `noted here rather than charged to the round. If nobody promoted it on purpose, it is worth a look.`,
    )
  }
  return findings
}

/** The last few informative lines a refusal left behind. */
function lastWords(output: string, lines = 3): string {
  const informative = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /\w/.test(line))
  return informative.length ? informative.slice(-lines).join(' · ') : 'no output'
}
