---
uid: report-00ee258b
id: REPORT-506
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-13T20:29:18.020289+00:00'
updated_at: '2026-07-13T20:29:18.020289+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-d70a0264
---

All 7 pass. Each test name matches the required `^test_UAT_AC\d+_\w+$` pattern, with a 1:1 mapping to the story's seven ACs. No runtime code or existing tests were modified.

```
UATs generated for story story-d70a0264 (plan item 4 of 8)

Story: story-d70a0264 — Free-position named hero-segment objects
Test file(s) created:
  - tests/reconciliation-hero-positioning.test.ts

Tests written: 7
Tests passed: 7
Tests failed: 0

test_files_created:
  - "tests/reconciliation-hero-positioning.test.ts"
```

**AC → UAT mapping** (each verified against the existing implementation — Astro SSR render via `renderToString`, no mocks):

| AC | UAT | What it proves |
|----|-----|----------------|
| AC-594 | `test_UAT_AC594_positioned_hero_object_placed_by_band_coordinates` | Positioned heading lifts into `hero__stack` / `hero__slot--positioned`; `--fc-x:8%`, `--fc-y:55%`, `--fc-w:45%`, `--fc-z:2` (unitless), `--fc-rotate:4deg` |
| AC-595 | `test_UAT_AC595_unpositioned_hero_renders_normal_flow_unchanged` | No positions → flowed heading present, no `hero__stack`, no `--fc-` |
| AC-596 | `test_UAT_AC596_mixed_positioned_and_flowed_hero_objects_split_per_object` | Positioned heading on canvas while unpositioned eyebrow stays in flow |
| AC-597 | `test_UAT_AC597_overlay_wordmark_shares_hero_coordinate_space` | Overlay wordmark lifted to `header__logo--positioned` with `--fc-x:6%`/`--fc-y:62%`, text intact, nav still present |
| AC-598 | `test_UAT_AC598_overlay_chrome_spans_full_band_and_pointer_transparent` | `OVERLAY_BAND_CSS` chrome is `inset:0` + `pointer-events:none`, controls re-enable `pointer-events:auto` |
| AC-599 | `test_UAT_AC599_unpositioned_wordmark_stays_in_flow_row_unchanged` | Unpositioned wordmark stays inside `header__inner`, no positioned marker, no `--fc-` |
| AC-600 | `test_UAT_AC600_run_typography_style_and_position_combine_losslessly` | `line-height: 90px;` renders terminated before `--fc-x: 8%;` — the style⇄position join is not fused |

Note: the pre-existing `tests/req52-hero-positioning.test.ts` holds the free-coded `test_UAT_FC_REQ-52_*` originals (which also span other bundle stories — text-block/value-diff); resolving those FC orphans is the downstream reconciliation-review phase's job, not this step.
