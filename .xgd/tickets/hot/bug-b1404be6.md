---
uid: bug-b1404be6
id: BUG-120
type: bug
title: 'repro console: [recapture] is a continuation verb rendered in the restart
  position'
created_by: EPIC-12
created_at: '2026-09-18T22:31:36.606254+00:00'
updated_at: '2026-09-18T23:46:49.127084+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 3
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d7d3f665
---

# [recapture] is a continuation verb rendered in the restart position

## What the operator experienced

The operator running the epic's rounds has been pressing **[run again]** every
iteration, and read **[reproduce]** and **[recapture]** as *"essentially
restarts"* — because of where they are on the page, not because of what they do.

That reading is wrong about [recapture], and the page is why.

## The page says the opposite of what the code does

`tools/repro-console/src/page.ts:renderConsolePage` emits, in document order:

```
<form action="/run">  [ site address ] [reproduce] [recapture]    <- top of page
<p id="status">
notice / stored
rows            <- the iteration list, which GROWS
held
[run again]                                                        <- bottom
```

So the two buttons that sit beside the address box, above everything, pinned at
the top, are [reproduce] and [recapture]; and the one that appears after the
growing history is [run again]. Position reads: *the top pair start something,
the bottom one continues it.* On a page that is several iterations tall, the top
pair are also the only two still on screen when you arrive.

The code disagrees. In `console.ts`, all three POST to the same handler and the
only question it asks is `continuing`:

```
const continuing = trimmed === undefined || (this.url !== null && bareHost(trimmed) === bareHost(this.url))
```

- **[run again]** -> `/run-again`, no address -> `continuing` -> refold, append. A continuation.
- **[recapture]** -> `/recapture` on the loaded site -> `continuing` **and**
  `forceCapture` -> `recaptured = this.iterations.length > 0`, `bundleDir = undefined`
  -> re-capture, **append**, mark the seam. **Also a continuation.**
- **[reproduce]** -> `/run` -> reuses a stored capture if there is one, otherwise
  starts a new list at Iteration 1. The only restart of the three.

REQ-272 part 2 deliberately made [recapture] keep the chain — its whole purpose
is *"did the capture-side fix move the numbers", which needs the iterations
before the fix still on the page beside the one after it*. The console's own
comment at `console.ts:616` says exactly that. The page then renders it in the
position that means "throw the page away and start over".

The internal inconsistency is already visible in the markup: **[run again] and
[recapture] both carry `data-held="1"`** and both are disabled by the hold, while
[reproduce] is not. The console already classifies them as the same kind of
action — loop-advancing — and then puts them at opposite ends of the page.

Its continuation-ness is currently communicated by a `title=` tooltip, which is
invisible on a touch device, invisible to anyone not hovering, and the wrong
channel for the one fact that decides whether a $7 round measures anything.

## Why this is not cosmetic

The epic's reference bundle is at capture schema 1 against an extractor at
schema 3, missing all five registered axes. Every [run again] refolds, and a
refold cannot recover an axis the stored oracle never had — by construction, no
matter how many times it runs. The five capture-lossy defects rounds 1-3 filed
stay invisible until someone presses [recapture].

So the affordance defect has a direct price: rounds spent re-measuring residuals
that were fixed commits ago, because the button that would have shown the fixes
looked like it would destroy the history.

## Behaviour wanted

1. **The two continuations are presented together as continuations**, near the
   iteration list where the eye is, and distinguished from each other by what
   they do to the *reference* — one refolds the oracle we have, one re-rolls it —
   rather than by page position.
2. **[reproduce], the only restart, is presented as one**, and says so where it
   can be read without hovering: on the loaded site it reuses a stored capture,
   and on a new address it starts a new list.
3. **Each button says what it will do to the iteration list before it is
   pressed** — append, or start over — in visible text rather than a `title`.
4. **The stale-capture state is surfaced beside the choice, not only after it.**
   When the loaded bundle is behind `CAPTURE_SCHEMA`, the page already has
   `staleCaptureDetail`'s sentence; say it where the operator is choosing between
   refolding and re-capturing, since that is the decision it exists to inform.
5. **No change to what any of the three does.** This ticket moves and labels;
   the verbs are REQ-272's and stay exactly as they are.

## Acceptance

- The rendered page groups [run again] and [recapture] as continuations and
  [reproduce] as the restart, and a test asserts the grouping from the markup
  rather than from a screenshot.
- Each control's effect on the iteration list is in visible text.
- With a bundle behind `CAPTURE_SCHEMA`, the page names that fact adjacent to the
  continuation controls.
- The POST targets, the hold gating and the `recaptured` seam are unchanged, and
  REQ-272's existing UATs still pass.