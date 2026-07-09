---
uid: acceptance_criterion-66db6924
id: AC-532
type: acceptance_criterion
title: A reference colour marked as inferred never produces a hard colour delta
created_by: xgd
created_at: '2026-07-09T22:59:11.019416+00:00'
updated_at: '2026-07-09T22:59:11.019416+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
When a reference run's colour is flagged as inferred (the capture could not resolve a painted colour and fell back to a black/white sentinel), the diff emits no colour delta against that run even if the actual colour differs. A reference run with a confidently-resolved colour still produces a colour delta when the actual colour differs beyond tolerance.

## Verification
Diff a reference whose run is flagged colour-inferred against a draft with a clearly different colour and assert no colour delta; diff a confidently-coloured reference run against a differing actual colour and assert a colour delta is emitted.
