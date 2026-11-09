---
uid: report-e1e6a0a8
id: REPORT-11979
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T18:12:00.213191+00:00'
updated_at: '2026-11-09T18:12:00.213191+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-6ccaedd5
  parent_report_uid: report-b47373ae
  batch_index: '1'
---

I fixed `apps/control-app/wrangler.toml`, the one file the exception allowed. `test_UAT_AC2537_…` now passes, and so does every other test in the batch's scope.

**What was wrong:** the REQ-222 change added a second `[images]` table at the top level and a second `[env.production.images]` table, instead of merging into the ones REQ-219/REQ-221 already declared. TOML doesn't allow the same table twice, so wrangler would have refused the file at deploy. AC-2537's test reads the file with a real TOML parser, which is why it caught this.

**Change:**
- **Top level:** I removed the second `[images]` table and moved its reasoning (from REQ-222) into the comment on the remaining one:
  - why the publish step uses the binding to build image widths;
  - why a missing binding there means a publish without `srcset` rather than a refusal;
  - why resized copies are content-addressed and cached under `derived/<tenant>/`, outside `sites/`.

  I also added a note that each environment declares the table once, shared by the HEIC converter and the width ladder.
- **Production:** I removed the second `[env.production.images]` table and extended the remaining block's citation to `(REQ-219, [[REQ-221]], [[REQ-222]])`.
- The binding name is still `IMAGES` on both sides. No other table changed.

**Tests:**
- `reconciliation-ingestion-images-binding.test.ts` (AC-2537), `test_UAT_FC_REQ-219_an_edit_is_a_recipe.test.ts` and `reconciliation-material-blob-storage.test.ts`: 3 files, 36 tests passed.
- `reconciliation-ingestion-heic-door.workers.test.ts` (AC-2534/2535/2536): 4 tests passed.
- Wrangler printed an EPERM error trying to write its debug log under `~/Library/Preferences`. The sandbox blocks that path; it didn't affect any result.

I changed no test, AC or story, because the test was right and only the config was wrong.

```yaml
## Assessment
status: fixed
files_changed:
  - apps/control-app/wrangler.toml
tests:
  - test_UAT_AC2537_the_images_binding_is_declared_once_under_the_same_name_locally_and_in_production: passed
upstream_changes: none
```