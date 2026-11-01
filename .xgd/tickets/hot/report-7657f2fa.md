---
uid: report-7657f2fa
id: REPORT-7797
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T18:14:12.554514+00:00'
updated_at: '2026-11-01T18:14:12.554514+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-7102ffe3
  parent_report_uid: report-1a9fddd1
  batch_index: '0'
---

I fixed this batch by deleting `tests/test_reconciliation_business_scope.workers.test.ts`, which a later UAT pass had replaced but nobody removed. No production code and no tickets changed, and nothing is committed yet: the deletion is staged with `git rm`.

**Why the 13 tests failed.** The old file (added in commit `1abb041c3f`) was written against the data model as it was before REQ-185 and REQ-186:
- It imported `provisionInvite` from `identity.ts`. REQ-186 removed that function and moved the person-plus-business setup into the `inviteAccount` test helper, so 12 tests failed with `provisionInvite is not a function`.
- AC2131 inserted into `users.platform_admin`, a column that migration 0007 renamed to `platform_operator`, so D1 refused the insert.

**Why deleting it is safe.** The later UAT pass (commit `378458660e`) added `tests/test_reconciliation_business_scope_operator.workers.test.ts`. Its header says it carries the earlier story's cases forward onto the new model. It has a test for every AC the old file covered (AC2117–AC2123 and AC2125–AC2131), with the same names except AC2121, now `..._platform_operator_operates_any_live_business_...` to match the renamed flag. It also adds AC2166 and AC2167. Fixing the old file would only have given two copies of the same tests.

**Result.** The replacement suite passes, 16 of 16, run in the Workers runtime against real D1 and R2. That includes every failing test in this batch, AC2121 under its new name. Before the deletion, those same 16 tests were already passing while the 13 old-file tests failed.

**AC and story.** No ticket edits were needed: the ACs and the story already describe `platform_operator`, so the problem was only the test code.

**One leftover.** A code comment at `tests/reconciliation-product-ticket-store.workers.test.ts:228` still names the deleted file. It's only a comment and the file is outside this batch, so I left it alone.

```yaml
## Assessment
blocked_by: null
```
