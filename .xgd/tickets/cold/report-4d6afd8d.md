---
uid: report-4d6afd8d
id: REPORT-754
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-22T20:55:58.701567+00:00'
updated_at: '2026-07-22T20:55:58.701567+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-79
---

All checks pass. Here's the completion report.

---

```
UATs generated for story STORY-79 (plan item 9 of 9)

Story: STORY-79 (story-e15a19ef)
Test file(s) created:
  - tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts

Tests written: 1
Tests passed: 1
Tests failed: 0

test_files_created:
  - "tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts"
```

**Scope note (important):** STORY-79 has 5 ACs, but 4 of them (AC-656, AC-657, AC-658, AC-659 — guarantees 1–2, boolean-flag parsing and `--json`/stdout hygiene) were reconciled in the **prior** bundle (bundle-ab9e0cb6) and already carry passing `test_UAT_AC{N}_*` coverage in `tests/reconciliation-1c-cli-output-hygiene.test.ts`. This plan item (9 of 9, BUNDLE-7, bundle-31e474b9) reconciles **guarantee 3 only** — `aligned-crops --sandbox` store routing — whose AC (**AC-720**) had no `test_UAT_AC720_*` yet.

I wrote exactly one new UAT for AC-720, preserving the system's 1:1 AC↔test mapping (writing new tests for 656–659 would have duplicated existing AC tests). It verifies at the `subRenderOptions` seam — precisely the "options handed to its render and serve" the AC's verification names — across three invocation variants: `--sandbox` with default `draft` source, `--sandbox` with explicit `published`, and no-`--sandbox` falling through to `sites/` while preserving `source`.

Constraints honored: no runtime code changed, no existing tests modified, naming validated against `^test_UAT_AC\d+_\w+$`.

One thing outside my scope worth flagging for the downstream review step: the FC test `test_UAT_FC_REQ-79_*` still lives in `tests/req78-aligned-crops.test.ts`. The FC-orphan gate (reconciliation_review's job, not uat_generation's) will need to rename or delete it against AC-720.
