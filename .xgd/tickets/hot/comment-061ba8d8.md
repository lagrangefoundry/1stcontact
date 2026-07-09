---
uid: comment-061ba8d8
id: COMMENT-76
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-09T22:41:21.880882+00:00'
updated_at: '2026-07-09T22:41:21.880882+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ea911eaf
  kind: note
---

Done. All UATs generated and passing, names follow `test_UAT_AC{N}_*`, no collisions.

```
UATs generated for story story-4f50c054 (plan item 4 of 8)

Story: story-4f50c054
Test file(s) created:
  - tests/reconciliation-req32-layer-treatments.test.ts

Tests written: 5
Tests passed: 5
Tests failed: 0

test_files_created:
  - "tests/reconciliation-req32-layer-treatments.test.ts"
```

**Coverage rationale.** The story carries 11 ACs, but 6 of them — AC-482–AC-487 (the base layer/position/overlay/reflow/raw-CSS contract) — already have passing reconciliation UATs in the pre-existing `tests/reconciliation-req15-layer.test.ts`, which the constraints forbid me from modifying. Writing them again would create duplicate test functions for the same ACs. This story is an `upgrade` (fields show `updated_by: ['bundle-adc60ee8']`); BUNDLE-3 folded the REQ-32 cap-5 art-direction treatments into it, adding the 5 new ACs I covered:

| AC | UAT | Boundary asserted |
|----|-----|-------------------|
| AC-517 | `..._text_children_carry_token_backed_typography` | `renderLayer` token props + `validateSite` strict-rejection with path |
| AC-518 | `..._titled_block_lines_flow_as_one_positioned_block` | one positioned block, per-line typography, fixed `rem` gap in `LAYER_CSS`, `text`/`lines` mutual exclusion |
| AC-519 | `..._image_shadow_and_border_are_token_backed` | `var(--shadow-xl)`/`var(--color-*)` on `<img>`, backfilled `--shadow-xl` via `generateThemeCss`, `none` border, raw-CSS rejection |
| AC-520 | `..._soft_mask_feather_control` | `--fc-feather` emission + `LAYER_CSS` consumption, no-op cases, enum rejection |
| AC-521 | `..._positioning_geometry_reproduces_montages_faithfully` | `transform-origin`, `.fc-motion` sizing, `aspect-ratio:1`, box-sized ellipse mask, underline offset, rotated circle render |

All tests exercise real boundaries (`validateSite`, `renderLayer`, `LAYER_CSS`, `generateThemeCss`); nothing internal is mocked. No runtime code, existing tests, or tickets were modified.
