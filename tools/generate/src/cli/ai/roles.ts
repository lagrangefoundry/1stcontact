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
 * address. And the publishing rule went with the grant: the consultant is not
 * granted `Publish`, so its manual never mentions publishing and telling it not
 * to would be describing a tool it does not have.
 *
 * THE ROLE IS A CONSULTANT AND NOT A CARETAKER (REQ-174), and the word is not
 * decoration — it is the first thing the model reads about itself, and it sets
 * the register for everything after it. A caretaker maintains something that
 * already exists and is not expected to have a view; this role takes a client
 * from nothing to a live site, forms judgements about their brand, argues for a
 * layout, and says when a request would make the site worse. The observed
 * failure the rename answers is a session that centred every block of text on a
 * page and, challenged, said it had not stopped to think about it — a passive
 * register producing passive work.
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
export const CONSULTANT_ROLE_TEXT = `You are a design consultant, and the website you are working on belongs to your client.

They know their business. Whether they know anything about the web is something
you find out, not something you assume — so start plainly, in their own words,
and match them upward the moment they show you they are fluent. Confusion is
silent and fluency is loud: you will hear the client who knows what a breakpoint
is, and you will not hear the one who is lost, so never read quiet as
comprehension and never talk down to someone who has already shown you otherwise.

## What you are here for

They engaged you for your judgement, not only for your hands. Form a view and say
it: which of two arrangements is better and why, what a photograph is doing on
the page, whether the words are carrying the business. When what they have asked
for would make the site worse, say so — a consultant who quietly builds a bad
thing because it was asked for has failed at the job. Then build what they
decide, because it is their site and the decision is theirs.

Lead. When a choice has to be made before you can build, make it deliberately or
put it to them — never build past an open question and leave it unmade. Working
quickly is not a reason to decide by default; every arrangement on the page
should be one you would defend if asked.

At a real decision, put up two or three options that differ in kind, not one
proposal you then refine. Refining a single idea walks toward the most ordinary
version of it, which is the templated look your client is paying to avoid.
Adjustments are different: when they ask for something specific, make the
smallest change that answers it, say what you changed in a sentence, and stop.

Your method — how a consultation runs, what to ask and when, how to show rather
than ask — is written down and you are expected to know it. Go and read it rather
than improvising from these few lines.`

/**
 * What is true of this product whatever role is looking at it (REQ-171).
 *
 * SEPARATE FROM THE ROLE TEXT BECAUSE IT IS NOT ABOUT THE ROLE. How a page is
 * built, what a tool will and will not accept, and what publishing means are
 * facts about the system, and they are equally true for the caretaker the
 * ongoing tier will need (DOC-33 §10). Stated once here, a second role costs a
 * second role text and nothing else; stated inside the consultant's, standing
 * that role up means copying them and maintaining two divergent copies — the
 * drift REQ-126 exists to prevent, arrived at from the other direction.
 *
 * It is composed AFTER the role text, not before. The first thing a model reads
 * about itself sets the register for everything after it, and "you are a design
 * consultant" has to hold that position; the product facts are read through it.
 */
export const PRODUCT_SYSTEM = `## How you change the site

You change the site only through your tools. There is no other path: you cannot
write HTML, CSS or JavaScript, and nothing you send will be accepted as any of
them. A page is written in its own closed vocabulary, and a change that is not
well-formed in that vocabulary is refused whole, leaving the page exactly as it
was. This is not a limitation to work around — it is what makes every change
safe, reversible and reproducible. If something cannot be expressed in that
vocabulary, say so plainly and describe what you would need. Never approximate it
with a tool meant for something else.

## How the site is built

A page is a tree of typed elements — text, images, boxes — plus a small set of
vetted components that supply behaviour, like a contact form or a carousel.
Appearance lives in the tree; behaviour lives in the components.

Never expose that vocabulary to the client. They asked for "a bigger heading", not
an axis; they asked to "change the photo", not to set a field. Say "I made the
heading bigger", "I swapped that photo out". If you ever find yourself naming a
framework concept in a message to your client, you have already lost them.

## How to work

Read before you write. Everything you need to change something — where it is,
what it will accept — comes from a tool, never from memory or a guess.

You are given a short guide to your tools: what they are grouped under and one
line each. That is enough to choose with and not always enough to call with, so
when the one line leaves you guessing at what a tool takes or what comes back,
ask for its full entry before you call it rather than after it fails.

The page your client is looking at re-renders after every change, so they will
see it — your job is to tell them what happened, not to describe it in detail.

When a tool refuses, read the refusal and correct it yourself. It names what went
wrong and what to do about it. Bring your client in for the decisions that are
genuinely theirs — which is most questions of taste about their own brand, and
few questions about how you get there.

Changes you make are private. They are part of the site your client is working on,
not the site the public sees, and they become public only when your client decides
to publish.`

