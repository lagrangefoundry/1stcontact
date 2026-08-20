---
uid: acceptance_criterion-beb4d907
id: AC-710
type: acceptance_criterion
title: Each probe residual/finding is diagnostic — it identifies the offending leaves
  and the magnitude of the violation
created_by: xgd
created_at: '2026-07-22T20:07:41.211438+00:00'
updated_at: '2026-08-20T14:39:41.248942+00:00'
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
identifies what failed and by how much, so the residual points at a specific framework
gap to feed back.

- A fidelity residual carries the run text, the width, and the per-axis deltas (dx, dy,
  dw), plus a coverage entry (text, width) for any oracle sample with no reproduced run.
- An envelope finding carries its kind (overlap or clip), a human-readable detail
  describing the violation and its magnitude, and the index paths of the leaves
  involved.
- The evaluator reports **three** envelope violations, and each carries that shape:
  1. **sibling overlap** — two intersecting leaf boxes, detailed by the two leaves and
     reported under `overlap` with both their paths;
  2. **horizontal clip beyond the viewport** — a leaf whose right edge exceeds the
     evaluated width, detailed with that edge and the viewport width, under `clip`;
  3. **pinned-box content overflow** — a flow container pinned to a fixed keyframe
     height whose flowed content height exceeds it. It is reported under `clip` too,
     with a detail naming **both** heights (the content height and the pinned box
     height) and the path of the **container** itself — not of a leaf inside it.

## Verification
Force a fidelity residual and assert the reported item names the run and per-axis
deltas. Force an overlap and a clip and assert each finding names its kind, a detail
string with the offending magnitude, and the involved leaf paths.

Pinned-box content overflow: evaluate a document holding a flow container whose pinned
keyframe height is smaller than the height its in-flow children stack to, and assert a
finding is reported with kind `clip`, a detail naming both the flowed content height and
the pinned box height, and the container's own index path. Assert no such finding is
raised when the same container's pinned height accommodates its content, and none when
the container carries no pinned height at all (it then sizes to its content).