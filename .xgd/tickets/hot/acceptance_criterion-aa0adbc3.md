---
uid: acceptance_criterion-aa0adbc3
id: AC-1621
type: acceptance_criterion
title: The manual carries the cross-cutting rule for a site that moved, a sequence
  that starts from the change log, and an undo absence that cites it
created_by: martin-github@westhead.me
created_at: '2026-09-10T08:28:39.855772+00:00'
updated_at: '2026-09-10T08:28:39.855772+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

Knowing that the site moved is not the same as knowing how to respond to it, and the
response is the same for every operation — so the guidance is carried **once, as
guidance in the projected manual**, not repeated on the change-reading operation, whose
own description stays about the read.

For a session granted the site-reading group, the manual it is given carries all three
of:

1. **The cross-cutting rule, in the overview.** It states that the user changes the site
   themselves while the assistant is working on it, editing the page they are looking
   at; that the assistant is told at the start of a turn when something has changed
   since its last one; that when told it must look at what changed *before* it acts; and
   that it must never write over a change it has not read. The rule reaches the manual
   *through the projection of the declaration's own overview* — not from a preamble
   written beside the manual that could come to say something else.

2. **A named sequence that walks the response end to end** — signal → read the changes →
   act. Its **first** step is the change read, not a re-read of the page, and its note
   says so; its remaining steps are the page reads that follow. Every step it names is a
   declared operation, and the sequence appears in the manual only for a session that
   was granted all of them.

3. **The declared absence for undo cites the change log.** It says that what a thing
   said before is on record — the change log carries the words before and after — so the
   assistant does not have to narrate the previous value into the conversation to keep
   it recoverable, while still declaring plainly that there is **no undo operation**.

## Verification

Build the projected manual for a session granted the site-reading group.

- Take the overview paragraph identified by its wording (the one about the user changing
  the site themselves) out of the declaration, assert it is a single paragraph, assert it
  states being told at the start of a turn, looking at what changed before acting, and
  not overwriting an unread change — and assert the manual contains that same paragraph
  verbatim, so the rule cannot be sourced from anywhere but the declaration.
- Find the declared sequence whose steps include the change-reading operation. Assert its
  first step is that operation, that its later steps are page reads, that every step is a
  declared operation appearing in the sequence's order, and that the manual carries the
  sequence's name and note for this grant.
- Take the declared absence for undo. Assert it names the change-reading operation as
  where a prior value is found, that it still states there is no undo, that no declared
  operation is an undo, and that the manual carries it.