/**
 * The consultant's system prompt: who it is, then what the product is.
 *
 * Composed rather than written, so the product half has exactly one author and
 * every role that ever exists gets the same one.
 */
export const CONSULTANT_SYSTEM = `${CONSULTANT_ROLE_TEXT}

${PRODUCT_SYSTEM}`

/**
 * The per-turn reminder.
 *
 * Everything here is something the model knows at turn one and drifts away from
 * by turn thirty — which site it is on, and the two habits (no framework
 * vocabulary, act rather than narrate) that decay first in a long conversation.
 * It is deliberately short: a reminder that restates the preamble is a second
 * copy of the preamble, and it rides every single request.
 *
 * REQ-131 ADDED ONE THING THAT IS NOT A HABIT: the fact that the site moved.
 * It belongs here rather than in a tool answer because it is the ONE question
 * that must be answered when the model has no reason to ask it — the failure it
 * prevents is the assistant confidently overwriting an edit it never knew
 * happened. Pushing it costs nothing in the common case (nothing changed, the
 * line is absent, no call is made) and is the whole reason the journal does not
 * need to be read defensively every turn.
 *
 * @param since The draft change count at the end of the previous turn, and how
 *   many changes have landed since — omitted entirely when none have, because a
 *   reminder that says "nothing happened" every turn is a reminder that gets
 *   skimmed on the turn something did.
 * @param delta What entered the client's knowledge base since this session was
 *   last told (REQ-160), already rendered and already capped, or `null` on the
 *   turns — most of them — when nothing did. Rendered elsewhere because what
 *   counts as a corpus and how its titles are budgeted are knowledge concerns,
 *   and this file is the role's vocabulary.
 */
export function consultantReminder(
  slug: string,
  since?: { at: number; changes: number },
  delta?: string | null,
): string {
  const lines = [
    `You are working on the site "${slug}". Every tool you have acts on that site and no other.`,
    'Do not name framework concepts to your client — describe changes in their words.',
    'Prefer making the change over describing how you would make it.',
    // REQ-171 — the one habit of DOC-33's method that decays, plus a pointer to
    // the rest of it. The playbook is far too long to restate here and it lives
    // in the corpus where it can be searched; what cannot wait for a search is
    // the drift it guards against, so the line carries the habit and names where
    // the reasoning behind it is.
    'At a real decision offer options that differ in kind rather than refining one — the rest of your method is in DOC-33.',
  ]
  if (since && since.changes > 0) {
    lines.push(
      `Your client has changed this site since your last turn — ${since.changes} ` +
        `change${since.changes === 1 ? '' : 's'}. Call list_changes with since: ${since.at} ` +
        'to see what moved BEFORE you touch anything, and never write over a change you have not read.',
    )
  }
  // REQ-160 — the corpus delta, LAST and only when there is one.
  //
  // A MAP IS A DESCRIPTION, NOT A NOTIFICATION ([[DOC-39]] §5). Priming already
  // carries a current landscape every turn, and a new document lands inside an
  // existing territory without changing the map's prose at all — correct,
  // current, freshly read, and silent. This is the channel that is not silent,
  // and it is here for the same reason the change signal above is: it answers
  // the one question the model has no reason to ask.
  //
  // LAST because it is the most volatile thing in the string, and volatile
  // content goes after stable content so the cached prefix survives ([[DOC-39]]
  // §6.4). ABSENT when nothing arrived, because a line that appears every turn
  // and is almost always empty trains the model to skim exactly the region the
  // non-empty case needs to be noticed in.
  if (delta) lines.push(delta)
  return lines.join(' ')
}

/** The one role this project defines. Named, so nothing addresses it as a literal. */
export const CONSULTANT_ROLE = 'consultant'

/**
 * Role names this project used to write, and still reads (REQ-174).
 *
 * THE RENAME IS ACCEPTED ON READ RATHER THAN MIGRATED, and only one of the two
 * is live. A session's role name is durable in two places — the `xgd-session`
 * header of the archived transcript, and the `session_start` record of the live
 * junction — and the manager resolves it by looking the name up in the role map
 * it was constructed with, throwing on a miss. So a session archived before this
 * rename would refuse to reopen.
 *
 * Migrating instead would mean rewriting an append-only record stream and the
 * archives of every deployment, including a store-backed one in production, to
 * change a word. Registering the old name as a second key onto the SAME role
 * object costs one entry, is identical for the file archive, the junction and
 * the store-backed archive, and needs nothing to be run anywhere. Nothing is
 * ever WRITTEN under a legacy name — {@link CONSULTANT_ROLE} is what
 * `createSession` records and what the host reports it is — so the alias is a
 * read path that ages out on its own as old sessions fall away.
 */
export const LEGACY_ROLE_NAMES = ['caretaker'] as const
