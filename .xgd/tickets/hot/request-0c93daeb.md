---
uid: request-0c93daeb
id: REQ-272
type: request
title: 'repro console: two operator decision points, and a re-capture that does not
  reset the site'
created_by: EPIC-12
created_at: '2026-09-18T02:25:39.360214+00:00'
updated_at: '2026-09-18T05:16:15.780659+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-7919010c
  commits:
  - working_sha: dcfac45ccc3b2b8370c7c6213db1c99d0a8a6383
    reconcile_sha: null
    main_sha: null
  - working_sha: 14a9638037c05108aed069386662f2bc72473739
    reconcile_sha: null
    main_sha: null
  version: 0.2.262
---

# Repro console: two operator decision points, and a re-capture that does not reset the site

## Part 1 — the decision point is in the wrong place

`tools/repro-console/src/console.ts` triggers the AI round from the iteration
completing:

> "Not on a button — the links appearing IS the trigger, which is what makes the
> diagnosis a part of the iteration rather than a second thing."

`runIteration()` awaits `this.diagnose(iteration)` unconditionally. There is no
gate between the comparison and the AI spending its budget on it.

The operator needs to **see the reproduction before an AI fix is triggered**, and
needs to **control when the loop advances after an implementation lands**. The
wanted sequence has two stopping points where there are currently zero:

```
capture and compare
  *DECISION*                 <- stop 1: operator inspects, then chooses
AI run
  WAIT for manually triggered implementation
manually trigger next repro and compare
  *DECISION*                 <- stop 2: operator inspects, then chooses
AI run
```

### Behaviour wanted

1. A finished iteration leaves the page **idle**, with its links live — original,
   reproduction, diff images, page document — and no round running.
2. Starting the round is an explicit operator action: a button on the iteration.
   The console never starts one by itself.
3. After a round files its ticket, `[run again]` is **held** until the operator
   says the implementation has landed. The held state says what it is waiting
   for, so an operator returning to the page knows why the button is inert.
4. Nothing already true of the round changes: a `capture-incomplete` verdict
   still stops and files nothing, the transcript still streams, and a round still
   cannot start on top of another one.

## Part 2 — the reference never moves, so re-runs cannot show improvement

`tools/repro-console/src/iteration.ts` states the rule:

> `REFOLD_NOTE = 'refold from the retained oracle; never re-capture on a re-run'`

The reasoning is sound for **fold** changes — re-capturing would re-roll the
oracle, so the reference would move at the same moment the fold did and the two
changes would be inseparable. It is wrong for **capture** changes: `refold`
re-derives `l1.json` from the retained `multistate.json`, so a fix to the
extractor is invisible until the site is captured again.

This has already cost a full round. Iteration 1 filed exactly that class of
defect — the capture drops form-control padding, and discards every `href`.
Those were implemented. Iteration 2 then spent **$7.70 and 78 turns** to
conclude, correctly:

> "The reference bundle was captured 70 minutes before the commit that fixed the
> residuals measured against it, so 100% of the frozen 1051.13 ranked region
> score is landed fixes waiting on a re-capture, and a bundle carries no schema
> stamp for anything to notice."

All three iterations on that site used the same `bundleDir`. The console offers
no way to re-capture that does not reset the iteration list and lose the chain.

### Behaviour wanted

1. An explicit **re-capture** action that takes a fresh bundle for the loaded
   site and continues the iteration chain rather than resetting it. The
   iteration records which bundle it used, so a chain that changed reference
   mid-way reads as one on the page rather than looking like a score that jumped
   for no reason.
2. A re-captured iteration is **marked as such** on the page and in its
   `iteration.json`, because its numbers are not comparable to the previous
   iteration's the way a refold's are. This preserves the one comparison an
   iteration exists to make: the operator can still see which change moved which
   number, because the console says which kind of change happened.
3. A bundle carries enough provenance — capture time at minimum — that a round
   can tell whether the fixes it is measuring had landed when the reference was
   taken, instead of deducing it from commit timestamps.

## Testable

- Finish an iteration: the page shows the links and **no round starts**. Press
  the button and the round starts. Both halves must be demonstrated.
- After a round files, `[run again]` is inert and says what it is waiting for;
  release it and the next iteration runs.
- Re-capture on a site with iterations already on disk: the chain continues, the
  new iteration is marked as re-captured, and the earlier iterations are still
  on the page.
- A round reading a bundle captured before a landed fix can say so from the
  bundle itself, without being told.


---

## What landed

### Part 1 — the two decision points

`execute()` no longer calls `diagnose()`. A finished iteration sets its message
and stops; the round is started by `POST /iteration/<n>/diagnose`, from a
**[diagnose this]** button rendered under that iteration's links, and from
nowhere else in the console.

The button is offered while nothing is running and the iteration has **no round
worth keeping** — none yet, or one that failed (labelled *diagnose again*). It
is not offered on a round that reached an answer: `[read it again]` re-files from
that round's transcript for free, and re-running would pay for the same reading
twice.

