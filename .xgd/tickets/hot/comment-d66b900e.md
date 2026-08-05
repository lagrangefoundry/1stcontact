---
uid: comment-d66b900e
id: COMMENT-661
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T19:51:29.847706+00:00'
updated_at: '2026-08-05T19:51:29.847706+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-2131c6a0
  kind: note
---

**PASS** — 0 violations, 2 warnings, 0 needs_review. Report: `REPORT-1306` (`report-2131c6a0`).

## What I found

**Structurally, this capability is empty.** CAP-65 was absorbed into CAP-63 (`capability-aa030c83`) by the 2026-08-05 rebalance — both member stories' ticket records now carry the new `capability_uid`. A stale index edge is what routed this check here. I verified this creates **no coverage hole**: the index lists the stories under CAP-63 *as well* (duplicated edge, not a moved one), so CAP-63's own run will see the same trees. Rather than return a vacuous pass, I followed the ac-level run's precedent and assessed the two stories' 17 UATs on their merits.

**The evidence is genuinely strong.** All 17 active ACs have exactly one AC-named UAT — clean 1:1, no orphans, no gaps. Every test drives a real entry point; mocking is confined to the browser boundary. I ran them rather than trusting the recorded `uat_coverage: pass`: **24/24 green in 1.09s**.

## The one finding worth acting on

**AC-639's Criterion has two halves, and only one is tested.** It claims the reference is read from the ladder at the selected width *and* "the reproduction is rendered at that same viewport." The test proves the first half but supplies the actual side as a static pre-rendered manifest — identical for its mobile and desktop runs. The render branch at `tools/generate/src/cli/fidelity.ts:167`, where the selected viewport is threaded into `extractDraftManifest`, is never entered. I confirmed this suite-wide: all 13 `cmdValuesDiff` call sites use `actualManifestPath`, zero use `slug`.

So deleting that `viewport` argument would reintroduce exactly the bug the story exists to fix — reference read at mobile while the reproduction renders at desktop — and no test would fail.

I classified it `uat-edit`, not `code-issue`: line 167 currently threads the viewport correctly, so the defect is in the evidence, not the production code. And I kept it a warning rather than a violation because the AC's own Verification section prescribes only the reference-side assertions and is satisfied in full — it's an under-specified clause, not a contradicted one.

The second warning is same-shape duplication between the reconciliation UATs and the older REQ-61 free-coded ones (`test_UAT_AC643` and its FC counterpart are verbatim equivalent). Worth noting the two findings interact: the tablet-rung assertion salvageable from the FC test and the render-branch case belong in the same extended `test_UAT_AC639`.
