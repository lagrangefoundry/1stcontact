---
uid: report-44f0ea8e
id: REPORT-12082
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-10T00:30:52.748799+00:00'
updated_at: '2026-11-10T00:30:52.748799+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-4ada51a8
  parent_report_uid: report-e83f68a4
  batch_index: '0'
---

I fixed the AC-2413 UAT, and the whole Marked Points suite (`tests/reconciliation-marked-points.test.ts`) now passes, 13 of 13. Only the test changed; no production code was touched.

**Why it failed:** the error came from the test environment, not from the code. When the builder leaves Edit mode, the panel hands the View frame's document to Marked Points before the mode change turns Marked Points off. So for a moment the overlay installs itself in the View document, then removes itself. A browser handles that fine. In jsdom, though, a frame given a `src` holds a document with no root element (jsdom doesn't load sub-resources), so the overlay's `install()` crashed trying to append to it.

**The fix:** before leaving Edit, the test gives each frame an empty `<html><head><body>` page, which is what a browser frame always has. The rest of the test is unchanged. I also added two checks after switching to View: the View document has no Marked Points mode flag and no overlay. Those checks would fail if leaving Edit stopped turning the mode off, so the test still catches that behaviour.

The AC and story describe what the code does, so they don't need changes. I couldn't run lint or a type-check: ESLint isn't installed in the repository and there's no root `tsconfig.json`. Vitest compiles the file, and that run passed. The change is committed as `809ee44244`.

```yaml
## Assessment
status: fixed
tests:
  - test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click: pass
upstream_changes: none
```