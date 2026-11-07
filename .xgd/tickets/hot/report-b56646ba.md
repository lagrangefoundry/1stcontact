---
uid: report-b56646ba
id: REPORT-11193
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-07T22:58:41.310640+00:00'
updated_at: '2026-11-07T22:58:41.310640+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-05835b4c
  parent_report_uid: report-0b15e2c3
  batch_index: '0'
---

Everything in scope passes, so I made no edits.

I ran the 13 test files in scope one at a time with `npx vitest run <file>`, because the planner noted that a single run over the whole scope was killed (exit 137). All of them passed:

| File | Tests |
|---|---|
| `tests/test_UAT_FC_BUG-57_smoke_checks.test.ts` | 12/12 |
| `tests/test_UAT_FC_BUG-62_denial.workers.test.ts` | 7/7 |
| `tests/test_UAT_FC_REQ-186_invite_control.test.ts` | 6/6 |
| `tests/test_UAT_FC_REQ-199_contact_routes.workers.test.ts` | 8/8 |
| `tests/test_UAT_FC_REQ-199_contacts_tab.test.ts` | 14/14 |
| `tests/test_UAT_FC_REQ-199_invite_send.workers.test.ts` | 15/15 |
| `tests/test_UAT_FC_REQ-200_apex_and_session.test.ts` | 9/9 |
| `tests/test_UAT_FC_REQ-203_signup_provisions_business.workers.test.ts` | 12/12 |
| `tests/reconciliation-published-site-serving.test.ts` | 8/8 |
| `tests/reconciliation-terms-of-service-gate.workers.test.ts` | 11/11 |
| `tests/test_reconciliation_contact_axes_migration.workers.test.ts` | 1/1 |
| `tests/test_reconciliation_contact_axes.test.ts` | 3/3 |
| `tests/test_reconciliation_contact_axes.workers.test.ts` | 5/5 |

That is 111 tests across the 13 files. All 25 AC IDs in the batch appear in these files, and none of the in-scope tests live outside `tests/`.

The report (REPORT-11185) counts 204 tests and I count 111. I didn't track down why. Since the counts are for whole files, the gap is probably a difference in how the report scoped the tests, not missing tests. Wrangler also logs an error on every run because the sandbox blocks writes to `~/Library/Preferences/.wrangler/logs`; it has no effect on the results.

As the planner asked, I left AC-2208 and AC-2137 alone, and I didn't touch production code or any tickets.

```yaml
## Assessment
status: pass
edits: none
blocked_by: null
evidence: "13 in-scope files run individually with `npx vitest run <file>`: 111/111 tests passed, 0 failures"
```