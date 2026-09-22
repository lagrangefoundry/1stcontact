---
uid: request-4f42a700
id: REQ-299
type: request
title: 'repro console: one verb instead of three, and a way to clear the history'
created_by: EPIC-12
created_at: '2026-09-22T20:33:22.529568+00:00'
updated_at: '2026-09-22T20:33:22.529568+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  epic_parent: epic-bf282b3d
---

# One verb, and a way to clear the history

## What the operator asked for

Two things, both about the console's control surface being larger than the
number of decisions actually available:

> Could we simplify this — just remove the buttons that say run again and
> reproduce?

> Also give me a button to clear the history — I like to see the history, but
> it's long and confusing, and I want to clear it at the start of a new test.

## Part 1 — three verbs collapse to one

The page renders three controls that all mean "produce the next iteration":

| control | route | re-hits the site? | can begin a chain? |
|---|---|---|---|
| `[reproduce]`  | `/run`       | yes | yes |
| `[recapture]`  | `/recapture` | yes | no — continues |
| `[run again]`  | `/run-again` | no  | no — continues |

Only one bit actually varies between `[reproduce]`/`[recapture]` and
`[run again]`: whether the reference bundle is re-rolled before the fold.
`console.ts` already shows this — all three reach the same handler and it asks
only `continuing` and whether to recapture.

That bit is not one the operator can answer from the page. Answering it
correctly requires knowing the capture schema the stored bundle was written at
and the schema the extractor is at now. When those differ — which they do
today, bundle at 1 against `CAPTURE_SCHEMA = 4` — `[run again]` re-folds the
stale bundle and silently cannot see any axis added since the bundle was
rolled. The operator presses a button, gets an iteration, and the iteration is
blind in a way nothing on the page discloses.

A control whose correct use depends on a fact the page does not carry is not a
choice. It is a trap. Retire it.

**Behaviour.** `[run again]` and `[reproduce]` no longer appear on the page.
`[recapture]` is the only verb, and it appears in both positions the retired
pair occupied:

- On the address row, beside the text box, where it begins a chain for the
  typed address. This is what `[reproduce]` did.
- Under the iteration list, where it appends the next iteration to the chain
  already on screen. This is what `[recapture]` already did.

In both positions it re-hits the site and re-rolls the reference before
folding. There is no longer any way to fold a stored bundle from the page, and
that is the point: every iteration the console produces is now measured at the
current capture schema.

**The label.** It stays the word `recapture` in both positions, rather than
splitting into `capture` on a blank page and `recapture` on a continuation.
The "re-" is slightly wrong on a blank console, and that is accepted
deliberately: two labels for one act would reintroduce exactly the
which-one-do-I-want question this part exists to remove, and `recapture` is the
word the epic's tickets and the operator's own vocabulary already use.

**Routes.** `/run` and `/run-again` are retired along with their buttons. A
POST to either is no longer produced by any page the console serves.

**What does not change.** The seam marking from [[REQ-272]] stays: a
recaptured iteration is still marked as not comparable with the one before it,
because it still isn't. With `[run again]` gone every continuation carries that
seam, so the marking becomes the norm rather than the exception, and the page
should not start claiming comparability it cannot offer.

## Part 2 — clearing the history

The iteration list grows without bound and is never reset. By round three or
four the page is several screens tall, and the rows describing the run the
operator is actually looking at are below rows from runs they have finished
reasoning about. The operator wants the list — it is the record of what the
chain has learned — but wants to start a test against an empty one.

**Behaviour.** A `[clear history]` control. Pressing it ends the current chain:
the iteration list empties and the console returns to the blank state it opens
in — a text box and `[recapture]`, and nothing else. The next chain started
after clearing begins at iteration 1.

**Clearing archives; it does not delete.** The chain directory under
`storage/tmp/repro-console/repro-<site>/` holds real evidence — AI transcripts,
diffs, filed gap ticket ids, rail results. A press of a button on a page must
not destroy it. Clearing moves the chain aside on disk rather than removing it,
so the page reads empty while every iteration remains recoverable by an
operator who looks in the directory.

**Clearing does not touch the reference.** The captured bundle under
`storage/references/<site>/` is a separate artifact with a separate lifecycle —
the regression rail baselines against it. Clearing the history leaves it
exactly where it is.

**Placement and inertness.** The control sits with the history it clears, not
beside the address box, so the position reads "this acts on the list" rather
than "this starts something". It follows the same inert rules as every other
control on the page ([[REQ-272]] part 1, b3, and [[BUG-130]]): disabled while a
round is running, disabled while the chain is held, and carrying the same
`data-inert` reason the poller already reads so a held clear is visibly held
rather than mysteriously dead.

## Why one ticket

Both parts are the same change to the same surface: the console asks the
operator for decisions it should not be asking for. One of them is a verb that
cannot be chosen correctly from the page; the other is a list that cannot be
put down. They land together or the page is half-simplified.
