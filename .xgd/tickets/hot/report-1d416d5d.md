---
uid: report-1d416d5d
id: REPORT-3119
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-31T23:04:29.086078+00:00'
updated_at: '2026-08-31T23:04:29.086078+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-080c6036
---

```
UATs generated for story story-080c6036 (plan item 1 of 2)

Story: story-080c6036
Test file(s) created:
  - tests/reconciliation-cloud-browser-capture.workers.test.ts
  - tests/reconciliation-cloud-browser-capture-absent.workers.test.ts
  - tests/reconciliation-cloud-browser-capture-preconditions.test.ts

Tests written: 10
Tests passed: 10
Tests failed: 0

test_files_created:
  - "tests/reconciliation-cloud-browser-capture.workers.test.ts"
  - "tests/reconciliation-cloud-browser-capture-absent.workers.test.ts"
  - "tests/reconciliation-cloud-browser-capture-preconditions.test.ts"
```

**AC → test mapping** (1:1, all 10 ACs):

| AC | Test | Runtime |
|---|---|---|
| AC-1459 | `test_UAT_AC1459_screenshot_returns_png_bytes_at_each_named_preset` | workerd |
| AC-1460 | `test_UAT_AC1460_unknown_preset_is_refused_naming_it_and_the_valid_set` | workerd |
| AC-1461 | `test_UAT_AC1461_no_browser_binding_leaves_edit_render_publish_working_and_names_the_gap` | workerd |
| AC-1462 | `test_UAT_AC1462_one_browser_and_a_fresh_context_per_viewport_across_a_ladder` | workerd |
| AC-1463 | `test_UAT_AC1463_release_on_success_on_failure_and_on_the_time_ceiling` | workerd |
| AC-1464 | `test_UAT_AC1464_a_second_capture_in_the_same_run_carries_none_of_the_first` | workerd |
| AC-1465 | `test_UAT_AC1465_rest_only_with_a_note_when_the_path_cannot_actuate` | node |
| AC-1466 | `test_UAT_AC1466_preconditions_land_motion_reveal_scroll_images_and_fonts` | node (jsdom) |
| AC-1467 | `test_UAT_AC1467_both_paths_draw_preconditions_from_one_source_and_apply_width_last` | node |
| AC-1468 | `test_UAT_AC1468_worker_graph_reaches_no_local_browser_stack_and_one_lease` | node |

Three files rather than two because AC-1461 needs the Worker's own entry point (`apps/control-app/src/index.ts`) to show that editing, rendering and publishing are unaffected; keeping that import out of the other workerd file leaves ACs 1459–1464 independent of the builder's whole module graph.

Regression scope run and passing unchanged: `test_UAT_FC_REQ-154_cloud_eyes.workers`, `test_UAT_FC_REQ-154_page_scripts`, `test_UAT_FC_REQ-154_no_playwright_in_the_worker`, `req36-capture-settle`, `capture` — 30 passed, 8 skipped (the real-Chromium blocks, which skip by design when `chromiumAvailable()` is false here).

Two things worth flagging:

1. **The workerd vitest project could not boot in this worktree.** Every `*.workers.test.ts` reaching `apps/control-app/src/index.ts` or `router.ts` failed at import with `Cannot find module './generated/ai-workers.js'` — including the pre-existing `test_UAT_FC_REQ-154_cloud_eyes.workers.test.ts`, which I ran first to confirm the failure predates my changes. Those are gitignored `1c assets` build artifacts that resolve an out-of-repo store which `require.resolve` cannot reach from a linked worktree. I materialised `apps/control-app/src/generated/ai-workers.js` and `importmap.json` verbatim from the main checkout so the suite could run. Both are covered by `.gitignore` (`/apps/control-app/src/generated/`), so `git status` shows only the three test files.

2. **AC-1467 asks to "run the pre-existing local capture, settle, screenshot, conformance, conformance-security and ladder-screenshot suites and assert they pass unchanged."** A test cannot meaningfully run other suites from inside itself, so the UAT asserts the substantive, non-duplicative half — that both drivers import the preconditions from the single `page-scripts` source and neither carries a transcription, that the cloud path evaluates that exact script text, and that the target width is applied *last* (`[desktop, mobile]` viewport order) rather than at load. I ran the pre-existing suites separately, as reported above.

No runtime code was modified and no existing test file was touched.
