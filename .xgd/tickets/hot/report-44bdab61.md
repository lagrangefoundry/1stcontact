---
uid: report-44bdab61
id: REPORT-10873
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-04T17:25:14.240284+00:00'
updated_at: '2026-11-04T17:25:14.240284+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-4630e921
---

I wrote 17 UATs for story-4630e921, one per acceptance criterion (AC-2258 to AC-2274), and all 17 pass against the existing code.

- **Lint:** not run. ESLint isn't installed locally and the sandbox blocked downloading it from npm.
- **Types:** `tsc --noEmit` reported no errors in the two new files, but I didn't check whether the project's tsconfig includes `tests/`, so this may not have covered them.

**What's in the files:**
- **Workerd suite** (AC-2258 to AC-2269) runs against a real D1 with the shipped baseline schema. Events are produced through the product functions (`invitePerson`, `acceptTerms`, `ensurePlatformOperator`, `recordEvent`); only immutability, erasure and the event counts are checked with direct SQL.
- **AC-2260 (erasure cascades)** had no existing UAT, as the story noted, and is now covered. Deleting a contact succeeds, removes all of that contact's events, and leaves a sibling contact's events and another business's events untouched.
- **AC-2261** goes beyond the existing FC test: it writes 101 events to check the default cap of 100 drops the oldest, and checks that two events with the same time come back newest-written first on repeated reads.
- **Pane suite** (AC-2270 to AC-2274) mounts the installed people panel in jsdom, with only the HTTP transport faked. It covers all seven known kind labels and gives one contact an origin event that is not the last row shown. The no-controls check covers the whole History section, not just the list. The stylesheet check requires an exact class match, so `.builder-people__events` can't stand in for `.builder-people__event`.

**One self-correction:** in AC-2260 I first asserted that the delete changed one row. D1 counts the cascaded rows too (it reported 4), so the test now checks that the contact row is gone instead. No product code was wrong.

No runtime code, existing tests or tickets were modified.

```
UATs generated for story story-4630e921 (plan item 5 of 8)

Story: story-4630e921
Test file(s) created:
  - tests/reconciliation-contact-history-events.workers.test.ts
  - tests/reconciliation-contact-history-pane.test.ts

Tests written: 17
Tests passed: 17
Tests failed: 0

test_files_created:
  - "tests/reconciliation-contact-history-events.workers.test.ts"
  - "tests/reconciliation-contact-history-pane.test.ts"
```