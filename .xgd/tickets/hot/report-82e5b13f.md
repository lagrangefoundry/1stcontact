---
uid: report-82e5b13f
id: REPORT-10877
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-04T17:36:25.726508+00:00'
updated_at: '2026-11-04T17:36:25.726508+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-7d255580
---

UATs generated for story story-7d255580 (plan item 6 of 8)

Story: story-7d255580 (STORY-168)
Test file(s) created:
  - `tests/test_reconciliation_outgoing_messages.test.ts` (Node: AC-2279, AC-2280, AC-2284, AC-2285)
  - `tests/test_reconciliation_outgoing_messages.workers.test.ts` (workerd with real D1/R2: AC-2275, AC-2276, AC-2277, AC-2278, AC-2281, AC-2282, AC-2283, AC-2286)

Tests written: 12
Tests passed: 11
Tests failed: 1

⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - `test_UAT_AC2281_message_body_reaches_the_provider_as_html`: the provider received no `html` field (`payload.html` is `undefined`). The Resend adapter in `apps/control-app/src/mail.ts:200` still sends the body as `text: message.body`. This is the CODE-ISSUE already recorded in the story's Reconciliation Decisions. The code is wrong, not the test, so I left the assertion unchanged. The fix is the one-field, one-line adapter change that REQ-196 described.

Notes:
- **Linting not run:** ESLint isn't installed locally, and fetching it from the npm registry was blocked by the sandbox. Both files compiled under vitest's transform.
- **Committed-credential scan (AC-2280):** it checks every git-tracked file except those under `tests/` and `.xgd/`. Test files legitimately contain fake `re_…` values.
- **Router redaction (AC-2280):** it's exercised through `route()` on `GET /api/sites`, using a store double that throws an error containing the key.

test_files_created:
  - "tests/test_reconciliation_outgoing_messages.test.ts"
  - "tests/test_reconciliation_outgoing_messages.workers.test.ts"