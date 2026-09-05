/**
 * The two axes a contact is placed on ([[DOC-44]] §3, [[REQ-188]]).
 *
 * A CONTACT IS THE ENTITY; MEMBER AND LEAD ARE FACTS ABOUT ONE. This module
 * replaces a single three-valued state — Contact / Invited / Member — and both
 * halves of that shape were wrong.
 *
 * *Contact* was being used as a value, and it is the name of the row
 * ([[DOC-44]] §2). Used as a value it means both "every row in this table" and
 * "a row with nothing else true yet", and the second reading is what makes
 * somebody write the query that leaves customers out of the contact list. The
 * initial value on the pipeline is **Lead** ([[DOC-44]] §4, decided 2026-09-05):
 * it commits to slightly more commercial intent than a contact who merely wrote
 * in with a question, which is the argument against it, and it wins on being the
 * word every operator already knows — a stage name is read on a screen far more
 * often than it is reasoned about.
 *
 * AND THE THREE WERE NOT ONE LINE. Membership is an ACCESS fact — can this
 * contact sign in — and invited is a PIPELINE fact — where the relationship
 * stands. They are independent, and all four combinations occur: a member who
 * was never invited (a seeded operator, or anyone admitted by a route that
 * stamps no invite), an invited contact who never came, a member who is also
 * mid-pipeline, and a lead who is neither. A single line cannot hold the first
 * or the last at all, which is why the earlier fix had to be revised rather than
 * extended.
 *
 * SO THE TWO AXES ARE DERIVED DIFFERENTLY, ON PURPOSE. Access reads
 * `termsAcceptedAt`, which is a timestamp that already answers the question
 * exactly; the pipeline reads `pipelineStage`, which is a STORED value and not
 * an inference from which stamps are set ([[DOC-44]] §4). Inferring works for
 * two values and turns every later stage into a new column plus an ordering rule
 * nobody can see, so `invited_at` records WHEN we asked and the stage records
 * WHETHER they are in that state.
 *
 * `termsAcceptedAt` AND NOT `firstSeenAt` IS THE ACCESS MARKER, and the
 * difference is the whole reason this is a module rather than a boolean. `admit`
 * stamps `first_seen_at` on the first request that gets through the door and
 * `guardTerms` runs *after* it, so `first_seen_at` means "reached the
 * interstitial once" and `tos_accepted_at` means "completed sign-up". Only the
 * second is a fact about the person having entered into anything, and only the
 * second is a legal fact worth being able to query.
 *
 * IT IS REPORTED RATHER THAN ENFORCED. Nothing here stops a never-invited row
 * from signing in ([[DOC-42]] §4.1), and no label may imply it does.
 *
 * A MODULE OF ITS OWN, WITH NO IMPORTS, so the one definition is reachable from
 * both sides of the seam: the browser panel that draws the labels, and a test
 * running in workerd against real rows. Two derivations would be two answers
 * free to disagree about who is a member.
 */

/* ── Access: may this contact sign in ────────────────────────────────────── */

/** Signed up — accepted the terms — and may log in. */
export const MEMBER = 'member'
/** Everything else. Not a stage, not a failure: simply not signed up. */
export const NOT_MEMBER = 'not_member'

/** The access axis, in the order the facet offers it. */
export const ACCESS_STATES = [MEMBER, NOT_MEMBER]

const ACCESS_LABELS = { [MEMBER]: 'Member', [NOT_MEMBER]: 'Not a member' }

/** Where this contact sits on the access axis. */
export function accessOf(person) {
  return person && person.termsAcceptedAt ? MEMBER : NOT_MEMBER
}

/** The plainest form of the same question, for a row that only wants a badge. */
export function isMember(person) {
  return accessOf(person) === MEMBER
}

/** What an access value is called on screen. */
export function accessLabel(value) {
  return ACCESS_LABELS[value] ?? value
}

/* ── Pipeline: where the relationship stands ─────────────────────────────── */

/** The initial value of every contact: an address, and nothing else yet. */
export const LEAD = 'lead'
/** Asked, by an operator pressing invite. Says nothing about whether they came. */
export const INVITED = 'invited'

/**
 * The stages this build knows, in order.
 *
 * TWO OF THEM, AND THE SET GROWS ([[DOC-44]] §4, §7). Later stages are not yet
 * named, and the shape has to make naming one cheap: a value here, a label
 * below, and the facet picks it up without this file's readers being edited.
 */
export const PIPELINE_STAGES = [LEAD, INVITED]

const STAGE_LABELS = { [LEAD]: 'Lead', [INVITED]: 'Invited' }

/**
 * Where this contact sits on the pipeline axis.
 *
 * THE STORED VALUE, AND NOT A TIMESTAMP READ SIDEWAYS. `LEAD` only when there is
 * nothing stored — a row written before the column existed, or a client holding
 * a person it built itself — and never as a stand-in for a value it does not
 * recognise. A stage this build has not heard of is returned as it arrived, so a
 * newer server showing a newer stage reads as that stage rather than silently
 * as a lead.
 */
export function stageOf(person) {
  return (person && person.pipelineStage) || LEAD
}

/** What a stage is called on screen; an unknown one says its own name. */
export function stageLabel(value) {
  return STAGE_LABELS[value] ?? value
}
