---
uid: request-cd8a8c9e
id: REQ-323
type: request
title: 'repro console: controls at one end, and the history newest-first'
created_by: EPIC-12
created_at: '2026-09-25T21:37:20.771961+00:00'
updated_at: '2026-09-25T21:37:20.771961+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
---

## The problem

The console asks the operator's eye to work at both ends of the page at once.
Document order today (`page.ts:730-750`):

```
address box + [recapture]        ← a control, at the top
status line                      ← progress, at the top
notice / captured-already / filings
Iteration 1 … Iteration N        ← the newest is at the BOTTOM
⏸ [the implementation has landed] ← a control, at the bottom
[recapture] [clear history]       ← controls, at the bottom
```

So: controls top **and** bottom, progress top, and the thing that just happened
at the far end from the thing that reports it. Working the loop means scrolling
past the whole history to find the newest iteration, then scrolling further to
reach the buttons, then back to the top to read the status line.

## What changes

**Everything that is not the history moves to the top, and the history reads
newest-first downward.** The page is then built from the top up: the controls
are at one end, and the iteration nearest them is the one just produced.

New document order:

```
address box + [recapture]
status line
notice / captured-already / filings
⏸ [the implementation has landed]     ← moved up
[recapture] [clear history]           ← moved up
Iteration N … Iteration 1             ← reversed
```

1. `state.iterations` renders in reverse — most recent first, iteration 1 last.
   **Numbering does not change**: iteration 1 is still called Iteration 1. Only
   the render order inverts.
2. The `⏸` held block and the `<section class="continue">` group both move above
   the iteration list, so no control is rendered after it.
3. The two visible sentences that name a direction become true again:
   - `[clear history]` says the iterations "above are moved aside" (`page.ts:631`)
     — they are now below.
   - the restart effect line says it "appends the next iteration to the chain
     below" (`page.ts:740`) — the chain is still below, but the appended
     iteration now arrives at the *top* of it, which is the fact worth saying.
4. Nothing else moves. `notice`, `captured already` and `filings` are already
   above the list and stay where they are.

## Why this does not throw away [[BUG-120]]'s argument

[[BUG-120]] put the continuation group *after* the history on the explicit
reasoning that **position is the claim**: a control below the list reads as
"this acts on the list", where the same control beside the address box reads as
"this starts something". That argument is correct and it survives — what it
needs is adjacency to the thing being acted on, not the word "after". With the
list reversed, the group sits immediately above Iteration N, which is the
iteration a press acts on. The claim is preserved and the adjacency is tighter
than before.

Whoever implements this must restate that reasoning in the code comment rather
than deleting it. The comment at `page.ts:586-616` is the record of why the
group exists as a group at all, and only its final clause ("after the history it
acts on") is superseded.

## Two prior UATs are deliberately superseded

Both currently pin the order this ticket inverts. They must be amended, not
deleted, and the amendment must say it is one:

- `tests/test_UAT_FC_BUG-120_continuation_affordance.test.ts:247` —
  `indexOf('<section class="continue">') > indexOf('<h2>Iteration 1</h2>')`.
  Inverts. BUG-120's other assertions (the group exists, holds both verbs, the
  retired verbs are absent, the address row is outside the group and above the
  history) are all untouched and must stay green.
- `tests/test_UAT_FC_REQ-254_reproduction_console.test.ts:389` —
  `indexOf('Iteration 1') < indexOf('Iteration 3')`. Inverts. What REQ-254
  requirement 6 is actually about — that continuing appends and earlier
  iterations survive — is untouched: all three headings must still be present.

## Not affected

The transcript auto-scroll in `POLL_SCRIPT` (`page.ts:347-349`) keys on
`pane.scrollTop` / `pane.scrollHeight` of the per-iteration `<pre>` element, not
on page scroll, so reversing the list does not change it. The poller's
disabled/`data-inert` recomputation (`page.ts:335-338`) keys on `data-held`
attributes, not on position, and is likewise unaffected.

## Testable at the end

`test_UAT_FC_REQ-<this>_*`:

1. After three iterations on one site, the rendered page has
   `Iteration 3` before `Iteration 2` before `Iteration 1`, and all three are
   present.
2. No control is rendered after the iteration list: both
   `<section class="continue">` and the `⏸` held block appear before the first
   `<h2>Iteration` in the document, and nothing matching a `<form` appears after
   the last iteration section.
3. The address row is still above everything (BUG-120's surviving assertion) and
   still outside the continuation group.
4. A held chain renders the `⏸` block above the list, and the release button
   still lifts the hold — the move is positional only.
5. The `[clear history]` and restart sentences contain no direction word that the
   new order makes false.

Plus: the amended assertions in the two prior UAT files pass in their new
direction, and every other assertion in both files still passes.
