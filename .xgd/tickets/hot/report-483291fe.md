---
uid: report-483291fe
id: REPORT-11323
type: report
title: 'Report: mode_override for story-39c992d3'
created_by: xgd
created_at: '2026-11-08T06:57:36.645080+00:00'
updated_at: '2026-11-08T06:57:36.645080+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: story-39c992d3
  anchor_ticket: bundle-c0301347
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-a313553e
  quality_mode: reconcile
  justification: REQ-208 is in scope and requires that no error sentence the model
    sees names the image vendor. AC-2380 covers the unsupported-shape path. The code
    leaks 'openai' there, so the test is right and imagegen.ts must scrub the vendor
    from the error text.
  files:
  - apps/control-app/src/imagegen.ts
  rung: 1
  tip_evidence:
  - file: apps/control-app/src/imagegen.ts
    lines: 27-32
  - file: apps/control-app/src/imagegen.ts
    lines: 677-720
  external_cause: null
  planner_trust_boundary: false
  granted_head: 994c842a380878694aa546ed798df44bb0d8b197
---

# Mode override granted: code_frozen

REQ-208 is in scope and requires that no error sentence the model sees names the image vendor. AC-2380 covers the unsupported-shape path. The code leaks 'openai' there, so the test is right and imagegen.ts must scrub the vendor from the error text.

Planner instructions for the batch:

Production code is unfrozen for apps/control-app/src/imagegen.ts only (override below). The unsupported-shape (21:9) tool result names the vendor through the plugin's 'The host reports: Backend "openai" ...' detail. No other path leaks. In imagegen.ts, where imageSurface() composes the create_image plugin (next to the existing meteredDraws wrapper), make every tool error the model reads vendor-free: no IMAGE_PROVIDER and no backend model id. Keep the declared sentence 'That is not a shape this generator offers' and keep the list of supported ratios, because the shape ACs depend on them. Do not edit the generated ai-imagegen.js, which is gitignored and rebuilt. Do not edit the framework plugin either, because it is outside the override. Do not change AC-2380 or its test. All sibling AC tests and the REQ-208 FC tests must stay green.
