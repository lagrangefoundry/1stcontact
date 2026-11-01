---
uid: report-e01dcbe2
id: REPORT-7581
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T12:00:12.201939+00:00'
updated_at: '2026-11-01T12:00:12.201939+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-387c9dfe
---

I wrote 12 UATs for story story-387c9dfe, one per acceptance criterion, and all 12 pass against the existing code. No runtime code or existing tests were changed. I couldn't run lint: eslint isn't installed in this worktree and the sandbox blocked downloading it from npm, so lint status is unknown.

```
UATs generated for story story-387c9dfe (plan item 8 of 10)

Story: story-387c9dfe
Test file(s) created:
  - tests/test_reconciliation_business_fulfilment.workers.test.ts   (AC2149–AC2157, run in workerd)
  - tests/test_reconciliation_business_fulfilment_guards.test.ts    (AC2158–AC2160, static source checks)

Tests written: 12
Tests passed: 12
Tests failed: 0

test_files_created:
  - "tests/test_reconciliation_business_fulfilment.workers.test.ts"
  - "tests/test_reconciliation_business_fulfilment_guards.test.ts"
```

- **Request tests (AC2149–AC2157):** each one sends a request through the worker's real `fetch` entry point, with a real D1 database and a real signed Access token. Only the external key-set download is stubbed. Results are checked through the same admission lookup the product uses.
- **Source checks (AC2158–AC2160):** each scan covers the whole builder server source except generated output, and reports file and line on a violation. Each is also run against a sample containing the forbidden shapes, so it can't pass by matching nothing.
- **AC2160 scope:** I limited this scan to `apps/control-app/src`, the builder's server as the criterion states. The original free-coded guard also scanned `apps/public-site/src`.

The `test_UAT_FC_REQ-180_*` free-coded tests are untouched. Renaming or deleting them is left to the later reconcile step.
