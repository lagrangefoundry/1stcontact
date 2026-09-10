---
uid: acceptance_criterion-beb4d907
id: AC-710
type: acceptance_criterion
title: Each probe residual/finding is diagnostic — it identifies the offending leaves
  and the magnitude of the violation
created_by: xgd
created_at: '2026-07-22T20:07:41.211438+00:00'
updated_at: '2026-09-10T15:37:12.834856+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
When a probe does not pass, its report does not stop at a boolean: each reported item
identifies what failed and by how much, so the residual points at a specific
framework gap to feed back.

This criterion owns the **envelope-finding** diagnostic contract. Every finding the
analytic evaluator raises — under the off-sample probe and under the
content-robustness probe alike — carries:

- its **kind**: `overlap` for a sibling collision, and `clip` both for a leaf
  crossing the viewport edge and for a pinned box whose flow interior outgrows its
  keyframe height;
- a human-readable **detail** naming the violation *and its magnitude* — the
  overlapping extent, the distance past the viewport edge, or the measured content
  height against the pinned box height;
- the **index paths** of the leaves involved: both siblings for an overlap, the
  offending node for a clip.

The fidelity probe's own report shape — the residual's fields and the unmatched
coverage entry — is specified by AC-705 and is deliberately not restated here, so one
AC governs each report shape. This criterion adds only that a fidelity residual is
likewise diagnostic rather than a bare failure: it names the leaf it concerns and
carries the per-axis deltas, in whatever labelling AC-705 defines for text and
non-text leaves.

## Verification
Force an overlap, a viewport-edge clip and a pinned-box content overflow, and assert
each finding names its kind, a detail string carrying the offending magnitude, and
the index paths of the leaves involved — two paths for the overlap, the offending
node's for each clip. Force a fidelity residual and assert the reported item names
the leaf and its per-axis deltas rather than reporting only that the probe failed.