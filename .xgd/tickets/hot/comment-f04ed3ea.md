---
uid: comment-f04ed3ea
id: COMMENT-664
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-05T19:58:37.140084+00:00'
updated_at: '2026-08-05T19:58:37.140084+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-429febbc
  kind: note
---

Assessment complete. **Verdict: PASS** (REPORT-1309 / `report-429febbc`).

## What I found first

The capability looked empty. `xgd ticket list` returned two stories under it, but `xgd ticket get` on those stories returned a *different* capability — they'd been reassigned to CAP-63 by the 2026-08-05 structural rebalance. Checking both stores revealed a divergence:

| Store | STORY-77 / STORY-78 `capability_uid` |
|---|---|
| this regression worktree | `capability-aa030c83` (rebalance applied) |
| canonical `main` | `capability-18a822ac` (not propagated) |

So a vacuous "zero stories → PASS" was available. I didn't take it — the two size-aware-diffing stories are this capability's subject matter under either store, and returning PASS on an apparently-empty capability risked 17 ACs going unassessed this round. Double-assessment (if CAP-63's scope also runs) is idempotent; skipping is not.

## The actual assessment

**17 ACs, all pass. 2 stories, both pass.** Every behavior traces to `bundle-ab9e0cb6` (REQ-61/REQ-58, `free_and_reconciled`). I checked the two later reconciled bundles — both purely additive, nothing retired. Zero deprecation candidates.

I ran the UATs rather than trusting the field values: **17/17 passing.** They clear the substantive-cover bar — real entry points (`cmdValuesDiff`, `cmdDiff`, `cmdCapturePage`, `run(argv)`), the only fake is a `BrowserDriver` at the external boundary, and the assertions discriminate: AC-643 asserts `meanDiff ≈ 0` against a tablet reference where a desktop fallback would yield ~190; the fail-loud ACs additionally assert no artifact was written, so a silent-fallback implementation can't pass.

One caveat worth flagging: `.xgd/uat_index.json` reports `status: "missing"` for **all 17** tests. That's a run-record gap, not an authoring gap — same index fragility REPORT-1266 documented. Had I trusted the index over the filesystem I'd have reported 17 false coverage violations.

## Three warnings, zero violations

1. **STORY-78** body says "Belongs to CAP-65" — now points at a capability that no longer holds it.
2. **STORY-77** body says "Generalizes CAP-63" — post-rebalance it lives *inside* CAP-63, so it reads as self-reference.
3. **CAP-65** is absorbed but still `status: active`; deprecation blocked by the stale index (already raised in REPORT-1266).

I flagged findings 1 and 2 as **deferred**: both should wait on the worktree/`main` divergence being settled. If the rebalance propagates, both bodies want CAP-63; if it's rolled back, finding 1 evaporates and finding 2 is already correct. Editing now guarantees rework in one branch.

Everything unresolved here traces upstream to the two index defects REPORT-1266 raised against the xgd system repo — not to this project's matrix.
