---
uid: comment-69589c12
id: COMMENT-7972
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T05:55:02.609276+00:00'
updated_at: '2026-11-08T05:55:02.609276+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-fe34a964
  kind: note
---

I filed the iteration-2 fix plan as REPORT-11297 (`report-fe34a964`). It has one batch, and it grants the builder permission to edit one production file, which code is normally frozen against.

**Only 2 of the 14 failures are still real.** The failure list in the prompt comes from a quality run made before iteration 1. Since then the iteration-1 builder fixed 9 tests by changing only the tests: the store helper in the three `reconciliation-material-description*` test files now passes `{ businessId: tenant }`. That should also clear the three orphaned-AC entries (AC-1693, AC-1697, AC-1698), since their only problem was failing tests. The two still failing are in the session test file:
- **AC2097:** no image request ever reaches the network.
- **AC2378:** the image description comes back `'failed'`.

**Cause.** At `apps/control-app/src/ai.ts:189`, `describerSession()` registers the backend without declaring its capabilities. The AI library then treats the image describer as unable to handle images and refuses every one before sending it. In real use, every image a client uploads would be stored as "describer failed".

**Ruling on the builder's `code_frozen` block: granted, decided at rung 2.** The reference state `reconcile-src-BUNDLE-40:apps/control-app/src/ai.ts:294-299` already fixes this under BUG-214, by passing `lib.ClaudeAPIBackend.capabilities` when registering the backend. That confirms the library accepts that argument, and that the code is wrong rather than the tests.
- The builder may edit only `ai.ts`.
- No test or AC changes.
- The validation run also includes every other test suite that uses `ai.ts`: FC_REQ-207, FC_REQ-173, FC_REQ-146, FC_REQ-122, AC1057, AC1404–1409 and AC1792–1794.

I also recorded two weak-evidence flags in the plan:
- The same store helper is copied into three test files, which is why one signature change broke all three at once.
- `test_UAT_FC_REQ_207_the_DescribeImage_seam_did_not_move` likely only checks the interface shape, so it could pass while every image is being refused.

When the report was filed, the sandbox blocked an outbound connection to `github.com:22`. Filing still succeeded, but whatever xgd tried to push or sync over SSH at that moment didn't go through.