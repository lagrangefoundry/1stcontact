---
uid: comment-7495b6d4
id: COMMENT-667
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T20:15:47.354619+00:00'
updated_at: '2026-08-05T20:15:47.354619+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c6ed5d6e
  kind: note
---

**Result: PASS** — REPORT-1312 (`report-c6ed5d6e`), 0 violations, 1 warning, 0 needs_review.

## What I found

`capability-36dd68c5` (CAP-64) holds **zero stories → zero ACs → zero UATs**. The uat-level element set is empty, so the three properties are vacuously satisfied.

The critical detail: **the index lies about this.** `xgd ticket list --filter fields.capability_uid=capability-36dd68c5` returns a phantom STORY-76, which is exactly what would trick this check into validating five ACs that are no longer in scope. So I established emptiness positively rather than by trusting the filter — read all 12 real stories per-UID and recorded their `capability_uid`: `aa030c83` ×5, `ae9d65d6` ×5, `2049c9ec` ×2, and **zero** pointing at CAP-64.

I also verified the gradient intent isn't left unproven anywhere — located all five AC UATs and ran them:

```
Test Files  2 passed (2)
Tests  10 passed | 2 skipped (12)
```

All five AC-numbered UATs (AC-634…AC-638) passed, driving real entry points (`diffManifests` — the engine the `1c` CLI runs — plus `validateModuleContent` and `resolveSurfaceGradient`). The 2 skips are chromium-gated `test_UAT_FC_REQ-62_*` free-coding tests, not AC UATs, so no criterion is left unexercised.

## Two things I added beyond the ac-level report

- **The index defect is wider than previously recorded.** Beyond the known stale row: `list --type story` returns 21 entries for 12 real stories (duplicate rows), and human-ID lookup is broken for capability/story/AC types — `CAP-63`, `STORY-75`, `AC-634` all resolve "not found" while their UIDs work fine (`REPORT-1262` resolves normally). Any re-run before a rebuild must address tickets by UID throughout.
- **A real same-shape UAT redundancy**, out of scope here but flagged for CAP-63's cycle: `test_UAT_AC636_*` and the three `test_UAT_FC_REQ-62_*` diff tests assert the same three scenarios over the same fixture via the same `diffManifests` path — genuine duplication, not a unit/integration/browser split.

## Caveat on the PASS

This is not a statement that CAP-64 is healthy. It's an un-retired husk: `status: active`, `merged_into` set, no `superseded_by_uid`, body still claiming ownership and citing a rebalance report that doesn't exist. Those four violations are already recorded at story level in REPORT-1310 and are that cycle's to close — re-raising them here would triple-count one defect. The one thing a downstream editor must **not** do is read the empty UAT set as a coverage gap and author replacement UATs under CAP-64; that would duplicate the passing tests under CAP-63 and create the exclusivity violation this level exists to prevent.

Further cycles on CAP-64 will keep re-detecting the same husk until the lifecycle transition completes — this is the third attempt, and the empty-scope state is a consequence of the rebalance, not an unresolved earlier uat-level finding.
