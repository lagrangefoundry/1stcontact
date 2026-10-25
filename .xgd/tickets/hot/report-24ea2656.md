---
uid: report-24ea2656
id: REPORT-6722
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:33:33.555884+00:00'
updated_at: '2026-10-25T23:33:33.555884+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

Commit being applied: 8d93d32d8b "Merge branch 'free-BUG-47' into xgd-working". All five conflicts were DU (deleted on HEAD, modified by incoming). Rule 2a (legitimate refactor, incoming modification obsolete) applied: `git rm`. Every incoming edit was the BUG-47 field rename `site_slug` -> `placed_on` in fixtures, assertions and comments.

- tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts — DU / UAT test — 2a, kept the deletion. HEAD deleted it in 6f83befde4 (fix_reconciliation_review, xgd-kind reconcile, intent bundle-8e1807f6, 2026-09-14), which also falls under the enrichment's "more recent by timestamp" rule (incoming 2026-09-02). BUG-42 coverage lives in tests/reconciliation-builder-markdown-readiness.test.ts.
- tests/test_UAT_FC_REQ-159_project_kb.workers.test.ts — DU / UAT test — 2a, kept the deletion.
- tests/test_UAT_FC_REQ-159_project_kb_config.test.ts — DU / UAT test — 2a, kept the deletion.
- tests/test_UAT_FC_REQ-161_library_tab.test.ts — DU / UAT test — 2a, kept the deletion.
- tests/test_UAT_FC_REQ-161_material_surface.workers.test.ts — DU / UAT test — 2a, kept the deletion.

Why the REQ-159/161 deletions are legitimate: these files never existed on this lineage. The REQ-161 pick (a6d1b6b7bd, from 855dd57a7c) carried 0 test files, although the original added test_UAT_FC_REQ-161_library_tab and _upload_overlay. The REQ-159 merge (936c9edc1b) likewise carried none. Reconcile then generated replacement suites: reconciliation-library-tab.test.ts, reconciliation-library-surface.workers.test.ts, reconciliation-library-reader.test.ts and reconciliation-client-knowledge-base.workers.test.ts (a639aeafd9, 9f29b00452, 5360513663). Neither the code under test nor its features were removed; only the free-coded test files were superseded.

## Incoming changes preserved

All non-conflicting incoming changes are staged unchanged: api.js, library.js, material.ts, router.ts, tickets.ts, package.json, the REQ-172 test edit, and the new tests test_UAT_FC_BUG-47_library_agrees.test.ts and test_UAT_FC_BUG-47_placement.workers.test.ts.

Hunks dropped under BUG-1301 PRECEDENCE: the `site_slug` -> `placed_on` edits to the five files above. Their only target was test files that HEAD had already deliberately superseded (see above). The rename itself is preserved in source (material.ts, library.js etc.) and in the new BUG-47 tests.

FLAG FOR POST-MERGE REVIEW: the replacement reconciliation suites still reference `site_slug` and will likely need the same `placed_on` rename after this commit lands: reconciliation-library-tab, reconciliation-library-surface.workers, reconciliation-library-reader, reconciliation-builder-markdown-readiness, reconciliation-material-types.workers, reconciliation-client-knowledge-base.workers. Some hits may be a site's own slug rather than the material field. These were not edited, since they are outside the conflict set. No tests were run.
