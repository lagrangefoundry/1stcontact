---
uid: acceptance_criterion-1eb99338
id: AC-1118
type: acceptance_criterion
title: Resizing a run scales every keyframe of its responsive size rule by the same
  ratio, rather than writing the representative value alone or flattening the rule
created_by: xgd
created_at: '2026-08-12T18:08:08.759270+00:00'
updated_at: '2026-08-16T06:55:54.055114+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A run's size can vary by viewport. What the page holds in that case is not a
number but a **rule sampled at several widths** — say 72px at the widest, 54 in
the middle, 36 at the narrowest — of which the value the region reports is only
the representative one.

Changing the size therefore moves the whole rule: every keyframe is scaled by the
same ratio as the representative value, so a run running 72/54/36 taken to 96
renders 96/72/48. The shape the page was captured with is preserved and only its
magnitude moves, which is what a person asking for "bigger" means. How the rule
behaves *between* keyframes is untouched, because a uniform scale moves no
boundary. The widths themselves do not move either.

Both cheaper alternatives are refused, and both would fail silently:

- Writing the representative value alone would leave the rule untouched, and the
  rule wins at every width it covers — so the edit would appear to do nothing at
  all on the page the operator is looking at.
- Replacing the rule with the new value at every width would delete the
  narrow-viewport keyframe, breaking the page at a width the operator never
  opened.

A run whose size does not vary by viewport gains no rule from being resized: it
gets exactly the one write, and the edit is reported as changing exactly the one
field.

## Verification

Seed a run whose size varies across three widths, with the representative value
equal to the widest. Change its size through the surface and assert the save
succeeds reporting one field changed. Read the stored definition and assert the
representative value is the new one, that every keyframe has been scaled by the
same ratio, and that the widths are unmoved. Separately resize a run declaring a
flat size and assert its stored definition carries the new value and acquires no
per-width rule at all.