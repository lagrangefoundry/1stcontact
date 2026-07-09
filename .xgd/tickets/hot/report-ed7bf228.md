---
uid: report-ed7bf228
id: REPORT-378
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-09T23:19:20.438676+00:00'
updated_at: '2026-07-09T23:19:20.438676+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-1570884a
---

All 9 UATs pass — one per acceptance criterion, correctly named `test_UAT_AC{N}_*` (AC-536 through AC-544), matching the enforced `^test_UAT_AC\d+_\w+$` pattern. AC-536 genuinely exercised the render→serve→shoot seam via an injected fake driver returning a real PNG.

A note on **AC-539**: the AC text says "block-averaged mean diff is strictly lower than the raw per-pixel mean diff." An unweighted block-average mean is mathematically *equal* to the pixel mean for an even tiling, so that literal reading can't hold. The genuine, code-realized de-noise property is `blockPctOverThreshold < pctOverThreshold` (thresholding *after* averaging suppresses thin registration edges) — this is what the existing FC test proves and what the code actually implements. I asserted the concrete, code-true form of the AC's jitter-suppression claim rather than a literal-but-false mean comparison.

```
UATs generated for story story-1570884a (plan item 7 of 8)

Story: story-1570884a
Test file(s) created:
  - tests/reconciliation-perceptual-diff.test.ts

Tests written: 9
Tests passed: 9
Tests failed: 0

test_files_created:
  - "tests/reconciliation-perceptual-diff.test.ts"
```

AC → UAT mapping:
- **AC-536** → `test_UAT_AC536_diff_shoots_draft_and_emits_artifacts` — slug render/serve/shoot (injected driver), bundle-dir vs bare-PNG `--ref`, missing-`--ref` usage error
- **AC-537** → `test_UAT_AC537_offline_actual_skips_the_browser` — throwing driver factory proves `--actual` short-circuits the browser
- **AC-538** → `test_UAT_AC538_mismatched_dims_cropped_to_common_rectangle` — `dims` = per-axis minimum, no error
- **AC-539** → `test_UAT_AC539_emits_per_pixel_and_block_averaged_heatmaps` — both heatmaps at cropped dims + de-noise property
- **AC-540** → `test_UAT_AC540_summary_reports_mean_pct_and_band_profile` — mean/pct/region-count/band profile in human output
- **AC-541** → `test_UAT_AC541_regions_by_connected_components_scored_by_summed_diff` — connected-components, summed-diff ranking, region shape, top-level report fields
- **AC-542** → `test_UAT_AC542_writes_ref_ours_diff_crop_triptych_per_region` — crops exist at bbox dims, `crops:{ref,actual,diff}`
- **AC-543** → `test_UAT_AC543_exit_code_and_json_reflect_regions` — non-zero/zero exit + `--json` report object
- **AC-544** → `test_UAT_AC544_crop_extracts_bounds_clamped_box` — in-bounds, clamped, malformed/missing `--box` errors

No runtime code, existing tests, or tickets were modified. I did not commit — the outer reconcile workflow manages that.
