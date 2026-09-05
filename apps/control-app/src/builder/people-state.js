/**
 * The three states of one row ([[DOC-42]] §4, §9; [[REQ-188]]).
 *
 * A MEMBER IS SOMEONE WHO SIGNED UP, NOT SOMEONE WE INVITED. The earlier model
 * had two states and made `invitedAt` the marker, which describes what *we* did
 * rather than what *they* did: press the button and the tab immediately called
 * that person a Member. An invitation nobody answered is not a relationship, and
 * calling it one costs the operator the one thing this tab should tell them —
 * who actually onboarded.
 *
 * SO THE MARKER FOR THE LAST STATE IS `termsAcceptedAt` AND NOT `firstSeenAt`,
 * and the difference is the whole reason this file exists rather than a boolean.
 * `admit` stamps `first_seen_at` on the first request that gets through the door
 * and `guardTerms` runs *after* it, so `first_seen_at` means "reached the
 * interstitial once" and `tos_accepted_at` means "completed sign-up". Only the
 * second is a fact about the person having entered into anything, and only the
 * second is a legal fact worth being able to query. Making it the thing that
 * defines membership is what lets the tab answer "who has accepted the terms"
 * without a separate report.
 *
 * ONE POPULATION, THREE STATES OF A ROW — never three tables ([[DOC-42]] §9's
 * falsifier stands). The invite moves a row from Contact to Invited; accepting
 * the terms moves it from Invited to Member, with no operator action at all.
 *
 * IT IS REPORTED RATHER THAN ENFORCED. Nothing in the code stops a never-invited
 * row from signing in today ([[DOC-42]] §4.1), and no label here may imply it
 * does. What the state now says that it could not before is which of the two
 * halves of the funnel a person is in — and the middle one is the one worth
 * acting on.
 *
 * A MODULE OF ITS OWN, WITH NO IMPORTS, so the one definition is reachable from
 * both sides of the seam: the browser panel that draws the label, and a test
 * running in workerd against real rows. Two derivations would be two answers
 * free to disagree about who is a member.
 */

/** Known here, never invited. May become a member. */
export const CONTACT = 'Contact'
/** Asked, and has not come: invited, and has not completed sign-up. */
export const INVITED = 'Invited'
/** Signed up — accepted the terms — and may log in. */
export const MEMBER = 'Member'

/** The three, in funnel order. The facet is built from this, not from a copy. */
export const PERSON_STATES = [CONTACT, INVITED, MEMBER]

/**
 * Which state this person is in.
 *
 * `termsAcceptedAt` IS TESTED FIRST, and not merely for tidiness: acceptance is
 * the fact that decides membership, so a row carrying it is a member whatever
 * else it carries. Testing `invitedAt` first would make a person who signed up
 * without ever having been invited by this business — a seeded operator, or
 * anyone admitted by a route that does not stamp an invite — read as a contact
 * despite having entered into the terms.
 */
export function stateOf(person) {
  if (!person) return CONTACT
  if (person.termsAcceptedAt) return MEMBER
  return person.invitedAt ? INVITED : CONTACT
}
