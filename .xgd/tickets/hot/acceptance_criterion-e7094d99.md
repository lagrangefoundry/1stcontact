---
uid: acceptance_criterion-e7094d99
id: AC-614
type: acceptance_criterion
title: Capture reads component subscales from a reference page's own semantics
created_by: xgd
created_at: '2026-07-13T20:49:19.974546+00:00'
updated_at: '2026-07-13T20:57:03.537239+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-bb049a62
  kind: behavior
  regression_only: false
---

## Criterion
Capturing a reference page yields theme-level subscales built from the page's own semantics — the `checklist` subscale from the page's list-item elements, the `badge` subscale from small, short-text, strongly-rounded pill runs (interactive pills / CTAs excluded). A subscale is emitted only when its cohort has at least two like members, and its value is the modal (most common) value per axis across that cohort, in px. A cohort of fewer than two members (a one-off element) yields no subscale for that name. Ordinary body prose is not aggregated into either subscale.

## Verification
Capture a synthetic page whose badges and checklist each form a ≥2-member ramp and confirm the captured badge/checklist subscales equal the ramp's modal per-axis values; capture a page with a single lone pill and confirm no badge subscale is produced.