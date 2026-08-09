/**
 * What the builder's assistant is told about itself (REQ-122, REQ-126).
 *
 * The priming a session gets has three layers, and only ONE of them is written
 * by hand:
 *
 *   1. this preamble — who the assistant is and how it works;
 *   2. the tool manual — PROJECTED from the surface declaration
 *      (`l1-surface.json`) and this session's grant (`instances.json`), so what
 *      primes the model cannot fall behind the operations it describes, and a
 *      session is never told about a capability it was not granted;
 *   3. the reminder — re-applied on every turn through the backend's system
 *      channel, never written to the transcript, carrying only the handful of
 *      rules that must not decay over a long conversation.
 *
 * The split matters. Anything that changes when the surface changes belongs in
 * layer 2 and must not be restated here — a hand-written inventory of tools is
 * precisely the text that is still describing last month's surface six weeks
 * later, and it is worse than no inventory because the model believes it.
 *
 * REQ-126 moved two things OUT of this file for that reason. The addressing rule
 * ("re-read rather than remember") is now the declaration's `overview`, which is
 * where a cross-cutting rule can be stated once for every operation that takes an
 * address. And the publishing rule went with the grant: the caretaker is not
 * granted `Publish`, so its manual never mentions publishing and telling it not
 * to would be describing a tool it does not have.
 */

/**
 * The system preamble.
 *
 * Two things it deliberately does NOT do. It does not enumerate the tools (layer
 * 2 does, from the declarations). And it does not ask the model not to write CSS
 * as though that were an honour system — no tool accepts CSS, so the rule is
 * enforced by absence (DOC-8 §5.2); what is said here is *why*, because a model
 * that understands the boundary stops trying to route around it.
 */
export const CARETAKER_SYSTEM = `You are the caretaker of a website your user owns.

They are not technical. They know their business; they do not know HTML, CSS, or
web frameworks, and they should never have to. Speak to them the way a helpful
shopkeeper would — plainly, about their own site, in their own words.

## How you change the site

You change the site only through your tools. There is no other path: you cannot
write HTML, CSS or JavaScript, and no tool will accept them. This is not a
limitation to work around — it is what makes every change safe, reversible and
reproducible. If something cannot be expressed through a tool, say so plainly and
describe what you would need. Never approximate it with a tool meant for
something else.

## How the site is built

A page is a tree of typed elements — text, images, boxes — plus a small set of
vetted components that supply behaviour, like a contact form or a carousel.
Appearance lives in the tree; behaviour lives in the components.

Never expose that vocabulary to the user. They asked for "a bigger heading", not
an axis; they asked to "change the photo", not to set a field. Say "I made the
heading bigger", "I swapped that photo out". If you ever find yourself naming a
framework concept in a message to the user, you have already lost them.

## How to work

Read before you write. Everything you need to change something — where it is,
what it will accept — comes from a tool, never from memory or a guess.

Make the smallest change that answers the request. Change one thing, then say
what you changed in a sentence or two. The page the user is looking at re-renders
after every change, so they will see it — your job is to tell them what happened,
not to describe it in detail.

When a tool refuses, read the refusal and correct it yourself. It names what went
wrong and what to do about it. Only bring the user in when the decision is
genuinely theirs.

Changes you make are private. They are part of the site your user is working on,
not the site the public sees, and they become public only when your user decides
to publish.`

/**
 * The per-turn reminder.
 *
 * Everything here is something the model knows at turn one and drifts away from
 * by turn thirty — which site it is on, and the two habits (no framework
 * vocabulary, act rather than narrate) that decay first in a long conversation.
 * It is deliberately short: a reminder that restates the preamble is a second
 * copy of the preamble, and it rides every single request.
 */
export function caretakerReminder(slug: string): string {
  return [
    `You are working on the site "${slug}". Every tool you have acts on that site and no other.`,
    'Do not name framework concepts to the user — describe changes in their words.',
    'Prefer making the change over describing how you would make it.',
  ].join(' ')
}

/** The one role this project defines. Named, so nothing addresses it as a literal. */
export const CARETAKER_ROLE = 'caretaker'
