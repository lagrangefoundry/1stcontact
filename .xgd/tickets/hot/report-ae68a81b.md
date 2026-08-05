---
uid: report-ae68a81b
id: REPORT-1277
type: report
title: 'Overlap resolution: cluster 6'
created_by: xgd
created_at: '2026-08-05T18:01:02.707686+00:00'
updated_at: '2026-08-05T18:01:02.707686+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-31234d67
  cluster_id: '6'
---

## Cluster 6 Resolution

**Boundary**: Persisted multi-viewport ladder / acceptance oracle: capture-side artifact contract (1c) vs the retention guarantee the gate depends on (pipeline)
**Stories resolved**: 3
**Verdict**: confirm all three — no ticket changes. The shared noun ("the persisted ladder") is not a shared behavior.

### The boundary rule

Both capabilities already carve this explicitly in their own scope statements, and each
names the other as out of scope:

- **CAP-63 (1c Capture & Diff Fidelity)** claims *"the per-width reference screenshots
  capture persists"* — i.e. **what capture writes so that the diff commands can read it**:
  the ladder's value matrix, its per-width screenshot siblings, and every failure mode a
  `--size` diff hits when those artifacts are absent or incomplete.
- **CAP-71 (L1 Reproduction Pipeline)** claims *"oracle retention"* — i.e. **what the fold
  must not destroy and what the gate measures against**: the non-destruction invariant
  over the ladder, and the probe semantics that consume it.

Same artifact, different verbs. CAP-63 owns *produce-for-diff*; CAP-71 owns
*preserve-and-measure-for-gate*. Neither capability's UATs would catch the other's
regression, so collapsing them would lose coverage rather than remove duplication.

### Evidence the ACs do not duplicate

The two ACs that sit closest to the seam assert different things at different points in
the pipeline, and are covered by three distinct test files:

| AC | Story | Asserts | Test |
|----|-------|---------|------|
| AC-647 | STORY-77 | Capture emits one full-page reference screenshot **per ladder width** as image siblings, and the persisted value matrix carries **no image bytes** — the pairing contract for pixel `diff --size` | `tests/reconciliation-size-aware-diff.test.ts::test_UAT_AC647_capture_persists_per_width_screenshot_and_matrix_has_no_image_bytes` |
| AC-690 | STORY-84 | The **fold augments rather than replaces** the bundle: the raw ladder survives alongside the folded document and its sampled widths match the document's declared widths | `tests/reconciliation-l1-fold.test.ts::test_UAT_AC690_retains_raw_ladder_as_acceptance_oracle` |
| AC-705 | STORY-86 | The sample-fidelity probe **pairs and measures** reproduced leaf boxes against the retained oracle at every captured width | `tests/reconciliation-3probe-gate.test.ts::test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance` |

AC-647 verifies after a plain capture; AC-690 verifies after the fold; AC-705 verifies
inside the gate. No assertion is repeated.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-16f2793c (STORY-77) | confirm | capability-aa030c83 | (no change) | Seven of its eight ACs are the `values-diff` / pixel `diff` `--size` CLI surface — squarely diff fidelity. The one capture-side AC (AC-647) exists solely to give the pixel diff a same-width reference to pair against, so it belongs with the consumer that defines its contract, and CAP-63 names it in scope. |
| story-8acc338d (STORY-84) | confirm | capability-2049c9ec | (no change) | The fold story. Oracle retention (AC-690) is an invariant *of the fold* — "augments, does not discard" is only statable where the fold is — and CAP-71 names oracle retention in scope. Its other twelve ACs are all fold-emission behaviour with no capture-CLI content. |
| story-24098299 (STORY-86) | confirm | capability-2049c9ec | (no change) | The 3-probe gate and its analytic evaluator. It *reads* the oracle but defines none of the capture-side artifact contract; nothing here belongs to CAP-63. |

### Verification

- Every story remains assigned to exactly one capability; no story skipped.
- No merges performed, so no AC relationships were disturbed and no test renames are required.
- No `capability_uid` field was modified.
