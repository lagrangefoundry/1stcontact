---
uid: report-49dcea5c
id: REPORT-7198
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T01:57:59.128027+00:00'
updated_at: '2026-11-01T01:57:59.128027+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-159
---

I wrote 6 UATs for STORY-159, one per acceptance criterion. Five pass. The AC2080 test fails, and the failure is in the production code, not the test.

```
UATs generated for story STORY-159 (plan item 3 of 7)

Story: STORY-159
Test file(s) created:
  - tests/test_reconciliation_capture_site_reference_material.workers.test.ts

Tests written: 6
Tests passed: 5
Tests failed: 1
```

| AC | Test | Result |
|---|---|---|
| AC2044 | `test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report` | ✅ |
| AC2080 | `test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member` | ❌ |
| AC2081 | `test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts` | ✅ |
| AC2082 | `test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable` | ✅ |
| AC2083 | `test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members` | ✅ |
| AC2084 | `test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why` | ✅ |

⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - `test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member`: the code does not do what the AC asks. The test calls `capture_site` through the Worker's own router and chat host, with only the model and the browser doubled. The capture itself succeeds: the bundle `fixture.test/deployed` is stored. But the result comes back as `reference.adopted: false` with the reason "this deployment keeps no corpus, so the bundle was stored but not indexed". This is the story's Known gap 8, and the AC itself says it is expected to fail. The cause is in `apps/control-app/src/router.ts`: `sessionFidelity` calls `fidelityDeps(...)` without the adoption dependency, so no reference ticket is ever written on the deployed host. The fix is for `router.ts` to pass an adoption step bound to the request's ticket store. I did not weaken or change the AC or the test.

Notes:
- **Other tests used:** AC2044, AC2081–AC2084 call the production fidelity operations and `adoptCapture` directly, with real D1/R2 stores. The `1c` CLI is simulated by leaving out the adoption dependency. Only the browser and the image describer are doubled.
- **AC2044:** an older AC2044 test already exists in `tests/test_reconciliation_capture_site_egress.test.ts`, but it doesn't check the `reference` field. I left that file untouched and covered `reference` in the new test, so AC2044 now has a test in each file.
- **AC2083:** the reference store has no delete operation, so to simulate a member vanishing from a recapture the test deletes it straight from R2. To show a detached record can be recovered, it calls the ticket component's `unarchive` (which the project's `TicketStore` type doesn't declare), checks the record's bytes come back, then detaches it again.
- **Not run:** eslint couldn't run because the sandbox blocks downloading it from the npm registry. There's no root `tsconfig.json`, so I didn't get a real typecheck either. Vitest compiled and ran the file without errors. No runtime code or existing tests were changed.

test_files_created:
  - "tests/test_reconciliation_capture_site_reference_material.workers.test.ts"
