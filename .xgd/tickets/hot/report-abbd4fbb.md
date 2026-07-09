---
uid: report-abbd4fbb
id: REPORT-328
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-09T20:40:06.175298+00:00'
updated_at: '2026-07-09T20:40:06.175298+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-6af935e7
---

All 7 UATs pass. Each test name matches the enforced `^test_UAT_AC\d+_\w+$` pattern, with one test per acceptance criterion.

```
UATs generated for story story-6af935e7 (plan item 3 of 7)

Story: story-6af935e7
Test file(s) created:
  - tests/reconciliation-req14-background.test.ts

Tests written: 7
Tests passed: 7
Tests failed: 0

test_files_created:
  - "tests/reconciliation-req14-background.test.ts"
```

**AC → test mapping** (1:1, all passing against existing code):

| AC | Test | Boundary |
|----|------|----------|
| AC-475 | `test_UAT_AC475_module_accepts_color_image_or_gradient_background` | `validateSite` — three kinds validate; wrong-shape-for-type rejected |
| AC-476 | `test_UAT_AC476_background_may_carry_optional_overlay` | `validateSite` — overlay present and absent both valid |
| AC-477 | `test_UAT_AC477_malformed_background_rejected_with_field_path` | `validateSite` — error paths `.../overlay/color`, `.../overlay/opacity` |
| AC-478 | `test_UAT_AC478_image_background_renders_three_stacked_layers` | framework `wrapWithBackground` over real Hero SSR — layer/overlay/content order + opacity |
| AC-479 | `test_UAT_AC479_color_and_gradient_render_fill_no_overlay_when_none` | framework `renderBackgroundLayers` — fills present, no overlay layer |
| AC-480 | `test_UAT_AC480_background_is_section_scoped` | full `1c` render — exactly one wrapper, value present |
| AC-481 | `test_UAT_AC481_structural_layer_css_in_stylesheet` | full `1c` render — `.fc-bg-section__content` layering rule in `theme.css` |

No runtime code was modified and no existing tests were touched — only the new reconciliation test file was created. Render/schema boundaries are exercised with no internal mocking (only the filesystem is isolated to a temp dir).
