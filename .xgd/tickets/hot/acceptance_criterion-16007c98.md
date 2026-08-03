---
uid: acceptance_criterion-16007c98
id: AC-766
type: acceptance_criterion
title: Anchored placement is emitted as a valid expression, so anchored nodes land
  at their rule position
created_by: xgd
created_at: '2026-08-03T01:34:33.018115+00:00'
updated_at: '2026-08-03T02:03:11.939072+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
Every compound horizontal placement expression the emitter produces for an
anchored node is emitted as a **single valid CSS length expression**, so the
browser applies it rather than discarding it. A column origin is itself a compound
expression, so any sum containing it must be wrapped as one calculation; emitted
bare it is not a legal value, the whole declaration is dropped silently, and the
node's left edge falls back to zero — slamming every anchored node to the page
edge while the document, the validator and the analytic checks all still look
correct.

The observable obligation is therefore stated over the **rendered position**: a
real browser places every anchored node at the value the column rule predicts, at
every width, with no anchored node landing at zero and no anchored node forced
outside the viewport.

## Verification
Render a document whose nodes anchor with a constant offset, with a fractional
share of the column, with a cap, and with a tracked offset; in a real browser
measure each node's left edge and width across the ladder and at widths between
and above the samples, and assert each equals the column rule's value. Assert no
anchored node reports a left edge of zero where the rule predicts otherwise and no
node overflows the viewport horizontally.