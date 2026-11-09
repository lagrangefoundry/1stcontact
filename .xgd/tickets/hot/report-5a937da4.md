---
uid: report-5a937da4
id: REPORT-11985
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-09T18:33:39.916808+00:00'
updated_at: '2026-11-09T18:33:39.916808+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-ed976856
---

I wrote 13 UATs for story-ed976856, one per acceptance criterion, and all 13 pass. No runtime code was changed and no existing test file was touched.

```
UATs generated for story story-ed976856 (plan item 4 of 6)

Story: story-ed976856
Test file(s) created:
  - tests/reconciliation-image-editing-recipe.workers.test.ts

Tests written: 13
Tests passed: 13
Tests failed: 0

test_files_created:
  - "tests/reconciliation-image-editing-recipe.workers.test.ts"
```

**How the tests work.** They run in the Worker test suite, against the local database, file storage and Images binding. Each test goes in through a real entry point:
- the material file route, `GET /api/material/file`;
- the assistant's session. The model is scripted to call `edit_image`, `list_image_edits` or `screenshot`.

The only stand-ins are at outside boundaries:
- **The AI model client.**
- **A recording wrapper around the real Images binding.** It forwards every call and notes each transform step it was given. Crop and colour changes are checked against those notes, never against pixels, because the local renderer silently ignores them.
- **A binding that fails on every transform, and one that can only convert formats.**
- **A browser that never starts.** A stored PNG is looked at without one, but the assistant only gets the looking tool when a browser is configured.

**Where the code doesn't match the AC wording (AC-2544 and AC-2542).** Three malformed calls never reach `edit_image`, so they get the framework's parameter error instead of a `REFUSED` code:
- a recipe that is not a list (`'edits' must be an array`);
- an entry that is not an object (`'edits' entry 0 must be an object`);
- a call with `edits` missing (`edit_image requires parameter 'edits'`).

In all three the call is refused, the message names what was wrong, and the stored recipe is unchanged. The tests check exactly that, and mark these cases separately from the ones that do carry `(REFUSED)`. I treated this as the AC asking for more than the code can show at this entry point, not as a bug. Requiring `REFUSED` here would mean loosening the surface's declared parameter types. Someone should decide whether to reword the two ACs.

**Two things I couldn't do:**
- **AC-2551 orphan sweep.** No orphan sweep exists in this repo or its generated ticketing library, so the test can't run one. Instead it checks three things: renditions are stored under `rendition/<tenant>/`; nothing in the `t/<tenant>/` area (what the sweep would scan) is a rendition; and a later fetch is served without a new transform.
- **Lint.** ESLint isn't installed in this worktree, and the sandbox blocked downloading it from npm. No tsconfig covers `tests/`, so there was no type-check to run either. The file has not been linted; the quality gate will need to do that.