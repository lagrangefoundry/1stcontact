---
uid: comment-7a0b4ffb
id: COMMENT-659
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T19:41:22.230461+00:00'
updated_at: '2026-08-05T19:41:22.230461+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3738aebe
  kind: note
---

**Result: PASS** — `REPORT-1303` (`report-3738aebe`), 0 violations, 2 warnings, 0 needs_review.

## What I found

**CAP-65 holds zero stories — by design, not by drift.** The 2026-08-05 structural rebalance (`report-bdaf6840`) absorbed it into CAP-63 `1c Capture & Diff Fidelity` (`capability-aa030c83`). REQ-61's diff-side scope survives verbatim as scope bullet 3 of the absorbing capability's body, so no intent was lost.

**A tooling trap worth knowing about.** `xgd ticket list --filter fields.capability_uid=capability-18a822ac` still returns STORY-77 and STORY-78 with stale `2026-07-24` timestamps — on the branch *and* on `--branch main`. The ticket files say `capability_uid: capability-aa030c83`, `last_field_updated: capability_uid`, updated 2026-08-05T17:24. The index is stale; I validated against the tickets. Human-ID lookup is also broken here — `xgd ticket get STORY-77` returns `TICKET_ID_NOT_FOUND`, only UIDs resolve. Both are the defects `report-bdaf6840` already filed against the xgd system repo.

**Intent ledger:** REQ-61 is the sole originating intent (via BUNDLE-6, merged at `7a42e182`). Nothing retires size-aware diffing — notably the L1 pivot didn't, since BUG-15 repaired values-diff *for* L1 rather than removing it. REQ-61's two reproduction-side asks (per-breakpoint dials, nav collapse treatment) belong to `capability-ae9d65d6`, and CAP-65's body correctly scopes itself to the diff side, so their absence isn't a gap here.

I verified both story bodies against shipped code rather than taking them on trust — `--size` on both commands (`cli/index.ts:158,168`), the fail-loud `screenshot-<width>.png` message (`perceptual.ts:419-431`), and `responsive-diff.ts` with its two test files.

## The two warnings

Both are stale cross-references the rebalance left behind when it moved `capability_uid` without touching story bodies: STORY-78 still says "Belongs to CAP-65", and STORY-77 says "Generalizes CAP-63 (1c Values-Diff Fidelity)" — which now names its own renamed parent. Neither affects pass/fail, and both now sit in CAP-63's tree.

## One judgment call to flag

I classified the empty story tree as `info`, not a coverage violation. By the letter of the rule REQ-61's behavior is no longer expressed in *this* capability's tree — but the only repair shapes available to a downstream editor (`ac-add`, `story-body-edit`) would push toward re-homing the stories, undoing the rebalance this same regression run just performed. Same reasoning for CAP-65 still being `status: active` rather than `deprecated`: that's blocked by the index defect, provably not fixable by the matrix editor. If you'd rather these surface as hard failures to force the index fix upstream, that's a one-line change to the report — say the word.
