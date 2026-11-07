---
uid: report-0f17bc9b
id: REPORT-11187
type: report
title: 'Report: override_misjudged for bundle-7988e925'
created_by: xgd
created_at: '2026-11-07T22:28:23.907822+00:00'
updated_at: '2026-11-07T22:28:23.907822+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: override_misjudged
  subject_uid: bundle-7988e925
  anchor_uid: bundle-7988e925
  review_kind: reconciliation_review
  by_rule:
    code_frozen: 5
  denied:
  - subject_uid: story-e0ca0a36
    batch_index: '0'
    rule: code_frozen
---

override_misjudged: the review judged a planner-granted mode override wrong. The fix step works from the finding below.

- rule `code_frozen`, override report report-de676490 (files: ['db/migrations/0001_baseline.sql', 'db/migrations/0002_session_rotation.sql']): item 6: db/migrations/0002_session_rotation.sql adds behaviour (converging an already-deployed old-shape sessions table) that no AC or intent in scope demands; copied verbatim from out-of-window reference commit 59f8754161 (REQ-231)
  Rule `code_frozen` is now denied for batch 0 of story-e0ca0a36; it will not be granted again there, so the next plan decides that batch at the next rung.

Misjudged overrides by rule: {'code_frozen': 5}.