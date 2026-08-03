---
uid: report-6f15c837
id: REPORT-1127
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-08-03T03:10:38.824198+00:00'
updated_at: '2026-08-03T03:10:38.824198+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-24098299
  parent_report_uid: report-0ca6b136
  batch_index: '0'
---

Both batch failures fixed. Root cause was a single behavior change the tests hadn't caught up with.

## What the frozen code actually does

REQ-93 changed how the fold treats captured form controls:

- A control **with** geometry is *expressible*. `foldToL1` pins an `L1Slot` node at its captured rect (`fold.ts:1858-1866`) for a behavior module to mount into — it never fakes an `<input>`. `slot` is not a kind `sampleFidelityProbe` grades, so it enters neither pairing queue.
- A control **without** geometry at any width has no rect to pin a slot at, so it stays a `field` fold residual (`fold.ts:1860`).

`oracleBoxes` still excludes `control`/`empty`/`unknown` from the measure (`probes.ts:467`), so the fidelity-scope claim both ACs rest on is unchanged — it was only the "produces no node at all" wording that was wrong.

## Test fixes

**`test_UAT_AC705_...`** (`tests/reconciliation-3probe-gate.test.ts:392`) — the `mixedKindOracle` control mounts as a slot, so the tree carries 5 nodes, not 4. Corrected the expectation to `['box','image','image','slot','text']` and added an explicit `slot` count assertion, so the test now proves the control became a *mount seam rather than a graded leaf* — which is exactly why it's excluded from the measure (the following `unmatched === []` assertion).

**`test_UAT_AC737_...`** (`tests/reconciliation-3probe-gate-evaluator.test.ts:605`) — `gapCapture`'s control had a box, so it mounted into a slot and was correctly *not* a folder-power gap; the fixture no longer contained the `field` gap it asserted. Added a second, geometry-less control (`accessibleName: 'Phone'`) and asserted `fieldGaps` has length exactly 1 with a reason naming the missing geometry. This is stronger than the original: it now proves the gap/seam discrimination in both directions — a broken fold that residualised every control would report 2 and fail.

## Upstream propagation

Both ACs described behavior the code doesn't have, so I corrected them via `xgd ticket update`:

- **AC-705** (`acceptance_criterion-330b48e4`) — "elements that never become leaves" → "never become a **graded** leaf", with a paragraph distinguishing the two excluded classes (empty run → no node; control → a `slot` seam). Verification updated to "four graded leaves alongside the single `slot` node".
- **AC-737** (`acceptance_criterion-fd72d9d4`) — added a "reports the gap, not the seam" clause and a verification paragraph for the discrimination the test now proves.

I left the story (`story-24098299`) unchanged — its scope already covers behaviour slots and the set-aside class, so it wasn't misaligned.

## Verification

Full suite: **848 passed, 1 failed** (`132s`). The one failure is `test_UAT_FC_BUG-17_fold_gigabytealchemy_badge_padding` — `ENOENT` on `storage/references/gigabytealchemy.ai/index/multistate.json`. That path is gitignored (`.gitignore:146`), so the test needs a local capture bundle absent from this worktree. Pre-existing and environmental, not in this batch, and not caused by my edits — my only changes are the two test files shown in `git status`. No production code was touched.
