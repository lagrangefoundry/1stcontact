/**
 * Where a round's re-measurement of a known class is allowed to land
 * ([[BUG-140]]).
 *
 * THE DEFECT THIS EXISTS FOR IS A PERMANENCE MISMATCH. `gap-tickets.json` is a
 * permanent registry — every class ever recorded is rendered into every later
 * prompt as *append to that ticket, do not file a second one*. The body it
 * points at is not permanently writable: `xgd` freezes `body`/`title` on every
 * status outside {@link APPENDABLE_STATUSES}, so a class ticket accepts an
 * append for a short window and refuses one forever afterwards. Five rounds ran
 * against five class tickets that were all at `ready_to_reconcile`, and every
 * one of the five would have been refused.
 *
 * So the instruction cannot be a constant. It is a function of the ticket's
 * status at the moment the prompt is built, and this module is that function.
 */

/** Which of the three routes a class's re-measurement takes this round. */
export type AppendRoute = 'append' | 'comment' | 'new-ticket'

/**
 * The statuses whose body `xgd` will still let anybody write.
 *
 * Taken from `ticket_types.yaml`'s `immutable` rules rather than guessed: the
 * four rules between them freeze `[body, title]` on the reconcile pipeline, the
 * develop pipeline, the terminal statuses and `error`, and what is left over is
 * exactly this set — the pre-dispatch iteration states.
 */
export const APPENDABLE_STATUSES: readonly string[] = ['draft', 'free_coding', 'free_coded', 'failed']

/**
 * The statuses that mean the class was DISPOSED OF, one way or the other.
 *
 * Landed (`free_and_reconciled`, `merged`, `implemented`, `fixed`,
 * `legacy_done`) or refused (`abandoned`, `wont_fix`, `deprecated`) — the
 * distinction does not change the route, because either way the ticket is a
 * closed account and a round meeting the class again has found something
 * neither of those outcomes predicted. That is news, and news is a ticket.
 *
 * Both type vocabularies are here at once. `request` reaches `implemented` and
 * `bug` reaches `fixed`; the registry does not record which type a class's
 * ticket is, and a status that cannot occur for a given type costs nothing.
 */
export const SETTLED_STATUSES: readonly string[] = [
  'free_and_reconciled',
  'merged',
  'implemented',
  'fixed',
  'legacy_done',
  'abandoned',
  'wont_fix',
  'deprecated',
]

/**
 * The route that follows from a status, and the whole of the routing rule.
 *
 * AN UNREADABLE STATUS ROUTES TO THE COMMENT, and that is the deliberate
 * default rather than an oversight. A comment is the one route `xgd` never
 * refuses: it is legal on a draft, legal on a frozen ticket and legal on a
 * closed one. So an empty status — a ticket the console could not read, or a
 * registry entry written before this existed — costs a comment where a body
 * append would have been slightly tidier, and never costs the finding.
 */
export function routeForStatus(status: string): AppendRoute {
  if (APPENDABLE_STATUSES.includes(status)) return 'append'
  if (SETTLED_STATUSES.includes(status)) return 'new-ticket'
  return 'comment'
}

/** The status a class ticket is settled at, if it is settled. */
export function isSettled(status: string): boolean {
  return SETTLED_STATUSES.includes(status)
}

/**
 * What the round must do on this route, in the prompt's own words.
 *
 * ONE DEFINITION SITE FOR THE THREE SENTENCES. They are read by the round out
 * of the prompt and asserted by this ticket's UATs, and a second copy in the
 * test would let the two drift into agreeing about a sentence the round is
 * never shown.
 */
export function routeInstruction(route: AppendRoute): string {
  switch (route) {
    case 'append':
      return (
        '**append to that ticket** with `xgd ticket append <id> --file <f>` — its body is still writable — ' +
        'and report `"status": "appended"` naming it. Do not file a second one.'
      )
    case 'comment':
      return (
        "**the comment is the append**: this ticket's body is frozen, so add " +
        '`xgd ticket add-comment <id> --kind note --body-file <f>` with your round marker as its first line, ' +
        'and report `"status": "appended"` naming the ticket. Do not file a second one.'
      )
    case 'new-ticket':
      return (
        '**file a new ticket**: this class was disposed of, so meeting it again is news rather than an append. ' +
        'Cite the old id in the body, say what is different now, and report `"status": "filed"` naming the new one.'
      )
  }
}

/** How a class ticket's live status reads in the prompt when it could not be read. */
export const UNREADABLE_STATUS = 'unreadable'

/**
 * The marker a round writes so its identity survives on a route that has no
 * `--created-by`.
 *
 * `xgd ticket create --created-by` exists; `xgd ticket add-comment` has no such
 * flag, and a `--fields '{"created_by":…}'` is funnelled into `fields.payload`
 * by `comment_create` while the comment's own frontmatter still says `xgd`. So
 * on the comment route the marker is prose, written into the comment's first
 * line, and this is the string both the brief asks for and the console looks
 * for.
 */
export function roundMarker(prefix: string, slug: string, n: number): string {
  return `${prefix}:${slug}#${n}`
}
