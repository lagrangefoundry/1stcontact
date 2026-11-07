---
uid: comment-aedc1729
id: COMMENT-7939
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-07T21:31:12.948608+00:00'
updated_at: '2026-11-07T21:31:12.948608+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-405afb8b
  kind: note
---

I filed the fix plan as **REPORT-11178 (`report-405afb8b`)** against `report-05835b4c`. It's one batch with an `aligned_to_tip` ruling on AC-2208. During filing, an outbound connection to `github.com:22` was blocked by the sandbox, so any automatic sync of the report to the remote didn't happen; the report itself exists locally.

**Root cause:** the production code is fine. The tests are out of date: three older test files set up their data using functions and schema that later tickets removed, and five ACs have no tests carrying their AC number.

| Failing ACs | Test file | Why it fails |
|---|---|---|
| AC-2132–2142 (11) | `reconciliation-terms-of-service-gate.workers.test.ts` | It imports `provisionInvite`, which no longer exists in the working tree or at `reconcile-src-BUNDLE-38`. The import fails, so every test in the file fails. |
| AC-2203–2207 | `test_reconciliation_contact_axes.workers.test.ts` | Its helper inserts straight into `users` with an `email` column and no `account_id`. `account_id` is now required (REQ-194), and addresses live in `user_emails` (REQ-191). AC-2205 also invites by `{email}`, but invites now take contact ids (REQ-199). |
| AC-2208 | `test_reconciliation_contact_axes_migration.workers.test.ts` | It imports migrations `0001`–`0008` and treats `0009` as the pipeline-stage migration. REQ-190 folded all of those into `0001_baseline.sql`. |
| AC-2210 | `test_reconciliation_contact_axes.test.ts` | The test data gives each person a plain `displayName`, but rows read `person.name.displayName`, so every row shows "No name yet". |

**Orphan ACs:** AC-2333, AC-2334, AC-2335 (REQ-200) and AC-2356, AC-2357 (BUG-57) are already exercised by existing tests that are named by ticket instead of by AC. The plan points the builder at the specific tests that cover each one so it can add tests carrying the AC numbers. The other 18 orphans are the failing ACs above and will link once their tests run.

**Ruling on AC-2208:** I aligned it to the reference state. There is no pipeline-stage migration at the reference: `pipeline_stage DEFAULT 'lead'` is a column in the baseline (`0001_baseline.sql:449`). The bundle also says the database "has been wiped rather than migrated", so no ticket in scope needs the backfill. The builder rewrites AC-2208 to drop the backfill half and keep the claim about the seeded platform operator.

**Not verified:** the workers tests can't run in this sandbox (`listen EPERM 127.0.0.1`), so the causes for the three workers files come from reading the code and schema, not from tracebacks. I reproduced the AC-2210 failure locally.