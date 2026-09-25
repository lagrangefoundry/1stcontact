/**
 * The gap classes this loop has already filed a ticket for (REQ-256 behavior 6,
 * requirement 21).
 *
 * ONE TICKET PER GAP CLASS, NOT PER ITERATION. A later round that diagnoses a
 * class already filed must append its evidence to that ticket rather than open
 * a second one — FREE-CODING.md's proliferation rule, which exists because two
 * tickets for one intent leave the reconciler reasoning about overlapping
 * ownership.
 *
 * WHY THE CONSOLE KEEPS THIS AND NOT XGD. Asking xgd "which open tickets came
 * out of this loop" would need a label convention invented here and honoured by
 * every AI round — a convention nobody checks, which is the shape this project
 * rejects everywhere else. The registry is the console's own memory of what it
 * has filed, it lives beside the iterations it came from, and it is what the
 * next round's prompt carries.
 *
 * It is scratch, and deliberately so: it records what THIS console filed, and a
 * ticket's own life after filing belongs to xgd.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/** One gap class, and the ticket that carries it. */
export interface GapEntry {
  /** The kind of gap — hyphenated, stable, and not the symptom on one site. */
  residualClass: string
  /** Human-readable ticket id, e.g. `BUG-93`. */
  ticketId: string
  /** The uid xgd names it by, e.g. `bug-1a2b3c4d`. */
  ticketUid: string
  /** One line, so the next round's prompt can say what the class already covers. */
  summary: string
  /** Which stored references have exhibited it. */
  references: string[]
  /** Which rounds found it, as `<slug>#<n>`. */
  iterations: string[]
  /**
   * Where the defect sits, off the ticket itself ([[REQ-276]]).
   *
   * UNIONED ACROSS ROUNDS, like the references and the iterations above it. A
   * later round appending to a class can discover that what looked like a fold
   * bug also cannot be authored in L1; dropping that because the class already
   * had an entry would lose exactly the finding worth keeping.
   *
   * Optional because a registry written before this existed is still a valid
   * registry — an absent list reads as "nobody recorded it", which is true.
   */
  defectClasses?: string[]
  /**
   * The ids this class used to be carried by, oldest first ([[BUG-140]]).
   *
   * A CLASS CAN OUTLIVE ITS TICKET. When the recorded ticket reaches a settled
   * status the class is disposed of, and a round that meets it again is told to
   * file a new one rather than to append to a closed account. The registry then
   * succeeds the class to the new id — and keeps the old one here, because a
   * class whose history is "this was filed, fixed, and came back" is a stronger
   * fact than either id alone, and dropping the predecessor would throw exactly
   * that away.
   *
   * Optional because a registry written before this existed is still a valid
   * registry: an absent list reads as "this class has only ever had one ticket".
   */
  priorTicketIds?: string[]
}

/** The registry file, inside the console's own workspace. */
export function gapsFile(workspace: string): string {
  return path.join(workspace, 'gap-tickets.json')
}

/**
 * The classes already filed, or none.
 *
 * An unreadable registry is treated as empty rather than as a reason to refuse
 * the round: the cost of losing it is one duplicate ticket a human can merge,
 * and the cost of refusing is a round that cannot run at all.
 */
export function readGaps(workspace: string): GapEntry[] {
  const file = gapsFile(workspace)
  if (!existsSync(file)) return []
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is GapEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as GapEntry).residualClass === 'string' &&
        typeof (entry as GapEntry).ticketId === 'string',
    )
  } catch {
    return []
  }
}

/**
 * Record what a round filed, merging into the class if it already exists.
 *
 * MERGING IS THE POINT. An `appended` round names a class that is already here,
 * and what it contributes is a new reference and a new iteration — the evidence
 * that the class recurs, which is exactly the frequency signal [[EPIC-12]] §7.3
 * wanted out of loop 2 and gets here for free.
 */
export function recordGap(
  workspace: string,
  entry: Omit<GapEntry, 'references' | 'iterations'> & {
    reference: string
    iteration: string
    /**
     * The recorded ticket was settled, so this id SUCCEEDS it ([[BUG-140]]).
     *
     * Set by the console only when the class's ticket was read back at a
     * settled status — which is the one case where a second id for one class is
     * the round doing as it was told rather than the proliferation the
     * no-overwrite rule below exists to catch.
     */
    supersedes?: boolean
  },
): GapEntry[] {
  const gaps = readGaps(workspace)
  const existing = gaps.find((gap) => gap.residualClass === entry.residualClass)
  if (existing) {
    if (!existing.references.includes(entry.reference)) existing.references.push(entry.reference)
    if (!existing.iterations.includes(entry.iteration)) existing.iterations.push(entry.iteration)
    existing.defectClasses ??= []
    for (const cls of entry.defectClasses ?? []) {
      if (!existing.defectClasses.includes(cls)) existing.defectClasses.push(cls)
    }
    // The ticket a round appended to wins over a blank, but never over a
    // different ticket already recorded: a class has one ticket by definition,
    // and a second id arriving is a fact for a human rather than a merge.
    if (!existing.ticketId && entry.ticketId) {
      existing.ticketId = entry.ticketId
      existing.ticketUid = entry.ticketUid
    } else if (entry.supersedes && entry.ticketId && entry.ticketId !== existing.ticketId) {
      // SUCCESSION, WHICH IS THE ONE EXCEPTION ([[BUG-140]]). The predecessor
      // is settled, so this is not two live tickets for one class — it is the
      // class outliving the ticket that was supposed to close it. The old id
      // moves down rather than out.
      existing.priorTicketIds ??= []
      if (!existing.priorTicketIds.includes(existing.ticketId)) existing.priorTicketIds.push(existing.ticketId)
      existing.ticketId = entry.ticketId
      existing.ticketUid = entry.ticketUid
      // The new ticket describes what the class looks like NOW, so its summary
      // replaces the settled one's rather than being discarded beside it.
      if (entry.summary) existing.summary = entry.summary
    }
  } else {
    gaps.push({
      residualClass: entry.residualClass,
      ticketId: entry.ticketId,
      ticketUid: entry.ticketUid,
      summary: entry.summary,
      references: [entry.reference],
      iterations: [entry.iteration],
      defectClasses: [...(entry.defectClasses ?? [])],
    })
  }
  mkdirSync(workspace, { recursive: true })
  writeFileSync(gapsFile(workspace), JSON.stringify(gaps, null, 2))
  return gaps
}

/** The ticket a class already has, if any. */
export function gapForClass(gaps: GapEntry[], residualClass: string): GapEntry | undefined {
  return gaps.find((gap) => gap.residualClass === residualClass)
}
