---
uid: report-b89e67b8
id: REPORT-2922
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-31T12:33:15.662275+00:00'
updated_at: '2026-08-31T12:33:15.662275+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-17ba490e
---

Only the new test file exists — no runtime code and no existing tests were touched.

**Notes on how the ACs mapped to assertions:**

- Each of the 10 ACs got exactly one test, named `test_UAT_AC{1428..1437}_*`, with input variants looped inside the single test rather than split across `it.each` (which would have produced duplicate or non-conforming names).
- **AC-1428** and **AC-1437** both required discovering stored sites *at verification time*. Both enumerate `storage/sites/` and assert the enumeration is non-empty first, so neither can pass vacuously. AC-1428 additionally walks `readHistory` and validates every published revision, not just drafts.
- **AC-1433** goes beyond the existing FC test by pairing each bad value with a corrected one and asserting both the corrected and the field-removed definitions validate — that's what makes the refusal attributable to the field rather than the fixture.
- **AC-1431** renders through both paths and compares the two artifacts, rather than asserting they share an implementation.
- Rendering claims are asserted on the emitted `<html …>` tag; resolution-only claims on `resolveSiteLocale`. Where an AC asks for both (AC-1429, AC-1430, AC-1432, AC-1434), both are asserted.

```
UATs generated for story story-17ba490e (plan item 10 of 11)

Story: story-17ba490e
Test file(s) created:
  - tests/reconciliation-site-locale-identity.test.ts

Tests written: 10
Tests passed: 10
Tests failed: 0

test_files_created:
  - "tests/reconciliation-site-locale-identity.test.ts"
```

No code/AC divergence was found — every AC passed against the existing implementation on the first run, with no self-corrections needed. Two incidental observations, neither a test failure: the vitest run emits a wrangler `EPERM` log-write error (sandbox artifact of workspace config loading), and `tsc -p tsconfig.base.json` reports 1630 pre-existing errors across the repo — after the one tidy-up above, none of them are in the new file.
