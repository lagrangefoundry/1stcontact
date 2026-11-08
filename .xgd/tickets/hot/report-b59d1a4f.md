---
uid: report-b59d1a4f
id: REPORT-11524
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T17:14:40.742622+00:00'
updated_at: '2026-11-08T17:14:40.742622+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-49607926
  parent_report_uid: report-2a00f57b
  batch_index: '0'
---

All three tests in this batch now pass, including when run in the same batch as the suites that build assets. I edited only the three test files the planner named; no production code, assertion, AC or story changed.

**What changed:**
1. **AC-2418** (`tests/reconciliation-marked-points.test.ts`): the hover-title check read `controller.list()` after `controller.expand()` had already marked every point sent, and the list returns only unsent points, so it came back empty. I moved that check to just before `expand()`, so it sees the dragged point while it is still live. It still compares the hover title with `formatMarkedPoint(moved)` and checks the asset, SVG coordinates and node-relative coordinates. The expansion checks and the "a sent mark cannot be dragged" step still run after `expand()`, unchanged. This matches REQ-210's "points clear on send".
2. **AC-960 and AC-961** (the `walk()` helpers in `tests/reconciliation-builder-workspace-chrome.test.ts` and `tests/reconciliation-builder-workspace-origin.test.ts`): both scans now also skip any folder whose name starts with `dist-assets.`. Those are the `.staging` and `.retired` folders that BUG-71's stage-then-swap build fills while a parallel test runs `1c assets`. I extended the existing build-output comment to say why. Nothing else that was scanned before is skipped now.

**Verification:**
- In the same run as `reconciliation-marked-points-served-modules.test.ts`, which builds assets, AC-2418, AC-960, AC-961, AC-977 and AC-2421 all pass (6 tests, 4 files).
- In an earlier combined run, the BUG-71 suite passed on its own.
- When the BUG-71 suite runs at the same time as other asset builds, its setup fails (`ENOTEMPTY` on `dist-assets.staging`, or "12 file(s) that were not built"). This isn't one of the batch's failures. Each `1c assets` run writes into the same staging folder, so concurrent runs clash. The planner flagged this as a separate problem, and fixing it would mean changing other suites, which is outside this batch.

```yaml
## Assessment
status: fixed
tests:
  - test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends: fixed (verified)
  - test_UAT_AC960_the_site_surface_name_has_exactly_one_definition_site: fixed (verified alongside asset-building suites)
  - test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo: fixed (verified alongside asset-building suites)
files_changed:
  - tests/reconciliation-marked-points.test.ts
  - tests/reconciliation-builder-workspace-chrome.test.ts
  - tests/reconciliation-builder-workspace-origin.test.ts
upstream_changes: none
notes: "BUG-71 suite setup can fail when another 1c assets build runs at the same time, because they share dist-assets.staging. Out of batch scope; the planner already flagged it."
```