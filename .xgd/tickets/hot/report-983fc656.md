---
uid: report-983fc656
id: REPORT-7555
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T10:33:48.906723+00:00'
updated_at: '2026-11-01T10:33:48.906723+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-7102ffe3
---

UATs generated for story story-7102ffe3 (plan item 5 of 10)

Story: story-7102ffe3

I wrote 15 UATs, one per acceptance criterion, and all 15 pass when run against the existing code. No runtime code, existing tests or tickets were changed.

| File | ACs | Result |
|---|---|---|
| `tests/test_reconciliation_business_scope.workers.test.ts` (workerd) | AC2117–AC2123, AC2125–AC2131 | 14 passed |
| `tests/test_reconciliation_business_scope_single_reader.test.ts` (node) | AC2124 | 1 passed |

**How the tests reach the code:**
- **Most ACs** go through the Worker's real `fetch`, with signed Access tokens, the real admission and scope checks, and real D1/R2 with every migration applied. Refusal tests check status, content type, `no-store`, the exact body, and the event in the log (`scope_refused` / `no_business` with its reason).
- **AC2127 (chat hosts per business)** calls the router's `route` directly. That's the only way to make a store opener fail once, which is needed to show a failed host build isn't cached. It runs real chat turns (with a scripted model client) and checks each business's transcripts and corpus for leaks.
- **AC2125 (empty scope)** hands the store openers bindings that throw if touched. That proves the refusal happens before any data access.
- **AC2124 (who reads `TENANT_ID`)** must run in the node project because workerd has no filesystem. It parses every source file under `apps/control-app/src`, including the `generated/` folder, with the TypeScript parser. It asserts the files that read the setting are exactly `identity.ts` and `scope.ts`, with no list of exempt files.

**Quality gates I couldn't run:** eslint isn't installed locally, and `npx eslint` failed because the sandbox blocks registry.npmjs.org. No tsconfig includes `tests/`, so the `tsc` build doesn't cover these files. Vitest compiled and ran both without errors.

Tests written: 15
Tests passed: 15
Tests failed: 0

test_files_created:
  - "tests/test_reconciliation_business_scope.workers.test.ts"
  - "tests/test_reconciliation_business_scope_single_reader.test.ts"
