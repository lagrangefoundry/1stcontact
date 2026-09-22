---
uid: request-4f42a700
id: REQ-299
type: request
title: 'repro console: one verb instead of three, and a way to clear the history'
created_by: EPIC-12
created_at: '2026-09-22T20:33:22.529568+00:00'
updated_at: '2026-09-22T21:35:06.379507+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  epic_parent: epic-bf282b3d
  chat_comment: comment-f9e3fa64
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


## What this supersedes, as a consequence

Neither part can land without contradicting behaviour the console already has.
Naming it here rather than leaving reconciliation to discover it:

- **[[BUG-120]]'s continuation group.** That ticket rendered `[run again]` and
  `[recapture]` as one labelled pair under the iteration list, because they are
  the same kind of act and the page had them at opposite ends. Part 1 removes
  one of the pair. The group survives as a section — it is still where the
  continuation lives, and it now also holds `[clear history]` — but it holds one
  verb, its heading no longer promises two, and the sentence that distinguished
  them is gone because there is nothing left to distinguish. The stale-reference
  warning stays in it: it no longer informs a choice between two buttons, but it
  is still true about the reference the iterations on the page were measured
  against.

- **[[BUG-130]] behaviour 3's sentence.** The hold's explanation names every
  control the hold catches, which was `[run again] and [recapture]`. It now
  names `[recapture]` and `[clear history]` — the same rule, applied to the
  controls that now exist.

- **[[REQ-254]] requirement 29 — reuse the bundle on disk.** `[reproduce]`
  reused a stored capture rather than re-taking it, so that the reference and
  the fold did not move together. With `[recapture]` as the only verb there is
  no press that reuses: every press re-rolls. The stored bundle is still
  reachable — the `captured already` list on the blank page still adopts a site
  without running anything ([[REQ-254]] requirement 31), and adopting still
  costs nothing — but adopting is not folding, and the next fold recaptures.

- **`/run` and `/run-again` are gone from the HTTP surface**, not merely
  unlinked. A POST to either answers 404. A retired route left answering is a
  second way to do the thing the page stopped offering, and the whole of part 1
  is that there is one way.

## Details settled in implementation

- **Where a cleared chain goes.** `storage/tmp/repro-console/repro-<site>/` is
  renamed to `repro-<site>.cleared-<timestamp>` beside itself, so an operator
  who opens the workspace directory sees the archive next to the live chain
  rather than having to know a second location. The console reads a chain at its
  exact slug, so an archived sibling is invisible to the page without any
  filtering rule to keep true. The round-session record ([[REQ-261]]) travels
  with it, which is correct: the new chain is a new chain and starts its rounds
  unresumed. The gap registry is at the workspace root, above the site
  directory, and is untouched — it is what the loop has learned across every
  chain, not what this one did.

- **The status line says where it went.** Clearing reports the number of
  iterations moved aside and the archive's name, because a button whose whole
  promise is "this is recoverable" has to say where it is recoverable from.

- **The address row is not held.** `[recapture]` beside the text box stays
  outside the hold, as `[reproduce]` was: the hold exists to stop this chain
  advancing before the implementation lands, and it has no business stopping a
  different site being captured. A press there that names the held site is
  refused by the console with the hold's own message, which is the rule the
  disabled button was only ever a courtesy for.