---
uid: report-db289e41
id: REPORT-11993
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T19:15:22.306444+00:00'
updated_at: '2026-11-09T19:15:22.306444+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-1500b111
  parent_report_uid: report-d1a7a69b
  batch_index: '0'
---

All six failing tests in this batch now pass. The fixes are in the six builder files the exception allowed, plus the expectations in two test files.

**Production fixes (under the `code_frozen` exception):**
- **Chat addresses with a business prefix** (`api.js`): `materialUidFromUrl` now accepts the material file address with or without the `/b/<business>` prefix. It still refuses addresses naming a single file inside a capture, and addresses from anywhere else. This was the fault in the chat test (AC-2554).
- **Modal could not be reopened** (`image-editor.js`, `library.js`, `app.js`): the modal now tells its caller when it closes, by the Close button, Escape or the backdrop. Before, those exits never cleared the caller's handle, so the picture couldn't be opened again from the pane or the chat. This fixes the reopen steps in AC-2554 and AC-2558.
- **Rename from elsewhere** (`library.js`): when the change feed reports a new name for the material that is open, the name field, the picture's alt text and an open modal are all updated. Nothing changes while the client is typing a name.
- **Empty name** (`material-name.js`): the name field no longer marks itself as required. That built-in check refused the empty box with the component's own message before our check ran. Now an empty name sends nothing, puts the old name back and shows "Give it a name — this is what you will find it by." (AC-2556).

**Test-only fixes (AC-1718):** both tests expected only the description and role to be editable. AC-1718 now also includes the Library name on every material, so they expect that field too:
- `reconciliation-library-tab.test.ts`: `['role', 'title', 'body']`
- `reconciliation-library-role-correction.test.ts`: `[body, role, title]` for uploads, `[body, title]` for fetched and captured material

No ticket edits were needed; the ACs and the story already describe this behaviour.

**Test runs:**
- The image-modal suite passes 8 of 8, with none skipped.
- 13 Library and builder test files pass (55 tests).
- Filtered to this batch's names, 109 tests pass across 18 files. One file, `test_reconciliation_business_scope_operator.workers.test.ts`, fails before running any test because `db/migrations/0005_operator_membership.sql` is missing. That file is outside this batch and none of my changes touch it.
- Lint did not run: `eslint` isn't installed here, the sandbox blocks the npm registry, and `package.json` has no lint script.

The changes are not committed.

```yaml
## Assessment
status: fixed
files_changed:
  - apps/control-app/src/builder/api.js
  - apps/control-app/src/builder/app.js
  - apps/control-app/src/builder/library.js
  - apps/control-app/src/builder/image-editor.js
  - apps/control-app/src/builder/material-name.js
  - tests/reconciliation-library-tab.test.ts
  - tests/reconciliation-library-role-correction.test.ts
verified: "vitest: image-modal 8/8; library/builder suites 55/55; batch name filter 109 passed in 18 files; 1 unrelated suite fails at load (missing db/migrations/0005_operator_membership.sql); lint not run (eslint unavailable)"
```