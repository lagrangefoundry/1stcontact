---
uid: request-0c93daeb
id: REQ-272
type: request
title: 'repro console: two operator decision points, and a re-capture that does not
  reset the site'
created_by: EPIC-12
created_at: '2026-09-18T02:25:39.360214+00:00'
updated_at: '2026-09-18T03:38:50.623864+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-7919010c
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