The hold after a filing is **derived, not stored**: the last iteration's outcome
is `filed` or `appended` and no release marker sits beside it. `POST /release`
writes that marker (`ai/implemented.json`) into the round's own directory, so the
hold **survives a restart of the console** — an operator returning to an inert
button is exactly the case the held state exists for, and "returning" routinely
means a restart. A round that filed nothing — `no-gap`, `stopped`, `failed` —
holds nothing: the hold is about an implementation that was *asked for*.

The hold gates **both** presses that advance the chain: `[run again]`, and
`[recapture]` of the site already loaded. Both produce the next iteration, and
the next iteration exists to measure the implementation. The page disables them
(`data-held`, honoured by the poller as well as by the render, so the button does
not silently re-enable a second after the round ends) and the handler refuses the
press that lands in the gap.

Nothing else about the round changed: `capture-incomplete` still stops and files
nothing with no AI process started at all, the transcript still streams under its
iteration, and `running` is still held for a round's whole length so nothing can
start on top of one.

### Part 2 — a re-capture that keeps the chain

`[recapture]` naming the site already on the page **appends the next iteration**
instead of resetting the list: the iterations, the slug and the loaded URL are
left alone and only the bundle is dropped, which is what makes the run capture
rather than refold. Naming a *different* site is still the other verb and still
starts a new chain — "the same site" is `bareHost`, exported from `iteration.ts`
so the console's question and `findStoredCapture`'s are one comparison rather
than two spellings of it.

The new iteration is marked `recaptured: true` in its `iteration.json` and
labelled *re-captured* on the page, with the reason: its numbers are not
comparable with the iteration above it, because the reference moved as well as
the engine. Every iteration also records and shows **which bundle it used and
when that bundle was captured** (`bundleCapturedAt`), so a chain whose reference
moved half way through reads as one chain with a marked seam. The capture time is
the only thing that can say this: a bundle's name is URL-derived and overwriting,
so `bundleDir` is the same string either side of a re-capture.

That same fact makes `session.ts`'s reset rule 1 fire for the first time. The
rule has always read "a different bundle, **or the same site re-captured**", and
the second half could not be observed while `bundleDir` was the only key; the
bundle's `capturedAt` is now part of the resume context, so **a re-capture cuts
the resume chain** and the next round pays full price rather than reasoning from
remembered numbers about a page that no longer exists.

### Part 2, item 3 — the reference's own age, handed to the round

`1c capture page` already stamps `capturedAt` and (since [[REQ-270]])
`captureSchema`; nothing in the engine changed. What is new is that the console
reads them — through one new leaf module, `src/bundle.ts`, the single reader of
those field names — and hands them over:

- the **digest** opens with a *reference* section naming the bundle, its capture
  time and its schema stamp, and
- the **prompt** says the same in a paragraph placed above the evidence list,
  because a fact that only appears in a file the round *may* read is a fact the
  round may miss, and this is the one whose being missed costs a whole round.

Beside them the console lists the **engine commits that landed after the
capture** (`git log --since=<capturedAt> -- tools/generate/src`, bounded and
never fatal). That is the arithmetic the observed round spent $7.70 and 78 turns
on, over two inputs that were on the disk the whole time. Three states are
distinguished and each says which it is — commits landed, nothing landed, and
*this bundle carries no capture time* (the last being a finding about the
instrument, never quietly collapsed into "nothing landed", which would read as
permission to file).

The brief gains a section under §4 stating the consequence a round has to draw:
a residual measured against an oracle older than its fix is a landed fix waiting
on a re-capture, not an outstanding gap, and `1c refold` can never close that
window because the axis a capture fix adds is absent from an oracle the old
extractor wrote.

## Test plan

`tests/test_UAT_FC_REQ-272_operator_decision_points.test.ts` — ten UATs over the
real console, its real HTTP surface and the real manifests, with `1c`, `claude`,
`git` and `xgd` substituted through the seams the console already had. The fake
capture step stamps a **different** `capturedAt` on every call, which is what
makes "the reference moved" observable at all.

- the iteration finishes with its links, **no round runs**, and the button starts
  exactly one (both halves, in one test);
- `capture-incomplete` still stops and files nothing, and a second press during a
  round — of `[diagnose this]` or of `[run again]` — is refused;
- `[run again]` is inert after a filing, names the ticket it waits for, and runs
  the next iteration once released;
- the hold survives a restart, and the release is recorded on disk;
- a round that filed nothing holds nothing;
- re-capture appends a marked iteration, keeps the earlier ones and their
  artifacts, and every iteration names its bundle and capture time;
- a re-capture cuts the resume chain;
- re-capture on a *different* site still starts a new chain;
- the digest and the prompt carry the capture time, the schema stamp and what
  landed after it;
- a quiet engine and an unstamped bundle each say which they are.

The three suites that drove the round through the old automatic trigger —
[[REQ-256]], [[REQ-261]], [[REQ-262]] — press `[diagnose this]` (and release the
hold) in their fixtures. What they assert is unchanged, which is the point: this
ticket moved the trigger and left the round alone.