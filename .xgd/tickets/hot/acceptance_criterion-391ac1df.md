---
uid: acceptance_criterion-391ac1df
id: AC-617
type: acceptance_criterion
title: Setting the theme subscale to the reference closes the systemic badge and checklist
  gap
created_by: xgd
created_at: '2026-07-13T20:49:43.934878+00:00'
updated_at: '2026-07-13T20:57:03.242184+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-bb049a62
  kind: behavior
  regression_only: false
---

## Criterion
Given a reproduction whose badge and checklist type differ systemically from a reference, setting the reproduction's theme `badge` and `checklist` subscales to the reference's captured subscale values makes the fidelity value-diff report no residual badge/checklist subscale finding and no residual per-element badge/checklist type deltas for those axes — the systemic gap is closed once at the theme rather than per instance.

## Verification
Capture the reference subscales, apply them as the reproduction's theme subscales, re-run the value-diff, and confirm no badge/checklist subscale finding and no explained per-element type deltas remain.