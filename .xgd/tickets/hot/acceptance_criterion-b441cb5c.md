---
uid: acceptance_criterion-b441cb5c
id: AC-715
type: acceptance_criterion
title: A reference font-fallback (FOUT) artifact does not flag a correct render as
  a defect
created_by: xgd
created_at: '2026-07-22T20:17:47.496315+00:00'
updated_at: '2026-07-23T11:45:20.301466+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
When the reference side shows a font fallback (`fontLoaded:false`, a capture-side FOUT artifact) but the reproduction resolved the intended face (matching family / size / weight), `values-diff` emits **no** fontLoad delta — the correct render is not flagged as a defect. Only the forward direction — the reproduction itself fell back to a non-intended face — is reported as a defect.

## Verification
Run the diff with the reference marked `fontLoaded:false` and the reproduction rendering the intended face; assert no fontLoad delta is emitted. Run the mirror case (reproduction fell back) and assert the fontLoad defect is still reported.