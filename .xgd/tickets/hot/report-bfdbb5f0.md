---
uid: report-bfdbb5f0
id: REPORT-12070
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T23:51:33.961247+00:00'
updated_at: '2026-11-09T23:51:33.961247+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-aacb7060
  parent_report_uid: report-b5e1e434
  batch_index: '0'
---

All eight UATs for story-aacb7060 now pass: the five in `reconciliation-site-asset-promotion.workers.test.ts` and the three in `reconciliation-site-asset-placement.workers.test.ts`. I ran both files with vitest in workerd. No production code was changed.

The eight "orphaned acceptance criterion" entries were these same tests failing, so they should clear on the next gate run.

**What was wrong (all in the tests):**

1. **Missing `Scope` argument (all 8 tests).** Since REQ-168, `route()`, `ticketStoreFor()` and `projectKnowledgeFor()` take the business as a `Scope` argument instead of reading `TENANT_ID` from the env. The tests still used the old calls, which caused the 503s, the `D1_TYPE_ERROR` and the `businessId` of undefined. Both files now pass `{ businessId }` the way `test_UAT_FC_REQ-163_ingestion` does, and no longer set `TENANT_ID`.
2. **No describer wired (AC2015, AC2016, AC2017).** Since REQ-173, the material route answers 503 to any upload when the deployment can't describe files. The placement file wired no describer, so I stubbed `describeImage` and `describeText`. Both are model boundaries, and no criterion in this story reads their output.
3. **Re-promotion onto the same site (AC2015).** The test expected a second asset, `wordmark-2.png`. Since REQ-229, re-promoting a material onto a site where it already has a recorded name replaces the bytes at that name and creates no new one. The test now asserts the old name comes back, the site's asset list is unchanged, and the site is still listed once in `placed_on`. A *different* file under a taken name still gets a free name; AC-1711 and AC-2017 cover that and pass.

**Upstream change:** I updated AC-2015 (`acceptance_criterion-c8c0375c`) so its criterion and verification describe the re-placement behaviour, with a commit message explaining why. The story itself didn't need changing: its "never overwrites" rule is about a client dropping a *second* file under the same name, and that still holds.

**Not checked:** no tsconfig covers `tests/` and ESLint isn't installed, so the edited files weren't type-checked or linted beyond vitest running them. Nothing is committed; the edits are left for the reconcile workflow.

```yaml
## Assessment
blocked_by: null
status: fixed
```