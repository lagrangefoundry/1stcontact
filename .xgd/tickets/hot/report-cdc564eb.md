---
uid: report-cdc564eb
id: REPORT-336
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-09T20:58:53.028244+00:00'
updated_at: '2026-07-09T20:58:53.028244+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-b13e15c5
---

All 7 test names match the enforced `test_UAT_AC\d+_\w+` pattern. The root has no flat ESLint config (the quality harness lints per source-dir with its own config; my file lives in `tests/`, which follows the same conventions as the sibling reconciliation tests). Tests pass.

Here is the completion report.

```
UATs generated for story story-b13e15c5 (plan item 5 of 7)

Story: story-b13e15c5
Test file(s) created:
  - tests/reconciliation-req16-motion.test.ts

Tests written: 7
Tests passed: 7
Tests failed: 0

test_files_created:
  - "tests/reconciliation-req16-motion.test.ts"
```

**AC → UAT mapping** (one test per AC, all passing against existing code):

| AC | Test | Boundary asserted |
|----|------|-------------------|
| AC-488 | `test_UAT_AC488_well_formed_motion_validates_and_round_trips` | `validateSite` — motion on instance + layer child validates and round-trips unchanged (`toEqual`) |
| AC-489 | `test_UAT_AC489_malformed_or_raw_css_motion_rejected_with_path` | `validateSite` — cubic-bezier easing, bad type/trigger, negative/non-integer ms, and a smuggled raw-CSS key all rejected with a path under `/…/motion` |
| AC-490 | `test_UAT_AC490_load_motion_renders_framework_computed_animation` | `1c` render — load wrapper, keyframes + binding in `theme.css`, params only as `--fc-motion-*` custom props (no raw instance CSS) |
| AC-491 | `test_UAT_AC491_scroll_reveal_script_shipped_once_only_when_needed` | `1c` render — exactly one island + reveal marker when a layer child has scroll motion; none when only load motion |
| AC-492 | `test_UAT_AC492_stagger_sequences_children_with_increasing_delays` | `1c` render — parses per-child `nth-child` delay rules, asserts monotonic increase |
| AC-493 | `test_UAT_AC493_reduced_motion_disables_all_and_reveals_scroll_content` | `1c` render — four motions present; reduced-motion block neutralises animation/transition and forces scroll content visible |
| AC-494 | `test_UAT_AC494_layer_child_motion_preserves_positioning` | `renderLayer` — positioned child retains `--fc-x/y/rotate/w`; motion wraps the inner `<img>`, not the positioned element |

Nothing internal was mocked (only the filesystem is isolated to a temp dir), no runtime code was touched, and no existing tests were modified.
