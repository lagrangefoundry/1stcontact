---
uid: report-ea911eaf
id: REPORT-332
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-09T20:49:15.306335+00:00'
updated_at: '2026-07-09T20:49:15.306335+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-4f50c054
---

All six test names conform to the enforced `test_UAT_AC\d+_\w+` pattern, one per acceptance criterion, and all pass.

```
UATs generated for story story-4f50c054 (plan item 4 of 7)

Story: story-4f50c054
Test file(s) created:
  - tests/reconciliation-req15-layer.test.ts

Tests written: 6
Tests passed: 6
Tests failed: 0

test_files_created:
  - "tests/reconciliation-req15-layer.test.ts"
```

**AC → UAT mapping** (one per criterion, asserted at external boundaries — `validateSite`, framework `renderLayer`/`wrapWithLayer` + `LAYER_CSS`, and the `1c` CLI render):

- **AC-482** (`3f701591`) → `test_UAT_AC482_layer_children_render_at_structured_positions` — structured positions validate and emit framework `--fc-*` props; verifies no author-supplied CSS string appears (every style declaration is `--fc-`-prefixed).
- **AC-483** (`bfd94d76`) → `test_UAT_AC483_text_over_image_with_overlay_tint` — image+text+overlay; asserts fixed DOM order content < overlay < stack and the overlay's hex/0.45 opacity.
- **AC-484** (`1eccf6a6`) → `test_UAT_AC484_image_shape_and_edge_treatments` — circle/soft-mask/torn-asset classes plus the matching `LAYER_CSS` rules.
- **AC-485** (`de3f0a8d`) → `test_UAT_AC485_per_breakpoint_overrides_and_reflow` — `--fc-x-md` override emitted; default `reflow: stack` vs `reflow: none`; max-width (static) + min-width media blocks.
- **AC-486** (`507fa6b8`) → `test_UAT_AC486_composite_over_module_and_standalone_section` — composite over host module, no-layer module unchanged, and a full CLI render of the standalone `layer` module producing one positioned stack + rules in `theme.css`.
- **AC-487** (`ecb1101a`) → `test_UAT_AC487_raw_css_or_html_rejected_with_path` — raw `style`/`css`/`html` on instance/child/layer each rejected with a path-pointed error; clean structured site validates.

One self-correction was needed (AC-482 initially omitted the required `y` field on a position — a test bug, since the schema requires x/y/z as the mandatory trio; fixed by supplying `y`). No runtime code or existing tests were modified.
