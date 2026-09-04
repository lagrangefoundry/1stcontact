---
uid: report-1bcc4fce
id: REPORT-3482
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-04T03:46:33.791476+00:00'
updated_at: '2026-09-04T03:46:33.791476+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-0fb17a68
---

```
UATs generated for story story-0fb17a68 (plan item 6 of 15)

Story: story-0fb17a68
Test file(s) created:
  - tests/reconciliation-project-knowledge-freshness.workers.test.ts

Tests written: 9
Tests passed: 4
Tests failed: 5
```

⚠️ **TESTS FAILING — downstream fix-it loop required (one runtime defect, not five test bugs)**

**Failures:**
- `test_UAT_AC1527_a_recorded_document_is_findable_the_moment_the_recording_reports_back`
- `test_UAT_AC1528_the_landscape_rebuild_runs_behind_the_recording_and_a_failed_rebuild_still_records`
- `test_UAT_AC1529_a_conversation_is_reindexed_in_batches_from_a_durable_mark_kept_off_the_conversation`
- `test_UAT_AC1530_conversation_growth_moves_the_index_only_and_leaves_the_published_landscape_untouched`
- `test_UAT_AC1532_the_line_between_listing_and_clustering_is_a_character_budget_not_a_document_count`

All five die on the same throw: `KnowledgeConfigError: knowledge base 'project' reads from source 'project', which this host has no index for (available: none)`.

**Root cause** — `apps/control-app/src/knowledge.ts:337` passes `source: this.index` to the knowledge component's `search`, which now requires `indexes` (a `Map` keyed by the KB's `source` name). `indexFor` has no fallback, so every `ProjectKnowledge.search()` call throws. AC-1532 is caught by the same defect one level down: the clustered path validates access points through `this.search`.

This is a **pre-existing regression on the branch**, not caused by these tests — it already fails 4 tests in the sibling story's landed file `reconciliation-project-knowledge-base.workers.test.ts` and 4 in `test_UAT_FC_REQ-159_project_kb.workers.test.ts`. It is the one call site in the repo.

**I verified the rest of each failing test.** I temporarily applied `indexes: new Map([[PROJECT_KB, this.index]])` at that line, ran the file — **9/9 passed** — then reverted (`git status --short` now shows only the new test file; line 337 reads `source: this.index` again). That pass exposed a genuine bug of my own, since fixed: a `brief` ticket requires `fields.site_slug`. So the five remaining failures are the AC-vs-code divergence, not weak tests, and no assertion after the first throw is unverified guesswork.

**Passing (4):** AC-1531 (complete listing, says so, no emphasis), AC-1533 (titles carry entries, excerpt rescues only the unusable title, untitled entry still listed), AC-1534 (refusal names the seam, size and budget; previous landscape stands), AC-1535 (empty corpus told so in words).

No runtime code, existing tests, or tickets were modified.
