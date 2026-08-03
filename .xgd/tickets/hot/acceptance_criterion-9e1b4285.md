---
uid: acceptance_criterion-9e1b4285
id: AC-769
type: acceptance_criterion
title: A run is declared unbreakable from the smallest captured width whose entire
  wider suffix was single-line
created_by: xgd
created_at: '2026-08-03T02:08:30.940287+00:00'
updated_at: '2026-08-03T02:08:30.940287+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
Folding turns a flowed run into a fixed-width positioned box, which re-opens a line
break the reference had already decided — and the slack over its own glyphs is
routinely a fraction of a pixel, which different browser engines resolve
differently. The fold therefore restates the reference's own line count: a run is
declared unbreakable from a stated width, and that width is the **smallest sampled
width from which the run was single-line at that width and at every wider sampled
width**.

Taken as a suffix, never as a single width, so the pin never claims more than the
reference showed:

- a run single-line at every sampled width is unbreakable from the narrowest;
- a run that is single-line at a middle width but wraps at a wider one is
  unbreakable only from above that wider width — responsive type can grow faster
  than its column, and the pin must follow the reference, not the first width that
  happened to fit;
- a run that wraps at every sampled width is never pinned;
- a run whose line count cannot be measured is treated as breaking the suffix
  rather than as single-line, because the wrong reading pins a real paragraph and
  makes it overprint the positioned run below it.

## Verification
Fold captures of: a run single-line everywhere; a run single-line only from a middle
width upward; a run single-line at a middle width but wrapping at the widest; and a
run with no measurable line count. Assert the declared unbreakable-from width in
each case, and that the last two are not pinned from the middle width. Render a
reproduction whose runs sit at sub-pixel slack in every available browser engine and
assert the rendered line counts match the reference's in all of them.