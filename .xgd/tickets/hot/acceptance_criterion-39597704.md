---
uid: acceptance_criterion-39597704
id: AC-729
type: acceptance_criterion
title: A text-free media element folds to an image leaf with its resolved source and
  alternative text
created_by: xgd
created_at: '2026-07-29T04:04:57.769004+00:00'
updated_at: '2026-08-07T23:53:55.329123+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A text-free element carrying media substance folds to an L1 image leaf. The leaf
carries the source URL resolved at capture time and the element's alternative text
(falling back to its accessible name, else empty), a geometry track pinning all
four sides at every present sampled width, a stable identifier, its visibility rule,
and the image axes the language expresses (object fit, corner radius, opacity,
blend mode, border, shadow) — omitting any axis the element does not paint. A media
element captured with no resolvable source, or with no box at any sampled width,
produces no leaf at all: it is signalled as a residual rather than emitted as a
broken image.

## Verification
Fold a capture containing images; assert an image leaf exists per media element with
the captured source and alternative text, a height-bearing keyframe at each present
width, a stable id, and the expected axes; render it and assert the emitted markup
carries that source. Fold a fixture whose media element has no resolvable source and
assert no image leaf is emitted and a residual is signalled instead.