---
uid: report-8610e3f9
id: REPORT-7216
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T02:27:34.900354+00:00'
updated_at: '2026-11-01T02:27:34.900354+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: STORY-144
  parent_report_uid: report-b4d04353
  batch_index: '0'
---

All six failing tests in this batch now pass, and I only changed test files; no production code was touched. The run covered the three affected files: 8 of 8 tests passed (3 of 3 files), including AC-1724, which was already passing.

**Root cause:** since REQ-173, `POST /api/material` refuses an upload with 503 unless a describer is configured (`aiConfigured` at `apps/control-app/src/router.ts:444`). These tests' `deps()` supplied none, so every upload was refused. That one cause explains all six failures: empty lists, 404s, `ticket not found: undefined`, and missing `description_status`.

**Fixes:**
- **`tests/reconciliation-library-surface.workers.test.ts`** (AC-1719 through AC-1723): `deps()` now includes a stub `describeText` that returns a fixed digest, the same pattern the REQ-161 suite uses. The image describer stays absent, so images still come back `no_describer`, which is what AC-1720 depends on.
  - AC-1722's check on the single item used to look for `'late-night bakery'` from the file's raw text. Since REQ-173 the body is a digest, not the extracted text, so it now asserts `item.body === DIGEST`: the stored description, exactly. That's a stricter check than before.
- **`tests/reconciliation-material-row-content-type.workers.test.ts`** (AC-1813): `deps()` now includes a stub `describeText`.

Every test still makes its uploads through `route()` against real D1 and R2, and no assertion was weakened.

**Not done:** AC-1722 still explains its rule with "a description is a document's extracted text", which has been out of date since REQ-173. I tried to correct that wording with `xgd ticket update`, but the permission mode denied the command. The criterion itself (no descriptions in the list, the item adds one, everything stays within the account) is still correct and is what the test checks, so nothing here depends on the edit. Correcting the wording is an optional follow-up.

The AC-1722 wording is out of date, but the tests don't depend on it, so nothing blocks this batch:

```yaml
## Assessment
blocked_by: null
```
