---
uid: acceptance_criterion-0e12e8aa
id: AC-1347
type: acceptance_criterion
title: The fold derives a no-wrap threshold from the reference's own measured line
  count
created_by: xgd
created_at: '2026-08-20T12:47:51.967329+00:00'
updated_at: '2026-08-20T12:49:19.445246+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion
The fold hands a run a fixed-width box whose slack over its own glyphs is routinely a
fraction of a pixel, and every engine measures glyphs slightly differently — so the
reference's own line count would be re-decided, per browser, by rounding. To carry it
across engines the fold derives a **no-wrap threshold** axis from the reference itself:
the smallest captured width from which the reference set the run on a single line at
that width *and at every wider sample*.

- The line count is **measured**, not authored: the run's captured glyph extent over its
  captured line height.
- The threshold is taken as a **suffix** of the ladder, so pinning never claims more than
  the reference showed — a run that is one line at 1024 but two at 1280 (responsive type
  can grow faster than its column) yields the wider threshold, not the narrower one.
- An **unmeasurable** line count breaks the suffix rather than reading as "one line":
  an unknown must never pin a wrapping paragraph to one unbreakable row, which would
  overprint the run positioned below it.
- A run the reference never set on a single line at any sampled width emits **no**
  threshold axis.

## Verification
Fold a fixture capture whose run wraps to two lines at the narrow rungs and sits on one
line from a middle rung upward, and assert the folded text leaf carries a no-wrap
threshold equal to that middle width. Assert a run that is one line at a middle rung but
two lines at a wider one yields the wider width as its threshold, not the middle one — the
suffix rule. Assert a run that wraps at every sampled width emits no threshold axis, and
that a run whose captured line height or glyph extent is missing likewise emits none
rather than being pinned. Render at a width below the threshold and assert the run still
wraps as the reference did.