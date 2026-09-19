---
uid: comment-f815bbf4
id: COMMENT-3260
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-19T14:40:34.081846+00:00'
updated_at: '2026-09-19T14:40:34.081846+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-87a0a6e9
  kind: note
---

Only test-file changes; no runtime code touched.

## What I found

Plan item 7 was **largely pre-applied by an earlier pass of this same bundle**. All 12 of story-6ccaedd5's ACs already had UATs on disk:

- `tests/reconciliation-material-ingestion.workers.test.ts` — AC-1678…AC-1687 (10 tests)
- `tests/reconciliation-material-content-type-resolution.workers.test.ts` — AC-1809, AC-1810 (2 tests, the BUG-41 content-type settlement ACs)

So no new file was warranted — creating one would have produced duplicate AC mappings. Two real gaps remained, both of which I closed in the story's own existing UAT file:

**1. AC-1682's restated claim was unverified.** The AC now says the filename consultation "repairs the *content type itself*, not the kind alone," and its verification demands: *"for the two repaired cases assert the recorded type on the stored bytes is the repaired one rather than the generic one."* The existing parameterized test asserted only `kind`. I added `recorded` to each of the five cases and now assert both `attachment.content_type` (envelope) and `ticket.fields.content_type` (read back through a fresh store handle) — so the half-repair the AC exists to exclude (`kindOf` files it correctly while the attachment still says `application/octet-stream`) now fails the test.

**2. The suite exited 1 while every test passed.** `AC-1680` and `AC-1686` called `kb.onMaterialWritten()` and discarded the returned `rebuild` promise. That deferred landscape rebuild needs a Node-only `describe` seam miniflare cannot supply, so once the accumulated corpus passed the 1024-char listing budget it rejected with `DescriberNotConfiguredError` as an **unhandled rejection** — `Tests 10 passed`, `EXIT=1`. I routed both through a new `indexOnly()` helper that awaits the index refresh (the half these ACs actually assert) and absorbs the rebuild's rejection narrowly, with the reasoning recorded at the seam rather than by widening `defer` or stubbing a describer, which would falsely imply the map was exercised.

One thing for the review phase, not mine to act on: `tests/test_UAT_FC_BUG-41_markdown_material.test.ts` and `tests/test_UAT_FC_BUG-41_markdown_upload.workers.test.ts` are still on disk and are now superseded by AC-1809/AC-1810. Those are FC orphans for `check_fc_orphans` to rename or delete — note that the `_material` one tests `resolveContentType`/`describeMaterial` as internal callables, so AC-1809's boundary test is the better evidence to keep.

```
UATs generated for story story-6ccaedd5 (plan item 7 of 10)

Story: story-6ccaedd5
Test file(s) created:
  - (none — all 12 ACs were already covered; the story's existing UAT file was
     amended to cover AC-1682's restated claim and to stop the suite exiting 1)

Test file(s) modified:
  - tests/reconciliation-material-ingestion.workers.test.ts

Tests written: 12 (pre-existing 1:1 AC coverage, verified; AC-1682 strengthened)
Tests passed: 12
Tests failed: 0

Verification: 12/12 pass, EXIT=0 for the two story suites; 41/41 pass, EXIT=0
across all six material workers suites run together (no cross-file interference).

test_files_created: []
test_files_modified:
  - "tests/reconciliation-material-ingestion.workers.test.ts"
```
