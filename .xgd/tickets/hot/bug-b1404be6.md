---
uid: bug-b1404be6
id: BUG-120
type: bug
title: 'repro console: [recapture] is a continuation verb rendered in the restart
  position'
created_by: EPIC-12
created_at: '2026-09-18T22:31:36.606254+00:00'
updated_at: '2026-09-18T23:54:25.705565+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  story_points: 3
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d7d3f665
  commits:
  - working_sha: 5653de893110491864d21ed8afc461c55bca12f9
    reconcile_sha: null
    main_sha: null
  - working_sha: ad4ee02fc255b36584085f08ebfaf39e8ac80699
    reconcile_sha: null
    main_sha: null
  version: 0.2.274
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


## How it was done

### The grouping is one form with two submit buttons

`<section class="continue">` sits where [run again] already was — under the
iteration list it continues — and holds both continuations. Inside it is a
single `<form method="post" action="/run-again">` whose second button carries
`formaction="/recapture"`, which is the same mechanism the address row used for
[recapture] before it moved. The POST targets are therefore untouched: [run
again] still posts to `/run-again` and [recapture] still posts to `/recapture`.

The form carries `<input type="hidden" name="url">` holding the site already
loaded — which is what the address box held when [recapture] sat in it, since
the box is pre-filled with the loaded address. So the request the console
receives from a press is the one it received before, and `continuing` answers
the same way.

**Consequence, accepted deliberately:** [recapture] against a *different* typed
address is no longer reachable from the page. The endpoint still does it if
posted, and the operator still reaches the same measurement by pressing
[reproduce] on the new address and then [recapture] on it. Keeping a second
[recapture] beside the address box to preserve that path would have reinstated
the defect this ticket exists to remove.

### The address row is the restart and says so

The address row holds [reproduce] alone, with a `<p class="effect restart">`
under it naming both of its cases in visible text: a new address is captured
and numbered from 1, and the address already loaded reuses the capture on disk.

### Each continuation names its effect, in text, not a tooltip

The `title=` on [recapture] is gone rather than doubled. The group's heading
states the shared effect on the list ("both of these append iteration N"), and
a `<span class="effect">` beside each button states what separates them — one
keeps the reference this chain already has and re-folds it, the other re-hits
the site and re-rolls the reference first — together with the consequence that
follows: the first is comparable with the iteration above it, the second is not,
and the page marks the seam.

### The stale reference is `staleCaptureDetail`'s own sentence, reused

`ReproConsole.staleReference()` reads `capture.json` from the loaded
`bundleDir` on every page build and returns `staleCaptureDetail`'s sentence
verbatim, or nothing. Reused rather than restated: that function owns
`CAPTURE_SCHEMA` and the axis registry, and it is the sentence that goes stale
the day the extractor learns an axis — a second spelling here would be a second
thing to bump.

Read on every build rather than remembered, because a re-capture overwrites the
bundle in place: a remembered answer would still be warning about a reference
the operator has just paid to replace.

It renders inside the continuation group, above the two choices, because it is
the fact the choice turns on. **A current bundle says nothing** — a warning
that is always on the page is the next thing an operator learns to ignore, and
this one has to still be readable on the round where it matters.

A bundle that cannot be parsed, or that is too thin to walk axis by axis, is
passed over silently. The page is not where a broken bundle is reported — the
run that reads it fails loudly and names the step — and a console that refused
to render over one would have hidden the history too.

## Test plan

`tests/test_UAT_FC_BUG-120_continuation_affordance.test.ts`, driving the real
console over HTTP with `1c` and the machine commands substituted, as REQ-254's
and REQ-272's suites do:

- the two continuations share `<section class="continue">`, [reproduce] is
  outside it in the address row, and the group renders *after* Iteration 1 while
  [reproduce] renders before it — the grouping asserted from markup, not a
  screenshot;
- each control's effect on the list and on the reference is in visible text, and
  the group carries no `title=` at all;
- a bundle at schema 1 renders `staleCaptureDetail`'s exact sentence inside the
  group; a bundle at `CAPTURE_SCHEMA` renders no `.stale-reference` element;
- [recapture] pressed **as the group's own rendered form would send it** (action
  and body read out of the markup) still appends iteration 2, leaves iteration 1
  standing, and marks `recaptured` in the manifest;
- the hold still gates exactly the two continuations (`data-held="1" disabled`
  twice inside the group) and not the address row.

Regression scope: REQ-254, REQ-254 isolation, REQ-272, REQ-256, REQ-261,
REQ-262, REQ-270, REQ-275, REQ-276, BUG-104, BUG-105, BUG-108, BUG-109, BUG-114,
REQ-255, plus `pnpm -r typecheck`. All pass.